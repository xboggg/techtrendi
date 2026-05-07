# TechTrendi Session Documentation — April/May 2026

**Session period:** Late April – May 7, 2026  
**VPS:** 144.91.71.106  
**Site:** techtrendi.com  
**GitHub:** https://github.com/xboggg/trenditrendi.git  

---

## 1. Content Published

### News Articles (posted to /news/)

| Title | Slug | Category |
|-------|------|----------|
| Spain Dismantles $4.7M Manga Piracy Platform Using Crypto Cold Wallet Tracing | `spain-manga-piracy-crypto-cold-wallet-bust` | Cybersecurity |
| Meta Cuts 8,000 Jobs — 10% of Workforce — to Fund $135B AI Push | `meta-layoffs-8000-jobs-ai-2026` | Big Tech |
| Chinese Courts Rule Companies Cannot Legally Fire Workers Just to Replace Them With AI | `china-court-ruling-ai-worker-replacement-illegal-2026` | AI Tech |

**Note:** Manga piracy article was originally posted to blog (articles table) in error. It was deleted from the blog and republished to the news table with user's Whisk image at `/images/articles/Whisk_eec0dc020a61254b3d14ae6232c5f23fdr.jpeg`.

### Blog Article Series (posted to /blog/)

**50-Item Cybersecurity Awareness Series — 5 articles:**

| Part | Title | Slug | Items Covered |
|------|-------|------|--------------|
| 1 | 10 Real-Life Scam Teardowns Every Family in Ghana Needs to Read Right Now | `real-life-scam-teardowns-ghana-cybersecurity-guide` | 1–10 |
| 2 | 10 Password and Account Mistakes That Are Silently Costing People Money | `password-account-mistakes-cybersecurity-guide-2026` | 11–20 |
| 3 | 10 Smart Home and Physical Security Risks Most People Do Not Know About | `smart-home-physical-security-risks-cybersecurity-guide` | 21–30 |
| 4 | 10 Travel and Public Space Security Traps You Need to Avoid in 2026 | `travel-public-space-cybersecurity-traps-2026` | 31–40 |
| 5 | 10 Ways to Lock Down Your Identity and Personal Data Before It Is Too Late | `identity-data-protection-cybersecurity-guide-2026` | 41–50 |

All 5 articles: 12 min read, Security category, fully cross-linked, Ghana-specific context, TechTrendi visual styling (gradient HRs, purple callout boxes, gold tip boxes, blockquotes).

---

## 2. New Tool — Cybersecurity Playbook

**URL:** `techtrendi.com/tools/cybersecurity-playbook`  
**File:** `src/pages/tools/CybersecurityPlaybook.tsx`  
**Route added in:** `src/App.tsx`

**Features:**
- All 50 cybersecurity threats in one interactive page
- Search across titles, summaries, explanations, and defences
- 5 category filter pills (All, Scam Teardowns, Password & Accounts, Smart Home & Physical, Travel & Public Safety, Identity & Data)
- Paginated — 10 items per page with prev/next navigation
- Each item expands to show: How It Works + green Defence box + link to full article
- Article series grid at bottom linking all 5 blog posts
- Dark gradient hero with stats (50 threats, 5 categories, 60 min, GHS 0 cost)
- SEO head with Ghana/Africa cybersecurity keywords

---

## 3. Bug Fixes & Image Repairs

### Duplicate Cover Images
**Problem:** 7 blog articles shared the same Pexels photo (`photo-546819` — a code screenshot) from the old article generator.  
**Fix:** Script `C:/tmp/fix_duplicate_images.py` ran on VPS. Each article given unique contextually relevant image:

| Article ID | Title | Pexels Query Used |
|------------|-------|-------------------|
| 1582b833 | Gaming PC Three Budgets | gaming PC build setup rgb desktop monitor |
| 5765a008 | Affiliate Marketing | blogger laptop affiliate marketing online income |
| 52edb814 | Hidden Job Market | job networking career professional handshake |
| c64138c6 | Blue Light Glasses | blue light glasses computer screen eye protection |
| 4da29961 | AI Project Tutorials | artificial intelligence machine learning beginner |
| d4051417 | Smart Home Devices | smart home devices tablet automation hub living room |
| d3bee8a4 | Morning Routine Myth | morning routine coffee sunrise productive workspace |

### Image Integrity Checker — Critical Fix
**Problem:** `/images/articles/` was incorrectly listed in `KNOWN_BROKEN_PREFIXES` inside `/opt/tech-news/image_integrity_check.py`. This directory EXISTS on VPS and contains 9 manually assigned Whisk images. The checker was replacing these legitimate images with Pexels images.

**Fix:** Removed `/images/articles/` from `KNOWN_BROKEN_PREFIXES`.

**Current KNOWN_BROKEN_PREFIXES:**
```python
KNOWN_BROKEN_PREFIXES = [
    'https://images.unsplash.com',
    'https://db.techtrendi.com/storage',
]
```

**Additional fix:** Added duplicate image detection — checker now identifies articles sharing the same external URL and fixes them.

### Whisk Images in /images/articles/
9 user-created Whisk images stored at `/var/www/techtrendi/images/articles/`:
- `1776693346...Whisk_a773a8e1...webp`
- `1776693481...Whisk_zudmkrjm...webp`
- `1776693604...Whisk_ecd6baf8...webp`
- `1776694037...Whisk_ca1adebd...webp`
- `1776694099...Whisk_fd704d66...webp`
- `1776694185...Whisk_669e365a...webp`
- `1776694649...Whisk_e54753f8...webp`
- `Whisk_eec0dc020a61254b3d14ae6232c5f23fdr.jpeg` (manga piracy article image)

**NEVER include `/images/articles/` in broken image prefixes.**

---

## 4. SEO — Prerender.io Integration

### Root Cause of Indexing Failure
TechTrendi is a React SPA (Vite). Every page served to Googlebot returned:
```html
<body><div id="root"></div></body>
```
Google could not read any content. Despite sitemap.xml being submitted in February 2026, pages were not indexed because Google received empty HTML on every crawl.

### Solution — Prerender.io
**Account:** itdeshop@gmail.com  
**Token:** `1EdcYcFlucdH1vVxqYgP`  
**Plan:** 30-day free trial (started May 7, 2026)  
**Integration:** nginx on VPS 144.91.71.106

### nginx Configuration
**File:** `/etc/nginx/sites-enabled/techtrendi.com`  
**Backup:** `/etc/nginx/sites-enabled/techtrendi.com.bak` (removed after successful test)

**Bot routing logic:**
- **Search engine bots** (Googlebot, Bingbot, DuckDuckBot, Applebot, Yandex, Baidu) → Prerender.io (full JS-rendered HTML)
- **Social media bots** (WhatsApp, Facebook, Twitter, Telegram, LinkedIn, Discord, Pinterest) → og-meta.php (fast OG tag responses, unchanged)
- **Normal visitors** → React SPA (unchanged)

**Key nginx snippet added:**
```nginx
set $prerender 0;
if ($http_user_agent ~* "googlebot|google-inspectiontool|adsbot-google|mediapartners-google|bingbot|duckduckbot|applebot|yandexbot|baiduspider") {
    set $prerender 1;
}
if ($http_user_agent ~* "prerender") {
    set $prerender 0;
}

location @prerender {
    proxy_pass https://service.prerender.io;
    proxy_set_header X-Prerender-Token 1EdcYcFlucdH1vVxqYgP;
    proxy_set_header Accept-Encoding "";
    proxy_set_header Host techtrendi.com;
    rewrite .* /https://techtrendi.com$request_uri? break;
}
```

**Verification test result:**
```bash
curl -H "User-Agent: Googlebot/2.1" https://techtrendi.com/blog/real-life-scam-teardowns-ghana-cybersecurity-guide
# Returns: <title>10 Real-Life Scam Teardowns Every Family in Ghana Needs to Read Right Now | TechTrendi</title>
# Previously returned: <div id="root"></div>
```

### Prerender.io Dashboard Setup
- Sitemap `https://techtrendi.com/sitemap.xml` imported and **activated** (toggle ON)
- Google Search Console connected
- Automated queue processes pages as Googlebot crawls them

---

## 5. Sitemap Update

**Generator:** `/opt/tech-news/generate_sitemap.py`  
**Output:** `/var/www/techtrendi/sitemap.xml`  
**Schedule:** Daily at 10:00 PM GMT (existing cron)

**Added to static pages list:**
- `/tools/cybersecurity-playbook` (priority 0.8, weekly)

**Sitemap now contains:**
| Content | Count |
|---------|-------|
| Static pages + tools | 146 |
| Blog articles (`/blog/slug`) | 216 |
| News items (`/news/slug`) | 653 |
| Reviews (`/reviews/slug`) | 87 |
| **Total** | **1,115 URLs** |

**Run sitemap manually:**
```bash
cd /opt/tech-news && python3 generate_sitemap.py
```

---

## 6. Google Search Console Actions

**Sitemap submitted:** February 23, 2026 — `/sitemap.xml` — Status: Success, 1,076 pages discovered  
**Problem:** Pages discovered but not indexed due to empty HTML (pre-Prerender.io)

**Pages manually submitted for indexing (May 7, 2026) via URL Inspection tool:**
1. `techtrendi.com/blog/real-life-scam-teardowns-ghana-cybersecurity-guide`
2. `techtrendi.com/blog/password-account-mistakes-cybersecurity-guide-2026`
3. `techtrendi.com/blog/smart-home-physical-security-risks-cybersecurity-guide`
4. `techtrendi.com/blog/travel-public-space-cybersecurity-traps-2026`
5. `techtrendi.com/blog/identity-data-protection-cybersecurity-guide-2026`
6. `techtrendi.com/tools/cybersecurity-playbook`
7. `techtrendi.com/news/meta-layoffs-8000-jobs-ai-2026`
8. `techtrendi.com/news/china-court-ruling-ai-worker-replacement-illegal-2026`

**Errored sitemap entries (harmless — submitted page URLs as sitemaps in error, cannot be deleted):**
- `/techtrendi.com/blog/real-life-scam-teardowns-ghana-cybersecurity-guide`
- `/techtrendi.com/blog/password-account-mistakes-cybersecurity-guide-2026`
- `/techtrendi.com/blog/smart-home-physical-security-risks-cybersecurity-guide`
- `/techtrendi.com/tools/cybersecurity-playbook`
- `/tools/cybersecurity-playbook`

These do not affect indexing. Google ignores them.

---

## 7. AdSense Status

AdSense was rejected weeks prior to this session. Root cause: AdSense review bots saw empty HTML (same issue as Googlebot). Now that Prerender.io serves full rendered HTML to all crawlers, reapplication is recommended in approximately 7 days to allow Google time to crawl and index several pages first.

---

## 8. Content Strategy Discussion — CyberSafe Africa Brand

Discussed spinning the 5-part cybersecurity series into a dedicated social media brand (faceless video content) that feeds back to TechTrendi.

**Format:** Faceless videos — stock b-roll + AI voiceover (ElevenLabs) + text overlays (CapCut)  
**Platforms priority:** TikTok → YouTube Shorts → Facebook → Instagram Reels → Twitter/X  
**Content:** Each of the 50 items = 1 short video (30–60 seconds)  
**Brand concept:** Dedicated brand (e.g. CyberSafe Africa, ScamProof GH, The Scam Files) separate from TechTrendi, drives traffic back to techtrendi.com  
**Status:** Brand name not yet finalised. Production not yet started.

---

## 9. Git Sync Status (May 7, 2026)

| Item | Status |
|------|--------|
| Local source ↔ GitHub | Synced (commit `caef70a`) |
| Local build hash | `index-C7gM0YjH.js` |
| Live VPS hash | `index-C7gM0YjH.js` |
| Live ↔ Local build | Synced |

**Latest commit:** `caef70a` — Add Cybersecurity Playbook tool + route

---

## 10. Key File Locations

### VPS (144.91.71.106)
| File/Directory | Purpose |
|----------------|---------|
| `/var/www/techtrendi/` | Live site files |
| `/var/www/techtrendi/sitemap.xml` | Live sitemap (1,115 URLs) |
| `/var/www/techtrendi/images/articles/` | User Whisk images — DO NOT treat as broken |
| `/var/www/techtrendi/images/news/` | Auto-downloaded Pexels images |
| `/etc/nginx/sites-enabled/techtrendi.com` | nginx config with Prerender.io |
| `/opt/tech-news/generate_sitemap.py` | Sitemap generator |
| `/opt/tech-news/image_integrity_check.py` | Nightly image checker (02:30 UTC) |
| `/opt/tech-news/tech_news_generator.py` | International news pipeline |
| `/opt/tech-news/ghana_tech_news.py` | Ghana/Africa news pipeline |
| `/opt/tech-news/run_auto_review.py` | Auto review generator |
| `/opt/tech-news/.env` | All API keys and config |

### Local
| File/Directory | Purpose |
|----------------|---------|
| `src/pages/tools/CybersecurityPlaybook.tsx` | Playbook tool component |
| `src/App.tsx` | Routes (includes cybersecurity-playbook) |

---

## 11. Automated Content Schedule (unchanged)

| Time (GMT) | Script | Output |
|------------|--------|--------|
| 8:00 AM | International Tech News | 3 articles |
| 12:00 PM | Ghana/Africa News | 3 stories |
| 4:00 PM | International Tech News | 3 articles |
| 4:00 PM (Fri) | Ghana Friday Roundup | 1 digest |
| 6:00 PM | Ghana/Africa News | 3 stories |
| 7:00 AM (Mon/Thu) | Product Reviews | 1 review |
| 10:00 PM | Sitemap regeneration | 1,115+ URLs |
| 02:30 AM | Image integrity check | Auto-fix broken images |

**Total automated posts: ~12/day**
