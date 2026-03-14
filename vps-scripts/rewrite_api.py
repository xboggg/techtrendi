#!/usr/bin/env python3
"""
TechTrendi Rewrite API - HTTP endpoint for URL-based content rewriting
Port: 5115
Endpoint: POST /rewrite-from-url
Auth: Bearer token (Supabase service_role key)

Body JSON:
  {
    "content_type": "article" | "review" | "guide" | "news",
    "category": "Security",
    "urls": ["https://url1.com", "https://url2.com"]
  }

systemd service: /etc/systemd/system/techtrendi-rewrite-api.service
"""
import os, sys, json
from http.server import HTTPServer, BaseHTTPRequestHandler
from dotenv import load_dotenv

load_dotenv("/opt/tech-news/.env")

sys.path.insert(0, "/opt/tech-news")
from generate_from_url import rewrite_from_urls, ARTICLE_CATEGORIES, REVIEW_CATEGORIES, NEWS_CATEGORIES

SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


class RewriteHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def _send_json(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_POST(self):
        if self.path != "/rewrite-from-url":
            self._send_json(404, {"error": "Not found"})
            return

        # Auth check
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

        content_type = body.get("content_type", "").strip().lower()
        category = body.get("category", "").strip()
        urls = body.get("urls", [])

        # Validate
        if content_type not in ("article", "review", "guide", "news"):
            self._send_json(400, {"error": "content_type must be article, review, guide, or news"})
            return

        if not urls or not isinstance(urls, list):
            self._send_json(400, {"error": "urls must be a non-empty list"})
            return

        if content_type == "review":
            valid_cats = REVIEW_CATEGORIES
        elif content_type == "news":
            valid_cats = NEWS_CATEGORIES
        else:
            valid_cats = ARTICLE_CATEGORIES
        if category not in valid_cats:
            self._send_json(400, {
                "error": f"Invalid category: {category}",
                "valid_categories": valid_cats
            })
            return

        # Process
        try:
            result = rewrite_from_urls(content_type, category, urls)
            self._send_json(200, result)
        except ValueError as e:
            self._send_json(400, {"error": str(e)})
        except Exception as e:
            self._send_json(500, {"error": str(e)[:500]})

    def log_message(self, format, *args):
        print(f"[RewriteAPI] {args[0]}" if args else "", flush=True)


if __name__ == "__main__":
    port = 5115
    server = HTTPServer(("0.0.0.0", port), RewriteHandler)
    print(f"Rewrite API running on port {port}", flush=True)
    server.serve_forever()
