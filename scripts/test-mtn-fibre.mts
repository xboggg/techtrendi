// Checks for the MTN Fibre guide's facts and maths (src/data/mtnFibreFacts.ts).
// Run: node --experimental-strip-types scripts/test-mtn-fibre.mts
import { PLANS, PERIODS, PRICE_CUT, planSaving, downloadSeconds, humanTime, suggestPlan } from "../src/data/mtnFibreFacts.ts";

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
};

// MTN's monthly prices (shop + help centre, 25 Nov 2026).
check(PLANS.map((p) => `${p.mbps}:${p.prices["30"]}`).join(",") === "100:299,300:444,500:999", "monthly prices 299 / 444 / 999");

// MTN's long plans are 5% / 7% / 10% off month-by-month ("up to a 10% discount" in MTN's terms).
for (const plan of PLANS) {
  for (const [period, want] of [["90", 5], ["180", 7], ["365", 10]] as const) {
    const s = planSaving(plan, period);
    check(s.percent === want, `${plan.name} ${period} days saves ${want}% (got ${s.percent}%)`);
    check(s.price < s.monthByMonth, `${plan.name} ${period} days is cheaper than paying monthly`);
  }
  check(planSaving(plan, "30").saved === 0, `${plan.name} monthly has no saving`);
}
check(PERIODS.length === 4, "four payment periods");

// Price cut: GH¢987 -> GH¢299 is about 70% (as reported).
check(Math.round((1 - PRICE_CUT.after / PRICE_CUT.before) * 100) === 70, "price cut is about 70%");

// Download maths: 4 GB at 100 Mbps = 320 s.
check(downloadSeconds(4, 100) === 320, "4 GB at 100 Mbps = 320 seconds");
check(humanTime(320) === "5 min 20 sec", `humanTime(320) = 5 min 20 sec (got ${humanTime(320)})`);
check(humanTime(6400) === "1 hr 46 min", `humanTime(6400) = 1 hr 46 min (got ${humanTime(6400)})`);
check(humanTime(0.2) === "1 sec", "never shows 0 sec");

// Picker follows MTN's small / medium / large homes, bumped one step for heavy use.
check(suggestPlan(2, false) === "starter", "2 people, light use -> Starter");
check(suggestPlan(5, false) === "plus", "5 people -> Plus");
check(suggestPlan(8, false) === "elite", "8 people -> Elite");
check(suggestPlan(2, true) === "plus", "2 people, heavy use -> Plus");
check(suggestPlan(10, true) === "elite", "never above Elite");

console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);
