# Disaster recovery

Step-by-step instructions for "the server is gone, here's how to bring it
back" scenarios. Pair with [OPERATIONS.md](OPERATIONS.md) for routine ops
and [ARCHITECTURE.md](ARCHITECTURE.md) for the data model.

---

## TL;DR — what survives what

| Scenario | Web app | Article data | Domain | Backups |
| --- | --- | --- | --- | --- |
| Laptop dies | safe (GitHub) | safe (Supabase) | safe | safe |
| Contabo server dies | rebuildable in ~30 min | needs restore from Drive | safe (Cloudflare) | safe (Google Drive) |
| GitHub account compromised | rebuildable from local clone | safe | safe | safe |
| Cloudflare account compromised | safe | safe | at risk (DNS / SSL) | safe |
| Google Drive lost | safe | at risk (no other backup) | safe | gone — backups only |

Three places make a deliberate trust split:

- **Source of truth for code:** GitHub (`xboggg/trenditrendi`, public)
- **Source of truth for runtime:** the Contabo server at `144.91.71.106`
- **Source of truth for content:** the Supabase Postgres `techtrendi`
  schema on the server

Backups (Google Drive) bridge the runtime + content gap.

---

## What's backed up where

### Daily snapshot to Google Drive — 2 AM UTC

The script at `/opt/trendimovies/backup/backup.sh` (cron entry near the
end of `crontab -l`) runs every day at 2 AM and uploads to Google Drive
via `rclone`. It is shared with the trendimovies / cyberabofra
infrastructure and includes a techtrendi-specific section.

What it backs up for techtrendi:

| Item | Destination | Retention |
| --- | --- | --- |
| Postgres `techtrendi` schema dump | `gdrive:144-main/daily/techtrendi-schema-<date>.dump` | 5 days |
| Webroot `/var/www/techtrendi/` | `gdrive:144-main/daily/techtrendi-webroot-<date>.tar.gz` | 5 days |
| Deploy scripts `/usr/local/bin/techtrendi-{deploy,install}` | `gdrive:144-main/daily/techtrendi-deploy-scripts-<date>.tar.gz` | 5 days |
| Docs mirror `/root/techtrendi/` | `gdrive:144-main/daily/techtrendi-docs-<date>.tar.gz` | 5 days |
| Nginx config (whole `/etc/nginx/sites-{available,enabled}/`) | included in `server-configs-<date>.tar.gz` | 5 days |
| Let's Encrypt certs | included in `server-configs-<date>.tar.gz` | 5 days |

A **databases-only** copy of the schema dump also lands in
`gdrive:databases/144-main/<date>/techtrendi-schema-<date>.dump`
(separate folder, easier to navigate when you just want a DB).
Retention: 30 days.

Sundays additionally upload everything to `gdrive:144-main/weekly/` (14
day retention). The 1st of each month additionally uploads to
`gdrive:144-main/monthly/` (60 day retention).

### What is NOT backed up

- **Build artefacts (`dist/`)** — rebuildable via `npm ci && npm run
  build`. No need to back up.
- **`node_modules/`** — rebuildable via `npm ci`.
- **The deploy SSH keypair on the laptop** (`~/.ssh/techtrendi_deploy`) —
  regenerable; replacing it requires updating the server's
  `authorized_keys` and the `DEPLOY_SSH_KEY` GitHub secret.
- **Cloudflare account state** — managed in Cloudflare's account, not
  backed up by us. Cloudflare retains zone configuration on their side.

---

## Recovery scenarios

### Scenario 1 — Laptop dies

Fastest recovery, ~5 minutes.

1. On the new machine, install Node 18+ and Git.
2. `gh auth login` (or sign in to GitHub the regular way).
3. `git clone https://github.com/xboggg/trenditrendi` into a working
   folder.
4. Generate a new deploy keypair:
   `ssh-keygen -t ed25519 -f ~/.ssh/techtrendi_deploy -N "" -C "techtrendi-github-actions@xboggg"`
5. Append the new public key to `root@144.91.71.106:~/.ssh/authorized_keys`
   (keep the existing `command="..."` and option flags). Remove the old
   line if its private half is no longer needed.
6. Update the GitHub secret:
   `gh secret set DEPLOY_SSH_KEY --repo xboggg/trenditrendi < ~/.ssh/techtrendi_deploy`
7. Make a tiny doc change and `git push` to trigger a deploy run.

Nothing on the live site changes during this. Visitors keep using
techtrendi.com normally.

### Scenario 2 — Contabo server dies (techtrendi.com is down)

Recovery target: ~30 minutes for the static site,
+ extra time if you need to restore the Supabase content.

1. **Stand up a new VPS** (Ubuntu 22.04 / Debian 12 assumed).
2. **Install runtime dependencies:**
   ```bash
   apt update
   apt install -y nginx certbot python3-certbot-nginx rsync rclone docker.io docker-compose
   ```
3. **Restore the deploy scripts.** Either:
   - Copy `deploy/techtrendi-deploy.sh` and `deploy/techtrendi-install.sh`
     from the GitHub repo, OR
   - Restore from `gdrive:144-main/daily/techtrendi-deploy-scripts-<date>.tar.gz`.
   Place them at `/usr/local/bin/techtrendi-deploy` and
   `/usr/local/bin/techtrendi-install`, both `chmod 700`.
4. **Re-create the webroot:**
   ```bash
   mkdir -p /var/www/techtrendi /var/www/techtrendi.backup
   chown -R www-data:www-data /var/www/techtrendi
   ```
5. **Restore the nginx config** from `gdrive:144-main/daily/server-configs-<date>.tar.gz`
   (the `etc/nginx/sites-available/techtrendi.com` file inside it).
   Place at `/etc/nginx/sites-available/techtrendi.com` and symlink into
   `sites-enabled/`.
6. **Point Cloudflare at the new server.** In the Cloudflare dashboard:
   - `techtrendi.com` A record → new VPS IP
   - `www.techtrendi.com` A record → new VPS IP
   - Other techtrendi.com subdomains as needed
   - Wait for propagation (5-30 min). Cloudflare picks up the change
     within ~1 min usually.
7. **Re-issue origin SSL** (Cloudflare will serve its own public cert,
   but the origin needs one too):
   ```bash
   certbot --nginx -d techtrendi.com -d www.techtrendi.com \
     --non-interactive --agree-tos --email info@techtrendi.com --redirect
   ```
8. **Restore Supabase** so the site can fetch content:
   - Re-install the self-hosted Supabase stack
     (<https://supabase.com/docs/guides/self-hosting>).
   - Restore the schema:
     ```bash
     docker exec -i supabase-db pg_restore -U postgres -d postgres -n techtrendi \
       < /path/to/techtrendi-schema-<date>.dump
     ```
9. **Set up the GitHub Actions deploy key on the new server:**
   - Append the public key to `root@<new-ip>:~/.ssh/authorized_keys`,
     prefixed with `command="/usr/local/bin/techtrendi-deploy",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty,restrict`.
   - Update `DEPLOY_HOST` GitHub secret:
     `gh secret set DEPLOY_HOST --repo xboggg/trenditrendi --body "<new-ip>"`
10. **Trigger a deploy** by pushing any commit. The Actions workflow
    will build, ship, and bring techtrendi.com back online.

### Scenario 3 — GitHub account compromised

1. Sign in via the recovery email, change password, enable 2FA.
2. Revoke all third-party app authorizations under Settings → Applications.
3. If you suspect the repo has been tampered with, push your local clone
   to a new private repo:
   ```bash
   gh repo create xboggg/trenditrendi-restore --private
   git remote set-url origin https://github.com/xboggg/trenditrendi-restore.git
   git push --force origin main
   ```
4. Reconfigure GitHub Actions secrets on the new repo
   (`DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`).
5. Rotate the deploy SSH key (see OPERATIONS.md →
   "Rotating the deploy key").

### Scenario 4 — Cloudflare account compromised

1. Sign in via recovery email, change password, enable 2FA. If account
   already taken over, contact Cloudflare support with proof of domain
   ownership.
2. While locked out, the immediate risks are:
   - **DNS hijacking:** techtrendi.com could be repointed to a malicious
     server.
   - **SSL hijacking:** the attacker could issue their own CF universal
     SSL cert and intercept traffic.
3. Once back in, audit DNS records and reset to:
   - `@ A → 144.91.71.106` (proxied)
   - `www A → 144.91.71.106` (proxied)
   - Plus the subdomains listed in OPERATIONS.md → DNS table
4. Audit "Workers", "Page Rules", and "Cache Rules" for anything you
   didn't create.
5. Audit Cloudflare API tokens under My Profile → API Tokens and revoke
   any you don't recognise.

### Scenario 5 — Google Drive backups inaccessible

You still have everything you actually need to keep the live site
running — Drive is only critical when paired with one of the other
scenarios. If Drive is the only thing lost, fix Drive access. No urgent
action.

If Drive is lost AND the server is lost AND the laptop is also lost,
content in the techtrendi Supabase schema is gone (no third copy).

---

## Verifying backups work

Roughly once a quarter, do a restoration drill:

1. SSH to the server.
2. `rclone copy gdrive:144-main/daily/techtrendi-schema-$(date -d yesterday +%Y-%m-%d).dump /tmp/`
3. Try restoring into a side schema:
   ```bash
   docker exec -i supabase-db psql -U postgres -c "CREATE SCHEMA techtrendi_restoretest"
   docker exec -i supabase-db pg_restore -U postgres -d postgres -n techtrendi --clean < /tmp/techtrendi-schema-*.dump
   ```
4. Verify the schema is intact:
   `docker exec -i supabase-db psql -U postgres -c "\dt techtrendi.*"`

This catches Drive permission issues, container name changes, and
dump-format problems before you actually need them.

---

## Where each artefact lives — quick reference

| What | Where |
| --- | --- |
| Deploy scripts (canonical) | `deploy/techtrendi-deploy.sh`, `deploy/techtrendi-install.sh` (this repo) |
| Deploy scripts (live) | `/usr/local/bin/techtrendi-{deploy,install}` on 144.91.71.106 |
| Legacy emergency deploy | `deploy.sh` at repo root |
| Nginx config (live) | `/etc/nginx/sites-available/techtrendi.com` on 144.91.71.106 |
| SSL cert (origin) | `/etc/letsencrypt/live/techtrendi.com/` on 144.91.71.106 |
| Supabase schema (data) | `techtrendi` schema in supabase-db container on 144.91.71.106 |
| Backup script | `/opt/trendimovies/backup/backup.sh` on 144.91.71.106 |
| Backup destination | `gdrive:144-main/daily/` (full) and `gdrive:databases/144-main/<date>/` (DB-only) |
| GitHub repo | <https://github.com/xboggg/trenditrendi> (public) |
| GitHub secrets | <https://github.com/xboggg/trenditrendi/settings/secrets/actions> |
| Deploy keypair | `~/.ssh/techtrendi_deploy{,.pub}` on Edmund's Windows laptop |
| DNS / CDN | Cloudflare account (xboggg) → techtrendi.com zone |
| Email | `info@techtrendi.com` (see legacy TECHTRENDI-DOCUMENTATION.md for setup) |
| Editor admin | <https://techtrendi.com/admin> |
| Supabase Studio | <https://db2.techtrendi.com> |

---

## When in doubt

Priority recovery order:

1. **DNS** (Cloudflare) — without this, no one reaches you.
2. **Web server (nginx) + SSL** — without these, the domain doesn't
   serve.
3. **Install scripts** + a deploy keypair on GitHub — without these,
   you can't push new code.
4. **Supabase database restore** — without this, the site renders
   "no articles" placeholders.

Everything else (Cloudflare cache rules, logs, monitoring) can wait.
