// Schema checks for a data bundle dataset document (the schema of
// src/data/ghanaDataBundles.json and techtrendi.data_bundle_snapshots.data).
//
// Plain JavaScript on purpose: the same checks run in the browser (via
// src/hooks/useBundleData.ts) and in the prebuild step
// (scripts/fetch-data-bundles.mjs, plain Node). A snapshot that fails any
// check is ignored and the committed/bundled data is used instead.
//
// networks.*.mbPerGb is REQUIRED: every GB figure is MB / that factor, and
// the site never assumes one (TechTrendi counts 1 GB as 1,024 MB for every
// network). A dataset without it is rejected, and the bundled data is used.
// Other newer fields (units, telecelRates, atRates, and the bundle flags
// pending / conditional / conflict / otherSource / altUssd) are optional, so
// older datasets still pass; when present they must be well formed.

// Mobile data only: broadband ("router") bundles are not an accepted kind (freshness audit L9).
const KINDS = ["anytime", "noexpiry", "night", "hourly", "morning", "family", "combo", "social", "video", "unlimited", "weekend", "restricted"];

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string" && v.length > 0;
const isPos = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
/** A rate band the data marks as not published / not confirmed (no rate needed). */
const isUnpublishedBand = (b) => isObj(b) && (b.unconfirmed === true || b.notPublished === true || b.published === false);

/** Two ranges of one rate table may touch (MTN: GH¢3–5 and GH¢5–99.9) but never overlap, and an
 *  exact amount may not be listed twice; an exact amount inside a range is the tariff's special
 *  price for that amount (it wins), not an overlap. The checker's validate.overlap_errors. */
export function overlapErrors(table, label) {
  const out = [];
  if (!Array.isArray(table)) return out;
  const rng = table.filter((b) => isObj(b) && b.exactly === undefined && isNum(b.from ?? b.min) && isNum(b.to ?? b.max))
    .map((b) => [b.from ?? b.min, b.to ?? b.max]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  for (let i = 1; i < rng.length; i++) if (rng[i][0] < rng[i - 1][1] - 1e-9) out.push(`${label}: bands ${rng[i - 1][0]}–${rng[i - 1][1]} and ${rng[i][0]}–${rng[i][1]} overlap`);
  const ex = table.filter((b) => isObj(b) && isNum(b.exactly)).map((b) => b.exactly);
  for (const a of new Set(ex)) if (ex.filter((x) => x === a).length > 1) out.push(`${label}: the exact amount ${a} is listed more than once`);
  return out;
}

function checkTable(table, label, errors) {
  if (!Array.isArray(table) || table.length === 0) { errors.push(`${label}: missing rate table`); return; }
  errors.push(...overlapErrors(table, label));
  if (!table.some((b) => isObj(b) && !isUnpublishedBand(b) && isPos(b.ghsPerMb))) { errors.push(`${label}: no published rate`); return; }
  table.forEach((b, i) => {
    if (!isObj(b)) { errors.push(`${label}[${i}]: not an object`); return; }
    if (b.ghsPerMb !== undefined && b.ghsPerMb !== null && !isPos(b.ghsPerMb)) { errors.push(`${label}[${i}]: bad ghsPerMb`); return; }
    if (!isUnpublishedBand(b) && !isPos(b.ghsPerMb)) { errors.push(`${label}[${i}]: bad ghsPerMb`); return; }
    if (b.exactly !== undefined) { if (!isPos(b.exactly)) errors.push(`${label}[${i}]: bad exactly`); return; }
    if (!isNum(b.from) || !isNum(b.to) || b.to < b.from) errors.push(`${label}[${i}]: bad from/to`);
  });
}

/** Telecel Flexi: an array of bands, or an object holding one in
 *  bands / table / rates / data. Each band needs a spend range (from/to or
 *  exactly) and at least one option: noExpiry {ghsPerMb} or expiry {ghsPerMb, days}. */
function checkFlexi(flexi, errors) {
  const list = Array.isArray(flexi) ? flexi : isObj(flexi) ? (flexi.bands ?? flexi.table ?? flexi.rates ?? flexi.data) : null;
  if (!Array.isArray(list) || list.length === 0) { errors.push("telecelRates.flexi: no bands"); return; }
  errors.push(...overlapErrors(list, "telecelRates.flexi"));
  list.forEach((b, i) => {
    const where = `telecelRates.flexi[${i}]`;
    if (!isObj(b)) { errors.push(`${where}: not an object`); return; }
    const from = b.from ?? b.min, to = b.to ?? b.max;
    if (b.exactly !== undefined) { if (!isPos(b.exactly)) errors.push(`${where}: bad exactly`); }
    else if (!isNum(from) || !isNum(to) || to < from) errors.push(`${where}: bad from/to`);
    const ne = b.noExpiry ?? b.noexpiry ?? b.nonExpiry;
    const ex = b.expiry ?? b.withExpiry;
    const neRate = isObj(ne) ? ne.ghsPerMb : b.noExpiryPerMb ?? b.noExpiryGhsPerMb;
    const exRate = isObj(ex) ? ex.ghsPerMb : b.expiryPerMb ?? b.expiryGhsPerMb;
    const exDays = isObj(ex) ? ex.days ?? ex.validityDays : b.expiryDays;
    if (neRate === undefined && exRate === undefined && !isUnpublishedBand(b)) errors.push(`${where}: needs a noExpiry or expiry rate`);
    if (neRate !== undefined && !isPos(neRate)) errors.push(`${where}: bad noExpiry rate`);
    if (exRate !== undefined && (!isPos(exRate) || !isPos(exDays))) errors.push(`${where}: expiry needs ghsPerMb and days > 0`);
  });
}

/** @returns {{ ok: boolean, errors: string[] }} */
export function validateDataset(doc) {
  const errors = [];
  if (!isObj(doc)) return { ok: false, errors: ["not an object"] };
  if (!isStr(doc.capturedAt) || Number.isNaN(Date.parse(doc.capturedAt))) errors.push("capturedAt missing or not a date");
  if (doc.checkedAt !== undefined && (!isStr(doc.checkedAt) || Number.isNaN(Date.parse(doc.checkedAt)))) errors.push("checkedAt not a date");
  if (!isStr(doc.verification)) errors.push("verification missing");
  if (doc.units !== undefined && !isStr(doc.units) && !isObj(doc.units)) errors.push("units must be text or an object");
  if (!isObj(doc.networks) || Object.keys(doc.networks).length === 0) errors.push("networks missing");
  else for (const [id, n] of Object.entries(doc.networks)) {
    if (!isObj(n) || !isStr(n.name) || !/^#[0-9a-f]{6}$/i.test(n.color || "") || !/^#[0-9a-f]{3,6}$/i.test(n.ink || "") || !/^https:\/\//.test(n.source || "")) {
      errors.push(`networks.${id}: needs name, #hex color, #hex ink and https source`);
    }
    if (isObj(n) && !(isPos(n.mbPerGb) && n.mbPerGb >= 100 && n.mbPerGb <= 2000)) errors.push(`networks.${id}.mbPerGb is required: the number of MB in one GB`);
  }
  if (!isObj(doc.familyInfo)) errors.push("familyInfo missing");
  if (!isObj(doc.networkFacts)) errors.push("networkFacts missing");
  if (!Array.isArray(doc.bundles) || doc.bundles.length === 0) errors.push("bundles missing");
  else {
    // Every network listed has bundles; no two bundles of a network share a name (the checker's rules).
    if (isObj(doc.networks)) for (const id of Object.keys(doc.networks)) if (!doc.bundles.some((b) => isObj(b) && b.network === id)) errors.push(`network ${id} has no bundles`);
    const seen = new Set();
    for (const b of doc.bundles) if (isObj(b)) { const k = `${b.network}|${b.name}`; if (seen.has(k)) errors.push(`duplicate bundle ${k}`); seen.add(k); }
  }
  if (doc.retiredFamilies !== undefined && !(Array.isArray(doc.retiredFamilies) && doc.retiredFamilies.every((x) => isObj(x) && isStr(x.network) && isStr(x.family)))) errors.push("retiredFamilies must be a list of {network, family}");
  if (doc.resolvedDisputes !== undefined && !(Array.isArray(doc.resolvedDisputes) && doc.resolvedDisputes.every((x) => isObj(x) && isStr(x.network) && isStr(x.item) && isStr(x.was)))) errors.push("resolvedDisputes must be a list of {network, item, was}");
  // Audit 8: moves outside MOVE_RANGE and conditional bundles opened to everyone, each accepted by a human on the checker.
  if (doc.acceptedChanges !== undefined && !(Array.isArray(doc.acceptedChanges) && doc.acceptedChanges.every((x) => isObj(x) && isStr(x.item) && ["price", "mb", "ghsPerMb"].includes(x.field) && isPos(x.from) && isPos(x.to) && (x.at === undefined || x.at === null || isPos(x.at))))) errors.push("acceptedChanges must be a list of {item, field, at?, from, to}");
  // Freshness audit: removals, confirmations and code changes the checker recorded; changes it held back.
  if (doc.retiredBundles !== undefined && !(Array.isArray(doc.retiredBundles) && doc.retiredBundles.every((x) => isObj(x) && isStr(x.network) && isStr(x.name)))) errors.push("retiredBundles must be a list of {network, name}");
  if (doc.confirmedBundles !== undefined && !(Array.isArray(doc.confirmedBundles) && doc.confirmedBundles.every((x) => isObj(x) && isStr(x.network) && isStr(x.name)))) errors.push("confirmedBundles must be a list of {network, name, was}");
  if (doc.acceptedCodes !== undefined && !(Array.isArray(doc.acceptedCodes) && doc.acceptedCodes.every((x) => isObj(x) && isStr(x.network) && isStr(x.name) && "to" in x))) errors.push("acceptedCodes must be a list of {network, name, from, to}");
  if (doc.heldChanges !== undefined && !(Array.isArray(doc.heldChanges) && doc.heldChanges.every((x) => isObj(x) && isStr(x.item) && HELD_FIELDS.includes(x.field) && isStr(x.reason) && "old" in x && "new" in x))) errors.push("heldChanges must be a list of {item, field, at?, old, new, reason}");
  if (doc.liftedConditions !== undefined && !(Array.isArray(doc.liftedConditions) && doc.liftedConditions.every((x) => isObj(x) && isStr(x.network) && isStr(x.name) && isStr(x.was)))) errors.push("liftedConditions must be a list of {network, name, was}");
  if (Array.isArray(doc.bundles)) doc.bundles.forEach((b, i) => {
    const where = `bundles[${i}]`;
    if (!isObj(b)) { errors.push(`${where}: not an object`); return; }
    if (!isObj(doc.networks) || !doc.networks[b.network]) errors.push(`${where}: unknown network ${b.network}`);
    if (!isStr(b.family) || !isStr(b.name)) errors.push(`${where}: family/name missing`);
    if (!isPos(b.price)) errors.push(`${where}: price must be > 0`);
    // mb may be null ONLY for kind "unlimited" or "social", and then a label
    // (the operator's own wording) is required. Every other bundle needs mb > 0.
    if (b.mb === null || b.mb === undefined) {
      if (b.kind !== "unlimited" && b.kind !== "social") errors.push(`${where}: mb must be > 0`);
      else if (!isStr(b.label) || !b.label.trim()) errors.push(`${where}: a bundle without mb needs a label`);
    } else if (!isPos(b.mb)) errors.push(`${where}: mb must be > 0`);
    // Plausible MB per cedi (the checker's MB_PER_CEDI): catches MB/GB slips (x1000, /1024).
    else if (isPos(b.price) && !(b.mb / b.price >= MB_PER_CEDI[0] && b.mb / b.price <= MB_PER_CEDI[1])) errors.push(`${where}: ${(b.mb / b.price).toFixed(1)} MB per cedi is implausible`);
    if (b.window !== undefined && b.window !== null && !isStr(b.window)) errors.push(`${where}: window must be text`);
    if (b.unconfirmed === true && !isStr(b.asOf)) errors.push(`${where}: unconfirmed needs asOf`);
    if (b.label !== undefined && b.label !== null && !isStr(b.label)) errors.push(`${where}: label must be text`);
    if (b.unconfirmed !== undefined && typeof b.unconfirmed !== "boolean") errors.push(`${where}: unconfirmed must be true/false`);
    if (b.asOf !== undefined && b.asOf !== null && !isStr(b.asOf)) errors.push(`${where}: asOf must be text`);
    if (b.channel !== undefined && b.channel !== null && !isStr(b.channel)) errors.push(`${where}: channel must be text`);
    if (!isStr(b.validity)) errors.push(`${where}: validity missing`);
    if (b.days !== null && !(isNum(b.days) && b.days > 0)) errors.push(`${where}: days must be null or > 0`);
    if (!KINDS.includes(b.kind)) errors.push(`${where}: unknown kind ${b.kind}`);
    if (b.ussd !== null && b.ussd !== undefined && typeof b.ussd !== "string") errors.push(`${where}: bad ussd`);
    if (typeof b.source !== "string") errors.push(`${where}: source missing`);
    for (const flag of ["pending", "conditional"]) if (b[flag] !== undefined && typeof b[flag] !== "boolean") errors.push(`${where}: ${flag} must be true/false`);
    if (b.conflict !== undefined && b.conflict !== null && !isObj(b.conflict)) errors.push(`${where}: conflict must be an object`);
    if (b.otherSource !== undefined && b.otherSource !== null && !(isObj(b.otherSource) && isStr(b.otherSource.summary))) errors.push(`${where}: otherSource needs a summary`);
    if (b.altUssd !== undefined && b.altUssd !== null && !(isObj(b.altUssd) && isStr(b.altUssd.code))) errors.push(`${where}: altUssd needs a code`);
    if (b.conditionalReason !== undefined && b.conditionalReason !== null && !isStr(b.conditionalReason)) errors.push(`${where}: conditionalReason must be text`);
  });
  if (isObj(doc.networks) && doc.networks.mtn) {
    const r = doc.mtnRates;
    if (!isObj(r)) errors.push("mtnRates missing");
    else {
      checkTable(r.regular, "mtnRates.regular", errors);
      checkTable(r.midnight, "mtnRates.midnight", errors);
      if (r.pulse !== undefined) {
        if (!isObj(r.pulse) || !isStr(r.pulse.note) || !isStr(r.pulse.ussd)) errors.push("mtnRates.pulse malformed");
        else checkTable(r.pulse.data, "mtnRates.pulse.data", errors);
      }
      if (r.gaps !== undefined) {
        if (!isObj(r.gaps)) errors.push("mtnRates.gaps must be an object");
        else for (const [k, list] of Object.entries(r.gaps)) {
          if (!Array.isArray(list)) { errors.push(`mtnRates.gaps.${k} must be a list`); continue; }
          list.forEach((g, i) => { if (!isObj(g) || !isNum(g.from) || !isNum(g.to) || g.to < g.from) errors.push(`mtnRates.gaps.${k}[${i}]: bad from/to`); });
        }
      }
      if (!isPos(r.social) || !isPos(r.video) || !isPos(r.outOfBundlePerMb)) errors.push("mtnRates social/video/outOfBundlePerMb must be > 0");
      if (!Array.isArray(r.socialRange) || r.socialRange.length !== 2 || !isPos(r.socialRange[0]) || !(r.socialRange[1] > r.socialRange[0])) errors.push("mtnRates.socialRange bad");
      if (!isStr(r.validityNote)) errors.push("mtnRates.validityNote missing");
      // Borrowed data (MTN Xtrabyte): a fact, never a bundle; when present it must be well formed.
      if (r.xtrabyte !== undefined && !(isObj(r.xtrabyte) && r.xtrabyte.kind === "borrowed" && Array.isArray(r.xtrabyte.rows) &&
        r.xtrabyte.rows.every((x) => isObj(x) && isPos(x.price) && isPos(x.mb) && isPos(x.totalDebt)))) errors.push("mtnRates.xtrabyte malformed (borrowed data)");
    }
  }
  if (doc.telecelRates !== undefined) {
    if (!isObj(doc.telecelRates)) errors.push("telecelRates must be an object");
    else if (doc.telecelRates.flexi !== undefined) checkFlexi(doc.telecelRates.flexi, errors);
  }
  if (doc.atRates !== undefined) {
    if (!isObj(doc.atRates)) errors.push("atRates must be an object");
    else if (doc.atRates.outOfBundlePerMb !== undefined && !isPos(doc.atRates.outOfBundlePerMb)) errors.push("atRates.outOfBundlePerMb must be > 0");
  }
  return { ok: errors.length === 0, errors };
}

/** Most a network's bundle count may drop against the baseline (30%). */
export const MAX_NETWORK_DROP = 0.3;
/** More than this many of a network's bundles, or more than MAX_VANISH_SHARE of them, gone against
 *  the baseline and not listed in retiredBundles = a partial page, rejected (the checker's
 *  validate.MAX_VANISH / MAX_VANISH_SHARE; it lists smaller removals in retiredBundles). */
export const MAX_VANISH = 2;
export const MAX_VANISH_SHARE = 0.1;
/** heldChanges fields (the checker's validate.HELD_FIELDS). */
export const HELD_FIELDS = ["price", "mb", "ghsPerMb", "ussd", "unconfirmed"];
/** "network|name" of every bundle a snapshot holds back a change for (heldChanges). */
export const heldItems = (doc) => new Set((isObj(doc) && Array.isArray(doc.heldChanges) ? doc.heldChanges : []).filter((x) => isObj(x) && isStr(x.item) && x.item.includes("|")).map((x) => x.item));
/** Most a price, volume or rate may move at once against the baseline (4x either way, as the checker). */
export const MAX_FACTOR = 4;
/** Audit 8 (M1): a single bundle's price or volume, a rate at any amount of a rate table, a flat
 *  rate or a borrowed row's volume moving outside this range at once is rejected unless the
 *  snapshot's acceptedChanges lists it ({item, field, at?, to}); the checker writes that list only
 *  on a run a human accepted with --accept-structural-change. Same range as validate.MOVE_RANGE. */
export const MOVE_RANGE = [0.67, 1.5];
/** A network's familyInfo, MTN's citedSources or the verification text losing more than this share at once is rejected. */
export const MAX_SHRINK = 0.5;
const outside = (a, b) => isPos(a) && isPos(b) && !(b / a >= MOVE_RANGE[0] && b / a <= MOVE_RANGE[1]);
const near = (a, b) => isNum(a) && isNum(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
/** Is this move ({item, field, at?, to}) listed in the snapshot's acceptedChanges? */
function acknowledged(doc, item, field, at, to) {
  const key = (x) => (isNum(x) ? Math.round(x * 100) / 100 : null);
  return (Array.isArray(doc.acceptedChanges) ? doc.acceptedChanges : []).some((e) => isObj(e) && e.item === item && e.field === field && key(e.at) === key(at) && near(e.to, to));
}
/** One error for a move outside MOVE_RANGE that the snapshot does not acknowledge, else null. */
function moveError(doc, item, field, at, a, b) {
  if (!outside(a, b) || acknowledged(doc, item, field, at, b)) return null;
  const where = isNum(at) ? `${item} at GH¢${at}` : item;
  return jumped(a, b) ? `${where}: ${field} jumped ${a} -> ${b} (more than ${MAX_FACTOR}x)` : `${where}: ${field} moved ${a} -> ${b} (x${(b / a).toFixed(2)}, outside ${MOVE_RANGE[0]}x–${MOVE_RANGE[1]}x) without an acknowledgement in acceptedChanges`;
}
/** The site's conditional test (dataBundles.isConditional): flagged, or MTN Data Zone by family. */
const conditional = (b) => isObj(b) && (b.conditional === true || b.family === "Data Zone");
/** Plausible MB per cedi for any bundle (the checker's validate.MB_PER_CEDI). */
export const MB_PER_CEDI = [5, 20000];
const jumped = (a, b) => isPos(a) && isPos(b) && Math.max(a / b, b / a) > MAX_FACTOR;
/** A whole table (or a whole network's prices or volumes) moving by ONE common factor
 *  beyond these at once is a scaling or unit slip, not a price change (the checker's
 *  validate.UNIFORM_SHIFT). "Common" = every ratio within UNIFORM_SPREAD of the others. */
export const UNIFORM_SHIFT = [0.67, 1.5];
export const UNIFORM_SPREAD = 1.02;
/** More than this share of a network's rankable bundles may not turn pending or unconfirmed at once. */
export const MAX_UNCONFIRMED_FLIP = 0.5;
/** The common factor when at least 3 pairs [before, now] all moved by about the same
 *  factor outside UNIFORM_SHIFT; otherwise null. */
function uniformShift(pairs) {
  const r = pairs.filter(([a, b]) => isPos(a) && isPos(b)).map(([a, b]) => b / a);
  if (r.length < 3) return null;
  const lo = Math.min(...r), hi = Math.max(...r);
  if (hi / lo > UNIFORM_SPREAD) return null;
  const f = Math.sqrt(lo * hi);
  return f > UNIFORM_SHIFT[1] || f < UNIFORM_SHIFT[0] ? f : null;
}
/** Bands of a table that carry a rate (published, or unconfirmed with MTN's printed figure). */
const ratedBands = (table) => (Array.isArray(table) ? table.filter((b) => isObj(b) && isPos(b.ghsPerMb) && (!isUnpublishedBand(b) || b.unconfirmed === true)) : []);
/** The rate a table gives for spending exactly `a` (an exact-amount band wins), or null. */
function rateAt(table, a) {
  const rows = ratedBands(table);
  const exact = rows.find((b) => isNum(b.exactly) && Math.abs(b.exactly - a) < 1e-9);
  if (exact) return exact.ghsPerMb;
  const hit = rows.find((b) => !isNum(b.exactly) && isNum(b.from) && isNum(b.to) && (b.fromExclusive ? a > b.from + 1e-9 : a >= b.from - 1e-9) && a <= b.to + 1e-9);
  return hit ? hit.ghsPerMb : null;
}
/** [amount, rate] for each rated band of a table, at the lowest amount it covers. */
const bandPoints = (table) => ratedBands(table)
  .map((b) => [isNum(b.exactly) ? b.exactly : isNum(b.from) ? (b.fromExclusive ? Math.round((b.from + 0.01) * 100) / 100 : b.from) : NaN, b.ghsPerMb])
  .filter(([a]) => Number.isFinite(a));
/** One option of Telecel Flexi's bands as a plain rate table, from any of the dataset's shapes. */
function flexiTable(bands, col) {
  return bands.filter(isObj).map((b) => {
    const o = col === "noExpiry" ? (b.noExpiry ?? b.noexpiry ?? b.nonExpiry) : (b.expiry ?? b.withExpiry);
    const rate = isObj(o) ? o.ghsPerMb : col === "noExpiry" ? (b.noExpiryPerMb ?? b.noExpiryGhsPerMb) : (b.expiryPerMb ?? b.expiryGhsPerMb);
    return { from: b.from ?? b.min, to: b.to ?? b.max, exactly: b.exactly, ghsPerMb: rate };
  });
}
/** Every dispute a document carries: otherSource.contradicts on a bundle (key
 *  "network|bundle name") or on an MTN rate block ("mtn|mtnRates.midnightOtherSource",
 *  "mtn|mtnRates.pulse.otherSource"). */
function disputesOf(d) {
  const out = new Map();
  for (const b of Array.isArray(d.bundles) ? d.bundles : []) if (isObj(b) && isObj(b.otherSource) && isStr(b.otherSource.contradicts)) out.set(`${b.network}|${b.name}`, b.otherSource.contradicts);
  const r = isObj(d.mtnRates) ? d.mtnRates : null;
  if (r && isObj(r.midnightOtherSource) && isStr(r.midnightOtherSource.contradicts)) out.set("mtn|mtnRates.midnightOtherSource", r.midnightOtherSource.contradicts);
  if (r && isObj(r.pulse) && isObj(r.pulse.otherSource) && isStr(r.pulse.otherSource.contradicts)) out.set("mtn|mtnRates.pulse.otherSource", r.pulse.otherSource.contradicts);
  return out;
}
/** Does the item a dispute key names still exist (the bundle, or the MTN rate block)? */
function hasItem(d, key) {
  const i = key.indexOf("|"), net = key.slice(0, i), item = key.slice(i + 1);
  if (item.startsWith("mtnRates.")) return net === "mtn" && isObj(d.mtnRates);
  return Array.isArray(d.bundles) && d.bundles.some((b) => isObj(b) && b.network === net && b.name === item);
}

/** TechTrendi counts 1 GB as 1,024 MB for every network (owner's decision,
 *  18 Oct 2026). A snapshot with any other factor is not a partial scrape but a
 *  units change, and is never allowed to replace the bundled data. This is a
 *  guard, not a default: the maths always reads networks.<id>.mbPerGb. */
export const REQUIRED_MB_PER_GB = 1024;

/** The rows of a rate table and the highest spend it covers, from either shape
 *  (exactly / to). Unpublished gap rows are not counted. */
function tableShape(table) {
  const rows = Array.isArray(table) ? table.filter((b) => isObj(b) && (!isUnpublishedBand(b) || (b.unconfirmed === true && isPos(b.ghsPerMb)))) : [];
  const top = rows.reduce((m, b) => Math.max(m, isNum(b.exactly) ? b.exactly : isNum(b.to) ? b.to : isNum(b.max) ? b.max : 0), 0);
  return { n: rows.length, top };
}

/** Flexi bands, whatever shape the dataset uses (array, or bands/table/rates/data). */
function flexiBands(telecelRates) {
  const f = isObj(telecelRates) ? telecelRates.flexi : undefined;
  const list = Array.isArray(f) ? f : isObj(f) ? (f.bands ?? f.table ?? f.rates ?? f.data) : null;
  return Array.isArray(list) ? list : [];
}

/** Guards against a partial scrape replacing a full dataset. Compared with the
 *  baseline (the committed/bundled data), the snapshot must keep:
 *   - every network, each with at least 70% of its bundles (a drop of at most
 *     MAX_NETWORK_DROP);
 *   - every package family that has bundles in the baseline;
 *   - every top-level rate block the baseline has (mtnRates, telecelRates,
 *     atRates, ...), and inside each block every table or section the
 *     baseline has (MTN regular, midnight, Pulse; Telecel Flexi; ...);
 *   - Telecel Flexi bands, when the baseline has them;
 *   - as many bands in MTN regular, Midnight and Pulse and in Telecel Flexi as the
 *     baseline, reaching at least as high an amount (no truncated table);
 *   - 1,024 MB per GB for every network (REQUIRED_MB_PER_GB), unchanged from the baseline;
 *   - every bundle price and volume, every rate at every baseline band amount, the flat rates
 *     and borrowed rows within MOVE_RANGE (0.67x–1.5x) unless acceptedChanges lists the move;
 *   - conditional bundles conditional unless liftedConditions lists them; unconfirmed bands
 *     unconfirmed while their rate is unchanged; Pulse's minimum spend; familyInfo per network,
 *     citedSources and the verification text not cut by more than half.
 *  @returns {{ ok: boolean, errors: string[] }} */
export function compareToBaseline(doc, baseline) {
  const errors = [];
  if (!isObj(baseline) || !Array.isArray(baseline.bundles)) return { ok: true, errors };
  if (!isObj(doc) || !Array.isArray(doc.bundles)) return { ok: false, errors: ["no bundles"] };
  const count = (d, id) => d.bundles.filter((b) => isObj(b) && b.network === id).length;
  const ids = new Set([...Object.keys(baseline.networks || {}), ...baseline.bundles.map((b) => b && b.network).filter(Boolean)]);
  for (const id of ids) {
    const before = count(baseline, id), now = count(doc, id);
    if (before > 0 && now === 0) { errors.push(`network ${id} has no bundles`); continue; }
    if (before > 0 && now < before * (1 - MAX_NETWORK_DROP) - 1e-9) errors.push(`network ${id}: only ${now} bundles vs ${before} before (more than a ${Math.round(MAX_NETWORK_DROP * 100)}% drop)`);
    if (isObj(baseline.networks) && baseline.networks[id] && !(isObj(doc.networks) && doc.networks[id])) errors.push(`network ${id} missing from networks`);
  }
  // M2: bundles gone against the baseline. A few may go (the checker lists them in retiredBundles);
  // more than MAX_VANISH, or more than MAX_VANISH_SHARE of a network, unlisted = a partial page.
  {
    const listed = new Set((Array.isArray(doc.retiredBundles) ? doc.retiredBundles : []).filter(isObj).map((x) => `${x.network}|${x.name}`));
    const nowNames = new Set(doc.bundles.filter(isObj).map((b) => `${b.network}|${b.name}`));
    for (const id of ids) {
      const mine = baseline.bundles.filter((b) => isObj(b) && b.network === id);
      const gone = mine.filter((b) => !nowNames.has(`${id}|${b.name}`) && !listed.has(`${id}|${b.name}`));
      if (gone.length > MAX_VANISH || gone.length > mine.length * MAX_VANISH_SHARE + 1e-9) errors.push(`network ${id}: ${gone.length} of ${mine.length} bundles gone without being listed in retiredBundles (${gone.slice(0, 3).map((b) => b.name).join(", ")}${gone.length > 3 ? ", …" : ""})`);
    }
  }
  // L10: a bundle the baseline does not know must come in as pending (the checker adds new bundles
  // that way until a human approves them; an approved one reaches the site with the next deploy).
  {
    const known = new Set(baseline.bundles.filter(isObj).map((b) => `${b.network}|${b.name}`));
    const fresh = doc.bundles.filter((b) => isObj(b) && !known.has(`${b.network}|${b.name}`) && b.pending !== true);
    if (fresh.length) errors.push(`new bundles not marked pending: ${fresh.slice(0, 3).map((b) => `${b.network} ${b.name}`).join(", ")}`);
  }
  // L6, L7: a bundle the baseline marks unconfirmed may lose the mark, and a bundle's USSD code may
  // change, only when confirmedBundles / acceptedCodes acknowledges it (written on a run a human accepted).
  {
    const base = new Map(baseline.bundles.filter(isObj).map((b) => [`${b.network}|${b.name}`, b]));
    const confirmed = new Set((Array.isArray(doc.confirmedBundles) ? doc.confirmedBundles : []).filter(isObj).map((x) => `${x.network}|${x.name}`));
    const codes = (Array.isArray(doc.acceptedCodes) ? doc.acceptedCodes : []).filter(isObj);
    for (const b of doc.bundles.filter(isObj)) {
      const k = `${b.network}|${b.name}`, o = base.get(k);
      if (!o) continue;
      if (o.unconfirmed === true && b.unconfirmed !== true && !confirmed.has(k)) errors.push(`${b.network} ${b.name}: no longer unconfirmed without an acknowledgement in confirmedBundles`);
      const was = o.ussd ?? null, now = b.ussd ?? null;
      if (was !== now && !codes.some((x) => x.network === b.network && x.name === b.name && (x.to ?? null) === now)) errors.push(`${b.network} ${b.name}: code ${was} -> ${now} without an acknowledgement in acceptedCodes`);
    }
  }
  const fams = (d) => new Set(d.bundles.filter(isObj).map((b) => `${b.network}|${b.family}`));
  const nowFams = fams(doc);
  // A family may go only when the snapshot lists it in retiredFamilies, which the checker writes
  // only on a run a human accepted with --accept-structural-change.
  const retired = new Set((Array.isArray(doc.retiredFamilies) ? doc.retiredFamilies : []).filter(isObj).map((x) => `${x.network}|${x.family}`));
  const lostFams = [...fams(baseline)].filter((f) => !nowFams.has(f) && !retired.has(f));
  if (lostFams.length) errors.push(`package families missing: ${lostFams.slice(0, 5).join(", ")}${lostFams.length > 5 ? ` and ${lostFams.length - 5} more` : ""}`);
  // Every listed family must really be gone, and one newly listed (not already in the
  // baseline's own list) must have had bundles in the baseline: a list naming families
  // that never existed, or still exist, is not a retirement a human accepted.
  const baseFams = fams(baseline);
  const baseRetired = new Set((Array.isArray(baseline.retiredFamilies) ? baseline.retiredFamilies : []).filter(isObj).map((x) => `${x.network}|${x.family}`));
  for (const f of retired) {
    if (nowFams.has(f)) errors.push(`retiredFamilies lists ${f}, which still has bundles`);
    else if (!baseRetired.has(f) && !baseFams.has(f)) errors.push(`retiredFamilies newly lists ${f}, which had no bundles before`);
  }
  for (const key of Object.keys(baseline).filter((k) => /Rates$/.test(k) && isObj(baseline[k]))) {
    const was = baseline[key], now = doc[key];
    if (!isObj(now)) { errors.push(`${key} missing`); continue; }
    for (const [k, v] of Object.entries(was)) {
      if (v === null || typeof v !== "object") continue; // plain facts may be reworded or dropped
      const n = now[k];
      if (n === undefined || n === null || typeof n !== "object") { errors.push(`${key}.${k} missing`); continue; }
      if (Array.isArray(v) && v.length > 0 && !(Array.isArray(n) && n.length > 0)) errors.push(`${key}.${k} is empty`);
    }
  }
  if (flexiBands(baseline.telecelRates).length > 0 && flexiBands(doc.telecelRates).length === 0) errors.push("telecelRates.flexi has no bands");
  // GB factor: 1,024 MB for every network, and never different from the baseline's.
  if (isObj(doc.networks)) for (const [id, n] of Object.entries(doc.networks)) {
    const f = isObj(n) ? n.mbPerGb : undefined;
    const was = isObj(baseline.networks) && isObj(baseline.networks[id]) ? baseline.networks[id].mbPerGb : undefined;
    if (f !== REQUIRED_MB_PER_GB) errors.push(`networks.${id}.mbPerGb is ${f}, not ${REQUIRED_MB_PER_GB}`);
    else if (was !== undefined && f !== was) errors.push(`networks.${id}.mbPerGb changed from ${was} to ${f}`);
  }
  // A whole network turned unconfirmed or pending (nothing left to rank) is a broken scrape, not news.
  const rankable = (b) => isObj(b) && b.pending !== true && b.unconfirmed !== true;
  const before = new Map(baseline.bundles.filter(isObj).map((b) => [`${b.network}|${b.name}`, b]));
  for (const id of ids) {
    if (baseline.bundles.some((b) => b && b.network === id && rankable(b)) && doc.bundles.some((b) => isObj(b) && b.network === id) && !doc.bundles.some((b) => b && b.network === id && rankable(b))) errors.push(`network ${id}: every bundle is pending or unconfirmed`);
  }
  // Editorial content cut by more than half at once (audit 8): a network's familyInfo (families or
  // text), MTN's citedSources, the verification text; and MTN Pulse's published minimum disappearing.
  if (isObj(baseline.familyInfo)) for (const [id, v] of Object.entries(baseline.familyInfo)) {
    const n = isObj(doc.familyInfo) && isObj(doc.familyInfo[id]) ? doc.familyInfo[id] : {};
    const len = (o) => Object.values(o).reduce((t, x) => t + (typeof x === "string" ? x.length : 0), 0);
    if (isObj(v) && Object.keys(v).length >= 2 && (Object.keys(n).length < Object.keys(v).length * MAX_SHRINK || len(n) < len(v) * MAX_SHRINK)) errors.push(`familyInfo.${id}: cut by more than half (${Object.keys(v).length} families before, ${Object.keys(n).length} now)`);
  }
  {
    const a = isObj(baseline.mtnRates) && Array.isArray(baseline.mtnRates.citedSources) ? baseline.mtnRates.citedSources.length : 0;
    const b = isObj(doc.mtnRates) && Array.isArray(doc.mtnRates.citedSources) ? doc.mtnRates.citedSources.length : 0;
    if (a >= 2 && b < a * MAX_SHRINK) errors.push(`mtnRates.citedSources: ${b} sources vs ${a} before (cut by more than half)`);
    const pm = (d) => (isObj(d.mtnRates) && isObj(d.mtnRates.pulse) ? d.mtnRates.pulse.minSpend : undefined);
    if (isObj(pm(baseline)) && !(isObj(pm(doc)) && isPos(pm(doc).amount))) errors.push("mtnRates.pulse.minSpend disappeared (amounts below MTN's minimum would be priced)");
    if (isStr(baseline.verification) && !(isStr(doc.verification) && doc.verification.trim().length >= baseline.verification.trim().length * MAX_SHRINK)) errors.push("verification text cut by more than half");
  }
  // Editorial text emptied.
  for (const key of ["familyInfo", "networkFacts"]) {
    const was = isObj(baseline[key]) ? baseline[key] : {};
    for (const [id, v] of Object.entries(was)) {
      const n = isObj(doc[key]) ? doc[key][id] : undefined;
      const empty = key === "familyInfo" ? !(isObj(n) && Object.keys(n).length) : !isStr(n);
      if ((key === "familyInfo" ? isObj(v) && Object.keys(v).length : isStr(v)) && empty) errors.push(`${key}.${id} is empty`);
    }
  }
  // Price and volume moves per bundle (same network and name), every network: outside
  // MOVE_RANGE only with an acceptedChanges entry (audit 8, M1; it used to be 4x).
  for (const b of doc.bundles) {
    const o = isObj(b) ? before.get(`${b.network}|${b.name}`) : undefined;
    if (!o) continue;
    for (const k of ["price", "mb"]) { const e = moveError(doc, `${b.network}|${b.name}`, k, null, o[k], b[k]); if (e) errors.push(e); }
  }
  // Conditional bundles (only some customers can buy them) may not lose the flag unless
  // liftedConditions acknowledges it (audit 8, M3).
  const lifted = new Set((Array.isArray(doc.liftedConditions) ? doc.liftedConditions : []).filter(isObj).map((x) => `${x.network}|${x.name}`));
  for (const b of doc.bundles) {
    const o = isObj(b) ? before.get(`${b.network}|${b.name}`) : undefined;
    if (o && conditional(o) && !conditional(b) && !lifted.has(`${b.network}|${b.name}`)) errors.push(`${b.network} ${b.name}: no longer conditional (was ${o.conditionalReason ?? "personalised"}) without an acknowledgement in liftedConditions`);
  }
  // A whole network's prices or volumes moved by one common factor (L2), and most of a
  // network's rankable bundles turned pending or unconfirmed at once (L2).
  for (const id of ids) {
    const pairs = doc.bundles.filter((b) => isObj(b) && b.network === id).map((b) => [before.get(`${id}|${b.name}`), b]).filter(([o]) => isObj(o));
    for (const k of ["price", "mb"]) {
      const f = uniformShift(pairs.map(([o, b]) => [o[k], b[k]]));
      if (f) errors.push(`network ${id}: every bundle's ${k} moved by the same factor (x${f.toFixed(2)}); scaling slip?`);
    }
    const was = pairs.filter(([o]) => rankable(o));
    const flipped = was.filter(([, b]) => !rankable(b)).length;
    if (flipped >= 2 && flipped > was.length * MAX_UNCONFIRMED_FLIP) errors.push(`network ${id}: ${flipped} of ${was.length} bundles turned pending or unconfirmed at once`);
  }
  // Rate jumps, compared BY AMOUNT (each table's rate at the lowest amount of every baseline
  // band), so reordered bands are not a "jump": MTN regular, Midnight and Pulse, and both
  // options of Telecel Flexi. A whole table moved by one common factor is rejected too (L2).
  const mr = (d) => (isObj(d.mtnRates) ? d.mtnRates : {});
  const wasR = mr(baseline), nowR = mr(doc);
  const fb = flexiBands(baseline.telecelRates), fn = flexiBands(doc.telecelRates);
  for (const [name, a, b] of [["mtnRates.regular", wasR.regular, nowR.regular], ["mtnRates.midnight", wasR.midnight, nowR.midnight],
    ["mtnRates.pulse.data", isObj(wasR.pulse) ? wasR.pulse.data : null, isObj(nowR.pulse) ? nowR.pulse.data : null],
    ["telecelRates.flexi noExpiry", fb.length ? flexiTable(fb, "noExpiry") : null, fn.length ? flexiTable(fn, "noExpiry") : null],
    ["telecelRates.flexi expiry", fb.length ? flexiTable(fb, "expiry") : null, fn.length ? flexiTable(fn, "expiry") : null]]) {
    if (!Array.isArray(a) || !Array.isArray(b)) continue;
    const pts = bandPoints(a).map(([amt, x]) => [amt, x, rateAt(b, amt)]);
    for (const [amt, x, y] of pts) { const e = moveError(doc, name, "ghsPerMb", amt, x, y); if (e) errors.push(e); }
    // A band the baseline marks unconfirmed (MTN Pulse GH¢5–9.99) keeps the mark while its range and rate are unchanged (M2).
    for (const x of a.filter((y) => isObj(y) && y.unconfirmed === true)) {
      const same = b.filter((y) => isObj(y) && y.from === x.from && y.to === x.to && y.exactly === x.exactly && near(y.ghsPerMb, x.ghsPerMb));
      if (same.length && !same.some((y) => y.unconfirmed === true)) errors.push(`${name}: band ${x.from ?? x.exactly}–${x.to ?? ""} lost its unconfirmed mark although its rate is unchanged`);
    }
    const f = uniformShift(pts.map(([, x, y]) => [x, y]));
    if (f) errors.push(`${name}: every band's rate moved by the same factor (x${f.toFixed(2)}); scaling slip?`);
  }
  for (const k of ["social", "video", "outOfBundlePerMb"]) { const e = moveError(doc, `mtnRates.${k}`, "ghsPerMb", null, wasR[k], nowR[k]); if (e) errors.push(e); }
  if (Array.isArray(wasR.socialRange) && Array.isArray(nowR.socialRange) && jumped(wasR.socialRange[1], nowR.socialRange[1])) errors.push(`mtnRates.socialRange top jumped ${wasR.socialRange[1]} -> ${nowR.socialRange[1]}`);
  for (const key of ["telecelRates", "atRates"]) {
    const a = isObj(baseline[key]) ? baseline[key].outOfBundlePerMb : undefined, b = isObj(doc[key]) ? doc[key].outOfBundlePerMb : undefined;
    const e = moveError(doc, `${key}.outOfBundlePerMb`, "ghsPerMb", null, a, b);
    if (e) errors.push(e);
  }
  // Borrowed data (MTN Xtrabyte, AT Data Kredit): kept as borrowed data, rows not emptied or cut, volumes steady.
  for (const [key, a, b] of [["mtnRates.xtrabyte", wasR.xtrabyte, nowR.xtrabyte],
    ["atRates.dataKredit", isObj(baseline.atRates) ? baseline.atRates.dataKredit : undefined, isObj(doc.atRates) ? doc.atRates.dataKredit : undefined]]) {
    if (!isObj(a) || !Array.isArray(a.rows) || !a.rows.length) continue;
    if (!isObj(b) || b.kind !== "borrowed") { errors.push(`${key} is no longer borrowed data`); continue; }
    if (!Array.isArray(b.rows) || b.rows.length < a.rows.length) { errors.push(`${key}: ${Array.isArray(b.rows) ? b.rows.length : 0} rows vs ${a.rows.length} before`); continue; }
    for (const y of b.rows) { const x = a.rows.find((r) => isObj(r) && isObj(y) && r.price === y.price); const e = x ? moveError(doc, key, "mb", y.price, x.mb, y.mb) : null; if (e) errors.push(e); }
  }
  // Published-rate gaps dropped while the rate table itself is unchanged.
  const gapsOf = (r, t) => (isObj(r.gaps) && Array.isArray(r.gaps[t]) ? r.gaps[t] : null);
  const sameBands = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => isObj(x) && isObj(b[i]) && x.from === b[i].from && x.to === b[i].to && x.exactly === b[i].exactly);
  for (const t of ["regular", "midnight", "pulse"]) {
    const ga = gapsOf(wasR, t);
    if (!ga || !ga.length) continue;
    const gb = gapsOf(nowR, t);
    const ta = t === "pulse" ? (isObj(wasR.pulse) ? wasR.pulse.data : null) : wasR[t], tb = t === "pulse" ? (isObj(nowR.pulse) ? nowR.pulse.data : null) : nowR[t];
    if ((!gb || gb.length < ga.length) && sameBands(ta, tb)) errors.push(`mtnRates.gaps.${t}: ${gb ? gb.length : 0} gaps vs ${ga.length} before, with the same rate bands`);
  }
  // Truncated rate tables: a table with fewer bands, or one that stops at a lower amount, than the baseline's.
  const tables = (d) => {
    const r = isObj(d.mtnRates) ? d.mtnRates : {};
    return {
      "mtnRates.regular": r.regular,
      "mtnRates.midnight": r.midnight,
      "mtnRates.pulse.data": isObj(r.pulse) ? r.pulse.data : undefined,
      "telecelRates.flexi": flexiBands(d.telecelRates),
    };
  };
  const was = tables(baseline), now = tables(doc);
  for (const [name, t] of Object.entries(was)) {
    const a = tableShape(t), b = tableShape(now[name]);
    if (a.n === 0) continue;
    if (b.n < a.n) errors.push(`${name}: ${b.n} bands vs ${a.n} before (truncated)`);
    else if (b.top < a.top - 1e-9) errors.push(`${name}: stops at ${b.top} vs ${a.top} before (truncated)`);
  }
  // Disputes (L2): an otherSource.contradicts the baseline carries (MTN Midnight's and
  // Kokrokoo's expiry; the Sunday Special, Jara and Data Zone prices; Pulse's older
  // volumes) may not be removed or changed while its bundle or block is still there, unless
  // the snapshot's resolvedDisputes acknowledges exactly that one ({network, item, was});
  // the checker writes it only on a run a human accepted with --accept-structural-change.
  const resolved = new Set((Array.isArray(doc.resolvedDisputes) ? doc.resolvedDisputes : []).filter(isObj).map((x) => `${x.network}|${x.item}|${x.was}`));
  const nowDisputes = disputesOf(doc);
  for (const [key, was] of disputesOf(baseline)) {
    if (!hasItem(doc, key) || nowDisputes.get(key) === was || resolved.has(`${key}|${was}`)) continue;
    errors.push(`${key.replace("|", " ")}: dispute (contradicts ${was}) ${nowDisputes.has(key) ? `changed to ${nowDisputes.get(key)}` : "removed"} without an acknowledgement in resolvedDisputes`);
  }
  return { ok: errors.length === 0, errors };
}

/** A snapshot dated more than this into the future is not trusted (clock or data error). Ten
 *  minutes: the checker stamps its rows with the server's UTC clock when it runs, so a real row is
 *  never ahead of a reader's clock by more than ordinary clock skew (audit 8, L9; it was 24 hours).
 *  ONE constant for the browser (bundleSnapshot.resolveSnapshot) and the prebuild
 *  (scripts/fetch-data-bundles.mjs). */
export const MAX_FUTURE_MS = 10 * 60_000;

/** The first of a row's captured_at and checked_at and its data's capturedAt and checkedAt
 *  that lies more than MAX_FUTURE_MS after `now` (it would win every "strictly newer"
 *  test until that date), or null when none does. */
export function futureDate(row, now = Date.now()) {
  if (!isObj(row)) return null;
  const d = isObj(row.data) ? row.data : {};
  for (const t of [row.captured_at, row.checked_at, d.capturedAt, d.checkedAt]) if (captureTime(t) > now + MAX_FUTURE_MS) return t;
  return null;
}

/** Fields the bundle checker leaves out of its content hash: capturedAt,
 *  checkedAt and verification (the checker rewrites `verification`, with
 *  the date, on every run). Two documents that differ only in these hold the
 *  same figures. */
export const VOLATILE_FIELDS = ["capturedAt", "checkedAt", "verification"];

/** Bundle order for comparing content, exactly as the checker's hash orders
 *  them (data_bundles/common.py bundle_sort_key): network, family, price,
 *  mb (a bundle with no mb first), name. Strings compare by code point, as
 *  Python does. */
const cmpStr = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const mbKey = (b) => (b.mb === null || b.mb === undefined ? -1 : Number(b.mb));
export function compareBundles(a, b) {
  if (!isObj(a) || !isObj(b)) return 0;
  return cmpStr(String(a.network), String(b.network)) || cmpStr(String(a.family), String(b.family)) ||
    (Number(a.price) - Number(b.price)) || (mbKey(a) - mbKey(b)) || cmpStr(String(a.name), String(b.name));
}

/** The dataset without volatile fields (VOLATILE_FIELDS), as a stable
 *  string, so two documents can be compared for content exactly as the
 *  checker compares them: same fields left out, bundles in the checker's
 *  order (compareBundles), object keys sorted. */
export function contentKey(doc) {
  if (!isObj(doc)) return "";
  const rest = { ...doc };
  for (const k of VOLATILE_FIELDS) delete rest[k];
  if (Array.isArray(rest.bundles)) rest.bundles = [...rest.bundles].sort(compareBundles);
  const sort = (v) => (Array.isArray(v) ? v.map(sort) : isObj(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v);
  return JSON.stringify(sort(rest));
}

/** Milliseconds for a capture time. A date-only value ("2026-10-17") counts
 *  as the START of that day, UTC; a timestamp without a zone is read as UTC;
 *  full ISO timestamps as given. NaN when missing or unreadable. */
export function captureTime(s) {
  if (typeof s !== "string" || !s.trim()) return NaN;
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return Date.parse(`${t}T00:00:00Z`);
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(t)) return Date.parse(`${t.replace(" ", "T")}Z`);
  return Date.parse(t);
}

/** True when a snapshot row was captured strictly after the baseline data.
 *  Compares the row's captured_at column (always a timestamp) with the
 *  baseline's capturedAt (a timestamp, or a date-only value read as the
 *  start of that day, UTC), so a price change captured later on the same day
 *  replaces the bundled data. If the row has no readable captured_at, its
 *  data's own capturedAt is used.
 *  @param row {{ captured_at?: string|null, data?: { capturedAt?: string } }} */
export function isStrictlyNewer(row, baseline) {
  if (!isObj(row)) return false;
  let a = captureTime(row.captured_at);
  if (Number.isNaN(a)) a = captureTime(isObj(row.data) ? row.data.capturedAt : row.capturedAt);
  const b = captureTime(isObj(baseline) ? baseline.capturedAt : undefined);
  if (Number.isNaN(a)) return false;
  if (Number.isNaN(b)) return true;
  return a > b;
}

/** Where the checker publishes the latest row as a static file on the site itself
 *  (/opt/tech-news/data_bundles/publish.py, 19 Oct 2026), for visitors whose networks
 *  cannot reach db2. Same origin, so it always loads where the page loads. */
export const bundleFilePath = (country) => `/storage/data-bundles/${country}-latest.json`;

/** That file's body ({ id, content_hash, captured_at, checked_at, data }: the row exactly as
 *  the database gives it) as a snapshot row { data, captured_at, checked_at }, or null when it
 *  is not one. Every check a database row gets (schema, partial-scrape, future date,
 *  strictly newer) is then applied to it unchanged. */
export function rowFromFile(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) return null;
  if (typeof body.captured_at !== "string" || !body.captured_at.trim()) return null;
  return { data: body.data, captured_at: body.captured_at, checked_at: typeof body.checked_at === "string" ? body.checked_at : null };
}

/** Of two snapshot rows (either may be null), the one checked later (else captured later). */
export function newerRow(a, b) {
  if (!a) return b ?? null;
  if (!b) return a;
  const t = (r) => { const x = captureTime(r.checked_at ?? r.captured_at); return Number.isFinite(x) ? x : -Infinity; };
  return t(b) > t(a) ? b : a;
}
