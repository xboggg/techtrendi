"""Jobs storage, rights gates, statuses, expiry and scheduling (migration 005 + runner)."""
from datetime import datetime, timedelta, timezone

import psycopg
import pytest

from workers.collect import adapters
from workers.collect.http import BudgetExceeded
from workers.collect.model import Job
from workers.collect.runner import run_source
from workers.queue import connect

NOW = datetime.now(timezone.utc)


def _rights(migrator, source, *, display=True):
    with migrator.cursor() as cur:
        cur.execute("""INSERT INTO careers.source_rights (source_id, decision, reviewed_at, reviewer, fetch_allowed,
                         display_allowed, attribution_text, evidence_ref)
                       VALUES (%s, 'approved', now(), 'owner', true, %s, 'Jobs from Fixture', 'test') RETURNING id""",
                    (source, display))
        rid = cur.fetchone()["id"]
        cur.execute("UPDATE careers.sources SET status = 'active', adapter = 'fake' WHERE id = %s", (source,))
    migrator.commit()
    return rid


def _jobs(conn, source):
    with conn.cursor() as cur:
        cur.execute("SELECT external_id, status, review_reasons FROM careers.jobs WHERE source_id = %s ORDER BY external_id", (source,))
        return {r["external_id"]: r for r in cur.fetchall()}


def fake_job(eid, **kw):
    base = dict(external_id=eid, title=f"Job {eid}", company_name="Acme", apply_url=f"https://acme.example/{eid}",
                locations=["Anywhere in the World"], posted_at=NOW - timedelta(days=1))
    base.update(kw)
    return Job(**base)


@pytest.fixture
def feed(monkeypatch):
    """Lets a test choose what the fake adapter returns on each run."""
    box = {"jobs": []}

    def fake(f, s):
        if box.get("raise"):
            raise box["raise"]
        return list(box["jobs"])
    monkeypatch.setitem(adapters.ADAPTERS, "fake", fake)
    monkeypatch.setattr("workers.collect.runner.ADAPTERS", adapters.ADAPTERS)
    return box


@pytest.fixture
def wconn(urls):
    c = connect(urls["worker"], "test-worker")
    yield c
    c.close()


def test_worker_cannot_store_jobs_for_a_source_without_rights(worker, source):
    with pytest.raises(psycopg.errors.CheckViolation):
        with worker.cursor() as cur:
            cur.execute("""INSERT INTO careers.jobs (origin, source_id, external_id, title, company_name, apply_url)
                           VALUES ('feed', %s, '1', 'Title', 'Acme', 'https://a.example')""", (source,))
    worker.rollback()


def test_cannot_publish_without_display_right(migrator, worker, source):
    _rights(migrator, source, display=False)
    with worker.cursor() as cur:
        cur.execute("""INSERT INTO careers.jobs (origin, source_id, external_id, title, company_name, apply_url)
                       VALUES ('feed', %s, '1', 'Title', 'Acme', 'https://a.example')""", (source,))
    worker.commit()
    with pytest.raises(psycopg.errors.CheckViolation):
        with worker.cursor() as cur:
            cur.execute("UPDATE careers.jobs SET status = 'published' WHERE source_id = %s", (source,))
    worker.rollback()


def test_api_and_readonly_cannot_write_jobs(api, readonly, migrator, source):
    _rights(migrator, source)
    for conn in (api, readonly):
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            with conn.cursor() as cur:
                cur.execute("""INSERT INTO careers.jobs (origin, source_id, external_id, title, company_name, apply_url)
                               VALUES ('feed', %s, '9', 'Title', 'Acme', 'https://a.example')""", (source,))
        conn.rollback()


def test_run_keeps_only_jobs_open_to_ghana_or_nigeria_and_waits_for_owner(migrator, wconn, source, feed):
    _rights(migrator, source)
    feed["jobs"] = [
        fake_job("open"),
        fake_job("us-only", locations=["USA Only"]),
        fake_job("us-title", title="Analyst (U.S. Based)", locations=[], allowed_countries=[]),
        fake_job("lagos", locations=["Lagos, Nigeria"]),
        fake_job("scam", text="Pay a registration fee to start."),
        fake_job("closed", valid_through=NOW - timedelta(days=1)),
    ]
    r = run_source(wconn, source)
    assert r["status"] == "succeeded" and r["kept"] == 3 and r["not_open"] == 2 and r["closed"] == 1
    j = _jobs(migrator, source)
    assert set(j) == {"open", "lagos", "scam"}
    assert j["open"]["status"] == "pending"                 # auto_publish is off by default
    assert j["scam"]["status"] == "review" and j["scam"]["review_reasons"] == ["scam_signs"]
    with migrator.cursor() as cur:
        cur.execute("""SELECT e.country, e.state FROM careers.job_eligibility e JOIN careers.jobs j ON j.id = e.job_id
                       WHERE j.source_id = %s AND j.external_id = 'lagos' ORDER BY 1""", (source,))
        assert [(x["country"], x["state"]) for x in cur.fetchall()] == [("GH", "unknown"), ("NG", "allowed")]


def test_auto_publish_needs_the_switch_and_the_display_right(migrator, wconn, source, feed):
    _rights(migrator, source)
    with migrator.cursor() as cur:
        cur.execute("UPDATE careers.sources SET auto_publish = true WHERE id = %s", (source,))
    migrator.commit()
    feed["jobs"] = [fake_job("a")]
    run_source(wconn, source)
    assert _jobs(migrator, source)["a"]["status"] == "published"
    with migrator.cursor() as cur:
        cur.execute("SELECT title, open_to, attribution_text FROM careers.public_jobs WHERE title = 'Job a'")
        row = cur.fetchone()
    assert row["open_to"] == ["GH", "NG"] and row["attribution_text"] == "Jobs from Fixture"


def test_losing_display_right_hides_published_jobs(migrator, wconn, source, feed):
    rid = _rights(migrator, source)
    with migrator.cursor() as cur:
        cur.execute("UPDATE careers.sources SET auto_publish = true WHERE id = %s", (source,))
    migrator.commit()
    feed["jobs"] = [fake_job("a")]
    run_source(wconn, source)
    with migrator.cursor() as cur:
        cur.execute("UPDATE careers.source_rights SET display_allowed = false WHERE id = %s", (rid,))
    migrator.commit()
    assert _jobs(migrator, source)["a"]["status"] == "hidden"


def test_owner_decision_survives_the_next_run(migrator, wconn, source, feed):
    _rights(migrator, source)
    feed["jobs"] = [fake_job("a")]
    run_source(wconn, source)
    with migrator.cursor() as cur:
        cur.execute("UPDATE careers.jobs SET status = 'rejected', decided_by = 'owner', decided_at = now() WHERE source_id = %s", (source,))
    migrator.commit()
    run_source(wconn, source)
    assert _jobs(migrator, source)["a"]["status"] == "rejected"


def test_complete_run_expires_jobs_that_disappeared_but_partial_run_does_not(migrator, wconn, source, feed):
    _rights(migrator, source)
    feed["jobs"] = [fake_job("a"), fake_job("b")]
    run_source(wconn, source)

    feed["raise"] = BudgetExceeded("quota")
    r = run_source(wconn, source)
    assert r["status"] == "partial"
    assert {k: v["status"] for k, v in _jobs(migrator, source).items()} == {"a": "pending", "b": "pending"}

    feed["raise"] = None
    feed["jobs"] = [fake_job("a")]
    r = run_source(wconn, source)
    assert r["expired_gone"] == 1
    assert {k: v["status"] for k, v in _jobs(migrator, source).items()} == {"a": "pending", "b": "expired"}

    feed["jobs"] = [fake_job("a"), fake_job("b")]          # it came back
    run_source(wconn, source)
    assert _jobs(migrator, source)["b"]["status"] == "pending"


def test_latest_only_feeds_never_expire_by_absence(migrator, wconn, source, feed):
    _rights(migrator, source)
    with migrator.cursor() as cur:
        cur.execute("""UPDATE careers.sources SET settings = '{"absence_expiry": false, "default_valid_days": 30}'
                       WHERE id = %s""", (source,))
    migrator.commit()
    feed["jobs"] = [fake_job("a"), fake_job("b")]
    run_source(wconn, source)
    feed["jobs"] = [fake_job("a")]
    r = run_source(wconn, source)
    assert r["expired_gone"] == 0 and _jobs(migrator, source)["b"]["status"] == "pending"
    with migrator.cursor() as cur:
        cur.execute("SELECT valid_through - posted_at AS d FROM careers.jobs WHERE source_id = %s AND external_id = 'b'", (source,))
        assert cur.fetchone()["d"] == timedelta(days=30)


def test_job_still_listed_but_no_longer_open_is_hidden_not_deleted(migrator, wconn, source, feed):
    _rights(migrator, source)
    with migrator.cursor() as cur:
        cur.execute("""UPDATE careers.sources SET settings = '{"absence_expiry": false}' WHERE id = %s""", (source,))
    migrator.commit()
    feed["jobs"] = [fake_job("a"), fake_job("b")]
    run_source(wconn, source)
    feed["jobs"] = [fake_job("a"), fake_job("b", text="- Based in: India, Remote")]
    r = run_source(wconn, source)
    j = _jobs(migrator, source)
    assert r["withdrawn"] == 1 and j["b"]["status"] == "hidden" and j["b"]["review_reasons"] == ["no_longer_open"]
    feed["jobs"] = [fake_job("a"), fake_job("b")]           # wording fixed again: back to waiting for the owner
    run_source(wconn, source)
    assert _jobs(migrator, source)["b"]["status"] == "pending"


def test_failed_fetch_is_recorded_and_raised(migrator, wconn, source, feed):
    _rights(migrator, source)
    feed["raise"] = RuntimeError("boom")
    with pytest.raises(RuntimeError):
        run_source(wconn, source)
    with migrator.cursor() as cur:
        cur.execute("SELECT status, error_code FROM careers.source_runs WHERE source_id = %s ORDER BY started_at DESC LIMIT 1", (source,))
        r = cur.fetchone()
    assert r["status"] == "failed" and "boom" in r["error_code"]


def test_expiry_refuses_incomplete_runs(migrator, worker, source):
    _rights(migrator, source)
    with worker.cursor() as cur:
        cur.execute("INSERT INTO careers.source_runs (source_id, status) VALUES (%s, 'partial') RETURNING id", (source,))
        rid = cur.fetchone()["id"]
    worker.commit()
    with pytest.raises(psycopg.errors.CheckViolation):
        with worker.cursor() as cur:
            cur.execute("SELECT careers.expire_unseen_jobs(%s)", (rid,))
    worker.rollback()


def test_inactive_source_is_skipped(migrator, wconn, source, feed):
    feed["jobs"] = [fake_job("a")]
    assert "skipped" in run_source(wconn, source)


def test_scheduler_queues_due_sources_once(migrator, worker, source, clean_queue):
    _rights(migrator, source)
    with worker.cursor() as cur:
        cur.execute("SELECT careers.enqueue_due_sources() AS n")
        assert cur.fetchone()["n"] == 1
        cur.execute("SELECT careers.enqueue_due_sources() AS n")
        assert cur.fetchone()["n"] == 0                       # next_due_at moved forward
        cur.execute("SELECT count(*) AS n FROM careers.work_items WHERE kind = 'source_fetch' AND payload->>'source_id' = %s", (str(source),))
        assert cur.fetchone()["n"] == 1
    worker.commit()


def test_run_now_after_a_finished_run_queues_again(migrator, worker, source, clean_queue):
    """Staging, 7 Nov 2026: resetting next_due_at by hand right after a run queued nothing."""
    _rights(migrator, source)
    with worker.cursor() as cur:
        cur.execute("SELECT careers.enqueue_due_sources()")
        cur.execute("UPDATE careers.work_items SET state = 'done' WHERE kind = 'source_fetch'")
    worker.commit()
    with migrator.cursor() as cur:
        cur.execute("UPDATE careers.sources SET next_due_at = now() WHERE id = %s", (source,))
    migrator.commit()
    with worker.cursor() as cur:
        cur.execute("SELECT careers.enqueue_due_sources() AS n")
        assert cur.fetchone()["n"] == 1
        cur.execute("SELECT count(*) AS n FROM careers.work_items WHERE kind = 'source_fetch' AND state = 'pending'")
        assert cur.fetchone()["n"] == 1
    worker.commit()


def test_api_cannot_run_the_scheduler(api):
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with api.cursor() as cur:
            cur.execute("SELECT careers.enqueue_due_sources()")
    api.rollback()
