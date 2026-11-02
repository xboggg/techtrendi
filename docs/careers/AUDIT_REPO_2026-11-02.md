# TechTrendi Careers — Repository Audit (read-only)

Date: 2026-11-02 · Repo: github.com/xboggg/techtrendi (public) · Commit audited: 33f00eb (main, "Deploy: stop passing the Groq key into the build")
Scope: repository only. The server has NOT been audited yet; anything about the live server below is REPORTED (from repo docs) unless marked otherwise.
Method: shallow clone, file inventory, manifest and workflow review, secret-pattern scan (file names and roles only; no values were printed or copied).

---

## 0. Act on this first — two secrets to rotate

| # | Finding | Why it matters | Action (owner, today) |
|---|---|---|---|
| S-1 | A Telegram bot token is hard-coded in `scripts/generate-reviews.py` (`TELEGRAM_TOKEN = "..."`). The repo is public, so the token is public and in git history. | Anyone can send messages as that bot, read its updates, or abuse it. Removing the line does not help — history is public. | In Telegram, open @BotFather → `/revoke` for that bot → new token. Put the new token only in the server's env file. Then remove the line from the script and commit. |
| S-2 | The latest commit message says the Groq key used to be passed into the frontend build. Anything in a `VITE_*` variable is embedded in the public JavaScript bundle. | If earlier builds shipped it, the key has been publicly downloadable from techtrendi.com. | Rotate the Groq key in the Groq console and update the nginx `/api/ai/*` config on the server. Treat the old one as compromised. |

Not a problem: three files (`public/og-meta.php`, `public/article-exists.php`, `scripts/refresh-articles.cjs`) contain the Supabase **anon** key (role=anon, verified by decoding the JWT header/payload only). Anon keys are designed to be public and are protected by RLS. Note: two of them expire **2027-01-09**; put a renewal reminder in the calendar.

---

## 1. Verified from the repository

### Stack
- React 18 + TypeScript + Vite, shadcn/ui (Radix), Tailwind, react-router-dom v6, TanStack Query, framer-motion, react-helmet-async. **Matches the blueprint.**
- Static-site generation with `vite-react-ssg`: `npm run build` fetches data bundles and hero slides from the DB, prerenders routes, then generates the sitemap. There is **no runtime Node server**; nginx serves `dist/`.
- `src/App.tsx` registers **209 routes** in one file. Adding `/careers/*` means adding to that file and to `src/ssg/routes` for prerendering.
- Supabase client: `@supabase/supabase-js` with the **publishable (anon) key**, schema option set to `techtrendi`. Auth is email/password (`signUp`, `signInWithPassword`, `onAuthStateChange`) in `src/contexts/AuthContext.tsx`. **Reusable for Careers.**
- `src/pages/` already has `Auth.tsx`, `Profile.tsx`, `Dashboard.tsx`, plus career-adjacent tools: `/tools/job-tracker`, `/tools/career-matcher`, `/tools/resume-builder`, `/tools/cover-letter-generator`, `/tools/salary-comparison`, `/career-in-tech`, `/remote-work`. These appear to be client-side tools, not DB-backed products — to confirm. Careers should link to or absorb them, not duplicate them.
- Scam reporting already exists: `/report-scam`, `/scam-alerts`, `/admin/scam-reports`, tables `security_scam_reports`, `security_scam_alerts`, `security_scam_stories`. **Reuse for SCAM-01** rather than building a second reporting flow.

### Python services
- `card_api.py`, `vps-scripts/phone_compare_api.py`, `vps-scripts/rewrite_api.py` use Python's built-in **`http.server`** — no Flask, no FastAPI. One systemd unit is committed (`vps-scripts/techtrendi-phone-api.service`). They authenticate requests with the Supabase service-role key read from env.
- `NEWS_SERVICES_DOCUMENTATION.md` (dated 1 Nov 2026) describes three cron-driven pipelines under `/opt/tech-news/` that use the **Anthropic API** (Claude), **Pexels** and **Telegram** notifications to a TechTrendi group. The main news pipeline code itself (`ghana_tech_news.py`, `feed_health.py`) is **not in this repo**.
- Consequence for Careers: FastAPI + uvicorn would be the first web framework on this server. Acceptable (systemd unit + venv matches the existing pattern) but it is a new dependency, not a reuse. Recorded as D-005 confirmation needed.

### Database
- Migrations in `supabase/migrations/` create tables in **both** `public.*` and `techtrendi.*` (arcade, hero_slides, scam stories in `techtrendi`; articles, profiles, user_roles, saved_searches, user_preferences, notifications, price_alerts in `public`). Docs say "techtrendi schema"; reality is mixed. The server audit must show what actually exists.
- 245 `enable row level security` / `create policy` statements across migrations, so RLS is in active use. Policy quality not reviewed yet.
- Name collisions to avoid: `public.saved_searches`, `public.user_preferences`, `public.notifications`, `public.profiles` already exist. **Careers must use its own `careers` schema (D-006) — confirmed as necessary, not just preferred.**
- Several Supabase Edge Functions exist (`ai-generate`, `ai-recommendations`, `send-notification`, `check-price-alerts`, Stripe-related `create-checkout`, `customer-portal`, `check-subscription`). Whether they are deployed on the self-hosted instance is unknown.

### Deployment
- GitHub Actions on push to `main`: `npm ci` → deploy-guard self-test → build (VITE_* from Actions secrets) → tar → `scp` to server → `/usr/local/bin/techtrendi-install` → smoke test. Also a daily 11:30 UTC rebuild.
- SSH as `root` with a dedicated ed25519 key **locked by a ForceCommand wrapper** to two operations. Good practice.
- Install script mirrors with `rsync -a --delete` into `/var/www/techtrendi/`; two build guards prevent a DB outage from wiping article pages. Good practice, and relevant: **job pages must not be prerendered the same way** — 50,000 jobs cannot be rebuilt into static HTML on every deploy. Job detail pages need a runtime path (client render + bot prerender via the existing `prerender.php`/`og-meta.php` pattern, or nginx → FastAPI for crawlers). Design item for Phase 2.
- `.gitignore` excludes `.env*`, keys, certs, backups. Correct.

### Backups (reported in DOCS/DISASTER_RECOVERY.md)
- Daily 02:00 UTC `rclone` to Google Drive from `/opt/trendimovies/backup/backup.sh`, including a techtrendi schema dump and server configs. Off-VPS destination — meets the blueprint's minimum. Quarterly restore drill is documented; **date of last drill unknown**.

### Server (reported only)
- Contabo VPS 144.91.71.106, Düsseldorf. nginx; Cloudflare proxied for techtrendi.com/www/admin; `db2.techtrendi.com` is **DNS-only and serves Supabase Studio publicly**.
- Host is **shared** with cyberabofra, trendimovies, trendicars, learn.techtrendi.com. Capacity for Careers is unknown until measured.
- Existing nginx `/api/*` locations proxy to loopback ports 5111–5118; nginx injects the Groq key for `/api/ai/*`.

---

## 2. Unknowns (server audit needed — T-002)
- CPU, RAM, disk headroom; current load from the AI news crons and other sites.
- Actual PostgreSQL version, extensions (pg_trgm? PostGIS?), schemas present, DB size, connection usage, which roles have BYPASSRLS.
- How Supabase is deployed (Docker compose path), which containers are exposed, whether Studio at db2 requires authentication.
- Free loopback port for the Careers API.
- Whether `/opt/tech-news/` code is under any version control.
- Date and result of the last restore drill.

---

## 3. Risks and recommendations

| Severity | Risk | Recommendation |
|---|---|---|
| High | Leaked Telegram token and possibly Groq key (S-1, S-2). | Rotate both today. |
| High | Supabase Studio reachable on the public internet at db2. | Verify Studio auth is on and strong; consider restricting to Cloudflare Access (free tier) or an IP allowlist. Not a Careers task, but Careers data will live in that database. |
| Medium | Public repo means the Careers backend code will be public too. | Fine if config stays in env. Decide explicitly (D-014). |
| Medium | Schema sprawl (public vs techtrendi) and existing tables with the same names Careers wants. | `careers` schema, mandatory. |
| Medium | Shared host; existing AI pipelines already consume CPU/DB. | Measure before setting ingestion concurrency; blueprint's "pause ingestion before degrading news" rule must be implemented as a real backpressure check. |
| Medium | Static-build model does not fit thousands of job pages. | Runtime job pages + crawler prerender path; decide in Phase 2. |
| Low | Anon keys expire 2027-01-09. | Calendar reminder; rotate on the server and in Actions secrets. |
| Low | Existing Python services use `http.server`; FastAPI is new to this box. | Accept; keep one venv, one systemd unit per process, same log location pattern. |

---

## 4. Good things to build on
Working CI/CD with a locked deploy key; off-site backups; a real auth system and profile pages; existing scam-report flow and admin area; Telegram already in use; a documented news pipeline and design system; `DOCS/` is current (Nov 2026) and well written.

## 5. Next steps
1. Owner: rotate the two secrets (section 0).
2. Owner: run `careers_audit_readonly.sh` on the VPS and share the sanitized output (T-002), plus Cloudflare screenshots (T-003).
3. Claude: combine with this report into the final Phase 0 audit, confirm D-005/D-006, and produce the Phase 1 plan.
