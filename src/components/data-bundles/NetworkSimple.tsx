// The simple network page's own parts (owner, 29 Oct 2026; MTN first, Telecel and AT once approved):
//   OtherTypes  – under the finder: what the same money buys in each of the network's types
//                 (pay-any-amount tables and the app-only families), plus a "spend less" tip
//                 when the amount sits in a spend cliff (model.materialCliffsOf).
//   BuyCard     – one big card in the network's colour: the regular dial route, with Dial / Copy.
//   BundleSheet – every bundle in ONE table (Price · Data · Lasts; from md also Value per GH¢10 and
//                 How to buy). Pay-any-amount tables appear as sample amounts, the way the
//                 network's own menu lists them. Groups are coloured by what they are; a tap on a
//                 row opens its details (how to buy, value, trust, notes, price history, source).
// Every figure comes from the model (sourceBundle, dataShown, shortValidity, valueText, familyBest),
// never typed here.
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { AppWindow, ArrowDownUp, ChevronDown, Clock, Infinity as InfinityIcon, Lightbulb, Moon, Phone, Sparkles, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { TABLE_SECTIONS, hasVolume, neverExpires, tableRange, tableSection, type Bundle, type BundleModel, type RateSource } from "@/lib/dataBundles";
import { BuyLine, ChannelNote, CodeActions, ConflictNote, OtherSourceNote, SourceRef, TrustBadge, TrustReasons, dialCodes, glass, textSafeFill, trustOf, ussdText } from "./shared";
import { PriceHistory } from "./PriceHistory";

/** A short type name: "Regular data (any amount)" -> "Regular", "Social bundles" -> "Social". */
export const typeName = (family: string) => family.replace(/\s*\(any amount\)\s*$/i, "").replace(/^Regular data$/i, "Regular").replace(/\s+bundles?$/i, "");

/** The groups' colours and tabs: what a bundle is decides its colour (owner: colourful, 29 Oct 2026). */
export type SheetTab = "never" | "time" | "apps" | "other" | "check";
export const TAB_INFO: Record<SheetTab, { label: string; icon: typeof Clock; chip: string; head: string; dot: string }> = {
  never: { label: "Never expires", icon: InfinityIcon, chip: "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:border-emerald-400 dark:text-emerald-100", head: "bg-emerald-500/10 dark:bg-emerald-400/10", dot: "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950" },
  time: { label: "Night & morning", icon: Moon, chip: "border-indigo-500 bg-indigo-500/15 text-indigo-900 dark:border-indigo-400 dark:text-indigo-100", head: "bg-indigo-500/10 dark:bg-indigo-400/10", dot: "bg-indigo-600 text-white dark:bg-indigo-400 dark:text-slate-950" },
  apps: { label: "Some apps", icon: AppWindow, chip: "border-sky-500 bg-sky-500/15 text-sky-900 dark:border-sky-400 dark:text-sky-100", head: "bg-sky-500/10 dark:bg-sky-400/10", dot: "bg-sky-600 text-white dark:bg-sky-400 dark:text-slate-950" },
  other: { label: "Other", icon: Clock, chip: "border-teal-500 bg-teal-500/15 text-teal-900 dark:border-teal-400 dark:text-teal-100", head: "bg-teal-500/10 dark:bg-teal-400/10", dot: "bg-teal-600 text-white dark:bg-teal-400 dark:text-slate-950" },
  check: { label: "Check first", icon: TriangleAlert, chip: "border-amber-500 bg-amber-500/15 text-amber-900 dark:border-amber-400 dark:text-amber-100", head: "bg-amber-500/10 dark:bg-amber-400/10", dot: "bg-amber-500 text-slate-950 dark:bg-amber-400" },
};
const TAB_ORDER: SheetTab[] = ["never", "time", "apps", "other", "check"];

/** Which tab (and colour) a bundle belongs to. */
export function tabOf(b: Bundle): SheetTab {
  const s = tableSection(b);
  if (s === "unranked") return "check";
  if (s === "social" || s === "video") return "apps";
  if (s === "night" || s === "morning" || s === "hourly" || s === "restricted") return "time";
  return neverExpires(b) ? "never" : "other";
}

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
    groups.push({ id: s.id, name: typeName(s.family), note: `Pay any amount, ${model.money(lo)} to ${model.money(hi)}`, tab: tabOf(rows[0]), rows, best, anyAmount: true });
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
    groups.push({ id: `fam-${f}`, name: typeName(f), note: model.shortValidity(rows[0]), tab: tabOf(rows[0]), rows, best: fb && rows.includes(fb) ? fb : null, anyAmount: false });
  }
  if (unranked.length) groups.push({ id: "check", name: "Check first", note: "Not ranked: details not clear, or not for everyone", tab: "check", rows: unranked, best: null, anyAmount: false });
  return groups;
}

/** How to buy, short: the dial line, else the app route. */
const buyText = (model: BundleModel, b: Bundle) => ussdText(b) ?? model.buyShort(b) ?? null;

export function BundleSheet({ model, network }: { model: BundleModel; network: string }) {
  const info = model.networkInfo(network);
  const groups = useMemo(() => sheetGroups(model, network), [model, network]);
  const tabs = TAB_ORDER.filter((t) => groups.some((g) => g.tab === t));
  const [tab, setTab] = useState<SheetTab | "all">("all");
  const [asc, setAsc] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const shown = groups.filter((g) => tab === "all" || g.tab === tab);
  const count = groups.reduce((n, g) => n + (g.anyAmount ? 0 : g.rows.length), 0);
  const chip = "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <section aria-labelledby="sheet-h" id="bundles" className="scroll-mt-24" data-testid="bundle-sheet">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <h2 id="sheet-h" className="text-2xl font-black tracking-tight sm:text-3xl">
          All <span className="rounded-lg px-1.5" style={{ background: textSafeFill(info), color: info.ink }}>{info.name}</span> bundles
        </h2>
        <p className="text-sm text-muted-foreground">{count} bundles, plus pay-any-amount data</p>
      </div>

      {/* Tabs: one row that scrolls sideways on small phones; each type has its own colour. */}
      <div role="group" aria-label="Show" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="sheet-tabs">
        <button type="button" aria-pressed={tab === "all"} onClick={() => { setTab("all"); setOpen(null); }} data-id="all"
          className={cn(chip, tab === "all" ? "border-foreground bg-foreground text-background" : "border-border bg-background/60 text-muted-foreground hover:text-foreground")}>
          <Sparkles className="h-4 w-4" aria-hidden /> All
        </button>
        {tabs.map((t) => {
          const T = TAB_INFO[t];
          return (
            <button key={t} type="button" aria-pressed={tab === t} onClick={() => { setTab(t); setOpen(null); }} data-id={t}
              className={cn(chip, tab === t ? T.chip : "border-border bg-background/60 text-muted-foreground hover:text-foreground")}>
              <T.icon className="h-4 w-4" aria-hidden /> {T.label}
            </button>
          );
        })}
      </div>

      {/* The box scrolls sideways only if a very small screen with big text still can't fit the table. */}
      <div className={cn(glass, "mt-2 overflow-x-auto p-0")} data-testid="sheet-box">
        <table className="w-full border-collapse text-left tabular-nums" data-testid="sheet-table">
          <caption className="sr-only">All {info.name} bundles: price, data and how long it lasts. Tap a row for details.</caption>
          <thead>
            <tr className="bg-muted/60 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-2 py-2.5 sm:px-3" aria-sort={asc ? "ascending" : "descending"}>
                <button type="button" onClick={() => setAsc((a) => !a)} className="inline-flex min-h-11 items-center gap-1 uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="sheet-sort">
                  Price <ArrowDownUp className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">, sorted {asc ? "low to high" : "high to low"}. Tap to reverse.</span>
                </button>
              </th>
              <th scope="col" className="px-2 py-2.5 sm:px-3">Data</th>
              <th scope="col" className="px-2 py-2.5 sm:px-3">Lasts</th>
              <th scope="col" className="px-2 py-2.5 sm:px-3 max-md:hidden">Value per {model.money(model.valueStep)}</th>
              <th scope="col" className="px-2 py-2.5 sm:px-3 max-md:hidden">How to buy</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((g) => {
              const T = TAB_INFO[g.tab];
              const rows = [...g.rows].sort((a, b) => (asc ? a.price - b.price : b.price - a.price));
              // When every row of a group needs checking, the "!" is said once, in its heading.
              const allCheck = g.rows.every((b) => trustOf(b).level === "check");
              return (
                <Fragment key={g.id}>
                  <tr className={T.head} data-testid="sheet-group" data-tab={g.tab}>
                    <th scope="colgroup" colSpan={5} className="border-t border-border px-3 py-2 text-left">
                      <span className="flex items-center gap-2">
                        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", T.dot)} aria-hidden><T.icon className="h-4 w-4" /></span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[15px] font-black leading-tight">
                            {g.name}
                            {allCheck && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-black text-slate-950" data-testid="group-check">! Check first</span>}
                          </span>
                          <span className="block text-xs font-semibold normal-case tracking-normal text-muted-foreground">{g.note}</span>
                        </span>
                      </span>
                    </th>
                  </tr>
                  {rows.map((b, i) => {
                    const k = `${g.id}-${b.price}-${i}`;
                    const isOpen = open === k;
                    const check = !allCheck && trustOf(b).level === "check";
                    const buy = buyText(model, b);
                    const toggle = () => setOpen(isOpen ? null : k);
                    return (
                      <Fragment key={k}>
                        <tr tabIndex={0} role="button" aria-expanded={isOpen} onClick={toggle}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
                          className={cn("cursor-pointer border-t border-border align-top transition-colors hover:bg-muted/50 focus:outline-none focus-visible:bg-muted/60", isOpen && "bg-muted/40")}
                          data-testid="sheet-row">
                          <td className="whitespace-nowrap px-2 py-3 text-[15px] font-extrabold max-[379px]:px-1.5 max-[379px]:text-sm sm:px-3 lg:text-base">
                            {model.money(b.price)}
                            {b === g.best && <span className="ml-1 inline-grid h-5 w-5 place-items-center rounded-full bg-emerald-600 align-[1px] text-[11px] text-white dark:bg-emerald-400 dark:text-slate-950" aria-label="best value in this group" title="Best value in this group">★</span>}
                            {check && <span className="ml-1 inline-grid h-5 w-5 place-items-center rounded-full bg-amber-500 align-[1px] text-[11px] font-black text-slate-950" aria-label="check with the network first" title="Check first">!</span>}
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 text-[15px] font-black max-[379px]:px-1.5 max-[379px]:text-sm sm:px-3 lg:text-base">{hasVolume(b) ? model.dataShown(b) : "–"}</td>
                          <td className="px-2 py-3 text-sm text-muted-foreground max-[379px]:px-1.5 max-[379px]:text-xs sm:px-3">
                            <span className="flex items-start justify-between gap-1">
                              <span className="min-w-0">{model.shortValidity(b)}</span>
                              <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none max-[379px]:hidden", isOpen && "rotate-180")} aria-hidden />
                            </span>
                          </td>
                          <td className="px-2 py-3 sm:px-3 text-sm font-bold max-md:hidden">{model.valueText(b) ?? "–"}</td>
                          <td className="px-2 py-3 sm:px-3 text-sm text-muted-foreground max-md:hidden">{buy ?? "–"}</td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-muted/40" data-testid="sheet-more">
                            <td colSpan={5} className="px-3 pb-4 pt-1">
                              <RowDetails model={model} b={b} buy={buy} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span><span className="mr-1 inline-grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-[10px] text-white dark:bg-emerald-400 dark:text-slate-950" aria-hidden>★</span>best value in the group</span>
        <span><span className="mr-1 inline-grid h-4 w-4 place-items-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950" aria-hidden>!</span>check with {info.name} first</span>
        <span>Tap a row for how to buy and more.</span>
      </p>
    </section>
  );
}

function RowDetails({ model, b, buy }: { model: BundleModel; b: Bundle; buy: string | null }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold">{model.listName(b)}</p>
      {buy && <BuyLine text={buy} />}
      {model.valueLine(b) && <p>{model.valueLine(b)}</p>}
      <div className="flex flex-wrap gap-1.5"><TrustBadge b={b} /></div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <TrustReasons b={b} />
        {b.note && <p>{b.note}</p>}
        <ChannelNote model={model} b={b} noteShown={!!b.note} />
        <OtherSourceNote b={b} />
        <ConflictNote b={b} />
        <PriceHistory model={model} b={b} />
        <SourceRef source={b.source} />
      </div>
    </div>
  );
}

/** "Other MTN types for GH¢10": each pay-any-amount table at this amount (or at its top, said so),
 *  and the best app-only bundle (Social, Video) the amount reaches. Facts, not a ranking. */
export function OtherTypes({ model, network, amount }: { model: BundleModel; network: string; amount: number }) {
  const info = model.networkInfo(network);
  const lines: { key: string; tab: SheetTab; name: string; data: string; note: string }[] = [];
  if (amount > 0) {
    for (const s of model.sources.filter((x) => x.network === network)) {
      const [lo, hi] = tableRange(s.table);
      if (amount < lo) continue;
      const at = Math.min(amount, hi);
      const b = model.sourceBundle(s, at);
      if (!b || !hasVolume(b)) continue;
      lines.push({ key: s.id, tab: tabOf(b), name: typeName(s.family), data: model.dataShown(b),
        note: [model.shortValidity(b), at < amount ? `for ${model.money(at)}, the most it takes` : null].filter(Boolean).join(" · ") });
    }
    for (const f of [...new Set(model.bundles.filter((b) => b.network === network && (b.kind === "social" || b.kind === "video")).map((b) => b.family))]) {
      const fit = model.bundles.filter((b) => b.network === network && b.family === f && b.price <= amount + 1e-9 && hasVolume(b) && tabOf(b) !== "check");
      if (!fit.length) continue;
      const b = fit.reduce((x, y) => (y.mb > x.mb ? y : x));
      lines.push({ key: f, tab: "apps", name: typeName(f), data: model.dataShown(b),
        note: [b.kind === "video" ? "Video apps only" : "Some apps only", b.price < amount - 1e-9 ? `the ${model.money(b.price)} bundle` : null].filter(Boolean).join(" · ") });
    }
  }
  if (!lines.length) return null;
  return (
    <details className="group/types mt-3 rounded-2xl border border-border bg-background/50" data-testid="other-types">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3.5 text-[15px] font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        Other {info.name} types for {model.money(amount)}
        <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open/types:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <ul className="grid gap-1.5 px-2.5 pb-2.5 sm:grid-cols-2">
        {lines.map((l) => {
          const T = TAB_INFO[l.tab];
          return (
            <li key={l.key} className={cn("flex items-center gap-2.5 rounded-xl px-2.5 py-2", T.head)} data-testid="other-type">
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", T.dot)} aria-hidden><T.icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-bold">{l.name}</span>
                  <span className="whitespace-nowrap text-base font-black tabular-nums">{l.data}</span>
                </span>
                <span className="block text-xs text-muted-foreground">{l.note}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="px-3.5 pb-3 text-xs text-muted-foreground">These are facts, not a ranking: night, morning and app-only data can't be compared with data you use any time.</p>
    </details>
  );
}

/** "Tip: GH¢10 gives more than GH¢10.50": when the amount sits in a spend cliff of a pay-any-amount
 *  table (spending a bit more buys less data, model.materialCliffsOf). */
export function CliffTip({ model, network, amount }: { model: BundleModel; network: string; amount: number }) {
  const hit = model.sources.filter((s) => s.network === network && s.kind !== "night")
    .flatMap((s) => model.materialCliffsOf(s.table).map((c) => ({ s, c })))
    .find(({ c }) => amount >= c.from - 1e-9 && amount <= c.to + 1e-9);
  if (!hit) return null;
  const { s, c } = hit;
  return (
    <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm" data-testid="cliff-tip">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <span><b>Tip:</b> on {typeName(s.family)}, {model.money(c.better)} gives {model.fmtData(c.betterMb, network)}, more than {model.money(amount)} does. Anything from {model.money(c.from)} to {model.money(c.to)} gives less.</span>
    </p>
  );
}

/** The big "how to buy" card in the network's colour: the regular route's dial line, with Dial / Copy. */
export function BuyCard({ model, network }: { model: BundleModel; network: string }) {
  const info = model.networkInfo(network);
  const s = model.sources.find((x) => x.network === network && x.ussd && x.kind !== "night");
  const route = s?.ussd;
  const code = route ? dialCodes(route)[0] : undefined;
  if (!route || !code) return null;
  const steps = route.replace(/,?\s+then\s+/g, " → ");
  return (
    <section aria-labelledby="buy-h" className="relative overflow-hidden rounded-3xl p-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)] sm:p-5" style={{ background: textSafeFill(info), color: info.ink }} data-testid="buy-card">
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/25 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="buy-h" className="flex items-center gap-1.5 text-sm font-bold opacity-90"><Phone className="h-4 w-4" aria-hidden /> To buy {info.name} data, dial</h2>
          <p className="mt-0.5 text-2xl font-black tracking-tight sm:text-3xl" data-testid="buy-steps">{steps}</p>
          <p className="mt-0.5 text-sm font-medium opacity-85">Then type your amount. Any amount from {model.money(tableRange(s!.table)[0])} to {model.money(tableRange(s!.table)[1])}.</p>
        </div>
        <div className="rounded-full bg-white/90 p-1 text-slate-950 shadow-sm dark:bg-white/90">
          <CodeActions code={code} />
        </div>
      </div>
    </section>
  );
}

/** One tap-to-open line in "Good to know" (borrowed data, a dial tip, questions, tips). */
export function Fold({ title, icon, tone, children, testId }: { title: string; icon: ReactNode; tone: string; children: ReactNode; testId?: string }) {
  return (
    <details className="group/fold border-t border-border first:border-t-0" data-testid={testId}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", tone)} aria-hidden>{icon}</span>
        <span className="min-w-0 flex-1">{title}</span>
        <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open/fold:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
