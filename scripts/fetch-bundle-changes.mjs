// Prebuild: pull the latest "real changes" file into the repo (23 Oct 2026), so the prerendered
// data bundle pages already carry the "What changed" strip (no layout shift when the page's own
// fetch of the same file arrives). Runs after fetch-data-bundles.mjs in "npm run build".
//
// Reads https://techtrendi.com/storage/data-bundles/<country>-changes.json (DATA_BUNDLES_FILE_BASE
// overrides the origin; empty = skip). The committed file is only replaced by a file that passes
// the same basic checks the page makes (version 1, a list of changes with valid dates, nothing
// dated in the future beyond 36 hours of clock skew) and is not older than the committed one.
// Anything else (offline, a bad file) keeps the committed file. Never exits non-zero.
//
// Run on its own: node scripts/fetch-bundle-changes.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const TARGETS = [{ country: "ghana", file: "src/data/ghanaDataBundleChanges.json" }];
const TIMEOUT_MS = 10000;
const FUTURE_MS = 36 * 3_600_000;
const KINDS = ["price_down", "price_up", "more_data", "less_data", "validity", "new", "retired"];
const log = (m) => console.log(`[fetch-bundle-changes] ${m}`);
const NOW = (() => { const t = Date.parse(process.env.FETCH_BUNDLES_NOW ?? ""); return Number.isFinite(t) ? t : Date.now(); })();
const base = process.env.DATA_BUNDLES_FILE_BASE ?? "https://techtrendi.com";

const day = (d) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? Date.parse(`${d}T00:00:00Z`) : NaN);
export function okChanges(o, now = NOW) {
  if (!o || typeof o !== "object" || o.v !== 1 || !Array.isArray(o.changes)) return false;
  const gen = Date.parse(o.generatedAt);
  if (!Number.isFinite(gen) || gen > now + FUTURE_MS || !Number.isFinite(day(o.start))) return false;
  return o.changes.every((c) => c && Number.isFinite(day(c.date)) && day(c.date) <= now + FUTURE_MS && day(c.date) >= day(o.start) &&
    typeof c.network === "string" && typeof c.name === "string" && typeof c.family === "string" && KINDS.includes(c.kind) && Array.isArray(c.rows) && c.rows.length === 2);
}

async function main() {
  if (!base) { log("DATA_BUNDLES_FILE_BASE is empty: skipped"); return; }
  for (const { country, file } of TARGETS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const r = await fetch(`${base.replace(/\/$/, "")}/storage/data-bundles/${country}-changes.json`, { headers: { Accept: "application/json" }, signal: ctrl.signal }).finally(() => clearTimeout(timer));
      if (!r.ok) { log(`${country}: HTTP ${r.status}, kept the committed file`); continue; }
      const o = await r.json();
      if (!okChanges(o)) { log(`${country}: the file failed the checks, kept the committed file`); continue; }
      const cur = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
      if (cur && okChanges(cur) && Date.parse(cur.generatedAt) > Date.parse(o.generatedAt)) { log(`${country}: older than the committed file, kept it`); continue; }
      const text = JSON.stringify(o) + "\n";
      if (cur && JSON.stringify(cur) + "\n" === text) { log(`${country}: unchanged`); continue; }
      writeFileSync(file, text);
      log(`${country}: wrote ${file} (${o.changes.length} changes, generated ${o.generatedAt})`);
    } catch (e) {
      log(`${country}: ${e && e.name === "AbortError" ? "timed out" : String(e && e.message || e)}; kept the committed file`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
