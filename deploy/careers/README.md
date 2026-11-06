# Careers — server setup kit

Nothing in this folder is executed by the GitHub Actions deploy; the existing `techtrendi-install`
script does not know about Careers, on purpose.

## Status (6 Nov 2026): STAGING IS LIVE on server 144, loopback only
Done by Claude over SSH with the owner's go-ahead ("yes to all", 6 Nov 2026). Evidence:
`docs/careers/evidence/staging-2026-11-06.txt`.

| What | Where |
|---|---|
| Code (release folders, `current` symlink) | `/opt/techtrendi-careers/releases/<stamp>/careers-service`, `/opt/techtrendi-careers/current` |
| Python 3.12 venv | `/opt/techtrendi-careers/venv` |
| System user | `techtrendi-careers` (no shell, no home) |
| Env files (passwords only here) | `/etc/techtrendi-careers/{staging,worker-staging-noop,migrator-staging,readonly-staging}.env` |
| Database | `careers_staging` in the Supabase cluster (supabase-db, PG 15.8), schema `careers`, migrations 001–004 |
| API | `techtrendi-careers-api@staging` on **127.0.0.1:5121** (no nginx, no DNS: reach it with `ssh -L 5121:127.0.0.1:5121`) |
| Worker | `techtrendi-careers-worker@staging-noop` (kind `noop` only) |
| Logs | `/var/log/techtrendi-careers/` |
| Port reserved for production API | 127.0.0.1:5120 |

## Lessons from the real server (the first draft of this kit was wrong on these)
1. **127.0.0.1:5432 is TrendiCars' PostgreSQL 16, not Supabase.** Supabase's database has no host port.
   Connect through the Supavisor pooler, session mode, **127.0.0.1:5433**, user `<role>.<POOLER_TENANT_ID>`.
2. The Supabase `postgres` role is **not** a superuser and cannot create a database owned by another role.
   `staging_setup.sql` runs as `supabase_admin`: `docker exec -i supabase-db psql -U supabase_admin -d postgres`.
3. **Never run the pytest suite against the Supabase cluster.** `tests/conftest.py` drops the cluster-wide
   group roles `careers_api/worker/readonly` on teardown. Use a throwaway container:
   ```bash
   PW=$(openssl rand -hex 16)
   docker run -d --rm --name careers-test-pg -e POSTGRES_PASSWORD=$PW -p 127.0.0.1:55432:5432 \
     --tmpfs /var/lib/postgresql/data --memory 512m postgres:15-alpine
   cd /opt/techtrendi-careers/current/careers-service
   CAREERS_TEST_ADMIN_URL="postgresql://postgres:$PW@127.0.0.1:55432/postgres" /opt/techtrendi-careers/venv/bin/python -m pytest -q -p no:cacheprovider
   docker stop careers-test-pg && docker rmi postgres:15-alpine
   ```
4. The API unit is a template: `techtrendi-careers-api@.service`, instance = env file name (`@staging`).

## Update the staging code
```bash
# on the laptop
git archive --format=tar -o careers-service.tar origin/main careers-service
scp careers-service.tar root@144.91.71.106:/tmp/
# on the server
REL=/opt/techtrendi-careers/releases/$(date +%Y%m%d%H%M%S); mkdir -p $REL && tar -xf /tmp/careers-service.tar -C $REL
ln -sfn $REL /opt/techtrendi-careers/current
/opt/techtrendi-careers/venv/bin/pip install -q -r /opt/techtrendi-careers/current/careers-service/requirements-dev.txt
set -a; . /etc/techtrendi-careers/migrator-staging.env; set +a
cd /opt/techtrendi-careers/current/careers-service && /opt/techtrendi-careers/venv/bin/python migrate.py up
systemctl restart techtrendi-careers-api@staging techtrendi-careers-worker@staging-noop
curl -s 127.0.0.1:5121/api/careers/v1/ready
```
Rollback of a code update: point `current` back at the previous release folder and restart.

## Remove staging completely
```bash
systemctl disable --now techtrendi-careers-api@staging techtrendi-careers-worker@staging-noop
docker exec -i supabase-db psql -U supabase_admin -d postgres -c "DROP DATABASE careers_staging;"
docker exec -i supabase-db psql -U supabase_admin -d postgres -c "DROP ROLE careers_staging_api, careers_staging_worker, careers_staging_readonly, careers_staging_migrator;"
# only while no production Careers exists:
docker exec -i supabase-db psql -U supabase_admin -d postgres -c "DROP ROLE careers_api, careers_worker, careers_readonly;"
```
Then delete `/opt/techtrendi-careers`, `/etc/techtrendi-careers`, `/var/log/techtrendi-careers` and the two unit files.

## Not used yet
`nginx-careers-staging.conf.example` (a public staging address needs a DNS record and basic auth;
not needed while staging is reached through an SSH tunnel).
