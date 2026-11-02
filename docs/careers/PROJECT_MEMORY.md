# TechTrendi Careers — Project Memory (reviewed state summary)

Last updated: 2026-11-02 by Claude (draft). No secrets, no personal data, no production credentials here.

## Fixed rules (from blueprint, owner-approved)
- Extension of techtrendi.com at /careers, not a replacement. Keep React/Vite/TS, self-hosted Supabase PG15, Python, Contabo, nginx, Cloudflare, GitHub delivery.
- Zero new recurring spend by default. Telegram with opt-in is the alert channel. PostgreSQL search + DB queue first. Explainable rules matching first; AI off until approved.
- Lawful API-first collection with per-source rights; no scraping behind logins/CAPTCHAs/robots; external content is untrusted data.
- Remote ≠ worldwide. Eligibility is allowed / excluded / unknown per country, from evidence only.
- No automatic applications, no fabricated CV content, private CVs, tested tenant isolation, never break existing TechTrendi services.

## Current phase
Phase 1 — Foundation, code complete locally; awaiting owner review (PR #1: https://github.com/xboggg/techtrendi/pull/1, commit 17c3932) and staging. Phase 0 server audit still outstanding (T-002). No server, production schema or source changes have been made.

## Verified environment
Repository (github.com/xboggg/techtrendi, PUBLIC, commit 33f00eb, audited 2026-11-02): React 18 + Vite + TS + shadcn + Tailwind, vite-react-ssg static build, 209 routes in src/App.tsx, Supabase anon-key client on schema `techtrendi`, email/password auth in AuthContext. GitHub Actions deploy via ForceCommand-locked root SSH, rsync --delete to /var/www/techtrendi. Migrations create tables in BOTH public.* and techtrendi.*; RLS widely used. Existing Python services use http.server (no framework) under systemd. Existing scam-report flow and career tools exist. Backups: daily rclone to Google Drive (reported in DOCS). Full report: AUDIT_REPO_2026-11-02.md.
Server facts (144.91.71.106, db2 Studio public, shared host, /opt/tech-news crons using Anthropic API) are still REPORTED via repo docs; server audit pending.

## Approved sources
None. Shortlist for rights review: Remotive (conditional terms), curated employer boards on Greenhouse/Lever/Ashby, first-party employer posts. See SOURCE_REGISTER.csv.

## Latest decisions
D-001, D-002 approved via blueprint. D-003 to D-019 proposed, awaiting owner response. See DECISIONS.md.

## Latest tests
2026-11-02: `python -m pytest -v` in careers-service — 33 passed, 0 failed, on a throwaway local PostgreSQL 16.15 (production reported PG15; SQL avoids PG16-only syntax, guarded by a test). Existing `node scripts/test-deploy-guard.mjs` — failures: 0. Evidence: docs/careers/evidence/phase1-tests-2026-11-02.txt. NOT yet run against staging.

## Known blockers
- SECURITY: Telegram bot token committed in public repo; Groq key possibly shipped in earlier builds. Rotation pending (T-000).
- No server audit output yet (T-002).
- Operating entity / privacy contact not named (T-010).
- Owner has deferred secret rotation (T-000); exposure continues until done.

## Next three actions
1. Owner reviews and merges PR `careers/phase-1` (T-107); rotates secrets when ready (T-000).
2. Owner runs the server audit script (T-002) so staging placement and free port are confirmed.
3. Owner creates staging DB + migrator role from SQL Claude supplies (T-017); Claude runs the migration rehearsal on staging and starts Phase 2 (first approved source slice).

## Production change authorization
None.
