import { motion } from "framer-motion";
import { ArrowRight, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { GROUPS, type BundleModel } from "@/lib/dataBundles";
import { QueryLink, SectionHeading, glass, textSafeFill } from "./shared";

export function NetworkCards({ model, basePath, exclude }: { model: BundleModel; basePath: string; exclude?: string }) {
  const nets = model.networks.filter((n) => n !== exclude);
  // Families with figures, and those only described (no published figures), counted apart (audit 8, L10).
  const famWith = nets.reduce((s, n) => s + model.familyCounts(n).withFigures.length, 0);
  const famDescribed = nets.reduce((s, n) => s + model.familyCounts(n).describedOnly.length, 0);
  return (
    <section aria-labelledby="nets-h" id="networks" className="scroll-mt-24">
      <SectionHeading id="nets-h" eyebrow="Networks" title={exclude ? "Compare with the other networks" : "Bundles, network by network"} icon={<Radio className="h-4 w-4" aria-hidden />}>
        Each network page lists the mobile data package families with published figures ({famWith} across {nets.length} network{nets.length === 1 ? "" : "s"} here{famDescribed > 0 ? `, plus ${famDescribed} described without figures` : ""}), with their rules, and each fixed bundle the network publishes with price, data, validity and price per GB.
      </SectionHeading>
      <div className={cn("grid gap-4", nets.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {nets.map((n, i) => {
          const info = model.networkInfo(n);
          // The same counts as the hero and the network page (model.bundleCounts).
          const { verified: count, pending, unconfirmed } = model.bundleCounts(n);
          const { withFigures, describedOnly } = model.familyCounts(n);
          const fams = withFigures.length;
          const day = model.cheapestIn(GROUPS[0].test, n);
          const ne = model.cheapestIn(GROUPS[1].test, n);
          return (
            <motion.div key={n} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <QueryLink
                to={`${basePath}/${n}`}
                className={cn(glass, "group block h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
              >
                <div className="relative overflow-hidden px-5 py-4" style={{ background: textSafeFill(info), color: info.ink }}>
                  <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full border-[14px] opacity-20" style={{ borderColor: info.ink }} />
                  <p className="text-2xl font-black tracking-tight">{info.name}</p>
                  <p className="text-sm font-semibold">
                    {count} fixed bundle{count === 1 ? "" : "s"}{pending > 0 && ` + ${pending} being verified`}{unconfirmed > 0 && ` + ${unconfirmed} unconfirmed`} · {fams} package {fams === 1 ? "family" : "families"}{describedOnly.length > 0 && ` + ${describedOnly.length} described`}
                  </p>
                </div>
                <div className="space-y-2 p-5 text-sm">
                  {day && <p><span className="text-foreground/85">Best all-day value: </span><b>{model.valuePer(day)}</b> <span className="text-foreground/85">({model.listName(day)})</span></p>}
                  {ne && <p><span className="text-foreground/85">Best never-expires value: </span><b>{model.valuePer(ne)}</b> <span className="text-foreground/85">({model.listName(ne)})</span></p>}
                  {model.factText(n) && <p className="text-muted-foreground">{model.factText(n)}</p>}
                  <p className="flex items-center gap-1 pt-1 font-bold">
                    See {info.name} bundles <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                  </p>
                </div>
              </QueryLink>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
