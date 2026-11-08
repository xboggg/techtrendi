-- 007 Job facets for the board's filters (owner request 8 Nov 2026): area of work, job type and
-- level, plus the eligibility evidence and whether the closing date is only our estimate.
-- Worked out from what the sources already give us, in the view, so every stored job gets them
-- at once with no re-collection. Area of work comes from the source's categories first, then the
-- title; the category names are the ones seen on staging (84 distinct, 8 Nov 2026).

BEGIN;

CREATE OR REPLACE FUNCTION careers.field_of(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN t IS NULL OR t = '' THEN NULL
    WHEN t ~* '(customer (service|support|care|success|experience)|\mcx\M|call cent|help ?desk|client (service|support))' THEN 'support'
    WHEN t ~* '(\msales\M|business development|account (executive|manager)|\mbdr\M|\msdr\M|partnerships|relationship manag)' THEN 'sales'
    WHEN t ~* '(\mwrit|copywrit|content|editor|translat|locali[sz]|interpret|language|voice actor|linguist|transcri|\mlqa\M|proofread)' THEN 'writing'
    WHEN t ~* '(\mdata\M|analytics|\mai\M|artificial intelligence|machine learning|\mml\M|\mllm|annotation|research scientist|\mgpu\M|graphics processing)' THEN 'data'
    WHEN t ~* '(design|\mux\M|\mui\M|graphic|visual|video|photo|animat|illustrat|\msound\M)' THEN 'design'
    WHEN t ~* '(human resources|\mhr\M|people|recruit|talent|culture|workforce|organi[sz]ational development)' THEN 'hr'
    WHEN t ~* '(financ|fintech|accounting|accountant|\mtax\M|audit|\mrisk\M|credit|payment|treasury|fraud|compliance|insurance|banking|collections|\mtrad(er|ing)\M)' THEN 'finance'
    WHEN t ~* '(teach|tutor|educat|e-learning|\mtrainer|training|instructor|curriculum|lecturer|school)' THEN 'education'
    WHEN t ~* '(marketing|growth|social media|\mseo\M|\mbrand|communication|martech|community)' THEN 'marketing'
    WHEN t ~* '(develop|programm|software|engineer|devops|sysadmin|\mqa\M|testing|tester|hardware|docker|\mgit\M|\mtech|security|reliability|cloud|infrastructure|\mit\M|product|agile|scrum|smartphone)' THEN 'tech'
    WHEN t ~* '(operation|logistic|warehouse|supply chain|inventory|\mstock|retail|program manag|project manag|admin|office|procure|packag|dispatch|freight|management)' THEN 'ops'
  END
$$;

CREATE OR REPLACE FUNCTION careers.job_field(p_title text, p_categories text[]) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT COALESCE(careers.field_of(array_to_string(p_categories, ' ')), careers.field_of(p_title), 'other')
$$;

-- Sources write employment type many ways ("Full Time", "FullTime", "full_time", "Contractor", "Freelance-Remote").
CREATE OR REPLACE FUNCTION careers.job_type(p_employment text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN p_employment ~* 'intern' THEN 'internship'
    WHEN p_employment ~* 'part' THEN 'part_time'
    WHEN p_employment ~* '(contract|freelance|temporar)' THEN 'contract'
    WHEN p_employment ~* 'full' THEN 'full_time'
    WHEN p_employment ~* 'volunt' THEN 'volunteer'
  END
$$;

-- Level from the title's own words; beginner words win over senior ones ("Graduate Trainee Manager").
CREATE OR REPLACE FUNCTION careers.job_level(p_title text, p_employment text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN p_title ~* '\m(intern|internship|junior|jr|graduate|trainee|apprentice|entry)\M' OR p_employment ~* 'intern' THEN 'entry'
    WHEN p_title ~* '\m(senior|sr|lead|principal|staff|head|director|manager|vp|vice president|chief|cto|cfo|coo|ceo|architect)\M' THEN 'senior'
    ELSE 'mid'
  END
$$;

-- New columns go at the end so CREATE OR REPLACE keeps the existing ones as they are.
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

REVOKE EXECUTE ON FUNCTION careers.field_of(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.job_field(text, text[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.job_type(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.job_level(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION careers.field_of(text), careers.job_field(text, text[]), careers.job_type(text),
  careers.job_level(text, text) TO careers_readonly, careers_api;

COMMIT;
