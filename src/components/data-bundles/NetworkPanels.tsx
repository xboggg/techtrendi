// The comparison page's network panels: for each network, its best-value all-day,
// never-expires and night deal (model.cheapestIn on the like-for-like groups), each with
// price and data ("GH¢400 bundle → 263.38GB"), how long it lasts, its value bar and how to buy. Bars in one
// row of categories share one scale, so networks compare at a glance.
//
// Phones (under 640px): a swipe view with ONE full-width card per network and no peek of
// the next one (scroll-snap, each card exactly the view's width), AT · MTN · Telecel tabs
// with a sliding underline above it, and dots below. Swipe, tap a tab or a dot, or use the
// arrow keys on the tabs. From 640px: the cards side by side (three columns from 768px).
import { ArrowRight, Infinity as InfinityIcon, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { GROUPS, type Bundle, type BundleModel } from "@/lib/dataBundles";
import { BuyFold, BuyLine, OperatorTitle, appSourceText, fromAppOnly, ChannelNote, CountUpText, Details, OtherSourceNote, SectionHeading, SwipeDeck, TrustBadge, TrustReasons, trustOf, ValueFigure, glass, hasNotes, textSafeFill, valueExplainer, workedOutText, QueryLink, perGbLine, LeadArrow } from "./shared";

/** The panel rows: like-for-like groups by id (never mixed). */
export const PANEL_CATEGORIES = [
  { id: "allday", label: "Any time" },
  { id: "noexpiry", label: "Never expires" },
  { id: "night", label: "Night only" },
] as const;

/** Each network's pick per category, and the best value per category (for the bars). When a
 *  network's best any-time and best never-expires deal are the same bundle, the
 *  never-expires row is folded into the any-time one (`alsoNoExpiry`), so it shows once. */
export function panelPicks(model: BundleModel) {
  const test = (id: string) => GROUPS.find((g) => g.id === id)!.test;
  const picks = model.networks.map((n) => {
    const all = PANEL_CATEGORIES.map((c) => ({ ...c, b: model.cheapestIn(test(c.id), n) as Bundle | null, alsoNoExpiry: false }));
    const [day, ne] = all;
    if (day.b && ne.b && day.b === ne.b) day.alsoNoExpiry = true;
    return { n, rows: all, shownRows: all.filter((r) => !(r.id === "noexpiry" && day.alsoNoExpiry)) };
  });
  const best: Record<string, number> = {};
  for (const c of PANEL_CATEGORIES) best[c.id] = Math.max(1e-9, ...picks.map((p) => model.valueMb(p.rows.find((r) => r.id === c.id)!.b ?? { price: 0, mb: 0, kind: "anytime" }) ?? 0));
  return { picks, best };
}

export function NetworkPanels({ model, basePath }: { model: BundleModel; basePath: string }) {
  const { picks, best } = panelPicks(model);
  return (
    <section aria-labelledby="panels-h" id="networks" className="scroll-mt-24">
      <SectionHeading id="panels-h" eyebrow="Networks" title="Each network's best-value bundles (any price)" icon={<Radio className="h-4 w-4" aria-hidden />}
        info={<><p>Longer bar = more data for your money.</p><p>{valueExplainer(model)}</p></>} />
      <SwipeDeck
        id="nets"
        label="Networks"
        testId="net-swipe"
        slotTestId="net-panel-slot"
        dotTestId="net-dot"
        // From 768px: ROWS aligned across networks. Each card spans the same five shared rows
        // (name, any time, never expires, night, link; CSS subgrid), so each row's cells share one
        // height across AT, MTN and Telecel and the three columns end level. A merged "Same bundle
        // as above" cell stays short inside its row. Phones keep the one-card swipe.
        slotClassName="md:row-span-5 md:grid md:grid-rows-subgrid md:gap-y-0"
        items={picks.map(({ n, rows }) => {
          const info = model.networkInfo(n);
          return {
            id: n,
            name: info.name,
            tab: <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: info.color }} aria-hidden />{info.name}</span>,
            content: (
              <article className={cn(glass, "flex h-full flex-col overflow-hidden md:row-span-5 md:grid md:grid-rows-subgrid md:gap-y-0")} data-testid="net-panel" data-net={n}>
                <div className="relative overflow-hidden px-4 py-3" style={{ background: textSafeFill(info), color: info.ink }}>
                  <span aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full border-[12px] opacity-20" style={{ borderColor: info.ink }} />
                  <h3 className="text-2xl font-black tracking-tight">{info.name}</h3>
                </div>
                <ul className="flex-1 divide-y divide-border md:contents">
                  {rows.map((r) => r.id === "noexpiry" && rows[0].alsoNoExpiry ? (
                    <li key={r.id} className="p-4" data-testid="panel-row" data-cat={r.id}>
                      <p className="text-[15px] font-bold uppercase tracking-[0.1em] text-foreground/85 lg:text-base">{r.label}</p>
                      {/* Compact repeat, so the row is not an empty block beside the other networks. */}
                      <p className="mt-1 text-[15px] lg:text-base" data-testid="panel-same">
                        <span className="font-semibold">Same bundle as above</span>
                        {rows[0].b && <span className="text-foreground/85">: {model.priceLead(rows[0].b)} → {model.dataShown(rows[0].b)} · never expires</span>}
                      </p>
                    </li>
                  ) : (
                    <li key={r.id} className="p-4" data-testid="panel-row" data-cat={r.id}>
                      <p className="text-[15px] font-bold uppercase tracking-[0.1em] text-foreground/85 lg:text-base">{r.label}</p>
                      {r.b ? <PanelDeal model={model} b={r.b} share={(model.valueMb(r.b) ?? 0) / best[r.id]} alsoNoExpiry={r.alsoNoExpiry} /> : (
                        <p className="mt-1 text-sm text-muted-foreground">{info.name} has no bundle of this type.</p>
                      )}
                    </li>
                  ))}
                </ul>
                <QueryLink
                  to={`${basePath}/${n}`}
                  className="group flex min-h-12 items-center justify-between gap-2 border-t border-border px-4 text-[15px] font-bold lg:text-base transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  See all {info.name} bundles <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                </QueryLink>
              </article>
            ),
          };
        })}
      />
    </section>
  );
}

/** One network's page: its best any-time, never-expires and night deal (the same picks as the
 *  comparison page's panel for that network, a duplicate shown once). Phones: one card at a time
 *  (swipe, tabs, dots, no peek); from 640px side by side. The bar compares with the best of ALL
 *  networks, so a short bar means another network gives more for the money. Every card keeps
 *  its Dial and Copy buttons (there are at most three). */
export function NetworkBest({ model, network }: { model: BundleModel; network: string }) {
  const { picks, best } = panelPicks(model);
  const mine = picks.find((p) => p.n === network);
  if (!mine) return null;
  const info = model.networkInfo(network);
  const rows = mine.shownRows.filter((r) => r.b);
  if (!rows.length) return null;
  return (
    <section aria-labelledby="best-h" id="best" className="scroll-mt-24">
      <SectionHeading id="best-h" eyebrow="Best deals" title={`${info.name}'s best-value bundles (any price)`} icon={<Radio className="h-4 w-4" aria-hidden />}
        info={<><p>Longer bar = more data for your money.</p><p>{valueExplainer(model)}</p><p>The bar compares with the best deal on any network: a shorter bar means another network gives more for the money.</p></>} />
      <SwipeDeck
        id={`best-${network}`}
        label={`${info.name} best deals`}
        testId="best-swipe"
        slotTestId="best-slot"
        dotTestId="best-dot"
        items={rows.map((r) => ({
          id: r.id,
          name: r.label,
          tab: <span>{r.id === "allday" ? "Any time" : r.id === "noexpiry" ? "Never expires" : "Night"}</span>,
          content: (
            <article className={cn(glass, "h-full p-4")} data-testid="best-card" data-cat={r.id}>
              <p className="text-[15px] font-bold uppercase tracking-[0.1em] text-foreground/85 lg:text-base">{r.label}</p>
              <PanelDeal model={model} b={r.b!} share={(model.valueMb(r.b!) ?? 0) / best[r.id]} alsoNoExpiry={r.alsoNoExpiry} openBuy />
            </article>
          ),
        }))}
      />
    </section>
  );
}

function PanelDeal({ model, b, share, alsoNoExpiry, openBuy }: { model: BundleModel; b: Bundle; share: number; alsoNoExpiry?: boolean; openBuy?: boolean }) {
  // Short, direct "how to buy"; the full line (with where it comes from) in details.
  const buy = model.buyShort(b);
  const buyFull = model.howToBuy(b);
  const shown = model.dataShown(b);
  return (
    <div className="mt-1 space-y-2">
      {/* The real price and data first ("GH¢400 bundle → 263.38GB"); value under it, smaller. */}
      <p className="leading-tight" data-testid="panel-price">
        <span className="block text-base font-bold tabular-nums"><LeadArrow text={model.priceLead(b)} /></span>
        <span className={cn("block font-black tabular-nums", shown.length > 12 ? "text-[1.7rem]" : "text-4xl")} data-testid="panel-data"><CountUpText text={shown} testId="panel-count" /></span>
      </p>
      <p className="text-[15px] lg:text-base">
        <span className="font-semibold">{model.nameNoPrice(b)}</span>
        <span className="text-foreground/85"> · {model.validityText(b)}</span>
      </p>
      <ValueFigure model={model} b={b} share={share} />
      {/* The best deal of its row keeps its Dial/Copy buttons; the others fold them. */}
      {/* Open on every card of every network: the Dial and Copy buttons, or the app's steps. */}
      {buy && <BuyLine text={buy} testId="panel-buy" />}
      {(
        <div className="flex flex-wrap gap-1.5">
          {alsoNoExpiry && (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[15px] lg:text-base font-semibold text-violet-800 dark:text-violet-200" data-testid="also-noexpiry">
              <InfinityIcon className="h-3 w-3" aria-hidden /> Also never expires
            </span>
          )}
          <TrustBadge b={b} />
        </div>
      )}
      {(
        <Details>
          <TrustReasons b={b} />
          {perGbLine(model, b) && <p data-testid="panel-cpg">{perGbLine(model, b)}</p>}
          <OperatorTitle model={model} b={b} />
          {fromAppOnly(b) && <p>{appSourceText(b, model.networkInfo(b.network).name)}</p>}
          {buyFull && buyFull !== buy && <p>How to buy, in full: {buyFull}</p>}
          {b.computed && b.computedLabel && <p>{b.computedLabel}.</p>}
          {b.note && <p>{b.note}</p>}
          {b.ussd && <ChannelNote model={model} b={b} />}
          <OtherSourceNote b={b} />
        </Details>
      )}
    </div>
  );
}
