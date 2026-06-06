# TechTrendi

**Tech news, reviews, and editorial site for Ghana and beyond.**

Live at **<https://techtrendi.com>**. Source: <https://github.com/xboggg/techtrendi>.

---

## What is this?

TechTrendi is a static React/Vite site publishing tech news articles,
product reviews, and editorial content with a focus on the Ghanaian
audience. Content is editor-curated and stored in Supabase; the build
prerenders article pages for SEO.

The site is part of a small portfolio of Edmund Adjekum's projects all
hosted on the same Contabo VPS — see `/root/SERVER_DOCUMENTATION.md` on
the server for the full inventory.

---

## The docs

For anyone picking this up cold, in reading order:

1. **[DOCS/ARCHITECTURE.md](DOCS/ARCHITECTURE.md)** — how the app is built.
   Stack, project structure, routing, where content comes from.
2. **[DOCS/OPERATIONS.md](DOCS/OPERATIONS.md)** — how the app is run.
   Server, nginx, Cloudflare, deploy procedure, rollback, DNS, email.
3. **[DOCS/ADDING_CONTENT.md](DOCS/ADDING_CONTENT.md)** — non-coder
   workflows: publish a new article, update an emergency link, change
   the About text.
4. **[DOCS/DISASTER_RECOVERY.md](DOCS/DISASTER_RECOVERY.md)** — what
   survives what, what's in the daily Google Drive backup, and the
   step-by-step recovery for every "the server / laptop / GitHub is
   gone" scenario.

The legacy comprehensive doc at
[TECHTRENDI-DOCUMENTATION.md](TECHTRENDI-DOCUMENTATION.md) is kept for
historical context — the 4 focused docs above supersede most of it.

---

## Stack at a glance

| Layer | What |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind v4 + shadcn/ui (Radix primitives) |
| Routing | react-router-dom |
| Content | Supabase Postgres (techtrendi schema) |
| Hosting | Static build served by nginx on Contabo VPS (Germany) |
| DNS / CDN | Cloudflare (proxied) |
| Hosting model | Multi-site shared server (cyberabofra, trendimovies, etc) |

Full dependency list in [`package.json`](package.json).

---

## Run locally

Prerequisites: Node.js 18 or higher.

```bash
npm install
npm run dev
```

Dev server starts on <http://localhost:8080> (Vite default).

---

## Build for production

```bash
npm run build
```

Outputs a static bundle in `dist/`.

---

## Deploy

**Push to `main` on GitHub** — that's it. GitHub Actions builds and ships
in ~50 seconds.

```bash
git add -A
git commit -m "what changed"
git push
```

Watch the run at <https://github.com/xboggg/techtrendi/actions>.

The workflow definition is at
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Manual
runs are available via the **Run workflow** button on the Actions tab.

If GitHub Actions is ever down or you need to ship a hotfix faster than
a CI run, the legacy [`deploy.sh`](deploy.sh) is preserved as the
emergency manual deploy — it does the same thing locally
(build → tar → scp → install).

Each deploy snapshots the previous build to `/var/www/techtrendi.backup/`
on the server for one-step rollback — see
[DOCS/OPERATIONS.md](DOCS/OPERATIONS.md) for the full procedure and
disaster recovery.

---

## Project layout

```
techtrendi/
├── .github/workflows/         # GitHub Actions auto-deploy on push to main
├── DOCS/                      # Architecture / operations / content / disaster recovery
├── deploy/                    # Server-side install + SSH gate scripts (canonical copies)
├── deploy.sh                  # Legacy emergency manual deploy script
├── content/                   # Editorial content
├── public/                    # Static assets shipped as-is
├── scripts/                   # Article publishing + refresh helpers
├── src/
│   ├── components/            # Reusable UI (shadcn-based)
│   ├── pages/                 # Top-level route components
│   ├── lib/                   # Pure helpers (supabase client, utils)
│   └── integrations/          # Third-party API clients
└── TECHTRENDI-DOCUMENTATION.md  # Legacy comprehensive doc (gradually deprecated)
```

---

## Contact

- **Admin / editorial:** [info@techtrendi.com](mailto:info@techtrendi.com)
- **Live site:** <https://techtrendi.com>
- **Owner:** Edmund Adjekum (xboggg)
