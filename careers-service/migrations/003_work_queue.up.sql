-- 003 Database-backed work queue
-- Blueprint §17 "Queue and transaction semantics": atomic claim with
-- FOR UPDATE SKIP LOCKED, leases, bounded retries, dead-letter state.
-- All queue operations are SQL functions so every worker (Python or otherwise)
-- gets identical semantics and the tests exercise the real thing.

BEGIN;

CREATE TABLE careers.work_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text        NOT NULL,                      -- 'source_fetch', 'alert_dispatch', 'noop', ...
  payload       jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- never secrets, never personal documents
  dedupe_key    text        UNIQUE,                        -- e.g. 'source_fetch:<source_id>:<due slot>'
  state         text        NOT NULL DEFAULT 'pending'
                CHECK (state IN ('pending','leased','done','dead','cancelled')),
  priority      smallint    NOT NULL DEFAULT 100,          -- lower runs first
  due_at        timestamptz NOT NULL DEFAULT now(),
  lease_until   timestamptz,
  leased_by     text,
  attempts      integer     NOT NULL DEFAULT 0,
  max_attempts  integer     NOT NULL DEFAULT 5 CHECK (max_attempts >= 1),
  last_error    text,                                      -- error class/code, bounded by app to 500 chars
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz
);
CREATE INDEX work_items_claim_idx ON careers.work_items (priority, due_at)
  WHERE state IN ('pending','leased');
CREATE INDEX work_items_state_idx ON careers.work_items (state, updated_at);
CREATE TRIGGER work_items_updated_at BEFORE UPDATE ON careers.work_items
  FOR EACH ROW EXECUTE FUNCTION careers.set_updated_at();

-- Claim up to p_batch items whose due time has passed or whose lease expired.
-- Each claimed row gets a fresh lease and attempts+1. Concurrent callers never
-- receive the same row because of FOR UPDATE SKIP LOCKED.
CREATE OR REPLACE FUNCTION careers.claim_work(
  p_worker_id     text,
  p_kinds         text[],
  p_lease_seconds integer DEFAULT 120,
  p_batch         integer DEFAULT 1
) RETURNS SETOF careers.work_items
LANGUAGE plpgsql
SET search_path = careers, pg_temp
AS $$
BEGIN
  IF p_lease_seconds < 5 OR p_lease_seconds > 3600 THEN
    RAISE EXCEPTION 'lease must be between 5 and 3600 seconds';
  END IF;
  IF p_batch < 1 OR p_batch > 100 THEN
    RAISE EXCEPTION 'batch must be between 1 and 100';
  END IF;
  RETURN QUERY
  WITH candidates AS (
    SELECT w.id
    FROM careers.work_items w
    WHERE w.kind = ANY (p_kinds)
      AND (
            (w.state = 'pending' AND w.due_at <= now())
         OR (w.state = 'leased'  AND w.lease_until < now())   -- expired lease: recoverable
      )
    ORDER BY w.priority, w.due_at
    LIMIT p_batch
    FOR UPDATE SKIP LOCKED
  )
  UPDATE careers.work_items w
     SET state       = 'leased',
         leased_by   = p_worker_id,
         lease_until = now() + make_interval(secs => p_lease_seconds),
         attempts    = w.attempts + 1
    FROM candidates c
   WHERE w.id = c.id
  RETURNING w.*;
END $$;

-- Extend a lease the caller still holds. Returns false if the lease was lost.
CREATE OR REPLACE FUNCTION careers.renew_lease(p_id uuid, p_worker_id text, p_lease_seconds integer DEFAULT 120)
RETURNS boolean
LANGUAGE sql
SET search_path = careers, pg_temp
AS $$
  WITH u AS (
    UPDATE careers.work_items
       SET lease_until = now() + make_interval(secs => p_lease_seconds)
     WHERE id = p_id AND state = 'leased' AND leased_by = p_worker_id AND lease_until >= now()
    RETURNING 1
  ) SELECT EXISTS (SELECT 1 FROM u);
$$;

-- Mark done. Only the lease holder may complete the item.
CREATE OR REPLACE FUNCTION careers.complete_work(p_id uuid, p_worker_id text)
RETURNS boolean
LANGUAGE sql
SET search_path = careers, pg_temp
AS $$
  WITH u AS (
    UPDATE careers.work_items
       SET state = 'done', finished_at = now(), lease_until = NULL
     WHERE id = p_id AND state = 'leased' AND leased_by = p_worker_id
    RETURNING 1
  ) SELECT EXISTS (SELECT 1 FROM u);
$$;

-- Record a failure. Retries with exponential backoff (capped) until
-- max_attempts, then dead-letters. Error text is truncated server-side.
CREATE OR REPLACE FUNCTION careers.fail_work(p_id uuid, p_worker_id text, p_error text)
RETURNS text
LANGUAGE plpgsql
SET search_path = careers, pg_temp
AS $$
DECLARE
  v_row careers.work_items%ROWTYPE;
  v_new_state text;
  v_delay interval;
BEGIN
  SELECT * INTO v_row FROM careers.work_items
   WHERE id = p_id AND state = 'leased' AND leased_by = p_worker_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'not_leased_by_caller';
  END IF;
  IF v_row.attempts >= v_row.max_attempts THEN
    v_new_state := 'dead';
    UPDATE careers.work_items
       SET state = 'dead', last_error = left(p_error, 500), lease_until = NULL, finished_at = now()
     WHERE id = p_id;
  ELSE
    v_new_state := 'pending';
    v_delay := make_interval(secs => LEAST(3600, 30 * power(2, v_row.attempts - 1)));
    UPDATE careers.work_items
       SET state = 'pending', last_error = left(p_error, 500), lease_until = NULL, leased_by = NULL,
           due_at = now() + v_delay
     WHERE id = p_id;
  END IF;
  RETURN v_new_state;
END $$;

-- Enqueue with optional dedupe key; a duplicate key returns the existing id
-- without creating a second item (at-least-once producers are safe).
CREATE OR REPLACE FUNCTION careers.enqueue_work(
  p_kind text, p_payload jsonb DEFAULT '{}'::jsonb, p_dedupe_key text DEFAULT NULL,
  p_due_at timestamptz DEFAULT now(), p_priority smallint DEFAULT 100, p_max_attempts integer DEFAULT 5
) RETURNS uuid
LANGUAGE plpgsql
SET search_path = careers, pg_temp
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO careers.work_items (kind, payload, dedupe_key, due_at, priority, max_attempts)
  VALUES (p_kind, p_payload, p_dedupe_key, p_due_at, p_priority, p_max_attempts)
  ON CONFLICT (dedupe_key) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM careers.work_items WHERE dedupe_key = p_dedupe_key;
  END IF;
  RETURN v_id;
END $$;

-- Operational view: what admins watch (Blueprint §17 acceptance: oldest due
-- work, retry counts and dead-letter age rather than queue length alone).
CREATE OR REPLACE VIEW careers.work_queue_health AS
SELECT
  kind,
  count(*) FILTER (WHERE state = 'pending')                         AS pending,
  count(*) FILTER (WHERE state = 'leased')                          AS leased,
  count(*) FILTER (WHERE state = 'dead')                            AS dead,
  min(due_at) FILTER (WHERE state = 'pending' AND due_at <= now())  AS oldest_due,
  max(attempts) FILTER (WHERE state IN ('pending','leased'))        AS max_attempts_in_flight,
  min(finished_at) FILTER (WHERE state = 'dead')                    AS oldest_dead
FROM careers.work_items
GROUP BY kind;

ALTER TABLE careers.work_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON careers.work_items TO careers_readonly, careers_api, careers_worker;
GRANT INSERT, UPDATE ON careers.work_items TO careers_worker, careers_api;
GRANT SELECT ON careers.work_queue_health TO careers_readonly, careers_api, careers_worker;
CREATE POLICY svc_read_work   ON careers.work_items FOR SELECT TO careers_readonly, careers_api, careers_worker USING (true);
CREATE POLICY svc_insert_work ON careers.work_items FOR INSERT TO careers_api, careers_worker WITH CHECK (true);
CREATE POLICY svc_update_work ON careers.work_items FOR UPDATE TO careers_api, careers_worker USING (true) WITH CHECK (true);
-- Functions are executable by PUBLIC by default in PostgreSQL; take that away
-- so only the intended role can drive the queue.
REVOKE EXECUTE ON FUNCTION careers.claim_work(text, text[], integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.renew_lease(uuid, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.complete_work(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.fail_work(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION careers.enqueue_work(text, jsonb, text, timestamptz, smallint, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION careers.claim_work(text, text[], integer, integer) TO careers_worker;
GRANT EXECUTE ON FUNCTION careers.renew_lease(uuid, text, integer) TO careers_worker;
GRANT EXECUTE ON FUNCTION careers.complete_work(uuid, text) TO careers_worker;
GRANT EXECUTE ON FUNCTION careers.fail_work(uuid, text, text) TO careers_worker;
GRANT EXECUTE ON FUNCTION careers.enqueue_work(text, jsonb, text, timestamptz, smallint, integer) TO careers_api, careers_worker;

COMMIT;
