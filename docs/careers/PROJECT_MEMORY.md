# TechTrendi Careers — Project Memory (reviewed state summary)

Last updated: 2026-11-07 by Claude (Claude Code, owner session). No secrets, no personal data, no production credentials here.

## Fixed rules (from blueprint, owner-approved)
- Extension of techtrendi.com at /careers, not a replacement. Keep React/Vite/TS, self-hosted Supabase PG15, Python, Contabo, nginx, Cloudflare, GitHub delivery.
- **Nothing in Careers may affect TechTrendi's AdSense or SEO (D-023, owner rule 6 Nov 2026).**
- Zero new recurring spend by default. PostgreSQL search + DB queue first. Explainable rules matching first; AI off until approved.
- Lawful API-first collection with per-source rights; no scraping behind logins/CAPTCHAs/robots; external content is untrusted data.
- Remote ≠ worldwide. Eligibility is allowed / excluded / unknown per country, from evidence only.
- No automatic applications, no fabricated CV content, no CV storage in the pilot (D-028), never break existing TechTrendi services.

## Current phase
Step 0 done (6 Nov 2026). 7 Nov: automatic collector running on staging (D-029, T-201, T-206): 12 Group A sources,
2,431 jobs published automatically (owner: "go live by itself", D-034), 45 waiting for review. Nothing on techtrendi.com yet.
Next: T-203 /careers pages with the AdSense/SEO check; Group B permissions (T-207); AI scout later (T-209).

## Verified environment (6 Nov 2026)
- Server 144.91.71.106: 6 vCPU, 11 GiB RAM (7.4 free), 147 GB disk free, load ~1.4, Python 3.12.3. Shared with cyberabofra, trendicars, learn, ops tools.
- Supabase stack in Docker; database = container `supabase-db` (PG 15.8), **no host port**. Reach it via the Supavisor pooler, session mode, 127.0.0.1:5433, user `<role>.<POOLER_TENANT_ID>`. `postgres` role is not superuser; admin work runs as `supabase_admin` via `docker exec`.
- **127.0.0.1:5432 is TrendiCars' separate PostgreSQL 16 — never use it for Careers.**
- Existing Python APIs on 5111–5118 are firewalled (ufw). Docker-published 5433/6543/8000/8443 are reachable from the internet (Docker bypasses ufw) → T-019.
- Backups: daily 02:00 off-site to gdrive:144-main; restored 2026-10-16. careers_staging is not in the backup (staging only).
- Repo audit (2 Nov): see AUDIT_REPO_2026-11-02.md.

## Staging
API `techtrendi-careers-api@staging` 127.0.0.1:5121, workers `techtrendi-careers-worker@staging-noop` and `@staging-collect` (source_fetch + scheduler), database `careers_staging`, migrations 001–006. Code in /opt/techtrendi-careers/current, env in /etc/techtrendi-careers/. How to update/remove: deploy/careers/README.md. Production API port reserved: 127.0.0.1:5120.

## Approved sources
Group A (owner, 7 Nov 2026), see SOURCES.md: Himalayas, Jobicy, We Work Remotely, Remote OK, Remotive, and the employer
boards of Moniepoint, Zipline, Jumia, FairMoney, Kuda, M-KOPA, Welo Global. Group B awaiting the sources' permission (T-207).
Feed jobs: noindex cards, credit + link, NO JobPosting markup (Himalayas/Remotive forbid it).

## Latest decisions
D-029–D-033 (7 Nov 2026: Group A, auto_publish off, latest-feed expiry, live-data eligibility rules, scheduler key). D-019 and D-023–D-028 approved 6 Nov 2026. D-003–D-018, D-020–D-022 still proposed (D-016 superseded by D-026, D-003 scope replaced by D-024).

## Latest tests
2026-11-07 on server 144: 81 passed (evidence/collector-2026-11-07.txt). 2026-11-06: 33 passed (throwaway postgres:15-alpine container; NEVER run pytest against the Supabase cluster: conftest drops the cluster-wide careers_* group roles). Staging health/ready/jobs OK; roles not superuser/BYPASSRLS; RLS on all tables; staging login cannot read techtrendi.* . Evidence: evidence/staging-2026-11-06.txt.

## Known blockers / open items
- T-019 open database ports (needs owner yes; shared infra).
- T-010 operating entity / privacy contact (needed before accounts, step 4).
- Owner to delete the old Groq key at Groq (new one installed 2 Nov).

## Next three actions
1. T-207 owner: send the Group B requests.
2. T-203 /careers pages in the site build (feed jobs as noindex cards), with an AdSense/SEO before-and-after check before anything goes live.
3. T-202 Jobs Desk on Telegram for local jobs the feeds do not have (Ghana is thin: ~60 local jobs from employer boards).

## Production change authorization
Jobs board page live at /careers since 8 Nov 2026 (owner: "Put it online"); its job list is served by the staging Careers service. No separate production Careers service yet.
