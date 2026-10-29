// The Flexi calculator (owner, 29 Oct 2026: "you type amount, you see data equivalent"; the yellow
// rolling-counter design, preview 1 of 6). One card in MTN yellow with a tab per pay-any-amount type
// (Data, Social, Video, Midnight): type an amount or tap a chip, the data rolls up like a meter.
// Under it, the amounts the table used to list, tappable. Every figure is the model's (flexiTabs /
// flexiAnswer in src/lib/bundleSheet.ts), never typed here.
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { BundleModel } from "@/lib/dataBundles";
import { flexiAnswer, flexiTabs } from "@/lib/bundleSheet";

/** "521.03 MB" -> ["521.03", "MB"]. */
const split = (text: string): [string, string] => {
  const m = text.match(/^([\d,.]+)\s*(.*)$/);
  return m ? [m[1], m[2]] : [text, ""];
};

/** The number as rolling digit reels (each digit a column of 0-9 moved into place). */
function Odometer({ value, unit }: { value: string; unit: string }) {
  const chars = value.split("");
  let k = 0;
  return (
    <span className="inline-flex items-end justify-center font-mono text-[44px] font-extrabold leading-none tabular-nums min-[380px]:text-[52px]" aria-hidden>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i} className="inline-block w-[.32em] text-center">{ch}</span>;
        const d = Number(ch), delay = (k++) * 70;
        return (
          <span key={`${chars.length}-${i}`} className="inline-block h-[1em] w-[.62em] overflow-hidden">
            <span className="flex flex-col transition-transform duration-[900ms] ease-[cubic-bezier(.2,1.4,.4,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(${-d}em)`, transitionDelay: `${delay}ms` }}>
              {Array.from({ length: 10 }, (_, n) => <span key={n} className="block h-[1em]">{n}</span>)}
            </span>
          </span>
        );
      })}
      <span className="mb-1 ml-2 text-xl">{unit}</span>
    </span>
  );
}

export function FlexiCalculator({ model, network }: { model: BundleModel; network: string }) {
  const tabs = useMemo(() => flexiTabs(model, network), [model, network]);
  const [id, setId] = useState(tabs[0]?.id ?? "");
  const [raw, setRaw] = useState("5");
  // The reels start at 0 and roll to the first answer once the page is on screen.
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 60); return () => clearTimeout(t); }, []);
  const tab = tabs.find((t) => t.id === id) ?? tabs[0];
  if (!tab) return null;
  const amount = Number(raw);
  const ans = flexiAnswer(model, tab, amount);
  const text = ans.mb ? model.fmtData(ans.mb, "mtn") : null;
  const [num, unit] = text ? split(text) : ["", ""];
  const zero = num.replace(/\d/g, "0");
  const pickTab = (next: string) => {
    const t = tabs.find((x) => x.id === next)!;
    setId(next);
    if (!flexiAnswer(model, t, Number(raw)).mb) setRaw(String(t.chips.includes(5) ? 5 : t.chips[1] ?? t.chips[0]));
  };

  return (
    <section aria-labelledby="flexi-h" className="relative grid min-w-0 gap-3.5 overflow-hidden rounded-[26px] bg-[#ffcb05] p-4 text-[#16130a] shadow-lg sm:p-5" data-testid="flexi-calc">
      <div>
        <h2 id="flexi-h" className="text-xl font-black leading-tight">Flexi calculator</h2>
        <p className="text-sm font-semibold opacity-80">Type any amount. See the data you get.</p>
      </div>
      <div role="group" aria-label="Flexi type" className="grid grid-cols-4 gap-1.5" data-testid="flexi-tabs">
        {tabs.map((t) => (
          <button key={t.id} type="button" aria-pressed={t.id === tab.id} onClick={() => pickTab(t.id)} data-id={t.id}
            className={cn("min-h-11 min-w-0 rounded-full px-1 text-[13px] font-extrabold transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16130a]",
              t.id === tab.id ? "bg-[#16130a] text-[#ffcb05]" : "bg-black/[.08] text-[#16130a]")}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-w-0">
        <label htmlFor="flexi-amount" className="font-mono text-[11px] font-bold uppercase tracking-widest opacity-75">I want to spend</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-2xl border-2 border-[#16130a] bg-[#fff6c9] px-3.5 focus-within:ring-2 focus-within:ring-[#16130a] focus-within:ring-offset-2 focus-within:ring-offset-[#ffcb05]">
          <span className="text-[22px] font-black">{model.currency}</span>
          <input id="flexi-amount" inputMode="decimal" autoComplete="off" value={raw} data-testid="flexi-input"
            onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ""))}
            className="min-w-0 flex-1 bg-transparent py-2 text-[30px] font-black tabular-nums outline-none" />
          {/* A faint hint that this is where you type (owner, 29 Oct 2026). */}
          <span className="shrink-0 text-sm font-semibold text-[#16130a]/45" aria-hidden>(enter amount)</span>
        </div>
      </div>
      {/* The Flexi range, as MTN's own Flexi card shows it: data at each end, and the cost range. */}
      {(() => {
        const lo = tab.mbAt(tab.rangeMin), hi = tab.mbAt(tab.rangeMax);
        if (!lo || !hi) return null;
        return (
          <dl className="flex flex-wrap justify-between gap-x-3 gap-y-1 rounded-2xl bg-black/[.08] px-3.5 py-2.5" data-testid="flexi-range">
            <div className="min-w-0"><dt className="font-mono text-[11px] font-bold uppercase tracking-widest opacity-75">Data</dt>
              <dd className="whitespace-nowrap text-sm font-black tabular-nums min-[400px]:text-[15px]">{model.fmtData(lo, "mtn")} – {model.fmtData(hi, "mtn")}</dd></div>
            <div className="ml-auto text-right"><dt className="font-mono text-[11px] font-bold uppercase tracking-widest opacity-75">Cost</dt>
              <dd className="whitespace-nowrap text-sm font-black tabular-nums min-[400px]:text-[15px]">{model.money(tab.rangeMin)} – {model.money(tab.rangeMax)}</dd></div>
          </dl>
        );
      })()}
      <div className="grid min-h-[120px] place-items-center rounded-[20px] bg-[#16130a] px-2.5 py-4 text-center text-[#ffcb05] shadow-[inset_0_0_0_3px_#2b2614]" aria-live="polite" data-testid="flexi-out">
        {text ? (
          <div>
            <Odometer value={shown ? num : zero} unit={unit} />
            <span className="sr-only">{text} for {model.money(Math.round(amount * 100) / 100)}</span>
            <p className="mt-2.5 font-mono text-xs font-bold uppercase tracking-widest text-[#fff3b0]" aria-hidden>for {model.money(Math.round(amount * 100) / 100)}</p>
          </div>
        ) : (
          <p className="px-2 text-[17px] font-bold" data-testid="flexi-msg">{ans.msg}</p>
        )}
      </div>
      <div className="grid gap-1.5 text-[13px] leading-snug">
        <p className="opacity-80">{tab.use}.</p>
        {ans.tip && <p className="rounded-xl bg-[#16130a] px-2.5 py-2 font-bold text-[#ffcb05]" data-testid="flexi-tip">{ans.tip}</p>}
        {/* Plain text in the card's ink: the dial card above already has the Dial / Copy buttons. */}
        {tab.buy && <p className="font-bold" data-testid="flexi-buy">How to buy: {tab.buy.replace(/\.$/, "")}.</p>}
      </div>
      <div className="grid gap-1.5">
        <p className="flex justify-between font-mono text-[11px] font-bold uppercase tracking-widest opacity-75"><span>{tab.fixed.length === 1 ? "Fixed bundle" : "Fixed bundles"}</span><span>tap one</span></p>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-1.5" data-testid="flexi-fixed">
          {tab.fixed.map((a) => {
            const mb = tab.mbAt(a);
            if (!mb) return null;
            return (
              <li key={a}>
                <button type="button" onClick={() => setRaw(String(a))}
                  className={cn("w-full rounded-xl px-2.5 py-1.5 text-left text-[12.5px] leading-tight tabular-nums transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16130a]",
                    Math.abs(a - amount) < 1e-9 ? "bg-[#16130a] text-[#ffcb05]" : "bg-black/[.08] hover:bg-black/[.14]")}>
                  <b className="block text-sm">{model.fmtData(mb, "mtn")}</b>{model.money(a)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
