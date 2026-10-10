# AdSense on TechTrendi

How ads are wired, what broke, and what to check first when revenue is zero.

**Publisher ID:** `ca-pub-3437377907350211`
**Mode:** Auto Ads (Google places units itself — there are no manual ad slots)

---

## How it actually works

1. The loader is hardcoded in [`index.html`](../index.html) (~line 43) and ends up in the
   `<head>` of every prerendered page:
   `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-...`
2. Auto Ads is ON for techtrendi.com in the AdSense dashboard (Ads → By site).
   Google's crawler renders each page and injects units where it sees fit.
3. **Consent Mode v2 gates all of it.** `initGA()` in [`src/lib/gtag.ts`](../src/lib/gtag.ts)
   runs on every page load and declares consent defaults *before* AdSense asks.
   If `ad_storage` is denied, AdSense counts the pageview and serves nothing.

There are **no `<ins class="adsbygoogle">` elements anywhere**, by design.
Auto Ads does not need them.

### Dead code — do not be misled

`src/components/ads/AdSlot.tsx` and `AdProvider.tsx` look like a complete ad system
(header, sidebar, in-article, footer, mobile placements). **They are not used.**

- Nothing imports them
- `AdProvider` is not mounted in `App.tsx` or `main.tsx`
- The string `adsbygoogle` does not appear in the built JS bundle at all

They also could not work as written: `AdSlot` passes `data-ad-slot="in-article-ad"`,
a text label, where Google requires a 10-digit numeric slot ID created in the dashboard.
If you ever want manual placements, those IDs must come from AdSense first.

---

## The 2026-10-08 outage: zero impressions since launch

**Symptom:** AdSense showed pageviews climbing and **impressions stuck at 0** from the
day the site went live. Earnings $0.00. Nothing in the dashboard looked wrong.

**Everything that was already correct** (so don't re-check these first):

| Layer | State |
|---|---|
| Auto ads / Auto optimize | ON, 0 page exclusions |
| Policy center | No issues |
| `ads.txt` | present, `DIRECT`, correct pub ID |
| CSP | permits `*.googlesyndication.com`, `*.doubleclick.net`, etc. |
| `robots.txt` | allows crawling |
| Loader | in `<head>` of index, blog and news pages |
| Prerendering | real content server-rendered (79 `<p>` tags on a typical article) |
| Mediapartners-Google | crawling and receiving full article text |

**Root cause:** `src/lib/gtag.ts` set a single blanket Consent Mode default:

```js
gtag('consent', 'default', {
  ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', …
});
```

No `region` scope, so **every visitor on earth was denied**. AdSense loaded, registered
the pageview, requested consent, was refused, and served nothing. Consent only flipped
on a cookie-banner click — and the banner appears on a 1-second delay that most readers
never act on.

**Fixes applied** (commit `8ba2d4b`):

1. **Region-scoped consent defaults.** EEA + UK + CH keep the strict `denied` default
   (GDPR/ePrivacy require prior consent). Every other region defaults to `granted`.
2. **`applyPreferences` now revokes.** It previously only ever sent `granted` and never
   `denied`, so the banner's Decline button silently did nothing. It now routes through
   `updateConsent()` and sends both states. This matters much more now that non-EEA
   visitors start from granted.
3. **Dropped `overflow-x-clip`** from the top-level wrapper in
   `src/components/layout/Layout.tsx` — a clipped container can stop Auto Ads placing
   units inside it. Safe to remove: `html`/`body` already carry `overflow-x: clip` in
   `src/index.css`, so there is no sideways-scroll regression.

### Status as of 2026-10-09

**Not yet confirmed working.** The day after deploy still showed 20 pageviews / 0
impressions. Two things suggest the pipeline is functional rather than dead:

- **+$0.01 earned over 28 days, attributed to the United States** — so an ad *has*
  rendered at least once. The mechanism works; volume is the problem.
- **Mediapartners-Google requests jumped 75 → 427** after the deploy, and it began
  fetching `/assets/*.js` bundles rather than only HTML. That is Google *rendering*
  pages to find placements — behaviour it had no reason to perform while consent was
  being refused.

Google commonly takes 24–48h to resume serving on a site it has been refusing, and
reporting lags several hours behind serving. Give it until at least 2026-10-10 before
concluding the consent fix was insufficient.

---

## If impressions are still zero

Work down this list — it is ordered by how cheap each check is.

1. **Verify consent in the live bundle.** This is the single most useful check:
   ```bash
   B=$(curl -s https://techtrendi.com/ | grep -oE 'assets/app-[A-Za-z0-9_-]+\.js' | head -1)
   curl -s "https://techtrendi.com/$B" | grep -o 'ad_storage:"granted"'
   ```
   One match expected. No match means a deploy reverted the fix.

2. **Check the rendered page in a real browser**, not curl. Open DevTools → Console and
   look for `adsbygoogle` errors; Network → filter `googlesyndication` and confirm ad
   requests fire. curl cannot see this — Auto Ads injects after hydration.

3. **Confirm Auto Ads is still ON** — Ads → By site → techtrendi.com, and check
   **Page exclusions** is still 0.

4. **Check Policy center and Sites status.** A site can be approved while ad serving is
   separately restricted.

5. **Last resort: wire real ad units.** Create units in AdSense, take the numeric slot
   IDs, fix `AdSlot.tsx` to use them, mount `AdProvider` in `App.tsx`, and place
   `<InArticleAd/>` in `BlogArticle.tsx` / `NewsArticle.tsx`. This is a real code change
   and gives manual control over placement — generally higher revenue than Auto Ads, but
   more to maintain.

---

---

## Related: the OG cache (social link previews)

Not AdSense, but the same `og-meta.php` endpoint and a trap worth knowing.

`og-meta.php` serves social crawlers from a **file cache with a 24-hour TTL,
checked before Supabase**. Changing an article's cover image used to update the
database while Telegram/WhatsApp/Facebook kept showing the old picture for up to
a day. This was misdiagnosed twice as a Telegram caching problem and once,
externally, as a client-rendered-metadata problem. It is neither.

**Fixed 2026-10-10** (commit `85f8ae2`): the admin now calls
`POST /api/purge-og-cache` on save, which deletes that one cache entry.
og-meta.php rebuilds it from Supabase on the next crawler hit.

- Endpoint lives in `/opt/tech-news/image_upload_api.py` (Flask, port 5117)
- nginx route is in the **`db2.techtrendi.com`** server block — note that all
  `/api/*` routes live there, *not* under techtrendi.com
- Client helper: `src/lib/purgeOgCache.ts`, called from both
  `AdminArticles.tsx` and `AdminNews.tsx`. Non-fatal by design.

Manual purge, if ever needed:

```bash
rm -f /var/www/techtrendi/og-cache/<section>_<slug>.json
# then re-request the page with a crawler UA to repopulate
curl -s https://techtrendi.com/news/<slug> -A "TelegramBot (like TwitterBot)" \
  | grep -o 'og:image" content="[^"]*"'
```

**Debugging note:** testing these URLs with plain `curl` gives a misleading
**403** — nginx blocks unrecognised non-browser user agents. Always pass a real
crawler or browser UA, or you will conclude the page is broken when it is not.
This is exactly what made an external analysis report "the crawler receives
homepage content"; opengraph.xyz hit the same 403 and fell back to homepage data.

---

## Rules

- **Never** change the AdSense script or publisher ID without explicit direction.
- Ad-related changes are SEO/revenue critical — always verify in the deployed bundle
  afterwards, not just locally.
- Consent Mode changes have legal implications. The EEA/UK/CH deny-by-default is a
  compliance requirement, not a tunable.
