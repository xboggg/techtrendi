// Shared building blocks for the data bundle dashboards.
// SSR-safe: nothing here reads window/document at module scope or in render.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "framer-motion";
import { AlertTriangle, Calculator, Check, ChevronDown, Clock, Copy, ExternalLink, Hourglass, Info, Lock, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate, type LinkProps } from "react-router-dom";
import { DATA_BUNDLES_BASE, DATA_BUNDLES_OFFLINE, DATA_BUNDLES_PAGES as DATA_BUNDLE_PAGES, DATA_BUNDLES_SW, DATA_BUNDLES_SW_URLS } from "@/data/dataBundlesRoute";
import { bundleFilePath } from "@/lib/dataBundleSchema.js";
import { changesFilePath, historyFilePath } from "@/lib/bundleChanges";
import { hasVolume, conditionalReason, dialText, hasConflict, isConditional, isPending, isTimeRestricted, isUnconfirmed, normaliseAmountText, type Bundle, type BundleModel, type Kind, type NetworkInfo } from "@/lib/dataBundles";

export const glass =
  "rounded-2xl border border-black/5 bg-white/75 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none";

export const KIND_LABEL: Record<Kind, string> = {
  anytime: "All-day",
  noexpiry: "Never expires",
  night: "Night only",
  hourly: "1 hour",
  morning: "Morning only",
  family: "Family (share it)",
  combo: "Calls + data",
  social: "Social apps only",
  video: "Video apps only",
  unlimited: "Unlimited",
  weekend: "Certain days only",
  restricted: "Some days or hours only",
};

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance([r, g, b]: [number, number, number]) {
  const f = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a: [number, number, number], b: [number, number, number]) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const fillCache = new Map<string, string>();
/** The network colour, darkened or lightened just enough (if at all) for its
 *  ink to reach WCAG AA (4.5:1) on it. Used wherever text sits on the colour. */
export function textSafeFill(info: NetworkInfo): string {
  const key = info.color + info.ink;
  const hit = fillCache.get(key);
  if (hit) return hit;
  const ink = hexToRgb(info.ink);
  let c = hexToRgb(info.color);
  const towards = luminance(ink) > 0.5 ? 0 : 255;
  for (let i = 0; i < 20 && contrast(c, ink) < 4.5; i++) c = c.map((v) => Math.round(v + (towards - v) * 0.06)) as [number, number, number];
  const out = `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  fillCache.set(key, out);
  return out;
}

/** Network colour chip. Text uses the network's own ink colour (dark on MTN yellow). */
export function NetPill({ info, className, children }: { info: NetworkInfo; className?: string; children?: ReactNode }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide", className)}
      style={{ background: textSafeFill(info), color: info.ink }}
    >
      {children ?? info.name}
    </span>
  );
}

/** "Worked out from MTN's prices": a figure the network does not print, worked out from its
 *  price per MB for that amount (the full wording, e.g. "Computed from MTN's published rate",
 *  is in the bundle's computedLabel). */
export function workedOutText(model: BundleModel, b: Pick<Bundle, "network">): string {
  return `Exact, from ${model.networkInfo(b.network)?.name ?? b.network}'s official per-MB rates`;
}

export function ComputedBadge({ label = "Exact, from MTN's official per-MB rates" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-medium text-sky-800 dark:text-sky-200">
      <Calculator className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

export function KindBadge({ kind }: { kind: Kind }) {
  const tone: Record<Kind, string> = {
    anytime: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30",
    noexpiry: "bg-violet-500/10 text-violet-800 dark:text-violet-200 border-violet-500/30",
    night: "bg-indigo-500/10 text-indigo-800 dark:text-indigo-200 border-indigo-500/30",
    hourly: "bg-orange-500/10 text-orange-800 dark:text-orange-200 border-orange-500/30",
    morning: "bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/30",
    family: "bg-pink-500/10 text-pink-800 dark:text-pink-200 border-pink-500/30",
    combo: "bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 border-cyan-500/30",
    social: "bg-slate-500/10 text-slate-800 dark:text-slate-200 border-slate-500/30",
    video: "bg-slate-500/10 text-slate-800 dark:text-slate-200 border-slate-500/30",
    unlimited: "bg-fuchsia-500/10 text-fuchsia-800 dark:text-fuchsia-200 border-fuchsia-500/30",
    weekend: "bg-orange-500/10 text-orange-800 dark:text-orange-200 border-orange-500/30",
    restricted: "bg-orange-500/10 text-orange-800 dark:text-orange-200 border-orange-500/30",
  };
  const fallback = "bg-slate-500/10 text-slate-800 dark:text-slate-200 border-slate-500/30";
  return <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[15px] lg:text-base font-medium", tone[kind] ?? fallback)}>{KIND_LABEL[kind] ?? kind}</span>;
}

/** How long a figure takes to roll from its old value to a new one (seconds). */
export const ROLL_SECONDS = 0.35;

/** For plain whole-number COUNTS only (number of bundles, of families). Shows the final
 *  value at once: on the server, on load, and whenever it scrolls into view, however fast,
 *  so nobody ever sees 0 or a half-counted number. Only when the value CHANGES while on
 *  screen (fresher data) does it roll quickly (ROLL_SECONDS) from the old value to the new
 *  one, never from 0; under reduced motion it changes at once. */
export function CountUp({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [inFlight, setInFlight] = useState<{ n: number; target: number } | null>(null);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value || reduce !== false) return;
    const c = animate(from, value, { duration: ROLL_SECONDS, ease: "easeOut", onUpdate: (n) => setInFlight({ n, target: value }), onComplete: () => setInFlight(null) });
    return () => { c.stop(); setInFlight(null); };
  }, [value, reduce]);
  const text = inFlight && inFlight.target === value && reduce === false ? format(inFlight.n) : format(value);
  return (
    // The final figure for screen readers as hidden text (aria-label is not allowed on a plain span).
    <span ref={ref} className={cn("tabular-nums", className)}>
      <span aria-hidden>{text}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

/** Section heading. `info` is the section's explanation, behind an ⓘ only (never in the main view). */
export function SectionHeading({ id, eyebrow, title, children, icon, info }: { id?: string; eyebrow?: string; title: string; children?: ReactNode; icon?: ReactNode; info?: ReactNode }) {
  return (
    <div className="mb-5 md:mb-6">
      {eyebrow && (
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {icon}
          {eyebrow}
        </p>
      )}
      <h2 id={id} className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
      {info && <Details summary="What this means" className="mt-0.5">{info}</Details>}
      {children && <div className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">{children}</div>}
    </div>
  );
}

/** Current time, only after mount (null during prerender and hydration). */
export function useNow(intervalMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The one date style of these pages: "5 May 2026", "12 Sep 2023" (UTC), the same
 *  as the dataset's own text (browsers differ on "Sep" vs "Sept", so no locale call). */
export function fmtDate(s: string): string {
  const d = new Date(DATE_ONLY.test(s) ? `${s}T00:00:00Z` : s);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "3 hours ago" for timestamps; day-level wording for date-only values. */
export function timeAgo(s: string, now: Date): string {
  const t = Date.parse(DATE_ONLY.test(s) ? `${s}T00:00:00Z` : s);
  if (Number.isNaN(t)) return s;
  if (DATE_ONLY.test(s)) {
    const days = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - t) / 86_400_000);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    return `${days} days ago`;
  }
  const mins = Math.max(0, Math.round((now.getTime() - t) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return `${Math.round(hrs / 24)} days ago`;
}

/** Hours since a check. Date-only values count from the start of that day,
 *  so the stale warning errs on the side of showing. */
/** When a check happened, in Ghana time (GMT = UTC, all year): "today, 4:17 PM GMT",
 *  "yesterday, 10:17 PM GMT", else "18 Oct, 4:17 PM GMT". A date-only value gives the day alone. */
export function checkedClock(s: string, now: Date): string {
  const t = Date.parse(DATE_ONLY.test(s) ? `${s}T00:00:00Z` : s);
  if (Number.isNaN(t)) return s;
  const d = new Date(t);
  const day = (x: Date) => Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  const dayText = diff === 0 ? "today" : diff === 1 ? "yesterday" : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  if (DATE_ONLY.test(s)) return dayText;
  return `${dayText}, ${clockGmt(d)}`;
}

/** "5:17 PM GMT": the clock in Ghana time (GMT = UTC+0 all year), always saying which clock. */
export function clockGmt(d: Date): string {
  const h = d.getUTCHours(), m = d.getUTCMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"} GMT`;
}

/** The full date and time for a <time> title: "Sunday 25 Oct 2026, 5:17 PM GMT" (date only: no clock). */
export function fullStamp(s: string): string {
  const t = Date.parse(DATE_ONLY.test(s) ? `${s}T00:00:00Z` : s);
  if (Number.isNaN(t)) return s;
  const d = new Date(t);
  const day = `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return DATE_ONLY.test(s) ? day : `${day}, ${clockGmt(d)}`;
}

/** "19 Oct, 11:09 PM GMT" (Ghana time = UTC): when a saved copy was checked. */
export function savedStamp(s: string): string {
  const t = Date.parse(DATE_ONLY.test(s) ? `${s}T00:00:00Z` : s);
  if (Number.isNaN(t)) return s;
  const d = new Date(t);
  const day = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  if (DATE_ONLY.test(s)) return day;
  return `${day}, ${clockGmt(d)}`;
}

export function hoursSince(s: string, now: Date): number {
  const t = Date.parse(DATE_ONLY.test(s) ? `${s}T00:00:00Z` : s);
  return Number.isNaN(t) ? Infinity : (now.getTime() - t) / 3_600_000;
}

/** One-line description of how long a bundle lasts, as published. */
export function lastsText(b: Bundle): string {
  return b.validity;
}

/** Minutes/SMS extras for combo bundles, written out. */
export function extrasText(b: Bundle): string | null {
  const e = b.extras;
  if (!e) return null;
  const parts: string[] = [];
  if (e.onNetMins) parts.push(`${e.onNetMins.toLocaleString("en-GB")} on-net mins`);
  if (e.allNetMins) parts.push(`${e.allNetMins.toLocaleString("en-GB")} all-net mins`);
  if (e.sms) parts.push(`${e.sms.toLocaleString("en-GB")} SMS`);
  if (typeof e.airtime === "number" && e.airtime > 0) parts.push(`GH¢${e.airtime.toLocaleString("en-GB")} bonus airtime`);
  return parts.length ? parts.join(" · ") : null;
}

/** How to buy: the bundle's code, plus any other code the operator prints for it (altUssd). */
export function ussdText(b: Bundle): string | null {
  if (!b.ussd && !b.altUssd?.code) return null;
  // "Dial *110# or use the Telecel Play app": a code gets "Dial", an app "use" (dialText).
  if (!b.altUssd?.code) return dialText(b.ussd!);
  if (!b.ussd) return dialText(b.altUssd.code);
  return `${dialText(b.ussd)}, or ${b.altUssd.code}${b.altUssd.label ? ` (${b.altUssd.label})` : ""}`;
}

/** Another page of the same operator describes this bundle differently: its
 *  version, in the dataset's own words, beside the figures used. */
export function OtherSourceNote({ b, className }: { b: Bundle; className?: string }) {
  const o = b.otherSource;
  if (!o || typeof o.summary !== "string" || !o.summary.trim()) return null;
  return (
    <p role="note" className={cn("flex items-start gap-1.5 rounded-lg border border-sky-500/40 bg-sky-50 p-2 text-xs text-sky-950 dark:bg-sky-500/10 dark:text-sky-100", className)}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="min-w-0">
        {o.summary}
        {/* On its own line, so a long label never wraps from mid-line with a ragged indent on phones. */}
        {o.url && /^https:\/\//.test(o.url) && <a className="flex min-h-11 w-fit items-center underline underline-offset-2 md:min-h-6" href={o.url} target="_blank" rel="noopener noreferrer">{o.label ?? "Source"}<span className="sr-only">, opens in a new tab</span></a>}
      </span>
    </p>
  );
}

/** Price per GB using the bundle's own network GB (MTN: 1,024 MB). */
export const perGb = (model: BundleModel, b: Pick<Bundle, "price" | "mb" | "network">) => model.perGbText(b);

export function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-semibold text-amber-900 dark:text-amber-200">
      <Hourglass className="h-3 w-3" aria-hidden /> New, still checking
    </span>
  );
}

/** Why only some customers can buy it, from the data: personalised (offered to
 *  some accounts), regional (only in the regions the network lists) or
 *  eligibility (only for a registered group, e.g. MTN AFA farmers). */
export function ConditionalBadge({ reason }: { reason?: string | null }) {
  const regional = reason === "regional";
  const text = regional ? "Some regions only" : reason === "eligibility" ? "Some groups only" : "Some customers only";
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-medium text-amber-900 dark:text-amber-200">
      {regional ? <MapPin className="h-3 w-3" aria-hidden /> : <Lock className="h-3 w-3" aria-hidden />} {text}
    </span>
  );
}

export function UnconfirmedBadge({ asOf }: { asOf?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-semibold text-amber-900 dark:text-amber-200">
      <Hourglass className="h-3 w-3" aria-hidden /> Not confirmed{asOf ? ` (old page, ${fmtDate(asOf)})` : " (old page)"}
    </span>
  );
}

export function RestrictedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-semibold text-orange-900 dark:text-orange-200">
      <Clock className="h-3 w-3" aria-hidden /> Some days or hours only
    </span>
  );
}

/** The network's own pages give different figures: said calmly, with who to ask. */
export function ConflictBadge({ who = "the network" }: { who?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-semibold text-red-800 dark:text-red-200">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Details not clear – check with {who}
    </span>
  );
}

const humanKey = (k: string) => k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
const asText = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : typeof v === "number" ? String(v) : null);
const isUrlText = (v: string | null): v is string => !!v && /^https:\/\//.test(v);

/** One claim inside a conflict: { label, says, url, updated } or similar. */
function Claim({ o }: { o: Record<string, unknown> }) {
  const label = asText(o.label) ?? asText(o.name) ?? asText(o.source);
  const says = asText(o.says) ?? asText(o.text) ?? asText(o.value) ?? asText(o.figure);
  const url = asText(o.url) ?? (isUrlText(asText(o.source)) ? asText(o.source) : null);
  const updated = asText(o.updated) ?? asText(o.updatedAt);
  return (
    <>
      {label && <b>{label}{updated ? ` (updated ${fmtDate(updated)})` : ""}: </b>}
      {says ?? "see source"}
      {isUrlText(url) && <> (<a className="inline-flex min-h-11 items-center underline underline-offset-2 md:min-h-6" href={url} target="_blank" rel="noopener noreferrer">source<span className="sr-only">, opens in a new tab</span></a>)</>}
    </>
  );
}

/** The dataset's own description of a conflict, written out as given. */
export function ConflictNote({ b, className }: { b: Bundle; className?: string }) {
  if (!hasConflict(b)) return null;
  const c = b.conflict as Record<string, unknown>;
  const lead = asText(c.summary) ?? asText(c.note) ?? asText(c.detail) ?? asText(c.description);
  const items: { key: string; node: ReactNode }[] = [];
  for (const [k, v] of Object.entries(c)) {
    if (["summary", "note", "detail", "description"].includes(k)) continue;
    if (Array.isArray(v)) v.forEach((x, i) => { if (x && typeof x === "object") items.push({ key: `${k}-${i}`, node: <Claim o={x as Record<string, unknown>} /> }); });
    else if (v && typeof v === "object") items.push({ key: k, node: <><b>{humanKey(k)}: </b><Claim o={v as Record<string, unknown>} /></> });
    else if (asText(v)) items.push({ key: k, node: <><b>{humanKey(k) === "Used" ? "What we show" : humanKey(k)}:</b> {asText(v)}</> });
  }
  return (
    <div role="note" className={cn("rounded-lg border border-red-500/40 bg-red-50 p-2 text-xs text-red-950 dark:bg-red-500/10 dark:text-red-100", className)}>
      <p className="font-semibold">The network's own pages give different figures. So we never call it a winner.</p>
      {lead && <p className="mt-1">{lead}</p>}
      {items.length > 0 && <ul className="mt-1 space-y-0.5">{items.map((x) => <li key={x.key}>{x.node}</li>)}</ul>}
    </div>
  );
}

/** Marks a bundle whose other source (another page of the same operator) says
 *  something different; the note itself is behind "details". */
/** Network names for the calm "… not clear – check with MTN" badges (components without the model). */
const NETWORK_SHORT: Record<string, string> = { mtn: "MTN", telecel: "Telecel", at: "AT" };
/** "✓ From Telecel's official rates": the trust label of a row worked out from the network's own per-MB rates. */
export const officialRatesText = (network: string) => `✓ From ${NETWORK_SHORT[network] ?? "the network"}'s official rates`;
/** A fixed bundle printed on the network's own price list (owner, 25 Oct 2026; it said: ✓ Confirmed). */
export const priceListText = (network: string) => `✓ On ${NETWORK_SHORT[network] ?? "the network"}'s price list`;
export function OtherSourceBadge({ b }: { b: Bundle }) {
  const o = b.otherSource;
  if (!o || typeof o.summary !== "string" || !o.summary.trim()) return null;
  const who = NETWORK_SHORT[b.network] ?? "the network";
  const what = o.contradicts === "validity" ? "Expiry" : o.contradicts === "price" ? "Price" : o.contradicts === "volume" ? "Data amount" : "Details";
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-semibold text-sky-900 dark:text-sky-100" data-testid="othersource-badge">
      <Info className="h-3.5 w-3.5" aria-hidden /> {what} not clear – check with {who}
    </span>
  );
}

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
/** "From MTN's app on 17 Oct 2026", from the bundle's own source text. */
export function appSourceText(b: Bundle, networkName: string): string {
  const d = (b.source ?? "").match(/(\d{1,2} [A-Z][a-z]{2} \d{4})/);
  return `From ${networkName}'s app${d ? ` on ${d[1]}` : ""}. Our checker can't re-read it.`;
}
/** "Telecel calls it: “446MB@GHS3”" (the operator's own title, when we use a shorter name). */
export function OperatorTitle({ model, b }: { model: BundleModel; b: Bundle }) {
  if (!b.operatorTitle || b.operatorTitle === b.name) return null;
  return <p data-testid="operator-title">{model.networkInfo(b.network).name} calls it: “{b.operatorTitle}”</p>;
}
export function TrustBadge({ b }: { b: Bundle }) {
  const { level, who } = trustOf(b);
  const tone = level === "check" ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100"
    : "border-emerald-600/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100";
  // A figure worked out from the network's own published per-MB rate is exact, not estimated:
  // "✓ From Telecel's official rates" (owner, 22 Oct 2026; it was "≈ Price we calculated").
  // Anything disputed, unconfirmed, held, app-screenshot-only or estimated is "! Check first" (trustOf).
  const text = level === "check" ? `! Check first${who ? ` · ${who}` : ""}` : level === "worked" ? officialRatesText(b.network) : priceListText(b.network);
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[15px] lg:text-base font-bold", tone)} data-testid="trust" data-level={level}>{text}</span>;
}
/** Why a bundle is "Check first" or "Worked out", in full (for "More info"). */
export function TrustReasons({ b }: { b: Bundle }) {
  const { level } = trustOf(b);
  if (level === "confirmed") return null;
  return (
    <div className="flex flex-wrap gap-1.5" data-testid="trust-reasons">
      {b.computed && <ComputedBadge label={b.computedLabel ?? "Exact, from the network's official per-MB rates"} />}
      <StatusBadges b={b} />
      {fromAppOnly(b) && <span className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-medium text-amber-900 dark:text-amber-100" data-testid="app-only">App screenshot only</span>}
      {b.held && <span className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-medium text-amber-900 dark:text-amber-100" data-testid="held">New figure being checked. We show the last checked one.</span>}
    </div>
  );
}

/** Status badges for a bundle: personalised, pending, unconfirmed, disputed, time-restricted,
 *  and another source that differs. Always visible, even when the notes are folded away. */
export function StatusBadges({ b }: { b: Bundle }) {
  return (
    <>
      {isConditional(b) && <ConditionalBadge reason={conditionalReason(b)} />}
      {isPending(b) && <PendingBadge />}
      {isUnconfirmed(b) && <UnconfirmedBadge asOf={b.asOf} />}
      {hasConflict(b) && <ConflictBadge who={NETWORK_SHORT[b.network] ?? "the network"} />}
      <OtherSourceBadge b={b} />
      {isTimeRestricted(b) && b.kind !== "night" && b.kind !== "morning" && b.kind !== "weekend" && b.kind !== "restricted" && <RestrictedBadge />}
    </>
  );
}

/** "Only on *110# and the Telecel Play app": how to buy, when the data says only some channels sell it. */
export function ChannelNote({ model, b, noteShown = true }: { model: BundleModel; b: Bundle; noteShown?: boolean }) {
  const t = model.channelNote(b);
  if (!t) return null;
  // Where the bundle's own note is already on screen and already names the same codes, don't repeat it.
  const codes = t.match(/\*\d[\d*]*#/g) ?? [];
  if (noteShown && b.note && (t === b.note || (codes.length > 0 && codes.every((c) => b.note!.includes(c))))) return null;
  return <p className="text-xs font-medium text-foreground"><span className="text-muted-foreground">How to buy: </span>{t}</p>;
}

/** A bundle's or network's source: a link when it is a URL, plain text otherwise
 *  (e.g. "myMTN app (screenshot 17 Oct 2026)"). Links get a 44px tap target on phones. */
export function SourceRef({ source, label = "Source", className }: { source?: string | null; label?: string; className?: string }) {
  if (!source) return null;
  if (/^https:\/\//.test(source)) {
    let host = source;
    try { host = new URL(source).hostname.replace(/^www\./, ""); } catch { /* keep the raw text */ }
    return (
      <a href={source} target="_blank" rel="noopener noreferrer"
        className={cn("inline-flex min-h-11 items-center gap-1 text-xs font-medium underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-6", className)}>
        {label}: {host} <ExternalLink className="h-3 w-3" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  return <span className={cn("text-xs text-muted-foreground", className)}>{label}: {source}</span>;
}

/** Slider thumbs at least 24px and an easier hit area (WCAG 2.5.8). */
export const sliderTouch = "py-3 [&_[role=slider]]:h-7 [&_[role=slider]]:w-7";

const listOf = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");

/** How GB is counted, short, from the data's own factor(s):
 *  "1 GB = 1,024 MB for every network". */
export function unitsLine(model: BundleModel): string {
  const f = model.sharedMbPerGb();
  if (f !== null) return `1 GB = ${f.toLocaleString("en-GB")} MB for every network`;
  return model.networks.map((n) => `${model.networkInfo(n).name}: 1 GB = ${model.mbPerGb(n).toLocaleString("en-GB")} MB`).join("; ");
}

/** The methodology sentence, stated once, from the data's own factor(s). */
export function unitsMethod(model: BundleModel): string {
  const f = model.sharedMbPerGb();
  if (f !== null) return `We count 1 GB as ${f.toLocaleString("en-GB")} MB for every network. Networks may count a little differently.`;
  return `We count 1 GB as ${listOf(model.networks.map((n) => `${model.mbPerGb(n).toLocaleString("en-GB")} MB for ${model.networkInfo(n).name}`))}. Networks may count a little differently.`;
}

/** A money/amount text box that can be cleared and retyped normally: it keeps
 *  what the reader typed ("", "0.", "05") as text and only hands a number to
 *  the maths, so it never shows "00.5" or "020". Out-of-range values are
 *  clamped; the box is tidied to the value in use when it loses focus. */
export function useAmountText(value: number, setValue: (n: number) => void, max: number) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  // The amount the reader typed was above `max` and was set to `max`: the page says so (clampNote).
  const [clamped, setClamped] = useState(false);
  useEffect(() => { if (value < max - 1e-9) setClamped(false); }, [value, max]);
  // Follow the value when it changes from elsewhere (chips, slider, band buttons).
  // Also while the box has focus: if the value no longer matches what is typed
  // (a chip, slider or band button set it), the box shows the new value at once.
  useEffect(() => {
    setText((t) => (!editing || normaliseAmountText(t, max).value !== value ? String(value) : t));
  }, [value, editing, max]);
  return {
    /** Spread onto the <input>. */
    input: {
      value: editing ? text : String(value),
      onFocus: () => { setEditing(true); setText(String(value)); },
      onBlur: () => { setEditing(false); setText(String(value)); },
      onChange: (e: { target: { value: string } }) => {
        // A text box (inputMode "decimal"), so what is typed is what is shown (normaliseAmountText).
        const r = normaliseAmountText(e.target.value, max);
        setText(r.text);
        setValue(r.value);
        setClamped(r.clamped);
      },
    },
    /** True while the amount in use is the top amount because a bigger one was typed. */
    clamped: clamped && value >= max - 1e-9,
  };
}

/** The visible message when a typed amount was above the top amount and was set to it. */
export function ClampNote({ show, text }: { show: boolean; text: string }) {
  if (!show) return null;
  return <p role="status" data-testid="clamp-note" className="mt-1 text-sm font-medium text-amber-900 dark:text-amber-200">{text}</p>;
}

/** The site-wide assistant button (AIChatInterface, mounted once for every page) is a
 *  56px circle fixed 24px from the bottom-right corner with pulsing rings. While a data bundle
 *  page is mounted, the chrome style makes it a plain 48px round button 16px from the corner
 *  (owner, 22 Oct 2026: the old edge tab looked cut off and the page's extra right padding
 *  looked pushed). It hides (fades and slides down) while the reader scrolls and comes back
 *  ASSISTANT_REST_MS after scrolling stops, so it never covers what is being read; with reduced
 *  motion it hides and shows at once. Same button (same click, same "Open AI Chat" name);
 *  the selector is its own aria-label (tested against AIChatInterface.tsx). */
export const ASSISTANT_SELECTOR = 'button[aria-label="Open AI Chat"]';
/** How long after the last scroll the assistant button comes back. */
export const ASSISTANT_REST_MS = 800;
/** The class on <html> while the reader is scrolling a data bundle page. */
export const SCROLLING_CLASS = "db-scrolling";
/** The class on <html> while the button, at rest, would sit over a link, button or field (a
 *  narrow desktop window put it over the GH¢400 chip): it stays out of the way until a scroll
 *  moves that control away (owner, 25 Oct 2026). */
export const COVERING_CLASS = "db-chat-covering";
const INTERACTIVE = "a[href],button,input,select,textarea,summary,label,[role=button],[role=radio],[role=tab],[tabindex]:not([tabindex='-1'])";
/** True when something tappable is under the assistant button's resting place (48px, 16px from
 *  the bottom-right corner). Uses the place, not the button, so it works while the button is hidden. */
export function chatWouldCover(): boolean {
  if (typeof document === "undefined") return false;
  const w = document.documentElement.clientWidth, h = window.innerHeight;
  const L = w - 16 - 48, T = h - 16 - 48;
  const pts: [number, number][] = [[L + 24, T + 24], [L + 6, T + 6], [L + 42, T + 6], [L + 6, T + 42], [L + 42, T + 42]];
  for (const [x, y] of pts) {
    const stack = document.elementsFromPoint(x, y);
    const under = stack.find((e) => !e.closest(ASSISTANT_SELECTOR));
    if (under && under.closest(INTERACTIVE)) return true;
  }
  return false;
}
/** The site header (Header.tsx: the one `header.fixed.top-0`). */
export const SITE_HEADER_SELECTOR = "header.fixed.top-0";
/** The header follows the site theme (its own tokens, from the <html> class). One token is
 *  set on it on these pages, --primary: a deeper blue (214 100% 45%, the site blue a little
 *  darker), because the header's "Sign Up" button is white text on it: 3.35:1 on the dark
 *  theme's blue and 4.45:1 on the light theme's, both below WCAG AA; 5.4:1 on this one
 *  (checked in the browser). The header shows no primary-coloured text on these pages. */
export const HEADER_PRIMARY = "214 100% 45%";
/** The chrome CSS for the data bundle pages:
 *  - the assistant button as a small round button that hides while scrolling (above);
 *  - the site header see-through with a backdrop blur, in the theme in force: dark glass
 *    (`headerAlpha`) in dark mode, light glass in light mode. The comparison page runs its
 *    own section up behind the header, so its glow shows through. */
export function chromeCss(headerAlpha: number): string {
  const blur = "-webkit-backdrop-filter: blur(16px) saturate(150%) !important; backdrop-filter: blur(16px) saturate(150%) !important; box-shadow: none !important;";
  return [
    `${ASSISTANT_SELECTOR} { right: 16px !important; bottom: calc(16px + env(safe-area-inset-bottom, 0px)) !important; width: 48px !important; height: 48px !important; padding: 0 !important; border-radius: 9999px !important; background: linear-gradient(135deg, #7c3aed, #a21caf) !important; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.45) !important; overflow: hidden !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: opacity 200ms ease, transform 200ms ease !important; }`,
    `${ASSISTANT_SELECTOR} > * { display: none !important; }`,
    `${ASSISTANT_SELECTOR}::after { content: "\\2726"; color: #fff; font-size: 20px; line-height: 1; }`,
    // While scrolling: out of the way (never over the text being read); keyboard focus keeps it.
    `html.${SCROLLING_CLASS} ${ASSISTANT_SELECTOR}:not(:focus-visible) { opacity: 0 !important; transform: translateY(24px) scale(0.9) !important; pointer-events: none !important; }`,
    // At rest over a link, button or field: out of the way too (never covers something tappable).
    `html.${COVERING_CLASS} ${ASSISTANT_SELECTOR}:not(:focus-visible) { opacity: 0 !important; transform: translateY(24px) scale(0.9) !important; pointer-events: none !important; }`,
    `@media (prefers-reduced-motion: reduce) { ${ASSISTANT_SELECTOR} { transition: none !important; } }`,
    `${SITE_HEADER_SELECTOR} { --primary: ${HEADER_PRIMARY}; ${blur} }`,
    largeTextCss(),
    `html.dark ${SITE_HEADER_SELECTOR} { background: rgba(8, 10, 14, ${headerAlpha}) !important; border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important; }`,
    `html:not(.dark) ${SITE_HEADER_SELECTOR} { background: rgba(255, 255, 255, 0.72) !important; border-bottom: 1px solid rgba(15, 23, 42, 0.08) !important; }`,
  ].join("\n");
}
/** Puts the chrome style in <head> while a data bundle page is mounted, and takes it out
 *  when the page goes, so no other page is ever affected. Set with textContent (no HTML
 *  is parsed); nothing is rendered on the server, where the site's normal header shows. */
export function DataBundlesChrome({ headerAlpha = 0.85 }: { headerAlpha?: number }) {
  useDataBundlesOffline();
  useLargeTextMark();
  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-testid", "data-bundles-chrome");
    el.textContent = chromeCss(headerAlpha);
    document.head.appendChild(el);
    // Hide the assistant button while scrolling; back ASSISTANT_REST_MS after the last scroll.
    const root = document.documentElement;
    let t: ReturnType<typeof setTimeout> | undefined;
    // At rest: hidden too while its place is over something tappable.
    const settle = () => root.classList.toggle(COVERING_CLASS, chatWouldCover());
    const onScroll = () => {
      root.classList.add(SCROLLING_CLASS);
      clearTimeout(t);
      t = setTimeout(() => { settle(); root.classList.remove(SCROLLING_CLASS); }, ASSISTANT_REST_MS);
    };
    settle();
    const first = setTimeout(settle, 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => { el.remove(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); clearTimeout(t); clearTimeout(first); root.classList.remove(SCROLLING_CLASS, COVERING_CLASS); };
  }, [headerAlpha]);
  return null;
}

/** Bars that grow in when they first scroll into view (race style, with per-bar delays).
 *  True on the server and first render (bars at full length for no-JS readers and
 *  prerendered HTML), false once mounted until the element is seen, then true for good.
 *  Always true under reduced motion. */
export function useGrowIn(ref: { current: Element | null }): boolean {
  const inView = useInView(ref as never, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (reduce === false) setArmed(true); }, [reduce]);
  return !armed || inView;
}

/** Text that rolls when it changes: the old text slides up and out, the new one in. Only
 *  ever shows real (model) text, never an in-between value. First render and no-JS: the
 *  text as it is. Transform and opacity only. */
export function RollText({ text, className, testId, net }: { text: string; className?: string; testId?: string; net?: string }) {
  // Reduced motion: the plain text, no roll and no AnimatePresence (UI audit L2).
  const reduce = useReducedMotion();
  if (reduce) return <span className={cn("relative inline-flex max-w-full align-bottom", className)} data-testid={testId} data-net={net} data-final={text}>{text}</span>;
  return (
    <span className={cn("relative inline-flex max-w-full overflow-hidden align-bottom", className)} data-testid={testId} data-net={net} data-final={text}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={text} className="inline-block" initial={{ y: "65%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }} exit={{ y: "-65%", opacity: 0 }} transition={{ duration: 0.28, ease: "easeOut" }}>
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const NUM_IN_TEXT = /\d[\d,]*(?:\.\d+)?/;
/** A model figure ("6.58 GB", "GH¢155.65"), shown final at once: on the server, on load
 *  and whenever it scrolls into view, so nobody sees 0.0 or a half-counted number. When
 *  the text changes to another figure in the same unit, it rolls quickly (ROLL_SECONDS)
 *  from the OLD number to the new one (keeping decimals, prefix and unit; the last frame
 *  IS `text`), never from 0; under reduced motion it changes at once. Screen readers get
 *  `text` only. */
export function CountUpText({ text, className, testId }: { text: string; className?: string; testId?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [shown, setShown] = useState<string | null>(null);
  const prev = useRef(text);
  useEffect(() => {
    const from = prev.current;
    prev.current = text;
    if (from === text || reduce !== false) return;
    const a = from.match(NUM_IN_TEXT), m = text.match(NUM_IN_TEXT);
    // Same shape (prefix and unit) only: "2.56 GB" -> "3.05 GB" rolls; "900 MB" -> "1.2 GB" just changes.
    if (!a || !m || from.replace(NUM_IN_TEXT, "#") !== text.replace(NUM_IN_TEXT, "#")) return;
    const dec = (m[0].split(".")[1] ?? "").length;
    const fmt = (v: number) => `${text.slice(0, m.index)}${v.toLocaleString("en-GB", { minimumFractionDigits: dec, maximumFractionDigits: dec })}${text.slice((m.index ?? 0) + m[0].length)}`;
    const c = animate(parseFloat(a[0].replace(/,/g, "")), parseFloat(m[0].replace(/,/g, "")), { duration: ROLL_SECONDS, ease: "easeOut", onUpdate: (v) => setShown(fmt(v)), onComplete: () => setShown(null) });
    return () => { c.stop(); setShown(null); };
  }, [text, reduce]);
  return (
    // Screen readers get the final figure once (sr-only), never the counting numbers.
    // (aria-label is not allowed on a plain span, so the name is real hidden text.)
    <span ref={ref} className={cn("tabular-nums", className)} data-testid={testId} data-final={text}>
      <span aria-hidden>{shown ?? text}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** Tabs with a sliding underline (layoutId) and arrow-key movement. Every tab is a 44px target. */
export function SlideTabs({ items, value, onChange, id, label, className, pill }: {
  items: { id: string; label: ReactNode; style?: CSSProperties }[]; value: string; onChange: (id: string) => void; id: string; label: string; className?: string;
  /** Pill buttons (a sliding filled pill marks the picked one) instead of an underline. */
  pill?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = items.findIndex((x) => x.id === value);
    const j = e.key === "ArrowRight" ? (i + 1) % items.length : e.key === "ArrowLeft" ? (i - 1 + items.length) % items.length : e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    onChange(items[j].id);
    refs.current[j]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn("flex w-full", pill && "gap-1.5 rounded-full border border-border bg-background/60 p-1", className)} onKeyDown={key}>
      {items.map((t, i) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${id}-tab-${t.id}`}
            aria-selected={on}
            aria-controls={`${id}-panel-${t.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn("relative min-h-11 flex-1 px-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              pill ? (on ? "rounded-full text-background" : "rounded-full text-muted-foreground hover:text-foreground") : on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
            style={t.style}
          >
            {pill && on && <motion.span layoutId={`${id}-pill`} data-hl="" className="absolute inset-0 rounded-full bg-foreground" transition={{ type: "tween", duration: 0.25, ease: "easeOut" }} aria-hidden />}
            <span className="relative">{t.label}</span>
            {!pill && on && <motion.span layoutId={`${id}-underline`} className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-foreground" transition={{ type: "tween", duration: 0.25, ease: "easeOut" }} aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

/** True from 640px wide (Tailwind `sm`), after mount; false on the server and first render. */
export function useIsWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 640px)");
    const on = () => setWide(q.matches);
    on();
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return wide;
}

export interface DeckItem { id: string; tab: ReactNode; name: string; content: ReactNode }
/** Phones (under 640px): a swipe view with ONE full-width card at a time and no peek of the
 *  next (scroll-snap; each card exactly the view's width), tabs with a sliding underline
 *  above and dots below. Swipe, tap a tab or a dot, or use the arrow keys on the tabs.
 *  From 640px: the cards side by side (three columns from 768px), tabs and dots hidden.
 *  The selected card is kept by id: when the items are re-ordered (planner: cheapest
 *  first), the same card stays in view and its tab stays selected. On phones each card has 4px
 *  of room inside its slot, so a highlighted card's ring is never cut by the swipe view. `layout`: cards slide
 *  to their new places on wide screens when the order changes. */
export function SwipeDeck({ id, label, items, testId, slotTestId, dotTestId, layout, slotClassName }: {
  id: string; label: string; items: DeckItem[]; testId?: string; slotTestId?: string; dotTestId?: string; layout?: boolean;
  /** Extra classes for each card's slot (network panels: subgrid rows on desktop). */
  slotClassName?: string;
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const scroller = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const reduce = useReducedMotion();
  const wide = useIsWide();
  const idx = Math.max(0, items.findIndex((i) => i.id === activeId));
  const order = items.map((i) => i.id).join("|");
  // Keep the tabs and dots in step with swiping.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const list = itemsRef.current;
        if (el.clientWidth && el.scrollWidth > el.clientWidth) setActiveId(list[Math.max(0, Math.min(list.length - 1, Math.round(el.scrollLeft / el.clientWidth)))]?.id ?? "");
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  // New order: keep the same card (by id) in view, at once.
  useEffect(() => {
    const el = scroller.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollTo({ left: idx * el.clientWidth, behavior: "auto" });
  }, [order]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (i: number) => {
    const it = items[i];
    if (!it) return;
    setActiveId(it.id);
    const el = scroller.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <>
      <div className="sm:hidden">
        <SlideTabs id={id} label={label} className="mb-3 border-b border-border" items={items.map((i) => ({ id: i.id, label: i.tab }))}
          value={items[idx]?.id ?? ""} onChange={(v) => go(items.findIndex((i) => i.id === v))} />
      </div>
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:grid sm:gap-4 sm:overflow-visible md:grid-cols-3 [&::-webkit-scrollbar]:hidden"
        data-testid={testId}
      >
        {items.map((it) => (
          <motion.div
            key={it.id}
            layout={layout && wide ? "position" : false}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            id={`${id}-panel-${it.id}`}
            role="group"
            aria-label={it.name}
            className={cn("w-full shrink-0 snap-start snap-always overflow-hidden p-1 sm:w-auto sm:overflow-visible sm:p-0", slotClassName)}
            data-testid={slotTestId}
            data-net={it.id}
          >
            {it.content}
          </motion.div>
        ))}
      </div>
      <div className="mt-2 flex justify-center sm:hidden">
        {items.map((it, i) => (
          <button key={it.id} type="button" onClick={() => go(i)} aria-label={`Show ${it.name}`} aria-current={i === idx ? "true" : undefined}
            className="flex h-11 w-11 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid={dotTestId}>
            <span className={cn("block h-2.5 rounded-full transition-all", i === idx ? "w-6 bg-foreground" : "w-2.5 bg-muted-foreground/60")} />
          </button>
        ))}
      </div>
    </>
  );
}

/** A one-time light sweep across the dashboard on page load (transform and opacity only;
 *  none under reduced motion). Decoration: it takes no space, so nothing shifts. */
export function ScanSweep() {
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);
  useEffect(() => { if (reduce === false) setOn(true); }, [reduce]);
  if (!on) return null;
  return (
    <motion.div
      aria-hidden
      data-testid="scan-sweep"
      className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 bg-gradient-to-r from-transparent via-emerald-300/15 to-transparent"
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: "320%", opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.6, ease: "easeInOut" }}
      onAnimationComplete={() => setOn(false)}
    />
  );
}

/** A tel: link that opens the phone's dialler with a USSD code: "*" kept, "#" encoded
 *  ("*111*4#" -> "tel:*111*4%23"), as dialler apps need. */
export const telHref = (code: string) => `tel:${code.replace(/#/g, "%23")}`;
/** The USSD codes in a how-to-buy line ("*111*4#"), in order, each once. */
export const dialCodes = (text: string): string[] => [...new Set(text.match(/\*[\d*]+#/g) ?? [])];

/** True on iPhone and iPad (iOS blocks USSD codes in tel: links), after mount only. */
export function useIsIOS(): boolean {
  const [ios, setIos] = useState(false);
  useEffect(() => {
    const n = navigator as Navigator & { maxTouchPoints?: number };
    setIos(/iPhone|iPad|iPod/i.test(n.userAgent) || (n.platform === "MacIntel" && (n.maxTouchPoints ?? 0) > 1));
  }, []);
  return ios;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch { return false; }
}

/** Every data bundle page's address (the country pages and each network page). */
export const dataBundlePagePaths = (): string[] =>
  Object.entries(DATA_BUNDLE_PAGES).flatMap(([c, nets]) => [`${DATA_BUNDLES_BASE}/${c}`, ...nets.map((n) => `${DATA_BUNDLES_BASE}/${c}/${n}`)]);

/** A link to another data bundle page that carries the page's CURRENT query (?amount=33&noexp=1 ...)
 *  as it is at the moment of the tap. The finder and planner write the query with
 *  history.replaceState, which the app's navigation never hears about, so useLocation().search goes stale
 *  (UI audit M1: GH¢33 -> tap GH¢100 -> tap Telecel opened at GH¢33). A plain tap navigates in the
 *  app; a modified click, middle click or long-press gets an href updated on press. */
export const withCurrentQuery = (path: string) => `${path}${typeof window !== "undefined" ? window.location.search : ""}`;
export function QueryLink({ to, onClick, onMouseDown, onFocus, ...rest }: Omit<LinkProps, "to"> & { to: string }) {
  const navigate = useNavigate();
  const freshHref = (e: { currentTarget: EventTarget }) => { try { (e.currentTarget as HTMLAnchorElement).href = withCurrentQuery(to); } catch { /* ignore */ } };
  return (
    <Link
      to={to}
      {...rest}
      onMouseDown={(e) => { freshHref(e); onMouseDown?.(e); }}
      onFocus={(e) => { freshHref(e); onFocus?.(e); }}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(withCurrentQuery(to));
      }}
    />
  );
}

/** After an in-app move from one data bundle page to another (MTN -> Telecel, compare -> MTN), the
 *  new page's h1 takes focus, so screen-reader and keyboard users start at the new page's title
 *  (UI audit L5). Not on a first load. preventScroll and focus:outline-none: nothing jumps or
 *  draws an outline. Put the ref on the h1 with tabIndex={-1}. */
let lastDataBundlePath: string | null = null;
export function useFocusTitleOnNavigate<T extends HTMLElement>(path: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (lastDataBundlePath !== null && lastDataBundlePath !== path) {
      try { ref.current?.focus({ preventScroll: true }); } catch { /* ignore */ }
    }
    lastDataBundlePath = path;
  }, [path]);
  return ref;
}

/** The files the offline copy keeps after a visit: this page and every other data bundle page,
 *  the built files this page loaded (same site, /assets/ or the preview's /pv-assets/), the
 *  prices file, the changes and price-history files, and the logo. The worker adds this build's route files itself. */
export const offlineUrls = (): string[] => {
  // The prices file always (on the first visit it may still be loading when this runs).
  // The changes and price-history files too (23 Oct 2026), so "What changed" and the history lines work offline.
  const out = new Set<string>([location.pathname, ...dataBundlePagePaths(), ...Object.keys(DATA_BUNDLE_PAGES).flatMap((c) => [bundleFilePath(c), changesFilePath(c), historyFilePath(c)]), "/logo-t.png", "/favicon.ico"]);
  try {
    for (const e of performance.getEntriesByType("resource")) {
      const u = new URL(e.name);
      if (u.origin === location.origin && ["/assets/", "/pv-assets/", "/storage/data-bundles/"].some((p) => u.pathname.startsWith(p))) out.add(u.pathname);
    }
  } catch { /* no timing API */ }
  return [...out];
};

/** A registration of this worker (from any address it ever had, see DATA_BUNDLES_SW_URLS). */
const isOurWorker = (r: ServiceWorkerRegistration) =>
  [r.active, r.installing, r.waiting].some((w) => !!w && DATA_BUNDLES_SW_URLS.some((u) => new URL(w.scriptURL).pathname === u));

/** The offline copy (public/sw-data-bundles.js, served at DATA_BUNDLES_SW without a .js
 *  extension), scoped to the data bundle pages only. On (DATA_BUNDLES_OFFLINE = true):
 *  registered in production builds, then told which files to keep, and told again whenever a
 *  new version takes over (controllerchange). Registrations of it at any other scope (the
 *  preview's, after launch) are removed. Off: every registration of it is removed (the kill
 *  switch). Never touches any other worker. */
export function useDataBundlesOffline() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    const scope = `${DATA_BUNDLES_BASE}/`;
    const save = () => { try { sw.controller?.postMessage({ type: "tt-db-save", urls: offlineUrls() }); } catch { /* ignore */ } };
    let listening = false;
    (async () => {
      try {
        if (DATA_BUNDLES_OFFLINE) {
          if (!import.meta.env.PROD) return;
          for (const r of await sw.getRegistrations()) {
            if (isOurWorker(r) && new URL(r.scope).pathname !== scope) await r.unregister();
          }
          const reg = await sw.register(DATA_BUNDLES_SW, { scope });
          const ready = await sw.ready;
          (ready.active ?? reg.active)?.postMessage({ type: "tt-db-save", urls: offlineUrls() });
          sw.addEventListener("controllerchange", save);
          listening = true;
        } else {
          for (const r of await sw.getRegistrations()) if (isOurWorker(r)) await r.unregister();
        }
      } catch { /* never break the page over the offline copy */ }
    })();
    return () => { if (listening) sw.removeEventListener("controllerchange", save); };
  }, []);
}

/** Bigger text on these pages: "A" (normal) or "A+" (one step bigger, 112.5%). Only the page
 *  content grows (CSS zoom on <main>, which reflows to the screen width); the site header and
 *  footer stay as they are, so the logo and menu never crowd on a phone. Only while a data
 *  bundle page is open: the mark on <html> is taken off on leaving. Remembered per visitor in
 *  localStorage, if it works. */
export const TEXT_SIZE_KEY = "techtrendi-db-text";
export const LARGE_TEXT_ZOOM = 1.125;
export const LARGE_TEXT_ATTR = "data-db-text";
export const largeTextCss = () => [
  `html[${LARGE_TEXT_ATTR}="large"] main#main-content { zoom: ${LARGE_TEXT_ZOOM}; }`,
  // Bigger text on a phone: the finder's amount chips go four to a row so "GH¢100" fits.
  `@media (max-width: 639px) { html[${LARGE_TEXT_ATTR}="large"] [data-bf-chips] { grid-template-columns: repeat(4, minmax(0, 1fr)); } }`,
  // Bigger text on a phone: "All networks" gets its own line from the first paint, so the row never
  // jumps when the web font arrives (it fits beside the pills only at normal size).
  `@media (max-width: 639px) { html[${LARGE_TEXT_ATTR}="large"] [data-testid="compare-all"] { flex-basis: 100%; } }`,
].join("\n");
const TEXT_SIZE_EVENT = "tt-db-text-change";
const readLarge = () => { try { return window.localStorage.getItem(TEXT_SIZE_KEY) === "large"; } catch { return false; } };
/** The text size, shared by every A / A+ control on the page (the inline one from 640px and the
 *  phone's Display menu), so they never disagree. Choosing sets the mark on <html> at once and
 *  stores it (same key as before; the pre-paint script in index.html reads it). */
export function useLargeText(): [boolean, (v: boolean) => void] {
  const [large, setLarge] = useState(false);
  useEffect(() => {
    setLarge(readLarge());
    const on = (e: Event) => setLarge(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener(TEXT_SIZE_EVENT, on);
    return () => window.removeEventListener(TEXT_SIZE_EVENT, on);
  }, []);
  const pick = (v: boolean) => {
    try { window.localStorage.setItem(TEXT_SIZE_KEY, v ? "large" : "normal"); } catch { /* storage blocked */ }
    const root = document.documentElement;
    if (v) root.setAttribute(LARGE_TEXT_ATTR, "large"); else root.removeAttribute(LARGE_TEXT_ATTR);
    window.dispatchEvent(new CustomEvent(TEXT_SIZE_EVENT, { detail: v }));
  };
  return [large, pick];
}
/** While a data bundle page is open the stored size applies; leaving takes the mark off (used by
 *  DataBundlesChrome, which every data bundle page mounts). */
export function useLargeTextMark() {
  useEffect(() => {
    const root = document.documentElement;
    if (readLarge()) root.setAttribute(LARGE_TEXT_ATTR, "large");
    return () => { root.removeAttribute(LARGE_TEXT_ATTR); };
  }, []);
}
export function TextSizeToggle({ className }: { className?: string }) {
  const [large, pick] = useLargeText();
  const btn = (on: boolean) => cn(
    "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-2 font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
  );
  return (
    <div role="group" aria-label="Text size" className={cn("inline-flex items-center gap-0.5 rounded-full border border-border bg-background/60 p-0.5", className)} data-testid="text-size">
      <button type="button" className={cn(btn(!large), "text-sm")} aria-pressed={!large} onClick={() => pick(false)} aria-label="A normal text">A</button>
      <button type="button" className={cn(btn(large), "text-lg")} aria-pressed={large} onClick={() => pick(true)} aria-label="A+ bigger text">A+</button>
    </div>
  );
}

/** One USSD code as actions: "Dial" (a tel: link) and "Copy" (with a short "Copied").
 *  On iPhone, where the dial link would do nothing, Copy is the only, main action. */
export function CodeActions({ code }: { code: string }) {
  const ios = useIsIOS();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    }
  };
  const main = "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[15px] lg:text-base font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5" data-testid="code-actions" data-code={code}>
      {!ios && (
        <a href={telHref(code)} className={cn(main, "bg-emerald-800 text-white hover:bg-emerald-900")} data-testid="dial" aria-label={`Dial ${code}`}>
          <Phone className="h-4 w-4" aria-hidden /> {code}
        </a>
      )}
      {/* Copy: an icon button beside Dial (44 x 44), "Copied" for a moment after a tap; on iPhone the main, labelled action. */}
      <button type="button" onClick={copy} className={cn(main, ios ? "bg-emerald-800 text-white hover:bg-emerald-900" : cn("border border-border bg-background/60 text-foreground hover:bg-muted", !copied && "min-w-11 justify-center px-0"))}
        data-testid="copy-code" aria-label={copied ? `${code} copied` : `Copy ${code}`} title={`Copy ${code}`}>
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        {copied ? "Copied" : ios ? `Copy ${code}` : null}
      </button>
      <span className="sr-only" aria-live="polite">{copied ? `${code} copied` : ""}</span>
    </span>
  );
}

/** Dial + Copy chips for every USSD code in one or more texts (facts, borrowed-data and balance
 *  lines, family notes), so no code is only readable in a sentence. Nothing when there is none. */
export function CodesIn({ texts, className }: { texts: (string | null | undefined)[]; className?: string }) {
  const codes = [...new Set(texts.flatMap((t) => (t ? dialCodes(t) : [])))];
  if (!codes.length) return null;
  return <div className={cn("mt-2 flex flex-wrap gap-x-3 gap-y-1.5", className)} data-testid="codes-in">{codes.map((c) => <CodeActions key={c} code={c} />)}</div>;
}

/** A how-to-buy line: the short text, then a Dial and a Copy action for each USSD code in
 *  it. App-only routes (no code) stay as text. */
export function BuyLine({ text, testId }: { text: string; testId?: string }) {
  const codes = dialCodes(text);
  return (
    <div className="space-y-1.5" data-testid={testId}>
      <p className="text-[15px] font-medium text-foreground lg:text-base"><span className="text-foreground/80">How to buy: </span>{text}</p>
      {codes.length > 0 && <div className="flex flex-wrap gap-x-3 gap-y-1.5">{codes.map((c) => <CodeActions key={c} code={c} />)}</div>}
    </div>
  );
}

/** How-to-buy lines with their Dial and Copy buttons: shown as they are on a winner card,
 *  folded behind one "How to buy" button (44px on phones) on the other cards, so the page
 *  stays short. A native <details>: the text is in the page's HTML and opens without JS. */
export function BuyFold({ open, children, testId = "buy-fold" }: { open: boolean; children: ReactNode; testId?: string }) {
  if (open) return <>{children}</>;
  return (
    <details className="group/buy" data-testid={testId}>
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-full border border-border bg-background/60 px-3 text-[15px] font-semibold text-foreground transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:text-base md:min-h-9 [&::-webkit-details-marker]:hidden">
        How to buy <ChevronDown className="h-3.5 w-3.5 transition-transform group-open/buy:rotate-180" aria-hidden />
      </summary>
      <div className="mt-1.5 space-y-2">{children}</div>
    </details>
  );
}

/** "ⓘ details": notes, disputes and terms folded behind one small tap target. A native
 *  <details>, so the text is in the page's HTML (prerendered, crawlable) and opens
 *  without JavaScript. The summary is at least 44px tall on phones. */
export function Details({ summary = "More info", children, className, testId }: { summary?: ReactNode; children: ReactNode; className?: string; testId?: string }) {
  return (
    <details className={cn("group/details", className)} data-testid={testId}>
      {/* A clear small button (44px tall on phones), not a dotted link. */}
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 text-[15px] lg:text-base font-semibold text-foreground transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-9 [&::-webkit-details-marker]:hidden">
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {summary}
      </summary>
      <div className="mt-1 space-y-2 text-xs text-muted-foreground">{children}</div>
    </details>
  );
}

/** True when a bundle has notes to fold behind "details" (its note, how-to-buy channel,
 *  another source, a dispute). */
export function hasNotes(model: BundleModel, b: Bundle): boolean {
  return !!(b.note || model.channelNote(b) || (b.otherSource?.summary && b.otherSource.summary.trim()) || hasConflict(b));
}

/** Value bar: longer = better value. `share` is 0..1 of the best value shown beside it.
 *  Drawn with a transform (scaleX) only, so it animates without layout work. */
export function ValueBar({ share, color, className, thin, delay = 0 }: { share: number; color: string; className?: string; thin?: boolean; delay?: number }) {
  const s = Number.isFinite(share) ? Math.max(0.03, Math.min(1, share)) : 0;
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-muted", thin ? "h-1.5" : "h-2.5", className)} aria-hidden>
      <motion.div
        className="h-full w-full origin-left rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
        initial={false}
        animate={{ scaleX: s }}
        transition={{ type: "spring", stiffness: 140, damping: 22, delay }}
      />
    </div>
  );
}

/** The one plain-English line that says what "Value: X per GH¢10" means. */
export function valueExplainer(model: BundleModel): string {
  const t = model.money(model.valueStep);
  return `Each card shows the bundle's real price and data first. "Value" under it compares bundles of different prices: the data you get for each ${t} of the price. Bigger is better. It is not what ${t} pays for.`;
}

/** The value yardstick, UNDER the bundle's own price and data: "Value: 6.58 GB per GH¢10" and
 *  its bar. The price per GB is under More info only. All text from the model. */
export function ValueFigure({ model, b, share, className }: { model: BundleModel; b: Bundle; share: number; size?: "md" | "lg"; className?: string }) {
  const line = model.valueText(b);
  if (!line) return null;
  const info = model.networkInfo(b.network);
  return (
    <div className={cn("min-w-0", className)}>
      {/* The bar is the main signal (longer = more data for the money); the figure is the line under it. */}
      <ValueBar share={share} color={info.color} className="mt-1 h-3.5" />
      <p className="mt-1.5 text-[15px] text-foreground/90 lg:text-base" data-testid="value-line">
        Value: <b className="tabular-nums text-foreground" data-testid="value-ten">{line}</b> per {model.money(model.valueStep)}
      </p>
    </div>
  );
}

/** "GH¢400 bundle →" with the arrow kept on the same line as the last word (never alone on a line).
 *  Screen readers hear "GH¢400 bundle gives". */
export function LeadArrow({ text, colon = false }: { text: string; colon?: boolean }) {
  // A pay-any-amount range reads "From GH¢400:" (its data follows), never with an arrow.
  if (colon) return <>{text}:</>;
  const i = text.lastIndexOf(" ");
  const head = i > 0 ? text.slice(0, i + 1) : "";
  const last = i > 0 ? text.slice(i + 1) : text;
  return <>{head}<span className="whitespace-nowrap">{last} <span aria-hidden>→</span></span><span className="sr-only"> gives</span></>;
}
const MORE = " (more if you pay more)";
/** The leading data figure and, for a range, the small "(more if you pay more)" under it. */
export function LeadData({ model, b, className }: { model: BundleModel; b: Bundle; className?: string }) {
  const t = model.leadData(b);
  const range = t.endsWith(MORE);
  return (
    <>
      <span className={cn("block whitespace-nowrap font-black tabular-nums", className)}>{range ? t.slice(0, -MORE.length) : t}</span>
      {range && <span className="block text-[15px] font-semibold text-foreground/85 lg:text-base" data-testid="lead-more">(more if you pay more)</span>}
    </>
  );
}
const isRange = (b: Bundle) => !!b.band && !b.band.exact;

/** "GH¢400 bundle → 263.38GB": the real price and data, leading every card and row. */
export function PriceLead({ model, b, className, dataClassName }: { model: BundleModel; b: Bundle; className?: string; dataClassName?: string }) {
  return (
    <p className={cn("font-bold leading-tight", className)} data-testid="price-lead">
      {isRange(b)
        ? <><span className="tabular-nums">{model.priceLead(b)}:</span>{" "}<span className={cn("whitespace-nowrap font-black tabular-nums", dataClassName)}>{model.leadData(b).replace(MORE, "")}</span> <span className="font-semibold text-foreground/85">(more if you pay more)</span></>
        : <><span className="tabular-nums">{model.priceLead(b)}</span> <span aria-hidden>→</span><span className="sr-only">gives</span>{" "}
          <span className={cn("whitespace-nowrap font-black tabular-nums", dataClassName)}>{model.dataShown(b)}</span></>}
    </p>
  );
}

/** "Price per GB: GH¢1.52" for More info (never on the cards themselves). */
export const perGbLine = (model: BundleModel, b: Bundle) => (hasVolume(b) && b.price > 0 ? `Price per GB: ${model.perGbText(b).replace(/\/GB$/, "")}` : null);
