// MTN "spend any amount" calculators for mobile data, one per published rate
// table. Every MB figure is amount / published GH¢-per-MB rate; GB and per-GB
// figures use the dataset's factor (networks.mtn.mbPerGb).
import { useId, useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "./LabelledSlider";
import { cn } from "@/lib/utils";
import { bandFor, cliffAt, isUnpublishedBand, tableRange, unpublishedBandAt, type Bundle, type BundleModel, type RateBand, type SpendCliff } from "@/lib/dataBundles";
import { ClampNote, CodesIn, ComputedBadge, Details, OtherSourceNote, SectionHeading, glass, sliderTouch, unitsLine, useAmountText } from "./shared";

interface Calc {
  id: string;
  label: string;
  table: RateBand[];
  sliderMax: number;
  start: number;
  notes: (string | undefined)[];
  /** Only some apps can use this data. */
  appLimited?: boolean;
  /** Said when an amount below the table's lowest is typed (e.g. the myMTN app's own minimum). */
  belowMin?: string;
  /** Another MTN source whose figures for this data disagree (Pulse: an older help-centre table). */
  otherSource?: Bundle["otherSource"];
}

/** Notes in order, each sentence shown once: a sentence an earlier note already says
 *  (MTN Pulse: "No MTN source says who may or may not buy it", in its family text and in
 *  its rate note) is dropped from the later note. */
export function dedupeNotes(notes: (string | undefined)[]): string[] {
  const norm = (t: string) => t.toLowerCase().replace(/[“”"'‘’]/g, "").replace(/\s+/g, " ").replace(/[.;:,!?\s]+$/, "").trim();
  const said: string[] = [];
  const out: string[] = [];
  for (const n of notes) {
    if (!n || !n.trim()) continue;
    const kept = n.split(/(?<=[.!?])\s+/).filter((sent) => { const k = norm(sent); return !!k && !said.some((x) => x.includes(k)); });
    said.push(norm(n));
    const t = kept.join(" ").trim();
    if (t) out.push(t);
  }
  return out;
}

export function MtnCalculators({ model }: { model: BundleModel }) {
  const r = model.rates;
  const fi = model.doc.familyInfo.mtn ?? {};
  const calcs = useMemo<Calc[]>(() => {
    if (!r) return [];
    const flat = (rate: number): RateBand[] => [{ from: r.socialRange[0], to: r.socialRange[1], ghsPerMb: rate }];
    const cap = (t: RateBand[], max: number) => Math.min(tableRange(t)[1], max);
    const out: Calc[] = [
      { id: "regular", label: "Regular", table: r.regular, sliderMax: cap(r.regular, 399), start: 10, notes: [fi["Regular data (any amount)"], r.validityNote], belowMin: appMinimum(model) },
      { id: "midnight", label: "Midnight", table: r.midnight, sliderMax: cap(r.midnight, 10), start: 3, notes: [fi["Midnight"]] },
    ];
    if (Array.isArray(r.socialRange)) {
      out.push(
        { id: "social", label: "Social", table: flat(r.social), sliderMax: 200, start: 5, notes: [r.socialNote, fi["Social bundles"]], appLimited: true },
        { id: "video", label: "Video", table: flat(r.video), sliderMax: 200, start: 5, notes: [r.socialNote, fi["Video bundles"]], appLimited: true },
      );
    }
    // Pulse: MTN's family text already gives the codes and the validity sources, so they are not repeated.
    if (r.pulse?.data?.length) out.push({ id: "pulse", label: "Pulse", table: r.pulse.data, sliderMax: cap(r.pulse.data, 30), start: 10,
      notes: [fi["Pulse"], r.pulse.note, r.pulse.minSpend?.note, r.pulse.ussdNote], otherSource: r.pulse.otherSource });
    return out;
  }, [r, fi, model]);
  if (!r || !calcs.length) return null;

  return (
    <section aria-labelledby="calc-h" id="calculators" className="scroll-mt-24">
      <SectionHeading id="calc-h" eyebrow="Pay any amount" title="Pay any amount on MTN" icon={<Calculator className="h-4 w-4" aria-hidden />}
        info={<p>Type what you want to spend and we apply the per-MB rate MTN publishes for that amount. GB here: {unitsLine(model)}.</p>}>
        Type an amount. See how much data MTN gives for it.
      </SectionHeading>
      <div className={cn(glass, "p-3 sm:p-5")}>
        <Tabs defaultValue="regular">
          {/* Tabs wrap onto a second line on narrow phones, so every tab is always fully visible. */}
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl p-1">
            {calcs.map((c) => <TabsTrigger key={c.id} value={c.id} className="min-h-11 rounded-lg px-3 py-2 text-xs sm:text-sm">{c.label}</TabsTrigger>)}
          </TabsList>
          {calcs.map((c) => (
            <TabsContent key={c.id} value={c.id} className="mt-4">
              <CalcPanel model={model} calc={c} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

/** The myMTN app's own lowest amount for regular data (mtnRates.app), when the data records one
 *  below the tariff page's lowest band: said in words, never priced. */
function appMinimum(model: BundleModel): string | undefined {
  const app = (model.doc.mtnRates as { app?: { sections?: { rates?: string | null; flexi?: { from?: number; shownFrom?: string } }[] } } | undefined)?.app;
  const sec = app?.sections?.find((x) => x.rates === "regular");
  const from = sec?.flexi?.from;
  const [lo] = model.rates ? tableRange(model.rates.regular) : [0];
  if (typeof from !== "number" || !(from < lo)) return undefined;
  return `The myMTN app accepts amounts from ${model.money(from)}${sec?.flexi?.shownFrom ? ` (it showed ${sec.flexi.shownFrom} for ${model.money(from)})` : ""}, but MTN's tariff page publishes no rate below ${model.money(lo)}, so we don't work those amounts out.`;
}

export function bandLabel(model: BundleModel, b: RateBand): string {
  if (b.exactly !== undefined) return `Exactly ${model.money(b.exactly)} (special rate)`;
  const from = b.fromExclusive ? `Above ${model.money(b.from ?? 0)}` : model.money(b.from ?? 0);
  if ((b.to ?? 0) >= 100000) return `${from} and above`;
  return `${from} to ${model.money(b.to ?? 0)}`;
}

/** Spend to jump to when a band's button is pressed. */
export const bandStart = (b: RateBand, lo: number) => b.exactly ?? (b.fromExclusive ? Math.round(((b.from ?? 0) + 0.01) * 100) / 100 : b.from ?? lo);

function CalcPanel({ model, calc }: { model: BundleModel; calc: Calc }) {
  const [lo, hi] = tableRange(calc.table);
  const [amount, setAmount] = useState(calc.start);
  const id = useId();
  const f = model.mbPerGb("mtn");
  const active = bandFor(amount, calc.table);
  // The data marks this amount as not published (e.g. MTN GH¢299.01 to 299.99): never computed.
  const unpublished = active ? null : unpublishedBandAt(amount, calc.table);
  const rate = active?.ghsPerMb ?? null;
  const mb = rate ? amount / rate : 0;
  const maxInput = hi >= 100000 ? 100000 : hi;
  const amountBox = useAmountText(amount, setAmount, maxInput);
  // An amount that buys less than a smaller one ("spend cliff"), worked out from the rates.
  // Only where the smaller amount buys materially more (model.materialCliffsOf, as Flexi does).
  const cliff = rate ? cliffAt(model.materialCliffsOf(calc.table), amount) : null;
  const fmt = (n: number) => model.fmtData(n, "mtn");
  // The slider's steps start on a whole step, so its end really is the top
  // amount (GH¢399, MTN's best rate), not GH¢398.81 from an odd start of GH¢0.31.
  const sliderStep = calc.sliderMax <= 10 ? 0.01 : calc.sliderMax <= 400 ? 0.5 : 1;
  const sliderMin = Math.min(calc.sliderMax, Math.max(0.01, Math.ceil(lo / sliderStep - 1e-9) * sliderStep));

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <label htmlFor={id} className="text-base font-bold text-muted-foreground">I want to spend</label>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold">{model.currency}</span>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            {...amountBox.input}
            className="min-h-12 w-40 rounded-lg border border-input bg-background px-2 py-1 text-4xl font-black tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <ClampNote show={amountBox.clamped} text={`MTN sells ${calc.label} data up to ${model.money(maxInput)} this way, so the amount was set to ${model.money(maxInput)}.`} />
        <Slider
          className={cn("mt-2", sliderTouch)}
          min={sliderMin}
          max={calc.sliderMax}
          step={sliderStep}
          value={[Math.min(calc.sliderMax, Math.max(lo, amount))]}
          onValueChange={([v]) => setAmount(Math.round(v * 100) / 100)}
          aria-label={`${calc.label} amount`}
          aria-valuetext={model.money(amount)}
        />
        <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4" aria-live="polite">
          {rate ? (
            <>
              <p className="text-sm text-muted-foreground">You get about</p>
              {/* The final figure, rendered directly: an interactive output never counts up. */}
              <p className="text-4xl font-black tabular-nums" data-testid="calc-amount">{fmt(mb)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {mb >= f && <>{Math.round(mb).toLocaleString("en-GB")} MB · </>}at {model.money(rate * f)} per GB ({model.rate(rate)} per MB)
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <ComputedBadge />
                {calc.appLimited && <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-medium text-amber-900 dark:text-amber-200">{calc.label} apps only</span>}
              </div>
              {cliff && <CliffHint model={model} amount={amount} cliff={cliff} fmt={fmt} rateName="MTN's published rate per MB" onUse={setAmount} />}
            </>
          ) : unpublished?.belowMinimum ? (
            <div className="text-sm" data-testid="calc-unpublished" data-why="below-minimum">
              <p className="font-semibold">Below {unpublished.belowMinimum.label} ({model.money(unpublished.belowMinimum.amount)}).</p>
              <p className="mt-1 text-muted-foreground">
                We don't work out a figure for {model.money(amount)}{unpublished.note ? `: ${unpublished.note.trim().replace(/[.!?]?$/, ".")}` : "."} Pick another amount, or check the myMTN app.
              </p>
            </div>
          ) : unpublished?.unconfirmed ? (
            <div className="text-sm" data-testid="calc-unpublished" data-why="unconfirmed">
              <p className="font-semibold">MTN's published rate for this amount is not confirmed.</p>
              <p className="mt-1 text-muted-foreground">
                We don't work out a figure for {model.money(amount)}{unpublished.note ? `: ${unpublished.note.trim().replace(/[.!?]?$/, ".")}` : "."} Pick another amount, or check the myMTN app.
              </p>
            </div>
          ) : unpublished ? (
            <div className="text-sm" data-testid="calc-unpublished" data-why="gap">
              <p className="font-semibold">MTN doesn't publish a rate for this amount.</p>
              <p className="mt-1 text-muted-foreground">
                We don't work out a figure for {model.money(amount)}{unpublished.note ? `: ${unpublished.note.trim().replace(/[.!?]?$/, ".")}` : "."} Pick another amount, or check the myMTN app.
              </p>
            </div>
          ) : (
            <p className="text-sm" data-testid="calc-unpublished" data-why="range">
              <b>MTN doesn't publish a rate for this amount.</b> We don't work out a figure for {model.money(amount)}. Amounts MTN lists run from {model.money(lo)}
              {hi >= 100000 ? " upwards" : ` to ${model.money(hi)}`}; see MTN's price list for the exact steps.
              {calc.belowMin && amount < lo && <span className="mt-1 block text-muted-foreground">{calc.belowMin}</span>}
            </p>
          )}
        </div>
        {dedupeNotes(calc.notes).length > 0 && (
          <Details summary="How it works" className="mt-3" testId="calc-notes">
            {dedupeNotes(calc.notes).map((n) => <p key={n}>{n}</p>)}
            <CodesIn texts={dedupeNotes(calc.notes)} />
          </Details>
        )}
        {calc.otherSource && <OtherSourceNote b={{ otherSource: calc.otherSource } as Bundle} className="mt-2" />}
      </div>

      <div>
        {/* MTN's price list and the quick examples: folded (they are long on a phone), still in the page. */}
        <Details summary="MTN's price list" testId="calc-table">
        <table className="w-full text-sm text-foreground">
          <caption className="sr-only">{calc.label} rate table</caption>
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-2 text-left">Spend</th>
              <th scope="col" className="py-2 pr-2 text-right">Per MB</th>
              <th scope="col" className="py-2 text-right">Per GB</th>
            </tr>
          </thead>
          <tbody>
            {calc.table.map((b, i) => (
              <tr key={i} className={cn("border-b border-border/60 last:border-0", (b === active || b === unpublished) && "bg-amber-100 font-semibold dark:bg-amber-500/15")}>
                <td className="py-0.5 pr-2">
                  <button type="button" aria-pressed={b === active || b === unpublished}
                    className="min-h-11 w-full text-left underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setAmount(bandStart(b, lo))}>
                    {bandLabel(model, b)}
                  </button>
                </td>
                {isUnpublishedBand(b) ? (
                  <td colSpan={2} className="py-0.5 text-right text-muted-foreground">{b.belowMinimum ? `Below ${b.belowMinimum.label} (${model.money(b.belowMinimum.amount)})` : b.unconfirmed ? `MTN prints ${b.ghsPerMb}: not confirmed` : "Not published by MTN"}</td>
                ) : (
                  <>
                    <td className="py-0.5 pr-2 text-right tabular-nums">{b.ghsPerMb}</td>
                    <td className="py-0.5 text-right tabular-nums">{model.money(b.ghsPerMb * f)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </Details>
        {calc.id === "regular" && (
          <Details summary="Examples" className="mt-2" testId="calc-examples">
          <div>
            <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {model.computedRegular.map((b) => (
                <li key={b.price}>
                  <button type="button" onClick={() => setAmount(b.price)}
                    className="min-h-11 w-full rounded-lg border border-border bg-background/70 px-2 py-1.5 text-left hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="block font-bold">{model.money(b.price)}</span>
                    <span className="text-xs text-muted-foreground">{fmt(b.mb)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          </Details>
        )}
      </div>
    </div>
  );
}

/** "GH¢X less gets you more data": shown while the amount is in a spend cliff
 *  (it buys less than a smaller amount in the same published rate table).
 *  `rateName` names the rate, e.g. "MTN's published rate per MB". */
export function CliffHint({ model, amount, cliff, fmt, rateName, onUse }: {
  model: BundleModel; amount: number; cliff: SpendCliff; fmt: (mb: number) => string; rateName: string; onUse: (n: number) => void;
}) {
  return (
    <div role="note" data-testid="cliff-hint" className="mt-3 rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
      <p className="font-semibold">{model.money(Math.round((amount - cliff.better) * 100) / 100)} less gets you more data.</p>
      <p className="mt-1">
        {model.money(cliff.better)} buys {fmt(cliff.betterMb)}; anything from {model.money(cliff.from)} to {model.money(cliff.to)} buys less, because {rateName} is higher there.
      </p>
      <button type="button" onClick={() => onUse(cliff.better)}
        className="mt-2 inline-flex min-h-11 items-center rounded-full border border-amber-600/50 px-3 text-xs font-semibold hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-amber-500/20">
        Use {model.money(cliff.better)} instead
      </button>
    </div>
  );
}
