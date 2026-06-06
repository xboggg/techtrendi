#!/usr/bin/env bash
# techtrendi-install — atomic install for techtrendi.com static build.
# Snapshots current state, swaps in the new build, reloads nginx.
set -euo pipefail

TARBALL=/tmp/techtrendi-new.tar.gz
WEBROOT=/var/www/techtrendi
BACKUP=/var/www/techtrendi.backup

[ -f "$TARBALL" ] || { echo "ERR: $TARBALL not found"; exit 2; }

mkdir -p "$BACKUP"
rsync -a --delete "$WEBROOT"/ "$BACKUP"/ 2>/dev/null || true

# Preserve files the build does NOT produce (e.g. .htaccess, BingSiteAuth.xml)
# by only removing files that will be replaced — actually safer to clean and
# re-add static files from the source. The .htaccess + BingSiteAuth are
# normally re-shipped from dist/ if they exist in the build.
rm -rf "${WEBROOT:?}"/*
tar -xzf "$TARBALL" -C "$WEBROOT"/
chown -R www-data:www-data "$WEBROOT"
rm -f "$TARBALL"

nginx -t >/dev/null
systemctl reload nginx

LATEST=$(ls "$WEBROOT"/assets/ 2>/dev/null | grep -oE "index-[A-Za-z0-9_-]+\.js" | head -1 || echo "unknown")
echo "DEPLOY_OK $(date -u +%FT%TZ) $LATEST"
