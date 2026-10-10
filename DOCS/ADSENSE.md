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

## Low fill rate, and the 2026-10-08 consent investigation

> **Read this first — the original framing here was wrong.**
>
> This section was written believing impressions had been **zero since launch**. The
> AdSense by-day report (pulled 2026-10-10) shows that was never true:
>
> | | |
> |---|---|
> | First impressions | **1 August 2026** |
> | Best day | 3 August 2026 — 28 impressions |
> | Total since launch | **67 impressions on 2,056 pageviews (~3%)**, $0.04 |
> | Pattern | 1–7 impressions on scattered days, zero on most days |
>
> So nothing was ever "broken". **The real problem is a ~3% fill rate**, and today's
> "0 impressions" readings were simply normal days for a site this size.
>
> **Root cause of the low fill (found 2026-10-10):** most Auto Ads formats were
> switched **off** for techtrendi.com. **Banner ads** (in-article — the main earner on
> a blog) and **Anchor ads** (sticky mobile bar) were both disabled. Only Side rail
> (desktop-only) and Multiplex (end of article) were on. Most readers are on phones in
> Ghana, so the only ad they could ever see sat at the very bottom of the page. That is
> the 3%.
>
> **Fix:** Ads → By site → techtrendi.com → pencil → enable **Banner** and **Anchor**,
> then Apply to site. No code involved. Allow 1–3 days for Google to re-scan.
> Vignette (full-screen interstitial) and Ad intents (beta) were deliberately left off.
>
> **Lesson for next time:** pull the **by-day report, broken down by site**, *before*
> diagnosing anything. A single day's dashboard snapshot cannot distinguish "broken"
> from "low volume", and assuming the former cost a full day of investigation.

### The consent bug (real, but not the cause of low revenue)

Everything below describes a genuine bug that was found and fixed on 2026-10-08. It
was worth fixing — a blanket worldwide consent denial is wrong and would have become
more costly as traffic grew — but the by-day report later cleared it of causing the
low fill: ads were serving from 1 August *with the old code in place*, and impressions
landed on 8 October, the very day it changed. **Do not revert it.**

**Symptom as originally reported:** pageviews climbing, impressions apparently stuck
at 0. (This turned out to be a misreading of normal low-volume days.)

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

### Resolution (2026-10-10)

The consent change is **confirmed working in a real browser**: EEA defaults to denied,
elsewhere to granted, and the update fires correctly. It was cleared of causing the low
fill rate — see the by-day evidence at the top of this document.

A browser-console check also showed `adsbygoogle.js` loading and running, then making
**no further ad requests**. That initially looked account-side, but the by-day report
plus the Auto Ads format settings explained it: with Banner and Anchor disabled, there
was simply nowhere on a mobile page for Google to place an ad.

Two claims made during this investigation that turned out to be **wrong**, recorded so
they are not repeated:

- *"Manual ad units will fix zero impressions."* No — if the loader is not requesting
  ads, manual `<ins>` slots render empty for the same reason. Manual units are a
  **fill-rate** improvement, not a fix for nothing serving.
- *"`overflow-x-clip` may be blocking Auto Ads."* Ads were placing fine with it in
  place. Removing it was harmless but it was never the problem.

---

## If fill rate is poor (the realistic scenario)

Ordered by what actually proved useful, hardest-won first.

1. **Pull the by-day report, broken down by site.** Reports → set the date range to
   months, not days. This is the check that ended the investigation, and skipping it
   cost a full day. It tells you whether you are looking at *broken* or merely *low
   volume* — those have completely different fixes, and a one-day snapshot cannot tell
   them apart.

2. **Check which Auto Ads formats are enabled.** Ads → By site → techtrendi.com →
   pencil icon. This was the actual cause: Banner and Anchor were off, leaving mobile
   readers with no placement but the end-of-article Multiplex grid. Note that newer
   AdSense has **no ad-load slider** — formats are the lever.

3. **Check the rendered page in a real browser**, not curl. DevTools → Console for
   `adsbygoogle` errors; Network → filter `googlesyndication` to see whether ad
   requests fire at all. curl cannot see any of this, because Auto Ads injects after
   hydration. Caveat: test from a non-EEA IP, or a missing certified CMP will suppress
   requests and look like an account problem.

4. **Verify consent survived the last deploy:**
   ```bash
   B=$(curl -s https://techtrendi.com/ | grep -oE 'assets/app-[A-Za-z0-9_-]+\.js' | head -1)
   curl -s "https://techtrendi.com/$B" | grep -o 'ad_storage:"granted"'
   ```
   One match expected. No match means a deploy reverted the region-scoped fix.

5. **Check Policy center, Sites status and Page exclusions.** All were clean
   throughout this investigation, which is why they are near the bottom of the list.

6. **Wire real ad units.** Create units in AdSense, take the numeric slot IDs, fix
   `AdSlot.tsx` to use them, mount `AdProvider` in `App.tsx`, and place
   `<InArticleAd/>` in `BlogArticle.tsx` / `NewsArticle.tsx`. Worth doing for
   deterministic placement rather than leaving it to Auto Ads' judgement — but note
   this only helps once ads are serving at all. It is a fill-rate improvement, not a
   repair.

7. **Grow traffic.** At ~30 pageviews/day, even perfect placement earns very little.
   67 impressions over 2,056 pageviews produced $0.04. Traffic dominates every other
   lever here over any meaningful timeframe.

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
