#!/bin/bash
# TechTrendi Careers staging update: backup, new release, migrations, Group A sources, collector (since 7 Nov 2026).
# Expects /tmp/careers-test-src.tar (contents of careers-service/) and /tmp/sources_group_a.sql. See README.md.
# Touches only careers_staging, /opt/techtrendi-careers, /etc/techtrendi-careers and the careers units.
set -euo pipefail
umask 077
TARBALL=/tmp/careers-test-src.tar
BASE=/opt/techtrendi-careers
ETC=/etc/techtrendi-careers
BK=/root/backups/careers
STAMP=$(date +%Y%m%d%H%M%S)
[ -f "$TARBALL" ] || { echo "missing $TARBALL"; exit 1; }

echo "1. backup careers_staging"
mkdir -p "$BK"
docker exec supabase-db pg_dump -U supabase_admin -d careers_staging -Fc > "$BK/careers_staging-$STAMP.dump"
ls -la "$BK/careers_staging-$STAMP.dump"
PREV=$(readlink -f "$BASE/current"); echo "previous release: $PREV"

echo "2. new release"
REL="$BASE/releases/$STAMP"
mkdir -p "$REL/careers-service"; tar -xf "$TARBALL" -C "$REL/careers-service"; rm -f "$TARBALL"
find "$REL" -name '__pycache__' -prune -exec rm -rf {} +
chmod -R a+rX "$REL"
"$BASE/venv/bin/pip" install -q -r "$REL/careers-service/requirements-dev.txt"
ln -sfn "$REL" "$BASE/current"

echo "3. migrations"
cd "$BASE/current/careers-service"
( set -a; . "$ETC/migrator-staging.env"; set +a; "$BASE/venv/bin/python" migrate.py up; "$BASE/venv/bin/python" migrate.py status )

echo "4. Group A sources"
docker exec -i supabase-db psql -U supabase_admin -d careers_staging -v ON_ERROR_STOP=1 < /tmp/sources_group_a.sql
rm -f /tmp/sources_group_a.sql

echo "5. collector env (worker login reused from the noop worker)"
if [ ! -f "$ETC/worker-staging-collect.env" ]; then
  grep -E '^(CAREERS_ENV|CAREERS_WORKER_DATABASE_URL)=' "$ETC/worker-staging-noop.env" > "$ETC/worker-staging-collect.env"
  echo "CAREERS_WORKER_KINDS=source_fetch" >> "$ETC/worker-staging-collect.env"
  chown root:techtrendi-careers "$ETC/worker-staging-collect.env"; chmod 640 "$ETC/worker-staging-collect.env"
fi
sed 's/=.*/=<set>/' "$ETC/worker-staging-collect.env"

echo "6. restart api + noop worker on the new code, start collector"
systemctl enable techtrendi-careers-worker@staging-collect
# restart (not just start) so an already-running collector picks up the new code
systemctl restart techtrendi-careers-api@staging techtrendi-careers-worker@staging-noop techtrendi-careers-worker@staging-collect
sleep 5
systemctl is-active techtrendi-careers-api@staging techtrendi-careers-worker@staging-noop techtrendi-careers-worker@staging-collect
curl -s 127.0.0.1:5121/api/careers/v1/ready; echo
echo "rollback: ln -sfn $PREV $BASE/current; systemctl disable --now techtrendi-careers-worker@staging-collect; restart the others; pg_restore from $BK/careers_staging-$STAMP.dump"
