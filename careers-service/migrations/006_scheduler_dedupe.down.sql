-- 006 down: back to 005's slot-based dedupe key.
BEGIN;

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

COMMIT;
