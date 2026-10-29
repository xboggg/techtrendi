// The simple network page's figures, with no React in them, so the server's social image
// (ogSummary.ts -> og_summary.mjs) says exactly what the page says:
//   trustOf     – the one trust level a bundle shows ("! Check first", "≈ Worked out", "✓ On …").
//   sheetGroups – the "All MTN bundles" table's groups, in order.
//   buyRoute    – the big dial card's words (MTN *138# → 1 → 1, Telecel *700#, AT *111*1#).
// The page's parts (src/components/data-bundles/NetworkSimple.tsx) draw these; shared.tsx
// re-exports trustOf, fromAppOnly and dialCodes for the other parts.
import {
  TABLE_SECTIONS, conditionalReason, hasConflict, hasVolume, isConditional, isPending, isUnconfirmed, neverExpires,
  tableRange, tableSection, type Bundle, type BundleModel, type RateSource,
} from "./dataBundles";

/** The dial codes in a text: "Dial *111# then option 4, or *111*4#" -> ["*111#", "*111*4#"]. */
export const dialCodes = (text: string): string[] => [...new Set(text.match(/\*[\d*]+#/g) ?? [])];

/** The one trust level a bundle shows in the main view (the specific reasons are under
 *  "More info", as StatusBadges):
 *    "! Check first"  the network's pages disagree, another page says something different,
 *                     only some customers can buy it, it is new and still being checked, or it
 *                     is only on an old page. A limit on WHO can buy stays visible:
 *                     "! Check first · Some regions only".
 *    "≈ Worked out"   a figure worked out from the network's price per MB.
 *    "✓ On AT's price list"  printed on the network's own price list and checked (it said: ✓ Confirmed). */
export type TrustLevel = "confirmed" | "worked" | "check";
export function trustOf(b: Bundle): { level: TrustLevel; who: string | null } {
  // A change the checker is holding back: "! Check first · price change being checked".
  if (b.held) return { level: "check", who: b.held };
  const r = conditionalReason(b);
  const who = !isConditional(b) ? null : r === "regional" ? "Some regions only" : r === "eligibility" ? "Some groups only" : "Some customers only";
  if (hasConflict(b) || isPending(b) || isUnconfirmed(b) || isConditional(b) || !!(b.otherSource?.summary && b.otherSource.summary.trim())) return { level: "check", who };
  if (b.computed) return { level: "worked", who: null };
  // Figures the checker cannot re-read (an app screenshot, not a web page): check first.
  if (fromAppOnly(b)) return { level: "check", who };
  return { level: "confirmed", who: null };
}
/** True when a bundle's only source is an app capture, not a web page the checker re-reads
 *  (MTN Social, Video and Kokrokoo: "myMTN app (screenshot 17 Oct 2026)"). */
export const fromAppOnly = (b: Bundle) => !b.computed && !!b.source && !/^https:\/\//.test(b.source);

/** A short type name: "Regular data (any amount)" -> "Regular", "Social bundles" -> "Social". */
export const typeName = (family: string) => family.replace(/\s*\(any amount\)\s*$/i, "").replace(/^Regular data$/i, "Regular").replace(/\s+bundles?$/i, "");

/** A pay-any-amount table's name. Two tables of one family (Telecel Flexi: no expiry / with expiry)
 *  take their own label without the network: "Flexi, no expiry". MTN Pulse also gives the name the
 *  myMTN app sells it under (owner, 29 Oct 2026): "Pulse (Mashup)". */
export function sourceName(model: BundleModel, s: RateSource): string {
  const twin = model.sources.some((x) => x !== s && x.network === s.network && x.family === s.family);
  if (s.id === "mtn-pulse" && model.mashup?.name) return `${typeName(s.family)} (${model.mashup.name})`;
  if (!twin) return typeName(s.family);
  const net = model.networkInfo(s.network).name;
  return s.label.startsWith(`${net} `) ? s.label.slice(net.length + 1) : s.label;
}

/** The table's tabs (each with its own colour on the page). */
export type SheetTab = "never" | "time" | "apps" | "other" | "check";
export const TAB_ORDER: SheetTab[] = ["never", "time", "apps", "other", "check"];

/** Which tab (and colour) a bundle belongs to. */
export function tabOf(b: Bundle): SheetTab {
  const s = tableSection(b);
  if (s === "unranked") return "check";
  if (s === "social" || s === "video") return "apps";
  if (s === "night" || s === "morning" || s === "hourly" || s === "restricted") return "time";
  return neverExpires(b) ? "never" : "other";
}

/** A group's tab: its rows' tab when they all agree; a mix (Telecel's Voice & Data Combo: some never
 *  expire, some last 30 days) is "Other", so "Never expires" only ever shows bundles that never expire. */
const groupTab = (rows: Bundle[]): SheetTab => {
  const t = new Set(rows.map(tabOf));
  return t.size === 1 ? tabOf(rows[0]) : "other";
};

/** The sample amounts a pay-any-amount table is listed at (inside its range; its top added). */
const SAMPLES = [0.5, 1, 2, 3, 5, 10, 20, 50, 100, 200, 350];
export function sampleRows(model: BundleModel, s: RateSource): Bundle[] {
  const [lo, hi] = tableRange(s.table);
  const amounts = [...new Set([...SAMPLES.filter((a) => a >= lo - 1e-9 && a <= hi + 1e-9), hi])];
  return amounts.map((a) => model.sourceBundle(s, a)).filter((b): b is Bundle => !!b && hasVolume(b));
}

export interface SheetGroup { id: string; name: string; note: string; tab: SheetTab; rows: Bundle[]; best: Bundle | null; anyAmount: boolean }

/** The table's groups, in order: pay-any-amount tables first (all-day before night), then the fixed
 *  families (by type, then cheapest per GB, as the old list), then everything not ranked. */
export function sheetGroups(model: BundleModel, network: string): SheetGroup[] {
  const groups: SheetGroup[] = [];
  const srcs = model.sources.filter((s) => s.network === network).sort((a, b) => Number(a.kind === "night") - Number(b.kind === "night"));
  for (const s of srcs) {
    const rows = sampleRows(model, s);
    if (!rows.length) continue;
    const [lo, hi] = tableRange(s.table);
    const best = rows.reduce((x, y) => ((model.valueMb(y) ?? 0) > (model.valueMb(x) ?? 0) ? y : x));
    groups.push({ id: s.id, name: sourceName(model, s), note: `Pay any amount, ${model.money(lo)} to ${model.money(hi)}`, tab: groupTab(rows), rows, best, anyAmount: true });
  }
  const fixed = model.bundles.filter((b) => b.network === network);
  const secIdx = (b: Bundle) => TABLE_SECTIONS.findIndex((x) => x.id === tableSection(b));
  const key = (f: string) => {
    const r = fixed.filter((b) => b.family === f);
    return { sec: Math.min(...r.map(secIdx)), cpg: Math.min(...r.map((b) => (hasVolume(b) ? model.costPerGb(b) : Infinity))) };
  };
  const fams = [...new Set(fixed.map((b) => b.family))].sort((a, b) => key(a).sec - key(b).sec || key(a).cpg - key(b).cpg);
  const unranked: Bundle[] = [];
  for (const f of fams) {
    const all = fixed.filter((b) => b.family === f).sort((a, b) => a.price - b.price);
    const rows = all.filter((b) => tabOf(b) !== "check");
    unranked.push(...all.filter((b) => tabOf(b) === "check"));
    if (!rows.length) continue;
    const fb = model.familyBest(network, f)?.bundle ?? null;
    const lengths = new Set(rows.map((b) => model.shortValidity(b)));
    groups.push({ id: `fam-${f}`, name: typeName(f), note: lengths.size === 1 ? model.shortValidity(rows[0]) : "Different lengths, see each row", tab: groupTab(rows), rows, best: fb && rows.includes(fb) ? fb : null, anyAmount: false });
  }
  if (unranked.length) groups.push({ id: "check", name: "Check first", note: "Not ranked: details not clear, or not for everyone", tab: "check", rows: unranked, best: null, anyAmount: false });
  return groups;
}

/** What the buy card says, from the data only (null: no clear route, no card):
 *  1. a pay-any-amount table with its own dial steps (MTN: "*138# → 1 → 1", then type the amount);
 *  2. a pay-any-amount table with "where to buy" codes (Telecel Flexi: *700#, or *110# or the app);
 *  3. no pay-any-amount table (AT): the first never-expiring family sold on ONE code (BigTime Data). */
export function buyRoute(model: BundleModel, network: string): { code: string; steps: string; also: string | null; then: string } | null {
  const srcs = model.sources.filter((x) => x.network === network && x.kind !== "night");
  const range = (s: RateSource) => `${model.money(tableRange(s.table)[0])} to ${model.money(tableRange(s.table)[1])}`;
  const dialed = srcs.find((x) => x.ussd && dialCodes(x.ussd).length);
  if (dialed) {
    return { code: dialCodes(dialed.ussd!)[0], steps: dialed.ussd!.replace(/,?\s+then\s+/g, " → "), also: null, then: `Then type your amount. Any amount from ${range(dialed)}.` };
  }
  const bought = srcs.find((x) => x.buy && dialCodes(x.buy).length);
  if (bought) {
    const code = dialCodes(bought.buy!)[0];
    // "Dial *700# or *110#, or use the Telecel Play app (Telecel's data terms)." -> "Or *110#, or use the Telecel Play app."
    const rest = bought.buy!.replace(/\s*\([^)]*\)\.?\s*$/, "").replace(/\.$/, "").replace(new RegExp(`^Dial\\s+${code.replace(/[*#]/g, "\\$&")}\\s*,?\\s*`), "").trim();
    const twins = srcs.filter((x) => x.family === bought.family);
    const choose = twins.some((x) => x.kind === "noexpiry") && twins.some((x) => x.kind !== "noexpiry") ? ", and choose no expiry or with expiry" : "";
    return { code, steps: code, also: /^or\s/i.test(rest) ? `${rest[0].toUpperCase()}${rest.slice(1)}.` : null, then: `Then type any amount from ${range(bought)}${choose}.` };
  }
  if (srcs.length) return null;
  const g = sheetGroups(model, network).find((x) => x.tab === "never" && !x.anyAmount && x.rows.every((b) => trustOf(b).level !== "check" && !b.altUssd?.code && b.ussd === x.rows[0].ussd));
  const one = g?.rows[0].ussd ? dialCodes(g.rows[0].ussd) : [];
  if (!g || one.length !== 1) return null;
  const prices = g.rows.map((b) => b.price);
  return { code: one[0], steps: one[0], also: null, then: `Then pick a ${g.name} bundle, ${model.money(Math.min(...prices))} to ${model.money(Math.max(...prices))}. They never expire.` };
}
