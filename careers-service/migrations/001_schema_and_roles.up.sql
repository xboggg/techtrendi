-- 001 Schema and roles
-- Creates the isolated `careers` schema and three NOLOGIN group roles.
-- Login users are created by the owner and granted membership, e.g.
--   CREATE ROLE careers_api_user LOGIN PASSWORD '...' IN ROLE careers_api;
-- Nothing here touches any other schema. Safe to apply on PostgreSQL 15+.

BEGIN;

CREATE SCHEMA IF NOT EXISTS careers;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'careers_api') THEN
    CREATE ROLE careers_api NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'careers_worker') THEN
    CREATE ROLE careers_worker NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'careers_readonly') THEN
    CREATE ROLE careers_readonly NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT;
  END IF;
END $$;

-- Belt and braces: refuse to proceed if any Careers role can bypass RLS or is
-- a superuser (e.g. pre-existing roles with the same name). The migrator is
-- not a superuser, so it cannot fix this itself; a human must look.
DO $$
DECLARE bad text;
BEGIN
  SELECT string_agg(rolname, ', ') INTO bad
  FROM pg_roles
  WHERE rolname IN ('careers_api','careers_worker','careers_readonly')
    AND (rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb);
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'Careers roles have unsafe attributes (superuser/bypassrls/createrole/createdb): %', bad;
  END IF;
END $$;

GRANT USAGE ON SCHEMA careers TO careers_api, careers_worker, careers_readonly;

-- Migration ledger lives inside the schema so `DROP SCHEMA careers CASCADE`
-- is a complete rollback.
CREATE TABLE IF NOT EXISTS careers.schema_migrations (
  version     text        PRIMARY KEY,
  name        text        NOT NULL,
  checksum    text        NOT NULL,
  applied_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE careers.schema_migrations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON careers.schema_migrations TO careers_readonly;
CREATE POLICY ro_read_schema_migrations ON careers.schema_migrations
  FOR SELECT TO careers_readonly USING (true);

-- Shared trigger function for updated_at maintenance.
CREATE OR REPLACE FUNCTION careers.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

COMMIT;
