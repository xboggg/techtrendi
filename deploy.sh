#!/bin/bash
# TechTrendi Deploy Script — syncs to GitHub + deploys to VPS 144.91.71.106
# Usage: bash deploy.sh ["optional commit message"]

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
VPS_HOST="root@144.91.71.106"
VPS_PATH="/var/www/techtrendi"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="/root/backup-techtrendi-${TIMESTAMP}.tar.gz"
COMMIT_MSG="${1:-Deploy: $(date '+%Y-%m-%d %H:%M')}"

# Step 0: Git sync (local → GitHub)
echo "==> Syncing to GitHub..."
cd "$PROJECT_DIR"
git add -A
if git diff --cached --quiet; then
  echo "==> Nothing new to commit — already in sync"
else
  git commit -m "$COMMIT_MSG"
  echo "==> Committed: $COMMIT_MSG"
fi
git push origin main
echo "==> GitHub up to date"

# Step 1: Build
echo "==> Building project..."
rm -rf dist 2>/dev/null || true
sleep 1
npm run build 2>&1 | tail -5

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "==> ERROR: Build did not produce dist/index.html. Aborting."
  exit 1
fi
NEW_HASH=$(ls dist/assets/index-*.js 2>/dev/null | grep -o 'index-[^.]*' | head -1)
echo "==> Build hash: $NEW_HASH"

# Step 2: Remote backup BEFORE deploy (safety net for rollback)
echo "==> Creating remote backup..."
ssh "$VPS_HOST" "cd /var/www && tar czf $BACKUP_FILE techtrendi"
ssh "$VPS_HOST" "ls -lh $BACKUP_FILE"
echo "==> Backup saved: $BACKUP_FILE"

# Step 3: Package and upload
echo "==> Packaging dist..."
tar czf /tmp/dist.tar.gz -C "$DIST_DIR" .

echo "==> Uploading to VPS..."
scp /tmp/dist.tar.gz "$VPS_HOST:/tmp/"

echo "==> Extracting on VPS..."
ssh "$VPS_HOST" "cd $VPS_PATH && tar xzf /tmp/dist.tar.gz && rm /tmp/dist.tar.gz"

# Step 4: Verify
echo "==> Verifying deployment..."
sleep 2
LIVE_HASH=$(curl -s "https://techtrendi.com/" | grep -o 'index-[^"]*\.js' | head -1)
if [[ "$LIVE_HASH" == "$NEW_HASH.js" ]]; then
  echo "==> DEPLOY SUCCESS: $LIVE_HASH is live"
  echo "==> Rollback (if needed): ssh $VPS_HOST 'cd /var/www && rm -rf techtrendi && tar xzf $BACKUP_FILE'"
else
  echo "==> WARNING: Expected $NEW_HASH.js but got $LIVE_HASH (Cloudflare cache may need time)"
  echo "==> Rollback (if needed): ssh $VPS_HOST 'cd /var/www && rm -rf techtrendi && tar xzf $BACKUP_FILE'"
fi

echo "==> Done! Local → GitHub → VPS all in sync."
