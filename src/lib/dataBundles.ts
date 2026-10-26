// Data bundle maths for the data bundle dashboards (MOBILE data only).
//
// Every figure comes from a dataset document with the schema of
// src/data/ghanaDataBundles.json (captured from the operators' own pages and
// apps, and verified). Nothing in this file adds a figure of its own: it only
// does arithmetic on what the networks publish.
//
// The maths runs on a dataset passed in (createBundleModel), so the same code
// serves the bundled JSON used for prerendering, a newer snapshot fetched at
// runtime from techtrendi.data_bundle_snapshots, and later other countries.
//
// Units: the dataset says how many MB make one GB for each network
// (networks.<id>.mbPerGb). TechTrendi counts 1 GB as 1,024 MB for every
// network, following MTN's app. Every GB figure and every price per GB is
// MB / that factor; the factor is never assumed here (a dataset without it
// cannot be modelled). A volume the operator prints in GB is stored as
// GB x 1,024, so it shows back exactly as printed. MB figures stay as MB.
//
// "Any amount" data (MTN regular data and Midnight, Telecel Flexi) is sold at
// a per-MB rate that depends on the spend. Those volumes are computed from
// the published rate tables and flagged `computed`.
//
// Broadband (MTN Turbonet/FBB and similar) is out of scope: this tool is
// mobile data only. Any "router" bundle in an older dataset is dropped here.

export type NetworkId = string;
export type Kind =
  | "anytime" | "noexpiry" | "night" | "hourly" | "morning"
  | "family" | "combo" | "social" | "video"
  /** No data volume (e.g. AT Unlimited Daily): never priced per GB. */
  | "unlimited"
  /** Usable only on some days or hours (weekend-only, Sunday-only...). */
  | "weekend" | "restricted";

export const KINDS: Kind[] = ["anytime", "noexpiry", "night", "hourly", "morning", "family", "combo", "social", "video", "unlimited", "weekend", "restricted"];

/** Why a bundle's own published figures disagree (e.g. AT's product page vs
 *  AT's FAQ). Free-form: rendered as the dataset gives it. */
export type BundleConflict = Record<string, unknown>;

export interface Bundle {
  network: NetworkId;
  family: string;
  name: string;
  /** The operator's own title when `name` is our shorter one (Telecel cards; checker, audit 9). */
  operatorTitle?: string;
  /** Set by the model when the snapshot holds back a change to this bundle (heldChanges): the
   *  figures shown are the last checked ones; the text says what is being checked. */
  held?: string;
  price: number;
  /** Data volume in MB, used for maths only. Missing (null) for unlimited bundles. */
  mb: number;
  /** The operator's own printed volume (e.g. AT's "1024 MB"): shown verbatim. */
  label?: string;
  /** Sourced only from an older page (e.g. an AT FAQ): shown, never ranked. */
  unconfirmed?: boolean;
  /** When the source of an unconfirmed item was last updated. */
  asOf?: string;
  /** How to buy, when only some channels sell it ("Only on *110# and the Telecel Play app"). */
  channel?: string;
  /** The days or hours it can be used ("Saturday and Sunday", "4 AM–7 AM"):
   *  the dataset's ONLY marker of a time or day restriction. */
  window?: string;
  validity: string;
  days: number | null;
  kind: Kind;
  ussd: string | null;
  /** URL, or a description such as "myMTN app (screenshot 17 Oct 2026)". */
  source: string;
  note?: string;
  /** airtime: GH¢ of bonus airtime included (AT Premier Packs). */
  extras?: { allNetMins?: number | null; onNetMins?: number | null; sms?: number; airtime?: number; [k: string]: unknown };
  /** Only some customers can buy it (MTN Data Zone, MTN Jara, MTN AFA): shown, never ranked. */
  conditional?: boolean;
  /** Why a conditional bundle is not for everyone: "personalised" (offered to
   *  some accounts, e.g. MTN Data Zone), "regional" (only in the regions the
   *  operator lists, e.g. MTN Jara) or "eligibility" (only for a registered
   *  group, e.g. MTN AFA for farmers registered with Prepeez Limited). */
  conditionalReason?: "personalised" | "regional" | "eligibility" | string;
  /** Another page of the same operator describes this bundle differently. The
   *  bundle's figures are its product page's; this is shown beside them.
   *  `contradicts: "validity"` (MTN Kokrokoo: its terms say unused data is lost
   *  after 8 AM, its help centre that it does not expire) means the bundle is
   *  never treated as never-expiring; "price": another page prints another price. */
  otherSource?: { label?: string; url?: string; updated?: string; says?: string; buy?: string; summary?: string; contradicts?: string };
  /** Another USSD code the operator prints for this bundle, and where. */
  altUssd?: { code: string; label?: string; url?: string; updated?: string; says?: string };
  /** New bundle not yet verified: shown on its network page only. */
  pending?: boolean;
  /** The operator's own pages disagree about this bundle. */
  conflict?: BundleConflict;
  /** Set by the model when the operator's family description says the
   *  bundle does not expire though its validity text gives only the hours
   *  (Telecel Night King: "No Expiry (12am – 5am)"). */
  noExpiry?: boolean;
  /** The operator's own validity wording, when it differs from `validity`
   *  (Telecel Night King: "No Expiry (12am – 5am)"). */
  operatorValidity?: string;
  /** True for volumes worked out from an operator's published per-MB rate. */
  computed?: boolean;
  /** For computed bundles: e.g. "Computed from Telecel's published rate". */
  computedLabel?: string;
  /** For computed bundles: the spend range of the rate band it stands for. */
  band?: SpendRange;
  /** For computed bundles: the rate table's short name, e.g. "Telecel Flexi, no expiry". */
  rateLabel?: string;
}

export interface SpendRange { from: number; to: number; exact: boolean; /** true when no higher band exists */ top: boolean }

export interface RateBand {
  from?: number; to?: number; exactly?: number; ghsPerMb: number; fromExclusive?: boolean;
  /** Validity of data bought in this band, in days (Telecel Flexi expiry option). */
  days?: number;
  /** The operator does not publish a rate for this range (or it is not
   *  confirmed): never computed, the calculator says so instead. */
  unconfirmed?: boolean;
  notPublished?: boolean;
  published?: boolean;
  note?: string;
  /** Set by withMinSpend on the range below a published minimum spend (MTN
   *  Pulse: the tariff prices it, MTN's help centre says offers start at
   *  GH¢0.07): the minimum, and whose minimum it is ("MTN's help-centre minimum"). */
  belowMinimum?: { amount: number; label: string };
}

/** A band the data marks as not published / not confirmed. */
export const isUnpublishedBand = (b: RateBand) =>
  b.unconfirmed === true || b.notPublished === true || b.published === false || !(typeof b.ghsPerMb === "number" && b.ghsPerMb > 0);

export interface MtnRates {
  regular: RateBand[];
  midnight: RateBand[];
  social: number;
  video: number;
  socialRange: [number, number];
  outOfBundlePerMb: number;
  validityNote: string;
  validitySource?: string;
  midnightWindow?: string;
  midnightSource?: string;
  balanceCheck?: string;
  balanceSource?: string;
  pulse: {
    note: string; ussd: string; data: RateBand[]; validity?: string; validitySources?: { label?: string; url?: string; updated?: string; says?: string }[];
    /** Where the buying line comes from (the checker's curation): *567#, confirmed by a live test on 18 Oct 2026. */
    ussdNote?: string;
    /** The lowest amount MTN's help centre gives for Pulse (GH¢0.07); amounts below it are never worked out. */
    minSpend?: { amount: number; says?: string; url?: string; label?: string; updated?: string; note?: string };
    /** An older MTN source whose Pulse figures disagree with the tariff page
     *  (help centre 5106366483730, last edited 17 Jul 2024: older volumes,
     *  contradicts "volume"). Shown beside the figures, which are the tariff's. */
    otherSource?: Bundle["otherSource"];
  };
  /** MTN's help-centre answer on stopping a data bundle's auto-renewal, verbatim. */
  autoRenew?: { label?: string; url?: string; updated?: string; says?: string };
  /** Another MTN source that disputes Midnight's "does not expire" (MTN's Kokrokoo terms). */
  midnightOtherSource?: Bundle["otherSource"];
  /** Every MTN page, help-centre article and terms PDF the text quotes, with its date. */
  citedSources?: CitedSource[];
  kokrokoo?: { price: number; mb: number; window: string; validitySource?: string };
  /** MTN's note on any-amount Social and Video data (one flat rate per MB). */
  socialNote?: string;
  [k: string]: unknown;
}

/** A quoted source and its date: help centre = last edited (Zendesk edited_at),
 *  mtn.com.gh pages = page last modified, PDFs = document date. */
export interface CitedSource { label: string; url: string; date: string; dateLabel: string; for: string[] }

export interface NetworkInfo { name: string; color: string; ink: string; source: string; mbPerGb?: number; [k: string]: unknown }

/** Borrowed data (AT Data Kredit, MTN Xtrabyte): the operator advances data and
 *  takes back the price plus a fee later. A fact, never a bundle. */
export interface BorrowedBlock {
  kind: "borrowed";
  family?: string;
  ussd?: string;
  feeLabel?: string;
  feePercent?: number;
  rows?: { label?: string; mb?: number; price?: number; fee?: number; totalDebt?: number; validity?: string }[];
  source?: string;
  helpSources?: string[];
  note?: string;
  pageUpdatedAt?: string;
  [k: string]: unknown;
}

/** One dataset document: the schema of src/data/ghanaDataBundles.json and of
 *  techtrendi.data_bundle_snapshots.data. Fields marked optional may be
 *  missing in older datasets; everything still renders without them. */
/** A change the checker held back (freshness audit M3): the snapshot keeps the old value. */
export interface HeldChange { item: string; field: "price" | "mb" | "ghsPerMb" | "ussd" | "unconfirmed"; at?: number; old: unknown; new: unknown; reason: string }
export interface BundleDataset {
  capturedAt: string;
  /** Changes held back for a human (the checker's heldChanges); old values are in the data. */
  heldChanges?: HeldChange[];
  /** Optional, legacy: when the figures were last re-checked. Freshness now
   *  comes from the snapshot row at runtime. Falls back to capturedAt. */
  checkedAt?: string;
  /** How the figures were verified, in the dataset's own words. */
  verification: string;
  /** Note on how GB is counted per network. */
  units?: string | Record<string, unknown>;
  networks: Record<NetworkId, NetworkInfo>;
  mtnRates?: MtnRates;
  telecelRates?: Record<string, unknown>;
  atRates?: Record<string, unknown>;
  bundles: Bundle[];
  familyInfo: Record<NetworkId, Record<string, string>>;
  networkFacts: Record<NetworkId, string>;
  [k: string]: unknown;
}

// ---------------------------------------------------------------- formatting

/** Price per GB, with GB = `mbPerGb` MB (networks.<id>.mbPerGb; no default). */
export const costPerGb = (b: Pick<Bundle, "price" | "mb">, mbPerGb: number) => b.price / (b.mb / mbPerGb);
export const mbPerCedi = (b: Pick<Bundle, "price" | "mb">) => b.mb / b.price;

const round2 = (n: number) => Math.round(n * 100 + 1e-7) / 100;
/** Under one GB stays MB; otherwise GB = MB / mbPerGb. Both to the nearest
 *  0.01, as the myMTN app shows them (MTN GH¢399 = 222,556.9 MB shows
 *  "217.34 GB"; GH¢3 Midnight = 8,683.07 MB shows "8.48 GB").
 *  The unit is chosen AFTER rounding, so one amount never shows two ways:
 *  1,023.999 MB rounds to 1,024 MB, which is 1 GB at 1,024 MB per GB.
 *  `mbPerGb` is the dataset's factor (networks.<id>.mbPerGb); there is no default. */
export function fmtData(mb: number, mbPerGb: number): string {
  if (!(typeof mb === "number" && Number.isFinite(mb))) return "Unlimited";
  const mbR = round2(mb);
  if (mbR >= mbPerGb) return `${round2(mb / mbPerGb).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GB`;
  return `${mbR.toLocaleString("en-GB", { maximumFractionDigits: 2 })} MB`;
}

/** The money step of the headline value figure: "Every GH¢10 = 6.58 GB". */
export const VALUE_STEP = 10;
/** A value figure (the data VALUE_STEP of a bundle's price buys), in one precision
 *  everywhere: GB to exactly two decimals ("6.58 GB", "15.00 GB"), MB below one GB to
 *  the whole MB ("868 MB"; under 1 MB, two decimals). The unit is chosen after
 *  rounding, so 1,023.6 MB shows "1.00 GB", never "1,024 MB". */
export function fmtValue(mb: number, mbPerGb: number): string {
  if (!(typeof mb === "number" && Number.isFinite(mb) && mb > 0)) return "";
  const whole = Math.round(mb);
  if (whole >= mbPerGb) return `${round2(mb / mbPerGb).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GB`;
  if (mb >= 1) return `${round2(mb).toLocaleString("en-GB", { maximumFractionDigits: 2 })} MB`;
  return `${round2(mb).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MB`;
}

/** Nice round steps for a gauge's top value (x 10^k). */
const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
/** Headroom above the biggest value before rounding up, so the winner's needle sweeps near
 *  the top (about 75-93% of the arc) but never lies flat at the very end. */
export const GAUGE_HEADROOM = 1.08;
/** The smallest nice number (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 x 10^k) at or above `v`. */
export function niceCeil(v: number): number {
  if (!(typeof v === "number" && Number.isFinite(v) && v > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of NICE_STEPS) { const x = Math.round(m * p * 1e6) / 1e6; if (x >= v - 1e-9) return x; }
  return Math.round(10 * p * 1e6) / 1e6;
}
/** A tick label: up to two decimals, trailing zeros dropped ("0", "0.75", "2", "1,000"). */
export const tickText = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });

/** The finder's value meter: each network's amount as a share of the best amount for the
 *  same money, in plain zones. "Best" is the winner (or a tie on the shown amount); below it
 *  "Good" from 75%, "Fair" from 50%, "Poor" under 50%. */
export const VALUE_ZONES = [
  { id: "poor", label: "Poor", from: 0 },
  { id: "fair", label: "Fair", from: 0.5 },
  { id: "good", label: "Good", from: 0.75 },
  { id: "best", label: "Best", from: 1 },
] as const;
export type ValueZone = (typeof VALUE_ZONES)[number]["label"];
/** The zone for a share of the best amount; `isBest` (the winner or a shown tie) is always "Best". */
export function valueZone(share: number, isBest: boolean): ValueZone {
  if (isBest) return "Best";
  if (share >= 0.75 - 1e-9) return "Good";
  if (share >= 0.5 - 1e-9) return "Fair";
  return "Poor";
}

/** Normalised display text, for "is it the same on screen" comparisons. */
export const sameText = (a: string, b: string) => a.replace(/[\s,]/g, "").toUpperCase() === b.replace(/[\s,]/g, "").toUpperCase();

export function fmtMoney(n: number, symbol = "GH¢"): string {
  const r = Math.round(n * 100) / 100;
  const isWhole = Math.abs(r - Math.round(r)) < 1e-9;
  return `${symbol}${isWhole ? Math.round(r).toLocaleString("en-GB") : r.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Money for per-MB rates: at least 4 decimals, and always 4 significant
 *  digits, so a small rate is never rounded away (GH¢0.1145, GH¢0.01965,
 *  GH¢0.0003455, not GH¢0.0003). Trailing zeros are dropped (GH¢0.0015). */
export function fmtRate(n: number, symbol = "GH¢"): string {
  const sig = n > 0 && Number.isFinite(n) ? Math.ceil(-Math.log10(n) - 1e-12) + 3 : 4;
  const max = Math.min(10, Math.max(4, sig));
  return `${symbol}${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: max })}`;
}

/** Backwards-compatible Ghana formatter. */
export const fmtGhs = (n: number) => fmtMoney(n, "GH¢");

/** What an amount box shows and the number it stands for, from what was typed:
 *  digits and one point only, at most two decimals (whole pesewas: "1.239" ->
 *  "1.23"), leading zeros dropped ("00.5" -> "0.5", "020" -> "20"), clamped
 *  to `max`. An empty or unreadable box stands for 0. */
export function normaliseAmountText(typed: string, max: number): { text: string; value: number; clamped: boolean } {
  const clean = String(typed ?? "").replace(/[^\d.]/g, "");
  const dot = clean.indexOf(".");
  const one = dot < 0 ? clean : clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  const text = one.replace(/^0+(?=\d)/, "");
  const v = parseFloat(text);
  if (!Number.isFinite(v)) return { text, value: 0, clamped: false };
  // Above the top amount: the box shows the top amount, and `clamped` lets the page say so.
  if (v > max) return { text: String(max), value: max, clamped: true };
  return { text, value: Math.max(0, v), clamped: false };
}

const roundCents = (n: number) => Math.round(n * 100) / 100;
const ceilCents = (n: number) => Math.ceil(n * 100 - 1e-6) / 100;
const toP = (n: number) => Math.round(n * 100);

// ---------------------------------------------------------------- rate maths

function bandMatches(b: RateBand, amount: number): boolean {
  if (b.exactly !== undefined) return Math.abs(amount - b.exactly) < 1e-9;
  const lowOk = b.fromExclusive ? amount > (b.from ?? 0) + 1e-9 : amount >= (b.from ?? 0) - 1e-9;
  return lowOk && amount <= (b.to ?? Infinity) + 1e-9;
}

/** Bands with a published rate (unpublished/unconfirmed ones removed). */
const pricedBands = (table: RateBand[]) => table.filter((b) => !isUnpublishedBand(b));

/** The unpublished/unconfirmed band covering `amount`, if the data marks one. */
export function unpublishedBandAt(amount: number, table: RateBand[]): RateBand | null {
  return table.find((b) => isUnpublishedBand(b) && bandMatches(b, amount)) ?? null;
}

/** The band that applies to spending exactly `amount`, or null if not sold
 *  or if the data marks that amount as not published.
 *  Exact-amount special rates (e.g. MTN GH¢3, 10, 399) win over the band around them. */
export function bandFor(amount: number, table: RateBand[]): RateBand | null {
  const priced = pricedBands(table);
  const exact = priced.find((b) => b.exactly !== undefined && bandMatches(b, amount));
  if (exact) return exact;
  if (unpublishedBandAt(amount, table)) return null;
  return priced.find((b) => b.exactly === undefined && bandMatches(b, amount)) ?? null;
}

/** The published rate for spending exactly `amount`, or null if not sold. */
export function rateFor(amount: number, table: RateBand[]): number | null {
  return bandFor(amount, table)?.ghsPerMb ?? null;
}

type BandTest = (b: RateBand) => boolean;
const anyBand: BandTest = () => true;

/** MB that spending `amount` buys under a rate table (0 if not sold, or if
 *  the band that applies fails `ok`). */
export function mbFromTable(amount: number, table: RateBand[], ok: BandTest = anyBand): number {
  const b = bandFor(amount, table);
  return b && ok(b) ? amount / b.ghsPerMb : 0;
}

const bandLow = (b: RateBand) => b.exactly ?? (b.fromExclusive ? roundCents((b.from ?? 0) + 0.01) : b.from ?? 0);
const bandHigh = (b: RateBand) => b.exactly ?? b.to ?? bandLow(b);

/** The lowest and highest spend a table accepts. */
export function tableRange(table: RateBand[]): [number, number] {
  let lo = Infinity, hi = 0;
  for (const b of pricedBands(table)) { lo = Math.min(lo, roundCents(bandLow(b))); hi = Math.max(hi, bandHigh(b)); }
  return [lo, hi];
}

/** Every spend at which the MB-per-spend line can bend or jump: each band's
 *  ends, each exact special amount and the pesewa either side of it. Any
 *  optimal mix of purchases needs at most one spend that is not one of these
 *  (moving money between two in-between spends never loses data). */
export function cornerAmounts(table: RateBand[]): number[] {
  const out = new Set<number>();
  for (const b of table) {
    if (b.exactly !== undefined) {
      out.add(b.exactly); out.add(roundCents(b.exactly - 0.01)); out.add(roundCents(b.exactly + 0.01));
    } else {
      out.add(roundCents(bandLow(b)));
      if (b.to !== undefined) out.add(roundCents(b.to));
      // Either side of an unpublished range, where the priced line stops and restarts.
      if (isUnpublishedBand(b)) { out.add(roundCents(bandLow(b) - 0.01)); if (b.to !== undefined) out.add(roundCents(b.to + 0.01)); }
    }
  }
  return [...out].filter((a) => a > 0 && bandFor(a, table)).sort((a, b) => a - b);
}

/** Best spend not above `budget` in whole pesewas: the budget itself, or a
 *  corner amount if that buys more. */
export function bestSpendWithin(table: RateBand[], budget: number, ok: BandTest = anyBand): { amount: number; mb: number } | null {
  const cap = Math.floor(budget * 100 + 1e-6) / 100;
  const candidates = new Set<number>([cap, ...cornerAmounts(table).filter((a) => a <= cap + 1e-9)]);
  let best: { amount: number; mb: number } | null = null;
  for (const amount of candidates) {
    const mb = mbFromTable(amount, table, ok);
    if (mb > 0 && (!best || mb > best.mb + 1e-9 || (Math.abs(mb - best.mb) < 1e-9 && amount < best.amount))) best = { amount, mb };
  }
  return best;
}

/** Smallest spend (whole pesewas) that buys at least `targetMb`, or null. */
export function minSpendFor(table: RateBand[], targetMb: number, ok: BandTest = anyBand): number | null {
  let best: number | null = null;
  for (const b of pricedBands(table)) {
    if (!ok(b)) continue;
    let amount: number;
    if (b.exactly !== undefined) {
      amount = b.exactly;
    } else {
      amount = Math.max(bandLow(b), ceilCents(targetMb * b.ghsPerMb));
      if (amount > (b.to ?? Infinity) + 1e-9) continue;
    }
    // Skip over a range the data marks as not published.
    const gap = b.exactly === undefined ? unpublishedBandAt(amount, table) : null;
    if (gap && gap.exactly === undefined && gap.to !== undefined) amount = roundCents(gap.to + 0.01);
    if (b.exactly === undefined && amount > (b.to ?? Infinity) + 1e-9) continue;
    // Re-check with the real lookup (an exact special may override the band).
    let tries = 0;
    while (mbFromTable(amount, table, ok) + 1e-9 < targetMb && tries < 5) { amount = roundCents(amount + 0.01); tries++; }
    if (mbFromTable(amount, table, ok) + 1e-9 < targetMb) continue;
    if (best === null || amount < best) best = amount;
  }
  return best;
}

/** A run of spends that buy LESS data than a smaller spend in the same rate
 *  table ("spend cliff"): from..to (whole pesewas) all buy less than `better`,
 *  which buys `betterMb`. Worked out from the published rates only. */
export interface SpendCliff { from: number; to: number; better: number; betterMb: number }

/** Every spend cliff in a rate table, scanning each pesewa it prices (MTN
 *  regular data: GH¢5 buys 521.03 MB, GH¢5.01 to GH¢7.32 buy less). Amounts the
 *  table does not price (gaps, unconfirmed bands) are skipped, never compared. */
export function spendCliffs(table: RateBand[], ok: BandTest = anyBand): SpendCliff[] {
  const priced = pricedBands(table);
  if (!priced.length) return [];
  const [lo, hi] = tableRange(table);
  const out: SpendCliff[] = [];
  let bestMb = 0, bestP = 0, lastP = -2;
  for (let p = toP(lo); p <= toP(hi); p++) {
    const mb = mbFromTable(p / 100, table, ok);
    if (!(mb > 0)) continue;
    if (mb + 1e-9 < bestMb) {
      const last = out[out.length - 1];
      if (last && toP(last.better) === bestP && lastP === p - 1) last.to = p / 100;
      else out.push({ from: p / 100, to: p / 100, better: bestP / 100, betterMb: bestMb });
      lastP = p;
    } else if (mb > bestMb + 1e-9) { bestMb = mb; bestP = p; }
  }
  return out;
}

/** The spend cliff an amount falls in, if any. */
export const cliffAt = (cliffs: SpendCliff[], amount: number): SpendCliff | null =>
  cliffs.find((c) => amount >= c.from - 1e-9 && amount <= c.to + 1e-9) ?? null;

/** A spend-cliff hint is worth showing only when the smaller amount buys at least this many
 *  MB more AND this share more (audit 8, L5): near the top of a cliff the gain shrinks to a
 *  fraction of an MB, which no reader would act on and GB rounding cannot even show. */
export const CLIFF_MIN_GAIN_MB = 1;
export const CLIFF_MIN_GAIN_SHARE = 0.005;
/** What spending `amount` loses against the cliff's better (smaller) amount. */
export function cliffGain(table: RateBand[], cliff: SpendCliff, amount: number): { mb: number; gainMb: number; share: number } {
  const mb = mbFromTable(amount, table);
  const gainMb = cliff.betterMb - mb;
  return { mb, gainMb, share: mb > 0 ? gainMb / mb : Infinity };
}
export const isMaterialGain = (g: { gainMb: number; share: number }) =>
  g.gainMb >= CLIFF_MIN_GAIN_MB - 1e-9 && g.share >= CLIFF_MIN_GAIN_SHARE - 1e-12;
/** The parts of each spend cliff where the gain is material (isMaterialGain), as cliffs of
 *  their own: every amount in them buys at least CLIFF_MIN_GAIN_MB and CLIFF_MIN_GAIN_SHARE
 *  less than `better`. Worked out pesewa by pesewa from the published rates. */
export function materialCliffs(table: RateBand[], cliffs: SpendCliff[] = spendCliffs(table)): SpendCliff[] {
  const out: SpendCliff[] = [];
  for (const c of cliffs) {
    let run: SpendCliff | null = null;
    for (let p = toP(c.from); p <= toP(c.to); p++) {
      const a = p / 100;
      if (isMaterialGain(cliffGain(table, c, a))) {
        if (run && toP(run.to) === p - 1) run.to = a;
        else { run = { ...c, from: a, to: a }; out.push(run); }
      }
    }
  }
  return out;
}
/** A volume in MB to two decimals ("1,071.43 MB"), never converted to GB. */
export const fmtMb = (mb: number) => `${round2(mb).toLocaleString("en-GB", { maximumFractionDigits: 2 })} MB`;

/** "Dial" wording for a code the data gives, with any non-code alternative turned into
 *  "use ...": "*110# or the Telecel Play app" -> "Dial *110# or use the Telecel Play app"
 *  (audit 8, L6). Text that does not start with a code is returned as it is. */
export function dialText(ussd: string): string {
  const t = ussd.trim();
  if (!/^\*[\d*]+#/.test(t)) return t;
  return `Dial ${t.replace(/(,?\s+or\s+)(the\s+[^,;()*]*?\bapp\b)/i, "$1use $2")}`;
}
/** A how-to-buy line cut down for cards (plain words, no provenance): the full line, with
 *  where it comes from, stays one tap away. Only wording is removed, never a code or an
 *  app name (tested: every *code# of the full line survives).
 *  "Dial *111*4# then option 1" -> "Dial *111*4# then 1";
 *  "In the myMTN app: “Midnight” (as the app showed it, screenshot 17 Oct 2026)." -> "myMTN app: Midnight.";
 *  "Dial *700# or *110#, or use the Telecel Play app (Telecel's data terms)." -> "Dial *700# or *110#, or use the Telecel Play app."; */
export function shortBuyText(t: string): string {
  let s = t.trim();
  // MTN help-centre quote: "...: 'Yes, you can purchase Social Bundle only via MyMTN App or *138#'".
  const via = s.match(/:\s*'(?:Yes, )?you can (?:purchase|buy) .*? only (?:via|on) (.+?)'\.?$/i);
  if (via) return `Only on the ${via[1].replace(/\bMyMTN App\b/g, "myMTN app").replace(/^the /i, "")}.`;
  // "Buy it on Telecel's bundles page (telecel.com.gh/...), which says “...”." -> "Buy it on Telecel's bundles page."
  const page = s.match(/^(Buy it on .+?) \([^)]*\), which says .*$/);
  if (page) return `${page[1]}.`;
  s = s
    .replace(/\s*\(as the app showed it,[^)]*\)/g, "")
    .replace(/\s*\((?:[A-Z][A-Za-z]*'s )[^()]*\)/g, "")
    .replace(/\bthen option (\d)/g, "then $1")
    .replace(/^In the (my\w+ app): /, "$1: ")
    .replace(/[“”]/g, "")
    .replace(/\s+\./g, ".")
    .replace(/\b(?:the )?My ?Telecel Play App\b|\bTelecel Play App\b/gi, "the Telecel Play app")
    .replace(/\bthe the\b/gi, "the")
    .replace(/\bmyMTN app\b|\bMyMTN App\b/g, "myMTN app")
    .replace(/^the Telecel/, "the Telecel")
    .trim();
  return s;
}

/** "a", "a or b", "a, b or c". */
const orList = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}` : xs[0] ?? "");

/** A rate table with a published minimum spend applied (MTN Pulse: the tariff
 *  says "above GH¢0", MTN's help centre "from GHS0.07"): the band holding the
 *  minimum starts there, and the amounts below it become an unpriced range
 *  carrying the source's note and `belowMinimum` (the minimum and `label`,
 *  whose minimum it is), so no figure is ever worked out for them and the page
 *  says they are below that minimum, not that no rate is published. */
export function withMinSpend(table: RateBand[], min: number | undefined, note?: string, label = "the published minimum"): RateBand[] {
  if (!(typeof min === "number" && min > 0)) return table;
  const out: RateBand[] = [];
  for (const b of table) {
    if (b.exactly !== undefined) { if (b.exactly >= min - 1e-9) out.push(b); continue; }
    if ((b.to ?? Infinity) < min - 1e-9) continue;
    if (bandLow(b) < min - 1e-9) { const { fromExclusive: _x, ...rest } = b; out.push({ ...rest, from: min }); }
    else out.push(b);
  }
  if (min > 0.01 + 1e-9) out.unshift({ from: 0.01, to: roundCents(min - 0.01), ghsPerMb: 0, notPublished: true, belowMinimum: { amount: min, label }, ...(note ? { note } : {}) });
  return out;
}

// ------------------------------------------------------------ classification

/** Offers only some customers can buy (MTN Data Zone: personalised; MTN Jara:
 *  regional). Shown on the network page, kept out of rankings so nobody is
 *  promised a deal they cannot get. Older datasets have no flag, so the family
 *  name is a fallback. */
export const isConditional = (b: Bundle) => b.conditional === true || b.family === "Data Zone";
/** Why a conditional bundle is not for everyone, from the data ("personalised"
 *  when the dataset does not say: the older datasets only flagged Data Zone). */
export const conditionalReason = (b: Bundle): string | null =>
  !isConditional(b) ? null : typeof b.conditionalReason === "string" && b.conditionalReason.trim() ? b.conditionalReason : "personalised";
/** New bundles the checker has not verified yet. */
export const isPending = (b: Bundle) => b.pending === true;
/** The operator's own figures disagree. */
export const hasConflict = (b: Bundle) => !!b.conflict && typeof b.conflict === "object";
/** Sourced only from an older page (flag `unconfirmed`): shown, never ranked. */
export const isUnconfirmed = (b: Bundle) => b.unconfirmed === true;
/** Has a data volume that can be priced per GB (unlimited bundles have none). */
export const hasVolume = (b: Pick<Bundle, "mb" | "kind">) => b.kind !== "unlimited" && typeof b.mb === "number" && Number.isFinite(b.mb) && b.mb > 0;

/** A validity that is a day-of-week window (weekend-only, Sunday-only...). */
const DAY_WINDOW = /\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day|nesday|rsday|urday|sday)?s?\b|\bweekends?\b/i;
/** A validity that is a clock window ("12 AM–5 AM", "4am - 7am", "5 AM to 8 AM"). */
const TIME_WINDOW = /\b\d{1,2}(:\d{2})?\s*(am|pm)\s*(–|—|-|to)\s*\d{1,2}(:\d{2})?\s*(am|pm)\b/i;
/** Usable only on some days or at some hours, as the operator words its
 *  validity (Telecel Bossu Weekend: "Saturday & Sunday"). Its `days` count is
 *  never trusted for this: two weekend days are not two days of all-day data. */
export const isTimeRestricted = (b: Pick<Bundle, "kind" | "validity"> & { operatorValidity?: string; window?: string | null }) =>
  (typeof b.window === "string" && b.window.trim() !== "") ||
  b.kind === "night" || b.kind === "morning" || b.kind === "weekend" || b.kind === "restricted" ||
  DAY_WINDOW.test(b.validity ?? "") || DAY_WINDOW.test(b.operatorValidity ?? "") ||
  TIME_WINDOW.test(b.validity ?? "") || TIME_WINDOW.test(b.operatorValidity ?? "");

/** Can appear in rankings, finders and planners. */
export const isRankable = (b: Bundle) => !isPending(b) && !isConditional(b) && !isUnconfirmed(b) && hasVolume(b);
/** Can be named a winner (cheapest, most data, hero figure). */
export const canWin = (b: Bundle) => isRankable(b) && !hasConflict(b);

/** Usable for ordinary browsing at any hour, in any app, and buyable by anyone. */
export function isAllDay(b: Bundle): boolean {
  return (b.kind === "anytime" || b.kind === "noexpiry" || b.kind === "family") && isRankable(b) && !isTimeRestricted(b);
}

const NO_EXPIRY_TEXT = /\bno[\s-]?expiry\b|\bnon[\s-]?expiry\b|never expires|does not expire/i;
/** Another page of the same operator disputes this bundle's validity (MTN
 *  Kokrokoo: help centre "does not expire", terms "Any unused data is lost
 *  after 8am"). Such a bundle is never treated as never-expiring. */
export const expiryDisputed = (b: { otherSource?: Bundle["otherSource"] }) => b.otherSource?.contradicts === "validity";
/** Never expires, as the operator publishes it (kind "noexpiry", or a
 *  validity such as Telecel Night King's "No Expiry (12am–5am)"), and no other
 *  page of the operator disputes it. */
export const neverExpires = (b: Pick<Bundle, "kind" | "validity"> & { noExpiry?: boolean; operatorValidity?: string; otherSource?: Bundle["otherSource"] }) =>
  !expiryDisputed(b) &&
  (b.kind === "noexpiry" || b.noExpiry === true || NO_EXPIRY_TEXT.test(b.validity ?? "") || NO_EXPIRY_TEXT.test(b.operatorValidity ?? ""));
/** True when a family description says its bundles never expire. */
export const familySaysNoExpiry = (text: string | undefined) => !!text && NO_EXPIRY_TEXT.test(text);

/** Lasts at least `days` days, as far as the operator publishes. */
export const lastsAtLeast = (b: Bundle, days: number) => neverExpires(b) || (b.days !== null && b.days >= days);

export interface Group { id: string; label: string; hint: string; test: (b: Bundle) => boolean }

/** Like-for-like groups. Comparisons only ever happen inside one group, so a
 *  night bundle is never ranked against an all-day one. */
/** One network's sourced answer to a question (see model.faqItems). */
export interface FaqLine { network: NetworkId; text: string; source?: string }
export interface FaqItem { question: string; lines: FaqLine[] }

export const GROUPS: Group[] = [
  { id: "allday", label: "All-day data", hint: "Use any time, any app", test: (b) => isAllDay(b) },
  { id: "noexpiry", label: "Never expires", hint: "Lasts until you use it", test: (b) => isAllDay(b) && neverExpires(b) },
  { id: "month", label: "Lasts 30 days", hint: "Month-long bundles", test: (b) => isAllDay(b) && !neverExpires(b) && (b.days ?? 0) >= 30 },
  { id: "night", label: "Night only", hint: "Night hours only", test: (b) => b.kind === "night" && isRankable(b) },
  { id: "combo", label: "Calls + data", hint: "Minutes, SMS and data together", test: (b) => b.kind === "combo" && isRankable(b) && !isTimeRestricted(b) },
];

/** "Small buys": the winners board's first tab (owner, 22 Oct 2026). The all-day group's rows
 *  (same eligibility: no borrowed, unconfirmed, pending, conditional-only or time-restricted rows)
 *  that cost at most SMALL_MAX. A pay-any-amount band that starts at or below SMALL_MAX is shown
 *  clipped to SMALL_MAX (same rate, so the same value and rank). Not one of GROUPS: the counts,
 *  winners, structured data and social image are unchanged. */
export const SMALL_MAX = 20;
export const SMALL_GROUP = { id: "small", label: "Small buys (up to GH¢20)", hint: "GH¢20 or less, use any time, any app" } as const;

/** The winners board's two controls (owner, 22 Oct 2026, round 2): a price switch and a type.
 *  The board shown is their combination: "Any price" + a type = that group (GROUPS), unchanged;
 *  "Small buys" + a type = that group's rows at SMALL_MAX or less (smallPool). */
export const PRICE_FILTERS = [
  { id: "small", label: "Small buys (up to GH¢20)", short: "Small buys" },
  { id: "any", label: "Any price", short: "Any price" },
] as const;
export type PriceFilter = (typeof PRICE_FILTERS)[number]["id"];
/** The type pills, one per group, in GROUPS order. `none` names them in the empty line. */
export const TYPE_FILTERS: { id: string; label: string; none: string }[] = [
  { id: "allday", label: "Any time", none: "all-day bundles" },
  { id: "noexpiry", label: "Never expires", none: "never-expiring bundles" },
  { id: "month", label: "30 days", none: "30-day bundles" },
  { id: "night", label: "Night", none: "night bundles" },
  { id: "combo", label: "Calls + data", none: "calls + data bundles" },
];
/** The board id for a price × type: "Any price" boards are the group ids; Small buys boards are
 *  "small" (all-day, the original Small buys tab) or "small:<group>". */
export const boardId = (price: PriceFilter, type: string) => (price === "any" ? type : type === "allday" ? SMALL_GROUP.id : `${SMALL_GROUP.id}:${type}`);
/** The group a board id ranks in, and whether it is capped at SMALL_MAX. */
export function parseBoardId(id: string): { small: boolean; group: string } {
  if (id === SMALL_GROUP.id) return { small: true, group: "allday" };
  if (id.startsWith(`${SMALL_GROUP.id}:`)) return { small: true, group: id.slice(SMALL_GROUP.id.length + 1) };
  return { small: false, group: id };
}
/** The one-line hint under the controls for a board. */
export function boardHint(id: string): string {
  const { small, group } = parseBoardId(id);
  const g = GROUPS.find((x) => x.id === group);
  if (!g) return "";
  return small ? (group === "allday" ? SMALL_GROUP.hint : `GH¢20 or less, ${g.hint.charAt(0).toLowerCase()}${g.hint.slice(1)}`) : g.hint;
}
/** The line shown when a Small buys combination has no rows. */
export function emptyBoardText(id: string): string {
  const { group } = parseBoardId(id);
  const t = TYPE_FILTERS.find((x) => x.id === group);
  return `No ${t ? t.none : "bundles"} at GH¢${SMALL_MAX} or less – try Any price`;
}

/** Bundles that would belong to a group but are usable only on some days or
 *  hours: listed beside the group, never ranked in it (night has its own tab). */
export function restrictedTest(groupId: string): ((b: Bundle) => boolean) | null {
  const sb = parseBoardId(groupId);
  if (sb.small) {
    const t = restrictedTest(sb.group);
    return t ? (b) => t(b) && b.price <= SMALL_MAX + 1e-9 : null;
  }
  const base: Record<string, (b: Bundle) => boolean> = {
    allday: (b) => b.kind === "anytime" || b.kind === "noexpiry" || b.kind === "family" || b.kind === "weekend" || b.kind === "restricted",
    noexpiry: (b) => (b.kind === "noexpiry" || b.kind === "anytime" || b.kind === "family") && neverExpires(b),
    combo: (b) => b.kind === "combo",
  };
  const t = base[groupId];
  if (!t) return null;
  return (b) => t(b) && isRankable(b) && isTimeRestricted(b) && b.kind !== "night" && b.kind !== "morning";
}

/** The bundle table's groups, in display order (network pages). */
export const TABLE_SECTIONS: { id: string; label: string }[] = [
  { id: "allday", label: "All-day data" },
  { id: "combo", label: "Calls + data" },
  { id: "night", label: "Night only" },
  { id: "morning", label: "Morning only" },
  { id: "hourly", label: "One hour" },
  { id: "restricted", label: "Certain days or hours only" },
  { id: "social", label: "Social apps only" },
  { id: "video", label: "Video apps only" },
  { id: "unlimited", label: "Unlimited (no data amount, so no price per GB)" },
  { id: "other", label: "Other bundles" },
  { id: "unranked", label: "Not ranked: figures disputed, personalised, being verified or unconfirmed" },
];

/** Which group a bundle belongs to in the table. */
export function tableSection(b: Bundle): string {
  if (isPending(b) || isConditional(b) || isUnconfirmed(b) || hasConflict(b)) return "unranked";
  if (b.kind === "unlimited") return "unlimited";
  // A no-volume social bundle (AT Sunday Bundle) is grouped by its window or apps, not as unlimited data.
  if (isAllDay(b) && canWin(b)) return "allday";
  if (b.kind === "night") return "night";
  if (b.kind === "morning") return "morning";
  if (b.kind === "hourly") return "hourly";
  if (isTimeRestricted(b)) return "restricted";
  if (b.kind === "combo") return "combo";
  if (b.kind === "social") return "social";
  if (b.kind === "video") return "video";
  return "other";
}

export interface BudgetOptions {
  /** Night-only bundles instead of all-day ones (never mixed). */
  nightOnly?: boolean;
  noExpiryOnly?: boolean;
  /** Only bundles known to last at least this many days (no-expiry always passes). */
  minDays?: number;
}

export interface PlanItem { bundle: Bundle; count: number }
/** The finder's answer for one network (model.finderPick): `b` is the single buy, or the mix
 *  shown as one row when the mix gives more. */
export interface FinderPick { n: NetworkId; single: Bundle | null; combo: UsagePlan | null; b: Bundle | null }
export interface UsagePlan {
  network: NetworkId;
  items: PlanItem[];
  total: number;
  mb: number;
  /** Number of purchases in the plan (all bought within the month). */
  purchases: number;
  /** The purchase cap the plan was found under. */
  maxPurchases: number;
}

/** One leaderboard line. Computed bands are one row each with their spend range. */
export interface BoardRow { bundle: Bundle; cpg: number; rank: number; joint: boolean }

export interface HeadlineStats {
  /** Co-winners (price per GB shows the same), one per network. */
  cheapestAllDay: Bundle[];
  cheapestNoExpiry: Bundle[];
  cheapestNight: Bundle[];
  biggestAllDay: Bundle | null;
  /** Verified fixed mobile bundles (pending and unconfirmed ones not counted).
   *  The ONE definition of "bundles compared", used on the hero, the network
   *  cards and the network pages (see bundleCounts). */
  fixedCount: number;
  pendingCount: number;
  /** Bundles sourced only from older pages (shown, never ranked). */
  unconfirmedCount: number;
  /** Of the verified fixed bundles: those whose source is not a web page the
   *  checker downloads (e.g. "myMTN app (screenshot 17 Oct 2026)"), so the
   *  latest automatic run did not re-check them. */
  notRecheckedCount: number;
  /** Those non-web sources, as the dataset names them. */
  notRecheckedSources: string[];
  networkCount: number;
  familyCount: number;
  /** Of the verified fixed bundles, those ranked in at least one like-for-like group
   *  (GROUPS): the ONE "compared" count (audit 8, L10). */
  comparedCount: number;
  /** Families with figures (bundles or a rate table) and families only described
   *  (Just4U, Adwumapa: no published figures), across all networks. */
  familiesWithFigures: number;
  familiesDescribedOnly: number;
}

/** Most purchases a monthly plan may use; buying a tiny bundle dozens of times is not a real plan. */
export const MAX_PURCHASES = 12;
/** Most purchases in a finder combo ("2 × GH¢400 + 1 × GH¢200"). */
export const COMBO_MAX_BUYS = 3;
/** A list row's "lasts" text stays this short (model.shortValidity). */
export const SHORT_VALIDITY_MAX = 40;
/** A combo is shown when it gives at least this much more data than the single best buy (10%). */
export const COMBO_MIN_GAIN = 0.1;
/** The planner names a network that gives more data for at most this much more money (25%). */
export const UPSELL_MAX_EXTRA = 0.25;
/** Purchase caps offered by the monthly planner, and the default. */
export const PURCHASE_CAPS = [1, 3, 12] as const;
export const DEFAULT_PURCHASES = 3;

/** A rate table sold for any amount. */
export interface RateSource {
  id: string;
  network: NetworkId;
  family: string;
  /** Short name used in computed bundle names. */
  label: string;
  kind: Kind;
  table: RateBand[];
  computedLabel: string;
  source: string;
  validity: (band: RateBand) => string;
  days: (band: RateBand) => number | null;
  /** Another source of the operator disputes this table's data (MTN Midnight's expiry). */
  otherSource?: Bundle["otherSource"];
  /** Shown with every bundle worked out from this table (MTN Pulse: who MTN aims it at). */
  note?: string;
  /** How to buy data from this table, from the data (MTN Pulse: mtnRates.pulse.ussd;
   *  MTN regular data and Midnight: the myMTN app section that sells it; Telecel
   *  Flexi: telecelRates.flexi.buyVia). Becomes the computed bundles' `channel`. */
  buy?: string;
  /** A dial code the operator states for this table (MTN regular data: mtnRates.regularBuy.ussd,
   *  "*138# then 1, then 1", MTN's help centre, 26 Oct 2026). Becomes the computed bundles' `ussd`,
   *  so they get the Dial / Copy chip; `buy` then stays as the other way to buy. */
  ussd?: string;
}

/** Telecel Flexi, normalised from whatever shape the dataset uses. */
export interface FlexiInfo {
  family: string;
  noExpiry: RateBand[];
  expiry: RateBand[];
  range: [number, number] | null;
  raw: Record<string, unknown>;
}

export interface OutOfBundle { network: NetworkId; perMb: number; label: string; source?: string; note?: string }

export interface ModelOptions { currency?: string }

const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const obj = (v: unknown): Record<string, unknown> | undefined => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined);

/** Reads telecelRates.flexi: an array of bands, or an object holding one
 *  (bands / table / rates). Each band: from/to (or exactly), with
 *  noExpiry {ghsPerMb} and expiry {ghsPerMb, days}. */
export function readFlexi(telecelRates: unknown): FlexiInfo | null {
  const tr = obj(telecelRates);
  const rawFlexi = tr?.flexi;
  if (!rawFlexi) return null;
  const holder = obj(rawFlexi) ?? {};
  const list = Array.isArray(rawFlexi) ? rawFlexi : (holder.bands ?? holder.table ?? holder.rates ?? holder.data);
  if (!Array.isArray(list)) return null;
  const noExpiry: RateBand[] = [], expiry: RateBand[] = [];
  for (const raw of list) {
    const b = obj(raw);
    if (!b) continue;
    const base: RateBand = { ghsPerMb: 0 };
    const exactly = num(b.exactly), from = num(b.from) ?? num(b.min), to = num(b.to) ?? num(b.max);
    if (exactly !== undefined) base.exactly = exactly;
    else if (from !== undefined && to !== undefined) { base.from = from; base.to = to; if (b.fromExclusive === true) base.fromExclusive = true; }
    else continue;
    // A range the data marks as not published: kept in both tables so no figure is computed for it.
    if (b.unconfirmed === true || b.notPublished === true || b.published === false) {
      const gap: RateBand = { ...base, unconfirmed: true, ...(str(b.note) ? { note: str(b.note) } : {}) };
      noExpiry.push(gap); expiry.push({ ...gap });
      continue;
    }
    const ne = obj(b.noExpiry) ?? obj(b.noexpiry) ?? obj(b.nonExpiry);
    const neRate = num(ne?.ghsPerMb) ?? num(b.noExpiryPerMb) ?? num(b.noExpiryGhsPerMb);
    if (neRate && neRate > 0) noExpiry.push({ ...base, ghsPerMb: neRate });
    const ex = obj(b.expiry) ?? obj(b.withExpiry);
    const exRate = num(ex?.ghsPerMb) ?? num(b.expiryPerMb) ?? num(b.expiryGhsPerMb);
    const exDays = num(ex?.days) ?? num(ex?.validityDays) ?? num(b.expiryDays);
    if (exRate && exRate > 0 && exDays && exDays > 0) expiry.push({ ...base, ghsPerMb: exRate, days: exDays });
  }
  if (!pricedBands(noExpiry).length && !pricedBands(expiry).length) return null;
  const both = [...noExpiry, ...expiry];
  return {
    family: str(holder.family) ?? "Flexi (any amount)",
    noExpiry, expiry,
    range: both.length ? tableRange(both) : null,
    raw: holder,
  };
}

/** MTN rate tables with mtnRates.gaps ({regular, midnight, pulse}: [{from, to, note}])
 *  merged in as unpublished bands, sorted by spend. */
export function withGaps(r: MtnRates): MtnRates {
  const g = obj((r as Record<string, unknown>).gaps);
  if (!g) return r;
  const merge = (table: RateBand[] | undefined, list: unknown): RateBand[] | undefined => {
    if (!Array.isArray(table) || !Array.isArray(list) || !list.length) return table;
    const gaps: RateBand[] = list.map(obj).filter((x): x is Record<string, unknown> => !!x && num(x.from) !== undefined && num(x.to) !== undefined)
      .map((x) => ({ from: x.from as number, to: x.to as number, ghsPerMb: 0, notPublished: true, ...(str(x.note) ? { note: str(x.note) } : {}) }));
    return [...table, ...gaps].sort((a, b) => bandLow(a) - bandLow(b));
  };
  return {
    ...r,
    regular: merge(r.regular, g.regular) ?? r.regular,
    midnight: merge(r.midnight, g.midnight) ?? r.midnight,
    pulse: r.pulse ? { ...r.pulse, data: merge(r.pulse.data, g.pulse) ?? r.pulse.data } : r.pulse,
  };
}

export function createBundleModel(doc: BundleDataset, opts: ModelOptions = {}) {
  const currency = opts.currency ?? "GH¢";
  const money = (n: number) => fmtMoney(n, currency);
  const networks: NetworkId[] = Object.keys(doc.networks);
  // MTN rate tables with mtnRates.gaps merged in as unpublished bands, so no
  // figure is ever computed for an amount MTN publishes no rate for.
  // Pulse also starts at the lowest amount MTN's help centre gives (mtnRates.pulse.minSpend).
  const rates: MtnRates | null = (() => {
    if (!doc.mtnRates) return null;
    const r = withGaps(doc.mtnRates);
    const ms = r.pulse?.minSpend;
    if (!r.pulse || !Array.isArray(r.pulse.data) || !ms) return r;
    const whose = /^https:\/\/help-center\.mtn\.com\.gh\//.test(ms.url ?? "") ? "MTN's help-centre minimum" : "MTN's published minimum";
    return { ...r, pulse: { ...r.pulse, data: withMinSpend(r.pulse.data, num(ms.amount), str(ms.note), whose) } };
  })();
  /** How the myMTN app sold a rate table's data when it was recorded (mtnRates.app:
   *  the section that uses that table, e.g. "Data Bundles", "Low Cost Non Expiry Bundles"). */
  const appRoute = (table: string): string | undefined => {
    const app = obj(doc.mtnRates?.app);
    const sec = (Array.isArray(app?.sections) ? (app!.sections as unknown[]) : []).map(obj).find((x) => x?.rates === table);
    if (!sec || !str(sec.title)) return undefined;
    const where = [sec.title, sec.label].filter((x): x is string => !!str(x)).map((x) => `“${x}”`).join(", then ");
    const when = str(app?.source)?.match(/\(([^)]+)\)/)?.[1];
    return `In the myMTN app: ${where}${when ? ` (as the app showed it, ${when})` : ""}.`;
  };
  const hasNet = (n: string) => networks.includes(n);

  /** MB in one GB for this network: networks.<id>.mbPerGb, from the data only. */
  const factors = new Map<NetworkId, number>();
  for (const n of networks) {
    const f = num(doc.networks[n]?.mbPerGb);
    if (!(f && f > 0)) throw new Error(`dataset has no networks.${n}.mbPerGb: GB figures cannot be worked out`);
    factors.set(n, f);
  }
  const mbPerGb = (network: NetworkId) => {
    const f = factors.get(network);
    if (f === undefined) throw new Error(`unknown network ${network}`);
    return f;
  };
  /** One factor for every network (the site then states the convention once), else null. */
  const sharedMbPerGb = (): number | null => (new Set(factors.values()).size === 1 ? [...factors.values()][0] : null);
  const gbOf = (b: Pick<Bundle, "mb" | "network">) => b.mb / mbPerGb(b.network);
  const cpg = (b: Pick<Bundle, "price" | "mb" | "network">) => costPerGb(b, mbPerGb(b.network));
  const data = (mb: number, network: NetworkId) => fmtData(mb, mbPerGb(network));
  const perGbText = (b: Pick<Bundle, "price" | "mb" | "network">) => `${money(cpg(b))}/GB`;
  /** The headline value figure: the data each VALUE_STEP (GH¢10) of the bundle's price
   *  buys, MB x VALUE_STEP / price. A row worked out from a pay-any-amount rate has
   *  MB = spend / rate, so its value is VALUE_STEP / rate. Null when there is no data
   *  amount or no price (unlimited bundles). Bigger is better; the order is exactly the
   *  price-per-GB order reversed. */
  const valueMb = (b: Pick<Bundle, "price" | "mb" | "kind">): number | null =>
    (hasVolume(b) && typeof b.price === "number" && b.price > 0 ? (b.mb * VALUE_STEP) / b.price : null);
  /** "6.58 GB" (fmtValue, at the network's MB per GB), or null. */
  const valueText = (b: Pick<Bundle, "price" | "mb" | "kind" | "network">): string | null => {
    const v = valueMb(b);
    return v === null ? null : fmtValue(v, mbPerGb(b.network));
  };
  /** "6.58 GB per GH¢10", or null: the value yardstick, always shown UNDER the bundle's own
   *  price and data ("GH¢400 bundle → 263.38GB"), never as what GH¢10 buys: a GH¢400 bundle
   *  cannot be bought for GH¢10 (plain-language round, 22 Oct 2026). */
  const valuePer = (b: Pick<Bundle, "price" | "mb" | "kind" | "network">): string | null => {
    const t = valueText(b);
    return t ? `${t} per ${money(VALUE_STEP)}` : null;
  };
  /** "Value: 6.58 GB per GH¢10", or null. */
  const valueLine = (b: Pick<Bundle, "price" | "mb" | "kind" | "network">): string | null => {
    const t = valuePer(b);
    return t ? `Value: ${t}` : null;
  };

  /** The bundle's own price, leading its card or row: "GH¢400 bundle", or for a pay-any-amount
   *  row "Pay exactly GH¢399" / "Pay GH¢400 to GH¢999.99" (then "→ 263.38GB"). */
  const priceLead = (b: Bundle): string => (b.band && !b.band.exact ? `From ${money(b.band.from)}` : b.computed ? payText(b) : `${priceText(b)} bundle`);
  /** The data that leads a card: a pay-any-amount range shows what its lowest amount gives,
   *  "260.42 GB (more if you pay more)"; everything else its data as shown. */
  const leadData = (b: Bundle): string => (b.band && !b.band.exact ? `${data(b.mb * (b.band.from / b.band.to), b.network)} (more if you pay more)` : dataShown(b));
  /** "GH¢400 bundle → 263.38GB", or for a range "From GH¢400: 260.42 GB (more if you pay more)". */
  const leadText = (b: Bundle): string => (b.band && !b.band.exact ? `${priceLead(b)}: ${leadData(b)}` : `${priceLead(b)} → ${leadData(b)}`);
  /** A calm badge for a bundle another page of the network contradicts: "Expiry not clear –
   *  check with MTN", "Price not clear – check with Telecel", "Data amount not clear – …". */
  const disputeText = (b: Pick<Bundle, "network" | "otherSource">): string | null => {
    const c = b.otherSource?.contradicts;
    const what = c === "validity" ? "Expiry" : c === "price" ? "Price" : c === "volume" ? "Data amount" : null;
    return what ? `${what} not clear – check with ${doc.networks[b.network]?.name ?? b.network}` : null;
  };

  // ---- fixed bundles (mobile only)
  // Held changes (freshness audit M3): the bundle keeps its last checked figures and says so.
  const heldText = (f: HeldChange["field"]) => (f === "ussd" ? "code change being checked" : f === "unconfirmed" ? "change being checked" : "price change being checked");
  const heldBy = new Map<string, string>();
  for (const h of Array.isArray(doc.heldChanges) ? doc.heldChanges : []) {
    if (h && typeof h.item === "string" && h.item.includes("|") && !heldBy.has(h.item)) heldBy.set(h.item, heldText(h.field));
  }
  const bundles: Bundle[] = doc.bundles.filter((b) => (b.kind as string) !== "router").map((b0) => {
    const held = heldBy.get(`${b0.network}|${b0.name}`);
    const b = held ? { ...b0, held } : b0;
    return b.days === null && !neverExpires(b) && !expiryDisputed(b) && familySaysNoExpiry(doc.familyInfo?.[b.network]?.[b.family]) ? { ...b, noExpiry: true } : b;
  });

  /** Borrowed data (AT Data Kredit, MTN Xtrabyte): blocks in <network>Rates of kind
   *  "borrowed". Facts with a fee, never bundles: never compared or ranked. */
  function borrowed(network?: NetworkId): { network: NetworkId; key: string; title: string; block: BorrowedBlock }[] {
    const out: { network: NetworkId; key: string; title: string; block: BorrowedBlock }[] = [];
    for (const n of networks) {
      if (network && n !== network) continue;
      const blk = obj(doc[`${n}Rates`]);
      if (!blk) continue;
      for (const [key, v] of Object.entries(blk)) {
        const b = obj(v);
        if (!b || b.kind !== "borrowed") continue;
        const title = str(b.family) ?? (key === "dataKredit" ? "Data Kredit" : key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase()));
        out.push({ network: n, key, title, block: b as BorrowedBlock });
      }
    }
    return out;
  }
  const borrowedFamilies = new Set(borrowed().map((x) => `${x.network}|${x.title}`));
  const broadbandFamilies = new Set(doc.bundles.filter((b) => (b.kind as string) === "router").map((b) => `${b.network}|${b.family}`));

  // ---- any-amount rate tables
  const sources: RateSource[] = [];
  // MTN regular data's dial code, only when the data states it as a code ("*138# then 1, then 1").
  const regularUssd = (() => { const u = str(obj(doc.mtnRates?.regularBuy)?.ussd); return u && /^\*[\d*]+#/.test(u) ? u : undefined; })();
  if (rates && hasNet("mtn")) {
    const src = doc.networks.mtn?.source ?? "";
    const label = "Computed from MTN's published rate";
    if (Array.isArray(rates.regular) && rates.regular.length) sources.push({
      id: "mtn-regular", network: "mtn", family: "Regular data (any amount)", label: "MTN data", kind: "noexpiry",
      table: rates.regular, computedLabel: label, source: src, validity: () => "No expiry", days: () => null,
      // MTN's help centre (and the *138# menu, 26 Oct 2026): dial *138#, then 1, then 1; the
      // myMTN app section stays as the other way to buy (More info).
      ...(regularUssd ? { ussd: regularUssd } : {}),
      ...(appRoute("regular") ? { buy: regularUssd ? `Or ${appRoute("regular")!.replace(/^In the/, "in the")}` : appRoute("regular") } : {}),
    });
    // Midnight: MTN's help centre says it does not expire, MTN's Kokrokoo terms treat it
    // like Kokrokoo ("Any unused data is lost after 8am"). With that dispute in the data
    // (mtnRates.midnightOtherSource, contradicts "validity") it is never "no expiry".
    const mos = obj(rates.midnightOtherSource) as Bundle["otherSource"] | undefined;
    const midDisputed = !!mos && expiryDisputed({ otherSource: mos });
    if (Array.isArray(rates.midnight) && rates.midnight.length) sources.push({
      id: "mtn-midnight", network: "mtn", family: "Midnight", label: "MTN Midnight", kind: "night",
      table: rates.midnight, computedLabel: label, source: rates.midnightSource ?? src,
      validity: () => (midDisputed ? `${rates.midnightWindow ?? "Midnight hours"} daily` : `${rates.midnightWindow ?? "Midnight hours"} only, no expiry`),
      days: () => null, ...(mos ? { otherSource: mos } : {}),
      ...(appRoute("midnight") ? { buy: appRoute("midnight") } : {}),
    });
    // Pulse: any-amount data with no expiry (MTN's Pulse terms and help centre). MTN aims
    // it at young customers but no MTN source restricts who may buy it, so it is ranked.
    // A band the data marks unconfirmed (GH¢5–9.99: its data rate is the voice rate
    // printed above it) is never worked out.
    // Where to buy it: MTN's own codes as the data gives them (mtnRates.pulse.ussd). An older
    // MTN page with other volumes (mtnRates.pulse.otherSource) is shown beside the figures.
    const pv = str(rates.pulse?.validity);
    const pu = str(rates.pulse?.ussd);
    const pos = obj(rates.pulse?.otherSource) as Bundle["otherSource"] | undefined;
    if (rates.pulse && Array.isArray(rates.pulse.data) && pricedBands(rates.pulse.data).length) sources.push({
      id: "mtn-pulse", network: "mtn", family: "Pulse", label: "MTN Pulse",
      kind: pv && neverExpires({ kind: "anytime", validity: pv }) ? "noexpiry" : "anytime",
      table: rates.pulse.data, computedLabel: label, source: src,
      validity: () => pv ?? "Not stated by MTN", days: () => null, ...(str(rates.pulse.note) ? { note: rates.pulse.note } : {}),
      ...(pu ? { buy: `${dialText(pu.replace(/[.\s]+$/, ""))}.` } : {}),
      ...(pos && str(pos.summary) ? { otherSource: pos } : {}),
    });
  }
  const flexi = hasNet("telecel") ? readFlexi(doc.telecelRates) : null;
  if (flexi) {
    const src = str(flexi.raw.source) ?? doc.networks.telecel?.source ?? "";
    const label = "Computed from Telecel's published rate";
    // Where to buy Flexi, from Telecel's terms (telecelRates.flexi.buyVia).
    const via = Array.isArray(flexi.raw.buyVia) ? (flexi.raw.buyVia as unknown[]).filter((x): x is string => !!str(x)) : [];
    const viaCodes = via.filter((x) => /^\*[\d*]+#$/.test(x.trim())), viaOther = via.filter((x) => !/^\*[\d*]+#$/.test(x.trim()));
    const buy = via.length
      ? `${[viaCodes.length ? `Dial ${orList(viaCodes)}` : "", viaOther.length ? `${viaCodes.length ? "or use" : "Use"} the ${viaOther.join(" or the ")}` : ""].filter(Boolean).join(", ")} (Telecel's data terms).`
      : undefined;
    if (pricedBands(flexi.noExpiry).length) sources.push({
      id: "telecel-flexi-noexpiry", network: "telecel", family: flexi.family, label: "Telecel Flexi, no expiry", kind: "noexpiry",
      table: flexi.noExpiry, computedLabel: label, source: src, validity: () => "No expiry", days: () => null, ...(buy ? { buy } : {}),
    });
    if (pricedBands(flexi.expiry).length) sources.push({
      id: "telecel-flexi-expiry", network: "telecel", family: flexi.family, label: "Telecel Flexi, with expiry", kind: "anytime",
      table: flexi.expiry, computedLabel: label, source: src,
      validity: (b) => (b.days ? `${b.days} day${b.days === 1 ? "" : "s"}` : "Expiry not stated"), days: (b) => b.days ?? null, ...(buy ? { buy } : {}),
    });
  }
  const sourceById = (id: string) => sources.find((s) => s.id === id) ?? null;

  /** A synthetic bundle for spending `amount` under a rate source. */
  function sourceBundle(s: RateSource, amount: number, ok: BandTest = anyBand): Bundle | null {
    const band = bandFor(amount, s.table);
    if (!band || !ok(band)) return null;
    const amt = roundCents(amount);
    return {
      network: s.network, family: s.family, name: `${s.label}, ${money(amt)}`,
      price: amt, mb: amt / band.ghsPerMb, validity: s.validity(band), days: s.days(band), kind: s.kind, ussd: s.ussd ?? null,
      source: s.source, computed: true, computedLabel: s.computedLabel, rateLabel: s.label,
      ...(s.otherSource ? { otherSource: s.otherSource } : {}), ...(s.note ? { note: s.note } : {}), ...(s.buy ? { channel: s.buy } : {}),
    };
  }
  /** What a rate source's data is, for the "never expires" tests (validity plus any dispute). */
  const probeOf = (s: RateSource, band: RateBand) => ({ kind: s.kind, validity: s.validity(band), otherSource: s.otherSource });
  /** One bundle per run of rate bands, standing for the whole spend range
   *  (for rankings). Neighbouring bands with the same rate and validity are
   *  one row (Telecel Flexi GH¢400–599.99, 600–799.99 and 800–999.99 at the
   *  same rate are "GH¢400 to GH¢999.99"). */
  function bandBundles(s: RateSource): Bundle[] {
    const [, tableTop] = tableRange(s.table);
    // Priced ranges, with any range the data marks as not published cut out
    // (MTN GH¢200–299.99 with 299.01–299.99 unpublished becomes 200–299).
    // An exact-amount special inside a band (MTN GH¢10 inside "above GH¢5 to GH¢99.90") has
    // its own rate, so it is cut out too: no row's range includes an amount at another rate.
    const gaps = [
      ...s.table.filter((b) => b.exactly === undefined && isUnpublishedBand(b)).map((b) => ({ lo: roundCents(bandLow(b)), hi: roundCents(bandHigh(b)) })),
      ...pricedBands(s.table).filter((b) => b.exactly !== undefined).map((b) => ({ lo: b.exactly!, hi: b.exactly! })),
    ];
    const ranges: { band: RateBand; lo: number; hi: number }[] = [];
    for (const b of pricedBands(s.table).filter((x) => x.exactly === undefined)) {
      let pieces = [{ lo: roundCents(bandLow(b)), hi: roundCents(bandHigh(b)) }];
      for (const g of gaps) pieces = pieces.flatMap((p) => {
        if (g.hi < p.lo - 1e-9 || g.lo > p.hi + 1e-9) return [p];
        const out: { lo: number; hi: number }[] = [];
        if (g.lo > p.lo + 1e-9) out.push({ lo: p.lo, hi: roundCents(g.lo - 0.01) });
        if (g.hi < p.hi - 1e-9) out.push({ lo: roundCents(g.hi + 0.01), hi: p.hi });
        return out;
      });
      for (const p of pieces) if (p.hi >= p.lo - 1e-9) ranges.push({ band: b, ...p });
    }
    ranges.sort((a, b) => a.lo - b.lo);
    const runs: { band: RateBand; lo: number; hi: number }[] = [];
    for (const r of ranges) {
      const last = runs[runs.length - 1];
      const exactBetween = s.table.some((x) => x.exactly !== undefined && last && x.exactly > last.hi - 1e-9 && x.exactly < r.lo + 1e-9);
      if (last && !exactBetween && Math.abs(r.lo - roundCents(last.hi + 0.01)) < 1e-9 && r.band.ghsPerMb === last.band.ghsPerMb && s.days(r.band) === s.days(last.band)) last.hi = r.hi;
      else runs.push({ ...r });
    }
    const out: Bundle[] = [];
    for (const run of runs) {
      const b = sourceBundle(s, run.hi);
      if (!b || bandFor(run.hi, s.table)?.ghsPerMb !== run.band.ghsPerMb) continue;
      const range: SpendRange = { from: run.lo, to: run.hi, exact: false, top: run.hi >= tableTop - 1e-9 };
      out.push({ ...b, name: `${s.label}, ${money(range.from)}–${money(range.to)}`, band: range });
    }
    for (const band of s.table) {
      if (band.exactly === undefined) continue;
      const b = sourceBundle(s, band.exactly);
      if (!b) continue;
      const range: SpendRange = { from: band.exactly, to: band.exactly, exact: true, top: band.exactly >= tableTop - 1e-9 };
      out.push({ ...b, name: `${s.label}, exactly ${money(band.exactly)}`, band: range });
    }
    return out;
  }

  const regular = sourceById("mtn-regular");
  const midnight = sourceById("mtn-midnight");
  const regularMb = (amount: number) => (regular ? mbFromTable(amount, regular.table) : 0);
  const midnightMb = (amount: number) => (midnight ? mbFromTable(amount, midnight.table) : 0);
  const pulseMb = (amount: number) => (rates?.pulse?.data ? mbFromTable(amount, rates.pulse.data) : 0);
  const flexiNoExpiry = sourceById("telecel-flexi-noexpiry");
  const flexiExpiry = sourceById("telecel-flexi-expiry");
  /** Telecel Flexi for an exact spend: MB and validity per option (null if not sold). */
  function flexiQuote(amount: number) {
    const ne = flexiNoExpiry ? bandFor(amount, flexiNoExpiry.table) : null;
    const ex = flexiExpiry ? bandFor(amount, flexiExpiry.table) : null;
    return {
      noExpiry: ne ? { mb: amount / ne.ghsPerMb, ghsPerMb: ne.ghsPerMb } : null,
      expiry: ex ? { mb: amount / ex.ghsPerMb, ghsPerMb: ex.ghsPerMb, days: ex.days ?? null } : null,
    };
  }
  /** MB from MTN social-media or video data for an exact spend. */
  const flatMb = (amount: number, which: "social" | "video") => {
    if (!rates || !Array.isArray(rates.socialRange)) return 0;
    const [lo, hi] = rates.socialRange;
    if (amount < lo - 1e-9 || amount > hi + 1e-9) return 0;
    return amount / rates[which];
  };
  const regularBundle = (amount: number) => (regular ? sourceBundle(regular, amount) : null);
  const midnightBundle = (amount: number) => (midnight ? sourceBundle(midnight, amount) : null);

  /** Round MTN spends for the calculator's quick examples. */
  const computedRegular: Bundle[] = regular
    ? [...new Set([1, 2, 5, 20, 30, 50, 100, 150, 200, 300, 350, ...regular.table.flatMap((b) => (b.exactly !== undefined ? [b.exactly] : []))])]
      .sort((a, b) => a - b).map(regularBundle).filter(Boolean) as Bundle[]
    : [];
  /** Every rate band of every any-amount table, one row each. */
  const computed: Bundle[] = sources.flatMap(bandBundles);
  const computedMidnight = computed.filter((b) => b.network === "mtn" && b.kind === "night");

  /** Everything the comparison can rank (pending/conditional filtered by the groups). */
  const all: Bundle[] = [...bundles, ...computed];

  // ---- budget finder

  /** The single purchase giving the most data for a budget on one network.
   *  All-day by default; night-only with `nightOnly` (never mixed). Bundles
   *  whose figures are disputed are never picked. */
  function bestForBudget(network: NetworkId, budget: number, o: BudgetOptions = {}): Bundle | null {
    if (!(budget > 0)) return null;
    const kindOk = (b: Bundle) => (o.nightOnly ? b.kind === "night" && isRankable(b) : isAllDay(b));
    let pool = bundles.filter((b) => b.network === network && b.price <= budget + 1e-9 && kindOk(b) && canWin(b));
    for (const s of sources) {
      if (s.network !== network) continue;
      if (o.nightOnly ? s.kind !== "night" : s.kind === "night") continue;
      const ok: BandTest = (band) => {
        const probe = probeOf(s, band);
        if (o.noExpiryOnly && !neverExpires(probe)) return false;
        if (o.minDays && !neverExpires(probe) && !((s.days(band) ?? 0) >= o.minDays)) return false;
        return true;
      };
      const r = bestSpendWithin(s.table, budget, ok);
      if (r) { const b = sourceBundle(s, r.amount); if (b) pool.push(b); }
    }
    if (o.noExpiryOnly) pool = pool.filter(neverExpires);
    if (o.minDays) pool = pool.filter((b) => lastsAtLeast(b, o.minDays!));
    if (!pool.length) return null;
    return pool.reduce((a, b) => (b.mb > a.mb + 1e-9 || (Math.abs(b.mb - a.mb) < 1e-9 && b.price < a.price) ? b : a));
  }

  /** A rate band is allowed under the finder's options (never expires only; lasts at least N days). */
  const optBandOk = (s: RateSource, o: BudgetOptions): BandTest => (band) => {
    const probe = probeOf(s, band);
    if (o.noExpiryOnly && !neverExpires(probe)) return false;
    if (o.minDays && !neverExpires(probe) && !((s.days(band) ?? 0) >= o.minDays)) return false;
    return true;
  };
  /** Rounder amounts at equal-or-more data: each any-amount part with pesewas (GH¢9.99) is
   *  tried at the whole and half cedi either side; a change is kept only when the plan still
   *  fits the budget and its data is at least the same (or SHOWS the same, fmtData). */
  function roundPlan(p: UsagePlan, budget: number, o: BudgetOptions): UsagePlan {
    const cap = Math.floor(budget * 100 + 1e-6);
    const shown = data(p.mb, p.network);
    const parts: Bundle[] = p.items.flatMap((x) => Array.from({ length: x.count }, () => x.bundle));
    for (let i = 0; i < parts.length; i++) {
      const b = parts[i];
      if (!b.computed || toP(b.price) % 100 === 0) continue;
      const s = sources.find((x) => x.network === p.network && x.label === b.rateLabel);
      if (!s) continue;
      const ok = optBandOk(s, o);
      const restP = parts.reduce((t, x, j) => (j === i ? t : t + toP(x.price)), 0);
      const restMb = parts.reduce((t, x, j) => (j === i ? t : t + x.mb), 0);
      let best: Bundle | null = null;
      for (const a of [Math.floor(b.price), Math.ceil(b.price), Math.floor(b.price * 2) / 2, Math.ceil(b.price * 2) / 2]) {
        if (!(a > 0) || toP(a) + restP > cap || toP(a) === toP(b.price)) continue;
        const nb = sourceBundle(s, a, ok);
        if (!nb) continue;
        const tot = restMb + nb.mb;
        if (!(tot + 1e-9 >= p.mb || data(tot, p.network) === shown)) continue;
        if (!best || toP(nb.price) % 100 < toP(best.price) % 100 || (toP(nb.price) % 100 === toP(best.price) % 100 && nb.mb > best.mb)) best = nb;
      }
      if (best) parts[i] = best;
    }
    const groups = new Map<string, PlanItem>();
    for (const b of parts) {
      const k = b.computed ? `r|${b.rateLabel}|${toP(b.price)}` : `f|${bundles.indexOf(b)}|${b.name}`;
      const g = groups.get(k);
      if (g) g.count++; else groups.set(k, { bundle: b, count: 1 });
    }
    const items = [...groups.values()].sort((x, y) => y.bundle.price - x.bundle.price);
    return { ...p, items, total: items.reduce((t, x) => t + x.count * toP(x.bundle.price), 0) / 100,
      mb: items.reduce((t, x) => t + x.count * x.bundle.mb, 0), purchases: items.reduce((t, x) => t + x.count, 0) };
  }
  /** The finder's combo: the most all-day data `budget` buys on one network with up to
   *  `maxBuys` purchases (fixed bundles and any-amount spends, mixed or repeated), exact at
   *  pesewa resolution with the planner's optimiser (prepareFrom/build/top-up), under the
   *  same options as bestForBudget (never-expires only, lasts at least N days; never night).
   *  Null when nothing fits. Among equal data, the cheaper mix wins. */
  function bestComboForBudget(network: NetworkId, budget: number, o: BudgetOptions = {}, maxBuys = COMBO_MAX_BUYS): UsagePlan | null {
    if (!(budget > 0) || o.nightOnly) return null;
    const K = Math.max(1, Math.min(COMBO_MAX_BUYS, Math.floor(maxBuys)));
    const C = Math.floor(budget * 100 + 1e-6);
    const optKey = `${o.noExpiryOnly ? "ne" : ""}|${o.minDays ?? 0}`;
    const fixed = bundles.filter((b) => b.network === network && isAllDay(b) && canWin(b) && (!o.noExpiryOnly || neverExpires(b)) && (!o.minDays || lastsAtLeast(b, o.minDays)));
    const tables = sources.filter((s) => s.network === network && s.kind !== "night").map((s) => ({ s, ok: optBandOk(s, o) })).filter(({ s, ok }) => s.table.some(ok));
    const prep = prepareFrom(`combo|${network}|${optKey}`, fixed, tables, COMBO_MAX_BUYS);
    if (!prep) return null;
    if (prep.C < C) build(prep, Math.max(C, Math.min(2 * Math.max(prep.C, 0), C * 2)));
    // (a) at most K candidate purchases; (b) at most K-1 plus one any-amount top-up of any pesewa amount.
    const bK = prep.best[K];
    let bestMb = bK[C], baseC = C, k = K, topP = -1;
    // Cheapest budget reaching that much with K candidates.
    { let lo = 0, hi = C; while (lo < hi) { const mid = (lo + hi) >> 1; if (bK[mid] + 1e-9 >= bestMb) hi = mid; else lo = mid + 1; } baseC = lo; }
    let bestCost = baseC;
    if (prep.topSources.length) {
      const bK1 = prep.best[K - 1];
      const tMax = prep.topMb.length - 1;
      for (const c of jumpsOf(prep, K - 1)) {
        if (c > C) break;
        const p = Math.min(C - c, tMax);
        const mb = bK1[c] + (p > 0 ? prep.topMb[p] : 0);
        if (p <= 0 || prep.topMb[p] <= 0) continue;
        // The cheapest spend that still gives that top-up amount.
        const pp = topUpP(prep, prep.topMb[p]);
        if (mb > bestMb + 1e-9 || (Math.abs(mb - bestMb) < 1e-9 && c + pp < bestCost)) { bestMb = mb; baseC = c; k = K - 1; topP = pp; bestCost = c + pp; }
      }
    }
    if (!(bestMb > 0)) return null;
    const counts = new Map<number, number>();
    let c = baseC;
    for (let layer = k; layer >= 1; layer--) {
      const i = prep.choice[layer - 1][c];
      if (i >= 0) { counts.set(i, (counts.get(i) ?? 0) + 1); c -= prep.priceP[i]; }
    }
    const items: PlanItem[] = [...counts].map(([i, count]) => ({ bundle: prep.items[i], count }));
    if (topP > 0) {
      const { s, ok } = prep.topSources[prep.topTab[topP]];
      const t = sourceBundle(s, topP / 100, ok);
      if (t) {
        const same = items.find((x) => x.bundle.computed && x.bundle.family === t.family && x.bundle.validity === t.validity && toP(x.bundle.price) === topP);
        if (same) same.count++; else items.push({ bundle: t, count: 1 });
      }
    }
    items.sort((x, y) => y.bundle.price - x.bundle.price);
    const total = items.reduce((s2, x) => s2 + x.count * toP(x.bundle.price), 0) / 100;
    const purchases = items.reduce((s2, x) => s2 + x.count, 0);
    return { network, items, total, mb: items.reduce((s2, x) => s2 + x.count * x.bundle.mb, 0), purchases, maxPurchases: K };
  }
  /** The combo worth showing next to the single best buy: only when it is more than one
   *  purchase and its data SHOWS more than the single buy's (fmtData). */
  function comboForBudget(network: NetworkId, budget: number, o: BudgetOptions = {}): UsagePlan | null {
    const single = bestForBudget(network, budget, o);
    // A combo may only use bundles that last at least as long as the single best buy (a
    // never-expiring buy is only beaten by never-expiring data), so "more data" never means
    // data that runs out sooner.
    const keep: BudgetOptions = !single ? o
      : neverExpires(single) ? { ...o, noExpiryOnly: true }
      : single.days ? { ...o, minDays: Math.max(o.minDays ?? 0, single.days) } : o;
    const full = bestComboForBudget(network, budget, keep);
    if (!full) return null;
    // Fewer buys win when their data shows the same (3.05 GB in 2 buys beats 3.05 GB in 3).
    let fewest = full;
    for (let k = 1; k < full.purchases; k++) {
      const r = bestComboForBudget(network, budget, keep, k);
      if (r && data(r.mb, network) === data(full.mb, network)) { fewest = r; break; }
    }
    const combo = roundPlan(fewest, budget, keep);
    if (combo.purchases < 2) return null;
    if (single && !(combo.mb > single.mb + 1e-9 && data(combo.mb, network) !== data(single.mb, network))) return null;
    // Worth a line only when it really adds data (COMBO_MIN_GAIN more), or when the single buy
    // leaves a real part of the money unspent (the amount is above the biggest single buy).
    if (single && combo.mb < single.mb * (1 + COMBO_MIN_GAIN) - 1e-9 && budget - single.price < budget * COMBO_MIN_GAIN - 1e-9) return null;
    return combo;
  }
  /** The planner's one-line upsell: another network whose plan gives MORE data than the
   *  cheapest plan for a little more money (at most UPSELL_MAX_EXTRA, 25%, more), the one with
   *  the most extra data per extra cedi: "AT: +2.80 GB for GH¢17.08 more". Null if none. */
  function planUpsell(plans: { n: NetworkId; p: UsagePlan | null }[]): { n: NetworkId; extraMb: number; extraMoney: number; text: string } | null {
    const have = plans.filter((x): x is { n: NetworkId; p: UsagePlan } => !!x.p);
    if (have.length < 2) return null;
    const cheap = have.reduce((a, x) => (x.p.total < a.p.total ? x : a));
    let best: { n: NetworkId; extraMb: number; extraMoney: number; rate: number } | null = null;
    for (const x of have) {
      if (x === cheap) continue;
      const extraMoney = Math.round((x.p.total - cheap.p.total) * 100) / 100;
      const extraMb = x.p.mb - cheap.p.mb;
      if (!(extraMoney >= 0.01) || extraMoney > cheap.p.total * UPSELL_MAX_EXTRA + 1e-9 || !(extraMb > 0)) continue;
      if (data(x.p.mb, x.n) === data(cheap.p.mb, cheap.n)) continue;
      const rate = extraMb / extraMoney;
      if (!best || rate > best.rate + 1e-12) best = { n: x.n, extraMb, extraMoney, rate };
    }
    if (!best) return null;
    return { n: best.n, extraMb: best.extraMb, extraMoney: best.extraMoney,
      // Plain words (owner, 22 Oct 2026): "With AT, pay GH¢17.08 more and get 2.80 GB extra."
      text: `With ${doc.networks[best.n]?.name ?? best.n}, pay ${money(best.extraMoney)} more and get ${data(best.extraMb, best.n)} extra.` };
  }
  /** A mix as one row for the finder's comparisons: its total data (shown with fmtData), its
   *  total price, and the shortest life of its parts. */
  function comboAsBundle(p: UsagePlan): Bundle {
    const parts = p.items.map((i) => i.bundle);
    const shortest = parts.reduce((a, b) => (neverExpires(a) ? b : neverExpires(b) ? a : (b.days ?? Infinity) < (a.days ?? Infinity) ? b : a));
    return { ...shortest, name: comboText(p), price: p.total, mb: p.mb, label: data(p.mb, p.network), ussd: null, band: undefined, computed: parts.some((b) => b.computed) } as Bundle;
  }
  /** The finder's answer for one network: the better of the single best buy and the mix
   *  (comboForBudget: shown only when it clearly beats the single). `b` is what the card's
   *  headline, the value meter, "Most data" and the share text all use. */
  function finderPick(n: NetworkId, budget: number, o: BudgetOptions = {}): FinderPick {
    const single = bestForBudget(n, budget, o);
    const combo = o.nightOnly ? null : comboForBudget(n, budget, o);
    const mix = combo && (!single || combo.mb > single.mb + 1e-9) ? combo : null;
    return { n, single, combo: mix, b: mix ? comboAsBundle(mix) : single };
  }
  const finderPicks = (budget: number, o: BudgetOptions = {}) => networks.map((n) => finderPick(n, budget, o));
  /** "if you buy 2 times" for a mix headline (plain words; it was "in 2 buys"). */
  const buysText = (p: UsagePlan) => `if you buy ${p.purchases} times`;
  /** What to buy for each part of a mix, by name and price, with its own how-to-buy line:
   *  "2.56GB Weekly (GH¢20)", "Flexi: type GH¢9.99", "MTN data: pay GH¢5". */
  function mixParts(p: UsagePlan): { count: number; bundle: Bundle; text: string; buy: string | null }[] {
    return p.items.map(({ bundle: b, count }) => ({
      count, bundle: b, buy: buyShort(b),
      text: b.computed
        ? (/flexi/i.test(`${b.rateLabel ?? ""} ${b.family}`) ? `Flexi: type ${money(b.price)}` : `${nameNoPrice(b)}: pay ${money(b.price)}`)
        : `${nameNoPrice(b)} (${money(b.price)})`,
    }));
  }
  /** The finder's share text, from the same picks the page shows (single or mix, whichever
   *  gives more): "With GH¢20: 2.56GB on Telecel today – see all networks:", or with a mix
   *  "With GH¢20: 3.05 GB on Telecel today (in 2 buys) – …". Null when nothing fits. */
  function finderShareText(budget: number, o: BudgetOptions = {}, only?: NetworkId): string | null {
    // One network's page: "With GH¢20 on MTN: 1.84 GB today (in 3 buys) – see all MTN bundles:".
    if (only) {
      const p = finderPick(only, budget, o);
      if (!p.b) return null;
      const nm = doc.networks[only]?.name ?? only;
      return `With ${money(budget)} on ${nm}: ${dataShown(p.b)} today${p.combo ? ` (${buysText(p.combo)})` : ""} – see all ${nm} bundles:`;
    }
    const picks = finderPicks(budget, o);
    const lead = [...mostData(picks)];
    if (!lead.length) return null;
    const top = picks.find((p) => p.n === lead[0])!;
    const names = lead.map((n) => doc.networks[n]?.name ?? n);
    const who = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
    return `With ${money(budget)}: ${dataShown(top.b!)} on ${who} today${top.combo ? ` (${buysText(top.combo)})` : ""} – see all networks:`;
  }
  /** The questions people ask, answered ONLY from what the operators' own pages say (the
   *  fields of the dataset, each with the page it came from). A network with no official
   *  source for an answer is simply left out of it (never guessed, never "they don't say").
   *  A question with no sourced answer at all is left out. Plain words; figures from the data. */
  function faqItems(): FaqItem[] {
    const out: FaqItem[] = [];
    const nm = (n: NetworkId) => doc.networks[n]?.name ?? n;
    const firstSource = (n: NetworkId, test: (b: Bundle) => boolean) => bundles.find((b) => b.network === n && test(b) && /^https:\/\//.test(b.source ?? ""))?.source;
    const add = (question: string, lines: FaqLine[]) => {
      if (!lines.length) return;
      out.push({ question, lines: networks.flatMap((n) => lines.filter((l) => l.network === n)) });
    };
    const tr = obj(doc.telecelRates);
    const rules = obj(tr?.rules);

    // 1. Checking the balance.
    {
      const lines: FaqLine[] = [];
      if (rates && str(rates.balanceCheck)) lines.push({ network: "mtn", text: str(rates.balanceCheck)!, source: str(rates.balanceSource) });
      // Telecel's data terms: "*124#: this shows primary balance together with bundle allocations.
      // *126#: this only shows the balance on bundle allocations." (telecelRates.balanceCheck)
      const tb = obj(tr?.balanceCheck);
      const codes = Array.isArray(tb?.codes) ? (tb!.codes as unknown[]).filter((c): c is string => typeof c === "string" && /^\*[\d*]+#$/.test(c)) : [];
      const shows = Array.isArray(tb?.shows) ? (tb!.shows as unknown[]).map((x) => String(x)) : [];
      if (codes.length && codes.length === shows.length && str(tb?.says) && codes.every((c) => str(tb?.says)!.includes(c))) {
        const plain = (s: string) => /primary balance together with bundle/i.test(s) ? "airtime and bundles" : /only shows the balance on bundle/i.test(s) ? "bundles only" : s;
        lines.push({ network: "telecel", text: `Dial ${codes.map((c, i) => `${c} (${plain(shows[i])})`).join(" or ")}.`, source: str(tb?.source) ?? str(tr?.source) });
      }
      for (const n of networks.filter((x) => x !== "mtn" && x !== "telecel")) {
        const b = bundles.find((x) => x.network === n && /Balance: ([^.]+)\./.test(x.note ?? ""));
        if (b) {
          const how = b.note!.match(/Balance: ([^.]+)\./)![1].trim();
          // "*504# or the AT Mobile App" -> "Dial *504# or use the AT Mobile App."
          lines.push({ network: n, text: `${how.replace(/^(\*[\d*]+#) or the /, "Dial $1 or use the ")}.`, source: b.source });
        }
      }
      add("How do I check how much data I have left?", lines);
    }
    // 2. Renewing by itself.
    {
      const lines: FaqLine[] = [];
      const ar = rates ? obj((rates as unknown as Record<string, unknown>).autoRenew) : undefined;
      const says = str(ar?.says);
      if (says) {
        const code = says.match(/send STOP to the short code (\d+)/i)?.[1];
        lines.push({ network: "mtn", text: code ? `To stop a bundle renewing, text STOP to ${code}.${/no charges/i.test(says) ? " MTN says this is free." : ""}` : `MTN: “${says}”`, source: str(ar?.url) });
      }
      if (rules && str(rules.expiryAutoRenew)) {
        const g = obj(rules.graceDays);
        const grace = g && num(g.daily) && num(g.weekly) && num(g.monthly) ? ` If your airtime is short, you get ${g.daily}, ${g.weekly} or ${g.monthly} extra days to top up (daily, weekly, monthly bundles).` : "";
        const choose = str(rules.autoRenewChoice) ? " You choose whether a bundle renews." : "";
        const flexi = obj(tr?.flexi)?.autoRenews === false ? " Flexi (any amount) bundles never renew." : "";
        lines.push({ network: "telecel", text: `Bundles with an end date renew when they end, if you have enough airtime.${grace}${choose}${flexi}`, source: str(tr?.source) });
      }
      add("Will my bundle renew by itself?", lines);
    }
    // 3. Leftover data.
    {
      const lines: FaqLine[] = [];
      for (const n of networks) {
        const parts: string[] = [];
        let src: string | undefined;
        for (const [fam, info] of Object.entries(doc.familyInfo?.[n] ?? {})) {
          const s = info.split(/(?<=[.!?])\s+/).find((x) => /leftover data rolls over/i.test(x));
          if (s) { parts.push(`${fam}: ${s}`); src ??= firstSource(n, (b) => b.family === fam); }
        }
        if (n === "telecel" && rules && /roll over when same bundle is purchased before expiry/i.test(str(rules.expiryRollover) ?? "")) {
          parts.push("Buy the same bundle again before it ends and your leftover data carries over.");
          src ??= str(tr?.source);
        }
        if (n === "mtn" && rates && /until you use it/i.test(str(rates.validityNote) ?? "")) {
          parts.push("Regular (buy any amount) data never expires, so nothing is lost.");
        }
        if (parts.length) lines.push({ network: n, text: parts.join(" "), source: src ?? (n === "mtn" ? str(rates?.validitySource) : undefined) });
      }
      add("Does leftover data carry over?", lines);
    }
    // 4. Paying with mobile money: walletPayments (quoted from the operator's page, with a
    //    plain-words line), else the network's own fact sentence that names its wallet.
    {
      const lines: FaqLine[] = [];
      const wp = obj((doc as unknown as Record<string, unknown>).walletPayments);
      for (const n of networks) {
        const w = obj(wp?.[n]);
        if (w && str(w.text) && str(w.says) && /^https:\/\//.test(str(w.url) ?? "")) { lines.push({ network: n, text: str(w.text)!, source: str(w.url) }); continue; }
        const s = (doc.networkFacts?.[n] ?? "").split(/(?<=[.!?])\s+/).find((x) => /\b(AT Money|MoMo|Mobile Money|Telecel Cash)\b/i.test(x));
        if (s) lines.push({ network: n, text: s, source: doc.networks[n]?.source });
      }
      add("Can I pay with mobile money?", lines);
    }
    // 5. When the data runs out.
    {
      const lines: FaqLine[] = [];
      for (const n of networks) {
        const o = outOfBundle(n);
        if (!o) continue;
        const cost = `${fmtRate(o.perMb, currency)} per MB (${money(o.perMb * mbPerGb(n))} per GB)`;
        // Where the network's own note says browsing is blocked until you allow pay-as-you-go, say that.
        const blocked = o.note && /blocked|stops/i.test(o.note);
        lines.push({ network: n, text: blocked ? `${o.note}${/per MB/i.test(o.note!) ? ` That is ${money(o.perMb * mbPerGb(n))} per GB.` : ` That costs ${cost}.`}` : `Without a bundle you pay ${cost}. Buy a bundle first.`, source: o.source ?? doc.networks[n]?.source });
      }
      add("What happens when my bundle runs out?", lines);
    }
    return out;
  }
  /** The plain-text answer (for FAQPage structured data): the same lines the page shows. */
  const faqAnswer = (f: FaqItem) => f.lines.map((l) => `${doc.networks[l.network]?.name ?? l.network}: ${l.text}`).join(" ");

  /** The number 1 of each like-for-like group (ties included), for the ItemList structured
   *  data: exactly what the winners board shows first. */
  function topWinners(): { group: string; bundle: Bundle; text: string }[] {
    const out: { group: string; bundle: Bundle; text: string }[] = [];
    for (const g of GROUPS) {
      for (const r of leaderboardRows(g.id).ranked.filter((x) => x.rank === 1)) {
        const b = r.bundle;
        const net = doc.networks[b.network]?.name ?? b.network;
        const name = nameNoPrice(b);
        out.push({ group: g.label, bundle: b, text: dealLine(g.label, b, name, net) });
      }
    }
    return out;
  }
  /** A network page's top deals: in each winners group, the best-ranked entry of that network
   *  (for its ItemList), worded like topWinners. */
  /** A winners line for structured data, in the page's own words: "All-day data: Telecel 263.38GB
   *  Monthly – GH¢400 bundle → 263.38GB, value 6.58 GB per GH¢10" (price and data first, the value
   *  yardstick after it; never a price per GB, never "GH¢10 gets/buys"). */
  const dealLine = (label: string, b: Bundle, name: string, net: string) => {
    const v = valuePer(b);
    return `${label}: ${name.startsWith(net) ? name : `${net} ${name}`} – ${leadText(b)}${v ? `, value ${v}` : ""}`;
  };
  function networkTopDeals(network: NetworkId): { group: string; bundle: Bundle; text: string }[] {
    const out: { group: string; bundle: Bundle; text: string }[] = [];
    const net = doc.networks[network]?.name ?? network;
    for (const g of GROUPS) {
      const r = leaderboardRows(g.id).ranked.find((x) => x.bundle.network === network);
      if (!r) continue;
      const name = nameNoPrice(r.bundle);
      out.push({ group: g.label, bundle: r.bundle, text: dealLine(g.label, r.bundle, name, net) });
    }
    return out;
  }
  /** "2 × GH¢400 + 1 × GH¢200" (largest first). */
  const comboText = (p: UsagePlan) => p.items.map((i) => `${i.count} × ${money(i.bundle.price)}`).join(" + ");
  /** The smallest amount the finder can answer with these options: the cheapest all-day buy
   *  across networks (a fixed bundle's price, or the lowest spend a rate table sells). */
  function finderMinimum(o: BudgetOptions = {}, only?: NetworkId): number | null {
    const nets = only ? [only] : networks;
    const cands = new Set<number>();
    for (const b of bundles) if (b.price > 0 && nets.includes(b.network)) cands.add(b.price);
    for (const s of sources) if (nets.includes(s.network)) cands.add(tableRange(s.table)[0]);
    const sorted = [...cands].filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
    for (const a of sorted) if (nets.some((n) => bestForBudget(n, a, o))) return a;
    return null;
  }

  // ---- monthly planner

  /** Fixed bundles that keep working for at least 30 days. */
  const lastsAMonth = (b: Bundle) => isAllDay(b) && canWin(b) && !b.computed && lastsAtLeast(b, 30);
  /** Any-amount tables usable for a month (no expiry, or bands with 30+ days). */
  function monthlySources(network: NetworkId): { s: RateSource; ok: BandTest }[] {
    return sources.filter((s) => s.network === network && s.kind !== "night").map((s) => ({
      s, ok: (band: RateBand) => neverExpires(probeOf(s, band)) || (s.days(band) ?? 0) >= 30,
    })).filter(({ s, ok }) => s.table.some(ok));
  }

  // The planner works in whole pesewas. Per network it keeps:
  //  - the candidate purchases: fixed bundles lasting a month, and every
  //    corner spend of the month-long any-amount tables (an optimal mix needs
  //    at most ONE any-amount spend that is not a corner: moving money
  //    between two in-between spends never loses data, so one of them can
  //    always be pushed to a corner);
  //  - a dynamic programme: best[k][c] = most MB from at most k candidate
  //    purchases costing at most c pesewas (exact, no rounding), for every
  //    k up to MAX_PURCHASES;
  //  - for the one free top-up: the cheapest single any-amount spend (any
  //    pesewa amount) that buys at least x MB.
  // With a cap of K purchases the answer is the cheaper of "at most K
  // candidates" and "at most K-1 candidates plus one top-up", at pesewa
  // resolution.
  interface PlanPrep {
    items: Bundle[]; priceP: number[];
    topMb: Float64Array; topTab: Int8Array; topSources: { s: RateSource; ok: BandTest }[];
    maxMb: number; maxMbPriceP: number;
    /** best[k][c], k = 0..layers (MAX_PURCHASES for the planner, COMBO_MAX_BUYS for the finder). */
    C: number; best: Float64Array[]; choice: Int16Array[]; jumps: Map<number, Int32Array>; layers: number;
  }
  const prepCache = new Map<string, PlanPrep | null>();
  /** The planner's preparation for one network: fixed bundles that last a month, and month-long
   *  any-amount tables (see prepareFrom). */
  function prepare(network: NetworkId): PlanPrep | null {
    return prepareFrom(`month|${network}`, bundles.filter((b) => b.network === network && lastsAMonth(b)), monthlySources(network), MAX_PURCHASES);
  }
  /** The exact optimiser's preparation for a pool of fixed purchases and any-amount tables,
   *  shared by the monthly planner (cheapest way to N GB) and the finder's combos (most data
   *  for a budget). Cached by `key`. */
  function prepareFrom(key: string, fixed: Bundle[], tables: { s: RateSource; ok: BandTest }[], layers: number): PlanPrep | null {
    if (prepCache.has(key)) return prepCache.get(key)!;
    const network = key;
    let pool: Bundle[] = [...fixed];
    for (const { s, ok } of tables) for (const a of cornerAmounts(s.table)) { const b = sourceBundle(s, a, ok); if (b) pool.push(b); }
    // A purchase that costs at least as much yet buys no more is never needed.
    pool = pool.filter((b, i) => !pool.some((o, j) => j !== i && toP(o.price) <= toP(b.price) && o.mb >= b.mb - 1e-9 && (toP(o.price) < toP(b.price) || o.mb > b.mb + 1e-9 || j < i)));
    pool.sort((a, b) => a.price - b.price);
    // Running best single any-amount spend: topMb[p] = most MB for at most p pesewas.
    let maxP = 0;
    for (const { s } of tables) maxP = Math.max(maxP, toP(tableRange(s.table)[1]));
    const topMb = new Float64Array(maxP + 1), topTab = new Int8Array(maxP + 1).fill(-1);
    for (let p = 1; p <= maxP; p++) {
      topMb[p] = topMb[p - 1]; topTab[p] = topTab[p - 1];
      tables.forEach(({ s, ok }, t) => { const mb = mbFromTable(p / 100, s.table, ok); if (mb > topMb[p] + 1e-9) { topMb[p] = mb; topTab[p] = t; } });
    }
    if (!pool.length && !(maxP > 0 && topMb[maxP] > 0)) { prepCache.set(network, null); return null; }
    let maxMb = 0, maxMbPriceP = 0;
    for (const b of pool) if (b.mb > maxMb + 1e-9) { maxMb = b.mb; maxMbPriceP = toP(b.price); }
    const prep: PlanPrep = {
      items: pool, priceP: pool.map((b) => toP(b.price)), topMb, topTab, topSources: tables, maxMb, maxMbPriceP,
      C: -1, best: [], choice: [], jumps: new Map(), layers,
    };
    prepCache.set(network, prep);
    return prep;
  }
  function build(prep: PlanPrep, C: number) {
    const { items, priceP } = prep;
    let prev = new Float64Array(C + 1);
    const best: Float64Array[] = [prev];
    const choice: Int16Array[] = [];
    for (let k = 1; k <= prep.layers; k++) {
      const cur = Float64Array.from(prev);
      const ch = new Int16Array(C + 1).fill(-1);
      for (let i = 0; i < items.length; i++) {
        const p = priceP[i], mb = items[i].mb;
        for (let c = p; c <= C; c++) {
          const v = prev[c - p] + mb;
          if (v > cur[c] + 1e-9) { cur[c] = v; ch[c] = i; }
        }
      }
      choice.push(ch);
      best.push(cur);
      prev = cur;
    }
    prep.best = best;
    prep.choice = choice;
    prep.jumps = new Map();
    prep.C = C;
  }
  /** Budgets c at which best[k] goes up (the only ones worth topping up from). */
  function jumpsOf(prep: PlanPrep, k: number): Int32Array {
    const hit = prep.jumps.get(k);
    if (hit) return hit;
    const b = prep.best[k];
    const out: number[] = [0];
    for (let c = 1; c <= prep.C; c++) if (b[c] > b[c - 1] + 1e-9) out.push(c);
    const arr = Int32Array.from(out);
    prep.jumps.set(k, arr);
    return arr;
  }
  /** Smallest p with topMb[p] >= x, or -1. */
  function topUpP(prep: PlanPrep, x: number): number {
    const a = prep.topMb;
    if (!a.length || a[a.length - 1] + 1e-9 < x) return -1;
    let lo = 0, hi = a.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (a[mid] + 1e-9 >= x) hi = mid; else lo = mid + 1; }
    return lo;
  }

  const planCache = new Map<string, UsagePlan | null>();
  /** Cheapest way to have at least `needMb` of all-day data for a month on
   *  one network, using at most `maxPurchases` purchases (1 to
   *  MAX_PURCHASES, default DEFAULT_PURCHASES), all bought within the month:
   *  fixed bundles that last 30+ days or never expire, plus any-amount data
   *  (MTN regular data; Telecel Flexi's no-expiry option, or its expiry option
   *  where that lasts 30+ days). Exact at pesewa resolution (see `prepare`).
   *  Bundles that expire inside 30 days, pending, personalised, unconfirmed
   *  and disputed bundles are never used. Among equally cheap plans, fewer
   *  purchases is preferred where the search can tell. */
  function cheapestMonthlyPlan(network: NetworkId, needMb: number, maxPurchases: number = DEFAULT_PURCHASES): UsagePlan | null {
    if (!(needMb > 0)) return null;
    const K = Math.max(1, Math.min(MAX_PURCHASES, Math.floor(maxPurchases)));
    const key = `${network}|${needMb}|${K}`;
    if (planCache.has(key)) return planCache.get(key)!;
    const done = (p: UsagePlan | null) => { planCache.set(key, p); return p; };
    const prep = prepare(network);
    if (!prep) return done(null);

    // An upper bound: repeat the single purchase that buys the most data.
    const tP = prep.topMb.length - 1;
    const tMb = tP > 0 ? prep.topMb[tP] : 0;
    const singleMb = Math.max(prep.maxMb, tMb);
    if (K * singleMb + 1e-9 < needMb) return done(null);
    const copies = Math.ceil(needMb / singleMb - 1e-9);
    const ub = copies * (prep.maxMb >= tMb ? prep.maxMbPriceP : tP);
    if (prep.C < ub) build(prep, Math.max(ub, Math.min(2 * Math.max(prep.C, 0), ub * 2)));

    // (a) at most K candidate purchases.
    let bestTotal = Infinity, baseC = -1, k = K, topP = -1;
    const bK = prep.best[K];
    { let lo = 0, hi = Math.min(ub, prep.C); if (bK[hi] + 1e-9 >= needMb) { while (lo < hi) { const mid = (lo + hi) >> 1; if (bK[mid] + 1e-9 >= needMb) hi = mid; else lo = mid + 1; } bestTotal = lo; baseC = lo; } }
    // (b) at most K-1 candidates plus one top-up of any pesewa amount.
    if (prep.topSources.length) {
      const bK1 = prep.best[K - 1];
      for (const c of jumpsOf(prep, K - 1)) {
        if (c >= bestTotal) break;
        const have = bK1[c];
        const p = have + 1e-9 >= needMb ? 0 : topUpP(prep, needMb - have);
        if (p < 0) continue;
        if (c + p < bestTotal) { bestTotal = c + p; baseC = c; k = K - 1; topP = p; }
      }
    }
    if (!Number.isFinite(bestTotal)) return done(null);

    // Rebuild the purchases.
    const counts = new Map<number, number>();
    let c = baseC;
    for (let layer = k; layer >= 1; layer--) {
      const i = prep.choice[layer - 1][c];
      if (i >= 0) { counts.set(i, (counts.get(i) ?? 0) + 1); c -= prep.priceP[i]; }
    }
    const items: PlanItem[] = [...counts].map(([i, count]) => ({ bundle: prep.items[i], count }));
    if (topP > 0) {
      const { s, ok } = prep.topSources[prep.topTab[topP]];
      const t = sourceBundle(s, topP / 100, ok);
      if (t) {
        const same = items.find((x) => x.bundle.computed && x.bundle.family === t.family && x.bundle.validity === t.validity && toP(x.bundle.price) === topP);
        if (same) same.count++; else items.push({ bundle: t, count: 1 });
      }
    }
    items.sort((x, y) => y.bundle.price - x.bundle.price);
    const total = items.reduce((s, x) => s + x.count * toP(x.bundle.price), 0) / 100;
    const purchases = items.reduce((s, x) => s + x.count, 0);
    return done({ network, items, total, mb: items.reduce((s, x) => s + x.count * x.bundle.mb, 0), purchases, maxPurchases: K });
  }

  /** What allowing more buys would save on one network's monthly plan: the cheapest plan over
   *  caps `maxPurchases`..MAX_PURCHASES against the plan at `maxPurchases`, and the SMALLEST cap
   *  that reaches it. Null when there is no plan at this cap, or no saving that shows (under
   *  one pesewa, or the totals show the same). `text` is the saving as shown ("GH¢19.08"). */
  function moreBuysSaving(network: NetworkId, needMb: number, maxPurchases: number): { saving: number; cap: number; text: string } | null {
    const K = Math.max(1, Math.min(MAX_PURCHASES, Math.floor(maxPurchases)));
    const cur = cheapestMonthlyPlan(network, needMb, K);
    if (!cur) return null;
    let best = cur.total, bestCap = K;
    for (let k = K + 1; k <= MAX_PURCHASES; k++) {
      const p = cheapestMonthlyPlan(network, needMb, k);
      if (p && p.total < best - 1e-9) { best = p.total; bestCap = k; }
    }
    const saving = Math.round((cur.total - best) * 100) / 100;
    if (!(saving >= 0.01) || money(cur.total) === money(best)) return null;
    return { saving, cap: bestCap, text: money(saving) };
  }

  // ---- rankings

  const sortByValue = (a: Bundle, b: Bundle) => cpg(a) - cpg(b) || gbOf(b) - gbOf(a);
  /** Price per GB exactly as shown on screen ("GH¢3.85"), now small print beside the
   *  GH¢10 value (ties are decided on tieText). */
  const cpgShown = (b: Pick<Bundle, "price" | "mb" | "network">) => money(cpg(b));
  /** The headline figure as shown on screen ("Every GH¢10 = 6.58 GB": valueText). The owner's
   *  rule: two rows are joint ONLY when the figure shown is identical, so ties (joint ranks,
   *  joint best) are decided on this text (redesign 1, 18 Oct 2026; before it, on cpgShown).
   *  Rankable rows always have a volume, so the price-per-GB text is only a fallback. */
  const tieText = (b: Bundle) => valueText(b) ?? cpgShown(b);
  /** The "Small buys" pool (SMALL_GROUP): the all-day rows at SMALL_MAX or less; a range that starts
   *  at or below SMALL_MAX is clipped to it (price and data scaled at the same rate). */
  /** Each pay-any-amount product (a network's rate table: its rateLabel) appears ONCE in a Small
   *  buys board, at its best-value band (owner, 22 Oct 2026): the first after sortByValue. */
  const productKey = (b: Bundle) => (b.computed ? `${b.network}|${b.rateLabel ?? b.family}` : null);
  function smallPool(groupId = "allday"): Bundle[] {
    const test = GROUPS.find((g) => g.id === groupId)?.test;
    if (!test) return [];
    const out: Bundle[] = [];
    for (const b of all) {
      if (!test(b)) continue;
      if (b.band && !b.band.exact) {
        if (b.band.from > SMALL_MAX + 1e-9) continue;
        if (b.band.to <= SMALL_MAX + 1e-9) { out.push(b); continue; }
        const to = SMALL_MAX;
        out.push({ ...b, price: to, mb: b.mb * (to / b.band.to), band: { ...b.band, to, top: false }, name: b.name.split(money(b.band.to)).join(money(to)) });
      } else if (b.price <= SMALL_MAX + 1e-9) out.push(b);
    }
    // One row per pay-any-amount product: its best value within SMALL_MAX (rankable rows first, so a
    // disputed band never hides a rankable one).
    const sorted = out.sort((a, b) => Number(canWin(b)) - Number(canWin(a)) || sortByValue(a, b));
    const seen = new Set<string>();
    return sorted.filter((b) => { const k = productKey(b); if (!k) return true; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  /** Bundles in one like-for-like group, cheapest per GB first. */
  function leaderboard(groupOrFilter: string | ((b: Bundle) => boolean), limit = Infinity): Bundle[] {
    if (typeof groupOrFilter === "string" && parseBoardId(groupOrFilter).small) return smallPool(parseBoardId(groupOrFilter).group).sort(sortByValue).slice(0, limit);
    const test = typeof groupOrFilter === "string" ? GROUPS.find((g) => g.id === groupOrFilter)?.test : groupOrFilter;
    if (!test) return [];
    return all.filter(test).sort(sortByValue).slice(0, limit);
  }
  /** Ranked rows for a group (rows whose GH¢10 value SHOWS the same share a
   *  rank), plus the rows whose figures are disputed (never ranked) and the
   *  time-restricted rows that would otherwise belong here (weekend-only and
   *  similar: listed separately, never ranked). */
  function leaderboardRows(groupId: string, network?: NetworkId): { ranked: BoardRow[]; disputed: Bundle[]; restricted: Bundle[] } {
    const rows = leaderboard(groupId).filter((b) => !network || b.network === network);
    const ranked: BoardRow[] = [];
    for (const b of rows.filter(canWin)) {
      const v = cpg(b);
      const prev = ranked[ranked.length - 1];
      // Same shown figure = a shared place, except at the same price with different data:
      // then more data ranks higher (AT BigTime 253.3 GB vs Telecel 253.25 GB at GH¢400).
      const sameFigure = prev && tieText(b) === tieText(prev.bundle);
      const samePriceMoreData = prev && Math.abs(b.price - prev.bundle.price) < 1e-9 && Math.abs(b.mb - prev.bundle.mb) > 1e-9;
      const rank = sameFigure && !samePriceMoreData ? prev.rank : ranked.length + 1;
      ranked.push({ bundle: b, cpg: v, rank, joint: false });
    }
    for (const r of ranked) r.joint = ranked.filter((o) => o.rank === r.rank).length > 1;
    const rt = restrictedTest(groupId);
    const restricted = rt ? all.filter((b) => rt(b) && (!network || b.network === network)).sort(sortByValue) : [];
    return { ranked, disputed: rows.filter((b) => !canWin(b)), restricted };
  }

  /** The best value passing `test`: every network's best whose GH¢10 value
   *  shows exactly the same as the overall best (joint winners), best first. */
  function cheapestTies(test: (b: Bundle) => boolean, net?: NetworkId): Bundle[] {
    const pool = all.filter((b) => test(b) && canWin(b) && (!net || b.network === net)).sort(sortByValue);
    if (!pool.length) return [];
    const best = tieText(pool[0]);
    const out: Bundle[] = [];
    for (const b of pool) if (tieText(b) === best && !out.some((o) => o.network === b.network)) out.push(b);
    return out;
  }
  const cheapestIn = (test: (b: Bundle) => boolean, net?: NetworkId) => cheapestTies(test, net)[0] ?? null;

  /** The data amount as shown: the operator's printed label when the data
   *  gives one (verbatim), otherwise the volume in the network's units. */
  function dataShown(b: Bundle): string {
    if (b.label && b.label.trim()) return b.label.trim();
    if (!hasVolume(b)) return "Unlimited";
    return dataText(b);
  }
  /** Networks with the most data for one budget. When every amount shows in
   *  MB, MB are compared as printed; otherwise GB as each network prints it.
   *  A tie only when the amounts SHOW the same (same text, same unit). */
  function mostData(picks: { n: NetworkId; b: Bundle | null }[]): Set<NetworkId> {
    const have = picks.filter((p): p is { n: NetworkId; b: Bundle } => !!p.b && hasVolume(p.b));
    if (!have.length) return new Set();
    const shown = (p: { b: Bundle }) => dataShown(p.b);
    const allMb = have.every((p) => /MB$/i.test(shown(p).trim()));
    const size = (p: { b: Bundle }) => (allMb ? p.b.mb : gbOf(p.b));
    const top = have.reduce((a, p) => (size(p) > size(a) ? p : a));
    return new Set(have.filter((p) => p === top || sameText(shown(p), shown(top))).map((p) => p.n));
  }
  /** Networks with the cheapest plan total; joint only when the totals show the same. */
  function cheapestTotals(plans: { n: NetworkId; p: UsagePlan | null }[]): Set<NetworkId> {
    const have = plans.filter((x): x is { n: NetworkId; p: UsagePlan } => !!x.p);
    if (!have.length) return new Set();
    const low = have.reduce((a, x) => (x.p.total < a.p.total ? x : a));
    return new Set(have.filter((x) => money(x.p.total) === money(low.p.total)).map((x) => x.n));
  }
  /** How to buy, when the data says only some channels sell it: the bundle's
   *  own `channel`, else a family description that says "only on/in/via ...". */
  function channelNote(b: Bundle): string | null {
    if (b.channel && b.channel.trim()) return b.channel.trim();
    const via = (b as { buyVia?: unknown }).buyVia;
    if (Array.isArray(via) && via.length && via.every((x) => typeof x === "string" && x.trim())) return `Buy on ${orList(via as string[])}.`;
    // The operator's own wording for special offers (telecelRates.specialOffers.text).
    const so = obj(obj(doc[`${b.network}Rates`])?.specialOffers);
    if (so && str(so.text) && /special/i.test(b.family)) return `${doc.networks[b.network]?.name ?? b.network}'s terms: “${str(so.text)!.replace(/^\*+/, "")}”`;
    // Otherwise the sentence of the family text or bundle note that says "only on ... *code# / app".
    const ONLY = /[^.]*\b(only|exclusively)\b[^.]*?(\*\d[\d*]*#|\bapp\b)[^.]*/i;
    for (const t of [doc.familyInfo?.[b.network]?.[b.family], b.note]) {
      const hit = t ? t.match(ONLY) : null;
      if (hit) return hit[0].trim().replace(/^["“*]+|["”]+$/g, "");
    }
    // The network's general buying channels, for the families its terms cover
    // (<network>Rates.channels {text, families}: Telecel's data terms list USSD
    // *700# and *110# and the Telecel Play app for every data bundle they list).
    const ch = obj(obj(doc[`${b.network}Rates`])?.channels);
    if (ch && str(ch.text) && Array.isArray(ch.families) && (ch.families as unknown[]).includes(b.family)) return str(ch.text)!;
    // A fixed bundle recorded from an app section (MTN Social, Video bundles: <network>Rates.app):
    // that section is where the app sold it when it was recorded.
    const app = obj(obj(doc[`${b.network}Rates`])?.app);
    const src = str(app?.source);
    if (app && src && b.source === src) {
      const sec = (Array.isArray(app.sections) ? (app.sections as unknown[]) : []).map(obj)
        .find((x) => !!x && str(x.title)?.toLowerCase() === b.family.toLowerCase() && Array.isArray(x.fixed) && (x.fixed as unknown[]).some((f) => obj(f)?.price === b.price));
      if (sec) {
        const name = src.replace(/\s*\([^)]*\)\s*$/, "").trim();
        const when = src.match(/\(([^)]+)\)/)?.[1];
        return `In the ${name}: “${sec.title}”${when ? ` (as the app showed it, ${when})` : ""}.`;
      }
    }
    return null;
  }
  /** How to buy a bundle, as the page shows it: its code(s) (ussd / altUssd), else
   *  channelNote. Every finder and planner pick has one (tested). */
  const howToBuy = (b: Bundle): string | null => {
    const codes = [b.ussd, b.altUssd?.code].filter((x): x is string => !!str(x));
    return codes.length ? `${dialText(codes[0])}${codes[1] ? `, or ${codes[1]}` : ""}` : channelNote(b);
  };
  /** howToBuy in plain, short words for cards (shortBuyText); the full line goes in details. */
  const buyShort = (b: Bundle): string | null => {
    const t = howToBuy(b);
    return t ? shortBuyText(t) : null;
  };
  /** A borrowed-data row's volume as the operator prints it: its label (AT "25 MB"), else
   *  MTN's bare number with the MB its table means ("1,422 MB"), never converted to GB. */
  const borrowedVolume = (row: { label?: string; mb?: number }): string =>
    str(row.label) ?? (typeof row.mb === "number" ? `${row.mb.toLocaleString("en-GB", { maximumFractionDigits: 2 })} MB` : "");

  /** Families a network sells (mobile only): every family with bundles plus
   *  every family documented in familyInfo, minus broadband families, minus
   *  borrowed data (MTN Xtrabyte: shown as borrowed data, not as a package family) and minus
   *  families the checker retired (retiredFamilies: the network dropped them; Telecel "Special
   *  offer", 22 Oct 2026). A retired family's familyInfo text may stay in the data, but it is
   *  never presented as a family "described without figures" unless it has bundles again. */
  function familiesOf(network: NetworkId): string[] {
    const fromInfo = Object.keys(doc.familyInfo[network] ?? {});
    const fromBundles = bundles.filter((b) => b.network === network).map((b) => b.family);
    const fromRates = sources.filter((s) => s.network === network).map((s) => s.family);
    const legacyBroadband = /turbonet|fixed broadband|\bfbb\b|router/i;
    const retired = new Set(((doc as { retiredFamilies?: { network: string; family: string }[] }).retiredFamilies ?? [])
      .filter((x) => x && x.network === network).map((x) => x.family));
    return [...new Set([...fromInfo, ...fromBundles, ...fromRates])]
      .filter((f) => !broadbandFamilies.has(`${network}|${f}`) && !legacyBroadband.test(f) && !borrowedFamilies.has(`${network}|${f}`) &&
        !(retired.has(f) && !fromBundles.includes(f) && !fromRates.includes(f)));
  }
  /** Families sold through a rate table rather than fixed bundles. */
  function rateFamilies(network: NetworkId): string[] {
    const out = sources.filter((s) => s.network === network).map((s) => s.family);
    // Any-amount Social and Video data belongs to the Social bundles and Video bundles
    // families (not a family of its own, so the family count is not inflated).
    if (network === "mtn" && rates?.pulse?.data) out.push("Pulse");
    return [...new Set(out)];
  }

  /** What browsing costs with no bundle, per network, from the dataset. */
  function outOfBundle(network: NetworkId): OutOfBundle | null {
    if (!hasNet(network)) return null;
    if (network === "mtn" && rates && num(rates.outOfBundlePerMb)) return { network, perMb: rates.outOfBundlePerMb, label: "out of bundle" };
    const r = obj(network === "telecel" ? doc.telecelRates : network === "at" ? doc.atRates : doc[`${network}Rates`]);
    if (!r) return null;
    const payg = obj(r.payg) ?? obj(r.outOfBundle) ?? {};
    const perMb = num(r.outOfBundlePerMb) ?? num(r.paygPerMb) ?? num(r.paygGhsPerMb) ?? num(payg.ghsPerMb) ?? num(payg.perMb);
    if (!perMb || perMb <= 0) return null;
    const note = str(payg.note) ?? str(r.outOfBundleNote) ?? str(r.note);
    const isPayg = r.paygPerMb !== undefined || r.payg !== undefined || r.paygGhsPerMb !== undefined || /pay[\s-]?as[\s-]?you[\s-]?go/i.test(note ?? "");
    return { network, perMb, label: isPayg ? "on pay-as-you-go" : "out of bundle", source: str(payg.source) ?? str(r.source), note };
  }

  const eligibleFixedAllDay = bundles.filter((b) => isAllDay(b) && canWin(b));
  /** Counts for one network (or all): verified = not pending and not unconfirmed. */
  function bundleCounts(network?: NetworkId) {
    const mine = bundles.filter((b) => !network || b.network === network);
    const pending = mine.filter(isPending).length;
    const unconfirmed = mine.filter((b) => !isPending(b) && isUnconfirmed(b)).length;
    const verified = mine.filter((b) => !isPending(b) && !isUnconfirmed(b));
    const notRechecked = verified.filter((b) => !/^https:\/\//.test(b.source ?? ""));
    // Ranked in at least one like-for-like group: what "compared" means on the page.
    const ranked = verified.filter((b) => canWin(b) && GROUPS.some((g) => g.test(b))).length;
    return { verified: verified.length, pending, unconfirmed, total: mine.length, notRechecked: notRechecked.length,
      notRecheckedSources: [...new Set(notRechecked.map((b) => b.source))], ranked };
  }
  /** What the like-for-like rankings hold for one network (or all): the fixed bundles
   *  ranked in at least one group (= bundleCounts().ranked), and the rows worked out from
   *  pay-any-amount rate tables (MTN data, Midnight and Pulse; Telecel Flexi) ranked there,
   *  each row counted once however many groups it appears in. `rateLabels` names the
   *  tables those rows come from ("MTN data", "Telecel Flexi"), in source order;
   *  `rateOnly` the networks ranked ONLY through such rates (MTN: its main data is sold
   *  by amount, so none of its fixed bundles is ranked, but its data is compared). */
  function rankedCounts(network?: NetworkId): { fixed: number; rateRows: number; rateLabels: string[]; rateOnly: NetworkId[]; rateNetworks: NetworkId[] } {
    const rows = new Set<Bundle>();
    for (const g of GROUPS) for (const r of leaderboardRows(g.id, network).ranked) rows.add(r.bundle);
    const list = [...rows];
    const rate = list.filter((b) => b.computed);
    const tableName = (label: string) => label.split(",")[0].trim();
    const rateLabels = [...new Set(sources.filter((s) => rate.some((b) => b.rateLabel === s.label)).map((s) => tableName(s.label)))];
    const rateNetworks = networks.filter((n) => rate.some((b) => b.network === n));
    const rateOnly = rateNetworks.filter((n) => !list.some((b) => b.network === n && !b.computed));
    return { fixed: list.length - rate.length, rateRows: rate.length, rateLabels, rateOnly, rateNetworks };
  }
  /** The network page's line under "Fixed bundles": what of this network is ranked, true
   *  for every network (a network ranked only through its any-amount rates says so, rather
   *  than "0 ranked like for like"). */
  function rankedLine(network: NetworkId): string {
    const r = rankedCounts(network);
    const name = doc.networks[network]?.name ?? network;
    const tables = r.rateLabels.join(", ");
    const rows = `${r.rateRows} row${r.rateRows === 1 ? "" : "s"}`;
    if (!r.rateRows) return `${r.fixed} ranked like for like`;
    if (!r.fixed) return `None ranked as fixed bundles: ${name} data is ranked through its pay-any-amount rates, ${rows} in the rankings (${tables}; see the calculator)`;
    return `${r.fixed} ranked like for like, plus ${rows} from ${name}'s pay-any-amount rates (${tables})`;
  }
  /** Families with published figures (fixed bundles or a rate table) and families only
   *  described in familyInfo with no figures (MTN Just4U, Adwumapa). */
  function familyCounts(network?: NetworkId): { withFigures: string[]; describedOnly: string[] } {
    const withFigures: string[] = [], describedOnly: string[] = [];
    for (const n of networks) {
      if (network && n !== network) continue;
      const rf = new Set(rateFamilies(n));
      for (const f of familiesOf(n)) (bundles.some((b) => b.network === n && b.family === f) || rf.has(f) ? withFigures : describedOnly).push(f);
    }
    return { withFigures, describedOnly };
  }
  const allCounts = bundleCounts();
  const stats: HeadlineStats = {
    cheapestAllDay: cheapestTies(GROUPS[0].test),
    cheapestNoExpiry: cheapestTies(GROUPS[1].test),
    cheapestNight: cheapestTies(GROUPS[3].test),
    biggestAllDay: eligibleFixedAllDay.reduce<Bundle | null>((a, b) => (!a || gbOf(b) > gbOf(a) + 1e-9 ? b : a), null),
    fixedCount: allCounts.verified,
    pendingCount: allCounts.pending,
    unconfirmedCount: allCounts.unconfirmed,
    notRecheckedCount: allCounts.notRechecked,
    notRecheckedSources: allCounts.notRecheckedSources,
    networkCount: networks.length,
    familyCount: networks.reduce((s, n) => s + familiesOf(n).length, 0),
    comparedCount: allCounts.ranked,
    familiesWithFigures: familyCounts().withFigures.length,
    familiesDescribedOnly: familyCounts().describedOnly.length,
  };

  /** "when you spend GH¢400 to GH¢999.99" style scope for a computed band row:
   *  always the band's own published range (the top band ends where the
   *  operator's table ends, so "or more" would claim spends it does not sell). */
  function spendScope(b: Bundle): string {
    if (!b.band) return `for ${money(b.price)}`;
    if (b.band.exact) return `when you spend exactly ${money(b.band.to)}`;
    return `when you spend ${money(b.band.from)} to ${money(b.band.to)}`;
  }
  /** Shown range of data for a computed band row ("up to 666.66 GB"). */
  function dataText(b: Bundle): string {
    if (b.band && !b.band.exact) {
      const lo = b.mb * (b.band.from / b.band.to);
      return `${data(lo, b.network)} to ${data(b.mb, b.network)}`;
    }
    return data(b.mb, b.network);
  }
  /** A deal in words, scoped: "Telecel Flexi, no expiry, when you spend
   *  GH¢400 or more" or "AT BigTime Data GH¢400 (GH¢400, No expiry)". */
  function dealText(b: Bundle): string {
    if (b.band && b.rateLabel) return `${b.rateLabel}, ${spendScope(b)}`;
    const net = doc.networks[b.network]?.name ?? b.network;
    const name = b.name.toLowerCase().startsWith(net.toLowerCase()) ? b.name : `${net} ${b.name}`;
    return `${name} (${money(b.price)}, ${b.validity})`;
  }
  /** Validity as published, plus "no expiry" when only the family text says so. */
  const validityText = (b: Bundle) => {
    let t = (b.noExpiry || NO_EXPIRY_TEXT.test(b.operatorValidity ?? "")) && !NO_EXPIRY_TEXT.test(b.validity) ? `${b.validity}, no expiry` : b.validity;
    // Show the usage window when the validity text does not already say it (AT Morning Rush: "24 hours, 4 AM–7 AM only").
    const w = typeof b.window === "string" ? b.window.trim() : "";
    if (w && !DAY_WINDOW.test(t) && !TIME_WINDOW.test(t)) t = `${t}, ${w}${/\bonly\b/i.test(w) ? "" : " only"}`;
    // Another page of the operator disputes the validity (MTN Kokrokoo): say so wherever it is shown.
    if (expiryDisputed(b)) t = `${t} (expiry not clear – check with ${doc.networks[b.network]?.name ?? b.network})`;
    return t;
  };
  /** How long a bundle lasts, short and plain for a list row (at most SHORT_VALIDITY_MAX
   *  characters, no quotes, no citations): the operator's own wording, its quote and its source
   *  stay in validityText (shown under "More info"), and a disputed expiry is shown as a badge.
   *  Read from the published text only:
   *    'Sundays: “valid on Sunday and the next Sunday” (… PDF …)' -> "Sundays · lasts to next Sunday"
   *    '“expires at 11:59pm the following day”; … , Monday–Saturday only' -> "Mon–Sat · ends 11:59 PM next day" */
  const shortValidity = (b: Bundle): string => {
    let t = validityText(b).replace(/\s*\(expiry not clear – check with [^()]*\)\s*$/, "");
    const quoted = /[“”"]|\bPDF\b/.test(t);
    if (!quoted && t.length <= SHORT_VALIDITY_MAX) return t;
    const DAYS: Record<string, string> = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };
    const parts: string[] = [];
    const lead = t.match(/^([A-Za-z][A-Za-z ,–-]*?):\s*[“"]/);
    if (lead) parts.push(lead[1].trim());
    const range = t.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*[–-]\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i);
    if (range) parts.push(`${DAYS[range[1].toLowerCase()]}–${DAYS[range[2].toLowerCase()]}`);
    const next = t.match(/valid on (\w+) and the next \1/i);
    if (next) parts.push(`lasts to next ${next[1][0].toUpperCase()}${next[1].slice(1).toLowerCase()}`);
    const exp = t.match(/expires at (\d{1,2})(?::(\d{2}))?\s*(am|pm) the following day/i);
    if (exp) parts.push(`ends ${exp[1]}:${exp[2] ?? "00"} ${exp[3].toUpperCase()} next day`);
    let s = parts.join(" · ");
    if (!s) s = t.replace(/\([^()]*\)/g, "").replace(/[“”"][^“”"]*[“”"]/g, "").split(/[;:]/)[0].replace(/\s{2,}/g, " ").replace(/[\s,·]+$/, "").trim();
    return s && s.length <= SHORT_VALIDITY_MAX && !/[“”"]|\bPDF\b/.test(s) ? s : "See More info";
  };
  /** Every price per GB the data supports for a network, at its own factor,
   *  as shown on screen ("GH¢117.25"): its out-of-bundle rate, its rate tables
   *  and every fixed bundle. */
  const perGbTruths = new Map<NetworkId, Set<string>>();
  function truthsFor(network: NetworkId): Set<string> {
    const hit = perGbTruths.get(network);
    if (hit) return hit;
    const f = mbPerGb(network);
    const out = new Set<string>();
    const add = (perMb: unknown) => { const r = num(perMb); if (r && r > 0) out.add(money(r * f)); };
    add(outOfBundle(network)?.perMb);
    for (const s of sources) if (s.network === network) for (const b of pricedBands(s.table)) add(b.ghsPerMb);
    // Pulse is a rate source (its priced bands are above); an unconfirmed band is no truth.
    if (network === "mtn" && rates) { add(rates.social); add(rates.video); }
    for (const b of bundles) if (b.network === network && hasVolume(b)) out.add(money(cpg(b)));
    perGbTruths.set(network, out);
    return out;
  }
  /** A network fact as the dataset gives it, minus any sentence quoting a
   *  price per GB that the data's own figures (at networks.<id>.mbPerGb) do
   *  not give: free text is shown only where the numbers back it up. The
   *  checker (validate.per_gb_claim_checks) holds the same rule. */
  function factText(network: NetworkId): string | null {
    const t = doc.networkFacts?.[network];
    if (!t) return null;
    const ok = (sentence: string) => [...sentence.matchAll(/GH¢\s?([\d,]+(?:\.\d+)?)\s*(?:per GB|\/GB|a GB)\b/gi)]
      .every((m) => truthsFor(network).has(money(Number(m[1].replace(/,/g, "")))));
    const kept = t.split(/(?<=[.!?])\s+/).filter(ok).join(" ").trim();
    return kept || null;
  }
  const priceText = (b: Bundle) => (b.band && !b.band.exact ? `${money(b.band.from)} to ${money(b.band.to)}` : money(b.price));
  /** A bundle's name in lists: its own name, plus its validity when that name is also how
   *  another bundle of the network prints its volume (Telecel "1.11GB", GH¢10, 5 days, vs
   *  Downloader Hour's "1.11GB"): "1.11GB · 5 days". No name is invented (audit 8, L11). */
  function listName(b: Bundle): string {
    if (b.computed) return b.name;
    const clash = bundles.some((o) => o !== b && o.network === b.network && (sameText(o.name, b.name) || (!!o.label && sameText(o.label, b.name))));
    return clash ? `${b.name} · ${validityText(b)}` : b.name;
  }
  /** A bundle's name on cards without the price it already prints ("Sika Kokoo GH¢50" ->
   *  "Sika Kokoo"; "MTN data, GH¢50" -> "MTN data"; "Telecel Flexi, no expiry, GH¢400–GH¢999.99"
   *  -> "Telecel Flexi, no expiry"), so the price is said once, by payText. A name that is
   *  only a price keeps its full list name. */
  function nameNoPrice(b: Bundle): string {
    if (b.computed && b.rateLabel) return b.rateLabel;
    const full = listName(b);
    const p = money(b.price);
    if (!full.includes(p)) return full;
    const cut = full.split(p).join(" ").replace(/\s*,\s*(?=,|$)/g, "").replace(/\s{2,}/g, " ").replace(/^[\s,·–-]+|[\s,·–-]+$/g, "").trim();
    return cut && /[A-Za-z]/.test(cut) ? cut : full;
  }
  /** "Pay GH¢50"; a spend range "Pay GH¢400 to GH¢999.99"; an exact special amount "Pay exactly GH¢399". */
  function payText(b: Bundle): string {
    if (b.band?.exact) return `Pay exactly ${money(b.band.to)}`;
    return `Pay ${priceText(b)}`;
  }
  /** What is left of `budget` after paying for `b` ("GH¢0.01"), or null (none, or not a single price). */
  function changeText(b: Bundle, budget: number): string | null {
    if (b.band && !b.band.exact) return null;
    const left = Math.round((budget - b.price) * 100) / 100;
    return left >= 0.01 ? money(left) : null;
  }
  /** Why a worked-out pick costs LESS than the amount the reader has: spending it all would
   *  buy less data at the network's own rates (a spend cliff), or the network sells no data
   *  at exactly that amount on this price list. From the rate table only; null otherwise. */
  function changeReason(b: Bundle, budget: number): string | null {
    if (!b.computed || !b.rateLabel || Math.round((budget - b.price) * 100) < 1) return null;
    const s = sources.find((x) => x.network === b.network && x.label === b.rateLabel);
    if (!s) return null;
    const net = doc.networks[b.network]?.name ?? b.network;
    const atAll = mbFromTable(Math.floor(budget * 100 + 1e-6) / 100, s.table);
    if (atAll > 0 && atAll + 1e-9 < b.mb) return `At ${net}'s rates ${money(b.price)} buys more data than ${money(budget)}.`;
    if (atAll === 0) return `${net} has no ${b.rateLabel.startsWith(`${net} `) ? b.rateLabel.slice(net.length + 1) : b.rateLabel} price for exactly ${money(budget)}. This is the best amount below it.`;
    return null;
  }
  /** The value meter for the networks' picks at one amount: each pick's amount as a share of
   *  the best one (compared in MB when every amount shows in MB, else GB, as model.mostData),
   *  so the winner reads 1 ("Best") and the others their share, with its zone. */
  function valueMeter(picks: { n: NetworkId; b: Bundle | null }[]) {
    const lead = mostData(picks);
    const have = picks.filter((p): p is { n: NetworkId; b: Bundle } => !!p.b && hasVolume(p.b));
    const allMb = have.length > 0 && have.every((p) => /MB$/i.test(dataShown(p.b).trim()));
    // The size as SHOWN on the card ("1.84 GB", "2.45GB", "460.11MB"), in the compared unit, so
    // the zone matches the printed figures (1.84 / 2.45 = 75.1% is "Good", whatever the exact MB).
    const size = (b: Bundle) => {
      const m = dataShown(b).match(/([\d,]+(?:\.\d+)?)\s*(GB|MB)\b/i);
      if (!m) return allMb ? b.mb : gbOf(b);
      const v = parseFloat(m[1].replace(/,/g, "")), gb = /GB/i.test(m[2]);
      return allMb ? (gb ? v * mbPerGb(b.network) : v) : (gb ? v : v / mbPerGb(b.network));
    };
    const best = Math.max(1e-12, ...have.map((p) => size(p.b)));
    return picks.map((p) => {
      if (!p.b || !hasVolume(p.b)) return { n: p.n, share: 0, zone: null as ValueZone | null, best: false };
      const isBest = lead.has(p.n);
      const share = isBest ? 1 : Math.min(1, size(p.b) / best);
      return { n: p.n, share, zone: valueZone(share, isBest) as ValueZone | null, best: isBest };
    });
  }
  /** One shared gauge scale for the networks' picks at one amount: the amounts in the unit
   *  they are compared in (MB when every one shows in MB, else GB, as model.mostData), the
   *  top = niceCeil(biggest x GAUGE_HEADROOM), and ticks at 0, half and the top ("2 GB"). */
  function gaugeScale(picks: (Bundle | null)[]) {
    const have = picks.filter((b): b is Bundle => !!b && hasVolume(b));
    const allMb = have.length > 0 && have.every((b) => /MB$/i.test(dataShown(b).trim()));
    const unit = allMb ? "MB" : "GB";
    const size = (b: Bundle) => (allMb ? b.mb : gbOf(b));
    const top = niceCeil(Math.max(0, ...have.map(size)) * GAUGE_HEADROOM);
    return {
      unit, max: top,
      ticks: [tickText(0), tickText(top / 2), `${tickText(top)} ${unit}`],
      share: (b: Bundle | null) => (b && hasVolume(b) ? Math.max(0, Math.min(1, size(b) / top)) : 0),
    };
  }
  /** Each network's best value in a like-for-like group (model.cheapestIn), for the face-off:
   *  its GH¢10 value, its share of the best one, and whether it is (joint) best on the shown text. */
  function faceOff(groupId: string) {
    const sb = parseBoardId(groupId);
    const test = GROUPS.find((g) => g.id === sb.group)?.test;
    // "Small buys" boards: each network's best of that small pool (the board's own first rows).
    const pool = sb.small ? smallPool(sb.group) : [];
    const smallBest = (n: NetworkId) => pool.filter((b) => b.network === n && canWin(b)).sort(sortByValue)[0] ?? null;
    const rows = networks.map((n) => ({ n, b: sb.small ? smallBest(n) : test ? cheapestIn(test, n) : null }));
    const best = Math.max(1e-9, ...rows.map((r) => (r.b ? valueMb(r.b) ?? 0 : 0)));
    const lead = rows.filter((r) => r.b).reduce<Bundle | null>((a, r) => (!a || (valueMb(r.b!) ?? 0) > (valueMb(a) ?? 0) + 1e-9 ? r.b : a), null);
    return rows.map((r) => ({
      ...r,
      value: r.b ? valueText(r.b) : null,
      share: r.b ? (valueMb(r.b) ?? 0) / best : 0,
      best: !!r.b && !!lead && tieText(r.b) === tieText(lead),
    }));
  }

  /** What "spent on ..." names: a rate table's own name for a worked-out amount ("MTN Pulse",
   *  not "MTN Pulse, GH¢1", so the amount is not said twice), else the list name (audit 8, L8). */
  const spendName = (b: Bundle) => (b.computed && b.rateLabel ? b.rateLabel : listName(b));

  /** A package family's "best" price per GB for its card: the cheapest of its
   *  rankable bundles usable at any time. A time-restricted bundle (weekend-,
   *  Sunday- or night-only) counts only when EVERY rankable bundle in the family
   *  is restricted, and then its window comes with it. */
  function familyBest(network: NetworkId, family: string): { bundle: Bundle; window: string | null } | null {
    const ranked = bundles.filter((b) => b.network === network && b.family === family && canWin(b) && hasVolume(b));
    const open = ranked.filter((b) => !isTimeRestricted(b));
    const pool = open.length ? open : ranked;
    const best = pool.reduce<Bundle | null>((a, b) => (!a || cpg(b) < cpg(a) ? b : a), null);
    if (!best) return null;
    // A windowed family's price per GB always comes with its window: certain days or hours,
    // or a one-hour bundle's "1 hour" (Telecel Hourly), so it never reads as all-day value.
    const win = isTimeRestricted(best) ? (typeof best.window === "string" && best.window.trim() ? best.window.trim() : validityText(best))
      : best.kind === "hourly" ? validityText(best) : null;
    return { bundle: best, window: win };
  }

  /** Spend cliffs (amounts that buy less data than a smaller amount) per rate
   *  table, worked out from the published rates; cached per table. */
  const cliffCache = new Map<RateBand[], SpendCliff[]>();
  const cliffsOf = (table: RateBand[]): SpendCliff[] => {
    let c = cliffCache.get(table);
    if (!c) { c = spendCliffs(table); cliffCache.set(table, c); }
    return c;
  };
  /** The material parts of a table's spend cliffs (materialCliffs); cached per table. */
  const materialCache = new Map<RateBand[], SpendCliff[]>();
  const materialCliffsOf = (table: RateBand[]): SpendCliff[] => {
    let c = materialCache.get(table);
    if (!c) { c = materialCliffs(table, cliffsOf(table)); materialCache.set(table, c); }
    return c;
  };
  /** Two volumes as shown, in one unit that tells them apart: the network's usual GB/MB, or
   *  MB to two decimals when GB rounding would show both the same (audit 8, L5). */
  const fmtPair = (a: number, b: number, network: NetworkId): [string, string] =>
    (sameText(data(a, network), data(b, network)) ? [fmtMb(a), fmtMb(b)] : [data(a, network), data(b, network)]);
  /** Every any-amount table with spend cliffs, optionally for one network. */
  const cliffSources = (only?: NetworkId) => sources.filter((s) => !only || s.network === only)
    .map((s) => ({ source: s, cliffs: cliffsOf(s.table) })).filter((x) => x.cliffs.length > 0);

  /** Data with strings attached (hourly, morning, app-only, unlimited, certain
   *  days or hours), for the advice card. A family's own text is used only when
   *  EVERY bundle in it is limited (that is what the text describes); where only
   *  some are (a weekend-only bundle in an all-day family), those bundles are
   *  named with their window instead. */
  function limitedNotes(only?: NetworkId): { n: NetworkId; f: string; t: string; whole: boolean }[] {
    const limitedKind = (b: Bundle) => ["hourly", "morning", "social", "video", "unlimited", "weekend", "restricted"].includes(b.kind) || (isTimeRestricted(b) && b.kind !== "night");
    const out: { n: NetworkId; f: string; t: string; whole: boolean }[] = [];
    for (const n of networks) {
      if (only && only !== n) continue;
      const info = doc.familyInfo?.[n] ?? {};
      const byFam = new Map<string, Bundle[]>();
      for (const b of bundles) if (b.network === n && !isPending(b)) byFam.set(b.family, [...(byFam.get(b.family) ?? []), b]);
      for (const [f, bs] of byFam) {
        const lim = bs.filter(limitedKind);
        if (!lim.length) continue;
        if (lim.length === bs.length && info[f]) { out.push({ n, f, t: info[f], whole: true }); continue; }
        for (const b of lim) {
          const w = (typeof b.window === "string" && b.window.trim() ? b.window : validityText(b)).replace(/\s*\bonly\b\s*/i, " ").replace(/\s+/g, " ").trim();
          out.push({ n, f: b.name, t: `Usable only: ${w}. Part of ${f}, so not ranked with all-day data.`, whole: false });
        }
      }
      // Any-amount app-only data has no fixed bundles, so MTN's note on it is the only description.
      if (n === "mtn" && rates && str(rates.socialNote)) out.push({ n, f: "Social and Video, any amount", t: rates.socialNote!, whole: true });
    }
    return out;
  }

  /** Every distinct source the dataset cites for a network: `cited` = the quoted pages with
   *  their dates (mtnRates.citedSources), `urls` = every other source (its main page, rate-table
   *  sources, every URL in its rate block, each bundle's source, otherSource and altUssd), minus
   *  the article the data names as out of date (shown separately) and the cited ones. */
  function sourcesFor(id: NetworkId): { cited: CitedSource[]; urls: string[] } {
    const isUrl = (s: string) => /^https:\/\//.test(s);
    const blk = obj(doc[`${id}Rates`]);
    const cited = (Array.isArray(blk?.citedSources) ? (blk!.citedSources as unknown[]) : [])
      .map(obj).filter((c): c is Record<string, unknown> => !!c && !!str(c.url) && isUrl(c.url as string) && !!str(c.label))
      .map((c) => ({ label: c.label as string, url: c.url as string, date: str(c.date) ?? "", dateLabel: str(c.dateLabel) ?? "", for: Array.isArray(c.for) ? (c.for as string[]) : [] }));
    // walletPayments.<network> (paying with mobile money, quoted in the questions): listed with
    // its label and date like the other quoted pages, once (MTN's is also in citedSources).
    const wallet = obj(obj((doc as unknown as Record<string, unknown>).walletPayments)?.[id]);
    if (wallet && str(wallet.url) && isUrl(wallet.url as string) && str(wallet.label) && !cited.some((c) => c.url === wallet.url)) {
      cited.push({ label: wallet.label as string, url: wallet.url as string, date: str(wallet.updated) ?? "", dateLabel: "updated", for: [] });
    }
    const citedUrls = new Set(cited.map((c) => c.url));
    const out: string[] = [doc.networks[id]?.source ?? ""];
    const r = id === "mtn" ? rates : null;
    if (r) out.push(...[r.validitySource, r.midnightSource, r.midnightNoExpirySource as string | undefined, r.midnightNoCapsSource as string | undefined, r.balanceSource].filter((x): x is string => typeof x === "string" && !!x));
    for (const s of sources) if (s.network === id && s.source) out.push(s.source);
    const urlsIn = (v: unknown, depth: number): string[] => {
      if (typeof v === "string") return isUrl(v) ? [v] : [];
      if (depth > 3 || !v || typeof v !== "object") return [];
      return Object.values(v as Record<string, unknown>).flatMap((w) => urlsIn(w, depth + 1));
    };
    if (blk) for (const [k, v] of Object.entries(blk)) if (k !== "outdatedHelpArticle" && k !== "app" && k !== "citedSources") out.push(...urlsIn(v, 0));
    for (const b of bundles) if (b.network === id && b.source) out.push(b.source);
    for (const b of bundles) if (b.network === id) for (const u of [b.otherSource?.url, b.altUssd?.url]) if (typeof u === "string" && isUrl(u)) out.push(u);
    const outdated = str(obj(blk?.outdatedHelpArticle)?.url);
    const urls = [...new Set(out.map((x) => x.trim()).filter((x) => x && !citedUrls.has(x) && x !== outdated))];
    return { cited: cited.filter((c) => c.url !== outdated), urls };
  }

  return {
    doc, currency, money, rate: (n: number) => fmtRate(n, currency), networks, rates, flexi, sources, validityText, factText, sourcesFor,
    networkInfo: (id: NetworkId) => doc.networks[id],
    mbPerGb, sharedMbPerGb, gbOf, costPerGb: cpg, fmtData: data, perGbText, valueMb, valueText, valuePer, valueLine, priceLead, leadData, leadText, disputeText, smallPool, valueStep: VALUE_STEP, dataText, priceText, spendScope, dealText, bundleCounts,
    bundles, computed, computedRegular, computedMidnight, all,
    regularMb, midnightMb, pulseMb, flatMb, flexiQuote,
    regularBundle, midnightBundle, sourceBundle,
    bestForBudget, bestComboForBudget, comboForBudget, comboText, finderMinimum, planUpsell, finderShareText, finderPick, finderPicks, buysText, mixParts, roundPlan, faqItems, faqAnswer, topWinners, networkTopDeals, cheapestMonthlyPlan, moreBuysSaving, monthlySources, leaderboard, leaderboardRows, cheapestIn, cheapestTies,
    cpgShown, tieText, dataShown, mostData, cheapestTotals, channelNote, familyBest, limitedNotes, cliffsOf, cliffSources,
    materialCliffsOf, fmtPair, listName, spendName, nameNoPrice, payText, changeText, changeReason, gaugeScale, valueMeter, faceOff, familyCounts, rankedCounts, rankedLine, shortValidity,
    familiesOf, rateFamilies, lastsAMonth, outOfBundle, borrowed, borrowedVolume, howToBuy, buyShort,
    stats,
  };
}

export type BundleModel = ReturnType<typeof createBundleModel>;
