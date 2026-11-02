# TechTrendi Careers — Tasks

Status: todo / doing / blocked / done. Evidence column = commit, file, report or "none yet".
Updated: 2026-11-02 after Phase 1 code written and tested locally (Claude; owner to confirm).

## Phase 0 — Discovery and rights (no production changes)

| # | Task | Owner | Status | Evidence |
|---|---|---|---|---|
| T-000 | URGENT: revoke and rotate the Telegram bot token hard-coded in `scripts/generate-reviews.py` (public repo); rotate the Groq key used by nginx `/api/ai/*`. Remove the hard-coded line and commit. | Eddie | todo | AUDIT_REPO_2026-11-02.md §0 |
| T-001 | Give Claude read access to the repository. | Eddie | done | public repo cloned at commit 33f00eb |
| T-001b | Repository audit. | Claude | done | AUDIT_REPO_2026-11-02.md |
| T-002 | Run `careers_audit_readonly.sh` on the VPS, review output for secrets, share it. | Eddie | todo | none yet |
| T-003 | Share Cloudflare settings as screenshots: DNS records for techtrendi.com and db2, SSL mode, cache rules, any WAF/rate-limit rules. | Eddie | todo | none yet |
| T-004 | Confirm how self-hosted Supabase is deployed (Docker compose path, which services are exposed publicly, Studio access). | Eddie | todo | none yet |
| T-005 | Confirm backup situation: what is backed up, where (must be off-VPS), when last restored. | Eddie | todo | none yet |
| T-006 | Approve or amend proposed decisions D-003 to D-013. | Eddie | todo | DECISIONS.md |
| T-007 | Produce verified infrastructure audit report (verified / unknown / risk) from T-001–T-005. | Claude | blocked by T-001, T-002 | none yet |
| T-008 | Draft SOURCE_REGISTER.csv with Remotive + candidate employer boards; complete Section 19A record for each; nothing enabled until approved. | Claude drafts, Eddie approves | Remotive terms checked 2026-11-02; alerts/analytics rights unknown → owner to email hello@remotive.com; employer boards pending curation | SOURCE_REGISTER.csv |
| T-009 | Draft data-flow map and risk register for the pilot. | Claude | blocked by T-007 | none yet |
| T-010 | Name the privacy/legal contact and operating entity (NovaStream Digital?). Check Ghana DPC registration requirement and Nigeria NDPA applicability. | Eddie | todo | none yet |
| T-011 | Capacity measurement: CPU/RAM/disk headroom under current load, DB size and connection usage (from audit output). | Claude | blocked by T-002 | none yet |
| T-012 | Verify Supabase Studio at db2.techtrendi.com requires authentication; consider Cloudflare Access or IP allowlist. | Eddie (Claude advises) | todo | none yet |
| T-013 | Calendar reminder: Supabase anon keys in public/*.php and scripts expire 2027-01-09; rotate on server and in Actions secrets. | Eddie | todo | none yet |
| T-014 | Confirm whether `/opt/tech-news/*.py` is under version control anywhere; if not, back it into a private repo. | Eddie | todo | none yet |
| T-015 | Review existing `/tools/job-tracker`, `resume-builder`, `cover-letter-generator`, `career-matcher` and `/report-scam` to decide reuse vs absorb (D-015). | Claude | done | PHASE1_PLAN.md §1: tools are localStorage-only (link now, absorb later); scam reports get a new `careers.job_reports` table, shared admin UI |
| T-016 | Draft Phase 1 plan with reversible defaults. | Claude | done | PHASE1_PLAN.md |
| T-017 | Owner creates staging database + migrator role from SQL Claude supplies (no password shared with Claude). | Eddie | SQL ready: deploy/careers/staging_setup.sql; run after T-002 confirms Postgres access | deploy/careers/ |
| T-018 | Owner emails Remotive to ask about Telegram alert excerpts, analytics use and commercial display before SRC-001 is approved. | Eddie | todo | SOURCE_REGISTER.csv SRC-001 |

## Phase 1 — Foundation in staging (starts only after Phase 0 exit)

| # | Task | Owner | Status | Evidence |
|---|---|---|---|---|
| T-101 | Create `careers` schema migration skeleton + scoped roles + RLS tests. | Claude | done (local) | careers-service/migrations/001–004, tests/test_roles.py, evidence/phase1-tests-2026-11-02.txt |
| T-102 | FastAPI skeleton with /health, /ready, /jobs (empty), OpenAPI. | Claude | done (local) | careers-service/app, tests/test_api.py |
| T-103 | Database work-queue table + worker claim loop (SKIP LOCKED) + tests. | Claude | done (local) | migrations/003, workers/, tests/test_queue.py |
| T-104 | Source registry tables + "disabled by default" enforcement test. | Claude | done (local) | migrations/002, tests/test_rights_gate.py |
| T-105 | Staging environment defined. Default proposed: same VPS, separate `careers_staging` database, own port, basic-auth nginx block. | Eddie decides | todo | PHASE1_PLAN.md §1 |
| T-106 | Migration apply + rollback rehearsal in staging; existing TechTrendi smoke test still passes. | Claude | partial: rehearsed on local PG16 (tests/test_migrations.py); deploy-guard self-test passed; STAGING rehearsal pending T-017/T-105 | evidence/phase1-tests-2026-11-02.txt |
| T-107 | Owner reviews and merges PR #1 (`careers/phase-1`). | Eddie (merged by Claude at owner's request) | done 2026-11-02; deploy run 41521900465 all steps success, smoke test 200 | https://github.com/xboggg/techtrendi/pull/1 |
| T-108 | Server setup kit: staging SQL, systemd unit templates, nginx staging block, env template, runbook. | Claude | done (templates, not installed) | deploy/careers/ (PR #2) |
