// Telecel Flexi (mobile, any amount): spend -> data for the no-expiry option
// and for the expiry option (with its validity), side by side. Every figure is
// amount / the per-MB rate Telecel publishes for that spend band
// (telecelRates.flexi in the dataset). GB is MB / networks.telecel.mbPerGb.
import { useId, useMemo, useState, type ReactNode } from "react";
import { Calculator, Infinity as InfinityIcon, CalendarClock } from "lucide-react";
import { Slider } from "./LabelledSlider";
import { cn } from "@/lib/utils";
import { CLIFF_MIN_GAIN_MB, CLIFF_MIN_GAIN_SHARE, bandFor, cliffAt, fmtMb, isUnpublishedBand, sameText, tableRange, unpublishedBandAt, type BundleModel, type RateBand, type SpendCliff } from "@/lib/dataBundles";
import { ClampNote, ComputedBadge, Details, SectionHeading, glass, sliderTouch, useAmountText } from "./shared";
import { bandLabel, bandStart } from "./MtnCalculators";

const NET = "telecel";

/** Plain-text facts the dataset gives about Flexi (channels, renewal, rollover...). */
function flexiFacts(raw: Record<string, unknown>): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = [];
  const skip = new Set(["bands", "table", "rates", "data", "family", "source", "min", "max"]);
  // The note already says where to buy and that Flexi does not auto-renew: those fields are not repeated.
  const note = typeof raw.note === "string" ? raw.note : "";
  if (Array.isArray(raw.buyVia) && raw.buyVia.every((x) => typeof x === "string" && note.toLowerCase().includes(x.toLowerCase()))) skip.add("buyVia");
  if (raw.autoRenews === false && /do(?:es)? not auto-renew/i.test(note)) skip.add("autoRenews");
  if (Array.isArray(raw.range)) skip.add("range");
  const label = (k: string) => k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
  for (const [k, v] of Object.entries(raw)) {
    if (skip.has(k)) continue;
    if (typeof v === "string" && v.trim()) out.push({ key: label(k), text: v });
    else if (Array.isArray(v) && v.every((x) => typeof x === "string")) out.push({ key: label(k), text: (v as string[]).join("; ") });
    else if (typeof v === "boolean" && /renew/i.test(k)) out.push({ key: label(k), text: v ? "Yes" : "No" });
  }
  return out;
}

/** Round amounts tried, in order, for the calculator's first amount. */
const DEFAULT_TRIES = [20, 25, 30, 50, 15, 10, 5, 2, 1, 100];

/** The calculator's first amount, worked out from Telecel's published rates: the first
 *  round amount that both options price and that is in NO spend cliff of either option
 *  (at GH¢20 the no-expiry option buys less than at GH¢19.99, so GH¢20 is skipped);
 *  failing that, the first such pesewa amount. Never an amount the page would warn about. */
export function flexiDefaultAmount(model: BundleModel): number {
  const f = model.flexi;
  if (!f) return 0;
  const [lo, hi] = tableRange([...f.noExpiry, ...f.expiry]);
  const ne = model.cliffsOf(f.noExpiry), ex = model.cliffsOf(f.expiry);
  const ok = (a: number) => a >= lo - 1e-9 && a <= hi + 1e-9 && !!bandFor(a, f.noExpiry) && !!bandFor(a, f.expiry) && !cliffAt(ne, a) && !cliffAt(ex, a);
  for (const a of DEFAULT_TRIES) if (ok(a)) return a;
  for (let p = Math.round(lo * 100); p <= Math.round(hi * 100); p++) if (ok(p / 100)) return p / 100;
  return lo;
}

/** Spend-cliff advice for Flexi: ONE hint per amount, naming the option(s) whose published
 *  rate makes this amount buy less than a smaller one, and showing what each "use instead"
 *  amount gives in BOTH options (moving to the better no-expiry amount can mean less
 *  with-expiry data that lasts fewer days, and the hint says so).
 *  Only material cliffs are passed in (model.materialCliffsOf: the smaller amount buys at least
 *  CLIFF_MIN_GAIN_MB and CLIFF_MIN_GAIN_SHARE more), and an option whose amounts would show the
 *  same in GB is shown in MB, so the difference is always visible (audit 8, L5). */
export function FlexiCliffHint({ model, amount, ne, ex, fmt, onUse }: {
  model: BundleModel; amount: number; ne: SpendCliff | null; ex: SpendCliff | null; fmt: (mb: number) => string; onUse: (n: number) => void;
}) {
  const opts = [
    { key: "ne", name: "No-expiry option", rate: "no-expiry", cliff: ne },
    { key: "ex", name: "With-expiry option", rate: "with-expiry", cliff: ex },
  ].filter((o): o is { key: string; name: string; rate: string; cliff: SpendCliff } => !!o.cliff);
  if (!opts.length) return null;
  const money = model.money;
  const both = opts.length > 1;
  const now = model.flexiQuote(amount);
  const nowMb = (key: string) => (key === "ne" ? now.noExpiry?.mb : now.expiry?.mb);
  // Per option: MB to two decimals where GB rounding would show "now" and the better amount the same.
  const inMb = new Set(opts.filter((o) => { const n = nowMb(o.key); return n !== undefined && sameText(fmt(n), fmt(o.cliff.betterMb)); }).map((o) => o.key));
  const vol = (key: string, mb: number) => (inMb.has(key) ? fmtMb(mb) : fmt(mb));
  const betters = [...new Set(opts.map((o) => o.cliff.better))].sort((a, b) => a - b);
  const effect = (a: number) => {
    const q = model.flexiQuote(a);
    const parts: string[] = [];
    if (q.noExpiry) parts.push(`no-expiry ${vol("ne", q.noExpiry.mb)}`);
    if (q.expiry) parts.push(`with-expiry ${vol("ex", q.expiry.mb)}${q.expiry.days ? ` for ${q.expiry.days} day${q.expiry.days === 1 ? "" : "s"}` : ""}`);
    return parts.join(", ");
  };
  const less = betters.length === 1 ? `${money(Math.round((amount - betters[0]) * 100) / 100)} less gets you more data.` : "a smaller amount gets you more data.";
  return (
    <div role="note" data-testid="cliff-hint" className="mt-3 rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
      <p className="font-semibold">{both ? "Both options" : opts[0].name}: {less}</p>
      {opts.map((o) => (
        <p key={o.key} className="mt-1">
          {both && <b>{o.name}: </b>}{money(o.cliff.better)} buys {vol(o.key, o.cliff.betterMb)}; every amount from {money(o.cliff.from)} to {money(o.cliff.to)} buys at least {CLIFF_MIN_GAIN_MB} MB and {CLIFF_MIN_GAIN_SHARE * 100}% less, because Telecel's published {o.rate} rate per MB is higher there.
        </p>
      ))}
      <p className="mt-1">Now, at {money(amount)}: {effect(amount)}.</p>
      {betters.map((a) => (
        <div key={a} className="mt-2">
          <p>At {money(a)}: {effect(a)}.</p>
          <button type="button" onClick={() => onUse(a)}
            className="mt-1 inline-flex min-h-11 items-center rounded-full border border-amber-600/50 px-3 text-xs font-semibold hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-amber-500/20">
            Use {money(a)} instead
          </button>
        </div>
      ))}
    </div>
  );
}

export function TelecelFlexiCalculator({ model }: { model: BundleModel }) {
  const flexi = model.flexi;
  const id = useId();
  const all = useMemo(() => (flexi ? [...flexi.noExpiry, ...flexi.expiry] : []), [flexi]);
  const [lo, hi] = all.length ? tableRange(all) : [0, 0];
  const [amount, setAmount] = useState(() => flexiDefaultAmount(model));
  const amountBox = useAmountText(amount, setAmount, hi);
  if (!flexi || !all.length) return null;
  const f = model.mbPerGb(NET);
  const q = model.flexiQuote(amount);
  const fmt = (mb: number) => model.fmtData(mb, NET);
  const facts = flexiFacts(flexi.raw);
  // One row per spend band (the two options share bands; an option missing in a band shows "not sold").
  const bands: RateBand[] = (flexi.noExpiry.length ? flexi.noExpiry : flexi.expiry);
  const match = (t: RateBand[], b: RateBand) => t.find((x) => x.exactly === b.exactly && x.from === b.from && x.to === b.to) ?? null;
  const activeRow = bandFor(amount, bands);
  const gapRow = activeRow ? null : unpublishedBandAt(amount, bands);
  const sliderMax = Math.min(hi, 1000);
  // Spend cliffs in each option's table (an amount that buys less than a smaller one).
  // Only where the smaller amount buys materially more (model.materialCliffsOf, audit 8 L5).
  const neCliff = q.noExpiry ? cliffAt(model.materialCliffsOf(flexi.noExpiry), amount) : null;
  const exCliff = q.expiry ? cliffAt(model.materialCliffsOf(flexi.expiry), amount) : null;
  // "More data that expires" only where the expiry rate really is lower; where both rates
  // are equal (Telecel: GH¢400 to GH¢999.99) both options give the same data.
  const same = bands.filter((b) => { const ne = match(flexi.noExpiry, b), ex = match(flexi.expiry, b); return ne && ex && Math.abs(ne.ghsPerMb - ex.ghsPerMb) < 1e-12; });
  const sameText = same.length ? ` From ${model.money(same[0].from ?? 0)} to ${model.money(same[same.length - 1].to ?? 0)} both options give the same data.` : "";

  return (
    <section aria-labelledby="flexi-h" id="calculators" className="scroll-mt-24">
      <SectionHeading id="flexi-h" eyebrow="Pay any amount" title={`${flexi.family}: pay any amount`} icon={<Calculator className="h-4 w-4" aria-hidden />}
        info={<p>Telecel Flexi lets you buy mobile data for any amount from {model.money(lo)} to {model.money(hi)}. Each spend gets a per-MB rate, with a choice of data that never expires or data that expires, which is more data for the same spend wherever Telecel's expiry rate is lower.{sameText}</p>}>
        Type an amount from {model.money(lo)} to {model.money(hi)}. See both options.
      </SectionHeading>
      <div className={cn(glass, "grid gap-5 p-3 sm:p-5 lg:grid-cols-[1.1fr_1fr]")}>
        <div>
          <label htmlFor={id} className="text-base font-bold text-muted-foreground">I want to spend</label>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold">{model.currency}</span>
            <input
              id={id} type="text" inputMode="decimal" autoComplete="off" {...amountBox.input}
              className="min-h-12 w-40 rounded-lg border border-input bg-background px-2 py-1 text-4xl font-black tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Slider
            className={cn("mt-2", sliderTouch)}
            min={Math.max(0.01, lo)} max={sliderMax} step={sliderMax <= 50 ? 0.01 : 0.5}
            value={[Math.min(sliderMax, Math.max(lo, amount))]}
            onValueChange={([v]) => setAmount(Math.round(v * 100) / 100)}
            aria-label="Telecel Flexi amount" aria-valuetext={model.money(amount)}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-live="polite">
            <Option
              icon={<InfinityIcon className="h-4 w-4" aria-hidden />} title="No expiry"
              mb={q.noExpiry?.mb ?? null} rate={q.noExpiry?.ghsPerMb ?? null} f={f} fmt={fmt} model={model}
              lasts="Never expires"
            />
            <Option
              icon={<CalendarClock className="h-4 w-4" aria-hidden />} title="With expiry"
              mb={q.expiry?.mb ?? null} rate={q.expiry?.ghsPerMb ?? null} f={f} fmt={fmt} model={model}
              lasts={q.expiry?.days ? `Lasts ${q.expiry.days} day${q.expiry.days === 1 ? "" : "s"}` : "Expiry not stated"}
            />
          </div>
          <ClampNote show={amountBox.clamped} text={`Telecel sells Flexi data up to ${model.money(hi)}, so the amount was set to ${model.money(hi)}.`} />
          <FlexiCliffHint model={model} amount={amount} ne={neCliff} ex={exCliff} fmt={fmt} onUse={setAmount} />
          {!q.noExpiry && !q.expiry && (
            gapRow
              ? <p className="mt-3 text-sm"><b>Telecel doesn't publish a rate for this amount.</b> We don't work out a figure for {model.money(amount)}{gapRow.note ? `: ${gapRow.note}` : "."}</p>
              : <p className="mt-3 text-sm">Telecel does not publish a Flexi rate for {model.money(amount)}. Flexi runs from {model.money(lo)} to {model.money(hi)}.</p>
          )}
          <div className="mt-3"><ComputedBadge label="Computed from Telecel's published rate" /></div>
          {(facts.length > 0 || model.doc.familyInfo.telecel?.[flexi.family]) && (
            <Details summary="How it works" className="mt-3" testId="calc-notes">
              {facts.length > 0 && (
                <ul className="space-y-1">
                  {facts.map((x) => <li key={x.key}><b className="text-foreground">{x.key}:</b> {x.text}</li>)}
                </ul>
              )}
              {model.doc.familyInfo.telecel?.[flexi.family] && <p>{model.doc.familyInfo.telecel[flexi.family]}</p>}
            </Details>
          )}
        </div>

        <div className="min-w-0">
          {/* Telecel's price list: folded (long on a phone), still in the page. */}
          <Details summary="Telecel's price list" testId="calc-table">
          <p className="text-xs">Per GB = Telecel's per-MB rate × {f.toLocaleString("en-GB")}.</p>
          <div className="overflow-x-auto text-foreground">
            <table className="w-full text-sm">
              <caption className="sr-only">Telecel Flexi rate table</caption>
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-2 text-left">Spend</th>
                  <th scope="col" className="py-2 pr-2 text-right">No expiry, per GB</th>
                  <th scope="col" className="py-2 text-right">With expiry, per GB</th>
                </tr>
              </thead>
              <tbody>
                {bands.map((b, i) => {
                  const ne = match(flexi.noExpiry, b), ex = match(flexi.expiry, b);
                  const isActive = b === activeRow || b === gapRow;
                  if (isUnpublishedBand(b)) return (
                    <tr key={i} className={cn("border-b border-border/60 last:border-0", isActive && "bg-amber-100 font-semibold dark:bg-amber-500/15")}>
                      <td className="py-0.5 pr-2">
                        <button type="button" aria-pressed={isActive}
                          className="min-h-11 w-full text-left underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setAmount(bandStart(b, lo))}>
                          {bandLabel(model, b)}
                        </button>
                      </td>
                      <td colSpan={2} className="py-0.5 text-right text-muted-foreground">Not published by Telecel</td>
                    </tr>
                  );
                  return (
                    <tr key={i} className={cn("border-b border-border/60 last:border-0", isActive && "bg-amber-100 font-semibold dark:bg-amber-500/15")}>
                      <td className="py-0.5 pr-2">
                        <button type="button" aria-pressed={isActive}
                          className="min-h-11 w-full text-left underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setAmount(bandStart(b, lo))}>
                          {bandLabel(model, b)}
                        </button>
                      </td>
                      <td className="py-0.5 pr-2 text-right tabular-nums">{ne ? model.money(ne.ghsPerMb * f) : "Not sold"}</td>
                      <td className="py-0.5 text-right tabular-nums">{ex ? <>{model.money(ex.ghsPerMb * f)}<span className="block text-[11px] font-normal text-muted-foreground">{ex.days} day{ex.days === 1 ? "" : "s"}</span></> : "Not sold"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </Details>
        </div>
      </div>
    </section>
  );
}

function Option({ icon, title, mb, rate, f, fmt, model, lasts }: {
  icon: ReactNode; title: string; mb: number | null; rate: number | null; f: number; fmt: (mb: number) => string; model: BundleModel; lasts: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold">{icon} {title}</p>
      {mb && rate ? (
        <>
          {/* The final figure, rendered directly: an interactive output never counts up. */}
          <p className="mt-1 text-3xl font-black tabular-nums" data-testid="flexi-amount">{fmt(mb)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{lasts}</p>
          <p className="text-xs text-muted-foreground">{model.money(rate * f)} per GB ({model.rate(rate)} per MB)</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Not sold for this amount.</p>
      )}
    </div>
  );
}
