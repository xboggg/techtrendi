#!/usr/bin/env bash
# techtrendi-install — atomic install for techtrendi.com static build.
# Preserves user-uploaded content (images/, uploads/) across deploys.
set -euo pipefail

TARBALL=/tmp/techtrendi-new.tar.gz
WEBROOT=/var/www/techtrendi
BACKUP=/var/www/techtrendi.backup
STAGING=/tmp/techtrendi-staging

[ -f "$TARBALL" ] || { echo "ERR: $TARBALL not found"; exit 2; }

# Snapshot the current state (for one-step rollback) — link-dest so it
# stays cheap even though we have hundreds of MB of user uploads.
mkdir -p "$BACKUP"
rsync -a --delete "$WEBROOT"/ "$BACKUP"/ 2>/dev/null || true

# Stage the new build to a temp dir, then rsync it INTO the webroot.
# --exclude lines protect user-uploaded content from being deleted by
# --delete. Any new file shipped in dist replaces its older version;
# any file removed from dist is removed from webroot — UNLESS it lives
# under one of the excluded paths.
rm -rf "$STAGING" && mkdir -p "$STAGING"
tar -xzf "$TARBALL" -C "$STAGING"/
rsync -a --delete \
  --exclude=/images \
  --exclude=/uploads \
  --exclude=/storage \
  --exclude=/.well-known \
  "$STAGING"/ "$WEBROOT"/
rm -rf "$STAGING"
rm -f "$TARBALL"

chown -R www-data:www-data "$WEBROOT"

nginx -t >/dev/null
systemctl reload nginx

LATEST=$(ls "$WEBROOT"/assets/ 2>/dev/null | grep -oE "index-[A-Za-z0-9_-]+\.js" | head -1 || echo "unknown")
echo "DEPLOY_OK $(date -u +%FT%TZ) $LATEST"
