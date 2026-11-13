# TechTrendi Platform — Complete Technical Documentation

**Version:** 1.0 (written March 12, 2026; latest changes section added 1 Nov 2026)
**Platform:** https://techtrendi.com
**Stack:** React + Vite + TypeScript + Tailwind CSS + Supabase (self-hosted)

---

## Table of Contents

1. [Infrastructure Overview](#1-infrastructure-overview)
2. [Content Architecture](#2-content-architecture)
3. [Articles System](#3-articles-system)
4. [Guides System](#4-guides-system)
5. [News System](#5-news-system)
6. [Reviews System](#6-reviews-system)
7. [Admin Panel](#7-admin-panel)
8. [Content Automation](#8-content-automation)
9. [Claude API Integration (AI Content Engine)](#9-claude-api-integration-ai-content-engine)
10. [Telegram Bot & Notifications](#10-telegram-bot--notifications)
11. [URL Rewrite System](#11-url-rewrite-system)
12. [Image Pipeline](#12-image-pipeline)
13. [Deployment Process](#13-deployment-process)
14. [Database Schema](#14-database-schema)
15. [Authentication & Authorization](#15-authentication--authorization)
16. [Analytics & Tracking](#16-analytics--tracking)
17. [Environment Variables & Secrets](#17-environment-variables--secrets)
18. [Free Tools System — Life Progress Bar](#18-free-tools-system--life-progress-bar)
19. [Troubleshooting](#19-troubleshooting)

---

## ⭐ LATEST CHANGES — 12 November 2026 (READ THIS)

### Cyber Awareness — all 95 posts fact-checked and rewritten (DB, LIVE 12 Nov; fallback PR #26)
- Owner: "fix all issues, with facts and no assumptions". Text lives in `techtrendi.cyber_awareness_posts`
  (numbers 1–95 published; 96–136 are hidden drafts and were NOT touched). Categories, numbers and ids unchanged,
  so shared `#post-N` links still work.
- Fixed: wrong advice (video "can't be faked", Wi-Fi "sees everything", airplane mode vs chargers, garage blocks
  relay, passport chip "broadcasts", turn location off, DBAN, email address = reset), out-of-date facts (E-Levy
  abolished 2 Apr 2025, Vodafone → Telecel, RGD → Office of the Registrar of Companies orc.gov.gh, Ghana chip
  passports since Apr 2025, no "porting lock"), US content ($, Amazon/FedEx, garage sale, soccer), blaming lines,
  a real celebrity name (#69), "Naked" title (#68 → "Photo Blackmail Trap").
- Five repeats became new topics on the same numbers: #35 Phone snatched plan, #58 Loan that needs a fee first,
  #63 Fake customer care account, #74 "I sent my code to you by mistake", #87 Money mule job.
- All posts now one plain style (short "→" tips) and end with the CSA line: call/text 292 or WhatsApp 0501603111.
- `src/data/cyber-awareness.json` (homepage carousel fallback, posts 1–10) refreshed to match (PR #26).
- Backup + undo on server 144: `/root/backups/cyber-awareness-20261112/` (`posts-before.json` full rows,
  `rollback.sql` + `rollback-data.json` restore title/emoji/content/updated_at for 1–95).

### Whole-site article audit — Round 3: Smart Income, 20 most-read (LIVE 13 Nov)
- 20 most-read unchecked Smart Income articles; 4 parallel fact-check agents; owner approved the hide list ("Go").
  Three of the hidden ones came from one 19 Mar 2026 batch reusing the same invented names — check that batch.
  - HIDDEN + nginx 301 (block "# Audit round 3"): faceless-youtube-channels-how-they-work (dup, invented "Marcus
    $127,000") → faceless-youtube-channel-business-model-financial-breakdown; print-on-demand-explained (dup, invented
    "$3,847" teacher) → how-to-start-print-on-demand-business-guide; first-web-development-client-without-portfolio
    + building-websites-local-businesses-side-project (dups, invented stories/income) →
    freelance-web-development-first-client-no-portfolio; teaching-tech-to-seniors, local-tech-support-side-gig,
    using-ai-tools-build-side-business (invented people/figures, US-only) → Smart Income category.
  - REWRITTEN (same slugs, verified facts, "About this guide"): start-profitable-youtube-channel-2026,
    start-youtube-tech-review-channel (ZV-E10 II US$999 body, Premiere Pro ~US$22.99/mo), creator-economy-2026
    (Goldman Sachs 2023 ~US$250bn → ~US$480bn by 2027), how-to-sell-anything-online (Ghana-first: Jiji/Tonaton,
    Paystack Starter Business, Etsy doesn't pay Ghana), selling-old-tech-stuff (wipe steps, FRP order, safe meet-ups,
    fake MoMo "payment sent", CSA box), digital-product-creation-…-actually-want (Gumroad 10% + $0.50 / 30% Discover,
    Affinity free since Oct 2025), fiverr-upwork-mistakes (off-platform payment bans, fake-client scams),
    building-niche-tech-newsletter (Substack/Beehiiv/Ghost need Stripe → not for Ghana-based paid subs; Paystack).
  - FIXED in place: faceless-youtube-…-financial-breakdown (fake "YouTube 2025 data" CPMs removed, 55%/45% split,
    US$100bn), how-to-start-print-on-demand (Spring/Teespring closed Oct 2026, Etsy no monthly fee + can't pay Ghana,
    fee maths), freelance-web-development-first-client (Upwork 0–15%, Connects US$0.15, WordPress ~39%, scam box),
    virtual-assistant-…-guide (US-only agencies removed, Freshdesk free plan ended, scam box), personal-brand (OECD
    61% / US$259bn of US$427bn; unsourced "6×" removed).
  - YouTube Ghana facts: YPP open in Ghana (1,000 subs + 4,000 h/12 mo or 10M Shorts views/90 days); 500-sub tier,
    memberships, Super Chat/Thanks NOT in Ghana; paid by bank wire/cheque at US$100, not MoMo; 30% US withholding
    (no treaty), 24% if no tax info.
- Live test: 13 articles × phone + desktop passed; sitemap drops all 7 hidden; homepage AdSense meta + canonical intact.
- Backups/undo on 144: `/root/backups/round3-20261113/`. Next: Smart Income continued (articles 21+ by views).

### Whole-site article audit — Round 2: Health Tech + 3 money articles (LIVE 13 Nov)
- 20 articles: all 17 flagged Health Tech + freelance-platforms-that-pay-ghanaians, apps-that-pay-you, crypto guide.
  4 parallel fact-check agents; owner approved the hide list ("Go"). All 20 had invented first-person testing;
  several had invented quotes pinned on REAL named doctors/academics (reputation risk).
  - HIDDEN + nginx 301 (block "# Audit round 2"): phone-stealing-sleep (dup) → phone-destroying-sleep;
    blue-light-glasses-science-eye-strain-testing (dup) → blue-light-glasses-eye-strain-science-reality;
    meditation-apps-…-2024 (dup) → meditation-apps-tested-…; screen-time-brain (fake "Microsoft 50,000" study) →
    children-screens guide; 30-days-passive-screen-time (fake Orben/Kuss quotes) → digital-detox;
    silicon-valley-workers-never-sit (invented premise), smartwatch-detects-illness (fake Perez/Radin quotes,
    false "non-invasive glucose" claim), telemedicine-myths (US-only, invented doctor) → Health Tech category;
    apps-that-pay-you (Dosh dead, apps not in Ghana, "you cannot lose") → make-money-online-without-scams-2026.
  - REWRITTEN (same slugs, verified facts, health note + "About this guide"): phone-destroying-sleep (Chang 2015,
    Irwin ~28%, Williamson & Feyer 0.05%), sleep-tracking (Altini 2021 79%, Windred 2024 60,977, orthosomnia, FDA
    apnoea Feb/Sep 2024), blue-light-glasses (Cochrane 2023 17 trials/619, AAO quote), meditation-apps (free first;
    Happier = ex-Ten Percent Happier), digital-detox (grayscale, Rhee & Kim 2016), zero-dollar-home-gym (WHO
    150–300 min + strength 2 days; chair safety), digital-wellness, air-quality (Accra PM2.5 89 vs 23 µg/m³
    harmattan, WHO 5 µg/m³, carbon-monoxide warning), fitness-tracker-calorie-lies (Stanford 2017 27–93%;
    Lancet PH 2025 7,000 steps), beginners-guide-cryptocurrency (VASP Act 2025, Act 1154; BoG + SEC; Ghana scam
    patterns; SEC 0800 100 065 + CSA report box).
  - FIXED in place: freelance-platforms-that-pay-ghanaians (Upwork 0–15% fee since May 2025 + Direct to Local Bank
    GHS; Fiverr 14-day clearance; Telecel Cash; PayPal not full service in Ghana; Remotasks warning; 99designs
    Hyperwallet; fake "34%" stat and fake community quote removed).
- Live test: 11 articles × phone + desktop passed; sitemap drops all 9 hidden; homepage AdSense meta + canonical intact.
- Backups/undo on 144: `/root/backups/round2-20261113/` (before.json 20 rows, update.json, rollback.sql,
  rollback-hide.sql, nginx copy before). Next: Smart Income (34 flagged left).

### Whole-site article audit — Round 1 of ~12 (LIVE 12 Nov)
- Scan of the 325 remaining published articles: 240 show fabrication markers (invented "I tested/I spent",
  "847", invented experts), ~1,470 mostly unsourced % figures, ~3,500 US-only references; 262 never mention Ghana.
  The 53 genuinely Ghana-focused articles are almost all clean. Scan script: scratchpad `sections/scan.mjs`.
- Round 1 = the 20 most-read flagged articles (4 parallel fact-check agents, owner approved the hide list):
  - HIDDEN + nginx 301 (block "# Audit round 1"): free-mental-health-apps (fake Stanford study, non-existent crisis
    app) → Health Tech; 72-hour-resume (invented people/salaries) → free-online-certifications; selling-stock-photos
    (never about stock photos) → Smart Income; how-to-migrate-everything (duplicate) → transfer-everything-new-phone;
    ios-vs-android → Phones; budget-gaming → Gaming; voice-ai-assistants → 10-ai-tools; smart-home-devices-cut-
    electric-bill → Green Tech; beginners-guide-using-computer → How-To.
  - REWRITTEN: how-to-link-ghana-card-to-bank-and-momo-accounts (BoG Jan 2026 rule; wrong USSD paths, invented
    wallet limits and phishing-looking bank URLs removed), transfer-everything-new-phone (no "free unlimited Google
    Photos"), parental-controls, smartphones-seniors, free-online-certifications (free study vs paid exams),
    10-ai-tools, external-storage, why-internet-slow (mobile data + NCA), children-screens (fake quotes removed).
  - FIXED: local-ai-models (llama3.2:8b command didn't exist → llama3.1:8b; first person removed),
    travel-public-space (juice jacking, boarding pass, O.MG cable, cedi prices, Ghana contacts).
- Backups/undo on 144: `/root/backups/round1-20261112/` (before.json 20 rows, rollback.sql, nginx copy before).

### 20 generic security articles audited: 10 rewritten, 10 hidden + 301-redirected (LIVE 12 Nov)
- Owner: "Go ahead with no assumptions". All 20 (the ones that had garbled characters) were AI-written US-style
  pieces with invented first-person research ("I tested 23 VPNs", "847"), invented people (Marcus Chen, Dr Sarah
  Martinez…), fake events ("6-character password exposed 340M"), a defamatory claim that AV labs rig tests, harmful
  advice, nationality profiling and no Ghana content.
- REWRITTEN (same slugs, verified facts only, Ghana reporting box): complete-two-factor-authentication-setup-guide,
  protect-whatsapp-from-hackers-complete-guide, phone-spying-detection-guide, social-media-privacy-guide-lock-down-
  strangers, how-to-tell-if-website-email-message-is-scam-2026-checklist, what-to-do-when-youve-been-hacked-recovery-
  guide, cybersecurity-guide-for-beginners, passwords-becoming-obsolete-whats-replacing-them (now "Passkeys
  Explained"), vpn-comparison-tested-honest-truth-privacy-2026 (now "Do You Need a VPN?"), ultimate-guide-online-
  privacy-2026.
- HIDDEN (is_published=false, NOT deleted) + nginx 301 in `/etc/nginx/sites-enabled/techtrendi.com` (block "Audit
  12 Nov 2026", after the /tools/ghs-exchange-rate line): 3 VPN/privacy-tools → vpn-comparison…; 3 password articles
  → password-manager-guide; delete-digital-footprint → ultimate-guide-online-privacy-2026; hidden-email-
  vulnerabilities → 7-phishing-red-flags…; why-antivirus → cybersecurity-guide-for-beginners; cybersecurity-threats-
  2026 → how-to-stay-safe-online-in-ghana. Trailing-slash URLs reach the target in 2 hops (existing slash rule first).
- Not used: the "Bank of Ghana 2-day MoMo lock after SIM swap" claim (no official source found).
- Backups/undo on 144: `/root/backups/audit20-20261112/` (before.json = 20 full rows, rollback.sql) and
  `/root/backups/techtrendi.com.nginx.bak-20261112-audit` (nginx before the redirects).
- `src/data/articles.json` / `articles-light.json` still list some hidden slugs but are not imported anywhere (old data).

### The 11 articles linked from the safety guide audited + corrected (DB, LIVE 12 Nov)
- Rewritten: `mobile-money-fraud-ghana-momo-scams-2026-guide` (made-up "GHS 78m" stat → BoG 2025 fraud cases
  16,733→24,778; Vodafone/AirtelTigo → Telecel/AT; unverified fraud numbers → MTN 419 + official app/website;
  fake "Cassava Marketplace" and real food brands removed), `7-phishing-red-flags-reveal-every-attack`,
  `password-manager-guide`, `parents-guide-whatsapp-snapchat-tiktok-safety` (fabricated anecdotes/stats — "Boeing
  employee", "Dr Sarah Chen", "surveyed 500" — garbled â€” characters, US-only advice, nationality profiling).
- Targeted fixes: sim-swap (no "porting lock" in Ghana → Ghana Card check; numbers), scams-in-ghana-right-now
  (Bawumia GH¢850 + CSA food-vendor alerts added, domains defanged, date), fake-whatsapp-promo (Bawumia example),
  job (Labour Department licensing), romance (StopNCII / Take It Down), investment (2026 SEC warnings),
  fake-customer-service (CSA food-vendor figure). Police = 18555 or 191 everywhere.
- Verified kept: CSA sextortion GH¢103,663→GH¢499,044 (Jan–Apr 2024 vs 2025); CSA fake listings 54 cases /
  GH¢266,195 (1 Jan–26 Apr 2026).
- Backup/undo on 144: `/root/backups/safety-linked-20261112/` (before.json = 11 full rows; copy to supabase-db as
  /tmp/linked-before.json, run rollback.sql). Blog pages are prerendered → `gh workflow run Deploy` after DB edits.
- Garbled characters FIXED same day: 20 more articles had UTF-8 text saved as Windows-1252 ("â€”" for —, "â€“"
  for –, "â†’" for →, "âœ—" for ✗, "â‚¬" for €, "SÃ£o" for São). Repaired by decoding each sequence back to its
  character (titles, excerpts, content; updated_at left unchanged). Published articles with garbled text: 0.
  Backup/undo on 144: `/root/backups/mojibake-20261112/` (before.json; copy to supabase-db as /tmp/moji-before.json,
  run rollback.sql).

### Safety guide rewritten + article boxes readable in dark mode (LIVE 12 Nov)
- `/blog/how-to-stay-safe-online-in-ghana` (the homepage "The full safety guide" button) rewritten in
  `techtrendi.articles` as a full guide (~2,800 words, 14 min): 3 habits, check first (292 before paying, Scam
  Checker, SEC licence check), fake giveaway/promo links (fact-checked Mahama/Bawumia cash hoaxes, Samira Bawumia
  airtime accounts, Ghana@68 free data, BoG/Ernest Chemist/GOIL anniversary prizes, Shatta Wale fake app ad), MoMo,
  loan apps/investments, phone/SIM/WhatsApp, romance/jobs/customer care, shopping, AI fakes, Ghana Card, family,
  what to do, numbers to save. Same URL/title. Fixed: 18555 is the Police general line (also 191), not "Cybercrime
  Unit"; added MTN 419 and Bank of Ghana complaints.office@bog.gov.gh. Jump links use the same text-based heading ids
  the page's sidebar contents makes (never give h2s custom ids). Blog pages are prerendered — after a DB edit run
  the Deploy workflow (`gh workflow run Deploy`) or wait for the 11:30 UTC daily build.
- Backup/undo on 144: `/root/backups/safety-guide-20261112/` (article-before.json; copy to supabase-db as
  /tmp/safety-before.json, run rollback.sql).
- PR #34: `src/index.css` — text inside article boxes/table cells with an inline pale background keeps the box
  colour (dark text in dark mode). 24 articles had near-invisible bold text/numbers in dark mode (contrast 1:1 → ≥6.4).

### Creepy Tech — all posts fact-checked: 90 rewritten, 19 drafts fixed + published (DB, LIVE 12 Nov)
- Owner: "Go ahead for both". Table `techtrendi.creepy_tech_posts`; page now shows 109 posts (count is automatic).
- Removed false claims about Ghana and named companies: Ghana Card "IDEMIA/foreign servers" (#85, built by Margins
  Group/IMS), Google Street View "Ghana Wi-Fi data" (#88, Street View came 2016), "Mozilla 2023 TikTok Africa study"
  (#89, doesn't exist), Roblox "100M breach 2021" (#76), "Heydio" app (#39, real one is MyHeritage Deep Nostalgia),
  Wing drones in Ghana (#84), "APT-C-23" cameras (#54); plus made-up stats, outdated facts (Android clipboard alerts,
  juice jacking, BMW seats, MAC never changes), US-only advice (FBI IC3, zip codes) and scare headlines.
- New topics on the same numbers (links still work): #12 open visitor book, #19 Wi-Fi name, #56 cheap TV boxes
  (FBI BADBOX 2.0), #66 ATM hidden camera, #81 Wi-Fi password-sharing apps, #82 Truecaller, #84 Worldcoin Kenya,
  #85 Ghana Card photocopies, #89 TikTok Lite.
- All posts: plain "→" style, end with the CSA line (292 / WhatsApp 0501603111). `src/data/creepy-tech.json`
  (homepage fallback 1–10) refreshed.
- Drafts: 19 kept → renumbered 91–109 and published. 21 NOT kept (17 repeats + 4 unproven) are still hidden,
  were deleted the same day after the owner approved the exact list. Table = 109 rows, all published.
- Backup + undo on server 144: `/root/backups/creepy-tech-20261112/` (`posts-before.json` = all 130 full rows;
  copy into supabase-db as `/tmp/ct-before.json`, run `rollback.sql`).

### Cyber Awareness — 41 hidden drafts audited: 24 repeats deleted, 17 fixed + published (DB, LIVE 12 Nov)
- Owner: "Fix and delete repeated items". The page now has 112 posts (header count updates by itself).
- Deleted (owner-approved list; all hidden, 0 views, never public): old drafts 97, 98, 99, 100, 101, 102, 103,
  105, 106, 107, 108, 113, 114, 115, 118, 119, 121, 123, 124, 127, 129, 133, 134, 135 — each repeated a live post
  or another draft.
- The 17 kept drafts were rewritten in the same plain "→" style and renumbered 96–112 (safe: never public):
  96←96 pyramid, 97←104 fake help number on Google, 98←109 fake antivirus, 99←110 fake update, 100←111 fake Apple
  Account email, 101←112 apps shared as .apk, 102←116 harmful browser add-on, 103←117 fake boss video call (Arup
  Hong Kong 2024, ~US$25M), 104←120 fake celebrity advert (real name removed), 105←122 fake job interview, 106←125
  flat not for rent (moved to Online Shopping & Marketplace Scams), 107←126 fake AI app, 108←128 look-alike web
  address (made-up bank name only), 109←130 app permissions, 110←131 backups, 111←132 what to do after a scam,
  112←136 old accounts.
- Facts corrected: CSA email is report@csa.gov.gh (not incident@); MTN fraud = dial 419 or *170# → My Wallet →
  Report Fraud (the "0800 900 100" number was unconfirmed and removed); unproven claims removed (Companies Act,
  "2023 Google removed apps", "every week in Ghana", AI-photo detection by image search).
- New topics in the Topic menu: Phishing & Fake Messages, Tech Support & Device Scams, AI-Powered Scams,
  Everyday Safety Habits (chips appear automatically once a category has published posts).
- Backup + undo on server 144, same folder: `drafts-before.json` (all 41 full rows). Undo = copy it into
  supabase-db as `/tmp/drafts-before.json`, then run `rollback-drafts.sql` (puts the 41 drafts back exactly).

### Homepage news + The Rundown side by side (PR #20, LIVE 12 Nov)
- Owner picked it from 31 designs on a canvas ("news 17 + Rundown 11"). Section "Fresh from Ghana & Africa"
  in `src/pages/Index.tsx`: left = 9 Africa Tech stories (1 big, 2 medium, 6 headlines in two columns of 3);
  right = **The Rundown** box `src/components/home/RundownLive.tsx`. Phones stack: news, then Rundown.
- The Rundown box: today's edition with **every topic** (the edition's `<h3>` story headings, max 10 —
  the same split `RundownTabloid` uses), "Read today's briefing", then the 4 earlier days (5 days in all).
- **Owner wanted "moving parts"**: rotating light border, drifting glows, scrolling grid, scan line,
  shimmering title, rise-in on scroll, a spotlight bar walking down the topics every 2.6 s (pauses on
  hover/focus). CSS `.rl-*` in `src/index.css`; all motion off for "reduce motion".
- All data loads after mount (as before), so the prerendered HTML / SEO / AdSense are unchanged.
- The old separate Rundown strip (`IntlNewsScroller`) lower down was removed. "1 days ago" → "1 day ago".
- **Level heights (PR #22, LIVE 12 Nov):** on computers the Rundown box is pinned to the news column's
  height (wrapper `relative`, inner `lg:absolute lg:inset-0`); the topics scroll inside `.rl-ticker` like a
  ticker, following the spotlight (`box.scrollTo` on the list only — never `scrollIntoView`, which would
  move the page). Pauses on hover. Phones unchanged (box below the news, everything shown).

### Ei Tech! is now a floating neon button (PR #24, LIVE 12 Nov)
- The big Ei Tech! card on the homepage was removed (owner: "is not nice at all"). In its place, a
  neon "Ei Tech!" sign floats bottom-LEFT on every page (`src/components/ei-tech/EiTechFloat.tsx`,
  lazy + ClientOnly in `src/ssg/RootLayout.tsx`; CSS `.eit-neon` / `.eit-pop` in `src/index.css`).
- Tap → pop-up with the newest meme, the vote, 😂 and "More jokes". Flickers only while the newest
  meme is unopened (localStorage `eitech_fab_seen`), steady glow after.
- Hidden on /ei-tech, /admin, /careers, /data-bundles, /tools-preview, /arcade, /auth (edit `HIDE_ON`).
- Lifts above a Google bottom anchor ad if one is showing, so it never covers an ad.
- Browser-only, so prerendered HTML / SEO / AdSense are unchanged. `EiTechHomeCard.tsx` is unused.
- Design canvas (private): https://claude.ai/artifact/1D9PLCjVDJhnuuimCD6jhr

## ⭐ LATEST CHANGES — 10–11 November 2026

### Ei Tech! — funny tech memes at `/ei-tech` (repo `xboggg/techtrendi`, PRs #15–#18)
- **What it is:** a meme feed. Each meme = our OWN picture (never a copied one) with the Ei Tech! bar,
  a short title and one funny line. **We never explain a joke or tell people what to think** (owner's rule).
  Hero with big animated "Ei Tech!"; homepage card after Creepy Tech (`src/components/home/EiTechHomeCard.tsx`);
  footer link under Topics.
- **Pages:** `/ei-tech` list (`src/pages/ei-tech/EiTechHub.tsx`, indexed, in the sitemap) and one page per meme
  `/ei-tech/<slug>` (`EiTechMemePage.tsx`, noindex, kept out of the sitemap by `scripts/generate-sitemap.mjs`).
  `/ei-tech?m=<slug>` scrolls the list to one meme.
- **Data:** table `techtrendi.ei_tech_memes` (public reads `status = 'published'` only; drafts/binned hidden).
  The build bakes the published list into `src/data/eiTechMemes.json` (`scripts/fetch-ei-tech.mjs`, keeps the
  committed file if the database can't be reached) so pages prerender; in the browser the pages re-read the table
  (`useEiTechMemes` in `src/data/eiTech.ts`), so a newly published meme shows at once. Until the next daily build
  (11:30 UTC) a new meme has no page of its own; its links use `/ei-tech?m=<slug>`.
- **Share button:** on phones it sends the meme PICTURE itself (Web Share with files) with "More jokes:
  techtrendi.com/ei-tech"; elsewhere the meme's link (WhatsApp). Facebook + copy link buttons too.
  Each meme has a 1200x630 share card (`<slug>-share.jpg`) used as its og:image.
- **😂 laugh + optional Team vote** (`src/components/ei-tech/EiTechReactions.tsx`): every meme has a 😂 count;
  memes with vote sides get "Which team are you?" (results after voting, can switch). Stored anonymously in
  `techtrendi.ei_tech_reactions` only through SECURITY DEFINER functions `ei_tech_react` / `ei_tech_counts`
  (visitors have no table access; one laugh + one vote per browser per meme; 120/min per meme cap; only
  published memes). **Never rename a meme's slug or swap its vote sides after people have voted.**
- **Adding memes = Telegram meme desk** (no code change, no deploy): see `NEWS_SERVICES_DOCUMENTATION.md` §4.
- Migrations: `supabase/migrations/20261111_ei_tech_reactions.sql`, `20261111_ei_tech_memes.sql` (+ `_rollback`).

### Scam alerts — a picture of the scam message (PRs #12, #13)
- Column `security_scam_alerts.image_url` (optional). Shown by `src/components/security/ScamScreenshot.tsx`:
  a framed "What the fake message looks like" panel with a "View full message" viewer, on `/scam-alerts` cards
  and the `/security` pop-up. Pictures go in `/var/www/techtrendi/images/scam-alerts/` (crop to the scam message
  only, red "FAKE - DO NOT CLICK" bar, under 300 KB). The admin Scam Alerts form has no picture field yet.
- "Update the security section" with a scam screenshot means a **scam alert**, not an article.

### /security page — hydration fix (PR #14)
- The daily quiz picked its question (and the streak) from the visitor's date/localStorage during render, and
  "Updated 3 days ago" used the clock, so whenever the visitor's day differed from the build day React redrew
  the whole page (#418/#423). Now the first render matches the prerendered HTML and the real values fill in
  after mount. **Rule for every prerendered page: never read the date, the clock or localStorage during render.**

### Story desk (4–5 Nov) and meme desk (11 Nov) — Telegram
- Both live in `@technews_highlight_bot` (`/opt/tech-news/article_bot.py`); details in `NEWS_SERVICES_DOCUMENTATION.md` §4.

---

## ⭐ LATEST CHANGES — 31 October – 1 November 2026 (READ THIS)

### Website (repo `xboggg/techtrendi`)
- **Hero Images admin** — `/admin/hero-images` (menu: *Hero Images*, above Ticker; `src/pages/admin/AdminHeroImages.tsx`).
  Upload, reorder (↑↓), show/hide (the last showing picture can't be hidden), tap the face so phones crop
  around it (`focus_x`/`focus_y`), short description (alt text). **Every change saves by itself.** Uploads are
  shrunk in the browser (`src/lib/image-optimize.ts`, `maxBytes`): computer copy under 300 KB (1920px),
  phone copy under 180 KB (1280px), sent to `/api/upload` folder `hero`. "Remove" deletes the row only;
  the file stays on the server.
  - Table `techtrendi.hero_slides` (migration `supabase/migrations/20261031_hero_slides.sql`): RLS public read
    of `is_active` rows, writes only for `techtrendi.is_admin()`.
  - Homepage (`src/pages/Index.tsx`): prebuild `scripts/fetch-hero-slides.mjs` bakes `src/data/heroSlides.json`
    (Google sees real pictures), then the page re-reads the table in the browser, so visitors see admin
    changes straight away. Phone copy via CSS variable `--hero-img-phone` (`src/index.css`).
  - Tested end to end by Edmund (31 Oct 2026).
- **Topic button** (`src/components/blog/TopicPicker.tsx`) now on `/blog`, `/news`, `/creepy-tech` and
  `/cyber-awareness` (emoji topics; one column on phones when names are long). `/scam-alerts` filters are one
  row that slides sideways on phones. Note: the `scrollbar-hide` class used in older code is defined nowhere
  (does nothing) — use `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`.
- **Old `/guides/<topic>` links** now redirect (301) in nginx on 144 to `/blog?category=<Topic>`; any other
  `/guides/...` → `/blog`. (They showed a blank page before.) In that nginx file a new redirect needs `=` or
  `^~`, or the big content regex wins. Copy in `xboggg/server-ops` `srv144/nginx/techtrendi.com`.

### Security
- **Picture uploads are admin-only** (`/opt/tech-news/image_upload_api.py`, also `/api/purge-og-cache`): the
  sign-in token must belong to a user with `role = 'admin'` in `techtrendi.user_roles` (looked up through the
  local gateway `http://127.0.0.1:8000`, cached 60 s). Before, any signed-in user could upload.

### News automation (repo `xboggg/tech-news`, server 144 `/opt/tech-news`) — details in `NEWS_SERVICES_DOCUMENTATION.md` §1
- 8 of 17 news sources had died quietly → fixed, 6 Ghana sources added, Citinewsroom read from its news sitemap.
- **Daily source health check** `feed_health.py` (07:15 Ghana time) → Telegram alert when a source breaks or no news went out.
- **Second daily run** at 17:30 Ghana time (up to 3 stories each run).
- One article per news event (Claude), never written from a headline alone, `--link` to publish a chosen story.
- **Cover pictures** `cover_picker.py`: free Cloudflare Workers AI picture checked by Claude → stock photo
  chosen by Claude looking at thumbnails → old keyword search last.
- **Telegram "🔄 Change picture / ✅ Keep" buttons** under each news message (handled by `article_bot.py`).

---

## 1. Infrastructure Overview

### Hosting

| Component | Location | Details |
|-----------|----------|---------|
| **Frontend (Production)** | Contabo VPS | IP `144.91.71.106`, served by nginx from `/var/www/techtrendi`. DNS proxied through Cloudflare. (Verified 2026-06-02.) |
| **VPS (Automation + Bots)** | Contabo | IP `38.242.195.0`, Ubuntu, runs article bot, monitoring, vibelink subdomains |
| **Supabase (production)** | Self-hosted on 144.91.71.106 | Accessible at `https://db2.techtrendi.com` |
| **Domain** | techtrendi.com | DNS in Cloudflare → proxied to 144.91.71.106 |

> **Note (2026-06-02):** Frontend hosting was previously Namecheap cPanel (`198.54.125.234`). It has been migrated to Contabo `144.91.71.106`. Old FTP deploy scripts (`deploy.cjs.OLD-NAMECHEAP-do-not-use`, `deploy_sync.py.OLD-NAMECHEAP-do-not-use`) are obsolete — use `bash deploy.sh` instead.

### Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query
- **Backend:** Supabase (PostgreSQL + Auth + Storage + REST API)
- **AI Content:** Anthropic Claude API (via Python SDK)
- **Automation:** Python scripts on VPS, systemd services, cron jobs
- **Notifications:** Telegram Bot API

### Key URLs

| URL | Purpose |
|-----|---------|
| `https://techtrendi.com` | Live site |
| `https://techtrendi.com/admin` | Admin panel |
| `https://db.techtrendi.com` | Supabase API |
| `https://db.techtrendi.com/api/generate-article` | Article generation API |
| `https://db.techtrendi.com/api/generate-review` | Review generation API |

---

## 2. Content Architecture

TechTrendi publishes four types of content:

| Content Type | Storage | Count (Mar 2026) | Admin Page |
|-------------|---------|-------------------|------------|
| **Articles** | `articles` table (`content_type = 'article'`) | 117 | `/admin/articles` |
| **Guides** | `articles` table (`content_type = 'guide'`) | 60 | `/admin/guides` |
| **News** | `news` table | 93 | `/admin/news` |
| **Reviews** | `reviews` table | 59 | `/admin/reviews` |

### Category Systems

**Article & Guide Categories (12):**
Phones, Security, AI Tech, Productivity, How-To, Side Hustles, Gaming, Accessories, Career in Tech, Health Tech, Remote Work, Green Tech

**News Categories (10):**
AI Tech, Big Tech, Crypto, Cybersecurity, Gadgets, Gaming, Green Tech, Health Tech, Space, Startups

**Review Categories (12):**
Smartphones, Laptops, Audio, Wearables, Tablets, Apps, SaaS Tools, Smart Home, Gaming, Cameras, Networking, Accessories

---

## 3. Articles System

### How Articles Are Created

Articles can be created through **four methods**:

1. **Admin Panel** — Manual creation at `/admin/articles`
2. **Admin Panel AI Generate** — Click the sparkles button, enter a topic, AI generates the full article
3. **Daily Automation** — Cron job generates 1 article/day (Mon-Fri, 10:00 UTC)
4. **Telegram Bot** — Send `/article Topic | Category` to generate on-demand

### Admin Panel — Article Editor

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | text | Yes | |
| Slug | text | Yes | Auto-generated from title (lowercase, hyphens) |
| Excerpt | text | No | Short summary for cards/SEO |
| Content | rich text / markdown | Yes | Toggle between RichTextEditor and Markdown |
| Category | select | Yes | One of 12 categories |
| Cover Image | URL | No | Paste URL or upload to Supabase storage |
| Content Type | select | Yes | `article` or `guide` |
| Read Time | number | Auto | Calculated at 200 words/minute |
| Tags | text[] | No | |
| Is Published | toggle | Yes | Default: true |
| Is Featured | toggle | No | |
| Homepage Featured | toggle | No | For guides only — max 3 on homepage |

**Editor Features:**
- Rich text editor with formatting toolbar (bold, italic, headings, lists, links, images, code blocks)
- Markdown mode toggle for power users
- Auto-slug generation from title
- Auto-read-time calculation
- Category dropdown with all 12 categories

**RLS Bypass:**
The Supabase anon key cannot write to the `articles` table (RLS restriction). All admin mutations use the **service_role key** via direct REST API `fetch()` calls:

```javascript
const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: "return=minimal",
  },
  body: JSON.stringify(data),
});
```

### Public Display

- **Blog listing** (`/blog`) — Fetches published articles, displays as cards with cover image, title, excerpt, category badge, read time
- **Article page** (`/blog/:slug`) — Full article with `renderContent` that handles both HTML (from rich text editor) and Markdown content
- **Category pages** (`/phones`, `/security`, etc.) — Filtered views by category

---

## 4. Guides System

> **Retired (April 2026, commit 2c752a8):** Guides were merged into Articles. `/guides` is no longer a page; old `/guides/<topic>` links redirect to `/blog?category=<Topic>` (nginx, 31 Oct 2026). `AdminGuides.tsx`, `AdminGuideEdit.tsx` and `Guides.tsx` are leftover files with no route. The text below is history.

Guides are **not a separate table** — they are rows in the `articles` table with `content_type = 'guide'`.

### How Guides Differ from Articles

| Feature | Articles | Guides |
|---------|----------|--------|
| Content type | `article` | `guide` |
| Homepage featured | No | Yes (max 3) |
| Public listing | `/blog` | `/guides` |
| Individual page | `/blog/:slug` | `/blog/:slug` (same renderer) |
| Admin page | `/admin/articles` | `/admin/guides` |
| Creation | In article editor | In article editor (set type to "guide") |

### Homepage Featured Guides

- Up to **3 guides** can be marked as `homepage_featured`
- Managed from `/admin/guides` via the "Homepage" toggle button
- The admin UI enforces the 3-guide limit with a toast notification
- A "Homepage Only" filter button lets you quickly view just the featured guides

### Guide Categories on Public Page

The `/guides` page displays 8 guide categories with icons:
- Phone Guides, Security, AI Tech, How-To Tutorials, Career in Tech, Health Tech, Side Hustles, Productivity
- Each category card shows the count of guides in that category
- Category pages at `/guides/:category` show filtered guides with pagination (12 per page)

---

## 5. News System

### How News Is Created

1. **Admin Panel** — Manual creation at `/admin/news` with rich text editor
2. **Auto-Generation** — Python script runs 4x daily (6:00, 12:00, 17:00, 21:00 UTC)

### Admin Panel — News Editor

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | text | Yes | |
| Slug | text | Yes | Auto-generated |
| Author | text | No | Default: "TechTrendi Team" |
| Category | select | Yes | One of 10 news categories |
| Excerpt | text | No | |
| Meta Description | text | No | SEO field with 160-character counter |
| Cover Image | URL/upload | No | Uploaded to Supabase storage bucket `techtrendi-images/news/` |
| Content | rich text | Yes | RichTextEditor |
| Read Time | number | No | Default: 3 minutes |
| Tags | text | No | Comma-separated |
| Status | select | Yes | Draft, Publish Now, or Schedule |
| Publish At | datetime | No | For scheduled publishing |

**Publication Modes:**
- **Draft** — Saved but not visible publicly
- **Publish Now** — Immediately visible
- **Schedule** — Set a future date/time for automatic publishing

### Public Display

- **News listing** (`/news`) — Latest news articles with cover images and category badges
- **News article** (`/news/:slug`) — Full news story

---

## 6. Reviews System

### How Reviews Are Created

1. **Admin Panel** — Manual creation at `/admin/reviews`
2. **Admin Panel AI Generate** — Click sparkles button, enter product name, AI generates full review
3. **Daily Automation** — Cron job generates 1 review/day (Mon-Fri, 14:00 UTC)

### Admin Panel — Review Editor

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | text | Yes | Product name |
| Slug | text | Yes | Auto-generated with validation (lowercase + hyphens only) |
| Category | select | Yes | One of 12 review categories |
| Rating | number | Yes | 0-5 (step 0.1) |
| Verdict | text | Yes | One-line summary |
| Pros | text[] | Yes | One per line |
| Cons | text[] | Yes | One per line |
| Price | text | No | e.g., "$299" |
| Release Date | text | No | |
| Image | URL | No | Product image |
| Full Review | textarea | No | Long-form review text |
| Specs | JSON | No | Technical specifications as JSON |
| Is Published | toggle | Yes | |

### Public Display

- **Reviews listing** (`/reviews`) — Grid of product review cards with rating, verdict, price
- **Review detail** (`/reviews/:slug`) — Full review with pros/cons, specs table, rating, comments section

### Related Tables

- `review_comments` — User comments on reviews
- `review_ratings` — User star ratings
- `price_history` — Historical price tracking
- `price_alerts` — User price alert subscriptions

---

## 7. Admin Panel

### Access

- **URL:** `https://techtrendi.com/admin`
- **Auth:** Must be logged in with an admin-role account
- **Admin check:** `useAdminCheck()` hook verifies `has_role(auth.uid(), 'admin')` in Supabase

### Sidebar Navigation (in order)

Current menu (checked 1 Nov 2026 in `src/pages/admin/AdminLayout.tsx`):

1. **Dashboard** — Site overview with live counters, traffic chart, recent content, device/geo breakdown
2. **Analytics** — 7-tab deep analytics
3. **News** — CRUD for news articles
4. **Articles** — CRUD for articles (with AI generate)
5. **WhatsApp Queue** — Auto-generated WhatsApp post queue (see Section 11)
6. **Data Deal Posts** — data bundle deal posts
7. **Reviews** — CRUD for product reviews
8. **Products** — DigiStore product management
9. **Comments** — Comment moderation
10. **Users** — User management
11. **Messages** — Contact form messages
12. **Creepy Tech** · 13. **Cyber Awareness** · 14. **Scam Alerts** · 15. **Daily Tips**
16. **Hero Images** — homepage pictures: upload, order, show/hide, phone crop (added 31 Oct 2026)
17. **Ticker** · 18. **Threat Level** · 19. **Scam Reports** · 20. **Scam Stories** · 21. **Tool Feedback**

(The old **Guides** menu item is gone — guides were merged into Articles in April 2026.)

### Auto-Refresh

All admin pages poll Supabase every **30 seconds** (`refetchInterval: 30000` on React Query) so counters and data stay current without manual refresh.

---

## 8. Content Automation

All automation scripts live at `/opt/tech-news/` on the VPS (`38.242.195.0`).

### 8.1 Daily Article Generator

| Setting | Value |
|---------|-------|
| **Script** | `/opt/tech-news/daily_article_gen.py` |
| **Schedule** | Mon-Fri, 10:00 UTC |
| **Output** | 1 article/day |
| **Word count** | 1,800-2,500 words (8-10 min read) |
| **AI Model** | Anthropic Claude (via Python SDK) |

**How it works:**
1. Rotates through all 12 article categories
2. Selects a topic from curated topic pools (10 topics per category, 120 total)
3. Calls Claude API with randomized writing styles (conversational_expert, investigative, practical_guide, storytelling, myth_buster, comparison_analysis)
4. Randomizes title styles (contrarian, question_hook, numbered_actionable, bold_statement, story_opener, direct_address, myth_busting, ultimate_guide)
5. Inserts into Supabase via `docker exec psql`
6. Assigns an Unsplash cover image (mapped per category)
7. Regenerates `articles-light.json` (static fallback for blog listing)
8. Sends Telegram notification on success
9. Alerts when Anthropic credits drop below $1

### 8.2 Daily Review Generator

| Setting | Value |
|---------|-------|
| **Script** | `/opt/tech-news/daily_review_gen.py` |
| **Schedule** | Mon-Fri, 14:00 UTC |
| **Output** | 1 product review/day |
| **AI Model** | Anthropic Claude |

**How it works:**
1. Rotates through review categories
2. Selects from curated product topic pools (viral-worthy products people search for)
3. Generates full review with rating, pros, cons, verdict, specs
4. Inserts into Supabase `reviews` table

### 8.3 News Generator

| Setting | Value |
|---------|-------|
| **Script** | `/opt/tech-news/tech_news_generator.py` (via `run.sh`) |
| **Schedule** | Daily at 06:00, 12:00, 17:00, 21:00 UTC |
| **Output** | Multiple news stories per run |

### 8.4 Article Generation API

| Setting | Value |
|---------|-------|
| **Script** | `/opt/tech-news/article_api.py` |
| **Service** | `techtrendi-article-api.service` (systemd) |
| **Port** | 5111 |
| **Public URL** | `https://db.techtrendi.com/api/generate-article` (nginx proxy) |
| **Auth** | Bearer token = Supabase service_role key |

**Endpoint:** `POST /generate-article`
```json
{
  "topic": "Best budget phones under $300 in 2026",
  "category": "Phones"  // optional — auto-detected if omitted
}
```

Called by the admin panel's "AI Generate" button in the article editor.

### 8.5 Review Generation API

| Setting | Value |
|---------|-------|
| **Script** | `/opt/tech-news/review_api.py` |
| **Port** | 5112 |
| **Public URL** | `https://db.techtrendi.com/api/generate-review` |
| **Auth** | Bearer token = Supabase service_role key |

**Endpoint:** `POST /generate-review`
```json
{
  "product_name": "Samsung Galaxy S26 Ultra",
  "category": "Smartphones"  // optional
}
```

### 8.6 On-Demand CLI Generator

**Script:** `/opt/tech-news/generate_article_on_demand.py`

```bash
ssh root@38.242.195.0
python3 /opt/tech-news/generate_article_on_demand.py "Topic Here" "Category"
# Category is optional — auto-detected if omitted
```

### 8.7 Telegram Bot

| Setting | Value |
|---------|-------|
| **Script** | `/opt/tech-news/article_bot.py` |
| **Service** | `techtrendi-article-bot.service` (systemd) |
| **Bot Token** | `<in /etc/telegram-bots.env — never write it here>` |
| **Chat ID** | `-1003595231315` |

**Commands:**
- `/article How to secure your home Wi-Fi | Security` — Generate article with specific category
- `/article Best AI tools for students` — Generate with auto-detected category
- `/status` — Show article count by category
- `/help` — Show usage instructions

### 8.8 Cron Schedule Summary

| Time (UTC) | Mon-Fri | Sat-Sun | What |
|------------|---------|---------|------|
| 06:00 | News gen | News gen | `tech_news_generator.py` |
| 10:00 | Article gen | — | `daily_article_gen.py` |
| 12:00 | News gen | News gen | `tech_news_generator.py` |
| 14:00 | Review gen | — | `daily_review_gen.py` |
| 17:00 | News gen | News gen | `tech_news_generator.py` |
| 21:00 | News gen | News gen | `tech_news_generator.py` |

---

## 9. Claude API Integration (AI Content Engine)

All AI-generated content on TechTrendi is powered by the **Anthropic Claude API** via the Python SDK (`anthropic` library). Every script uses **Claude Sonnet** (`claude-sonnet-4-20250514`).

### 9.1 SDK Setup

Every Python script initializes the client the same way:

```python
import anthropic
from dotenv import load_dotenv

load_dotenv("/opt/tech-news/.env")
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
```

The API key is stored in `/opt/tech-news/.env` and starts with `sk-ant-api03-...`.

### 9.2 All Claude API Calls (Complete Map)

There are **8 distinct Claude API call points** across the codebase:

| # | Script | Function | Purpose | max_tokens | Output Format |
|---|--------|----------|---------|------------|---------------|
| 1 | `daily_article_gen.py` | `generate_article()` | Daily cron article | 6000 | JSON |
| 2 | `article_api.py` | `detect_category()` | Auto-classify topic → category | 50 | Plain text (category name) |
| 3 | `article_api.py` | `generate_article()` | Admin panel AI generate | 6000 | JSON |
| 4 | `article_bot.py` | `generate_article()` | Telegram `/article` command | 6000 | JSON |
| 5 | `article_bot.py` | `generate_guide_content()` | Telegram `/guide` command | 8000 | JSON |
| 6 | `review_generator.py` | `generate_review()` | All review generation (bot/API/cron) | 8000 | JSON |
| 7 | `tech_news_generator.py` | `generate_script()` | News article from RSS headlines | 4096 | JSON |
| 8 | `tech_news_generator.py` | `generate_weekly_roundup()` | Sunday weekly recap | 4096 | JSON |

### 9.3 API Call Pattern

Every Claude call follows the same structure:

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=6000,       # varies per use case
    messages=[{
        "role": "user",
        "content": prompt   # no system message — everything is in the user prompt
    }]
)
text = response.content[0].text
```

**Important:** None of the scripts use the `system` parameter. All instructions are passed as the `user` message.

The response text is then parsed as JSON (the prompts instruct Claude to return only valid JSON).

### 9.4 Article Generation Prompt

Used by `daily_article_gen.py`, `article_api.py`, and `article_bot.py`:

**Persona:** *"Elite content architect with 30 years at Wired, The Verge, NYT Tech"*

**Key prompt elements:**
- Topic and category are injected
- **Writing style** (randomized): `conversational_expert`, `investigative`, `practical_guide`, `storytelling`, `myth_buster`, `comparison_analysis`
- **Title style** (randomized): `contrarian`, `question_hook`, `numbered_actionable`, `bold_statement`, `story_opener`, `direct_address`, `myth_busting`, `ultimate_guide`
- Targets 1,800-2,500 words (8-10 min read time)
- Content must be in **HTML format** (with `<h2>`, `<h3>`, `<p>`, `<ul>`, `<strong>`, etc.)
- Must include a compelling intro, subheadings, practical examples, and a conclusion

**Required JSON output:**
```json
{
  "title": "Article Title",
  "slug": "article-title-slug",
  "excerpt": "2-3 sentence summary for SEO",
  "content": "<h2>...</h2><p>...</p>...",
  "read_time_minutes": 9,
  "tags": ["tag1", "tag2", "tag3"]
}
```

### 9.5 Guide Generation Prompt

Used by `article_bot.py` `/guide` command:

**Persona:** *"World-class content writer for Wired, The Verge... smart friend explaining over coffee"*

**Key differences from articles:**
- Targets 2,000-3,000 words
- More tutorial/how-to focused
- Step-by-step structure encouraged
- Inserted with `content_type = 'guide'` and `is_featured = true`
- max_tokens: 8000 (higher than articles)

### 9.6 Review Generation Prompt

Used by `review_generator.py` (shared by bot, API, and daily cron):

**Persona:** *"MKBHD meets Marques meets The Verge's best writer — brutally honest, 10+ years of hands-on experience"*

**Key prompt elements:**
- Product name and category injected
- Must be 2,000-3,000 words
- Must provide an honest, opinionated review (not generic marketing)
- Structured specs in JSON format

**Required JSON output:**
```json
{
  "title": "Product Name Review",
  "slug": "product-name-review",
  "excerpt": "Summary",
  "rating": 4.2,
  "verdict": "One-line verdict",
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"],
  "price": "$299",
  "full_review": "<h2>...</h2><p>...</p>...",
  "specs": {"Display": "6.7 inch OLED", "Battery": "5000mAh", ...},
  "tags": ["tag1", "tag2"]
}
```

### 9.7 News Generation Prompt

Used by `tech_news_generator.py`:

**Persona:** *"Viral tech content creator for TechTrendi.com"*

**How it works:**
1. Fetches RSS headlines from ~30 tech feeds across 10 niches
2. Clusters related headlines to detect trending topics
3. Sends the clustered headlines to Claude with instructions to write:
   - A full news article (HTML content)
   - A video script (for future YouTube content)
   - Social media posts (Twitter, LinkedIn)
4. max_tokens: 4096

**Weekly roundup (Sundays):** A separate prompt asks Claude to act as a *"tech editor at TechTrendi.com"* and compile the week's top 5 stories into a recap article.

### 9.8 Category Auto-Detection

When a topic is provided without a category (via API or Telegram bot), a lightweight Claude call classifies it:

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=50,
    messages=[{
        "role": "user",
        "content": f"Classify this topic into one of these categories: {', '.join(CATEGORIES)}. Topic: {topic}. Reply with ONLY the category name."
    }]
)
category = response.content[0].text.strip()
```

### 9.9 Credit Monitoring

The daily article generator checks Anthropic API credits after each run. If the balance drops below **$1**, it sends a Telegram alert:

```
⚠️ LOW ANTHROPIC CREDITS: $0.73 remaining!
Top up at: https://console.anthropic.com/settings/billing
```

This is done by making a minimal API call and checking the response headers/billing info.

---

## 10. Telegram Bot & Notifications

### 10.1 Bot Configuration

| Setting | Value |
|---------|-------|
| **Bot Token** | `<in /etc/telegram-bots.env — never write it here>` |
| **Chat ID** | `-1003595231315` (group chat) |
| **Library** | `python-telegram-bot` (in `article_bot.py`), `urllib.request` (in other scripts) |
| **Mode** | Polling (long-poll for commands) |
| **Service** | `techtrendi-article-bot.service` (systemd) |

### 10.2 Telegram Bot Commands

The bot (`/opt/tech-news/article_bot.py`) supports these commands:

| Command | Example | What It Does |
|---------|---------|-------------|
| `/article` | `/article Best AI tools for students \| AI Tech` | Generates a full article via Claude API, inserts into Supabase, sends confirmation |
| `/guide` | `/guide How to set up a VPN \| Security` | Generates a guide (content_type=guide), marks as featured, inserts into DB |
| `/review` | `/review Samsung Galaxy S26 Ultra \| Smartphones` | Generates a product review via `review_generator.py`, inserts into reviews table |
| `/status` | `/status` | Shows article count by category (queries `articles` table) |
| `/reviewstatus` | `/reviewstatus` | Shows review count by category (queries `reviews` table) |
| `/rewrite` | `/rewrite article \| Security \| https://url1 https://url2` | Scrapes URL(s), fully rewrites as original content, auto-publishes |
| `/help` | `/help` | Shows usage instructions |

**Category is optional** — if omitted, Claude auto-detects the best category from the topic.

**Pipe separator (`|`)** separates topic from category: `/article Topic here | Category`

### 10.3 Bot Authorization

The bot only responds to messages from the authorized chat ID (`-1003595231315`). Messages from other chats are silently ignored.

### 10.4 Telegram Notifications (Non-Bot)

Beyond the interactive bot, several scripts send **one-way notifications** to the same Telegram chat using direct HTTP calls:

```python
def send_telegram(msg):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = json.dumps({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": msg,
        "parse_mode": "HTML"
    }).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req)
```

**Notification triggers:**

| Script | When It Notifies |
|--------|------------------|
| `daily_article_gen.py` | After each article is generated (title, category, word count, link) |
| `daily_article_gen.py` | When Anthropic credits drop below $1 |
| `daily_review_gen.py` | After each review is generated |
| `tech_news_generator.py` | After each news batch (with cover images sent as photos) |
| `generate_article_on_demand.py` | After on-demand article is generated |
| `review_generator.py` | After each review is generated |

**Typical notification format:**
```
✅ New Article Published!
📝 Title: Best Budget Phones Under $300 in 2026
📂 Category: Phones
📊 Words: 2,143
🔗 https://techtrendi.com/blog/best-budget-phones-under-300-in-2026
```

### 10.5 Managing the Bot Service

```bash
# Check bot status
ssh root@38.242.195.0 "systemctl status techtrendi-article-bot"

# Restart bot
ssh root@38.242.195.0 "systemctl restart techtrendi-article-bot"

# View live bot logs
ssh root@38.242.195.0 "journalctl -u techtrendi-article-bot -f"

# Stop bot
ssh root@38.242.195.0 "systemctl stop techtrendi-article-bot"
```

---

## 11. URL Rewrite System

### 11.1 Overview

The URL Rewrite System allows you to drop one or more external article/review links and have Claude AI produce a completely original piece of content based on the same topic. The system:

1. **Scrapes** the source URL(s) using `trafilatura` (Python library for clean article text extraction)
2. **Synthesizes** multiple sources into combined context (up to 8000 chars per source)
3. **Rewrites** the content as a completely original TechTrendi article, review, or guide via Claude Sonnet 4
4. **Auto-publishes** to Supabase and sends a Telegram notification

### 11.2 Entry Points (3 Ways to Trigger)

| Channel | Command / Action | Example |
|---------|-----------------|---------|
| **Telegram Bot** | `/rewrite type \| category \| urls` | `/rewrite article \| Security \| https://example.com/post1 https://example.com/post2` |
| **Admin Panel** | "Rewrite from URL" button (cyan) | Available in Articles, Reviews, and Guides admin pages |
| **VPS CLI** | `python3 generate_from_url.py` | `python3 generate_from_url.py article "Security" "https://url1" "https://url2"` |

### 11.3 Content Types & Categories

You **always specify** the content type and category:

| Content Type | Output | Categories |
|-------------|--------|-----------|
| `article` | Standard blog article (1800-2500 words) | Phones, Security, AI Tech, Productivity, How-To, Side Hustles, Gaming, Accessories, Career in Tech, Health Tech, Remote Work, Green Tech |
| `review` | Full product review with rating, pros/cons, specs | Smartphones, Laptops, Audio, Wearables, Tablets, Apps, SaaS Tools, Smart Home, Gaming, Cameras, Networking, Accessories |
| `guide` | Comprehensive guide (2000-3000 words, featured) | Same as article categories |

### 11.4 Multi-Link Support

- Pass 1-3 URLs separated by spaces
- Each URL is scraped independently via `trafilatura`
- All extracted text is combined with source markers
- Claude receives the merged context and produces one cohesive piece
- More sources = richer, more comprehensive content

### 11.5 VPS Architecture

| Component | Location | Port | Service |
|-----------|----------|------|---------|
| Core engine | `/opt/tech-news/generate_from_url.py` | — | Imported as module |
| HTTP API | `/opt/tech-news/rewrite_api.py` | 5115 | `techtrendi-rewrite-api.service` |
| Telegram bot | `/opt/tech-news/article_bot.py` | — | `techtrendi-article-bot.service` |
| Nginx proxy | `/etc/nginx/sites-enabled/db.techtrendi.com` | — | Routes `/api/rewrite-from-url` → port 5115 |

### 11.6 API Endpoint

```
POST https://db.techtrendi.com/api/rewrite-from-url
Authorization: Bearer <service_role_key>
Content-Type: application/json

{
  "content_type": "article" | "review" | "guide",
  "category": "Security",
  "urls": ["https://url1.com", "https://url2.com"]
}

Response:
{
  "title": "...",
  "slug": "...",
  "category": "Security",
  "content_type": "article",
  "rating": null,  // only for reviews
  "read_time_minutes": 9,
  "link": "https://techtrendi.com/blog/..."
}
```

### 11.7 Claude Prompt Strategy

- **Articles**: Random title style + content style (same variation system as topic-based generation)
- **Reviews**: Produces full review structure — rating, pros (5), cons (3), specs, verdict, full_review markdown
- **Guides**: Comprehensive step-by-step format with Pro tip callouts, featured on homepage
- All prompts explicitly instruct: "DO NOT copy sentences from the source", "DO NOT mention the source"
- Content is a **full rewrite** — same topic/facts, completely new structure, voice, and examples

### 11.8 Managing the Service

```bash
# Check status
ssh root@38.242.195.0 "systemctl status techtrendi-rewrite-api"

# Restart
ssh root@38.242.195.0 "systemctl restart techtrendi-rewrite-api"

# View logs
ssh root@38.242.195.0 "journalctl -u techtrendi-rewrite-api -f"

# After editing generate_from_url.py or rewrite_api.py:
ssh root@38.242.195.0 "systemctl restart techtrendi-rewrite-api && systemctl restart techtrendi-article-bot"
```

### 11.9 Dependencies

- `trafilatura` — Article text extraction from URLs
- `anthropic` — Claude API client
- `python-dotenv` — Environment variable loading

---

## 12. Image Pipeline

### 12.1 Article & Guide Cover Images

**Daily article generator** uses a static **Unsplash image map** — each of the 12 categories has a pre-selected Unsplash image URL:

```python
CATEGORY_IMAGES = {
    "Phones": "https://images.unsplash.com/photo-...",
    "Security": "https://images.unsplash.com/photo-...",
    "AI Tech": "https://images.unsplash.com/photo-...",
    # ... one per category
}
```

The cover image is set based on the article's category during insertion.

### 12.2 News Cover Images (3-Tier Fallback)

The news generator (`tech_news_generator.py`) has a sophisticated image pipeline:

1. **Pexels API** (primary) — Searches for a relevant photo using the article topic as query
   - API key: stored in `.env` as `PEXELS_API_KEY`
   - Returns high-quality editorial photos

2. **Pollinations AI** (fallback) — If Pexels fails, generates an AI image
   - Free API at `https://image.pollinations.ai/prompt/{encoded_prompt}`
   - Downloads the generated image

3. **Unsplash static** (final fallback) — Category-mapped URLs as a last resort

### 12.3 Review Product Images

Reviews use images provided in the generation prompt or default to category-based Unsplash images. The admin panel also allows manual image URL entry.

---

## 13. Deployment Process

### Prerequisites

- SSH access to VPS (`root@144.91.71.106`)
- Node.js + npm on local machine
- Source code at local workspace

### Deploy (one command)

```bash
cd techtrendi
bash deploy.sh "Optional commit message"
```

This single script handles the entire deploy. See [deploy.sh](deploy.sh) for the source.

### What `deploy.sh` does

1. **Git sync** — commits any pending changes locally and pushes to `origin/main` on GitHub
2. **Fresh build** — `rm -rf dist && npm run build` (so stale chunks never ship)
3. **Remote backup** — tars `/var/www/techtrendi` on the server into `/root/backup-techtrendi-<timestamp>.tar.gz` before touching anything (safety net for rollback)
4. **Upload** — packages `dist/` into `/tmp/dist.tar.gz`, scp's to VPS, extracts in place
5. **Verify** — parses the entry bundle hash from local `dist/index.html` and compares against the live site (using a real User-Agent so the bot-blocker doesn't return 403)
6. **Print rollback command** — every deploy ends with the exact `ssh ... tar xzf ...` command needed to restore from the backup created in step 3

### Verify manually

```bash
curl -s -A "Mozilla/5.0" "https://techtrendi.com/" | grep -oE 'assets/index-[a-zA-Z0-9_-]+\.js' | head -1
```

The output must match the entry bundle in `dist/index.html`.

### Why ALL assets must be uploaded

Vite generates content-hashed filenames (e.g., `Reviews-C6i4Bm8p.js`). Every build regenerates **all** chunk hashes, even for unchanged files. `deploy.sh` packages the entire `dist/` so the upload is atomic — index.html and the chunks it references arrive together.

### Server access

| Field | Value |
|-------|-------|
| Host | `144.91.71.106` |
| User | `root` |
| Document Root | `/var/www/techtrendi/` |
| Assets Dir | `/var/www/techtrendi/assets/` |
| Nginx config | `/etc/nginx/sites-enabled/techtrendi.com` |
| SSL cert | `/etc/ssl/certs/techtrendi.crt` (not Let's Encrypt) |

### Periodic asset cleanup

Because `tar xzf` adds files without removing old ones, the server's `assets/` directory accumulates stale chunks over time. On 2026-06-02 we removed 3,633 stale chunks (83 MB → 6.9 MB). If/when it grows large again, the cleanup pattern is:

```bash
# On the server: delete files in assets/ that aren't in the current dist AND are older than 7 days
ssh root@144.91.71.106 'ls /var/www/techtrendi/assets/' | sort > /tmp/remote-assets.txt
ls techtrendi/dist/assets/ | sort > /tmp/local-assets.txt
comm -23 /tmp/remote-assets.txt /tmp/local-assets.txt > /tmp/stale.txt
# review /tmp/stale.txt, then on server: while read f; do [ -f "$f" ] && [ $(find "$f" -mtime +7 | wc -l) -eq 1 ] && rm -f "$f"; done < /tmp/stale.txt
```

---

## 14. Database Schema

### `articles` Table

```sql
CREATE TABLE articles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  excerpt         text,
  content         text NOT NULL,
  cover_image     text,
  category        text NOT NULL,
  tags            text[] DEFAULT '{}'::text[],
  author          text DEFAULT 'TechTrendi Team',
  read_time_minutes integer DEFAULT 5,
  is_premium      boolean NOT NULL DEFAULT false,
  is_published    boolean NOT NULL DEFAULT true,
  views           integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  content_type    text DEFAULT 'article',     -- 'article' or 'guide'
  is_featured     boolean DEFAULT false,
  homepage_featured boolean DEFAULT false      -- for guides homepage display
);
```

### `news` Table

```sql
CREATE TABLE news (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text UNIQUE NOT NULL,
  excerpt         text,
  content         text NOT NULL,
  category        text NOT NULL DEFAULT 'AI Tech',
  cover_image     text,
  is_published    boolean DEFAULT false,
  read_time_minutes integer DEFAULT 3,
  views           integer DEFAULT 0,
  meta_description text,
  tags            text[],
  author          text DEFAULT 'TechTrendi Team',
  created_at      timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at      timestamptz NOT NULL DEFAULT timezone('utc', now()),
  publish_at      timestamptz,                -- for scheduled publishing
  status          text DEFAULT 'draft',       -- draft / published / scheduled
  meta_title      text
);
```

### `reviews` Table

```sql
CREATE TABLE reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  category        text NOT NULL,
  image           text,
  rating          numeric(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  verdict         text NOT NULL,
  pros            text[] NOT NULL DEFAULT '{}'::text[],
  cons            text[] NOT NULL DEFAULT '{}'::text[],
  price           text,
  release_date    text,
  full_review     text,
  specs           jsonb DEFAULT '{}'::jsonb,
  is_published    boolean NOT NULL DEFAULT true,
  views           integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

### `page_views` Table (Analytics)

```sql
-- Tracks every page visit for analytics
CREATE TABLE page_views (
  id              uuid PRIMARY KEY,
  page_path       text,
  page_title      text,
  referrer        text,
  session_id      text,
  device_type     text,        -- desktop / mobile / tablet
  browser         text,
  os              text,
  country         text,
  city            text,
  is_bounce       boolean,
  session_duration integer,
  exit_page       text,
  entry_page      text,
  is_new_visitor  boolean,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  time_on_page    integer,
  created_at      timestamptz NOT NULL
);
```

---

## 15. Authentication & Authorization

### Frontend Auth

- Supabase Auth with email/password
- `AuthContext` provides `user` and `loading` state
- `useAdminCheck()` hook checks for admin role

### API Auth Patterns

| Context | Key Used | Method |
|---------|----------|--------|
| Public reads (frontend) | Anon key | Supabase JS client |
| Admin writes (frontend) | Service role key | Direct REST API `fetch()` |
| Python scripts (VPS) | None (direct SQL) | `docker exec psql` |
| Generation APIs | Service role key | Bearer token in header |

### Environment Variables (Frontend)

```env
VITE_SUPABASE_URL=https://db.techtrendi.com
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...  (anon key)
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (service role key)
```

### RLS (Row Level Security)

- **Articles:** Public SELECT where `is_published = true`. No public INSERT/UPDATE/DELETE. Admin panel bypasses RLS with service_role key.
- **News:** Public SELECT where `is_published = true`. Authenticated users can CRUD.
- **Reviews:** Public SELECT where `is_published = true`. Admin INSERT/UPDATE/DELETE requires `has_role(auth.uid(), 'admin')`.

---

## 16. Analytics & Tracking

### Page View Tracking

- `usePageView()` hook fires on every route change
- Records: page path, title, referrer, session ID, device type, browser, OS, country, city, bounce status, time on page, UTM parameters
- Data stored in `page_views` table

### Admin Analytics Dashboard

7 tabs at `/admin/analytics`:

1. **Overview** — Page views over time, top pages, peak hours heatmap, real-time visitor count
2. **Content** — Category performance, trending articles, entry/exit pages
3. **Performance** — Content quality indicators, publish frequency, content age analysis, type performance, top content by views
4. **Engagement** — Comment trends, most commented articles, views per user, engagement score
5. **Growth** — Cumulative content growth, weekly views trend, new users over time, category distribution
6. **Audience** — New vs returning visitors, device breakdown, geo data (countries/cities), browsers, OS
7. **Acquisition** — Traffic sources, UTM campaign tracking, landing/exit pages

### Export

Both the main analytics page and the performance tab offer **CSV export** of all data.

---

## 17. Environment Variables & Secrets

All automation scripts load from `/opt/tech-news/.env` via `python-dotenv`.

### 17.1 VPS Environment File (`/opt/tech-news/.env`)

| Variable | Purpose | Used By |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Claude API authentication (`sk-ant-api03-...`) | All generation scripts |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token (`<in /etc/telegram-bots.env — never write it here>`) | Bot + all notification scripts |
| `TELEGRAM_CHAT_ID` | Target Telegram group (`-1003595231315`) | Bot + all notification scripts |
| `SUPABASE_URL` | Supabase REST API base URL (`https://db.techtrendi.com`) | News generator, APIs |
| `SUPABASE_SERVICE_KEY` | Supabase service_role JWT (bypasses RLS) | APIs (Bearer auth), news generator |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as above (duplicate for compatibility) | Some scripts |
| `PEXELS_API_KEY` | Pexels stock photo API | News generator image pipeline |

### 17.2 Frontend Environment (`.env` in source)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | `https://db.techtrendi.com` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key (public reads) |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (admin writes from browser) |

### 17.3 API Authentication

The article and review generation APIs (`article_api.py`, `review_api.py`) authenticate requests using the Supabase service_role key as a Bearer token:

```python
# API side (validation)
auth_header = request.headers.get("Authorization", "")
token = auth_header.replace("Bearer ", "")
if token != os.getenv("SUPABASE_SERVICE_KEY"):
    return jsonify({"error": "Unauthorized"}), 401
```

```javascript
// Frontend side (calling the API)
const res = await fetch("https://db.techtrendi.com/api/generate-article", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ topic, category }),
});
```

### 17.4 Database Access Patterns

| Script Type | How It Accesses DB |
|-------------|-------------------|
| Daily generators (cron) | `docker exec -i supabase-db psql -U postgres -d postgres` (direct SQL via Docker) |
| News generator | Supabase REST API with service_role key |
| Article/Review APIs | `docker exec psql` (same as cron scripts) |
| Telegram bot | `docker exec psql` (same as cron scripts) |
| Frontend (public reads) | Supabase JS client with anon key |
| Frontend (admin writes) | Direct REST API `fetch()` with service_role key |

---

## 18. Free Tools System — Life Progress Bar

The Life Progress Bar (`/tools/life-progress-bar`) is TechTrendi's flagship growth-focused tool — a client-side calculator with no backend/CMS component, unlike the content systems above. It shows a visitor's life as a progress bar (days lived, days/Saturdays remaining) based on birth date + a life-expectancy setting.

### Architecture
- Entirely client-side (`src/pages/tools/LifeProgressBar.tsx`) — no Supabase table, no admin panel entry. All state lives in `localStorage` (`techtrendi_life_progress`).
- Country-based life-expectancy defaults come from a static dataset: `src/data/lifeExpectancyByCountry.ts` (~150 countries, UN/World Bank figures).
- The "Life Card" (downloadable/shareable image) is rendered client-side via Canvas: `src/lib/lifeCardCanvas.ts`, 6 themes (signature/midnight/paper/sunset/forest/ocean), 1080×1350 portrait.

### Growth features (added Jul–Aug 2026)
- **Age-aware featured stat** (`src/lib/lifeFeaturedStat.ts`): the "Your Life Progress" card shows a life-stage-appropriate reframe below the raw percentage — "mornings to come" for ≤25, "Saturdays/years ahead" for 26–64, "months of stories" for 65+. Rotates by day-of-year (deterministic, not per-minute) so it can't flicker mid-visit. Deliberately never leads with "% of life gone."
- **Daily moment** (`src/lib/lifeDailyMoment.ts`): a small card with a different angle on the same stats each calendar day (e.g. "You've now lived through N weeks"). Purely date-derived, no visit-tracking.
- **Opt-in estimated end date**: a quiet "Curious? See your estimated date" link, gated behind an explicit AlertDialog warning ("not a medical prediction"). Confirming reveals `birthDate + lifeExpectancy years` plus a motivational reframe ("N more summers — what will you do with them?").
- **Live clock**: a small ticking real-time clock under the header subtitle — ambient, unrelated to the life-stat math.
- **Haptic pulse**: `CountUp` (used in the animated reveal sequence) fires a ~15ms `navigator.vibrate()` pulse when each big number finishes counting up. Mobile only, silent no-op elsewhere. No sound — deliberately avoided, since audio autoplay reads as spammy far more easily than a barely-there vibration.
- **No daily-streak/return-visit counter.** One was built and shipped, then deliberately removed — a "come back to watch yourself die" loop on a mortality-framed tool is corrosive, not motivating, and isn't what actually drives sharing. If this is reintroduced in the future, keep it framed around reflection, not compulsion.

### Rich link previews (share flow)
Sharing ("Share Your Life Stats") builds a URL with the visitor's stats base64url-encoded in the query string (`src/lib/lifeShareLink.ts`) — stateless, no DB row created. Two server-side pieces make the shared link render as a real preview card in WhatsApp/Twitter/Facebook/iMessage instead of a bare link:

1. **`public/og-meta.php`** (version-controlled here specifically so it deploys with every push instead of drifting from a server-only copy — see `git log -- public/og-meta.php` for the history of it being moved into the repo). Its existing `tools` case special-cases `life-progress-bar` + `?share=`: decodes the payload, serves a personalized `og:title`/`og:description`/`og:image` instead of the generic tool fallback.
2. **`life_card_og.py`** — a Python/Pillow image-rendering microservice on server 144 (`/opt/tech-news/life_card_og.py`), same style as the existing `card_api.py`. Decodes the same share payload, renders a 1200×630 landscape PNG matching the Life Card's visual language. Runs as systemd service `techtrendi-life-og.service` on port 5118, proxied at `https://db2.techtrendi.com/api/og/life-card.png`.

nginx routing note: bot-facing requests to `/tools/*` are rewritten to `og-meta.php?path=$1&$args` (the `&$args` was added specifically to preserve the `?share=` query string through the rewrite — without it, `$_GET['share']` never reaches the PHP script).

To verify the share flow after any change here:
```bash
# Simulate a WhatsApp crawler hitting a real share link
curl -s -A "WhatsApp/2.23.20.0" "https://techtrendi.com/tools/life-progress-bar?share=<payload>" | grep "og:image\|og:title"
```

### Deploy gotcha specific to this tool
`public/og-meta.php` and the age-bracket/daily-moment/OG changes all ship through the normal `npm run build` → GitHub Actions → rsync pipeline like any other page — no special deploy steps. The Python OG-image service (`life_card_og.py`, systemd unit, nginx proxy route) is server-side infrastructure and does **not** redeploy automatically; changes to it need manual `scp` + service restart on 144.

---

## 19. Troubleshooting

### "Oops! Something went wrong" on a page

**Cause:** Missing JS chunk on server. Vite rehashes all chunks on each build. If not all chunks were uploaded, lazy-loaded pages will fail.

**Fix:** Always deploy using the full deploy script:
```bash
tar czf /tmp/tt-dist.tar.gz -C dist .
scp /tmp/tt-dist.tar.gz root@38.242.195.0:/tmp/tt-dist.tar.gz
ssh root@38.242.195.0 "rm -rf /tmp/techtrendi-dist && mkdir -p /tmp/techtrendi-dist && tar xzf /tmp/tt-dist.tar.gz -C /tmp/techtrendi-dist && python3 /opt/techtrendi-deploy.py /tmp/techtrendi-dist"
```

### Admin writes silently failing

**Cause:** Using Supabase anon key for writes. RLS blocks it silently.

**Fix:** All admin mutations must use the service_role key via direct REST API `fetch()` calls (not the Supabase JS client).

### Article/guide not appearing on site

**Check:**
1. Is `is_published = true`?
2. Is the content_type correct (`article` vs `guide`)?
3. Is the slug unique?

### Telegram bot not responding

```bash
ssh root@38.242.195.0
systemctl status techtrendi-article-bot
# If inactive:
systemctl restart techtrendi-article-bot
journalctl -u techtrendi-article-bot -f  # check logs
```

### Article generation API not working

```bash
ssh root@38.242.195.0
systemctl status techtrendi-article-api
# If inactive:
systemctl restart techtrendi-article-api
journalctl -u techtrendi-article-api -f  # check logs
```

### Checking Anthropic API credits

The daily article generator alerts via Telegram when credits drop below $1. To check manually:
```bash
ssh root@38.242.195.0
cd /opt/tech-news && source venv/bin/activate
python3 -c "import anthropic; print(anthropic.Anthropic().messages.create(model='claude-haiku-4-5-20251001', max_tokens=1, messages=[{'role':'user','content':'hi'}]))"
```

---

## Appendix: Quick Reference Commands

```bash
# Build
cd techtrendi && npm run build

# Full deploy (build + upload)
tar czf /tmp/tt-dist.tar.gz -C dist . && \
scp /tmp/tt-dist.tar.gz root@38.242.195.0:/tmp/tt-dist.tar.gz && \
ssh root@38.242.195.0 "rm -rf /tmp/techtrendi-dist && mkdir -p /tmp/techtrendi-dist && tar xzf /tmp/tt-dist.tar.gz -C /tmp/techtrendi-dist && python3 /opt/techtrendi-deploy.py /tmp/techtrendi-dist"

# Verify deployment
curl -s "https://techtrendi.com/" | grep -o 'index-[^"]*\.js'

# Check content counts
ssh root@38.242.195.0 "cd /opt/supabase/docker && docker exec -i supabase-db psql -U postgres -d postgres -c \"
SELECT content_type, COUNT(*) FROM articles GROUP BY content_type;
SELECT 'news' as type, COUNT(*) FROM news;
SELECT 'reviews' as type, COUNT(*) FROM reviews;
\""

# Generate article on-demand
ssh root@38.242.195.0 "cd /opt/tech-news && source venv/bin/activate && python3 generate_article_on_demand.py 'Your Topic Here' 'Category'"

# Check automation services
ssh root@38.242.195.0 "systemctl status techtrendi-article-api techtrendi-article-bot"

# Check cron jobs
ssh root@38.242.195.0 "crontab -l | grep tech-news"

# View article generation logs
ssh root@38.242.195.0 "journalctl -u techtrendi-article-api --since '1 hour ago'"
```

---

## 19. WhatsApp Queue (Admin Broadcasting Dashboard)

A custom admin tool at `/admin/whatsapp-queue` that auto-generates pre-formatted WhatsApp posts for every published article and provides one-tap copy buttons for broadcasting to the TechTrendi WhatsApp Channel and Group.

### Purpose

Eliminates the manual bottleneck of writing fresh WhatsApp posts for each article. Posts are auto-templated by category, stored in the database, and can be edited per-row before copying.

### Database

**Table:** `techtrendi.whatsapp_queue`

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `article_id` | UUID | FK to `articles(id)` ON DELETE CASCADE, UNIQUE |
| `channel_post` | TEXT | Formatted text for the WhatsApp Channel |
| `group_post` | TEXT | Formatted text for the WhatsApp Group (editable independently) |
| `channel_sent_at` | TIMESTAMPTZ | NULL until "Copy for Channel" is clicked |
| `group_sent_at` | TIMESTAMPTZ | NULL until "Copy for Group" is clicked |
| `custom_hook` | TEXT | Optional override for the auto-generated hook line |
| `created_at`, `updated_at` | TIMESTAMPTZ | Audit timestamps |

**Indexes:** `idx_wa_queue_created` (created_at DESC), `idx_wa_queue_article` (article_id), `idx_wa_queue_channel_sent` (partial, where channel_sent_at IS NOT NULL).

**RLS:** Enabled with admin-all policy.

### Template Engine

**PostgreSQL function:** `techtrendi.format_whatsapp_post(title, excerpt, category, slug)`

Generates a WhatsApp-formatted post based on category. The hook is the article excerpt truncated to 100 characters. URL is built as `https://techtrendi.com/blog/{slug}`.

| Category | Template Emoji | Header | CTA |
|----------|----------------|--------|-----|
| Security, Cybersecurity | 🚨 | New Scam Alert | Read the full breakdown |
| How-To | 🛠️ | Fresh on TechTrendi | Try it here |
| Green Tech | 🇬🇭 | New on TechTrendi | Read more |
| AI Tech, Productivity, Career in Tech, Smart Income, Remote Work | 💡 | Fresh on TechTrendi | Full article |
| Phones, Accessories, Gaming | 📱 | New Review | Read it here |
| Default | ✨ | New on TechTrendi | Read more |

To edit a template, modify the `CASE` branches inside the `format_whatsapp_post` function in PostgreSQL.

### Auto-Creation Trigger

**Trigger:** `trg_articles_whatsapp_queue` on `articles` table

Fires `AFTER INSERT OR UPDATE OF is_published` and inserts a new row into `whatsapp_queue` when an article's `is_published` flips to `true`. `ON CONFLICT DO NOTHING` prevents duplicates if an article is unpublished and republished.

```sql
-- Manually re-run for a specific article (e.g. if template changed)
DELETE FROM whatsapp_queue WHERE article_id = 'ARTICLE_UUID';
UPDATE articles SET is_published = false WHERE id = 'ARTICLE_UUID';
UPDATE articles SET is_published = true WHERE id = 'ARTICLE_UUID';
```

### Admin Page Features (`/admin/whatsapp-queue`)

- **3 stat cards:** Pending posts, Sent this week, Sent this month
- **Filter tabs:** All / Pending / Posted
- **Search box:** filters by article title or category
- **Per-row card showing:** category badge, publish age, sent status pills, article title with external link to live article
- **Copy for Channel button** — copies `channel_post` to clipboard via `navigator.clipboard.writeText` AND atomically sets `channel_sent_at = NOW()`
- **Copy for Group button** — same for `group_post`
- **Edit button** — opens two inline textareas for `channel_post` and `group_post` (you can customise each independently before sending)
- **Mark unsent button** — clears both timestamps so you can re-post
- Buttons turn muted-grey after sent ("Copy Channel again" instead of green primary)
- Mobile-responsive — stat cards reflow to 3-col grid, action buttons wrap

### Authentication

Same protection as every other admin page — wrapped in `AdminLayout` which enforces:
- `useAuth()` → redirects to `/auth` if logged out
- `useAdminCheck()` → shows "Access Denied" page if logged in but not admin role

### Files Created

- `src/pages/admin/AdminWhatsAppQueue.tsx` — React component
- Database objects: `whatsapp_queue` table, `format_whatsapp_post()` function, `trg_articles_whatsapp_queue` trigger
- Route added to `src/App.tsx`: `/admin/whatsapp-queue`
- Sidebar link added to `src/pages/admin/AdminLayout.tsx`

### Limitations / Future Enhancements

- **News articles not included** — only the `articles` table has the trigger. To extend, add a second trigger on the `news` table with the same pattern.
- **No bulk actions** — cannot select multiple rows and copy them all at once (planned but not built).
- **No scheduled reminders** — would require browser Notification API or a server cron + email/Telegram (not built).
- **No template editor UI** — templates live in the PostgreSQL function. Edit via SQL or psql.

### Backfill Status

On creation, **246 queue entries** were backfilled for all currently published articles. All articles published from that point forward enter the queue automatically via trigger.

---

## 20. Recent Additions & Changes (April–May 2026)

This section documents everything added or changed in the April–May 2026 sessions that may not be reflected elsewhere in this document.

### 20.1 Prerender.io Integration

The site is a React SPA. Crawlers received empty HTML before content loaded — pages were not being indexed. Prerender.io was integrated to serve fully-rendered HTML to search engine bots.

- **Account email:** itdeshop@gmail.com
- **Prerender token:** `1EdcYcFlucdH1vVxqYgP` (stored in nginx config)
- **Integration point:** nginx server block at `/etc/nginx/sites-enabled/techtrendi.com`
- **Routing logic:**
  - Search engine bots (Googlebot, Bingbot, DuckDuckBot, Applebot, Yandex, Baidu) → Prerender.io for full JS-rendered HTML
  - Social media bots (WhatsApp, Facebook, Twitter, Telegram, LinkedIn, Discord, Pinterest) → `og-meta.php` for fast OG tag responses
  - Normal visitors → React SPA unchanged
- **Sitemap submitted to Prerender.io dashboard** for proactive recaching every 7 days
- **Force recache via API:** `POST https://api.prerender.io/recache` with `prerenderToken` and `url` in JSON body

### 20.2 nginx URL Redirects

WordPress URLs from the 2017 version of the site were still indexed by Google. Added 301 redirects:

```nginx
location ~* ^/20[0-9][0-9]/[0-9]+/[0-9]+/ { return 301 /blog; }
location ~* ^/news-cats/ { return 301 /news; }
location ~* ^/author/ { return 301 /about; }
location ~* ^/category/ { return 301 /blog; }
location ~* ^/tag/ { return 301 /blog; }
location ~* ^/wp-content/ { return 410; }
location ~* ^/wp-includes/ { return 410; }
location ~* ^/wp-admin/ { return 410; }
```

Also added redirects for dead routes (`/guides`, `/premium`, `/digistore` → proper destinations).

### 20.3 Content Security Policy

CSP `connect-src` extended to allow:
- `https://open.er-api.com` (for GHS Exchange Rate tool live rates)

### 20.4 New Public Tools (5 added)

| URL | Purpose |
|-----|---------|
| `/tools/cybersecurity-playbook` | Interactive index of 50 cybersecurity threats with category filter, search, pagination |
| `/tools/momo-fee-calculator` | MTN/Vodafone/AirtelTigo mobile money transfer fee calculator with tier table |
| `/tools/ghana-electricity-calculator` | ECG 2026 tariff bands + 16-appliance usage estimator |
| `/tools/ghana-scam-checker` | Pattern-based scam detection. Supports text paste, screenshot upload, and clipboard image paste via Tesseract.js OCR. Detects 17 scam patterns including Pizzaman/Chickenman vendor impersonation |
| `/tools/ghs-exchange-rate` | Live Ghana Cedi rates vs USD, GBP, EUR, NGN, ZAR, XOF, CAD, AED (powered by open.er-api.com) |

### 20.5 New Public Pages

| URL | Purpose |
|-----|---------|
| `/newsletter` | "Africa Tech Brief" subscription page with weekly format description and 3 content pillars |
| `/reading-list` | Personal bookmarks page reading from localStorage |
| `/blog/real-life-scam-teardowns-ghana-cybersecurity-guide` | Part 1 of 5-part Cybersecurity Playbook series |
| `/blog/password-account-mistakes-cybersecurity-guide-2026` | Part 2 |
| `/blog/smart-home-physical-security-risks-cybersecurity-guide` | Part 3 |
| `/blog/travel-public-space-cybersecurity-traps-2026` | Part 4 |
| `/blog/identity-data-protection-cybersecurity-guide-2026` | Part 5 |
| `/blog/mobile-money-fraud-ghana-momo-scams-2026-guide` | Flagship Ghana MoMo fraud article |

### 20.6 Site Identity Updates

- **Header:** "Ghana's Tech Hub" tagline added below logo (uses responsive SVG flag on desktop, native emoji 🇬🇭 on mobile via Tailwind `md:` breakpoint)
- **Homepage hero banner:** Full-width section under HeroCarousel with Ghana flag colours (red/yellow/green gradient) and quick-access pills to Africa Tech News, MoMo Calculator, Scam Checker
- **Navigation:** "Africa Tech" added as primary nav item linking to `/news?category=Africa Tech`
- **Static `index.html`:** Title now "TechTrendi – Ghana's Tech News, Tools & Digital Insights" with Ghana-focused meta description and keywords (served before React Helmet)
- **Newsletter rebrand:** Renamed from generic "TechTrendi Newsletter" to "Africa Tech Brief" with Ghana-focused content pillars
- **Ghana flag SVG component** at `src/components/ui/ghana-flag.tsx` — used because Windows does not render flag emojis as actual flags (shows "GH" text)

### 20.7 Article Pages — Added Elements

Both `BlogArticle.tsx` and `NewsArticle.tsx` now render:
- **Breadcrumb navigation:** Home / Section / Category / Title
- **AI-Assisted · Editorially Reviewed badge** in the byline
- **Author standardized to "Edmund A."** across all articles, news, and reviews (DB migration applied)

### 20.8 Image Integrity Checker

Nightly cron script at `/opt/tech-news/image_integrity_check.py` (runs 02:30 UTC):

- Scans every article and review for broken cover images
- Detects: Unsplash hotlinks, Supabase storage URLs, missing local files, external HTTP non-200 returns, **duplicate image URLs across articles**
- Auto-fixes via Pexels search using 35+ title-pattern rules
- Telegram report sent only if at least one image was broken
- **Critical:** `/images/articles/` is NOT in the broken-prefix list (this directory exists with user-uploaded Whisk images)

### 20.9 Content Generator Editorial Standards

All Claude-based content generators now enforce:
- **Third-person editorial voice only** — no "I", "my", "we noticed", "caught my attention", "I find"
- **No contractions** — "do not" not "don't"
- **Banned phrases** — "dive into", "delve into", "In a world where", "game-changer", "landscape", "leverage", "robust", "comprehensive", "Furthermore", "Moreover", "crucial", "utilize", "empower", "seamless", "foster", "needless to say", "Here's the thing", "But wait", and 20+ more
- Applied across: `tech_news_generator.py`, `ghana_tech_news.py`, `generate_article_on_demand.py`, `article_api.py`

### 20.10 Pexels Image Quality Controls

Both `ghana_tech_news.py` and `tech_news_generator.py`:
- **Strip banned currency terms** ("banknotes", "coins", "euro", "dollar bills", "currency notes") before sending queries to Pexels — prevents Western Euro/USD imagery being returned for Ghana fintech articles
- **Track used Pexels photo IDs** across articles in the same run — `_used_pexels_ids` set ensures no duplicate images across the 3 articles published per run
- **Query rules in prompt** explicitly require African country/city in every image query

### 20.11 Telegram Notification Changes

- **Removed:** video script messages, trending topics notifications
- **Kept:** article published notifications, social media post text
- **Bot token:** `<in /etc/telegram-bots.env — never write it here>`
- **Chat ID:** `-1003595231315`

### 20.12 DigiStore Products

4 Ghana-specific products added to the `products` table:

| Product | Price |
|---------|-------|
| Ghana Freelancer Starter Pack | GHS 49 |
| Get Your First Tech Job in Ghana | GHS 39 |
| Family Digital Safety Guide | GHS 25 |
| Ghana Smart Money & Tech Bundle | GHS 35 |

Original: "Think Before You Click" cybersecurity ebook by Edmund Adjekum (on the book cover image — book itself is sold via Selar.com).

### 20.13 Database Tables Added

| Table | Purpose | UI Status |
|-------|---------|-----------|
| `scam_experiences` | Public-submitted scam stories with admin moderation | ⚠️ Table created with RLS but UI not built yet |
| `whatsapp_queue` | Auto-generated WhatsApp post queue (see Section 19) | ✅ Live at `/admin/whatsapp-queue` |

### 20.14 SEO & Indexing Status

- Sitemap regenerated to include all individual articles, news, and reviews (current count: ~1,200 URLs)
- Sitemap submitted to Google Search Console (status: Success, all URLs discovered)
- Prerender.io processes the sitemap on a 7-day refresh cycle
- About page stats display: 200+ Articles, 130+ Tools, 12 Topics, 9+ Years Online (static, no animation library — was failing due to double IntersectionObserver issue)

### 20.15 AdSense Compliance Fixes

> **Note:** this section covers *content/E-E-A-T compliance* for the AdSense
> application. For how ads are technically wired (Auto Ads, Consent Mode, why
> `src/components/ads/*` is dead code) and what to check when revenue is zero,
> see [`DOCS/ADSENSE.md`](DOCS/ADSENSE.md).

Before reapplying for AdSense (rejected previously):
- ✅ Per-article AI disclosure badge
- ✅ Author attribution to named person (Edmund A.) — required for E-E-A-T
- ✅ AdSense + AI content sections added to `/disclosure` page
- ✅ Soft 404 routes redirected (no more "Page Not Found" with 200 status)
- ✅ All ALL-CAPS sensationalist headings removed from Creepy Tech content
- ✅ Review scores diversified (no more 4.2 across multiple products)
- ✅ Scoring scale explanation added: "Rated out of 5 — based on performance, value, build quality, and real-world usability"
- ✅ Clickbait first-person review/article headlines rewritten

### 20.16 Cloudflare Configuration

- **Browser Integrity Check:** Disabled (was blocking Claude.ai web browsing)
- **AI Crawl Control:** ClaudeBot, Claude-User, Claude-SearchBot all set to Allow
- **Block AI Scrapers and Crawlers:** Disabled at the global toggle
- **Cache:** Standard Cloudflare caching. Manual purge required after deploys that change `index.html` content (visit Caching → Configuration → Purge Everything in Cloudflare dashboard)


