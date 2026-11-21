// "Is this data deal real?" (21 Nov 2026, after the fake "DataMart Ghana" site sold
// "1TB of MTN data for GH¢285" and a buyer's MoMo wallet was emptied).
//
// A seller can't sell a network's data for less than the network itself charges, so an
// offer that works out cheaper per GB than the network's own best ALL-DAY bundle (the
// data page's "All-day data" winner for that network, model.leaderboard("allday")) is a
// red flag. Night, one-app and some-customers-only offers are not the yardstick: sellers
// advertise all-day data. Pure functions: no prices are hard-coded here.

export type DealUnit = "MB" | "GB" | "TB";
export type DealVerdict = "scam" | "careful" | "possible";

/** Below this share of the network's own best price per GB: almost certainly a scam. */
export const SCAM_SHARE = 0.7;

export function offerMb(amount: number, unit: DealUnit, mbPerGb: number): number {
  if (unit === "MB") return amount;
  if (unit === "GB") return amount * mbPerGb;
  return amount * mbPerGb * mbPerGb;
}

export interface DealResult {
  /** The offer's price for one GB. */
  offerPerGb: number;
  /** The offer's price per GB divided by the network's best (below 1 = cheaper than the network). */
  share: number;
  /** How many times cheaper than the network's best (only meaningful when share < 1). */
  timesCheaper: number;
  verdict: DealVerdict;
}

/** null when the numbers can't be judged (empty, zero or negative). */
export function checkDeal(o: { mb: number; price: number; bestPerGb: number; mbPerGb: number }): DealResult | null {
  const { mb, price, bestPerGb, mbPerGb } = o;
  if (!(mb > 0) || !(price > 0) || !(bestPerGb > 0) || !(mbPerGb > 0)) return null;
  const offerPerGb = price / (mb / mbPerGb);
  const share = offerPerGb / bestPerGb;
  const verdict: DealVerdict = share < SCAM_SHARE ? "scam" : share < 1 ? "careful" : "possible";
  return { offerPerGb, share, timesCheaper: 1 / share, verdict };
}

/** "6" / "2.5" / "1.2": how many times cheaper, rounded so it reads plainly. */
export function timesText(t: number): string {
  if (t >= 10) return String(Math.round(t));
  return String(Math.round(t * 10) / 10).replace(/\.0$/, "");
}
