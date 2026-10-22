// Maths checks for the data bundle dashboard. Imports the real modules and the
// real committed dataset, so the test cannot pass while the shipped code is
// broken. Parts that need fields the committed dataset may not have yet
// (Telecel Flexi, pending/conflict flags...) also run on a FIXTURE: a copy of
// the real dataset with those fields added. Fixture rates are made up for the
// test only and are labelled as such; they never reach the site.
//
// Run: npx tsx scripts/test-data-bundles.mts      (VERBOSE=1 lists every check)
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createBundleModel, rateFor, minSpendFor, bestSpendWithin, costPerGb, fmtData, isAllDay, isConditional, isPending, hasConflict,
  neverExpires, mbFromTable, readFlexi, cornerAmounts, GROUPS, MAX_PURCHASES, PURCHASE_CAPS, DEFAULT_PURCHASES,
  isTimeRestricted, isUnconfirmed, hasVolume, isRankable, canWin, bandFor, unpublishedBandAt, tableRange, restrictedTest, sameText, TABLE_SECTIONS, tableSection,
  conditionalReason, normaliseAmountText, expiryDisputed,
  type Bundle, type BundleDataset, type BundleModel, type RateBand,
} from "../src/lib/dataBundles";
import { validateDataset, compareToBaseline, contentKey, compareBundles, isStrictlyNewer, captureTime, MAX_NETWORK_DROP, VOLATILE_FIELDS, REQUIRED_MB_PER_GB } from "../src/lib/dataBundleSchema.js";
import { resolveSnapshot } from "../src/lib/bundleSnapshot";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DATA_FILE = join(ROOT, "src/data/ghanaDataBundles.json");
const rawText = readFileSync(DATA_FILE, "utf8");
const doc = JSON.parse(rawText) as BundleDataset;
const m = createBundleModel(doc);
const R = doc.mtnRates!;
const NEW_SCHEMA = typeof doc.networks.mtn?.mbPerGb === "number";

let failures = 0, passes = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) passes++; else failures++;
  if (!ok || process.env.VERBOSE) console.log(`${ok ? "ok  " : "FAIL"} ${label}${detail ? `  (${detail})` : ""}`);
}
const near = (a: number, b: number, tol = 0.01) => Math.abs(a - b) <= tol;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const desc = (p: { total: number; items: { count: number; bundle: Bundle }[] }) => `${p.total}: ${p.items.map((i) => `${i.count}x ${i.bundle.name}`).join(" + ")}`;

console.log(`dataset: capturedAt ${doc.capturedAt}, ${doc.bundles.length} bundles, ${NEW_SCHEMA ? "NEW schema (mbPerGb present)" : "OLD schema (no mbPerGb yet)"}${m.flexi ? ", Telecel Flexi present" : ""}`);

// ------------------------------------------------------------------ fixture
// The real dataset plus the new fields, with test-only Flexi rates.
function makeFixture(): BundleDataset {
  const f = clone(doc) as BundleDataset & Record<string, any>;
  // The fixture keeps the dataset's own factor (1 GB = 1,024 MB for every network).
  f.units = "TEST FIXTURE units note";
  f.telecelRates = {
    // TEST-ONLY rates (not Telecel's): shaped like the dataset's telecelRates.flexi.
    flexi: {
      family: "Flexi (any amount)", ussd: "*700#", autoRenew: false,
      bands: [
        { from: 0.02, to: 4.99, noExpiry: { ghsPerMb: 0.01 }, expiry: { ghsPerMb: 0.008, days: 1 } },
        { from: 5, to: 49.99, noExpiry: { ghsPerMb: 0.009 }, expiry: { ghsPerMb: 0.006, days: 7 } },
        { from: 50, to: 399.99, noExpiry: { ghsPerMb: 0.004 }, expiry: { ghsPerMb: 0.003, days: 30 } },
        { from: 400, to: 999.99, noExpiry: { ghsPerMb: 0.0015 }, expiry: { ghsPerMb: 0.0012, days: 30 } },
      ],
    },
    paygPerMb: 0.115,
  };
  f.atRates = { outOfBundlePerMb: 0.18 };
  f.bundles = f.bundles.filter((b: Bundle) => !b.pending && !b.conflict && !(b.name || "").startsWith("TEST "));
  f.bundles.push(
    { network: "at", family: "TEST pending", name: "TEST pending huge", price: 1, mb: 19900, validity: "No expiry", days: null, kind: "noexpiry", ussd: null, source: "test", pending: true },
    { network: "at", family: "TEST conflict", name: "TEST conflict huge", price: 1, mb: 19800, validity: "No expiry", days: null, kind: "noexpiry", ussd: null, source: "test", conflict: { productPage: "800 GB", faq: "1 GB" } },
    { network: "at", family: "TEST night", name: "TEST conflict night", price: 1, mb: 19700, validity: "12 AM–4 AM", days: null, kind: "night", ussd: null, source: "test", conflict: { productPage: "a", faq: "b" } },
    { network: "telecel", family: "TEST zone", name: "TEST conditional huge", price: 1, mb: 19600, validity: "1 day", days: 1, kind: "anytime", ussd: null, source: "test", conditional: true },
    { network: "telecel", family: "TEST night ne", name: "TEST night no expiry", price: 2, mb: 39000, validity: "No Expiry (12am–5am)", days: null, kind: "night", ussd: null, source: "test" },
    { network: "mtn", family: "TEST social", name: "TEST social app", price: 1, mb: 19500, validity: "Not stated by MTN", days: null, kind: "social", ussd: null, source: "test" },
  );
  return f as BundleDataset;
}
const fx = makeFixture();
const F = createBundleModel(fx);

// ------------------------------------------------------------------ 0. dataset sanity
const v = validateDataset(doc);
check("dataset passes schema checks", v.ok, v.errors.slice(0, 3).join("; "));
check("dataset passes baseline check against itself", compareToBaseline(doc, doc).ok);
// mb may be null only for kind unlimited or social, and then a label is required (data contract).
for (const b of doc.bundles) check(`price>0 and mb>0 (or no-volume with a label): ${b.network} ${b.name}`, b.price > 0 && (b.mb > 0 || ((b.mb === null || b.mb === undefined) && ["unlimited", "social"].includes(b.kind) && typeof b.label === "string" && b.label.trim() !== "")));
const broken = clone(doc); broken.bundles[0].price = 0;
check("schema rejects a zero price", !validateDataset(broken).ok);
const partial = clone(doc); partial.bundles = partial.bundles.filter((b) => b.network !== "at");
check("baseline check rejects a snapshot missing a network", !compareToBaseline(partial, doc).ok);
check("fixture passes schema checks", validateDataset(fx).ok, validateDataset(fx).errors.slice(0, 3).join("; "));
const badF = clone(fx) as any; badF.networks.mtn.mbPerGb = -1;
check("schema rejects a bad mbPerGb", !validateDataset(badF).ok);
const badFx = clone(fx) as any; badFx.telecelRates.flexi.bands[0].expiry = { ghsPerMb: 0.01 };
check("schema rejects a Flexi expiry option without days", !validateDataset(badFx).ok);
const badFx2 = clone(fx) as any; badFx2.telecelRates.flexi.bands[1].noExpiry.ghsPerMb = 0;
check("schema rejects a zero Flexi rate", !validateDataset(badFx2).ok);
const badFlag = clone(fx) as any; badFlag.bundles[0].pending = "yes";
check("schema rejects a non-boolean pending flag", !validateDataset(badFlag).ok);
check("contentKey ignores checkedAt", contentKey({ ...doc, checkedAt: "2030-01-01" }) === contentKey({ ...doc, checkedAt: undefined }));
check("contentKey sees a changed price", contentKey(broken) !== contentKey(doc));
check("strictly newer: a row captured the next day beats a date", isStrictlyNewer({ captured_at: "2026-10-18T00:00:01Z" }, { capturedAt: "2026-10-17" }));
check("strictly newer: a row captured at the very start of the same day is NOT newer", !isStrictlyNewer({ captured_at: "2026-10-17T00:00:00Z" }, { capturedAt: "2026-10-17" }));
check("strictly newer: an older row is not newer", !isStrictlyNewer({ captured_at: "2026-10-16T23:59:59Z" }, { capturedAt: "2026-10-17" }));

// ------------------------------------------------------------------ 1. mobile only: broadband absent
for (const [label, mm] of [["real", m], ["fixture", F]] as const) {
  check(`${label}: no router/broadband bundle in the model`, mm.bundles.every((b) => (b.kind as string) !== "router") && mm.all.every((b) => !/turbonet|fbb|fixed broadband|router/i.test(`${b.family} ${b.name}`)));
  check(`${label}: no broadband family listed`, mm.networks.every((n) => mm.familiesOf(n).every((f) => !/turbonet|fbb|fixed broadband|router|home internet/i.test(f))));
}
check("model exposes no Turbonet/FBB calculators", !("turbonetFlexiMb" in m) && !("fbbFlexiMb" in m));
{
  const uiDirs = ["src/components/data-bundles", "src/pages/data-bundles"];
  const bad: string[] = [];
  for (const d of uiDirs) for (const f of readdirSync(join(ROOT, d))) {
    const t = readFileSync(join(ROOT, d, f), "utf8");
    if (/turbonet|\bfbb\b|fixed broadband|home internet|home router|(?<!react-)\brouter\b/i.test(t)) bad.push(`${f}: broadband wording`);
    if (/all MTN (data|bundles?)[^.]{0,40}(never|do not|don't) expire/i.test(t)) bad.push(`${f}: "all MTN never expires" claim`);
  }
  check("UI has no broadband/router wording and no 'all MTN bundles never expire' claim", bad.length === 0, bad.join("; "));
}

// ------------------------------------------------------------------ 2. units (mbPerGb)
check("fmtData 222,556.9 MB at 1024 = 217.34 GB", fmtData(222556.9, 1024) === "217.34 GB", fmtData(222556.9, 1024));
check("fmtData 263,380 MB at 1000 = 263.38 GB (the function takes any factor it is given)", fmtData(263380, 1000) === "263.38 GB");
check("fmtData 269,701.12 MB at 1024 = 263.38 GB (Telecel's printed 263.38GB at 1,024 MB per GB)", fmtData(269701.12, 1024) === "263.38 GB", fmtData(269701.12, 1024));
check("fmtData below one GB stays MB (1,000 MB at 1024)", fmtData(1000, 1024) === "1,000 MB", fmtData(1000, 1024));
check("fmtData: GB always to two decimals, our own figures only ('253.30 GB', '10.00 GB'); MB unchanged", fmtData(253.3 * 1024, 1024) === "253.30 GB" && fmtData(10240, 1024) === "10.00 GB" && fmtData(51, 1024) === "51 MB" && fmtData(55.87, 1024) === "55.87 MB");
check("fmtData picks the unit AFTER rounding (1,023.999 MB at 1024 rounds to 1,024 MB = 1 GB)", fmtData(1023.999, 1024) === "1.00 GB", fmtData(1023.999, 1024));
check("fmtData 999.995 MB at 1000 = 1 GB, same as 1,000 MB (one amount, one way)", fmtData(999.995, 1000) === "1.00 GB" && fmtData(1000, 1000) === "1.00 GB", fmtData(999.995, 1000));
check("fmtData 999.994 MB at 1000 stays 999.99 MB", fmtData(999.994, 1000) === "999.99 MB", fmtData(999.994, 1000));
check("fmtData 1,023.994 MB at 1024 stays 1,023.99 MB", fmtData(1023.994, 1024) === "1,023.99 MB", fmtData(1023.994, 1024));
check("fixture: MTN GH¢399 shows 217.34 GB", F.fmtData(F.regularMb(399), "mtn") === "217.34 GB", F.fmtData(F.regularMb(399), "mtn"));
check("fixture: MTN per-GB uses 1,024 MB", near(F.costPerGb(F.regularBundle(399)!), 399 / (222556.9 / 1024), 0.001), String(F.costPerGb(F.regularBundle(399)!)));
check("fixture: Telecel per-GB of 263.38GB Monthly is GH¢400 / 263.38 (its printed GB, 1,024 MB each)", near(F.costPerGb(F.bundles.find((b) => b.network === "telecel" && b.name === "263.38GB Monthly")!), 400 / 263.38, 1e-9));
check("fixture: 1 GB = 1,024 MB for every network", F.mbPerGb("mtn") === 1024 && F.mbPerGb("telecel") === 1024 && F.mbPerGb("at") === 1024 && F.sharedMbPerGb() === 1024);
{
  const noF = { ...clone(doc), networks: { ...clone(doc).networks, mtn: { ...clone(doc).networks.mtn, mbPerGb: undefined } } };
  let threw = false; try { createBundleModel(noF as BundleDataset); } catch { threw = true; }
  check("a dataset without mbPerGb is never modelled with an assumed factor (the model refuses it)", threw);
  check("the schema rejects a dataset without mbPerGb (so the bundled data is used instead)", !validateDataset(noF).ok);
}
if (NEW_SCHEMA) {
  check("real: MTN mbPerGb is 1024", doc.networks.mtn.mbPerGb === 1024);
  check("real: Telecel and AT mbPerGb are 1024 (Edmund's decision, as MTN's app counts)", doc.networks.telecel.mbPerGb === 1024 && doc.networks.at.mbPerGb === 1024);
  check("real: MTN GH¢399 shows 217.34 GB", m.fmtData(m.regularMb(399), "mtn") === "217.34 GB", m.fmtData(m.regularMb(399), "mtn"));
  check("real: units note present", typeof doc.units === "string" || (typeof doc.units === "object" && doc.units !== null));
}

// ------------------------------------------------------------------ 3. MTN rates
check("MTN GH¢3 -> 406.89 MB", near(m.regularMb(3), 406.89), m.regularMb(3).toFixed(2));
check("MTN GH¢10 -> 837.55 MB", near(m.regularMb(10), 837.55), m.regularMb(10).toFixed(2));
check("MTN GH¢399 -> ~222,557 MB", Math.abs(m.regularMb(399) - 222557) < 1, m.regularMb(399).toFixed(1));
const edges: [number, number | null][] = [
  [0.3, null], [0.31, 0.0241221], [1.99, 0.0241221], [2, 0.0201363], [2.99, 0.0201363], [3, 0.007373],
  [3.01, 0.0095963], [5, 0.0095963], [5.01, 0.0140599], [9.99, 0.0140599], [10, 0.0119396], [10.01, 0.0140599],
  [99.9, 0.0140599], [99.95, null], [100, 0.0106515], [199.9, 0.0106515], [200, 0.0063262], [299.99, 0.0063262],
  [300, 0.0031586], [398.99, 0.0031586], [399, 0.0017928], [399.01, null],
];
// Amounts inside mtnRates.gaps have no published rate (data contract): expected null there.
const gapsReg: { from: number; to: number }[] = ((R as any).gaps?.regular ?? []);
const inGap = (a: number) => gapsReg.some((g) => a >= g.from - 1e-9 && a <= g.to + 1e-9);
for (const [amt, rate] of edges) { const want = inGap(amt) ? null : rate; check(`regular rate at GH¢${amt}${inGap(amt) ? " (in an MTN gap)" : ""}`, rateFor(amt, m.rates!.regular) === want, String(rateFor(amt, m.rates!.regular))); }
check("midnight GH¢3 special", rateFor(3, R.midnight) === 0.0003455);
check("midnight GH¢3.01 not sold", rateFor(3.01, R.midnight) === null);
if (R.pulse) {
  // Audit 6: MTN's GH¢5–9.99 Pulse data rate (0.0447653) is the voice rate printed in the row above it:
  // the data marks it unconfirmed, so no figure is worked out for it, but MTN's figure is kept.
  check("pulse GH¢5–9.99 is unconfirmed: MTN's figure kept, no data worked out", (R.pulse.data[1] as any).ghsPerMb === 0.0447653 && (R.pulse.data[1] as any).unconfirmed === true && rateFor(5, m.rates!.pulse.data) === null && m.pulseMb(9.99) === 0);
  check("pulse GH¢30 special", rateFor(30, R.pulse.data) === 0.0095726);
}
check("social GH¢1000 allowed, GH¢1000.01 not", m.flatMb(1000, "social") > 0 && m.flatMb(1000.01, "social") === 0);
check("video GH¢1 = 1/0.0063271 MB", near(m.flatMb(1, "video"), 1 / 0.0063271));
check("minSpendFor 1000 MB = GH¢14.06", minSpendFor(R.regular, 1000) === 14.06, String(minSpendFor(R.regular, 1000)));
check("minSpendFor 400 MB = GH¢3 (special)", minSpendFor(R.regular, 400) === 3, String(minSpendFor(R.regular, 400)));
check("minSpendFor 222,556 MB = GH¢399", minSpendFor(R.regular, 222556) === 399);
check("minSpendFor 222,557 MB not possible (max is 222,556.9)", minSpendFor(R.regular, 222557) === null);
check("bestSpendWithin GH¢3.50 picks GH¢3 special", bestSpendWithin(R.regular, 3.5)?.amount === 3);
check("bestSpendWithin GH¢99.95 picks GH¢99.90", bestSpendWithin(R.regular, 99.95)?.amount === 99.9);
check("bestSpendWithin GH¢450 picks GH¢399", bestSpendWithin(R.regular, 450)?.amount === 399);
check("corner amounts include both sides of the GH¢10 special", [9.99, 10, 10.01].every((a) => cornerAmounts(R.regular).includes(a)));
check("MTN computed regular data is no-expiry (MTN publishes it as non-expiry)", m.computedRegular.length > 0 && m.computedRegular.every((b) => b.kind === "noexpiry" && b.validity === "No expiry"));
check("MTN midnight shows its window and the expiry dispute, never 'no expiry'", m.computedMidnight.length > 0 && m.computedMidnight.every((b) => b.kind === "night" && b.validity === "12 AM–5 AM daily" && !neverExpires(b) && /expiry not clear – check with MTN/.test(m.validityText(b)) && !/no expiry/i.test(m.validityText(b))));
check("MTN bundles with unstated validity are never treated as no-expiry", m.bundles.filter((b) => b.network === "mtn" && /not stated/i.test(b.validity)).every((b) => !neverExpires(b) && !GROUPS[1].test(b)));

// ------------------------------------------------------------------ 4. Telecel Flexi
const FX = readFlexi(fx.telecelRates)!;
check("Flexi read: 4 no-expiry and 4 expiry bands", FX.noExpiry.length === 4 && FX.expiry.length === 4);
check("Flexi read: range GH¢0.02 to GH¢999.99", FX.range?.[0] === 0.02 && FX.range?.[1] === 999.99, String(FX.range));
check("Flexi read: array form works too", readFlexi({ flexi: (fx.telecelRates as any).flexi.bands })?.noExpiry.length === 4);
check("Flexi read: missing returns null", readFlexi({}) === null && readFlexi(undefined) === null);
const fq = (a: number) => F.flexiQuote(a);
const flexiEdges: [number, number | null, number | null, number | null][] = [
  [0.01, null, null, null], [0.02, 0.01, 0.008, 1], [4.99, 0.01, 0.008, 1], [5, 0.009, 0.006, 7], [49.99, 0.009, 0.006, 7],
  [50, 0.004, 0.003, 30], [399.99, 0.004, 0.003, 30], [400, 0.0015, 0.0012, 30], [999.99, 0.0015, 0.0012, 30], [1000, null, null, null],
];
for (const [a, ne, ex, days] of flexiEdges) {
  const q = fq(a);
  check(`Flexi at GH¢${a}: no-expiry ${ne}, expiry ${ex} (${days} d)`, (q.noExpiry?.ghsPerMb ?? null) === ne && (q.expiry?.ghsPerMb ?? null) === ex && (q.expiry?.days ?? null) === days, JSON.stringify(q));
}
check("Flexi GH¢400 no-expiry = 266,666.67 MB = 0.0015 x 1,024 = GH¢1.536/GB", near(fq(400).noExpiry!.mb, 400 / 0.0015) && near(F.costPerGb(F.sourceBundle(F.sources.find((s) => s.id === "telecel-flexi-noexpiry")!, 400)!), 1.536, 1e-9));
const flexRows = F.computed.filter((b) => b.network === "telecel");
check("Flexi computed rows are labelled with Telecel's rate", flexRows.length === 8 && flexRows.every((b) => b.computed && b.computedLabel === "Computed from Telecel's published rate"));
check("Flexi no-expiry rows are in 'Never expires' and 'All-day', not 'Lasts 30 days'",
  flexRows.filter((b) => b.kind === "noexpiry").every((b) => GROUPS[1].test(b) && GROUPS[0].test(b) && !GROUPS[2].test(b)));
check("Flexi 30-day rows are in 'Lasts 30 days' and 'All-day', not 'Never expires'",
  flexRows.filter((b) => b.days === 30).every((b) => GROUPS[2].test(b) && GROUPS[0].test(b) && !GROUPS[1].test(b)));
check("Flexi 1- and 7-day rows are in 'All-day' only",
  flexRows.filter((b) => b.days !== null && b.days < 30).every((b) => GROUPS[0].test(b) && !GROUPS[1].test(b) && !GROUPS[2].test(b)));
check("L2: Flexi row for GH¢400+ reads 'when you spend GH¢400 to GH¢999.99' (the band's own top)", F.spendScope(flexRows.find((b) => b.kind === "noexpiry" && b.band?.from === 400)!) === "when you spend GH¢400 to GH¢999.99");
check("Telecel GH¢500 budget picks the best Flexi option (expiry, 30 days)", (() => { const b = F.bestForBudget("telecel", 500); return !!b?.computed && b.days === 30 && near(b.mb, 500 / 0.0012); })(), F.bestForBudget("telecel", 500)?.name);
check("Telecel GH¢500 never-expires picks Flexi no-expiry", (() => { const b = F.bestForBudget("telecel", 500, { noExpiryOnly: true }); return !!b?.computed && b.kind === "noexpiry" && near(b.mb, 500 / 0.0015); })());
check("Telecel GH¢20 lasting 30+ days never picks a 7-day Flexi spend", (() => { const b = F.bestForBudget("telecel", 20, { minDays: 30 }); return !!b && (neverExpires(b) || (b.days ?? 0) >= 30); })(), F.bestForBudget("telecel", 20, { minDays: 30 })?.name);
check("Flexi beats the old headline when it is cheaper (fixture)", F.stats.cheapestAllDay[0]?.network === "telecel" && F.stats.cheapestAllDay[0]?.computed === true, F.stats.cheapestAllDay.map((b) => b.name).join(", "));
// The myMTN app's own displayed figures (mtnRates.app) reproduced from the
// tariff rates with MTN's 1,024-MB GB: the strongest check of the units rule.
const app = (R as any).app;
if (NEW_SCHEMA && app?.sections) {
  const norm = (t: string) => t.replace(/[\s,]/g, "").toUpperCase();
  let n = 0, bad: string[] = [];
  for (const sec of app.sections) for (const f of sec.fixed ?? []) {
    let mb = 0;
    if (sec.rates === "regular") mb = m.regularMb(f.price);
    else if (sec.rates === "midnight") mb = m.midnightMb(f.price);
    else if (sec.rates === "social" || sec.rates === "video") mb = m.flatMb(f.price, sec.rates);
    else { const b = m.bundles.find((x) => x.network === "mtn" && Math.abs(x.price - f.price) < 1e-9 && new RegExp(sec.title, "i").test(`${x.family} ${x.name}`)); mb = b?.mb ?? 0; }
    n++;
    const ours = m.fmtData(mb, "mtn");
    if (norm(ours) !== norm(f.shown)) bad.push(`${sec.title} GH¢${f.price}: app ${f.shown}, ours ${ours}`);
  }
  check(`real: every myMTN app figure reproduced exactly (${n} figures)`, n > 0 && bad.length === 0, bad.join("; "));
  for (const sec of app.sections) if (sec.flexi?.shownTo && sec.rates) {
    const t = sec.rates === "regular" ? m.regularMb(sec.flexi.to) : sec.rates === "midnight" ? m.midnightMb(sec.flexi.to) : m.flatMb(sec.flexi.to, sec.rates);
    check(`real: myMTN app ${sec.title} top (GH¢${sec.flexi.to}) shows ${sec.flexi.shownTo}`, norm(m.fmtData(t, "mtn")) === norm(sec.flexi.shownTo), m.fmtData(t, "mtn"));
  }
}
check("real: MTN Social and Video bundles are never all-day and never 'never expires'",
  m.bundles.filter((b) => b.kind === "social" || b.kind === "video").every((b) => !isAllDay(b) && !GROUPS.some((g) => g.test(b)) && !neverExpires(b)));
if (m.flexi) {
  const fr = m.flexi;
  const top = m.computed.filter((b) => b.network === "telecel" && b.band?.top);
  check("real: Flexi GH¢400+ collapses to one row per option", top.length === 2 && top.every((b) => b.band!.from === 400 && b.band!.to === 999.99), top.map((b) => b.name).join(", "));
  check("real: Flexi rows never repeat a rate for neighbouring spend ranges", ["telecel-flexi-noexpiry", "telecel-flexi-expiry"].every((id) => {
    const rows = m.computed.filter((b) => b.network === "telecel" && b.rateLabel === m.sources.find((x) => x.id === id)?.label).sort((a, b) => a.band!.from - b.band!.from);
    return rows.every((b, i) => i === 0 || !(Math.abs(b.price / b.mb - rows[i - 1].price / rows[i - 1].mb) < 1e-12 && b.days === rows[i - 1].days));
  }));
  check("real: Telecel Flexi has rates", fr.noExpiry.length + fr.expiry.length > 0);
  check("real: Telecel Flexi range starts at GH¢0.02 and ends at GH¢999.99", fr.range?.[0] === 0.02 && fr.range?.[1] === 999.99, String(fr.range));
  for (const t of [fr.noExpiry, fr.expiry]) for (const band of t) {
    const lo = band.exactly ?? (band.fromExclusive ? Math.round(((band.from ?? 0) + 0.01) * 100) / 100 : band.from!);
    const hi = band.exactly ?? band.to!;
    check(`real: Flexi band ${lo}-${hi} edges priced by its own rate`, rateFor(lo, t) === band.ghsPerMb && rateFor(hi, t) === band.ghsPerMb);
  }
}

// ------------------------------------------------------------------ 5. budget finder rules
for (const [label, mm] of [["real", m], ["fixture", F]] as const) {
  let badDefault = 0, badNight = 0, badNoExp = 0, overBudget = 0, badNightNe = 0, badDays = 0;
  for (let budget = 0.5; budget <= 600; budget += 0.5) for (const n of mm.networks) {
    const b = mm.bestForBudget(n, budget);
    if (b && (!isAllDay(b) || isConditional(b) || isPending(b) || hasConflict(b) || b.kind === "combo")) badDefault++;
    if (b && b.price > budget + 1e-9) overBudget++;
    const bn = mm.bestForBudget(n, budget, { nightOnly: true });
    if (bn && (bn.kind !== "night" || isPending(bn) || hasConflict(bn))) badNight++;
    const be = mm.bestForBudget(n, budget, { noExpiryOnly: true });
    if (be && !neverExpires(be)) badNoExp++;
    const bne = mm.bestForBudget(n, budget, { nightOnly: true, noExpiryOnly: true });
    if (bne && (bne.kind !== "night" || !neverExpires(bne))) badNightNe++;
    const bd = mm.bestForBudget(n, budget, { minDays: 30 });
    if (bd && !(neverExpires(bd) || (bd.days ?? 0) >= 30)) badDays++;
  }
  check(`${label}: bestForBudget default is all-day only (no night, Data Zone, combo, pending, disputed)`, badDefault === 0, String(badDefault));
  check(`${label}: bestForBudget never over budget`, overBudget === 0, String(overBudget));
  check(`${label}: night-only search returns night bundles only, never disputed`, badNight === 0, String(badNight));
  check(`${label}: never-expires search returns no-expiry only`, badNoExp === 0, String(badNoExp));
  check(`${label}: night + never-expires returns night bundles that never expire`, badNightNe === 0, String(badNightNe));
  check(`${label}: 30+ days never returns a shorter bundle`, badDays === 0, String(badDays));
}
check("night + never-expires no longer offers MTN Midnight (its expiry is disputed)", m.bestForBudget("mtn", 3, { nightOnly: true, noExpiryOnly: true }) === null && m.bestForBudget("mtn", 3, { nightOnly: true })?.family === "Midnight");
check("night + never-expires keeps a night bundle labelled 'No Expiry (12am–5am)' (fixture)", F.bestForBudget("telecel", 3, { nightOnly: true, noExpiryOnly: true })?.name === "TEST night no expiry");
check("night + never-expires drops AT Night (it expires)", !m.bestForBudget("at", 5, { nightOnly: true, noExpiryOnly: true }) || neverExpires(m.bestForBudget("at", 5, { nightOnly: true, noExpiryOnly: true })!));
{
  const nk = m.bundles.filter((b) => b.network === "telecel" && /night king/i.test(b.name));
  const says = (b: Bundle) => /no expiry/i.test(`${b.validity} ${(b as any).operatorValidity ?? ""}`) || /does not expire/i.test(m.doc.familyInfo.telecel?.[b.family] ?? "");
  check("Telecel Night King never-expires follows Telecel's own wording", nk.length > 0 && nk.every((b) => neverExpires(b) === says(b)), nk.map((b) => `${b.name}:${neverExpires(b)}`).join(", "));
  if (nk.some((b) => (b as any).operatorValidity)) {
    check("real: night + never-expires keeps Telecel Night King", /night king/i.test(m.bestForBudget("telecel", 3, { nightOnly: true, noExpiryOnly: true })?.name ?? ""), m.bestForBudget("telecel", 3, { nightOnly: true, noExpiryOnly: true })?.name);
    check("real: Night King validity shown with 'no expiry'", nk.every((b) => /no expiry/i.test(m.validityText(b))));
  }
}
check("MTN GH¢5 -> computed 521 MB", (() => { const b = m.bestForBudget("mtn", 5); return !!b?.computed && near(b.mb, 5 / 0.0095963); })());
check("AT GH¢5 never-expires -> BigTime GH¢5", m.bestForBudget("at", 5, { noExpiryOnly: true })?.name === "BigTime Data GH¢5");
check("MTN never-expires GH¢100 -> computed regular", (() => { const b = m.bestForBudget("mtn", 100, { noExpiryOnly: true }); return !!b?.computed && b.kind === "noexpiry" && b.price === 100; })());
check("fixture: pending, disputed and personalised bundles never picked", [1, 5, 50].every((bud) => F.networks.every((n) => { const b = F.bestForBudget(n, bud); return !b || !/^TEST (pending|conflict|conditional)/.test(b.name); })));
check("fixture: social/video data never picked as all-day", F.networks.every((n) => [1, 10].every((bud) => F.bestForBudget(n, bud)?.kind !== "social")));

// ------------------------------------------------------------------ 6. leaderboards
for (const [label, mm] of [["real", m], ["fixture", F]] as const) {
  for (const g of GROUPS) {
    const rows = mm.leaderboard(g.id);
    check(`${label} leaderboard ${g.id}: every row belongs to the group`, rows.length > 0 && rows.every(g.test), String(rows.length));
    check(`${label} leaderboard ${g.id}: sorted by cost per network GB`, rows.every((b, i) => i === 0 || mm.costPerGb(rows[i - 1]) <= mm.costPerGb(b) + 1e-12));
    const { ranked, disputed } = mm.leaderboardRows(g.id);
    check(`${label} leaderboard ${g.id}: ranked rows are never disputed, pending or personalised`, ranked.every((r) => !hasConflict(r.bundle) && !isPending(r.bundle) && !isConditional(r.bundle)));
    check(`${label} leaderboard ${g.id}: disputed rows are exactly the conflicts`, disputed.every(hasConflict));
    const keys = rows.filter((b) => b.computed).map((b) => `${b.network}|${b.rateLabel}|${b.band?.from}|${b.band?.to}`);
    check(`${label} leaderboard ${g.id}: one row per computed rate band (no clutter)`, new Set(keys).size === keys.length);
  }
  check(`${label}: no board contains a pending or personalised bundle`, GROUPS.every((g) => mm.leaderboard(g.id).every((b) => !isConditional(b) && !isPending(b))));
  check(`${label}: night never shares a board with all-day`, GROUPS.filter((g) => g.id !== "night").every((o) => mm.leaderboard("night").every((b) => !o.test(b))));
}
check("MTN Midnight collapses to one row per published band", m.leaderboard("night").filter((b) => b.network === "mtn").length === R.midnight.length, String(m.leaderboard("night").filter((b) => b.network === "mtn").length));
check("MTN Midnight band row shows its spend range", (() => { const b = m.leaderboard("night").find((x) => x.network === "mtn" && !x.band?.exact); return !!b && m.priceText(b) === `${m.money(0.01)} to ${m.money(2.99)}`; })());
check("fixture: disputed AT bundles listed under 'not ranked'", F.leaderboardRows("noexpiry").disputed.some((b) => b.name === "TEST conflict huge") && F.leaderboardRows("night").disputed.some((b) => b.name === "TEST conflict night"));
check("fixture: pending bundle is on its network's list but on no board", F.bundles.some((b) => b.name === "TEST pending huge") && GROUPS.every((g) => F.leaderboard(g.id).every((b) => b.name !== "TEST pending huge")));
const atNight = m.bundles.filter((b) => b.network === "at" && b.family === "Night Bundle");
// B: Edmund confirmed AT's live Night product page: its figures are used and ranked; the FAQ's version is shown beside them.
check("B: AT Night has no conflict and is ranked in Night only", atNight.length === 2 && atNight.every((b) => !hasConflict(b) && canWin(b) && m.leaderboardRows("night").ranked.some((r) => r.bundle === b)));
check("B: AT Night shows the product page's figures (4.5 GB / 7.5 GB, 12 AM–4 AM)", atNight.map((b) => `${m.money(b.price)}=${m.dataShown(b)}`).join() === "GH¢3=4.5 GB,GH¢5=7.5 GB" && atNight.every((b) => b.window === "12 AM–4 AM"));
check("B: AT Night carries AT's FAQ version as a visible note", atNight.every((b) => /^AT's FAQ \(updated 3 Mar 2026\) describes this differently: /.test(b.otherSource?.summary ?? "")) && /5 GB \+ 100 minutes for AT calls/.test(atNight[0].otherSource!.summary!) && /8 GB \+ unlimited AT calls/.test(atNight[1].otherSource!.summary!));
check("B: AT Night lists *111*4# from AT's Data Bundles page beside its own code", atNight.every((b) => b.altUssd?.code === "*111*4#" && /^\*111# then option 4/.test(b.ussd ?? "")));
check("B: AT Night per GB at 1,024 MB: GH¢3 / 4.5 = GH¢0.67, GH¢5 / 7.5 = GH¢0.67", atNight.every((b) => m.cpgShown(b) === "GH¢0.67"));
check("B: the night leaderboard and the 'Bundles whose figures ... dispute' line are no longer needed for AT", m.leaderboardRows("night").disputed.length === 0);

// ------------------------------------------------------------------ 7. ties (on the displayed GH¢10 value, redesign 1)
function tieDoc(atPrice: number): BundleModel {
  const d = clone(fx) as any;
  // Two test bundles far cheaper than anything real, 1,000 GB each: Telecel at GH¢100 (Every GH¢10 = 100.00 GB), AT at atPrice.
  const gbMb = 1000 * d.networks.telecel.mbPerGb;
  d.bundles.push(
    { network: "telecel", family: "TEST tie", name: "TEST tie telecel", price: 100, mb: gbMb, validity: "No expiry", days: null, kind: "noexpiry", ussd: null, source: "test" },
    { network: "at", family: "TEST tie", name: "TEST tie at", price: atPrice, mb: gbMb, validity: "No expiry", days: null, kind: "noexpiry", ussd: null, source: "test" },
  );
  return createBundleModel(d);
}
{
  // GH¢100.004 -> 99.996 GB shows "100.00 GB" (joint); GH¢100.006 -> 99.994 GB shows "99.99 GB" (single winner).
  const t1 = tieDoc(100.004), t2 = tieDoc(100.006);
  check("tie: both show Every GH¢10 = 100.00 GB = joint best", t1.stats.cheapestAllDay.length === 2 && t1.stats.cheapestAllDay.map((b) => b.network).sort().join() === "at,telecel");
  check("tie: 100.00 GB vs 99.99 GB = single winner", t2.stats.cheapestAllDay.length === 1 && t2.stats.cheapestAllDay[0].network === "telecel");
  const r1 = t1.leaderboardRows("allday").ranked;
  check("tie: joint rows share rank 1 and are flagged", r1[0].rank === 1 && r1[1].rank === 1 && r1[0].joint && r1[1].joint);
  const r2 = t2.leaderboardRows("allday").ranked;
  check("tie: non-tied rows get ranks 1 and 2", r2[0].rank === 1 && r2[1].rank === 2 && !r2[0].joint);
  check("tie rule: joint only when the GH¢10 value SHOWS the same", t1.valueText(r1[0].bundle) === "100.00 GB" && t1.valueText(r1[1].bundle) === "100.00 GB" && t2.valueText(r2[0].bundle) === "100.00 GB" && t2.valueText(r2[1].bundle) === "99.99 GB");
}
check("real: hero co-winners show exactly the same GH¢10 value",
  [m.stats.cheapestAllDay, m.stats.cheapestNoExpiry, m.stats.cheapestNight].every((list) => list.every((b) => m.valueText(b) === m.valueText(list[0]))));
check("real: hero figures never use disputed, pending or personalised bundles",
  [...m.stats.cheapestAllDay, ...m.stats.cheapestNoExpiry, ...m.stats.cheapestNight, ...(m.stats.biggestAllDay ? [m.stats.biggestAllDay] : [])].every((b) => !hasConflict(b) && !isPending(b) && !isConditional(b)));

// ------------------------------------------------------------------ 8. monthly planner
// The historical expectations below were set with up to 12 purchases; the
// planner's default is now 3, so they pass the cap explicitly.
const plan = (mm: BundleModel, n: string, mb: number, cap: number = MAX_PURCHASES) => mm.cheapestMonthlyPlan(n, mb, cap)!;
const mtn3 = plan(m, "mtn", 3000);
// Audit 6: Pulse (no expiry) is now a planner source: GH¢23.91 -> GH¢23.74 (a GH¢0.74 Pulse top-up).
check("MTN 3,000 MB/month = GH¢23.74 with a Pulse top-up (was GH¢23.91 before Pulse was ranked)", mtn3.total === 23.74 && mtn3.mb >= 3000 && mtn3.items.some((i) => i.bundle.family === "Pulse"), desc(mtn3));
const mtn5 = plan(m, "mtn", 5000);
check("MTN 5,000 MB/month = GH¢38.94 (audit M1)", mtn5.total === 38.94 && mtn5.mb >= 5000, desc(mtn5));
check("MTN 1,000 MB = GH¢9 (3x GH¢3 special)", plan(m, "mtn", 1000).total === 9, desc(plan(m, "mtn", 1000)));
check("MTN 1,500 MB = GH¢12", plan(m, "mtn", 1500).total === 12, desc(plan(m, "mtn", 1500)));
check("MTN 300,000 MB = GH¢699 (GH¢399 + GH¢300)", plan(m, "mtn", 300000).total === 699, desc(plan(m, "mtn", 300000)));
// At 1,024 MB per GB, BigTime GH¢50 (4.5 GB) is 4,608 MB, so 12 purchases now beat the Family Pack: 4,608 + 7 x 557 + 4 x 390 = 10,067 MB for GH¢97.
check("AT 10,000 MB with up to 12 purchases = GH¢97 (BigTime 50 + 7x5 + 4x3), checked by brute force", plan(m, "at", 10000).total === 97 && brute(m, "at", 10000, 9700) === 97, desc(plan(m, "at", 10000)));
check("AT 10,000 MB in one purchase = GH¢99 Family Pack (12.8 GB)", plan(m, "at", 10000, 1).total === 99 && plan(m, "at", 10000, 1).items[0].bundle.family === "Family Pack (XXL)", desc(plan(m, "at", 10000, 1)));
check("AT 1,000 MB = GH¢9 (3x BigTime GH¢3)", plan(m, "at", 1000).total === 9, desc(plan(m, "at", 1000)));
for (const [label, mm] of [["real", m], ["fixture", F]] as const) {
  const needs = [300, 1000, 5000, 25000, 100000, 250000];
  for (const cap of PURCHASE_CAPS) {
    check(`${label} cap ${cap}: every plan covers the need`, needs.every((mb) => mm.networks.every((n) => { const p = mm.cheapestMonthlyPlan(n, mb, cap); return !p || p.mb + 1e-6 >= mb; })));
    check(`${label} cap ${cap}: plan totals equal the sum of their purchases`, needs.every((mb) => mm.networks.every((n) => { const p = mm.cheapestMonthlyPlan(n, mb, cap); return !p || Math.round(p.items.reduce((s, i) => s + i.count * Math.round(i.bundle.price * 100), 0)) === Math.round(p.total * 100); })));
    check(`${label} cap ${cap}: plans use at most ${cap} purchases, and say how many`, needs.every((mb) => mm.networks.every((n) => { const p = mm.cheapestMonthlyPlan(n, mb, cap); return !p || (p.items.reduce((s, i) => s + i.count, 0) <= cap && p.purchases === p.items.reduce((s, i) => s + i.count, 0) && p.maxPurchases === cap); })));
    check(`${label} cap ${cap}: plans only use month-long, rankable, undisputed bundles`, [500, 2000, 8000, 50000, 300000].every((mb) => mm.networks.every((n) => { const p = mm.cheapestMonthlyPlan(n, mb, cap); return !p || p.items.every((i) => (neverExpires(i.bundle) || (i.bundle.days ?? 0) >= 30) && isAllDay(i.bundle) && !hasConflict(i.bundle)); })));
  }
  check(`${label}: a higher cap never costs more`, needs.every((mb) => mm.networks.every((n) => { const t = PURCHASE_CAPS.map((c) => mm.cheapestMonthlyPlan(n, mb, c)?.total ?? Infinity); return t.every((x, i) => i === 0 || x <= t[i - 1] + 1e-9); })));
  check(`${label}: default cap is ${DEFAULT_PURCHASES}`, DEFAULT_PURCHASES === 3 && mm.networks.every((n) => mm.cheapestMonthlyPlan(n, 5000)?.maxPurchases === 3 || mm.cheapestMonthlyPlan(n, 5000) === null));
}
check("fixture: Telecel plans use Flexi expiry only where it lasts 30+ days", [500, 3000, 20000, 150000].every((mb) => plan(F, "telecel", mb).items.every((i) => !i.bundle.computed || i.bundle.kind === "noexpiry" || (i.bundle.days ?? 0) >= 30)));
check("fixture: Telecel 150 GB plan uses Flexi (cheaper than fixed)", plan(F, "telecel", 150000).items.some((i) => i.bundle.computed), desc(plan(F, "telecel", 150000)));

// Independent brute force at pesewa resolution: ANY spend on the month-long
// any-amount tables plus every month-long fixed bundle, up to 12 purchases.
// It does not use the corner-point argument the planner relies on.
function brute(mm: BundleModel, n: string, need: number, capP: number, K: number = MAX_PURCHASES): number {
  const anyMb = new Float64Array(capP + 1);
  for (const { s, ok } of mm.monthlySources(n)) for (let p = 1; p <= capP; p++) anyMb[p] = Math.max(anyMb[p], mbFromTable(p / 100, s.table, ok));
  const fixed = mm.bundles.filter((b) => b.network === n && mm.lastsAMonth(b)).map((b) => ({ p: Math.round(b.price * 100), mb: b.mb }));
  let prev = new Float64Array(capP + 1);
  for (let k = 1; k <= K; k++) {
    const cur = Float64Array.from(prev);
    for (let c = 1; c <= capP; c++) {
      let best = cur[c];
      for (let p = 1; p <= c; p++) { const x = prev[c - p] + anyMb[p]; if (x > best) best = x; }
      for (const f of fixed) if (f.p <= c) { const x = prev[c - f.p] + f.mb; if (x > best) best = x; }
      cur[c] = best;
    }
    prev = cur;
  }
  for (let c = 0; c <= capP; c++) if (prev[c] + 1e-9 >= need) return c / 100;
  return Infinity;
}
let bfBad = 0;
const t0b = Date.now();
let bfCases = 0;
const bfList = [[m, "mtn", 700], [m, "mtn", 1500], [m, "mtn", 3000], [m, "mtn", 5000], [m, "at", 3000], [m, "at", 1200], [F, "telecel", 800], [F, "telecel", 2500], [F, "telecel", 4000], [F, "mtn", 3072]] as [BundleModel, string, number][];
for (const cap of PURCHASE_CAPS) for (const [mm, n, need] of bfList) {
  const p = mm.cheapestMonthlyPlan(n, need, cap);
  bfCases++;
  if (!p) {
    // Impossible under this cap: brute force must agree (search to a generous budget).
    const b = brute(mm, n, need, 20000, cap);
    if (Number.isFinite(b)) { bfBad++; console.log(`  brute ${n} ${need} cap ${cap}: planner says impossible, brute ${b}`); }
    continue;
  }
  const b = brute(mm, n, need, Math.round(p.total * 100), cap);
  if (Math.abs(b - p.total) > 1e-9) { bfBad++; console.log(`  brute ${n} ${need} cap ${cap}: plan ${desc(p)} vs brute ${b}`); }
}
check(`planner equals an independent pesewa-level brute force under every cap (${bfCases} cases: caps ${PURCHASE_CAPS.join(", ")})`, bfBad === 0, `${bfBad} mismatches, ${Date.now() - t0b} ms`);
if (m.flexi) {
  let bfReal = 0;
  for (const cap of PURCHASE_CAPS) for (const need of [800, 2500, 4000]) {
    const p = plan(m, "telecel", need, cap);
    const b = brute(m, "telecel", need, Math.round(p.total * 100), cap);
    if (Math.abs(b - p.total) > 1e-9) { bfReal++; console.log(`  brute real telecel ${need} cap ${cap}: ${desc(p)} vs ${b}`); }
  }
  check("real: Telecel (with Flexi) planner equals brute force under every cap", bfReal === 0, String(bfReal));
}
const t0 = Date.now();
for (let gb = 0.5; gb <= 300; gb += 0.5) for (const mm of [m, F]) for (const n of mm.networks) for (const cap of PURCHASE_CAPS) mm.cheapestMonthlyPlan(n, gb * mm.mbPerGb(n), cap);
const ms = Date.now() - t0;
check("planner is fast enough for a slider (600 needs x 3 networks x 2 datasets x 3 caps < 6s)", ms < 6000, `${ms} ms`);

// ------------------------------------------------------------------ 9. Bossu Weekly Extra
const bossu = m.bundles.find((b) => b.network === "telecel" && b.name === "Bossu Weekly Extra");
if (bossu && bossu.kind === "anytime") {
  check("Bossu Weekly Extra is data: in All-day, not in Calls + data", GROUPS[0].test(bossu) && !GROUPS[4].test(bossu));
} else if (bossu) {
  check("Bossu Weekly Extra (old dataset, still combo) stays in Calls + data only", GROUPS[4].test(bossu) && !GROUPS[0].test(bossu));
}

// ------------------------------------------------------------------ 10. out of bundle
check("MTN out-of-bundle from mtnRates", m.outOfBundle("mtn")?.perMb === R.outOfBundlePerMb);
check("fixture: AT out-of-bundle GH¢0.18/MB from atRates", F.outOfBundle("at")?.perMb === 0.18);
check("fixture: Telecel PAYG GH¢0.115/MB from telecelRates", F.outOfBundle("telecel")?.perMb === 0.115 && /pay-as-you-go/.test(F.outOfBundle("telecel")!.label));
check("per-MB rates keep 4 decimals (GH¢0.1145, not GH¢0.11)", m.rate(0.1145) === "GH¢0.1145" && m.rate(0.18) === "GH¢0.18");
check("fixture: MTN out-of-bundle per GB uses 1,024 MB", near(F.outOfBundle("mtn")!.perMb * F.mbPerGb("mtn"), R.outOfBundlePerMb * 1024, 1e-9));
const atR = doc.atRates as any, telR = doc.telecelRates as any;
if (atR?.outOfBundlePerMb) check("real: AT out-of-bundle shown from atRates", m.outOfBundle("at")?.perMb === atR.outOfBundlePerMb);
if (telR) check("real: Telecel PAYG rate found when published", !(telR.paygPerMb || telR.payg || telR.outOfBundlePerMb) || !!m.outOfBundle("telecel"));
if (telR?.outOfBundlePerMb) check("real: Telecel pay-as-you-go GH¢0.115/MB", m.outOfBundle("telecel")?.perMb === telR.outOfBundlePerMb && /pay-as-you-go/.test(m.outOfBundle("telecel")!.label));
if (atR?.outOfBundlePerMb) check("real: AT pay-as-you-go GH¢0.18/MB", m.outOfBundle("at")?.perMb === 0.18);
check("real: every network fact is shown whole: its per-GB figures are backed by the data at 1,024 MB", m.networks.every((n) => m.factText(n) === (m.doc.networkFacts[n] ?? null)), m.networks.map((n) => m.factText(n)).join(" | "));
check("real: the MTN fact's GH¢117.25 per GB is GH¢0.1145 x 1,024", /GH¢117\.25 per GB/.test(m.factText("mtn") ?? "") && m.money(0.1145 * m.mbPerGb("mtn")) === "GH¢117.25");
{
  const bad = clone(doc) as any;
  bad.networkFacts.mtn = "With no bundle, MTN charges GH¢0.1145 per MB, about GH¢114.50 per GB. Always buy a bundle first.";
  bad.networkFacts.telecel = "Telecel PAYG is 11.5p per MB, GH¢115 per GB. Confirm on telecel.com.gh.";
  const B = createBundleModel(bad);
  check("a per-GB sentence the data does not back (the old x 1,000 figure) is dropped, the rest kept", B.factText("mtn") === "Always buy a bundle first." && B.factText("telecel") === "Confirm on telecel.com.gh.", `${B.factText("mtn")} | ${B.factText("telecel")}`);
  bad.networkFacts.telecel = "Telecel PAYG is 11.5p per MB, GH¢117.76 per GB.";
  check("a per-GB sentence at 1,024 MB is kept for Telecel too (0.115 x 1,024 = GH¢117.76)", createBundleModel(bad).factText("telecel") === bad.networkFacts.telecel);
}

// ------------------------------------------------------------------ 11. counts and claims
check("fixed bundle count = verified mobile bundles in the data", m.stats.fixedCount === doc.bundles.filter((b) => (b.kind as string) !== "router" && !b.pending && !b.unconfirmed).length, String(m.stats.fixedCount));
check("fixture: pending bundles counted separately", F.stats.pendingCount === 1 && F.stats.fixedCount === F.bundles.length - 1 - F.bundles.filter(isUnconfirmed).length);
check("family count = families listed on the network pages", m.stats.familyCount === m.networks.reduce((s, n) => s + m.familiesOf(n).length, 0));
check("every bundle's family is listed for its network", m.bundles.every((b) => m.familiesOf(b.network).includes(b.family)));
check("share scope for a fixed winner names price and validity", (() => { const b = m.stats.cheapestAllDay[0]; return !!b && (b.band ? /when you spend/.test(m.dealText(b)) : m.dealText(b).includes(m.money(b.price))); })(), m.stats.cheapestAllDay[0] && m.dealText(m.stats.cheapestAllDay[0]));
check("fixture: share scope for Flexi reads 'when you spend GH¢400 to GH¢999.99'", (() => { const b = F.stats.cheapestAllDay[0]; return !!b && /when you spend GH¢400 to GH¢999\.99$/.test(F.dealText(b)); })(), F.stats.cheapestAllDay[0] && F.dealText(F.stats.cheapestAllDay[0]));

// ------------------------------------------------------------------ 12. prebuild script (H1/L8), against a local fake server
// `now` is the prebuild's clock (FETCH_BUNDLES_NOW) so the future-date guard (audit 7, M4) is tested at a fixed time;
// the older cases run "after" their 2099 rows. `checkedAt` is the row's checked_at.
// The fake server answers both sources: /storage/data-bundles/<country>-latest.json (the site's static copy,
// one row object) and PostgREST (an array). opts.file / opts.db: "same" (this row), "off" (404), or a row
// { data, captured_at, checked_at } of its own.
type FakeRow = { data: unknown; captured_at: string; checked_at: string | null };
async function prebuildCase(name: string, rowData: unknown, rowCapturedAt: string, expectChange: boolean, expectLog: RegExp, now = "2099-01-02T00:00:00Z", checkedAt = "2030-01-01T00:00:00Z", opts: { file?: "same" | "off" | FakeRow; db?: "same" | "off" | FakeRow } = {}) {
  const dir = join(tmpdir(), `tt-bundles-${process.pid}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(dir, "src/data"), { recursive: true });
  const file = join(dir, "src/data/ghanaDataBundles.json");
  writeFileSync(file, rawText);
  const base: FakeRow = { data: rowData, captured_at: rowCapturedAt, checked_at: checkedAt };
  const pick = (o: "same" | "off" | FakeRow | undefined) => (o === "off" ? null : o && o !== "same" ? o : base);
  const server = createServer((req, res) => {
    const isFile = (req.url ?? "").startsWith("/storage/data-bundles/");
    const row = pick(isFile ? opts.file : opts.db);
    if (!row) { res.statusCode = 404; res.setHeader("content-type", "text/html"); res.end("<!doctype html>"); return; }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(isFile ? { id: 1, content_hash: "x", ...row } : [row]));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as { port: number }).port;
  // Asynchronous on purpose: a blocking spawn would stall the fake server.
  const run = await new Promise<{ out: string }>((resolve) => {
    const ch = spawn(process.execPath, [join(ROOT, "scripts/fetch-data-bundles.mjs")], { cwd: dir, env: { ...process.env, VITE_SUPABASE_URL: `http://127.0.0.1:${port}`, VITE_SUPABASE_PUBLISHABLE_KEY: "test", DATA_BUNDLES_FILE_BASE: `http://127.0.0.1:${port}`, FETCH_BUNDLES_NOW: now } });
    let out = "";
    ch.stdout.on("data", (d) => (out += d)); ch.stderr.on("data", (d) => (out += d));
    ch.on("close", () => resolve({ out }));
  });
  server.close();
  const after = readFileSync(file, "utf8");
  const changed = after !== rawText;
  check(`prebuild: ${name}`, changed === expectChange && expectLog.test(run.out) && (!changed || !("checkedAt" in JSON.parse(after))), run.out.trim().split("\n").pop());
  rmSync(dir, { recursive: true, force: true });
}
{
  const same = { ...clone(doc), checkedAt: "2030-01-01T00:00:00Z" };
  await prebuildCase("same content, newer check time -> file untouched (no checkedAt churn)", same, "2030-01-01T00:00:00Z", false, /same content/);
  const differs = clone(doc); differs.bundles[0] = { ...differs.bundles[0], mb: differs.bundles[0].mb + 1 };
  // Item 3: the row's captured_at timestamp decides, so a later capture on the same day wins.
  await prebuildCase("differs, captured later the same day (row timestamp) -> UPDATED", differs, new Date(Math.min(captureTime(doc.capturedAt) + 1000, Date.parse(`${String(doc.capturedAt).slice(0, 10)}T23:59:59Z`))).toISOString(), true, /UPDATED/);
  const olderRow = new Date(captureTime(doc.capturedAt) - 3600_000).toISOString();
  await prebuildCase("differs, row captured BEFORE the committed file -> KEPT with a warning", differs, olderRow, false, /not strictly newer/);
  const newer = { ...clone(differs), capturedAt: "2099-01-01", checkedAt: "2099-01-02" };
  await prebuildCase("strictly newer and valid -> UPDATED, without checkedAt", newer, "2099-01-01T00:00:00Z", true, /UPDATED/);
  const newerPartial = { ...clone(newer), bundles: clone(newer).bundles.filter((b: Bundle) => b.network !== "at") };
  await prebuildCase("newer but partial -> KEPT", newerPartial, "2099-01-01T00:00:00Z", false, /PARTIAL|FAILED the schema checks \(network at has no bundles\)/);
  const newerBad = clone(newer); newerBad.bundles[0].price = -1;
  await prebuildCase("newer but fails schema -> KEPT", newerBad, "2099-01-01T00:00:00Z", false, /FAILED the schema/);
  // Step 1 (19 Oct 2026): the site's static file, read first; the newer of file and database wins.
  await prebuildCase("site file only (database down) -> UPDATED from the file", newer, "2099-01-01T00:00:00Z", true, /using the row from the site's static file[\s\S]*UPDATED/, undefined, undefined, { db: "off" });
  await prebuildCase("database only (file missing: SPA fallback HTML) -> UPDATED from the database", newer, "2099-01-01T00:00:00Z", true, /(HTTP 404 from|is not JSON)[\s\S]*using the row from the database[\s\S]*UPDATED/, undefined, undefined, { file: "off" });
  await prebuildCase("file checked later than the database row -> the file's row is used", newer, "2099-01-01T00:00:00Z", true, /using the row from the site's static file/, undefined, undefined, { db: { data: same, captured_at: "2026-01-01T00:00:00Z", checked_at: "2026-01-01T00:00:00Z" } });
  await prebuildCase("a partial row from the file gets the same guard -> KEPT", newerPartial, "2099-01-01T00:00:00Z", false, /using the row from the site's static file[\s\S]*(PARTIAL|FAILED the schema)/, undefined, undefined, { db: "off" });
  await prebuildCase("file dated in the future -> KEPT (same future-date guard)", newer, "2099-01-03T00:00:00Z", false, /FUTURE/, "2099-01-02T00:00:00Z", "2099-01-03T00:00:00Z", { db: "off" });
  await prebuildCase("neither source -> KEPT", newer, "2099-01-01T00:00:00Z", false, /no snapshot from the site's file or the database/, undefined, undefined, { file: "off", db: "off" });
}

// ------------------------------------------------------------------ 13. second audit (items 1-14)
{
  const uiDir = join(ROOT, "src/components/data-bundles");
  const read = (f: string) => readFileSync(join(uiDir, f), "utf8");

  // Item 1: interactive outputs render the final value directly (browser tests prove the visible text).
  for (const f of ["BudgetFinder.tsx", "MonthlyPlanner.tsx", "MtnCalculators.tsx", "TelecelFlexiCalculator.tsx", "Leaderboards.tsx", "BundleTable.tsx"]) {
    check(`item 1: ${f} never uses CountUp (interactive output renders format(value) directly)`, !/<CountUp\b/.test(read(f)));
  }
  const shared = read("shared.tsx");
  check("item 1: CountUp shows format(value) whenever no count is in flight", /inFlight && inFlight\.target === value && reduce === false \? format\(inFlight\.n\) : format\(value\)/.test(shared));
  check("item 1 (round 8): CountUp never counts from 0: final value at once; a change rolls from the OLD value in at most 0.5 s",
    /if \(from === value \|\| reduce !== false\) return;/.test(shared) && /animate\(from, value, \{ duration: ROLL_SECONDS/.test(shared) && /export const ROLL_SECONDS = 0\.35;/.test(shared) && !/animate\(0,/.test(shared));

  // Item 2: contentKey ignores exactly what the checker's hash ignores.
  // A re-check one hour after the dataset's own capture (dates derived from the data, so a newer dataset keeps this valid).
  const laterIso = new Date(captureTime(doc.capturedAt) + 3600e3).toISOString().replace(/\.\d{3}Z$/, "Z");
  const touched = { ...clone(doc), capturedAt: laterIso, checkedAt: laterIso, verification: String(doc.verification) + " (re-run)" };
  check("item 2: contentKey ignores capturedAt, checkedAt and verification", contentKey(touched) === contentKey(doc));
  check("item 2: contentKey still sees a changed bundle", contentKey({ ...touched, bundles: [{ ...doc.bundles[0], mb: doc.bundles[0].mb + 1 }, ...doc.bundles.slice(1)] }) !== contentKey(doc));
  const NOW23 = Date.parse("2099-01-01T00:00:00Z");
  const rs = (b: any, r: any) => resolveSnapshot(b, r, NOW23);
  const sameRow = { data: touched, captured_at: laterIso, checked_at: laterIso };
  const res = rs(doc, sameRow);
  check("item 2: same figures, newer check -> 'Prices checked' advances to the row's checked_at", !!res && res.freshness.checkedAt === sameRow.checked_at && res.freshness.source === "live");
  check("item 2: same figures -> Sources shows the row's verification text", !!res && res.doc.verification === touched.verification);
  check("item 2: same figures -> the bundled figures are kept", !!res && contentKey(res.doc) === contentKey(doc) && res.doc.bundles === doc.bundles);
  // Times derived from the dataset's own capture (a newer dataset keeps these valid).
  const isoAt = (ms: number) => new Date(captureTime(doc.capturedAt) + ms).toISOString().replace(/\.\d{3}Z$/, "Z");
  const dayLater = isoAt(25 * 3600e3);
  const nextDay = rs(doc, { ...sameRow, checked_at: dayLater, data: { ...touched, verification: `${doc.verification} Checked a day later.` } });
  check("item 2: every later successful check advances again", !!nextDay && nextDay.freshness.checkedAt === dayLater && nextDay.doc.verification === `${doc.verification} Checked a day later.`);
  check("item 2: an OLDER check never moves freshness back", rs(doc, { ...sameRow, checked_at: isoAt(-17 * 24 * 3600e3) }) === null);

  // Item 3: newness by the row's captured_at timestamp vs the bundled capturedAt.
  const day = String(doc.capturedAt).slice(0, 10);
  const changed = clone(doc); changed.bundles[0] = { ...changed.bundles[0], price: Math.round(changed.bundles[0].price * 110) / 100 };
  const laterTs = new Date(Math.min(captureTime(doc.capturedAt) + 3600_000, Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10), 23, 59, 59))).toISOString();
  const later = rs(doc, { data: changed, captured_at: laterTs, checked_at: laterTs });
  const dateOnlyBase = { ...clone(doc), capturedAt: day } as BundleDataset;
  const changedDO = { ...clone(changed), capturedAt: day };
  check("item 3: date-only bundled capturedAt: a row captured at 15:30 that day replaces it", !!rs(dateOnlyBase, { data: changedDO, captured_at: `${day}T15:30:00+00:00`, checked_at: null }));
  const isoBase = { ...clone(doc), capturedAt: `${day}T12:00:00Z` } as BundleDataset;
  check("item 3: a row captured later the SAME day with different content replaces the bundled data", !!later && later.doc === changed);
  check("item 3: an older row with different content never replaces it", rs(doc, { data: changed, captured_at: new Date(captureTime(doc.capturedAt) - 1000).toISOString(), checked_at: null }) === null);
  check("item 3: ISO bundled capturedAt: a row 1 s later wins, 1 s earlier loses",
    !!rs(isoBase, { data: changed, captured_at: `${day}T12:00:01Z`, checked_at: null }) && rs(isoBase, { data: changed, captured_at: `${day}T11:59:59Z`, checked_at: null }) === null);
  check("item 3: date-only capturedAt = start of day UTC", captureTime("2026-10-17") === Date.UTC(2026, 9, 17));
  check("item 3: a timestamp without a zone is read as UTC", captureTime("2026-10-17T10:00:00") === Date.UTC(2026, 9, 17, 10));
  check("item 3: offsets are honoured", captureTime("2026-10-17T10:00:00+01:00") === Date.UTC(2026, 9, 17, 9));
  check("item 3: a row without captured_at falls back to its data's capturedAt", isStrictlyNewer({ captured_at: null, data: { capturedAt: "2099-01-01" } }, doc) && !isStrictlyNewer({ captured_at: null, data: { capturedAt: "2000-01-01" } }, doc));
  check("item 3: a partial row is never used, however new", resolveSnapshot(doc, { data: { ...changed, bundles: changed.bundles.filter((b: Bundle) => b.network !== "at") }, captured_at: "2099-01-01T00:00:00Z", checked_at: null }) === null);

  // Item 4: joint only when the DISPLAYED amounts are identical.
  const pick = (mm: BundleModel, bud: number) => mm.networks.map((n) => ({ n, b: mm.bestForBudget(n, bud) }));
  const at1 = m.bestForBudget("at", 1), tel1 = m.bestForBudget("telecel", 1);
  check("item 4: auditor case GH¢1: AT 51 MB vs Telecel 55.87 MB is NOT joint", !!at1 && !!tel1 && m.dataShown(at1) === "51 MB" && m.dataShown(tel1) === "55.87 MB" && [...m.mostData(pick(m, 1))].join() === "telecel", [...m.mostData(pick(m, 1))].join());
  let jointClaims = 0, jointWrong = 0, winnerWrong = 0;
  for (const mm of [m, F]) for (let bud = 0.5; bud <= 600; bud += 0.5) {
    const ps = pick(mm, bud); const lead = [...mm.mostData(ps)];
    const shown = lead.map((n) => mm.dataShown(ps.find((p) => p.n === n)!.b!));
    if (lead.length > 1) { jointClaims++; if (!shown.every((s) => sameText(s, shown[0]))) jointWrong++; }
    // No non-winner may show a bigger amount in the same unit as the winner.
    const w = ps.find((p) => p.n === lead[0])?.b;
    for (const p of ps) if (w && p.b && !lead.includes(p.n)) {
      const a = mm.dataShown(w), o = mm.dataShown(p.b);
      const unit = (t: string) => t.trim().split(" ").pop(); const val = (t: string) => parseFloat(t.replace(/,/g, ""));
      if (unit(a) === unit(o) && val(o) >= val(a)) winnerWrong++;
    }
  }
  check(`item 4: every 'joint most data' shows identical amounts (${jointClaims} joint claims, budgets 0.50-600, real + fixture)`, jointWrong === 0, `${jointWrong} wrong`);
  check("item 4: no runner-up ever shows a bigger or equal amount in the same unit as the sole winner", winnerWrong === 0, `${winnerWrong} wrong`);
  let lbWrong = 0, lbMissed = 0;
  for (const mm of [m, F]) for (const g of GROUPS) {
    const { ranked } = mm.leaderboardRows(g.id);
    for (let i = 0; i < ranked.length; i++) {
      const same = ranked.filter((r) => r.rank === ranked[i].rank);
      if (ranked[i].joint && !same.every((r) => mm.tieText(r.bundle) === mm.tieText(ranked[i].bundle))) lbWrong++;
      // Audit 9 L4: the same shown figure at the same price with different data is NOT a tie (more data ranks higher).
      const samePriceMoreData = i > 0 && Math.abs(ranked[i].bundle.price - ranked[i - 1].bundle.price) < 1e-9 && Math.abs(ranked[i].bundle.mb - ranked[i - 1].bundle.mb) > 1e-9;
      if (i > 0 && mm.tieText(ranked[i].bundle) === mm.tieText(ranked[i - 1].bundle) && !samePriceMoreData && ranked[i].rank !== ranked[i - 1].rank) lbMissed++;
      if (samePriceMoreData && (ranked[i].rank === ranked[i - 1].rank || ranked[i].bundle.mb > ranked[i - 1].bundle.mb)) lbMissed++;
    }
    const ties = mm.cheapestTies(g.test);
    if (ties.some((b) => mm.tieText(b) !== mm.tieText(ties[0]))) lbWrong++;
  }
  check("item 4: every joint rank and joint best shows an identical GH¢10 value", lbWrong === 0, String(lbWrong));
  check("item 4: rows that show the same GH¢10 value share a rank, except same price with different data (more data first, no tie)", lbMissed === 0, String(lbMissed));
  {
    const plans = [{ n: "a", p: { total: 10.004 } }, { n: "b", p: { total: 10.001 } }, { n: "c", p: { total: 10.01 } }] as any;
    check("item 4: planner 'joint cheapest' only when totals show the same (GH¢10 vs GH¢10 vs GH¢10.01)", [...m.cheapestTotals(plans)].sort().join() === "a,b");
  }

  // Item 5: time-restricted combos are listed, never ranked.
  const bw = m.bundles.find((b) => b.network === "telecel" && /bossu weekend/i.test(b.name));
  if (bw) {
    check(`item 5: Telecel Bossu Weekend is time-restricted (window '${bw.window ?? ""}', days ${bw.days}), whatever its days count`, isTimeRestricted(bw));
    check("item 5: Bossu Weekend is not in the Calls + data ranking", !GROUPS[4].test(bw) && m.leaderboardRows("combo").ranked.every((r) => r.bundle !== bw));
    check("item 5: Bossu Weekend is in the combo board's time-restricted list", m.leaderboardRows("combo").restricted.includes(bw));
    check("item 5: Bossu Weekend never tops anything", ![...m.stats.cheapestAllDay, ...m.stats.cheapestNoExpiry, ...m.stats.cheapestNight].includes(bw));
  }
  const weekendAnytime = { network: "telecel", family: "TEST", name: "TEST weekend anytime", price: 1, mb: 999999, validity: "Saturday & Sunday", days: 2, kind: "anytime", ussd: null, source: "test" } as Bundle;
  check("item 5: an 'anytime' bundle valid only on some days is not all-day and goes to the restricted list", !isAllDay(weekendAnytime) && !!restrictedTest("allday")?.(weekendAnytime));
  for (const v of ["Sundays only", "Weekends", "Mon–Fri", "4 AM–7 AM", "5am - 8am", "12 AM to 5 AM"]) check(`item 5: '${v}' is a day or time window`, isTimeRestricted({ kind: "anytime", validity: v }));
  for (const v of ["30 days", "No expiry", "1 day", "Not stated by MTN", "Monthly", "15 days", "1 hour", "Not stated on tariff page"]) check(`item 5: '${v}' is NOT a day or time window`, !isTimeRestricted({ kind: "anytime", validity: v }));

  // Item 6: the bundle table's default order.
  for (const n of m.networks) {
    const rows = m.bundles.filter((b) => b.network === n);
    const order = TABLE_SECTIONS.map((s) => s.id);
    const seq = rows.map(tableSection).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const first = rows.filter((b) => tableSection(b) === seq[0]).sort((a, b) => m.costPerGb(a) - m.costPerGb(b))[0];
    // A network whose fixed bundles include all-day data opens with it. MTN sells its all-day data
    // by amount (the calculator), and Xtrabyte is borrowed data, so MTN's table has no all-day group.
    const hasAllDay = rows.some((b) => isAllDay(b) && canWin(b));
    check(`item 6: ${n} table opens with all-day data when it has any`, hasAllDay ? seq[0] === "allday" && isAllDay(first) && canWin(first) : !seq.includes("allday"), first?.name);
    check(`item 6: ${n} night, morning, hourly and restricted rows are never in the all-day group`, rows.filter((b) => ["night", "morning", "hourly"].includes(b.kind) || isTimeRestricted(b)).every((b) => tableSection(b) !== "allday"));
    check(`item 6: ${n} disputed, personalised, pending and unconfirmed rows are always in the last group`, rows.filter((b) => !canWin(b) && hasVolume(b) || isPending(b) || isUnconfirmed(b)).every((b) => tableSection(b) === "unranked"));
  }
  check("item 6: the not-ranked group is the last section", TABLE_SECTIONS[TABLE_SECTIONS.length - 1].id === "unranked");
  // Round 12: the list is grouped by family (families ordered by type, all-day first), so the default sort says so.
  check("item 6: the default sort is named for what it does", /\{ id: "grouped", label: "By family" \}/.test(read("BundleTable.tsx")) && !/Best value \(price per GB\)/.test(read("BundleTable.tsx")));

  // Item 7: the partial-snapshot guard.
  const rej = (label: string, d: any) => { const r = compareToBaseline(d, doc); check(`item 7: guard rejects ${label}`, !r.ok, r.errors.join("; ")); };
  const noFlexi = clone(doc) as any; delete noFlexi.telecelRates.flexi; rej("a snapshot without Telecel Flexi", noFlexi);
  const emptyFlexi = clone(doc) as any; if (Array.isArray(emptyFlexi.telecelRates.flexi)) emptyFlexi.telecelRates.flexi = []; else emptyFlexi.telecelRates.flexi.bands = []; rej("Telecel Flexi with no bands", emptyFlexi);
  const noTel = clone(doc) as any; delete noTel.telecelRates; rej("a snapshot without telecelRates", noTel);
  const noAt = clone(doc) as any; delete noAt.atRates; rej("a snapshot without atRates", noAt);
  const noMtn = clone(doc) as any; delete noMtn.mtnRates; rej("a snapshot without mtnRates", noMtn);
  const noPulse = clone(doc) as any; delete noPulse.mtnRates.pulse; rej("a snapshot without MTN Pulse", noPulse);
  const noMid = clone(doc) as any; noMid.mtnRates.midnight = []; rej("an empty MTN Midnight table", noMid);
  const no2m = clone(doc) as any; no2m.bundles = no2m.bundles.filter((b: Bundle) => b.family !== "2Moorch No Expiry" && b.family !== "Monthly"); rej("a snapshot missing whole families (2Moorch, Monthly)", no2m);
  const oneFam = clone(doc) as any; const fam = oneFam.bundles.find((b: Bundle) => b.network === "at" && b.family === "Fuse Voice & Data") ? "Fuse Voice & Data" : oneFam.bundles[0].family; oneFam.bundles = oneFam.bundles.filter((b: Bundle) => b.family !== fam); rej(`a snapshot missing one family (${fam})`, oneFam);
  const half = clone(doc) as any; half.bundles = ["mtn", "telecel", "at"].map((n) => half.bundles.find((b: Bundle) => b.network === n)).concat(half.bundles.slice(0, 51)); rej("54 of 108 bundles", half);
  for (const n of doc.networks ? Object.keys(doc.networks) : []) {
    const mine = doc.bundles.filter((b) => b.network === n);
    const famsOf = [...new Set(mine.map((b) => b.family))];
    // Drop the most bundles possible while keeping one of each family; above 30% must be rejected.
    const keepOne = famsOf.map((f) => mine.find((b) => b.family === f)!);
    const dropTo = (k: number) => { const d = clone(doc) as any; const extra = mine.filter((b) => !keepOne.includes(b)).slice(0, Math.max(0, k - keepOne.length)); d.bundles = doc.bundles.filter((b) => b.network !== n).concat(keepOne, extra).map((b) => clone(b)); return d; };
    const over = Math.ceil(mine.length * (1 - MAX_NETWORK_DROP)) - 1;
    if (over >= keepOne.length) rej(`${n} down to ${over} of ${mine.length} bundles (more than a 30% drop)`, dropTo(over));
    const okCount = Math.ceil(mine.length * (1 - MAX_NETWORK_DROP));
    // Freshness M2 (20 Oct 2026): bundles may go only when retiredBundles lists them (the checker
    // lists small removals on every run, and bigger ones only on a run a human accepted).
    const listed = (d: any) => { const now = new Set(d.bundles.map((b: Bundle) => `${b.network}|${b.name}`)); d.retiredBundles = mine.filter((b) => !now.has(`${n}|${b.name}`)).map((b) => ({ network: n, name: b.name })); return d; };
    if (okCount >= keepOne.length) check(`item 7: guard accepts ${n} at ${okCount} of ${mine.length} bundles (a 30% drop at most) when the gone bundles are listed in retiredBundles`, compareToBaseline(listed(dropTo(okCount)), doc).ok, compareToBaseline(listed(dropTo(okCount)), doc).errors.join("; "));
    if (okCount >= keepOne.length) check(`freshness M2: the same drop on ${n} WITHOUT retiredBundles is rejected (more than 2 or 10% gone)`, compareToBaseline(dropTo(okCount), doc).errors.some((e) => /bundles gone without being listed in retiredBundles/.test(e)));
  }
  check("item 7: the guard still accepts the full dataset and a reworded fact", compareToBaseline({ ...clone(doc), atRates: { ...(clone(doc) as any).atRates, note: "Reworded." } }, doc).ok);

  // Item 8: contrast (checked in the browser); no small text dimmed with opacity.
  check("item 8: Advice has no opacity-dimmed text", !/opacity-80/.test(read("Advice.tsx")));

  // Item 9: hero copy.
  const dash = readFileSync(join(ROOT, "src/pages/data-bundles/DataBundlesDashboard.tsx"), "utf8");
  // Plain words (owner, 18 Oct 2026): "We rank N of the M fixed mobile data bundles we list ...", no "like for like".
  check("item 9 (audit 8 L10): hero says 'We rank N of the M fixed mobile data bundles we list ...'", !/All \{s\.fixedCount\} verified fixed/.test(dash) && /We rank \{s\.comparedCount\} of the \{s\.fixedCount\} fixed mobile data bundles we list from \{nameList\}\./.test(dash) && !/like for like|like-for-like/.test(dash));
  check("item 9: the hero count excludes pending and unconfirmed bundles", m.stats.fixedCount === m.bundles.filter((b) => !isPending(b) && !isUnconfirmed(b)).length);

  // Item 10: covered by the cap-aware planner checks and brute force above; UI wording here.
  const mp = read("MonthlyPlanner.tsx");
  check("item 10: the maths keeps caps 1, 3 and 12 with 3 as its API default; the page's slider starts at 1 (Once, owner 18 Oct 2026)", PURCHASE_CAPS.join() === "1,3,12" && DEFAULT_PURCHASES === 3 && /export const PLANNER_START_CAP = 1;/.test(mp) && /useState<number>\(PLANNER_START_CAP\)/.test(mp));
  check("item 10: planner says plainly that every purchase is bought within the month", /All buys happen within one month\./.test(mp) && /data-testid="plan-purchases"/.test(mp) && /How often will you buy data this month\?/.test(mp) && /export const capLabel = \(n: number\) => \(n === 1 \? "Once" : `Up to \$\{n\} times`\);/.test(mp) && /data-testid="cap-slider"/.test(mp) && /Buying more often can be cheaper\. Buying once is simpler\./.test(mp));
  {
    const p1 = plan(m, "mtn", 5000, 1), p3 = plan(m, "mtn", 5000, 3), p12 = plan(m, "mtn", 5000, 12);
    check("item 10: MTN 5,000 MB: 1 purchase >= 3 purchases >= 12 purchases (each exact)", !!p1 && !!p3 && !!p12 && p1.purchases === 1 && p3.purchases <= 3 && p1.total >= p3.total && p3.total >= p12.total, `${p1?.total} / ${p3?.total} / ${p12?.total}`);
  }

  // Item 11: one unit boundary, and operator labels shown verbatim.
  const lab = clone(fx) as any;
  lab.bundles.push({ network: "at", family: "TEST label", name: "TEST Fuse GH¢30", price: 30, mb: 1024, label: "1024 MB", validity: "No expiry", days: null, kind: "noexpiry", ussd: null, source: "test" });
  const L = createBundleModel(lab);
  const lb = L.bundles.find((b) => b.name === "TEST Fuse GH¢30")!;
  check("item 11: an operator label is shown verbatim ('1024 MB', not '1 GB')", L.dataShown(lb) === "1024 MB" && L.fmtData(lb.mb, "at") === "1.00 GB");
  check("item 11: the label never changes the maths (price per GB from mb at 1,024 MB)", near(L.costPerGb(lb), 30 / (1024 / 1024), 1e-9));
  check("item 11: schema accepts a label and rejects a non-text one", validateDataset(lab).ok && !validateDataset({ ...clone(lab), bundles: [...clone(lab).bundles.slice(0, -1), { ...lb, label: 5 }] }).ok);
  const realLabels = m.bundles.filter((b) => typeof b.label === "string" && b.label.trim());
  if (realLabels.length) check(`real: all ${realLabels.length} operator labels are shown verbatim`, realLabels.every((b) => m.dataShown(b) === b.label!.trim()));

  // Item 12: channel note for Telecel Special offers.
  const ch = clone(fx) as any;
  ch.familyInfo.telecel["Special offer"] = "1-day deals. Only on *110# and the Telecel Play app.";
  // The rule is tested on its own Special offer rows (TEST bundles), so it stays tested whether or
  // not Telecel sells a Special offer today (it dropped them on 21 Oct 2026, row 13).
  ch.retiredFamilies = (ch.retiredFamilies ?? []).filter((x: any) => !(x.network === "telecel" && x.family === "Special offer"));
  if (!ch.bundles.some((b: Bundle) => b.network === "telecel" && b.family === "Special offer")) {
    ch.bundles.push(
      { network: "telecel", family: "Special offer", name: "TEST 1.45GB Special", price: 4.5, mb: 1484.8, validity: "1 day", days: 1, kind: "anytime", ussd: null, source: "test" },
      { network: "telecel", family: "Special offer", name: "TEST 501.4MB Special", price: 1.5, mb: 501.4, validity: "1 day", days: 1, kind: "anytime", ussd: null, source: "test" },
    );
  }
  const C = createBundleModel(ch);
  const specials = C.bundles.filter((b) => b.network === "telecel" && b.family === "Special offer");
  check("item 12: Special offer rows carry the channel note from familyInfo", specials.length > 0 && specials.every((b) => /\*110#/.test(C.channelNote(b) ?? "")), String(specials.length));
  check("item 12: a bundle's own channel field wins", C.channelNote({ ...specials[0], channel: "Telecel Play app only" }) === "Telecel Play app only");
  check("item 12: families without a channel restriction get no note", C.bundles.filter((b) => b.network === "telecel" && b.family === "Monthly").every((b) => C.channelNote(b) === null));
  const realSpecials = m.bundles.filter((b) => b.network === "telecel" && /special/i.test(b.family));
  // The real data: wherever it says how Special offers are sold (familyInfo, a bundle note, channel or buyVia), every row shows it.
  const channelRe = /\*\d[\d*]*#|\bapp\b/i;
  const saysChannel = (b: Bundle) => channelRe.test(`${(b as any).channel ?? ""} ${JSON.stringify((b as any).buyVia ?? "")} ${b.note ?? ""} ${doc.familyInfo.telecel?.[b.family] ?? ""}`);
  const realChannel = realSpecials.filter((b) => m.channelNote(b) || channelRe.test(b.note ?? ""));
  const dataSays = realSpecials.filter(saysChannel);
  check(`real: Telecel Special offers show where to buy them wherever the data says (${realChannel.length} shown, ${dataSays.length} in the data, of ${realSpecials.length})`, dataSays.every((b) => realChannel.includes(b)));
  if (!dataSays.length) console.log("  note: the data does not yet say how Telecel Special offers are sold (item 12 waits on the data engineer)");
  const buyVia = C.channelNote({ ...specials[0], buyVia: ["*110#", "Telecel Play app"] } as Bundle);
  check("item 12: a bundle's buyVia list is shown as 'Buy on *110# or Telecel Play app.'", buyVia === "Buy on *110# or Telecel Play app.", String(buyVia));

  // Item 13: an unpublished MTN range is never computed.
  const gap = clone(fx) as any;
  // The flag form (a band marked unconfirmed inside the table), tested apart from mtnRates.gaps.
  delete gap.mtnRates.gaps;
  gap.mtnRates.regular = gap.mtnRates.regular.map((b: any) => (b.from === 200 ? { ...b, to: 299.99 } : b)).flatMap((b: any) => (b.from === 200 && b.to === 299.99 ? [{ ...b, to: 299 }, { from: 299.01, to: 299.99, unconfirmed: true, note: "TEST: MTN lists no rate here" }] : [b]));
  check("item 13: fixture with an unpublished MTN range passes the schema", validateDataset(gap).ok, validateDataset(gap).errors.join("; "));
  const G = createBundleModel(gap);
  const GR = gap.mtnRates.regular;
  check("item 13: GH¢299.50 is not computed (rate null, marked unpublished)", bandFor(299.5, GR) === null && !!unpublishedBandAt(299.5, GR) && G.regularMb(299.5) === 0);
  check("item 13: GH¢299 and GH¢300 are still priced", bandFor(299, GR)?.ghsPerMb === 0.0063262 && bandFor(300, GR)?.ghsPerMb === 0.0031586);
  check("item 13: budget finder never spends inside the unpublished range", [299.01, 299.5, 299.99].every((bud) => { const b = G.bestForBudget("mtn", bud); return !b || !(b.price > 299 + 1e-9 && b.price < 300 - 1e-9); }));
  check("item 13: planner never buys inside the unpublished range", [150000, 160000, 200000].every((mb) => [1, 3, 12].every((cap) => (G.cheapestMonthlyPlan("mtn", mb, cap)?.items ?? []).every((i) => !(i.bundle.price > 299 + 1e-9 && i.bundle.price < 300 - 1e-9)))));
  check("item 13: the GH¢200 band row stops at GH¢299", G.computed.some((b) => b.network === "mtn" && b.band?.from === 200 && b.band?.to === 299) && !G.computed.some((b) => b.network === "mtn" && (b.band?.to ?? 0) > 299 && (b.band?.to ?? 0) < 300));
  check("item 13: table range ignores the unpublished band", tableRange(GR)[1] === 399);
  check("item 13: the calculator says 'MTN doesn't publish a rate for this amount'", /MTN doesn't publish a rate for this amount\./.test(read("MtnCalculators.tsx")));
  {
    let bf = 0;
    for (const need of [150000, 190000]) for (const cap of [1, 3]) { const p = G.cheapestMonthlyPlan("mtn", need, cap); if (!p) continue; const b = brute(G, "mtn", need, Math.round(p.total * 100), cap); if (Math.abs(b - p.total) > 1e-9) { bf++; console.log(`  gap brute ${need} cap ${cap}: ${desc(p)} vs ${b}`); } }
    check("item 13: planner with an unpublished range equals brute force", bf === 0, String(bf));
  }
  // The data contract: gaps live in mtnRates.gaps = {regular, midnight, pulse}: [{from, to, note}].
  const realGaps = Object.entries(((doc.mtnRates as any)?.gaps ?? {}) as Record<string, { from: number; to: number; note?: string }[]>);
  const tableOf: Record<string, RateBand[] | undefined> = { regular: m.rates?.regular, midnight: m.rates?.midnight, pulse: m.rates?.pulse?.data };
  for (const [k, list] of realGaps) for (const g of list) {
    const t = tableOf[k]!;
    const amts = [g.from, Math.round(((g.from + g.to) / 2) * 100) / 100, g.to];
    check(`real: MTN ${k} gap GH¢${g.from}-${g.to} is never computed and carries its note`, amts.every((a) => bandFor(a, t) === null && unpublishedBandAt(a, t)?.note === g.note));
    if (k === "regular") check(`real: MTN regular gap GH¢${g.from}-${g.to}: regularMb is 0 and the budget finder never spends inside it`, amts.every((a) => m.regularMb(a) === 0) && amts.every((a) => { const b = m.bestForBudget("mtn", a); return !b || !b.computed || b.price < g.from - 1e-9 || b.price > g.to + 1e-9; }));
  }
  if (realGaps.length) {
    check("real: no planner purchase ever falls inside an MTN gap", [50000, 100000, 150000, 205000, 300000].every((mb) => PURCHASE_CAPS.every((cap) => (m.cheapestMonthlyPlan("mtn", mb, cap)?.items ?? []).every((i) => !i.bundle.computed || realGaps.every(([k, l]) => k !== "regular" || l.every((g) => i.bundle.price < g.from - 1e-9 || i.bundle.price > g.to + 1e-9))))));
    let bfg = 0;
    for (const need of [102000, 205000]) for (const cap of [1, 3]) { const p = plan(m, "mtn", need, cap); if (!p) continue; const b = brute(m, "mtn", need, Math.round(p.total * 100), cap); if (Math.abs(b - p.total) > 1e-9) { bfg++; console.log(`  real gap brute ${need} cap ${cap}: ${desc(p)} vs ${b}`); } }
    check("real: MTN planner with the published gaps equals brute force", bfg === 0, String(bfg));
  }

  // The rest of the data contract.
  const windowed = m.bundles.filter((b) => typeof b.window === "string" && b.window.trim());
  check(`contract: all ${windowed.length} bundles with a window are time-restricted and never in the all-day, never-expires, 30-day or calls+data rankings`, windowed.length > 0 && windowed.every((b) => isTimeRestricted(b) && !isAllDay(b) && ![0, 1, 2, 4].some((i) => GROUPS[i].test(b))), windowed.map((b) => b.name).join(", "));
  check("contract: every unconfirmed bundle has asOf, and the schema requires it", m.bundles.filter(isUnconfirmed).every((b) => typeof b.asOf === "string" && b.asOf.length > 0) && !validateDataset({ ...clone(doc), bundles: [...clone(doc).bundles, { ...clone(doc).bundles[0], unconfirmed: true, asOf: undefined }] }).ok);
  check("contract: mb may be null only for unlimited or social, with a label", !validateDataset({ ...clone(doc), bundles: [...clone(doc).bundles, { ...clone(doc).bundles[0], name: "TEST null mb", mb: null, kind: "anytime", label: "x" }] }).ok
    && !validateDataset({ ...clone(doc), bundles: [...clone(doc).bundles, { ...clone(doc).bundles[0], name: "TEST null mb", mb: null, kind: "social", label: undefined }] }).ok
    && validateDataset({ ...clone(doc), bundles: [...clone(doc).bundles, { ...clone(doc).bundles[0], name: "TEST null mb", mb: null, kind: "social", label: "Free WhatsApp" }] }).ok);
  const noVol = m.bundles.filter((b) => !hasVolume(b));
  check(`contract: ${noVol.length} no-volume bundle(s) are never priced per GB or ranked, and show their label`, noVol.every((b) => !isRankable(b) && GROUPS.every((g) => !m.leaderboard(g.id).includes(b)) && m.dataShown(b) === (b.label ?? "").trim()), noVol.map((b) => b.name).join(", "));
  const sun = m.bundles.find((b) => b.network === "at" && /sunday bundle/i.test(b.name));
  if (sun) check("contract: AT Sunday Bundle (social, no amount, Sundays window) is grouped as time-restricted, never as unlimited", tableSection(sun) === "restricted" && m.dataShown(sun) === sun.label);
  const unl = m.bundles.filter((b) => b.kind === "unlimited");
  if (unl.length) check(`contract: ${unl.length} AT Unlimited bundle(s) are grouped as unlimited and show their label`, unl.every((b) => tableSection(b) === "unlimited" && m.dataShown(b) === b.label));
  const jara = m.bundles.find((b) => b.network === "mtn" && b.name === "Jara GH¢1.39");
  if (jara?.conditional) check("contract: MTN Jara (conditional, regional) is never ranked", !isRankable(jara) && GROUPS.every((g) => !m.leaderboard(g.id).includes(jara)));
  const dk = (doc.atRates as any)?.dataKredit;
  if (dk) {
    check("contract: AT Data Kredit (borrowed data) is never a bundle and never ranked", dk.kind === "borrowed" && !m.all.some((b) => /kredit/i.test(`${b.family} ${b.name}`)) && m.bundles.length === doc.bundles.filter((b) => (b.kind as string) !== "router").length);
    check("contract: the AT page shows Data Kredit as borrowed data with its fee", /function GoodToKnow/.test(readFileSync(join(ROOT, "src/pages/data-bundles/DataBundlesNetwork.tsx"), "utf8")) && /borrowed data, not a bundle/.test(readFileSync(join(ROOT, "src/pages/data-bundles/DataBundlesNetwork.tsx"), "utf8")) && dk.feePercent === 20);
  }
  const so = (doc.telecelRates as any)?.specialOffers;
  if (so?.text) check("contract: every Telecel Special offer row carries telecelRates.specialOffers.text", m.bundles.filter((b) => b.network === "telecel" && /special/i.test(b.family)).every((b) => (m.channelNote(b) ?? "").includes(String(so.text).replace(/^\*+/, ""))));
  const mr = m.bundles.filter((b) => /morning rush/i.test(b.name));
  if (mr.length) check("contract: AT Morning Rush shows its window with its validity", mr.every((b) => /4 AM–7 AM/.test(m.validityText(b))), mr.map((b) => m.validityText(b)).join(" | "));
  check("contract: contentKey ignores exactly capturedAt, checkedAt and verification (the checker's content_hash)", [...VOLATILE_FIELDS].sort().join() === "capturedAt,checkedAt,verification");

  // Item 14: unlimited, morning, Sunday and unconfirmed items.
  const nw = clone(fx) as any;
  nw.bundles.push(
    { network: "at", family: "Unlimited", name: "TEST Unlimited Daily", price: 1, mb: null, label: "Unlimited", validity: "1 day", days: 1, kind: "unlimited", ussd: null, source: "test" },
    { network: "at", family: "Morning Rush", name: "TEST Morning Rush", price: 1, mb: 19900, validity: "4 AM–7 AM", days: 1, kind: "morning", ussd: null, source: "test" },
    { network: "at", family: "Sunday Bundle", name: "TEST Sunday Bundle", price: 1, mb: 19800, validity: "Sundays only", days: 1, kind: "restricted", ussd: null, source: "test" },
    { network: "at", family: "Sunday Bundle", name: "TEST Sunday Social", price: 1, mb: 19800, validity: "Sunday", days: 1, kind: "social", ussd: null, source: "test" },
    { network: "at", family: "BigTime Data", name: "TEST unconfirmed FAQ", price: 1, mb: 19950, validity: "No expiry", days: null, kind: "noexpiry", ussd: null, source: "test", unconfirmed: true, asOf: "2024-01-02" },
  );
  check("item 14: schema accepts unlimited (no MB), morning, restricted and unconfirmed items", validateDataset(nw).ok, validateDataset(nw).errors.join("; "));
  check("item 14: schema still rejects a non-unlimited bundle without MB", !validateDataset({ ...clone(nw), bundles: [...clone(nw).bundles, { ...clone(nw).bundles[0], mb: null }] }).ok);
  const N = createBundleModel(nw);
  const named = (s: string) => N.bundles.find((b) => b.name === s)!;
  const testNames = ["TEST Unlimited Daily", "TEST Morning Rush", "TEST Sunday Bundle", "TEST Sunday Social", "TEST unconfirmed FAQ"];
  const everywhere = (b: Bundle) => GROUPS.some((g) => N.leaderboard(g.id).includes(b)) || [...N.stats.cheapestAllDay, ...N.stats.cheapestNoExpiry, ...N.stats.cheapestNight].includes(b) || N.stats.biggestAllDay === b;
  check("item 14: unlimited is never ranked, never priced per GB, never in a finder or planner", !isRankable(named("TEST Unlimited Daily")) && !hasVolume(named("TEST Unlimited Daily")) && !everywhere(named("TEST Unlimited Daily")) && N.dataShown(named("TEST Unlimited Daily")) === "Unlimited");
  check("item 14: unconfirmed is never ranked, never a winner, never in a finder", !isRankable(named("TEST unconfirmed FAQ")) && !everywhere(named("TEST unconfirmed FAQ")) && [1, 5, 50].every((bud) => N.bestForBudget("at", bud)?.name !== "TEST unconfirmed FAQ"));
  check("item 14: morning and Sunday-only bundles are never ranked with all-day data", ["TEST Morning Rush", "TEST Sunday Bundle", "TEST Sunday Social"].every((s) => !isAllDay(named(s)) && !GROUPS.slice(0, 3).some((g) => N.leaderboard(g.id).includes(named(s)))));
  check("item 14: no finder or planner ever picks the new restricted items", N.networks.every((n) => [1, 5, 20].every((bud) => !testNames.includes(N.bestForBudget(n, bud)?.name ?? ""))) && [500, 5000].every((mb) => [1, 3, 12].every((cap) => (N.cheapestMonthlyPlan("at", mb, cap)?.items ?? []).every((i) => !testNames.includes(i.bundle.name)))));
  check("item 14: table groups: unlimited, morning, restricted, unconfirmed", tableSection(named("TEST Unlimited Daily")) === "unlimited" && tableSection(named("TEST Morning Rush")) === "morning" && tableSection(named("TEST Sunday Bundle")) === "restricted" && tableSection(named("TEST unconfirmed FAQ")) === "unranked");
  check("item 14: unconfirmed items are counted apart from verified ones", N.stats.unconfirmedCount === 1 + m.stats.unconfirmedCount && N.stats.fixedCount === N.bundles.filter((b) => !isPending(b) && !isUnconfirmed(b)).length);
  check("item 14: an unlimited bundle formats as 'Unlimited', never NaN", fmtData(NaN) === "Unlimited" && fmtData(null as unknown as number) === "Unlimited");
  const realUnl = m.bundles.filter((b) => b.kind === "unlimited");
  if (realUnl.length) check(`real: ${realUnl.length} unlimited bundle(s) shown, never ranked`, realUnl.every((b) => !isRankable(b) && !everywhere(b)));
  const realUnc = m.bundles.filter(isUnconfirmed);
  if (realUnc.length) check(`real: ${realUnc.length} unconfirmed bundle(s) never ranked`, realUnc.every((b) => !isRankable(b) && GROUPS.every((g) => !m.leaderboard(g.id).includes(b))));

  // Methodology wording (Edmund's decision, 18 Oct 2026: 1 GB = 1,024 MB for every network).
  const methodSrc = shared;
  check("method: the methodology states the convention once, from the data", /We count 1 GB as \$\{f\.toLocaleString\("en-GB"\)\} MB for every network\. Networks may count a little differently\./.test(methodSrc));
  check("method: the old 'we don't know whether ... 1,000 or 1,024' sentence is gone", !/we don't know whether/.test(methodSrc) && !/1,000 or 1,024 MB/.test(methodSrc));
}

// ------------------------------------------------------------------ 14. round 4 (18 Oct 2026): 1,024 MB everywhere, AT Night, Premier Packs, M1-L10
{
  const src = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const uiFiles = [...readdirSync(join(ROOT, "src/components/data-bundles")).map((f) => `src/components/data-bundles/${f}`), ...readdirSync(join(ROOT, "src/pages/data-bundles")).map((f) => `src/pages/data-bundles/${f}`)];

  // A. one factor, from the data, everywhere
  check("A: every network's mbPerGb is 1024 in the data", Object.values(doc.networks).every((n) => n.mbPerGb === 1024));
  check("A: the units note says it in plain words", /TechTrendi counts 1 GB as 1,024 MB for every network, following MTN's app/.test(String((doc.units as any)?.gb)));
  const gbLabelled = m.bundles.filter((b) => /^\s*[\d.,]+\s*GB\s*$/i.test(b.label ?? ""));
  check(`A: every GB label gives itself back as mb / 1024 (${gbLabelled.length} bundles)`, gbLabelled.length > 40 && gbLabelled.every((b) => Math.round((b.mb / m.mbPerGb(b.network)) * 100) / 100 === parseFloat(b.label!.replace(/,/g, ""))));
  const mbLabelled = m.bundles.filter((b) => b.network !== "mtn" && /^\s*[\d.,]+\s*MB\s*$/i.test(b.label ?? ""));
  check(`A: every Telecel/AT MB label is stored exactly as printed (${mbLabelled.length} bundles)`, mbLabelled.every((b) => b.mb === parseFloat(b.label!.replace(/,/g, ""))));
  for (const [net, name, mb] of [["at", "Fuse Voice & Data GH¢30", 1024], ["at", "Fuse Voice & Data GH¢50", 2500], ["at", "Morning Rush GH¢1", 1000], ["at", "Morning Rush GH¢2", 2500], ["telecel", "2 Moorch Weekly", 1000], ["telecel", "263.38GB Monthly", 269701.12], ["at", "Night Bundle GH¢3", 4608]] as const) {
    const b = m.bundles.find((x) => x.network === net && x.name === name);
    check(`A: ${net} ${name}: mb ${mb}, shown '${b?.label}'`, !!b && b.mb === mb && m.dataShown(b) === b.label);
  }
  check("A: the Telecel 1000MB card still shows '1000MB' (below 1 GB at 1,024 MB) and is never re-labelled", m.dataShown(m.bundles.find((b) => b.name === "2 Moorch Weekly")!) === "1000MB" && m.fmtData(1000, "telecel") === "1,000 MB");
  check("A: Telecel 263.38GB Monthly = GH¢400 / 263.38 = GH¢1.5187/GB, shown GH¢1.52 (not GH¢1.48)", near(m.costPerGb(m.bundles.find((b) => b.name === "263.38GB Monthly")!), 400 / 263.38, 1e-9) && m.cpgShown(m.bundles.find((b) => b.name === "263.38GB Monthly")!) === "GH¢1.52");
  const flexTop = m.computed.find((b) => b.network === "telecel" && b.kind === "noexpiry" && b.band?.from === 400)!;
  check("A: Telecel Flexi GH¢400+ = 0.0015 x 1024 = GH¢1.536/GB, shown GH¢1.54", near(m.costPerGb(flexTop), 1.536, 1e-9) && m.cpgShown(flexTop) === "GH¢1.54");
  // The winners, as the data decides them.
  const allDay = [...m.all.filter(GROUPS[0].test).filter(canWin)].sort((a, b) => m.costPerGb(a) - m.costPerGb(b));
  const noExp = [...m.all.filter(GROUPS[1].test).filter(canWin)].sort((a, b) => m.costPerGb(a) - m.costPerGb(b));
  check("A: cheapest all-day winner is the cheapest all-day row (Telecel 263.38GB Monthly, GH¢1.52)", m.stats.cheapestAllDay.length === 1 && m.stats.cheapestAllDay[0] === allDay[0] && allDay[0].name === "263.38GB Monthly");
  check("A: cheapest never-expires winner is the cheapest never-expires row (Telecel Flexi no expiry GH¢400–999.99, GH¢1.54, ahead of BigTime/2Moorch GH¢1.58)",
    m.stats.cheapestNoExpiry.length === 1 && m.stats.cheapestNoExpiry[0] === noExp[0] && noExp[0].rateLabel === "Telecel Flexi, no expiry" && m.cpgShown(noExp[1]) === "GH¢1.58");
  check("A: hero tile texts are GH¢1.52, GH¢1.54, GH¢0.30 and 263.38GB",
    [m.cpgShown(m.stats.cheapestAllDay[0]), m.cpgShown(m.stats.cheapestNoExpiry[0]), m.cpgShown(m.stats.cheapestNight[0]), m.dataShown(m.stats.biggestAllDay!)].join() === "GH¢1.52,GH¢1.54,GH¢0.30,263.38GB");
  // No hard-coded factor left in the maths or the UI.
  const hard: string[] = [];
  for (const f of ["src/lib/dataBundles.ts", "src/lib/dataBundleSchema.js", ...uiFiles]) {
    const t = src(f);
    if (/DEFAULT_MB_PER_GB/.test(t)) hard.push(`${f}: DEFAULT_MB_PER_GB`);
    if (/mbPerGb\([^)]*\)\s*[!=]==\s*10(00|24)\b/.test(t)) hard.push(`${f}: compares mbPerGb with a constant`);
    if (/\/\s*1000\b|\*\s*1000\b/.test(t.replace(/\/\/.*$/gm, "").replace(/\d+\s*\*\s*1000\s*\*/g, ""))) hard.push(`${f}: x/÷ 1000`);
  }
  check("A: no hard-coded 1000/1024 GB factor in the maths, the schema or the UI", hard.length === 0, hard.join("; "));
  check("A: costPerGb and fmtData have no default factor", !/mbPerGb\s*=\s*\w/.test(src("src/lib/dataBundles.ts").match(/export const costPerGb[^\n]*/)?.[0] ?? "x") && /export function fmtData\(mb: number, mbPerGb: number\)/.test(src("src/lib/dataBundles.ts")));

  // C-H1. AT Premier Packs: shown, unconfirmed, never ranked
  const prem = m.bundles.filter((b) => b.network === "at" && b.family === "Premier Packs");
  check("H1: five AT Premier Packs from AT's FAQ (GH¢99, 199, 350, 351, 499)", prem.map((b) => b.price).join() === "99,199,350,351,499" && prem.every((b) => b.kind === "combo" && b.source === "https://www.at.com.gh/faq?page=Customer%20care"));
  check("H1: Premier Packs are unconfirmed with asOf 2024-02-06", prem.every((b) => b.unconfirmed === true && b.asOf === "2024-02-06"));
  check("H1: Premier Packs are never ranked, never a winner, never in a finder or planner",
    prem.every((b) => !isRankable(b) && GROUPS.every((g) => !m.leaderboard(g.id).includes(b)) && tableSection(b) === "unranked") &&
    m.networks.every((n) => [99, 199, 350, 351, 499, 600].every((bud) => m.bestForBudget(n, bud)?.family !== "Premier Packs")) &&
    [20000, 100000, 200000].every((mb) => PURCHASE_CAPS.every((cap) => (m.cheapestMonthlyPlan("at", mb, cap)?.items ?? []).every((i) => i.bundle.family !== "Premier Packs"))));
  check("H1: Premier volumes are GB x 1024 and show as AT prints them", prem.map((b) => `${b.label}=${b.mb}`).join() === "15GB=15360,35GB=35840,75GB=76800,100GB=102400,180GB=184320" && prem.every((b) => m.dataShown(b) === b.label));
  check("H1: minutes and bonus airtime are in extras", prem.map((b) => JSON.stringify(b.extras)).join() === '{"allNetMins":200},{"allNetMins":200},{"allNetMins":3600},{"airtime":150},{"airtime":200}');
  check("H1: the bonus airtime is written out on screen", /bonus airtime/.test(src("src/components/data-bundles/shared.tsx")) && /e\.airtime/.test(src("src/components/data-bundles/shared.tsx")));
  check("H1: Premier Packs are a listed family on the AT page, with AT's own text", m.familiesOf("at").includes("Premier Packs") && /\*703#/.test(doc.familyInfo.at["Premier Packs"] ?? ""));
  check("H1: they are counted as unconfirmed, not as verified", m.bundleCounts("at").unconfirmed === prem.length + m.bundles.filter((b) => b.network === "at" && b.family === "Morning Rush").length);

  // M1. no count-up on any price or data figure
  const dash = src("src/pages/data-bundles/DataBundlesDashboard.tsx"), netPage = src("src/pages/data-bundles/DataBundlesNetwork.tsx");
  // Round 2 (owner, 18 Oct 2026): numbers may count up when they scroll into view, but a count always
  // ends on the model's exact text (CountUpText) or is a whole-number count (CountUp); interactive
  // outputs roll to the new text instead (RollText) and never count.
  // Step 3: the top line is "Checked every 3 hours · AT, MTN & Telecel" (no counts, so nothing counts up there).
  check("M1: the dashboard page itself counts nothing up (no CountUp / CountUpText on the page)", !/<CountUp\b/.test(dash) && !/CountUpText/.test(dash));
  // Redesign 1 (18 Oct 2026): the hero tiles became the "I have GH¢" console and the network panels,
  // which render model output directly (dataShown, priceText, valueText) and never count up.
  check("M1: figures render the model's final text: panels count up TO model.dataShown (CountUpText), the finder rolls to it (RollText), no plain CountUp on any price or data",
    !/<CountUp\b/.test(src("src/components/data-bundles/NetworkPanels.tsx") + src("src/components/data-bundles/BudgetFinder.tsx") + src("src/components/data-bundles/FaceOff.tsx")) &&
    /const shown = model\.dataShown\(b\);[\s\S]*<CountUpText text=\{shown\}/.test(src("src/components/data-bundles/NetworkPanels.tsx")) && /\{model\.priceLead\(b\)\}/.test(src("src/components/data-bundles/NetworkPanels.tsx")) &&
    /model\.valueText\(b\)/.test(src("src/components/data-bundles/shared.tsx")) && /const shown = shownB \? model\.dataShown\(shownB\) : "";[\s\S]*<RollText text=\{shown\} testId="bf-amount"/.test(src("src/components/data-bundles/BudgetFinder.tsx")) &&
    ["BudgetFinder.tsx", "MonthlyPlanner.tsx", "Leaderboards.tsx"].every((f) => !/CountUp/.test(src(`src/components/data-bundles/${f}`))));
  // Round 12: the network page has no stat tiles; its counts are plain text under "What we list" (nothing counts up).
  check("M1: the network page never counts a figure up (its counts are plain text under 'What we list')", !/<CountUp\b|CountUpText/.test(netPage) && /<Details summary="What we list"/.test(netPage));
  check("M1: CountUp is documented for whole-number counts only", /For plain whole-number COUNTS only/.test(src("src/components/data-bundles/shared.tsx")));

  // M2. family card "best" ignores time-restricted bundles unless the whole family is restricted
  const vdc = m.familyBest("telecel", "Voice & Data Combo");
  check("M2: Telecel Voice & Data Combo 'best' is not Bossu Weekend (weekend-only)", !!vdc && !/bossu weekend/i.test(vdc.bundle.name) && vdc.window === null, vdc?.bundle.name);
  const vds = m.familyBest("mtn", "Sunday Special");
  check("M2: a family where every rankable bundle is restricted shows its window with the price (MTN Sunday Special)", !!vds && vds.window === "Sundays only");
  check("M2: AT Night best shows 12 AM–4 AM; Telecel Night King shows 12 AM–5 AM", m.familyBest("at", "Night Bundle")?.window === "12 AM–4 AM" && m.familyBest("telecel", "Night King")?.window === "12 AM–5 AM");
  check("M2: no family's 'best' is a time-restricted bundle while an all-day one exists in it", m.networks.every((n) => m.familiesOf(n).every((f) => { const fb = m.familyBest(n, f); if (!fb || !isTimeRestricted(fb.bundle)) return true; return m.bundles.filter((b) => b.network === n && b.family === f && canWin(b) && hasVolume(b)).every(isTimeRestricted); })));
  // Round 12: the family cards became the bundle list's family headers, which keep the family's best value and window.
  check("M2: the network page uses familyBest and shows the window", /model\.familyBest\(network, family\)/.test(src("src/components/data-bundles/BundleTable.tsx")) && /bestWindow \? ` \(\$\{bestWindow\}\)`/.test(src("src/components/data-bundles/BundleTable.tsx")));

  // M3. network pills: no opacity dimming; current marked by ring + underline
  check("M3: no opacity-dimmed network pills", !/opacity-60/.test(netPage));
  check("M3: the current network is marked by a ring and an underline, with aria-current", /aria-current=\{n === network \? "page" : undefined\}/.test(netPage) && /ring-2 ring-foreground/.test(netPage) && /underline decoration-2/.test(netPage));

  // L1. MTN sources
  const mr = doc.mtnRates as any;
  check("L1: the 214.53GB help article is no longer cited as support", !("validitySupport" in mr) && /214\.53GB/.test(mr.outdatedHelpArticle?.note) && /out of date/.test(mr.outdatedHelpArticle?.note));
  check("L1: Midnight no-expiry (4405300046994) and no-caps (19498110415122) articles are cited", /4405300046994$/.test(mr.midnightNoExpirySource) && /19498110415122$/.test(mr.midnightNoCapsSource));
  check("L1: regular data's non-expiry cites the myMTN app section", /myMTN app, Data Bundles: 'Low Cost Non Expiry Bundles'/.test(mr.validitySource));
  const meta = src("src/components/data-bundles/meta.tsx");
  check("L1: Sources lists the new articles and marks the old one 'Not used, out of date'", /midnightNoExpirySource/.test(src("src/lib/dataBundles.ts")) && /midnightNoCapsSource/.test(src("src/lib/dataBundles.ts")) && /Old page, not used/.test(meta) && !/validitySupport/.test(meta));

  // L2. Flexi scope
  check("L2: no 'or more' scope wording anywhere in the maths", !/or more`/.test(src("src/lib/dataBundles.ts")) && m.computed.filter((b) => b.band && !b.band.exact).every((b) => / to GH¢/.test(m.spendScope(b))));
  check("L2: Flexi top band scope is GH¢400 to GH¢999.99", m.spendScope(flexTop) === "when you spend GH¢400 to GH¢999.99" && m.dealText(m.stats.cheapestNoExpiry[0]) === "Telecel Flexi, no expiry, when you spend GH¢400 to GH¢999.99");

  // L3. out-of-bundle comparisons state the comparison bundle's validity
  check("L3: out-of-bundle comparisons name the comparison bundle's validity", /\{model\.dataShown\(best\)\} \(\{model\.validityText\(best\)\}\)/.test(src("src/components/data-bundles/Advice.tsx")) && /\{model\.dataShown\(best\)\} \(\{model\.validityText\(best\)\}\)/.test(netPage));
  const tel1 = m.bestForBudget("telecel", 1)!;
  check("L3: Telecel GH¢1 comparison is Flexi with expiry at GH¢1 = 1-day data", tel1.computed === true && tel1.rateLabel === "Telecel Flexi, with expiry" && m.validityText(tel1) === "1 day", `${tel1.name} ${m.validityText(tel1)}`);

  // L4. Jara is regional, Data Zone personalised
  const jara2 = m.bundles.filter((b) => /\bJara\b/.test(b.name));
  check("L4: MTN Jara bundles are 'regional', Data Zone 'personalised'", jara2.length === 2 && jara2.every((b) => conditionalReason(b) === "regional") && m.bundles.filter((b) => b.family === "Data Zone").every((b) => conditionalReason(b) === "personalised"));
  check("L4: the badge and the advice card label regional offers separately", /"Some regions only"/.test(src("src/components/data-bundles/shared.tsx")) && /Regional: only in the regions the network lists/.test(src("src/components/data-bundles/Advice.tsx")));

  // L5. advice: family text only when the whole family is limited
  const lim = m.limitedNotes();
  check("L5: a family's text appears only when every bundle in it is limited", lim.filter((x) => x.whole && x.f !== "Social & video").every((x) => m.bundles.filter((b) => b.network === x.n && b.family === x.f && !isPending(b)).every((b) => ["hourly", "morning", "social", "video", "unlimited", "weekend", "restricted"].includes(b.kind) || (isTimeRestricted(b) && b.kind !== "night"))));
  check("L5: Telecel's Voice & Data Combo text is not shown just because Bossu Weekend is in it; Bossu Weekend is named with its window", !lim.some((x) => x.f === "Voice & Data Combo") && lim.some((x) => x.f === "Bossu Weekend" && /Saturday and Sunday/.test(x.t)));
  check("L5: Advice uses model.limitedNotes", /model\.limitedNotes\(only\)/.test(src("src/components/data-bundles/Advice.tsx")));

  // L6. one definition of "bundles compared", shown the same everywhere
  const sum = m.networks.reduce((s, n) => s + m.bundleCounts(n).verified, 0);
  // Counted straight from the dataset (not through the model), so a counting regression still fails.
  const verifiedRaw = doc.bundles.filter((b) => (b.kind as string) !== "router" && b.pending !== true && b.unconfirmed !== true).length;
  check(`L6: the hero count equals the sum of the network counts and the dataset's own count (verified = not pending, not unconfirmed: ${verifiedRaw})`, m.stats.fixedCount === sum && sum === verifiedRaw && sum > 0, `${m.stats.fixedCount} vs ${sum} vs ${verifiedRaw}`);
  check("L6: hero, network cards, network page and table all use bundleCounts", /model\.bundleCounts\(n\)/.test(src("src/components/data-bundles/NetworkCards.tsx")) && /model\.bundleCounts\(network\)/.test(netPage) && /model\.bundleCounts\(network\)/.test(src("src/components/data-bundles/BundleTable.tsx")));
  check("L6: the figures not re-checked by the latest run (myMTN app items) are counted from the data and said on the hero", m.stats.notRecheckedCount === m.bundles.filter((b) => !isPending(b) && !isUnconfirmed(b) && !/^https:\/\//.test(b.source)).length && m.stats.notRecheckedCount === 7 && m.stats.notRecheckedSources.join() === "myMTN app (screenshot 17 Oct 2026)" && /s\.notRecheckedCount > 0/.test(dash));

  // L7. contentKey sorts bundles the way the checker hashes them
  const shuffled = { ...clone(doc), bundles: [...clone(doc).bundles].reverse() };
  check("L7: same content in a different bundle order has the same contentKey", contentKey(shuffled) === contentKey(doc));
  const rotated = { ...clone(doc), bundles: [...clone(doc).bundles.slice(37), ...clone(doc).bundles.slice(0, 37)] };
  check("L7: ... and for any rotation", contentKey(rotated) === contentKey(doc));
  const sorted = [...doc.bundles].sort(compareBundles);
  check("L7: order = network, family, price, mb (no mb first), name, as common.bundle_sort_key", sorted[0].network === "at" && sorted[0].family === "BigTime Data" && sorted[0].price === 1 &&
    compareBundles({ network: "a", family: "f", price: 1, mb: null, name: "z" }, { network: "a", family: "f", price: 1, mb: 5, name: "a" }) < 0 &&
    compareBundles({ network: "a", family: "f", price: 1, mb: 5, name: "b" }, { network: "a", family: "f", price: 1, mb: 5, name: "a" }) > 0 &&
    compareBundles({ network: "a", family: "f", price: 2, mb: 1, name: "a" }, { network: "a", family: "f", price: 10, mb: 1, name: "a" }) < 0);
  check("L7: a real change in a reordered document is still seen", contentKey({ ...shuffled, bundles: shuffled.bundles.map((b, i) => (i === 3 ? { ...b, price: b.price + 1 } : b)) }) !== contentKey(doc));

  // L8. amount boxes clear properly; tab strips wrap
  const nat = (t: string, max = 1000) => normaliseAmountText(t, max);
  check("L8: '00.5' -> '0.5', '020' -> '20', '' -> '' (0)", nat("00.5").text === "0.5" && nat("00.5").value === 0.5 && nat("020").text === "20" && nat("020").value === 20 && nat("").text === "" && nat("").value === 0);
  check("L8: '0.' stays '0.' while typing; '1.2.3' -> '1.23'; letters dropped; over max clamps", nat("0.").text === "0." && nat("1.2.3").text === "1.23" && nat("5a0").text === "50" && nat("5000").text === "1000" && nat("5000").value === 1000);
  for (const f of ["BudgetFinder.tsx", "MtnCalculators.tsx", "TelecelFlexiCalculator.tsx"]) {
    const t = src(`src/components/data-bundles/${f}`);
    check(`L8: ${f} amount box is a text box (inputMode decimal) driven by useAmountText`, /type="text"/.test(t) && /inputMode="decimal"/.test(t) && /useAmountText\(/.test(t) && !/type="number"/.test(t));
  }
  check("L8: a chip, slider or band button updates the box even while it has focus", /normaliseAmountText\(t, max\)\.value !== value \? String\(value\) : t/.test(src("src/components/data-bundles/shared.tsx")));
  for (const f of ["Leaderboards.tsx", "MtnCalculators.tsx"]) {
    const t = src(`src/components/data-bundles/${f}`);
    check(`L8: ${f} tab strip wraps (no w-max / horizontal scroller)`, /<TabsList className="flex h-auto w-full flex-wrap/.test(t) && !/w-max/.test(t));
  }

  // L9. no stale hard-coded wording
  check("L9: the monthly planner no longer names '(daily, weekly, Sika Kokoo)'; the left-out families come from the data", !/daily, weekly, Sika Kokoo/.test(src("src/components/data-bundles/MonthlyPlanner.tsx")) && /shortFams/.test(src("src/components/data-bundles/MonthlyPlanner.tsx")));
  check("L9: the MTN calculator no longer says 'MTN sells most mobile data by amount'", !/MTN sells most mobile data by amount/.test(src("src/components/data-bundles/MtnCalculators.tsx")));
  check("L9: the budget finder names conditional families from the data, not 'such as MTN Data Zone'", !/such as MTN Data Zone/.test(src("src/components/data-bundles/BudgetFinder.tsx")));

  // L10. Telecel no-expiry auto-renew rule in the rollover/renewal card
  check("L10: Telecel's 90% no-expiry auto-renew rule is in the data and in the renewal card", (doc.telecelRates as any)?.rules?.noExpiryAutoRenewAtPercent === 90 && /noExpiryAutoRenewAtPercent/.test(src("src/components/data-bundles/Advice.tsx")) && /auto-renews once \$\{pct\}% of the allocated data is used/.test(src("src/components/data-bundles/Advice.tsx")));

  // Unit text
  check("method: unitsLine/unitsMethod come from the data's factor", /model\.sharedMbPerGb\(\)/.test(src("src/components/data-bundles/shared.tsx")) && !/!== 1000|=== 1000/.test(src("src/components/data-bundles/shared.tsx")));
}


// ------------------------------------------------------------------ audit 5 (18 Oct 2026)
{
  const src = (f: string) => readFileSync(join(ROOT, f), "utf8");
  const mtnB = m.bundles.filter((b) => b.network === "mtn");
  // H1. MTN Xtrabyte is borrowed data, exactly like AT Data Kredit.
  const xb = (doc.mtnRates as any)?.xtrabyte;
  check("H1: MTN Xtrabyte is borrowed data in mtnRates.xtrabyte (10% fee, *506#)", xb?.kind === "borrowed" && xb.feePercent === 10 && /\*506#/.test(xb.ussd) && xb.rows.length === 7 && xb.rows.every((r: any) => Math.abs(r.price * 1.1 - r.totalDebt) < 0.005));
  check("H1: no Xtrabyte bundle anywhere in the model, so never in tables, rankings, finder or planner", !m.all.some((b) => /xtrabyte/i.test(`${b.family} ${b.name}`)));
  check("H1: the model lists both borrowed-data facts (MTN Xtrabyte, AT Data Kredit)", m.borrowed().map((x) => `${x.network}:${x.title}`).sort().join() === "at:Data Kredit,mtn:Xtrabyte");
  check("H1: Xtrabyte is not counted as an MTN package family", !m.familiesOf("mtn").includes("Xtrabyte"));
  check("H1: familyInfo.mtn.Xtrabyte says it is borrowed, MTN's words", /Borrowed data/.test(doc.familyInfo.mtn.Xtrabyte) && /pay later at 10% commission/.test(doc.familyInfo.mtn.Xtrabyte) && /\*506#, option 4 'Request a data advance'/.test(doc.familyInfo.mtn.Xtrabyte));
  check("H1: the comparison shows Xtrabyte where it shows Data Kredit (network facts)", /Xtrabyte \(\*506#, option 4\)/.test(m.factText("mtn") ?? "") && /Data Kredit \(\*554#\)/.test(m.factText("at") ?? ""));
  // Advice.tsx is compiled with the classic JSX transform by tsx: give it React, then call the real buildTips.
  (globalThis as any).React = (await import("react")).default;
  const { buildTips } = await import("../src/components/data-bundles/Advice.tsx");
  const tipsAll = buildTips(m);
  const bt = tipsAll.find((t) => t.id === "borrowed");
  check("H1: Advice card 3 is a borrowed-data caution for MTN Xtrabyte and AT Data Kredit, not a price comparison", !!bt && [...bt.networks].sort().join() === "at,mtn" && !tipsAll.some((t) => t.id === "xtrabyte") && !/costs more for the same data/.test(src("src/components/data-bundles/Advice.tsx")) && !/minSpendFor/.test(src("src/components/data-bundles/Advice.tsx")));
  check("H1: the MTN page shows Xtrabyte in its borrowed-data note (BorrowedData reads model.borrowed)", /model\.borrowed\(network\)/.test(src("src/pages/data-bundles/DataBundlesNetwork.tsx")) && m.borrowed("mtn").length === 1);
  check("H1: the budget finder footnote names borrowed data from the data", /borrowedNames/.test(src("src/components/data-bundles/BudgetFinder.tsx")));
  check("H1: the BorrowedData fallback no longer claims 'next top up' for every network", !/when you next top up/.test(src("src/pages/data-bundles/DataBundlesNetwork.tsx")));

  // H2. Pulse: no expiry, MTN's words; still not ranked (MTN aims it at young customers; it never was a ranked source).
  const pulse = R.pulse as any;
  check("H2: Pulse validity is 'No expiry' with MTN's terms and help-centre quotes", pulse.validity === "No expiry" && pulse.validitySources.some((x: any) => x.says === "No expiry for all purchased mashups" && /Pulse-TnCs\.pdf$/.test(x.url)) && pulse.validitySources.some((x: any) => x.says === "Pulse bundles do not expire." && /5106322755474$/.test(x.url)));
  check("H2: familyInfo.mtn.Pulse no longer says MTN states no validity", !/does not state a validity/.test(doc.familyInfo.mtn.Pulse) && /does not expire/.test(doc.familyInfo.mtn.Pulse));
  // Audit 6 M1: no MTN source restricts who may buy Pulse, so it is a ranked never-expires source.
  check("M1 (audit 6): Pulse is a ranked never-expires source", m.sources.some((x) => x.id === "mtn-pulse" && x.kind === "noexpiry") && m.leaderboard("noexpiry").some((b) => b.family === "Pulse"));
  check("H2: hero values (cheapest all-day, never-expires, night)", m.cpgShown(m.stats.cheapestAllDay[0]) === "GH¢1.52" && m.cpgShown(m.stats.cheapestNoExpiry[0]) === "GH¢1.54" && m.cpgShown(m.stats.cheapestNight[0]) === m.cpgShown(m.leaderboard("night")[0]),
    `${m.cpgShown(m.stats.cheapestAllDay[0])} / ${m.cpgShown(m.stats.cheapestNoExpiry[0])} / ${m.cpgShown(m.stats.cheapestNight[0])}`);

  // M1. Kokrokoo: help centre "does not expire", terms "lost after 8am": never counted as never-expiring.
  const kok = mtnB.find((b) => b.family === "Kokrokoo")!;
  check("M1: Kokrokoo's otherSource quotes MTN's terms and disputes the validity", kok.otherSource?.contradicts === "validity" && /Any unused data is lost after 8am/.test(kok.otherSource?.says ?? "") && /Kokrokoo-TnCs\.pdf$/.test(kok.otherSource?.url ?? ""));
  check("M1: Kokrokoo is never treated as never-expiring; its validity is the window and the dispute (audit 6 M3)", expiryDisputed(kok) && !neverExpires(kok) && kok.validity === "5 AM–8 AM daily" && m.validityText(kok) === "5 AM–8 AM daily (expiry not clear – check with MTN)");
  check("M1: a disputed validity also beats a family text that says 'does not expire'", !kok.noExpiry && /does not expire/.test(doc.familyInfo.mtn.Kokrokoo));
  check("M1: Kokrokoo is in no never-expires list, finder or planner", !GROUPS[1].test(kok) && !m.lastsAMonth(kok) && (restrictedTest("noexpiry") ? !restrictedTest("noexpiry")!(kok) : true));
  check("M1: Sources include MTN's Kokrokoo terms and help-centre answer", [...m.sourcesFor("mtn").urls, ...m.sourcesFor("mtn").cited.map((c) => c.url)].some((u) => /Kokrokoo-TnCs\.pdf$/.test(u)) && m.sourcesFor("mtn").cited.some((c) => /6971299278866$/.test(c.url)));

  // M2. Jara Monday to Saturday, daily auto subscription; Sunday Special weekly; price disagreements noted.
  const jara = mtnB.find((b) => b.name === "Jara GH¢1.39")!;
  const sun = mtnB.find((b) => b.name === "Sunday Special GH¢1.39")!;
  const both = mtnB.find((b) => b.name === "Jara GH¢2.58")!;
  check("M2: Jara works Monday–Saturday (window) and its note says 'Daily auto subscription applies'", jara.window === "Monday–Saturday" && isTimeRestricted(jara) && /Daily auto subscription applies/.test(jara.note ?? ""));
  check("M2: Sunday Special notes weekly auto-renewal (help centre and terms)", /renewable at midnight of the next Saturday/.test(sun.note ?? "") && /Weekly auto subscription applies/.test(sun.note ?? ""));
  check("M2: the price disagreements are otherSource notes; the tariff page's prices are used", [sun, jara, both].every((b) => b.otherSource?.contradicts === "price") && sun.price === 1.39 && jara.price === 1.39 && both.price === 2.58 && !/65 Pesewas/.test(sun.otherSource!.summary!) && /1\.41/.test(jara.otherSource!.says!) && /2\.63/.test(both.otherSource!.says!));
  // L5. MTN Offers' own words for Sunday Special; the 2022 article's 'on Sundays only' is not attributed to it.
  check("L5: Sunday Special quotes MTN Offers' 'available every Sunday only', not the 2022 wording", /MTN Offers \(help centre, last edited 11 Nov 2025\) lists Sunday Special as 'special voice or data deals available every Sunday only'/.test(sun.note ?? "") && !/'on Sundays only'/.test(sun.note ?? ""));

  // M3. AFA and Association: conditional (eligibility), exact figures, never ranked; Adwumapa described only.
  const afa = mtnB.filter((b) => b.family === "AFA bundle"), assoc = mtnB.filter((b) => b.family === "Association bundle");
  check("M3: AFA + Data GH¢6 = 150 MB, 30 days, *1848#", afa.length === 1 && afa[0].price === 6 && afa[0].mb === 150 && afa[0].label === "150 MB" && afa[0].days === 30 && afa[0].ussd === "*1848#");
  check("M3: six Association packs as MTN prints them", assoc.map((b) => `${b.price}:${b.label}`).join() === "10:500MB,20:1GB,30:2GB,50:3.5GB,80:6.5GB,100:8GB" && assoc.every((b) => b.mb === (b.label!.endsWith("GB") ? parseFloat(b.label!) * 1024 : parseFloat(b.label!))));
  check("M3: AFA/Association are conditional (eligibility), unconfirmed and never ranked", [...afa, ...assoc].every((b) => conditionalReason(b) === "eligibility" && isUnconfirmed(b) && !isRankable(b) && GROUPS.every((g) => !m.leaderboard(g.id).includes(b)) && tableSection(b) === "unranked"));
  check("M3: Adwumapa is a described family with no bundles (MTN publishes no figures)", m.familiesOf("mtn").includes("Adwumapa") && !mtnB.some((b) => b.family === "Adwumapa") && /publishes no prices or data amounts/.test(doc.familyInfo.mtn.Adwumapa));
  check("M3: the eligibility badge and Advice group exist", /"Some groups only"/.test(src("src/components/data-bundles/shared.tsx")) && !!tipsAll.find((t) => t.id === "zone") && /eligibleBundles/.test(src("src/components/data-bundles/Advice.tsx")));
  check("M3: no 'Everything MTN sells' / 'Every MTN bundle' headings; the table states its scope", !/Everything \$\{/.test(src("src/pages/data-bundles/DataBundlesNetwork.tsx")) && !/title=\{`Every \$\{info\.name\} bundle`\}/.test(src("src/components/data-bundles/BundleTable.tsx")) && /Scope: mobile data bundles/.test(src("src/components/data-bundles/BundleTable.tsx")) && !/Every Package and Price/.test(src("src/pages/data-bundles/DataBundlesNetwork.tsx")));
  check("M3: Special Day stays absent", !m.all.some((b) => /special day/i.test(`${b.family} ${b.name}`)) && !Object.keys(doc.familyInfo.mtn).some((f) => /special day/i.test(f)));

  // L1. Partial-scrape guard: Pulse band count, the GB factor, truncated tables.
  check("L1: the guard accepts the dataset against itself", compareToBaseline(doc, doc).ok, compareToBaseline(doc, doc).errors.join("; "));
  const lessPulse = clone(doc) as any; lessPulse.mtnRates.pulse.data = lessPulse.mtnRates.pulse.data.slice(0, 3);
  check("L1: a snapshot with a Pulse band missing is rejected", !compareToBaseline(lessPulse, doc).ok && compareToBaseline(lessPulse, doc).errors.some((e) => /mtnRates\.pulse\.data: 3 bands vs 4/.test(e)));
  const f1000 = clone(doc) as any; for (const n of Object.keys(f1000.networks)) f1000.networks[n].mbPerGb = 1000;
  check("L1: a snapshot with 1 GB = 1,000 MB is rejected (REQUIRED_MB_PER_GB 1024)", REQUIRED_MB_PER_GB === 1024 && !compareToBaseline(f1000, doc).ok && compareToBaseline(f1000, doc).errors.some((e) => /mbPerGb is 1000, not 1024/.test(e)));
  const cutReg = clone(doc) as any; cutReg.mtnRates.regular = cutReg.mtnRates.regular.slice(0, -2);
  check("L1: a truncated MTN regular table is rejected", !compareToBaseline(cutReg, doc).ok && compareToBaseline(cutReg, doc).errors.some((e) => /mtnRates\.regular: \d+ bands vs \d+ before \(truncated\)/.test(e)));
  const lowReg = clone(doc) as any; const lastBand = lowReg.mtnRates.regular[lowReg.mtnRates.regular.length - 1]; if (lastBand.exactly !== undefined) lastBand.exactly = 299; else lastBand.to = 299;
  check("L1: an MTN regular table that stops lower is rejected", !compareToBaseline(lowReg, doc).ok && compareToBaseline(lowReg, doc).errors.some((e) => /mtnRates\.regular: stops at/.test(e)));
  const cutFlexi = clone(doc) as any; cutFlexi.telecelRates.flexi.bands = cutFlexi.telecelRates.flexi.bands.slice(0, -1);
  check("L1: a truncated Telecel Flexi table is rejected", !compareToBaseline(cutFlexi, doc).ok && compareToBaseline(cutFlexi, doc).errors.some((e) => /telecelRates\.flexi: \d+ bands vs \d+ before/.test(e)));

  // L2. The calculator's gap message ends its sentence before "Pick another amount".
  check("L2: the gap note always ends with a full stop", /unpublished\.note\.trim\(\)\.replace\(\/\[\.!\?\]\?\$\/, "\."\)/.test(src("src/components/data-bundles/MtnCalculators.tsx")) && `${"MTN's tariff page publishes no rate for this range".trim().replace(/[.!?]?$/, ".")} Pick` === "MTN's tariff page publishes no rate for this range. Pick");
  // L3. No sub-pesewa amounts.
  check("L3: amounts are capped to 2 decimals", normaliseAmountText("1.239", 1000).text === "1.23" && normaliseAmountText("1.239", 1000).value === 1.23 && normaliseAmountText("0.005", 1000).value === 0 && normaliseAmountText("12.5", 1000).text === "12.5" && normaliseAmountText("1.2.39", 1000).text === "1.23");
  // L4. The network filter replaces the board at once (keyed list), never old + new rows together.
  check("L4: the leaderboard list is keyed by the network filter", /<LayoutGroup id=\{`board-\$\{groupId\}-\$\{net\}`\} key=\{net\}>/.test(src("src/components/data-bundles/Leaderboards.tsx")));
  // L6. No unsupported Telecel claim.
  check("L6: no 'Telecel changes offers often' claim", !/changes offers often/.test(doc.networkFacts.telecel));
  // L7. Social & video is not a family of its own; family totals agree everywhere.
  check("L7: 'Social & video' is not a family (its note lives in mtnRates.socialNote)", !m.familiesOf("mtn").includes("Social & video") && !m.rateFamilies("mtn").includes("Social & video") && /GH¢0\.03 to GH¢1,000/.test((R as any).socialNote));
  check("L7: MTN has 13 package families (audit 6: Sunday Special and Jara split; audit 7: SME bundles removed, no data in MTN's article), counted the same on the hero and every page", m.familiesOf("mtn").length === 13 && m.stats.familyCount === m.networks.reduce((s, n) => s + m.familiesOf(n).length, 0), m.familiesOf("mtn").join(", "));
  check("L7: the calculators take the any-amount note from mtnRates.socialNote", /notes: \[r\.socialNote, fi\["Social bundles"\]\]/.test(src("src/components/data-bundles/MtnCalculators.tsx")));
}


// ------------------------------------------------------------------ audit 6 (18 Oct 2026)
{
  const src6 = (f: string) => readFileSync(join(ROOT, f), "utf8");
  const allText = JSON.stringify(doc);
  const regular = m.sources.find((x) => x.id === "mtn-regular")!;
  const pulse = m.sources.find((x) => x.id === "mtn-pulse");
  const mtnB = m.bundles.filter((b) => b.network === "mtn");
  // Source without comment lines, for "no figure is written in the code" checks.
  const code6 = (f: string) => src6(f).split("\n").filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join("\n");

  // H1. No "the more you spend" claim; spend cliffs worked out from the rates; hint in the calculators.
  check("H1: no 'the more you spend, the cheaper' claim anywhere in the data", !/the more you spend|cheaper the more/i.test(allText));
  const rc = m.cliffsOf(regular.table).map((c) => [c.from, c.to, c.better, Math.round(c.betterMb * 100) / 100]);
  check("H1: MTN regular spend cliffs: 3.01–3.90 (spend GH¢3), 5.01–7.32 (spend GH¢5), 10.01–11.77 (spend GH¢10)",
    JSON.stringify(rc) === JSON.stringify([[3.01, 3.9, 3, 406.89], [5.01, 7.32, 5, 521.03], [10.01, 11.77, 10, 837.55]]), JSON.stringify(rc));
  check("H1: GH¢5 buys 521.03 MB and every amount from GH¢5.01 to GH¢7.32 buys less; GH¢7.33 buys more", near(m.regularMb(5), 521.03) && [5.01, 6, 7.32].every((a) => m.regularMb(a) < m.regularMb(5)) && m.regularMb(7.33) > m.regularMb(5));
  check("H1: GH¢10 exactly beats GH¢10.01", m.regularMb(10) > m.regularMb(10.01));
  check("H1: the cliffs are computed from the rates, not written in the code", !/521\.03|7\.32/.test(code6("src/lib/dataBundles.ts")) && !/521\.03|7\.32/.test(code6("src/components/data-bundles/Advice.tsx")));
  const tips6 = (await import("../src/components/data-bundles/Advice")).buildTips(m);
  const cliffTip = tips6.find((t) => t.id === "cliffs");
  check("H1: the advice has a spend-cliff card for MTN and Telecel Flexi", !!cliffTip && cliffTip.networks.includes("mtn") && cliffTip.networks.includes("telecel"));
  check("H1: MTN and Telecel calculators show the live 'GH¢X less gets you more data' hint", /CliffHint/.test(src6("src/components/data-bundles/MtnCalculators.tsx")) && /less gets you more data/.test(src6("src/components/data-bundles/MtnCalculators.tsx")) && /CliffHint/.test(src6("src/components/data-bundles/TelecelFlexiCalculator.tsx")));
  check("H1: the regular family text says the rate does not always fall", /does not always fall as you spend more/.test(doc.familyInfo.mtn["Regular data (any amount)"]));
  const mono = clone(doc) as BundleDataset; const mm6 = createBundleModel(mono);
  check("H1: a table whose data always rises with the spend has no cliffs", mm6.cliffsOf([{ from: 1, to: 9.99, ghsPerMb: 0.02 }, { from: 10, to: 99.99, ghsPerMb: 0.01 }]).length === 0);

  // M1. Pulse ranked as a never-expires source; the suspect GH¢5–9.99 band is never used.
  check("M1: Pulse is in the never-expires and all-day rankings as computed rows", !!pulse && m.leaderboard("noexpiry").some((b) => b.family === "Pulse" && b.computed) && m.leaderboard("allday").some((b) => b.family === "Pulse"));
  check("M1: no Pulse row covers GH¢5–9.99", m.computed.filter((b) => b.family === "Pulse").every((b) => !b.band || b.band.to < 5 || b.band.from > 9.99));
  const f30 = m.bestForBudget("mtn", 30);
  check("M1: finder, GH¢30 on MTN: Pulse exactly GH¢30 (3,134 MB) beats regular GH¢30 (2,134 MB)", f30?.family === "Pulse" && near(f30.mb, 30 / 0.0095726, 0.01), f30?.name);
  check("M1: Pulse text says who MTN aims it at and that no MTN source restricts who may buy it; no 'not ranked'", /young/.test(doc.familyInfo.mtn.Pulse) && /No MTN source says who may or may not buy it/.test(doc.familyInfo.mtn.Pulse) && !/not ranked/i.test(doc.familyInfo.mtn.Pulse));
  check("M1: the suspect band keeps MTN's figure with a note quoting it", /0\.0447653/.test(String((R.pulse.data[1] as any).note)));
  // L3. Pulse from GH¢0.07 (MTN's help centre); regular: the app minimum said in words, never priced.
  check("L3: Pulse starts at GH¢0.07 per MTN's help centre (GH¢0.06 not worked out)", m.pulseMb(0.06) === 0 && m.pulseMb(0.07) > 0 && /GHS0\.07/.test(String(R.pulse.minSpend?.says)));
  check("L3: the regular calculator states the myMTN app's GH¢0.03 minimum without pricing it", /function appMinimum/.test(src6("src/components/data-bundles/MtnCalculators.tsx")) && m.regularMb(0.03) === 0);

  // M2 / M3. Midnight and Kokrokoo: the dispute, never a flat "no expiry".
  check("M2: Midnight carries MTN's Kokrokoo terms as its other source (contradicts validity)", R.midnightOtherSource?.contradicts === "validity" && /Same principle as the Midnight Bundles/.test(R.midnightOtherSource?.says ?? ""));
  check("M2: no Midnight or Kokrokoo row anywhere says a flat 'no expiry'", m.all.filter((b) => b.network === "mtn" && (b.family === "Midnight" || b.family === "Kokrokoo")).every((b) => !neverExpires(b) && !/no expiry|does not expire/i.test(m.validityText(b))));
  check("M2: the night advice shows the dispute", /model\.validityText\(b\)\)\)\]/.test(src6("src/components/data-bundles/Advice.tsx")));
  check("M2: the Midnight family text no longer says flatly that it does not expire", /disagree/.test(doc.familyInfo.mtn.Midnight));

  // M4. The unsupported auto-renew sentence is gone.
  check("M4: no 'Auto-renew is your choice; it is not switched on for you.'", !/not switched on for you/.test(src6("src/components/data-bundles/Advice.tsx")));

  // M5. MTN help-centre dates are last edits.
  const cited = (R.citedSources ?? []) as { url: string; date: string; dateLabel: string; for: string[] }[];
  check("M5: every MTN help-centre source has its 'last edited' date", cited.filter((c) => /help-center\.mtn\.com\.gh/.test(c.url)).every((c) => c.dateLabel === "last edited" && /^\d{4}-\d{2}-\d{2}$/.test(c.date)));
  check("M5: MTN Offers is dated 11 Nov 2025 and Pulse validity 17 Jul 2023 (edited_at, not updated_at)", cited.some((c) => /30967430645906$/.test(c.url) && c.date === "2025-11-11") && R.pulse.validitySources!.some((v) => /5106322755474$/.test(v.url ?? "") && v.updated === "2023-07-17") && !/updated 5 Oct 2026/.test(allText));
  check("M5: help-centre dates in the text say 'last edited'", !/help centre[^.]{0,40}\bupdated \d/i.test(allText));

  // M6. Every URL in the data is in the Sources list, and every family quoting MTN's help centre has a cited article.
  const listed = new Set(m.networks.flatMap((n) => [...m.sourcesFor(n).urls, ...m.sourcesFor(n).cited.map((c) => c.url)]));
  const outdated = String((R as any).outdatedHelpArticle?.url);
  const urlsInDoc = [...new Set((allText.match(/https:\/\/[^"\s)]+/g) ?? []).filter((u) => u !== outdated && !/telecel\.me\/PlayApp/.test(u)))];
  const missing = urlsInDoc.filter((u) => !listed.has(u));
  {
    const tc = m.sourcesFor("telecel"), mt = m.sourcesFor("mtn");
    const w = (doc as unknown as { walletPayments?: Record<string, { url: string }> }).walletPayments;
    check("M6 (round 8): the FAQ's new pages are in the Sources list: Telecel Cash terms (cited, with its date), MTN's MoMo article (cited once), Telecel's balance codes page",
      !w || ((!w.telecel || tc.cited.some((c) => c.url === w.telecel.url && /^\d{4}-\d{2}-\d{2}$/.test(c.date))) &&
        (!w.mtn || mt.cited.filter((c) => c.url === w.mtn.url).length === 1)) &&
      (!(doc.telecelRates as any)?.balanceCheck || [...tc.urls, ...tc.cited.map((c) => c.url)].includes((doc.telecelRates as any).balanceCheck.source)));
  }
  check("M6: every URL quoted anywhere in the data appears in the Sources list", missing.length === 0, missing.join(" "));
  const quoting = Object.entries(doc.familyInfo.mtn).filter(([, t]) => /help centre|MTN Offers/i.test(t)).map(([f]) => f);
  check("M6: every MTN family text quoting the help centre has a cited help-centre article for it", quoting.every((f) => cited.some((c) => c.for.includes(f) && /help-center/.test(c.url))), quoting.filter((f) => !cited.some((c) => c.for.includes(f))).join(", "));
  for (const id of ["30967430645906", "4997924741650", "7999206596114", "4409522485266", "7999259818514", "32234628177298", "9925621750802", "9925758451986", "13972741263250", "27275508679314", "6971296819474", "6142151349010"])
    check(`M6: MTN help-centre article ${id} is in the Sources list`, [...listed].some((u) => u.endsWith(`/${id}`)));
  for (const u of ["https://mtn.com.gh/pulse/", "https://mtn.com.gh/mtn-jara/", "https://mtn.com.gh/sunday-special/", "https://mtn.com.gh/just4u/"])
    check(`M6: ${u} is in the Sources list`, listed.has(u));
  check("M6: the Sources section shows each quoted page with its date", /data-testid="cited-sources"/.test(src6("src/components/data-bundles/meta.tsx")) && /c\.dateLabel\} \{fmtDate\(c\.date\)\}/.test(src6("src/components/data-bundles/meta.tsx")));

  // M7. Pulse codes: *567# and the myMTN app first; *117#/*115# as also on the Pulse page.
  check("M7 (audit 8): Pulse's only code is *567# or the myMTN app", R.pulse.ussd === "*567# or the myMTN app (Shop, then Mash Up)" && !/\*11[57]#/.test(R.pulse.ussd));

  // M8. Sunday Special and Jara split; only Jara is conditional; *550# once per family.
  const ss = mtnB.filter((b) => b.family === "Sunday Special"), jr = mtnB.filter((b) => b.family === "Jara");
  check("M8: Sunday Special and Jara are separate families of two bundles each; no merged entry", ss.length === 2 && jr.length === 2 && !mtnB.some((b) => /\//.test(b.name)) && !("Voice + data special" in doc.familyInfo.mtn));
  check("M8: Sunday Special is nationwide (not conditional, Sundays only); Jara is regional, Monday–Saturday", ss.every((b) => !isConditional(b) && b.window === "Sundays only" && isTimeRestricted(b)) && jr.every((b) => conditionalReason(b) === "regional" && b.window === "Monday–Saturday"));
  check("M8: no bundle note repeats 'Subscribe on *550#' (it is in each family text once)", !mtnB.some((b) => /\*550#/.test(b.note ?? "")) && (doc.familyInfo.mtn["Sunday Special"].match(/\*550#/g) ?? []).length === 1);
  check("M8: the finder footnote names a family only when all its bundles are conditional", /\.every\(isConditional\)\)/.test(src6("src/components/data-bundles/BudgetFinder.tsx")));
  check("M8: no bundle of any network has a merged name 'A / B'", !doc.bundles.some((b) => / \/ /.test(b.name)));

  // M9. Data Zone: help-centre prices as otherSource, buy code.
  const dz = mtnB.filter((b) => b.family === "Data Zone");
  check("M9: Data Zone shows MTN's help-centre prices (contradicts price) and *135#, option 2", dz.length === 3 && dz.every((b) => b.otherSource?.contradicts === "price" && /GHS 2\.39/.test(b.otherSource?.says ?? "") && b.ussd === "*135#, option 2"));

  // L1. The partial-scrape guard rejects the audit's crafted snapshots.
  const b6 = clone(doc) as any;
  const crafted: [string, (d: any) => void][] = [
    ["MTN regular rates x1000", (d) => { d.mtnRates.regular.forEach((x: any) => { x.ghsPerMb *= 1000; }); }],
    ["MTN regular rates /1000", (d) => { d.mtnRates.regular.forEach((x: any) => { x.ghsPerMb /= 1000; }); }],
    ["MTN midnight rate x5", (d) => { d.mtnRates.midnight[0].ghsPerMb *= 5; }],
    ["MTN social rate x5", (d) => { d.mtnRates.social *= 5; }],
    ["MTN video rate /5", (d) => { d.mtnRates.video /= 5; }],
    ["Telecel Flexi rate x5", (d) => { d.telecelRates.flexi.bands[3].noExpiry.ghsPerMb *= 5; }],
    ["Xtrabyte rows emptied", (d) => { d.mtnRates.xtrabyte.rows = []; }],
    ["Xtrabyte volume x10", (d) => { d.mtnRates.xtrabyte.rows[0].mb *= 10; }],
    ["Data Kredit rows emptied", (d) => { d.atRates.dataKredit.rows = []; }],
    ["Data Kredit kind changed", (d) => { d.atRates.dataKredit.kind = "bundle"; }],
    ["Telecel mb in GB units", (d) => { d.bundles.forEach((x: any) => { if (x.network === "telecel") x.mb = x.mb / 1024; }); }],
    ["absurd mb x10000", (d) => { d.bundles.find((x: any) => x.name === "263.38GB Monthly").mb *= 10000; }],
    ["AT bundle mb x5", (d) => { d.bundles.find((x: any) => x.network === "at").mb *= 5; }],
    ["all AT unconfirmed", (d) => { d.bundles.forEach((x: any) => { if (x.network === "at") { x.unconfirmed = true; x.asOf = "2020-01-01"; } }); }],
    ["all MTN pending", (d) => { d.bundles.forEach((x: any) => { if (x.network === "mtn") x.pending = true; }); }],
    ["familyInfo emptied", (d) => { d.familyInfo = {}; }],
    ["networkFacts emptied", (d) => { d.networkFacts = {}; }],
    ["MTN gaps emptied", (d) => { d.mtnRates.gaps = { regular: [], midnight: [], pulse: [] }; }],
    ["Telecel bundles duplicated", (d) => { d.bundles.push(...clone(doc).bundles.filter((x: any) => x.network === "telecel")); }],
    ["new network with no bundles", (d) => { d.networks.glo = { name: "Glo", color: "#00aa00", ink: "#ffffff", source: "https://glo.com", mbPerGb: 1024 }; }],
    ["socialRange huge", (d) => { d.mtnRates.socialRange = [0.03, 1e9]; }],
    ["family dropped without retiredFamilies", (d) => { d.bundles = d.bundles.filter((x: any) => x.family !== "Morning Rush"); }],
  ];
  // Times relative to the dataset's own capture (a newer dataset must not make these pass for the wrong reason).
  const cap6 = new Date(captureTime(doc.capturedAt) + 3_600_000).toISOString();
  const now6 = captureTime(doc.capturedAt) + 2 * 3_600_000;
  for (const [name, mutate] of crafted) {
    const d = clone(b6); mutate(d);
    const out = resolveSnapshot(doc, { data: d, captured_at: cap6, checked_at: cap6 }, now6);
    check(`L1: the site guard rejects a crafted snapshot: ${name}`, out === null);
  }
  const fine = clone(b6); fine.bundles.find((x: any) => x.network === "at").price += 0.5;
  check("L1: an ordinary price change captured later is still accepted", resolveSnapshot(doc, { data: fine, captured_at: cap6, checked_at: cap6 }, now6) !== null);
  check("L1: a row captured more than a day in the future is rejected", resolveSnapshot(doc, { data: fine, captured_at: new Date(now6 + 25 * 3_600_000).toISOString(), checked_at: new Date(now6 + 25 * 3_600_000).toISOString() }, now6) === null);
  const futureDoc = { ...clone(fine), capturedAt: "2099-01-01T00:00:00Z" };
  check("L1: a document whose own capturedAt is in the future is rejected", resolveSnapshot(doc, { data: futureDoc, captured_at: cap6, checked_at: cap6 }, now6) === null && resolveSnapshot(doc, { data: fine, captured_at: cap6, checked_at: cap6 }, now6) !== null);
  check("L1: an unconfirmed (suspect) band still counts as a band, so it is not 'truncation'", compareToBaseline(doc, doc).ok);

  // L2. A family may disappear only when the snapshot lists it in retiredFamilies.
  const drop = clone(b6); drop.bundles = drop.bundles.filter((x: any) => x.family !== "Morning Rush");
  check("L2: dropping a family without retiredFamilies is rejected", !compareToBaseline(drop, doc).ok && compareToBaseline(drop, doc).errors.some((e) => /package families missing: at\|Morning Rush/.test(e)));
  drop.retiredFamilies = [{ network: "at", family: "Morning Rush" }];
  check("L2: dropping a family listed in retiredFamilies is accepted", compareToBaseline(drop, doc).ok && validateDataset(drop).ok, compareToBaseline(drop, doc).errors.join("; "));
  check("L2: a malformed retiredFamilies fails the schema", !validateDataset({ ...clone(doc), retiredFamilies: [{ network: "at" }] }).ok);

  // L4. No computed row's spend range includes an exact special at a different rate.
  const exacts = R.regular.filter((b) => b.exactly !== undefined).map((b) => b.exactly!);
  check("L4: MTN data rows never span GH¢3, GH¢10 or GH¢399", m.computed.filter((b) => b.family === "Regular data (any amount)" && b.band && !b.band.exact).every((b) => exacts.every((e) => e < b.band!.from || e > b.band!.to)));
  check("L4: GH¢5.01–GH¢9.99 and GH¢10.01–GH¢99.90 are separate rows", ["MTN data, GH¢5.01–GH¢9.99", "MTN data, GH¢10.01–GH¢99.90"].every((n) => m.computed.some((b) => b.name === n)));

  // L5. Clamping is said on screen.
  check("L5: an amount above the top is clamped and flagged", normaliseAmountText("500", 399).value === 399 && normaliseAmountText("500", 399).clamped && !normaliseAmountText("50", 399).clamped);
  check("L5: all three amount boxes show the clamp message", ["MtnCalculators", "TelecelFlexiCalculator", "BudgetFinder"].every((f) => /<ClampNote show=\{amountBox\.clamped\}/.test(src6(`src/components/data-bundles/${f}.tsx`))) && /MTN sells \$\{calc\.label\} data up to/.test(src6("src/components/data-bundles/MtnCalculators.tsx")));

  // L6. Windowed families' best per GB carries the window.
  check("L6: Telecel Hourly's best per GB comes with '1 hour'", m.familyBest("telecel", "Hourly")?.window === "1 hour");

  // L7. Flexi heading: "more data that expires" only where it is true.
  check("L7: the Flexi heading says where both options give the same data", /both options give the same data/.test(src6("src/components/data-bundles/TelecelFlexiCalculator.tsx")) && !/or more data that expires\./.test(src6("src/components/data-bundles/TelecelFlexiCalculator.tsx")));

  // L8. Telecel families follow its data terms' grouping.
  const t111 = m.bundles.find((b) => b.network === "telecel" && b.price === 10 && b.label === "1.11GB");
  check("L8: Telecel 1.11GB @ GH¢10 (5 days) is in Daily, as the terms' 'Daily Offers' list it", t111?.family === "Daily" && t111?.name === "1.11GB");

  // L9. SME bundles described from MTN's 2026 article; MoMo 4G bonus left out (article last edited Jul 2024).
  // Audit 7 (L11): MTN's SME article mentions no data, so the family left the dataset.
  check("L9: no SME bundles family and no SME bundles", !("SME bundles" in doc.familyInfo.mtn) && !mtnB.some((b) => b.family === "SME bundles"));
  check("L9: no '50% 4G Bonus' claim (its only source was last edited 17 Jul 2024)", !/50% 4G bonus/i.test(allText));

  // L10. Cosmetics.
  check("L10: Xtrabyte code text has no nested brackets", !/\(/.test(String((R as any).xtrabyte.ussd)));
  check("L10: one date style (fixed month names, 'Sep' not 'Sept')", /const MONTHS = \["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"\]/.test(src6("src/components/data-bundles/shared.tsx")) && !/toLocaleDateString/.test(src6("src/components/data-bundles/shared.tsx")) && !/(in|PDF,) (January|February|March|April|June|July|August|September|October|November|December) \d{4}/.test(allText));
  check("L10: links never wrap with a left-margin indent", !/ml-3 mt-1 inline-flex/.test(src6("src/pages/data-bundles/DataBundlesNetwork.tsx")) && /flex min-h-11 w-fit/.test(src6("src/components/data-bundles/shared.tsx")));
  check("L10: the bundle list's scope says 'pages and app' only where an app is a source", /fromApp \? "own pages and app" : "own pages"/.test(src6("src/components/data-bundles/BundleTable.tsx")));
  check("L10: the hero says how many bundles are re-checked automatically (no blanket 'verified')", !/verified mobile data bundles/.test(src6("src/pages/data-bundles/DataBundlesDashboard.tsx")) && /Our checker re-checks \{s\.fixedCount - s\.notRecheckedCount\} of the \{s\.fixedCount\} on the networks' own pages/.test(src6("src/pages/data-bundles/DataBundlesDashboard.tsx")));
  check("L10: units.unconfirmed names all three networks; units.otherSource names every use", /AT/.test(String((doc.units as any).unconfirmed)) && /MTN/.test(String((doc.units as any).unconfirmed)) && /Telecel/.test(String((doc.units as any).unconfirmed)) && /Midnight/.test(String((doc.units as any).otherSource)) && /Data Zone/.test(String((doc.units as any).otherSource)));
  check("L10: the Flexi facts do not repeat the channels and the auto-renew rule already in the note", /skip\.add\("buyVia"\)/.test(src6("src/components/data-bundles/TelecelFlexiCalculator.tsx")) && /skip\.add\("autoRenews"\)/.test(src6("src/components/data-bundles/TelecelFlexiCalculator.tsx")));
}
// ------------------------------------------------------------------ audit 7 (18 Oct 2026)
{
  const React = await import("react");
  (globalThis as any).React = React; // the components are compiled with the classic JSX runtime here
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { FlexiCliffHint, flexiDefaultAmount } = await import("../src/components/data-bundles/TelecelFlexiCalculator");
  const { dedupeNotes } = await import("../src/components/data-bundles/MtnCalculators");
  const { MAX_FUTURE_MS, futureDate, UNIFORM_SHIFT } = await import("../src/lib/dataBundleSchema.js");
  const snap = await import("../src/lib/bundleSnapshot");
  const src7 = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const textOf = (el: unknown) => renderToStaticMarkup(el as any).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
  const f = m.flexi!;
  const fmtT = (mb: number) => m.fmtData(mb, "telecel");
  const cl = (t: RateBand[], a: number) => m.materialCliffsOf(t).find((c) => a >= c.from - 1e-9 && a <= c.to + 1e-9) ?? null;
  const hint = (a: number) => React.createElement(FlexiCliffHint, { model: m, amount: a, ne: cl(f.noExpiry, a), ex: cl(f.expiry, a), fmt: fmtT, onUse: () => {} });

  // M1. Flexi: the first amount is in no cliff of either option; one hint per amount, naming the option(s).
  const def = flexiDefaultAmount(m);
  check("M1: the Flexi calculator's first amount is in no spend cliff of either option", !cl(f.noExpiry, def) && !cl(f.expiry, def) && !!m.flexiQuote(def).noExpiry && !!m.flexiQuote(def).expiry, `GH¢${def}`);
  check("M1: GH¢20 (the old first amount) is in the no-expiry cliff, so it is not the default", !!cl(f.noExpiry, 20) && def !== 20);
  check("M1: the first amount is worked out from the cliffs, not hard-coded", /useState\(\(\) => flexiDefaultAmount\(model\)\)/.test(src7("src/components/data-bundles/TelecelFlexiCalculator.tsx")) && !/Math\.min\(hi \|\| 10, 20\)/.test(src7("src/components/data-bundles/TelecelFlexiCalculator.tsx")));
  const h11 = textOf(hint(11));
  check("M1: where both options are in a cliff (GH¢11), ONE hint with ONE button", (renderToStaticMarkup(hint(11) as any).match(/data-testid="cliff-hint"/g) ?? []).length === 1 && (renderToStaticMarkup(hint(11) as any).match(/<button/g) ?? []).length === 1 && /^Both options: GH¢1\.01 less gets you more data\./.test(h11), h11.slice(0, 90));
  check("M1: the combined hint names each option and its own (material) range", /No-expiry option: GH¢9\.99 buys .*from GH¢10 to GH¢12\.37 buys at least 1 MB and 0\.5% less/.test(h11) && /With-expiry option: GH¢9\.99 buys .*from GH¢10 to GH¢13\.66 buys at least 1 MB and 0\.5% less/.test(h11), h11);
  const h55 = textOf(hint(5.5));
  check("M1: a one-option hint is named ('No-expiry option: ...') with plain grammar", /^No-expiry option: GH¢0\.51 less gets you more data\./.test(h55) && /because Telecel's published no-expiry rate per MB is higher there/.test(h55) && !/\)'s published/.test(h55), h55.slice(0, 80));
  check("M1: the hint says what the button does to BOTH options (GH¢4.99: less with-expiry data, 1 day instead of 7)", /Now, at GH¢5\.50: no-expiry 611\.11 MB, with-expiry 859\.38 MB for 7 days\./.test(h55) && /At GH¢4\.99: no-expiry 648\.05 MB, with-expiry 744\.78 MB for 1 day\./.test(h55), h55.slice(-140));
  check("M1: no 'Telecel (no-expiry option)'s' wording left anywhere", !/Telecel \((no-)?expiry option\)/.test(src7("src/components/data-bundles/TelecelFlexiCalculator.tsx")));
  check("M1: no hint at all outside every cliff", renderToStaticMarkup(hint(def) as any) === "");

  // M2. Pulse below GH¢0.07: below MTN's help-centre minimum, not "not published".
  const pulseTab = m.sources.find((s) => s.id === "mtn-pulse")!.table;
  const low = unpublishedBandAt(0.05, pulseTab);
  check("M2: Pulse GH¢0.01–0.06 is marked below MTN's help-centre minimum (GH¢0.07)", low?.belowMinimum?.amount === 0.07 && low?.belowMinimum?.label === "MTN's help-centre minimum" && m.pulseMb(0.05) === 0 && m.pulseMb(0.07) > 0);
  const calcSrc = src7("src/components/data-bundles/MtnCalculators.tsx");
  check("M2: the rate table and the calculator heading say 'Below MTN's help-centre minimum (GH¢0.07)'", /b\.belowMinimum \? `Below \$\{b\.belowMinimum\.label\} \(\$\{model\.money\(b\.belowMinimum\.amount\)\}\)`/.test(calcSrc) && /data-why="below-minimum"/.test(calcSrc) && /Below \{unpublished\.belowMinimum\.label\}/.test(calcSrc));
  check("M2: the minimum's note says MTN's tariff prices Pulse above GH¢0 (no 'not published' claim)", /tariff page gives a Pulse data rate for any amount above GH¢0/.test(R.pulse.minSpend!.note!) && !/not published/i.test(R.pulse.minSpend!.note!));

  // M3. The GH¢0.07 article's older volumes are a disagreeing source; both out-of-date articles worded alike.
  const pos = (R.pulse as any).otherSource;
  check("M3: Pulse otherSource = help centre 5106366483730 (last edited 17 Jul 2024), contradicts 'volume'", pos?.contradicts === "volume" && /5106366483730$/.test(pos?.url) && pos?.updated === "2024-07-17" && ["43.67MB", "517.06MB", "2.63MB"].every((x) => pos.says.includes(x)));
  check("M3: it says plainly the article is older than the tariff", /last edited 17 Jul 2024, before MTN's January 2026 tariff review/.test(pos.summary) && /only its lowest amount, GH¢0\.07, is used/.test(pos.summary));
  check("M3: the GH¢0.07 minimum is stated as 'MTN's help centre (last edited 17 Jul 2024) says...'", /MTN's help centre \(last edited 17 Jul 2024\) says Pulse offers run 'from GHS0\.07-29\.99'/.test(R.pulse.minSpend!.note!));
  check("M3: the other out-of-date article (4402325134354) is worded the same way", /\(last edited 14 Oct 2025, before MTN's January 2026 tariff review\)/.test(String((R as any).outdatedHelpArticle.note)));
  const pulsePick = m.bestForBudget("mtn", 0.5)!;
  check("M3: Pulse computed bundles carry the older-source note; still ranked and never-expiring", pulsePick.family === "Pulse" && pulsePick.otherSource?.contradicts === "volume" && canWin(pulsePick) && neverExpires(pulsePick));
  check("M3: the Pulse calculator shows the older-source note", /otherSource: r\.pulse\.otherSource/.test(calcSrc) && /<OtherSourceNote b=\{\{ otherSource: calc\.otherSource \} as Bundle\}/.test(calcSrc));

  // M4. One future-date guard for the browser and the prebuild.
  check("M4: one MAX_FUTURE_MS (10 min since audit 8) shared by bundleSnapshot and the prebuild", MAX_FUTURE_MS === 10 * 60_000 && snap.MAX_FUTURE_MS === MAX_FUTURE_MS && /futureDate, MAX_FUTURE_MS[^}]*\} from "\.\.\/src\/lib\/dataBundleSchema\.js"/.test(src7("scripts/fetch-data-bundles.mjs")) && !/24 \* 3_600_000/.test(src7("src/lib/bundleSnapshot.ts")));
  const nowT = Date.parse("2026-10-18T07:30:00Z");
  check("M4: futureDate flags +11 min, not +9 min, on any of the four dates", futureDate({ captured_at: "2026-10-18T07:41:00Z", data: {} }, nowT) === "2026-10-18T07:41:00Z" && futureDate({ captured_at: "2026-10-18T07:39:00Z", data: {} }, nowT) === null && futureDate({ captured_at: "2026-10-18T06:00:00Z", data: { checkedAt: "2026-10-20T00:00:00Z" } }, nowT) === "2026-10-20T00:00:00Z");
  {
    const differs7 = clone(doc); differs7.bundles[0] = { ...differs7.bundles[0], mb: differs7.bundles[0].mb + 1 };
    const later = new Date(captureTime(doc.capturedAt) + 60_000).toISOString();
    await prebuildCase("M4: row checked 2 days in the future -> KEPT (the browser's guard, now also in the prebuild)", differs7, later, false, /dated in the FUTURE/, "2026-10-18T06:00:00Z", new Date(captureTime(doc.capturedAt) + 2 * 86_400_000).toISOString());
    const fut = { ...clone(differs7), capturedAt: new Date(captureTime(doc.capturedAt) + 30 * 3_600_000).toISOString().replace(/\.\d{3}Z$/, "Z") };
    await prebuildCase("M4: data capturedAt 30 h ahead -> KEPT", fut, later, false, /dated in the FUTURE/, "2026-10-18T06:00:00Z", later);
    await prebuildCase("M4: same row within the day -> UPDATED", differs7, later, true, /UPDATED/, new Date(captureTime(doc.capturedAt) + 3_600_000).toISOString(), later);
  }

  // L1. retiredFamilies: listed families must be gone; newly listed ones must have existed.
  const g7 = (d: any) => compareToBaseline(d, doc);
  { const d = clone(doc) as any; d.retiredFamilies = [...(d.retiredFamilies ?? []), { network: "at", family: "BigTime Data" }];
    check("L1: retiredFamilies listing a family that still has bundles is rejected", !g7(d).ok && g7(d).errors.some((e: string) => /retiredFamilies lists at\|BigTime Data, which still has bundles/.test(e))); }
  { const d = clone(doc) as any; d.retiredFamilies = [...(d.retiredFamilies ?? []), { network: "mtn", family: "Never existed" }];
    check("L1: newly listing a family the baseline never had is rejected", !g7(d).ok && g7(d).errors.some((e: string) => /newly lists mtn\|Never existed/.test(e))); }
  { const d = clone(doc) as any; d.bundles = d.bundles.filter((b: Bundle) => !(b.network === "mtn" && b.family === "Data Zone")); d.retiredFamilies = [...(d.retiredFamilies ?? []), { network: "mtn", family: "Data Zone" }];
    d.retiredBundles = doc.bundles.filter((b) => b.network === "mtn" && b.family === "Data Zone").map((b) => ({ network: "mtn", name: b.name }));
    check("L1: a real retirement (family in the baseline, gone now, listed with its bundles) is accepted", g7(d).ok, g7(d).errors.join("; ")); }
  check("L1: an entry the baseline already lists is kept (MTN 'Voice + data special')", g7(clone(doc)).ok && (doc as any).retiredFamilies.some((x: any) => x.family === "Voice + data special"));

  // L2. Whole-table scaling, unconfirmed flips, disputes, Flexi by amount.
  { const d = clone(doc) as any; for (const b of d.telecelRates.flexi.bands) { b.noExpiry.ghsPerMb *= 3.9; b.expiry.ghsPerMb *= 3.9; }
    check("L2: all Flexi rates x3.9 (under the 4x jump limit) is rejected as one-factor scaling", !g7(d).ok && g7(d).errors.some((e: string) => /telecelRates\.flexi noExpiry: every band's rate moved by the same factor \(x3\.90\)/.test(e))); }
  { const d = clone(doc) as any; for (const b of d.mtnRates.regular) b.ghsPerMb /= 3.9;
    check("L2: all MTN regular rates /3.9 is rejected", !g7(d).ok && g7(d).errors.some((e: string) => /mtnRates\.regular: every band's rate moved by the same factor \(x0\.26\)/.test(e))); }
  { const d = clone(doc) as any; for (const b of d.bundles) if (b.network === "at" && b.mb) b.mb *= 3.9;
    check("L2: all AT volumes x3.9 is rejected", !g7(d).ok && g7(d).errors.some((e: string) => /network at: every bundle's mb moved by the same factor/.test(e))); }
  { const d = clone(doc) as any; for (const b of d.mtnRates.regular) b.ghsPerMb *= 1.2;
    check("L2: all MTN regular rates x1.2 (a plausible tariff change) is accepted", g7(d).ok, g7(d).errors.join("; ")); }
  check("L2: the shift bounds are 0.67x and 1.5x", UNIFORM_SHIFT[0] === 0.67 && UNIFORM_SHIFT[1] === 1.5);
  { const d = clone(doc) as any; let keep = true; for (const b of d.bundles) if (b.network === "telecel") { if (keep) { keep = false; continue; } b.unconfirmed = true; b.asOf = "2024-01-01"; }
    const nTel = doc.bundles.filter((b) => b.network === "telecel").length, nRank = doc.bundles.filter((b) => b.network === "telecel" && b.pending !== true && b.unconfirmed !== true).length;
    check(`L2: all but one of Telecel's ${nTel} bundles turned unconfirmed is rejected`, nRank >= 3 && !g7(d).ok && g7(d).errors.some((e: string) => new RegExp(`network telecel: ${nRank - 1} of ${nRank} bundles turned pending or unconfirmed at once`).test(e)), g7(d).errors.join("; ")); }
  { const d = clone(doc) as any; for (const b of d.bundles.filter((x: Bundle) => x.network === "telecel").slice(0, 2)) { b.unconfirmed = true; b.asOf = "2024-01-01"; }
    check("L2: two Telecel bundles turning unconfirmed is accepted", g7(d).ok, g7(d).errors.join("; ")); }
  { const d = clone(doc) as any; d.mtnRates.midnightOtherSource.contradicts = "price";
    check("L2: Midnight's dispute changed validity -> price is rejected", !g7(d).ok && g7(d).errors.some((e: string) => /mtnRates\.midnightOtherSource: dispute \(contradicts validity\) changed to price/.test(e)));
    d.resolvedDisputes = [{ network: "mtn", item: "mtnRates.midnightOtherSource", was: "validity" }];
    check("L2: ... unless resolvedDisputes acknowledges exactly that one", g7(d).ok, g7(d).errors.join("; ")); }
  { const d = clone(doc) as any; delete d.bundles.find((b: Bundle) => b.family === "Kokrokoo").otherSource;
    check("L2: Kokrokoo's otherSource removed is rejected", !g7(d).ok && g7(d).errors.some((e: string) => /mtn Kokrokoo Bundle: dispute \(contradicts validity\) removed/.test(e)));
    d.resolvedDisputes = [{ network: "mtn", item: "Kokrokoo Bundle", was: "price" }];
    check("L2: ... and a resolvedDisputes entry for another value does not count", !g7(d).ok); }
  { const d = clone(doc) as any; d.telecelRates.flexi.bands.reverse();
    check("L2: Flexi bands merely reordered are accepted (jumps compared by amount)", g7(d).ok, g7(d).errors.join("; "));
    d.telecelRates.flexi.bands[0].noExpiry.ghsPerMb *= 5;
    check("L2: ... but a real jump in a reordered table is still caught, at its amount", !g7(d).ok && g7(d).errors.some((e: string) => /telecelRates\.flexi noExpiry at GH¢800: ghsPerMb jumped/.test(e))); }
  check("L2: resolvedDisputes must be well formed", !validateDataset({ ...clone(doc), resolvedDisputes: [{ network: "mtn" }] }).ok);

  // L4. Telecel's own label as the name.
  const t111b = m.bundles.find((b) => b.network === "telecel" && b.price === 10 && b.label === "1.11GB")!;
  check("L4: Telecel 1.11GB @ GH¢10 is named by Telecel's own label '1.11GB', validity '5 days'", t111b.name === "1.11GB" && t111b.validity === "5 days" && t111b.family === "Daily");
  check("L4: its note explains the Weekly listing vs the terms' Daily Offers (like Bossu Weekly Extra's)", /lists it under Weekly as '1\.11GB @ GHS 10'/.test(t111b.note ?? "") && /Daily Offers \(GH¢10, 1\.11 GB, 5 Days\)/.test(t111b.note ?? ""));

  // L5. Sunday Special and Jara validity from their terms.
  const v = (n: string) => m.bundles.find((b) => b.network === "mtn" && b.name === n)!;
  check("L5: Sunday Special validity quotes its terms (PDF dated 22 Mar 2024)", ["Sunday Special GH¢1.39", "Sunday Special GH¢2.58"].every((n) => /“valid on Sunday and the next Sunday” \(MTN's Sunday Special terms, PDF dated 22 Mar 2024\)/.test(v(n).validity)));
  check("L5: Jara validity quotes its terms (11:59pm the following day; minutes and SMS 48 hours)", ["Jara GH¢1.39", "Jara GH¢2.58"].every((n) => /“expires at 11:59pm the following day”; minutes and SMS “remain valid for 48 hours” \(MTN's Jara terms, PDF dated 22 Mar 2024\)/.test(v(n).validity)));
  check("L5: no 'Not stated on tariff page' validity left", !doc.bundles.some((b) => b.validity === "Not stated on tariff page"));
  check("L5: Jara still shows its Monday–Saturday window; Sunday Special stays Sundays-only", /Monday–Saturday only/.test(m.validityText(v("Jara GH¢1.39"))) && isTimeRestricted(v("Sunday Special GH¢1.39")));

  // L6. 65 Pesewas quoted exactly, not tied to a pack; the terms' 76 Pesewas beside it.
  check("L6: the Sunday Special family text quotes 'just 65 Pesewas … inclusive Calls, Data, and SMS' and the terms' 'For only 76 Pesewas'", /'just 65 Pesewas … inclusive Calls, Data, and SMS'/.test(doc.familyInfo.mtn["Sunday Special"]) && /'For only 76 Pesewas'/.test(doc.familyInfo.mtn["Sunday Special"]));
  check("L6: no bundle ties 65 Pesewas to its pack", !doc.bundles.some((b) => /65 Pesewas/.test(JSON.stringify(b))));

  // L7. Xtrabyte amounts as MTN prints them.
  const xb = m.borrowed("mtn")[0].block.rows!.map((r) => m.borrowedVolume(r));
  check("L7: Xtrabyte volumes show as MTN prints them, in MB ('1,422 MB', '2,133 MB'), never as GB", xb.includes("1,422 MB") && xb.includes("2,133 MB") && !xb.some((x) => /GB/.test(x)), xb.join(", "));
  check("L7: AT Data Kredit keeps AT's own labels", m.borrowed("at")[0].block.rows!.every((r) => m.borrowedVolume(r) === r.label));
  check("L7: the network page and the advice card both use borrowedVolume", /model\.borrowedVolume\(r\)/.test(src7("src/pages/data-bundles/DataBundlesNetwork.tsx")) && /model\.borrowedVolume\(lo\)/.test(src7("src/components/data-bundles/Advice.tsx")));

  // L8. Rates keep 4 significant digits.
  check("L8: fmtRate keeps small rates (GH¢0.0003455, GH¢0.01965) and the usual ones (GH¢0.1145, GH¢0.0015)", m.rate(0.0003455) === "GH¢0.0003455" && m.rate(0.0196497) === "GH¢0.01965" && m.rate(0.1145) === "GH¢0.1145" && m.rate(0.0015) === "GH¢0.0015" && m.rate(0.115) === "GH¢0.115");

  // L9. Every finder and planner pick, and every headline winner, says how to buy it.
  const picks = new Map<string, Bundle>();
  for (let p = 1; p <= 100000; p += p < 2000 ? 1 : 50) for (const n of m.networks) for (const o of [{}, { noExpiryOnly: true }, { minDays: 7 }, { minDays: 30 }, { nightOnly: true }]) {
    const b = m.bestForBudget(n, p / 100, o); if (b) picks.set(`${b.network}|${b.computed ? b.rateLabel : b.name}`, b);
  }
  for (const gb of [0.5, 1, 2, 3, 5, 8, 10, 15, 20, 30, 50, 100, 200, 500]) for (const n of m.networks) for (const k of PURCHASE_CAPS) {
    const pl = m.cheapestMonthlyPlan(n, gb * 1024, k); if (pl) for (const it of pl.items) picks.set(`${it.bundle.network}|${it.bundle.computed ? it.bundle.rateLabel : it.bundle.name}`, it.bundle);
  }
  for (const b of [...m.stats.cheapestAllDay, ...m.stats.cheapestNoExpiry, ...m.stats.cheapestNight, m.stats.biggestAllDay].filter(Boolean) as Bundle[]) picks.set(`${b.network}|${b.computed ? b.rateLabel : b.name}`, b);
  const noRoute = [...picks.entries()].filter(([, b]) => !m.howToBuy(b)).map(([k]) => k);
  check(`L9: every finder/planner pick and headline winner has a buy route (${picks.size} picks)`, picks.size > 20 && noRoute.length === 0, noRoute.join(", "));
  check("L9: a Pulse pick says 'Dial *567# or use the myMTN app (Shop, then Mash Up).' and no other code", m.howToBuy(pulsePick) === "Dial *567# or use the myMTN app (Shop, then Mash Up).", m.howToBuy(pulsePick) ?? "");
  check("L9: an MTN regular-data pick names the myMTN app section that sells it", /In the myMTN app: “Data Bundles”, then “Low Cost Non Expiry Bundles”/.test(m.howToBuy(m.regularBundle(20)!) ?? ""));
  check("L9: Telecel data-terms bundles get the terms' channels; Special offers keep their own narrower line", /^Dial \*700# or \*110#, or use the My Telecel Play App/.test(m.howToBuy(m.bundles.find((b) => b.name === "263.38GB Monthly")!) ?? "") && m.bundles.filter((b) => b.family === "Special offer").every((b) => m.howToBuy(b) === "Dial *110# or use the Telecel Play app"));
  check("L9: Telecel Flexi picks name *700#, *110# and the Telecel Play app", m.howToBuy(m.bestForBudget("telecel", 500)!) === "Dial *700# or *110#, or use the Telecel Play app (Telecel's data terms).", m.howToBuy(m.bestForBudget("telecel", 500)!) ?? "");
  check("L9: the finder shows the channel and the planner shows how to buy each purchase", /<ChannelNote model=\{model\} b=\{b\} \/>/.test(src7("src/components/data-bundles/BudgetFinder.tsx")) && /testId="plan-buy"/.test(src7("src/components/data-bundles/MonthlyPlanner.tsx")));

  // L10. The Pulse "who may buy it" sentence once.
  const pulseNotes = dedupeNotes([doc.familyInfo.mtn.Pulse, R.pulse.note, R.pulse.minSpend!.note]);
  check("L10: the Pulse calculator says 'No MTN source says who may or may not buy it' once", (pulseNotes.join(" ").match(/No MTN source says who may or may not buy it/g) ?? []).length === 1 && (pulseNotes.join(" ").match(/aims Pulse at young customers/g) ?? []).length === 1 && /data-only Pulse rates per MB/.test(pulseNotes.join(" ")));
  check("L10: the calculator notes are de-duplicated", /dedupeNotes\(calc\.notes\)/.test(calcSrc));

  // L11. SME bundles out of the mobile data families.
  {
    const allFam = m.stats.familiesWithFigures + m.stats.familiesDescribedOnly;
    check(`L11: SME bundles (MTN's article mentions no data) are not a family; MTN has 13 families, ${allFam} in all (with figures + described only)`, !m.familiesOf("mtn").includes("SME bundles") && m.familiesOf("mtn").length === 13 && m.stats.familyCount === allFam && m.stats.familyCount === m.networks.reduce((t, n) => t + m.familiesOf(n).length, 0), `${m.familiesOf("mtn").length} / ${m.stats.familyCount}`);
  }
  check("L11: no SME citation left", !(R.citedSources ?? []).some((c) => /36652796705426/.test(c.url)));

  // L12. MTN's auto-renew answer, verbatim and cited.
  const ar = (R as any).autoRenew;
  check("L12: MTN help centre 5055920171154 (last edited 6 Jul 2026) quoted verbatim: send STOP to 138", ar?.says === "It’s simple. Just send STOP to the short code 138 via SMS. And the good news is, there are no charges for this service!" && /5055920171154$/.test(ar?.url) && ar?.updated === "2026-07-06" && (R.citedSources ?? []).some((c) => c.url === ar.url && c.date === "2026-07-06" && c.dateLabel === "last edited"));
  check("L12: the rollover/auto-renew card shows MTN's entry, and no MTN fixed daily/weekly/monthly bundles were added", /MTN: stopping auto-renewal/.test(src7("src/components/data-bundles/Advice.tsx")) && !doc.bundles.some((b) => b.network === "mtn" && /^(Daily|Weekly|Monthly)/.test(b.family)));
}
// ------------------------------------------------------------------ audit 8 (18 Oct 2026)
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { FlexiCliffHint, flexiDefaultAmount } = await import("../src/components/data-bundles/TelecelFlexiCalculator");
  const { MtnCalculators, dedupeNotes } = await import("../src/components/data-bundles/MtnCalculators");
  const sch8 = await import("../src/lib/dataBundleSchema.js");
  const lib8 = await import("../src/lib/dataBundles");
  const snap8 = await import("../src/lib/bundleSnapshot");
  const src8 = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const g8 = (d: any) => compareToBaseline(d, doc);
  const has8 = (d: any, re: RegExp) => g8(d).errors.some((e: string) => re.test(e));
  const bnd = (d: any, n: string) => d.bundles.find((b: Bundle) => b.name === n);

  // M1. Single bundle / band moves outside 0.67x-1.5x need a checker-written acceptedChanges entry.
  check("M1 (a8): MOVE_RANGE is 0.67x-1.5x, the checker's validate.MOVE_RANGE", sch8.MOVE_RANGE[0] === 0.67 && sch8.MOVE_RANGE[1] === 1.5);
  { const d = clone(doc) as any; bnd(d, "263.38GB Monthly").price = Math.round(400 / 3.9 * 100) / 100;
    check("M1 (a8): Telecel 263.38GB Monthly GH¢400 / 3.9 is rejected", has8(d, /telecel\|263\.38GB Monthly: price moved 400 -> 102\.56 \(x0\.26/), g8(d).errors.join("; "));
    d.acceptedChanges = [{ item: "telecel|263.38GB Monthly", field: "price", from: 400, to: 102.56 }];
    check("M1 (a8): ... and accepted when acceptedChanges lists that exact move", g8(d).ok && validateDataset(d).ok, g8(d).errors.join("; "));
    d.acceptedChanges = [{ item: "telecel|263.38GB Monthly", field: "price", from: 400, to: 99 }];
    check("M1 (a8): ... but an entry for another value does not count", !g8(d).ok); }
  { const d = clone(doc) as any; bnd(d, "BigTime Data GH¢400").price = Math.round(400 / 3.9 * 100) / 100;
    check("M1 (a8): AT BigTime GH¢400 price / 3.9 is rejected", has8(d, /at\|BigTime Data GH¢400: price moved 400 -> 102\.56/)); }
  { const d = clone(doc) as any; for (const b of d.telecelRates.flexi.bands) if (b.from === 400) b.noExpiry.ghsPerMb /= 3.9;
    check("M1 (a8): Flexi GH¢400–599.99 no-expiry rate / 3.9 is rejected at its amount", has8(d, /telecelRates\.flexi noExpiry at GH¢400: ghsPerMb moved 0\.0015 -> 0\.000384/), g8(d).errors.join("; "));
    d.acceptedChanges = [{ item: "telecelRates.flexi noExpiry", field: "ghsPerMb", at: 400, from: 0.0015, to: 0.0015 / 3.9 }];
    check("M1 (a8): ... accepted with its acceptedChanges entry (item, at, to)", g8(d).ok, g8(d).errors.join("; ")); }
  { const d = clone(doc) as any; bnd(d, "2Moorch 22MB").price = 0.5 * 3.9;
    check("M1 (a8): a single price x3.9 (under the old 4x limit) is rejected", has8(d, /telecel\|2Moorch 22MB: price moved 0\.5 -> 1\.95/)); }
  { const d = clone(doc) as any; const b = bnd(d, "Sika Kokoo GH¢3"); b.mb = Math.round(b.mb * 3.9 * 100) / 100;
    check("M1 (a8): Sika Kokoo GH¢3 volume x3.9 is rejected", has8(d, /at\|Sika Kokoo GH¢3: mb moved/)); }
  { const d = clone(doc) as any; bnd(d, "2Moorch 22MB").price = 0.55; bnd(d, "Sika Kokoo GH¢3").price = 3.5;
    check("M1 (a8): normal small price changes still flow (x1.1, x1.17)", g8(d).ok, g8(d).errors.join("; ")); }
  { const d = clone(doc) as any; bnd(d, "2Moorch 22MB").price = 5;
    check("M1 (a8): a move beyond 4x still reads 'jumped'", has8(d, /2Moorch 22MB: price jumped 0\.5 -> 5 \(more than 4x\)/)); }
  check("M1 (a8): acceptedChanges and liftedConditions must be well formed", !validateDataset({ ...clone(doc), acceptedChanges: [{ item: "x" }] }).ok && !validateDataset({ ...clone(doc), liftedConditions: [{ network: "mtn" }] }).ok);

  // M2. An unconfirmed (suspect) band keeps its mark while its rate is unchanged.
  { const d = clone(doc) as any; delete d.mtnRates.pulse.data[1].unconfirmed;
    check("M2 (a8): Pulse GH¢5–9.99 losing 'unconfirmed' with the same rate is rejected", has8(d, /mtnRates\.pulse\.data: band 5–9\.99 lost its unconfirmed mark/), g8(d).errors.join("; "));
    d.mtnRates.pulse.data[1].ghsPerMb = 0.019;
    check("M2 (a8): ... (MTN correcting the rate is a rate change, judged by the move rule)", !has8(d, /lost its unconfirmed mark/)); }

  // M3. Conditional flags can't be dropped without liftedConditions.
  { const d = clone(doc) as any; for (const b of d.bundles) if (b.family === "Jara") { delete b.conditional; delete b.conditionalReason; }
    check("M3 (a8): Jara losing its regional flag is rejected", has8(d, /mtn Jara GH¢1\.39: no longer conditional \(was regional\)/), g8(d).errors.join("; "));
    d.liftedConditions = [{ network: "mtn", name: "Jara GH¢1.39", was: "regional" }, { network: "mtn", name: "Jara GH¢2.58", was: "regional" }];
    check("M3 (a8): ... accepted when liftedConditions lists both", g8(d).ok, g8(d).errors.join("; ")); }
  { const d = clone(doc) as any; const b = bnd(d, "Association GH¢10"); b.conditional = false; delete b.conditionalReason;
    check("M3 (a8): a curated eligibility flag (Association) dropped is rejected", has8(d, /Association GH¢10: no longer conditional \(was eligibility\)/)); }

  // Remaining gaps: minimum spend, verification, citedSources, familyInfo.
  { const d = clone(doc) as any; delete d.mtnRates.pulse.minSpend; check("gap (a8): Pulse minSpend dropped is rejected", has8(d, /pulse\.minSpend disappeared/)); }
  { const d = clone(doc) as any; d.verification = "x"; check("gap (a8): verification text gutted is rejected", has8(d, /verification text cut/)); }
  { const d = clone(doc) as any; d.mtnRates.citedSources = d.mtnRates.citedSources.slice(0, 3); check("gap (a8): citedSources cut to 3 is rejected", has8(d, /citedSources: 3 sources vs/)); }
  { const d = clone(doc) as any; d.familyInfo.telecel = { Daily: d.familyInfo.telecel.Daily }; check("gap (a8): familyInfo.telecel cut to one family is rejected", has8(d, /familyInfo\.telecel: cut by more than half/)); }
  { const d = clone(doc) as any; for (const k of Object.keys(d.familyInfo.at)) d.familyInfo.at[k] = "x"; check("gap (a8): familyInfo.at gutted (same keys, no text) is rejected", has8(d, /familyInfo\.at: cut by more than half/)); }

  // L1-L4: sources and quotes.
  const cs8 = new Map((R.citedSources ?? []).map((c) => [c.url.split("/").pop(), c]));
  check("L1 (a8): AFA 9925643807122 (last edited 3 Feb 2023) and Association 13972127109010, 13972351541778, 13972695671698 (24 Nov 2023) are cited",
    cs8.get("9925643807122")?.date === "2023-02-03" && ["13972127109010", "13972351541778", "13972695671698"].every((a) => cs8.get(a)?.date === "2023-11-24" && cs8.get(a)?.for.includes("Association bundle")) && /'It has a duration period of 30 days'/.test(doc.familyInfo.mtn["AFA bundle"]));
  check("L2 (a8): Social steps quoted as MTN's article gives them, including 'Select option 1 to Buy for self'", /'Proceed to buy bundle \(No 4G bonus\)', 'Select option 99 for More', 'Select option 4 for Social Bundle', 'Select option 1 to Buy for self'/.test(doc.familyInfo.mtn["Social bundles"]) && !/then 1, 99 and 4/.test(doc.familyInfo.mtn["Social bundles"]));
  const pos8 = (R.pulse as any).otherSource;
  check("L3 (a8): Pulse's older table includes 'GHS5.00 246.43MB' and says it supports the slip reading", /GHS5\.00 246\.43MB 0 Mins/.test(pos8.says) && /GH¢5 for 246\.43MB/.test(pos8.summary) && /supports treating that tariff rate as a slip/.test(pos8.summary));
  check("L4 (a8): Sunday Special: 76 Pesewas = the terms' Option 1 (GH¢0.76, no data), the page's 65 Pesewas names no pack", /'Cost of offer subscription is Ghc0\.76'/.test(doc.familyInfo.mtn["Sunday Special"]) && /'Sunday Special – 20mins, 10SMS \( all net\)' at 0\.750/.test(doc.familyInfo.mtn["Sunday Special"]) && !/neither names a pack/.test(doc.familyInfo.mtn["Sunday Special"]));

  // L5. Flexi cliff hints: material only, and visible at the displayed precision.
  const f8 = m.flexi!;
  const fmt8 = (mb: number) => m.fmtData(mb, "telecel");
  const mcl = (t: RateBand[], a: number) => lib8.cliffAt(m.materialCliffsOf(t), a);
  const hint8 = (a: number) => renderToStaticMarkup(React.createElement(FlexiCliffHint, { model: m, amount: a, ne: mcl(f8.noExpiry, a), ex: mcl(f8.expiry, a), fmt: fmt8, onUse: () => {} }) as any).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  check("L5 (a8): materiality is >= 1 MB and >= 0.5% more", lib8.CLIFF_MIN_GAIN_MB === 1 && lib8.CLIFF_MIN_GAIN_SHARE === 0.005);
  check("L5 (a8): material no-expiry cliffs 5–5.80, 10–12.37, 20–20.77 (were to 5.83, 12.43, 20.88); with-expiry 10–13.66 (was 13.73)",
    JSON.stringify(m.materialCliffsOf(f8.noExpiry).map((c) => [c.from, c.to])) === "[[5,5.8],[10,12.37],[20,20.77]]" && JSON.stringify(m.materialCliffsOf(f8.expiry).map((c) => [c.from, c.to])) === "[[10,13.66]]");
  check("L5 (a8): every amount in a material cliff gains >= 1 MB and >= 0.5%; the next pesewa up does not",
    [...m.materialCliffsOf(f8.noExpiry).map((c) => [f8.noExpiry, c] as const), ...m.materialCliffsOf(f8.expiry).map((c) => [f8.expiry, c] as const)].every(([t, c]) => {
      for (let p = Math.round(c.from * 100); p <= Math.round(c.to * 100); p++) if (!lib8.isMaterialGain(lib8.cliffGain(t, c, p / 100))) return false;
      const next = Math.round(c.to * 100 + 1) / 100; const whole = m.cliffsOf(t).find((w) => next <= w.to + 1e-9 && next >= w.from - 1e-9);
      return !whole || !lib8.isMaterialGain(lib8.cliffGain(t, whole, next));
    }));
  check("L5 (a8): no hint at GH¢13.70 (in the with-expiry cliff, but under 0.5% less)", hint8(13.7) === "" && !!m.cliffsOf(f8.expiry).find((c) => 13.7 >= c.from && 13.7 <= c.to));
  check("L5 (a8): at GH¢12.40 only the with-expiry option is hinted (the no-expiry gain is under 0.5% there)", /^With-expiry option:/.test(hint8(12.4)) && !/No-expiry option/.test(hint8(12.4)), hint8(12.4).slice(0, 60));
  const h1237 = hint8(12.37);
  check("L5 (a8): at GH¢12.37, where GB rounding shows both as 1.08 GB, the no-expiry figures are in MB", /GH¢9\.99 buys 1,110 MB/.test(h1237) && /no-expiry 1,104\.46 MB/.test(h1237) && !/no-expiry 1\.08 GB/.test(h1237), h1237);
  check("L5 (a8): the hint says 'at least 1 MB and 0.5% less'", /every amount from GH¢10 to GH¢12\.37 buys at least 1 MB and 0\.5% less/.test(h1237));
  check("L5 (a8): the first amount is still GH¢25 (in no cliff of either option)", flexiDefaultAmount(m) === 25);
  check("L5 (a8): the calculator passes material cliffs only", /cliffAt\(model\.materialCliffsOf\(flexi\.noExpiry\), amount\)/.test(src8("src/components/data-bundles/TelecelFlexiCalculator.tsx")));

  // L6. "Dial *110# or use the Telecel Play app".
  check("L6 (a8): dialText adds 'use' before an app", lib8.dialText("*110# or the Telecel Play app") === "Dial *110# or use the Telecel Play app" && lib8.dialText("*703# or *111*7*2#") === "Dial *703# or *111*7*2#" && lib8.dialText("*5060#, then 2") === "Dial *5060#, then 2");
  const texts8 = m.bundles.map((b) => m.howToBuy(b) ?? "").join(" | ");
  check("L6 (a8): no 'Dial ... or the ... app' left in any how-to-buy line", !/Dial [^|]*\bor the [^|*]*\bapp\b/i.test(texts8.replace(/or use the/g, "")), texts8.match(/Dial [^|]*or the [^|]*app/i)?.[0] ?? "");

  // L7. Every listed row says how to buy it.
  const noRoute8 = m.bundles.filter((b) => !m.howToBuy(b)).map((b) => b.name);
  check(`L7 (a8): every one of the ${m.bundles.length} listed rows has a how-to-buy line`, noRoute8.length === 0, noRoute8.join(", "));
  check("L7 (a8): Telecel Voice & Data Combo (23) quote the bundles page; Boss Plan (2) its page's *5959# or *700#",
    m.bundles.filter((b) => b.family === "Voice & Data Combo").length === 23 && m.bundles.filter((b) => b.family === "Voice & Data Combo").every((b) => /“Kindly login to your mobile account to subscribe”/.test(m.howToBuy(b)!)) &&
    m.bundles.filter((b) => b.family === "Boss Plan").every((b) => /^Dial \*5959# or \*700#, or use the Telecel Play app/.test(m.howToBuy(b)!)));
  check("L7 (a8): MTN Video bundles name the myMTN app section they were recorded from", m.howToBuy(m.bundles.find((b) => b.name === "Video GH¢1")!) === "In the myMTN app: “Video Bundles” (as the app showed it, screenshot 17 Oct 2026).");

  // L8. "spent on MTN Pulse", not "MTN Pulse, GH¢1".
  const pp8 = m.bestForBudget("mtn", 1)!;
  check("L8 (a8): a worked-out pick is named by its rate table in 'spent on ...'", m.spendName(pp8) === pp8.rateLabel && !/GH¢/.test(m.spendName(pp8)) &&
    /spent on \{model\.spendName\(best\)\}/.test(src8("src/components/data-bundles/Advice.tsx")) && /spent on \{model\.spendName\(best\)\}/.test(src8("src/pages/data-bundles/DataBundlesNetwork.tsx")));

  // L9. Ten minutes of clock skew, one constant; the checker's own timestamps pass.
  check("L9 (a8): MAX_FUTURE_MS is 10 minutes, shared", sch8.MAX_FUTURE_MS === 600_000 && snap8.MAX_FUTURE_MS === sch8.MAX_FUTURE_MS);
  const t8 = Date.parse("2026-10-18T09:00:00Z");
  check("L9 (a8): a row the checker just wrote (captured_at '+00:00' with microseconds, capturedAt '...Z') passes; +11 min does not",
    sch8.futureDate({ captured_at: "2026-10-18T09:00:00.123456+00:00", checked_at: "2026-10-18T09:00:00.123456+00:00", data: { capturedAt: "2026-10-18T09:00:00Z" } }, t8) === null &&
    sch8.futureDate({ captured_at: "2026-10-18T09:09:59+00:00", data: {} }, t8) === null && sch8.futureDate({ captured_at: "2026-10-18T09:11:00+00:00", data: {} }, t8) === "2026-10-18T09:11:00+00:00");
  await prebuildCase("L9 (a8): prebuild keeps the committed file for a row 30 min ahead", { ...clone(doc), bundles: [{ ...doc.bundles[0], mb: doc.bundles[0].mb + 1 }, ...doc.bundles.slice(1)], capturedAt: new Date(captureTime(doc.capturedAt) + 1800_000).toISOString().replace(/\.\d{3}Z$/, "Z") } as any,
    new Date(captureTime(doc.capturedAt) + 1800_000).toISOString(), false, /dated in the FUTURE .*more than 10 minutes ahead/, new Date(captureTime(doc.capturedAt) + 60_000).toISOString(), new Date(captureTime(doc.capturedAt) + 1800_000).toISOString());

  // L10. Precise counts.
  const verified8 = m.bundles.filter((b) => !isPending(b) && !isUnconfirmed(b));
  {
    const compared8 = verified8.filter((b) => canWin(b) && GROUPS.some((g) => g.test(b))).length;
    const verifiedRaw8 = doc.bundles.filter((b) => (b.kind as string) !== "router" && b.pending !== true && b.unconfirmed !== true).length;
    check(`L10 (a8): 'compared' counts only bundles ranked in a like-for-like group (${compared8} of ${verifiedRaw8})`, m.stats.comparedCount === compared8 && m.stats.fixedCount === verifiedRaw8 && compared8 > 0 && compared8 < verifiedRaw8, `${m.stats.comparedCount}/${m.stats.fixedCount}`);
    // Families with figures, counted from the dataset: every family with bundles, plus each network's
    // rate-table families (MTN Regular, Midnight, Pulse; Telecel Flexi). Retired families with no
    // bundles (Telecel Special offer, MTN Voice + data special) are never listed, even if their text stays.
    const withFigRaw = m.networks.reduce((t, n) => t + new Set([...doc.bundles.filter((b) => b.network === n && (b.kind as string) !== "router").map((b) => b.family), ...m.rateFamilies(n)].filter((f) => !m.borrowed(n).some((x) => x.title === f))).size, 0);
    const retired = ((doc as any).retiredFamilies ?? []) as { network: string; family: string }[];
    const listed = m.networks.flatMap((n) => [...m.familyCounts(n).withFigures, ...m.familyCounts(n).describedOnly].map((f) => `${n}|${f}`));
    check(`L10 (a8): families: ${withFigRaw} with figures plus 2 described without figures (Just4U, Adwumapa); retired families are never listed`,
      m.stats.familiesWithFigures === withFigRaw && m.stats.familiesDescribedOnly === 2 && JSON.stringify(m.familyCounts("mtn").describedOnly) === '["Just4U","Adwumapa"]' &&
      retired.every((x) => !listed.includes(`${x.network}|${x.family}`) || doc.bundles.some((b) => b.network === x.network && b.family === x.family)), `${m.stats.familiesWithFigures} vs ${withFigRaw}; ${JSON.stringify(m.familyCounts("telecel").describedOnly)}`);
    const back = clone(doc) as any; back.bundles.push({ ...clone(doc.bundles.find((b) => b.network === "telecel")!), name: "TEST back", family: "Special offer", pending: true });
    check("L10 (a8): a retired family that has bundles again is listed again (with figures)", createBundleModel(back).familyCounts("telecel").withFigures.includes("Special offer"));
  }
  check("L10 (a8): the network cards and network page show the two counts apart", /plus \$\{famDescribed\} described without figures/.test(src8("src/components/data-bundles/NetworkCards.tsx")) && /described without figures/.test(src8("src/pages/data-bundles/DataBundlesNetwork.tsx")));

  // L11. Telecel "1.11GB" vs Downloader Hour's "1.11GB".
  check("L11 (a8): Telecel's 1.11GB shows as '1.11GB · 5 days' in lists; Downloader Hour keeps its name", m.listName(m.bundles.find((b) => b.name === "1.11GB")!) === "1.11GB · 5 days" && m.listName(m.bundles.find((b) => b.name === "Downloader Hour")!) === "Downloader Hour");
  // Round 2: cards show model.nameNoPrice (listName without the price it prints) plus "Pay GH¢X" once.
  check("L11 (a8): every list uses listName (directly, or as model.nameNoPrice)", ["BundleTable.tsx", "Leaderboards.tsx", "BudgetFinder.tsx", "MonthlyPlanner.tsx", "NetworkCards.tsx"].every((f) => /model\.(listName|nameNoPrice)\(/.test(src8("src/components/data-bundles/" + f))) && /const full = listName\(b\);/.test(src8("src/lib/dataBundles.ts")));

  // L14. Room for the site-wide assistant button on these pages only.
  // Redesign 1: the comparison page has no hero tiles any more (the console replaced them); the
  // headless check measures that nothing on the first screen sits under the button.
  check("L14 (a8): both pages end with room for the assistant button (and the button itself is unchanged)", /pb-28 pt-10/.test(src8("src/pages/data-bundles/DataBundlesDashboard.tsx")) && /pb-28 pt-6 pr-7/.test(src8("src/pages/data-bundles/DataBundlesNetwork.tsx")) && !/pr-16|pb-28/.test(src8("src/components/ai/AIChatInterface.tsx")));

  // Pulse: *567# (owner's live test, 18 Oct 2026) is the only code shown.
  const calcHtml = renderToStaticMarkup(React.createElement(MtnCalculators, { model: m }) as any);
  const pulseNotes8 = dedupeNotes([doc.familyInfo.mtn.Pulse, R.pulse.note, R.pulse.minSpend?.note, (R.pulse as any).ussdNote]).join(" ");
  const pulsePicks8 = [0.5, 1, 2, 7, 15, 25, 30].map((a) => m.bestForBudget("mtn", a)).filter((b) => b && b.family === "Pulse").map((b) => m.howToBuy(b!)).join(" ");
  check("Pulse (a8): no '*117#' or '*115#' in the Pulse family text, calculator notes, calculator markup or any Pulse pick's how-to-buy",
    !/\*11[57]#/.test(pulseNotes8 + calcHtml + pulsePicks8 + JSON.stringify(doc)) && pulsePicks8.length > 0 && /Dial \*567# or use the myMTN app \(Shop, then Mash Up\)\./.test(pulsePicks8));
  check("Pulse (a8): the calculator shows where *567# comes from (live test 18 Oct 2026)", /dialling \*567# on 18 Oct 2026 opened MTN Pulse/.test(pulseNotes8) && /r\.pulse\.ussdNote/.test(src8("src/components/data-bundles/MtnCalculators.tsx")));

  // Owner's decision (18 Oct 2026): ordinary price changes go live even when they change a winner.
  // The guard has no winner rule; only moves outside 0.67x-1.5x need acceptedChanges.
  { const d = clone(doc) as any; bnd(d, "BigTime Data GH¢400").price = 380;
    const w = createBundleModel(d as BundleDataset);
    check("winner (owner 18 Oct): AT BigTime GH¢400 -> GH¢380 (x0.95) makes it the cheapest all-day and never-expires GB",
      m.stats.cheapestNoExpiry[0]?.network === "telecel" && w.stats.cheapestNoExpiry.map((b) => b.name).join() === "BigTime Data GH¢400" && w.stats.cheapestAllDay.map((b) => b.name).join() === "BigTime Data GH¢400",
      `${m.stats.cheapestNoExpiry.map((b) => b.name)} -> ${w.stats.cheapestNoExpiry.map((b) => b.name)}`);
    check("winner (owner 18 Oct): ... and the guard accepts that snapshot with no acceptedChanges entry", g8(d).ok && validateDataset(d).ok && d.acceptedChanges === undefined, g8(d).errors.join("; ")); }
  { const d = clone(doc) as any; bnd(d, "BigTime Data GH¢400").price = Math.round(400 / 3.9 * 100) / 100;
    check("winner (owner 18 Oct): the same winner change from a /3.9 move is still rejected (by the move rule)", !g8(d).ok && has8(d, /at\|BigTime Data GH¢400: price moved 400 -> 102\.56/), g8(d).errors.join("; ")); }
  { const d = clone(doc) as any; for (const b of d.telecelRates.flexi.bands) b.noExpiry.ghsPerMb *= 1.1;
    const w = createBundleModel(d as BundleDataset);
    check("winner (owner 18 Oct): Telecel Flexi no-expiry rates x1.1 hand never-expires to another bundle and are accepted",
      w.stats.cheapestNoExpiry.every((b) => !b.computed) && g8(d).ok, `${w.stats.cheapestNoExpiry.map((b) => b.name)}; ${g8(d).errors.join("; ")}`); }

  // What each network has in the rankings (fixed bundles and rows from pay-any-amount rates).
  { const rk = (n?: string) => m.rankedCounts(n);
    const mtnR = rk("mtn"), telR = rk("telecel"), atR = rk("at"), allR = rk();
    check("ranked: MTN has no ranked fixed bundle but 16 rate rows (MTN data, Midnight, Pulse), so it is 'ranked through its rates'",
      mtnR.fixed === 0 && mtnR.rateRows === 16 && JSON.stringify(mtnR.rateLabels) === '["MTN data","MTN Midnight","MTN Pulse"]' && JSON.stringify(mtnR.rateOnly) === '["mtn"]', JSON.stringify(mtnR));
    // Fixed counts from the dataset's own bundles (verified, may win, in a like-for-like group).
    const fixedRaw = (n: string) => m.bundles.filter((b) => b.network === n && !isPending(b) && !isUnconfirmed(b) && canWin(b) && GROUPS.some((g) => g.test(b))).length;
    check(`ranked: Telecel ${fixedRaw("telecel")} fixed + 24 Flexi rows, AT ${fixedRaw("at")} fixed and no rate rows`,
      telR.fixed === fixedRaw("telecel") && telR.fixed > 0 && telR.rateRows === 24 && JSON.stringify(telR.rateLabels) === '["Telecel Flexi"]' && atR.fixed === fixedRaw("at") && atR.fixed > 0 && atR.rateRows === 0, `${JSON.stringify(telR)} ${JSON.stringify(atR)}`);
    check("ranked: fixed counts equal bundleCounts().ranked per network and the hero's comparedCount overall; rows add up",
      m.networks.every((n) => rk(n).fixed === m.bundleCounts(n).ranked) && allR.fixed === m.stats.comparedCount &&
      allR.rateRows === m.networks.reduce((t, n) => t + rk(n).rateRows, 0) && allR.rateRows === 40 && JSON.stringify(allR.rateOnly) === '["mtn"]' && JSON.stringify(allR.rateNetworks) === '["mtn","telecel"]', JSON.stringify(allR));
    check("ranked: every rate row counted is a ranked leaderboard row (computed from a rate table)",
      m.networks.every((n) => { const ids = new Set(GROUPS.flatMap((g) => m.leaderboardRows(g.id, n).ranked.map((r) => r.bundle)).filter((b) => b.computed)); return ids.size === rk(n).rateRows; }));
    const lines = Object.fromEntries(m.networks.map((n) => [n, m.rankedLine(n)]));
    check("ranked line: MTN says it is ranked through its pay-any-amount rates, never '0 ranked like for like'",
      lines.mtn === "None ranked as fixed bundles: MTN data is ranked through its pay-any-amount rates, 16 rows in the rankings (MTN data, MTN Midnight, MTN Pulse; see the calculator)", lines.mtn);
    check("ranked line: Telecel and AT", lines.telecel === `${telR.fixed} ranked like for like, plus 24 rows from Telecel's pay-any-amount rates (Telecel Flexi)` && lines.at === `${atR.fixed} ranked like for like`, JSON.stringify(lines));
    check("ranked line: no network reads '0 ranked', NaN or undefined", Object.values(lines).every((l) => !/^0 ranked|NaN|undefined/.test(l)));
    const netSrc = src8("src/pages/data-bundles/DataBundlesNetwork.tsx");
    const dashSrc = src8("src/pages/data-bundles/DataBundlesDashboard.tsx");
    check("ranked: the network page's 'Fixed bundles' line comes from model.rankedLine (no bare '${ranked} ranked like for like')",
      /\{model\.rankedLine\(network\)\}/.test(netSrc) && !/\$\{ranked\} ranked like for like/.test(netSrc));
    check("ranked: the hero names the rate rows and the networks ranked only through rates (model.rankedCounts)",
      /const rc = model\.rankedCounts\(\);/.test(dashSrc) && /We also rank \{rc\.rateRows\} prices worked out from \{possessive\(rc\.rateNetworks\)\} pay-any-amount price lists/.test(dashSrc) &&
      /\{rateOnlyNames\} data is ranked only this way/.test(dashSrc) && /The other \{s\.fixedCount - s\.comparedCount\} fixed bundles are listed but not ranked/.test(dashSrc)); }
}

// ------------------------------------------------------------------ redesign 1 (18 Oct 2026): command centre
{
  const React = await import("react");
  (globalThis as any).React = React; // classic JSX runtime under tsx
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const lib = await import("../src/lib/dataBundles");
  const { fmtValue, VALUE_STEP } = lib;
  const { BudgetFinder, CHIPS } = await import("../src/components/data-bundles/BudgetFinder");
  const { NetworkPanels, panelPicks, PANEL_CATEGORIES } = await import("../src/components/data-bundles/NetworkPanels");
  const { Leaderboards, TOP } = await import("../src/components/data-bundles/Leaderboards");
  const { MonthlyPlanner } = await import("../src/components/data-bundles/MonthlyPlanner");
  const { BundleTable } = await import("../src/components/data-bundles/BundleTable");
  const { Advice, buildTips } = await import("../src/components/data-bundles/Advice");
  const { SourcesAndDisclaimer, LiveStatus } = await import("../src/components/data-bundles/meta");
  const { DATA_BUNDLE_COUNTRIES } = await import("../src/data/dataBundleCountries");
  const srcR = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const html = (el: unknown) => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/tools-preview/data-bundles/ghana" }, el as any) as any);
  const textOf = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const byName = (name: string) => m.bundles.find((b) => b.name === name)!;

  // 1. The GH¢10 value: MB x 10 / price at 1,024 MB per GB, 2 decimals in GB, whole MB below 1 GB.
  const kok = m.bundles.find((b) => b.family === "Kokrokoo")!;
  check("value: Kokrokoo GH¢1.22 / 460.11 MB -> 'Value: 3.68 GB per GH¢10'", kok.price === 1.22 && kok.mb === 460.11 && m.valueText(kok) === "3.68 GB" && m.valuePer(kok) === "3.68 GB per GH¢10" && m.valueLine(kok) === "Value: 3.68 GB per GH¢10", String(m.valueLine(kok)));
  const valueCases: [string, string][] = [["263.38GB Monthly", "6.58 GB"], ["Night King 10.03GB", "33.43 GB"], ["Night King 4.02GB", "20.10 GB"], ["BigTime Data GH¢1", "510 MB"], ["BigTime Data GH¢3", "1.27 GB"], ["BigTime Data GH¢5", "1.09 GB"], ["Social GH¢1", "825.7 MB"], ["Streamer Hour", "4.36 GB"]];
  for (const [name, want] of valueCases) {
    const b = byName(name);
    check(`value: ${name} (${b?.price} / ${b?.mb} MB) -> ${want}`, !!b && m.valueText(b) === want && near((b.mb * 10) / b.price, m.valueMb(b)!, 1e-9), String(b && m.valueText(b)));
  }
  check("value: VALUE_STEP is 10 and the line is 'Value: ... per GH¢10' (never 'Every GH¢10 = ...')", VALUE_STEP === 10 && m.valueStep === 10 && /^Value: [\d.,]+ (GB|MB) per GH¢10$/.test(m.valueLine(kok)!) && m.all.every((b) => !/Every GH¢10/.test(m.valueLine(b) ?? "")));
  check("value: fmtValue precision and unit boundary (after rounding)", fmtValue(1023.6, 1024) === "1.00 GB" && fmtValue(1023.4, 1024) === "1,023.4 MB" && fmtValue(825.7, 1024) === "825.7 MB" && fmtValue(510, 1024) === "510 MB" && fmtValue(15360, 1024) === "15.00 GB" && fmtValue(0.5, 1024) === "0.50 MB" && fmtValue(NaN, 1024) === "" && fmtValue(0, 1024) === "");
  const withVol = m.all.filter((b) => hasVolume(b) && b.price > 0);
  check(`value: every one of ${withVol.length} bundles and rate rows with a volume has a value equal to fmtValue(mb x 10 / price), never NaN`,
    withVol.every((b) => m.valueText(b) === fmtValue((b.mb * 10) / b.price, m.mbPerGb(b.network)) && !/NaN|Infinity|undefined/.test(m.valueLine(b)!)));
  check("value: no volume (unlimited) -> no value figure", m.bundles.filter((b) => !hasVolume(b)).every((b) => m.valueMb(b) === null && m.valueLine(b) === null));
  const bandRows = m.computed.filter((b) => b.band);
  const rateOf = (b: Bundle) => bandFor(b.band!.to, m.sources.find((x) => x.label === b.rateLabel && x.network === b.network)!.table)!.ghsPerMb;
  check(`value: every one of ${bandRows.length} rate rows is worth GH¢10 / its published rate`, bandRows.every((b) => near(m.valueMb(b)!, 10 / rateOf(b), 1e-6)));
  const flexTopRow = m.stats.cheapestNoExpiry[0];
  check("value: Telecel Flexi no expiry GH¢400–GH¢999.99 -> Every GH¢10 = 6.51 GB (= GH¢10 / its rate)", m.valueText(flexTopRow) === "6.51 GB" && m.valueText(flexTopRow) === fmtValue(10 / rateOf(flexTopRow), 1024), String(m.valueText(flexTopRow)));
  let inversions = 0, jointDiff: string[] = [];
  for (const g of GROUPS) for (const net of [undefined, ...m.networks]) {
    const { ranked } = m.leaderboardRows(g.id, net);
    for (let i = 1; i < ranked.length; i++) {
      if (m.valueMb(ranked[i].bundle)! > m.valueMb(ranked[i - 1].bundle)! + 1e-9) inversions++;
      if (!net && ranked[i].rank === ranked[i - 1].rank && m.valueText(ranked[i].bundle) !== m.valueText(ranked[i - 1].bundle)) jointDiff.push(`${g.id}: ${ranked[i - 1].bundle.name} ${m.valueText(ranked[i - 1].bundle)} / ${ranked[i].bundle.name} ${m.valueText(ranked[i].bundle)}`);
    }
  }
  check("value: on every board the GH¢10 value order is exactly the price-per-GB order (no rank changed)", inversions === 0, String(inversions));
  check("tie (owner's rule): no joint rank ever shows two different GH¢10 values", jointDiff.length === 0, jointDiff.join("; "));
  {
    const night = m.leaderboardRows("night").ranked;
    const mid = night.find((r) => r.bundle.name === "MTN Midnight, GH¢0.01–GH¢2.99"), nk = night.find((r) => r.bundle.name === "Night King 4.02GB");
    check("tie: MTN Midnight (20.11 GB) and Night King 4.02GB (20.10 GB) are no longer joint, though both are GH¢0.50/GB",
      !!mid && !!nk && m.valueText(mid.bundle) === "20.11 GB" && m.valueText(nk.bundle) === "20.10 GB" && m.cpgShown(mid.bundle) === m.cpgShown(nk.bundle) && !mid.joint && !nk.joint && mid.rank < nk.rank, `${mid?.rank}/${nk?.rank}`);
    const allday = m.leaderboardRows("allday").ranked;
    const fx2 = allday.filter((r) => ["Telecel Flexi, with expiry, GH¢200–GH¢299.99", "Family Pack (XXL) GH¢200", "39GB Monthly"].includes(r.bundle.name));
    // Standard competition ranking: the joint rows share the place right after every row above them.
    const firstAt = allday.findIndex((r) => fx2.includes(r));
    check(`tie: GH¢5.12/GB and GH¢5.13/GB rows that both show 1.95 GB are joint, at the place after the ${firstAt} rows above them`,
      fx2.length === 3 && fx2.every((r) => r.joint && r.rank === firstAt + 1 && m.valueText(r.bundle) === "1.95 GB") && allday.slice(0, firstAt).every((r) => r.rank <= firstAt && m.valueText(r.bundle) !== "1.95 GB"), fx2.map((r) => `${r.rank}${r.joint ? "j" : ""}`).join());
  }
  check("value: the wording is never 'GH¢10 gets/buys' anywhere in the pages", ["src/components/data-bundles", "src/pages/data-bundles"].every((d) => readdirSync(join(ROOT, d)).every((f) => !/(GH¢10|valueStep\)\}|VALUE_STEP\)\}) (gets|buys)\b/i.test(srcR(`${d}/${f}`)))));
  const expl = textOf(html(React.createElement(NetworkPanels, { model: m, basePath: "/x" })));
  check("value: the plain-English explainer is on the page (real price and data first; value per GH¢10 is not what GH¢10 pays for)", /Each card shows the bundle's real price and data first\. "Value" under it compares bundles of different prices: the data you get for each GH¢10 of the price\. Bigger is better\. It is not what GH¢10 pays for\./.test(expl.replace(/&quot;/g, '"')));

  // 2. Stale state between network pages (Edmund saw AT BigTime ranked on the MTN page).
  const lbSrc = srcR("src/components/data-bundles/Leaderboards.tsx"), netSrc = srcR("src/pages/data-bundles/DataBundlesNetwork.tsx"), btSrc = srcR("src/components/data-bundles/BundleTable.tsx");
  check("stale: the leaderboard reads the network prop on every render (never copied into state)", /const net = network \?\? picked;/.test(lbSrc) && !/useState<string>\(network/.test(lbSrc));
  check("stale: the network page keys its sections by network and derives the family filter", /<div key=\{network\} className="container/.test(netSrc) && /const family = famPick\.network === network \? famPick\.family : "all";/.test(netSrc) && !/useEffect\(\(\) => setFamily/.test(netSrc));
  check("stale: the bundle table only applies a type this network sells", /const kind: Kind \| "all" = kindPick !== "all" && kinds\.includes\(kindPick\) \? kindPick : "all";/.test(btSrc));
  for (const n of m.networks) {
    const h = html(React.createElement(Leaderboards, { model: m, network: n }));
    const list = h.slice(h.indexOf('data-testid="lb-list"'));
    // Network pills only (NetPill carries the network colour as an inline background).
    const pills = [...list.matchAll(/<span class="inline-flex items-center rounded-full[^"]*" style="background:[^"]*"[^>]*>([^<]+)<\/span>/g)].map((x) => x[1]);
    check(`stale: the ${n} page's rankings show only ${m.networkInfo(n).name} rows`, pills.length > 0 && pills.every((p) => p === m.networkInfo(n).name), [...new Set(pills)].join(","));
  }

  // 3. Every figure on the redesigned sections comes from the model (or the dataset's own text).
  const figRe = /GH¢\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s?(?:GB|MB)\b/g;
  const allowed = new Set<string>();
  const add = (t: unknown) => { if (typeof t === "string") for (const x of t.match(figRe) ?? []) allowed.add(x.replace(/\s+/g, " ")); };
  for (const b of [...m.all, ...m.bundles]) {
    [b.name, m.listName(b), b.label, b.note, m.validityText(b), m.channelNote(b), m.howToBuy(b), b.otherSource?.summary, b.computedLabel, m.dealText(b), m.money(b.price), m.priceText(b), m.dataShown(b), m.fmtData(b.mb, b.network), hasVolume(b) ? m.dataText(b) : "", hasVolume(b) ? m.perGbText(b) : "", m.valueText(b), m.valueLine(b), JSON.stringify(b.conflict ?? "")].forEach(add);
  }
  for (const n of m.networks) { Object.values(doc.familyInfo[n] ?? {}).forEach(add); add(m.factText(n)); }
  add(unitsLineText(m));
  CHIPS.forEach((c) => add(m.money(c)));
  add(m.money(1000)); add(m.money(VALUE_STEP));
  const budget0 = 20;
  add(m.money(budget0));
  const pickTexts = (b: Bundle) => [b.name, m.listName(b), m.dataShown(b), m.money(b.price), m.validityText(b), m.howToBuy(b), m.channelNote(b), b.note, b.otherSource?.summary, b.computedLabel, m.fmtData(b.mb, b.network)].forEach(add);
  // The finder's own picks at its default amount (model.bestForBudget builds worked-out amounts that are not rows of m.all).
  for (const n of m.networks) { const b = m.bestForBudget(n, budget0); if (b) { pickTexts(b); add(m.money(Math.round((budget0 - b.price) * 100) / 100)); } }
  for (const n of m.networks) { const sv = m.moreBuysSaving(n, 10 * m.mbPerGb(n), 1); if (sv) add(sv.text); } // the planner's "Save GH¢X" chips (model.moreBuysSaving)
  for (const n of m.networks) { const c = m.comboForBudget(n, 20); if (c) { add(m.comboText(c)); add(m.fmtData(c.mb, n)); add(m.money(c.total)); add(m.money(Math.round((20 - c.total) * 100) / 100)); m.mixParts(c).forEach((x) => { add(x.text); add(x.buy); pickTexts(x.bundle); }); } } // the finder's mixes (model.finderPick / mixParts)
  add(m.planUpsell(m.networks.map((n) => ({ n, p: m.cheapestMonthlyPlan(n, 10 * m.mbPerGb(n), 1) })))?.text); // the planner's upsell line (model.planUpsell)
  for (const n of m.networks) { const p = m.cheapestMonthlyPlan(n, 10 * m.mbPerGb(n), 1); if (p) { add(m.money(p.total)); add(m.fmtData(p.mb, n)); p.items.forEach((i) => pickTexts(i.bundle)); } }
  ["0.5 GB", "300 GB", "10 GB", "1 GB", "5 GB", "20 GB", "50 GB", "100 GB"].forEach((x) => allowed.add(x)); // the planner's own steps (STEPS), its default and its quick picks (GB_CHIPS)
  m.gaugeScale(m.networks.map((n) => m.bestForBudget(n, 20))).ticks.forEach(add); // the finder's dial labels at its default amount (model.gaugeScale)
  const sections: [string, string][] = [
    ["finder", html(React.createElement(BudgetFinder, { model: m }))],
    ["panels", html(React.createElement(NetworkPanels, { model: m, basePath: "/x" }))],
    ["rankings", html(React.createElement(Leaderboards, { model: m }))],
    ["planner", html(React.createElement(MonthlyPlanner, { model: m }))],
  ];
  for (const [name, h] of sections) {
    const t = textOf(h);
    const figs = (t.match(figRe) ?? []).map((x) => x.replace(/\s+/g, " "));
    const stray = [...new Set(figs.filter((x) => !allowed.has(x)))];
    check(`figures: every one of the ${figs.length} figures in the ${name} section is model output`, figs.length > 0 && stray.length === 0, stray.slice(0, 8).join(" | "));
    check(`figures: no NaN, undefined, null or Infinity in the ${name} section`, !/\b(NaN|undefined|null|Infinity)\b|\[object Object\]/.test(t));
  }
  {
    const t = textOf(sections[1][1]);
    const { picks } = panelPicks(m);
    const missing: string[] = [];
    for (const p of picks) for (const r of p.rows) if (r.b) for (const want of [m.dataShown(r.b), m.priceLead(r.b), m.valueText(r.b)!, "Price per GB: " + m.perGbText(r.b).replace(/\/GB$/, ""), m.validityText(r.b)]) if (!t.includes(want)) missing.push(`${p.n}/${r.id}: ${want}`);
    check(`panels: each network's best all-day, never-expires and night deal leads with its price and data ("GH¢400 bundle → …"), then validity and value per GH¢10; the price per GB only under More info (${PANEL_CATEGORIES.length} x ${m.networks.length})`, missing.length === 0, missing.slice(0, 5).join(" | "));
    check("panels: each is model.cheapestIn of the like-for-like group", picks.every((p) => p.rows.every((r) => r.b === m.cheapestIn(GROUPS.find((g) => g.id === r.id)!.test, p.n))));
    check("panels: the cheapest all-day and never-expires winners are in the panels", m.stats.cheapestAllDay.every((b) => picks.some((p) => p.rows[0].b === b)) && m.stats.cheapestNoExpiry.every((b) => picks.some((p) => p.rows[1].b === b)));
    check("panels: every panel deal says how to buy it", (sections[1][1].match(/data-testid="panel-buy"/g) ?? []).length === picks.reduce((s, p) => s + p.shownRows.filter((r) => r.b).length, 0));
    const ft = textOf(sections[0][1]);
    check("finder: at GH¢20 each network's answer (single or mix) is shown with its data and how to buy each part", m.networks.every((n) => { const p = m.finderPick(n, 20); if (!p.b) return true; if (!ft.includes(m.dataShown(p.b))) return false; return p.combo ? m.mixParts(p.combo).every((x) => ft.includes(x.text) && (!x.buy || ft.includes(x.buy))) : ft.includes(m.buyShort(p.b) ?? "") && ft.includes(m.howToBuy(p.b)!); }));
    check("finder: chips are GH¢1, 2, 3, 5, 10, 20, 50, 100, 200 and 400, five to a row on phones", CHIPS.join() === "1,2,3,5,10,20,50,100,200,400" && /grid grid-cols-5 gap-1\.5 (\S+ )*sm:grid-cols-10/.test(readFileSync(join(ROOT, "src/components/data-bundles/BudgetFinder.tsx"), "utf8")));
    const rk = sections[2][1];
    const vals = [...rk.matchAll(/data-testid="lb-value">([^<]+)</g)].map((x) => x[1]);
    const top = m.leaderboardRows("allday").ranked.slice(0, TOP).map((r) => m.valueText(r.bundle));
    check(`rankings: the board shows the top ${TOP} by default, in order, as GH¢10 values`, TOP === 5 && JSON.stringify(vals) === JSON.stringify(top), vals.join(", "));
    check("rankings: GH¢/GB only under More info ('Price per GB: …'), never on the rows", (rk.match(/data-testid="lb-cpg"/g) ?? []).length >= TOP && rk.includes("Price per GB: " + m.perGbText(m.leaderboardRows("allday").ranked[0].bundle).replace(/\/GB$/, "")) && !/\/GB\b/.test(rk));
  }

  // 4. Notes, disputes and terms are folded behind "details", never removed, and the item stays marked.
  for (const n of m.networks) {
    const h = html(React.createElement(BundleTable, { model: m, network: n, family: "all", onFamily: () => {} }));
    const t = textOf(h);
    const mine = m.bundles.filter((b) => b.network === n);
    const lost = mine.filter((b) => (b.note && !t.includes(textOf(renderToStaticMarkup(React.createElement("span", null, b.note) as any)))) || (b.otherSource?.summary && !t.includes(textOf(renderToStaticMarkup(React.createElement("span", null, b.otherSource.summary) as any))))).map((b) => b.name);
    check(`details (${n}): every bundle note and other-source note is still in the table's HTML`, lost.length === 0, lost.slice(0, 4).join(", "));
    const unmarked = mine.filter((b) => b.otherSource?.summary && !new RegExp(`not clear – check with`).test(t)).length;
    check(`details (${n}): rows with another source are marked with a badge (${mine.filter((b) => b.otherSource?.summary).length})`, unmarked === 0 && (h.match(/data-testid="othersource-badge"/g) ?? []).length >= mine.filter((b) => b.otherSource?.summary).length);
    const conflicts = mine.filter(hasConflict);
    check(`details (${n}): ${conflicts.length} disputed rows keep their "Details not clear – check with …" badge and the dispute text`, conflicts.length === 0 || ((t.match(/Details not clear – check with/g) ?? []).length >= conflicts.length && (t.match(/The network's own pages give different figures/g) ?? []).length >= conflicts.length));
    check(`details (${n}): notes sit inside <details>`, /<details[^>]*>\s*<summary/.test(h));
  }
  {
    // The real data has no disputed rows today, so the fixture's TEST conflict bundles prove the path.
    const fxConf = F.bundles.filter((b) => b.network === "at" && hasConflict(b));
    const ft = textOf(html(React.createElement(BundleTable, { model: F, network: "at", family: "all", onFamily: () => {} })));
    const lt = textOf(html(React.createElement(Leaderboards, { model: F, network: "at" })));
    check(`details (fixture): ${fxConf.length} disputed rows keep the calm "Details not clear – check with AT" badge and the dispute text, in the table and the rankings`,
      fxConf.length >= 1 && (ft.match(/Details not clear – check with AT/g) ?? []).length >= fxConf.length && (ft.match(/The network's own pages give different figures/g) ?? []).length >= fxConf.length &&
      /Not ranked: details not clear – check with the network/.test(lt) && /The network's own pages give different figures/.test(lt));
  }
  const kokRow = textOf(html(React.createElement(BundleTable, { model: m, network: "mtn", family: "Kokrokoo", onFamily: () => {} })));
  check("details: Kokrokoo's expiry dispute stays visible on the row ('Expiry not clear – check with MTN' badge) and its terms are in details", /Expiry not clear – check with MTN/.test(kokRow) && /expiry not clear – check with MTN/.test(kokRow) && /Any unused data is lost after 8am/.test(kokRow));
  const adv = html(React.createElement(Advice, { model: m }));
  check("details: every advice card is a one-line headline with its figures behind 'Show the figures'", (adv.match(/data-testid="advice-card"/g) ?? []).length === buildTips(m).length && (adv.match(/Show the figures/g) ?? []).length === buildTips(m).length);
  const bdata = { country: DATA_BUNDLE_COUNTRIES.ghana, model: m, freshness: { capturedAt: doc.capturedAt, checkedAt: doc.checkedAt ?? doc.capturedAt, source: "bundled" as const } };
  const srcHtml = html(React.createElement(SourcesAndDisclaimer, { data: bdata }));
  const allUrls = m.networks.flatMap((n) => [...m.sourcesFor(n).urls.filter((u) => /^https:/.test(u)), ...m.sourcesFor(n).cited.map((c) => c.url)]);
  const enc = (u: string) => u.replace(/&/g, "&amp;");
  check("sources: folded into one line 'Where our prices come from (tap to see)'", /<details[^>]*data-testid="sources-details"/.test(srcHtml) && /Where our prices come from<\/h2>\s*<span[^>]*>\(tap to see\)/.test(srcHtml));
  check(`sources: all ${allUrls.length} source links, the method, 'Confirm before you buy' and independence are still inside`, allUrls.every((u) => srcHtml.includes(`href="${enc(u)}"`)) && srcHtml.includes(textOf(renderToStaticMarkup(React.createElement("span", null, doc.verification) as any)).slice(0, 80).replace(/'/g, "&#x27;")) && /Confirm before you buy/.test(srcHtml) && /TechTrendi is independent/.test(srcHtml) && /Old page, not used/.test(srcHtml));
  const ls = textOf(html(React.createElement(LiveStatus, { data: bdata })));
  // Step 1 (19 Oct 2026): fresh = "Checked today, 4:17 PM" (Ghana time = UTC); the 3-hour cadence is said on the top line.
  check("status: before mount it reads 'Prices checked on <date>' (the cadence lives on the top line)", DATA_BUNDLE_COUNTRIES.ghana.checkEveryHours === 3 && /^Prices checked on \d{1,2} [A-Z][a-z]{2} \d{4}$/.test(ls), ls);
  {
    const sh2 = await import("../src/components/data-bundles/shared");
    const n = new Date("2026-10-19T19:40:00Z");
    check("status: fresh check time in Ghana time: 'today, 4:17 PM', 'yesterday, 10:17 PM', '17 Oct, 12:05 AM', noon '12:00 PM'",
      sh2.checkedClock("2026-10-19T16:17:15.9+00:00", n) === "today, 4:17 PM" && sh2.checkedClock("2026-10-18T22:17:00Z", n) === "yesterday, 10:17 PM" &&
      sh2.checkedClock("2026-10-17T00:05:00Z", n) === "17 Oct, 12:05 AM" && sh2.checkedClock("2026-10-19T12:00:00Z", n) === "today, 12:00 PM" && sh2.checkedClock("2026-10-19", n) === "today");
    check("status: the clock wording shows only while the check is on schedule (scheduleShown), else the honest 'showing our last saved prices'",
      /\{now && onSchedule \? \(/.test(srcR("src/components/data-bundles/meta.tsx")) && /Checked <time dateTime=\{checkedAt\} className="font-bold">\{checkedClock\(checkedAt, now\)\}<\/time>/.test(srcR("src/components/data-bundles/meta.tsx")) && /showing our last saved prices/.test(srcR("src/components/data-bundles/meta.tsx")));
  }
  {
    const { scheduleShown } = await import("../src/components/data-bundles/meta");
    check("status: 're-checked every 3 hours' only while the prices are at most 2 intervals (6 h) old; prerender (unknown age) shows it",
      scheduleShown(0.5, 3) && scheduleShown(3.2, 3) && scheduleShown(6, 3) && !scheduleShown(6.01, 3) && !scheduleShown(30, 3) && scheduleShown(null, 3) && !scheduleShown(1, undefined));
    check("status: older than that it says 'last saved prices' (round 8 wording; the live fetch failed or the checker stopped), a saved copy is never 'on schedule', and the >24 h notice still shows",
      /· last saved prices<\/span>/.test(srcR("src/components/data-bundles/meta.tsx")) && /const onSchedule = scheduleShown\(age, every\) && data\.freshness\.source !== "saved";/.test(srcR("src/components/data-bundles/meta.tsx")) && /\{stale && <StaleNotice \/>\}/.test(srcR("src/components/data-bundles/meta.tsx")));
  }
  {
    const sh = await import("../src/components/data-bundles/shared");
    const aiSrc = srcR("src/components/ai/AIChatInterface.tsx");
    check("assistant: the edge-tab style targets the site button by its own aria-label ('Open AI Chat')", sh.ASSISTANT_SELECTOR === 'button[aria-label="Open AI Chat"]' && /aria-label="Open AI Chat"/.test(aiSrc));
    // Round 2: the edge tab at EVERY width (at 1280 the round button covered "651.04 GB"), plus the dark see-through header.
    const css = sh.chromeCss(0.6);
    // The only media query is the bigger-text chip rule (step 4); the assistant rules are never inside one.
    check("assistant: 24 x 48px tab at the right edge at every width (no media query)", css.split("\n").filter((l) => /@media/.test(l)).every((l) => !/Open AI Chat/.test(l) && /data-bf-chips|compare-all/.test(l)) && /button\[aria-label="Open AI Chat"\] \{ right: 0 !important; bottom: 96px !important; width: 24px !important; height: 48px !important;/.test(css));
    check("assistant: added to <head> only while a data bundle page is mounted (textContent, nothing rendered on the server), used by both pages with 28px right padding",
      renderToStaticMarkup(React.createElement(sh.DataBundlesChrome) as any) === "" && /el\.textContent = chromeCss\(headerAlpha\);/.test(srcR("src/components/data-bundles/shared.tsx")) && /return \(\) => el\.remove\(\);/.test(srcR("src/components/data-bundles/shared.tsx")) &&
      ["src/pages/data-bundles/DataBundlesDashboard.tsx", "src/pages/data-bundles/DataBundlesNetwork.tsx"].every((f) => /<DataBundlesChrome headerAlpha=\{0\.\d+\} \/>/.test(srcR(f)) && (srcR(f).match(/ pr-7 /g) ?? []).length === 2 && !/max-sm:pr-6/.test(srcR(f))) &&
      !/DataBundlesChrome|Open AI Chat"\]/.test(aiSrc + srcR("src/App.tsx") + srcR("src/ssg/RootLayout.tsx") + srcR("src/index.css") + srcR("src/components/layout/Header.tsx")));
  }
  const dashR = srcR("src/pages/data-bundles/DataBundlesDashboard.tsx");
  // Owner (18 Oct 2026, light/dark): the pages follow the site's toggle; dark first only for a visitor who never chose.
  check("page: the comparison page follows the site theme (no forced dark class), dark first by default, and keeps noindex", !/className="dark /.test(dashR) && /usePageDefaultTheme\("dark"\);/.test(dashR) && /usePageDefaultTheme\("dark"\);/.test(srcR("src/pages/data-bundles/DataBundlesNetwork.tsx")) && /noindex/.test(dashR));
  check("page: no change ticker (the data has no price history)", !Object.keys(doc).some((k) => /hist|change/i.test(k)) && !/ticker/i.test(dashR));
  check("page: motion is transform/opacity only and respects reduced motion", /MotionConfig reducedMotion="user"/.test(dashR) && !/animate=\{\{ (width|height)/.test(srcR("src/components/data-bundles/shared.tsx") + srcR("src/components/data-bundles/BudgetFinder.tsx") + srcR("src/components/data-bundles/NetworkPanels.tsx") + lbSrc) && /motion-reduce:animate-none/.test(srcR("src/components/data-bundles/meta.tsx")));
}

// ------------------------------------------------------------------ plain words (owner, 18 Oct 2026: "as simple as ABC")
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const lib = await import("../src/lib/dataBundles");
  const { BudgetFinder } = await import("../src/components/data-bundles/BudgetFinder");
  const { NetworkPanels } = await import("../src/components/data-bundles/NetworkPanels");
  const { Leaderboards } = await import("../src/components/data-bundles/Leaderboards");
  const { MonthlyPlanner, capLabel, buyTimes } = await import("../src/components/data-bundles/MonthlyPlanner");
  const { Advice } = await import("../src/components/data-bundles/Advice");
  const { SourcesAndDisclaimer, LiveStatus } = await import("../src/components/data-bundles/meta");
  const { DATA_BUNDLE_COUNTRIES } = await import("../src/data/dataBundleCountries");
  const html = (el: unknown) => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/tools-preview/data-bundles/ghana" }, el as any) as any);
  const textOf = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  // What is on screen before anything is tapped: <details> keep only their <summary>.
  const visible = (h: string) => textOf(h.replace(/<details\b[^>]*>([\s\S]*?)<\/details>/g, (_x, inner: string) => (inner.match(/<summary\b[\s\S]*?<\/summary>/)?.[0] ?? "")));

  // 1. Short how-to-buy lines: wording removed, never a code or an app.
  const sb = lib.shortBuyText;
  check("buy: 'then option 1' -> 'then 1'", sb("Dial *111*4# then option 1") === "Dial *111*4# then 1");
  check("buy: app screenshot provenance moves out", sb("In the myMTN app: “Data Bundles”, then “Low Cost Non Expiry Bundles” (as the app showed it, screenshot 17 Oct 2026).") === "myMTN app: Data Bundles, then Low Cost Non Expiry Bundles.");
  check("buy: '(Telecel's data terms)' moves out", sb("Dial *700# or *110#, or use the Telecel Play app (Telecel's data terms).") === "Dial *700# or *110#, or use the Telecel Play app.");
  check("buy: MTN help-centre quote -> 'Only on the myMTN app or *138#.'", sb("MTN's help centre (last edited 12 Aug 2024): 'Yes, you can purchase Social Bundle only via MyMTN App or *138#'") === "Only on the myMTN app or *138#.");
  check("buy: Telecel bundles-page quote -> 'Buy it on Telecel's bundles page.'", sb("Buy it on Telecel's bundles page (telecel.com.gh/personal/mobile/offers/bundles), which says “Kindly login to your mobile account to subscribe”.") === "Buy it on Telecel's bundles page.");
  const picks: Bundle[] = [...m.all];
  for (const n of m.networks) for (const a of [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 400, 1000]) for (const o of [{}, { nightOnly: true }, { noExpiryOnly: true }, { minDays: 30 }]) { const b = m.bestForBudget(n, a, o); if (b) picks.push(b); }
  for (const n of m.networks) for (const gb of [1, 10, 50]) for (const cap of [1, 3, 12]) m.cheapestMonthlyPlan(n, gb * 1024, cap)?.items.forEach((i) => picks.push(i.bundle));
  const codes = (t: string) => [...new Set(t.match(/\*[\d*]+#/g) ?? [])].sort().join(" ");
  const apps = (t: string) => [...new Set((t.match(/my\s?mtn app|telecel play app/gi) ?? []).map((x) => x.toLowerCase().replace(/\s/g, "")))].sort().join(" ");
  const lost = [...new Set(picks.filter((b) => m.howToBuy(b) && (codes(m.buyShort(b)!) !== codes(m.howToBuy(b)!) || apps(m.buyShort(b)!) !== apps(m.howToBuy(b)!) || !m.buyShort(b)!.trim())).map((b) => m.howToBuy(b)))];
  check(`buy: across ${picks.length} bundles, finder and planner picks, the short line keeps every *code# and every app of the full one`, lost.length === 0, lost.slice(0, 3).join(" | "));
  check("buy: no short line keeps app-screenshot provenance, '(… terms)' notes or 'then option'", picks.every((b) => !/as the app showed it|terms\)|then option|“|”/.test(m.buyShort(b) ?? "")));
  const fin = html(React.createElement(BudgetFinder, { model: m }));
  check("buy: the full line stays one tap away (finder details, single-buy answers)", m.networks.every((n) => { const p = m.finderPick(n, 20); const b = p.single!; return !!p.combo || m.buyShort(b) === m.howToBuy(b) || textOf(fin).includes(`How to buy, in full: ${m.howToBuy(b)}`); }));

  // 2. No jargon in what is on screen before tapping (headings, labels, badges, cards).
  const bdata = { country: DATA_BUNDLE_COUNTRIES.ghana, model: m, freshness: { capturedAt: doc.capturedAt, checkedAt: doc.checkedAt ?? doc.capturedAt, source: "bundled" as const } };
  const shown = [
    ["finder", fin], ["panels", html(React.createElement(NetworkPanels, { model: m, basePath: "/x" }))], ["winners", html(React.createElement(Leaderboards, { model: m }))],
    ["planner", html(React.createElement(MonthlyPlanner, { model: m }))], ["tips", html(React.createElement(Advice, { model: m }))],
    ["sources", html(React.createElement(SourcesAndDisclaimer, { data: bdata }))], ["status", html(React.createElement(LiveStatus, { data: bdata }))],
  ] as const;
  const jargon = /like for like|like-for-like|\bcomputed\b|published rate|conditional|\bvalidity\b|\btariff\b|\bbaseline\b|\bper GB\b|purchases? in the month|\bpersonali[sz]ed\b|\bunconfirmed\b|\bverified\b/i;
  for (const [name, h] of shown) {
    const t = visible(h);
    check(`plain words: no jargon on screen in the ${name} section`, !jargon.test(t), t.match(new RegExp(`.{0,30}(${jargon.source}).{0,30}`, "i"))?.[0] ?? "");
  }
  const dashSrc = readFileSync(join(ROOT, "src/pages/data-bundles/DataBundlesDashboard.tsx"), "utf8");
  check("plain words (round 8): no cadence line on top (the chips name the networks); 'every 3 hours' is under 'What we compare' with the counts, no jargon", !/<CadenceLine/.test(dashSrc) && /We check the prices every \{data\.country\.checkEveryHours\} hours\./.test(dashSrc) && /We rank \{s\.comparedCount\} of the \{s\.fixedCount\}/.test(dashSrc) && !/like for like/.test(dashSrc));
  check("plain words: badges say 'Some regions only', 'Some groups only', 'Some customers only', 'Not confirmed', 'New, still checking', '… not clear – check with MTN', 'Price we calculated'; never 'disagree' or 'Worked out'",
    ["Some regions only", "Some groups only", "Some customers only", "Not confirmed", "New, still checking", "not clear – check with {who}", "≈ Price we calculated", "Price we calculated from ${"].every((s) => readFileSync(join(ROOT, "src/components/data-bundles/shared.tsx"), "utf8").includes(s)) &&
    !/disagree|Worked out/.test(readFileSync(join(ROOT, "src/components/data-bundles/shared.tsx"), "utf8").split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*\*)/.test(l)).join("\n")));

  // 3. The planner, in the owner's words.
  const pl = html(React.createElement(MonthlyPlanner, { model: m }));
  const plt = visible(pl);
  check("planner: 'How often will you buy data this month?' is a 1-12 slider whose bubble says 'Once' / 'Up to N times', with the hint",
    /How often will you buy data this month\?/.test(plt) && /aria-valuetext="Once"/.test(pl) && /data-testid="cap-bubble"[^>]*>Once</.test(pl) && /Buying more often can be cheaper\. Buying once is simpler\./.test(plt) &&
    capLabel(1) === "Once" && capLabel(4) === "Up to 4 times" && capLabel(12) === "Up to 12 times" && /aria-valuemin="1"/.test(pl) && /aria-valuemax="12"/.test(pl));
  // Owner's decision (18 Oct 2026, round 2): the planner header, the phone tip and the - / + buttons.
  check("planner: heading kept; 'Move the slider. We show the cheapest way on each network.'; 'I use about'; the phone tip; eyebrow still 'Monthly planner'; - and + buttons",
    /How much data do you use in a month\?/.test(plt) && /Move the slider\. We show the cheapest way on each network\./.test(plt) && /I use about/.test(plt) && !/I need about|Slide to your need/.test(plt) &&
    /Not sure\? Your phone shows it in Settings → Mobile data\./.test(plt) && /Monthly planner/.test(plt) && /aria-label="Less data"/.test(pl) && /aria-label="More data"/.test(pl) && /All buys happen within one month\./.test(plt) && !/typical/i.test(plt));
  check("planner: 'Buy once' / 'Buy 2 times' and 'You get X' for each plan, from the model", buyTimes(1) === "Buy once" && buyTimes(2) === "Buy 2 times" &&
    m.networks.every((n) => { const p = m.cheapestMonthlyPlan(n, 10 * 1024, 1); return !p || (plt.includes(buyTimes(p.purchases)) && plt.includes(`You get ${m.fmtData(p.mb, n)}`)); }));
}

// ------------------------------------------------------------------ round 2 (owner "go", 18 Oct 2026)
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const lib = await import("../src/lib/dataBundles");
  const { niceCeil, GAUGE_HEADROOM } = lib;
  const { CHIPS, stepAmount, INPUT_MAX } = await import("../src/components/data-bundles/BudgetFinder");
  const { NetworkPanels, panelPicks } = await import("../src/components/data-bundles/NetworkPanels");
  const { FaceOff } = await import("../src/components/data-bundles/FaceOff");
  const { MonthlyPlanner } = await import("../src/components/data-bundles/MonthlyPlanner");
  const sh = await import("../src/components/data-bundles/shared");
  const html = (el: unknown) => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/tools-preview/data-bundles/ghana" }, el as any) as any);
  const textOf = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const srcR = (p: string) => readFileSync(join(ROOT, p), "utf8");

  // E. Gauges: one nice scale per amount.
  check("gauge: niceCeil rounds up to 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 x 10^k", [0.4, 1, 1.52, 2.5, 2.7, 6.6, 9.1, 263, 1200].map(niceCeil).join() === "0.4,1,2,2.5,3,8,10,300,1500");
  check("gauge: GH¢20 -> 0 / 1.5 / 3 GB (winner 2.56GB sits at 85%)", (() => { const p = m.networks.map((n) => m.bestForBudget(n, 20)); const s = m.gaugeScale(p); return s.ticks.join("|") === "0|1.5|3 GB" && near(s.share(p[2]), 2.56 * 1024 / 1024 / 3, 1e-3); })());
  let gaugeBad: string[] = [];
  for (const a of [...CHIPS, 0.5, 7, 9.99, 37, 999]) for (const o of [{}, { nightOnly: true }, { noExpiryOnly: true }]) {
    const p = m.networks.map((n) => m.bestForBudget(n, a, o));
    const s = m.gaugeScale(p);
    const have = p.filter((b): b is Bundle => !!b);
    if (!have.length) continue;
    const top = Math.max(...have.map((b) => s.share(b)));
    if (!(top <= 1 / GAUGE_HEADROOM + 1e-9 && top >= 0.45)) gaugeBad.push(`${a}: top share ${top.toFixed(3)} (${s.ticks.join("|")})`);
    if (!(s.ticks[0] === "0" && s.ticks[2].endsWith(` ${s.unit}`) && parseFloat(s.ticks[2].replace(/,/g, "")) === s.max)) gaugeBad.push(`${a}: ticks ${s.ticks.join("|")}`);
    // Shares on one scale keep the amounts' order (the comparable rule).
    for (const x of have) for (const y of have) if ((s.unit === "MB" ? x.mb : m.gbOf(x)) > (s.unit === "MB" ? y.mb : m.gbOf(y)) + 1e-9 && !(s.share(x) > s.share(y))) gaugeBad.push(`${a}: order`);
  }
  check("gauge: at every chip amount (and more), the winner's needle is between 45% and 1/1.08 of the arc, ticks 0 / half / top, one shared scale", gaugeBad.length === 0, gaugeBad.slice(0, 3).join(" | "));

  // F. The price is said once.
  check("name: 'Sika Kokoo GH¢50' -> 'Sika Kokoo' + 'Pay GH¢50'", (() => { const b = m.bundles.find((x) => x.name === "Sika Kokoo GH¢50")!; return m.nameNoPrice(b) === "Sika Kokoo" && m.payText(b) === "Pay GH¢50"; })());
  check("name: a worked-out row is named by its price list: 'Telecel Flexi, no expiry' + 'Pay GH¢400 to GH¢999.99'; an exact special 'Pay exactly GH¢399'",
    m.nameNoPrice(m.stats.cheapestNoExpiry[0]) === "Telecel Flexi, no expiry" && m.payText(m.stats.cheapestNoExpiry[0]) === "Pay GH¢400 to GH¢999.99" &&
    m.computed.filter((b) => b.band?.exact).every((b) => m.payText(b) === `Pay exactly ${m.money(b.price)}` && !m.nameNoPrice(b).includes("GH¢")));
  check("name: names that do not print the price keep it ('263.38GB Monthly')", m.nameNoPrice(m.bundles.find((x) => x.name === "263.38GB Monthly")!) === "263.38GB Monthly");
  const twice = m.all.filter((b) => !b.band && (`${m.nameNoPrice(b)} · ${m.payText(b)}`.split(m.money(b.price)).length - 1) !== 1 && !/^\d/.test(b.name)).map((b) => b.name);
  check(`name: across all ${m.all.length} rows the card says the price exactly once (name + Pay)`, twice.length === 0 && m.all.every((b) => m.nameNoPrice(b).trim().length > 0), twice.slice(0, 5).join(", "));
  const t10 = m.bestForBudget("telecel", 10)!;
  check("change: Telecel at GH¢10 -> 'Pay GH¢9.99 (GH¢0.01 change)', reason 'At Telecel's rates GH¢9.99 buys more data than GH¢10.'", m.payText(t10) === "Pay GH¢9.99" && m.changeText(t10, 10) === "GH¢0.01" && m.changeReason(t10, 10) === "At Telecel's rates GH¢9.99 buys more data than GH¢10.");
  const m400 = m.bestForBudget("mtn", 400)!;
  check("change: MTN at GH¢400 -> GH¢399 with GH¢1 change: MTN has no data price for exactly GH¢400", m.changeText(m400, 400) === "GH¢1" && m.changeReason(m400, 400) === "MTN has no data price for exactly GH¢400. This is the best amount below it.");
  let reasonBad = 0;
  for (const a of [...CHIPS, 0.5, 4.99, 9.99, 10.01, 299.5, 1000]) for (const n of m.networks) {
    const b = m.bestForBudget(n, a); if (!b) continue;
    const why = m.changeReason(b, a);
    if (!b.computed && why) reasonBad++;
    if (why && /buys more data than/.test(why)) { const s = m.sources.find((x) => x.label === b.rateLabel && x.network === b.network)!; if (!(lib.mbFromTable(a, s.table) < b.mb)) reasonBad++; }
    if (!m.changeText(b, a) && why) reasonBad++;
  }
  check("change: a reason is only given for a worked-out pick that costs less than the amount, and 'buys more' only when spending it all really buys less", reasonBad === 0, String(reasonBad));

  // H. Face-off and panels.
  for (const g of ["allday", "noexpiry", "night"]) {
    const f = m.faceOff(g);
    const test = GROUPS.find((x) => x.id === g)!.test;
    check(`face-off (${g}): each network's best = model.cheapestIn, shown as its GH¢10 value; 'Best' only where the shown value is the top one`,
      f.every((r) => r.b === m.cheapestIn(test, r.n) && r.value === (r.b ? m.valueText(r.b) : null) && r.share <= 1 + 1e-9) &&
      f.filter((r) => r.best).every((r) => m.tieText(r.b!) === m.tieText(m.cheapestTies(test)[0])) && f.some((r) => r.best));
  }
  const fo = textOf(html(React.createElement(FaceOff, { model: m })));
  check("face-off: 'Best value bundles (any price)'; each column leads with its own price and data ('GH¢400 bundle → 263.38GB'), the bar is labelled with the price, the value per GH¢10 under it",
    /Best value bundles \(any price\)/.test(fo) && /GH¢400 bundle → 263\.38GB/.test(fo.replace(/\s+/g, " ").replace(/ gives /g, " ")) && ["6.58", "6.33", "5.45"].every((v) => fo.includes(`Value: ${v} GB per GH¢10`)) && !/Most data for every/.test(fo), fo.slice(0, 300));
  const { picks } = panelPicks(m);
  check("panels: a network whose best any-time and never-expires deals are the same bundle shows it once, marked 'Also never expires'",
    picks.every((p) => (p.rows[0].b && p.rows[0].b === p.rows[1].b) === p.rows[0].alsoNoExpiry && p.shownRows.length === (p.rows[0].alsoNoExpiry ? 2 : 3)) && picks.some((p) => p.rows[0].alsoNoExpiry) &&
    (html(React.createElement(NetworkPanels, { model: m, basePath: "/x" })).match(/data-testid="also-noexpiry"/g) ?? []).length === picks.filter((p) => p.rows[0].alsoNoExpiry).length);
  const ph = html(React.createElement(NetworkPanels, { model: m, basePath: "/x" }));
  check("panels: phones get a swipe view (scroll-snap, one full-width card per network), tabs and dots; desktop three columns", /snap-x snap-mandatory overflow-x-auto/.test(ph) && (ph.match(/w-full shrink-0 snap-start snap-always overflow-hidden p-1 sm:w-auto sm:overflow-visible sm:p-0/g) ?? []).length === 3 && /role="tablist"/.test(ph) && (ph.match(/data-testid="net-dot"/g) ?? []).length === 3 && /md:grid-cols-3/.test(ph));

  // C. The 1-12 "how often" slider: the planner is exact for EVERY cap.
  let capBad = 0, capCases = 0;
  const t0c = Date.now();
  for (const cap of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) for (const [n, need] of [["mtn", 700], ["mtn", 1500], ["at", 1200], ["at", 3000], ["telecel", 800], ["telecel", 2500]] as [string, number][]) {
    capCases++;
    const p = m.cheapestMonthlyPlan(n, need, cap);
    if (!p) { if (Number.isFinite(brute(m, n, need, 20000, cap))) { capBad++; console.log(`  cap ${cap} ${n} ${need}: planner impossible, brute possible`); } continue; }
    const b = brute(m, n, need, Math.round(p.total * 100), cap);
    if (Math.abs(b - p.total) > 1e-9 || p.purchases > cap) { capBad++; console.log(`  cap ${cap} ${n} ${need}: ${desc(p)} vs brute ${b}`); }
  }
  check(`planner: equals the brute force for every cap 1 to 12 (${capCases} cases, ${Date.now() - t0c} ms)`, capBad === 0, String(capBad));
  let monoBad = 0;
  for (const n of m.networks) for (const gb of [1, 5, 10, 20, 50, 100, 300]) {
    let prev = Infinity;
    for (let cap = 1; cap <= 12; cap++) { const p = m.cheapestMonthlyPlan(n, gb * 1024, cap); const t = p ? p.total : Infinity; if (t > prev + 1e-9 || (p && p.purchases > cap)) monoBad++; prev = t; }
  }
  check("planner: at 1-300 GB, allowing one more buy never costs more, and no plan uses more buys than allowed (every cap 1-12)", monoBad === 0, String(monoBad));

  // D. Finder - and +.
  check("finder: - / + step GH¢1 between GH¢1 and GH¢1,000 in whole pesewas", stepAmount(20, 1) === 21 && stepAmount(20, -1) === 19 && stepAmount(9.99, -1) === 8.99 && stepAmount(1, -1) === 1 && stepAmount(0.5, -1) === 1 && stepAmount(INPUT_MAX, 1) === INPUT_MAX);
  const fsrc = srcR("src/components/data-bundles/BudgetFinder.tsx");
  check("finder: 'Lasts' is a small caption (beside its options on phones, above them from 640px), not a button", /<p id=\{ids\.lasts\} className="shrink-0 text-\[11px\] font-semibold uppercase tracking-wider text-muted-foreground sm:mb-1">Lasts<\/p>/.test(fsrc));

  // I. Chrome: the header's dark tokens are the site's own dark theme.
  const css = srcR("src/index.css");
  const darkBlock = css.slice(css.indexOf(".dark {"), css.indexOf("}", css.indexOf(".dark {")));
  const cc = sh.chromeCss(0.6);
  check("chrome: the header follows the site theme (no token block), with a deeper site blue for --primary (Sign Up's white text at AA)", !/--background|--foreground/.test(cc) && sh.HEADER_PRIMARY === "214 100% 45%" && /header\.fixed\.top-0 \{ --primary: 214 100% 45%; -webkit-backdrop-filter: blur\(16px\)/.test(cc) && darkBlock.length > 0);
  check("chrome: see-through dark glass in dark mode, see-through light glass in light mode, both blurred", /html\.dark header\.fixed\.top-0 \{ background: rgba\(8, 10, 14, 0\.6\) !important;/.test(cc) && /html:not\(\.dark\) header\.fixed\.top-0 \{ background: rgba\(255, 255, 255, 0\.72\) !important;/.test(cc));
  // Theme: the visitor's choice, else the open page's default, else light (the site's default is unchanged).
  const tc = srcR("src/contexts/ThemeContext.tsx");
  check("theme: chosen ?? page default ?? light; a choice is stored site-wide; the page default is set before paint and removed when the page goes",
    /const theme: Theme = chosen \?\? pageDefault \?\? \(typeof window !== 'undefined' \? 'light' : 'system'\);/.test(tc) && /localStorage\.setItem\(STORAGE_KEY, newTheme\)/.test(tc) && /const STORAGE_KEY = 'techtrendi-theme';/.test(tc) &&
    /export function usePageDefaultTheme[\s\S]*set\(theme\);\s*return \(\) => set\(null\);/.test(tc) && /useIsoLayoutEffect\(\(\) => \{\s*const root = window\.document\.documentElement;/.test(tc));
  check("chrome: the comparison page's dark section runs up behind the fixed header", /-mt-16 overflow-x-clip bg-background pt-16 text-foreground md:-mt-20 md:pt-20/.test(srcR("src/pages/data-bundles/DataBundlesDashboard.tsx")));

  // I/J. Count-ups and motion.
  const cu = renderToStaticMarkup(React.createElement(sh.CountUpText, { text: "263.38 GB to 651.04 GB" }) as any);
  check("count-up: on the server (and without JavaScript) it shows the exact model text", /data-final="263.38 GB to 651.04 GB"/.test(cu) && />263.38 GB to 651.04 GB</.test(cu));
  check("count-up: the last frame is the text itself (onComplete -> exact text), and it never runs under reduced motion", /onComplete: \(\) => setShown\(null\)/.test(srcR("src/components/data-bundles/shared.tsx")) && /reduce !== false/.test(srcR("src/components/data-bundles/shared.tsx")));
  check("motion: transform and opacity only (no width, height or top animations) in the new components",
    ["FaceOff.tsx", "BudgetFinder.tsx", "NetworkPanels.tsx", "Leaderboards.tsx", "MonthlyPlanner.tsx", "shared.tsx"].every((f) => !/animate=\{\{ ?(width|height|top|left|bottom|right)\b/.test(srcR(`src/components/data-bundles/${f}`))));
  check("motion: the scan sweep runs once on load and never under reduced motion", /export function ScanSweep\(\)[\s\S]*if \(reduce === false\) setOn\(true\)[\s\S]*onAnimationComplete=\{\(\) => setOn\(false\)\}/.test(srcR("src/components/data-bundles/shared.tsx")));
  const plh = textOf(html(React.createElement(MonthlyPlanner, { model: m })));
  // "Save GH¢X" (owner, 18 Oct 2026): what more buys would save, and the smallest cap that does it.
  const sv = (n: string, gb: number) => m.moreBuysSaving(n, gb * 1024, 1);
  const svText = (n: string, gb: number) => { const x = sv(n, gb); return x ? `${x.text}@${x.cap}` : "none"; };
  check("save: owner's reference values at cap 1 (5 GB MTN 30.99 to GH¢41, AT 57 to GH¢42, Telecel 1.53; 10 GB MTN 19.08, Telecel 2.13, AT none; 20 GB AT 29, MTN 7.04, Telecel none)",
    svText("mtn", 5) === "GH¢30.99@12" && m.cheapestMonthlyPlan("mtn", 5 * 1024, 12)!.total === 41 && svText("at", 5) === "GH¢57@12" && m.cheapestMonthlyPlan("at", 5 * 1024, 12)!.total === 42 && svText("telecel", 5) === "GH¢1.53@8" &&
    svText("mtn", 10) === "GH¢19.08@12" && svText("telecel", 10) === "GH¢2.13@12" && svText("at", 10) === "none" &&
    svText("at", 20) === "GH¢29@10" && svText("mtn", 20) === "GH¢7.04@11" && svText("telecel", 20) === "none",
    ["mtn", "at", "telecel"].flatMap((n) => [5, 10, 20].map((g) => `${n}${g}:${svText(n, g)}`)).join(" "));
  let svBad = 0;
  for (const n of m.networks) for (const gb of [1, 5, 10, 20, 50, 100]) for (let cap = 1; cap <= 12; cap++) {
    const x = m.moreBuysSaving(n, gb * 1024, cap); const cur = m.cheapestMonthlyPlan(n, gb * 1024, cap);
    const totals = Array.from({ length: 13 - cap }, (_, i) => m.cheapestMonthlyPlan(n, gb * 1024, cap + i)?.total ?? Infinity);
    const best = Math.min(...totals);
    if (!cur) { if (x) svBad++; continue; }
    const want = Math.round((cur.total - best) * 100) / 100;
    if (want >= 0.01 && m.money(cur.total) !== m.money(best)) { if (!x || x.saving !== want || x.cap !== cap + totals.findIndex((t) => Math.abs(t - best) < 1e-9) || x.text !== m.money(want)) svBad++; }
    else if (x) svBad++;
  }
  check("save: for every network, 1-100 GB and every cap, the chip is the cheapest total over caps cap..12 vs this cap, at the SMALLEST cap reaching it; none when no saving shows", svBad === 0, String(svBad));
  const plRaw2 = html(React.createElement(MonthlyPlanner, { model: m }));
  const chips = [...plRaw2.matchAll(/aria-label="Buy more, save (GH¢[\d.,]+) \(buy up to \d+ times\)"[^>]*data-testid="plan-save" data-net="([a-z]+)" data-cap="(\d+)"[^>]*>Buy more, save (GH¢[\d.,]+)</g)].map((x) => `${x[2]}:${x[1]}:${x[3]}:${x[4]}`).sort();
  const want10 = m.networks.map((n) => sv(n, 10)).map((x, i) => x && `${m.networks[i]}:${x.text}:${x.cap}:${x.text}`).filter(Boolean).sort();
  check("save: at 10 GB, Once, the cards show 'Save GH¢19.08' (MTN) and 'Save GH¢2.13' (Telecel), no chip for AT, each with its aria-label and target cap", JSON.stringify(chips) === JSON.stringify(want10) && chips.length === 2, chips.join(" | "));
  check("planner: GB quick picks 1, 5, 10, 20, 50, 100 GB", /1 GB 5 GB 10 GB 20 GB 50 GB 100 GB/.test(plh));
  // Owner follow-up (18 Oct 2026): start at "Once"; bubble above the thumb, clamped; plan cards in the swipe view.
  const plRaw = html(React.createElement(MonthlyPlanner, { model: m }));
  const pSrc = srcR("src/components/data-bundles/MonthlyPlanner.tsx");
  check("planner follow-up: first render (and server HTML) starts at cap 1, 'Once'", /aria-valuetext="Once"/.test(plRaw) && /data-testid="cap-bubble"[^>]*>Once</.test(plRaw));
  check("planner follow-up: the bubble is outside the thumb, above it, centred on it and clamped inside the track (measured: centred on the thumb, clamped to the slider; CSS fallback before mount)",
    !/<SliderPrimitive\.Thumb[^/]*>\s*<span/.test(pSrc) && /absolute bottom-full whitespace-nowrap/.test(pSrc) && /Math\.min\(geo\.w - geo\.bw, Math\.max\(0, 18 \+ capFrac \* \(geo\.w - 36\) - geo\.bw \/ 2\)\)/.test(pSrc) && /left: `calc\(18px \+ \$\{capFrac\} \* \(100% - 36px\)\)`/.test(pSrc) && /translateX\(-\$\{\(capFrac \* 100\)\.toFixed\(2\)\}%\)/.test(pSrc));
  const order1 = m.networks.map((n) => ({ n, p: m.cheapestMonthlyPlan(n, 10 * 1024, 1) })).sort((a, b) => (a.p && b.p ? a.p.total - b.p.total : a.p ? -1 : 1)).map((x) => x.n);
  const cards = [...plRaw.matchAll(/data-testid="plan-card" data-net="([a-z]+)"/g)].map((x) => x[1]);
  const tabs = [...plRaw.matchAll(/id="plans-tab-([a-z]+)"/g)].map((x) => x[1]);
  check("planner follow-up: plan cards in the shared swipe view (one per network), tabs and cards cheapest first, the cheapest tab marked",
    /data-testid="plan-swipe"/.test(plRaw) && (plRaw.match(/data-testid="plan-dot"/g) ?? []).length === 3 && JSON.stringify(cards) === JSON.stringify(order1) && JSON.stringify(tabs) === JSON.stringify(order1) && /\(cheapest\)|\(tied cheapest\)/.test(plRaw),
    `${cards} / ${tabs} / ${order1}`);
  check("planner follow-up: the network best-deals section uses the same SwipeDeck", /<SwipeDeck\b/.test(srcR("src/components/data-bundles/NetworkPanels.tsx")) && /<SwipeDeck\b/.test(pSrc) && /export function SwipeDeck/.test(srcR("src/components/data-bundles/shared.tsx")));
}

// ------------------------------------------------------------------ step 1 (19 Oct 2026): fresh prices on any network
{
  const sch = await import("../src/lib/dataBundleSchema.js");
  const snap = await import("../src/lib/bundleSnapshot");
  const srcS = (p: string) => readFileSync(join(ROOT, p), "utf8");
  // Times derived from the dataset's capture: the file is the same capture, checked 3 hours later.
  const cap = captureTime(doc.capturedAt);
  const at = (h: number) => new Date(cap + h * 3600e3).toISOString();
  const fileBody = { id: 10, content_hash: "ab", captured_at: at(0), checked_at: at(3), data: doc };
  const fileNow = cap + 4 * 3600e3;
  const r = sch.rowFromFile(fileBody);
  check("file: the site's static copy becomes a snapshot row (captured_at / checked_at kept exactly)", !!r && r.data === doc && r.captured_at === fileBody.captured_at && r.checked_at === fileBody.checked_at);
  check("file: anything that is not a row is refused (HTML, arrays, no data, no captured_at)", [null, "<!doctype html>", [], {}, { data: doc }, { captured_at: "x" }, { data: [], captured_at: "2026-01-01" }].every((x) => sch.rowFromFile(x) === null));
  check("file: path /storage/data-bundles/ghana-latest.json", sch.bundleFilePath("ghana") === "/storage/data-bundles/ghana-latest.json");
  const older = { data: doc, captured_at: at(0), checked_at: at(1) };
  const newer2 = { data: doc, captured_at: at(0), checked_at: at(3) };
  check("file: of two rows the one checked later wins; either may be missing", sch.newerRow(older, newer2) === newer2 && sch.newerRow(newer2, older) === newer2 && sch.newerRow(null, older) === older && sch.newerRow(older, null) === older && sch.newerRow(null, null) === null);
  // The file's row goes through exactly the same resolveSnapshot as a database row.
  const res = snap.resolveSnapshot(doc, r!, fileNow);
  check("file: same figures -> 'Prices checked' moves to the file's checked_at", !!res && res.freshness.checkedAt === fileBody.checked_at && res.freshness.source === "live");
  const partial = sch.rowFromFile({ ...fileBody, data: { ...clone(doc), bundles: doc.bundles.filter((b) => b.network !== "at") } });
  check("file: a partial row from the file is refused by the same guard", snap.resolveSnapshot(doc, partial!, fileNow) === null);
  check("file: a future-dated row from the file is refused by the same guard", snap.resolveSnapshot(doc, { ...r!, checked_at: "2099-01-01T00:00:00Z" }, fileNow) === null);
  const hook = srcS("src/hooks/useBundleData.ts");
  check("hook: asks the site's file first (same origin), then db2 only when the file failed or is over 6 h old; the newer row wins; HTML answers count as failures",
    /const file = await requestFile\(country\);/.test(hook) && /if \(fileRow && age <= FILE_FRESH_HOURS && !\(file\.ok && file\.saved\)\) return file;/.test(hook) && /export const FILE_FRESH_HOURS = 6;/.test(hook) &&
    /const row = newerRow\(fileRow, db\.ok \? db\.row : null\);/.test(hook) && /fetch\(bundleFilePath\(country\)/.test(hook) && /!\/json\/i\.test\(r\.headers\.get\("content-type"\)/.test(hook) && /resolveSnapshot\(base, o\.row\)/.test(hook));
}

// ------------------------------------------------------------------ step 2 (19 Oct 2026): finder first, clearer answers
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const lib = await import("../src/lib/dataBundles");
  const sh = await import("../src/components/data-bundles/shared");
  const { BudgetFinder } = await import("../src/components/data-bundles/BudgetFinder");
  const { NetworkPanels } = await import("../src/components/data-bundles/NetworkPanels");
  const { MonthlyPlanner } = await import("../src/components/data-bundles/MonthlyPlanner");
  const { FaceOff } = await import("../src/components/data-bundles/FaceOff");
  const html = (el: unknown) => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/tools-preview/data-bundles/ghana" }, el as any) as any);
  const srcS = (p: string) => readFileSync(join(ROOT, p), "utf8");

  // Value meter zones.
  check("meter: zones Poor < 50% <= Fair < 75% <= Good < Best (the winner, or a shown tie)",
    lib.valueZone(1, true) === "Best" && lib.valueZone(0.99, false) === "Good" && lib.valueZone(0.75, false) === "Good" && lib.valueZone(0.7499, false) === "Fair" &&
    lib.valueZone(0.5, false) === "Fair" && lib.valueZone(0.4999, false) === "Poor" && lib.valueZone(0, false) === "Poor" && lib.VALUE_ZONES.map((z) => z.label).join() === "Poor,Fair,Good,Best");
  let meterBad: string[] = [];
  for (const a of [1, 2, 3, 5, 10, 20, 50, 100, 200, 400, 0.5, 37.5]) for (const o of [{}, { nightOnly: true }, { noExpiryOnly: true }]) {
    const picks = m.networks.map((n) => ({ n, b: m.bestForBudget(n, a, o) }));
    const vm = m.valueMeter(picks);
    const lead = m.mostData(picks);
    for (const x of vm) {
      const p = picks.find((q) => q.n === x.n)!;
      if (!p.b) { if (x.zone !== null || x.share !== 0) meterBad.push(`${a} ${x.n} no pick but zone`); continue; }
      if (lead.has(x.n) !== (x.zone === "Best") || (lead.has(x.n) && x.share !== 1)) meterBad.push(`${a} ${x.n} best mismatch`);
      if (x.share > 1 || x.share < 0) meterBad.push(`${a} ${x.n} share ${x.share}`);
    }
  }
  check("meter: the winner (model.mostData) always reads Best at 1; the others their share; no pick = no meter", meterBad.length === 0, meterBad.slice(0, 3).join(" | "));
  const at20 = m.valueMeter(m.networks.map((n) => ({ n, b: m.bestForBudget(n, 20) })));
  check("meter: GH¢20 -> Telecel 2.56GB Best, AT 2.5 GB Good (98%), MTN 1.39 GB Fair (54%)", at20.find((x) => x.n === "telecel")!.zone === "Best" && at20.find((x) => x.n === "at")!.zone === "Good" && at20.find((x) => x.n === "mtn")!.zone === "Fair", JSON.stringify(at20));

  // Tap to dial: * kept, # encoded.
  check("dial: tel: links keep * and encode # ('*111*4#' -> 'tel:*111*4%23')", sh.telHref("*111*4#") === "tel:*111*4%23" && sh.telHref("*5060#") === "tel:*5060%23" && sh.dialCodes("Dial *700# or *110#, or use the Telecel Play app.").join() === "*700#,*110#" && sh.dialCodes("myMTN app: Midnight.").length === 0);
  const fin = html(React.createElement(BudgetFinder, { model: m }));
  const pan = html(React.createElement(NetworkPanels, { model: m, basePath: "/x" }));
  const pla = html(React.createElement(MonthlyPlanner, { model: m }));
  const hrefs = [...(fin + pan + pla).matchAll(/href="(tel:[^"]+)"/g)].map((x) => x[1]);
  check(`dial: every tel: link on the finder, panels and planner is a code with # encoded (${hrefs.length} links)`, hrefs.length > 0 && hrefs.every((h) => /^tel:\*[\d*]+%23$/.test(h)));
  const lines = [...(fin + pan + pla).matchAll(/data-testid="(bf-buy|panel-buy|plan-buy)"[\s\S]*?How to buy: <\/span>([^<]*)<\/p>/g)].map((x) => x[2].replace(/&amp;/g, "&"));
  const blocks = [...(fin + pan + pla).matchAll(/data-testid="(?:bf-buy|panel-buy|plan-buy)"([\s\S]*?)(?=data-testid="(?:bf-buy|panel-buy|plan-buy)"|$)/g)].map((x) => x[1]);
  const missing = lines.filter((t, i) => sh.dialCodes(t).some((c) => !(blocks[i] ?? "").includes(`href="${sh.telHref(c)}"`) || !(blocks[i] ?? "").includes(`aria-label="Copy ${c}"`)));
  check(`dial: every how-to-buy line with a code gets Dial and Copy for each code; app-only lines stay text (${lines.length} lines)`, lines.length > 0 && missing.length === 0, missing.slice(0, 3).join(" | "));
  check("dial: on iPhone Copy is the only action (useIsIOS hides the tel: link)", /\{!ios && \(\s*<a href=\{telHref\(code\)\}/.test(srcS("src/components/data-bundles/shared.tsx")) && /ios \? `Copy \$\{code\}` : null/.test(srcS("src/components/data-bundles/shared.tsx")) && /aria-label=\{copied \? `\$\{code\} copied` : `Copy \$\{code\}`\}/.test(srcS("src/components/data-bundles/shared.tsx")));

  // Order and layout.
  const dash = srcS("src/pages/data-bundles/DataBundlesDashboard.tsx");
  check("order: status strip, heading, then the finder; the face-off is lower (first in the content)", dash.indexOf("<LiveStatus") < dash.indexOf("<h1") && dash.indexOf("<h1") < dash.indexOf("<BudgetFinder") && dash.indexOf("<BudgetFinder") < dash.indexOf("<FaceOff"));
  const cards = [...fin.matchAll(/data-testid="bf-card" data-net="([a-z]+)"/g)].map((x) => x[1]);
  check("order: the winner's card comes first (GH¢20: Telecel)", cards[0] === [...m.mostData(m.networks.map((n) => ({ n, b: m.bestForBudget(n, 20) })))][0] && cards.length === 3, cards.join());
  check("meter: shown beside the figure with its zone; the old tick scale is gone", (fin.match(/data-testid="meter-zone"/g) ?? []).length === 3 && !/Each dial goes from 0/.test(fin) && /data-zone="Best"/.test(fin));
  const fo = html(React.createElement(FaceOff, { model: m }));
  check("face-off: pill tabs, network names above the bars, the Best badge on the winning bar", /rounded-full border border-border bg-background\/60 p-1/.test(fo) && (fo.match(/data-testid="faceoff-best"/g) ?? []).length === m.faceOff("allday").filter((r) => r.best).length && fo.indexOf("data-testid=\"faceoff-col\"") < fo.indexOf("Telecel"));
}

// ------------------------------------------------------------------ step 3 (19 Oct 2026): combos, hints, planner clarity, badge levels
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const lib = await import("../src/lib/dataBundles");
  const sh = await import("../src/components/data-bundles/shared");
  const { CadenceLine } = await import("../src/components/data-bundles/meta");
  const { ordinal } = await import("../src/components/data-bundles/Leaderboards");
  const { BundleTable } = await import("../src/components/data-bundles/BundleTable");
  const { NetworkPanels } = await import("../src/components/data-bundles/NetworkPanels");
  const { DATA_BUNDLE_COUNTRIES } = await import("../src/data/dataBundleCountries");
  const html = (el: unknown) => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/tools-preview/data-bundles/ghana" }, el as any) as any);
  const textOf = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const visible = (h: string) => textOf(h.replace(/<details\b[^>]*>([\s\S]*?)<\/details>/g, (_x, inner: string) => (inner.match(/<summary\b[\s\S]*?<\/summary>/)?.[0] ?? "")));

  // Combos: the planner's optimiser, checked against an independent pesewa-level brute force.
  function bruteCombo(mm: BundleModel, n: string, budget: number, o: { noExpiryOnly?: boolean; minDays?: number }, K: number): number {
    const C = Math.floor(budget * 100 + 1e-6);
    const anyMb = new Float64Array(C + 1);
    for (const s of mm.sources) {
      if (s.network !== n || s.kind === "night") continue;
      for (let p = 1; p <= C; p++) {
        const band = lib.bandFor(p / 100, s.table); if (!band) continue;
        const probe = { kind: s.kind, validity: s.validity(band), otherSource: s.otherSource };
        if (o.noExpiryOnly && !lib.neverExpires(probe)) continue;
        if (o.minDays && !lib.neverExpires(probe) && !((s.days(band) ?? 0) >= o.minDays)) continue;
        anyMb[p] = Math.max(anyMb[p], p / 100 / band.ghsPerMb);
      }
    }
    const fixed = mm.bundles.filter((b) => b.network === n && lib.isAllDay(b) && lib.canWin(b) && (!o.noExpiryOnly || lib.neverExpires(b)) && (!o.minDays || lib.lastsAtLeast(b, o.minDays))).map((b) => ({ p: Math.round(b.price * 100), mb: b.mb }));
    let prev = new Float64Array(C + 1);
    for (let k = 1; k <= K; k++) {
      const cur = Float64Array.from(prev);
      for (let c = 1; c <= C; c++) {
        let best = cur[c];
        for (let p = 1; p <= c; p++) if (anyMb[p] > 0) { const x = prev[c - p] + anyMb[p]; if (x > best) best = x; }
        for (const f of fixed) if (f.p <= c) { const x = prev[c - f.p] + f.mb; if (x > best) best = x; }
        cur[c] = best;
      }
      prev = cur;
    }
    return prev[C];
  }
  let comboBad: string[] = [], comboCases = 0;
  const t0c = Date.now();
  for (const n of m.networks) for (const a of [3, 5, 10, 20, 37.5]) for (const o of [{}, { noExpiryOnly: true }, { minDays: 30 }]) for (const K of [2, 3]) {
    comboCases++;
    const c = m.bestComboForBudget(n, a, o, K);
    const want = bruteCombo(m, n, a, o, K);
    const got = c ? c.mb : 0;
    if (Math.abs(got - want) > 1e-6 || (c && (c.purchases > K || c.total > a + 1e-9))) comboBad.push(`${n} ${a} ${JSON.stringify(o)} K${K}: ${got} vs ${want}`);
  }
  check(`combo: most data for a budget with up to 2 or 3 buys equals an independent brute force (${comboCases} cases, ${Date.now() - t0c} ms)`, comboBad.length === 0, comboBad.slice(0, 3).join(" | "));

  // Round 8 (20 Oct 2026): the mix shown is the FEWEST buys whose data shows the same as the most
  // data possible, with rounder amounts where the data still shows the same; checked against the brute force.
  {
    const bad: string[] = []; let cases = 0;
    for (const n of m.networks) for (const a of [3, 5, 10, 20, 37.5]) for (const o of [{}, { noExpiryOnly: true }, { minDays: 30 }] as { noExpiryOnly?: boolean; minDays?: number }[]) {
      const single = m.bestForBudget(n, a, o);
      const keep = !single ? o : lib.neverExpires(single) ? { ...o, noExpiryOnly: true } : single.days ? { ...o, minDays: Math.max(o.minDays ?? 0, single.days) } : o;
      const c = m.comboForBudget(n, a, o);
      if (!c) continue;
      cases++;
      const shown = m.fmtData(c.mb, n);
      const most = bruteCombo(m, n, a, keep, 3);
      if (shown !== m.fmtData(most, n)) bad.push(`${n} ${a} ${JSON.stringify(o)}: shows ${shown}, most possible ${m.fmtData(most, n)}`);
      for (let k = 1; k < c.purchases; k++) if (m.fmtData(bruteCombo(m, n, a, keep, k), n) === shown) bad.push(`${n} ${a} ${JSON.stringify(o)}: ${k} buys already give ${shown}, shown with ${c.purchases}`);
      if (c.total > a + 1e-9) bad.push(`${n} ${a}: over budget`);
    }
    check(`mix tie-break: the most data shown, in the fewest buys that show it (brute force, ${cases} mixes)`, cases > 0 && bad.length === 0, bad.slice(0, 3).join(" | "));
    const t20 = m.comboForBudget("telecel", 20);
    check("mix tie-break: Telecel GH¢20 is 2 × 'Flexi: type GH¢9.99' (3.05 GB), not 9.99 + 5.01 + 5", !!t20 && t20.purchases === 2 && m.mixParts(t20).map((x) => `${x.count} × ${x.text}`).join(" + ") === "2 × Flexi: type GH¢9.99" && m.fmtData(t20.mb, "telecel") === "3.05 GB", t20 ? m.mixParts(t20).map((x) => `${x.count} × ${x.text}`).join(" + ") : "none");
    // Rounder amounts: every pesewa part of a shown mix really buys more data than the whole or half cedi next to it.
    const odd: string[] = [];
    for (const n of m.networks) for (let a = 1; a <= 200; a++) {
      const c = m.comboForBudget(n, a); if (!c) continue;
      const others = (skip: number) => c.items.reduce((t, x, i) => t + (i === skip ? (x.count - 1) * x.bundle.mb : x.count * x.bundle.mb), 0);
      c.items.forEach((x, i) => {
        if (!x.bundle.computed || Math.round(x.bundle.price * 100) % 100 === 0) return;
        const s = m.sources.find((q) => q.network === n && q.label === x.bundle.rateLabel)!;
        for (const r of [Math.floor(x.bundle.price), Math.ceil(x.bundle.price), Math.floor(x.bundle.price * 2) / 2, Math.ceil(x.bundle.price * 2) / 2]) {
          if (Math.round((c.total - x.bundle.price + r) * 100) > a * 100 || Math.round(r * 100) === Math.round(x.bundle.price * 100)) continue;
          const band = lib.bandFor(r, s.table); if (!band) continue;
          const nb = m.sourceBundle(s, r);
          if (nb && lib.lastsAtLeast(nb, x.bundle.days ?? 0) && lib.neverExpires(nb) === lib.neverExpires(x.bundle) && m.fmtData(others(i) + nb.mb, n) === m.fmtData(c.mb, n)) odd.push(`${n} GH¢${a}: ${x.bundle.price} could be ${r}`);
        }
      });
    }
    check("mix tie-break: odd amounts (GH¢9.99) appear only where a rounder amount would show less data (GH¢1-200, every network)", odd.length === 0, odd.slice(0, 4).join(" | "));
  }

  // Round 8: the finder's headline, meter, "Most data" and share text all use the better of single and mix.
  {
    const bad: string[] = []; let cards = 0;
    const amounts = [...Array.from({ length: 1000 }, (_, i) => i + 1), 0.5, 2.5, 9.99, 19.99, 37.5, 399.99];
    for (const o of [{}, { noExpiryOnly: true }, { minDays: 7 }, { minDays: 30 }] as { noExpiryOnly?: boolean; minDays?: number }[]) for (const a of amounts) {
      const picks = m.finderPicks(a, o);
      for (const p of picks) {
        if (!p.b) continue;
        cards++;
        const c = m.comboForBudget(p.n, a, o);
        if (p.single && p.b.mb + 1e-9 < p.single.mb) bad.push(`${p.n} ${a}: headline below its single`);
        if (c && p.b.mb + 1e-9 < c.mb) bad.push(`${p.n} ${a} ${JSON.stringify(o)}: headline ${m.dataShown(p.b)} below its mix ${m.fmtData(c.mb, p.n)}`);
        if (p.combo && m.dataShown(p.b) !== m.fmtData(p.combo.mb, p.n)) bad.push(`${p.n} ${a}: mix headline text`);
      }
      const have = picks.filter((p) => p.b && lib.hasVolume(p.b));
      if (!have.length) continue;
      const lead = m.mostData(picks);
      const top = Math.max(...have.map((p) => Math.max(p.single?.mb ?? 0, m.comboForBudget(p.n, a, o)?.mb ?? 0)));
      const winners = have.filter((p) => lead.has(p.n));
      if (!winners.some((p) => Math.abs(p.b!.mb - top) < 1e-6 || m.dataShown(p.b!) === m.fmtData(top, p.n)) && !winners.every((p) => /GB$/i.test(m.dataShown(p.b!)) && have.every((q) => m.gbOf(q.b!) <= m.gbOf(p.b!) + 1e-9))) bad.push(`${a} ${JSON.stringify(o)}: winner is not the max of single and mix`);
      const meter = m.valueMeter(picks);
      if (!meter.every((x) => !x.best || lead.has(x.n))) bad.push(`${a}: meter best differs from Most data`);
      const st = m.finderShareText(a, o);
      const tp = picks.find((p) => p.n === [...lead][0])!;
      if (!st || !st.startsWith(`With ${m.money(a)}: ${m.dataShown(tp.b!)} on `) || !!tp.combo !== st.includes(` (if you buy ${tp.combo?.purchases} times) – `)) bad.push(`${a}: share text ${st}`);
    }
    check(`finder (round 8): no headline is smaller than its own mix or single; Most data, the meter and the share text use the same figure (${cards} cards, GH¢1-1,000, 4 option sets)`, bad.length === 0, bad.slice(0, 4).join(" | "));
    const fin8 = html(React.createElement((await import("../src/components/data-bundles/BudgetFinder")).BudgetFinder, { model: m }));
    const p20 = m.finderPicks(20);
    const mixCard = p20.find((p) => p.combo)!;
    check("finder: a mix headline says '· if you buy 2 times' and the single shows as 'Or buy once: X'",
      !!mixCard && m.buysText(mixCard.combo!) === `if you buy ${mixCard.combo!.purchases} times` && fin8.includes(`· ${m.buysText(mixCard.combo!)}`) && (!mixCard.single || textOf(fin8).includes(`Or buy once: ${m.dataShown(mixCard.single)}`)) && !/in \d buys|Or one bundle/.test(textOf(fin8)));
    check("finder (round 8): each part of a mix is listed by name and price with its own Dial/Copy", p20.filter((p) => p.combo).every((p) => m.mixParts(p.combo!).every((x) => textOf(fin8).includes(`${x.count} × ${x.text}`))) && (fin8.match(/data-testid="bf-part"/g) ?? []).length === p20.reduce((t, p) => t + (p.combo ? p.combo.items.length : 0), 0));
    const lead20 = m.mostData(p20);
    const folds = (fin8.match(/data-testid="bf-buy-fold"/g) ?? []).length;
    check("finder: every network card shows its Dial/Copy openly (no 'How to buy' fold in the finder)", folds === 0 && (fin8.match(/data-testid="bf-buy"/g) ?? []).length >= p20.filter((p) => p.b && !p.combo && m.buyShort(p.b)).length && lead20.size > 0);
  }
  check("combo: max 3 buys; shown only for 10%+ more data or a big unspent part; never shorter-lived than the single buy",
    lib.COMBO_MAX_BUYS === 3 && lib.COMBO_MIN_GAIN === 0.1 &&
    [5, 10, 20, 50, 100, 400, 500, 800, 1000].every((a) => m.networks.every((n) => {
      const c = m.comboForBudget(n, a); const s = m.bestForBudget(n, a);
      if (!c) return true;
      const lasts = !s || (lib.neverExpires(s) ? c.items.every((i) => lib.neverExpires(i.bundle)) : c.items.every((i) => lib.lastsAtLeast(i.bundle, s.days ?? 0)));
      return c.purchases >= 2 && c.purchases <= 3 && c.total <= a + 1e-9 && lasts && (!s || c.mb >= s.mb * 1.1 - 1e-9 || a - s.price >= a * 0.1 - 1e-9);
    })));
  check("combo: GH¢1,000 on AT -> '2 × GH¢400 + 1 × GH¢200' (540.00 GB); MTN at GH¢20 -> '1 × GH¢10 + 2 × GH¢5'",
    m.comboText(m.comboForBudget("at", 1000)!) === "2 × GH¢400 + 1 × GH¢200" && m.fmtData(m.comboForBudget("at", 1000)!.mb, "at") === "540.00 GB" && m.comboText(m.comboForBudget("mtn", 20)!) === "1 × GH¢10 + 2 × GH¢5");
  check("hint: the smallest amount the finder answers comes from the model", m.finderMinimum() === 0.02 && m.networks.some((n) => m.bestForBudget(n, 0.02)) && !m.networks.some((n) => m.bestForBudget(n, 0.01)));

  // Planner upsell.
  const plans10 = m.networks.map((n) => ({ n, p: m.cheapestMonthlyPlan(n, 10 * 1024, 1) }));
  const up = m.planUpsell(plans10);
  check("upsell: 10 GB, Once -> 'AT: +2.80 GB for GH¢17.08 more' (AT 12.80 GB for GH¢99 vs Telecel 10.00 GB for GH¢81.92)", up?.text === "AT: +2.80 GB for GH¢17.08 more", String(up?.text));
  let upBad = 0;
  for (const gb of [1, 5, 10, 20, 50, 100]) for (let cap = 1; cap <= 12; cap++) {
    const ps = m.networks.map((n) => ({ n, p: m.cheapestMonthlyPlan(n, gb * 1024, cap) }));
    const u = m.planUpsell(ps); if (!u) continue;
    const cheap = ps.filter((x) => x.p).reduce((a, x) => (x.p!.total < a.p!.total ? x : a));
    const other = ps.find((x) => x.n === u.n)!.p!;
    if (!(other.mb > cheap.p!.mb && other.total > cheap.p!.total && other.total - cheap.p!.total <= cheap.p!.total * lib.UPSELL_MAX_EXTRA + 1e-9)) upBad++;
  }
  check("upsell: always more data for at most 25% more money than the cheapest plan", lib.UPSELL_MAX_EXTRA === 0.25 && upBad === 0, String(upBad));

  // Badge levels.
  check("trust: '✓ Confirmed', '≈ Worked out', '! Check first' (+ who can buy: 'Some regions only')",
    // Audit 9 L1: a figure from an app screenshot only (MTN Social, Video, Kokrokoo) is "! Check first", never "Confirmed".
    m.bundles.filter((b) => lib.canWin(b) && !b.otherSource?.summary && !sh.fromAppOnly(b)).every((b) => sh.trustOf(b).level === "confirmed") &&
    m.bundles.filter((b) => sh.fromAppOnly(b)).length >= 7 && m.bundles.filter((b) => sh.fromAppOnly(b)).every((b) => sh.trustOf(b).level === "check") &&
    m.computed.filter((b) => !b.otherSource?.summary).every((b) => sh.trustOf(b).level === "worked") &&
    m.bundles.filter((b) => lib.hasConflict(b) || lib.isPending(b) || lib.isUnconfirmed(b) || lib.isConditional(b)).every((b) => sh.trustOf(b).level === "check") &&
    m.bundles.filter((b) => lib.conditionalReason(b) === "regional").every((b) => sh.trustOf(b).who === "Some regions only"));
  for (const n of m.networks) {
    const h = html(React.createElement(BundleTable, { model: m, network: n, family: "all", onFamily: () => {} }));
    const vis = visible(h);
    const flagged = m.bundles.filter((b) => b.network === n && sh.trustOf(b).level === "check");
    const regional = m.bundles.filter((b) => b.network === n && sh.trustOf(b).who);
    check(`trust (${n}): every row that needs checking shows '! Check first' on screen (${flagged.length}); limits on who can buy stay visible (${regional.length}); the reasons are under 'More info'`,
      // Round 12: one list at every width (no second desktop table), so each row shows once.
      (vis.match(/! Check first/g) ?? []).length === flagged.length && regional.every((b) => vis.includes(`! Check first · ${sh.trustOf(b).who}`)) &&
      (flagged.length === 0 || (h.match(/data-testid="trust-reasons"/g) ?? []).length >= flagged.length));
  }
  check("trust: the finder, panels, winners board and table use the three levels (the old scattered badges only under 'More info')",
    ["BudgetFinder.tsx", "NetworkPanels.tsx", "Leaderboards.tsx", "BundleTable.tsx"].every((f) => { const t = readFileSync(join(ROOT, "src/components/data-bundles/" + f), "utf8"); return /<TrustBadge b=\{(b|trustB)\} \/>/.test(t) && /<TrustReasons b=\{(b|trustB \?\? b)\} \/>/.test(t) && !/<StatusBadges b=\{b\} \/>/.test(t); }));

  // Small wording and layout items.
  check("board: '=2' is now 'Tied 2nd'", ordinal(1) === "1st" && ordinal(2) === "2nd" && ordinal(3) === "3rd" && ordinal(4) === "4th" && ordinal(11) === "11th" && ordinal(12) === "12th" && ordinal(13) === "13th" && ordinal(21) === "21st" && ordinal(22) === "22nd" &&
    /rankLabel=\{r\.joint \? `Tied \$\{ordinal\(r\.rank\)\}` : String\(r\.rank\)\}/.test(readFileSync(join(ROOT, "src/components/data-bundles/Leaderboards.tsx"), "utf8")));
  const det = renderToStaticMarkup(React.createElement(sh.Details, null, "x") as any);
  check("details: a clear 'More info' button (44px on phones), not a dotted link", /More info/.test(det) && /min-h-11/.test(det) && /rounded-full border/.test(det) && !/decoration-dotted/.test(det));
  const pl = readFileSync(join(ROOT, "src/components/data-bundles/MonthlyPlanner.tsx"), "utf8");
  check("planner: 'Buy more, save GH¢X' chip; 'Buy once' is plain text (no cart icon); the upsell line comes from the model",
    /Buy more, save \{savings\[n\]!\.text\}/.test(pl) && !/<ShoppingCart className="h-3\.5 w-3\.5"/.test(pl) && /model\.planUpsell\(plans\)/.test(pl) && /data-testid="plan-upsell"/.test(pl));
  const ph = html(React.createElement(NetworkPanels, { model: m, basePath: "/x" }));
  check("panels: from 768px each card spans five shared rows (subgrid), so a row's cells share one height across networks and the columns end level; a merged row says 'Same bundle as above'; row labels say 'Any time' / 'Never expires' / 'Night only' ('any price' only in the heading)",
    (ph.match(/md:row-span-5 md:grid md:grid-rows-subgrid md:gap-y-0/g) ?? []).length === 6 && /md:contents/.test(ph) && /Same bundle as above/.test(ph) &&
    (await import("../src/components/data-bundles/NetworkPanels")).PANEL_CATEGORIES.map((c) => c.label).join("|") === "Any time|Never expires|Night only" && (textOf(ph).match(/any price/gi) ?? []).length === 1);
  const cl = textOf(html(React.createElement(CadenceLine, { data: { country: DATA_BUNDLE_COUNTRIES.ghana, model: m, freshness: { capturedAt: doc.capturedAt, checkedAt: doc.capturedAt, source: "bundled" } } } as any)));
  check("top line: before mount it names the networks only ('AT, MTN & Telecel'); the cadence is added only while it is true", cl === "AT, MTN & Telecel" && /Checked every \$\{every\} hour/.test(readFileSync(join(ROOT, "src/components/data-bundles/meta.tsx"), "utf8")), cl);
}

// ------------------------------------------------------------------ step 4 (19 Oct 2026): URL state, sharing, bigger text, speed test
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const U = await import("../src/lib/dataBundlesUrl");
  const { STEPS } = await import("../src/components/data-bundles/MonthlyPlanner");
  const { BudgetFinder } = await import("../src/components/data-bundles/BudgetFinder");
  const { waHref } = await import("../src/components/data-bundles/meta");
  const sh = await import("../src/components/data-bundles/shared");
  const html = (el: unknown) => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/tools-preview/data-bundles/ghana" }, el as any) as any);
  const dec = (h: string) => h.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const D = U.DEFAULT_STATE;
  const eq = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);

  // Reading: defaults, validation and clamping.
  check("url: an empty or unrelated query gives the defaults (GH¢20, 10 GB, once)", eq(U.parseState(""), D) && eq(U.parseState("?utm_source=x"), D) && D.amount === 20 && D.gb === 10 && D.often === 1);
  const cases: [string, Partial<typeof D>][] = [
    ["?amount=5000", { amount: 1000 }], ["?amount=-1", { amount: 20 }], ["?amount=0", { amount: 20 }], ["?amount=abc", { amount: 20 }],
    ["?amount=7.456", { amount: 7.46 }], ["?amount=1e3", { amount: 20 }], ["?amount=0.001", { amount: 0.01 }], ["?amount=%20", { amount: 20 }],
    ["?gb=11", { gb: 10 }], ["?gb=11.5", { gb: 12 }], ["?gb=1000", { gb: 300 }], ["?gb=0.1", { gb: 0.5 }], ["?gb=x", { gb: 10 }],
    ["?often=0", { often: 1 }], ["?often=99", { often: 12 }], ["?often=3.6", { often: 4 }], ["?often=-3", { often: 1 }],
    ["?lasts=7", { minDays: 7 }], ["?lasts=30", { minDays: 30 }], ["?lasts=14", { minDays: 0 }],
    ["?noexp=1&night=1", { noExpiryOnly: true, night: true }], ["?noexp=true&night=yes", {}],
  ];
  for (const [q, want] of cases) check(`url: ${q} is read as ${JSON.stringify(want)}`, eq(U.parseState(q), { ...D, ...want }), JSON.stringify(U.parseState(q)));
  check("url: the planner's GB steps are the URL's GB steps", STEPS === U.GB_STEPS && U.GB_STEPS.includes(D.gb));

  // Round trip: every state the page can be in survives build -> parse unchanged.
  let rt = 0, rtBad = "";
  for (const amount of [0.01, 1, 7.5, 20, 999.99, 1000]) for (const gb of U.GB_STEPS) for (const often of [1, 2, 12]) for (const minDays of [0, 7, 30] as const) for (const flags of [0, 1, 2, 3]) {
    const s = { amount, gb, often, noExpiryOnly: !!(flags & 1), night: !!(flags & 2), minDays };
    rt++;
    if (!eq(U.parseState(U.buildQuery(s)), s)) rtBad ||= U.buildQuery(s);
  }
  check(`url: ${rt} states survive build -> parse`, !rtBad, rtBad);
  check("url: the default query is short and toggles are left out when off", U.buildQuery(D) === "?amount=20&gb=10&often=1");

  // Writing: replaceState only (never pushState), keeps other params and the hash, skips no-op writes.
  const calls: string[] = [];
  const fakeWin = (href: string) => {
    const u = new URL(href);
    (globalThis as any).window = {
      location: { href: u.href, search: u.search, pathname: u.pathname, hash: u.hash },
      history: { state: null, replaceState: (_s: unknown, _t: string, url: string) => calls.push(url), pushState: () => calls.push("PUSH") },
    };
  };
  fakeWin("https://techtrendi.com/data-bundles/ghana");
  U.writeState({ amount: 20, gb: 10, often: 1 });
  check("url: a plain visit at the defaults adds nothing to the address", calls.length === 0, calls.join());
  U.writeState({ amount: 50 });
  check("url: a change is written with replaceState", calls.length === 1 && calls[0] === "/data-bundles/ghana?amount=50&gb=10&often=1", calls.join());
  calls.length = 0;
  fakeWin("https://techtrendi.com/data-bundles/ghana?utm_source=wa&amount=50&gb=10&often=1#monthly");
  U.writeState({ gb: 20, often: 3, night: true });
  check("url: other parameters and the hash are kept; no pushState", calls.length === 1 && calls[0] === "/data-bundles/ghana?utm_source=wa&amount=50&gb=20&often=3&night=1#monthly" && !calls.includes("PUSH"), calls.join());
  delete (globalThis as any).window;

  // Share text: from the model's own picks.
  const fp = m.finderPicks(20, {});
  const lead = [...m.mostData(fp)];
  const topP = fp.find((p) => p.n === lead[0])!;
  const names = lead.map((n) => m.networkInfo(n).name);
  const who = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  const want = `With ${m.money(20)}: ${m.dataShown(topP.b!)} on ${who} today${topP.combo ? ` (${m.buysText(topP.combo)})` : ""} – see all networks:`;
  const st = m.finderShareText(20);
  check("share: the text comes from the finder's own winner", st === want, st ?? "null");
  check("share: nothing to share when no bundle fits", m.finderShareText(0.01) === null);
  const wa = waHref(st!, "https://techtrendi.com/data-bundles/ghana?amount=20&gb=10&often=1");
  check("share: the WhatsApp link carries the text and the full link, encoded", wa.startsWith("https://wa.me/?text=") && decodeURIComponent(wa.slice(20)) === `${st} https://techtrendi.com/data-bundles/ghana?amount=20&gb=10&often=1`);
  const fh = dec(html(React.createElement(BudgetFinder, { model: m })));
  check("share: the finder has 'Share on WhatsApp' (wa.me) and 'Copy link' under the answer, with the model's text",
    fh.includes(`data-text="${st}"`) && /data-testid="bf-wa"[^>]*>|href="https:\/\/wa\.me\/\?text=/.test(fh) && /data-testid="share-link"/.test(fh) && /Copy link/.test(fh));
  check("speed test: one line 'Is your data slow?' linking to /tools/speed-test", (fh.match(/Is your data slow\?/g) ?? []).length === 1 && /href="\/tools\/speed-test"/.test(fh));

  // Bigger text: two labelled, 44px buttons; storage in try/catch; the root size is put back on leaving.
  const th = renderToStaticMarkup(React.createElement(sh.TextSizeToggle) as any);
  check("text size: 'A' and 'A+' buttons, labelled and pressed-state, at least 44px", /aria-label="A normal text"[^>]*>A</.test(th) && /aria-label="A\+ bigger text"[^>]*>A\+</.test(th) && (th.match(/aria-pressed=/g) ?? []).length === 2 && (th.match(/h-11 min-w-11/g) ?? []).length === 2 && /role="group" aria-label="Text size"/.test(th));
  const shSrc = readFileSync(join(ROOT, "src/components/data-bundles/shared.tsx"), "utf8");
  check("text size: localStorage reads and writes are wrapped in try/catch; only the page content (main) grows, and only while the page is open",
    /try \{ setLarge\(window\.localStorage\.getItem\(TEXT_SIZE_KEY\)/.test(shSrc) && /try \{ window\.localStorage\.setItem\(TEXT_SIZE_KEY/.test(shSrc) && /return \(\) => \{ root\.removeAttribute\(LARGE_TEXT_ATTR\); \};/.test(shSrc) && sh.largeTextCss().startsWith('html[data-db-text="large"] main#main-content { zoom: 1.125; }') && /repeat\(4, minmax\(0, 1fr\)\)/.test(sh.largeTextCss()) && sh.chromeCss(0.6).includes(sh.largeTextCss()));
  const pages = ["DataBundlesDashboard.tsx", "DataBundlesNetwork.tsx"].map((f) => readFileSync(join(ROOT, "src/pages/data-bundles/" + f), "utf8"));
  check("text size: on both data bundle pages", pages.every((p) => /<TextSizeToggle className="shrink-0" \/>/.test(p)));
}

// ------------------------------------------------------------------ step 5 (19 Oct 2026): FAQ, structured data, launch switch, offline copy, sliders
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const { Faq } = await import("../src/components/data-bundles/Faq");
  const { Slider } = await import("../src/components/data-bundles/LabelledSlider");
  const route = await import("../src/data/dataBundlesRoute");
  const html = (el: unknown) => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/tools-preview/data-bundles/ghana" }, el as any) as any);
  const dec = (h: string) => h.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const src = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const rawJson = readFileSync(DATA_FILE, "utf8");

  // FAQ: every line is the dataset's own words or plain wording around its figures, with its page.
  const faq = m.faqItems();
  check("faq: five sourced questions (balance, renewing, leftover data, mobile money, running out)",
    faq.map((f) => f.question).join("|") === "How do I check how much data I have left?|Will my bundle renew by itself?|Does leftover data carry over?|Can I pay with mobile money?|What happens when my bundle runs out?", faq.map((f) => f.question).join("|"));
  const httpSources = faq.flatMap((f) => f.lines).map((l) => l.source).filter((s): s is string => !!s && /^https:/.test(s));
  const cited = new Set([...rawJson.matchAll(/"(https:\/\/[^"]+)"/g)].map((x) => x[1]));
  check("faq: every link is a page the dataset already cites (no new sources)", httpSources.length > 0 && httpSources.every((s) => cited.has(s)), httpSources.filter((s) => !cited.has(s)).join(" "));
  check("faq: every line has a source", faq.every((f) => f.lines.every((l) => !!l.source)));
  const figures = faq.flatMap((f) => f.lines).flatMap((l) => [...l.text.matchAll(/(\*[\d*]+#|\b\d+(?:\.\d+)?\b)/g)].map((x) => x[1]));
  const allowed = new Set<string>();
  for (const s of [rawJson]) for (const x of s.matchAll(/(\*[\d*]+#|\d+(?:\.\d+)?)/g)) allowed.add(x[1]);
  // Worked-out figures: the per-GB cost (perMb x 1,024) and money formats of dataset values.
  for (const n of m.networks) { const o = m.outOfBundle(n); if (o) for (const x of [m.rate(o.perMb), m.money(o.perMb * m.mbPerGb(n))]) for (const y of x.matchAll(/\d+(?:\.\d+)?/g)) allowed.add(y[0]); }
  const strays = figures.filter((x) => !allowed.has(x));
  check("faq: every number and code in the answers is in the dataset (or worked out from it)", strays.length === 0, strays.join(" "));
  const fq = dec(html(React.createElement(Faq, { model: m })));
  check("faq (round 8): on the page, each answer line shows its network and a source link; a network with no official source is left out (no 'don't say' line)",
    (fq.match(/data-testid="faq-item"/g) ?? []).length === faq.length && (fq.match(/data-testid="faq-line"/g) ?? []).length === faq.reduce((a, f) => a + f.lines.length, 0) &&
    faq.every((f) => f.lines.every((l) => fq.includes(l.text))) && !/don't say/.test(fq) && !/don't say/.test(faq.map((f) => m.faqAnswer(f)).join(" ")) && /min-h-14/.test(fq));
  // Round 8: the checker's new sourced fields (commit 70b863a on 144), as the live row carries them.
  {
    const live = clone(doc) as BundleDataset & Record<string, unknown>;
    (live.telecelRates as Record<string, unknown>).balanceCheck = { codes: ["*124#", "*126#"], shows: ["shows primary balance together with bundle allocations", "only shows the balance on bundle allocations"],
      says: "Subscribers on this offer can check their balance using any of the short codes below. *124#: this shows primary balance together with bundle allocations. *126#: this only shows the balance on bundle allocations.",
      source: "https://telecel.com.gh/support/telecel-business/data-bundle-offers-ts-cs" };
    live.walletPayments = {
      mtn: { label: "MTN help centre, How do I purchase data bundle?", url: "https://help-center.mtn.com.gh/hc/en-us/articles/4409539682450", says: "Launch MyMTN app Select Buy/Send Select Data Select preferred data bundle Select MoMo/Airtime as payment option", text: "Yes, in the MyMTN app: Buy/Send, then Data, pick a bundle, then pay with MoMo.", updated: "2022-03-01" },
      telecel: { label: "Telecel Cash Services T's & C's", url: "https://telecel.com.gh/support/telecel-cash/telecel-cash-services-ts-cs", says: "The purchase of Telecel Pre-paid Airtime or Data Bundle for yourself or a third party by sending a Transfer Instruction to Telecel Cash for the corresponding amount of E-Money to be sent to Telecel Ghana as the Designated Payee.", text: "Yes, Telecel Cash can pay for data bundles, for you or for someone else.", updated: "2026-06-05" },
    };
    const lm = createBundleModel(live as BundleDataset);
    const q = (s: string) => lm.faqItems().find((f) => f.question === s)!;
    const bal = q("How do I check how much data I have left?");
    check("faq (round 8): Telecel balance from its own terms: 'Dial *124# (airtime and bundles) or *126# (bundles only).'", bal.lines.find((l) => l.network === "telecel")?.text === "Dial *124# (airtime and bundles) or *126# (bundles only)." && bal.lines.find((l) => l.network === "telecel")?.source === "https://telecel.com.gh/support/telecel-business/data-bundle-offers-ts-cs");
    const pay = q("Can I pay with mobile money?");
    check("faq (round 8): mobile money for all three networks, each with its operator page (MTN help centre, Telecel Cash terms, AT's BigTime page)",
      pay.lines.map((l) => l.network).join() === lm.networks.join() && pay.lines.find((l) => l.network === "mtn")?.source === "https://help-center.mtn.com.gh/hc/en-us/articles/4409539682450" && /MoMo/.test(pay.lines.find((l) => l.network === "mtn")!.text) && /Telecel Cash/.test(pay.lines.find((l) => l.network === "telecel")!.text) && /AT Money/.test(pay.lines.find((l) => l.network === "at")!.text));
    check("faq (round 8): AT has no official auto-renew source, so AT is left out of 'Will my bundle renew by itself?'", !q("Will my bundle renew by itself?").lines.some((l) => l.network === "at"));
    const ex = clone(live); delete (ex as Record<string, unknown>).walletPayments; delete (ex.telecelRates as Record<string, unknown>).balanceCheck;
    const em = createBundleModel(ex as BundleDataset);
    check("faq (round 8): without those fields (the bundled copy today) the answers just leave those networks out", !em.faqItems().find((f) => f.question === "How do I check how much data I have left?")!.lines.some((l) => l.network === "telecel") && em.faqItems().find((f) => f.question === "Can I pay with mobile money?")!.lines.every((l) => l.network === "at"));
  }
  check("faq: answers in structured data are the page's own lines", faq.every((f) => { const a = m.faqAnswer(f); return f.lines.every((l) => a.includes(l.text)); }));
  check("faq: no 'why data finishes fast' answer (no operator page we cite explains it)", !faq.some((f) => /fast|quickly/i.test(f.question)));
  const dash = src("src/pages/data-bundles/DataBundlesDashboard.tsx");
  check("faq: on the comparison page, in the jump list, with FAQPage data from the model", /<Faq model=\{model\} \/>/.test(dash) && /\["faq", "Questions"\]/.test(dash) && /faqs=\{faqs\}/.test(dash) && /model\.faqAnswer\(f\)/.test(dash));

  // ItemList: the number 1 of each winners tab, as the board shows it.
  const tw = m.topWinners();
  check("itemlist: one entry per winners tab (more only for ties), each the board's rank-1 row",
    tw.length >= GROUPS.length && GROUPS.every((g) => tw.some((w) => w.group === g.label && m.leaderboardRows(g.id).ranked.some((r) => r.rank === 1 && r.bundle === w.bundle))));
  check("itemlist: names never repeat the network ('Telecel Telecel'); each leads with price → data and ends with the value per GH¢10 (as the page words it; no price per GB)", tw.every((w) => !/(\b\w+) \1\b/.test(w.text) && w.text.includes(` – ${m.priceLead(w.bundle)} → ${m.dataShown(w.bundle)}`) && / per GH¢10$/.test(w.text) && !/per GB|\/GB|GH¢10 (gets|buys)/.test(w.text)), tw.map((w) => w.text).join(" | "));
  const seo = src("src/components/seo/SEOHead.tsx");
  check("itemlist: SEOHead takes an optional itemList (other pages unchanged) and the dashboard passes the winners", /itemList\?: \{ name: string; items: string\[\] \}/.test(seo) && /'@type': 'ItemList'/.test(seo) && /itemList=\{winnersList\}/.test(dash));

  // Launch values: prepared, not switched.
  check("launch: still preview (noindex, /tools-preview/data-bundles)", route.DATA_BUNDLES_LAUNCHED === false && route.DATA_BUNDLES_NOINDEX === true && route.DATA_BUNDLES_BASE === "/tools-preview/data-bundles" && route.DATA_BUNDLES_ROUTE === "tools-preview/data-bundles");
  check("launch: the launch base is /data-bundles, so the canonical becomes /data-bundles/ghana", route.DATA_BUNDLES_LAUNCH_BASE === "/data-bundles");
  const routes = src("src/ssg/routes.tsx");
  check("launch: routes, pages and registry all read the one switch", /path: `\$\{DATA_BUNDLES_ROUTE\}\/:country`/.test(routes) && /path: `\$\{DATA_BUNDLES_ROUTE\}\/:country\/:network`/.test(routes) &&
    ["DataBundlesDashboard.tsx", "DataBundlesNetwork.tsx"].every((f) => /noindex=\{DATA_BUNDLES_NOINDEX\}/.test(src("src/pages/data-bundles/" + f))) && /from "\.\/dataBundlesRoute"/.test(src("src/data/dataBundleCountries.ts")));
  check("launch: the route file holds no price data (the routes must not pull the dataset into every page)", !/import .*\.json/.test(src("src/data/dataBundlesRoute.ts")) && !/^import[^\n]*dataBundleCountries/m.test(routes));

  // Offline copy: prepared, off, scoped.
  const sw = src("public/sw-data-bundles.js");
  // Round 10: switched ON with the owner's approval (the round 10 block checks how); off still unregisters.
  check("offline: on (owner, 20 Oct 2026); when switched off, an earlier registration is removed (kill switch)", route.DATA_BUNDLES_OFFLINE === true && /if \(DATA_BUNDLES_OFFLINE\) \{[\s\S]*register\(DATA_BUNDLES_SW, \{ scope \}\)[\s\S]*\} else \{[\s\S]*unregister\(\)/.test(src("src/components/data-bundles/shared.tsx")));
  check("offline: scoped to the data bundle pages; pages and prices network-first; only same-site GETs", /const scope = `\$\{DATA_BUNDLES_BASE\}\/`/.test(src("src/components/data-bundles/shared.tsx")) &&
    /networkFirst\(PAGES, request/.test(sw) && /networkFirst\(PRICES, request, PRICES_TIMEOUT_MS/.test(sw) && /url\.origin !== self\.location\.origin\) return/.test(sw) && /request\.method !== 'GET'\) return/.test(sw) && /PRICES_PATH = '\/storage\/data-bundles\/'/.test(sw));

  // Sliders: the focusable thumb carries the name and the spoken value.
  const sl = renderToStaticMarkup(React.createElement(Slider, { min: 0, max: 10, value: [3], "aria-label": "Test amount", "aria-valuetext": "GH¢3" }) as any);
  check("a11y: data bundle sliders name the thumb (role=slider), not just the wrapper", /role="slider"[^>]*aria-label="Test amount"|aria-label="Test amount"[^>]*role="slider"/.test(sl) && /aria-valuetext="GH¢3"/.test(sl));
  const shS = src("src/components/data-bundles/shared.tsx");
  check("a11y (axe): count-up figures give screen readers the final figure as hidden text, not aria-label on a span",
    !/<span ref=\{ref\} className=\{cn\("tabular-nums", className\)\}[^>]*aria-label=/.test(shS) && /<span className="sr-only">\{format\(value\)\}<\/span>/.test(shS) && /<span className="sr-only">\{text\}<\/span>/.test(shS));
  check("a11y (axe): every spoken name starts with the words on screen (text size, save chip)",
    /aria-label="A normal text">A</.test(shS) && /aria-label="A\+ bigger text">A\+</.test(shS) && /aria-label=\{`Buy more, save \$\{savings\[n\]!\.text\}/.test(src("src/components/data-bundles/MonthlyPlanner.tsx")));
  check("a11y: planner, MTN and Telecel calculators use the labelled slider", ["MonthlyPlanner.tsx", "MtnCalculators.tsx", "TelecelFlexiCalculator.tsx"].every((f) => /import \{ Slider \} from "\.\/LabelledSlider";/.test(src("src/components/data-bundles/" + f))));
}

// ------------------------------------------------------------------ round 8 (20 Oct 2026): gauge, first screen, A / A+, folds
{
  const src = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const bf = src("src/components/data-bundles/BudgetFinder.tsx");
  const dash = src("src/pages/data-bundles/DataBundlesDashboard.tsx");
  const meta = src("src/components/data-bundles/meta.tsx");
  check("gauge: no small grey zone labels on the arc; the result word under it is large ('BEST BUY ✓' for the winner, 'Good'/'Fair'/'Poor' otherwise)",
    !/data-testid="meter-label"/.test(bf) && bf.includes('const word = meter.zone === "Best" ? "Best buy ✓" : meter.zone;') && bf.includes('meter.zone === "Best" ? "text-[15px] sm:text-base" : "text-base sm:text-lg")} data-testid="meter-zone">{word}'));
  check("first screen (round 8): one status line (no wrap), no cadence line on top, tighter heading and finder spacing on phones",
    /whitespace-nowrap text-xs font-medium/.test(meta) && !/<CadenceLine/.test(dash) && /text-\[1\.75rem\]/.test(dash) && /className="mt-2 block text-base font-bold text-muted-foreground (\S+ )*sm:mt-3 sm:text-lg">I have/.test(bf) && /col-span-2 flex items-center gap-2 sm:block/.test(bf));
  check("A / A+ (round 8): beside 'What we compare', not on the status line", /<Details summary="What we compare"[\s\S]*?<\/Details>\s*<TextSizeToggle className="shrink-0" \/>/.test(dash) && !/<LiveStatus data=\{data\} \/>\s*<TextSizeToggle/.test(dash));
  check("folds: the planner folds how-to-buy on plans that are not the best; the network best-deal cards show Dial/Copy (or the app's steps) openly on every card of every network",
    /<BuyFold open=\{false\} testId="plan-buy-fold">/.test(src("src/components/data-bundles/MonthlyPlanner.tsx")) && /\{isBest && model\.buyShort\(it\.bundle\) &&/.test(src("src/components/data-bundles/MonthlyPlanner.tsx")) &&
    !/panel-buy-fold/.test(src("src/components/data-bundles/NetworkPanels.tsx")) && /\{buy && <BuyLine text=\{buy\} testId="panel-buy" \/>\}/.test(src("src/components/data-bundles/NetworkPanels.tsx")));
  check("site-wide (round 8, axe button-name): the header menu button and the search button have a name (search: its visible words, or a hidden 'Search' on phones); nothing else changed there",
    /aria-label=\{isMobileMenuOpen \? "Close menu" : "Open menu"\}/.test(src("src/components/layout/Header.tsx")) && /<span className="sr-only sm:hidden">Search<\/span>/.test(src("src/components/ui/search-modal.tsx")) && !/aria-label="Search"/.test(src("src/components/ui/search-modal.tsx")));
}

// ------------------------------------------------------------------ round 10 (20 Oct 2026): launch prep
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const src = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const route = await import("../src/data/dataBundlesRoute");
  const sh = await import("../src/components/data-bundles/shared");
  const { Faq } = await import("../src/components/data-bundles/Faq");
  const { LiveStatus } = await import("../src/components/data-bundles/meta");
  const { DATA_BUNDLE_COUNTRIES } = await import("../src/data/dataBundleCountries");
  const html = (el: unknown) => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/tools-preview/data-bundles/ghana" }, el as any) as any);
  const dec = (h: string) => h.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

  // 1. Offline copy: on, network first, saved copies say so, versions replace each other, scoped, kill switch kept.
  const sw = src("public/sw-data-bundles.js");
  const vite = src("vite.config.ts");
  check("offline (round 10): switched on; registered in production builds only, scoped to the data bundle pages; off = unregister (kill switch)",
    route.DATA_BUNDLES_OFFLINE === true && /if \(!import\.meta\.env\.PROD\) return;/.test(src("src/components/data-bundles/shared.tsx")) &&
    /register\(DATA_BUNDLES_SW, \{ scope \}\)/.test(src("src/components/data-bundles/shared.tsx")) && /await r\.unregister\(\)/.test(src("src/components/data-bundles/shared.tsx")));
  check("offline (round 10, freshness L2): pages network first; the prices file network first with an 8 s limit; only hashed built files (/assets/ or /pv-assets/) cache first",
    /if \(request\.mode === 'navigate'\) \{\s*if \(!url\.pathname\.startsWith\(SCOPE_PATH\)\) return;[^\n]*\n\s*event\.respondWith\(networkFirst\(PAGES, request, 0/.test(sw) &&
    /startsWith\(PRICES_PATH\)\) \{\s*event\.respondWith\(networkFirst\(PRICES, request, PRICES_TIMEOUT_MS/.test(sw) && /const PRICES_TIMEOUT_MS = 8000;/.test(sw) &&
    /\} else if \(HASHED\.test\(url\.pathname\)\) \{\s*event\.respondWith\(cacheFirst\(request\)\);/.test(sw) && sw.includes(String.raw`const HASHED = /^\/(?:pv-)?assets\/.+-[A-Za-z0-9_-]{8,}\.`));
  check("offline (round 10, freshness M1): a new build is a new worker: build id stamped at build time, versioned cache names, skipWaiting + clients.claim, old caches moved over then deleted on activate",
    /const BUILD_ID = '__BUILD_ID__';/.test(sw) && /`\$\{PREFIX\}pages-\$\{BUILD_ID\}`/.test(sw) && /self\.skipWaiting\(\)/.test(sw) && /self\.clients\.claim\(\)/.test(sw) &&
    /if \(!name\.startsWith\(PREFIX\) \|\| keep\.has\(name\)\) continue;/.test(sw) && /await adopt\(name, PAGES\)/.test(sw) && /await adopt\(name, PRICES\)/.test(sw) && /await caches\.delete\(name\);/.test(sw) && /name: "data-bundles-sw"/.test(vite) && /src\.replace\("'__BUILD_ID__'"/.test(vite) && /dataBundlesSw\(\)\]\.filter\(Boolean\)/.test(vite));
  check("offline (round 10, freshness L13): never another site page or site: other origins and non-GET pass through; navigations outside the scope are ignored; the old public/sw.js is a self-removing stub",
    /if \(url\.origin !== self\.location\.origin\) return;/.test(sw) && /if \(request\.method !== 'GET'\) return;/.test(sw) && /const SCOPE_PATH = new URL\(self\.registration\.scope\)\.pathname;/.test(sw) &&
    /const OWN_CACHES = \['techtrendi-v1', 'techtrendi-static-v1', 'techtrendi-dynamic-v1'\];/.test(src("public/sw.js")) && /self\.registration\.unregister\(\)/.test(src("public/sw.js")) && !/addEventListener\('fetch'/.test(src("public/sw.js")));
  check("offline (round 10): a saved copy is marked (X-TT-Saved-Copy) and the page says 'Saved prices from ...'", /headers\.set\('X-TT-Saved-Copy', '1'\)/.test(sw) && /SAVED_COPY_HEADER = "X-TT-Saved-Copy"/.test(src("src/hooks/useBundleData.ts")) && /setSaved\(!o\.ok \|\| !!o\.saved\)/.test(src("src/hooks/useBundleData.ts")));
  const fr = (source: "live" | "saved" | "bundled") => ({ country: DATA_BUNDLE_COUNTRIES.ghana, model: m, freshness: { capturedAt: doc.capturedAt, checkedAt: "2026-10-19T23:09:39Z", source } });
  const savedHtml = dec(html(React.createElement(LiveStatus, { data: fr("saved") } as any)));
  check("offline (round 10): status for a saved copy: 'Saved prices from 19 Oct, 11:09 PM', amber, never 'Checked'",
    /Saved prices from <time[^>]*>19 Oct, 11:09 PM<\/time>/.test(savedHtml) && /bg-amber-400/.test(savedHtml) && /text-amber-800/.test(savedHtml) && !/Checked/.test(savedHtml.replace(/<[^>]+>/g, " ")), savedHtml.replace(/<[^>]+>/g, " ").trim());
  check("offline (round 10): savedStamp formats date and time in Ghana time", sh.savedStamp("2026-10-20T00:05:00Z") === "20 Oct, 12:05 AM" && sh.savedStamp("2026-10-19") === "19 Oct");

  // 2. FAQ closed by default; answers still in the server-rendered markup.
  const fq = dec(html(React.createElement(Faq, { model: m })));
  check("faq (round 10): every question starts closed, and every answer's text is in the server-rendered HTML (for Google)",
    (fq.match(/<details/g) ?? []).length === m.faqItems().length && !/<details[^>]*\sopen/.test(fq) && m.faqItems().every((f) => f.lines.every((l) => fq.includes(l.text))));

  // 3. Site-wide accessibility (minimal).
  const footer = src("src/components/layout/Footer.tsx"), header = src("src/components/layout/Header.tsx");
  check("site a11y (round 10): footer column titles are h2 (no skipped level), the footer logo has empty alt (the word sits beside it), the header logo link is named by its visible words (no aria-label; decorative logo image)",
    !/<h4/.test(footer) && (footer.match(/<h2 className="footer-head">/g) ?? []).length === 3 && /src="\/logo-t\.png"\s*\r?\n\s*alt=""/.test(footer) && /<Link to="\/" className="flex items-center gap-0\.5 group">/.test(header) && /src="\/logo-t\.png"\s*\r?\n\s*alt=""/.test(header));

  // 4. Social image.
  check("og image (round 10): the pages use /storage/data-bundles/og-ghana.jpg?v=YYYYMMDDHH of the checked time, with alt text",
    route.dataBundlesOgImage("ghana", "2026-10-19T23:09:39.553506+00:00") === "/storage/data-bundles/og-ghana.jpg?v=2026101923" && route.dataBundlesOgImage("ghana", "x") === "/storage/data-bundles/og-ghana.jpg" &&
    ["DataBundlesDashboard.tsx", "DataBundlesNetwork.tsx"].every((f) => /image=\{dataBundlesOgImage\(data\.country\.id, data\.freshness\.checkedAt\)\}/.test(src("src/pages/data-bundles/" + f)) && /imageAlt=\{DATA_BUNDLES_OG_ALT\}/.test(src("src/pages/data-bundles/" + f))));
  // Round 11: the image says what the finder and the winners board say (src/lib/ogSummary.ts,
  // bundled for the server as og_summary.mjs; the server's test_og_image pins the same figures).
  const { ogSummary, OG_AMOUNT } = await import("../src/lib/ogSummary");
  const ogS = ogSummary(doc);
  const fp20 = m.finderPicks(OG_AMOUNT);
  const lead20 = m.mostData(fp20);
  check("og image (round 11): every row is the finder's own answer at GH¢20 (single or mix, 'in N buys'), most data marked like the page",
    ogS.amount === "GH¢20" && ogS.picks.length === fp20.filter((p) => p.b).length && ogS.picks.every((r) => { const p = fp20.find((x) => x.n === r.network)!; return r.shown === m.dataShown(p.b!) && r.buys === (p.combo ? p.combo.purchases : 1) && r.best === lead20.has(p.n); }));
  const top1 = m.leaderboardRows("allday").ranked.find((r) => r.rank === 1)!.bundle;
  check("og image (round 11): 'Best value' names the winners board's number 1 in plain words (no price per GB)", !!ogS.bestValue && ogS.bestValue.network === top1.network && ogS.bestValue.name.endsWith(m.nameNoPrice(top1)) && !/per GB|GH¢/.test(ogS.bestValue.name));
  if (doc.capturedAt === "2026-10-19T23:09:39Z") {
    check("og image (round 11): pinned for this dataset, same as the server's test: Telecel 3.05 GB in 2 buys (most data), AT 2.5 GB, MTN 1.84 GB in 3 buys; Best value: Telecel 263.38GB Monthly",
      JSON.stringify(ogS.picks.map((r) => [r.name, r.shown, r.buys, r.best])) === JSON.stringify([["Telecel", "3.05 GB", 2, true], ["AT", "2.5 GB", 1, false], ["MTN", "1.84 GB", 3, false]]) && ogS.bestValue?.name === "Telecel 263.38GB Monthly", JSON.stringify(ogS));
  }
  // The owner's rule (round 1): a value per GH¢10 is never worded as a purchase ("GH¢10 gets").
  const BANNED = /GH¢10 (gets|buys)|(gets|buys) \$\{[^}]*value(Text|Mb|Line|Per)/;
  const scan = [
    ...["src/components/data-bundles", "src/pages/data-bundles"].flatMap((d) => readdirSync(join(ROOT, d)).filter((f) => /\.tsx?$/.test(f)).map((f) => `${d}/${f}`)),
    "src/lib/ogSummary.ts", "src/data/dataBundlesRoute.ts", "public/og-meta.php", "src/components/seo/SEOHead.tsx",
  ];
  const offenders = scan.filter((f) => BANNED.test(src(f).split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*\*)/.test(l)).join("\n")));
  const texts = [route.DATA_BUNDLES_OG_ALT, ...m.networks.map((n) => m.finderShareText(10) ?? ""), JSON.stringify(ogS)];
  check("wording (round 11): 'GH¢10 gets' (or 'gets' + a value per GH¢10) appears nowhere: image text, share text, alt text, SEO and og-meta text",
    offenders.length === 0 && texts.every((t) => !/GH¢10 (gets|buys)/.test(t)) && !/\b(gets|buys)\b/.test(JSON.stringify(ogS).replace(/"buys":/g, "")) && !/\bgets\b/.test(route.DATA_BUNDLES_OG_ALT), offenders.join(" "));

  // Round 11: the offline worker's scope follows the launch switch.
  check("offline (round 11): the worker's scope is the pages' base: /tools-preview/data-bundles/ today, /data-bundles/ at launch (nothing preview-specific in the worker)",
    /const scope = `\$\{DATA_BUNDLES_BASE\}\/`;/.test(src("src/components/data-bundles/shared.tsx")) && route.dataBundlesRouteConfig(false).base + "/" === "/tools-preview/data-bundles/" && route.dataBundlesRouteConfig(true).base + "/" === "/data-bundles/" &&
    !/tools-preview|data-bundles\/ghana/.test(sw) && /const SCOPE_PATH = new URL\(self\.registration\.scope\)\.pathname;/.test(sw));
  const og = src("public/og-meta.php");
  check("og image (round 10): og-meta.php serves it to bots for /data-bundles/ghana[/at|/mtn|/telecel] and the preview paths, cache-busted by the latest check",
    /preg_match\('#\^\(tools-preview\/\)\?data-bundles\/\(ghana\)\(\/\(at\|mtn\|telecel\)\)\?\$#'/.test(og) && /gmdate\('YmdH', \$ts\)/.test(og) && /\/storage\/data-bundles\/og-' \. \$country \. '\.jpg' \. \$v/.test(og) && /og:image:width" content="1200"/.test(og) && /og:image:height" content="630"/.test(og) && /og:image:alt/.test(og));

  // 5. Launch values (switch not flipped).
  const L = route.dataBundlesRouteConfig(true), P = route.dataBundlesRouteConfig(false);
  check("launch (round 10): flipped, the canonical is https://techtrendi.com/data-bundles/ghana (and /ghana/mtn, /at, /telecel) and robots index",
    L.canonical("ghana") === "https://techtrendi.com/data-bundles/ghana" && ["at", "mtn", "telecel"].every((n) => L.canonical("ghana", n) === `https://techtrendi.com/data-bundles/ghana/${n}`) && L.noindex === false && L.route === "data-bundles" &&
    /content=\{noindex \? 'noindex, nofollow' : 'index, follow/.test(src("src/components/seo/SEOHead.tsx")));
  check("launch (round 10): flipped, the pages are prerendered (includedRoutes adds them, so the sitemap, built from the prerendered files, lists them)",
    JSON.stringify(L.prerenderPaths) === JSON.stringify(["/data-bundles/ghana", "/data-bundles/ghana/at", "/data-bundles/ghana/mtn", "/data-bundles/ghana/telecel"]) &&
    /\.concat\(DATA_BUNDLES_PRERENDER\)/.test(vite) && !/EXCLUDE_PREFIX = \[[^\]]*"data-bundles"/.test(src("scripts/generate-sitemap.mjs")) && /Walks the prerendered `dist\/` output/.test(src("scripts/generate-sitemap.mjs")));
  check("launch (round 10): flipped, the 301 from /tools-preview/data-bundles/ is in the config and the checklist", L.redirects.length === 4 && L.redirects[0].from === "/tools-preview/data-bundles/" && L.redirects[0].to === "/data-bundles/" && L.redirects.every((x) => x.status === 301) && src("DOCS/DATA_BUNDLES_LAUNCH.md").includes("rewrite ^/tools-preview/data-bundles(/.*)?$ /data-bundles$1 permanent;"));
  check("launch (round 10): NOT flipped today: preview, noindex, nothing prerendered", route.DATA_BUNDLES_LAUNCHED === false && P.noindex && P.prerenderPaths.length === 0 && route.DATA_BUNDLES_PRERENDER.length === 0);
  check("launch (round 10): the pages list matches the dataset's networks", JSON.stringify(route.DATA_BUNDLES_PAGES.ghana) === JSON.stringify([...m.networks].sort()));

  // 6. Short phones: tighter spacing only on short screens; Tailwind's max-* variants stay available.
  const SHORT = "[@media(max-height:820px)_and_(max-width:639px)]:";
  check("short phones (round 10): tighter spacing only under 760px tall (and under 640px wide), same content",
    (src("src/components/data-bundles/BudgetFinder.tsx").split(SHORT).length - 1) >= 10 && (src("src/pages/data-bundles/DataBundlesDashboard.tsx").split(SHORT).length - 1) >= 5);
  check("short phones (round 10): tailwind.config has no raw screen (a raw screen switches off every max-* variant site-wide)", !/raw:/.test(src("tailwind.config.ts")));
}

// ------------------------------------------------------------------ round 12 (20 Oct 2026): network pages
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const src = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const { BudgetFinder } = await import("../src/components/data-bundles/BudgetFinder");
  const { NetworkBest, panelPicks } = await import("../src/components/data-bundles/NetworkPanels");
  const { BundleTable, bundleSorts } = await import("../src/components/data-bundles/BundleTable");
  const lib = await import("../src/lib/dataBundles");
  const { Faq } = await import("../src/components/data-bundles/Faq");
  const { networkSeo } = await import("../src/data/dataBundlesRoute");
  const html = (el: unknown, at = "/tools-preview/data-bundles/ghana/mtn") => renderToStaticMarkup(React.createElement(StaticRouter, { location: at }, el as any) as any);
  const dec = (h: string) => h.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const text = (h: string) => dec(h.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  const page = src("src/pages/data-bundles/DataBundlesNetwork.tsx");

  for (const n of m.networks) {
    const name = m.networkInfo(n).name;
    // 1. The finder for this network only.
    const fh = dec(html(React.createElement(BudgetFinder, { model: m, only: n })));
    const p = m.finderPick(n, 20);
    check(`network finder (${n}): one card, this network's own answer (single or mix), no meter, no 'Most data' badge`,
      (fh.match(/data-testid="bf-card"/g) ?? []).length === 1 && fh.includes(`data-net="${n}"`) && fh.includes(m.dataShown(p.b!)) && !/data-testid="gauge-wrap"/.test(fh) && !/Most data<\/span>/.test(fh) && /What should I buy\?/.test(fh) && fh.includes(`Best for GH¢20 on ${name}`));
    const st = m.finderShareText(20, {}, n);
    check(`network finder (${n}): the share text names the network and says only what the card says`, st === `With GH¢20 on ${name}: ${m.dataShown(p.b!)} today${p.combo ? ` (${m.buysText(p.combo)})` : ""} – see all ${name} bundles:` && fh.includes(`data-text="${st}"`) && !/\bgets\b/.test(st!), st ?? "null");
    const minN = m.finderMinimum({}, n)!;
    check(`network finder (${n}): the 'smallest buy' hint is this network's own smallest amount`, !!m.bestForBudget(n, minN) && !m.bestForBudget(n, Math.round((minN - 0.01) * 100) / 100));

    // 2. Its best deals.
    const bh = dec(html(React.createElement(NetworkBest, { model: m, network: n })));
    const mine = panelPicks(m).picks.find((x) => x.n === n)!;
    const rows = mine.shownRows.filter((r) => r.b);
    check(`network best (${n}): any time / never expires / night, a duplicate shown once, every card keeps Dial/Copy`,
      (bh.match(/data-testid="best-card"/g) ?? []).length === rows.length && rows.every((r) => bh.includes(m.dataShown(r.b!))) && !/data-testid="panel-buy-fold"/.test(bh.replace(/<details[^>]*data-testid="panel-buy-fold"/g, "")) && !/<details[^>]*data-testid="panel-buy-fold"/.test(bh));

    // 3. The bundle list: one list, grouped by family, all-day families first, never-ranked last.
    const lh = dec(html(React.createElement(BundleTable, { model: m, network: n, family: "all", onFamily: () => {} })));
    const all = m.bundles.filter((b) => b.network === n);
    const secs = [...lh.matchAll(/data-testid="bt-section">([^<]+)</g)].map((x) => x[1]);
    check(`network list (${n}): one card list (no table), every bundle once, grouped by family (${secs.length} groups)`,
      !/<table/.test(lh) && (lh.match(/data-testid="bt-row"/g) ?? []).length === all.length && secs.length >= 1 &&
      secs.filter((s) => s !== "Not ranked" && !/not ranked/i.test(s)).every((s) => all.some((b) => b.family === s)));
    const unrankedLabel = TABLE_SECTIONS[TABLE_SECTIONS.length - 1].label;
    const hasUnranked = all.some((b) => tableSection(b) === "unranked");
    check(`network list (${n}): bundles we don't rank come last, in their own group`, !hasUnranked || secs[secs.length - 1] === unrankedLabel, secs.join(" | "));
    const famSecs = secs.filter((s) => s !== unrankedLabel);
    const secIdx = (f: string) => Math.min(...all.filter((b) => b.family === f && tableSection(b) !== "unranked").map((b) => TABLE_SECTIONS.findIndex((s) => s.id === tableSection(b))));
    check(`network list (${n}): families ordered by type (all-day first)`, famSecs.every((f, i) => i === 0 || secIdx(famSecs[i - 1]) <= secIdx(f)), famSecs.join(" | "));
    check(`network list (${n}): each row shows price, data, how long it lasts, 'Every GH¢10 =' (never 'gets') and How to buy ▾`,
      all.filter((b) => hasVolume(b) && m.valueText(b)).every((b) => lh.includes(m.valueLine(b)!)) && !/GH¢10 gets/.test(lh) && /How to buy <svg/.test(lh) && (lh.match(/data-testid="bt-buy-fold"/g) ?? []).length >= 1);

    // Long families show their first cards and "Show all N"; the rest stay in the HTML (hidden).
    const { FIRST_ROWS } = await import("../src/components/data-bundles/BundleTable");
    const famRows = (f: string) => all.filter((b) => b.family === f && tableSection(b) !== "unranked").length;
    const wantFolded = [...new Set(all.map((b) => b.family))].reduce((t, f) => t + (famRows(f) > FIRST_ROWS + 1 ? famRows(f) - FIRST_ROWS : 0), 0) + (() => { const u = all.filter((b) => tableSection(b) === "unranked").length; return u > FIRST_ROWS + 1 ? u - FIRST_ROWS : 0; })();
    const folded = (lh.match(/data-folded=""/g) ?? []).length;
    const oneFam = [...new Set(all.map((b) => b.family))][0];
    const lhF = dec(html(React.createElement(BundleTable, { model: m, network: n, family: oneFam, onFamily: () => {} })));
    check(`network list (${n}): long families show ${FIRST_ROWS} cards and 'Show all N' (${folded} folded, all still in the HTML); a family filter shows everything`,
      folded === wantFolded && (folded === 0) === ((lh.match(/data-testid="bt-more"/g) ?? []).length === 0) && /Show all \d+/.test(lh) === (folded > 0) && !/data-folded/.test(lhF), `${folded} vs ${wantFolded}`);

    // Round 13: short "lasts" in the rows; order inside every family and for every sort.
    const lasts = [...lh.matchAll(/data-testid="bt-lasts">([^<]*)</g)].map((x) => x[1]);
    check(`network list (${n}): every row's 'lasts' is short and plain (≤ ${lib.SHORT_VALIDITY_MAX} characters, no quotes, no 'PDF'); the full wording is under More info`,
      lasts.length === all.length && lasts.every((t) => t.length <= lib.SHORT_VALIDITY_MAX && !/[“”"]|PDF/.test(t)) &&
      all.filter((b) => m.shortValidity(b) !== m.validityText(b)).every((b) => lh.includes(`Lasts: ${m.validityText(b)}`)), lasts.filter((t) => t.length > 40 || /[“”"]|PDF/.test(t)).join(" | "));
    check(`network list (${n}): a disputed figure shows a calm badge ('Expiry not clear – check with …')`, (lh.match(/data-testid="bt-disputed"/g) ?? []).length === all.filter((b) => m.disputeText(b)).length && all.filter((b) => lib.expiryDisputed(b)).every((b) => lh.includes(m.disputeText(b)!)));
    const sorts = bundleSorts(m);
    const sectionPrices = [...lh.matchAll(/<ul class="grid gap-2[^"]*"[^>]*>([\s\S]*?)<\/ul>/g)].map((x) => [...x[1].matchAll(/data-testid="price-lead"><span class="tabular-nums">(?:Pay (?:exactly )?)?GH¢([\d.,]+)/g)].map((y) => Number(y[1].replace(/,/g, ""))));
    check(`network list (${n}): 'By family' lists each family cheapest first (${sectionPrices.length} groups)`, sectionPrices.length > 0 && sectionPrices.every((ps) => ps.length > 0) && sectionPrices.every((ps) => ps.every((p, i) => i === 0 || ps[i - 1] <= p)), JSON.stringify(sectionPrices.filter((ps) => ps.some((p, i) => i > 0 && ps[i - 1] > p))));
    const sortOk = (Object.keys(sorts) as (keyof typeof sorts)[]).every((k) => {
      const rows = [...all].sort(sorts[k]);
      return rows.every((b, i) => i === 0 || sorts[k](rows[i - 1], b) <= 0);
    });
    check(`network list (${n}): every sort option (family, price, most data, lasts longest) gives a consistent order`, sortOk &&
      [...all].sort(sorts.price).every((b, i, a) => i === 0 || a[i - 1].price <= b.price) &&
      [...all].sort(sorts.data).every((b, i, a) => i === 0 || (hasVolume(a[i - 1]) ? a[i - 1].mb : -1) >= (hasVolume(b) ? b.mb : -1)));
    const ctl = [...lh.matchAll(/aria-controls="([^"]+)"/g)].map((x) => x[1]);
    check(`network list (${n}): every 'Show all' button controls a real list (valid id, no spaces; axe aria-valid-attr-value)`, ctl.every((c) => !/\s/.test(c) && lh.includes(`id="${c}"`)), ctl.join(" "));

    // 7. FAQ for this network only.
    const qh = dec(html(React.createElement(Faq, { model: m, only: n })));
    const lines = m.faqItems().flatMap((f) => f.lines);
    check(`network faq (${n}): only this network's answers, closed, all in the HTML`, !/<details[^>]*\sopen/.test(qh) && lines.filter((l) => l.network === n).every((l) => qh.includes(l.text)) && lines.filter((l) => l.network !== n).every((l) => !qh.includes(`data-net="${l.network}"`)));

    // SEO.
    const seo = networkSeo(name, "Ghana");
    check(`network seo (${n}): plain-words title and description (no 'per GB', no 'validity')`, seo.title === `${name} Data Bundles in Ghana: What to Buy Today` && !/per GB|validity/i.test(seo.title + seo.description));
  }
  const og = src("public/og-meta.php");
  check("network seo: og-meta.php serves the same network titles to social bots", /' Data Bundles in Ghana: What to Buy Today'/.test(og) && /'What to buy on ' \. \$names\[\$net\]/.test(og));

  // Page structure.
  check("network page: the finder for this network sits in the header (first screen), keyed by network",
    /<BudgetFinder key=\{network\} model=\{model\} only=\{network\} \/>/.test(page));
  check("network page: order is best deals, calculator, bundle list, rankings, good to know, questions, tips, sources, other networks",
    /<NetworkBest[\s\S]*<MtnCalculators[\s\S]*<TelecelFlexiCalculator[\s\S]*<BundleTable[\s\S]*<Leaderboards model=\{model\} network=\{network\} \/>[\s\S]*<GoodToKnow[\s\S]*<Faq model=\{model\} only=\{network\} \/>[\s\S]*<Advice model=\{model\} only=\{network\} \/>[\s\S]*<SourcesAndDisclaimer data=\{data\} only=\{network\} \/>[\s\S]*data-testid="other-networks"/.test(page));
  check("network page: no 'Other networks' cards (the old box showed AT's BigTime on the MTN page); a small 'See AT · See Telecel' row instead, keeping ?amount=",
    !/NetworkCards/.test(page) && /others\.map\(\(n\) => \(/.test(page) && /const to = \(n: string\) => `\$\{basePath\}\/\$\{n\}`;/.test(page) && /<QueryLink key=\{n\} to=\{to\(n\)\} data-testid="see-network"/.test(page));
  check("network page: a 'Compare all networks' link back, and the switch marks the current network (ring, underline, aria-current)",
    /Compare all networks/.test(page) && /aria-current=\{n === network \? "page" : undefined\}/.test(page) && /ring-2 ring-foreground/.test(page) && /underline decoration-2/.test(page));
  check("network page: out-of-bundle and borrowed data are plain cards with their facts, no table", /function GoodToKnow/.test(page) && /data-testid="oob-card"/.test(page) && /data-testid="borrowed-card"/.test(page) && !/<table/.test(page));
  check("network page: sources and questions for this network only", /export function SourcesAndDisclaimer\(\{ data, only \}/.test(src("src/components/data-bundles/meta.tsx")) && /export function Faq\(\{ model, only \}/.test(src("src/components/data-bundles/Faq.tsx")));
  const mc = src("src/components/data-bundles/MtnCalculators.tsx"), tc = src("src/components/data-bundles/TelecelFlexiCalculator.tsx");
  check("calculators (round 12): the long parts are folded but still in the page (how it works, the price list, examples)",
    /<Details summary="How it works"/.test(mc) && /<Details summary="MTN's price list" testId="calc-table">/.test(mc) && /<Details summary="Examples"/.test(mc) &&
    /<Details summary="How it works"/.test(tc) && /<Details summary="Telecel's price list" testId="calc-table">/.test(tc));
}

// ------------------------------------------------------------------ audit 9 (20 Oct 2026): names, disputes, wording, maths display
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const lib = await import("../src/lib/dataBundles");
  const sh = await import("../src/components/data-bundles/shared");
  const { BundleTable } = await import("../src/components/data-bundles/BundleTable");
  const { LiveStatus } = await import("../src/components/data-bundles/meta");
  const { DATA_BUNDLE_COUNTRIES } = await import("../src/data/dataBundleCountries");
  const src = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const html = (el: unknown) => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/x" }, el as any) as any);
  const dec = (h: string) => h.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

  // M1: Telecel's own title in More info for every renamed bundle; MTN uses MTN's name.
  const tel = m.bundles.filter((b) => b.network === "telecel" && b.operatorTitle && b.operatorTitle !== b.name);
  const th = dec(html(React.createElement(BundleTable, { model: m, network: "telecel", family: "all", onFamily: () => {} })));
  check(`names (M1): every renamed Telecel bundle (${tel.length}) shows "Telecel calls it: “…”" in More info`, tel.length >= 30 && tel.every((b) => th.includes(`Telecel calls it: “${b.operatorTitle}”`)));
  check("names (M1): MTN's Kokrokoo row uses MTN's own name 'Kokrokoo Bundle'", m.bundles.some((b) => b.network === "mtn" && b.name === "Kokrokoo Bundle") && !m.bundles.some((b) => /Kokrokoo morning bundle/.test(b.name)));
  // M2
  check("wording (M2): 'How we rank' says ties are shown as 'Tied'", /they share a place \(shown as “Tied”\)/.test(src("src/components/data-bundles/Leaderboards.tsx")) && !/shown as “=”/.test(src("src/components/data-bundles/Leaderboards.tsx")));
  // M3: Telecel Boss Plan dispute.
  const boss = m.bundles.filter((b) => b.network === "telecel" && b.family === "Boss Plan");
  check("Boss Plan (M3): both packs are '! Check first' with Telecel's Boss Plan page as the other source (30 days, 500 SMS); never 'Confirmed'",
    boss.length === 2 && boss.every((b) => sh.trustOf(b).level === "check" && b.otherSource?.url === "https://telecel.com.gh/business/sme/boss-plan/" && /500 SMS/.test(b.otherSource?.says ?? "") && lib.expiryDisputed(b)) &&
    !/Big no-expiry/.test(doc.familyInfo.telecel["Boss Plan"]));
  // M5 and L9: AT and MTN "Good to know".
  const page = src("src/pages/data-bundles/DataBundlesNetwork.tsx");
  check("good to know (M5): the fee is said once ('Fee: 20%'); the operator's longer wording and the service-class sentence are under More info",
    /<b>Fee: \{v\.feePercent\}%<\/b>/.test(page) && !/The fee is <b>/.test(page) && /\{o\.note && <Details className="mt-2" testId="oob-note">/.test(page) && /testId="borrowed-note"/.test(page));
  check("links (L9): help-centre links are named by their article titles, never 'help centre 1/2'", /helpLabel\(u\)/.test(page) && !/help centre\{help\.length > 1/.test(page) &&
    m.sourcesFor("mtn").cited.some((c) => c.label === "MTN help centre, What is Xtratime or Xtrabyte"));
  // L1: app-screenshot-only figures.
  const mh = dec(html(React.createElement(BundleTable, { model: m, network: "mtn", family: "all", onFamily: () => {} })));
  const appOnly = m.bundles.filter((b) => sh.fromAppOnly(b));
  check(`app-only (L1): ${appOnly.length} MTN rows from the app screenshot are '! Check first' and say "From MTN's app on 17 Oct 2026"`, appOnly.length >= 7 && appOnly.every((b) => sh.trustOf(b).level === "check") && (mh.match(/From MTN's app on 17 Oct 2026/g) ?? []).length === appOnly.length);
  // L2
  check("value (L2): MB values keep the label's precision (825.7MB -> 'Every GH¢10 = 825.7 MB')", m.valueText(m.bundles.find((b) => b.name === "Social GH¢10")!) === "825.7 MB");
  // L3, L5
  check("wording (L3, L5): 'Data that comes with limits'; 'Figures last changed'", /title: "Data that comes with limits"/.test(src("src/components/data-bundles/Advice.tsx")) && /Figures last changed/.test(src("src/components/data-bundles/meta.tsx")) && !/First taken from the networks/.test(src("src/components/data-bundles/meta.tsx")));
  // L4: same price, different data -> no tie.
  for (const g of ["allday", "noexpiry"]) {
    const r = m.leaderboardRows(g).ranked;
    const at = r.find((x) => x.bundle.network === "at" && x.bundle.price === 400), tc = r.find((x) => x.bundle.network === "telecel" && x.bundle.price === 400 && x.bundle.family === "2Moorch No Expiry");
    if (at && tc) check(`ties (L4, ${g}): AT BigTime GH¢400 (253.3 GB) ranks above Telecel 2Moorch GH¢400 (253.25 GB), no tie`, at.rank < tc.rank && !at.joint && !tc.joint, `${at.rank} vs ${tc.rank}`);
  }
  // L6
  const shorts = [...m.bundles, ...m.computed].map((b) => m.buyShort(b) ?? "");
  check("app names (L6): the main view says 'the Telecel Play app' and 'myMTN app' only", shorts.every((t) => !/My ?Telecel Play App|MyMTN App|Telecel Play App\b/.test(t)) && shorts.some((t) => /the Telecel Play app/.test(t)));
  // L8
  const seo = src("src/components/seo/SEOHead.tsx");
  check("SEO (L8): twitter:image:alt = og:image:alt; no ItemListOrderAscending; exact keywords on these pages",
    /name="twitter:image:alt" content=\{imageAlt \|\| title\}/.test(seo) && !/ItemListOrderAscending/.test(seo) &&
    ["DataBundlesDashboard.tsx", "DataBundlesNetwork.tsx"].every((f) => /keywords=\{DATA_BUNDLES_KEYWORDS\}\s*keywordsOnly/.test(src("src/pages/data-bundles/" + f))));
  // L10
  check("data (L10): units.mb is true for MTN too; 'any Ghana network'; Adwumapa articles cited", /MTN included/.test(String((doc.units as any).mb)) && /any Ghana network/.test(doc.familyInfo.telecel["Voice & Data Combo"]) &&
    ["27275427363858", "27285471574418"].every((id) => (doc.mtnRates as any).citedSources.some((c: any) => c.url.endsWith(id) && c.date === "2025-06-12")));
  // L11: neutral status until the first live attempt answers.
  const ck = dec(html(React.createElement(LiveStatus, { data: { country: DATA_BUNDLE_COUNTRIES.ghana, model: m, freshness: { capturedAt: doc.capturedAt, checkedAt: doc.capturedAt, source: "bundled" }, checking: true } } as any)));
  const hook = src("src/hooks/useBundleData.ts");
  check("status (L11): 'Checking prices…' (grey) until the first live answer, never green then amber; a timeout ends it",
    /Checking prices…/.test(ck) && !/Checked|Saved prices/.test(ck.replace(/<[^>]+>/g, " ")) && /data-source="checking"/.test(ck) &&
    /const \[checking, setChecking\] = useState\(true\);/.test(hook) && /export const CHECK_TIMEOUT_MS = 6000;/.test(hook) && /setChecking\(false\); setSaved\(true\);/.test(hook));
  check("status (freshness L5): a visible tab re-checks every 15 minutes, and when the network comes back", /export const RECHECK_MS = 15 \* 60 \* 1000;/.test(hook) && /addEventListener\("visibilitychange", tick\)/.test(hook) && /addEventListener\("online", onOnline\)/.test(hook) && /if \(force\) answered\.delete\(country\);/.test(hook));

  // Maths display (sub-audit).
  check("money (maths L1): GH¢16.9990144 shows 'GH¢17' (rounded to pesewas first, never 'GH¢17.00')", lib.fmtMoney(16.9990144) === "GH¢17" && lib.fmtMoney(16.995) === "GH¢17" && lib.fmtMoney(16.994) === "GH¢16.99" && lib.fmtMoney(0.1) === "GH¢0.10");
  check("money (maths L1): no price per GB anywhere shows a whole number with '.00'", [...m.all, ...m.bundles].filter((b) => hasVolume(b)).every((b) => !/GH¢\d[\d,]*\.00\b/.test(m.perGbText(b))));
  check("truths (maths L1): every network's fact text still keeps its GH¢/GB sentences", m.networks.every((n) => !doc.networkFacts?.[n] || !!m.factText(n)));
  const mat = m.materialCliffsOf(m.rates!.regular).map((c: any) => `${c.from}-${c.to}`);
  check("cliffs (maths L2): the MTN calculator uses material cliffs only: 3.01-3.88, 5.01-7.28, 10.01-11.71", /cliffAt\(model\.materialCliffsOf\(calc\.table\), amount\)/.test(src("src/components/data-bundles/MtnCalculators.tsx")) &&
    ["3.01-3.88", "5.01-7.28", "10.01-11.71"].every((x) => mat.includes(x)), mat.join(" "));
  // Maths L3: no meter zone contradicts the printed figures.
  let zoneBad = 0, zoneCases = 0; const zoneEx: string[] = [];
  const num = (b: Bundle) => { const x = m.dataShown(b).match(/([\d,]+(?:\.\d+)?)\s*(GB|MB)\b/i)!; const v = parseFloat(x[1].replace(/,/g, "")); return /GB/i.test(x[2]) ? v * m.mbPerGb(b.network) : v; };
  for (const o of [{}, { noExpiryOnly: true }, { minDays: 7 }, { minDays: 30 }] as any[]) for (let a = 1; a <= 400; a++) {
    const picks = m.finderPicks(a, o);
    const meter = m.valueMeter(picks);
    const have = picks.filter((p) => p.b && hasVolume(p.b));
    if (have.length < 2) continue;
    const top = Math.max(...have.map((p) => num(p.b!)));
    for (const x of meter) {
      const p = picks.find((q) => q.n === x.n)!;
      if (!p.b || !hasVolume(p.b) || x.best) continue;
      zoneCases++;
      const ratio = num(p.b) / top;
      const want = lib.valueZone(ratio, false);
      if (want !== x.zone && Math.abs(ratio - 0.75) > 0.002 && Math.abs(ratio - 0.5) > 0.002) { zoneBad++; if (zoneEx.length < 3) zoneEx.push(`GH¢${a} ${JSON.stringify(o)} ${x.n}: ${m.dataShown(p.b)} / top -> ${ratio.toFixed(3)} ${x.zone} vs ${want}`); }
    }
  }
  check(`meter (maths L3): no zone contradicts the shown figures' ratio (${zoneCases} cards, GH¢1-400, 4 option sets)`, zoneBad === 0, zoneEx.join(" | "));
  const p20 = m.finderPicks(20, { minDays: 30 });
  const mz = m.valueMeter(p20).find((x) => x.n === "mtn");
  check("meter (maths L3): GH¢20, 30+ days: MTN 1.84 GB vs Telecel 2.45GB (75.1%) reads 'Good'", !mz || mz.best || mz.zone === "Good", JSON.stringify(mz));
}

// ------------------------------------------------------------------ freshness / offline / guards (20 Oct 2026)
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const src = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const route = await import("../src/data/dataBundlesRoute");
  const sh = await import("../src/components/data-bundles/shared");
  const schema = await import("../src/lib/dataBundleSchema.js");
  const sw = src("public/sw-data-bundles.js");
  const shared = src("src/components/data-bundles/shared.tsx");
  const hook = src("src/hooks/useBundleData.ts");
  const vite = src("vite.config.ts");

  // H1: the worker's address has no .js extension and follows the launch switch.
  check("offline H1: the worker is registered from an extensionless address that follows the launch switch",
    route.dataBundlesRouteConfig(false).sw === "/tools-preview/data-bundles-sw" && route.dataBundlesRouteConfig(true).sw === "/data-bundles-sw" &&
    route.DATA_BUNDLES_SW === route.dataBundlesRouteConfig(route.DATA_BUNDLES_LAUNCHED).sw && !/\.js$/.test(route.DATA_BUNDLES_SW) &&
    /register\(DATA_BUNDLES_SW, \{ scope \}\)/.test(shared) && !/sw-data-bundles\.js"/.test(shared));
  check("offline H1: the old address /sw-data-bundles.js is still recognised (kill switch, clean-up), and the worker sits at or above its scope",
    route.DATA_BUNDLES_SW_URLS.includes("/sw-data-bundles.js") && route.DATA_BUNDLES_SW_URLS.includes(route.DATA_BUNDLES_SW_PREVIEW) && route.DATA_BUNDLES_SW_URLS.includes(route.DATA_BUNDLES_SW_LAUNCH) &&
    [false, true].every((l) => { const c = route.dataBundlesRouteConfig(l); return (c.base + "/").startsWith(c.sw.slice(0, c.sw.lastIndexOf("/") + 1)); }));
  check("offline H1: built files are recognised under /assets/ and the preview's /pv-assets/",
    sw.includes("const HASHED = /^\\/(?:pv-)?assets\\/") && /"\/assets\/", "\/pv-assets\/"/.test(shared));
  // M1: updates keep the saved copy, and the page re-sends its list to the new worker.
  check("offline M1: on activate the new worker copies the old build's pages, prices and built files, then deletes the old caches",
    /async function adopt\(fromName, toName\)/.test(sw) && /await adopt\(name, PAGES\)/.test(sw) && /await adopt\(name, PRICES\)/.test(sw) && /await adopt\(name, ASSETS\)/.test(sw) &&
    sw.indexOf("await adopt(name, PAGES)") < sw.indexOf("await caches.delete(name);"));
  check("offline M1: the page re-posts tt-db-save when a new worker takes over (controllerchange), and stops listening on unmount",
    /sw\.addEventListener\("controllerchange", save\)/.test(shared) && /sw\.removeEventListener\("controllerchange", save\)/.test(shared) && /type: "tt-db-save", urls: offlineUrls\(\)/.test(shared));
  check("offline M1: a saved page is replaced on every save (a copy moved over from an older build never sticks)",
    /fetch\(url\.href, \{ credentials: 'same-origin', cache: 'no-cache' \}\)/.test(sw) && !/if \(!\(await c\.match\(pageKey\(url\)/.test(sw));
  // L1 (launch): clean-up; never another worker.
  check("launch L1: registrations of this worker at another scope are removed; other workers are never touched",
    /if \(isOurWorker\(r\) && new URL\(r\.scope\)\.pathname !== scope\) await r\.unregister\(\);/.test(shared) && /DATA_BUNDLES_SW_URLS\.some\(\(u\) => new URL\(w\.scriptURL\)\.pathname === u\)/.test(shared) &&
    /for \(const r of await sw\.getRegistrations\(\)\) if \(isOurWorker\(r\)\) await r\.unregister\(\);/.test(shared));
  check("launch L1: an opaque redirect (an old address nginx moves) passes through the worker untouched", /if \(net\.type === 'opaqueredirect'\) return net;/.test(sw));
  // L2: 8 s, and a late answer refreshes the page.
  check("freshness L2: the prices limit is 8 s; the page waits longer (10 s); a late answer is saved and the page told (tt-db-prices-fresh), which re-checks",
    /const PRICES_TIMEOUT_MS = 8000;/.test(sw) && /export const TIMEOUT_MS = 10000;/.test(hook) && /await tellPages\('tt-db-prices-fresh'\)/.test(sw) &&
    /PRICES_FRESH_MESSAGE = "tt-db-prices-fresh"/.test(hook) && /if \(e\.data\?\.type === PRICES_FRESH_MESSAGE\) \{ last = Date\.now\(\); run\(true\); \}/.test(hook) && /sw\?\.addEventListener\("message", onWorker\)/.test(hook));
  // L3: only JSON that parses is saved as prices.
  check("freshness L3: the prices copy is saved only when it is JSON that parses (on fetch and on tt-db-save)",
    /async function isPricesJson\(response\)/.test(sw) && /if \(cacheName === PRICES && !\(await isPricesJson\(response\)\)\) return false;/.test(sw) && /if \(r\.ok && \(await isPricesJson\(r\)\)\)/.test(sw));
  // L4: every network page and this build's route files are saved on one visit.
  check("freshness L4: one visit saves every data bundle page and this build's route files (stamped at build time)",
    JSON.stringify(sh.dataBundlePagePaths()) === JSON.stringify([route.DATA_BUNDLES_BASE + "/ghana", ...["at", "mtn", "telecel"].map((n) => route.DATA_BUNDLES_BASE + "/ghana/" + n)]) &&
    /\.\.\.dataBundlePagePaths\(\)/.test(shared) && sw.includes("const ROUTE_ASSETS = ['__ROUTE_ASSETS__']") && sw.includes("for (const u of [...d.urls, ...ROUTE_ASSETS])") &&
    vite.includes(`.replace("['__ROUTE_ASSETS__']", JSON.stringify(routeAssets))`) && vite.includes("no data bundle route files found in the build"));
  {
    const { dataBundlesRouteAssets } = await import("../vite.config");
    const fake: Record<string, any> = {
      "pv-assets/index-AAAAAAAA.js": { type: "chunk", fileName: "pv-assets/index-AAAAAAAA.js", moduleIds: ["/x/src/main.tsx"], imports: [] },
      "pv-assets/DataBundlesNetwork-BBBBBBBB.js": { type: "chunk", fileName: "pv-assets/DataBundlesNetwork-BBBBBBBB.js", moduleIds: ["C:\\x\\src\\pages\\data-bundles\\DataBundlesNetwork.tsx"], imports: ["pv-assets/shared-CCCCCCCC.js"], viteMetadata: { importedCss: new Set(["pv-assets/net-DDDDDDDD.css"]) } },
      "pv-assets/shared-CCCCCCCC.js": { type: "chunk", fileName: "pv-assets/shared-CCCCCCCC.js", moduleIds: ["/x/src/components/data-bundles/shared.tsx"], imports: ["pv-assets/index-AAAAAAAA.js"] },
      "pv-assets/Other-EEEEEEEE.js": { type: "chunk", fileName: "pv-assets/Other-EEEEEEEE.js", moduleIds: ["/x/src/pages/Other.tsx"], imports: [] },
      "pv-assets/net-DDDDDDDD.css": { type: "asset", fileName: "pv-assets/net-DDDDDDDD.css" },
    };
    const got = dataBundlesRouteAssets(fake, "/");
    check("freshness L4: the route file list = the data bundle page chunks, what they import (recursively) and their CSS; nothing else",
      JSON.stringify(got) === JSON.stringify(["/pv-assets/DataBundlesNetwork-BBBBBBBB.js", "/pv-assets/index-AAAAAAAA.js", "/pv-assets/net-DDDDDDDD.css", "/pv-assets/shared-CCCCCCCC.js"]), got.join(" "));
  }
  // L1 (freshness): a saved copy over a day old warns too.
  const meta = src("src/components/data-bundles/meta.tsx");
  const savedAt = meta.indexOf('data-source="saved"');
  check("freshness L1: 'Saved prices from …' over a day old also shows the stale notice",
    savedAt > 0 && /\{stale && <StaleNotice \/>\}/.test(meta.slice(savedAt, meta.indexOf("return (", savedAt + 10))));
  // L13: /sw.js is a stub that removes itself and only its own caches.
  const old = src("public/sw.js");
  check("offline L13: public/sw.js deletes only its own caches (never tt-db-*), unregisters itself, and answers no request",
    old.includes("const OWN_CACHES = ['techtrendi-v1', 'techtrendi-static-v1', 'techtrendi-dynamic-v1'];") && old.includes("if (OWN_CACHES.includes(name)) await caches.delete(name);") &&
    old.includes("self.registration.unregister()") && !old.includes("addEventListener('fetch'"));

  // Site guard (M2, M3, L6-L10).
  const g = (d: any) => schema.compareToBaseline(d, doc);
  const tel = doc.bundles.filter((b) => b.network === "telecel");
  const spare = (list: Bundle[], k: number) => list.filter((b) => list.filter((x) => x.family === b.family).length > k);
  {
    const gone = new Set(spare(tel, 1).slice(0, 16).map((b) => b.name));
    const d = clone(doc) as any; d.bundles = d.bundles.filter((b: Bundle) => !(b.network === "telecel" && gone.has(b.name)));
    check(`guard M2: 16 of ${tel.length} Telecel bundles gone, unlisted -> rejected`, gone.size === 16 && g(d).errors.some((e) => e.includes(`network telecel: 16 of ${tel.length} bundles gone without being listed in retiredBundles`)), g(d).errors.join("; "));
  }
  {
    const one = spare(tel, 1)[0];
    const d = clone(doc) as any; d.bundles = d.bundles.filter((b: Bundle) => !(b.network === "telecel" && b.name === one.name));
    check(`guard M2: one Telecel bundle gone ('${one.name}') -> accepted`, g(d).ok, g(d).errors.join("; "));
    const three = spare(tel, 3).slice(0, 3).map((b) => b.name);
    const d3 = clone(doc) as any; d3.bundles = d3.bundles.filter((b: Bundle) => !(b.network === "telecel" && three.includes(b.name)));
    const before = g(d3).ok;
    d3.retiredBundles = three.map((name) => ({ network: "telecel", name }));
    check("guard M2: three gone unlisted -> rejected (more than 2); listed in retiredBundles -> accepted", three.length === 3 && !before && g(d3).ok, g(d3).errors.join("; "));
  }
  {
    const at = doc.bundles.filter((b) => b.network === "at");
    const gone = spare(at, 2).slice(0, 2).map((b) => b.name);
    const d = clone(doc) as any; d.bundles = d.bundles.filter((b: Bundle) => !(b.network === "at" && gone.includes(b.name)));
    check(`guard M2: two of ${at.length} AT bundles gone (under 10%) -> accepted`, gone.length === 2 && g(d).ok, g(d).errors.join("; "));
  }
  {
    const d = clone(doc) as any; d.bundles.push({ ...clone(tel[0]), name: "Brand new 9GB", price: 99 });
    const rejected = g(d).errors.some((e) => /new bundles not marked pending: telecel Brand new 9GB/.test(e));
    d.bundles[d.bundles.length - 1].pending = true;
    check("guard L10: a bundle the baseline does not know, not pending -> rejected; pending -> accepted", rejected && g(d).ok, g(d).errors.join("; "));
  }
  {
    const u = doc.bundles.find((b) => b.unconfirmed === true)!;
    const d = clone(doc) as any; const x = d.bundles.find((b: Bundle) => b.network === u.network && b.name === u.name); delete x.unconfirmed; delete x.asOf;
    const rejected = g(d).errors.some((e) => /no longer unconfirmed without an acknowledgement in confirmedBundles/.test(e));
    d.confirmedBundles = [{ network: u.network, name: u.name, was: u.asOf }];
    check(`guard L6: '${u.name}' losing its unconfirmed mark -> rejected; with confirmedBundles -> accepted`, rejected && g(d).ok, g(d).errors.join("; "));
  }
  {
    const c = doc.bundles.find((b) => typeof b.ussd === "string" && b.network === "mtn")!;
    const d = clone(doc) as any; const x = d.bundles.find((b: Bundle) => b.network === c.network && b.name === c.name); x.ussd = "*999#";
    const rejected = g(d).errors.some((e) => /-> \*999# without an acknowledgement in acceptedCodes/.test(e));
    d.acceptedCodes = [{ network: c.network, name: c.name, from: c.ussd, to: "*999#" }];
    check(`guard L7: '${c.name}' code ${c.ussd} -> *999# rejected; with acceptedCodes -> accepted`, rejected && g(d).ok, g(d).errors.join("; "));
  }
  {
    const d = clone(doc) as any; d.mtnRates.regular = [...d.mtnRates.regular, { from: 2.5, to: 3.5, ghsPerMb: d.mtnRates.regular[0].ghsPerMb }];
    const v = schema.validateDataset(d);
    check("guard L8: overlapping rate bands are rejected (touching ends and an exact amount inside a range are not overlaps)",
      v.errors.some((e) => /mtnRates\.regular: bands .* overlap/.test(e)) && schema.overlapErrors(doc.mtnRates!.regular as any, "x").length === 0 &&
      schema.overlapErrors([{ from: 3, to: 5, ghsPerMb: 1 }, { from: 5, to: 9, ghsPerMb: 1 }, { exactly: 4, ghsPerMb: 1 }] as any, "x").length === 0 &&
      schema.overlapErrors([{ exactly: 4, ghsPerMb: 1 }, { exactly: 4, ghsPerMb: 2 }] as any, "x").length === 1, v.errors.join("; "));
  }
  {
    const d = clone(doc) as any; d.bundles[0] = { ...d.bundles[0], kind: "router" };
    check("guard L9: kind 'router' (broadband) is no longer accepted", schema.validateDataset(d).errors.some((e) => /unknown kind router/.test(e)));
  }
  // M3: held changes: well formed, and shown as "! Check first · price change being checked".
  {
    const b0 = m.bundles.find((b) => sh.trustOf(b).level === "confirmed")!;
    const d = clone(doc) as any; d.heldChanges = [{ item: `${b0.network}|${b0.name}`, field: "price", old: b0.price, new: b0.price * 2, reason: "moved x2.00, outside 0.67x-1.5x" }];
    const M = createBundleModel(d as BundleDataset);
    const hb = M.bundles.find((b) => b.name === b0.name)!;
    const badge = renderToStaticMarkup(React.createElement(sh.TrustBadge, { b: hb }) as any);
    check(`held M3: a held price keeps the old figure (GH¢${b0.price}) and reads '! Check first · price change being checked'`,
      schema.validateDataset(d).ok && g(d).ok && hb.price === b0.price && hb.held === "price change being checked" && sh.trustOf(hb).level === "check" && badge.includes("! Check first · price change being checked") &&
      sh.trustOf(m.bundles.find((b) => b.name === b0.name)!).level === "confirmed", badge);
    d.heldChanges = [{ item: "x", field: "colour", old: 1, new: 2, reason: "" }];
    check("held M3: a malformed heldChanges list is rejected", !schema.validateDataset(d).ok);
  }
}

// ------------------------------------------------------------------ launch rehearsal (20 Oct 2026)
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const src = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const route = await import("../src/data/dataBundlesRoute");
  const tools = await import("../src/data/tools");
  const html = src("index.html");
  const vm = await import("node:vm");

  // H1: the inline theme script, run against fake pages.
  const m1 = html.match(/<script>\s*(\(function \(\) \{[\s\S]*?techtrendi-theme[\s\S]*?\}\)\(\);)\s*<\/script>/);
  check("theme H1: index.html carries the inline theme script before the AdSense tag, and the AdSense tag is unchanged",
    !!m1 && html.indexOf("techtrendi-theme") < html.indexOf("adsbygoogle.js") &&
    html.includes('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3437377907350211" crossorigin="anonymous"></script>'));
  const runTheme = (path: string, stored: string | null, prefersDark = false, throws = false) => {
    const cls = new Set<string>();
    const win: any = {
      localStorage: { getItem: (k: string) => { if (throws) throw new Error("blocked"); return k === "techtrendi-theme" ? stored : null; } },
      location: { pathname: path },
      matchMedia: (q: string) => ({ matches: prefersDark && /dark/.test(q) }),
    };
    const docu: any = { documentElement: { classList: { add: (c: string) => cls.add(c), remove: (...c: string[]) => c.forEach((x) => cls.delete(x)) } } };
    // The page's own script, in a sandbox that has only this fake window and document.
    vm.runInNewContext(m1![1], { window: win, document: docu });
    return [...cls].join(" ") || "(none)";
  };
  const pages = [false, true].flatMap((l) => { const b = route.dataBundlesRouteConfig(l).base; return Object.entries(route.DATA_BUNDLES_PAGES).flatMap(([c, nets]) => [`${b}/${c}`, ...nets.map((n) => `${b}/${c}/${n}`)]); });
  check(`theme H1: nothing stored -> dark on all ${pages.length} data bundle pages (preview and launch addresses); light pages untouched`,
    pages.every((p) => runTheme(p, null) === "dark") && ["/", "/tools", "/blog/x", "/data-bundles/kenya", "/data-bundles/ghana/xyz"].every((p) => runTheme(p, null) === "(none)"),
    pages.map((p) => `${p}=${runTheme(p, null)}`).join(" "));
  check("theme H1: a stored choice always wins, as in ThemeContext (light/dark/system); storage that throws changes nothing off these pages",
    runTheme("/data-bundles/ghana", "light") === "light" && runTheme("/blog", "dark") === "dark" && runTheme("/data-bundles/ghana/mtn", "system", false) === "light" &&
    runTheme("/data-bundles/ghana/mtn", "system", true) === "dark" && runTheme("/blog", null, false, true) === "(none)" && runTheme("/data-bundles/ghana", null, false, true) === "dark");
  check("theme H1: the same key and page default as ThemeContext (no second flip)", /const STORAGE_KEY = 'techtrendi-theme';/.test(src("src/contexts/ThemeContext.tsx")) &&
    ["DataBundlesDashboard.tsx", "DataBundlesNetwork.tsx"].every((f) => /usePageDefaultTheme\("dark"\);/.test(src("src/pages/data-bundles/" + f))));

  // M1: links only once launched.
  check("launch M1: in preview nothing links to the tool (no Tools card, no index card, no footer link)",
    route.dataBundlesLink(false) === null && tools.dataBundlesTools(false).length === 0 && !tools.allTools.some((t) => /data-bundles/.test(t.href)) === !route.DATA_BUNDLES_LAUNCHED);
  const l = route.dataBundlesLink(true)!;
  const tc = tools.dataBundlesTools(true)[0];
  check("launch M1: once launched the Tools card points at /data-bundles/ghana (Business & Freelancer), the index card and footer use the same link",
    l.href === "/data-bundles/ghana" && tc.href === l.href && tc.categoryId === "business" && tc.tier === "free" &&
    /\.\.\.dataBundlesTools\(\),/.test(src("src/data/tools.ts")) && /const db = dataBundlesLink\(\);/.test(src("src/pages/Tools.tsx")) &&
    /dataBundlesLink\(\); return db \? \[\{ label: db\.footerLabel, href: db\.href \}\] : \[\];/.test(src("src/components/layout/Footer.tsx")));
  check("launch M1: the tool's page is not under /tools/, so the tool-page extras (back link, JSON-LD, comments) never apply", !tc.href.startsWith("/tools/") && /if \(!location\.pathname\.startsWith\("\/tools\/"\)\) return null;/.test(src("src/components/layout/Layout.tsx")));
  check("launch M1 (preview state): the tools index card renders only when dataBundlesLink() gives a link", /return db \? \(\s*<Link to=\{db\.href\} data-testid="tools-data-bundles"/.test(src("src/pages/Tools.tsx")) && /\) : null;/.test(src("src/pages/Tools.tsx")));
  // M2, M5: redirects.
  const rts = src("src/ssg/routes.tsx");
  check("launch M2: the bare base opens Ghana in the router (nginx gives the 301 first); unknown country/network render NotFound",
    /\{ path: DATA_BUNDLES_ROUTE, element: <Navigate to=\{`\/\$\{DATA_BUNDLES_ROUTE\}\/ghana`\} replace \/> \}/.test(rts) &&
    /if \(!data\) return <NotFound \/>;/.test(src("src/pages/data-bundles/DataBundlesDashboard.tsx")) && /if \(!data \|\| !data\.model\.networkInfo\(network\)\) return <NotFound \/>;/.test(src("src/pages/data-bundles/DataBundlesNetwork.tsx")));
  const red = route.dataBundlesRouteConfig(true).redirects.map((r) => `${r.from}>${r.to}`);
  check("launch M5: launch redirects cover the preview with and without the slash, and the bare launch base", route.dataBundlesRouteConfig(false).redirects.length === 0 &&
    ["/tools-preview/data-bundles/>/data-bundles/", "/tools-preview/data-bundles>/data-bundles", "/data-bundles>/data-bundles/ghana", "/data-bundles/>/data-bundles/ghana"].every((x) => red.includes(x)), red.join(" "));
  // L3: structured data.
  const crumbs = route.dataBundlesCrumbs({ id: "ghana", name: "Ghana" }, { id: "mtn", name: "MTN" }, "/data-bundles");
  check("launch L3: breadcrumbs Home › Tools › Data bundles › Ghana › MTN", crumbs.map((c) => c.name).join(" › ") === "Home › Tools › Data bundles › Ghana › MTN" &&
    crumbs.map((c) => c.path).join(" ") === "/ /tools /data-bundles /data-bundles/ghana /data-bundles/ghana/mtn");
  const deals = m.networkTopDeals("mtn");
  check(`launch L3: a network page's ItemList is its top deal of each type (${deals.length} for MTN), worded from the model`,
    deals.length >= 2 && deals.every((d) => / per GH¢10$/.test(d.text) && d.text.includes(" → ") && d.bundle.network === "mtn") && deals[0].text.startsWith("All-day data: MTN"), deals.map((d) => d.text).join(" | "));
  const net = src("src/pages/data-bundles/DataBundlesNetwork.tsx"), seo = src("src/components/seo/SEOHead.tsx");
  check("launch L3: network pages emit WebPage + ItemList + BreadcrumbList; the comparison page ItemList + BreadcrumbList (all in the static HTML via <Head>)",
    /\n\s*webPage\n/.test(net) && /itemList=\{\{ name: `Best \$\{info\.name\} data bundles by type`, items: model\.networkTopDeals\(network\)\.map\(\(d\) => d\.text\) \}\}/.test(net) &&
    /breadcrumbs=\{dataBundlesCrumbs\(data\.country, \{ id: network, name: info\.name \}\)\}/.test(net) && /breadcrumbs=\{dataBundlesCrumbs\(data\.country\)\}/.test(src("src/pages/data-bundles/DataBundlesDashboard.tsx")) &&
    /'@type': 'WebPage', name: baseTitle, description, url: fullUrl/.test(seo) && /JSON\.stringify\(webPageSchema\)/.test(seo));
  // L4: sitemap.
  const sm = src("scripts/generate-sitemap.mjs");
  check("launch L4: sitemap lists the data bundle pages daily at 0.8, never the preview; the article floors are unchanged",
    /if \(path === "data-bundles" \|\| path\.startsWith\("data-bundles\/"\)\) return \{ priority: "0\.8", freq: "daily" \};/.test(sm) &&
    /const EXCLUDE_PREFIX = \[[^\]]*"tools-preview"\]/.test(sm) && /const FLOORS = \{ blog: 100, news: 200 \};/.test(sm));
  // L7 and the runbook.
  check("launch L7: no stale 'Preview-only for now' comments", !/Preview-only for now/.test(src("src/pages/data-bundles/DataBundlesDashboard.tsx") + net) && !/until launch\./.test(rts));
  const rb = src("DOCS/DATA_BUNDLES_LAUNCH.md");
  check("launch runbook: ordered steps with backup, nginx -t, reload, curl checks and rollback; the nginx block copies the article block",
    ["## 1. Switch on", "## 2. Deploy", "## 3. nginx", "## 4. Check", "## 5. Search Console", "## Rollback"].every((h, i, a) => rb.includes(h) && (i === 0 || rb.indexOf(a[i - 1]) < rb.indexOf(h))) &&
    rb.includes("location ^~ /data-bundles/ {") && rb.includes("rewrite ^/(.*)$ /og-meta.php?path=$1&$args last;") && rb.includes("try_files $uri $uri.html $uri/index.html =404;") &&
    rb.includes("location ^~ /tools-preview/data-bundles {\n        rewrite ^/tools-preview/data-bundles(/.*)?$ /data-bundles$1 permanent;") &&
    rb.includes("location = /data-bundles  { return 301 /data-bundles/ghana; }") && rb.includes("nginx -t && systemctl reload nginx") && /cp -p "\$B" \/etc\/nginx/.test(rb) && !/add_header/.test(rb.replace(/No add_header here/g, "")));
  // H2: the runbook's worker address is the launch one.
  check("launch H2: the runbook checks /data-bundles-sw (application/javascript, no-cache), the address the launched pages register",
    rb.includes("c /data-bundles-sw") && route.dataBundlesRouteConfig(true).sw === "/data-bundles-sw");
}

// ------------------------------------------------------------------ browser/UI audit (20 Oct 2026)
{
  const src = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const sh = src("src/components/data-bundles/shared.tsx");
  const net = src("src/pages/data-bundles/DataBundlesNetwork.tsx");
  const dash = src("src/pages/data-bundles/DataBundlesDashboard.tsx");
  const bf = src("src/components/data-bundles/BudgetFinder.tsx");
  const ck = src("src/components/ui/cookie-consent.tsx");
  const url = await import("../src/lib/dataBundlesUrl");
  // M1, M2: the query is read at the moment of the tap.
  check("UI M1: network links carry the CURRENT query (window.location.search at tap time), never the router's stale search",
    sh.includes("export const withCurrentQuery = (path: string) => `${path}${typeof window !== \"undefined\" ? window.location.search : \"\"}`;") &&
    sh.includes("navigate(withCurrentQuery(to));") && !/useLocation\(\)/.test(net) && !/\$\{search\}/.test(net) &&
    (net.match(/<QueryLink /g) ?? []).length === 4 && !/<Link /.test(net));
  check("UI M2: dashboard -> network links (cards, panels' 'See all … bundles') use QueryLink",
    /<QueryLink\n\s*to=\{`\$\{basePath\}\/\$\{n\}`\}/.test(src("src/components/data-bundles/NetworkPanels.tsx")) && /<QueryLink\r?\n\s*to=\{`\$\{basePath\}\/\$\{n\}`\}/.test(src("src/components/data-bundles/NetworkCards.tsx")));
  // L1: empty amount.
  check("UI L1: an empty amount shows no 'GH¢0' heading and removes the amount from the URL",
    bf.includes("{!noAmount && <h3") && bf.includes("else clearQueryKeys([\"amount\"]);") && typeof url.clearQueryKeys === "function");
  // M3, M4: fold and banner.
  check("UI M3: short-phone styles apply up to 820 px tall; the meta row moves below the finder there (nothing removed)",
    !/max-height:760px/.test(net + dash + bf) && [net, dash].every((p) => p.includes('[@media(max-height:820px)_and_(max-width:639px)]:order-last') && p.includes('<div className="flex flex-col">')));
  check("UI M3: on data bundle pages the cookie bar is one row (44 px buttons, 5 px padding = 55 px with its border) on phones",
    ck.includes("const COMPACT_PATH = /^\\/(?:tools-preview\\/)?data-bundles(?:\\/|$)/;") && ck.includes('data-compact="1"') && ck.includes("py-[5px]") && ck.includes("h-11 px-3 text-xs sm:h-8"));
  check("UI M4: while the cookie bar shows, html scroll-padding-bottom = its height (site-wide), put back when it goes",
    ck.includes("root.style.scrollPaddingBottom = `${el.offsetHeight}px`;") && ck.includes("root.style.scrollPaddingBottom = prev;") && ck.includes("new ResizeObserver(set)"));
  check("UI contrast: Accept is white on blue-700, 'Learn more' blue-700 / blue-300 (both at least 4.5:1 in both themes); consent logic unchanged",
    ck.includes("const acceptCls = 'bg-blue-700 text-white hover:bg-blue-800';") && (ck.match(/text-blue-700/g) ?? []).length >= 2 && ck.includes("updateConsent(prefs.analytics, prefs.advertising);"));
  // L2, L3, L5.
  check("UI L2: RollText under reduced motion is plain text (no AnimatePresence)", /const reduce = useReducedMotion\(\);\n\s*if \(reduce\) return <span[^\n]*>\{text\}<\/span>;/.test(sh));
  check("UI L3: slider thumbs have a 44 px hit area; the 'AT' switch is at least 44 px wide",
    src("src/components/data-bundles/LabelledSlider.tsx").includes("before:absolute before:-inset-3 before:rounded-full before:content-['']") &&
    src("src/components/data-bundles/MonthlyPlanner.tsx").includes("before:absolute before:-inset-[7px] before:rounded-full before:content-['']") && net.includes("inline-flex min-h-11 min-w-11 items-center justify-center rounded-full"));
  check("UI L5: an in-app move between data bundle pages focuses the new h1 (tabIndex -1, no outline, no scroll), not on first load",
    sh.includes("if (lastDataBundlePath !== null && lastDataBundlePath !== path)") && sh.includes("ref.current?.focus({ preventScroll: true })") &&
    [net, dash].every((p) => p.includes('<h1 ref={titleRef} tabIndex={-1} data-testid="page-title" className="focus:outline-none')));
  // Codes in prose.
  const all = JSON.stringify(doc);
  const codes = ["*506#", "*567#", "*141#", "*124#", "*126#", "*554#", "*504#"].filter((c) => all.includes(c));
  check(`UI codes: the codes only written in prose (${codes.join(" ")}) get Dial + Copy chips (CodesIn) where those texts show`,
    codes.length === 7 && sh.includes("export function CodesIn(") &&
    ["src/components/data-bundles/Faq.tsx", "src/components/data-bundles/BundleTable.tsx", "src/components/data-bundles/MtnCalculators.tsx", "src/components/data-bundles/Advice.tsx", "src/pages/data-bundles/DataBundlesNetwork.tsx"].every((f) => /<CodesIn texts=/.test(src(f))));
  // ussd extraction covers every one of them
  const { dialCodes } = await import("../src/components/data-bundles/shared");
  check("UI codes: the chip extractor finds each code in its sentence", codes.every((c) => dialCodes(`dial ${c} now`).includes(c)));
}

// ------------------------------------------------------------------ plain-language and readability round (22 Oct 2026)
{
  const React = await import("react");
  (globalThis as any).React = React;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StaticRouter } = await import("react-router-dom/server");
  const src = (p: string) => readFileSync(join(ROOT, p), "utf8");
  const sh = await import("../src/components/data-bundles/shared");
  const html = (el: unknown) => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/x" }, el as any) as any);
  const txt = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ");
  const { BundleTable } = await import("../src/components/data-bundles/BundleTable");
  const { Leaderboards } = await import("../src/components/data-bundles/Leaderboards");
  const { NetworkPanels, NetworkBest } = await import("../src/components/data-bundles/NetworkPanels");
  const { FaceOff } = await import("../src/components/data-bundles/FaceOff");
  const { BudgetFinder } = await import("../src/components/data-bundles/BudgetFinder");

  // 1. Words.
  const worked = m.all.find((b) => b.computed && sh.trustOf(b).level === "worked")!;
  check("words: '≈ Price we calculated' (never 'Worked out'); ✓ Confirmed and ! Check first unchanged",
    txt(html(React.createElement(sh.TrustBadge, { b: worked }))).includes("≈ Price we calculated") && /"✓ Confirmed"/.test(src("src/components/data-bundles/shared.tsx")) && /! Check first/.test(src("src/components/data-bundles/shared.tsx")));
  const kok = m.bundles.find((b) => b.name === "Kokrokoo Bundle")!;
  check("words: a disputed expiry reads 'Expiry not clear – check with MTN'; price and volume disputes the same way",
    m.disputeText(kok) === "Expiry not clear – check with MTN" && m.disputeText({ network: "telecel", otherSource: { contradicts: "price" } } as any) === "Price not clear – check with Telecel" &&
    m.disputeText({ network: "mtn", otherSource: { contradicts: "volume" } } as any) === "Data amount not clear – check with MTN" && m.disputeText({ network: "at" } as any) === null);
  // 2. Mixed amounts: price and data first, value under it.
  const top = m.leaderboardRows("allday").ranked[0].bundle;
  check("price lead: 'GH¢400 bundle' for a bundle, 'Pay exactly GH¢399' for a pay-any-amount row",
    m.priceLead(top) === "GH¢400 bundle" && m.all.filter((b) => b.computed).every((b) => m.priceLead(b) === m.payText(b)));
  const secs: [string, string][] = [
    ["face-off", html(React.createElement(FaceOff, { model: m }))],
    ["network panels", html(React.createElement(NetworkPanels, { model: m, basePath: "/x" }))],
    ["MTN best deals", html(React.createElement(NetworkBest, { model: m, network: "mtn" }))],
    ["winners board", html(React.createElement(Leaderboards, { model: m }))],
    ["MTN list", html(React.createElement(BundleTable, { model: m, network: "mtn", family: "all", onFamily: () => {} }))],
  ];
  for (const [name, h] of secs) {
    const t = txt(h);
    check(`any price (${name}): the heading says '(any price)'; no 'Every GH¢10', no 'GH¢10 gets/buys'; 'Value: … per GH¢10' only after a price → data lead`,
      /\(any price\)/.test(t) && !/Every GH¢10|GH¢10 (gets|buys)/.test(t) && /Value: [\d.,]+ (GB|MB) per GH¢10/.test(t) && t.indexOf("→") > -1 && t.indexOf("→") < t.indexOf("Value:"), t.slice(0, 160));
  }
  const lbT = txt(secs[3][1]);
  check("winners board: the first row reads 'GH¢400 bundle → 263.38GB' then 'Value: 6.58 GB per GH¢10' (price and data first)",
    /GH¢400 bundle → (gives )?263\.38GB 30 days Value: 6\.58 GB per GH¢10/.test(lbT.replace(/ gives /g, " ")), lbT.slice(lbT.indexOf("263.38GB Monthly"), lbT.indexOf("263.38GB Monthly") + 140));
  const fo = secs[0][1];
  check("face-off: every bar is labelled with its bundle's price ('GH¢400 bundle'), and has a spoken label with price and value",
    (fo.match(/data-testid="faceoff-bar-label"/g) ?? []).length === 3 && fo.includes(">GH¢400 bundle</p>") && /role="img" aria-label="GH¢400 bundle: value 6\.58 GB per GH¢10"/.test(fo));
  // GH¢/GB only under More info.
  for (const [name, h] of secs.slice(1)) {
    const shown = h.replace(/<details[\s\S]*?<\/details>/g, "");
    check(`price per GB (${name}): only inside More info, never on the card`, !/GH¢[\d.,]+\/GB|Price per GB/.test(txt(shown)) && /Price per GB: GH¢[\d.,]+/.test(txt(h)));
  }
  // Finder.
  const fin = html(React.createElement(BudgetFinder, { model: m }));
  const finT = txt(fin);
  check("finder: no '(GH¢0.01 change)' on the pay line; the change and the reason are under More info; Dial/Copy open on every card; 'if you buy N times'; 'Or buy once'",
    !/\(GH¢[\d.,]+ change\)/.test(finT) && !/data-testid="bf-buy-fold"/.test(fin) && /if you buy \d times/.test(finT) && !/in \d buys/.test(finT) &&
    src("src/components/data-bundles/BudgetFinder.tsx").includes('{change && <p data-testid="bf-change">You keep {change} change.</p>}') &&
    src("src/components/data-bundles/BudgetFinder.tsx").includes('{change && changeMaterial && <p className="text-[15px] text-foreground/85 lg:text-base" data-testid="bf-change-tip">You keep {change}.</p>}'));
  {
    const at999 = m.finderPicks(9.99).concat(m.finderPicks(10));
    check("finder: a material gap (GH¢1 or more left) gets the one-line tip; a GH¢0.01 gap never does", src("src/components/data-bundles/BudgetFinder.tsx").includes("const changeMaterial = (combo ? budget - combo.total : b ? budget - b.price : 0) >= 1 - 1e-9;") && at999.length > 0);
  }
  // 3. Readability.
  const shS = src("src/components/data-bundles/shared.tsx");
  {
    const all8 = ["shared", "BudgetFinder", "BundleTable", "Leaderboards", "NetworkPanels", "FaceOff", "MonthlyPlanner", "MtnCalculators"].map((f) => src(`src/components/data-bundles/${f}.tsx`)).join("\n");
    check("readability: secondary text (badges, how-to-buy, value lines, lasts) is 15 px on phones and 16 px from 1024 px, never stepped down on desktop; foreground/85, not muted grey; face-off labels 14 px+",
      !/px-2 py-0\.5 text-\[11px\]/.test(all8) && !/text-\[15px\][^"`\n]*\bsm:text-(xs|sm)\b/.test(all8) && (all8.match(/text-\[15px\][^"`\n]*\blg:text-base\b/g) ?? []).length >= 30 &&
      shS.includes('className="text-[15px] font-medium text-foreground lg:text-base"><span className="text-foreground/80">How to buy: </span>') && shS.includes('<p className="mt-1.5 text-[15px] text-foreground/90 lg:text-base" data-testid="value-line">') &&
      !/text-\[1[23]px\]/.test(src("src/components/data-bundles/FaceOff.tsx")));
    check("value: the coloured bar is the main signal (taller, above the figure); 'Value: X per GH¢10' is the line under it; one 'Longer bar = more data for your money' per section",
      /<ValueBar share=\{share\} color=\{info\.color\} className="mt-1 h-3\.5" \/>\s*<p className="mt-1\.5/.test(shS) &&
      /<ValueBar share=\{share\} color=\{info\.color\} className="mt-1\.5 h-3\.5" delay=\{delay\} \/>\}\s*\{model\.valueText\(b\) && <p/.test(src("src/components/data-bundles/Leaderboards.tsx")) &&
      (src("src/components/data-bundles/NetworkPanels.tsx").match(/Longer bar = more data for your money\./g) ?? []).length === 2 && (src("src/components/data-bundles/Leaderboards.tsx").match(/Longer bar = more data for your money\./g) ?? []).length === 1);
  }
  check("readability: A+ applies before the first paint (inline script + static CSS in index.html, same zoom as largeTextCss), so the page does not jump",
    src("index.html").includes('html[data-db-text="large"] main#main-content { zoom: 1.125; }') && sh.largeTextCss().includes(`zoom: ${sh.LARGE_TEXT_ZOOM};`) && sh.LARGE_TEXT_ZOOM === 1.125 &&
    sh.largeTextCss().split("\n").slice(1).every((rule) => src("index.html").includes(rule.replace(/\$\{[^}]*\}/g, ""))) &&
    src("index.html").includes('if (db && big === "large") document.documentElement.setAttribute("data-db-text", "large");'));
  // 6. Freshness: an old worker or old HTML can't pin stale prices.
  const sw = src("public/sw-data-bundles.js");
  check("freshness: pages and the prices file are network first (a saved copy only when the network fails or is too slow, and then marked 'Saved prices'); prices are fetched no-cache",
    /networkFirst\(PAGES, request, 0/.test(sw) && /networkFirst\(PRICES, request, PRICES_TIMEOUT_MS/.test(sw) && /cache: "no-cache"/.test(src("src/hooks/useBundleData.ts")) && /headers\.set\('X-TT-Saved-Copy', '1'\)/.test(sw));
}

function unitsLineText(mm: BundleModel): string {
  const f = mm.sharedMbPerGb();
  return f !== null ? `1 GB = ${f.toLocaleString("en-GB")} MB` : "";
}

console.log(`\n${passes} passed, ${failures} failed (planner sweep ${ms} ms) [dataset ${doc.capturedAt}, ${NEW_SCHEMA ? "new schema" : "old schema"}]`);
process.exit(failures ? 1 : 0);
