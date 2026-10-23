// Real price changes and price history for the data bundle pages (owner, 23 Oct 2026).
//
// The checker (tech-news data_bundles/history.py) publishes two small static files next to the
// prices file, same origin:
//   /storage/data-bundles/<country>-changes.json  real changes, newest first, last 60 days
//   /storage/data-bundles/<country>-history.json  per bundle, distinct [date, price, mb, days] points
// Only real changes are in them (price, data, validity in days, new, retired); curation, wording
// and renames never are. The history starts at the first comparable row (18 Oct 2026).
//
// Pure and dependency-free (apart from the model's own formatters), so the Node test suite runs it.
// Every input is checked: a file that is malformed, from another version, or dated in the future
// is ignored (the page then shows nothing about changes, never a wrong line).
import type { Bundle, BundleModel, NetworkId } from "./dataBundles";

export type ChangeKind = "price_down" | "price_up" | "more_data" | "less_data" | "validity" | "new" | "retired";
export const CHANGE_KINDS: ChangeKind[] = ["price_down", "price_up", "more_data", "less_data", "validity", "new", "retired"];
export interface ChangePoint { price: number | null; mb: number | null; days: number | null }
export interface Change {
  date: string; network: NetworkId; family: string; name: string; kind: ChangeKind;
  old: ChangePoint | null; new: ChangePoint | null; rows: [number, number];
}
export interface ChangesDoc { v: 1; start: string; startRow: number; latestRow: number; generatedAt: string; changes: Change[] }
/** [date, price, mb, days] */
export type HistoryPoint = [string, number | null, number | null, number | null];
export interface HistoryDoc { v: 1; start: string; startRow: number; latestRow: number; generatedAt: string; bundles: Record<string, HistoryPoint[]>; retired: Record<string, string> }

export const changesFilePath = (country: string) => `/storage/data-bundles/${country}-changes.json`;
export const historyFilePath = (country: string) => `/storage/data-bundles/${country}-history.json`;

/** The strip shows changes from the last STRIP_DAYS days; "See all changes" the last ALL_DAYS. */
export const STRIP_DAYS = 7;
export const ALL_DAYS = 30;
/** A file may be at most this far ahead of the reader's clock (clock skew), never more. */
const FUTURE_SLACK_MS = 36 * 3_600_000;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const numOrNull = (x: unknown) => x === null || (isNum(x) && x >= 0);
const dayMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
const validDate = (d: unknown): d is string => typeof d === "string" && DATE.test(d) && Number.isFinite(dayMs(d));

/** The bundle's key in the history file (its identity: network, family, name). */
export const historyKey = (b: Pick<Bundle, "network" | "family" | "name">) => `${b.network}|${b.family}|${b.name}`;

function head(raw: unknown, now: Date): { start: string; startRow: number; latestRow: number; generatedAt: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1 || !validDate(o.start) || !isNum(o.startRow) || !isNum(o.latestRow) || typeof o.generatedAt !== "string") return null;
  const gen = Date.parse(o.generatedAt);
  if (!Number.isFinite(gen) || gen > now.getTime() + FUTURE_SLACK_MS) return null;
  if (dayMs(o.start) > now.getTime() + FUTURE_SLACK_MS) return null;
  return { start: o.start, startRow: o.startRow, latestRow: o.latestRow, generatedAt: o.generatedAt };
}

const point = (x: unknown): ChangePoint | null | undefined => {
  if (x === null) return null;
  if (!x || typeof x !== "object") return undefined;
  const p = x as Record<string, unknown>;
  if (!numOrNull(p.price) || !numOrNull(p.mb) || !numOrNull(p.days)) return undefined;
  return { price: p.price as number | null, mb: p.mb as number | null, days: p.days as number | null };
};

/** The changes file, checked; null when anything is wrong (wrong version, a date in the future,
 *  a change that does not make sense for its kind). */
export function parseChanges(raw: unknown, now: Date): ChangesDoc | null {
  const h = head(raw, now);
  if (!h) return null;
  const list = (raw as { changes?: unknown }).changes;
  if (!Array.isArray(list)) return null;
  const out: Change[] = [];
  for (const c of list) {
    if (!c || typeof c !== "object") return null;
    const x = c as Record<string, unknown>;
    if (!validDate(x.date) || dayMs(x.date) > now.getTime() + FUTURE_SLACK_MS || dayMs(x.date) < dayMs(h.start)) return null;
    if (typeof x.network !== "string" || typeof x.name !== "string" || !x.name.trim() || typeof x.family !== "string") return null;
    if (!CHANGE_KINDS.includes(x.kind as ChangeKind)) return null;
    const o = point(x.old), n = point(x.new);
    if (o === undefined || n === undefined) return null;
    const kind = x.kind as ChangeKind;
    if (kind === "new" ? !n || o !== null : kind === "retired" ? !o || n !== null : !o || !n) return null;
    if ((kind === "price_down" || kind === "price_up") && !(isNum(o!.price) && isNum(n!.price) && (kind === "price_down" ? n!.price < o!.price : n!.price > o!.price))) return null;
    if ((kind === "more_data" || kind === "less_data") && !(isNum(o!.mb) && isNum(n!.mb) && (kind === "more_data" ? n!.mb > o!.mb : n!.mb < o!.mb))) return null;
    if (kind === "validity" && !(isNum(o!.days) && isNum(n!.days) && o!.days !== n!.days)) return null;
    const rows = Array.isArray(x.rows) && x.rows.length === 2 && x.rows.every(isNum) ? (x.rows as [number, number]) : null;
    if (!rows) return null;
    out.push({ date: x.date, network: x.network, family: x.family, name: x.name, kind, old: o, new: n, rows });
  }
  out.sort((a, b) => (a.date === b.date ? b.rows[1] - a.rows[1] : a.date < b.date ? 1 : -1));
  return { v: 1, ...h, changes: out };
}

/** The history file, checked; null when anything is wrong. */
export function parseHistory(raw: unknown, now: Date): HistoryDoc | null {
  const h = head(raw, now);
  if (!h) return null;
  const o = raw as { bundles?: unknown; retired?: unknown };
  if (!o.bundles || typeof o.bundles !== "object" || Array.isArray(o.bundles)) return null;
  const bundles: Record<string, HistoryPoint[]> = {};
  for (const [k, s] of Object.entries(o.bundles as Record<string, unknown>)) {
    if (!Array.isArray(s) || !s.length) return null;
    let prev = "";
    for (const p of s) {
      if (!Array.isArray(p) || p.length !== 4 || !validDate(p[0]) || !numOrNull(p[1]) || !numOrNull(p[2]) || !numOrNull(p[3])) return null;
      if (dayMs(p[0]) > now.getTime() + FUTURE_SLACK_MS || dayMs(p[0]) < dayMs(h.start) || p[0] < prev) return null;
      prev = p[0];
    }
    bundles[k] = s as HistoryPoint[];
  }
  const retired: Record<string, string> = {};
  if (o.retired && typeof o.retired === "object") for (const [k, d] of Object.entries(o.retired as Record<string, unknown>)) if (validDate(d)) retired[k] = d;
  return { v: 1, ...h, bundles, retired };
}

/** "21 Oct" (UTC = Ghana time). */
export function dayLabel(d: string): string {
  const t = new Date(dayMs(d));
  return `${t.getUTCDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][t.getUTCMonth()]}`;
}
/** "18 Oct 2026". */
export const dayLabelYear = (d: string) => `${dayLabel(d)} ${d.slice(0, 4)}`;

/** Changes from the last `days` days (today counts as day 1), optionally one network only. */
export function recentChanges(doc: ChangesDoc | null, now: Date, days: number, network?: string): Change[] {
  if (!doc) return [];
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const from = today - (days - 1) * 86_400_000;
  return doc.changes.filter((c) => dayMs(c.date) >= from && dayMs(c.date) <= today + 86_400_000 && (!network || c.network === network));
}

const daysText = (d: number) => (d === 1 ? "1 day" : `${d} days`);

/** One plain line for a change (no date): "Telecel ended 1.45GB Special". Figures from the model. */
export function changeLine(model: BundleModel, c: Change): string {
  const net = model.networkInfo(c.network)?.name ?? c.network;
  const money = (n: number | null) => (n === null ? "" : model.money(n));
  const data = (mb: number | null) => (mb === null ? "" : model.fmtData(mb, c.network));
  switch (c.kind) {
    case "price_down": return `${net} cut the price of ${c.name}: ${money(c.old!.price)} → ${money(c.new!.price)}`;
    case "price_up": return `${net} raised the price of ${c.name}: ${money(c.old!.price)} → ${money(c.new!.price)}`;
    case "more_data": return `${net} gives more data on ${c.name}: ${data(c.old!.mb)} → ${data(c.new!.mb)}`;
    case "less_data": return `${net} cut the data on ${c.name}: ${data(c.old!.mb)} → ${data(c.new!.mb)}`;
    case "validity": return `${net} changed how long ${c.name} lasts: ${daysText(c.old!.days!)} → ${daysText(c.new!.days!)}`;
    case "new": return `${net} added ${c.name}${c.new!.price !== null ? ` (${money(c.new!.price)}${c.new!.mb !== null ? `, ${data(c.new!.mb)}` : ""})` : ""}`;
    case "retired": return `${net} ended ${c.name}`;
  }
}

export interface ChangeGroup { date: string; network: NetworkId; kind: ChangeKind; family: string; items: Change[]; text: string }

/** The strip's lines: changes on the same day, network, kind and family are one line
 *  ("Telecel ended 3 Special offer bundles"); a single change keeps its own line. Newest first. */
export function groupChanges(model: BundleModel, list: Change[]): ChangeGroup[] {
  const out: ChangeGroup[] = [];
  for (const c of list) {
    const g = out.find((x) => x.date === c.date && x.network === c.network && x.kind === c.kind && x.family === c.family);
    if (g) g.items.push(c);
    else out.push({ date: c.date, network: c.network, kind: c.kind, family: c.family, items: [c], text: "" });
  }
  for (const g of out) {
    const net = model.networkInfo(g.network)?.name ?? g.network;
    const n = g.items.length;
    const what = `${n} ${g.family} bundles`;
    g.text = n === 1 ? changeLine(model, g.items[0]) : ({
      price_down: `${net} cut the price of ${what}`,
      price_up: `${net} raised the price of ${what}`,
      more_data: `${net} gives more data on ${what}`,
      less_data: `${net} cut the data on ${what}`,
      validity: `${net} changed how long ${what} last`,
      new: `${net} added ${what}`,
      retired: `${net} ended ${what}`,
    } as Record<ChangeKind, string>)[g.kind];
  }
  return out;
}

/** The price-history line for one bundle (More info). null when the file has no series for it
 *  (worked-out pay-any-amount prices, or a bundle newer than the file). */
export interface HistoryView { unchanged: boolean; since: string; text: string; points: HistoryPoint[] }
export function historyView(model: BundleModel, doc: HistoryDoc | null, b: Bundle): HistoryView | null {
  if (!doc || b.computed) return null;
  const s = doc.bundles[historyKey(b)];
  if (!s || !s.length) return null;
  const since = dayLabel(doc.start);
  const first = s[0], last = s[s.length - 1];
  // A series that does not end at today's figures is out of date: say nothing rather than mislead.
  if (!(last[1] === null || Math.abs(last[1] - b.price) < 0.005) || !(last[2] === null || b.mb === null || Math.abs(last[2] - b.mb) < 0.01)) return null;
  if (s.length === 1) return { unchanged: true, since, text: `Price since ${since}: unchanged`, points: s };
  const parts: string[] = [];
  if (first[1] !== last[1] && first[1] !== null && last[1] !== null) parts.push(`price ${model.money(first[1])} → ${model.money(last[1])}`);
  if (first[2] !== last[2] && first[2] !== null && last[2] !== null) parts.push(`data ${model.fmtData(first[2], b.network)} → ${model.fmtData(last[2], b.network)}`);
  if (first[3] !== last[3] && first[3] !== null && last[3] !== null) parts.push(`${daysText(first[3])} → ${daysText(last[3])}`);
  return { unchanged: false, since, text: `Since ${since}: ${parts.join(", ") || "changed, then back"}`, points: s };
}

// ------------------------------------------------------------------ deal posts (admin only)

export interface DealPost { id: string; kind: "price_drop" | "new_value" | "new_winner" | "weekly"; title: string; text: string; amount: number; link: string; date: string }

export const SITE_URL = "https://techtrendi.com";

/** The link a post carries: the comparison page opened at the amount. */
export const dealLink = (basePath: string, amount: number) => `${SITE_URL}${basePath}?amount=${encodeURIComponent(String(Math.round(amount * 100) / 100))}`;

/** The amount a post links to: the bundle's price (a pay-any-amount range: where it starts). */
const amountOf = (b: Bundle) => (b.band && !b.band.exact ? b.band.from : b.price);

function bundleLine(model: BundleModel, b: Bundle): string {
  const net = model.networkInfo(b.network)?.name ?? b.network;
  const dial = b.ussd ? ` Dial ${b.ussd}.` : "";
  const name = model.nameNoPrice(b);
  // "Telecel Flexi, no expiry" already names its network: never "Telecel Telecel ...".
  return `${name.startsWith(net) ? name : `${net} ${name}`}: ${model.leadText(b)}, ${model.shortValidity(b)}.${dial}`;
}

/** WhatsApp channel posts, made from the real changes and the live model (owner, 23 Oct 2026).
 *  Nothing is posted by itself: the admin copies or opens WhatsApp. Plain words; never
 *  "GH¢10 gets/buys"; single bundles only (no mixes). `checked`: the prices' check time. */
export function dealPosts(model: BundleModel, changes: ChangesDoc | null, now: Date, checked: string, basePath: string): DealPost[] {
  const out: DealPost[] = [];
  const day = (d: string) => dayLabel(d.slice(0, 10));
  const checkedLine = `Checked ${day(checked)}.`;
  const recent = recentChanges(changes, now, STRIP_DAYS);
  const find = (c: Change) => model.bundles.find((b) => historyKey(b) === `${c.network}|${c.family}|${c.name}`) ?? null;
  const winners = (["small", "allday"] as const).map((g) => ({ g, b: model.leaderboardRows(g).ranked[0]?.bundle ?? null }));
  const label = (g: string) => (g === "small" ? "Small buys (up to GH¢20)" : "Any price");

  for (const c of recent) {
    const b = find(c);
    if (!b) continue;
    const net = model.networkInfo(c.network)?.name ?? c.network;
    if (c.kind === "price_down" || c.kind === "more_data") {
      const what = c.kind === "price_down" ? `${model.money(c.old!.price!)} → ${model.money(c.new!.price!)}` : `${model.fmtData(c.old!.mb!, c.network)} → ${model.fmtData(c.new!.mb!, c.network)}`;
      out.push({ id: `${c.kind}:${c.date}:${historyKey(b)}`, kind: "price_drop", date: c.date, amount: amountOf(b),
        title: `${net}: ${c.kind === "price_down" ? "price cut" : "more data"} (${day(c.date)})`,
        text: [`📉 ${net} ${c.kind === "price_down" ? "cut a price" : "added data"} (${day(c.date)})`, "", bundleLine(model, b), `Was: ${what}.`, "", checkedLine, `Compare all networks: ${dealLink(basePath, amountOf(b))}`].join("\n"),
        link: dealLink(basePath, amountOf(b)) });
    }
    if (c.kind === "new") {
      // A new bundle is news when it beats the best value in its own board today.
      const v = model.valueMb(b) ?? 0;
      const beats = winners.some((w) => w.b && w.b !== b && v >= (model.valueMb(w.b) ?? 0) - 1e-9);
      if (!beats) continue;
      out.push({ id: `new:${c.date}:${historyKey(b)}`, kind: "new_value", date: c.date, amount: amountOf(b),
        title: `${net}: new bundle with top value (${day(c.date)})`,
        text: [`🆕 New on ${net} (${day(c.date)})`, "", bundleLine(model, b), `Value: ${model.valueText(b)} per ${model.money(model.valueStep)}.`, "", checkedLine, `Compare all networks: ${dealLink(basePath, amountOf(b))}`].join("\n"),
        link: dealLink(basePath, amountOf(b)) });
    }
  }
  // A new winner: today's best in Small buys or Any price is a bundle that changed this week
  // (a cut, more data or new), so the change put it on top.
  for (const w of winners) {
    if (!w.b) continue;
    const c = recent.find((x) => (x.kind === "price_down" || x.kind === "more_data" || x.kind === "new") && `${x.network}|${x.family}|${x.name}` === historyKey(w.b!));
    if (!c) continue;
    out.push({ id: `winner:${w.g}:${c.date}:${historyKey(w.b)}`, kind: "new_winner", date: c.date, amount: amountOf(w.b),
      title: `New best value: ${label(w.g)} (${day(c.date)})`,
      text: [`🏆 New best value in ${label(w.g)}`, "", bundleLine(model, w.b), `Value: ${model.valueText(w.b)} per ${model.money(model.valueStep)}.`, "", checkedLine, `Compare all networks: ${dealLink(basePath, amountOf(w.b))}`].join("\n"),
      link: dealLink(basePath, amountOf(w.b)) });
  }
  // The weekly post: this week's Monday (Ghana time = UTC).
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)));
  const mon = monday.toISOString().slice(0, 10);
  const lines = winners.filter((w) => w.b).map((w) => `• ${label(w.g)}: ${bundleLine(model, w.b!)}`);
  const ne = model.leaderboardRows("noexpiry").ranked[0]?.bundle;
  if (ne) lines.push(`• Never expires: ${bundleLine(model, ne)}`);
  const first = winners[0].b ?? winners[1].b;
  if (lines.length && first) {
    out.push({ id: `weekly:${mon}`, kind: "weekly", date: mon, amount: amountOf(first),
      title: `Best data deals this week (Monday ${day(mon)})`,
      text: [`📶 Best data deals this week (${day(mon)})`, "", ...lines, "", checkedLine, `Compare all networks: ${dealLink(basePath, amountOf(first))}`].join("\n"),
      link: dealLink(basePath, amountOf(first)) });
  }
  return out;
}

/** wa.me link that opens WhatsApp with the text ready to send (the admin picks the channel). */
export const whatsappLink = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
