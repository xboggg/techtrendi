-- TechTrendi Careers — STAGING database bootstrap (run ONCE by the owner, as a Postgres superuser)
-- ----------------------------------------------------------------------------------------------
-- Where to run (verified 6 Nov 2026): as supabase_admin, because the Supabase "postgres" role is not a
-- superuser and cannot create a database owned by another role:
--   docker exec -i supabase-db psql -U supabase_admin -d postgres
-- (Done once on 6 Nov 2026 by Claude with generated passwords; see deploy/careers/README.md.) Nothing here touches existing databases or schemas.
--
-- Before running: replace the four <GENERATE-...> placeholders with long random passwords.
-- On Linux: openssl rand -hex 24   (four times; hex, because base64 / and + break connection URLs). Keep them in a password
-- manager; afterwards they go ONLY into /etc/techtrendi-careers/staging.env on the server.
-- Do not paste them into chat, GitHub, or this file after running.
--
-- What this creates:
--   database  careers_staging         (owned by careers_staging_migrator)
--   role      careers_staging_migrator  LOGIN, CREATEROLE, NOT superuser -> runs migrate.py
--   roles     careers_staging_api / _worker / _readonly  LOGIN; become members of the
--             careers_api / careers_worker / careers_readonly group roles AFTER migration 001 runs.

-- 1. Migrator (owns the schema; the only role that may change structure)
CREATE ROLE careers_staging_migrator LOGIN CREATEROLE NOSUPERUSER NOBYPASSRLS NOCREATEDB
  PASSWORD '<GENERATE-MIGRATOR-PASSWORD>';

-- 2. Staging database, owned by the migrator so it can CREATE SCHEMA inside it
CREATE DATABASE careers_staging OWNER careers_staging_migrator
  ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8' TEMPLATE template0;
REVOKE ALL ON DATABASE careers_staging FROM PUBLIC;

-- 3. Service login roles (no privileges yet; they inherit from the group roles later)
CREATE ROLE careers_staging_api      LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE INHERIT
  PASSWORD '<GENERATE-API-PASSWORD>'      CONNECTION LIMIT 10;
CREATE ROLE careers_staging_worker   LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE INHERIT
  PASSWORD '<GENERATE-WORKER-PASSWORD>'   CONNECTION LIMIT 6;
CREATE ROLE careers_staging_readonly LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE INHERIT
  PASSWORD '<GENERATE-READONLY-PASSWORD>' CONNECTION LIMIT 3;
GRANT CONNECT ON DATABASE careers_staging TO careers_staging_api, careers_staging_worker, careers_staging_readonly;

-- 4. Guard rails on every role: short statement timeouts so staging can never hog the shared cluster
ALTER ROLE careers_staging_api      SET statement_timeout = '5s';
ALTER ROLE careers_staging_worker   SET statement_timeout = '30s';
ALTER ROLE careers_staging_readonly SET statement_timeout = '30s';
ALTER ROLE careers_staging_migrator SET statement_timeout = '120s';
ALTER ROLE careers_staging_api      SET search_path = careers, pg_temp;
ALTER ROLE careers_staging_worker   SET search_path = careers, pg_temp;
ALTER ROLE careers_staging_readonly SET search_path = careers, pg_temp;

-- 5. pgcrypto is needed for gen_random_uuid() on PostgreSQL < 13 only; PG13+ has it built in.
--    Supabase images ship with pgcrypto already available. Nothing to do here on PG15.

-- ---------------------------------------------------------------------------------------------
-- AFTER `python migrate.py up` has run against careers_staging (Claude's step), run this part,
-- connected to the careers_staging database as careers_staging_migrator:
--
--   GRANT careers_api      TO careers_staging_api;
--   GRANT careers_worker   TO careers_staging_worker;
--   GRANT careers_readonly TO careers_staging_readonly;
--
-- Verification (read-only, safe to paste the output into chat — it contains no secrets):
--   SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolconnlimit
--     FROM pg_roles WHERE rolname LIKE 'careers_%' ORDER BY 1;
-- Expected: rolsuper = f and rolbypassrls = f on every row.
--
-- Rollback (removes staging completely; does not touch anything else):
--   DROP DATABASE careers_staging;
--   DROP ROLE careers_staging_api, careers_staging_worker, careers_staging_readonly, careers_staging_migrator;
--   DROP ROLE careers_api, careers_worker, careers_readonly;   -- only if no production Careers exists yet
