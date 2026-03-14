#!/usr/bin/env python3
"""
Fix daily_article_gen.py to use Pexels search instead of hardcoded Unsplash images.
Also fix existing duplicate images in the database.
"""
import re

path = "/opt/tech-news/daily_article_gen.py"
with open(path, "r") as f:
    content = f.read()

# Check if already patched
if "search_pexels_for_article" in content:
    print("Already patched!")
else:
    # 1. Add the Pexels functions after "import random"
    old_import = "import random"
    new_code = '''import random
import urllib.parse

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")

def get_used_article_images():
    """Get all cover_image URLs from articles table."""
    used = set()
    try:
        import json as _json
        sql = "SELECT json_agg(cover_image) FROM articles WHERE cover_image IS NOT NULL"
        result = db_query(sql)
        if result:
            rows = _json.loads(result)
            if isinstance(rows, list):
                for item in rows:
                    if isinstance(item, list):
                        for url in item:
                            if url:
                                used.add(url.split("?")[0])
                    elif isinstance(item, str) and item:
                        used.add(item.split("?")[0])
    except Exception as e:
        print(f"  Warning: could not fetch used images: {e}")
    return used

def search_pexels_for_article(query, exclude_urls=None):
    """Search Pexels for article cover image, skipping already-used ones."""
    if not PEXELS_API_KEY:
        return ""
    if exclude_urls is None:
        exclude_urls = set()
    try:
        import requests as _req
        encoded = urllib.parse.quote(query)
        url = "https://api.pexels.com/v1/search?query=" + encoded + "&per_page=30&orientation=landscape&size=large"
        resp = _req.get(url, headers={"Authorization": PEXELS_API_KEY}, timeout=15)
        if resp.status_code == 200:
            photos = resp.json().get("photos", [])
            for photo in photos:
                image_url = photo["src"].get("large2x", photo["src"].get("large", ""))
                base = image_url.split("?")[0]
                already_used = False
                for u in exclude_urls:
                    if base in u or u in image_url:
                        already_used = True
                        break
                if already_used:
                    continue
                print(f"  Pexels image: {photo.get('photographer', '?')} - {image_url[:60]}...")
                return image_url
            print(f"  Pexels: all {len(photos)} results used for '{query}'")
    except Exception as e:
        print(f"  Pexels error: {e}")
    return ""

_session_article_images = set()

def get_article_cover_image(title, category):
    """Get unique cover image via Pexels search with dedup."""
    global _session_article_images
    used = get_used_article_images()
    used.update(_session_article_images)
    print(f"  Tracking {len(used)} used images to avoid duplicates")

    stop_words = {"the","a","an","to","in","for","of","and","or","is","it","that","this",
                  "with","your","you","how","why","what","from","on","by","are","can",
                  "will","do","be","has","have","its","but","not","no","all","they","we",
                  "our","my","just","so","if","at","up","out","about","get","one","two",
                  "dont","doesnt","actually","really","best","top","complete","guide",
                  "ultimate","every","everything","need","know","works","2026","2025"}
    words = [w for w in title.lower().split() if w not in stop_words and len(w) > 2]
    keywords = " ".join(words[:5]) + " " + category.lower()

    url = search_pexels_for_article(keywords.strip(), used)
    if url:
        _session_article_images.add(url.split("?")[0])
        return url

    category_queries = {
        "Phones": "smartphone mobile phone technology",
        "Security": "cybersecurity digital security padlock",
        "AI Tech": "artificial intelligence robot futuristic",
        "Productivity": "workspace productivity laptop desk",
        "How-To": "tutorial learning computer guide",
        "Side Hustles": "freelance entrepreneur business money",
        "Gaming": "gaming esports computer setup",
        "Accessories": "tech accessories headphones gadgets",
        "Career in Tech": "office career technology professional",
        "Health Tech": "health technology medical wearable",
        "Remote Work": "remote work home office laptop",
        "Green Tech": "renewable energy solar green technology",
    }
    fallback_q = category_queries.get(category, "technology digital")
    url = search_pexels_for_article(fallback_q, used)
    if url:
        _session_article_images.add(url.split("?")[0])
        return url

    url = search_pexels_for_article("modern technology digital", used)
    if url:
        _session_article_images.add(url.split("?")[0])
        return url

    return "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?w=800&h=400&fit=crop"
'''

    content = content.replace(old_import, new_code, 1)

    # 2. Remove the hardcoded cover_images dict and replace with Pexels call
    # Find from "    # Pick a relevant cover image" to the random.choice line
    pattern = r"    # Pick a relevant cover image.*?cover = random\.choice\(cover_images\.get\(category.*?\)\)"
    replacement = "    # Get unique cover image via Pexels\n    cover = get_article_cover_image(data[\"title\"], category)"
    content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)

    with open(path, "w") as f:
        f.write(content)

    print("Article generator patched!")
    print("  - Replaced hardcoded Unsplash pools with Pexels search")
    print("  - Added DB dedup + session tracking")
    print("  - 30 results per search to maximize uniqueness")
