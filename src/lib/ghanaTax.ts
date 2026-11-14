// Ghana tax maths for /tools/ghana-tax-calculator.
// Every rate here is sourced; see the SOURCES list at the bottom. Keep this file free of React
// so it can be tested with plain Node (scripts/test-ghana-tax.mjs).

export interface TaxBand {
  width: number; // annual GH¢ in this band (Infinity for the last band)
  rate: number; // 0.175 = 17.5%
}

/** Resident individual bands, Income Tax (Amendment) Act 2026 (Act 1178), from 1 Sep 2026. */
export const BANDS_2026_SEP: TaxBand[] = [
  { width: 7056, rate: 0 },
  { width: 960, rate: 0.05 },
  { width: 1200, rate: 0.1 },
  { width: 34800, rate: 0.175 },
  { width: 192000, rate: 0.25 },
  { width: 363984, rate: 0.3 },
  { width: Infinity, rate: 0.35 },
];

/** Resident bands 1 Jan 2024 – 31 Aug 2026 (Act 1111). Widths add to 605,000 — GRA advised
 *  payroll to start 35% there because of a known error in the published table. Used for "old vs new". */
export const BANDS_BEFORE_SEP_2026: TaxBand[] = [
  { width: 5880, rate: 0 },
  { width: 1320, rate: 0.05 },
  { width: 1560, rate: 0.1 },
  { width: 38000, rate: 0.175 },
  { width: 192000, rate: 0.25 },
  { width: 366240, rate: 0.3 },
  { width: Infinity, rate: 0.35 },
];

export const SSNIT = {
  employee: 0.055, // worker's share of basic salary
  employer: 0.13, // employer's share of basic salary
  tier1: 0.135, // of the 18.5%, goes to SSNIT (Tier 1)
  tier2: 0.05, // of the 18.5%, goes to the Tier 2 occupational scheme
  maxInsurableMonthly: 69000, // 2026, SSNIT public notice 13 Jan 2026
  minInsurableMonthly: 587.8, // 2026, same notice
};

export interface BandSlice {
  from: number;
  to: number;
  rate: number;
  taxable: number;
  tax: number;
}

/** Progressive tax on an ANNUAL chargeable income. */
export function progressiveTax(annualIncome: number, bands: TaxBand[] = BANDS_2026_SEP) {
  let remaining = Math.max(0, annualIncome);
  let from = 0;
  let total = 0;
  const slices: BandSlice[] = [];
  for (const b of bands) {
    const to = from + b.width;
    const taxable = Math.min(remaining, b.width);
    const tax = taxable * b.rate;
    slices.push({ from, to, rate: b.rate, taxable, tax });
    total += tax;
    remaining -= taxable;
    from = to;
  }
  return { total, slices };
}

export interface SalaryInput {
  basicMonthly: number; // basic salary (SSNIT is worked out on this)
  allowancesMonthly?: number; // taxable cash allowances (no SSNIT)
  tier3Percent?: number; // voluntary Tier 3 pension, % of basic (tax relief capped — see TIER3_MAX)
  bands?: TaxBand[];
}

/** Maximum voluntary (Tier 3) contribution that gets tax relief, as % of basic. Set from research. */
export const TIER3_MAX = 0.165;

export function salary(input: SalaryInput) {
  const basic = Math.max(0, input.basicMonthly || 0);
  const allowances = Math.max(0, input.allowancesMonthly || 0);
  const gross = basic + allowances;
  const insurable = Math.min(basic, SSNIT.maxInsurableMonthly);
  const ssnitEmployee = insurable * SSNIT.employee;
  const ssnitEmployer = insurable * SSNIT.employer;
  const tier3 = basic * Math.min(Math.max(0, (input.tier3Percent || 0) / 100), TIER3_MAX);
  const chargeableMonthly = Math.max(0, gross - ssnitEmployee - tier3);
  const { total: annualTax, slices } = progressiveTax(chargeableMonthly * 12, input.bands);
  const paye = annualTax / 12;
  const takeHome = gross - ssnitEmployee - tier3 - paye;
  return {
    gross,
    basic,
    allowances,
    ssnitEmployee,
    ssnitEmployer,
    tier1Total: insurable * SSNIT.tier1,
    tier2Total: insurable * SSNIT.tier2,
    tier3,
    chargeableMonthly,
    paye,
    takeHome,
    employerCost: gross + ssnitEmployer,
    effectiveRate: gross > 0 ? paye / gross : 0,
    topRate: [...slices].reverse().find((s) => s.taxable > 0)?.rate ?? 0,
    slices,
    capped: basic > SSNIT.maxInsurableMonthly,
  };
}

/** Yearly bonus (GRA PAYE page): up to 15% of yearly basic is taxed at 5% (final);
 *  anything above that is added to the year's pay and taxed on the normal bands. */
export const BONUS_CAP_SHARE = 0.15;
export const BONUS_RATE = 0.05;
export function bonusTax(bonusYearly: number, input: SalaryInput) {
  const bonus = Math.max(0, bonusYearly || 0);
  const s = salary(input);
  const cap = s.basic * 12 * BONUS_CAP_SHARE;
  const atFive = Math.min(bonus, cap);
  const excess = bonus - atFive;
  const yearly = s.chargeableMonthly * 12;
  const excessTax = progressiveTax(yearly + excess, input.bands).total - progressiveTax(yearly, input.bands).total;
  const tax = atFive * BONUS_RATE + excessTax;
  return { bonus, cap, atFive, excess, tax, keep: bonus - tax };
}

/** Find the basic salary that gives a wanted take-home (no allowances), by bisection. */
export function basicForTakeHome(target: number, tier3Percent = 0, bands?: TaxBand[]) {
  if (target <= 0) return 0;
  let lo = 0;
  let hi = target * 3 + 1000;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (salary({ basicMonthly: mid, tier3Percent, bands }).takeHome < target) lo = mid;
    else hi = mid;
  }
  return hi;
}

// ---------------- VAT (Value Added Tax Act 2025, Act 1151, from 1 Jan 2026) ----------------
export const VAT = { vat: 0.15, nhil: 0.025, getfund: 0.025 }; // each on the same value → 20% in total
export const VAT_TOTAL = VAT.vat + VAT.nhil + VAT.getfund;

export type VatTreatment = "standard" | "exempt" | "zero";

/** Split a price into the taxes. `inclusive` = the price already has the taxes in it. */
export function vatBreakdown(price: number, treatment: VatTreatment, inclusive: boolean) {
  const p = Math.max(0, price || 0);
  const rate = treatment === "standard" ? VAT_TOTAL : 0;
  const base = inclusive ? p / (1 + rate) : p;
  const nhil = treatment === "standard" ? base * VAT.nhil : 0;
  const getfund = treatment === "standard" ? base * VAT.getfund : 0;
  const vat = treatment === "standard" ? base * VAT.vat : 0;
  return { base, nhil, getfund, vat, tax: nhil + getfund + vat, total: base + nhil + getfund + vat };
}
