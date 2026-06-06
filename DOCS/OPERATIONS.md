# Operations

Everything about running production techtrendi.com. Pair with
[ARCHITECTURE.md](ARCHITECTURE.md) for what's inside and
[DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) for failure scenarios.

---

## Quick facts

| | |
| --- | --- |
| **Live URL** | <https://techtrendi.com> (Cloudflare-proxied) |
| **Source** | <https://github.com/xboggg/techtrendi> (public) |
| **CI/CD** | GitHub Actions — auto-deploy on push to `main` (~50 sec) |
| **Server** | Contabo VPS at `144.91.71.106` (Düsseldorf, Germany) |
| **SSH (human)** | `ssh root@144.91.71.106` from a laptop with the personal key |
| **SSH (CI)** | Dedicated ed25519 deploy key, locked to install script only |
| **Webroot** | `/var/www/techtrendi/` |
| **Backup webroot** | `/var/www/techtrendi.backup/` (snapshotted on each deploy) |
| **Webserver** | nginx, config at `/etc/nginx/sites-available/techtrendi.com` |
| **Install script** | `/usr/local/bin/techtrendi-install` |
| **Deploy gate** | `/usr/local/bin/techtrendi-deploy` (ForceCommand wrapper) |
| **DNS / CDN** | Cloudflare (proxied for static-asset caching) |
| **Database** | `techtrendi` schema inside self-hosted Supabase docker stack |
| **Process model** | Static files only — no Node, no PM2, no app server |

The same host also runs cyberabofra, trendimovies, trendicars,
learn.techtrendi.com, etc. Don't restart shared services like `nginx`
without thinking about the others — always `reload`.

---

## DNS

DNS is managed in **Cloudflare** (different from cyberabofra which uses
Namecheap basic DNS). Records:

| Record | Type | Value | Proxied |
| --- | --- | --- | --- |
| `techtrendi.com` | A | `144.91.71.106` | ✓ Yes |
| `www.techtrendi.com` | A | `144.91.71.106` | ✓ Yes |
| `admin.techtrendi.com` | A | `144.91.71.106` | ✓ Yes |
| `db2.techtrendi.com` | A | `144.91.71.106` | DNS only |
| `learn.techtrendi.com` | A | `144.91.71.106` | varies |
| `trendicars.techtrendi.com` | A | `144.91.71.106` | varies |

The `db2.techtrendi.com` subdomain serves Supabase Studio (admin UI for
the shared Supabase instance). Keep that one **DNS-only** so Let's
Encrypt HTTP-01 verification works.

---

## SSL

Let's Encrypt cert via `certbot --nginx`. Auto-renewed by the certbot
systemd timer (verify with `systemctl status certbot.timer`).

Manual renew: `certbot renew`. Dry-run: `certbot renew --dry-run`.

When Cloudflare proxying is on, Cloudflare also serves a public-facing
certificate of its own (universal SSL). The origin certificate at the
nginx level is for the Cloudflare-to-origin connection.

---

## nginx

Server block at `/etc/nginx/sites-available/techtrendi.com`. Symlinked
into `sites-enabled/`. Key directives:

- Serves `/var/www/techtrendi/` with SPA fallback
  `try_files $uri $uri/ /index.html;`
- HTTP redirects to HTTPS.
- Standard security headers (X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, etc.) at the server-block level.

Useful nginx commands:

```bash
# On the server, as root:
nginx -t                                       # syntax check
systemctl reload nginx                         # reload after edits
journalctl -u nginx --since "10 minutes ago"   # recent logs
tail -f /var/log/nginx/access.log              # live access log
tail -f /var/log/nginx/error.log               # live error log
```

---

## Deploy procedure

### Normal path — automatic via GitHub Actions

Push to `main` on <https://github.com/xboggg/techtrendi>:

```bash
git add -A
git commit -m "what changed"
git push
```

That triggers
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), which:

1. Checks out the code on a GitHub-hosted Ubuntu runner.
2. Sets up Node.js 20 with npm cache.
3. Runs `npm ci` and `npm run build`.
4. Tarballs `dist/` into `techtrendi-dist.tar.gz`.
5. SCPs it to `/tmp/techtrendi-new.tar.gz` on the server using the
   restricted deploy key (see [Deploy key](#deploy-key) below).
6. Runs `/usr/local/bin/techtrendi-install` on the server, which
   snapshots the old build to `/var/www/techtrendi.backup/`, extracts
   the new build to `/var/www/techtrendi/`, chowns, validates nginx,
   and reloads.
7. Smoke-tests `https://techtrendi.com/` with a real-browser
   `User-Agent` (the server's bot blocker 403s the default curl UA).

Total runtime: 45-60 seconds. Watch live at
<https://github.com/xboggg/techtrendi/actions>.

After deploy, **purge the Cloudflare cache** if the change should be
visible immediately — otherwise CF will serve the old hashed bundles
to anonymous visitors for up to a few hours.

### Emergency path — manual deploy via legacy `deploy.sh`

If GitHub Actions is down or you need to deploy faster than a CI run,
the legacy [`deploy.sh`](../deploy.sh) at the project root still works.
It does the same thing locally:

```bash
bash deploy.sh "optional commit message"
```

The script commits + pushes + builds + tars + ships + verifies. It
uses your personal SSH key (not the deploy key), so it works even if
the deploy key is locked down or missing.

### Deploy key

The CI deploys with a dedicated ed25519 key:

| | |
| --- | --- |
| Public half | Appended to `/root/.ssh/authorized_keys` on the server |
| Private half | Stored as the `DEPLOY_SSH_KEY` GitHub Actions secret |
| Forced command | `/usr/local/bin/techtrendi-deploy` (gates the key) |
| Allowed actions | `scp -t /tmp/techtrendi-new.tar.gz` and the install script |
| Disallowed | Everything else (shell, ls, cat, …) — logged via syslog |
| Extra options | `no-port-forwarding`, `no-X11-forwarding`, `no-agent-forwarding`, `no-pty`, `restrict` |

The wrapper script at `/usr/local/bin/techtrendi-deploy` inspects
`SSH_ORIGINAL_COMMAND` and only execs one of the two whitelisted
commands. Rejections show up in `journalctl -t techtrendi-deploy`.

### Rotating the deploy key

1. On your laptop: `ssh-keygen -t ed25519 -f ~/.ssh/techtrendi_deploy -N "" -C "techtrendi-github-actions@xboggg"`.
2. Update `~/.ssh/authorized_keys` on the server: replace the old
   `techtrendi-github-actions` line with the new public key, keeping the
   same `command="..."` and option flags.
3. Replace the `DEPLOY_SSH_KEY` GitHub secret:
   `gh secret set DEPLOY_SSH_KEY --repo xboggg/techtrendi < ~/.ssh/techtrendi_deploy`
4. Trigger a manual workflow run to verify.

### GitHub Actions secrets

Three secrets on
<https://github.com/xboggg/techtrendi/settings/secrets/actions>:

| Secret | Value |
| --- | --- |
| `DEPLOY_SSH_KEY` | The ed25519 private key |
| `DEPLOY_HOST` | `144.91.71.106` |
| `DEPLOY_USER` | `root` |

---

## Rollback

Every successful CI deploy snapshots the previous webroot to
`/var/www/techtrendi.backup/` before swapping. Restore with:

```bash
ssh root@144.91.71.106 \
  'rm -rf /var/www/techtrendi/* \
   && cp -r /var/www/techtrendi.backup/* /var/www/techtrendi/ \
   && chown -R www-data:www-data /var/www/techtrendi \
   && systemctl reload nginx'
```

If the backup directory is stale (e.g. the broken build was the second
consecutive failure), revert on GitHub instead:

```bash
git revert HEAD                # reverts the last commit on main
git push                       # GitHub Actions auto-deploys the revert
```

This usually lands faster than restoring the backup by hand.

---

## Cloudflare cache

When the build hash changes, anonymous visitors may still see the old
hashed bundle from Cloudflare's edge cache for a while. To force-purge
after a critical update:

1. Log in to Cloudflare → `techtrendi.com` zone.
2. **Caching → Configuration → Purge Everything**.

Use this sparingly — bypassing the cache costs origin bandwidth. For
day-to-day deploys with hashed asset filenames, the cache naturally
refreshes within minutes.

---

## Email

Editor / admin email is `info@techtrendi.com`. Mail forwarding /
inbound setup is documented in the legacy
[TECHTRENDI-DOCUMENTATION.md](../TECHTRENDI-DOCUMENTATION.md) at the
root of the repo (search for "email" or "SMTP").

---

## Logs and monitoring

- **nginx access + error logs** at `/var/log/nginx/access.log` and
  `error.log` (rotated daily by logrotate).
- **certbot renewal log** at `/var/log/letsencrypt/letsencrypt.log`.
- **Cloudflare analytics** at the techtrendi.com zone dashboard
  (traffic, response codes, threat blocks).

No application-level analytics by default. If you ever add them, do so
via Cloudflare Web Analytics (privacy-respecting) before reaching for
GA.

---

## Incident response checklist

If the site is down or broken:

1. `curl -sI -A 'Mozilla/5.0' https://techtrendi.com/` — does HTTPS
   respond at all?
2. Cloudflare status — is CF serving an error page? Look at the dash.
3. SSH in and `systemctl status nginx` and `nginx -t` — config OK?
4. `tail -50 /var/log/nginx/error.log` — anything obvious?
5. `ls -la /var/www/techtrendi/index.html` — is the build still there?
6. If the build is gone or corrupted, run the rollback above.
7. If you can't fix it within 10 minutes, restore the
   `/var/www/techtrendi.backup/` snapshot. Get the site live first,
   debug after.

---

## Other projects on the same server

Be aware of (these all share nginx):

- `cyberabofra.com` (static React/Vite PWA)
- `trendimovies.com` (Astro, port 3000 via PM2)
- `trendimovies.xyz` (Next.js, port 3002)
- `trendicars.techtrendi.com` (Node + Postgres)
- `learn.techtrendi.com` (Node + SQLite PWA)
- `db2.techtrendi.com` (Supabase Studio)
- `vibelinkevent.com` and portfolio subpaths

Always `systemctl reload nginx`, never `restart`, unless absolutely
necessary.
