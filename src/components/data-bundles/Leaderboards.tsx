// Like-for-like leaderboards: one tab per group, ranked by value (the data each
// GH¢10 of the price buys; the same order as price per GB, cheapest first).
// Rows never mix groups; a night bundle is never ranked against an all-day one.
// Any-amount data appears as one row per published rate band (with its spend
// range). Rows whose “Every GH¢10” figure shows the same share a rank. Bundles whose
// figures the network's own pages dispute, and bundles usable only on some
// days or hours (e.g. weekend-only), are listed but never ranked.
//
// On a network page the `network` prop is the ONLY network shown: it is read on
// every render, never copied into state, so moving between network pages in the
// app (AT -> MTN) can never leave the previous network's rows on screen.
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Clock, Infinity as InfinityIcon, ListOrdered, Moon, PhoneCall, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICE_FILTERS, SMALL_MAX, TYPE_FILTERS, boardHint, boardId, emptyBoardText, parseBoardId, type Bundle, type BundleModel, type PriceFilter } from "@/lib/dataBundles";
import { parseBoardState, writeBoardState } from "@/lib/dataBundlesUrl";
import { FaceOffBars } from "./FaceOff";
import { ChannelNote, ConflictNote, Details, NetPill, OtherSourceNote, SectionHeading, TrustBadge, TrustReasons, trustOf, ValueBar, extrasText, glass, textSafeFill, unitsLine, useGrowIn, valueExplainer, workedOutText, PriceLead, perGbLine } from "./shared";
import { PriceHistory } from "./PriceHistory";

/** Rows shown before "Show more". */
export const TOP = 5;

/** A small icon per type pill. */
const TYPE_ICONS: Record<string, LucideIcon> = { allday: Clock, noexpiry: InfinityIcon, month: CalendarDays, night: Moon, combo: PhoneCall };

/** The board has two controls (owner, 22 Oct 2026): a price switch (Small buys up to GH¢20 |
 *  Any price) and a type (Any time, Never expires, 30 days, Night, Calls + data). The board is
 *  their combination (model: boardId). It opens on Small buys + Any time. On the comparison page
 *  (no `network`) the face-off bars sit at its top as its quick summary, following the
 *  selection, with each network's "See all … bundles" link. ?board=any&type=night in the URL
 *  (only when not the default): read once after load, written back with replaceState. */
export function Leaderboards({ model, network, basePath }: { model: BundleModel; network?: string; basePath?: string }) {
  const [price, setPrice] = useState<PriceFilter>("small");
  const [type, setType] = useState<string>("allday");
  const [fromUrl, setFromUrl] = useState(false);
  useEffect(() => { const s = parseBoardState(window.location.search); setPrice(s.price); setType(s.type); setFromUrl(true); }, []);
  useEffect(() => { if (fromUrl) writeBoardState({ price, type }); }, [fromUrl, price, type]);
  const board = boardId(price, type);
  // The reader's pick on the comparison page. On a network page it is ignored (see above).
  const [picked, setPicked] = useState<string>("all");
  const net = network ?? picked;
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="ranks-h" id="rankings" className="scroll-mt-24">
      <SectionHeading id="ranks-h" eyebrow="Winners board" title="Best value bundles" icon={<ListOrdered className="h-4 w-4" aria-hidden />}
        info={<><p>Longer bar = more data for your money.</p><p>{valueExplainer(model)}</p></>} />

      <div className={cn(glass, "p-3 sm:p-5")}>
        {/* Price: a two-part switch; the highlight slides to the chosen side. */}
        <div role="group" aria-label="Price" data-testid="board-price" className="grid w-full grid-cols-2 rounded-2xl border border-border bg-muted/60 p-1 sm:max-w-xl">
          {PRICE_FILTERS.map((p) => {
            const on = price === p.id;
            return (
              <button key={p.id} type="button" aria-pressed={on} data-testid="board-price-option" data-id={p.id}
                onClick={() => { setPrice(p.id); setExpanded(false); }}
                className={cn("relative isolate flex min-h-12 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "text-background" : "text-foreground hover:text-foreground/80")}>
                {/* The highlight: one shared element that slides (transform) to the chosen side; at once under reduced motion. */}
                {on && <motion.span layoutId={`board-price-thumb-${network ?? "all"}`} data-hl aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-foreground shadow-sm"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} />}
                <span className="text-[15px] font-extrabold lg:text-base">{p.short}</span>
                {p.id === "small" && <span className={cn("text-[15px] font-medium lg:text-base", on ? "text-background/90" : "text-foreground/80")}>(up to GH¢{SMALL_MAX})</span>}
              </button>
            );
          })}
        </div>

        {/* Type: equal pills in an even grid (phones: 3 on top, 2 wider below; wider screens: one row). */}
        <div role="group" aria-label="Bundle type" data-testid="board-type" className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-5">
          {TYPE_FILTERS.map((t, i) => {
            const on = type === t.id;
            const Icon = TYPE_ICONS[t.id] ?? Clock;
            return (
              <button key={t.id} type="button" aria-pressed={on} data-testid="board-type-option" data-id={t.id}
                onClick={() => { setType(t.id); setExpanded(false); }}
                className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1.5 text-center text-[15px] font-bold leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-1 sm:min-h-12 sm:flex-row sm:gap-1.5 lg:text-base",
                  i < 3 ? "col-span-2" : "col-span-3",
                  on ? "border-foreground bg-foreground text-background" : "border-border bg-background/60 text-foreground hover:border-foreground/40")}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* The quick summary: each network's best of this board, three bars (comparison page only). */}
        {!network && <div data-testid="board-summary"><FaceOffBars model={model} groupId={board} basePath={basePath} /></div>}

        {!network && (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by network">
            {["all", ...model.networks].map((id) => {
              const active = net === id;
              const info = id === "all" ? null : model.networkInfo(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { setPicked(id); setExpanded(false); }}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active && !info && "border-foreground bg-foreground text-background",
                    !active && "border-border bg-background hover:border-foreground/40",
                  )}
                  style={active && info ? { background: textSafeFill(info), color: info.ink, borderColor: info.color } : undefined}
                >
                  {info ? info.name : "All networks"}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3" data-testid="board" data-board={board}>
          <Board key={board} model={model} groupId={board} hint={boardHint(board)} net={net} expanded={expanded} onExpand={() => setExpanded(true)}
            onAnyPrice={() => { setPrice("any"); setExpanded(false); }} />
        </div>
      </div>
    </section>
  );
}

function Board({ model, groupId, hint, net, expanded, onExpand, onAnyPrice }: { model: BundleModel; groupId: string; hint: string; net: string; expanded: boolean; onExpand: () => void; onAnyPrice?: () => void }) {
  const small = parseBoardId(groupId).small;
  const { ranked, disputed, restricted } = useMemo(() => model.leaderboardRows(groupId, net === "all" ? undefined : net), [model, groupId, net]);
  const shown = expanded ? ranked : ranked.slice(0, TOP);
  // Bars are relative to the best value on this board (rank 1 = full bar).
  const best = Math.max(...ranked.map((r) => model.valueMb(r.bundle) ?? 0), 1e-9);
  // Race start: the bars grow in one after another the first time the board is seen.
  const listRef = useRef<HTMLOListElement>(null);
  const grow = useGrowIn(listRef);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3">
        <p className="text-xs text-muted-foreground">{hint}.</p>
        <Details summary="How we rank">
          {small && <p>Small buys: bundles at GH¢20 or less. A pay-any-amount price is shown once, at its best value up to GH¢20.</p>}
          <p>Each list only ranks bundles of the same type. If two show the same value figure, they share a place (shown as “Tied”). If the price is the same, more data ranks higher. {unitsLine(model)}.</p>
          {groupId === "combo" && <p>We rank by the data only. Minutes and SMS are listed, but not counted.</p>}
          {groupId === "night" && <p>Night hours differ by network. Check the hours on each row.</p>}
          <p>Rows marked “From … official rates” are worked out exactly from the network's own published price per MB for that amount.</p>
        </Details>
      </div>
      {ranked.length === 0 && disputed.length === 0 && restricted.length === 0 ? (
        small && (net === "all" || model.leaderboardRows(parseBoardId(groupId).group, net).ranked.length > 0) ? (
          // A Small buys combination with nothing in it: say so, and offer Any price.
          <p className="py-6 text-center text-[15px] text-foreground/85 lg:text-base" data-testid="board-empty">
            {emptyBoardText(groupId).replace(/ – try Any price$/, "")} –{" "}
            <button type="button" onClick={onAnyPrice} className="inline-flex min-h-11 items-center font-bold underline underline-offset-4 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">try Any price</button>
          </p>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground" data-testid="board-empty">This network has no bundles of this type.</p>
        )
      ) : (
        // Keyed by the network filter: a new filter replaces the list at once (no exit
        // animation), so old and new rows are never on screen together.
        <LayoutGroup id={`board-${groupId}-${net}`} key={net}>
          <ol ref={listRef} className="space-y-2" data-testid="lb-list">
            <AnimatePresence initial={false}>
              {shown.map((r, i) => (
                <Row key={rowKey(r.bundle)} model={model} b={r.bundle} share={grow ? (model.valueMb(r.bundle) ?? 0) / best : 0} delay={grow ? Math.min(i, 9) * 0.09 : 0}
                  rankLabel={r.joint ? `Tied ${ordinal(r.rank)}` : String(r.rank)} first={r.rank === 1} joint={r.joint} />
              ))}
            </AnimatePresence>
          </ol>
        </LayoutGroup>
      )}
      {!expanded && ranked.length > TOP && (
        <button type="button" onClick={onExpand} className="mt-3 min-h-11 w-full rounded-xl border border-dashed border-border py-2 text-sm font-semibold hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Show more ({ranked.length - TOP} more)
        </button>
      )}
      {restricted.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Some days or hours only (not ranked)</p>
          <Details summary="Why not ranked" className="mb-2">
            <p>These only work on some days or at some hours. So we can't fairly compare them with bundles you can use any time.</p>
          </Details>
          <ul className="space-y-2">
            {restricted.map((b) => <Row key={rowKey(b)} model={model} b={b} share={0} rankLabel="–" unranked="restricted" />)}
          </ul>
        </div>
      )}
      {disputed.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Not ranked: details not clear – check with the network</p>
          <ul className="space-y-2">
            {disputed.map((b) => <Row key={rowKey(b)} model={model} b={b} share={0} rankLabel="?" unranked="disputed" />)}
          </ul>
        </div>
      )}
    </div>
  );
}

/** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st ... */
export const ordinal = (n: number) => {
  const t = n % 100;
  const s = t >= 11 && t <= 13 ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";
  return `${n}${s}`;
};

const rowKey = (b: Bundle) => `${b.network}-${b.family}-${b.name}-${b.price}-${b.validity}`;

function Row({ model, b, share, rankLabel, first, joint, unranked, delay = 0 }: {
  model: BundleModel; b: Bundle; share: number; rankLabel: string; first?: boolean; joint?: boolean; unranked?: "disputed" | "restricted"; delay?: number;
}) {
  const disputed = unranked === "disputed";
  const info = model.networkInfo(b.network);
  const extras = extrasText(b);
  const notes = !!model.channelNote(b) || !!b.otherSource?.summary?.trim() || disputed || !!b.computedLabel;
  const cls = cn("rounded-xl border bg-background/70 p-3", disputed ? "border-red-500/40" : "border-border");
  const body = (
    <div className="flex items-start gap-3">
      <span
        className={cn("mt-0.5 flex h-8 min-w-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 text-[15px] font-extrabold lg:text-base", first ? "bg-foreground text-background" : "bg-muted")}
        aria-label={unranked ? "Not ranked" : joint ? rankLabel : `Place ${rankLabel}`}
      >
        {rankLabel}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <NetPill info={info} />
            <span className="font-semibold leading-snug">{model.nameNoPrice(b)}</span>
          </div>
        </div>
        {/* The real price and data first; the value yardstick under it, smaller. */}
        <PriceLead model={model} b={b} className="mt-1.5 text-base sm:text-lg" />
        <p className="mt-0.5 text-[15px] text-foreground/85 lg:text-base">{model.validityText(b)}{extras && <> · {extras}</>}</p>
        {/* The bar is the main signal; the figure is the line under it. */}
        {!unranked && <ValueBar share={share} color={info.color} className="mt-1.5 h-3.5" delay={delay} />}
        {model.valueText(b) && <p className="mt-1.5 text-[15px] text-foreground/90 lg:text-base" data-testid="lb-value-line">Value: <b className="tabular-nums" data-testid="lb-value">{model.valueText(b)}</b> per {model.money(model.valueStep)}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {first && joint && <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[15px] lg:text-base font-bold text-background">Tied best</span>}
          <TrustBadge b={b} />
        </div>
        {(
          <Details className="mt-1">
            <TrustReasons b={b} />
            <PriceHistory model={model} b={b} />
            {perGbLine(model, b) && <p data-testid="lb-cpg">{perGbLine(model, b)}</p>}
            {b.computed && b.computedLabel && <p>{b.computedLabel}.</p>}
            <ChannelNote model={model} b={b} noteShown={false} />
            <OtherSourceNote b={b} />
            {disputed && <ConflictNote b={b} />}
          </Details>
        )}
      </div>
    </div>
  );
  if (unranked) return <li className={cls}>{body}</li>;
  return (
    <motion.li layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }} className={cls}>
      {body}
    </motion.li>
  );
}
