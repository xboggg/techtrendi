# Launching the Ghana data bundle pages

Today the pages live at a private preview, `/tools-preview/data-bundles/ghana` (password, noindex).
Launch moves them to **`/data-bundles/ghana`** (public, indexed). Do this **only with the owner's go-ahead**.

Steps, in this order. Every block is copy-paste. Server steps run as root on Contabo 144.

## 1. Switch on (local)

In `src/data/dataBundlesRoute.ts`:

```ts
export const DATA_BUNDLES_LAUNCHED = true;
```

That one line moves the routes, makes the pages indexable with their own canonical, prerenders them,
adds them to the sitemap (daily, priority 0.8), lists the tool on the Tools pages, the tools index and
the footer, and moves the offline copy to `/data-bundles-sw`.

Check before committing:

```sh
npx tsx scripts/test-data-bundles.mts        # must end "0 failed"
node scripts/test-deploy-guard.mjs           # must pass
```

## 2. Deploy

Commit and push to `main` (the Deploy workflow builds and installs the site; see DEPLOY_SAFETY.md).
Wait for the workflow to finish green. Then check the new pages exist before touching nginx:

```sh
UA='TrendiOps-Monitor/1.0 (b0c1ef67b9618b2b)'
for p in ghana ghana/mtn ghana/telecel ghana/at; do
  curl -s -o /dev/null -w "%{http_code} /data-bundles/$p\n" -A "$UA" "https://techtrendi.com/data-bundles/$p"
done                                          # all 200
ls /var/www/techtrendi/data-bundles/          # ghana.html and ghana/ (at.html, mtn.html, telecel.html)
ls -la /var/www/techtrendi/sw-data-bundles.js
ls /var/www/techtrendi/data-bundles.html 2>/dev/null && echo "STOP: the bare address must not be a page"
```

## 3. nginx (on 144)

Back up first:

```sh
B=/root/backups/nginx-techtrendi.com-$(date +%Y%m%d-%H%M%S)-pre-data-bundles-launch
cp -p /etc/nginx/sites-enabled/techtrendi.com "$B" && echo "$B"
```

Open `/etc/nginx/sites-enabled/techtrendi.com` (a real file, not a symlink) and paste this block
**just above the line `# Main content routes`** (inside the `server_name techtrendi.com` server):

```nginx
    # --- Ghana data bundles (launch). Copied from the article block: social bots get og-meta.php,
    # everyone else the prerendered page. No add_header here, so the server's CSP/HSTS still apply.
    location = /data-bundles  { return 301 /data-bundles/ghana; }
    location = /data-bundles/ { return 301 /data-bundles/ghana; }
    # Old preview links (with or without a path, and the bare address) move to the public pages.
    location ^~ /tools-preview/data-bundles {
        rewrite ^/tools-preview/data-bundles(/.*)?$ /data-bundles$1 permanent;
    }
    location ^~ /data-bundles/ {
        if ($is_bot = 1) {
            rewrite ^/(.*)$ /og-meta.php?path=$1&$args last;
        }
        rewrite ^/data-bundles/(.+)/$ /data-bundles/$1 permanent;
        expires -1;
        # Only the prerendered pages exist: an unknown country or network is a real 404. The build
        # has no 404.html, so the 404 body is the app shell, which shows the site's "Not found" page.
        try_files $uri $uri.html $uri/index.html =404;
        error_page 404 /index.html;
    }
    # --- end data bundles
```

Notes:
- `location = /data-bundles-sw` (the offline copy) is already in place (added 20 Oct 2026); it stays.
- `location = /tools-preview/data-bundles-sw` stays too, so preview visitors' old worker can still
  update; the launched pages remove that registration themselves.
- The exact `= /tools-preview/data-bundles-sw` match wins over the new `^~ /tools-preview/data-bundles`.

Test and reload:

```sh
nginx -t && systemctl reload nginx
```

If `nginx -t` fails, do not reload: `cp -p "$B" /etc/nginx/sites-enabled/techtrendi.com`.

## 4. Check (on 144 or anywhere)

```sh
UA='TrendiOps-Monitor/1.0 (b0c1ef67b9618b2b)'
c() { curl -s -o /dev/null -w "%{http_code} %{redirect_url}  $1\n" -A "$UA" "https://techtrendi.com$1"; }
c /data-bundles                         # 301 https://techtrendi.com/data-bundles/ghana
c /data-bundles/                        # 301 https://techtrendi.com/data-bundles/ghana
c /data-bundles/ghana                   # 200
c /data-bundles/ghana/mtn               # 200
c /data-bundles/ghana/mtn/              # 301 .../data-bundles/ghana/mtn
c /data-bundles/ghana/xyz               # 404
c /data-bundles/kenya                   # 404
c /tools-preview/data-bundles           # 301 .../data-bundles
c /tools-preview/data-bundles/ghana/at  # 301 .../data-bundles/ghana/at
c '/tools-preview/data-bundles/ghana/mtn?amount=33'   # 301 keeps ?amount=33
c /data-bundles-sw                      # 200
curl -sI -A "$UA" https://techtrendi.com/data-bundles-sw | grep -iE 'content-type|cache-control'
                                        # application/javascript, no-cache
curl -sI -A "$UA" https://techtrendi.com/data-bundles/ghana | grep -iE 'content-security|strict-transport'
                                        # both present
curl -s -A 'facebookexternalhit/1.1' https://techtrendi.com/data-bundles/ghana/mtn | grep -o '<meta property="og:title"[^>]*>'
                                        # MTN Data Bundles in Ghana: What to Buy Today
curl -s -A "$UA" https://techtrendi.com/data-bundles/ghana | grep -c 'noindex'            # 0
curl -s -A "$UA" https://techtrendi.com/data-bundles/ghana | grep -o '<link rel="canonical"[^>]*>'
                                        # https://techtrendi.com/data-bundles/ghana
curl -s -A "$UA" https://techtrendi.com/sitemap.xml | grep -c '/data-bundles/'            # 4
```

Then in a phone browser: open `/data-bundles/ghana`, check it starts dark, tap MTN, go offline
(flight mode), reload: the page still opens and says "Saved prices from ...".

## 5. Search Console

URL Inspection for `https://techtrendi.com/data-bundles/ghana`, then "Request indexing".
Do the same for `/ghana/mtn`, `/ghana/telecel` and `/ghana/at`.

## Rollback

1. nginx: `cp -p "$B" /etc/nginx/sites-enabled/techtrendi.com && nginx -t && systemctl reload nginx`
   (the backup path printed in step 3).
2. Site: set `DATA_BUNDLES_LAUNCHED = false`, commit, push, wait for the Deploy workflow. The pages
   return to the preview address, noindex, out of the sitemap and off the Tools pages and footer.
3. To switch the offline copy off everywhere instead: `DATA_BUNDLES_OFFLINE = false` (it removes
   every registration of it on the next visit).
