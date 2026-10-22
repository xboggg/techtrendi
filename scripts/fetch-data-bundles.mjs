// Prebuild: pull the latest verified data bundle snapshot into the repo.
//
// Wired via package.json "build" before vite-react-ssg, so a build can ship
// newer figures in src/data/ghanaDataBundles.json (which the pages prerender
// from and fall back to).
//
// Reads the latest row from the static copy the checker publishes on the site
// (https://techtrendi.com/storage/data-bundles/<country>-latest.json, the row exactly
// as the database gives it; DATA_BUNDLES_FILE_BASE overrides the origin, empty = skip)
// AND techtrendi.data_bundle_snapshots through PostgREST with the site's public
// (anon) key; the newer of the two rows is used. The committed file is only REPLACED when the snapshot
//   1. passes the schema checks,
//   2. passes the partial-scrape check against the committed file, and
//   3. was captured strictly after the committed file: the row's captured_at
//      timestamp is compared with the committed capturedAt (a date-only
//      value counts as the start of that day, UTC), so a price change
//      captured later on the same day is picked up, and
//   4. is not dated in the future beyond ordinary clock skew (MAX_FUTURE_MS,
//      10 minutes, the SAME constant and test the browser uses: a row's
//      captured_at / checked_at or its data's capturedAt / checkedAt beyond
//      now + 10 min is a clock or data error and would win every "strictly
//      newer" test until that date).
// A snapshot with the same content (compared as the checker hashes it:
// capturedAt, checkedAt and verification ignored) changes nothing. A snapshot
// that differs but is not strictly newer is ignored (the committed file
// wins), with a warning, because it would roll the figures back.
//
// Freshness ("prices checked ...") is NOT written into the committed file:
// the page reads checked_at from the snapshot at runtime. Writing it here on
// every build would only create git noise. Any checkedAt already in the
// snapshot data is stripped before writing.
//
// If the server is unreachable or anything fails, the committed file is KEPT
// and the build carries on. This script never exits non-zero.
//
// Run on its own: node scripts/fetch-data-bundles.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { validateDataset, compareToBaseline, contentKey, isStrictlyNewer, futureDate, MAX_FUTURE_MS, bundleFilePath, rowFromFile, newerRow } from "../src/lib/dataBundleSchema.js";

const TARGETS = [{ country: "ghana", file: "src/data/ghanaDataBundles.json" }];
const TIMEOUT_MS = 10000;
const log = (m) => console.log(`[fetch-data-bundles] ${m}`);
// "Now" for the future-date guard. FETCH_BUNDLES_NOW (an ISO time) exists only so the test
// suite can run the guard at a fixed time; a build never sets it.
const NOW = (() => { const t = Date.parse(process.env.FETCH_BUNDLES_NOW ?? ""); return Number.isFinite(t) ? t : Date.now(); })();

function env(name) {
  if (process.env[name]) return process.env[name];
  for (const f of [".env.production", ".env"]) {
    if (!existsSync(f)) continue;
    const line = readFileSync(f, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

async function latest(url, key, country) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const q = `country=eq.${encodeURIComponent(country)}&order=captured_at.desc&limit=1&select=data,captured_at,checked_at`;
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/data_bundle_snapshots?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "techtrendi", Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) { log(`${country}: HTTP ${res.status} from the snapshot table. KEPT the committed file.`); return null; }
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) { log(`${country}: no snapshot in the table yet. KEPT the committed file.`); return null; }
    return rows[0];
  } finally {
    clearTimeout(timer);
  }
}

const FILE_BASE = process.env.DATA_BUNDLES_FILE_BASE ?? "https://techtrendi.com";

async function latestFile(country) {
  if (!FILE_BASE) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const where = `${FILE_BASE.replace(/\/$/, "")}${bundleFilePath(country)}`;
  try {
    const res = await fetch(where, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; TechTrendi-prebuild)" }, signal: ctrl.signal });
    if (!res.ok) { log(`${country}: HTTP ${res.status} from ${where}.`); return null; }
    if (!/json/i.test(res.headers.get("content-type") ?? "")) { log(`${country}: ${where} is not JSON.`); return null; }
    const row = rowFromFile(await res.json());
    if (!row) log(`${country}: ${where} is not a snapshot row.`);
    return row;
  } catch (e) {
    log(`${country}: ${where}: ${e && e.name === "AbortError" ? "timed out" : e && e.message ? e.message : e}.`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function latestDb(url, key, country) {
  if (!url || !key) { log(`${country}: no Supabase URL/key in env; database not asked.`); return null; }
  try { return await latest(url, key, country); } catch (e) { log(`${country}: database: ${e && e.name === "AbortError" ? "timed out" : e && e.message ? e.message : e}.`); return null; }
}

async function run() {
  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  for (const { country, file } of TARGETS) {
    try {
      const text = readFileSync(file, "utf8");
      const current = JSON.parse(text);
      const fromFile = await latestFile(country);
      const fromDb = await latestDb(url, key, country);
      const row = newerRow(fromFile, fromDb);
      if (!row || !row.data) { log(`${country}: no snapshot from the site's file or the database. KEPT the committed file.`); continue; }
      log(`${country}: using the row from ${row === fromFile ? "the site's static file" : "the database"}.`);
      const { checkedAt: _drop, ...doc } = row.data;
      const where = `snapshot captured ${doc.capturedAt} (row ${row.captured_at}, checked ${row.checked_at ?? "never"}) vs committed ${current.capturedAt}`;
      if (contentKey(doc) === contentKey(current)) {
        log(`${country}: ${where}: same content. Nothing to do (freshness is read at runtime).`);
        continue;
      }
      const future = futureDate({ captured_at: row.captured_at, checked_at: row.checked_at, data: row.data }, NOW);
      if (future !== null) { log(`${country}: ${where}: dated in the FUTURE (${future}, more than ${MAX_FUTURE_MS / 60_000} minutes ahead). KEPT the committed file.`); continue; }
      const v = validateDataset(doc);
      if (!v.ok) { log(`${country}: ${where}: FAILED the schema checks (${v.errors.slice(0, 3).join("; ")}). KEPT the committed file.`); continue; }
      const c = compareToBaseline(doc, current);
      if (!c.ok) { log(`${country}: ${where}: looks like a PARTIAL scrape (${c.errors.join("; ")}). KEPT the committed file.`); continue; }
      if (!isStrictlyNewer({ captured_at: row.captured_at, data: doc }, current)) {
        log(`${country}: WARNING ${where}: content DIFFERS but the snapshot is not strictly newer. KEPT the committed file (it would roll figures back). Re-run the checker so the snapshot matches the committed data.`);
        continue;
      }
      const eol = text.includes("\r\n") ? "\r\n" : "\n";
      writeFileSync(file, JSON.stringify(doc, null, 1).replace(/\n/g, eol) + eol);
      log(`${country}: ${where}: newer and valid. UPDATED ${file} (${doc.bundles.length} bundles). Review and commit it.`);
    } catch (e) {
      log(`${country}: ${e && e.name === "AbortError" ? "timed out" : e && e.message ? e.message : e}. KEPT the committed file.`);
    }
  }
}

run().catch((e) => log(`unexpected error (${e && e.message}). KEPT the committed files.`)).finally(() => process.exit(0));
