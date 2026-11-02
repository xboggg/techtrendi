# TechTrendi Careers — service (Phase 1)

FastAPI API + Python workers + PostgreSQL migrations for the `careers` schema.
Status: **Phase 1 foundation. Not deployed. No sources enabled. No jobs.**
Rules: see `/CLAUDE.md` and `/docs/careers/`.

## Layout
```
app/            FastAPI application (config, db pool, auth, errors, routes)
workers/        queue wrapper + generic worker loop (handlers: noop)
migrations/     NNN_name.up.sql / .down.sql pairs, applied by migrate.py
tests/          pytest; needs a throwaway PostgreSQL (never production)
.env.example    variable NAMES only
```

## Run locally
```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt

# a scratch PostgreSQL (any 15+); example uses a local cluster
export CAREERS_TEST_ADMIN_URL='postgresql://postgres@localhost:5432/postgres'
python -m pytest -v                       # creates/destroys its own databases and roles

# API against a database you have migrated
export CAREERS_DATABASE_URL='postgresql://<api_login_role>@host/db'
export CAREERS_JWT_SECRET='<supabase jwt secret>'   # or CAREERS_JWKS_URL
export CAREERS_JWT_ISSUER='https://<supabase-url>/auth/v1'
uvicorn app.main:app --host 127.0.0.1 --port <free port>
curl -s localhost:<port>/api/careers/v1/health
```

## Migrations
```bash
export CAREERS_MIGRATOR_DATABASE_URL='postgresql://careers_migrator@host/db'
python migrate.py status
python migrate.py up          # all pending
python migrate.py down 002    # revert 004,003,002 (001 drops the schema + roles)
```
The migrator role must own the schema and have CREATE on the database and
CREATEROLE (to create the three NOLOGIN group roles). It must **not** be a
superuser; 001 refuses to continue if any `careers_*` role is a superuser or
can bypass RLS. Editing an already-applied file is refused (checksum ledger).

## Roles (created by 001, NOLOGIN)
| Role | Can | Cannot |
|---|---|---|
| `careers_api` | read registry/queue, enqueue, append audit | claim work, read audit, touch other schemas |
| `careers_worker` | claim/complete/fail work, write source_runs, pause sources | activate a source without approved rights, write rights |
| `careers_readonly` | read everything incl. audit | write anything |

The owner creates login users: `CREATE ROLE careers_api_user LOGIN PASSWORD '…' IN ROLE careers_api;`
Passwords go in the server env file only.

## Guarantees proven by tests (33 tests)
- No `careers_*` role is superuser / BYPASSRLS; RLS is enabled on every table.
- A source cannot be `active` without an approved, unexpired rights record permitting fetch;
  revoking/expiring rights automatically demotes an active source.
- Queue: concurrent workers never share an item; expired leases are reclaimable; failures
  retry with backoff then dead-letter; API role cannot claim work.
- Audit trail is append-only, even for the schema owner.
- Migrations apply, roll back and re-apply cleanly; tampered checksums are refused.
- API: health/ready, empty but final-shaped `/jobs`, standard error body, JWT signature/aud/iss/exp enforced.

## Worker
```bash
export CAREERS_WORKER_DATABASE_URL='postgresql://<worker_login_role>@host/db'
python -m workers.worker --kinds noop --once
```
Phase 2 adds `source_fetch`; Phase 3 adds `alert_dispatch`.
