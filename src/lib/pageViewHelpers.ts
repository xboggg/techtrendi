// Small pure helpers for the page-view tracker (usePageView), so the Node test suite can test them.
//   - The visitor's approximate location (ipapi.co) is looked up at most once a day per visitor
//     (cached in localStorage for GEO_TTL_MS) and only after the visitor accepted analytics
//     cookies in the cookie banner (localStorage "cookie-consent", analytics: true).
//   - "Not a bounce" is sent once per session (the first time a second page is seen), not on
//     every later page.
//   - A route is recorded once: the same path again within SAME_VIEW_MS (a remount of the
//     tracker, a duplicate effect) is not a new view.
// Every storage access is wrapped: blocked storage (private mode) simply means no cache.

export const GEO_KEY = "tt_geo";
export const GEO_TTL_MS = 24 * 3_600_000;
export const CONSENT_KEY = "cookie-consent";
export const BOUNCE_KEY = "tt_bounce_cleared";
export const SAME_VIEW_MS = 2000;

export interface Geo { country: string | null; city: string | null }
type Store = Pick<Storage, "getItem" | "setItem"> | null | undefined;

/** The cached location if it is younger than GEO_TTL_MS, else null. */
export function readGeo(store: Store, now: number): Geo | null {
  try {
    const raw = store?.getItem(GEO_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o.at !== "number" || now - o.at > GEO_TTL_MS || now < o.at - 60_000) return null;
    const s = (x: unknown) => (typeof x === "string" && x.trim() ? x.trim().slice(0, 100) : null);
    return { country: s(o.country), city: s(o.city) };
  } catch {
    return null;
  }
}

/** Keep the location for a day (also an empty answer, so a failing lookup is not retried on every page). */
export function writeGeo(store: Store, geo: Geo, now: number): void {
  try { store?.setItem(GEO_KEY, JSON.stringify({ country: geo.country, city: geo.city, at: now })); } catch { /* storage blocked */ }
}

/** True only when the cookie banner recorded analytics consent. */
export function hasAnalyticsConsent(store: Store): boolean {
  try {
    const raw = store?.getItem(CONSENT_KEY);
    if (!raw) return false;
    return JSON.parse(raw)?.analytics === true;
  } catch {
    return false;
  }
}

/** True the first time a session reaches its second page (then never again in that session). */
export function takeBounceClear(session: Store, pageCount: number): boolean {
  if (pageCount < 2) return false;
  try {
    if (session?.getItem(BOUNCE_KEY)) return false;
    session?.setItem(BOUNCE_KEY, "1");
    return true;
  } catch {
    return true;
  }
}

/** Whether this route change is a new view (not the same path recorded a moment ago). */
export function isNewView(last: { path: string; at: number } | null, path: string, now: number): boolean {
  return !last || last.path !== path || now - last.at > SAME_VIEW_MS;
}
