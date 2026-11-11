# Architecture

What's inside the codebase. Pair with
[OPERATIONS.md](OPERATIONS.md) for runtime concerns and
[DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) for "the server is gone"
scenarios.

---

## TL;DR

- Static React 18 + TypeScript + Vite SPA, served by nginx behind
  Cloudflare.
- Content (articles, reviews) is stored in a self-hosted Supabase
  Postgres `techtrendi` schema. The build pre-renders article pages.
- No backend server at runtime — Vite outputs a static `dist/` and that's
  what ships.
- Cross-cutting integrations: shadcn/ui (Radix primitives) for components,
  Tailwind v4 for styling, react-router-dom for client-side routing.
- **CI/CD:** `.github/workflows/deploy.yml` auto-builds and ships to the
  server on every push to `main`. See [OPERATIONS.md](OPERATIONS.md).

---

## Project structure

```
.github/workflows/
└── deploy.yml         # GitHub Actions auto-deploy on push to main

src/
├── App.tsx            # Top-level app shell + router config
├── main.tsx           # React entry + provider setup
├── index.css          # Tailwind v4 entry + theme tokens
├── components/        # Reusable UI (shadcn-based, see components.json)
│   └── ui/            # Generated shadcn primitives
├── pages/             # Top-level route components
├── lib/               # Pure helpers (Supabase client, formatters)
├── integrations/      # Supabase + third-party API clients
└── hooks/             # Reusable React hooks

content/               # Editor-authored content (markdown, JSON)
scripts/               # Article publishing + refresh helpers
public/                # Static assets shipped as-is (favicon, og-image, etc.)
deploy/                # Server-side install + SSH gate scripts (canonical copies)
```

---

## Routing

Routes are defined in [`src/ssg/routes.tsx`](../src/ssg/routes.tsx), the
route table of `vite-react-ssg` (entry `src/main.tsx`). `src/App.tsx` is
**no longer used** (kept for reference only) — a route added there does
nothing. Most pages are public. The admin panel is at `/admin` and
authenticates against Supabase.

When adding a route:

1. Create the component in `src/pages/`.
2. Register it in `src/ssg/routes.tsx` (`lazy: d(() => import(...))`).
   Pages with a dynamic part (`blog/:slug`, `ei-tech/:slug`) need
   `getStaticPaths` to be prerendered; build-time data comes from a
   `loader` (`src/ssg/news-data.ts`) or a baked JSON file (see Build).
3. Every route is prerendered unless `vite.config.ts` `includedRoutes`
   skips it; the sitemap is made from the built files
   (`scripts/generate-sitemap.mjs`, which has its own exclude list).

**Hydration rule:** the prerendered HTML and the first render in the
browser must be identical, or React throws #418/#423 and redraws the whole
page. Never read the date/clock, `localStorage` or random values during
render — read them in `useEffect` after mount (see `Security.tsx` `timeAgo`,
`DailyQuizWidget.tsx`, `EiTechReactions.tsx`).

---

## Content model

Content lives in Supabase Postgres under the `techtrendi` schema. The
self-hosted Supabase instance runs in Docker on the same server (`docker
ps` shows `supabase-db`, `supabase-auth`, etc.); the schema is isolated
from other apps' schemas via Postgres permissions and RLS.

The client uses `@supabase/supabase-js` to fetch published content at
build time (for static articles) and at runtime (for live dashboards).
Connection is via the same self-hosted Supabase as cyberabofra — see
`src/lib/supabase.ts` or equivalent for the client config.

Tables added in November 2026: `ei_tech_memes` (Ei Tech! memes, public
reads published rows), `ei_tech_reactions` (😂 + votes, only through the
SECURITY DEFINER functions `ei_tech_react` / `ei_tech_counts`), and
`security_scam_alerts.image_url` (scam-message picture). New tables that
the browser writes to get RLS + a SECURITY DEFINER function, never a
`USING (true)` write policy.

Article publishing flow:

1. Editor drafts in the admin UI at <https://techtrendi.com/admin> (or
   directly in the Supabase Studio at <https://db2.techtrendi.com>).
2. On publish, the row gets `published_at` set in the `articles` (or
   equivalent) table.
3. The next deploy picks up new rows and pre-renders pages.

See [ADDING_CONTENT.md](ADDING_CONTENT.md) for non-coder workflows.

---

## State management

Local component state via React hooks. Shared state (theme, auth)
lives in React contexts under `src/contexts/` if present.

Server state (article data) is fetched via Supabase client. Cache /
refetch is per-component — no global query library (TanStack Query
etc.) at the time of writing. Consider adding TanStack Query when the
number of distinct queries crosses ~10.

---

## Tailwind v4 + shadcn/ui

- Single CSS entry at `src/index.css` with `@import "tailwindcss"` and
  the design tokens.
- shadcn components are generated into `src/components/ui/` via the
  `components.json` config. Add new components with
  `npx shadcn@latest add <name>`.
- Theme tokens live as CSS variables and are referenced by Tailwind
  classes via the shadcn convention (`bg-primary`, `text-foreground`,
  etc).

---

## Build pipeline

`npm run build` (see `package.json`) runs:

1. Bake scripts that read the live database and write committed JSON
   files used for prerendering (each keeps the old file if the database
   can't be reached): `fetch-data-bundles`, `fetch-bundle-changes`,
   `fetch-hero-slides`, `fetch-sponsors`, `fetch-featured-guides`,
   `fetch-ei-tech` (→ `src/data/eiTechMemes.json`).
2. `vite-react-ssg build` — prerenders every route to `dist/`.
3. `generate-sitemap.mjs` (fails the build if far too few articles came
   back — see DEPLOY_SAFETY.md) and `strip-ads-sponsored.mjs`.

Pages that show data which changes between builds (hero, Ei Tech!, scam
alerts) re-read the database in the browser after mount.

The build is idempotent — same git ref produces the same artefacts.

---

## Testing

There isn't a formal test suite. Lint via `npm run lint` (ESLint).
TypeScript checks happen as part of Vite's build.

When adding tests later, Vitest is the natural choice given Vite is
already in the stack.
