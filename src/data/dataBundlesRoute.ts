// Where the data bundle pages live, and the launch switch. No data in here (the routes file and
// vite.config.ts import it, and they must not pull the price data into every page).
//
// PREVIEW (DATA_BUNDLES_LAUNCHED = false): /tools-preview/data-bundles/ghana, noindex, not prerendered,
//   not in the sitemap, no link from anywhere on the site.
// LAUNCH (true): /data-bundles/ghana, indexable, canonical to itself.
//
// The switch alone:
//   - moves the routes to /data-bundles/... (src/ssg/routes.tsx reads DATA_BUNDLES_ROUTE), with the
//     bare /data-bundles going to /data-bundles/ghana;
//   - makes the canonical https://techtrendi.com/data-bundles/ghana (and /ghana/mtn ...) and robots "index";
//   - prerenders the pages (vite.config.ts includedRoutes adds prerenderPaths), so the sitemap,
//     which lists every prerendered page, includes them (daily, priority 0.8);
//   - lists the tool on the Tools pages, the tools index and the footer (dataBundlesLink);
//   - moves the offline copy to /data-bundles-sw and removes the preview's registration.
// The server steps (nginx 301s and locations, checks, rollback) are the copy-paste runbook in
// DOCS/DATA_BUNDLES_LAUNCH.md. Launch only with the owner's go-ahead.
// DATA_BUNDLES_OFFLINE: the offline copy (public/sw-data-bundles.js), scoped to these pages only.
export const DATA_BUNDLES_LAUNCHED = true;
export const DATA_BUNDLES_PREVIEW_BASE = "/tools-preview/data-bundles";
export const DATA_BUNDLES_LAUNCH_BASE = "/data-bundles";
export const DATA_BUNDLES_SITE = "https://techtrendi.com";
/** The offline copy's two addresses (see dataBundlesRouteConfig().sw) and the file both serve. */
export const DATA_BUNDLES_SW_PREVIEW = "/tools-preview/data-bundles-sw";
export const DATA_BUNDLES_SW_LAUNCH = "/data-bundles-sw";
export const DATA_BUNDLES_SW_FILE = "sw-data-bundles.js";
/** Every address this worker was ever registered from (the kill switch and the launch clean-up
 *  remove registrations of any of them). "/sw-data-bundles.js" was used until 20 Oct 2026. */
export const DATA_BUNDLES_SW_URLS = ["/sw-data-bundles.js", DATA_BUNDLES_SW_PREVIEW, DATA_BUNDLES_SW_LAUNCH];
/** Each country page and its network pages (must match the dataset's networks; a test checks). */
export const DATA_BUNDLES_PAGES: Record<string, string[]> = { ghana: ["at", "mtn", "telecel"] };

/** Everything the launch switch decides, for either setting (so tests can check the launch
 *  state without flipping the switch). */
export function dataBundlesRouteConfig(launched: boolean) {
  const base = launched ? DATA_BUNDLES_LAUNCH_BASE : DATA_BUNDLES_PREVIEW_BASE;
  return {
    base,
    route: base.replace(/^\//, ""),
    noindex: !launched,
    canonical: (country: string, network?: string) => `${DATA_BUNDLES_SITE}${base}/${country}${network ? `/${network}` : ""}`,
    /** Paths vite-react-ssg prerenders (none in preview: the preview is not indexed). */
    prerenderPaths: launched ? Object.entries(DATA_BUNDLES_PAGES).flatMap(([c, nets]) => [`${base}/${c}`, ...nets.map((n) => `${base}/${c}/${n}`)]) : [],
    /** The offline copy's address: extensionless, served by an exact nginx location
     *  (default_type application/javascript, expires -1) from the build's sw-data-bundles.js.
     *  Preview: under /tools-preview/ (the preview's own files); launch: at the site root. */
    sw: launched ? DATA_BUNDLES_SW_LAUNCH : DATA_BUNDLES_SW_PREVIEW,
    /** The 301s nginx needs at launch (old preview links keep working). */
    redirects: launched ? [
      { from: `${DATA_BUNDLES_PREVIEW_BASE}/`, to: `${DATA_BUNDLES_LAUNCH_BASE}/`, status: 301 },
      { from: DATA_BUNDLES_PREVIEW_BASE, to: DATA_BUNDLES_LAUNCH_BASE, status: 301 },
      { from: DATA_BUNDLES_LAUNCH_BASE, to: `${DATA_BUNDLES_LAUNCH_BASE}/ghana`, status: 301 },
      { from: `${DATA_BUNDLES_LAUNCH_BASE}/`, to: `${DATA_BUNDLES_LAUNCH_BASE}/ghana`, status: 301 },
    ] : [],
  };
}

const CURRENT = dataBundlesRouteConfig(DATA_BUNDLES_LAUNCHED);
export const DATA_BUNDLES_BASE = CURRENT.base;
/** Preview pages stay out of search; launch pages are indexable. */
export const DATA_BUNDLES_NOINDEX = CURRENT.noindex;
/** The router paths (no leading slash), from the base above. */
export const DATA_BUNDLES_ROUTE = CURRENT.route;
export const DATA_BUNDLES_PRERENDER = CURRENT.prerenderPaths;

/** The social image the checker draws after every run (server: data_bundles/og_image.py),
 *  public at /storage/data-bundles/og-<country>.jpg, 1200 x 630, under 300 KB. The pages ask
 *  for it with ?v=YYYYMMDDHH of the prices' checked time, so WhatsApp and Facebook fetch a new
 *  image when the prices are re-checked (the same stamp as og_image.version). */
export const DATA_BUNDLES_OG_ALT = "Today's best data deals in Ghana: how much data GH¢20 buys on AT, MTN and Telecel";
export function dataBundlesOgImage(country: string, checkedAt: string): string {
  const t = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(checkedAt) ? `${checkedAt}T00:00:00Z` : checkedAt);
  const base = `/storage/data-bundles/og-${country}.jpg`;
  if (Number.isNaN(t)) return base;
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${base}?v=${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}`;
}

/** Plain-words title and description per network (og-meta.php serves the same to social bots). */
export const networkSeo = (name: string, country: string) => ({
  title: `${name} Data Bundles in ${country}: What to Buy Today`,
  description: `What to buy on ${name} ${country}: the most data for your money, every ${name} bundle with its price, how long it lasts and how to buy it.`,
});

/** The data bundle tool as the rest of the site links to it: the Tools card (src/data/tools.ts),
 *  the tools index and the footer. Only once launched (null in preview), so nothing on the site
 *  points at the private preview. */
export function dataBundlesLink(launched: boolean = DATA_BUNDLES_LAUNCHED) {
  if (!launched) return null;
  return {
    href: `${DATA_BUNDLES_LAUNCH_BASE}/ghana`,
    title: "Ghana Data Bundles",
    footerLabel: "Ghana Data Bundles",
    description: "The most data for your money on MTN, Telecel and AT, checked every 3 hours",
  };
}

/** The breadcrumb trail for structured data: Home › Tools › Data bundles › Ghana (› MTN). */
export function dataBundlesCrumbs(country: { id: string; name: string }, network?: { id: string; name: string }, base: string = DATA_BUNDLES_BASE) {
  return [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Data bundles", path: base },
    { name: country.name, path: `${base}/${country.id}` },
    ...(network ? [{ name: network.name, path: `${base}/${country.id}/${network.id}` }] : []),
  ];
}

/** meta keywords for the data bundle pages (audit 9, L8). */
export const DATA_BUNDLES_KEYWORDS = ["data bundles Ghana", "MTN data", "Telecel data", "AT data", "cheapest data Ghana"];

/** Offline copy of these pages (public/sw-data-bundles.js, scoped to DATA_BUNDLES_BASE).
 *  false = not registered, and any earlier registration of it is removed (the kill switch). */
export const DATA_BUNDLES_OFFLINE = true;
export const DATA_BUNDLES_SW = CURRENT.sw;
