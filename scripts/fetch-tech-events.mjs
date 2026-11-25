// Prebuild: bake the live tech events (techtrendi.tech_events, filled every 6 hours by
// /opt/tech-news/tech_events/sync.py) into src/data/techEvents.json, so /tech-events and one
// page per event are prerendered with them. The pages re-read the table in the browser, so an
// event found after the build still shows at once.
//
// Keeps events that ended up to 120 days ago (their pages stay up, marked "ended") and every
// upcoming one. Reads with the site's public (anon) key, which only sees status = 'live'.
// If the server can't be reached, answers badly or returns nothing, the committed file is KEPT
// and the build carries on. Never exits non-zero.
//
// Run on its own: node scripts/fetch-tech-events.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = "src/data/techEvents.json";
const TIMEOUT_MS = 15000;
const KEEP_PAST_DAYS = 120;
const UA = "Mozilla/5.0 (compatible; TechTrendiSSG/1.0; +https://techtrendi.com) AppleWebKit/537.36";
export const COLS = "slug,title,starts_on,ends_on,start_time,end_time,timezone,city,country_code,country,region,venue,format,kind,topics,summary,event_url,source,source_url,is_free,sold_out,going,host,featured,first_seen";
const log = (m) => console.log(`[fetch-tech-events] ${m}`);

function env(name) {
  if (process.env[name]) return process.env[name];
  for (const f of [".env.production", ".env"]) {
    if (!existsSync(f)) continue;
    const line = readFileSync(f, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const URL_OK = (u) => u == null || (typeof u === "string" && /^https?:\/\/[^\s"'<>]+$/.test(u));
const valid = (r) => r && /^[a-z0-9-]{3,100}$/.test(r.slug) && typeof r.title === "string" && r.title.length > 1 &&
  DAY.test(r.starts_on) && DAY.test(r.ends_on) && /^[A-Z]{2}$/.test(r.country_code) && URL_OK(r.event_url) && URL_OK(r.source_url);

async function run() {
  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) { log("no Supabase URL/key in env. KEPT the committed file."); return; }
  const since = new Date(Date.now() - KEEP_PAST_DAYS * 864e5).toISOString().slice(0, 10);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const q = `select=${COLS}&ends_on=gte.${since}&order=starts_on.asc,slug.asc&limit=1000`;
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/tech_events?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "techtrendi", Accept: "application/json", "User-Agent": UA },
      signal: ctrl.signal,
    });
    if (!res.ok) { log(`HTTP ${res.status}. KEPT the committed file.`); return; }
    const rows = await res.json();
    const events = (Array.isArray(rows) ? rows : []).filter(valid);
    if (!events.length) { log("no events came back. KEPT the committed file."); return; }
    const today = new Date().toISOString().slice(0, 10);
    const old = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : null;
    if (old && JSON.stringify(old.events) === JSON.stringify(events)) { log(`${events.length} events, unchanged.`); return; }
    writeFileSync(FILE, JSON.stringify({ generated_on: today, events }, null, 1) + "\n");
    log(`UPDATED ${FILE} (${events.length} events).`);
  } catch (e) {
    log(`${e && e.name === "AbortError" ? "timed out" : e && e.message ? e.message : e}. KEPT the committed file.`);
  } finally {
    clearTimeout(timer);
  }
}

run().catch((e) => log(`unexpected error (${e && e.message}). KEPT the committed file.`)).finally(() => process.exit(0));
