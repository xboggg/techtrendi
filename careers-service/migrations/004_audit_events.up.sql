-- 004 Append-only audit trail (Blueprint §16 audit_events, §18 "Audit privileged changes")
-- Services may INSERT; nobody but the migrator may UPDATE/DELETE, and even that
-- is blocked by trigger so retention clean-up has to be an explicit, dated
-- migration rather than an ad-hoc statement.

BEGIN;

CREATE TABLE careers.audit_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type   text        NOT NULL CHECK (actor_type IN ('user','admin','service','system')),
  actor_id     text,                                       -- user uuid, service name; never an email
  action       text        NOT NULL,                       -- 'source.pause', 'rights.approve', ...
  entity_type  text        NOT NULL,
  entity_id    text,
  details      jsonb       NOT NULL DEFAULT '{}'::jsonb,   -- redacted change summary only
  request_id   text,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_entity_idx ON careers.audit_events (entity_type, entity_id, occurred_at DESC);
CREATE INDEX audit_events_time_idx   ON careers.audit_events (occurred_at DESC);

CREATE OR REPLACE FUNCTION careers.audit_events_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only' USING ERRCODE = 'insufficient_privilege';
END $$;
CREATE TRIGGER audit_events_no_update BEFORE UPDATE OR DELETE ON careers.audit_events
  FOR EACH ROW EXECUTE FUNCTION careers.audit_events_immutable();

ALTER TABLE careers.audit_events ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON careers.audit_events TO careers_api, careers_worker;
GRANT SELECT ON careers.audit_events TO careers_readonly;
CREATE POLICY svc_insert_audit ON careers.audit_events FOR INSERT TO careers_api, careers_worker WITH CHECK (true);
CREATE POLICY ro_read_audit    ON careers.audit_events FOR SELECT TO careers_readonly USING (true);

COMMIT;
