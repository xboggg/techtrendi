#!/usr/bin/env python3
"""
TechTrendi Phone Comparison API - Compare phone specs via GSMArena scraping + Groq fallback
Port: 5116
Endpoint: POST /api/compare-phones
Auth: Bearer token (Supabase service_role key)

Body JSON:
  {
    "phone1": "iPhone 15 Pro Max",
    "phone2": "Samsung Galaxy S24 Ultra"
  }

systemd service: /etc/systemd/system/techtrendi-phone-api.service
"""
import os
import sys
import json
import time
import re
import logging
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import quote_plus
from threading import Lock

try:
    from dotenv import load_dotenv
    load_dotenv("/opt/tech-news/.env")
    load_dotenv("/opt/supabase/docker/.env", override=False)
except ImportError:
    pass

import requests
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("phone-compare")

SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
PORT = 5116

# ── In-memory cache (phone_name_lower -> {data, timestamp}) ──────────────
_cache: dict = {}
_cache_lock = Lock()
CACHE_TTL = 86400  # 24 hours

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ── Spec category mapping (GSMArena heading → our key) ───────────────────
CATEGORY_MAP = {
    "network": "network",
    "launch": "launch",
    "body": "body",
    "display": "display",
    "platform": "platform",
    "memory": "memory",
    "main camera": "main_camera",
    "selfie camera": "selfie_camera",
    "sound": "sound",
    "comms": "comms",
    "features": "features",
    "battery": "battery",
    "misc": "misc",
    # Some pages use slightly different headings
    "sensors": "features",
    "communications": "comms",
}

# Spec field key normalisation
def _norm_key(text: str) -> str:
    """Normalise a spec label to a snake_case key."""
    text = text.lower().strip().rstrip(":")
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


# ═══════════════════════════════════════════════════════════════════════════
# GSMArena scraping
# ═══════════════════════════════════════════════════════════════════════════

def _gsmarena_search(phone_name: str) -> str | None:
    """Search GSMArena and return the spec-page URL or None."""
    url = f"https://www.gsmarena.com/results.php3?sQuickSearch=yes&sName={quote_plus(phone_name)}"
    log.info("GSMArena search: %s", url)
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code == 429:
            log.warning("GSMArena rate-limited on search")
            return None
        resp.raise_for_status()
    except Exception as exc:
        log.warning("GSMArena search failed: %s", exc)
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Results are in <div class="makers"> <ul> <li> <a href="...">
    makers = soup.find("div", class_="makers")
    if not makers:
        log.warning("No makers div found in search results")
        return None

    links = makers.find_all("a", href=True)
    if not links:
        log.warning("No phone links in search results")
        return None

    # Pick first result
    href = links[0]["href"]
    if not href.startswith("http"):
        href = f"https://www.gsmarena.com/{href}"
    log.info("GSMArena spec page: %s", href)
    return href


def _gsmarena_scrape_specs(spec_url: str) -> dict | None:
    """Scrape a GSMArena spec page. Returns {name, image, specs} or None."""
    try:
        resp = requests.get(spec_url, headers=HEADERS, timeout=15)
        if resp.status_code == 429:
            log.warning("GSMArena rate-limited on spec page")
            return None
        resp.raise_for_status()
    except Exception as exc:
        log.warning("GSMArena spec scrape failed: %s", exc)
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Phone name
    name_tag = soup.find("h1", class_="specs-phone-name-title")
    name = name_tag.get_text(strip=True) if name_tag else ""

    # Phone image
    image = ""
    img_div = soup.find("div", class_="specs-photo-main")
    if img_div:
        img_tag = img_div.find("img")
        if img_tag and img_tag.get("src"):
            image = img_tag["src"]

    # ── Parse spec tables ────────────────────────────────────────────────
    specs: dict = {}
    current_category = None

    # GSMArena uses <table> elements; each spec category starts with a
    # <th> that spans the full row (the category heading), followed by
    # <tr> rows whose first <td class="ttl"> is the label and second
    # <td class="nfo"> is the value.
    spec_tables = soup.find_all("table")
    for table in spec_tables:
        rows = table.find_all("tr")
        for row in rows:
            th = row.find("th")
            if th:
                heading = th.get_text(strip=True).lower()
                cat_key = CATEGORY_MAP.get(heading, _norm_key(heading))
                current_category = cat_key
                if current_category not in specs:
                    specs[current_category] = {}
                continue

            tds = row.find_all("td")
            if len(tds) >= 2 and current_category:
                label_td = tds[0]
                value_td = tds[1]
                label = label_td.get_text(strip=True)
                # Preserve line breaks as commas for multi-line values
                value = value_td.get_text(separator=", ", strip=True)
                if label:
                    key = _norm_key(label)
                    specs[current_category][key] = value

    if not specs:
        log.warning("No specs parsed from page")
        return None

    return {"name": name, "image": image, "specs": specs, "source": "gsmarena"}


def fetch_from_gsmarena(phone_name: str) -> dict | None:
    """Full GSMArena pipeline: search → scrape."""
    spec_url = _gsmarena_search(phone_name)
    if not spec_url:
        return None
    # Small delay to be polite
    time.sleep(1)
    return _gsmarena_scrape_specs(spec_url)


# ═══════════════════════════════════════════════════════════════════════════
# Groq fallback
# ═══════════════════════════════════════════════════════════════════════════

GROQ_SPEC_PROMPT = """\
You are a phone specs database. Return ONLY valid JSON (no markdown fences, no explanation) \
with the detailed specifications for "{phone_name}" in this exact structure:

{{
  "name": "{phone_name}",
  "image": "",
  "specs": {{
    "network": {{ "technology": "..." }},
    "launch": {{ "announced": "...", "status": "..." }},
    "body": {{ "dimensions": "...", "weight": "...", "build": "...", "sim": "..." }},
    "display": {{ "type": "...", "size": "...", "resolution": "...", "protection": "..." }},
    "platform": {{ "os": "...", "chipset": "...", "cpu": "...", "gpu": "..." }},
    "memory": {{ "card_slot": "...", "internal": "...", "ram": "..." }},
    "main_camera": {{ "specs": "...", "features": "...", "video": "..." }},
    "selfie_camera": {{ "specs": "...", "features": "...", "video": "..." }},
    "sound": {{ "loudspeaker": "...", "jack": "..." }},
    "comms": {{ "wlan": "...", "bluetooth": "...", "nfc": "...", "usb": "..." }},
    "features": {{ "sensors": "..." }},
    "battery": {{ "type": "...", "charging": "..." }},
    "misc": {{ "colors": "...", "price": "..." }}
  }}
}}

Fill every field with accurate data. If unknown, use "N/A".\
"""


def fetch_from_groq(phone_name: str) -> dict | None:
    """Ask Groq LLM for phone specs as structured JSON."""
    if not GROQ_API_KEY:
        log.error("GROQ_API_KEY not set — cannot use Groq fallback")
        return None

    log.info("Groq fallback for: %s", phone_name)
    prompt = GROQ_SPEC_PROMPT.replace("{phone_name}", phone_name)

    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens": 2048,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()

        # Strip markdown fences if present
        if content.startswith("```"):
            content = re.sub(r"^```[a-z]*\n?", "", content)
            content = re.sub(r"\n?```$", "", content)

        result = json.loads(content)
        result["source"] = "groq"
        if "image" not in result:
            result["image"] = ""
        return result

    except Exception as exc:
        log.error("Groq fallback failed: %s", exc)
        return None


# ═══════════════════════════════════════════════════════════════════════════
# Combined fetch with caching
# ═══════════════════════════════════════════════════════════════════════════

def fetch_phone_specs(phone_name: str) -> dict:
    """Fetch specs: cache → GSMArena → Groq. Always returns a dict."""
    cache_key = phone_name.strip().lower()

    with _cache_lock:
        cached = _cache.get(cache_key)
        if cached and (time.time() - cached["ts"]) < CACHE_TTL:
            log.info("Cache hit for: %s", phone_name)
            return cached["data"]

    # Step 1: GSMArena
    result = fetch_from_gsmarena(phone_name)

    # Step 2: Groq fallback
    if not result:
        result = fetch_from_groq(phone_name)

    if not result:
        return {
            "name": phone_name,
            "image": "",
            "specs": {},
            "source": "none",
            "error": "Could not retrieve specs from any source",
        }

    # Cache it
    with _cache_lock:
        _cache[cache_key] = {"data": result, "ts": time.time()}

    return result


# ═══════════════════════════════════════════════════════════════════════════
# HTTP Server
# ═══════════════════════════════════════════════════════════════════════════

class PhoneCompareHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        log.info(fmt, *args)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")

    def _send_json(self, code: int, data: dict):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_POST(self):
        if self.path != "/api/compare-phones":
            self._send_json(404, {"error": "Not found"})
            return

        # Auth
        auth = self.headers.get("Authorization", "")
        token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
        if not SERVICE_KEY or token != SERVICE_KEY:
            self._send_json(401, {"error": "Unauthorized"})
            return

        # Read body
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length > 0 else {}
        except Exception:
            self._send_json(400, {"error": "Invalid JSON body"})
            return

        phone1_name = body.get("phone1", "").strip()
        phone2_name = body.get("phone2", "").strip()

        if not phone1_name or not phone2_name:
            self._send_json(400, {"error": "Both 'phone1' and 'phone2' are required"})
            return

        log.info("Comparing: %s vs %s", phone1_name, phone2_name)

        try:
            phone1_data = fetch_phone_specs(phone1_name)
            # Small delay between phones to avoid rate limiting
            time.sleep(1.5)
            phone2_data = fetch_phone_specs(phone2_name)

            self._send_json(200, {
                "phone1": phone1_data,
                "phone2": phone2_data,
            })
        except Exception as exc:
            log.error("Error comparing phones: %s\n%s", exc, traceback.format_exc())
            self._send_json(500, {"error": f"Internal error: {exc}"})

    def do_GET(self):
        """Health check."""
        if self.path == "/health":
            self._send_json(200, {
                "status": "ok",
                "service": "phone-compare-api",
                "port": PORT,
                "cache_size": len(_cache),
            })
            return
        self._send_json(404, {"error": "Not found. Use POST /api/compare-phones"})


def main():
    if not SERVICE_KEY:
        log.warning("SUPABASE_SERVICE_ROLE_KEY not set — all requests will be rejected")
    if not GROQ_API_KEY:
        log.warning("GROQ_API_KEY not set — Groq fallback will be unavailable")

    server = HTTPServer(("0.0.0.0", PORT), PhoneCompareHandler)
    log.info("Phone Compare API listening on port %d", PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log.info("Shutting down")
        server.server_close()


if __name__ == "__main__":
    main()
