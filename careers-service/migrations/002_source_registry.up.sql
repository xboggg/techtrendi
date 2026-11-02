-- 002 Source registry
-- Blueprint §7 DISC-01, §15 (sources, source_rights, source_runs), §19A approval enforcement.
-- Every permission defaults to FALSE. A source cannot become 'active' unless an
-- approved, unexpired rights record permits fetching. Enforced by trigger, not
-- by application code, so no code path can skip it.

BEGIN;

CREATE TABLE careers.sources (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text        NOT NULL UNIQUE,            -- e.g. 'remotive', 'greenhouse:acme'
  name            text        NOT NULL,
  adapter         text        NOT NULL,                   -- python adapter identifier
  base_url        text        NOT NULL,
  status          text        NOT NULL DEFAULT 'disabled'
                  CHECK (status IN ('disabled','pending_rights','active','paused','suspended')),
  fetch_interval_minutes integer NOT NULL DEFAULT 360 CHECK (fetch_interval_minutes >= 15),
  next_due_at     timestamptz,
  request_quota_per_run integer NOT NULL DEFAULT 50 CHECK (request_quota_per_run > 0),
  disabled_reason text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER sources_updated_at BEFORE UPDATE ON careers.sources
  FOR EACH ROW EXECUTE FUNCTION careers.set_updated_at();

CREATE TABLE careers.source_rights (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id           uuid        NOT NULL REFERENCES careers.sources(id) ON DELETE CASCADE,
  terms_url           text,
  terms_hash          text,
  evidence_ref        text,                                -- pointer to owner-controlled evidence, never the document
  decision            text        NOT NULL DEFAULT 'pending'
                      CHECK (decision IN ('pending','approved','rejected','suspended')),
  reviewed_at         timestamptz,
  reviewer            text,
  expires_at          timestamptz,
  -- independent permissions, all default off (Blueprint §19A "Approval enforcement")
  fetch_allowed       boolean     NOT NULL DEFAULT false,
  display_allowed     boolean     NOT NULL DEFAULT false,
  alert_allowed       boolean     NOT NULL DEFAULT false,
  analytics_allowed   boolean     NOT NULL DEFAULT false,
  ai_allowed          boolean     NOT NULL DEFAULT false,
  cache_allowed       boolean     NOT NULL DEFAULT false,
  attribution_required boolean    NOT NULL DEFAULT true,
  attribution_text    text,
  allowed_fields      text[]      NOT NULL DEFAULT '{}',
  raw_retention_days  integer     NOT NULL DEFAULT 0 CHECK (raw_retention_days >= 0 AND raw_retention_days <= 7),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  -- an approved record must have review evidence
  CONSTRAINT approved_needs_review CHECK (decision <> 'approved' OR (reviewed_at IS NOT NULL AND reviewer IS NOT NULL))
);
CREATE INDEX source_rights_source_idx ON careers.source_rights (source_id, decision);
CREATE TRIGGER source_rights_updated_at BEFORE UPDATE ON careers.source_rights
  FOR EACH ROW EXECUTE FUNCTION careers.set_updated_at();

-- Current effective permission for a source. Returns false when no approved,
-- unexpired rights record exists. Used by the activation trigger now and by
-- publication / alert / analytics code later.
CREATE OR REPLACE FUNCTION careers.source_permits(p_source_id uuid, p_permission text)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = careers, pg_temp
AS $$
  SELECT COALESCE((
    SELECT CASE p_permission
             WHEN 'fetch'     THEN r.fetch_allowed
             WHEN 'display'   THEN r.display_allowed
             WHEN 'alert'     THEN r.alert_allowed
             WHEN 'analytics' THEN r.analytics_allowed
             WHEN 'ai'        THEN r.ai_allowed
             WHEN 'cache'     THEN r.cache_allowed
             ELSE false
           END
    FROM careers.source_rights r
    WHERE r.source_id = p_source_id
      AND r.decision = 'approved'
      AND (r.expires_at IS NULL OR r.expires_at > now())
    ORDER BY r.reviewed_at DESC NULLS LAST
    LIMIT 1
  ), false);
$$;

CREATE OR REPLACE FUNCTION careers.enforce_source_activation() RETURNS trigger
LANGUAGE plpgsql
SET search_path = careers, pg_temp
AS $$
BEGIN
  IF NEW.status = 'active' AND NOT careers.source_permits(NEW.id, 'fetch') THEN
    RAISE EXCEPTION 'source % cannot be active: no approved, unexpired rights record permits fetching', NEW.key
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER sources_activation_gate BEFORE INSERT OR UPDATE OF status ON careers.sources
  FOR EACH ROW EXECUTE FUNCTION careers.enforce_source_activation();

-- If rights are revoked, expired or rejected, the source must not stay active.
CREATE OR REPLACE FUNCTION careers.deactivate_on_rights_change() RETURNS trigger
LANGUAGE plpgsql
SET search_path = careers, pg_temp
AS $$
DECLARE
  v_source uuid := COALESCE(NEW.source_id, OLD.source_id);
BEGIN
  IF NOT careers.source_permits(v_source, 'fetch') THEN
    UPDATE careers.sources
       SET status = 'pending_rights', disabled_reason = 'rights changed: fetch no longer permitted'
     WHERE id = v_source AND status = 'active';
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER source_rights_deactivate AFTER INSERT OR UPDATE OR DELETE ON careers.source_rights
  FOR EACH ROW EXECUTE FUNCTION careers.deactivate_on_rights_change();

CREATE TABLE careers.source_runs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id         uuid        NOT NULL REFERENCES careers.sources(id) ON DELETE CASCADE,
  started_at        timestamptz NOT NULL DEFAULT now(),
  finished_at       timestamptz,
  status            text        NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running','succeeded','partial','failed','skipped')),
  complete_snapshot boolean     NOT NULL DEFAULT false,   -- DISC-06: absence rules only after complete snapshots
  checkpoint        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  fetched_count     integer     NOT NULL DEFAULT 0,
  upserted_count    integer     NOT NULL DEFAULT 0,
  error_code        text,                                  -- code only; never payloads or secrets
  requests_made     integer     NOT NULL DEFAULT 0
);
CREATE INDEX source_runs_source_started_idx ON careers.source_runs (source_id, started_at DESC);

-- RLS: enabled everywhere. Only the Careers roles get policies; Supabase
-- anon/authenticated get nothing (deny by default).
ALTER TABLE careers.sources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers.source_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers.source_runs   ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON careers.sources, careers.source_rights, careers.source_runs TO careers_readonly, careers_api, careers_worker;
GRANT UPDATE (status, next_due_at, disabled_reason) ON careers.sources TO careers_worker;
GRANT INSERT, UPDATE ON careers.source_runs TO careers_worker;
-- Rights records are written only by the migrator/owner (manual approval), never by services.

CREATE POLICY ro_sources        ON careers.sources       FOR SELECT TO careers_readonly, careers_api, careers_worker USING (true);
CREATE POLICY ro_source_rights  ON careers.source_rights FOR SELECT TO careers_readonly, careers_api, careers_worker USING (true);
CREATE POLICY ro_source_runs    ON careers.source_runs   FOR SELECT TO careers_readonly, careers_api, careers_worker USING (true);
CREATE POLICY worker_update_sources ON careers.sources   FOR UPDATE TO careers_worker USING (true) WITH CHECK (true);
CREATE POLICY worker_write_runs ON careers.source_runs   FOR INSERT TO careers_worker WITH CHECK (true);
CREATE POLICY worker_update_runs ON careers.source_runs  FOR UPDATE TO careers_worker USING (true) WITH CHECK (true);

REVOKE EXECUTE ON FUNCTION careers.source_permits(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.enforce_source_activation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.deactivate_on_rights_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION careers.source_permits(uuid, text) TO careers_api, careers_worker, careers_readonly;

COMMIT;
