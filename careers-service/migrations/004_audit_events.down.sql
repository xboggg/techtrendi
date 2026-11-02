BEGIN;
DROP TRIGGER IF EXISTS audit_events_no_update ON careers.audit_events;
DROP FUNCTION IF EXISTS careers.audit_events_immutable();
DROP TABLE IF EXISTS careers.audit_events;
COMMIT;
