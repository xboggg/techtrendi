# Why Google indexes almost nothing, and what was done about it

**Status at 2026-10-11:** Google Search Console reports **8 of ~1,800 pages
indexed**. That is the single biggest constraint on the site's growth — not
design, not ad placement, not social sharing.

## The numbers

| GSC status | Pages | Meaning |
|---|---|---|
| **Indexed** | **8** | The only pages that can appear in Google |
| Crawled – currently not indexed | 998 | Google read them and declined to list them |
| Discovered – currently not indexed | 375 | Known, not yet crawled |
| Excluded by `noindex` | 185 | 182 are deleted articles; correct behaviour |
| Server error (5xx) | 157 | Validated as fixed |

Referrer data over 30 days (bots excluded) matches:

| Source | Real visits |
|---|---|
| Direct / unknown | 1,419 |
| **Bing** | **91** |
| Google search | **19** |
| X/Twitter | 5 |
| Facebook | 3 |

Bing sends ~5x more traffic than Google. With 915 published posts, 19 Google
visits per month means the site is effectively absent from search.

## The actual cause

**Not** a crawl-access problem. Googlebot reaches the pages fine — it fetched
the Google-AI-chatbot story on 24 Sep and still did not index it.

The 998 "crawled, not indexed" pages are mostly **global tech news** — Sony-Honda
Afeela, LemFi, Payfast and similar — that hundreds of larger outlets publish
within the hour. Google already has those stories from sources it trusts more,
so another version from a new domain earns nothing, and every thin page lowers
its opinion of the whole site.

Time was lost chasing two red herrings first: Googlebot 444s on `/robots.txt`
and nginx rate limiting. Both are real but marginal. Check the **GSC Pages
report before** investigating anything at the server level.

## Protecting the indexed pages (2026-10-17)

A build that silently lost its articles would have deleted every article page
and shrunk the sitemap to ~166 URLs, which would be catastrophic for indexing.
The build now fails instead, and a self-test keeps that guard in place. See
[DEPLOY_SAFETY.md](DEPLOY_SAFETY.md).

## Fixed 2026-10-11

### Soft 404s

Missing article URLs returned **HTTP 200** with "Article Not Found" in the body,
because `try_files` fell through to the SPA shell:

```nginx
try_files $uri $uri.html $uri/index.html /index.html;   # every URL → 200
```

182 dead URLs were consuming crawl budget while 375 real articles sat
undiscovered. A scoped location now returns a real 404:

```nginx
location ~ ^/(blog|news)/([^/]+)/?$ {
    if ($is_bot = 1) { rewrite ^/(.*)$ /og-meta.php?path=$1&$args last; }
    try_files $uri $uri.html @article_fallback;
}

location @article_fallback {
    rewrite ^/(.*)$ /article-exists.php?path=$1 last;
}
```

Deliberately narrow — exactly two path segments under `/blog/` or `/news/`. It
must not catch:

- section landing pages `/news`, `/blog` (prerendered, real)
- other routes in the shared block (`/tools`, `/security`, …)
- client-only routes (`/admin`, `/auth`, `/arcade`, `/profile`) which need the
  SPA shell

**Correction, 2026-10-17.** The first version used `try_files $uri $uri.html
=404`, on the assumption that a missing file means a missing article. That
is false between publishing and the next build. The daily build is scheduled
for 11:30 UTC but GitHub delays scheduled runs by hours (actual runs landed
15:24-20:21 UTC), while The Rundown publishes at 03:00 UTC. Each morning's
posts were a hard 404 for direct visitors -- WhatsApp shares and Google
included -- for up to 17 hours.

`public/article-exists.php` now handles a missing file by asking the
database, with the anon key so RLS hides drafts:

| Situation | Response | `X-Article-Fallback` header |
|---|---|---|
| Published, page not built yet | 200, SPA shell | `published-awaiting-build` |
| Draft, deleted or never existed | 404, SPA shell (app shows not-found) | `not-found` |
| Malformed path | 404 | `bad-path` |
| Database unreachable | 200 (fail open) | `db-unavailable` |

Lives in `public/` so every build deploys it; the nginx change itself is on
the server only (backup at `/root/nginx-techtrendi.com.bak-20261017-152915`).

Verified after reload: fake article URLs → 404; `/`, `/news`, `/blog`, `/tools`,
`/security`, real articles, `/tools/ghana-tax-calculator` → 200; `/admin`,
`/auth`, `/profile`, `/arcade`, `/reading-list` → 200; OG tags still served for
real articles.

### Articles with no prerendered file

Five published posts had no `.html` at all, so they could never be indexed:

- `blog/two-factor-authentication-methods-ranked-weakest-to-strongest`
- `blog/complete-two-factor-authentication-setup-guide`
- `news/nigeria-nimc-act-2026-digital-identity-authority`
- `news/paystack-dashboard-rebuild-ai-command-centre-2026`
- `news/paystack-launches-ai-dashboard-redesign-after-10-years`

Counts were 339 blog files vs 341 published rows, and 572 news files vs 575.
Not explained by the SSG category filter, slug length, special characters or
duplicate slugs — all checked. A rebuild was triggered; **re-verify the counts
match after any future build**, because the gap is silent.

Quick check:

```bash
ls /var/www/techtrendi/blog/*.html | wc -l   # vs published articles
ls /var/www/techtrendi/news/*.html | wc -l   # vs published news
```

## The unresolved part

The soft-404 and prerender fixes recover crawl budget. They do **not** make
Google want to index generic global news.

That needs an editorial decision: the daily generator produces world-tech
rewrites automatically, which is how the site reached 915 posts with 8 indexed.
Options discussed but not actioned:

- stop auto-publishing generic global news
- `noindex` or remove the thinnest existing rewrites
- publish Ghana-specific content large outlets do not cover (SIM/Ghana Card
  registration, monthly data-bundle comparisons, local scam alerts, Bank of
  Ghana licensed loan apps, local startup coverage)
- fewer, deeper pages rather than volume

The tax calculator being the single most-visited page (61 entries in 30 days,
ahead of `/news`) supports the local-utility direction.
