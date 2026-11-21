// "Is this data deal real?": type a data offer you saw (WhatsApp group, social post, a
// website) and see how it compares with the cheapest all-day data the network sells
// itself. Added 21 Nov 2026 after the fake "DataMart Ghana" site ("1TB for GH¢285").
// The yardstick for each network is the model's "All-day data" winner (no figures here).
import { useMemo, useState } from "react";
import { KeyRound, ShieldAlert, ShieldCheck, AlertTriangle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { canWin, type BundleModel } from "@/lib/dataBundles";
import { checkDeal, offerMb, timesText, type DealUnit } from "@/lib/dealCheck";
import { SectionHeading, glass } from "./shared";

const UNITS: DealUnit[] = ["MB", "GB", "TB"];

/** Typed text to a number: commas and spaces ignored, "" or junk = NaN. */
const toNum = (t: string) => Number(t.replace(/[,\s]/g, ""));

export function DealChecker({ model }: { model: BundleModel }) {
  // Each network's best all-day bundle (the winners board's "All-day data" pick for it).
  const best = useMemo(() => {
    const board = model.leaderboard("allday");
    const out: Record<string, (typeof board)[number]> = {};
    for (const n of model.networks) {
      const b = board.find((x) => x.network === n && canWin(x));
      if (b) out[n] = b;
    }
    return out;
  }, [model]);
  const nets = model.networks.filter((n) => best[n]);
  const [net, setNet] = useState<string>(nets.includes("mtn") ? "mtn" : nets[0]);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<DealUnit>("GB");
  const [price, setPrice] = useState("");

  if (!nets.length) return null;
  const info = model.networkInfo(net);
  const ref = best[net];
  const perGb = model.mbPerGb(net);
  const refPerGb = model.costPerGb(ref);
  const result = checkDeal({ mb: offerMb(toNum(amount), unit, perGb), price: toNum(price), bestPerGb: refPerGb, mbPerGb: perGb });
  const offerText = `${amount.trim()}${unit} for ${model.money(toNum(price))}`;

  const tryFake = () => { setNet(nets.includes("mtn") ? "mtn" : nets[0]); setAmount("1"); setUnit("TB"); setPrice("285"); };

  const input = "h-12 w-full rounded-xl border border-border bg-background px-3 text-lg font-semibold tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <section id="deal-check" aria-labelledby="deal-check-h" data-testid="deal-checker" className="scroll-mt-24">
      <SectionHeading id="deal-check-h" eyebrow="Scam check" title="Is this data deal real?" icon={<Search className="h-4 w-4" aria-hidden />}>
        Saw cheap data on WhatsApp or a website? Type it in. We compare it with the cheapest all-day data the network sells itself.
      </SectionHeading>

      <div className={cn(glass, "p-4 md:p-6")}>
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr] md:items-end">
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Network</legend>
            <div className="flex flex-wrap gap-2">
              {nets.map((n) => {
                const ni = model.networkInfo(n);
                const on = n === net;
                return (
                  <button key={n} type="button" onClick={() => setNet(n)} aria-pressed={on}
                    className={cn("min-h-11 rounded-xl border-2 px-4 text-sm font-bold transition", on ? "border-transparent shadow" : "border-border bg-background/60 opacity-80 hover:opacity-100")}
                    style={on ? { background: ni.color, color: ni.ink } : undefined}>
                    {ni.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div>
            <label htmlFor="deal-amount" className="mb-1.5 block text-sm font-semibold">Data offered</label>
            <div className="flex gap-2">
              <input id="deal-amount" inputMode="decimal" autoComplete="off" placeholder="e.g. 50" value={amount}
                onChange={(e) => setAmount(e.target.value)} className={input} />
              <select aria-label="Unit" value={unit} onChange={(e) => setUnit(e.target.value as DealUnit)}
                className="h-12 rounded-xl border border-border bg-background px-2 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="deal-price" className="mb-1.5 block text-sm font-semibold">Price ({model.currency})</label>
            <input id="deal-price" inputMode="decimal" autoComplete="off" placeholder="e.g. 90" value={price}
              onChange={(e) => setPrice(e.target.value)} className={input} />
          </div>
        </div>

        <button type="button" onClick={tryFake} className="mt-3 text-sm font-semibold text-primary underline-offset-2 hover:underline">
          Try a real scam we found: 1TB of MTN data for {model.money(285)}
        </button>

        <div aria-live="polite" className="mt-4">
          {!result ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Fill in the data and the price to see the answer.
            </p>
          ) : (
            <div data-testid="deal-verdict" data-verdict={result.verdict}
              className={cn("rounded-xl border-2 p-4",
                result.verdict === "scam" && "border-red-500 bg-red-500/10",
                result.verdict === "careful" && "border-amber-500 bg-amber-500/10",
                result.verdict === "possible" && "border-emerald-500 bg-emerald-500/10")}>
              <p className="flex items-center gap-2 text-xl font-black">
                {result.verdict === "scam" && <><ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden /> Almost certainly a scam</>}
                {result.verdict === "careful" && <><AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden /> Be very careful</>}
                {result.verdict === "possible" && <><ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden /> This price is possible</>}
              </p>
              <p className="mt-2 text-[15px] leading-relaxed">
                {result.verdict === "scam" && <>
                  {offerText} is about <b>{timesText(result.timesCheaper)} times cheaper</b> than the cheapest all-day data {info.name} sells itself. No seller can sell data for less than the network charges them. <b>Do not pay.</b>
                </>}
                {result.verdict === "careful" && <>
                  {offerText} is cheaper than any all-day data {info.name} sells itself. Real sellers rarely go this low. Only buy from someone you know.
                </>}
                {result.verdict === "possible" && <>
                  {offerText} is not cheaper than {info.name}'s own bundles, so the price itself is not a warning sign. But a normal price doesn't make a seller honest.
                </>}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                That offer works out at {model.money(result.offerPerGb)} per GB. {info.name}'s cheapest all-day data: {model.dealText(ref)}, which is {model.perGbText(ref)}.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3 rounded-xl bg-foreground/[0.04] p-4 dark:bg-white/[0.06]">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <p className="text-[15px] leading-relaxed">
            <b>Never share a code sent to your phone.</b> Not with "customer care", not with the seller, not even with a friend. That code is the key to your MoMo wallet. Anyone who asks for it is a thief.
          </p>
        </div>
      </div>
    </section>
  );
}
