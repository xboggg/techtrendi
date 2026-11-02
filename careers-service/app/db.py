"""Database access: a small psycopg connection pool bound to the API role.

Every connection pins search_path to the careers schema and pg_temp so no
query can accidentally resolve an unqualified name in public/techtrendi.
Statement and lock timeouts are set so a slow query cannot pile up connections
against the shared database (Blueprint §14 resource budgets).
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import get_settings

_pool: ConnectionPool | None = None


def _configure(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("SET search_path TO careers, pg_temp")
        cur.execute("SET statement_timeout TO '5s'")
        cur.execute("SET lock_timeout TO '2s'")
        cur.execute("SET idle_in_transaction_session_timeout TO '10s'")
    conn.commit()


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        settings = get_settings()
        if not settings.database_url:
            raise RuntimeError("CAREERS_DATABASE_URL is not set")
        _pool = ConnectionPool(
            conninfo=settings.database_url,
            min_size=1,
            max_size=5,          # small on purpose: the DB is shared with the news platform
            timeout=5,
            configure=_configure,
            kwargs={"row_factory": dict_row, "application_name": "techtrendi-careers-api"},
            open=True,
        )
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def connection() -> Iterator[psycopg.Connection]:
    with get_pool().connection() as conn:
        yield conn


def ready_check() -> bool:
    """Returns True when the database answers; never raises."""
    try:
        with connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        return True
    except Exception:
        return False
