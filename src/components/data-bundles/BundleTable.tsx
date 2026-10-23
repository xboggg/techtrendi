// Every fixed bundle a network sells: one clean list of cards at every width (no table, no
// sideways scroll on phones), with family chips, search, a type filter and sort.
//
// The default order groups bundles by family (each family's own rules one tap away), cheapest
// per GB first inside a family. Bundles that are never ranked (figures disputed, personalised,
// new and being verified, unconfirmed from an older page) always come last, in their own
// labelled group, whatever the sort. Each card leads with its price and data ("GH¢400 bundle →
// 263.38GB"), then how long it lasts, "Value: X per GH¢10" (a measure of value, never a purchase),
// the trust level, and How to buy ▾ (Dial / Copy). The price per GB is under More info.
import { Fragment, useId, useMemo, useState } from "react";
import { Search, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TABLE_SECTIONS, expiryDisputed, hasVolume, neverExpires, tableSection, type Bundle, type BundleModel, type Kind } from "@/lib/dataBundles";
import { BuyFold, BuyLine, CodesIn, OperatorTitle, appSourceText, fromAppOnly, ChannelNote, CodeActions, ConflictNote, Details, dialCodes, KIND_LABEL, KindBadge, OtherSourceNote, SectionHeading, SourceRef, TrustBadge, TrustReasons, trustOf, extrasText, glass, hasNotes, perGb, unitsLine, ussdText, PriceLead, perGbLine } from "./shared";
import { PriceHistory } from "./PriceHistory";

type SortKey = "grouped" | "price" | "data" | "validity";
const SORTS: { id: SortKey; label: string }[] = [
  { id: "grouped", label: "By family" },
  { id: "price", label: "Price, low to high" },
  { id: "data", label: "Most data" },
  { id: "validity", label: "Lasts longest" },
];
// How long a bundle lasts, for sorting: no expiry first, unknown last.
const lastKey = (b: Bundle) => (neverExpires(b) ? Infinity : b.days ?? -1);
const UNRANKED = TABLE_SECTIONS[TABLE_SECTIONS.length - 1];
/** The list's orders. "By family": inside each family, cheapest first (GH¢1, GH¢5, GH¢10). */
export const bundleSorts = (model: BundleModel): Record<SortKey, (a: Bundle, b: Bundle) => number> => {
  const cpg = (b: Bundle) => (hasVolume(b) ? model.costPerGb(b) : Infinity);
  const vol = (b: Bundle) => (hasVolume(b) ? b.mb : -1);
  // NaN-safe: two never-expiring bundles (Infinity - Infinity) or two unlimited ones tie, never NaN.
  const d = (x: number, y: number) => (x === y ? 0 : x < y ? -1 : 1);
  return {
    grouped: (a, b) => d(a.price, b.price) || d(vol(b), vol(a)),
    price: (a, b) => d(a.price, b.price) || d(vol(b), vol(a)),
    data: (a, b) => d(vol(b), vol(a)) || d(a.price, b.price),
    validity: (a, b) => d(lastKey(b), lastKey(a)) || d(cpg(a), cpg(b)) || d(a.price, b.price),
  };
};
export type { SortKey };
/** Cards shown per family before "Show all" (phones: keeps a long network page short). */
export const FIRST_ROWS = 3;

export function BundleTable({ model, network, family, onFamily }: { model: BundleModel; network: string; family: string; onFamily: (f: string) => void }) {
  // Type filter: only a type this network sells is ever applied (a type picked on another
  // network's page never filters this one), so it is derived on every render.
  const [kindPick, setKind] = useState<Kind | "all">("all");
  const [sort, setSort] = useState<SortKey>("grouped");
  const [q, setQ] = useState("");
  // Long families show their first few cards and a "Show all" button (the rest stay in the page,
  // hidden). A family filter, a search or another sort shows everything.
  const [open, setOpen] = useState<Set<string>>(new Set());
  const ids = { q: useId(), kind: useId(), sort: useId(), list: useId() };
  const all = useMemo(() => model.bundles.filter((b) => b.network === network), [model, network]);
  // Families in a useful order: by their best type (all-day first, then calls + data, then the
  // restricted types; TABLE_SECTIONS), then by their cheapest price per GB.
  const families = useMemo(() => {
    const secIdx = (b: Bundle) => TABLE_SECTIONS.findIndex((s) => s.id === tableSection(b));
    const key = (f: string) => {
      const rows = all.filter((b) => b.family === f);
      return { sec: Math.min(...rows.map(secIdx)), cpg: Math.min(...rows.map((b) => (hasVolume(b) ? model.costPerGb(b) : Infinity))) };
    };
    const names = [...new Set(all.map((b) => b.family))];
    const keys = new Map(names.map((f) => [f, key(f)]));
    return names.sort((a, b) => keys.get(a)!.sec - keys.get(b)!.sec || keys.get(a)!.cpg - keys.get(b)!.cpg);
  }, [all, model]);
  const kinds = useMemo(() => [...new Set(all.map((b) => b.kind))], [all]);
  const kind: Kind | "all" = kindPick !== "all" && kinds.includes(kindPick) ? kindPick : "all";
  const famInfo = model.doc.familyInfo?.[network] ?? {};

  /** Sections in order, each sorted; the not-ranked group is always last. */
  const sections = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const r = all.filter((b) =>
      (family === "all" || b.family === family) &&
      (kind === "all" || b.kind === kind) &&
      (!needle || `${b.name} ${b.family} ${b.note ?? ""} ${b.label ?? ""}`.toLowerCase().includes(needle)));
    const sorted = r.sort(bundleSorts(model)[sort]);
    const ranked = sorted.filter((b) => tableSection(b) !== "unranked");
    const unranked = sorted.filter((b) => tableSection(b) === "unranked");
    const groups: { id: string; label: string; family?: string; rows: Bundle[] }[] = sort === "grouped"
      ? families.map((f) => ({ id: `fam-${f}`, label: f, family: f, rows: ranked.filter((b) => b.family === f) }))
      : [{ id: "flat", label: "", rows: ranked }];
    return [...groups, { ...UNRANKED, rows: unranked }].filter((s) => s.rows.length);
  }, [all, family, kind, sort, q, model, families]);
  const shown = sections.reduce((n, s) => n + s.rows.length, 0);
  const folds = (s: { rows: Bundle[] }) => sort === "grouped" && family === "all" && !q.trim() && kind === "all" && s.rows.length > FIRST_ROWS + 1;

  const info = model.networkInfo(network);
  const counts = model.bundleCounts(network);
  // Where the figures come from: web pages always; the app only when some bundle's source is an
  // app capture (MTN: the myMTN app). AT and Telecel figures all come from their web pages.
  const fromApp = all.some((b) => !/^https:\/\//.test(b.source ?? ""));
  const where = fromApp ? "own pages and app" : "own pages";
  const { pending, unconfirmed } = counts;

  return (
    <section aria-labelledby="bundles-h" id="bundles" className="scroll-mt-24">
      <SectionHeading id="bundles-h" eyebrow="All bundles" title={`All ${info.name} bundles (any price)`} icon={<Table2 className="h-4 w-4" aria-hidden />}
        info={<>
          <p>
            {counts.verified} fixed bundles as {info.name} publishes them
            {pending > 0 && <>, plus {pending} new one{pending === 1 ? "" : "s"} still being verified</>}
            {unconfirmed > 0 && <>, plus {unconfirmed} unconfirmed one{unconfirmed === 1 ? "" : "s"} from an older {info.name} page</>}
            {(pending > 0 || unconfirmed > 0) && " (not used in any ranking)"}.
          </p>
          <p>Data amounts {info.name} prints are shown word for word; GB uses {unitsLine(model)}.</p>
          <p>Scope: mobile data bundles {info.name} publishes with a price and data amount on its {where}. Offers it does not publish that way (personalised offers, borrowed data, packs with no published figures) are not listed here.</p>
        </>}>
        Grouped by family. Tap a family to see only its bundles.
      </SectionHeading>
      <div className={cn(glass, "p-3 sm:p-5")}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by package family">
          {["all", ...families].map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={family === f}
              onClick={() => onFamily(f)}
              className={cn(
                "min-h-11 rounded-full border px-3 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                family === f ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/40",
              )}
            >
              {f === "all" ? `All (${all.length})` : `${f} (${all.filter((b) => b.family === f).length})`}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <label htmlFor={ids.q} className="relative block">
            <span className="sr-only">Search bundles</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" aria-hidden />
            <input id={ids.q} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bundles"
              className="min-h-11 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label htmlFor={ids.kind} className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-muted-foreground">Type</span>
            <select id={ids.kind} value={kind} onChange={(e) => setKind(e.target.value as Kind | "all")}
              className="min-h-11 w-full rounded-lg border border-input bg-background px-2 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="all">All types</option>
              {kinds.map((k) => <option key={k} value={k}>{KIND_LABEL[k] ?? k}</option>)}
            </select>
          </label>
          <label htmlFor={ids.sort} className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-muted-foreground">Sort</span>
            <select id={ids.sort} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
              className="min-h-11 w-full rounded-lg border border-input bg-background px-2 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
          {shown} shown. Bundles we don't rank stay at the end.
        </p>

        {/* One list at every width: cards, two or three to a row on wider screens. */}
        <div className="mt-2 space-y-5" data-testid="bt-list">
          {sections.map((s, si) => (
            <Fragment key={s.id}>
              <div>
                {s.label && (
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border pb-1">
                    <div className="min-w-0">
                      <h3 className="text-sm font-black uppercase tracking-wider" data-testid="bt-section">{s.label}</h3>
                      {s.family && <FamilyBest model={model} network={network} family={s.family} />}
                    </div>
                    {s.family && famInfo[s.family] && (
                      <Details summary={`About ${s.family}`} testId="bt-family-about"><p>{famInfo[s.family]}</p><CodesIn texts={[famInfo[s.family]]} /></Details>
                    )}
                  </div>
                )}
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" id={`${ids.list}-g${si}`}>
                  {s.rows.map((b, i) => (
                    <li key={`${b.family}-${b.name}-${b.price}`} data-testid="bt-row" data-folded={folds(s) && !open.has(s.id) && i >= FIRST_ROWS ? "" : undefined}
                      className={cn(folds(s) && !open.has(s.id) && i >= FIRST_ROWS ? "hidden" : "flex", "flex-col rounded-xl border bg-background/70 p-3", s.id === UNRANKED.id ? "border-amber-500/40" : "border-border")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold leading-snug">{model.listName(b)}</p>
                          {(sort !== "grouped" || s.id === UNRANKED.id) && <p className="text-[15px] text-foreground/85 lg:text-base">{b.family}</p>}
                        </div>
                      </div>
                      {/* The real price and data first; how long it lasts; the value yardstick, smaller. */}
                      <PriceLead model={model} b={b} className="mt-1 text-base" dataClassName="text-lg" />
                      <p className="mt-0.5 text-[15px] text-foreground/85 lg:text-base" data-testid="bt-lasts">{model.shortValidity(b)}</p>
                      {hasVolume(b) && model.valueText(b)
                        ? <p className="mt-0.5 text-[15px] text-foreground/90 lg:text-base" data-testid="bt-value">{model.valueLine(b)}</p>
                        : <p className="mt-0.5 text-[15px] text-foreground/85 lg:text-base">No data amount to compare</p>}
                      <Extras model={model} b={b} networkSource={info.source} />
                    </li>
                  ))}
                </ul>
                {folds(s) && !open.has(s.id) && (
                  <button type="button" onClick={() => setOpen((o) => new Set(o).add(s.id))} aria-controls={`${ids.list}-g${si}`} data-testid="bt-more"
                    className="mt-2 inline-flex min-h-11 items-center rounded-full border border-border bg-background/60 px-4 text-sm font-semibold transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Show all {s.rows.length}{s.family ? ` ${s.family}` : ""} bundles
                  </button>
                )}
              </div>
            </Fragment>
          ))}
        </div>
        {shown === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No bundles match these filters.</p>}
      </div>
    </section>
  );
}

/** A family's best value (model.familyBest: from bundles usable at any time; a time-restricted
 *  bundle counts only when the whole family is restricted, and then its window is shown). */
function FamilyBest({ model, network, family }: { model: BundleModel; network: string; family: string }) {
  const fb = model.familyBest(network, family);
  const bestWindow = fb?.window ?? null;
  const line = fb ? model.valuePer(fb.bundle) : null;
  if (!line) return null;
  return <p className="text-[15px] text-foreground/85 lg:text-base" data-testid="bt-family-best">Best value: {line}{bestWindow ? ` (${bestWindow})` : ""}</p>;
}

function Extras({ model, b, networkSource }: { model: BundleModel; b: Bundle; networkSource: string }) {
  const extras = extrasText(b);
  const codes = ussdText(b) ? dialCodes(ussdText(b)!) : [];
  const buy = model.buyShort(b);
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        <KindBadge kind={b.kind} />
        <TrustBadge b={b} />
        {model.disputeText(b) && <span className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-bold text-amber-900 dark:text-amber-100" data-testid="bt-disputed">{model.disputeText(b)}</span>}
      </div>
      {extras && <p className="text-[15px] text-foreground/85 lg:text-base">{extras}</p>}
      <div className="flex flex-wrap items-start gap-2">
        {/* How to buy, folded: the code(s) with Dial / Copy, or the app route. */}
        {(buy || codes.length > 0) && (
          <BuyFold open={false} testId="bt-buy-fold">
            {buy ? <BuyLine text={buy} testId="bt-buy" /> : (
              <div className="flex flex-wrap gap-1.5">{codes.map((c) => <CodeActions key={c} code={c} />)}</div>
            )}
          </BuyFold>
        )}
        {/* Notes, terms, disputes and the bundle's own source: one tap away, never removed.
            The trust badge above stays visible ("! Check first", with who can buy it), so a disputed
            or conditional row is always marked; the specific reasons are the first thing inside. */}
        {/* Every listed bundle has More info: at least its price history (23 Oct 2026). */}
        {(!b.computed || hasNotes(model, b) || (b.source && b.source !== networkSource) || trustOf(b).level !== "confirmed" || (ussdText(b) && ussdText(b) !== buy) || model.shortValidity(b) !== model.validityText(b) || !!b.operatorTitle) && (
          <Details>
            <TrustReasons b={b} />
            <PriceHistory model={model} b={b} />
            {perGbLine(model, b) && <p data-testid="bt-cpg">{perGbLine(model, b)}</p>}
            <OperatorTitle model={model} b={b} />
            {fromAppOnly(b) && <p data-testid="app-source">{appSourceText(b, model.networkInfo(b.network).name)}</p>}
            {model.shortValidity(b) !== model.validityText(b) && <p data-testid="bt-lasts-full">Lasts: {model.validityText(b)}</p>}
            {ussdText(b) && <p>Code: {ussdText(b)}</p>}
            {b.note && <p>{b.note}</p>}
            {b.note && <CodesIn texts={[b.note]} />}
            <ChannelNote model={model} b={b} />
            <OtherSourceNote b={b} />
            <ConflictNote b={b} />
            {b.source && b.source !== networkSource && <SourceRef source={b.source} />}
          </Details>
        )}
      </div>
    </div>
  );
}
