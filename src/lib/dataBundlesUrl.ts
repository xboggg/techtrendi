// The data bundle page's state in its URL, so a link shows the same answer:
//   ?amount=5&gb=10&often=1         (finder amount, planner GB a month, planner "how often")
//   &noexp=1&night=1&lasts=7|30     (finder toggles, only when on)
// Read once on load (client), validated and clamped; written with history.replaceState on
// every change, so the back button is not filled with steps. Pure and dependency-free, so
// the Node test suite runs it directly.

export interface PageState {
  amount: number;
  gb: number;
  often: number;
  noExpiryOnly: boolean;
  night: boolean;
  minDays: 0 | 7 | 30;
}

/** Defaults: GH¢5 (owner, 22 Oct 2026; it was GH¢20), 10 GB a month, "Once" (owner, 18-19 Oct 2026). */
export const DEFAULT_STATE: PageState = { amount: 5, gb: 10, often: 1, noExpiryOnly: false, night: false, minDays: 0 };
export const AMOUNT_MAX = 1000;
export const OFTEN_MAX = 12;

/** The planner's GB steps (MonthlyPlanner STEPS): a URL value snaps to the nearest one. */
export const GB_STEPS = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300];

const num = (s: string | null) => {
  if (s === null || !/^\s*\d+(\.\d+)?\s*$/.test(s)) return NaN;
  return parseFloat(s);
};

/** The page state a query string asks for: anything missing or invalid falls back to the
 *  default; numbers are clamped to what the page offers (amount GH¢0.01-1,000 in whole
 *  pesewas, GB to the nearest planner step, how often 1-12). */
export function parseState(search: string): PageState {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const out: PageState = { ...DEFAULT_STATE };
  const a = num(q.get("amount"));
  if (Number.isFinite(a) && a > 0) out.amount = Math.min(AMOUNT_MAX, Math.max(0.01, Math.round(a * 100) / 100));
  const g = num(q.get("gb"));
  if (Number.isFinite(g) && g > 0) out.gb = GB_STEPS.reduce((best, s) => (Math.abs(s - g) < Math.abs(best - g) ? s : best), GB_STEPS[0]);
  const o = num(q.get("often"));
  if (Number.isFinite(o) && o >= 1) out.often = Math.min(OFTEN_MAX, Math.max(1, Math.round(o)));
  out.noExpiryOnly = q.get("noexp") === "1";
  out.night = q.get("night") === "1";
  const l = q.get("lasts");
  out.minDays = l === "7" ? 7 : l === "30" ? 30 : 0;
  return out;
}

/** The query string for a page state (amount, gb and often always; toggles only when on). */
export function buildQuery(s: PageState): string {
  const q = new URLSearchParams();
  q.set("amount", String(Math.round(s.amount * 100) / 100));
  q.set("gb", String(s.gb));
  q.set("often", String(s.often));
  if (s.noExpiryOnly) q.set("noexp", "1");
  if (s.night) q.set("night", "1");
  if (s.minDays) q.set("lasts", String(s.minDays));
  return `?${q.toString()}`;
}

export const sameState = (a: PageState, b: PageState) =>
  a.amount === b.amount && a.gb === b.gb && a.often === b.often && a.noExpiryOnly === b.noExpiryOnly && a.night === b.night && a.minDays === b.minDays;

/** Remove these query keys from the current URL (history.replaceState; other keys and the hash
 *  stay). Browser only. Used when the finder's box is empty, so no old amount stays in the URL. */
export function clearQueryKeys(keys: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!keys.some((k) => url.searchParams.has(k))) return;
    for (const k of keys) url.searchParams.delete(k);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  } catch { /* never break the page over the URL */ }
}

/** Merge part of the state into the current URL with history.replaceState (no new history
 *  entry). Keeps every other query parameter and the hash. Browser only. */
export function writeState(patch: Partial<PageState>): void {
  if (typeof window === "undefined") return;
  try {
    const cur = parseState(window.location.search);
    const next = { ...cur, ...patch };
    if (sameState(cur, next)) return;
    const url = new URL(window.location.href);
    const mine = new URLSearchParams(buildQuery(next).slice(1));
    for (const k of ["amount", "gb", "often", "noexp", "night", "lasts"]) url.searchParams.delete(k);
    mine.forEach((v, k) => url.searchParams.set(k, v));
    const target = `${url.pathname}${url.search}${url.hash}`;
    if (target !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, "", target);
    }
  } catch { /* never break the page over the URL */ }
}
