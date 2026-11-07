#!/usr/bin/env python3
"""Minimal, dependency-free migration runner for the careers schema.

Usage (CAREERS_MIGRATOR_DATABASE_URL must be set, or pass --url):
  python migrate.py status
  python migrate.py up            # apply all pending, in order
  python migrate.py up 002        # apply through version 002
  python migrate.py down          # roll back the latest applied migration
  python migrate.py down 001      # roll back down to and including 001

Each migration is a pair NNN_name.up.sql / NNN_name.down.sql. Files run inside
their own BEGIN/COMMIT. The ledger is careers.schema_migrations; a checksum
mismatch between the ledger and the file on disk aborts, because editing an
applied migration is how production and staging drift apart.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import re
import sys
from pathlib import Path

import psycopg

HERE = Path(__file__).resolve().parent
MIG_DIR = HERE / "migrations"
PATTERN = re.compile(r"^(\d{3})_([a-z0-9_]+)\.(up|down)\.sql$")


def discover() -> dict[str, dict]:
    found: dict[str, dict] = {}
    for p in sorted(MIG_DIR.iterdir()):
        m = PATTERN.match(p.name)
        if not m:
            continue
        ver, name, direction = m.groups()
        entry = found.setdefault(ver, {"version": ver, "name": name})
        entry[direction] = p
    for ver, e in found.items():
        if "up" not in e or "down" not in e:
            sys.exit(f"migration {ver} is missing its {'down' if 'up' in e else 'up'} file")
    return found


def checksum(path: Path) -> str:
    # Line endings are not content: a Windows checkout (CRLF) and git/Linux (LF) must agree.
    # Found 7 Nov 2026: staging had recorded CRLF fingerprints for 001-004, git holds LF.
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


def ledger(conn) -> dict[str, dict]:
    with conn.cursor() as cur:
        cur.execute("SELECT to_regclass('careers.schema_migrations')")
        if cur.fetchone()[0] is None:
            return {}
        cur.execute("SELECT version, name, checksum, applied_at FROM careers.schema_migrations ORDER BY version")
        return {r[0]: {"version": r[0], "name": r[1], "checksum": r[2], "applied_at": r[3]} for r in cur.fetchall()}


def run_sql(conn, path: Path) -> None:
    sql = path.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()


def cmd_status(conn, migs):
    applied = ledger(conn)
    for ver in sorted(migs):
        mark = "applied" if ver in applied else "pending"
        drift = ""
        if ver in applied and applied[ver]["checksum"] != checksum(migs[ver]["up"]):
            drift = "  !! checksum differs from file on disk"
        print(f"{ver} {migs[ver]['name']:<28} {mark}{drift}")


def cmd_up(conn, migs, target: str | None):
    applied = ledger(conn)
    for ver in sorted(migs):
        if target and ver > target:
            break
        if ver in applied:
            if applied[ver]["checksum"] != checksum(migs[ver]["up"]):
                sys.exit(f"refusing: {ver} already applied with a different checksum")
            continue
        print(f"applying {ver} {migs[ver]['name']} ...", end=" ", flush=True)
        run_sql(conn, migs[ver]["up"])
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO careers.schema_migrations (version, name, checksum) VALUES (%s, %s, %s)",
                (ver, migs[ver]["name"], checksum(migs[ver]["up"])),
            )
        conn.commit()
        print("ok")


def cmd_down(conn, migs, target: str | None):
    applied = ledger(conn)
    if not applied:
        print("nothing applied")
        return
    order = sorted(applied, reverse=True)
    for ver in order:
        if ver not in migs:
            sys.exit(f"refusing: {ver} is applied but has no files on disk")
        print(f"reverting {ver} {migs[ver]['name']} ...", end=" ", flush=True)
        run_sql(conn, migs[ver]["down"])
        # 001's down drops the schema (and ledger) itself; only delete the row if the ledger survived
        with conn.cursor() as cur:
            cur.execute("SELECT to_regclass('careers.schema_migrations')")
            if cur.fetchone()[0] is not None:
                cur.execute("DELETE FROM careers.schema_migrations WHERE version = %s", (ver,))
        conn.commit()
        print("ok")
        if target is None or ver == target:
            break


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["status", "up", "down"])
    ap.add_argument("target", nargs="?")
    ap.add_argument("--url", default=os.environ.get("CAREERS_MIGRATOR_DATABASE_URL", ""))
    args = ap.parse_args()
    if not args.url:
        sys.exit("set CAREERS_MIGRATOR_DATABASE_URL or pass --url")
    migs = discover()
    with psycopg.connect(args.url, application_name="techtrendi-careers-migrate") as conn:
        conn.autocommit = False
        {"status": cmd_status, "up": cmd_up, "down": cmd_down}[args.command](conn, migs, args.target) \
            if args.command != "status" else cmd_status(conn, migs)


if __name__ == "__main__":
    main()
