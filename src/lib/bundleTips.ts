// Dial-code tips that are NOT bundles (owner, 25 Oct 2026): MTN's *203# (Xtra4U) menu offered one
// customer 3% off. It lives in the data as mtnRates.xtra4u plus its familyInfo text (a family
// described without figures, like Just4U). A tip is shown, never ranked, compared or used in any
// calculation (the model never reads it: no bundle, no rate table). Always "! Check first".
export interface DialTip { network: "mtn"; family: string; text: string; ussd: string; date: string; source: string; discountPct: number | null }

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const USSD = /^\*[0-9*]+#$/;

/** The tip, checked; null when anything is missing or malformed (then nothing is shown). */
export function xtra4uTip(doc: unknown): DialTip | null {
  const d = doc as { mtnRates?: Record<string, unknown>; familyInfo?: Record<string, Record<string, string>> } | null;
  const x = d?.mtnRates?.xtra4u as Record<string, unknown> | undefined;
  if (!x || typeof x !== "object") return null;
  const family = typeof x.family === "string" ? x.family : "";
  const text = family ? d?.familyInfo?.mtn?.[family] : undefined;
  if (!family || typeof text !== "string" || !text.trim()) return null;
  if (typeof x.ussd !== "string" || !USSD.test(x.ussd) || typeof x.date !== "string" || !DATE.test(x.date) || typeof x.source !== "string" || !x.source.trim()) return null;
  const pct = typeof x.discount === "number" && x.discount > 0 && x.discount < 0.5 ? Math.round(x.discount * 100) : null;
  return { network: "mtn", family, text, ussd: x.ussd, date: x.date, source: x.source, discountPct: pct };
}
