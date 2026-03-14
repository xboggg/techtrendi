#!/usr/bin/env python3
"""
Replace duplicate cover images in existing articles and news with unique Pexels images.
Run on VPS: python3 /opt/tech-news/replace_duplicate_images.py
"""
import os
import json
import urllib.parse
import time
import requests

# Load env
try:
    from dotenv import load_dotenv
    load_dotenv("/opt/tech-news/.env")
    load_dotenv("/opt/supabase/docker/.env", override=False)
except ImportError:
    pass

SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:8090")
SERVICE_KEY = os.getenv("SERVICE_ROLE_KEY", os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

def supabase_get(table, select="*", params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}&{params}"
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()

def supabase_update(table, id_val, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{id_val}"
    r = requests.patch(url, headers=HEADERS, json=data, timeout=15)
    r.raise_for_status()

def search_pexels(query, exclude_urls):
    """Search Pexels, return first unused image URL."""
    if not PEXELS_API_KEY:
        print("  ERROR: No PEXELS_API_KEY")
        return None
    encoded = urllib.parse.quote(query)
    url = f"https://api.pexels.com/v1/search?query={encoded}&per_page=40&orientation=landscape&size=large"
    try:
        r = requests.get(url, headers={"Authorization": PEXELS_API_KEY}, timeout=15)
        if r.status_code != 200:
            print(f"  Pexels error: {r.status_code}")
            return None
        photos = r.json().get("photos", [])
        for photo in photos:
            image_url = photo["src"].get("large2x", photo["src"].get("large", ""))
            base = image_url.split("?")[0]
            if any(base in u or u in image_url for u in exclude_urls):
                continue
            return image_url
    except Exception as e:
        print(f"  Pexels error: {e}")
    return None

def fix_table(table, title_field="title", category_field="category"):
    """Fix duplicate images in a table."""
    print(f"\n{'='*60}")
    print(f"Fixing {table}")
    print(f"{'='*60}")

    rows = supabase_get(table, f"id,{title_field},{category_field},cover_image", "order=created_at.desc")
    print(f"Total rows: {len(rows)}")

    # Find all URLs and count usage
    url_counts = {}
    for r in rows:
        img = r.get("cover_image", "")
        if img:
            base = img.split("?")[0]
            url_counts[base] = url_counts.get(base, 0) + 1

    # Collect all used URLs (to avoid reusing)
    all_used = set(url_counts.keys())

    # Find rows that need new images (duplicates - keep first occurrence, replace rest)
    seen_urls = set()
    to_fix = []
    for r in rows:
        img = r.get("cover_image", "")
        base = img.split("?")[0] if img else ""
        if base in seen_urls:
            to_fix.append(r)
        else:
            seen_urls.add(base)

    print(f"Duplicate images to replace: {len(to_fix)}")

    fixed = 0
    for r in to_fix:
        title = r.get(title_field, "")
        category = r.get(category_field, "general")

        # Build search query from title
        stop_words = {"the","a","an","to","in","for","of","and","or","is","it","that",
                      "this","with","your","you","how","why","what","from","on","by",
                      "are","can","will","do","be","has","have","its","but","not","no",
                      "all","they","we","our","my","just","so","if","at","up","out",
                      "about","get","one","two","dont","doesnt","actually","really",
                      "best","top","complete","guide","ultimate","every","everything",
                      "need","know","works","2026","2025"}
        words = [w for w in title.lower().split() if w not in stop_words and len(w) > 2]
        query = " ".join(words[:4])
        if category:
            query += " " + category.lower()

        print(f"\n  [{fixed+1}/{len(to_fix)}] {title[:50]}...")
        print(f"  Search: '{query}'")

        new_url = search_pexels(query, all_used)

        if not new_url:
            # Try category-only search
            cat_queries = {
                "Phones": "smartphone mobile device",
                "Security": "cybersecurity lock shield",
                "AI Tech": "artificial intelligence neural network",
                "Productivity": "office desk workspace laptop",
                "How-To": "tutorial step by step guide",
                "Side Hustles": "money business freelance",
                "Gaming": "gaming controller esports",
                "Accessories": "tech gadgets accessories",
                "Career in Tech": "career interview professional",
                "Health Tech": "health medical technology",
                "Remote Work": "home office remote work",
                "Green Tech": "solar panel renewable energy",
            }
            fallback = cat_queries.get(category, "technology modern")
            new_url = search_pexels(fallback + " " + str(fixed), all_used)

        if not new_url:
            new_url = search_pexels(f"technology abstract {fixed}", all_used)

        if new_url:
            supabase_update(table, r["id"], {"cover_image": new_url})
            all_used.add(new_url.split("?")[0])
            fixed += 1
            print(f"  REPLACED -> {new_url[:60]}...")
        else:
            print(f"  SKIPPED - no unique image found")

        # Rate limit: be nice to Pexels
        time.sleep(0.5)

    print(f"\nFixed {fixed}/{len(to_fix)} duplicate images in {table}")
    return fixed

if __name__ == "__main__":
    if not SERVICE_KEY:
        print("ERROR: No SUPABASE_SERVICE_ROLE_KEY found")
        exit(1)
    if not PEXELS_API_KEY:
        print("ERROR: No PEXELS_API_KEY found")
        exit(1)

    print("Replacing duplicate cover images with unique Pexels images...")
    total = 0
    total += fix_table("articles", title_field="title", category_field="category")
    total += fix_table("news", title_field="title", category_field="niche")
    print(f"\n{'='*60}")
    print(f"DONE: Replaced {total} duplicate images total")
