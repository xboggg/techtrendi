#!/usr/bin/env python3
"""Generic worker loop. Phase 1 ships only the `noop` handler.

  python -m workers.worker --kinds noop --once        # process available items and exit
  python -m workers.worker --kinds source_fetch       # run until SIGTERM

Guarantees (tested in tests/test_queue.py):
  * an item is claimed by at most one worker at a time;
  * a worker that dies mid-item loses its lease and another worker picks it up;
  * handler exceptions retry with backoff until max_attempts, then dead-letter;
  * the claim transaction is committed before the handler runs, so no external
    I/O ever happens inside an open database transaction.
"""
from __future__ import annotations

import argparse
import logging
import os
import signal
import socket
import time
from typing import Callable

from . import queue as q

log = logging.getLogger("careers.worker")

Handler = Callable[[q.WorkItem], None]


def handle_noop(item: q.WorkItem) -> None:
    """Test handler: fails when payload has {"fail": true}, sleeps for payload["sleep"] seconds."""
    if item.payload.get("sleep"):
        time.sleep(float(item.payload["sleep"]))
    if item.payload.get("fail"):
        raise RuntimeError("noop asked to fail")


HANDLERS: dict[str, Handler] = {
    "noop": handle_noop,
    # "source_fetch": ...   Phase 2
    # "alert_dispatch": ... Phase 3
}


class Worker:
    def __init__(self, database_url: str, kinds: list[str], worker_id: str | None = None,
                 lease_seconds: int = 120, poll_seconds: float = 2.0, batch: int = 1):
        self.kinds = kinds
        self.worker_id = worker_id or f"{socket.gethostname()}:{os.getpid()}"
        self.lease_seconds = lease_seconds
        self.poll_seconds = poll_seconds
        self.batch = batch
        self.conn = q.connect(database_url, application_name=f"techtrendi-careers-worker:{','.join(kinds)}")
        self._stop = False

    def stop(self, *_):
        self._stop = True

    def process_one(self, item: q.WorkItem) -> str:
        handler = HANDLERS.get(item.kind)
        if handler is None:
            return q.fail(self.conn, item.id, self.worker_id, f"no handler for kind {item.kind}")
        try:
            handler(item)
        except Exception as exc:  # noqa: BLE001 — any handler failure is a retryable work failure
            state = q.fail(self.conn, item.id, self.worker_id, f"{type(exc).__name__}: {exc}")
            log.warning("item %s kind=%s attempt=%s/%s -> %s", item.id, item.kind, item.attempts, item.max_attempts, state)
            return state
        ok = q.complete(self.conn, item.id, self.worker_id)
        return "done" if ok else "lease_lost"

    def run_once(self) -> int:
        items = q.claim(self.conn, self.worker_id, self.kinds, self.lease_seconds, self.batch)
        for item in items:
            self.process_one(item)
        return len(items)

    def run_forever(self) -> None:
        signal.signal(signal.SIGTERM, self.stop)
        signal.signal(signal.SIGINT, self.stop)
        log.info("worker %s started kinds=%s", self.worker_id, self.kinds)
        while not self._stop:
            try:
                n = self.run_once()
            except Exception:  # noqa: BLE001 — keep the loop alive; the DB may be briefly unavailable
                log.exception("worker loop error; backing off")
                n = 0
                time.sleep(min(30, self.poll_seconds * 5))
            if n == 0:
                time.sleep(self.poll_seconds)
        log.info("worker %s stopped", self.worker_id)
        self.conn.close()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kinds", required=True, help="comma-separated work kinds this process handles")
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--lease", type=int, default=120)
    ap.add_argument("--poll", type=float, default=2.0)
    args = ap.parse_args()
    logging.basicConfig(level=os.environ.get("CAREERS_LOG_LEVEL", "INFO"),
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    url = os.environ.get("CAREERS_WORKER_DATABASE_URL", "")
    if not url:
        raise SystemExit("CAREERS_WORKER_DATABASE_URL is not set")
    w = Worker(url, kinds=[k.strip() for k in args.kinds.split(",") if k.strip()],
               lease_seconds=args.lease, poll_seconds=args.poll)
    if args.once:
        while w.run_once():
            pass
        w.conn.close()
    else:
        w.run_forever()


if __name__ == "__main__":
    main()
