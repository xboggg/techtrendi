-- Reverts 008: public_jobs works the facets out again (as in 007); the stored columns go.

BEGIN;

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
       careers.job_field(j.title, j.categories) AS field,
       careers.job_type(j.employment_type) AS job_type,
       careers.job_level(j.title, j.employment_type) AS level,
       COALESCE(jsonb_object_agg(e.country, e.evidence) FILTER (WHERE e.state = 'allowed' AND e.evidence IS NOT NULL), '{}'::jsonb) AS open_evidence,
       COALESCE(s.settings ? 'default_valid_days', false) AS closes_estimated
FROM careers.jobs j
LEFT JOIN careers.sources s ON s.id = j.source_id
LEFT JOIN careers.job_eligibility e ON e.job_id = j.id
WHERE j.status = 'published' AND (j.valid_through IS NULL OR j.valid_through > now())
GROUP BY j.id, s.id;

ALTER TABLE careers.jobs DROP COLUMN facet_level, DROP COLUMN facet_job_type, DROP COLUMN facet_field;

REVOKE EXECUTE ON FUNCTION careers.field_of(text), careers.job_field(text, text[]), careers.job_type(text),
  careers.job_level(text, text) FROM careers_worker;

COMMIT;
