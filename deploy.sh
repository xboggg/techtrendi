#!/bin/bash
# TechTrendi Smart Deploy Script
# Only uploads changed files to cPanel FTP
# Usage: bash deploy.sh [--full]
#   --full: Force full upload of all assets

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
PUBLIC_DIR="$PROJECT_DIR/public"
MANIFEST="$PROJECT_DIR/.deploy-manifest"
FTP_HOST="198.54.125.234"
FTP_USER="techbhyx"
FTP_PASS='jaesn3fhu@*WE-'
FTP_BASE="/public_html"
VPS_HOST="root@38.242.195.0"
FULL_DEPLOY=false

if [[ "$1" == "--full" ]]; then
  FULL_DEPLOY=true
  echo "[FULL DEPLOY] Uploading all files..."
fi

# Step 1: Build
echo "==> Building project..."
cd "$PROJECT_DIR"
rm -rf dist 2>/dev/null || true
sleep 1
npm run build 2>&1 | tail -5

NEW_HASH=$(ls dist/assets/index-*.js 2>/dev/null | grep -o 'index-[^.]*' | head -1)
echo "==> Build hash: $NEW_HASH"

# Step 2: Determine which asset files changed
echo "==> Comparing with last deploy..."
ASSETS_TO_UPLOAD=()
ASSETS_TO_DELETE=()

if [[ "$FULL_DEPLOY" == "true" ]] || [[ ! -f "$MANIFEST" ]]; then
  # Full deploy - upload everything
  for f in "$DIST_DIR/assets/"*; do
    ASSETS_TO_UPLOAD+=("$(basename "$f")")
  done
  echo "   Uploading ALL ${#ASSETS_TO_UPLOAD[@]} assets (full deploy)"
else
  # Smart deploy - diff against manifest
  # Find new/changed files (in dist but not in manifest, or different size)
  while IFS= read -r file; do
    basename_f="$(basename "$file")"
    if ! grep -q "^$basename_f " "$MANIFEST" 2>/dev/null; then
      ASSETS_TO_UPLOAD+=("$basename_f")
    fi
  done < <(ls "$DIST_DIR/assets/" 2>/dev/null)

  # Find deleted files (in manifest but not in dist)
  if [[ -f "$MANIFEST" ]]; then
    while IFS=' ' read -r name _size; do
      if [[ ! -f "$DIST_DIR/assets/$name" ]]; then
        ASSETS_TO_DELETE+=("$name")
      fi
    done < "$MANIFEST"
  fi

  echo "   New/changed: ${#ASSETS_TO_UPLOAD[@]} files"
  echo "   To delete: ${#ASSETS_TO_DELETE[@]} files"
fi

# Step 3: Delete stale assets from server via VPS Python
if [[ ${#ASSETS_TO_DELETE[@]} -gt 0 ]]; then
  echo "==> Deleting ${#ASSETS_TO_DELETE[@]} stale files from server..."
  DELETE_LIST=$(printf '%s\n' "${ASSETS_TO_DELETE[@]}")
  ssh "$VPS_HOST" "python3 -c '
import ftplib, sys
ftp = ftplib.FTP(\"$FTP_HOST\")
ftp.login(\"$FTP_USER\", \"$FTP_PASS\")
ftp.cwd(\"$FTP_BASE/assets\")
to_delete = \"\"\"$DELETE_LIST\"\"\".strip().split(chr(10))
deleted = 0
for f in to_delete:
    f = f.strip()
    if not f: continue
    try:
        ftp.delete(f)
        deleted += 1
    except: pass
print(f\"Deleted {deleted}/{len(to_delete)} files\")
ftp.quit()
'"
fi

# Step 4: Upload changed assets in batches of 5
if [[ ${#ASSETS_TO_UPLOAD[@]} -gt 0 ]]; then
  echo "==> Uploading ${#ASSETS_TO_UPLOAD[@]} assets..."
  count=0
  batch=()
  for f in "${ASSETS_TO_UPLOAD[@]}"; do
    curl -s -u "$FTP_USER:$FTP_PASS" -T "$DIST_DIR/assets/$f" "ftp://$FTP_HOST$FTP_BASE/assets/$f" &
    batch+=($!)
    count=$((count + 1))
    if [[ ${#batch[@]} -ge 5 ]]; then
      wait "${batch[@]}" 2>/dev/null
      batch=()
      echo "   Uploaded $count/${#ASSETS_TO_UPLOAD[@]}"
    fi
  done
  if [[ ${#batch[@]} -gt 0 ]]; then
    wait "${batch[@]}" 2>/dev/null
  fi
  echo "   Uploaded $count/${#ASSETS_TO_UPLOAD[@]} assets"
fi

# Step 5: Upload static files that changed
echo "==> Uploading static files..."
for static_file in favicon.ico favicon.svg og-image.jpg og-meta.php .htaccess apple-touch-icon.png; do
  if [[ -f "$PUBLIC_DIR/$static_file" ]]; then
    curl -s -u "$FTP_USER:$FTP_PASS" -T "$PUBLIC_DIR/$static_file" "ftp://$FTP_HOST$FTP_BASE/$static_file" &
  fi
done
wait 2>/dev/null

# Step 6: Upload index.html LAST
echo "==> Uploading index.html..."
curl -s -u "$FTP_USER:$FTP_PASS" -T "$DIST_DIR/index.html" "ftp://$FTP_HOST$FTP_BASE/index.html"

# Step 7: Save manifest for next deploy
echo "==> Saving deploy manifest..."
> "$MANIFEST"
for f in "$DIST_DIR/assets/"*; do
  basename_f="$(basename "$f")"
  size=$(wc -c < "$f" | tr -d ' ')
  echo "$basename_f $size" >> "$MANIFEST"
done

# Step 8: Verify
echo "==> Verifying deployment..."
LIVE_HASH=$(curl -s "https://techtrendi.com/" | grep -o 'index-[^"]*\.js' | head -1)
if [[ "$LIVE_HASH" == "$NEW_HASH.js" ]]; then
  echo "==> DEPLOY SUCCESS: $LIVE_HASH is live"
else
  echo "==> WARNING: Expected $NEW_HASH.js but got $LIVE_HASH"
fi

echo "==> Done!"
