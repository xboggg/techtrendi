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

Routes are defined in [`src/App.tsx`](../src/App.tsx) (or the dedicated
router file referenced from there). Most pages are public — there is no
authenticated user flow on the published site itself. The admin panel
(article publishing, etc.) is at `/admin` and authenticates against
Supabase.

When adding a route:

1. Create the component in `src/pages/`.
2. Register it in the route table.
3. If the route should be pre-rendered for SEO, ensure the build script
   picks it up — see `scripts/publish-articles.mjs` for the pre-render
   pattern used for article URLs.

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

`npm run build` runs:

1. `vite build` — outputs to `dist/`.
2. (If configured) prerender script that pulls published articles from
   Supabase and writes per-article HTML files.

The build is idempotent — same git ref produces the same artefacts.

---

## Testing

There isn't a formal test suite. Lint via `npm run lint` (ESLint).
TypeScript checks happen as part of Vite's build.

When adding tests later, Vitest is the natural choice given Vite is
already in the stack.
