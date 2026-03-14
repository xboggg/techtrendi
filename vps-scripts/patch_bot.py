#!/usr/bin/env python3
"""Patch article_bot.py to add /rewrite command."""

BOT_FILE = "/opt/tech-news/article_bot.py"

with open(BOT_FILE, "r") as f:
    content = f.read()

if "cmd_rewrite" in content:
    print("Already patched - /rewrite command exists")
    exit(0)

# 1. Add import for generate_from_url
old_import = "from review_generator import generate_and_insert_review, REVIEW_CATEGORIES"
new_import = (
    old_import + "\n"
    "from generate_from_url import rewrite_from_urls, "
    "ARTICLE_CATEGORIES as REWRITE_ARTICLE_CATS, "
    "REVIEW_CATEGORIES as REWRITE_REVIEW_CATS"
)
content = content.replace(old_import, new_import)

# 2. Add rewrite command handler before main()
rewrite_handler = '''
# ---------------------------------------------------------------------------
# Rewrite from URL command handler
# ---------------------------------------------------------------------------

async def cmd_rewrite(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Rewrite content from URL(s). Usage: /rewrite article|review|guide | Category | url1 url2"""
    if not is_authorized(update):
        return

    raw_args = update.message.text
    match = re.match(r"^/rewrite(?:@\\S+)?\\s*(.*)", raw_args, re.DOTALL)
    if not match or not match.group(1).strip():
        await update.message.reply_text(
            "<b>Usage:</b>\\n"
            "<code>/rewrite article | Category | url1 url2</code>\\n"
            "<code>/rewrite review | Category | url1</code>\\n"
            "<code>/rewrite guide | Category | url1 url2 url3</code>\\n\\n"
            "<b>Examples:</b>\\n"
            "<code>/rewrite article | Security | https://example.com/post</code>\\n"
            "<code>/rewrite review | Smartphones | https://url1 https://url2</code>\\n"
            "<code>/rewrite guide | Productivity | https://link1 https://link2</code>",
            parse_mode="HTML",
        )
        return

    payload = match.group(1).strip()
    parts = [p.strip() for p in payload.split("|")]

    if len(parts) < 3:
        await update.message.reply_text(
            "Need 3 parts separated by |\\n"
            "<code>/rewrite content_type | category | urls</code>",
            parse_mode="HTML",
        )
        return

    content_type = parts[0].lower()
    category = parts[1]
    url_text = parts[2]

    # Extract URLs from the text
    urls = re.findall(r"https?://\\S+", url_text)
    if not urls:
        await update.message.reply_text("No valid URLs found. Include at least one https:// link.")
        return

    if content_type not in ("article", "review", "guide"):
        await update.message.reply_text(
            f"Invalid content type: <b>{content_type}</b>\\nUse: article, review, or guide",
            parse_mode="HTML",
        )
        return

    valid_cats = REWRITE_REVIEW_CATS if content_type == "review" else REWRITE_ARTICLE_CATS
    matched_cat = None
    for cat in valid_cats:
        if cat.lower() == category.lower():
            matched_cat = cat
            break
    if not matched_cat:
        cats_str = ", ".join(valid_cats)
        await update.message.reply_text(
            f"Invalid category: <b>{category}</b>\\n\\nValid: {cats_str}",
            parse_mode="HTML",
        )
        return

    ack = await update.message.reply_text(
        f"Rewriting from {len(urls)} URL(s)...\\n\\n"
        f"<b>Type:</b> {content_type}\\n"
        f"<b>Category:</b> {matched_cat}\\n"
        f"<b>URLs:</b> {len(urls)}\\n\\n"
        f"This may take 60-90 seconds.",
        parse_mode="HTML",
    )

    try:
        result = rewrite_from_urls(content_type, matched_cat, urls)
        title = result.get("title", "Untitled")
        link = result.get("link", "")
        rating_line = ""
        if content_type == "review":
            rating_line = f"\\nRating: {result.get('rating', '?')}/5"

        await update.message.reply_text(
            f"<b>Rewrite Published!</b>\\n\\n"
            f"<b>{title}</b>\\n"
            f"Type: {content_type.title()}\\n"
            f"Category: {matched_cat}{rating_line}\\n"
            f"Sources: {len(urls)} URL(s)\\n\\n"
            f'<a href="{link}">Read it here</a>',
            parse_mode="HTML",
            disable_web_page_preview=False,
        )
    except Exception as exc:
        logger.exception("Rewrite failed")
        await ack.reply_text(f"Rewrite failed:\\n{exc}")

'''

main_marker = (
    "# ---------------------------------------------------------------------------\n"
    "# Main\n"
    "# ---------------------------------------------------------------------------"
)
content = content.replace(main_marker, rewrite_handler + main_marker)

# 3. Register the command handler
old_guide = '    app.add_handler(CommandHandler("guide", cmd_guide))'
new_guide = old_guide + '\n    app.add_handler(CommandHandler("rewrite", cmd_rewrite))'
content = content.replace(old_guide, new_guide)

# 4. Update help text
old_help = '<code>/review Samsung Galaxy S26 Ultra | Smartphones</code>"'
new_help = (
    old_help + '\n'
    '        "\\n\\n"\n'
    '        "<b>Rewrite from URL:</b>\\n"\n'
    '        "<code>/rewrite article | Category | https://url1 https://url2</code>\\n"\n'
    '        "<code>/rewrite review | Category | https://url1</code>\\n"\n'
    '        "<code>/rewrite guide | Category | https://url1 https://url2</code>"'
)
content = content.replace(old_help, new_help)

with open(BOT_FILE, "w") as f:
    f.write(content)

print("SUCCESS - /rewrite command added to bot")
