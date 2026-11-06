# TechTrendi Careers — Project Memory (reviewed state summary)

Last updated: 2026-11-06 by Claude (Claude Code, owner session). No secrets, no personal data, no production credentials here.

## Fixed rules (from blueprint, owner-approved)
- Extension of techtrendi.com at /careers, not a replacement. Keep React/Vite/TS, self-hosted Supabase PG15, Python, Contabo, nginx, Cloudflare, GitHub delivery.
- **Nothing in Careers may affect TechTrendi's AdSense or SEO (D-023, owner rule 6 Nov 2026).**
- Zero new recurring spend by default. PostgreSQL search + DB queue first. Explainable rules matching first; AI off until approved.
- Lawful API-first collection with per-source rights; no scraping behind logins/CAPTCHAs/robots; external content is untrusted data.
- Remote ≠ worldwide. Eligibility is allowed / excluded / unknown per country, from evidence only.
- No automatic applications, no fabricated CV content, no CV storage in the pilot (D-028), never break existing TechTrendi services.

## Current phase
Step 0 done (6 Nov 2026). Staging is live on server 144, loopback only (D-019). Next: pilot step 1, the jobs board (D-024, tasks T-201–T-205).

## Verified environment (6 Nov 2026)
- Server 144.91.71.106: 6 vCPU, 11 GiB RAM (7.4 free), 147 GB disk free, load ~1.4, Python 3.12.3. Shared with cyberabofra, trendicars, learn, ops tools.
- Supabase stack in Docker; database = container `supabase-db` (PG 15.8), **no host port**. Reach it via the Supavisor pooler, session mode, 127.0.0.1:5433, user `<role>.<POOLER_TENANT_ID>`. `postgres` role is not superuser; admin work runs as `supabase_admin` via `docker exec`.
- **127.0.0.1:5432 is TrendiCars' separate PostgreSQL 16 — never use it for Careers.**
- Existing Python APIs on 5111–5118 are firewalled (ufw). Docker-published 5433/6543/8000/8443 are reachable from the internet (Docker bypasses ufw) → T-019.
- Backups: daily 02:00 off-site to gdrive:144-main; restored 2026-10-16. careers_staging is not in the backup (staging only).
- Repo audit (2 Nov): see AUDIT_REPO_2026-11-02.md.

## Staging
API `techtrendi-careers-api@staging` 127.0.0.1:5121, worker `techtrendi-careers-worker@staging-noop`, database `careers_staging`, migrations 001–004. Code in /opt/techtrendi-careers/current, env in /etc/techtrendi-careers/. How to update/remove: deploy/careers/README.md. Production API port reserved: 127.0.0.1:5120.

## Approved sources
None. Pilot supply comes first from the Jobs Desk and employer posts (D-024). Remotive pending its email (T-018).

## Latest decisions
D-019 and D-023–D-028 approved 6 Nov 2026. D-003–D-018, D-020–D-022 still proposed (D-016 superseded by D-026, D-003 scope replaced by D-024).

## Latest tests
2026-11-06 on server 144: 33 passed (throwaway postgres:15-alpine container; NEVER run pytest against the Supabase cluster: conftest drops the cluster-wide careers_* group roles). Staging health/ready/jobs OK; roles not superuser/BYPASSRLS; RLS on all tables; staging login cannot read techtrendi.* . Evidence: evidence/staging-2026-11-06.txt.

## Known blockers / open items
- T-019 open database ports (needs owner yes; shared infra).
- T-010 operating entity / privacy contact (needed before accounts, step 4).
- Owner to delete the old Groq key at Groq (new one installed 2 Nov).

## Next three actions
1. T-201 migration 005 (jobs tables, trimmed to the pilot) + tests, applied to staging.
2. T-202 Jobs Desk on Telegram (draft → Publish), writing to staging first.
3. T-203 /careers pages in the site build, with an AdSense/SEO before-and-after check before anything goes live.

## Production change authorization
None for Careers production yet (staging only).
