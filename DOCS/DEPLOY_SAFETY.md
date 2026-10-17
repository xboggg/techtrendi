# Deploy safety: why a bad build can never delete the site's articles

**Read this before changing `src/ssg/news-data.ts`, `scripts/generate-sitemap.mjs`,
`scripts/test-deploy-guard.mjs`, `.github/workflows/deploy.yml` or the server's
`/usr/local/bin/techtrendi-install`.**

Added 17 October 2026 (commit `84d6be8`, self-test added afterwards).

## The danger, in plain terms

Every deploy, whether daily at 11:30 UTC or on a code push, builds a fresh
copy of the site. During the build, every blog and news article is fetched
from the database and turned into a ready-made page.

The server then installs that copy with `rsync -a --delete`
(`/usr/local/bin/techtrendi-install`, in place since 6 June 2026). That makes
the live site **identical** to the build, which includes **deleting** anything
the build doesn't contain. Only `/images`, `/uploads`, `/storage` and
`/.well-known` are protected.

Until 17 October 2026, the article fetch (`sbFetch` in `src/ssg/news-data.ts`,
written 19 June 2026) returned **an empty list on any error**. So:

1. The database is unreachable for even a minute or two during a build.
2. The build "succeeds" with zero articles.
3. The deploy deletes all ~930 article pages from the live site, and the
   sitemap shrinks to ~166 URLs.
4. Every check passes, because the smoke test only loads the homepage.

**It never happened.** All 38 deploys from 30 September to 17 October built a
full site (1,053–1,103 URLs). It was found because a local build on a network
that breaks the HTTPS connection to `db2.techtrendi.com` silently produced 166
pages.

## The two guards

They work independently, so one still protects the site if the other is ever
bypassed.

| Guard | Where | What it does |
|---|---|---|
| **1. Fail at the source** | `src/ssg/news-data.ts` | `sbFetch` retries each query 3 times, then **throws**, which fails the build. `requireAtLeast` also throws if fewer than **200 news** or **100 blog** articles come back. That catches a database that answers "200 OK" with an empty list, for example after an RLS or key change, which no error would reveal. |
| **2. Refuse before publishing** | `scripts/generate-sitemap.mjs` | If the built pages include fewer than 100 blog or 200 news pages, it prints `REFUSING`, does **not** write the sitemap, and exits 1. The Deploy workflow stops there. |

A failed build **never deploys**, so the live site stays exactly as it was until
the next good build.

The floors are far below today's counts (news 594, blog 343 on 17 Oct 2026), so
normal article deletions never trip them.

## The guard on the guard

`scripts/test-deploy-guard.mjs` runs in the Deploy workflow **before** the
build. It fails the deploy if anyone removes or weakens either guard. It checks:

- the real sitemap script, run against fake builds: it must refuse 0/0 and
  99/199 pages, and accept 100/200;
- that `sbFetch` still throws, never returns an empty list, and never swallows
  errors;
- that both minimums are still at least 200 news / 100 blog, and that both
  article lists still go through `requireAtLeast`.

The test was itself tested: five deliberately broken versions (the original
`return []` bug, a zeroed minimum, a removed `requireAtLeast`, a removed
`process.exit(1)`, and zeroed sitemap floors) were all caught.

Run it locally with `node scripts/test-deploy-guard.mjs`.

## How it was proven to work

| Test | Result |
|---|---|
| Build with the database URL pointed at an unreachable host, in a clean worktree | Exit 1, `[ssg] could not fetch "articles" … after 3 attempts`, 0 pages produced |
| Sitemap step on a build with no article pages | Exit 1, `REFUSING`, no sitemap written |
| Real CI build and deploy after the change | Success, 1,103 URLs (343 blog, 594 news), live pages checked 200 |

## If a deploy fails with one of these messages

**The live site is safe**; that day's update was simply skipped.

- `[ssg] could not fetch "…" after 3 attempts`: the build couldn't reach
  `db2.techtrendi.com`. Check the Supabase containers on 144 and the
  Cloudflare/nginx path to db2, then re-run the workflow
  (`gh workflow run deploy.yml --ref main`).
- `[ssg] only N published … came back`: the database answered but returned too
  few articles. Check RLS policies on `techtrendi.news` and
  `techtrendi.articles`, and the `VITE_SUPABASE_PUBLISHABLE_KEY` secret.
- `[sitemap] REFUSING`: the build produced too few article pages. Look further
  up the log for the cause.
- `Deploy guard self-test` failed: someone changed the guard. Read the failure
  lines, then restore the guard.

## Rules

- **Never loosen the minimums just to make a deploy pass.** Fix the cause.
- If articles are **deliberately** deleted in bulk and the real count drops
  below a floor, lower the constant in **all three** places together:
  `MIN_NEWS`/`MIN_BLOG` in `news-data.ts`, `FLOORS` in `generate-sitemap.mjs`,
  and the expectations in `test-deploy-guard.mjs`. Record the reason in the
  commit message.
- Don't run `npm run build` from a network that intercepts HTTPS (some public
  or office Wi-Fi, some VPNs). The guard will correctly fail it. Build in CI, or
  in a clean worktree on a normal connection.
- Don't make `sbFetch` "graceful" again by catching errors and returning
  defaults. Graceful there means silent data loss in production.
