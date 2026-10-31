// Prebuild: bake the homepage hero pictures (techtrendi.hero_slides, managed in
// /admin/hero-images) into src/data/heroSlides.json, so the prerendered homepage
// shows the current pictures on first paint. The page re-reads the table in the
// browser, so this only decides the first paint.
//
// Reads with the site's public (anon) key, which only sees pictures that are
// switched on. If the server can't be reached, answers badly or has no
// pictures, the committed file is KEPT and the build carries on. Never exits non-zero.
//
// Run on its own: node scripts/fetch-hero-slides.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = "src/data/heroSlides.json";
const TIMEOUT_MS = 10000;
const log = (m) => console.log(`[fetch-hero-slides] ${m}`);

function env(name) {
  if (process.env[name]) return process.env[name];
  for (const f of [".env.production", ".env"]) {
    if (!existsSync(f)) continue;
    const line = readFileSync(f, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

// Same rule as cleanHeroSlides in src/lib/heroSlides.ts.
const okUrl = (u) => typeof u === "string" && /^(\/|https:\/\/)[^\s"'()\\]+$/.test(u);
const pct = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 50; };

async function run() {
  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) { log("no Supabase URL/key in env. KEPT the committed file."); return; }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const q = "select=image_url,phone_image_url,alt,focus_x,focus_y&is_active=eq.true&order=sort_order.asc";
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/hero_slides?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "techtrendi", Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) { log(`HTTP ${res.status}. KEPT the committed file.`); return; }
    const rows = await res.json();
    const slides = (Array.isArray(rows) ? rows : []).filter((r) => r && okUrl(r.image_url)).map((r) => ({
      image_url: r.image_url,
      phone_image_url: okUrl(r.phone_image_url) ? r.phone_image_url : null,
      alt: typeof r.alt === "string" ? r.alt : "",
      focus_x: pct(r.focus_x),
      focus_y: pct(r.focus_y),
    }));
    if (!slides.length) { log("no pictures switched on. KEPT the committed file."); return; }
    const text = JSON.stringify(slides, null, 1) + "\n";
    if (existsSync(FILE) && readFileSync(FILE, "utf8").replace(/\r\n/g, "\n") === text) { log(`${slides.length} pictures, unchanged.`); return; }
    writeFileSync(FILE, text);
    log(`UPDATED ${FILE} (${slides.length} pictures).`);
  } catch (e) {
    log(`${e && e.name === "AbortError" ? "timed out" : e && e.message ? e.message : e}. KEPT the committed file.`);
  } finally {
    clearTimeout(timer);
  }
}

run().catch((e) => log(`unexpected error (${e && e.message}). KEPT the committed file.`)).finally(() => process.exit(0));
