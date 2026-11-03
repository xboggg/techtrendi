// Prebuild: bake the sponsor ads (techtrendi.sponsors, managed in /admin/sponsors and
// by each owner at /my-ad) into src/data/sponsors.json. The build uses it to create one
// /sponsored/<slug> page per active ad and to place the "Sponsored" cards, so the
// prerendered pages show the current ads. The landing page re-reads its row in the
// browser, so wording edits show to visitors at once; new/removed ads and card
// changes appear on the next build (daily, or on every deploy).
//
// Reads with the site's public (anon) key, which only sees ads that are switched on.
// If the server can't be reached or answers badly, the committed file is KEPT and the
// build carries on. An empty answer is trusted (all ads switched off). Never exits non-zero.
//
// Run on its own: node scripts/fetch-sponsors.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = "src/data/sponsors.json";
const TIMEOUT_MS = 10000;
const log = (m) => console.log(`[fetch-sponsors] ${m}`);

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

async function run() {
  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) { log("no Supabase URL/key in env. KEPT the committed file."); return; }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const q = "select=slug,active,show_on,content&active=eq.true&order=sort_order.asc,slug.asc";
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/sponsors?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "techtrendi", Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) { log(`HTTP ${res.status}. KEPT the committed file.`); return; }
    const rows = await res.json();
    if (!Array.isArray(rows)) { log("unexpected answer. KEPT the committed file."); return; }
    const ads = rows
      .filter((r) => r && okSlug(r.slug) && r.content && typeof r.content === "object" && typeof r.content.name === "string")
      .map((r) => ({ slug: r.slug, active: true, show_on: Array.isArray(r.show_on) ? r.show_on.filter((p) => typeof p === "string") : [], content: r.content }));
    const text = JSON.stringify(ads, null, 1) + "\n";
    if (existsSync(FILE) && readFileSync(FILE, "utf8").replace(/\r\n/g, "\n") === text) { log(`${ads.length} ads, unchanged.`); return; }
    writeFileSync(FILE, text);
    log(`UPDATED ${FILE} (${ads.length} ads).`);
  } catch (e) {
    log(`${e && e.name === "AbortError" ? "timed out" : e && e.message ? e.message : e}. KEPT the committed file.`);
  } finally {
    clearTimeout(timer);
  }
}

run().catch((e) => log(`unexpected error (${e && e.message}). KEPT the committed file.`)).finally(() => process.exit(0));
