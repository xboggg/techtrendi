// Prebuild: bake the homepage guide cards (the 8 newest published articles, the same list
// fetchFeaturedGuides in src/pages/Index.tsx loads) into src/data/featured-guides.json, so
// the prerendered homepage shows the current guides and their pictures on first paint.
// Until 3 Nov 2026 this file was a hand-made copy from March whose pictures pointed to a
// storage bucket that no longer exists (broken images for Google and first-time visitors).
//
// Dates are left out ON PURPOSE: the cards show "x days ago", which would differ between
// the build day and the visitor's day and break hydration. The page re-reads the list in
// the browser and adds the dates then.
//
// Reads with the site's public (anon) key, which only sees published articles. If the
// server can't be reached, answers badly or returns nothing, the committed file is KEPT
// and the build carries on. Never exits non-zero.
//
// Run on its own: node scripts/fetch-featured-guides.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = "src/data/featured-guides.json";
const TIMEOUT_MS = 10000;
const log = (m) => console.log(`[fetch-featured-guides] ${m}`);

function env(name) {
  if (process.env[name]) return process.env[name];
  for (const f of [".env.production", ".env"]) {
    if (!existsSync(f)) continue;
    const line = readFileSync(f, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

const okSlug = (s) => typeof s === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
const okUrl = (u) => typeof u === "string" && /^(\/|https:\/\/)[^\s"'()\\]+$/.test(u);
const str = (v) => (typeof v === "string" ? v : null);

async function run() {
  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) { log("no Supabase URL/key in env. KEPT the committed file."); return; }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const q = "select=id,title,slug,excerpt,category,cover_image,read_time_minutes&is_published=eq.true&order=created_at.desc&limit=8";
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/articles?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "techtrendi", Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) { log(`HTTP ${res.status}. KEPT the committed file.`); return; }
    const rows = await res.json();
    const guides = (Array.isArray(rows) ? rows : []).filter((r) => r && okSlug(r.slug) && typeof r.title === "string" && r.title).map((r) => ({
      id: String(r.id),
      title: r.title,
      slug: r.slug,
      excerpt: str(r.excerpt),
      category: str(r.category) ?? "",
      cover_image: okUrl(r.cover_image) ? r.cover_image : null,
      read_time_minutes: Number.isFinite(Number(r.read_time_minutes)) && r.read_time_minutes !== null ? Number(r.read_time_minutes) : null,
    }));
    if (!guides.length) { log("no published articles. KEPT the committed file."); return; }
    const text = JSON.stringify(guides, null, 1) + "\n";
    if (existsSync(FILE) && readFileSync(FILE, "utf8").replace(/\r\n/g, "\n") === text) { log(`${guides.length} guides, unchanged.`); return; }
    writeFileSync(FILE, text);
    log(`UPDATED ${FILE} (${guides.length} guides).`);
  } catch (e) {
    log(`${e && e.name === "AbortError" ? "timed out" : e && e.message ? e.message : e}. KEPT the committed file.`);
  } finally {
    clearTimeout(timer);
  }
}

run().catch((e) => log(`unexpected error (${e && e.message}). KEPT the committed file.`)).finally(() => process.exit(0));
