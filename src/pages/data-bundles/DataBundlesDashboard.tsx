// Data bundle comparison dashboard: <DATA_BUNDLES_BASE>/:country.
// Preview (DATA_BUNDLES_LAUNCHED = false): /tools-preview/data-bundles/ghana, noindex, not prerendered,
// not in the sitemap. Launch: /data-bundles/ghana, indexable, prerendered, in the sitemap
// (src/data/dataBundlesRoute.ts; steps in DOCS/DATA_BUNDLES_LAUNCH.md).
//
// A "command centre" in both site themes: it follows the site's light/dark toggle, and is
// dark first when the visitor never chose a theme (usePageDefaultTheme), mobile first. Data leads; explanations are one tap away ("details"). Every figure
// on the page is model output (createBundleModel); nothing here does arithmetic on
// prices or volumes. The dark section runs up behind the site header, which is made dark
// and see-through here only (DataBundlesChrome), so the glow shows through it.
import { useParams } from "react-router-dom";
import { usePageDefaultTheme } from "@/contexts/ThemeContext";
import { MotionConfig } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import NotFound from "@/pages/NotFound";
import { useBundleData } from "@/hooks/useBundleData";
import { DATA_BUNDLES_BASE, DATA_BUNDLES_NOINDEX } from "@/data/dataBundleCountries";
import { DATA_BUNDLES_KEYWORDS, DATA_BUNDLES_OG_ALT, dataBundlesCrumbs, dataBundlesOgImage } from "@/data/dataBundlesRoute";
import { Faq } from "@/components/data-bundles/Faq";
import { GROUPS, canWin, hasConflict, isConditional, isPending, isTimeRestricted, isUnconfirmed, type BundleModel } from "@/lib/dataBundles";
import { BudgetFinder } from "@/components/data-bundles/BudgetFinder";
import { MonthlyPlanner } from "@/components/data-bundles/MonthlyPlanner";
import { Leaderboards } from "@/components/data-bundles/Leaderboards";
import { Advice } from "@/components/data-bundles/Advice";
import { LiveStatus, ShareWhatsApp, SourcesAndDisclaimer, SourceLine } from "@/components/data-bundles/meta";
import { DataBundlesChrome, Details, NetPill, ScanSweep, TextSizeToggle, glass, useFocusTitleOnNavigate } from "@/components/data-bundles/shared";
import { cn } from "@/lib/utils";

/** Why the verified fixed bundles that are not ranked anywhere are not, from the data:
 *  their types, and whether some are offers only some customers can buy or are disputed. */
function notRankedText(model: BundleModel): string {
  const rest = model.bundles.filter((b) => !isPending(b) && !isUnconfirmed(b) && !(canWin(b) && GROUPS.some((g) => g.test(b))));
  const types: string[] = [];
  const add = (t: string) => { if (!types.includes(t)) types.push(t); };
  let some = false, disputed = false;
  for (const b of rest) {
    if (isConditional(b)) { some = true; continue; }
    if (hasConflict(b)) { disputed = true; continue; }
    if (b.kind === "hourly") add("one-hour");
    else if (b.kind === "morning") add("morning");
    else if (b.kind === "social" || b.kind === "video") add("one-app");
    else if (b.kind === "unlimited") add("unlimited");
    else if (isTimeRestricted(b)) add("some-days-or-hours");
    else add("other");
  }
  const list = (xs: string[], last: string) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} ${last} ${xs[xs.length - 1]}` : xs[0] ?? "");
  const parts = [types.length ? `${list(types, "or")} bundles` : "", some ? "offers only some people can buy" : "", disputed ? "bundles whose details are not clear on the network's own pages" : ""].filter(Boolean);
  return parts.length ? `: ${parts.length > 1 ? `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}` : parts[0]}` : "";
}

const JUMPS = [
  ["rankings", "Winners"],
  ["monthly", "Monthly"],
  ["advice", "Tips"],
  ["faq", "Questions"],
  ["sources", "Sources"],
] as const;

export default function DataBundlesDashboard() {
  const { country = "ghana" } = useParams();
  // Follows the site's light/dark toggle; dark first if the visitor never chose a theme.
  usePageDefaultTheme("dark");
  // In-app moves between data bundle pages put focus on the new title (UI audit L5).
  const titleRef = useFocusTitleOnNavigate<HTMLHeadingElement>(country);
  const data = useBundleData(country);
  if (!data) return <NotFound />;
  const { model } = data;
  const s = model.stats;
  const basePath = `${DATA_BUNDLES_BASE}/${data.country.id}`;
  const names = model.networks.map((n) => model.networkInfo(n).name);
  const nameList = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  const lead = s.cheapestAllDay;
  const shareText = lead.length
    ? `${data.country.name} data bundles compared. Best value now: ${lead.length > 1 ? `${lead.map((b) => model.dealText(b)).join(" and ")} (tied)` : model.dealText(lead[0])}, value ${model.valuePer(lead[0])}. Find the best bundle for your money:`
    : `${data.country.name} data bundles compared:`;

  // Rows from pay-any-amount rates in the rankings, and the networks ranked only that way (MTN),
  // so the summary never reads as if a network's data were left out (model.rankedCounts).
  const rc = model.rankedCounts();
  // Structured data, from the same model text the page shows: the questions (FAQPage) and
  // the number 1 of each winners tab (ItemList).
  const faqs = model.faqItems().map((f) => ({ question: f.question, answer: model.faqAnswer(f) }));
  const winnersList = { name: `Best value ${data.country.name} data bundles by type`, items: model.topWinners().map((w) => w.text) };
  const possessive = (ids: string[]) => ids.map((n) => `${model.networkInfo(n).name}'s`).join(" and ");
  const rateOnlyNames = rc.rateOnly.map((n) => model.networkInfo(n).name).join(" and ");

  return (
    <Layout>
      <SEOHead
        title={`${data.country.name} Data Bundles Compared: ${names.join(", ")}`}
        description={`Compare ${data.country.name} mobile data bundles from ${nameList}: the most data for your money, the cheapest plan for a month, and the best value of each type.`}
        canonical={basePath}
        noindex={DATA_BUNDLES_NOINDEX}
        image={dataBundlesOgImage(data.country.id, data.freshness.checkedAt)}
        imageAlt={DATA_BUNDLES_OG_ALT}
        keywords={DATA_BUNDLES_KEYWORDS}
        keywordsOnly
        faqs={faqs}
        itemList={winnersList}
        breadcrumbs={dataBundlesCrumbs(data.country)}
      />
      <DataBundlesChrome headerAlpha={0.6} />
      <MotionConfig reducedMotion="user">
        {/* Pulled up by the header's height (main's pt-16 / md:pt-20) so the dark section and its glow sit behind the see-through header. */}
        <div className="relative -mt-16 overflow-x-clip bg-background pt-16 text-foreground md:-mt-20 md:pt-20" data-testid="command-centre">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden"><ScanSweep /></div>
          {/* Backdrop: static network-colour glows and a faint grid (no animation, no canvas). */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden">
            {model.networks.map((n, i) => (
              <span
                key={n}
                className="absolute h-64 w-64 rounded-full opacity-[0.12] blur-3xl dark:opacity-[0.18] md:h-96 md:w-96"
                style={{ background: model.networkInfo(n).color, left: `${5 + i * 33}%`, top: i % 2 ? "8%" : "-18%" }}
              />
            ))}
            <div className="absolute inset-0 text-foreground opacity-[0.05] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:40px_40px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
          </div>

          <header className="relative">
            <div className="container mx-auto max-w-6xl px-4 pb-2 pt-3 pr-7 [@media(max-height:820px)_and_(max-width:639px)]:pt-1.5 md:pb-4 md:pt-8">
              {/* Phone first screen: one status line, the heading, the network chips, then "What
                  we compare" with A / A+ beside it, then the finder (its winner visible at 390x844). */}
              {/* Status, and on phones the A / A+ toggle at the top right (owner, 22 Oct 2026). */}
              <div className="flex items-start justify-between gap-2" data-testid="status-row">
                <div className="min-w-0 flex-1 sm:pt-0"><LiveStatus data={data} /></div>
                <TextSizeToggle className="-mt-2 shrink-0 sm:hidden" />
              </div>
              <h1 ref={titleRef} tabIndex={-1} data-testid="page-title" className="focus:outline-none mt-2 text-[1.75rem] font-black leading-[1.05] tracking-tight [@media(max-height:820px)_and_(max-width:639px)]:mt-1 [@media(max-height:820px)_and_(max-width:639px)]:text-[1.5rem] sm:mt-3 sm:text-5xl">
                {data.country.name} data bundles,{" "}
                <span className="bg-gradient-to-r from-amber-600 via-red-600 to-blue-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-red-400 dark:to-sky-400">compared</span>
              </h1>
              {/* Where the prices come from (tap: opens the Sources section). */}
              <div className="mt-1 [@media(max-height:820px)_and_(max-width:639px)]:mt-0"><SourceLine data={data} /></div>
              {/* Phones: the source line above already names the networks, so the chips give their
                  room to the finder (the answer stays on the first screen; owner, 22 Oct 2026). */}
              <div className="mt-2 hidden flex-wrap items-center gap-2 sm:mt-3 sm:flex">
                {model.networks.map((n) => <NetPill key={n} info={model.networkInfo(n)} />)}
              </div>
              {/* Short phones: this row moves below the finder, so the answer is on the first screen (UI audit M3). */}
              <div className="flex flex-col">
              <div className="mt-2 flex items-start justify-between gap-2 text-sm text-muted-foreground [@media(max-height:820px)_and_(max-width:639px)]:order-last [@media(max-height:820px)_and_(max-width:639px)]:mt-3 sm:mt-3" data-testid="meta-row">
                {/* The chips name the networks; how often we check and the counts are under "What we compare". */}
                <Details summary="What we compare" className="min-w-0 flex-1" testId="what-we-compare">
                  {typeof data.country.checkEveryHours === "number" && data.country.checkEveryHours > 0 && (
                    <p data-testid="cadence">We check the prices every {data.country.checkEveryHours} hours.</p>
                  )}
                  <p>
                    We rank {s.comparedCount} of the {s.fixedCount} fixed mobile data bundles we list from {nameList}. We only compare bundles of the same type: all-day, never expires, 30 days, night, and calls + data.
                    {rc.rateRows > 0 && <> We also rank {rc.rateRows} prices worked out from {possessive(rc.rateNetworks)} pay-any-amount price lists.{rateOnlyNames && <> {rateOnlyNames} data is ranked only this way.</>}</>}
                    {s.fixedCount > s.comparedCount && <> The other {s.fixedCount - s.comparedCount} fixed bundles are listed but not ranked{notRankedText(model)}.</>}
                    {s.pendingCount > 0 && <> {s.pendingCount} new bundle{s.pendingCount === 1 ? " is" : "s are"} still being checked, so we leave {s.pendingCount === 1 ? "it" : "them"} out.</>}
                    {s.unconfirmedCount > 0 && <> {s.unconfirmedCount} more bundle{s.unconfirmedCount === 1 ? " is" : "s are"} only on an old network page, so we don't rank {s.unconfirmedCount === 1 ? "it" : "them"}.</>}
                    {s.notRecheckedCount > 0
                      ? <> Our checker re-checks {s.fixedCount - s.notRecheckedCount} of the {s.fixedCount} on the networks' own pages. The other {s.notRecheckedCount} {s.notRecheckedCount === 1 ? "comes" : "come"} from {s.notRecheckedSources.join(" and ")}, which it can't read.</>
                      : <> Our checker re-checks all {s.fixedCount} on the networks' own pages.</>}
                  </p>
                </Details>
                <TextSizeToggle className="shrink-0 max-sm:hidden" />
              </div>

              <div className="mt-3 [@media(max-height:820px)_and_(max-width:639px)]:mt-2 sm:mt-4">
                <BudgetFinder model={model} />
              </div>
              </div>

              <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-2">
                {JUMPS.map(([id, label]) => (
                  <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-background/60 px-4 text-sm font-semibold transition hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </header>

          <div className="container relative mx-auto max-w-6xl space-y-12 px-4 pb-28 pt-6 pr-7 md:space-y-16 md:pt-8">
            {/* The winners board carries the face-off (its summary bars) and each network's
                "See all … bundles" link; the separate face-off and network panels are gone
                from this page (owner, 22 Oct 2026). The network pages keep their own best deals. */}
            <Leaderboards model={model} basePath={basePath} />
            <MonthlyPlanner model={model} />
            <Advice model={model} />
            <Faq model={model} />
            <SourcesAndDisclaimer data={data} />
            <div className={cn(glass, "flex flex-col items-center gap-3 p-6 text-center")}>
              <p className="text-lg font-bold">Know someone paying too much for data?</p>
              <ShareWhatsApp text={shareText} />
            </div>
          </div>
        </div>
      </MotionConfig>
    </Layout>
  );
}
