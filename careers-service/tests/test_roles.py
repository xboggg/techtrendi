"""Role isolation (Blueprint AC10 groundwork, §14 'RLS alone is ineffective if the role bypasses it')."""
import psycopg
import pytest


def test_roles_cannot_bypass_rls_or_be_superusers(migrator):
    with migrator.cursor() as cur:
        cur.execute("""SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolcanlogin
                       FROM pg_roles WHERE rolname IN ('careers_api','careers_worker','careers_readonly') ORDER BY 1""")
        rows = cur.fetchall()
    assert len(rows) == 3
    for r in rows:
        assert r["rolsuper"] is False
        assert r["rolbypassrls"] is False
        assert r["rolcreaterole"] is False
        assert r["rolcreatedb"] is False
        assert r["rolcanlogin"] is False  # group roles; only owner-created login users can connect


def test_api_role_cannot_see_other_schemas(migrator, api):
    # simulate a pre-existing TechTrendi table in another schema
    with migrator.cursor() as cur:
        cur.execute("CREATE SCHEMA IF NOT EXISTS techtrendi_sim")
        cur.execute("CREATE TABLE IF NOT EXISTS techtrendi_sim.articles (id int)")
        cur.execute("INSERT INTO techtrendi_sim.articles VALUES (1)")
    migrator.commit()
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with api.cursor() as cur:
            cur.execute("SELECT * FROM techtrendi_sim.articles")
    api.rollback()
    with migrator.cursor() as cur:
        cur.execute("DROP SCHEMA techtrendi_sim CASCADE")
    migrator.commit()


def test_api_role_cannot_write_source_rights(api, source):
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with api.cursor() as cur:
            cur.execute("INSERT INTO careers.source_rights (source_id, decision) VALUES (%s, 'pending')", (source,))
    api.rollback()


def test_readonly_cannot_write_anything(readonly, source):
    for sql in (
        "UPDATE careers.sources SET status = 'paused' WHERE id = %s",
        "INSERT INTO careers.work_items (kind) VALUES ('noop')",
        "INSERT INTO careers.audit_events (actor_type, action, entity_type) VALUES ('system','x','y')",
    ):
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            with readonly.cursor() as cur:
                cur.execute(sql, (source,) if "%s" in sql else None)
        readonly.rollback()


def test_rls_enabled_on_every_careers_table(migrator):
    with migrator.cursor() as cur:
        cur.execute("""SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                       WHERE n.nspname = 'careers' AND c.relkind = 'r' AND c.relrowsecurity = false""")
        unprotected = [r["relname"] for r in cur.fetchall()]
    assert unprotected == [], f"tables without RLS: {unprotected}"


def test_audit_events_are_append_only(api, migrator):
    with api.cursor() as cur:  # no RETURNING: the api role may write the trail but not read it
        cur.execute("INSERT INTO careers.audit_events (actor_type, actor_id, action, entity_type, entity_id) "
                    "VALUES ('service','test','test.insert','test','1')")
    api.commit()
    with migrator.cursor() as cur:
        cur.execute("SELECT id FROM careers.audit_events WHERE action = 'test.insert' ORDER BY occurred_at DESC LIMIT 1")
        aid = cur.fetchone()["id"]
    # even the schema owner cannot alter or delete
    for sql in ("UPDATE careers.audit_events SET action = 'tampered' WHERE id = %s",
                "DELETE FROM careers.audit_events WHERE id = %s"):
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            with migrator.cursor() as cur:
                cur.execute(sql, (aid,))
        migrator.rollback()
    # and the api role cannot even read the trail (readonly can)
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with api.cursor() as cur:
            cur.execute("SELECT count(*) FROM careers.audit_events")
    api.rollback()
