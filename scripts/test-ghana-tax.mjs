// Run: node --experimental-strip-types scripts/test-ghana-tax.mjs
// Checks the Ghana tax maths in src/lib/ghanaTax.ts against hand-worked examples.
import { progressiveTax, salary, basicForTakeHome, vatBreakdown, bonusTax, BANDS_2026_SEP, BANDS_BEFORE_SEP_2026 } from "../src/lib/ghanaTax.ts";

let fails = 0;
const near = (a, b, msg, tol = 0.01) => {
  if (Math.abs(a - b) > tol) { console.log(`FAIL ${msg}: got ${a}, want ${b}`); fails++; } else console.log(`ok   ${msg}`);
};

// Bands add up to GH¢600,000 before the 35% band (Act 1178).
near(BANDS_2026_SEP.slice(0, -1).reduce((s, b) => s + b.width, 0), 600000, "bands sum to 600,000");

// Tax on exactly 600,000 a year: 0 + 48 + 120 + 6,090 + 48,000 + 109,195.2 = 163,453.20
near(progressiveTax(600000).total, 163453.2, "tax on 600,000/yr");
near(progressiveTax(7056).total, 0, "tax-free threshold 7,056/yr");
near(progressiveTax(8016).total, 48, "960 at 5% = 48");
near(progressiveTax(700000).total, 163453.2 + 35000, "35% above 600,000");

// Salary GH¢5,000 basic: SSNIT 275; chargeable 4,725/mo = 56,700/yr
// tax = 48 + 120 + 6,090 + (56,700-44,016)*0.25 = 6,258 + 3,171 = 9,429/yr = 785.75/mo
const s = salary({ basicMonthly: 5000 });
near(s.ssnitEmployee, 275, "SSNIT 5.5% of 5,000");
near(s.paye, 785.75, "PAYE on 5,000 basic");
near(s.takeHome, 5000 - 275 - 785.75, "take-home on 5,000 basic");
near(s.ssnitEmployer, 650, "employer 13%");

// SSNIT cap: basic 100,000 → SSNIT on 69,000 only
near(salary({ basicMonthly: 100000 }).ssnitEmployee, 69000 * 0.055, "SSNIT capped at 69,000");

// Allowances are taxed but carry no SSNIT
near(salary({ basicMonthly: 5000, allowancesMonthly: 1000 }).ssnitEmployee, 275, "no SSNIT on allowances");

// Reverse: basic needed for the take-home of 5,000 basic
near(basicForTakeHome(s.takeHome), 5000, "reverse search finds 5,000", 0.05);

// VAT: GRA example — 100 before tax → 2.5 + 2.5 + 15 = 120
const v = vatBreakdown(100, "standard", false);
near(v.nhil, 2.5, "NHIL 2.5"); near(v.getfund, 2.5, "GETFund 2.5"); near(v.vat, 15, "VAT 15"); near(v.total, 120, "total 120");
const vi = vatBreakdown(120, "standard", true);
near(vi.base, 100, "120 tax-inclusive → base 100"); near(vi.tax, 20, "tax inside 120 = 20");
near(vatBreakdown(100, "exempt", false).total, 100, "exempt adds nothing");

// Old bands (Act 1111) sum to 605,000 before 35%; new bands tax less at GH¢5,000 basic.
near(BANDS_BEFORE_SEP_2026.slice(0, -1).reduce((s, b) => s + b.width, 0), 605000, "old bands sum to 605,000");
// Old: 56,700/yr → 66 + 156 + 6,650 + (56,700 − 46,760) × 25% = 9,357/yr → 779.75/mo (new bands: 785.75).
const oldPaye = salary({ basicMonthly: 5000, bands: BANDS_BEFORE_SEP_2026 }).paye;
near(oldPaye, (66 + 156 + 6650 + (56700 - 46760) * 0.25) / 12, "old PAYE on 5,000 basic");

// Bonus: basic 5,000 → cap 9,000/yr at 5%. Bonus 10,000 → 9,000@5% = 450; 1,000 extra at 25% = 250. Total 700.
const bt = bonusTax(10000, { basicMonthly: 5000 });
near(bt.cap, 9000, "bonus cap 15% of 60,000"); near(bt.tax, 700, "bonus tax 700"); near(bt.keep, 9300, "bonus keep 9,300");
near(bonusTax(5000, { basicMonthly: 5000 }).tax, 250, "bonus under cap: 5%");

console.log(fails ? `${fails} FAILED` : "ALL PASSED");
process.exit(fails ? 1 : 0);
