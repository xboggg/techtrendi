// The face-off: the three networks side by side, each with its best-value bundle in one
// like-for-like group (any time, never expires, night), from model.faceOff. Bundles of ANY price:
// each column leads with the bundle's own price and data ("GH¢400 bundle → 263.38GB"), the bar
// is labelled with that price, and the value yardstick ("Value: 6.58 GB per GH¢10") sits under
// it, smaller. Light: CSS bars (transform only), no chart library.
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BundleModel } from "@/lib/dataBundles";
import { LeadArrow, NetPill, SlideTabs, textSafeFill, useGrowIn, valueExplainer, Details, LeadData, QueryLink } from "./shared";

export const FACEOFF_TABS = [
  { id: "allday", label: "Any time" },
  { id: "noexpiry", label: "Never expires" },
  { id: "night", label: "Night" },
] as const;

export function FaceOff({ model }: { model: BundleModel }) {
  const [tab, setTab] = useState<string>("allday");
  return (
    <section aria-labelledby="faceoff-h" id="faceoff" className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-4 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[80%] -translate-x-1/2 rounded-full bg-emerald-400/[0.07] blur-3xl dark:bg-emerald-400/10" />
        <div className="relative">
          <h2 id="faceoff-h" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            <Swords className="h-4 w-4" aria-hidden /> Face-off
          </h2>
          <p className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">Best value bundles (any price)</p>
          <Details summary="What this means">
            <p>{valueExplainer(model)}</p>
            <p>Each network's best-value bundle of this type, at its own price. Taller bar = more data for your money.</p>
          </Details>
          <SlideTabs
            id="faceoff"
            label="Bundle type"
            className="mt-3"
            pill
            items={FACEOFF_TABS.map((t) => ({ id: t.id, label: t.label }))}
            value={tab}
            onChange={(id) => setTab(id)}
          />
          <FaceOffBars model={model} groupId={tab} tabpanelOf="faceoff" />
        </div>
      </div>
    </section>
  );
}

/** The face-off bars for one board tab: each network's best-value bundle in that tab (model.faceOff),
 *  led by its own price and data, the bar labelled with its price, the value under it. Used at the
 *  top of the winners board (the board's tabs drive it), and by FaceOff. */
export function FaceOffBars({ model, groupId, basePath, tabpanelOf }: { model: BundleModel; groupId: string; basePath?: string; tabpanelOf?: string }) {
  const rows = model.faceOff(groupId);
  const ref = useRef<HTMLDivElement>(null);
  const grow = useGrowIn(ref);
  return (
    <div ref={ref} {...(tabpanelOf ? { role: "tabpanel", id: `${tabpanelOf}-panel-${groupId}`, "aria-labelledby": `${tabpanelOf}-tab-${groupId}` } : {})} className="mt-4 grid grid-cols-3 gap-2 sm:gap-4" data-testid="faceoff" data-group={groupId}>
      {rows.map((r, i) => {
        const info = model.networkInfo(r.n);
        return (
          <div key={r.n} className="flex min-w-0 flex-col items-center text-center" data-testid="faceoff-col" data-net={r.n} data-best={r.best ? "1" : "0"} data-value={r.value ?? ""}>
            {/* The network's name above its bar. */}
            <NetPill info={info} />
            {r.b && r.value ? (
              <p className="mt-1.5 leading-tight" data-testid="faceoff-lead">
                <span className="block text-[15px] font-bold tabular-nums sm:text-base"><LeadArrow text={model.priceLead(r.b)} colon={!!r.b.band && !r.b.band.exact} /></span>
                <span data-testid="faceoff-data"><LeadData model={model} b={r.b} className={model.leadData(r.b).replace(" (more if you pay more)", "").length > 7 ? "text-xl sm:text-3xl" : "text-2xl sm:text-4xl"} /></span>
              </p>
            ) : (
              <p className="mt-1 text-base text-muted-foreground">None</p>
            )}
            {/* Bar: fixed-height track, the fill grows with a transform (no layout shift). */}
            <div className="relative mt-2 h-28 w-full max-w-[96px] overflow-hidden rounded-t-xl bg-muted/60 sm:h-36" style={r.best ? { boxShadow: `0 0 26px -2px ${info.color}` } : undefined}
              role="img" aria-label={r.b && r.value ? `${model.priceLead(r.b)}: value ${r.value} per ${model.money(model.valueStep)}` : `${info.name}: none`}>
              <motion.div
                className="absolute inset-0 origin-bottom rounded-t-xl"
                style={{ background: `linear-gradient(to top, ${info.color}66, ${info.color})` }}
                initial={false}
                animate={{ scaleY: grow ? r.share : 0 }}
                transition={{ type: "tween", duration: 0.4, ease: "easeOut", delay: grow ? i * 0.1 : 0 }}
                aria-hidden
              />
              {/* "Best" sits on the winning bar itself (the winner's bar is full height). */}
              {r.best && (
                <span className="absolute left-1/2 top-1.5 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-2.5 py-0.5 text-[15px] lg:text-base font-bold shadow" style={{ background: textSafeFill(info), color: info.ink }} data-testid="faceoff-best">
                  <Crown className="h-3 w-3" aria-hidden /> Best
                </span>
              )}
            </div>
            {/* The bar's label: the bundle's own price. Then the value yardstick, smaller. */}
            {r.b && <p className="mt-1 w-full max-w-[96px] rounded-b-lg px-1 py-0.5 text-[15px] font-bold leading-tight lg:text-base" style={{ background: textSafeFill(info), color: info.ink }} data-testid="faceoff-bar-label">{model.priceLead(r.b)}</p>}
            {r.value && <p className="mt-1.5 text-[15px] leading-snug text-foreground/90 lg:text-base" data-testid="faceoff-value">Value: <b className="tabular-nums">{r.value}</b> per {model.money(model.valueStep)}</p>}
            {r.b && <p className="mt-1 line-clamp-2 text-[15px] leading-tight text-foreground/85 lg:text-base">{model.nameNoPrice(r.b)}</p>}
            {/* Each network's full list, from the summary (the comparison page has no network panels). */}
            {basePath && <QueryLink to={`${basePath}/${r.n}`} className="mt-1 inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-4 hover:text-foreground lg:text-base" data-testid="faceoff-see-all">See all {info.name} bundles</QueryLink>}
          </div>
        );
      })}
    </div>
  );
}
