"""Source approval enforcement (Blueprint §19A, AC01: unapproved source cannot fetch)."""
import psycopg
import pytest


def _set_status(conn, source_id, status):
    with conn.cursor() as cur:
        cur.execute("UPDATE careers.sources SET status = %s WHERE id = %s", (status, source_id))
    conn.commit()


def _status(conn, source_id):
    with conn.cursor() as cur:
        cur.execute("SELECT status, disabled_reason FROM careers.sources WHERE id = %s", (source_id,))
        return cur.fetchone()


def test_new_source_defaults_to_disabled_with_no_permissions(migrator, source):
    assert _status(migrator, source)["status"] == "disabled"
    with migrator.cursor() as cur:
        for perm in ("fetch", "display", "alert", "analytics", "ai", "cache"):
            cur.execute("SELECT careers.source_permits(%s, %s) AS ok", (source, perm))
            assert cur.fetchone()["ok"] is False, perm


def test_cannot_activate_without_rights(migrator, source):
    with pytest.raises(psycopg.errors.CheckViolation):
        _set_status(migrator, source, "active")
    migrator.rollback()
    assert _status(migrator, source)["status"] == "disabled"


def test_pending_rights_do_not_unlock(migrator, source):
    with migrator.cursor() as cur:
        cur.execute("INSERT INTO careers.source_rights (source_id, decision, fetch_allowed) VALUES (%s, 'pending', true)", (source,))
    migrator.commit()
    with pytest.raises(psycopg.errors.CheckViolation):
        _set_status(migrator, source, "active")
    migrator.rollback()


def test_approved_rights_require_review_evidence(migrator, source):
    with pytest.raises(psycopg.errors.CheckViolation):
        with migrator.cursor() as cur:
            cur.execute("INSERT INTO careers.source_rights (source_id, decision, fetch_allowed) VALUES (%s, 'approved', true)", (source,))
    migrator.rollback()


def test_approved_fetch_right_allows_activation_and_other_permissions_stay_off(migrator, source):
    with migrator.cursor() as cur:
        cur.execute("""INSERT INTO careers.source_rights (source_id, decision, reviewed_at, reviewer, fetch_allowed, evidence_ref)
                       VALUES (%s, 'approved', now(), 'owner', true, 'SOURCE_REGISTER.csv#test')""", (source,))
    migrator.commit()
    _set_status(migrator, source, "active")
    assert _status(migrator, source)["status"] == "active"
    with migrator.cursor() as cur:
        cur.execute("SELECT careers.source_permits(%s,'fetch') f, careers.source_permits(%s,'display') d, careers.source_permits(%s,'alert') a",
                    (source, source, source))
        r = cur.fetchone()
    assert (r["f"], r["d"], r["a"]) == (True, False, False)


def test_expired_rights_block_activation(migrator, source):
    with migrator.cursor() as cur:
        cur.execute("""INSERT INTO careers.source_rights (source_id, decision, reviewed_at, reviewer, fetch_allowed, expires_at)
                       VALUES (%s, 'approved', now(), 'owner', true, now() - interval '1 day')""", (source,))
    migrator.commit()
    with pytest.raises(psycopg.errors.CheckViolation):
        _set_status(migrator, source, "active")
    migrator.rollback()


def test_revoking_rights_deactivates_active_source(migrator, source):
    with migrator.cursor() as cur:
        cur.execute("""INSERT INTO careers.source_rights (source_id, decision, reviewed_at, reviewer, fetch_allowed)
                       VALUES (%s, 'approved', now(), 'owner', true) RETURNING id""", (source,))
        rid = cur.fetchone()["id"]
    migrator.commit()
    _set_status(migrator, source, "active")
    with migrator.cursor() as cur:
        cur.execute("UPDATE careers.source_rights SET decision = 'suspended' WHERE id = %s", (rid,))
    migrator.commit()
    s = _status(migrator, source)
    assert s["status"] == "pending_rights"
    assert "rights changed" in s["disabled_reason"]


def test_worker_can_pause_but_not_activate_without_rights(worker, source):
    with worker.cursor() as cur:
        cur.execute("UPDATE careers.sources SET status = 'paused' WHERE id = %s", (source,))
    worker.commit()
    with pytest.raises(psycopg.errors.CheckViolation):
        with worker.cursor() as cur:
            cur.execute("UPDATE careers.sources SET status = 'active' WHERE id = %s", (source,))
    worker.rollback()
