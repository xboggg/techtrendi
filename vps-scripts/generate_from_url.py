#!/usr/bin/env python3
"""
TechTrendi URL Rewrite Engine
=============================
Scrapes one or more URLs, extracts article text, and uses Claude to
produce an original TechTrendi article, review, or guide.

Usage (CLI):
  python3 generate_from_url.py article "Security" "https://url1" "https://url2"
  python3 generate_from_url.py review "Smartphones" "https://url1"
  python3 generate_from_url.py guide "Productivity" "https://url1" "https://url2" "https://url3"
"""

import os, sys, json, re, uuid, random, subprocess, urllib.request
import anthropic
import trafilatura
from dotenv import load_dotenv

load_dotenv("/opt/tech-news/.env")

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

ARTICLE_CATEGORIES = [
    "Phones", "Security", "AI Tech", "Productivity", "How-To", "Side Hustles",
    "Gaming", "Accessories", "Career in Tech", "Health Tech", "Remote Work", "Green Tech",
]

REVIEW_CATEGORIES = [
    "Smartphones", "Laptops", "Audio", "Wearables", "Tablets",
    "Apps", "SaaS Tools", "Smart Home", "Gaming", "Cameras",
    "Networking", "Accessories",
]

NEWS_CATEGORIES = [
    "AI Tech", "Big Tech", "Cybersecurity", "Gadgets", "Gaming",
    "Space", "Crypto", "Green Tech", "Startups", "Health Tech",
]

COVER_IMAGES = {
    "Phones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop",
    "Security": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop",
    "AI Tech": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
    "Productivity": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=600&fit=crop",
    "How-To": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=600&fit=crop",
    "Side Hustles": "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&h=600&fit=crop",
    "Gaming": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=600&fit=crop",
    "Accessories": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=600&fit=crop",
    "Career in Tech": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=600&fit=crop",
    "Health Tech": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop",
    "Remote Work": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&h=600&fit=crop",
    "Green Tech": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&h=600&fit=crop",
}

REVIEW_COVER_IMAGES = {
    "Smartphones": ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop",
                     "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=400&fit=crop"],
    "Laptops": ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=400&fit=crop",
                "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=400&fit=crop"],
    "Audio": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=400&fit=crop"],
    "Wearables": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=400&fit=crop"],
    "Tablets": ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=400&fit=crop"],
    "Apps": ["https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop"],
    "SaaS Tools": ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop"],
    "Smart Home": ["https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=400&fit=crop"],
    "Gaming": ["https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=400&fit=crop"],
    "Cameras": ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=400&fit=crop"],
    "Networking": ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop"],
    "Accessories": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=400&fit=crop"],
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def send_telegram(msg):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = json.dumps({"chat_id": TELEGRAM_CHAT_ID, "text": msg[:4000], "parse_mode": "HTML"}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req)
    except Exception:
        pass

def db_exec(sql):
    r = subprocess.run(
        ["docker", "exec", "-i", "supabase-db", "psql", "-U", "postgres", "-d", "postgres", "-c", sql],
        capture_output=True, text=True, timeout=30
    )
    if r.returncode != 0:
        print(f"  DB error: {r.stderr[:300]}")
        return False
    return True

def db_query(sql):
    r = subprocess.run(
        ["docker", "exec", "-i", "supabase-db", "psql", "-U", "postgres", "-d", "postgres", "-t", "-A", "-c", sql],
        capture_output=True, text=True, timeout=30
    )
    return r.stdout.strip() if r.returncode == 0 else ""

def regenerate_static_json():
    sql = (
        "SELECT json_agg(json_build_object("
        "'id', id, 'title', title, 'slug', slug, 'excerpt', excerpt, "
        "'category', category, 'cover_image', cover_image, "
        "'read_time_minutes', read_time_minutes, 'created_at', created_at, "
        "'is_premium', is_premium, 'tags', tags, 'author', author, "
        "'views', views) ORDER BY created_at DESC) "
        "FROM articles WHERE is_published = true;"
    )
    result = db_query(sql)
    if result:
        with open("/opt/tech-news/articles-light.json", "w") as f:
            f.write(result)

def esc(s):
    """Escape single quotes for SQL."""
    return s.replace("'", "''")

# ---------------------------------------------------------------------------
# URL Scraping
# ---------------------------------------------------------------------------

def scrape_urls(urls):
    """Fetch and extract text from multiple URLs. Returns combined text."""
    texts = []
    for url in urls:
        print(f"  Scraping: {url}")
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                text = trafilatura.extract(downloaded, include_comments=False,
                                           include_tables=True, favor_precision=True)
                if text and len(text) > 100:
                    texts.append(f"--- SOURCE: {url} ---\n{text[:8000]}")
                    print(f"    Extracted {len(text)} chars")
                else:
                    print(f"    Too short or empty, skipping")
            else:
                print(f"    Failed to download")
        except Exception as e:
            print(f"    Error: {e}")

    if not texts:
        raise ValueError("Could not extract content from any of the provided URLs")

    return "\n\n".join(texts)

# ---------------------------------------------------------------------------
# Article Rewrite
# ---------------------------------------------------------------------------

def rewrite_as_article(source_text, category):
    """Full rewrite of source content as an original TechTrendi article."""
    title_style = random.choice(["contrarian", "question_hook", "numbered_actionable",
                                  "bold_statement", "story_opener", "myth_busting"])
    content_style = random.choice(["conversational_expert", "investigative",
                                    "practical_guide", "storytelling", "comparison_analysis"])

    disclaimer = ""
    if category == "Side Hustles":
        disclaimer = "\n- Include disclaimer: educational purposes only, no income guarantees, results vary"

    prompt = (
        "You are an elite content architect at Wired, The Verge, and NYT Tech.\n\n"
        "I am giving you source material from one or more articles. Your job is to write a "
        "COMPLETELY ORIGINAL article inspired by the same topic. This is NOT a summary or rewrite "
        "- it is a fresh take with new structure, new angles, and your own voice.\n\n"
        f"SOURCE MATERIAL:\n{source_text}\n\n"
        f"TARGET CATEGORY: {category}\n"
        f"TITLE STYLE: {title_style}\n"
        f"CONTENT STYLE: {content_style}\n\n"
        "CRITICAL RULES:\n"
        "- Write a COMPLETELY NEW article - different structure, different angle, different examples\n"
        "- 1800-2500 words in clean markdown (## h2, ### h3, **bold**, - bullets)\n"
        "- Hook the reader in the first 2 sentences with a pattern interrupt or surprising fact\n"
        "- Use curiosity gaps and bucket brigade phrases\n"
        "- Short paragraphs (2-3 sentences max), subheadings every 200-300 words\n"
        "- Include practical, actionable takeaways\n"
        "- Reference 2026 naturally where appropriate\n"
        "- Write for a global audience including developing countries\n"
        f"{disclaimer}\n"
        "- DO NOT copy any sentences verbatim from the source\n"
        "- DO NOT mention or reference the source articles\n"
        "- NO SEO metadata blocks, NO trailing ---, NO 'In conclusion'\n"
        "- End with a forward-looking thought or call to action\n\n"
        'Return ONLY valid JSON (no markdown code blocks):\n'
        '{"title": "compelling click-worthy title", "slug": "url-friendly-slug", '
        '"excerpt": "2-3 sentence hook", "content": "full markdown article", '
        '"read_time_minutes": number, "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}'
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=6000,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = re.sub(r'^```\w*\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
    return json.loads(text)


def insert_article(data, category):
    aid = str(uuid.uuid4())
    tags = data.get("tags", [category.lower()])
    tags_array = "ARRAY[" + ",".join(f"'{esc(t)}'" for t in tags) + "]::text[]"
    cover = COVER_IMAGES.get(category, COVER_IMAGES["How-To"])

    sql = (
        f"INSERT INTO articles (id,title,slug,excerpt,content,category,tags,cover_image,"
        f"read_time_minutes,author,is_published,views,created_at,updated_at) "
        f"VALUES ('{aid}','{esc(data['title'])}','{esc(data['slug'])}','{esc(data.get('excerpt',''))}','{esc(data['content'])}','{esc(category)}',{tags_array},"
        f"'{cover}',{data.get('read_time_minutes', 9)},'TechTrendi Team',true,0,NOW(),NOW());"
    )
    return db_exec(sql)

# ---------------------------------------------------------------------------
# Review Rewrite
# ---------------------------------------------------------------------------

def rewrite_as_review(source_text, category):
    """Full rewrite of source content as an original TechTrendi review."""
    style = random.choice(["hands_on_experience", "comparison_focused", "value_analysis",
                           "deep_dive_technical", "everyday_user"])

    prompt = (
        "You are MKBHD meets The Verge best reviewer - brutally honest, specific, genuinely helpful.\n\n"
        "I am giving you source material about a product/service. Write a COMPLETELY ORIGINAL review "
        "with your own voice, structure, and analysis. Extract the facts but present them in a fresh way.\n\n"
        f"SOURCE MATERIAL:\n{source_text}\n\n"
        f"TARGET CATEGORY: {category}\n"
        f"REVIEW STYLE: {style}\n\n"
        "YOUR VOICE:\n"
        "- Sound like you have lived with this product for weeks\n"
        "- Have STRONG opinions. Take a clear stance.\n"
        "- Compare to competitors constantly\n"
        "- Talk about price like a real person\n"
        "- Use I and you naturally. Short punchy sentences.\n\n"
        "STRUCTURE:\n"
        "- 2000-3000 words in clean markdown\n"
        "- Open with a bold hook\n"
        "- Sections: First Impressions, Design & Build, The Good Stuff, The Problems, Who Should Buy This, The Verdict\n"
        "- Include specific comparisons and real-world scenarios\n"
        "- Price analysis and value assessment\n\n"
        "CRITICAL:\n"
        "- DO NOT copy sentences from the source\n"
        "- DO NOT mention or reference the source articles\n"
        "- Write as if YOU tested the product yourself\n\n"
        'Return ONLY valid JSON (no markdown code blocks):\n'
        '{"title": "Bold review title", "slug": "url-slug-review", '
        f'"category": "{category}", '
        '"rating": number_1.0_to_5.0, "verdict": "2-3 punchy verdict sentences", '
        '"pros": ["pro1", "pro2", "pro3", "pro4", "pro5"], '
        '"cons": ["con1", "con2", "con3"], '
        '"price": "$XXX or Free or $XX/month", '
        '"release_date": "Month Year or Available Now", '
        '"specs": {"key": "value"}, '
        '"full_review": "full markdown review", '
        '"tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}'
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = re.sub(r'^```\w*\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
    return json.loads(text)


def insert_review(data, category):
    rid = str(uuid.uuid4())
    pros = data.get("pros", [])
    cons = data.get("cons", [])
    pros_array = "ARRAY[" + ",".join(f"'{esc(p)}'" for p in pros) + "]::text[]"
    cons_array = "ARRAY[" + ",".join(f"'{esc(c)}'" for c in cons) + "]::text[]"
    specs = json.dumps(data.get("specs", {})).replace("'", "''")
    images = REVIEW_COVER_IMAGES.get(category, REVIEW_COVER_IMAGES.get("Accessories"))
    cover = random.choice(images)

    sql = (
        f"INSERT INTO reviews (id,title,slug,category,image,rating,verdict,pros,cons,price,"
        f"release_date,full_review,specs,is_published,views,created_at,updated_at) "
        f"VALUES ('{rid}','{esc(data['title'])}','{esc(data['slug'])}','{esc(category)}',"
        f"'{cover}',{float(data.get('rating', 4.0))},'{esc(data.get('verdict',''))}',{pros_array},{cons_array},"
        f"'{esc(data.get('price',''))}','{esc(data.get('release_date',''))}','{esc(data.get('full_review',''))}',"
        f"'{specs}'::jsonb,true,0,NOW(),NOW());"
    )
    return db_exec(sql)

# ---------------------------------------------------------------------------
# Guide Rewrite
# ---------------------------------------------------------------------------

def rewrite_as_guide(source_text, category):
    """Full rewrite of source content as an original TechTrendi guide."""
    disclaimer = ""
    if category == "Side Hustles":
        disclaimer = "\n- Include disclaimer: results vary, not financial advice"

    prompt = (
        "You are a world-class content writer who has written for Wired, The Verge, "
        "and helped millions solve real tech problems.\n\n"
        "I am giving you source material. Write a COMPLETELY ORIGINAL comprehensive guide "
        "on the same topic. New structure, new examples, your own voice.\n\n"
        f"SOURCE MATERIAL:\n{source_text}\n\n"
        f"TARGET CATEGORY: {category}\n\n"
        "RULES:\n"
        "- 2000-3000 words. Should feel COMPLETE - someone can follow every step.\n"
        "- Write like a HUMAN. Use you and your. Be warm, direct, slightly witty.\n"
        "- Start with a hook - surprising stat or relatable frustration\n"
        "- Short paragraphs (2-3 sentences MAX)\n"
        "- Use ## for main sections, ### for subsections\n"
        "- Include SPECIFIC tool names, websites, exact steps\n"
        "- Add real-world examples and Pro tip: callouts\n"
        "- Reference 2026 where natural\n"
        "- Write for a GLOBAL audience\n"
        "- Make it so practical someone can follow along on their phone\n"
        f"{disclaimer}\n"
        "- DO NOT copy sentences from the source\n"
        "- DO NOT mention or reference the source articles\n"
        "- NO fluff, NO 'In this article we will...'\n"
        "- Every sentence must earn its place\n\n"
        'Return ONLY valid JSON (no code blocks):\n'
        '{"title": "compelling title under 65 chars", "slug": "url-slug", '
        '"excerpt": "2-3 sentence hook under 160 chars", '
        '"content": "full markdown", "read_time_minutes": number, '
        '"tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}'
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = re.sub(r'^```\w*\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
    return json.loads(text)


def insert_guide(data, category):
    aid = str(uuid.uuid4())
    tags = data.get("tags", [category.lower()])
    tags_array = "ARRAY[" + ",".join(f"'{esc(t)}'" for t in tags) + "]::text[]"
    cover = COVER_IMAGES.get(category, COVER_IMAGES["How-To"])

    sql = (
        f"INSERT INTO articles (id,title,slug,excerpt,content,category,tags,cover_image,"
        f"read_time_minutes,author,is_published,views,content_type,is_featured,created_at,updated_at) "
        f"VALUES ('{aid}','{esc(data['title'])}','{esc(data['slug'])}','{esc(data.get('excerpt',''))}','{esc(data['content'])}','{esc(category)}',{tags_array},"
        f"'{cover}',{data.get('read_time_minutes', 10)},'TechTrendi Team',true,0,'guide',true,NOW(),NOW());"
    )
    return db_exec(sql)

# ---------------------------------------------------------------------------
# News Rewrite
# ---------------------------------------------------------------------------

def rewrite_as_news(source_text, category):
    """Full rewrite of source content as an original TechTrendi news article."""
    tone = random.choice(["breaking_urgency", "analytical", "explainer",
                          "impact_focused", "trend_spotter"])

    prompt = (
        "You are a senior tech journalist at Reuters/Bloomberg Technology.\n\n"
        "I am giving you source material from one or more news stories. Write a COMPLETELY ORIGINAL "
        "news article covering the same topic. Fresh angle, new structure, your own voice.\n\n"
        f"SOURCE MATERIAL:\n{source_text}\n\n"
        f"TARGET CATEGORY: {category}\n"
        f"TONE: {tone}\n\n"
        "CRITICAL RULES:\n"
        "- Write a COMPLETELY NEW news article — different structure, fresh angle\n"
        "- 800-1500 words in clean HTML (use <h2>, <h3>, <p>, <strong>, <ul>/<li>)\n"
        "- Lead with the most important/surprising fact in the first sentence\n"
        "- Use the inverted pyramid: most critical info first, context later\n"
        "- Short paragraphs (2-3 sentences max)\n"
        "- Include relevant context and why this matters\n"
        "- Reference 2026 naturally where appropriate\n"
        "- Write for a global audience\n"
        "- DO NOT copy any sentences verbatim from the source\n"
        "- DO NOT mention or reference the source articles\n"
        "- NO SEO metadata blocks, NO trailing ---, NO 'In conclusion'\n"
        "- End with forward-looking implications or what to watch next\n\n"
        'Return ONLY valid JSON (no markdown code blocks):\n'
        '{"title": "compelling news headline", "slug": "url-friendly-slug", '
        '"excerpt": "1-2 sentence news summary", "content": "full HTML news article", '
        '"read_time_minutes": number, "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}'
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=5000,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = re.sub(r'^```\w*\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
    return json.loads(text)


def insert_news(data, category):
    nid = str(uuid.uuid4())
    tags = data.get("tags", [category.lower()])
    tags_array = "ARRAY[" + ",".join(f"'{esc(t)}'" for t in tags) + "]::text[]"
    cover = COVER_IMAGES.get(category, COVER_IMAGES.get("AI Tech", COVER_IMAGES["How-To"]))

    sql = (
        f"INSERT INTO news (id,title,slug,excerpt,content,category,cover_image,tags,"
        f"read_time_minutes,author,is_published,status,views,created_at,updated_at) "
        f"VALUES ('{nid}','{esc(data['title'])}','{esc(data['slug'])}','{esc(data.get('excerpt',''))}','{esc(data['content'])}','{esc(category)}',"
        f"'{cover}',{tags_array},{data.get('read_time_minutes', 3)},'TechTrendi Team',true,'published',0,NOW(),NOW());"
    )
    return db_exec(sql)

# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def rewrite_from_urls(content_type, category, urls):
    """
    Main entry point. Returns result dict on success, raises on failure.
    content_type: 'article', 'review', or 'guide'
    category: valid category string
    urls: list of URL strings
    """
    if content_type not in ("article", "review", "guide", "news"):
        raise ValueError(f"Invalid content type: {content_type}. Use: article, review, guide, news")

    if content_type == "review":
        valid_cats = REVIEW_CATEGORIES
    elif content_type == "news":
        valid_cats = NEWS_CATEGORIES
    else:
        valid_cats = ARTICLE_CATEGORIES
    if category not in valid_cats:
        raise ValueError(f"Invalid category: {category}. Valid: {', '.join(valid_cats)}")

    print(f"Scraping {len(urls)} URL(s)...")
    source_text = scrape_urls(urls)
    print(f"Total extracted text: {len(source_text)} chars")

    print(f"Generating {content_type} in category '{category}'...")
    if content_type == "article":
        data = rewrite_as_article(source_text, category)
        success = insert_article(data, category)
        link = f"https://techtrendi.com/blog/{data['slug']}"
        notify_type = "Article"
    elif content_type == "review":
        data = rewrite_as_review(source_text, category)
        success = insert_review(data, category)
        link = f"https://techtrendi.com/reviews/{data['slug']}"
        notify_type = "Review"
    elif content_type == "guide":
        data = rewrite_as_guide(source_text, category)
        success = insert_guide(data, category)
        link = f"https://techtrendi.com/blog/{data['slug']}"
        notify_type = "Guide"
    elif content_type == "news":
        data = rewrite_as_news(source_text, category)
        success = insert_news(data, category)
        link = f"https://techtrendi.com/news/{data['slug']}"
        notify_type = "News"

    if not success:
        raise Exception("Database insert failed")

    if content_type in ("article", "guide"):
        regenerate_static_json()

    rating_line = f"\n\u2b50 {data.get('rating', '?')}/5" if content_type == "review" else ""
    msg = (
        f"<b>\U0001f504 {notify_type} Rewritten & Published</b>\n\n"
        f"<b>{data.get('title', 'Untitled')}</b>\n"
        f"Category: {category}{rating_line}\n"
        f"Sources: {len(urls)} URL(s)\n\n"
        f"\U0001f517 {link}"
    )
    send_telegram(msg)

    print(f"\nPublished: {data.get('title', 'Untitled')}")
    print(f"Link: {link}")

    return {
        "title": data.get("title", ""),
        "slug": data.get("slug", ""),
        "category": category,
        "content_type": content_type,
        "rating": data.get("rating"),
        "read_time_minutes": data.get("read_time_minutes"),
        "link": link,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 generate_from_url.py <article|review|guide|news> <Category> <url1> [url2] [url3]")
        print("\nExamples:")
        print('  python3 generate_from_url.py article "Security" "https://example.com/article"')
        print('  python3 generate_from_url.py review "Smartphones" "https://url1" "https://url2"')
        print('  python3 generate_from_url.py guide "Productivity" "https://url1" "https://url2" "https://url3"')
        sys.exit(1)

    ctype = sys.argv[1].lower()
    cat = sys.argv[2]
    url_list = sys.argv[3:]

    try:
        result = rewrite_from_urls(ctype, cat, url_list)
        print(f"\nSuccess! {result}")
    except Exception as e:
        print(f"\nFailed: {e}")
        sys.exit(1)
