#!/usr/bin/env python3
"""Post new jobs to the public TechTrendi Jobs Telegram channel.

  python -m workers.channel              # one post (systemd timer: 07:00, 12:00 and 18:00 Ghana time)
  python -m workers.channel --dry-run    # print the message; send and record nothing

Owner, 10 Nov 2026 ("do 1"); D-027: alerts start as a public channel, so no accounts and no
personal data. Each post lists up to 10 jobs that are open to people in Ghana or Nigeria, came
from a source whose rights allow alerts, were posted in the last 2 days and were never posted
before (careers.channel_posts). Links go to the job's TechTrendi share page, never straight to
the source, so readers see the board and its scam warning.

Env: CAREERS_WORKER_DATABASE_URL, CAREERS_TG_BOT_TOKEN, CAREERS_TG_CHANNEL (@name or -100… id).
No Telegram call happens inside an open database transaction.
"""
from __future__ import annotations

import argparse
import html
import json
import logging
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Callable

import psycopg
from psycopg.rows import dict_row

from app.skills import SKILL_TAGS, job_skills

log = logging.getLogger("careers.channel")

SITE = "https://techtrendi.com"
PER_POST = 10
PER_COMPANY = 2          # one company's 30 "AI trainer" adverts must not fill a post
FLAGS = {"GH": "🇬🇭", "NG": "🇳🇬"}

CANDIDATES_SQL = """
SELECT p.id, p.title, p.company_name, p.salary_text, p.work_mode, p.location_text, p.open_to, p.categories, p.posted_at
  FROM careers.public_jobs p
  JOIN careers.jobs j ON j.id = p.id
 WHERE careers.source_permits(j.source_id, 'alert')
   AND p.open_to && ARRAY['GH', 'NG']
   AND p.posted_at >= now() - interval '2 days'
   AND NOT EXISTS (SELECT 1 FROM careers.channel_posts c WHERE c.job_id = p.id)
 ORDER BY p.posted_at DESC, p.id
 LIMIT 80
"""


def pick(rows: list[dict], n: int = PER_POST, per_company: int = PER_COMPANY) -> list[dict]:
    """Newest first, at most `per_company` jobs from one company."""
    out, seen = [], {}
    for r in rows:
        key = r["company_name"].strip().lower()
        if seen.get(key, 0) >= per_company:
            continue
        seen[key] = seen.get(key, 0) + 1
        out.append(r)
        if len(out) == n:
            break
    return out


def job_lines(i: int, r: dict) -> str:
    e = lambda s: html.escape(s, quote=False)
    where = "Work from home" if r["work_mode"] == "remote" else (r["location_text"] or "")
    facts = [x for x in (r["salary_text"], where) if x]
    flags = "".join(FLAGS[c] for c in ("GH", "NG") if c in (r["open_to"] or []))
    tags = " ".join(f"#{SKILL_TAGS[k]}" for k in job_skills(r["title"], list(r["categories"] or [])))
    lines = [f"<b>{i}. {e(r['title'])}</b>", f"{e(r['company_name'])}" + (f" · {e(' · '.join(facts))}" if facts else "") + f" {flags}"]
    if tags:
        lines.append(tags)
    lines.append(f'<a href="{SITE}/careers/job/{r["id"]}">See the job</a>')
    return "\n".join(lines)


def build_message(jobs: list[dict], now: datetime | None = None) -> str:
    now = now or datetime.now(timezone.utc)
    head = f"🆕 <b>New jobs open to people in Ghana and Nigeria</b>\n{now.day} {now:%B %Y}"
    body = "\n\n".join(job_lines(i, r) for i, r in enumerate(jobs, 1))
    foot = (f'👉 <a href="{SITE}/careers">See all jobs on TechTrendi</a>\n'
            "⚠️ Never pay money to get a job. Real employers don't charge fees.")
    return f"{head}\n\n{body}\n\n{foot}"


def telegram_send(token: str, chat: str, text: str) -> int:
    """sendMessage; one wait-and-retry on Telegram's Retry-After. Returns the message id."""
    data = json.dumps({"chat_id": chat, "text": text, "parse_mode": "HTML", "disable_web_page_preview": True}).encode()
    for attempt in (1, 2):
        req = urllib.request.Request(f"https://api.telegram.org/bot{token}/sendMessage", data=data,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return int(json.load(resp)["result"]["message_id"])
        except urllib.error.HTTPError as err:
            body = json.loads(err.read() or b"{}")
            wait = (body.get("parameters") or {}).get("retry_after")
            if err.code == 429 and wait and attempt == 1:
                time.sleep(min(int(wait), 60))
                continue
            # Never log the URL: it holds the bot token.
            raise RuntimeError(f"Telegram said {err.code}: {body.get('description', '')[:200]}") from None
    raise RuntimeError("Telegram kept asking to wait")


def post_once(conn: psycopg.Connection, send: Callable[[str], int], channel: str, dry_run: bool = False) -> dict:
    with conn.cursor() as cur:
        cur.execute(CANDIDATES_SQL)
        jobs = pick(cur.fetchall())
    conn.commit()
    if not jobs:
        return {"posted": 0}
    text = build_message(jobs)
    if dry_run:
        print(text)
        return {"posted": 0, "dry_run": len(jobs)}
    ids = [r["id"] for r in jobs]
    with conn.cursor() as cur:   # claim first: a crash after sending must not post these again
        cur.executemany("INSERT INTO careers.channel_posts (job_id, channel) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        [(i, channel) for i in ids])
    conn.commit()
    try:
        msg_id = send(text)
    except Exception as exc:     # recorded as failed; those jobs are not tried again
        with conn.cursor() as cur:
            cur.execute("UPDATE careers.channel_posts SET state = 'failed', error = %s WHERE job_id = ANY(%s)",
                        (str(exc)[:300], ids))
        conn.commit()
        raise
    with conn.cursor() as cur:
        cur.execute("UPDATE careers.channel_posts SET state = 'sent', message_id = %s WHERE job_id = ANY(%s)", (msg_id, ids))
    conn.commit()
    return {"posted": len(jobs), "message_id": msg_id}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    url = os.environ.get("CAREERS_WORKER_DATABASE_URL")
    token = os.environ.get("CAREERS_TG_BOT_TOKEN", "")
    channel = os.environ.get("CAREERS_TG_CHANNEL", "")
    if not url or (not args.dry_run and not (token and channel)):
        log.error("CAREERS_WORKER_DATABASE_URL, CAREERS_TG_BOT_TOKEN and CAREERS_TG_CHANNEL must be set")
        return 2
    with psycopg.connect(url, row_factory=dict_row, application_name="techtrendi-careers-channel") as conn:
        with conn.cursor() as cur:
            cur.execute("SET search_path TO careers, pg_temp")
            cur.execute("SET statement_timeout TO '10s'")
        conn.commit()
        result = post_once(conn, lambda text: telegram_send(token, channel, text), channel or "(dry run)", args.dry_run)
    log.info("channel post: %s", result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
