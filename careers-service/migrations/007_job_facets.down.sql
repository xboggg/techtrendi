-- Reverts 007: public_jobs goes back to 005's columns; the facet functions are removed.
-- A view cannot lose columns through CREATE OR REPLACE, so it is dropped and made again.

BEGIN;

DROP VIEW careers.public_jobs;

CREATE VIEW careers.public_jobs AS
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

GRANT SELECT ON careers.public_jobs TO careers_readonly, careers_api;

DROP FUNCTION careers.job_level(text, text);
DROP FUNCTION careers.job_type(text);
DROP FUNCTION careers.job_field(text, text[]);
DROP FUNCTION careers.field_of(text);

COMMIT;
