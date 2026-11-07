-- 006 Scheduler dedupe key per due time, not per interval slot.
-- Found on staging 7 Nov 2026: with 005's slot key, setting next_due_at = now() by hand
-- ("run this source again now") produced the same key as the run that had just finished,
-- so enqueue_work returned the old, done item and nothing ran, while next_due_at moved on.
-- Keying on the due time itself is unique per scheduled run; concurrent schedulers are
-- still kept apart by FOR UPDATE SKIP LOCKED.

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
    SELECT id, fetch_interval_minutes, next_due_at FROM careers.sources
     WHERE status = 'active' AND (next_due_at IS NULL OR next_due_at <= now())
     FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM careers.enqueue_work('source_fetch', jsonb_build_object('source_id', r.id),
              'source_fetch:' || r.id || ':' || COALESCE(to_char(r.next_due_at AT TIME ZONE 'UTC', 'YYYYMMDD"T"HH24MISS.US'), 'first'),
              now(), 100::smallint, 3);
    UPDATE careers.sources SET next_due_at = now() + make_interval(mins => r.fetch_interval_minutes) WHERE id = r.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

COMMIT;
