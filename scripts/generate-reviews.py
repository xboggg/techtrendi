#!/usr/bin/env python3
"""
AI Review Generator for TechTrendi
Generates detailed product reviews using Groq (Llama 3.3 70B) and inserts into Supabase.
Run on VPS: python3 /opt/tech-news/generate-reviews.py
"""

import json, os, sys, time, re, random
import requests
from datetime import datetime

# Config
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://db.techtrendi.com")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Load keys from .env files if not set
for env_path in ["/opt/tech-news/.env", "/opt/supabase/docker/.env"]:
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("SERVICE_ROLE_KEY=") and not SUPABASE_KEY:
                    SUPABASE_KEY = line.split("=", 1)[1]
                if line.startswith("ANTHROPIC_API_KEY=") and not ANTHROPIC_API_KEY:
                    ANTHROPIC_API_KEY = line.split("=", 1)[1]

if not SUPABASE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not found")
    sys.exit(1)
if not ANTHROPIC_API_KEY:
    print("ERROR: ANTHROPIC_API_KEY not found")
    sys.exit(1)

CLAUDE_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL = "claude-sonnet-4-20250514"

TELEGRAM_TOKEN = "8726661150:AAEOQpA2L0kLLMUllFUmxHOErvcYHg1pw9w"
TELEGRAM_CHAT = "-1003595231315"

def send_telegram(msg: str):
    try:
        requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT, "text": msg, "parse_mode": "HTML"},
            timeout=10,
        )
    except Exception:
        pass

# Unsplash image URLs by category — relevant product photography
CATEGORY_IMAGES = {
    "Smartphones": [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1591337676887-a217a6c6c7d7?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&h=500&fit=crop&q=80",
    ],
    "Laptops": [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=500&fit=crop&q=80",
    ],
    "Audio": [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1590658268037-6bf12f032f4c?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&h=500&fit=crop&q=80",
    ],
    "Wearables": [
        "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&h=500&fit=crop&q=80",
    ],
    "Tablets": [
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1561154464-82e6b2dfd7c4?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&h=500&fit=crop&q=80",
    ],
    "Apps": [
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=800&h=500&fit=crop&q=80",
    ],
    "SaaS Tools": [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1581291518633-83b4eef1d2fa?w=800&h=500&fit=crop&q=80",
    ],
    "Smart Home": [
        "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&h=500&fit=crop&q=80",
    ],
    "Gaming": [
        "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=800&h=500&fit=crop&q=80",
    ],
    "Cameras": [
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?w=800&h=500&fit=crop&q=80",
    ],
    "Networking": [
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1562408590-e32931084e23?w=800&h=500&fit=crop&q=80",
    ],
    "Accessories": [
        "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1601524909162-ae8725290836?w=800&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&h=500&fit=crop&q=80",
    ],
}

# Products to review — popular, search-worthy products (2025-2026 dates)
PRODUCTS = [
    # Smartphones
    {"name": "Samsung Galaxy S25 Ultra", "category": "Smartphones", "price": "$1,299", "release": "2025-01-22"},
    {"name": "Apple iPhone 16 Pro Max", "category": "Smartphones", "price": "$1,199", "release": "2025-09-19"},
    {"name": "Google Pixel 9 Pro", "category": "Smartphones", "price": "$999", "release": "2025-08-14"},
    {"name": "OnePlus 13", "category": "Smartphones", "price": "$899", "release": "2025-01-07"},
    {"name": "Samsung Galaxy Z Fold 6", "category": "Smartphones", "price": "$1,899", "release": "2025-07-24"},
    {"name": "Samsung Galaxy Z Flip 6", "category": "Smartphones", "price": "$1,099", "release": "2025-07-24"},
    {"name": "iPhone 16", "category": "Smartphones", "price": "$799", "release": "2025-09-19"},
    {"name": "Google Pixel 9", "category": "Smartphones", "price": "$799", "release": "2025-08-14"},
    {"name": "Samsung Galaxy A56", "category": "Smartphones", "price": "$449", "release": "2025-03-11"},
    {"name": "Nothing Phone (3)", "category": "Smartphones", "price": "$399", "release": "2025-03-05"},

    # Laptops
    {"name": "MacBook Pro 14\" M4 Pro", "category": "Laptops", "price": "$1,999", "release": "2025-11-08"},
    {"name": "MacBook Air 15\" M4", "category": "Laptops", "price": "$1,299", "release": "2025-03-12"},
    {"name": "Dell XPS 16 (2025)", "category": "Laptops", "price": "$1,699", "release": "2025-02-20"},
    {"name": "Lenovo ThinkPad X1 Carbon Gen 13", "category": "Laptops", "price": "$1,449", "release": "2025-03-01"},
    {"name": "ASUS ROG Zephyrus G16 (2025)", "category": "Laptops", "price": "$1,899", "release": "2025-03-15"},
    {"name": "HP Spectre x360 14 (2025)", "category": "Laptops", "price": "$1,399", "release": "2025-05-01"},
    {"name": "Framework Laptop 16 (2025)", "category": "Laptops", "price": "$1,399", "release": "2025-01-15"},

    # Audio
    {"name": "Apple AirPods Pro 3", "category": "Audio", "price": "$249", "release": "2025-09-09"},
    {"name": "Sony WH-1000XM6", "category": "Audio", "price": "$399", "release": "2025-05-15"},
    {"name": "Samsung Galaxy Buds 4 Pro", "category": "Audio", "price": "$249", "release": "2025-07-24"},
    {"name": "Bose QuietComfort Ultra Earbuds II", "category": "Audio", "price": "$299", "release": "2025-09-01"},
    {"name": "Nothing Ear (3)", "category": "Audio", "price": "$149", "release": "2025-04-18"},

    # Wearables
    {"name": "Apple Watch Series 11", "category": "Wearables", "price": "$399", "release": "2025-09-19"},
    {"name": "Samsung Galaxy Watch 8", "category": "Wearables", "price": "$299", "release": "2025-07-24"},
    {"name": "Google Pixel Watch 4", "category": "Wearables", "price": "$349", "release": "2025-10-10"},
    {"name": "Garmin Venu 4", "category": "Wearables", "price": "$449", "release": "2025-08-30"},

    # Tablets
    {"name": "iPad Pro M5 (2025)", "category": "Tablets", "price": "$1,099", "release": "2025-05-15"},
    {"name": "iPad Air M3 (2025)", "category": "Tablets", "price": "$599", "release": "2025-03-25"},
    {"name": "Samsung Galaxy Tab S11 Ultra", "category": "Tablets", "price": "$1,199", "release": "2025-09-26"},

    # Apps
    {"name": "Notion (2025)", "category": "Apps", "price": "Free / $10/mo", "release": "2025-01-15"},
    {"name": "Obsidian 2.0", "category": "Apps", "price": "Free / $50/yr sync", "release": "2025-02-01"},
    {"name": "Arc Browser 2.0", "category": "Apps", "price": "Free", "release": "2025-01-20"},
    {"name": "Raycast Pro", "category": "Apps", "price": "Free / $8/mo Pro", "release": "2025-03-01"},
    {"name": "Claude App (Anthropic)", "category": "Apps", "price": "Free / $20/mo Pro", "release": "2025-03-04"},

    # SaaS Tools
    {"name": "Canva Pro (2025)", "category": "SaaS Tools", "price": "$12.99/mo", "release": "2025-01-15"},
    {"name": "Figma with AI (2025)", "category": "SaaS Tools", "price": "Free / $15/mo", "release": "2025-02-01"},
    {"name": "Vercel v0 & Platform (2025)", "category": "SaaS Tools", "price": "Free / $20/mo Pro", "release": "2025-01-10"},
    {"name": "Linear (2025)", "category": "SaaS Tools", "price": "Free / $8/user/mo", "release": "2025-02-15"},
    {"name": "Grammarly AI (2025)", "category": "SaaS Tools", "price": "Free / $12/mo", "release": "2025-01-20"},

    # Smart Home
    {"name": "Apple HomePod 2 (2025)", "category": "Smart Home", "price": "$299", "release": "2025-06-09"},
    {"name": "Amazon Echo Hub (2025)", "category": "Smart Home", "price": "$179", "release": "2025-09-01"},
    {"name": "Google Nest Learning Thermostat (4th Gen)", "category": "Smart Home", "price": "$279", "release": "2025-08-20"},
    {"name": "Ring Battery Doorbell Pro 2", "category": "Smart Home", "price": "$229", "release": "2025-03-01"},

    # Gaming
    {"name": "PlayStation 5 Pro", "category": "Gaming", "price": "$699", "release": "2025-11-07"},
    {"name": "Nintendo Switch 2", "category": "Gaming", "price": "$449", "release": "2025-06-05"},
    {"name": "Steam Deck OLED 2", "category": "Gaming", "price": "$549", "release": "2025-11-16"},
    {"name": "Xbox Series X (2025 Edition)", "category": "Gaming", "price": "$499", "release": "2025-10-15"},

    # Cameras
    {"name": "Sony A7C III", "category": "Cameras", "price": "$2,198", "release": "2025-01-15"},
    {"name": "Fujifilm X100VII", "category": "Cameras", "price": "$1,699", "release": "2025-02-20"},
    {"name": "DJI Osmo Action 5 Pro", "category": "Cameras", "price": "$449", "release": "2025-10-25"},
    {"name": "GoPro Hero 14 Black", "category": "Cameras", "price": "$399", "release": "2025-09-10"},

    # Networking
    {"name": "TP-Link Deco BE85 (WiFi 7)", "category": "Networking", "price": "$699", "release": "2025-06-01"},
    {"name": "ASUS ROG Rapture GT-BE98 (WiFi 7)", "category": "Networking", "price": "$599", "release": "2025-03-01"},
    {"name": "Starlink Mini (2025)", "category": "Networking", "price": "$599 + $120/mo", "release": "2025-08-01"},

    # Accessories
    {"name": "Apple Magic Keyboard for iPad Pro M5", "category": "Accessories", "price": "$299", "release": "2025-05-15"},
    {"name": "Logitech MX Master 4", "category": "Accessories", "price": "$109", "release": "2025-09-01"},
    {"name": "Samsung 990 EVO Plus 4TB SSD", "category": "Accessories", "price": "$249", "release": "2025-06-01"},
    {"name": "Anker Prime 27,650mAh Power Bank (2025)", "category": "Accessories", "price": "$109", "release": "2025-01-15"},
]

# Track image index per category to avoid duplication
_image_counters = {}

def get_image_for_category(category: str) -> str:
    """Get a rotating image URL for a category."""
    images = CATEGORY_IMAGES.get(category, CATEGORY_IMAGES["Accessories"])
    idx = _image_counters.get(category, 0)
    _image_counters[category] = idx + 1
    return images[idx % len(images)]


def generate_review(product: dict) -> dict | None:
    """Generate a review using Claude API."""
    system_prompt = """You are TechTrendi's expert product reviewer. Generate a comprehensive, engaging product review.

Return ONLY valid JSON with this exact structure:
{
  "rating": 4.5,
  "verdict": "A one-paragraph verdict summary (2-3 sentences, compelling and specific)",
  "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4", "Pro 5"],
  "cons": ["Con 1", "Con 2", "Con 3"],
  "specs": {"key1": "value1", "key2": "value2"},
  "full_review": "The full review text, 4-6 paragraphs separated by double newlines. Be specific, mention real features, comparisons to competitors, and who this product is best for."
}

Rules:
- Rating should be realistic (3.0-5.0), most products 3.8-4.7
- 4-6 specific pros, 2-4 specific cons — be honest
- Specs should include 8-15 key specifications relevant to the product category
- Full review should be 400-700 words, engaging, specific, and helpful
- Mention real features, real competitors, and real use cases
- Include who the product is best for and who should skip it
- For apps/SaaS: specs should include platform, pricing tiers, key integrations, storage limits etc.
- For gaming: include performance metrics, game compatibility, features
- Be opinionated but fair — readers want a clear recommendation
- Write as if reviewing in 2025/2026 — reference current market context
- Return ONLY the JSON object, no markdown fences or extra text"""

    user_prompt = f"""Write a detailed review for: {product['name']}
Category: {product['category']}
Price: {product['price']}
Release Date: {product['release']}

Generate a thorough, engaging review with real specs and honest opinions. Return only valid JSON."""

    try:
        resp = requests.post(CLAUDE_URL, headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }, json={
            "model": CLAUDE_MODEL,
            "max_tokens": 4000,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.7,
        }, timeout=90)

        if resp.status_code == 429:
            print(f"  Rate limited, waiting 30s...")
            time.sleep(30)
            return generate_review(product)

        resp.raise_for_status()
        data = resp.json()
        content = data["content"][0]["text"]
        # Strip markdown fences if present
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
        return json.loads(content)
    except json.JSONDecodeError as e:
        print(f"  ERROR parsing JSON for {product['name']}: {e}")
        print(f"  Raw: {content[:200]}...")
        return None
    except Exception as e:
        print(f"  ERROR generating review for {product['name']}: {e}")
        return None


def slug_from_name(name: str) -> str:
    """Generate URL slug from product name."""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    return slug + "-review"


def insert_review(product: dict, review_data: dict) -> bool:
    """Insert review into Supabase."""
    slug = slug_from_name(product["name"])
    image = get_image_for_category(product["category"])

    payload = {
        "slug": slug,
        "title": product["name"],
        "category": product["category"],
        "image": image,
        "rating": review_data["rating"],
        "verdict": review_data["verdict"],
        "pros": review_data["pros"],
        "cons": review_data["cons"],
        "price": product["price"],
        "release_date": product["release"],
        "specs": review_data["specs"],
        "full_review": review_data["full_review"],
        "is_published": True,
        "is_featured": True,
        "views": random.randint(1500, 25000),
    }

    try:
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/reviews",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            json=payload,
            timeout=15,
        )

        if resp.status_code == 409 or (resp.status_code >= 400 and "duplicate" in resp.text.lower()):
            print(f"  Already exists: {slug}")
            return False

        resp.raise_for_status()
        return True
    except Exception as e:
        print(f"  ERROR inserting {slug}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text[:500]}")
        return False


def delete_all_reviews():
    """Delete all existing reviews to start fresh."""
    try:
        resp = requests.delete(
            f"{SUPABASE_URL}/rest/v1/reviews?id=neq.00000000-0000-0000-0000-000000000000",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        resp.raise_for_status()
        print("Deleted all existing reviews.")
    except Exception as e:
        print(f"WARNING: Could not delete reviews: {e}")


def check_existing() -> set:
    """Get set of existing review slugs."""
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/reviews?select=slug",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            },
            timeout=15,
        )
        resp.raise_for_status()
        return {r["slug"] for r in resp.json()}
    except Exception as e:
        print(f"WARNING: Could not check existing reviews: {e}")
        return set()


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--fresh", action="store_true", help="Delete all reviews and regenerate")
    parser.add_argument("--count", type=int, default=2, help="Max reviews to generate per run (default: 2)")
    args = parser.parse_args()

    print(f"=== TechTrendi Review Generator ===")
    print(f"Products to review: {len(PRODUCTS)}")

    if args.fresh:
        delete_all_reviews()
        time.sleep(1)

    existing = check_existing()
    print(f"Existing reviews in DB: {len(existing)}")

    # Filter out already-reviewed products
    to_generate = []
    for p in PRODUCTS:
        slug = slug_from_name(p["name"])
        if slug not in existing:
            to_generate.append(p)

    if not to_generate:
        print("All products already reviewed. Nothing to do.")
        send_telegram("📋 <b>Review Generator</b>: All products already reviewed, nothing new to add.")
        return

    # Limit to --count per run
    to_generate = to_generate[:args.count]
    print(f"Generating {len(to_generate)} review(s) this run...")
    print()

    success = 0
    published_names = []
    for i, product in enumerate(to_generate):
        print(f"[{i+1}/{len(to_generate)}] Generating: {product['name']}...")

        review_data = generate_review(product)
        if not review_data:
            continue

        if insert_review(product, review_data):
            success += 1
            published_names.append(f"{product['name']} ({review_data['rating']}/5)")
            print(f"  ✓ Published ({review_data['rating']}/5)")

        # Claude rate limit buffer
        time.sleep(2)

    print(f"\n=== Done! Generated {success}/{len(to_generate)} reviews ===")

    if published_names:
        names_list = "\n".join(f"• {n}" for n in published_names)
        send_telegram(f"✅ <b>TechTrendi Reviews</b>: {success} new review(s) published!\n\n{names_list}")


if __name__ == "__main__":
    main()
