-- 005 down: removes jobs, eligibility, scheduling and expiry; restores sources to its 002 shape.
BEGIN;
DROP VIEW IF EXISTS careers.public_jobs;
DROP TRIGGER IF EXISTS source_rights_hide_jobs ON careers.source_rights;
DROP FUNCTION IF EXISTS careers.hide_jobs_on_rights_change();
DROP FUNCTION IF EXISTS careers.expire_past_jobs();
DROP FUNCTION IF EXISTS careers.expire_unseen_jobs(uuid);
DROP FUNCTION IF EXISTS careers.enqueue_due_sources();
DROP TABLE IF EXISTS careers.job_eligibility;
DROP TABLE IF EXISTS careers.jobs;
DROP FUNCTION IF EXISTS careers.enforce_job_rights();
ALTER TABLE careers.sources DROP COLUMN IF EXISTS settings, DROP COLUMN IF EXISTS min_request_gap_ms, DROP COLUMN IF EXISTS auto_publish;
COMMIT;
