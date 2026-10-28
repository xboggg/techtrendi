// The finder's controls on phones (below 640px; owner-approved "Draft 4", 27 Oct 2026):
//   one big amount button ("GH¢5 · ✎ tap to change"), three labelled filter buttons
//   (Never expires, Night deals, and a length button that cycles Any → 7+ days → 30+ days),
//   and one plain sentence saying what is shown.
// Tapping the amount opens a bottom sheet with a live mini display: the typed amount, the
// winner line, one bar per network (figure + how long it lasts), the filters, quick amounts,
// a keypad and "Show results". Every figure comes from the model, through the SAME calls the
// finder cards use (finderPicksFor -> model.finderPicks, model.mostData, model.valueMeter).
// The sheet changes the amount only on "Show results": ✕, a tap outside or Escape keep the old one.
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Delete, Infinity as InfinityIcon, Moon, Pencil, Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_STATE } from "@/lib/dataBundlesUrl";
import { normaliseAmountText, type BudgetOptions, type BundleModel, type FinderPick } from "@/lib/dataBundles";
import { ClampNote, NetPill, useLargeText, LARGE_TEXT_ZOOM } from "./shared";

/** The finder's picks for an amount: every network's, or one network's on its own page. The
 *  finder cards and the sheet's mini display both use this, so they always agree. */
export const finderPicksFor = (model: BundleModel, amount: number, o: BudgetOptions, only?: string): FinderPick[] => {
  const ps = model.finderPicks(amount, o);
  return only ? ps.filter((p) => p.n === only) : ps;
};

/** The length button's steps, in the order a tap cycles through them. */
export const LENGTHS = [0, 7, 30] as const;
export const lengthLabel = (d: number) => (d === 7 ? "7+ days" : d === 30 ? "30+ days" : "Any length");
export const nextLength = (d: number): 0 | 7 | 30 => LENGTHS[(LENGTHS.indexOf(d as 0 | 7 | 30) + 1) % LENGTHS.length];

/** The one plain sentence under the filter buttons. */
export function filterSentence(o: { night: boolean; noExpiryOnly: boolean; minDays: number }): string {
  const what = o.night ? "all-day and night data" : "all-day data";
  const tail = o.noExpiryOnly ? "that never expires" : o.minDays ? `that lasts ${o.minDays}+ days` : "of any length";
  return `Showing ${what} ${tail}.`;
}

/** What the keypad shows: the text typed so far, and `fresh` when the next digit replaces it
 *  (the sheet opens on the current amount; a quick amount works the same way). */
export interface KeypadState { text: string; fresh: boolean }
/** One key: "0"-"9", "." or "del". The amount rules are the amount box's (normaliseAmountText:
 *  digits and one point, at most two decimals, no leading zeros, clamped to `max`). */
export function keypadPress(s: KeypadState, key: string, max: number): KeypadState & { value: number; clamped: boolean } {
  const base = s.fresh ? "" : s.text;
  let raw = base;
  if (key === "del") raw = s.text.slice(0, -1);
  else if (key === ".") raw = base.includes(".") ? base : `${base || "0"}.`;
  else if (/^\d$/.test(key)) raw = base + key;
  const r = normaliseAmountText(raw, max);
  return { text: r.text, fresh: false, value: r.value, clamped: r.clamped };
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];

const filterBtn = (on: boolean) => cn(
  "flex min-h-[3.75rem] [@media(max-height:820px)]:min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-1.5 text-center text-xs font-semibold leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  on ? "border-emerald-400 bg-emerald-400/15 text-foreground" : "border-border bg-background/40 text-muted-foreground",
);

/** The phone controls: amount button, three filter buttons, the sentence, and the sheet. */
export function FinderPhoneControls({ model, only, budget, setBudget, chips, max, noExpiryOnly, setNoExpiryOnly, allowNight, setAllowNight, minDays, setMinDays }: {
  model: BundleModel; only?: string; budget: number; setBudget: (n: number) => void; chips: number[]; max: number;
  noExpiryOnly: boolean; setNoExpiryOnly: (v: boolean) => void; allowNight: boolean; setAllowNight: (v: boolean) => void;
  minDays: number; setMinDays: (d: 0 | 7 | 30) => void;
}) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const shown = budget > 0 ? model.money(budget) : `${model.currency}0`;
  const close = () => { setOpen(false); requestAnimationFrame(() => opener.current?.focus()); };
  return (
    <div className="sm:hidden" data-testid="bf-phone">
      <p className="mt-1.5 text-base font-bold text-muted-foreground [@media(max-height:820px)]:mt-1">I have</p>
      <button
        ref={opener}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Amount ${shown}, tap to change`}
        className="mt-1 flex min-h-16 [@media(max-height:820px)]:min-h-14 w-full items-center justify-between gap-2 rounded-2xl border border-emerald-500/60 bg-background/60 px-3.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-emerald-400/50"
        data-testid="bf-amount-btn"
      >
        <span className="whitespace-nowrap text-[2.4rem] font-black leading-none tabular-nums tracking-tight">{shown}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
          <Pencil className="h-4 w-4" aria-hidden /> tap to change
        </span>
      </button>
      <div className="mt-2 grid grid-cols-3 gap-1.5 [@media(max-height:820px)]:mt-1.5" role="group" aria-label="Filters">
        <button type="button" aria-pressed={noExpiryOnly} onClick={() => setNoExpiryOnly(!noExpiryOnly)} className={filterBtn(noExpiryOnly)} data-testid="bf-f-noexp">
          <InfinityIcon className="h-5 w-5" aria-hidden /> Never expires
        </button>
        <button type="button" aria-pressed={allowNight} onClick={() => setAllowNight(!allowNight)} className={filterBtn(allowNight)} data-testid="bf-f-night">
          <Moon className="h-5 w-5" aria-hidden /> Night deals
        </button>
        <button type="button" onClick={() => setMinDays(nextLength(minDays))} aria-label={`${lengthLabel(minDays)}, tap to change how long it lasts`} className={filterBtn(minDays > 0)} data-testid="bf-f-lasts" data-days={minDays}>
          <Timer className="h-5 w-5" aria-hidden /> {lengthLabel(minDays)}
        </button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground [@media(max-height:820px)]:mt-1.5" aria-live="polite" data-testid="bf-sentence">{filterSentence({ night: allowNight, noExpiryOnly, minDays })}</p>
      {open && (
        <AmountSheet
          model={model} only={only} start={budget} chips={chips} max={max}
          opts={{ noExpiryOnly, minDays }} night={allowNight}
          onClose={close}
          onApply={(v) => { setBudget(v); close(); }}
        />
      )}
    </div>
  );
}

/** The bottom sheet: role=dialog, aria-modal, focus moves in and stays in (Tab wraps), and goes
 *  back to the amount button on close; ✕, a tap outside or Escape close it; the page behind does
 *  not scroll while it is open. Slides up (transform, 0.25 s; none under reduced motion). */
function AmountSheet({ model, only, start, chips, max, opts, night, onClose, onApply }: {
  model: BundleModel; only?: string; start: number; chips: number[]; max: number;
  opts: { noExpiryOnly: boolean; minDays: number }; night: boolean;
  onClose: () => void; onApply: (v: number) => void;
}) {
  const [pad, setPad] = useState<KeypadState & { value: number; clamped: boolean }>({ text: start > 0 ? String(start) : "", fresh: true, value: start > 0 ? start : 0, clamped: false });
  const panel = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [large] = useLargeText();
  const zoom = large ? { zoom: LARGE_TEXT_ZOOM } : undefined;

  // Body scroll lock and first focus.
  useEffect(() => {
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    first.current?.focus();
    return () => { body.style.overflow = prev; };
  }, []);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
    if (e.key !== "Tab" || !panel.current) return;
    const f = [...panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])")];
    if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };

  const press = (k: string) => setPad((s) => keypadPress(s, k, max));
  const quick = (c: number) => setPad({ text: String(c), fresh: true, value: c, clamped: false });

  // The mini display: the same model calls as the finder cards.
  const value = pad.value;
  const ok = value > 0;
  const day = ok ? finderPicksFor(model, value, opts, only) : [];
  const lead = model.mostData(day);
  const meter = Object.fromEntries(model.valueMeter(day).map((x) => [x.n, x]));
  const winners = day.filter((p) => lead.has(p.n) && p.b);
  const nightPicks = ok && night ? finderPicksFor(model, value, { ...opts, nightOnly: true }, only) : [];
  const nightLead = model.mostData(nightPicks);
  const nightWin = nightPicks.filter((p) => nightLead.has(p.n) && p.b);
  const minimum = ok && !winners.length ? model.finderMinimum(opts, only) : null;
  const names = (ps: FinderPick[]) => ps.map((p) => model.networkInfo(p.n).name).join(" and ");
  const headline = (p: FinderPick) => `${model.dataShown(p.b!)}${p.combo ? ` ${model.buysText(p.combo)}` : ""} (${model.validityText(p.b!)})`;
  const best = !ok
    ? `Type an amount, like ${model.money(DEFAULT_STATE.amount)}.`
    : !winners.length
      ? `Nothing for ${model.money(value)}.${minimum ? ` The smallest buy is ${model.money(minimum)}.` : ""}`
      : only
        ? `You get: ${headline(winners[0])}`
        : `Most data: ${names(winners)}, ${headline(winners[0])}`;

  const typed = pad.text === "" ? "0" : pad.text;
  const chip = "rounded-full border px-2 py-0.5 text-xs font-semibold";

  return createPortal(
    <div className="fixed inset-0 z-[10000] sm:hidden" data-testid="bf-sheet-root">
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden
        data-testid="bf-scrim"
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="absolute inset-x-0 bottom-0 flex max-h-[94dvh] flex-col rounded-t-3xl border-t border-border bg-card text-foreground shadow-2xl"
        initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
        data-testid="bf-sheet"
      >
        {/* A+: the heading and the mini display grow (zoom, like the page); the quick amounts, keypad
            and "Show results" keep their size (already 44px and more), so at 390x844 every key shows
            without scrolling. */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-2" style={zoom}>
            <h2 id={titleId} className="text-base font-bold">How much do you have?</h2>
            <button ref={first} type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="bf-sheet-close">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 pb-2">
            {/* The mini display. The bars: winner first, as the cards are. */}
            <div className="space-y-2 rounded-2xl border border-border bg-background p-3" data-testid="bf-mini" style={zoom}>
              <p className="text-4xl font-black leading-none tabular-nums tracking-tight" data-testid="bf-typed" aria-label={`Amount ${model.currency}${typed}`}>
                {model.currency}{typed}<span aria-hidden className="ml-0.5 inline-block h-8 w-[3px] translate-y-1 rounded bg-emerald-500 dark:bg-emerald-300" />
              </p>
              <ClampNote show={pad.clamped} text={`The most you can enter is ${model.money(max)}, so we used ${model.money(max)}.`} />
              <p className="text-sm font-semibold" aria-live="polite" data-testid="bf-best">{best}</p>
              {ok && night && nightWin.length > 0 && (
                <p className="text-sm text-muted-foreground" data-testid="bf-best-night">{only ? `Night: ${headline(nightWin[0])}` : `Most night data: ${names(nightWin)}, ${headline(nightWin[0])}`}</p>
              )}
              {ok && (
                <ul className="space-y-1.5" data-testid="bf-bars">
                  {[...day].sort((a, b) => Number(lead.has(b.n)) - Number(lead.has(a.n))).map((p) => {
                    const info = model.networkInfo(p.n);
                    const share = p.b ? Math.max(0.04, Math.min(1, meter[p.n]?.share ?? 0)) : 0;
                    return (
                      <li key={p.n} className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5" data-testid="bf-bar" data-net={p.n} data-mb={p.b ? p.b.mb.toFixed(3) : ""}>
                        <NetPill info={info} className="justify-center px-1.5" />
                        <div className="flex min-w-0 items-baseline justify-between gap-2">
                          <span className="whitespace-nowrap text-base font-black tabular-nums" data-testid="bf-bar-amount">{p.b ? model.dataShown(p.b) : "Nothing"}</span>
                          <span className="min-w-0 truncate text-right text-xs text-muted-foreground" data-testid="bf-bar-lasts">{p.b ? `${model.validityText(p.b)}${p.combo ? ` · ${model.buysText(p.combo)}` : ""}` : "for this amount"}</span>
                        </div>
                        <div className="col-span-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                          <div className="h-full origin-left rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none" style={{ background: info.color, transform: `scaleX(${share})` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex flex-wrap gap-1.5" data-testid="bf-status">
                <span className={cn(chip, opts.noExpiryOnly ? "border-emerald-500 text-foreground" : "border-border text-muted-foreground")}>∞ Never expires: {opts.noExpiryOnly ? "on" : "off"}</span>
                <span className={cn(chip, night ? "border-emerald-500 text-foreground" : "border-border text-muted-foreground")}>☾ Night: {night ? "on" : "off"}</span>
                <span className={cn(chip, opts.minDays ? "border-emerald-500 text-foreground" : "border-border text-muted-foreground")}>⏱ {lengthLabel(opts.minDays)}</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Quick amounts" data-testid="bf-quick">
              {chips.map((c) => {
                const on = ok && Math.abs(value - c) < 1e-9;
                return (
                  <button key={c} type="button" aria-pressed={on} onClick={() => quick(c)}
                    className={cn("min-h-11 rounded-xl border px-0 text-[13px] font-bold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", on ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-border bg-background/40")}>
                    {model.money(c)}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Keypad" data-testid="bf-keys">
              {KEYS.map((k) => (
                <button key={k} type="button" onClick={() => press(k)} aria-label={k === "del" ? "Delete" : k === "." ? "Point" : k} data-key={k}
                  className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-background/60 text-xl font-bold tabular-nums transition-colors active:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {k === "del" ? <Delete className="h-6 w-6" aria-hidden /> : k}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
            <button type="button" onClick={() => ok && onApply(value)} disabled={!ok}
              className="min-h-12 w-full rounded-2xl bg-foreground text-base font-black text-background transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              data-testid="bf-show">
              Show results
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
