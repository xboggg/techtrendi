#!/usr/bin/env python3
"""Patch tech_news_generator.py to prevent duplicate images across articles.

Changes:
1. Add get_used_image_urls() - fetches all cover_image URLs from last 60 days
2. Update search_pexels_image() to accept exclude_urls set, fetch 15 results, skip used ones
3. Update get_featured_image() to pass exclude set and track per-session usage
"""

import re

path = "/opt/tech-news/tech_news_generator.py"
with open(path, "r") as f:
    content = f.read()

# ── 1. Replace search_pexels_image ──────────────────────────────────

# Find and replace the function
old_func_pattern = r'def search_pexels_image\(query: str\) -> str:.*?return ""\n'
new_func = '''def get_used_image_urls() -> set:
    """Fetch all image URLs used in news/articles in the last 60 days"""
    used = set()
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()
        for table in ["news", "articles"]:
            field = "cover_image"
            result = supabase_request(f"{table}?created_at=gte.{cutoff}&select={field}")
            if isinstance(result, list):
                used.update(r[field] for r in result if r.get(field))
    except Exception as e:
        print(f"   Warning: could not fetch used images: {e}")
    return used


def search_pexels_image(query: str, exclude_urls: set = None) -> str:
    """Search Pexels for a relevant photo, skipping already-used images."""
    if not PEXELS_API_KEY:
        return ""
    if exclude_urls is None:
        exclude_urls = set()
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://api.pexels.com/v1/search?query={encoded}&per_page=15&orientation=landscape&size=large"
        response = requests.get(url, headers={"Authorization": PEXELS_API_KEY}, timeout=15)
        if response.status_code == 200:
            data = response.json()
            photos = data.get("photos", [])
            for photo in photos:
                image_url = photo["src"].get("large2x", photo["src"].get("large", ""))
                # Skip if this exact URL or base photo was already used
                photo_base = image_url.split("?")[0]
                already_used = False
                for used in exclude_urls:
                    if photo_base in used or used in image_url:
                        already_used = True
                        break
                if already_used:
                    print(f"   Pexels: skipping already-used image from {photo.get('photographer', '?')}")
                    continue
                photographer = photo.get("photographer", "Pexels")
                print(f"   Pexels image found: {photographer} - {image_url[:80]}...")
                return image_url
            print(f"   Pexels: all {len(photos)} results already used for '{query}'")
            return ""
        print(f"   Pexels: no results for '{query}'")
        return ""
    except Exception as e:
        print(f"   Pexels error: {e}")
        return ""

'''

content = re.sub(old_func_pattern, new_func, content, count=1, flags=re.DOTALL)

# ── 2. Update get_featured_image to use exclude_urls ────────────────

# Add used_urls fetch at the start of get_featured_image
old_start = '    # Extract smart keywords from title for Pexels search\n    keywords = extract_image_keywords(title, niche)\n    print(f"   Image search keywords: \'{keywords}\'")\n\n    # Try Pexels with title keywords\n    pexels_url = search_pexels_image(keywords)\n    if pexels_url:\n        return pexels_url'

new_start = '''    # Get already-used images to avoid duplicates
    used_urls = get_used_image_urls()
    used_urls.update(getattr(get_featured_image, "_session_urls", set()))
    print(f"   Tracking {len(used_urls)} used images to avoid duplicates")

    # Extract smart keywords from title for Pexels search
    keywords = extract_image_keywords(title, niche)
    print(f"   Image search keywords: '{keywords}'")

    # Try Pexels with title keywords
    pexels_url = search_pexels_image(keywords, used_urls)
    if pexels_url:
        if not hasattr(get_featured_image, "_session_urls"):
            get_featured_image._session_urls = set()
        get_featured_image._session_urls.add(pexels_url)
        return pexels_url'''

content = content.replace(old_start, new_start, 1)

# Update fallback pexels search
old_fallback = '    pexels_url = search_pexels_image(fallback_query)\n    if pexels_url:\n        return pexels_url'

new_fallback = '''    pexels_url = search_pexels_image(fallback_query, used_urls)
    if pexels_url:
        if not hasattr(get_featured_image, "_session_urls"):
            get_featured_image._session_urls = set()
        get_featured_image._session_urls.add(pexels_url)
        return pexels_url'''

content = content.replace(old_fallback, new_fallback, 1)

with open(path, "w") as f:
    f.write(content)

print("Image dedup patch applied successfully!")
print("Changes:")
print("  - Added get_used_image_urls() function")
print("  - search_pexels_image() now fetches 15 results and skips used ones")
print("  - get_featured_image() tracks used URLs per-session and cross-session")
