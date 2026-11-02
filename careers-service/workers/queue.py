"""Thin Python wrapper over the SQL queue functions in migration 003.

All semantics live in the database so this module is deliberately small.
Work happens OUTSIDE the claim transaction (Blueprint §17): claim → commit →
do bounded external work → complete/fail in a new short transaction.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

import psycopg
from psycopg.rows import dict_row


@dataclass
class WorkItem:
    id: UUID
    kind: str
    payload: dict[str, Any]
    attempts: int
    max_attempts: int
    lease_until: datetime


def connect(url: str, application_name: str) -> psycopg.Connection:
    conn = psycopg.connect(url, row_factory=dict_row, application_name=application_name)
    with conn.cursor() as cur:
        cur.execute("SET search_path TO careers, pg_temp")
        cur.execute("SET statement_timeout TO '10s'")
        cur.execute("SET lock_timeout TO '2s'")
    conn.commit()
    return conn


def enqueue(conn, kind: str, payload: dict | None = None, dedupe_key: str | None = None,
            due_at: datetime | None = None, priority: int = 100, max_attempts: int = 5) -> UUID:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT careers.enqueue_work(%s, %s::jsonb, %s, COALESCE(%s, now()), %s::smallint, %s) AS id",
            (kind, json.dumps(payload or {}), dedupe_key, due_at, priority, max_attempts),
        )
        row = cur.fetchone()
    conn.commit()
    return row["id"]


def claim(conn, worker_id: str, kinds: list[str], lease_seconds: int = 120, batch: int = 1) -> list[WorkItem]:
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM careers.claim_work(%s, %s, %s, %s)", (worker_id, kinds, lease_seconds, batch))
        rows = cur.fetchall()
    conn.commit()  # the claim is committed before any external work begins
    return [WorkItem(id=r["id"], kind=r["kind"], payload=r["payload"], attempts=r["attempts"],
                     max_attempts=r["max_attempts"], lease_until=r["lease_until"]) for r in rows]


def renew(conn, item_id: UUID, worker_id: str, lease_seconds: int = 120) -> bool:
    with conn.cursor() as cur:
        cur.execute("SELECT careers.renew_lease(%s, %s, %s) AS ok", (item_id, worker_id, lease_seconds))
        ok = cur.fetchone()["ok"]
    conn.commit()
    return bool(ok)


def complete(conn, item_id: UUID, worker_id: str) -> bool:
    with conn.cursor() as cur:
        cur.execute("SELECT careers.complete_work(%s, %s) AS ok", (item_id, worker_id))
        ok = cur.fetchone()["ok"]
    conn.commit()
    return bool(ok)


def fail(conn, item_id: UUID, worker_id: str, error: str) -> str:
    with conn.cursor() as cur:
        cur.execute("SELECT careers.fail_work(%s, %s, %s) AS state", (item_id, worker_id, error[:500]))
        state = cur.fetchone()["state"]
    conn.commit()
    return state
