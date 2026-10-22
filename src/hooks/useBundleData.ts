// Data bundle dataset for one country, kept fresh.
//
// 1. Renders immediately from the dataset bundled into the build (needed for
//    prerendering, and the fallback whenever anything below fails).
// 2. After mount, fetches the latest row of techtrendi.data_bundle_snapshots
//    for the country: first the static copy the checker publishes on this site
//    (/storage/data-bundles/<country>-latest.json, same origin, so it works on
//    networks that cannot reach db2), then db2 if that file is missing or more
//    than FILE_FRESH_HOURS old (the newer row wins). The page swaps to the row's data only if it passes the
//    schema and partial-scrape checks AND the row's captured_at timestamp is
//    strictly after the bundled data's capturedAt (a date-only value counts
//    as the start of that day, UTC). If the row holds the same figures (as
//    the checker's own hash sees them), the "checked" time AND the
//    verification text move to the row's. A row that differs but is not
//    newer is ignored: the bundled data wins. See resolveSnapshot.
// 3. A failed request (offline, timeout, HTTP error) is retried once after a
//    short delay. If that fails too, the bundled data stays, and the failure
//    is NOT remembered: the next page that mounts tries again. A successful
//    answer (including "no snapshot yet") is shared for the rest of the visit.
//
// Nothing here touches window/document during render; the fetch runs in an
// effect, so it never runs during prerendering.
import { useEffect, useMemo, useState } from "react";
import { createBundleModel, type BundleDataset, type BundleModel } from "@/lib/dataBundles";
import { resolveSnapshot, type Freshness, type SnapshotRow } from "@/lib/bundleSnapshot";
import { DATA_BUNDLE_COUNTRIES, type CountryConfig } from "@/data/dataBundleCountries";
import { bundleFilePath, captureTime, newerRow, rowFromFile } from "@/lib/dataBundleSchema.js";

export type { Freshness, SnapshotRow };

/** checking: the first live attempt has not answered yet (the page shows "Checking prices…"). */
export interface BundleData { country: CountryConfig; model: BundleModel; freshness: Freshness; checking: boolean }

/** How long the status may say "Checking prices…" before it shows the copy it has as saved. */
export const CHECK_TIMEOUT_MS = 6000;
/** A long-open, visible tab re-checks the prices this often. */
export const RECHECK_MS = 15 * 60 * 1000;

/** null row = the request worked but there is no snapshot yet. saved = the answer came from the
 *  offline copy (the worker marks it X-TT-Saved-Copy: 1), not the network. */
type Outcome = { ok: true; row: SnapshotRow | null; saved?: boolean } | { ok: false };
/** The header the offline copy (public/sw-data-bundles.js) puts on anything it serves from its cache. */
export const SAVED_COPY_HEADER = "X-TT-Saved-Copy";

/** Longer than the offline copy's 8 s limit on the prices file (public/sw-data-bundles.js), so
 *  on a slow network the worker's saved copy answers first instead of the page giving up. */
export const TIMEOUT_MS = 10000;
/** The worker's message when a slow network answer for the prices finally arrived and was saved. */
export const PRICES_FRESH_MESSAGE = "tt-db-prices-fresh";
const RETRY_DELAY_MS = 4000;
// Successful answers only, one per country per visit, shared by every page.
const answered = new Map<string, Promise<Outcome>>();

/** Hours after which the site's static file is no longer "fresh enough" on its own: past this,
 *  db2 is asked too and the newer of the two rows is used (2 x the 3-hourly check). */
export const FILE_FRESH_HOURS = 6;

/** The checker's static copy of the latest row, on this site (same origin): works for
 *  visitors whose networks cannot reach db2. An HTML answer (no file: the SPA fallback)
 *  or anything that is not a row counts as a failure. */
function requestFile(country: string): Promise<Outcome> {
  if (typeof fetch === "undefined") return Promise.resolve({ ok: false });
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
  return fetch(bundleFilePath(country), { headers: { Accept: "application/json" }, cache: "no-cache", signal: ctrl?.signal })
    .then(async (r): Promise<Outcome> => {
      if (!r.ok || !/json/i.test(r.headers.get("content-type") ?? "")) return { ok: false };
      const row = rowFromFile(await r.json());
      return row ? { ok: true, row, saved: r.headers.get(SAVED_COPY_HEADER) === "1" } : { ok: false };
    })
    .catch((): Outcome => ({ ok: false }))
    .finally(() => { if (timer) clearTimeout(timer); });
}

/** The file first; db2 only when the file failed or is older than FILE_FRESH_HOURS; the newer
 *  of what came back wins. Every check is applied to the chosen row later (resolveSnapshot). */
async function requestOnce(country: string): Promise<Outcome> {
  const file = await requestFile(country);
  const fileRow = file.ok ? file.row : null;
  const age = fileRow ? (Date.now() - captureTime(fileRow.checked_at ?? fileRow.captured_at)) / 3_600_000 : Infinity;
  if (fileRow && age <= FILE_FRESH_HOURS && !(file.ok && file.saved)) return file;
  const db = await requestDb(country);
  const row = newerRow(fileRow, db.ok ? db.row : null);
  // Only the offline copy answered: say so (the page shows "Saved prices from ...").
  const saved = file.ok && !!file.saved && !(db.ok && db.row && row === db.row);
  return file.ok || db.ok ? { ok: true, row, saved } : { ok: false };
}

function requestDb(country: string): Promise<Outcome> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!url || !key || typeof fetch === "undefined") return Promise.resolve({ ok: true, row: null });
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
  const q = `country=eq.${encodeURIComponent(country)}&order=captured_at.desc&limit=1&select=data,captured_at,checked_at`;
  return fetch(`${url.replace(/\/$/, "")}/rest/v1/data_bundle_snapshots?${q}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "techtrendi", Accept: "application/json" },
    signal: ctrl?.signal,
  })
    .then(async (r): Promise<Outcome> => {
      if (!r.ok) return { ok: false };
      const rows = await r.json();
      return { ok: true, row: Array.isArray(rows) && rows.length ? (rows[0] as SnapshotRow) : null };
    })
    .catch((): Outcome => ({ ok: false }))
    .finally(() => { if (timer) clearTimeout(timer); });
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function fetchLatest(country: string, force = false): Promise<Outcome> {
  if (force) answered.delete(country);
  const cached = answered.get(country);
  if (cached) return cached;
  // Offline: no point waiting to retry.
  const offline = () => typeof navigator !== "undefined" && navigator.onLine === false;
  const p = requestOnce(country).then(async (first) => (first.ok || offline() ? first : wait(RETRY_DELAY_MS).then(() => requestOnce(country))));
  answered.set(country, p);
  // Forget failures so the next mount tries again.
  p.then((o) => { if (!o.ok && answered.get(country) === p) answered.delete(country); });
  return p;
}

export function useBundleData(countryId: string): BundleData | null {
  const country = DATA_BUNDLE_COUNTRIES[countryId] ?? null;
  const [live, setLive] = useState<{ doc: BundleDataset; freshness: Freshness } | null>(null);
  // True once we know the prices on screen are a saved copy: the offline copy answered, or nothing
  // could be fetched at all (then the copy built into the page is what shows).
  const [saved, setSaved] = useState(false);
  // Until the first live attempt answers (or CHECK_TIMEOUT_MS passes), the status is neutral:
  // never green first and then amber (audit 9, L11). Server HTML and first paint show it too.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!country) return;
    let cancelled = false;
    const base = country.dataset;
    // No answer in time: what is on screen is the saved copy; a later answer still updates it.
    const timer = setTimeout(() => { if (!cancelled) { setChecking(false); setSaved(true); } }, CHECK_TIMEOUT_MS);
    const run = (force: boolean) => fetchLatest(country.id, force).then((o) => {
      if (cancelled) return;
      clearTimeout(timer);
      setChecking(false);
      setSaved(!o.ok || !!o.saved);
      if (!o.ok || !o.row || !o.row.data) return;
      const next = resolveSnapshot(base, o.row);
      if (next) setLive(next);
    });
    run(false);
    // A long-open tab re-checks every RECHECK_MS while visible, and as soon as the network is back
    // (so "Saved prices" turns fresh again on its own).
    let last = Date.now();
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible" && Date.now() - last >= RECHECK_MS) { last = Date.now(); run(true); }
    };
    const onOnline = () => { last = Date.now(); run(true); };
    // The worker answered with its saved copy because the network was slow; the network's answer
    // has now arrived: check again (the worker serves it from the network, or the fresh copy).
    const onWorker = (e: MessageEvent) => { if (e.data?.type === PRICES_FRESH_MESSAGE) { last = Date.now(); run(true); } };
    const sw = typeof navigator !== "undefined" && "serviceWorker" in navigator ? navigator.serviceWorker : null;
    const iv = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("online", onOnline);
    sw?.addEventListener("message", onWorker);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(iv);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("online", onOnline);
      sw?.removeEventListener("message", onWorker);
    };
  }, [country]);

  const doc = live?.doc ?? country?.dataset ?? null;
  const model = useMemo(() => (doc && country ? createBundleModel(doc, { currency: country.currency }) : null), [doc, country]);
  if (!country || !model) return null;
  const shown: Freshness = live?.freshness ?? {
    capturedAt: country.dataset.capturedAt,
    checkedAt: country.dataset.checkedAt ?? country.dataset.capturedAt,
    source: "bundled",
  };
  const freshness: Freshness = saved ? { ...shown, source: "saved" } : shown;
  return { country, model, freshness, checking };
}
