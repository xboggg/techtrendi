"""Migration rehearsal (Blueprint §21 Phase 1 exit: apply and roll back cleanly).

Runs on a separate scratch database so it does not disturb the session DB the
other tests use. The careers_* group roles are cluster-wide and already exist
(created by the session fixture), so this test proves 001 is idempotent in the
presence of existing roles and rolls back 002–005 fully; 001's own down
(DROP ROLE) is exercised at the end of the session by conftest teardown.
"""
import os
import secrets
import subprocess
import sys
from pathlib import Path

import psycopg
import pytest

ROOT = Path(__file__).resolve().parents[1]
ADMIN_URL = os.environ.get("CAREERS_TEST_ADMIN_URL", "")
TABLES_AFTER_UP = {"schema_migrations", "sources", "source_rights", "source_runs", "work_items", "audit_events",
                   "jobs", "job_eligibility"}


def _run(url, *args):
    env = {**os.environ, "CAREERS_MIGRATOR_DATABASE_URL": url}
    return subprocess.run([sys.executable, str(ROOT / "migrate.py"), *args], env=env, cwd=ROOT,
                          capture_output=True, text=True)


def _tables(url):
    with psycopg.connect(url) as c, c.cursor() as cur:
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'careers'")
        return {r[0] for r in cur.fetchall()}


@pytest.fixture
def scratch_db(urls):  # depends on urls so group roles exist first
    name = f"careers_mig_{secrets.token_hex(3)}"
    admin = psycopg.connect(ADMIN_URL, autocommit=True)
    with admin.cursor() as cur:
        cur.execute(f'CREATE DATABASE "{name}"')
    info = psycopg.conninfo.conninfo_to_dict(ADMIN_URL); info["dbname"] = name
    url = psycopg.conninfo.make_conninfo(**info)
    yield url
    with admin.cursor() as cur:
        cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s AND pid <> pg_backend_pid()", (name,))
        cur.execute(f'DROP DATABASE IF EXISTS "{name}"')
    admin.close()


def test_up_then_partial_down_then_up(scratch_db):
    r = _run(scratch_db, "up"); assert r.returncode == 0, r.stderr
    r = _run(scratch_db, "status"); assert r.returncode == 0
    assert r.stdout.count("applied") == 7 and "pending" not in r.stdout and "!!" not in r.stdout
    assert _tables(scratch_db) == TABLES_AFTER_UP

    r = _run(scratch_db, "down", "002"); assert r.returncode == 0, r.stderr      # reverts 007 … 002
    assert _tables(scratch_db) == {"schema_migrations"}
    r = _run(scratch_db, "status"); assert r.stdout.count("pending") == 6

    r = _run(scratch_db, "up"); assert r.returncode == 0, r.stderr
    assert _tables(scratch_db) == TABLES_AFTER_UP
    # up is idempotent
    r = _run(scratch_db, "up"); assert r.returncode == 0 and "applying" not in r.stdout


def test_up_to_target_stops_there(scratch_db):
    r = _run(scratch_db, "up", "002"); assert r.returncode == 0, r.stderr
    assert _tables(scratch_db) == {"schema_migrations", "sources", "source_rights", "source_runs"}


def test_edited_applied_migration_is_refused(scratch_db):
    r = _run(scratch_db, "up"); assert r.returncode == 0, r.stderr
    with psycopg.connect(scratch_db) as c, c.cursor() as cur:
        cur.execute("UPDATE careers.schema_migrations SET checksum = 'tampered' WHERE version = '003'")
        c.commit()
    r = _run(scratch_db, "status"); assert "!!" in r.stdout
    r = _run(scratch_db, "up"); assert r.returncode != 0 and "different checksum" in (r.stderr + r.stdout)


def test_checksum_ignores_line_endings_but_not_content(tmp_path):
    sys.path.insert(0, str(ROOT))
    import migrate
    lf, crlf, edited = tmp_path / "lf.sql", tmp_path / "crlf.sql", tmp_path / "edited.sql"
    lf.write_bytes(b"SELECT 1;\nSELECT 2;\n")
    crlf.write_bytes(b"SELECT 1;\r\nSELECT 2;\r\n")
    edited.write_bytes(b"SELECT 1;\nSELECT 3;\n")
    assert migrate.checksum(lf) == migrate.checksum(crlf)
    assert migrate.checksum(lf) != migrate.checksum(edited)


def test_sql_is_postgres15_compatible_syntax():
    """Guard against PG16-only syntax creeping in (production is reported as PG15)."""
    banned = ["ANY_VALUE(", "JSON_ARRAY(", "JSON_OBJECT(", "SYSTEM_USER", "pg_stat_io"]
    for p in (ROOT / "migrations").glob("*.sql"):
        text = p.read_text(encoding="utf-8").upper()
        for b in banned:
            assert b.upper() not in text, f"{p.name} uses {b}"
