// "I have GH¢ __": per network, the single purchase that gives the most all-day data
// for that money (model.bestForBudget: the finder's maths lives in the model only).
// Night-only bundles, when switched on, are shown and compared SEPARATELY:
// a night-only amount is never weighed against an all-day amount.
import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_STATE, clearQueryKeys, parseState, writeState } from "@/lib/dataBundlesUrl";
import { ShareLink, ShareWhatsApp } from "./meta";
import { motion } from "framer-motion";
import { Trophy, Moon, Infinity as InfinityIcon, Gauge as GaugeIcon, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { isConditional, type Bundle, type BundleModel, type FinderPick } from "@/lib/dataBundles";
import { BuyFold, BuyLine, OperatorTitle, appSourceText, fromAppOnly, ChannelNote, ClampNote, Details, KindBadge, NetPill, OtherSourceNote, RollText, TrustBadge, TrustReasons, trustOf, textSafeFill, unitsLine, useAmountText, ussdText, workedOutText } from "./shared";

/** Quick amounts on the console: two rows of five on phones, one row from 640px. */
export const CHIPS = [1, 2, 3, 5, 10, 20, 50, 100, 200, 400];
/** What − and + change the amount by. */
export const STEP = 1;
const LASTS = [
  { id: 0, label: "Any" },
  { id: 7, label: "7+ days" },
  { id: 30, label: "30+ days" },
];
export const INPUT_MAX = 1000;
type Pick = FinderPick;

/** One step down or up from `amount`, in whole pesewas, kept between GH¢1 and the top. */
export const stepAmount = (amount: number, dir: -1 | 1) =>
  Math.min(INPUT_MAX, Math.max(STEP, Math.round((amount + dir * STEP) * 100) / 100));

/** Networks with the most data. Joint ONLY when the amounts show exactly the
 *  same on screen (same text, same unit): see model.mostData. */
const leaders = (model: BundleModel, picks: Pick[]): Set<string> => model.mostData(picks);

/** `only`: a network's own page. The same finder, for that network alone: no meter and no
 *  "Most data" badge (one network has nothing to compare against; the card is the answer),
 *  the share text names the network, and the "smallest buy" hint is that network's. */
export function BudgetFinder({ model, only, initialAmount = DEFAULT_STATE.amount }: { model: BundleModel; only?: string; /** The amount before the URL is read (server HTML, tests). Default GH¢5. */ initialAmount?: number }) {
  // The starting amount (DEFAULT_STATE.amount, GH¢5) also in the server HTML, before the URL is read.
  const [budget, setBudget] = useState(initialAmount);
  const [allowNight, setAllowNight] = useState(false);
  const [noExpiryOnly, setNoExpiryOnly] = useState(false);
  const [minDays, setMinDays] = useState(0);
  const ids = { amount: useId(), lasts: useId() };
  // The URL holds the amount and the switches (?amount=20&noexp=1&night=1&lasts=7): read once
  // after load, written back with replaceState on every change (see dataBundlesUrl).
  const [fromUrl, setFromUrl] = useState(false);
  useEffect(() => {
    const s = parseState(window.location.search);
    setBudget(s.amount); setAllowNight(s.night); setNoExpiryOnly(s.noExpiryOnly); setMinDays(s.minDays);
    setFromUrl(true);
  }, []);
  useEffect(() => {
    if (!fromUrl) return;
    if (budget > 0) writeState({ amount: budget, night: allowNight, noExpiryOnly, minDays: minDays as 0 | 7 | 30 });
    // No amount typed: no amount in the URL either, so a link never carries an old one (UI L1).
    else clearQueryKeys(["amount"]);
  }, [fromUrl, budget, allowNight, noExpiryOnly, minDays]);
  const amountBox = useAmountText(budget, setBudget, INPUT_MAX);
  // Personalised/regional families to name in the footnote, from the data.
  // A family is named only when every bundle in it is conditional, so a nationwide offer is never
  // described as "only some customers can buy" (its day or hour window is its only restriction).
  const conditionalFams = [...new Set(model.bundles.filter(isConditional)
    .filter((b) => model.bundles.filter((x) => x.network === b.network && x.family === b.family).every(isConditional))
    .map((b) => `${model.networkInfo(b.network).name} ${b.family}`))];
  // Borrowed data (MTN Xtrabyte, AT Data Kredit), from the data.
  const borrowedNames = model.borrowed().map((x) => `${model.networkInfo(x.network).name} ${x.title}`);

  // Each network's answer is the better of its single best buy and its mix (model.finderPick):
  // the headline, the meter, "Most data" and the share text all use the same figure.
  const mine = (ps: Pick[]) => (only ? ps.filter((p) => p.n === only) : ps);
  const day = useMemo(() => mine(model.finderPicks(budget, { noExpiryOnly, minDays })), [model, budget, noExpiryOnly, minDays, only]); // eslint-disable-line react-hooks/exhaustive-deps
  const night = useMemo(
    () => (allowNight ? mine(model.finderPicks(budget, { nightOnly: true, noExpiryOnly, minDays })) : []),
    [model, budget, allowNight, noExpiryOnly, minDays, only], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const dayLead = leaders(model, day);
  const nightLead = leaders(model, night);
  // The value meter: each network's share of the best amount, with its zone (model.valueMeter).
  const dayMeter = Object.fromEntries(model.valueMeter(day).map((x) => [x.n, x]));
  const nightMeter = Object.fromEntries(model.valueMeter(night).map((x) => [x.n, x]));
  const noAmount = !(budget > 0);
  // Nothing on any network: ONE friendly hint instead of three empty cards.
  const noneFit = !noAmount && day.every((p) => !p.b);
  const minimum = noneFit ? model.finderMinimum({ noExpiryOnly, minDays }, only) : null;
  // The share text, from the same picks (model.finderShareText).
  const shareText = model.finderShareText(budget, { noExpiryOnly, minDays }, only);
  const dayTie = dayLead.size > 1;
  const nightTie = nightLead.size > 1;

  const toggle = (on: boolean) => cn(
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[13px] font-semibold transition sm:px-3 sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    on ? "border-emerald-400 bg-emerald-400/15 text-foreground" : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
  );
  const stepBtn = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-background/50 text-foreground transition hover:border-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

  return (
    <section aria-labelledby="budget-h" id="budget" className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 p-4 [@media(max-height:820px)_and_(max-width:639px)]:px-3 [@media(max-height:820px)_and_(max-width:639px)]:pb-3 [@media(max-height:820px)_and_(max-width:639px)]:pt-2.5 shadow-[0_24px_48px_-32px_rgba(15,23,42,0.35)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_60px_-30px_rgba(0,0,0,0.8)] sm:p-6">
        {/* Console grid: decoration only. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative">
          <h2 id="budget-h" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            <GaugeIcon className="h-4 w-4" aria-hidden /> {only ? "What should I buy?" : "Find the best buy"}
          </h2>
          <label htmlFor={ids.amount} className="mt-2 block text-base font-bold text-muted-foreground [@media(max-height:820px)_and_(max-width:639px)]:mt-1 sm:mt-3 sm:text-lg">I have</label>
          <div className="mt-1 flex items-center gap-2">
            <button type="button" className={stepBtn} onClick={() => setBudget((b) => stepAmount(b, -1))} disabled={budget <= STEP} aria-label={`${model.money(STEP)} less`} data-testid="bf-minus">
              <Minus className="h-5 w-5" aria-hidden />
            </button>
            <div className="flex min-w-0 flex-1 items-baseline gap-2 border-b-2 border-emerald-500/70 pb-1 focus-within:border-emerald-600 dark:border-emerald-400/60 dark:focus-within:border-emerald-300">
              <span className="text-3xl font-black sm:text-4xl">{model.currency}</span>
              <input
                id={ids.amount}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                aria-describedby={`${ids.amount}-hint`}
                {...amountBox.input}
                className="min-h-14 w-full min-w-0 bg-transparent text-5xl font-black [@media(max-height:820px)_and_(max-width:639px)]:min-h-12 [@media(max-height:820px)_and_(max-width:639px)]:text-[2.6rem] tabular-nums tracking-tight text-foreground caret-emerald-600 dark:caret-emerald-300 focus:outline-none sm:text-6xl"
              />
            </div>
            <button type="button" className={stepBtn} onClick={() => setBudget((b) => stepAmount(b, 1))} disabled={budget >= INPUT_MAX} aria-label={`${model.money(STEP)} more`} data-testid="bf-plus">
              <Plus className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <p id={`${ids.amount}-hint`} className="sr-only">Type any amount, or use the buttons. Each network's best buy for it shows below.</p>
          <ClampNote show={amountBox.clamped} text={`The most you can enter is ${model.money(INPUT_MAX)}, so we used ${model.money(INPUT_MAX)}.`} />

          {/* Chips: the picked one has a highlight that slides between them (layoutId). */}
          <div className="mt-3 grid grid-cols-5 gap-1.5 [@media(max-height:820px)_and_(max-width:639px)]:mt-2 [@media(max-height:820px)_and_(max-width:639px)]:gap-1 sm:grid-cols-10" role="group" aria-label="Quick amounts" data-bf-chips="">
            {CHIPS.map((c) => {
              const on = budget === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBudget(c)}
                  aria-pressed={on}
                  className={cn(
                    "relative min-h-11 rounded-xl border px-0.5 text-[13px] font-bold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm",
                    on ? "border-emerald-300 text-slate-950" : "border-border bg-background/40 hover:border-foreground/40",
                  )}
                >
                  {on && <motion.span layoutId="bf-chip" data-hl="" className="absolute inset-0 rounded-[11px] bg-emerald-300" transition={{ type: "spring", stiffness: 500, damping: 38 }} aria-hidden />}
                  <span className="relative">{model.money(c)}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 [@media(max-height:820px)_and_(max-width:639px)]:mt-1.5 [@media(max-height:820px)_and_(max-width:639px)]:gap-1.5 sm:mt-3 sm:flex sm:flex-wrap sm:items-end">
            <button type="button" aria-pressed={noExpiryOnly} onClick={() => setNoExpiryOnly((v) => !v)} className={toggle(noExpiryOnly)}>
              <InfinityIcon className="h-4 w-4 shrink-0" aria-hidden /> Never expires
            </button>
            <button type="button" aria-pressed={allowNight} onClick={() => setAllowNight((v) => !v)} className={toggle(allowNight)}>
              <Moon className="h-4 w-4 shrink-0" aria-hidden /> Night deals too
            </button>
            {/* "Lasts" is a caption, not a control: small grey text above its options. */}
            {/* On phones the "Lasts" caption sits on the same line as its options (saves a row). */}
            <div className="col-span-2 flex items-center gap-2 sm:block">
              <p id={ids.lasts} className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:mb-1">Lasts</p>
              <div role="radiogroup" aria-labelledby={ids.lasts} className="grid min-w-0 flex-1 grid-cols-3 gap-1 rounded-full border border-border bg-background/40 p-0.5 sm:inline-grid">
                {LASTS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="radio"
                    aria-checked={minDays === l.id}
                    onClick={() => setMinDays(l.id)}
                    className={cn(
                      "min-h-11 whitespace-nowrap rounded-full px-3 text-xs font-bold transition max-sm:px-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      minDays === l.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!noAmount && <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground [@media(max-height:820px)_and_(max-width:639px)]:mt-2.5 sm:mt-5" data-testid="bf-result-title">{only ? `Best for ${model.money(budget)} on ${model.networkInfo(only).name}` : <>Most data for {model.money(budget)}</>}</h3>}
          {noAmount || noneFit ? (
            <p className="mt-2 rounded-2xl border border-border bg-background/40 p-4 text-base font-semibold" role="status" data-testid="bf-hint">
              {noAmount ? `Type an amount, like ${model.money(DEFAULT_STATE.amount)}.` : `Nothing for ${model.money(budget)}.${minimum ? ` The smallest buy is ${model.money(minimum)}.` : ""}`}
            </p>
          ) : (
          <ul className={cn("mt-2 grid gap-3 [@media(max-height:820px)_and_(max-width:639px)]:mt-1.5", only ? "lg:max-w-2xl" : "md:grid-cols-3")} aria-live="polite">
            {winnerFirst(day, dayLead).map((p) => (
              <ResultCard key={p.n} model={model} pick={p} budget={budget} lead={dayLead.has(p.n)} tie={dayTie} meter={dayMeter[p.n]} trophy="Most data" solo={!!only} />
            ))}
          </ul>
          )}
          {dayTie && <p className="mt-2 text-sm text-muted-foreground">Tied: these networks give the same amount.</p>}

          {allowNight && (
            <>
              <h3 className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <Moon className="h-4 w-4" aria-hidden /> Night bundles, shown apart
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Night data only works at night. So we don't compare it with the bundles above.</p>
              <ul className={cn("mt-2 grid gap-3", !only && "md:grid-cols-3")} aria-live="polite">
                {winnerFirst(night, nightLead).map((p) => (
                  <ResultCard key={p.n} model={model} pick={p} budget={budget} lead={nightLead.has(p.n)} tie={nightTie} meter={nightMeter[p.n]} trophy="Most night data" night solo={!!only} />
                ))}
              </ul>
              {nightTie && <p className="mt-2 text-sm text-muted-foreground">Tied: most night data.</p>}
            </>
          )}

          {shareText && (
            <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="bf-share" data-text={shareText}>
              <ShareWhatsApp text={shareText} withQuery testId="bf-wa" />
              <ShareLink text={shareText} withQuery />
            </div>
          )}
          <p className="mt-3 text-xs font-medium text-foreground">Check the price with your network before you pay.</p>
          <p className="mt-1 text-xs text-muted-foreground" data-testid="speed-link">
            Is your data slow? <Link to="/tools/speed-test" className="inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-2">Test your speed</Link>
          </p>
          <Details summary="What we leave out" className="mt-1">
            <p>
              We leave out: one-hour and morning bundles, and others for some days or hours only. Also social or video-only data, unlimited bundles and calls-and-data packs. Also offers only some people can buy{conditionalFams.length > 0 && <> ({conditionalFams.join(", ")})</>}, and borrowed data{borrowedNames.length > 0 && <> ({borrowedNames.join(", ")})</>}. Also new bundles we are still checking, bundles only on old pages, and bundles the network's own pages disagree on.
            </p>
            <p>We show amounts as each network prints them ({unitsLine(model)}). The most data is not always the best buy. Check how long it lasts.</p>
            <p>The meter shows each network's data as a share of the best one for this amount: Best, Good (75% or more), Fair (50% or more) or Poor.</p>
          </Details>
        </div>
      </div>
    </section>
  );
}

type Meter = ReturnType<BundleModel["valueMeter"]>[number];

/** Winner first (a tie keeps network order), then the others: on phones the answer leads. */
const winnerFirst = <T extends { n: string }>(picks: T[], lead: Set<string>) => [...picks].sort((a, b) => Number(lead.has(b.n)) - Number(lead.has(a.n)));

/** Polar position on the meter's arc for a share (0 = left end, 1 = right end, "Best"). */
const arcPoint = (share: number, r: number, cx: number, cy: number) => {
  const a = Math.PI * (1 - share);
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
};

/** The value meter: one shared scale per amount, where the winner points to "Best" and the
 *  others show their share of the winner's data, in zones Poor (under 50%) · Fair (50%) ·
 *  Good (75%) · Best (model.valueMeter / VALUE_ZONES). The needle swings to the new share
 *  (rotation only, 0.35 s; instant under reduced motion). */
const METER_EASE = { type: "tween", duration: 0.35, ease: "easeOut" } as const;
function ValueMeter({ meter, color }: { meter: Meter; color: string }) {
  const s = Math.max(0, Math.min(1, meter.share));
  const W = 112, R = 40, CX = W / 2, CY = 50;
  const ring = "radial-gradient(circle at 50% 50%, transparent 29px, #000 30px)";
  // Zone bands (left to right): Poor, Fair, Good, then the "Best" end in the network colour.
  const band = `conic-gradient(from 270deg, hsl(var(--muted-foreground) / 0.25) 0deg 90deg, hsl(var(--muted-foreground) / 0.45) 90deg 135deg, hsl(var(--muted-foreground) / 0.7) 135deg 171deg, ${color} 171deg 180deg, transparent 180deg)`;
  // The result in large, clear type under the gauge (no small grey zone labels on the arc):
  // the winner "BEST BUY ✓", the others "Good", "Fair" or "Poor" (plain-language round).
  const word = meter.zone === "Best" ? "Best buy ✓" : meter.zone;
  return (
    <div className="relative shrink-0" style={{ width: W, height: 84 }} aria-hidden data-testid="gauge-wrap" data-zone={meter.zone ?? ""}>
      <div className="absolute left-1/2 top-[10px] h-[80px] w-[80px] -translate-x-1/2 overflow-hidden" style={{ height: 40 }}>
        <div className="absolute inset-x-0 top-0 h-[80px] rounded-full" style={{ background: band, WebkitMaskImage: ring, maskImage: ring }} />
      </div>
      <div className="absolute" style={{ left: CX - 1.5, top: CY - 34, width: 3, height: 34 }} data-testid="gauge" data-share={s.toFixed(4)}>
        <motion.div className="h-full w-full origin-bottom rounded-full bg-foreground" initial={false} animate={{ rotate: -90 + 180 * s }} transition={METER_EASE} data-testid="gauge-needle" />
      </div>
      <div className="absolute h-2.5 w-2.5 rounded-full bg-foreground" style={{ left: CX - 5, top: CY - 5 }} />
      <p className={cn("absolute inset-x-0 bottom-0 whitespace-nowrap text-center font-black uppercase leading-none tracking-wide", meter.zone === "Best" ? "text-[15px] sm:text-base" : "text-base sm:text-lg")} data-testid="meter-zone">{word}</p>
    </div>
  );
}

function ResultCard({ model, pick, budget, lead, tie, meter, trophy, night, solo }: {
  model: BundleModel; pick: Pick; budget: number; lead: boolean; tie: boolean; meter: Meter; trophy: string; night?: boolean;
  /** A network's own page: the only card, so no badge and no meter; how-to-buy stays open. */
  solo?: boolean;
}) {
  const { n, combo } = pick;
  const info = model.networkInfo(n);
  // The headline row: the mix when it gives more, else the single buy.
  const shownB = pick.b;
  // The bundle the details talk about: the single buy (or, for a mix with no single, its first part).
  const b = pick.single ?? (combo ? combo.items[0].bundle : null);
  const isWin = !!shownB && lead;
  // Short, direct "how to buy" on the card; the full line (with where it comes from) in details.
  const buy = b && !combo ? model.buyShort(b) : null;
  const buyFull = b && !combo ? model.howToBuy(b) : null;
  const change = combo ? (Math.round((budget - combo.total) * 100) >= 1 ? model.money(Math.round((budget - combo.total) * 100) / 100) : null) : b ? model.changeText(b, budget) : null;
  const why = b && !combo ? model.changeReason(b, budget) : null;
  // What is left over matters only from GH¢1 (else it is under More info only).
  const changeMaterial = (combo ? budget - combo.total : b ? budget - b.price : 0) >= 1 - 1e-9;
  const shown = shownB ? model.dataShown(shownB) : "";
  const parts = combo ? model.mixParts(combo) : [];
  // The worst trust level among the mix's parts (Check first > Worked out > Confirmed).
  const rank = { confirmed: 0, worked: 1, check: 2 } as const;
  const trustB = combo ? parts.map((x) => x.bundle).reduce((a, x) => (rank[trustOf(x).level] > rank[trustOf(a).level] ? x : a)) : b;
  return (
    <motion.li
      layout="position"
      transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      className={cn("relative flex flex-col rounded-2xl border p-3 transition-colors [@media(max-height:820px)_and_(max-width:639px)]:pt-2 sm:p-4", isWin ? "border-transparent bg-background/80" : "border-border bg-background/40 max-sm:p-2.5")}
      style={isWin ? { boxShadow: `0 0 0 2px ${info.color}, 0 0 26px -8px ${info.color}` } : undefined}
      data-testid="bf-card"
      data-net={n}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <NetPill info={info} />
        {isWin && !solo && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[15px] lg:text-base font-bold" style={{ background: textSafeFill(info), color: info.ink }}>
            <Trophy className="h-3 w-3" aria-hidden /> {tie ? `Tied: ${trophy.toLowerCase()}` : trophy}
          </span>
        )}
      </div>
      {/* The figure and, beside it, the value meter (compact, so the answer stays on the first screen). */}
      <div className="mt-2 flex items-end justify-between gap-x-2 [@media(max-height:820px)_and_(max-width:639px)]:mt-1">
        <div className="min-w-0">
          {/* The final figure, rendered directly: an interactive output never counts up; it rolls to the new text. */}
          {shownB ? (
            <p className="leading-none" data-testid="bf-headline" data-net={n} data-mb={shownB.mb.toFixed(3)} data-buys={combo ? combo.purchases : 1}>
              <RollText text={shown} testId="bf-amount" net={n} className={cn("font-black leading-none tabular-nums", shown.length > 8 ? "text-[1.7rem] sm:text-3xl" : isWin ? "text-4xl sm:text-[2.6rem]" : "text-3xl max-sm:text-[1.7rem] sm:text-[2.6rem]")} />
              {combo && <span className="ml-1.5 whitespace-nowrap text-[15px] font-bold text-foreground/85 lg:text-base" data-testid="bf-buys">· {model.buysText(combo)}</span>}
            </p>
          ) : (
            <span className="text-base font-semibold text-muted-foreground" data-testid="bf-amount" data-net={n}>Nothing for this amount</span>
          )}
          {shownB && <p className="mt-1 text-[15px] font-semibold text-foreground/85 lg:text-base"><RollText text={model.validityText(shownB)} /></p>}
          {combo && pick.single && <p className="mt-0.5 text-[15px] text-foreground/85 lg:text-base" data-testid="bf-single">Or buy once: {model.dataShown(pick.single)}</p>}
        </div>
        {shownB && meter.zone && !solo && <ValueMeter meter={meter} color={info.color} />}
      </div>
      {shownB && b ? (
        <div className="mt-3 space-y-1.5 text-[15px] lg:text-base">
          {combo ? (
            <p>
              <span className="font-bold" data-testid="bf-pay">Pay {model.money(combo.total)} in total</span>
            </p>
          ) : (
            <p>
              <span className="font-semibold">{model.nameNoPrice(b)}</span>
              <span className="text-foreground/85"> · </span>
              <span className="font-bold" data-testid="bf-pay">{model.payText(b)}</span>
            </p>
          )}
          {/* A small tip only when what is left over is material (GH¢1 or more); the change and the
              reason are always under More info. */}
          {change && changeMaterial && <p className="text-[15px] text-foreground/85 lg:text-base" data-testid="bf-change-tip">You keep {change}.</p>}
          <div className="flex flex-wrap gap-1.5">
            <KindBadge kind={shownB.kind} />
            {trustB && <TrustBadge b={trustB} />}
          </div>
          {/* What to buy: each part of a mix by name and price, each with its own Dial/Copy; folded on cards that are not the winner. */}
          {combo ? (
            <BuyFold open testId="bf-buy-fold">
              <ul className="space-y-2" data-testid="bf-combo">
                {parts.map((x, i) => (
                  <li key={i} data-testid="bf-part">
                    <p className="font-semibold"><span className="tabular-nums">{x.count} ×</span> {x.text}</p>
                    {x.buy && <BuyLine text={x.buy} testId="bf-buy" />}
                  </li>
                ))}
              </ul>
            </BuyFold>
          ) : buy ? (
            <BuyFold open testId="bf-buy-fold"><BuyLine text={buy} testId="bf-buy" /></BuyFold>
          ) : null}
          {(why || change || b.note || (ussdText(b) && model.channelNote(b)) || b.otherSource?.summary || (buyFull && buyFull !== buy) || b.computed || trustOf(b).level !== "confirmed" || combo || !!b.operatorTitle) && (
            <Details>
              {!combo && <OperatorTitle model={model} b={b} />}
              {!combo && fromAppOnly(b) && <p>{appSourceText(b, model.networkInfo(b.network).name)}</p>}
              {combo && pick.single && <p data-testid="bf-mix-why">A mix of {combo.purchases} buys gives {model.fmtData(combo.mb, n)}; the best single bundle gives {model.dataShown(pick.single)}.</p>}
              <TrustReasons b={trustB ?? b} />
              {change && <p data-testid="bf-change">You keep {change} change.</p>}
              {why && <p data-testid="bf-why">{why}</p>}
              {buyFull && buyFull !== buy && <p data-testid="bf-buy-full">How to buy, in full: {buyFull}</p>}
              {b.computed && b.computedLabel && <p>{b.computedLabel}.</p>}
              {b.note && <p>{b.note}</p>}
              {ussdText(b) && <ChannelNote model={model} b={b} />}
              <OtherSourceNote b={b} />
            </Details>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {info.name} has no {night ? "night " : ""}bundle for this amount with these choices.
        </p>
      )}
    </motion.li>
  );
}
