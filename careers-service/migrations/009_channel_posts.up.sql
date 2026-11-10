-- 009 Jobs posted to the public TechTrendi Jobs Telegram channel (owner, 10 Nov 2026: "do 1";
-- D-027: alerts start as a public channel, no accounts, no personal data).
-- One row per job ever posted, so a job is never posted twice. The row is written ('sending')
-- before the Telegram call and updated after it, so a crash in between never re-posts the job.

BEGIN;

CREATE TABLE careers.channel_posts (
  job_id      uuid        PRIMARY KEY REFERENCES careers.jobs(id) ON DELETE CASCADE,
  channel     text        NOT NULL,
  batch_at    timestamptz NOT NULL DEFAULT now(),
  state       text        NOT NULL DEFAULT 'sending' CHECK (state IN ('sending', 'sent', 'failed')),
  message_id  bigint,
  error       text        CHECK (error IS NULL OR length(error) <= 300)
);
CREATE INDEX channel_posts_batch_at ON careers.channel_posts (batch_at);
ALTER TABLE careers.channel_posts ENABLE ROW LEVEL SECURITY;
-- Internal service roles only (no browser role can reach this table), as for the other careers tables.
CREATE POLICY ro_channel_posts     ON careers.channel_posts FOR SELECT TO careers_readonly, careers_worker USING (true);
CREATE POLICY worker_post_channel  ON careers.channel_posts FOR INSERT TO careers_worker WITH CHECK (true);
CREATE POLICY worker_mark_channel  ON careers.channel_posts FOR UPDATE TO careers_worker USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON careers.channel_posts TO careers_worker;
GRANT SELECT ON careers.channel_posts TO careers_readonly;
-- The poster reads the same public view as the board (each source's alert right is checked with
-- careers.source_permits, which the worker may already run since 002).
GRANT SELECT ON careers.public_jobs TO careers_worker;

COMMIT;
