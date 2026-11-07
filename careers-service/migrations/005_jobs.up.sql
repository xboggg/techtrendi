-- 005 Jobs (pilot): collected and first-party job listings, per-country eligibility,
-- source scheduling and expiry. Blueprint §15 trimmed to the pilot (D-024, D-025).
-- Rules enforced here, not in application code:
--   * a feed job can only be stored for a source whose rights permit fetching;
--   * a feed job can only be 'published' while the source's rights permit display;
--   * losing display rights hides that source's published jobs at once;
--   * absence-based expiry only runs after a complete, successful snapshot (DISC-06).
-- Full descriptions are never stored for feed jobs: only a short summary (D-025).

BEGIN;

-- Owner switch per source: when false (the default) every collected job waits
-- as 'pending' for the owner, even when it passes every check.
ALTER TABLE careers.sources
  ADD COLUMN auto_publish   boolean NOT NULL DEFAULT false,
  ADD COLUMN min_request_gap_ms integer NOT NULL DEFAULT 1000 CHECK (min_request_gap_ms BETWEEN 200 AND 60000),
  ADD COLUMN settings       jsonb   NOT NULL DEFAULT '{}'::jsonb;   -- adapter options (board slug, country list); never secrets

CREATE TABLE careers.jobs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  origin          text        NOT NULL CHECK (origin IN ('feed','desk','employer')),
  source_id       uuid        REFERENCES careers.sources(id) ON DELETE CASCADE,
  external_id     text,
  title           text        NOT NULL CHECK (length(title) BETWEEN 2 AND 200),
  company_name    text        NOT NULL CHECK (length(company_name) BETWEEN 1 AND 150),
  company_logo_url text       CHECK (company_logo_url IS NULL OR company_logo_url ~ '^https://'),
  summary         text        CHECK (summary IS NULL OR length(summary) <= 600),
  apply_url       text        NOT NULL CHECK (apply_url ~ '^https://'),
  source_url      text        CHECK (source_url IS NULL OR source_url ~ '^https://'),
  work_mode       text        NOT NULL DEFAULT 'unknown' CHECK (work_mode IN ('remote','hybrid','onsite','unknown')),
  employment_type text        CHECK (employment_type IS NULL OR length(employment_type) <= 60),
  location_text   text        CHECK (location_text IS NULL OR length(location_text) <= 300),
  salary_text     text        CHECK (salary_text IS NULL OR length(salary_text) <= 120),
  categories      text[]      NOT NULL DEFAULT '{}',
  posted_at       timestamptz,
  valid_through   timestamptz,
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','review','published','hidden','expired','rejected')),
  review_reasons  text[]      NOT NULL DEFAULT '{}',
  decided_by      text,                                   -- set when the owner publishes/hides/rejects by hand
  decided_at      timestamptz,
  content_hash    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feed_jobs_have_source CHECK ((origin = 'feed') = (source_id IS NOT NULL)),
  CONSTRAINT feed_jobs_have_external_id CHECK (origin <> 'feed' OR external_id IS NOT NULL),
  CONSTRAINT review_needs_reason CHECK (status <> 'review' OR cardinality(review_reasons) > 0),
  CONSTRAINT jobs_source_external_uniq UNIQUE (source_id, external_id)
);
CREATE INDEX jobs_status_posted_idx ON careers.jobs (status, posted_at DESC);
CREATE INDEX jobs_source_seen_idx   ON careers.jobs (source_id, last_seen_at);
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON careers.jobs
  FOR EACH ROW EXECUTE FUNCTION careers.set_updated_at();

-- Eligibility per target country, from explicit evidence only (D-007).
CREATE TABLE careers.job_eligibility (
  job_id    uuid NOT NULL REFERENCES careers.jobs(id) ON DELETE CASCADE,
  country   text NOT NULL CHECK (country IN ('GH','NG')),
  state     text NOT NULL CHECK (state IN ('allowed','excluded','unknown')),
  evidence  text CHECK (evidence IS NULL OR length(evidence) <= 200),
  PRIMARY KEY (job_id, country)
);

CREATE OR REPLACE FUNCTION careers.enforce_job_rights() RETURNS trigger
LANGUAGE plpgsql
SET search_path = careers, pg_temp
AS $$
BEGIN
  IF NEW.origin = 'feed' THEN
    IF (TG_OP = 'INSERT' OR NEW.source_id IS DISTINCT FROM OLD.source_id)
       AND NOT careers.source_permits(NEW.source_id, 'fetch') THEN
      RAISE EXCEPTION 'job cannot be stored: source rights do not permit fetching'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.status = 'published' AND NOT careers.source_permits(NEW.source_id, 'display') THEN
      RAISE EXCEPTION 'job cannot be published: source rights do not permit display'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER jobs_rights_gate BEFORE INSERT OR UPDATE ON careers.jobs
  FOR EACH ROW EXECUTE FUNCTION careers.enforce_job_rights();

-- Rights revoked/expired/rejected: published jobs of that source disappear at once.
CREATE OR REPLACE FUNCTION careers.hide_jobs_on_rights_change() RETURNS trigger
LANGUAGE plpgsql
SET search_path = careers, pg_temp
AS $$
DECLARE
  v_source uuid := COALESCE(NEW.source_id, OLD.source_id);
BEGIN
  IF NOT careers.source_permits(v_source, 'display') THEN
    UPDATE careers.jobs
       SET status = 'hidden', review_reasons = array_append(review_reasons, 'rights_changed')
     WHERE source_id = v_source AND status = 'published';
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER source_rights_hide_jobs AFTER INSERT OR UPDATE OR DELETE ON careers.source_rights
  FOR EACH ROW EXECUTE FUNCTION careers.hide_jobs_on_rights_change();

-- Scheduler: queue one fetch per active source that is due. Safe to call often
-- (dedupe key per due slot); returns how many sources were queued.
CREATE OR REPLACE FUNCTION careers.enqueue_due_sources() RETURNS integer
LANGUAGE plpgsql
SET search_path = careers, pg_temp
AS $$
DECLARE
  r record;
  n integer := 0;
BEGIN
  FOR r IN
    SELECT id, fetch_interval_minutes FROM careers.sources
     WHERE status = 'active' AND (next_due_at IS NULL OR next_due_at <= now())
     FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM careers.enqueue_work('source_fetch', jsonb_build_object('source_id', r.id),
              'source_fetch:' || r.id || ':' || floor(extract(epoch FROM now()) / (r.fetch_interval_minutes * 60))::bigint,
              now(), 100::smallint, 3);
    UPDATE careers.sources SET next_due_at = now() + make_interval(mins => r.fetch_interval_minutes) WHERE id = r.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

-- Absence rule: after a complete, successful snapshot, jobs of that source not
-- seen in it are expired. Refuses to act on any other kind of run.
CREATE OR REPLACE FUNCTION careers.expire_unseen_jobs(p_run_id uuid) RETURNS integer
LANGUAGE plpgsql
SET search_path = careers, pg_temp
AS $$
DECLARE
  v_run careers.source_runs%ROWTYPE;
  n integer;
BEGIN
  SELECT * INTO v_run FROM careers.source_runs WHERE id = p_run_id;
  IF NOT FOUND OR NOT v_run.complete_snapshot OR v_run.status <> 'succeeded' THEN
    RAISE EXCEPTION 'expiry needs a complete, succeeded run' USING ERRCODE = 'check_violation';
  END IF;
  UPDATE careers.jobs
     SET status = 'expired'
   WHERE source_id = v_run.source_id
     AND last_seen_at < v_run.started_at
     AND status IN ('pending','review','published');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Date rule: anything past its closing date is expired, whatever its origin.
CREATE OR REPLACE FUNCTION careers.expire_past_jobs() RETURNS integer
LANGUAGE plpgsql
SET search_path = careers, pg_temp
AS $$
DECLARE n integer;
BEGIN
  UPDATE careers.jobs SET status = 'expired'
   WHERE valid_through < now() AND status IN ('pending','review','published');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- What the website build may read: live published jobs with their credit line.
CREATE OR REPLACE VIEW careers.public_jobs AS
SELECT j.id, j.origin, j.title, j.company_name, j.company_logo_url, j.summary,
       j.apply_url, j.source_url, j.work_mode, j.employment_type, j.location_text,
       j.salary_text, j.categories, j.posted_at, j.valid_through,
       s.name AS source_name, s.base_url AS source_home,
       (SELECT r.attribution_text FROM careers.source_rights r
         WHERE r.source_id = s.id AND r.decision = 'approved'
           AND (r.expires_at IS NULL OR r.expires_at > now())
         ORDER BY r.reviewed_at DESC NULLS LAST LIMIT 1) AS attribution_text,
       COALESCE(array_agg(e.country ORDER BY e.country) FILTER (WHERE e.state = 'allowed'), '{}') AS open_to
FROM careers.jobs j
LEFT JOIN careers.sources s ON s.id = j.source_id
LEFT JOIN careers.job_eligibility e ON e.job_id = j.id
WHERE j.status = 'published' AND (j.valid_through IS NULL OR j.valid_through > now())
GROUP BY j.id, s.id;

ALTER TABLE careers.jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers.job_eligibility ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON careers.jobs, careers.job_eligibility TO careers_readonly, careers_api, careers_worker;
GRANT INSERT, UPDATE ON careers.jobs TO careers_worker;
GRANT INSERT, UPDATE, DELETE ON careers.job_eligibility TO careers_worker;
GRANT SELECT ON careers.public_jobs TO careers_readonly, careers_api;

CREATE POLICY ro_jobs        ON careers.jobs            FOR SELECT TO careers_readonly, careers_api, careers_worker USING (true);
CREATE POLICY ro_eligibility ON careers.job_eligibility FOR SELECT TO careers_readonly, careers_api, careers_worker USING (true);
-- The worker writes only feed jobs; desk and employer jobs come later through their own role paths.
CREATE POLICY worker_insert_jobs ON careers.jobs FOR INSERT TO careers_worker WITH CHECK (origin = 'feed');
CREATE POLICY worker_update_jobs ON careers.jobs FOR UPDATE TO careers_worker USING (origin = 'feed') WITH CHECK (origin = 'feed');
CREATE POLICY worker_write_eligibility ON careers.job_eligibility FOR ALL TO careers_worker USING (true) WITH CHECK (true);

REVOKE EXECUTE ON FUNCTION careers.enforce_job_rights() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.hide_jobs_on_rights_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.enqueue_due_sources() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.expire_unseen_jobs(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.expire_past_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION careers.enqueue_due_sources() TO careers_worker;
GRANT EXECUTE ON FUNCTION careers.expire_unseen_jobs(uuid) TO careers_worker;
GRANT EXECUTE ON FUNCTION careers.expire_past_jobs() TO careers_worker;

COMMIT;
