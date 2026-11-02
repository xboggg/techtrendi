-- 001 down: removes the schema and the Careers group roles.
-- Login users the owner created IN ROLE careers_* must be dropped by the owner
-- first (REASSIGN/DROP OWNED), otherwise the role drops below will fail safely.
BEGIN;
DROP SCHEMA IF EXISTS careers CASCADE;
DROP ROLE IF EXISTS careers_readonly;
DROP ROLE IF EXISTS careers_worker;
DROP ROLE IF EXISTS careers_api;
COMMIT;
