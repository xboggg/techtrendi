// Prebuild: bake the published Ei Tech! memes (techtrendi.ei_tech_memes, added by the
// Telegram meme desk) into src/data/eiTechMemes.json, so /ei-tech, one page per meme
// and the homepage card are prerendered with them. The pages re-read the table in the
// browser, so a meme published after the build still shows at once.
//
// Reads with the site's public (anon) key, which only sees published memes. If the
// server can't be reached, answers badly or returns nothing, the committed file is
// KEPT and the build carries on. Never exits non-zero.
//
// Run on its own: node scripts/fetch-ei-tech.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = "src/data/eiTechMemes.json";
const TIMEOUT_MS = 10000;
const UA = "Mozilla/5.0 (compatible; TechTrendiSSG/1.0; +https://techtrendi.com) AppleWebKit/537.36";
const COLS = "slug,title,caption,alt,width,height,image_jpg,image_webp,share_image,vote_a_emoji,vote_a_label,vote_b_emoji,vote_b_label,published_at";
const log = (m) => console.log(`[fetch-ei-tech] ${m}`);

function env(name) {
  if (process.env[name]) return process.env[name];
  for (const f of [".env.production", ".env"]) {
    if (!existsSync(f)) continue;
    const line = readFileSync(f, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

const okPath = (p, ext) => typeof p === "string" && new RegExp(`^/[A-Za-z0-9/_.-]+\\.${ext}$`).test(p);

async function run() {
  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) { log("no Supabase URL/key in env. KEPT the committed file."); return; }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const q = `select=${COLS}&status=eq.published&order=published_at.desc&limit=200`;
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/ei_tech_memes?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "techtrendi", Accept: "application/json", "User-Agent": UA },
      signal: ctrl.signal,
    });
    if (!res.ok) { log(`HTTP ${res.status}. KEPT the committed file.`); return; }
    const rows = await res.json();
    const memes = (Array.isArray(rows) ? rows : []).filter((r) =>
      r && /^[a-z0-9-]{1,80}$/.test(r.slug) && r.title && r.caption && okPath(r.image_jpg, "jpg") && okPath(r.image_webp, "webp") && okPath(r.share_image, "jpg"));
    if (!memes.length) { log("no published memes came back. KEPT the committed file."); return; }
    const text = JSON.stringify(memes, null, 1) + "\n";
    if (existsSync(FILE) && readFileSync(FILE, "utf8").replace(/\r\n/g, "\n") === text) { log(`${memes.length} memes, unchanged.`); return; }
    writeFileSync(FILE, text);
    log(`UPDATED ${FILE} (${memes.length} memes).`);
  } catch (e) {
    log(`${e && e.name === "AbortError" ? "timed out" : e && e.message ? e.message : e}. KEPT the committed file.`);
  } finally {
    clearTimeout(timer);
  }
}

run().catch((e) => log(`unexpected error (${e && e.message}). KEPT the committed file.`)).finally(() => process.exit(0));
