// One network's page: <DATA_BUNDLES_BASE>/:country/:network.
// Preview: /tools-preview/data-bundles/ghana/mtn, noindex, not prerendered, not in the sitemap.
// Launch: /data-bundles/ghana/mtn, indexable, prerendered, in the sitemap (dataBundlesRoute.ts;
// steps in DOCS/DATA_BUNDLES_LAUNCH.md).
//
// Goal (owner, 20 Oct 2026): on a cheap phone, answer "what should I buy on MTN?" in 3 seconds.
// Order: status, heading in the network's colour, network switch + "Compare all networks",
// "What we list" (the counts, folded) with A / A+, then the finder for THIS network (its answer
// on the first screen at 390x844 and 360x680); then this network's best deals, its pay-any-amount
// calculator (MTN, Telecel), every bundle grouped by family, its winners board, "Good to know"
// (out-of-bundle rate, borrowed data: facts, never ranked), its questions and tips, its sources,
// and a small "See AT · See Telecel" row.
import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePageDefaultTheme } from "@/contexts/ThemeContext";
import { MotionConfig } from "framer-motion";
import { AlertOctagon, ArrowLeft, ArrowRight, HandCoins, Info } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import NotFound from "@/pages/NotFound";
import { useBundleData } from "@/hooks/useBundleData";
import { DATA_BUNDLES_BASE, DATA_BUNDLES_NOINDEX } from "@/data/dataBundleCountries";
import { DATA_BUNDLES_KEYWORDS, DATA_BUNDLES_OG_ALT, dataBundlesCrumbs, dataBundlesOgImage, networkSeo } from "@/data/dataBundlesRoute";
import { type BundleModel } from "@/lib/dataBundles";
import { BudgetFinder } from "@/components/data-bundles/BudgetFinder";
import { NetworkBest } from "@/components/data-bundles/NetworkPanels";
import { BundleTable } from "@/components/data-bundles/BundleTable";
import { MtnCalculators } from "@/components/data-bundles/MtnCalculators";
import { TelecelFlexiCalculator } from "@/components/data-bundles/TelecelFlexiCalculator";
import { Leaderboards } from "@/components/data-bundles/Leaderboards";
import { Advice } from "@/components/data-bundles/Advice";
import { Faq } from "@/components/data-bundles/Faq";
import { LiveStatus, SourcesAndDisclaimer, SourceLine } from "@/components/data-bundles/meta";
import { DataBundlesChrome, Details, NetPill, SectionHeading, TextSizeToggle, fmtDate, textSafeFill, QueryLink, useFocusTitleOnNavigate, CodesIn } from "@/components/data-bundles/shared";
import { cn } from "@/lib/utils";

export default function DataBundlesNetwork() {
  const { country = "ghana", network = "" } = useParams();
  // Follows the site's light/dark toggle; dark first if the visitor never chose a theme.
  usePageDefaultTheme("dark");
  // In-app moves between data bundle pages put focus on the new title (UI audit L5).
  const titleRef = useFocusTitleOnNavigate<HTMLHeadingElement>(`${country}/${network}`);
  const data = useBundleData(country);
  // The family filter belongs to one network: it is stored with that network and read
  // back only while that network's page is open, so moving to another network page in
  // the app always starts on "all" (never on the previous network's family, not even
  // for one render).
  const [famPick, setFamPick] = useState<{ network: string; family: string }>({ network, family: "all" });
  const family = famPick.network === network ? famPick.family : "all";
  const setFamily = (f: string) => setFamPick({ network, family: f });
  if (!data || !data.model.networkInfo(network)) return <NotFound />;
  const { model } = data;
  const info = model.networkInfo(network);
  const basePath = `${DATA_BUNDLES_BASE}/${data.country.id}`;
  const isMtn = network === "mtn" && !!model.rates;
  const hasFlexi = network === "telecel" && !!model.flexi;
  // The same counts as the comparison page (model.bundleCounts / familyCounts), folded under "What we list".
  const { verified, pending, unconfirmed, notRechecked, notRecheckedSources } = model.bundleCounts(network);
  const fc = model.familyCounts(network);
  const others = model.networks.filter((n) => n !== network);
  const seo = networkSeo(info.name, data.country.name);
  // Switching network keeps the finder's amount (?amount=...): QueryLink adds the query as it is
  // at the moment of the tap (UI audit M1).
  const to = (n: string) => `${basePath}/${n}`;

  return (
    <Layout>
      <SEOHead
        title={seo.title}
        description={seo.description}
        canonical={`${basePath}/${network}`}
        noindex={DATA_BUNDLES_NOINDEX}
        image={dataBundlesOgImage(data.country.id, data.freshness.checkedAt)}
        imageAlt={DATA_BUNDLES_OG_ALT}
        keywords={DATA_BUNDLES_KEYWORDS}
        keywordsOnly
        webPage
        itemList={{ name: `Best ${info.name} data bundles by type`, items: model.networkTopDeals(network).map((d) => d.text) }}
        breadcrumbs={dataBundlesCrumbs(data.country, { id: network, name: info.name })}
      />
      <DataBundlesChrome headerAlpha={0.6} />
      <MotionConfig reducedMotion="user">
        {/* Pulled up behind the see-through site header, like the comparison page. */}
        <div className="relative -mt-16 overflow-x-clip bg-background pt-16 text-foreground md:-mt-20 md:pt-20" data-testid="network-page" data-net={network}>
          {/* Backdrop: two static glows in the network's colour and a faint grid (no animation). */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden">
            <span className="absolute -left-20 -top-24 h-72 w-72 rounded-full opacity-[0.14] blur-3xl dark:opacity-[0.22] md:h-96 md:w-96" style={{ background: info.color }} />
            <span className="absolute -right-24 top-20 h-64 w-64 rounded-full opacity-[0.10] blur-3xl dark:opacity-[0.16] md:h-80 md:w-80" style={{ background: info.color }} />
            <div className="absolute inset-0 text-foreground opacity-[0.05] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:40px_40px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
          </div>

          <header className="relative">
            <div className="container mx-auto max-w-6xl px-4 pb-8 pt-3 pr-7 [@media(max-height:820px)_and_(max-width:639px)]:pt-1.5 md:pb-12 md:pt-8">
              {/* Status, and on phones the A / A+ toggle at the top right (owner, 22 Oct 2026). */}
              <div className="flex items-start justify-between gap-2" data-testid="status-row">
                <div className="min-w-0 flex-1 sm:pt-0"><LiveStatus data={data} /></div>
                <TextSizeToggle className="-mt-2 shrink-0 sm:hidden" />
              </div>
              <h1 ref={titleRef} tabIndex={-1} data-testid="page-title" className="focus:outline-none mt-2 text-[1.75rem] font-black leading-[1.15] tracking-tight [@media(max-height:820px)_and_(max-width:639px)]:mt-1 [@media(max-height:820px)_and_(max-width:639px)]:text-[1.5rem] sm:mt-3 sm:text-5xl">
                <span className="rounded-xl px-2 sm:rounded-2xl sm:px-3" style={{ background: textSafeFill(info), color: info.ink }}>{info.name}</span>{" "}
                data bundles
              </h1>
              {/* Where the prices come from (tap: opens the Sources section). */}
              <div className="mt-1"><SourceLine data={data} only={network} /></div>
              {/* Network switch: the current one is marked by a ring; the others keep the amount. */}
              <nav className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 [@media(max-height:820px)_and_(max-width:639px)]:mt-1.5 sm:mt-3" aria-label="Networks">
                {model.networks.map((n) => (
                  <QueryLink key={n} to={to(n)} aria-current={n === network ? "page" : undefined} data-testid="net-switch" data-net={n}
                    className={cn("inline-flex min-h-11 min-w-11 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      n === network && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}>
                    <NetPill info={model.networkInfo(n)} className={cn("px-3 py-1 text-sm", n === network && "underline decoration-2 underline-offset-4")} />
                  </QueryLink>
                ))}
                <QueryLink to={basePath} className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-full px-1.5 text-sm font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="compare-all">
                  {/* Short on phones so it fits beside the three network pills (one row, answer on the first screen). */}
                  <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden /> <span className="sm:hidden">All networks</span><span className="hidden sm:inline">Compare all networks</span>
                </QueryLink>
              </nav>
              {/* Short phones: this row moves below the finder, so the answer is on the first screen (UI audit M3). */}
              <div className="flex flex-col">
              <div className="mt-2 flex items-start justify-between gap-2 text-sm text-muted-foreground [@media(max-height:820px)_and_(max-width:639px)]:order-last [@media(max-height:820px)_and_(max-width:639px)]:mt-3 sm:mt-3" data-testid="meta-row">
                <Details summary="What we list" className="min-w-0 flex-1" testId="what-we-list">
                  <p data-testid="net-counts">
                    {verified} fixed {info.name} bundles{pending > 0 && <>, plus {pending} new one{pending === 1 ? "" : "s"} still being checked</>}
                    {unconfirmed > 0 && <>, plus {unconfirmed} only on an old {info.name} page</>}. {model.rankedLine(network)}.
                    {" "}{fc.withFigures.length} families with prices{fc.describedOnly.length > 0 && <>, plus {fc.describedOnly.length} described without figures ({fc.describedOnly.join(", ")})</>}.
                    {notRechecked > 0 && <> {notRechecked} come{notRechecked === 1 ? "s" : ""} from {notRecheckedSources.join(" and ")}, which our checker can't read.</>}
                  </p>
                  {model.factText(network) && <p>{model.factText(network)}</p>}
                  <CodesIn texts={[model.factText(network)]} />
                  {typeof data.country.checkEveryHours === "number" && data.country.checkEveryHours > 0 && <p>We check the prices every {data.country.checkEveryHours} hours.</p>}
                </Details>
                <TextSizeToggle className="shrink-0 max-sm:hidden" />
              </div>

              <div className="mt-3 [@media(max-height:820px)_and_(max-width:639px)]:mt-2 sm:mt-4">
                {/* Keyed by network: the finder starts fresh on each network page (reads ?amount= again). */}
                <BudgetFinder key={network} model={model} only={network} />
              </div>
              </div>
            </div>
          </header>

          {/* Keyed by network: every section below (list filters, rankings, calculators) starts
              fresh on each network page, so no state from the previous network can carry over. */}
          <div key={network} className="container relative mx-auto max-w-6xl space-y-12 px-4 pb-28 pt-6 pr-7 md:space-y-16 md:pt-10">
            <NetworkBest model={model} network={network} />
            {isMtn && <MtnCalculators model={model} />}
            {hasFlexi && <TelecelFlexiCalculator model={model} />}
            <BundleTable model={model} network={network} family={family} onFamily={setFamily} />
            <Leaderboards model={model} network={network} />
            <GoodToKnow model={model} network={network} />
            <Faq model={model} only={network} />
            <Advice model={model} only={network} />
            <SourcesAndDisclaimer data={data} only={network} />
            <nav aria-label="Other networks" className="flex flex-wrap items-center gap-2" data-testid="other-networks">
              {others.map((n) => (
                <QueryLink key={n} to={to(n)} data-testid="see-network" data-net={n}
                  className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background/60 px-4 text-sm font-bold transition hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  See <NetPill info={model.networkInfo(n)} /> <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </QueryLink>
              ))}
              <QueryLink to={basePath} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">Compare all networks</QueryLink>
            </nav>
          </div>
        </div>
      </MotionConfig>
    </Layout>
  );
}

/** Facts, never ranked: browsing without a bundle, and borrowed data. Short plain cards. */
function GoodToKnow({ model, network }: { model: BundleModel; network: string }) {
  const o = model.outOfBundle(network);
  const borrowed = model.borrowed(network);
  if (!o && !borrowed.length) return null;
  const name = model.networkInfo(network).name;
  const best = model.bestForBudget(network, 1);
  // A help-centre link named by its article title (from the cited sources), never "help centre 1".
  const cited = model.sourcesFor(network).cited;
  const helpLabel = (u: string) => cited.find((c) => c.url === u)?.label.replace(/^MTN help centre, /, `${name} help centre: `) ?? `${name} help centre`;
  return (
    <section aria-labelledby="know-h" id="good-to-know" className="scroll-mt-24">
      <SectionHeading id="know-h" eyebrow="Good to know" title={`Before you browse on ${name}`} icon={<Info className="h-4 w-4" aria-hidden />} />
      <div className="grid gap-3 md:grid-cols-2">
        {o && (
          <div role="note" className="rounded-2xl border border-red-500/40 bg-red-50 p-4 text-red-950 dark:bg-red-500/10 dark:text-red-100" data-testid="oob-card">
            <p className="flex items-center gap-2 font-bold"><AlertOctagon className="h-5 w-5 shrink-0" aria-hidden /> No bundle? Data costs much more</p>
            <p className="mt-1 text-sm">
              Without a bundle, {name} charges {model.rate(o.perMb)} per MB ({model.money(o.perMb * model.mbPerGb(network))} per GB). {model.money(1)} that way buys about {model.fmtData(1 / o.perMb, network)}
              {best && <>; the same {model.money(1)} spent on {model.spendName(best)} buys {model.dataShown(best)} ({model.validityText(best)})</>}. Buy a bundle first.
            </p>
            {o.note && <Details className="mt-2" testId="oob-note"><p>{o.note}</p></Details>}
          </div>
        )}
        {borrowed.map(({ key, title, block: v }) => {
          const rows = Array.isArray(v.rows) ? v.rows.filter((r) => r && typeof r.price === "number") : [];
          const help = Array.isArray(v.helpSources) ? v.helpSources.filter((u) => typeof u === "string" && /^https:\/\//.test(u)) : [];
          return (
            <section key={key} aria-labelledby={`borrow-${key}`} role="note" className="rounded-2xl border border-amber-500/40 bg-amber-50 p-4 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100" data-testid="borrowed-card">
              <h3 id={`borrow-${key}`} className="flex items-center gap-2 font-bold"><HandCoins className="h-5 w-5 shrink-0" aria-hidden /> {name} {title}: borrowed data, not a bundle</h3>
              {/* The fee said once ("Fee: 20%"); the operator's own wording is under More info. */}
              <p className="mt-1 text-sm" data-testid="borrowed-line">
                {name} lends you data. You pay it back later{typeof v.feePercent === "number" && <>. <b>Fee: {v.feePercent}%</b></>}.
                {v.ussd && <> Dial {v.ussd}.</>} We never rank it with bundles.
              </p>
              <CodesIn texts={[v.ussd]} />
              {v.note && <Details className="mt-1" testId="borrowed-note"><p>{v.note}{v.feeLabel ? ` (${name} calls the fee “${v.feeLabel}”.)` : ""}</p></Details>}
              {rows.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm" aria-label={`${name} ${title}: data, price, fee and what you pay back`}>
                  {rows.map((r, i) => (
                    <li key={i} className="flex flex-wrap justify-between gap-x-3 border-b border-amber-500/20 pb-1 last:border-0">
                      <span className="font-semibold tabular-nums">{model.borrowedVolume(r)}</span>
                      <span className="tabular-nums">
                        {model.money(r.price!)}{typeof r.fee === "number" && <> + {model.money(r.fee)} fee</>}
                        {typeof r.totalDebt === "number" && <> = <b>pay back {model.money(r.totalDebt)}</b></>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-1 flex flex-wrap gap-x-4">
                {v.source && /^https:\/\//.test(v.source) && (
                  <a href={v.source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs font-medium underline underline-offset-2 md:min-h-6">
                    Source: {name}{v.pageUpdatedAt ? ` (page updated ${fmtDate(v.pageUpdatedAt)})` : ""}<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
                {help.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs font-medium underline underline-offset-2 md:min-h-6" data-testid="help-link">
                    {helpLabel(u)}<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

