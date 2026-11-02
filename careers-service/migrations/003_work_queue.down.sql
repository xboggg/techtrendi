BEGIN;
DROP VIEW IF EXISTS careers.work_queue_health;
DROP FUNCTION IF EXISTS careers.enqueue_work(text, jsonb, text, timestamptz, smallint, integer);
DROP FUNCTION IF EXISTS careers.fail_work(uuid, text, text);
DROP FUNCTION IF EXISTS careers.complete_work(uuid, text);
DROP FUNCTION IF EXISTS careers.renew_lease(uuid, text, integer);
DROP FUNCTION IF EXISTS careers.claim_work(text, text[], integer, integer);
DROP TABLE IF EXISTS careers.work_items;
COMMIT;
