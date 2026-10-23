// The changes and price-history files (src/lib/bundleChanges.ts), fetched same-origin.
//   - useBundleChanges: the changes file, once per page view, after mount (the server HTML and the
//     first paint never show the strip, so nothing differs at hydration).
//   - loadHistory: the history file, only when a "More info" with a price-history line opens;
//     one request per page view, shared by every line.
// Any failure (offline with no saved copy, a malformed file, a date in the future) gives null:
// the page then says nothing about changes.
import { useEffect, useState } from "react";
import { changesFilePath, historyFilePath, parseChanges, parseHistory, type ChangesDoc, type HistoryDoc } from "@/lib/bundleChanges";

const TIMEOUT_MS = 10000;
const historyP = new Map<string, Promise<HistoryDoc | null>>();

/** undefined: no answer (offline, timeout, HTTP error); BAD: an answer that is not JSON. */
const BAD = Symbol("bad");
function getJson(url: string): Promise<unknown> {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
  return fetch(url, { headers: { Accept: "application/json" }, cache: "no-cache", signal: ctrl?.signal })
    .then((r) => (!r.ok ? undefined : r.text().then((t) => { try { return JSON.parse(t); } catch { return BAD; } })))
    .catch(() => undefined)
    .finally(() => { if (timer) clearTimeout(timer); });
}

/** The live changes file: "ok" (checked), "bad" (it answered, but malformed or dated in the
 *  future: say nothing at all) or "none" (no answer: the build's copy may stand in). */
export type ChangesState = { status: "ok"; doc: ChangesDoc } | { status: "bad" | "none"; doc: null };
const changesS = new Map<string, Promise<ChangesState>>();

export function loadChanges(country: string): Promise<ChangesState> {
  let p = changesS.get(country);
  if (!p) {
    p = getJson(changesFilePath(country)).then((raw): ChangesState => {
      if (raw === undefined) return { status: "none", doc: null };
      const doc = raw === BAD ? null : parseChanges(raw, new Date());
      return doc ? { status: "ok", doc } : { status: "bad", doc: null };
    });
    changesS.set(country, p);
    p.then((d) => { if (d.status === "none") changesS.delete(country); });
  }
  return p;
}

export function loadHistory(country: string): Promise<HistoryDoc | null> {
  let p = historyP.get(country);
  if (!p) {
    p = getJson(historyFilePath(country)).then((raw) => (raw === undefined || raw === BAD ? null : parseHistory(raw, new Date())));
    historyP.set(country, p);
    p.then((d) => { if (!d) historyP.delete(country); });
  }
  return p;
}

export function useBundleChanges(country: string): ChangesState | null {
  const [st, setSt] = useState<ChangesState | null>(null);
  useEffect(() => {
    let live = true;
    loadChanges(country).then((d) => { if (live) setSt(d); });
    return () => { live = false; };
  }, [country]);
  return st;
}
