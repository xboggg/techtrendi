# Adding content

This guide is written for **non-coders**. Each section is one
"I want to add a thing" task with the exact place to edit.

If you're a developer, the patterns are obvious — feel free to skim.

**Before any of these:** open a terminal in the project folder and run
`git pull` first. After your edit, the deploy command at the bottom
ships it live.

---

## 1. Publish a new article

Articles are stored in the Supabase database, not in the codebase. You
have two ways to add one:

### Option A — Admin UI (no terminal)

1. Go to <https://techtrendi.com/admin> and sign in.
2. Use the publishing form to create the article.
3. Save. The article goes live within minutes (depending on Cloudflare
   cache).

### Option B — Helper script (terminal)

For bulk publishing or when the admin UI is unavailable:

```bash
npm run publish:articles
```

This runs `scripts/publish-articles.mjs` which reads queued articles
and posts them via the Supabase API. See the script for the exact
input format it expects.

### Refresh published articles

If you've edited articles in Supabase Studio (db2.techtrendi.com) and
want them re-prerendered at deploy time:

```bash
npm run refresh
```

This runs `scripts/refresh-articles.cjs` then `npm run build`.

---

## 2. Update the homepage hero / featured articles

The homepage hero section is usually a React component in
`src/pages/Home.tsx` or `src/components/Hero.tsx` (or similar — check
the actual file structure). Edit the JSX directly, save, deploy.

If the featured articles are pulled from a Supabase table (e.g.
`featured_articles`), update the rows in Supabase Studio. No code
change needed.

---

## 3. Update the About page or footer text

Static text typically lives in:

- `src/pages/About.tsx` — about-page body
- `src/components/Footer.tsx` — site-wide footer

Open the file, edit the text inside the JSX, save, deploy.

---

## 4. Add a new page that doesn't need a login

1. Create the component at `src/pages/MyNewPage.tsx`. Copy
   `src/pages/About.tsx` as a starting skeleton.
2. Open the router config (usually in `src/App.tsx`).
3. Add a `<Route path="/my-new-page" element={<MyNewPage />} />` to
   the route table.
4. If you want search engines to find the new page, add it to the
   sitemap (`public/sitemap.xml`).
5. Deploy.

---

## 5. Update emergency contact / external links

External links are scattered through page components. Use the global
search in your editor to find a specific URL and replace it. Common
places:

- `src/components/Footer.tsx` — social, contact, legal links
- `src/pages/About.tsx` — partner / press links
- `src/components/Header.tsx` — main nav

---

## 6. Update the Privacy Policy or Terms

If these pages exist as static React routes (e.g. `src/pages/Privacy.tsx`
and `src/pages/Terms.tsx`), edit them directly.

When you change either document, update the "Last updated" date at the
top — auditors and readers look at this.

---

## 7. Change the favicon, OG image, or PWA icon

Replace the files in `public/`:

- `public/favicon.ico` — browser tab icon
- `public/og-image.png` (and .svg if present) — social media preview
- `public/icons/*.png` — PWA / mobile home-screen icons

After replacing, deploy. Cloudflare may cache the old images for some
time — purge the CF cache for the affected URLs if it matters
immediately.

---

## 8. Update environment variables (Supabase URL, etc.)

The Supabase URL and anon key are typically read from `.env` (which is
**not** committed to git). To change them:

1. Locally: edit `.env.local`.
2. On the server (for the build pipeline that runs there, if any):
   edit the appropriate env file referenced in the build command.

For a static site, env vars are baked in at build time — change them,
then rebuild and redeploy.

---

## The deploy command (after any change above)

From the project root on your laptop:

```bash
git add -A
git commit -m "short summary of what you changed"
git push
```

That's it. GitHub Actions auto-builds and ships to the server in ~50
seconds. Watch progress at
<https://github.com/xboggg/trenditrendi/actions>.

Then **purge the Cloudflare cache** if you need the change visible to
all visitors immediately (Cloudflare dashboard →
techtrendi.com → Caching → Purge Everything).

**No npm, no tar, no scp.** Push is the only step.

If GitHub Actions is ever down and you need to deploy urgently, use the
legacy `deploy.sh` at the project root — it does the same thing
locally.

For the full deploy + rollback variant with backup, see
[OPERATIONS.md](OPERATIONS.md).
