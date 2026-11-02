"""Test fixtures.

Requires a PostgreSQL superuser/admin connection in CAREERS_TEST_ADMIN_URL
(local dev or CI only — never a production URL). Creates a fresh database per
session, creates login users that inherit the three Careers group roles, runs
the migrations with migrate.py, and exposes connections per role.
"""
from __future__ import annotations

import os
import secrets
import subprocess
import sys
from pathlib import Path

import psycopg
import pytest
from psycopg import sql
from psycopg.rows import dict_row

ROOT = Path(__file__).resolve().parents[1]
ADMIN_URL = os.environ.get("CAREERS_TEST_ADMIN_URL", "")
if not ADMIN_URL:
    pytest.skip("CAREERS_TEST_ADMIN_URL not set", allow_module_level=True)

DB_NAME = f"careers_test_{secrets.token_hex(3)}"
PASSWORDS = {name: secrets.token_urlsafe(16) for name in ("api", "worker", "readonly", "migrator")}


def _with_db(url: str, dbname: str) -> str:
    info = psycopg.conninfo.conninfo_to_dict(url)
    info["dbname"] = dbname
    return psycopg.conninfo.make_conninfo(**info)


def _as_user(url: str, user: str, password: str) -> str:
    info = psycopg.conninfo.conninfo_to_dict(url)
    info.update(user=user, password=password)
    return psycopg.conninfo.make_conninfo(**info)


@pytest.fixture(scope="session")
def urls():
    admin = psycopg.connect(ADMIN_URL, autocommit=True)
    with admin.cursor() as cur:
        cur.execute(f'CREATE DATABASE "{DB_NAME}"')
        # migrator owns the schema; a plain role with CREATE on the database, not a superuser
        cur.execute(sql.SQL("CREATE ROLE {} LOGIN CREATEROLE PASSWORD {}").format(
            sql.Identifier(f"{DB_NAME}_migrator"), sql.Literal(PASSWORDS["migrator"])))
        cur.execute(f'GRANT CREATE, CONNECT ON DATABASE "{DB_NAME}" TO {DB_NAME}_migrator')
    db_url = _with_db(ADMIN_URL, DB_NAME)
    migrator_url = _as_user(db_url, f"{DB_NAME}_migrator", PASSWORDS["migrator"])

    env = {**os.environ, "CAREERS_MIGRATOR_DATABASE_URL": migrator_url}
    subprocess.run([sys.executable, str(ROOT / "migrate.py"), "up"], check=True, env=env, cwd=ROOT)

    # login users per role, created by the migrator (CREATEROLE)
    with psycopg.connect(migrator_url, autocommit=True) as m, m.cursor() as cur:
        for role in ("api", "worker", "readonly"):
            cur.execute(sql.SQL("CREATE ROLE {} LOGIN PASSWORD {} IN ROLE {}").format(
                sql.Identifier(f"{DB_NAME}_{role}"), sql.Literal(PASSWORDS[role]), sql.Identifier(f"careers_{role}")))
            cur.execute(f"ALTER ROLE {DB_NAME}_{role} SET search_path TO careers, pg_temp")
            cur.execute(f"ALTER ROLE {DB_NAME}_{role} INHERIT")
    with psycopg.connect(db_url, autocommit=True) as a, a.cursor() as cur:
        for role in ("api", "worker", "readonly"):
            cur.execute(f'GRANT CONNECT ON DATABASE "{DB_NAME}" TO {DB_NAME}_{role}')

    out = {
        "db": db_url,
        "migrator": migrator_url,
        "api": _as_user(db_url, f"{DB_NAME}_api", PASSWORDS["api"]),
        "worker": _as_user(db_url, f"{DB_NAME}_worker", PASSWORDS["worker"]),
        "readonly": _as_user(db_url, f"{DB_NAME}_readonly", PASSWORDS["readonly"]),
        "env": env,
    }
    yield out

    with admin.cursor() as cur:
        cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s AND pid <> pg_backend_pid()", (DB_NAME,))
        cur.execute(f'DROP DATABASE IF EXISTS "{DB_NAME}"')
        for role in ("api", "worker", "readonly", "migrator"):
            cur.execute(f"DROP ROLE IF EXISTS {DB_NAME}_{role}")
        # group roles are cluster-wide; drop them so the next test session starts clean
        for role in ("careers_api", "careers_worker", "careers_readonly"):
            cur.execute(f"DROP ROLE IF EXISTS {role}")
    admin.close()


def _conn(url: str):
    c = psycopg.connect(url, row_factory=dict_row)
    with c.cursor() as cur:
        cur.execute("SET search_path TO careers, pg_temp")
    c.commit()
    return c


@pytest.fixture
def migrator(urls):
    c = _conn(urls["migrator"]); yield c; c.rollback(); c.close()


@pytest.fixture
def api(urls):
    c = _conn(urls["api"]); yield c; c.rollback(); c.close()


@pytest.fixture
def worker(urls):
    c = _conn(urls["worker"]); yield c; c.rollback(); c.close()


@pytest.fixture
def readonly(urls):
    c = _conn(urls["readonly"]); yield c; c.rollback(); c.close()


@pytest.fixture
def clean_queue(migrator):
    with migrator.cursor() as cur:
        cur.execute("DELETE FROM careers.work_items")
    migrator.commit()
    yield


@pytest.fixture
def source(migrator):
    """A disabled source with no rights, cleaned up afterwards."""
    with migrator.cursor() as cur:
        cur.execute("INSERT INTO careers.sources (key, name, adapter, base_url) VALUES (%s,%s,%s,%s) RETURNING id",
                    ("test:fixture", "Fixture source", "noop", "https://example.invalid"))
        sid = cur.fetchone()["id"]
    migrator.commit()
    yield sid
    with migrator.cursor() as cur:
        cur.execute("DELETE FROM careers.sources WHERE id = %s", (sid,))
    migrator.commit()
