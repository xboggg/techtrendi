# Careers — server setup kit (staging first)

Templates only. Nothing in this folder is executed by the GitHub Actions deploy; the existing
`techtrendi-install` script does not know about Careers and that is intentional for now.
Every step below is run by the owner (or by Claude over SSH with the owner's explicit go-ahead
for that step), on staging first.

## Order of operations
| # | Step | Who | File |
|---|---|---|---|
| 1 | Run the read-only server audit, share output | owner | `docs/careers/careers_audit_readonly.sh` |
| 2 | Pick a free loopback port for the staging API (from the audit's `ss -tlnp`) | Claude proposes | — |
| 3 | Create staging database + roles | owner, as Postgres superuser | `staging_setup.sql` |
| 4 | Create system user, folders, venv | owner (commands below) | — |
| 5 | Write env files (passwords live only here) | owner | `env.staging.example` |
| 6 | `python migrate.py up` against `careers_staging`, then the GRANT block at the end of `staging_setup.sql` | Claude via SSH or owner | `careers-service/migrate.py` |
| 7 | Install and start the API unit; check `/health` and `/ready` | owner | `techtrendi-careers-api.service` |
| 8 | nginx staging block + basic auth; `nginx -t`; `systemctl reload nginx` | owner | `nginx-careers-staging.conf.example` |
| 9 | Run the test suite against staging; save output to `docs/careers/evidence/` | Claude | — |

## Step 4 commands (Debian/Ubuntu)
```bash
sudo useradd --system --home /opt/techtrendi-careers --shell /usr/sbin/nologin techtrendi-careers
sudo mkdir -p /opt/techtrendi-careers /etc/techtrendi-careers /var/log/techtrendi-careers
sudo chown techtrendi-careers:techtrendi-careers /var/log/techtrendi-careers
sudo chmod 750 /etc/techtrendi-careers
# code: a checkout of this repo (read-only deploy key or plain clone of the public repo)
sudo git clone --branch main https://github.com/xboggg/techtrendi /opt/techtrendi-careers/current
sudo python3 -m venv /opt/techtrendi-careers/venv
sudo /opt/techtrendi-careers/venv/bin/pip install -r /opt/techtrendi-careers/current/careers-service/requirements.txt
sudo chown -R techtrendi-careers:techtrendi-careers /opt/techtrendi-careers
```
Python 3.11+ is required. If the server's `python3` is older, install `python3.11` (deb) or `uv`
— decided after the audit shows the version.

## Step 5 env files
```bash
sudo cp deploy/careers/env.staging.example /etc/techtrendi-careers/staging.env
sudo cp deploy/careers/env.staging.example /etc/techtrendi-careers/worker-staging-ingest.env
sudo chmod 600 /etc/techtrendi-careers/*.env
# edit: fill passwords from your password manager, the port, the Supabase JWT secret and URL
```

## Step 7 units
```bash
sudo cp deploy/careers/techtrendi-careers-api.service /etc/systemd/system/techtrendi-careers-api@.service
sudo cp deploy/careers/techtrendi-careers-worker@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now techtrendi-careers-api@staging
curl -s http://127.0.0.1:<PORT>/api/careers/v1/health
curl -s http://127.0.0.1:<PORT>/api/careers/v1/ready
```
Workers are **not** started until Phase 2 has an approved source.

## Rollback of staging
`systemctl disable --now techtrendi-careers-api@staging`, remove the nginx block, reload nginx,
then the DROP statements at the end of `staging_setup.sql`. Production is untouched throughout.
