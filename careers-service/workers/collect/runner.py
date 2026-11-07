"""The `source_fetch` work handler.

One run = one source, one complete pass:
  1. re-check the source is active and its rights still permit fetching;
  2. fetch everything (network first, no open transaction);
  3. keep only jobs explicitly open to Ghana or Nigeria (eligibility.py);
  4. upsert them, with eligibility rows and a status:
       review     when quality.py or eligibility found something a human must see,
       published  when the source has auto_publish on AND rights permit display,
       pending    otherwise (the owner decides);
     a job the owner already decided keeps that decision;
  5. record the run; only a complete, successful run expires jobs it no longer saw.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Callable

from .adapters import ADAPTERS
from .eligibility import evaluate, is_open_to_target
from .http import BudgetExceeded, Fetcher, LeaseLost
from .model import Job
from .quality import review_reasons
from .text import one_line

log = logging.getLogger("careers.collect")

UPSERT = """
INSERT INTO careers.jobs AS j (origin, source_id, external_id, title, company_name, company_logo_url, summary,
    apply_url, source_url, work_mode, employment_type, location_text, salary_text, categories, posted_at,
    valid_through, status, review_reasons, content_hash, last_seen_at)
VALUES ('feed', %(source_id)s, %(external_id)s, %(title)s, %(company_name)s, %(company_logo_url)s, %(summary)s,
    %(apply_url)s, %(source_url)s, %(work_mode)s, %(employment_type)s, %(location_text)s, %(salary_text)s,
    %(categories)s, %(posted_at)s, %(valid_through)s, %(status)s, %(review_reasons)s, %(content_hash)s, now())
ON CONFLICT ON CONSTRAINT jobs_source_external_uniq DO UPDATE SET
    title = EXCLUDED.title, company_name = EXCLUDED.company_name, company_logo_url = EXCLUDED.company_logo_url,
    summary = EXCLUDED.summary, apply_url = EXCLUDED.apply_url, source_url = EXCLUDED.source_url,
    work_mode = EXCLUDED.work_mode, employment_type = EXCLUDED.employment_type,
    location_text = EXCLUDED.location_text, salary_text = EXCLUDED.salary_text, categories = EXCLUDED.categories,
    posted_at = EXCLUDED.posted_at, valid_through = EXCLUDED.valid_through, content_hash = EXCLUDED.content_hash,
    last_seen_at = now(),
    review_reasons = CASE WHEN j.decided_by IS NOT NULL AND j.status <> 'expired' THEN j.review_reasons ELSE EXCLUDED.review_reasons END,
    status = CASE WHEN j.decided_by IS NOT NULL AND j.status <> 'expired' THEN j.status ELSE EXCLUDED.status END
RETURNING id, (xmax = 0) AS inserted
"""


def _hash(job: Job) -> str:
    key = json.dumps([job.title, job.company_name, job.apply_url, job.location_text, job.summary,
                      job.salary_text, job.valid_through.isoformat() if job.valid_through else None])
    return hashlib.sha256(key.encode()).hexdigest()


def _finish_run(conn, run_id, status: str, **counts) -> None:
    with conn.cursor() as cur:
        cur.execute("""UPDATE careers.source_runs SET finished_at = now(), status = %(status)s,
                         complete_snapshot = %(complete)s, fetched_count = %(fetched)s, upserted_count = %(upserted)s,
                         requests_made = %(requests)s, error_code = %(error)s WHERE id = %(id)s""",
                    {"id": run_id, "status": status, "complete": counts.get("complete", False),
                     "fetched": counts.get("fetched", 0), "upserted": counts.get("upserted", 0),
                     "requests": counts.get("requests", 0), "error": (counts.get("error") or None) and counts["error"][:200]})
    conn.commit()


def _audit(conn, source_id, details: dict) -> None:
    with conn.cursor() as cur:
        cur.execute("""INSERT INTO careers.audit_events (actor_type, actor_id, action, entity_type, entity_id, details)
                       VALUES ('service', 'careers-worker', 'source.fetch', 'source', %s, %s::jsonb)""",
                    (str(source_id), json.dumps(details)))
    conn.commit()


def run_source(conn, source_id, heartbeat: Callable[[], bool] | None = None, now: datetime | None = None) -> dict:
    """Run one fetch for one source. Returns a summary dict. Raises on retryable failure."""
    with conn.cursor() as cur:
        cur.execute("""SELECT s.*, careers.source_permits(s.id, 'fetch') AS can_fetch,
                              careers.source_permits(s.id, 'display') AS can_display
                         FROM careers.sources s WHERE s.id = %s""", (source_id,))
        src = cur.fetchone()
    conn.commit()
    if not src or src["status"] != "active" or not src["can_fetch"]:
        return {"skipped": "source not active or rights do not permit fetching"}
    adapter = ADAPTERS.get(src["adapter"])
    if adapter is None:
        raise RuntimeError(f"no adapter named {src['adapter']}")
    settings = src["settings"] or {}

    with conn.cursor() as cur:
        cur.execute("INSERT INTO careers.source_runs (source_id) VALUES (%s) RETURNING id", (source_id,))
        run_id = cur.fetchone()["id"]
    conn.commit()

    fetcher = Fetcher(quota=src["request_quota_per_run"], gap_ms=src["min_request_gap_ms"], heartbeat=heartbeat)
    try:
        jobs = adapter(fetcher, settings)
    except BudgetExceeded:
        _finish_run(conn, run_id, "partial", requests=fetcher.requests, error="quota")
        log.warning("source %s used its request quota (%s) before the end; nothing stored", src["key"], fetcher.requests)
        return {"run": str(run_id), "status": "partial", "requests": fetcher.requests}
    except LeaseLost:
        _finish_run(conn, run_id, "failed", requests=fetcher.requests, error="lease_lost")
        raise
    except Exception as exc:  # noqa: BLE001 — record, then let the queue retry with backoff
        conn.rollback()
        _finish_run(conn, run_id, "failed", requests=fetcher.requests, error=f"{type(exc).__name__}: {exc}")
        raise

    now = now or datetime.now(timezone.utc)
    max_age = settings.get("max_age_days")
    default_days = settings.get("default_valid_days")
    publish = bool(src["auto_publish"] and src["can_display"])
    counts = {"fetched": len(jobs), "kept": 0, "new": 0, "review": 0, "not_open": 0, "closed": 0, "incomplete": 0}
    withdrawn: list[str] = []      # still listed by the source, but no longer open to GH/NG (or already closed)

    seen: set[str] = set()
    for i, job in enumerate(jobs, 1):
        if job.external_id in seen:          # some boards list one job once per location
            counts["duplicate"] = counts.get("duplicate", 0) + 1
            continue
        seen.add(job.external_id)
        job.title = one_line(job.title, 200) or ""
        job.company_name = one_line(job.company_name, 150) or ""
        if len(job.title) < 2 or not job.company_name or not job.apply_url:
            counts["incomplete"] += 1
            continue
        verdicts, reasons = evaluate(job)
        if not is_open_to_target(verdicts):
            counts["not_open"] += 1
            withdrawn.append(job.external_id[:500])
            continue
        if job.valid_through is None and default_days and job.posted_at:
            job.valid_through = job.posted_at + timedelta(days=int(default_days))
        if job.valid_through and job.valid_through < now:
            counts["closed"] += 1
            withdrawn.append(job.external_id[:500])
            continue
        reasons = sorted(set(reasons + review_reasons(job, max_age, now)))
        status = "review" if reasons else ("published" if publish else "pending")
        row = {
            "source_id": source_id, "external_id": job.external_id[:500], "title": job.title,
            "company_name": job.company_name, "company_logo_url": job.company_logo_url,
            "summary": one_line(job.summary, 600), "apply_url": job.apply_url, "source_url": job.source_url,
            "work_mode": job.work_mode, "employment_type": one_line(job.employment_type, 60),
            "location_text": one_line(job.location_text, 300), "salary_text": one_line(job.salary_text, 120),
            "categories": job.categories[:5], "posted_at": job.posted_at, "valid_through": job.valid_through,
            "status": status, "review_reasons": reasons, "content_hash": _hash(job),
        }
        with conn.cursor() as cur:
            cur.execute(UPSERT, row)
            r = cur.fetchone()
            cur.execute("DELETE FROM careers.job_eligibility WHERE job_id = %s", (r["id"],))
            for cc, v in verdicts.items():
                cur.execute("INSERT INTO careers.job_eligibility (job_id, country, state, evidence) VALUES (%s, %s, %s, %s)",
                            (r["id"], cc, v.state, v.evidence))
        counts["kept"] += 1
        counts["new"] += int(bool(r["inserted"]))
        counts["review"] += int(status == "review")
        if i % 100 == 0:
            conn.commit()
            if heartbeat is not None and not heartbeat():
                conn.rollback()
                _finish_run(conn, run_id, "failed", requests=fetcher.requests, error="lease_lost")
                raise LeaseLost("work lease lost while storing")
    # A job we stored earlier that the source still lists but that no longer passes the checks
    # (wording changed, or our rules got stricter) is hidden, not deleted; owner decisions stand.
    with conn.cursor() as cur:
        cur.execute("""UPDATE careers.jobs SET status = 'hidden', review_reasons = ARRAY['no_longer_open'], last_seen_at = now()
                        WHERE source_id = %s AND external_id = ANY(%s) AND decided_by IS NULL
                          AND status IN ('pending','review','published')""", (source_id, withdrawn))
        counts["withdrawn"] = cur.rowcount
    conn.commit()

    _finish_run(conn, run_id, "succeeded", complete=True, fetched=len(jobs), upserted=counts["kept"],
                requests=fetcher.requests)
    with conn.cursor() as cur:
        # "latest N" feeds (Jobicy's 7-day window, RSS) drop jobs that are still open: they use
        # closing dates only, never absence (settings.absence_expiry = false)
        if settings.get("absence_expiry", True):
            cur.execute("SELECT careers.expire_unseen_jobs(%s) AS n", (run_id,))
            counts["expired_gone"] = cur.fetchone()["n"]
        else:
            counts["expired_gone"] = 0
        cur.execute("SELECT careers.expire_past_jobs() AS n")
        counts["expired_dated"] = cur.fetchone()["n"]
    conn.commit()
    counts["requests"] = fetcher.requests
    _audit(conn, source_id, counts)
    log.info("source %s: %s", src["key"], counts)
    return {"run": str(run_id), "status": "succeeded", **counts}
