#!/usr/bin/env bash
# TechTrendi Careers — Phase 0 read-only infrastructure audit
# -----------------------------------------------------------
# Run ON the VPS as a user that can read nginx/systemd config:
#   bash careers_audit_readonly.sh
# It writes audit-<date>.txt in the current directory.
#
# What it does NOT do: change anything, restart anything, install anything,
# or print secret VALUES. For .env files it prints variable NAMES only.
# Still: read the output yourself before sharing it anywhere.

set -u
OUT="audit-$(date +%Y%m%d-%H%M).txt"
SECRET_RE='(key|token|secret|passw|pwd|credential|jwt|dsn|auth)'

section() { printf '\n\n===== %s =====\n' "$1" | tee -a "$OUT"; }
run()     { printf '\n$ %s\n' "$*" >> "$OUT"; "$@" >> "$OUT" 2>&1 || echo "(command failed or not available)" >> "$OUT"; }
# print only lines that do not look like secrets
safe()    { grep -Eiv "$SECRET_RE"; }

: > "$OUT"
echo "TechTrendi Careers read-only audit — $(date -u) (UTC)" >> "$OUT"
echo "Host: $(hostname)   User: $(whoami)" >> "$OUT"

section "1. OS and hardware"
run uname -a
run cat /etc/os-release
run nproc
run free -h
run df -h
run uptime

section "2. Running services (systemd)"
run systemctl list-units --type=service --state=running --no-pager
run systemctl list-timers --all --no-pager

section "3. Containers (if Docker is used, e.g. self-hosted Supabase)"
run docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
run docker compose ls

section "4. Listening ports (which process owns what)"
run ss -tlnp

section "5. nginx configuration (secret-looking lines removed)"
if command -v nginx >/dev/null; then
  printf '\n$ nginx -T (filtered)\n' >> "$OUT"
  nginx -T 2>/dev/null | safe >> "$OUT"
else
  echo "nginx binary not found in PATH" >> "$OUT"
fi

section "6. Existing Python services under /opt/tech-news"
run ls -la /opt/tech-news
run find /opt/tech-news -maxdepth 2 -name '*.py' -newer /etc/hostname -o -maxdepth 2 -name '*.py'
run find /opt/tech-news -maxdepth 2 -name 'requirements*.txt' -exec sh -c 'echo "--- $1"; cat "$1"' _ {} \;
run python3 --version
for f in $(find /opt/tech-news -maxdepth 2 -name '.env*' 2>/dev/null); do
  printf '\n--- %s (variable NAMES only)\n' "$f" >> "$OUT"
  grep -Ev '^\s*#|^\s*$' "$f" | cut -d= -f1 >> "$OUT"
done
# which web framework do the existing services use?
run grep -rlE 'from (flask|fastapi|aiohttp|django)' /opt/tech-news --include='*.py' -m1
run grep -rhoE 'from (flask|fastapi|aiohttp|django)[^ ]*' /opt/tech-news --include='*.py' | sort | uniq -c

section "7. Process manager for Python services"
run grep -rlE 'tech-news|article_api|chat_api' /etc/systemd/system /etc/supervisor 2>/dev/null
run pm2 list

section "8. Scheduled jobs"
run crontab -l
run ls -la /etc/cron.d
run grep -rE 'tech-news' /etc/cron.d /etc/crontab /var/spool/cron 2>/dev/null

section "9. Backups (what exists, where, how old)"
run find / -maxdepth 3 \( -iname '*backup*' -o -iname '*.dump' -o -iname '*.sql.gz' \) -not -path '*/proc/*' 2>/dev/null
run ls -la /var/backups

section "10. PostgreSQL / Supabase (only if PGURL_RO is set to a READ-ONLY connection string)"
if [ -n "${PGURL_RO:-}" ] && command -v psql >/dev/null; then
  run psql "$PGURL_RO" -Atc "select version();"
  run psql "$PGURL_RO" -Atc "select name, installed_version from pg_available_extensions where installed_version is not null order by 1;"
  run psql "$PGURL_RO" -Atc "select schema_name from information_schema.schemata order by 1;"
  run psql "$PGURL_RO" -Atc "select schemaname, relname, n_live_tup from pg_stat_user_tables order by n_live_tup desc limit 40;"
  run psql "$PGURL_RO" -Atc "select pg_size_pretty(pg_database_size(current_database()));"
  run psql "$PGURL_RO" -Atc "select count(*) as connections, (select setting from pg_settings where name='max_connections') as max from pg_stat_activity;"
  run psql "$PGURL_RO" -Atc "select schemaname, tablename, rowsecurity from pg_tables where schemaname not in ('pg_catalog','information_schema') order by 1,2;"
  run psql "$PGURL_RO" -Atc "select rolname, rolsuper, rolbypassrls from pg_roles where rolname not like 'pg_%' order by 1;"
else
  echo "Skipped: set PGURL_RO=postgresql://readonly_user:...@host:port/db to include DB facts." >> "$OUT"
fi

section "11. Firewall"
run ufw status verbose
run iptables -S

echo "" >> "$OUT"
echo "Done. Review $OUT, then share it. Grep check for anything secret-looking:" | tee -a "$OUT"
grep -EinH "$SECRET_RE" "$OUT" | head -20 || true
echo "(Lines above only mean the WORD appeared; verify no values are present.)"
