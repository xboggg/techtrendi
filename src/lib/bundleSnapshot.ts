// The decision of what a data bundle page shows for the latest snapshot row.
// Pure and dependency-light (relative imports only), so the browser hook
// (src/hooks/useBundleData.ts) and the Node test suite run the same code.
import type { BundleDataset } from "./dataBundles";
import { validateDataset, compareToBaseline, contentKey, isStrictlyNewer, captureTime, futureDate, MAX_FUTURE_MS } from "./dataBundleSchema.js";

/** A snapshot dated more than this into the future is not trusted (clock or data error).
 *  Defined once in dataBundleSchema.js, which the prebuild script shares. */
export { MAX_FUTURE_MS };

export interface Freshness {
  /** When the figures were captured from the operators' pages. */
  capturedAt: string;
  /** When they were last confirmed (checked_at, falling back to capturedAt). */
  checkedAt: string;
  /** "bundled" = shipped with the build; "live" = confirmed by the latest snapshot. */
  source: "bundled" | "live" | "saved";
}

/** One row of techtrendi.data_bundle_snapshots. captured_at is a timestamp. */
export interface SnapshotRow { data: unknown; captured_at: string; checked_at: string | null }

const time = (s: string | null | undefined) => captureTime(s ?? undefined);

/** What the page should show for the latest snapshot row, or null to keep
 *  the bundled data as it is. Pure, so the test suite runs it directly.
 *  - A row that fails the schema or the partial-scrape guard is ignored.
 *  - Same figures (contentKey ignores capturedAt, checkedAt and
 *    verification, exactly as the checker's hash does): keep the bundled
 *    figures but take the row's checked_at AND its verification text, so
 *    "Prices checked" and Sources advance on every successful check.
 *  - Different figures: used only if the row's captured_at timestamp is
 *    strictly after the bundled capturedAt (date-only = start of day, UTC).
 *  - Otherwise (different but not newer) the bundled data wins. */
export function resolveSnapshot(base: BundleDataset, row: SnapshotRow, now: number = Date.now()): { doc: BundleDataset; freshness: Freshness } | null {
  const doc = row.data as BundleDataset;
  if (!doc || !validateDataset(doc).ok || !compareToBaseline(doc, base).ok) return null;
  // A row or document captured (or checked) more than MAX_FUTURE_MS (10 minutes) in the future is
  // rejected: it would otherwise win every "strictly newer" test until that date.
  if (futureDate({ ...row, data: doc }, now) !== null) return null;
  const rowChecked = row.checked_at ?? row.captured_at ?? doc.checkedAt ?? doc.capturedAt;
  const baseChecked = base.checkedAt ?? base.capturedAt;
  if (contentKey(doc) === contentKey(base)) {
    if (!(time(rowChecked) >= time(baseChecked))) return null;
    const verification = typeof doc.verification === "string" && doc.verification.trim() ? doc.verification : base.verification;
    return { doc: { ...base, verification }, freshness: { capturedAt: base.capturedAt, checkedAt: rowChecked, source: "live" } };
  }
  if (isStrictlyNewer(row, base)) {
    return { doc, freshness: { capturedAt: row.captured_at ?? doc.capturedAt, checkedAt: rowChecked, source: "live" } };
  }
  return null;
}

