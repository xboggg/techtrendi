"""Work queue semantics (Blueprint §17 acceptance: no double claims, lease recovery, dead-letter)."""
import threading
import time

import psycopg

from workers import queue as q
from workers.worker import Worker


def _state(conn, item_id):
    with conn.cursor() as cur:
        cur.execute("SELECT state, attempts, leased_by, due_at, last_error FROM careers.work_items WHERE id = %s", (item_id,))
        return cur.fetchone()


def test_enqueue_dedupes_on_key(worker, clean_queue):
    a = q.enqueue(worker, "noop", {"n": 1}, dedupe_key="noop:slot-1")
    b = q.enqueue(worker, "noop", {"n": 2}, dedupe_key="noop:slot-1")
    assert a == b
    with worker.cursor() as cur:
        cur.execute("SELECT count(*) AS c FROM careers.work_items")
        assert cur.fetchone()["c"] == 1


def test_claim_complete_roundtrip(worker, clean_queue):
    iid = q.enqueue(worker, "noop")
    items = q.claim(worker, "w1", ["noop"])
    assert [i.id for i in items] == [iid]
    assert items[0].attempts == 1
    assert q.claim(worker, "w2", ["noop"]) == []           # already leased, not expired
    assert q.complete(worker, iid, "w2") is False          # not the lease holder
    assert q.complete(worker, iid, "w1") is True
    assert _state(worker, iid)["state"] == "done"


def test_concurrent_workers_never_share_an_item(urls, worker, clean_queue):
    ids = {q.enqueue(worker, "noop", {"i": i}) for i in range(40)}
    claimed: dict[str, list] = {}
    lock = threading.Lock()

    def run(name):
        conn = q.connect(urls["worker"], application_name=name)
        got = []
        while True:
            items = q.claim(conn, name, ["noop"], lease_seconds=60, batch=3)
            if not items:
                break
            got.extend(i.id for i in items)
            for i in items:
                q.complete(conn, i.id, name)
        conn.close()
        with lock:
            claimed[name] = got

    threads = [threading.Thread(target=run, args=(f"w{n}",)) for n in range(6)]
    for t in threads: t.start()
    for t in threads: t.join()
    all_claimed = [i for lst in claimed.values() for i in lst]
    assert len(all_claimed) == 40
    assert set(all_claimed) == ids
    assert len(set(all_claimed)) == 40, "an item was claimed by more than one worker"


def test_expired_lease_is_reclaimable_and_renew_extends(worker, migrator, clean_queue):
    iid = q.enqueue(worker, "noop")
    [item] = q.claim(worker, "w1", ["noop"], lease_seconds=5)
    assert q.renew(worker, iid, "w1", 60) is True
    # simulate crash: force the lease into the past
    with migrator.cursor() as cur:
        cur.execute("UPDATE careers.work_items SET lease_until = now() - interval '1 second' WHERE id = %s", (iid,))
    migrator.commit()
    assert q.renew(worker, iid, "w1", 60) is False       # lease lost
    [again] = q.claim(worker, "w2", ["noop"])
    assert again.id == iid and again.attempts == 2
    assert q.complete(worker, iid, "w1") is False        # old holder cannot complete
    assert q.complete(worker, iid, "w2") is True


def test_failures_retry_with_backoff_then_dead_letter(urls, worker, clean_queue):
    iid = q.enqueue(worker, "noop", {"fail": True}, max_attempts=3)
    w = Worker(urls["worker"], kinds=["noop"], worker_id="wf", lease_seconds=30)
    # attempt 1 -> pending with backoff
    assert w.run_once() == 1
    s = _state(worker, iid)
    assert s["state"] == "pending" and s["attempts"] == 1 and "noop asked to fail" in s["last_error"]
    assert s["due_at"] > _now(worker)                     # backed off into the future
    with w.conn.cursor() as cur:                           # pull due_at forward for the test
        cur.execute("UPDATE careers.work_items SET due_at = now() WHERE id = %s", (iid,))
    w.conn.commit()
    assert w.run_once() == 1                               # attempt 2
    with w.conn.cursor() as cur:
        cur.execute("UPDATE careers.work_items SET due_at = now() WHERE id = %s", (iid,))
    w.conn.commit()
    assert w.run_once() == 1                               # attempt 3 -> dead
    s = _state(worker, iid)
    assert s["state"] == "dead" and s["attempts"] == 3
    assert w.run_once() == 0                               # dead items are never claimed again
    with worker.cursor() as cur:
        cur.execute("SELECT dead, oldest_dead FROM careers.work_queue_health WHERE kind = 'noop'")
        h = cur.fetchone()
    assert h["dead"] == 1 and h["oldest_dead"] is not None
    w.conn.close()


def test_unknown_kind_fails_safely(urls, worker, clean_queue):
    iid = q.enqueue(worker, "mystery", max_attempts=1)
    w = Worker(urls["worker"], kinds=["mystery"], worker_id="wu")
    assert w.run_once() == 1
    s = _state(worker, iid)
    assert s["state"] == "dead" and "no handler" in s["last_error"]
    w.conn.close()


def test_claim_bounds_are_enforced(worker, clean_queue):
    for bad in ({"lease_seconds": 1}, {"lease_seconds": 99999}, {"batch": 0}, {"batch": 1000}):
        try:
            q.claim(worker, "w", ["noop"], **bad)
        except psycopg.errors.RaiseException:
            worker.rollback()
        else:
            raise AssertionError(f"claim accepted invalid argument {bad}")


def test_api_role_can_enqueue_but_not_claim(api, clean_queue):
    q.enqueue(api, "noop")
    try:
        q.claim(api, "api", ["noop"])
    except psycopg.errors.InsufficientPrivilege:
        api.rollback()
    else:
        raise AssertionError("api role must not be able to claim work")


def _now(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT now() AS t")
        return cur.fetchone()["t"]
