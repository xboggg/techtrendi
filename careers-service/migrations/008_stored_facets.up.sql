-- 008 Store the job facets instead of working them out on every request (9 Nov 2026).
-- 007 computed area of work / job type / level inside public_jobs, so each list request ran the
-- area-of-work patterns over every open job (~2,500 rows, 0.2-0.4 s on staging) before keeping 20.
-- Stored generated columns run the same 007 functions once, when a job is written; the view now
-- reads them. Same view columns, same values. If a 007 function changes later, a new migration
-- must drop and re-add the column (a stored value is not recomputed by itself).

BEGIN;

-- The collector writes jobs, so it now runs the (read-only, pure) facet functions too.
GRANT EXECUTE ON FUNCTION careers.field_of(text), careers.job_field(text, text[]), careers.job_type(text),
  careers.job_level(text, text) TO careers_worker;

ALTER TABLE careers.jobs
  ADD COLUMN facet_field text GENERATED ALWAYS AS (careers.job_field(title, categories)) STORED,
  ADD COLUMN facet_job_type text GENERATED ALWAYS AS (careers.job_type(employment_type)) STORED,
  ADD COLUMN facet_level text GENERATED ALWAYS AS (careers.job_level(title, employment_type)) STORED;

CREATE OR REPLACE VIEW careers.public_jobs AS
SELECT j.id, j.origin, j.title, j.company_name, j.company_logo_url, j.summary,
       j.apply_url, j.source_url, j.work_mode, j.employment_type, j.location_text,
       j.salary_text, j.categories, j.posted_at, j.valid_through,
       s.name AS source_name, s.base_url AS source_home,
       (SELECT r.attribution_text FROM careers.source_rights r
         WHERE r.source_id = s.id AND r.decision = 'approved'
           AND (r.expires_at IS NULL OR r.expires_at > now())
         ORDER BY r.reviewed_at DESC NULLS LAST LIMIT 1) AS attribution_text,
       COALESCE(array_agg(e.country ORDER BY e.country) FILTER (WHERE e.state = 'allowed'), '{}') AS open_to,
       j.facet_field AS field,
       j.facet_job_type AS job_type,
       j.facet_level AS level,
       COALESCE(jsonb_object_agg(e.country, e.evidence) FILTER (WHERE e.state = 'allowed' AND e.evidence IS NOT NULL), '{}'::jsonb) AS open_evidence,
       COALESCE(s.settings ? 'default_valid_days', false) AS closes_estimated
FROM careers.jobs j
LEFT JOIN careers.sources s ON s.id = j.source_id
LEFT JOIN careers.job_eligibility e ON e.job_id = j.id
WHERE j.status = 'published' AND (j.valid_through IS NULL OR j.valid_through > now())
GROUP BY j.id, s.id;

COMMIT;
