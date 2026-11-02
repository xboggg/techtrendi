# TechTrendi Careers — Phase 1 Plan (Foundation in staging)

Drafted 2026-11-02 by Claude. Status: PROPOSED. Nothing in this plan is built yet.
Inputs: Master Blueprint §14–§17, §21 Phase 1; AUDIT_REPO_2026-11-02.md; DECISIONS.md D-003–D-017.
Pending: the server audit (T-002). Items marked [SERVER] may change once it arrives.

## 1. Reversible defaults assumed (owner can overturn any of these)
| Topic | Default used in this plan | Why |
|---|---|---|
| Launch markets | Ghana + Nigeria + remote roles | Blueprint §1 |
| Staging | Same VPS; separate database `careers_staging` on the existing Postgres cluster; separate FastAPI process on its own loopback port; nginx server block `staging.techtrendi.com` protected by HTTP basic auth (or Cloudflare Access free tier). | Zero cost; a separate *database* (not just schema) gives clean isolation and lets us rehearse migrations exactly as production will run them. [SERVER] port and capacity to confirm. |
| Production DB placement | Schema `careers` inside the same database the site already uses | D-006/D-017; backups already cover that database (reported) |
| Backend framework | FastAPI + uvicorn, Python 3.11+, one venv at `/opt/techtrendi-careers/venv` | D-005; first web framework on this box, see audit |
| Process manager | systemd units, same style as `vps-scripts/techtrendi-phone-api.service` | Matches existing pattern |
| Admin identity | Reuse `public.is_admin()` / `public.user_roles` for admin checks | Already used by scam-reports admin; avoids a second role system |
| Scam reports | New `careers.job_reports` table (job_id FK, SCAM-01 categories, rate limit) + extend `/admin/scam-reports` UI to show both queues. Do NOT reuse `security_scam_reports` rows (its categories are for SMS/WhatsApp scams and it allows unlimited anonymous inserts). | Refines D-015 |
| Existing tools | Link to `/tools/job-tracker`, `resume-builder`, `cover-letter-generator`, `career-matcher` from Careers in the pilot; they are localStorage-only client tools with no DB. Absorb job-tracker into `careers.applications` in Phase 4. | T-015 finding |

## 2. What Phase 1 delivers (no sources enabled, no users yet)
1. **Repo structure**: `careers-service/` (FastAPI app, workers, migrations, tests), `docs/careers/` (blueprint, tracking files, audits), `CLAUDE.md` at root. Frontend untouched except a feature-flagged placeholder route `/careers` that renders "coming soon" and is excluded from the sitemap.
2. **Migrations** (SQL files, additive, numbered, with a down-migration each):
   - `001_schema_and_roles.sql`: `CREATE SCHEMA careers`; roles `careers_api` (RLS enforced, no BYPASSRLS, no superuser), `careers_worker` (same, write access to ingestion tables only), `careers_readonly` (for audits/reviews). Grants scoped to the schema.
   - `002_source_registry.sql`: `sources`, `source_rights`, `source_runs` per Blueprint §15. Every permission column defaults to `false`; `sources.status` defaults to `disabled`. A CHECK + trigger prevents `status='active'` unless a `source_rights` row with `fetch_allowed=true` and non-expired `reviewed_at` exists.
   - `003_work_queue.sql`: `work_items` (kind, payload jsonb, due_at, lease_until, attempts, max_attempts, state, dead_letter_reason) with the indexes the claim query needs.
   - `004_audit_events.sql`: append-only `audit_events`; `careers_api` gets INSERT only.
   - RLS enabled on every table from day one, even internal ones (deny-all policies for anon/authenticated; service access only through the scoped roles).
3. **FastAPI skeleton**: `GET /api/careers/v1/health` (no DB), `GET /api/careers/v1/ready` (DB ping, no secrets), `GET /api/careers/v1/jobs` returning an empty, correctly-shaped page; OpenAPI generated; standard error body `{code, message, request_id}`; JWT validation middleware wired to the deployed Supabase Auth JWKS/secret (verified against staging only). Config from env; `.env.example` with names only.
4. **Workers**: `worker.py` with the atomic claim loop (`SELECT … FOR UPDATE SKIP LOCKED`, lease renewal, bounded retries, dead-letter). No real adapters yet — one `noop` kind for testing.
5. **Tests** (pytest, run against the staging DB or a local Postgres container):
   - Role tests: `careers_api` cannot read `techtrendi.*`/`public.*` tables it wasn't granted; cannot bypass RLS; cannot create a source with `status='active'` without rights.
   - Queue tests: two concurrent claimers never get the same item; expired lease is reclaimable; max attempts → dead letter.
   - Migration rehearsal: apply 001–004, run tests, apply downs, verify schema gone, re-apply.
   - Existing-site smoke: `npm run build` of the frontend still succeeds and `scripts/test-deploy-guard.mjs` passes with the placeholder route added.
6. **Ops notes**: `careers-service/README.md` with run, test, migrate and rollback commands; systemd unit templates (not installed).

## 3. Explicitly NOT in Phase 1
Live sources, job ingestion, search, Telegram, user-facing pages beyond the placeholder, any production change, any change to existing tables, `/api/ai/*`, ports 5111–5118, nginx production config.

## 4. Exit criteria (Blueprint §21 Phase 1)
- All migrations apply and roll back cleanly in staging; evidence = test output file committed under `docs/careers/evidence/`.
- Cross-role access tests pass (API role cannot touch non-Careers data).
- Existing TechTrendi build + deploy guard still pass.
- Owner has reviewed the diff and the systemd unit templates.
- PROJECT_MEMORY / DECISIONS / TASKS updated with commit hashes.

## 5. What the owner must provide before Phase 1 can start
1. Server audit output (T-002) — confirms Python version, free port, Postgres extensions and roles, whether a second database can be created. [SERVER]
2. A staging database and a `careers_migrator` role created by the owner (I will supply the exact `CREATE DATABASE` / `CREATE ROLE` SQL; you run it in Studio or psql). Claude never receives the password; it goes in the server env file.
3. Approval of D-003–D-017 or amendments.
4. Decision: Phase 1 runs in Claude Code on your laptop against staging over SSH (recommended), or Claude builds everything locally with a Postgres container and you apply to staging by hand (slower, safer if you prefer to see every step).

## 6. First Claude Code session (once the above exists)
Message to send: *"Read CLAUDE.md and docs/careers/. Confirm the Phase 1 plan against the server audit, list any conflicts, then create the feature branch `careers/phase-1` and implement migration 001 with its tests. Stop and show me the diff before migration 002."*
