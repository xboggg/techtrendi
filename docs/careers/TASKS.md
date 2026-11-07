# TechTrendi Careers — Tasks

Status: todo / doing / blocked / done. Evidence column = commit, file, report or "none yet".
Updated: 2026-11-06 after Step 0 (server check, leaked-token fix, staging built). Owner approved D-019, D-023–D-028.

## Phase 0 — Discovery and rights (no production changes)

| # | Task | Owner | Status | Evidence |
|---|---|---|---|---|
| T-000 | URGENT: revoke and rotate the Telegram bot token hard-coded in `scripts/generate-reviews.py` (public repo); rotate the Groq key used by nginx `/api/ai/*`. Remove the hard-coded line and commit. | Eddie / Claude | done 2026-11-06: the leaked token is already dead (Telegram 401); the server uses a different, working token for @technews_highlight_bot; hard-coded line replaced by env `TELEGRAM_BOT_TOKEN` on main. Groq key replaced 2 Nov (owner still to delete the old key at Groq) | getMe checks 2026-11-06; commit on main |
| T-001 | Give Claude read access to the repository. | Eddie | done | public repo cloned at commit 33f00eb |
| T-001b | Repository audit. | Claude | done | AUDIT_REPO_2026-11-02.md |
| T-002 | Read-only server check. | Claude (owner yes 6 Nov) | done 2026-11-06: 6 vCPU, 11 GiB RAM (7.4 GiB free), disk 147 GB free of 193, load ~1.4; Python 3.12.3; Supabase PG 15.8 (pg_trgm/unaccent/postgis available, not installed); PostgREST schemas techtrendi,cyberabofra,public,storage,graphql_public; daily off-site backup 02:00 to gdrive:144-main (restored 2026-10-16). **Finding:** Docker publishes 5433/6543 (pooler) and 8000/8443 (Kong) on all interfaces, bypassing ufw; only scanners use them → T-019 | evidence/staging-2026-11-06.txt |
| T-003 | Share Cloudflare settings as screenshots: DNS records for techtrendi.com and db2, SSL mode, cache rules, any WAF/rate-limit rules. | Eddie | todo | none yet |
| T-004 | Confirm how self-hosted Supabase is deployed (Docker compose path, which services are exposed publicly, Studio access). | Eddie | todo | none yet |
| T-005 | Confirm backup situation: what is backed up, where (must be off-VPS), when last restored. | Eddie | todo | none yet |
| T-006 | Approve or amend proposed decisions D-003 to D-013. | Eddie | todo | DECISIONS.md |
| T-007 | Produce verified infrastructure audit report (verified / unknown / risk) from T-001–T-005. | Claude | blocked by T-001, T-002 | none yet |
| T-008 | Draft SOURCE_REGISTER.csv with Remotive + candidate employer boards; complete Section 19A record for each; nothing enabled until approved. | Claude drafts, Eddie approves | Remotive terms checked 2026-11-02; alerts/analytics rights unknown → owner to email hello@remotive.com; employer boards pending curation | SOURCE_REGISTER.csv |
| T-009 | Draft data-flow map and risk register for the pilot. | Claude | blocked by T-007 | none yet |
| T-010 | Name the privacy/legal contact and operating entity (NovaStream Digital?). Check Ghana DPC registration requirement and Nigeria NDPA applicability. | Eddie | todo | none yet |
| T-011 | Capacity measurement. | Claude | done 2026-11-06: ample headroom for the pilot (see T-002); DB 42 MB + 723 MB analytics; 43/100 connections | T-002 |
| T-012 | Verify Supabase Studio at db2.techtrendi.com requires authentication; consider Cloudflare Access or IP allowlist. | Eddie (Claude advises) | todo | none yet |
| T-013 | Calendar reminder: Supabase anon keys in public/*.php and scripts expire 2027-01-09; rotate on server and in Actions secrets. | Eddie | todo | none yet |
| T-014 | Confirm whether `/opt/tech-news/*.py` is under version control anywhere; if not, back it into a private repo. | Eddie | todo | none yet |
| T-015 | Review existing `/tools/job-tracker`, `resume-builder`, `cover-letter-generator`, `career-matcher` and `/report-scam` to decide reuse vs absorb (D-015). | Claude | done | PHASE1_PLAN.md §1: tools are localStorage-only (link now, absorb later); scam reports get a new `careers.job_reports` table, shared admin UI |
| T-016 | Draft Phase 1 plan with reversible defaults. | Claude | done | PHASE1_PLAN.md |
| T-017 | Create staging database + roles. | Claude (owner yes 6 Nov) | done 2026-11-06 as supabase_admin; passwords generated on the server, never displayed | deploy/careers/README.md |
| T-019 | Close Docker-published DB/gateway ports (5433, 6543, 8000, 8443) to the internet (DOCKER-USER rule or bind to 127.0.0.1). Shared Supabase infra: needs owner yes + a maintenance plan. | Claude proposes, Eddie approves | todo | T-002 |
| T-018 | Owner emails Remotive to ask about Telegram alert excerpts, analytics use and commercial display before SRC-001 is approved. | Eddie | todo | SOURCE_REGISTER.csv SRC-001 |

## Phase 1 — Foundation in staging (starts only after Phase 0 exit)

| # | Task | Owner | Status | Evidence |
|---|---|---|---|---|
| T-101 | Create `careers` schema migration skeleton + scoped roles + RLS tests. | Claude | done (local) | careers-service/migrations/001–004, tests/test_roles.py, evidence/phase1-tests-2026-11-02.txt |
| T-102 | FastAPI skeleton with /health, /ready, /jobs (empty), OpenAPI. | Claude | done (local) | careers-service/app, tests/test_api.py |
| T-103 | Database work-queue table + worker claim loop (SKIP LOCKED) + tests. | Claude | done (local) | migrations/003, workers/, tests/test_queue.py |
| T-104 | Source registry tables + "disabled by default" enforcement test. | Claude | done (local) | migrations/002, tests/test_rights_gate.py |
| T-105 | Staging environment. | Claude | done 2026-11-06 (D-019): API 127.0.0.1:5121 + noop worker, systemd limits 512M/384M | evidence/staging-2026-11-06.txt |
| T-106 | Migration apply + rollback rehearsal; site still fine. | Claude | done 2026-11-06: 001–004 applied to careers_staging; full test suite (incl. apply/rollback/re-apply) 33 passed on the server in a throwaway PG15 container; techtrendi.com 200 | evidence/staging-2026-11-06.txt |
| T-107 | Owner reviews and merges PR #1 (`careers/phase-1`). | Eddie (merged by Claude at owner's request) | done 2026-11-02; deploy run 41521900465 all steps success, smoke test 200 | https://github.com/xboggg/techtrendi/pull/1 |
| T-108 | Server setup kit: staging SQL, systemd unit templates, nginx staging block, env template, runbook. | Claude | done (templates, not installed) | deploy/careers/ (PR #2) |

## Pilot step 1 — Jobs board (D-024), next up

| # | Task | Owner | Status | Evidence |
|---|---|---|---|---|
| T-201 | Migration 005: jobs + job_eligibility, rights gates, scheduler, expiry, `public_jobs` view (organisations and job_locations folded into jobs for the pilot; job_reports moves to T-203 with the report button) + tests | Claude | done 2026-11-07: applied to careers_staging; 75 tests passed (throwaway PG15) | evidence/collector-2026-11-07.txt |
| T-206 | Automatic collector (D-029): adapters for Himalayas, Jobicy, We Work Remotely, Remote OK, Remotive, Greenhouse, Lever, Ashby, Workable; eligibility + scam checks; worker `techtrendi-careers-worker@staging-collect` | Claude | done 2026-11-07 on staging (auto_publish off) | evidence/collector-2026-11-07.txt |
| T-207 | Group B permissions: ReliefWeb appname form, Jobweb Ghana, MyJobMag, OpenTrain AI, Jobberman, Careerjet publisher sign-up | Eddie (drafts from Claude) | in progress — drafts handed over 7 Nov | SOURCES.md |
| T-208 | Owner chooses per source: automatic publishing or tap-to-approve (D-030) | Eddie | todo | — |
| T-202 | Jobs Desk on Telegram (forward link/flyer → draft in own words + original link → Publish/Change/Bin), modelled on the TechTrendi Story Desk | Claude | todo | — |
| T-203 | /careers list + job pages in the SSG build with JobPosting data; AdSense/SEO diff check before live (D-023, D-026) | Claude | todo | — |
| T-204 | Employer "Post a job" form → pending queue → owner approval | Claude | todo | — |
| T-205 | TechTrendi Jobs Telegram channel daily post (D-027); owner creates the channel and adds the bot as admin | Eddie + Claude | todo | — |
