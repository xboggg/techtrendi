import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// --------------- GRA PAYE 2025/2026 Annual Tax Bands ---------------
const TAX_BANDS = [
  { cumulative: 4380, width: 4380, rate: 0, label: "First GHS 4,380" },
  { cumulative: 5580, width: 1200, rate: 0.05, label: "Next GHS 1,200" },
  { cumulative: 7380, width: 1800, rate: 0.1, label: "Next GHS 1,800" },
  { cumulative: 42780, width: 35400, rate: 0.175, label: "Next GHS 35,400" },
  { cumulative: 240000, width: 197220, rate: 0.25, label: "Next GHS 197,220" },
  { cumulative: Infinity, width: Infinity, rate: 0.3, label: "Above GHS 240,000" },
];

const SSNIT_RATE = 0.055; // 5.5%
const TIER2_RATE = 0.05; // 5%
const EMPLOYER_SSNIT_RATE = 0.13; // 13% employer contribution

type EmploymentType = "employee" | "director" | "casual";

function computePAYE(annualTaxableIncome: number) {
  let remaining = annualTaxableIncome;
  let totalTax = 0;
  const bandBreakdown: { label: string; taxable: number; rate: number; tax: number }[] = [];

  for (const band of TAX_BANDS) {
    if (remaining <= 0) {
      bandBreakdown.push({ label: band.label, taxable: 0, rate: band.rate, tax: 0 });
      continue;
    }
    const bandWidth = band.width === Infinity ? remaining : band.width;
    const taxable = Math.min(remaining, bandWidth);
    const tax = taxable * band.rate;
    totalTax += tax;
    remaining -= taxable;
    bandBreakdown.push({ label: band.label, taxable, rate: band.rate, tax });
  }

  return { totalTax, bandBreakdown };
}

function formatGHS(value: number): string {
  return `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];

export default function GhanaTaxCalculator() {
  const [grossMonthly, setGrossMonthly] = useState<string>("5000");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("employee");
  const [includeTier2, setIncludeTier2] = useState(true);
  const [overtime, setOvertime] = useState<string>("0");

  const results = useMemo(() => {
    const gross = parseFloat(grossMonthly) || 0;
    const ot = parseFloat(overtime) || 0;
    const totalMonthlyGross = gross + ot;
    const annualGross = totalMonthlyGross * 12;

    // SSNIT (employee portion)
    const monthlySSNIT = totalMonthlyGross * SSNIT_RATE;
    const annualSSNIT = annualGross * SSNIT_RATE;

    // Tier 2 (optional)
    const monthlyTier2 = includeTier2 ? totalMonthlyGross * TIER2_RATE : 0;
    const annualTier2 = includeTier2 ? annualGross * TIER2_RATE : 0;

    // Taxable income = gross - SSNIT - Tier2
    const annualTaxable = Math.max(0, annualGross - annualSSNIT - annualTier2);

    // PAYE
    const { totalTax: annualPAYE, bandBreakdown } = computePAYE(annualTaxable);
    const monthlyPAYE = annualPAYE / 12;

    // Totals
    const totalMonthlyDeductions = monthlySSNIT + monthlyTier2 + monthlyPAYE;
    const monthlyNet = totalMonthlyGross - totalMonthlyDeductions;
    const annualNet = monthlyNet * 12;

    const effectiveRate = annualGross > 0 ? (annualPAYE / annualGross) * 100 : 0;

    // Employer cost
    const monthlyEmployerSSNIT = totalMonthlyGross * EMPLOYER_SSNIT_RATE;
    const monthlyEmployerCost = totalMonthlyGross + monthlyEmployerSSNIT;

    // Active band index (highest band that has taxable > 0)
    let activeBandIndex = -1;
    bandBreakdown.forEach((b, i) => {
      if (b.taxable > 0) activeBandIndex = i;
    });

    return {
      totalMonthlyGross,
      annualGross,
      monthlySSNIT,
      annualSSNIT,
      monthlyTier2,
      annualTier2,
      annualTaxable,
      annualPAYE,
      monthlyPAYE,
      totalMonthlyDeductions,
      monthlyNet,
      annualNet,
      effectiveRate,
      monthlyEmployerSSNIT,
      monthlyEmployerCost,
      bandBreakdown,
      activeBandIndex,
    };
  }, [grossMonthly, employmentType, includeTier2, overtime]);

  const chartData = [
    { name: "Net Take-Home", value: Math.max(0, results.monthlyNet) },
    { name: "PAYE Tax", value: results.monthlyPAYE },
    { name: "SSNIT (5.5%)", value: results.monthlySSNIT },
    ...(includeTier2 ? [{ name: "Tier 2 (5%)", value: results.monthlyTier2 }] : []),
  ].filter((d) => d.value > 0);

  return (
    <Layout>
      <SEOHead
        title="Ghana Salary Tax Calculator 2025/2026 | PAYE & SSNIT"
        description="Calculate your Ghana net salary after PAYE income tax and SSNIT contributions using real GRA 2025/2026 tax bands. Free online Ghana tax calculator."
        keywords="ghana tax calculator, paye ghana, ssnit calculator, gra tax bands 2025, ghana salary calculator, income tax ghana"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              🇬🇭 Ghana Salary Tax Calculator
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Calculate your net take-home pay using official GRA PAYE tax bands
              and SSNIT rates for the 2025/2026 tax year.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* ---- Input Panel ---- */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Salary Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Gross Monthly */}
                  <div className="space-y-2">
                    <Label htmlFor="grossMonthly">Gross Monthly Salary (GHS)</Label>
                    <Input
                      id="grossMonthly"
                      type="number"
                      min="0"
                      step="100"
                      value={grossMonthly}
                      onChange={(e) => setGrossMonthly(e.target.value)}
                      placeholder="e.g. 5000"
                    />
                  </div>

                  {/* Employment Type */}
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <Select
                      value={employmentType}
                      onValueChange={(v) => setEmploymentType(v as EmploymentType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
                        <SelectItem value="casual">Casual Worker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tier 2 Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tier2">SSNIT Tier 2 (5%)</Label>
                    <button
                      id="tier2"
                      type="button"
                      role="switch"
                      aria-checked={includeTier2}
                      onClick={() => setIncludeTier2(!includeTier2)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        includeTier2 ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
                          includeTier2 ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Overtime / Bonus */}
                  <div className="space-y-2">
                    <Label htmlFor="overtime">Monthly Overtime / Bonus (GHS)</Label>
                    <Input
                      id="overtime"
                      type="number"
                      min="0"
                      step="50"
                      value={overtime}
                      onChange={(e) => setOvertime(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  {/* Reset */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setGrossMonthly("5000");
                      setOvertime("0");
                      setIncludeTier2(true);
                      setEmploymentType("employee");
                    }}
                  >
                    Reset
                  </Button>
                </CardContent>
              </Card>

              {/* Employer Cost Note */}
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="pt-5">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    Employer Cost (estimated)
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Employer pays an additional 13% SSNIT on top of your gross.
                  </p>
                  <div className="flex justify-between text-sm">
                    <span>Employer SSNIT (13%)</span>
                    <span className="font-medium">{formatGHS(results.monthlyEmployerSSNIT)}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Total Cost to Employer</span>
                    <span className="font-semibold">{formatGHS(results.monthlyEmployerCost)}/mo</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ---- Results Panel ---- */}
            <div className="lg:col-span-3 space-y-6">
              {/* Net Pay Highlight */}
              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Net Take-Home Pay</p>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                      {formatGHS(results.monthlyNet)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">per month</p>
                    <p className="text-lg font-semibold mt-2">
                      {formatGHS(results.annualNet)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">per year</span>
                    </p>
                    <p className="mt-3 text-sm">
                      Effective Tax Rate:{" "}
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {results.effectiveRate.toFixed(2)}%
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <Row label="Gross Salary" value={results.totalMonthlyGross} />
                    <Divider />
                    <Row label="SSNIT Tier 1 (5.5%)" value={-results.monthlySSNIT} negative />
                    {includeTier2 && (
                      <Row label="SSNIT Tier 2 (5%)" value={-results.monthlyTier2} negative />
                    )}
                    <Row label="PAYE Income Tax" value={-results.monthlyPAYE} negative />
                    <Divider />
                    <Row label="Total Deductions" value={-results.totalMonthlyDeductions} negative bold />
                    <Divider />
                    <Row label="Net Take-Home" value={results.monthlyNet} bold green />
                  </div>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              {results.totalMonthlyGross > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Salary Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(1)}%`
                            }
                          >
                            {chartData.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatGHS(value)}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tax Bands Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">GRA PAYE Tax Bands (2025/2026 Annual)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-4">Band</th>
                          <th className="py-2 pr-4 text-right">Rate</th>
                          <th className="py-2 pr-4 text-right">Taxable</th>
                          <th className="py-2 text-right">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.bandBreakdown.map((band, idx) => {
                          const isActive = idx === results.activeBandIndex;
                          return (
                            <tr
                              key={idx}
                              className={`border-b last:border-0 transition-colors ${
                                isActive
                                  ? "bg-amber-100 dark:bg-amber-900/30 font-semibold"
                                  : band.taxable > 0
                                  ? "bg-muted/30"
                                  : ""
                              }`}
                            >
                              <td className="py-2 pr-4">{band.label}</td>
                              <td className="py-2 pr-4 text-right">
                                {(band.rate * 100).toFixed(1)}%
                              </td>
                              <td className="py-2 pr-4 text-right">
                                {formatGHS(band.taxable)}
                              </td>
                              <td className="py-2 text-right">{formatGHS(band.tax)}</td>
                            </tr>
                          );
                        })}
                        <tr className="font-bold border-t-2">
                          <td className="py-2 pr-4">Total Annual PAYE</td>
                          <td className="py-2 pr-4 text-right">
                            {results.effectiveRate.toFixed(2)}%
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {formatGHS(results.annualTaxable)}
                          </td>
                          <td className="py-2 text-right">{formatGHS(results.annualPAYE)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Info Note */}
              <Card className="border-muted">
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Disclaimer:</strong> This calculator uses the official GRA
                    PAYE tax bands for the 2025/2026 tax year and standard SSNIT
                    contribution rates. It is intended for estimation purposes only
                    and does not constitute tax advice. Actual deductions may vary
                    based on allowances, reliefs, and employer-specific policies.
                    Consult a qualified tax professional or the Ghana Revenue
                    Authority for definitive guidance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ---- Helper sub-components ---- */

function Row({
  label,
  value,
  negative,
  bold,
  green,
}: {
  label: string;
  value: number;
  negative?: boolean;
  bold?: boolean;
  green?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span
        className={
          green
            ? "text-green-600 dark:text-green-400"
            : negative
            ? "text-red-500 dark:text-red-400"
            : ""
        }
      >
        {negative ? `- ${formatGHS(Math.abs(value))}` : formatGHS(value)}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-dashed" />;
}
