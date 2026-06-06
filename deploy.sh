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
# Parse the actual entry bundle from index.html (Vite produces many index-*.js chunks)
NEW_BUNDLE=$(grep -oE 'assets/index-[a-zA-Z0-9_-]+\.js' "$DIST_DIR/index.html" | head -1)
echo "==> Entry bundle: $NEW_BUNDLE"

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
# Use real User-Agent so the bot-blocker doesn't return 403
LIVE_BUNDLE=$(curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "https://techtrendi.com/" | grep -oE 'assets/index-[a-zA-Z0-9_-]+\.js' | head -1)
if [[ "$LIVE_BUNDLE" == "$NEW_BUNDLE" ]]; then
  echo "==> DEPLOY SUCCESS: $LIVE_BUNDLE is live"
else
  echo "==> WARNING: Expected $NEW_BUNDLE but live shows $LIVE_BUNDLE (Cloudflare cache may need time — purge via CF dashboard if urgent)"
fi
echo "==> Rollback (if needed): ssh $VPS_HOST 'cd /var/www && rm -rf techtrendi && tar xzf $BACKUP_FILE'"

echo "==> Done! Local → GitHub → VPS all in sync."
