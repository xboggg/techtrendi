-- Group A job sources (owner approval 7 Nov 2026, see docs/careers/SOURCES.md).
-- Run as the database owner side, never by a service:
--   docker exec -i supabase-db psql -U supabase_admin -d careers_staging -v ON_ERROR_STOP=1 < sources_group_a.sql
-- Safe to run twice: existing sources and approved rights are left as they are.
-- auto_publish ON (owner, 7 Nov 2026: "go live by itself", D-034): clean jobs publish themselves;
-- jobs with scam signs or conflicting eligibility still wait as 'review'.

BEGIN;

CREATE TEMP TABLE seed (key text, name text, adapter text, base_url text, mins int, quota int, gap int,
                        settings jsonb, terms_url text, attribution text) ON COMMIT DROP;
INSERT INTO seed VALUES
 ('himalayas', 'Himalayas', 'himalayas', 'https://himalayas.app', 1440, 260, 1500,
  '{"countries": ["GH", "NG"]}', 'https://himalayas.app/docs/remote-jobs-api', 'Job from Himalayas'),
 ('jobicy', 'Jobicy', 'jobicy', 'https://jobicy.com', 360, 10, 2000,
  '{"geo": "anywhere", "absence_expiry": false, "default_valid_days": 30}', 'https://jobicy.com/jobs-rss-feed', 'Job via Jobicy'),
 ('weworkremotely', 'We Work Remotely', 'weworkremotely', 'https://weworkremotely.com', 360, 2, 1000,
  '{"absence_expiry": false, "default_valid_days": 30}', 'https://weworkremotely.com/remote-jobs.rss', 'Job via We Work Remotely'),
 ('remoteok', 'Remote OK', 'remoteok', 'https://remoteok.com', 360, 2, 1000,
  '{"absence_expiry": false, "default_valid_days": 30, "max_age_days": 45}', 'https://remoteok.com/api', 'Job via Remote OK'),
 ('remotive', 'Remotive', 'remotive', 'https://remotive.com', 720, 2, 1000,
  '{"absence_expiry": false, "default_valid_days": 30, "max_age_days": 45}', 'https://remotive.com/api/remote-jobs', 'Job via Remotive'),
 ('greenhouse:moniepoint', 'Moniepoint', 'greenhouse', 'https://moniepoint.com', 360, 2, 1000,
  '{"board": "moniepoint", "company": "Moniepoint"}', 'https://developers.greenhouse.io/job-board.html', 'From Moniepoint''s careers page'),
 ('greenhouse:flyzipline', 'Zipline', 'greenhouse', 'https://www.flyzipline.com', 360, 2, 1000,
  '{"board": "flyzipline", "company": "Zipline"}', 'https://developers.greenhouse.io/job-board.html', 'From Zipline''s careers page'),
 ('greenhouse:jumia', 'Jumia', 'greenhouse', 'https://group.jumia.com', 360, 2, 1000,
  '{"board": "jumia", "company": "Jumia"}', 'https://developers.greenhouse.io/job-board.html', 'From Jumia''s careers page'),
 ('workable:fairmoney', 'FairMoney', 'workable', 'https://fairmoney.io', 360, 2, 1000,
  '{"account": "fairmoney", "company": "FairMoney"}', 'https://apply.workable.com/fairmoney/', 'From FairMoney''s careers page'),
 ('workable:kuda', 'Kuda', 'workable', 'https://kuda.com', 360, 2, 1000,
  '{"account": "kuda", "company": "Kuda"}', 'https://apply.workable.com/kuda/', 'From Kuda''s careers page'),
 ('ashby:m-kopa', 'M-KOPA', 'ashby', 'https://m-kopa.com', 360, 2, 1000,
  '{"board": "m-kopa", "company": "M-KOPA"}', 'https://developers.ashbyhq.com/docs/public-job-posting-api', 'From M-KOPA''s careers page'),
 ('lever:weloglobal', 'Welo Global', 'lever', 'https://www.welocalize.com', 360, 2, 1000,
  '{"site": "weloglobal", "company": "Welo Global"}', 'https://github.com/lever/postings-api', 'From Welo Global''s careers page');

INSERT INTO careers.sources (key, name, adapter, base_url, fetch_interval_minutes, request_quota_per_run, min_request_gap_ms, settings)
SELECT key, name, adapter, base_url, mins, quota, gap, settings FROM seed
ON CONFLICT (key) DO NOTHING;

INSERT INTO careers.source_rights (source_id, terms_url, evidence_ref, decision, reviewed_at, reviewer,
                                   fetch_allowed, display_allowed, alert_allowed, analytics_allowed, ai_allowed,
                                   cache_allowed, attribution_required, attribution_text,
                                   allowed_fields, raw_retention_days)
SELECT s.id, seed.terms_url, 'docs/careers/SOURCES.md#group-a', 'approved', now(), 'Edmund Adjekum (owner), 7 Nov 2026',
       true, true, true, true, false, true, true, seed.attribution,
       ARRAY['title','company_name','company_logo_url','summary','apply_url','source_url','work_mode','employment_type',
             'location_text','salary_text','categories','posted_at','valid_through'], 0
  FROM seed JOIN careers.sources s ON s.key = seed.key
 WHERE NOT EXISTS (SELECT 1 FROM careers.source_rights r WHERE r.source_id = s.id AND r.decision = 'approved');

UPDATE careers.sources SET status = 'active', disabled_reason = NULL
 WHERE key IN (SELECT key FROM seed) AND status IN ('disabled', 'pending_rights');

UPDATE careers.sources SET auto_publish = true WHERE key IN (SELECT key FROM seed) AND NOT auto_publish;

SELECT key, status, auto_publish, fetch_interval_minutes AS every_min, request_quota_per_run AS quota,
       careers.source_permits(id, 'fetch') AS fetch, careers.source_permits(id, 'display') AS display
  FROM careers.sources ORDER BY key;

COMMIT;
