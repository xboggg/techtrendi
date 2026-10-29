// What the data bundle pages' social image says (server: data_bundles/og_image.py draws it).
// Computed with the site's own model, so the image can only say what the page says:
//   - "With GH¢20": each network's real answer from the finder at its default amount
//     (model.finderPicks: the better of the single bundle and the mix, "if you buy 2 times" for a mix),
//     and which one gives the most data (model.mostData);
//   - "Best value": the winners board's number 1 for all-day data, by name (no price per GB).
// Never "GH¢10 gets ...": a value per GH¢10 is a measure, not something you can buy.
//
// The server runs this through a bundle made from this file (scripts/build-og-summary.mjs ->
// data_bundles/og_summary.mjs in the tech-news repo): `node og_summary.mjs < document.json`.
import { createBundleModel, type BundleDataset } from "./dataBundles";
import { buyRoute } from "./bundleSheet";

/** The social image's amount: GH¢20 (owner: unchanged for now). It is NOT the page's default
 *  (the finder starts at DEFAULT_STATE.amount in src/lib/dataBundlesUrl.ts, GH¢5 since 22 Oct 2026). */
export const OG_AMOUNT = 20;

/** The network pages' images (owner, 29 Oct 2026: one image per page): the finder's answer on that
 *  network's page at these amounts, and the page's dial card (buyRoute). */
export const OG_NETWORK_AMOUNTS = [5, 10, 20];

export interface OgSummary {
  amount: string;
  picks: { network: string; name: string; color: string; ink: string; mb: number; shown: string; buys: number; best: boolean }[];
  bestValue: { network: string; name: string } | null;
  networks: {
    network: string; name: string; color: string; ink: string;
    rows: { amount: string; mb: number; shown: string; buys: number; lasts: string }[];
    dial: { code: string; steps: string; also: string | null; then: string } | null;
  }[];
}

export function ogSummary(doc: BundleDataset): OgSummary {
  const m = createBundleModel(doc);
  const picks = m.finderPicks(OG_AMOUNT);
  const lead = m.mostData(picks);
  const out = picks.filter((p) => p.b).map((p) => {
    const info = m.networkInfo(p.n);
    return { network: p.n, name: info.name, color: info.color, ink: info.ink, mb: p.b!.mb, shown: m.dataShown(p.b!), buys: p.combo ? p.combo.purchases : 1, best: lead.has(p.n) };
  }).sort((a, b) => Number(b.best) - Number(a.best) || b.mb - a.mb);
  const top = m.leaderboardRows("allday").ranked.find((r) => r.rank === 1)?.bundle ?? null;
  let bestValue: OgSummary["bestValue"] = null;
  if (top) {
    const net = m.networkInfo(top.network).name;
    const name = m.nameNoPrice(top);
    bestValue = { network: top.network, name: name.startsWith(net) ? name : `${net} ${name}` };
  }
  // Each network page: what its finder answers at GH¢5, 10 and 20 (finderPicks for that network only,
  // as FinderPhone's finderPicksFor), and what its dial card says.
  const networks = m.networks.map((n) => {
    const info = m.networkInfo(n);
    const rows = OG_NETWORK_AMOUNTS.flatMap((a) => {
      const p = m.finderPicks(a, {}).find((x) => x.n === n);
      return p?.b ? [{ amount: m.money(a), mb: p.b.mb, shown: m.dataShown(p.b), buys: p.combo ? p.combo.purchases : 1, lasts: m.shortValidity(p.b) }] : [];
    });
    return { network: n, name: info.name, color: info.color, ink: info.ink, rows, dial: buyRoute(m, n) };
  });
  return { amount: m.money(OG_AMOUNT), picks: out, bestValue, networks };
}
