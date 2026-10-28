// "How much data do you use in a month?" Cheapest way per network to get it,
// using only bundles that last at least 30 days or never expire, with at most
// the number of purchases the reader picks (1 to 12 on a slider; default 3), all
// bought within the month. Worded for everyone (owner, 18 Oct 2026: "as simple as ABC").
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { GB_STEPS, parseState, writeState } from "@/lib/dataBundlesUrl";
import { motion } from "framer-motion";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { CalendarDays, BadgeCheck, Minus, Plus, ShoppingCart } from "lucide-react";
import { Slider } from "./LabelledSlider";
import { cn } from "@/lib/utils";
import { MAX_PURCHASES, canWin, isAllDay, type BundleModel } from "@/lib/dataBundles";
import { BuyFold, BuyLine, ComputedBadge, Details, NetPill, RollText, SectionHeading, SwipeDeck, glass, unitsLine, workedOutText, officialRatesText } from "./shared";

// GB steps for the slider (finer at the low end, where most people are).
export const STEPS = GB_STEPS;
/** Quick picks, in GB (each is one of STEPS). */
export const GB_CHIPS = [1, 5, 10, 20, 50, 100];

/** The "How often will you buy data this month?" bubble: "Once", "Up to 4 times". */
export const capLabel = (n: number) => (n === 1 ? "Once" : `Up to ${n} times`);
/** The "how often" slider starts at 1 ("Once"), the owner's choice (18 Oct 2026). The planner
 *  maths keeps its own API default (DEFAULT_PURCHASES) for other callers. */
export const PLANNER_START_CAP = 1;
/** "Buy once", "Buy 2 times". */
export const buyTimes = (n: number) => (n === 1 ? "Buy once" : `Buy ${n} times`);

/** A big slider for thumbs: 36px handle, thicker track, tall touch area. */
const sliderBig = "py-4 [&_[role=slider]]:h-9 [&_[role=slider]]:w-9 [&_[role=slider]]:border-[3px] [&>span:first-child]:h-3";

/** "once", "up to 4 times": the phone row's value after "I buy data". */
export const oftenWords = (n: number) => (n === 1 ? "once" : `up to ${n} times`);

/** The phone rows' slider: a 28px thumb (52px touch area with the labelled slider's own padding). */
const sliderRow = "py-2 [&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:border-[3px] [&>span:first-child]:h-2.5";

/** The "I buy data" slider's own colours (the GB slider keeps the site's blue): a teal-to-emerald
 *  filled part on a pale teal track, and a matching thumb ring. Light theme uses the deeper teal-600 /
 *  emerald-600 (at least 3:1 against the white card, WCAG 1.4.11); dark uses teal-500 / emerald-500. */
export const sliderOften = [
  "[&>span:first-child]:bg-teal-600/15 dark:[&>span:first-child]:bg-teal-400/20",
  "[&>span:first-child>span]:bg-[linear-gradient(90deg,#0d9488,#059669)] dark:[&>span:first-child>span]:bg-[linear-gradient(90deg,#14b8a6,#10b981)]",
  "[&_[role=slider]]:border-emerald-600 dark:[&_[role=slider]]:border-emerald-400",
].join(" ");

/** One phone row: the label, the value with small - and + beside it, and the slider under them. */
function PhoneRow({ label, value, less, more, testId, children }: {
  label: string; value: ReactNode; testId: string; children: ReactNode;
  less: { label: string; on: () => void; disabled: boolean }; more: { label: string; on: () => void; disabled: boolean };
}) {
  const btn = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-background/60 text-foreground transition hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";
  return (
    <div data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-black leading-tight" data-testid={`${testId}-value`}>{value}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" className={btn} onClick={less.on} disabled={less.disabled} aria-label={less.label}><Minus className="h-5 w-5" aria-hidden /></button>
          <button type="button" className={btn} onClick={more.on} disabled={more.disabled} aria-label={more.label}><Plus className="h-5 w-5" aria-hidden /></button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function MonthlyPlanner({ model }: { model: BundleModel }) {
  const [idx, setIdx] = useState(STEPS.indexOf(10));
  const [cap, setCap] = useState<number>(PLANNER_START_CAP);
  const capId = useId();
  // ?gb=10&often=1 in the URL: read once after load, written back with replaceState.
  const [fromUrl, setFromUrl] = useState(false);
  useEffect(() => {
    const s = parseState(window.location.search);
    setIdx(STEPS.indexOf(s.gb)); setCap(s.often); setFromUrl(true);
  }, []);
  useEffect(() => { if (fromUrl) writeState({ gb: STEPS[idx], often: cap }); }, [fromUrl, idx, cap]);
  const gb = STEPS[idx];
  // "10 GB" means 10 x networks.<id>.mbPerGb MB (1,024 for every network).
  const plans = useMemo(() => model.networks.map((n) => ({ n, p: model.cheapestMonthlyPlan(n, gb * model.mbPerGb(n), cap) })), [model, gb, cap]);
  // "Save GH¢X": what allowing more buys would save on each network, and the cap that does it (model.moreBuysSaving).
  const savings = useMemo(() => Object.fromEntries(model.networks.map((n) => [n, model.moreBuysSaving(n, gb * model.mbPerGb(n), cap)])), [model, gb, cap]);
  // Joint cheapest only when the totals SHOW the same.
  const winners = model.cheapestTotals(plans);
  // One small line when another network gives more data for a little more money (model.planUpsell).
  const upsell = model.planUpsell(plans);
  const tie = winners.size > 1;
  // Cheapest first; the cards slide to their new places when the order changes (layout animation).
  const ordered = [...plans].sort((a, b) => (a.p && b.p ? a.p.total - b.p.total : a.p ? -1 : b.p ? 1 : 0));
  const anyAmount = [...new Set(model.networks.flatMap((n) => model.monthlySources(n).map(({ s }) => s.label.replace(/,.*$/, ""))))];
  // From the data: the all-day families left out because their bundles expire inside 30 days,
  // and whether any shared family pack is in.
  const shortFams = [...new Set(model.bundles.filter((b) => isAllDay(b) && canWin(b) && !model.lastsAMonth(b)).map((b) => `${model.networkInfo(b.network).name} ${b.family}`))];
  const familyIn = model.bundles.some((b) => b.kind === "family" && model.lastsAMonth(b));
  const step = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-background/60 text-foreground transition hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";
  const capFrac = (cap - 1) / (MAX_PURCHASES - 1);
  // The bubble: centred on the thumb, clamped inside the slider at both ends. Measured after
  // mount (the slider's width and the bubble's own width); before that (server HTML, first
  // paint) a CSS fallback keeps it inside the track.
  const capRoot = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [geo, setGeo] = useState<{ w: number; bw: number } | null>(null);
  useEffect(() => {
    const measure = () => { if (capRoot.current && bubble.current) setGeo({ w: capRoot.current.clientWidth, bw: bubble.current.offsetWidth }); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [cap]);
  const bubbleLeft = geo ? Math.min(geo.w - geo.bw, Math.max(0, 18 + capFrac * (geo.w - 36) - geo.bw / 2)) : null;

  return (
    <section aria-labelledby="month-h" id="monthly" className="scroll-mt-24">
      <SectionHeading id="month-h" eyebrow="Monthly planner" title="How much data do you use in a month?" icon={<CalendarDays className="h-4 w-4" aria-hidden />}>
        Move the slider. We show the cheapest way on each network.
      </SectionHeading>

      <div className={cn(glass, "p-4 sm:p-6")}>
        {/* Phones (below 640px): exactly two rows, each a value with small - and + and a labelled
            slider under it, then the "Not sure?" tip (owner-approved "Planner D", 27 Oct 2026).
            From 640px: the controls below, unchanged. */}
        <div className="space-y-3 sm:hidden" data-testid="plan-phone">
          <PhoneRow
            label="I use about"
            value={<><span className="tabular-nums">{gb.toLocaleString("en-GB")} GB</span> <span className="text-sm font-semibold text-muted-foreground">a month</span></>}
            testId="plan-row-gb"
            less={{ label: "Less data", on: () => setIdx((i) => Math.max(0, i - 1)), disabled: idx === 0 }}
            more={{ label: "More data", on: () => setIdx((i) => Math.min(STEPS.length - 1, i + 1)), disabled: idx === STEPS.length - 1 }}
          >
            <Slider className={sliderRow} min={0} max={STEPS.length - 1} step={1} value={[idx]} onValueChange={([v]) => setIdx(v)} aria-label="How much data you use in a month" aria-valuetext={`${gb} GB a month`} />
          </PhoneRow>
          <PhoneRow
            label="I buy data"
            value={<span>{oftenWords(cap)}</span>}
            testId="plan-row-often"
            less={{ label: "Buy less often", on: () => setCap((c) => Math.max(1, c - 1)), disabled: cap === 1 }}
            more={{ label: "Buy more often", on: () => setCap((c) => Math.min(MAX_PURCHASES, c + 1)), disabled: cap === MAX_PURCHASES }}
          >
            <Slider className={cn(sliderRow, sliderOften)} min={1} max={MAX_PURCHASES} step={1} value={[cap]} onValueChange={([v]) => setCap(v)} aria-label="How often you will buy data this month" aria-valuetext={capLabel(cap)} />
          </PhoneRow>
          <p className="text-xs text-muted-foreground">Not sure? Settings → Mobile data.</p>
        </div>
        <div className="max-sm:hidden" data-testid="plan-desktop-controls">
        <p className="text-sm text-muted-foreground">I use about</p>
        {/* - and + move one step; the figure rolls to the new amount. */}
        <div className="mt-1 flex items-center justify-between gap-3">
          <button type="button" className={step} onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label="Less data">
            <Minus className="h-5 w-5" aria-hidden />
          </button>
          <p className="text-center leading-none" data-testid="plan-gb">
            <span className="block text-4xl font-black tabular-nums sm:text-5xl"><RollText text={`${gb.toLocaleString("en-GB")} GB`} /></span>
            <span className="mt-1 block text-sm font-semibold text-muted-foreground">a month</span>
          </p>
          <button type="button" className={step} onClick={() => setIdx((i) => Math.min(STEPS.length - 1, i + 1))} disabled={idx === STEPS.length - 1} aria-label="More data">
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <Slider
          className={cn("mt-1", sliderBig)}
          min={0}
          max={STEPS.length - 1}
          step={1}
          value={[idx]}
          onValueChange={([v]) => setIdx(v)}
          aria-label="How much data you use in a month"
          aria-valuetext={`${gb} GB a month`}
        />
        <div className="flex justify-between text-[11px] text-muted-foreground" aria-hidden>
          <span>{STEPS[0]} GB</span><span>{STEPS[STEPS.length - 1]} GB</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6" role="group" aria-label="Quick amounts">
          {GB_CHIPS.map((g) => {
            const on = gb === g;
            return (
              <button key={g} type="button" aria-pressed={on} onClick={() => setIdx(STEPS.indexOf(g))}
                className={cn("relative min-h-11 rounded-xl border text-[13px] font-bold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", on ? "border-foreground text-background" : "border-border hover:border-foreground/40")}>
                {on && <motion.span layoutId="plan-chip" data-hl="" className="absolute inset-0 rounded-[11px] bg-foreground" transition={{ type: "spring", stiffness: 500, damping: 38 }} aria-hidden />}
                <span className="relative">{g} GB</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Not sure? Your phone shows it in Settings → Mobile data.</p>

        <div className="mt-4 rounded-xl border border-border bg-background/60 p-3">
          <p id={capId} className="flex items-center gap-2 text-sm font-semibold"><ShoppingCart className="h-4 w-4 shrink-0" aria-hidden /> How often will you buy data this month?</p>
          {/* 1 to 12 on a slider; the bubble over the thumb says it in words. */}
          {/* The bubble sits ABOVE the thumb (bottom: 100% of the slider box; the thumb is 4px
              below its top), centred on the thumb and clamped inside the slider at both ends. */}
          <SliderPrimitive.Root
            className="relative mt-10 flex w-full touch-none select-none items-center py-4"
            min={1}
            max={MAX_PURCHASES}
            step={1}
            value={[cap]}
            onValueChange={([v]) => setCap(v)}
            aria-labelledby={capId}
            data-testid="cap-slider"
            ref={capRoot}
          >
            <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-muted">
              <SliderPrimitive.Range className="absolute h-full bg-emerald-400" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              aria-label="How often you will buy data this month"
              aria-valuetext={capLabel(cap)}
              className="relative block h-9 w-9 rounded-full border-[3px] border-emerald-400 bg-background shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring before:absolute before:-inset-[7px] before:rounded-full before:content-['']"
            />
            <span
              aria-hidden
              ref={bubble}
              className="pointer-events-none absolute bottom-full whitespace-nowrap rounded-lg bg-emerald-400 px-2 py-1 text-xs font-bold leading-none text-slate-950 shadow"
              style={bubbleLeft !== null ? { left: bubbleLeft } : { left: `calc(18px + ${capFrac} * (100% - 36px))`, transform: `translateX(-${(capFrac * 100).toFixed(2)}%)` }}
              data-testid="cap-bubble"
            >
              {capLabel(cap)}
            </span>
          </SliderPrimitive.Root>
          <div className="flex justify-between text-[11px] text-muted-foreground" aria-hidden>
            <span>Once</span><span>12 times</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Buying more often can be cheaper. Buying once is simpler.</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          All buys happen within one month.
        </p>
        </div>

        <div className="mt-5" aria-live="polite">
        <SwipeDeck
          id="plans"
          label="Plans by network, cheapest first"
          testId="plan-swipe"
          slotTestId="plan-slot"
          dotTestId="plan-dot"
          layout
          items={ordered.map(({ n, p }) => {
            const info = model.networkInfo(n);
            const isBest = !!p && winners.has(n);
            const anyWorked = !!p?.items.some((i) => i.bundle.computed);
            const purchases = p ? p.items.reduce((s, i) => s + i.count, 0) : 0;
            // Full how-to-buy lines (with where they come from) that the card shortens.
            const full = p ? [...new Set(p.items.filter((i) => model.howToBuy(i.bundle) !== model.buyShort(i.bundle)).map((i) => model.howToBuy(i.bundle)).filter((t): t is string => !!t))] : [];
            const labels = p ? [...new Set(p.items.filter((i) => i.bundle.computed).map((i) => i.bundle.computedLabel).filter(Boolean))] : [];
            return {
              id: n,
              name: info.name,
              tab: (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: info.color }} aria-hidden />
                  {info.name}
                  {isBest && <><BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden /><span className="sr-only"> ({tie ? "tied cheapest" : "cheapest"})</span></>}
                </span>
              ),
              content: (
              <div
                data-testid="plan-card"
                data-net={n}
                className={cn("flex h-full flex-col rounded-2xl border p-4", isBest ? "border-transparent bg-background shadow-lg" : "border-border bg-background/50")}
                style={isBest ? { boxShadow: `0 0 0 2px ${info.color}, 0 12px 30px -12px ${info.color}` } : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <NetPill info={info} />
                  {isBest && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-[15px] lg:text-base font-bold text-background">
                      <BadgeCheck className="h-3 w-3" aria-hidden /> {tie ? "Tied cheapest" : "Cheapest"}
                    </span>
                  )}
                </div>
                {p ? (
                  <>
                    {/* The final figure, rendered directly: an interactive output never counts up. */}
                    <p className="mt-3 text-4xl font-black tabular-nums" data-testid="plan-total" data-net={n}><RollText text={model.money(p.total)} /></p>
                    <p className="mt-1 flex flex-wrap items-center gap-2">
                      {/* Plain text, not a button look: "Buy once", "Buy 3 times". */}
                      <span className="text-sm font-bold" data-testid="plan-purchases">
                        {buyTimes(purchases)}
                      </span>
                      <span className="text-sm text-muted-foreground" data-testid="plan-gets">You get {model.fmtData(p.mb, n)}</span>
                      {savings[n] && (
                        <button
                          type="button"
                          onClick={() => setCap(savings[n]!.cap)}
                          aria-label={`Buy in smaller bits, save ${savings[n]!.text} (buy up to ${savings[n]!.cap} times)`}
                          className="inline-flex min-h-11 items-center rounded-full border border-emerald-600/40 bg-emerald-500/10 px-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-emerald-400/40 dark:text-emerald-200"
                          data-testid="plan-save"
                          data-net={n}
                          data-cap={savings[n]!.cap}
                        >
                          Buy in smaller bits, save {savings[n]!.text}
                        </button>
                      )}
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {p.items.map((it) => (
                        <li key={`${it.bundle.name}-${it.bundle.price}-${it.bundle.validity}`}>
                          {/* The name on one line, "12.80 GB · 30 days" under it, and the price in its own
                              top-aligned column: the text never wraps around the price. */}
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3" data-testid="plan-item">
                            <div className="min-w-0">
                              <p className="font-semibold"><span className="font-bold tabular-nums">{it.count} ×</span> {model.nameNoPrice(it.bundle)}</p>
                              <p className="text-[15px] text-foreground/85 lg:text-base" data-testid="plan-item-detail">{model.fmtData(it.bundle.mb, n)} · {model.validityText(it.bundle)}</p>
                            </div>
                            <p className="whitespace-nowrap text-right font-bold tabular-nums" data-testid="plan-item-price">{model.money(it.bundle.price)}</p>
                          </div>
                          {/* How to buy each purchase, short (the full line is in details): on the cheapest card only; the others fold it below. */}
                          {isBest && model.buyShort(it.bundle) && <div className="mt-1"><BuyLine text={model.buyShort(it.bundle)!} testId="plan-buy" /></div>}
                        </li>
                      ))}
                    </ul>
                    {!isBest && p.items.some((it) => model.buyShort(it.bundle)) && (
                      <div className="mt-2">
                        <BuyFold open={false} testId="plan-buy-fold">
                          {p.items.filter((it) => model.buyShort(it.bundle)).map((it) => (
                            <div key={`${it.bundle.name}-${it.bundle.price}`} className="space-y-1">
                              <p className="text-xs font-semibold">{it.count} × {model.nameNoPrice(it.bundle)}</p>
                              <BuyLine text={model.buyShort(it.bundle)!} testId="plan-buy" />
                            </div>
                          ))}
                        </BuyFold>
                      </div>
                    )}
                    {anyWorked && <div className="mt-2"><span className="inline-flex items-center rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-bold text-emerald-900 dark:text-emerald-100" data-testid="trust" data-level="worked">{officialRatesText(n)}</span></div>}
                    {(full.length > 0 || labels.length > 0) && (
                      <Details className="mt-1">
                        {labels.map((l) => <p key={l}>{l}.</p>)}
                        {full.map((t) => <p key={t}>How to buy, in full: {t}</p>)}
                      </Details>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Not possible on {info.name} if you {cap === 1 ? "buy once" : `buy up to ${cap} times`}.{cap < MAX_PURCHASES && " Try buying more often."}
                  </p>
                )}
              </div>
              ),
            };
          })}
        />
        </div>
        {upsell && <p className="mt-2 text-sm font-semibold" data-testid="plan-upsell">{upsell.text}</p>}
        <Details summary="What we count" className="mt-3">
          <p>
            We only count bundles you can use any time that last 30 days or never expire. You buy at most {cap === 1 ? "once" : `${cap} times`}, all within one month. We mix bundles, or buy one more than once, when that is cheaper.
            {anyAmount.length > 0 && <> Pay-any-amount data ({anyAmount.join(", ")}) is planned to the exact pesewa.{model.flexi && " For Telecel Flexi we use the never-expires option, or the expiring option only where it lasts 30 days or more."}</>}
            {familyIn && " Family packs count too (see each network's page for how to share them)."}
            {shortFams.length > 0 && <> We leave out bundles that end sooner ({shortFams.join(", ")}). Buying them again and again is not the same as a month of data.</>}
            {" "}{unitsLine(model)}.
          </p>
        </Details>
      </div>
    </section>
  );
}
