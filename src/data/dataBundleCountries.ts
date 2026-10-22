// Countries the data bundle dashboard covers. Adding a country is data only:
// a dataset JSON with the schema of ghanaDataBundles.json, plus one entry
// here. The routes (/tools-preview/data-bundles/:country and
// /:country/:network) and every section read from this registry.
import ghana from "@/data/ghanaDataBundles.json";
import type { BundleDataset } from "@/lib/dataBundles";

export interface CountryConfig {
  /** URL segment and the `country` value in techtrendi.data_bundle_snapshots. */
  id: string;
  name: string;
  /** Currency symbol shown before prices. */
  currency: string;
  /** Dataset shipped with the build (used for prerendering and as the fallback). */
  dataset: BundleDataset;
  /** How often the checker on the server re-checks this country's prices, in hours.
   *  Shown on the live status strip ("re-checked every 3 hours") only while the last
   *  check is fresh; leave it out if the schedule changes and this is not updated. */
  checkEveryHours?: number;
}

export const DATA_BUNDLE_COUNTRIES: Record<string, CountryConfig> = {
  // Re-check schedule: every 3 hours (owner's plan, 18 Oct 2026).
  ghana: { id: "ghana", name: "Ghana", currency: "GH¢", dataset: ghana as unknown as BundleDataset, checkEveryHours: 3 },
};

/** Base path for the dashboards: set in dataBundlesRoute.ts (preview today; launch prepared). */
export { DATA_BUNDLES_BASE, DATA_BUNDLES_NOINDEX, DATA_BUNDLES_LAUNCHED } from "./dataBundlesRoute";
