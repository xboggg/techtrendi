# TechTrendi News & Content Automation — Full Documentation

**Server:** VPS 144.91.71.106  
**Scripts location:** `/opt/tech-news/`  
**Last updated:** 1 November 2026 (Ghana news sources, health check, second daily run, cover pictures, Telegram Change picture button)

---

## Overview

TechTrendi runs three automated content pipelines that publish news, articles, and reviews to `techtrendi.com` without manual intervention. All pipelines are powered by Claude AI (Anthropic), fetch images from Pexels, and send Telegram notifications on every publish.

---

## 1. Ghana & Africa Tech News — `ghana_tech_news.py`

> **Rebuilt 1 November 2026.** Edmund found big Ghana stories (MTN's GH¢7.75bn profit, the Bank of
> Ghana AI directive, Shirley Frimpong-Manso on AI and film) on Google News that TechTrendi never
> published. Cause: **8 of the 17 feeds had died quietly** (moved, removed, or blocking bots) and the
> script just skipped them, so for weeks it chose from ~30 stories every 4 days instead of hundreds.
> Everything below describes the system after the fix.

### What it does
Reads 14 Ghana/Africa news sources, keeps tech headlines, has Claude score them, keeps **one headline per
real-world event** that is not already covered, writes an original article from the **full source
article**, makes a fitting cover picture, publishes to the `news` table (category **Africa Tech**), and
sends the picture to the TechTrendi Telegram group with **Change picture / Keep** buttons.

### Schedule (crontab on 144)
| Run | Time | Days |
|-----|------|------|
| Midday run | 12:00 Berlin server time (≈ 11:00 Ghana in winter, 10:00 in summer) | every day |
| Evening run (added 1 Nov 2026) | **17:30 Ghana time** (`CRON_TZ=Africa/Accra` block at the end of crontab) | every day |
| Friday roundup (`--friday`) | 16:00 Berlin server time | Fridays |
| Source health check (`feed_health.py`) | **07:15 Ghana time** | every day |

### Posts per run
- Up to **3 stories** per run (`MAX_DAILY_STORIES`) → up to **6 a day**.
- First story needs score 7+, the others 8+. At most **2 stories from the same source** per run.
- The run keeps spare candidates: if a story's source article cannot be opened, it moves on to the next.

### News sources (`RSS_FEEDS`, checked 1 Nov 2026)
| Source | Type | Notes |
|--------|------|-------|
| MyJoyOnline | RSS | whole-news site → only tech-looking headlines kept |
| Citinewsroom | **Google News sitemap** (`/sitemap-news.xml`) | Citi switched its RSS feed off |
| 3News, Adom Online, High Street Journal | RSS | whole-news sites → tech headlines only |
| TechAfrica News, TechLabari, JBKlutse | RSS | Ghana tech sites |
| TechCabal, Rest of World | RSS | Africa; Rest of World needs the old bot User-Agent (`"agent"` in its entry) |
| Google Ghana Telecoms / Ghana Tech / Ghana Finance Tech / Africa Tech | Google News search | limited to fresh news with `when:1d` (`when:7d` for the Friday roundup); covers MTN, Telecel, AirtelTigo, MoMo, NCA, Bank of Ghana |

**Switched off (kept as a comment in the code so nobody re-adds them blind):** Citinewsroom RSS (redirects to
homepage), GhanaWeb + GhanaWeb Tech (404), NewsGhana + TechPoint Africa (403, block bots), Pulse Ghana (404),
IT News Africa (empty), Disrupt Africa (stuck on January 2024).

**Google News links cannot be opened from the server** ("too many redirects"; the `googlenewsdecoder`
package also fails). Direct sources are read first, so a story seen in both keeps the real link. A story
known only from Google News is skipped unless its article can be opened — **articles are never written
from a headline alone** (that invented details).

### How stories are chosen
1. **Tech filter** (free): headlines from whole-news sites must match `TECH_WORDS` (AI, digital, MTN, MoMo, Bank of Ghana, fintech, cyber, 5G, …).
2. **Claude scores** each headline 0–10, in batches of 40 (`SCORE_BATCH`) — one big call ran out of room and returned broken JSON.
3. **One headline per event** (`pick_distinct_stories`): Claude sees the top 30 plus every title published in the last 72 hours, and keeps one headline per real-world event that is not already covered (it dropped three TraffiTech-GH headlines and yesterday's TraffiTech strike story).
4. Older word-overlap checks stay as a backup; the "2 shared words" check only looks at the **last 4 days** (a month-old Kenya "mobile money" title once blocked the MTN profit story).
5. Article writing retries up to **3 times** if Claude returns broken JSON (lost a story on 30 Oct 2026).

### Publish one chosen story by hand
When Edmund spots a story the run missed:
```bash
cd /opt/tech-news
/opt/tech-news/venv/bin/python -u ghana_tech_news.py \
  --link "https://www.citinewsroom.com/2026/10/bog-to-introduce-ai-directive-for-financial-sector/" \
  --title "BoG to introduce AI directive for financial sector" >> /var/log/techtrendi-ghana-news.log 2>&1
```
It applies the same "already covered" checks. Other options: `--dry-run` (writes the article but publishes
nothing and, since 1 Nov 2026, does **not** mark stories as posted), `--hours 48 --max 3` (catch-up run).

### Friday Roundup (`--friday` flag)
Every Friday at 16:00 server time it collects the week's top stories (past 7 days) and writes one
long-form digest, **"Africa Tech Weekly"**, published like a normal news article.

### Cover pictures — `cover_picker.py` (rebuilt 1 Nov 2026)
The old code mapped a few keywords to a fixed Pexels search and took the **first** result without looking
(the MTN profit story got a white man in a European office). Edmund was replacing covers by hand in
ChatGPT. Now, in this order:
1. **AI picture from Cloudflare Workers AI**: Claude writes an `image_prompt` with the article (a Ghana
   scene; never logos, writing, money, or real people's faces). Model `CF_IMAGE_MODEL` (default
   `@cf/black-forest-labs/flux-2-klein-4b`, 1344×768). **Claude then looks at the picture** and rejects
   garbled writing, broken hands/faces, or a non-Ghana scene. Two tries.
2. **Stock photo chosen by looking**: Claude writes 3 Pexels searches, looks at ~16 thumbnails and picks one
   (strict: people must clearly look West African; no brand text such as SONY on a camera). It may pick none.
3. **Old keyword Pexels search** as the very last resort, so a story never goes out without a picture.

All covers are resized to 1200px and kept **under 300 KB** (WhatsApp previews break above that) in
`/var/www/techtrendi/images/news/` — AI files are named `ghana-tech-ai-<slug>-<time>.jpg`, stock photos
`ghana-tech-px<id>.jpg`.

**Cloudflare free allowance:** 10,000 "neurons" a day, reset 00:00 UTC (midnight Ghana). On the free plan
it **fails instead of charging** when used up, and the picker falls back to stock photos. Klein 4B ≈ 160
neurons a picture (~60/day). Do **not** switch to `@cf/leonardo/lucid-origin` — about 3,000–4,000 neurons a
picture (three test pictures used a whole day). The Gemini key has **no free image quota** (429).
Cloudflare token: "TechTrendi news pictures" (Workers AI read + edit only), created 1 Nov 2026.

### Telegram: picture + "Change picture" button
Each published article is sent to the TechTrendi group (`@technews_highlight_bot`) as the **cover picture**
with this caption and two buttons:
```
🌍 AFRICA TECH: [Article Title]
📰 https://techtrendi.com/news/[slug]
📂 Category: Africa Tech

Picture OK?          [🔄 Change picture] [✅ Keep]
```
- **Change picture** → `article_bot.py` (`on_cover_button`) calls `cover_picker.replace_cover`: makes a new
  cover the same way (asking for a different camera angle), updates `news.cover_image`, deletes that
  article's social-preview cache file in `/var/www/techtrendi/og-cache/`, and swaps the picture in the
  message. The old picture file is **kept** on the server. Takes ~10–40 seconds.
- **Keep** → removes the buttons.
- Only the authorised TechTrendi group can use the buttons. Buttons carry a 12-character key; the article
  details behind it are kept in `/opt/tech-news/.cover_requests.json` (newest 300).
- The website shows the new cover straight away (pages read the database); Google's copy updates on the
  next site build (daily 11:30 UTC). WhatsApp/Facebook may keep an old preview for links already shared.
- If the photo can't be sent, a text-only message goes out instead.

### Source health check — `feed_health.py` (added 1 Nov 2026)
Every day at 07:15 Ghana time it reads every source and checks that news went out. It sends a Telegram
message when a problem **appears**, when it is **fixed**, and a reminder every **Monday** while it lasts:
- a source can't be read, gives no stories, or its newest story is older than **5 days**;
- no Ghana/Africa news (The Rundown not counted) in the last **36 hours**.

Print the table without sending anything: `cd /tmp && /opt/tech-news/venv/bin/python /opt/tech-news/feed_health.py --report`.
State: `/opt/tech-news/.feed_health_state.json`. Log: `/var/log/techtrendi-feed-health.log`.

### Key files
| File | Purpose |
|------|---------|
| `/opt/tech-news/ghana_tech_news.py` | Main script |
| `/opt/tech-news/cover_picker.py` | Cover pictures + Change picture logic |
| `/opt/tech-news/feed_health.py` | Daily source health check |
| `/opt/tech-news/article_bot.py` | Handles the Change picture / Keep buttons |
| `/var/log/techtrendi-ghana-news.log` | Run logs |
| `/opt/tech-news/.ghana_news_posted.json` | 48-hour "recently posted" tracker |
| `/opt/tech-news/.pexels_used_ids.json` | Stock photos already used (never reused) |
| `/opt/tech-news/.cover_requests.json` | Article details behind the picture buttons |
| `/var/www/techtrendi/images/news/` | Cover pictures |

---

## 2. International Tech News — `tech_news_generator.py`

### What it does
Fetches headlines from major international tech publications, generates original articles via Claude across rotating topic niches, and publishes to the `news` table. Also generates a **video script** and **social media posts** for each article.

### Schedule
| Run | Time (GMT) | Days |
|-----|-----------|------|
| Morning run | 8:00 AM | Mon – Sun |
| Afternoon run | 4:00 PM | Mon – Sun |

### Posts per run
- **3 articles** per run → **6 articles/day**

### RSS Feed Sources
The Verge, TechCrunch, Ars Technica, Wired, MIT Technology Review, 9to5Mac, 9to5Google, IGN, and others — covering:

| Niche | Coverage |
|-------|---------|
| AI & Machine Learning | OpenAI, Google AI, LLMs |
| Big Tech | Apple, Google, Microsoft, Meta, Amazon |
| Cybersecurity | Breaches, vulnerabilities, privacy |
| Gadgets & Consumer Tech | Devices, accessories |
| Gaming | Console, PC, mobile gaming |
| Space Tech | NASA, SpaceX, satellites |
| Crypto & Web3 | Bitcoin, Ethereum, DeFi |
| EVs & Green Tech | Electric vehicles, clean energy |
| Startups & Funding | VC rounds, acquisitions |
| Health Tech & Biotech | Medical devices, biotech |
| Mobile & Smartphones | Phone releases, OS updates |

Each run rotates across niches so no single topic dominates.

### What Claude generates per article
- Full HTML article (3–5 min read)
- Video script with scenes and narration for TikTok/YouTube Shorts
- Social media posts: Twitter/X, LinkedIn, Facebook
- Featured image prompt
- Hashtags

### Cover Images
- Source: **Pexels API** with category-specific queries
- Fallback: Unsplash category images if Pexels returns nothing
- No Africa filter applied (international stories use neutral queries)

### Telegram Notifications
Sends **three separate messages** per article to Telegram:

**Message 1 — Article:**
```
BLOG ARTICLE FOR TECHTRENDI.COM
Title: [title]
Slug: [slug]
Category: [category]
Meta Description: [description]
Status: PUBLISHED / FAILED

ARTICLE: [full article content]
Featured Image Prompt: [prompt]
```

**Message 2 — Video Script:**
```
VIDEO SCRIPT - [NICHE]
[headline]
HOOK: [hook text]
FULL SCRIPT: [script]
Duration: ~[X]s  Viral: [score]
SCENE 1 [0:00] ...
Hashtags: #tech #ai ...
```

**Message 3 — Social Posts:**
```
SOCIAL MEDIA POSTS
Twitter/X: [tweet]
LinkedIn: [post]
Facebook: [post]
```

### Key files
| File | Purpose |
|------|---------|
| `/opt/tech-news/tech_news_generator.py` | Main script |
| `/opt/tech-news/run.sh` | Shell wrapper (loads .env, activates venv) |
| `/opt/tech-news/logs/generator.log` | Run logs |

---

## 3. Product Reviews — `run_auto_review.py`

### What it does
Automatically selects a tech product, generates a full honest review via Claude, and publishes to the `reviews` table.

### Schedule
| Run | Time (GMT) | Days |
|-----|-----------|------|
| Review run | 7:00 AM | Monday & Thursday |

### Posts per run
- **1 review** per run → **2 reviews/week**

### How it picks products
1. Checks existing reviews to avoid duplicates
2. Pulls candidate products from review RSS feeds (TechRadar, The Verge Reviews, 9to5Mac, 9to5Google)
3. Rotates across review categories: Smartphones, Laptops, Audio, Cameras, Smart Home, etc.

### Telegram Notifications
Sends on failure only:
```
Auto Review FAILED: [product name]
```
Success is logged but not messaged to Telegram.

### Key files
| File | Purpose |
|------|---------|
| `/opt/tech-news/run_auto_review.py` | Runner script |
| `/opt/tech-news/review_generator.py` | Core review generation |
| `/opt/tech-news/run_review.sh` | Shell wrapper |
| `/opt/tech-news/logs/review_gen.log` | Run logs |

---

## 4. Telegram Bot — `article_bot.py`

### What it does
A persistent Telegram bot that lets you generate and publish articles or reviews **on demand** without SSH access.

### Service
Runs as a systemd service: `techtrendi-article-bot`

### Commands
| Command | What it does |
|---------|-------------|
| `/article <topic> \| <category>` | Generate and publish article on the topic in specified category |
| `/article <topic>` | Generate article, auto-detect category |
| `/review <product> \| <category>` | Generate review for product in specified category |
| `/review <product>` | Generate review, auto-detect category |
| `/reviewstatus` | Show review stats |
| `/help` | Show all commands |
| 🔄 **Change picture** / ✅ **Keep** buttons | Under each Ghana/Africa news message — swap or accept the cover (see section 1). Added 1 Nov 2026. |

**Examples:**
```
/article Why Foldable Phones Are Failing | Phones
/article Ghana's Digital ID System Explained
/review Samsung Galaxy S26 Ultra | Smartphones
```

### Telegram channel
- **Bot token:** `<REDACTED>`
- **Chat ID:** `-1003595231315`

---

## 5. On-Demand Article Generator — `generate_article_on_demand.py`

### What it does
SSH-based CLI tool to generate a single article immediately without waiting for a cron run.

### Usage (via SSH)
```bash
ssh root@144.91.71.106
python3 /opt/tech-news/generate_article_on_demand.py "Topic Here" "Category"
```

**Example:**
```bash
python3 /opt/tech-news/generate_article_on_demand.py "Ghana's 1M Coders Initiative" "AI Tech"
```

---

## 6. Admin Panel AI Generator

### What it does
A "Generate Article" button (sparkles icon ✨) inside the TechTrendi admin panel at `/admin/articles` triggers article generation from the browser.

### How it works
- Calls the Article API at `https://db.techtrendi.com/api/generate-article`
- API runs as systemd service `techtrendi-article-api` on port `5111`
- Proxied via nginx at `/api/generate-article`
- Auth: Supabase service_role key as Bearer token
- Script: `/opt/tech-news/article_api.py`

---

## 7. Sitemap Generator — `generate_sitemap.py`

### What it does
Regenerates `sitemap.xml` to include all newly published news, articles, tools, and reviews.

### Schedule
Runs daily at **10:00 PM GMT** — after all content pipelines have finished for the day.

### Key file
| File | Purpose |
|------|---------|
| `/opt/tech-news/generate_sitemap.py` | Generator script |
| `/var/log/techtrendi-sitemap.log` | Run logs |
| `/var/www/techtrendi/sitemap.xml` | Output file |

---

## Full Daily Schedule (GMT)

> Updated 1 Nov 2026. Server 144 runs on **Berlin time**; jobs inside a `CRON_TZ=Africa/Accra` block run on Ghana time.

| Time | Script | Output |
|------|--------|--------|
| 05:00 Ghana | The Rundown (`daily_rundown.py`) | 1 world-tech briefing |
| 07:15 Ghana | Source health check (`feed_health.py`) | Telegram alert only if something is wrong |
| 12:00 Berlin | Ghana/Africa News | up to 3 stories |
| 17:30 Ghana | Ghana/Africa News (second run, added 1 Nov 2026) | up to 3 stories |
| 16:00 Berlin (Fri) | Ghana Friday Roundup | 1 digest |
| 10:00 Berlin (Mon/Wed/Fri) | `daily_article_gen.py` | 1 blog article |

Switched off: International Tech News `run.sh` (replaced by The Rundown, June 2026), product reviews
(discontinued 21 Jun 2026), the 22:00 `generate_sitemap.py` (the site build's sitemap is canonical).

---

## Telegram Channel Summary

| Event | Who sends | Format |
|-------|-----------|--------|
| Ghana/Africa article published | `ghana_tech_news.py` | Cover picture + title + URL + **Change picture / Keep** buttons |
| A news source broke / no news went out | `feed_health.py` | List of problems (daily check, Monday reminder) |
| International article published | `tech_news_generator.py` | Full article + video script + social posts |
| Review failed | `run_auto_review.py` | Failure alert |
| On-demand article (bot) | `article_bot.py` | Confirmation + link |

---

## Environment Variables (`.env` at `/opt/tech-news/.env`)

| Variable | Used by |
|----------|---------|
| `ANTHROPIC_API_KEY` | All AI generation scripts |
| `PEXELS_API_KEY` | Image fetching |
| `SUPABASE_URL` | All DB operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Publishing to Supabase |
| `TELEGRAM_BOT_TOKEN` | All Telegram notifications |
| `TELEGRAM_CHAT_ID` | All Telegram notifications |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | AI cover pictures (`cover_picker.py`) — Workers AI only |
| `CF_IMAGE_MODEL` (optional) | Picture model; default `@cf/black-forest-labs/flux-2-klein-4b` |

---

## Troubleshooting

### No articles being posted
1. Check logs: `tail -50 /var/log/techtrendi-ghana-news.log`
2. Check international: `tail -50 /opt/tech-news/logs/generator.log`
3. Verify Anthropic API key has credits: check usage at console.anthropic.com
4. Test manually: `cd /opt/tech-news && source .env && source venv/bin/activate && python ghana_tech_news.py`

### A big Ghana story was missed
1. Run the source check: `cd /tmp && /opt/tech-news/venv/bin/python /opt/tech-news/feed_health.py --report`
2. Look in the log for the run: did the story appear as a `Candidate`, or `Dropped (same event or already covered)`?
3. Publish it by hand with `--link ... --title ...` (section 1).

### Wrong or bad cover picture
- Tap **🔄 Change picture** under the article's Telegram message.
- In the log, `AI picture try N: rejected (...)` shows why an AI picture was refused; `today's free Cloudflare allowance is used up` means stock photos were used.
- Old fix (April 2026, still in the last-resort search): `" Africa"` is appended to Pexels queries.

### Duplicate stories
- 48-hour tracker: `/opt/tech-news/.ghana_news_posted.json`
- If it gets corrupted: back it up, then `echo "[]" > /opt/tech-news/.ghana_news_posted.json`
- Same event from several sites is handled by `pick_distinct_stories` (Claude), see section 1.

### Telegram not receiving messages
- Check bot token and chat ID in `.env`
- Verify bot is not blocked from the channel
- Check logs for `Telegram send failed` entries

### Sitemap not updating
- Runs at 10:00 PM GMT daily
- Force run: `python3 /opt/tech-news/generate_sitemap.py`
- Check: `curl -s https://techtrendi.com/sitemap.xml | head -20`

---

## 5. Image Integrity Checker — `image_integrity_check.py`

### What it does
Scans every article and review in the database for broken cover images, auto-fixes them with contextually relevant Pexels images, and sends a Telegram report summarising what was fixed or could not be repaired.

### Schedule
| Run | Time (UTC) | Days |
|-----|-----------|------|
| Nightly check | 02:30 AM | Mon – Sun |

### What counts as broken
| Condition | Reason |
|-----------|--------|
| Empty or null image field | No image assigned |
| Path starts with `/images/articles/` | Old cPanel directory never migrated to VPS 144 |
| URL starts with `https://images.unsplash.com` | Unsplash blocks hotlinking since migration |
| URL starts with `https://db.techtrendi.com/storage` | Self-hosted Supabase storage is not publicly accessible from browsers |
| Local `/images/…` path — file missing on disk | File was never copied from old cPanel server |
| External HTTP URL returns non-200 status | Link rot or server block |

### Fix process (per broken image)
1. **Supabase storage rescue** (articles only): if the old URL is a Supabase storage link, the script tries to download it directly via the internal API. If the file is still there and > 5 KB, it saves it locally and uses that.
2. **Pexels fallback**: if rescue fails, the script maps the article/review title to a relevant Pexels search query using 35+ topic-pattern rules, downloads the best result, compresses it to JPEG (max 350 KB), saves to `/var/www/techtrendi/images/news/`, and updates the database record.

### Title-to-query pattern rules (examples)
| Title contains | Pexels query used |
|----------------|------------------|
| "authentication", "2FA" | smartphone security authentication login |
| "personal brand" | personal branding professional entrepreneur |
| "RAM shortage", "memory price" | computer ram memory chip circuit board |
| "myopia", "eye strain", "screen child" | child reading book parent screen time |
| "electric vehicle", "EV charg" | electric vehicle charging station car |
| *(no match)* | Meaningful words extracted from title (up to 4) |

### Telegram report format
Sent at end of every run **only if** at least one image was broken:
```
🖼 TechTrendi Image Check

✅ Fixed 3 broken image(s)
  • [article] Complete Guide to Phone Cases and Scr...
  • [review] Samsung Galaxy S25 Ultra

❌ 1 could not be fixed:
  • [article] Some Article With No Matching Image
```
If all images are healthy, no Telegram message is sent.

### Key files
| File | Purpose |
|------|---------|
| `/opt/tech-news/image_integrity_check.py` | Main checker script |
| `/opt/tech-news/logs/image_integrity.log` | Run logs |
| `/var/www/techtrendi/images/news/` | Fixed images saved here |

### Manual run
```bash
cd /opt/tech-news && /opt/tech-news/venv/bin/python -u image_integrity_check.py
```

### Troubleshooting
- **Script crashes on import**: ensure Pillow is installed in venv — `pip install Pillow`
- **Pexels returning no results**: check `PEXELS_API_KEY` in `.env` and monthly quota at pexels.com/api
- **Images fixed in DB but not showing**: Cloudflare cache — wait ~60 seconds or purge cache for specific URLs
- **"FAILED to fix" for an article**: Pexels returned a result but the image download timed out — will retry on next nightly run
