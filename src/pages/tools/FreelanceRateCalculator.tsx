import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DollarSign, Calculator, Clock, TrendingUp, Briefcase, Share2,
  Copy, Check
} from "lucide-react";
import { formatCurrency as fmtCurrency, getPreferredCurrency, setPreferredCurrency } from "@/lib/currencies";
import { CurrencySelector } from "@/components/tools/CurrencySelector";

/* ── Industry benchmarks (USD hourly rates) ── */
const industryBenchmarks: Record<string, { low: number; mid: number; high: number }> = {
  "Web Development": { low: 50, mid: 100, high: 200 },
  "Graphic Design": { low: 35, mid: 75, high: 150 },
  "Content Writing": { low: 25, mid: 60, high: 120 },
  "Consulting": { low: 75, mid: 150, high: 350 },
  "Photography": { low: 40, mid: 100, high: 250 },
  "Digital Marketing": { low: 40, mid: 85, high: 175 },
};

const utilizationLevels = [
  { label: "50%", value: 0.5, description: "Part-time / ramp-up" },
  { label: "70%", value: 0.7, description: "Typical freelancer" },
  { label: "85%", value: 0.85, description: "Highly booked" },
  { label: "100%", value: 1.0, description: "Maximum capacity" },
];

export default function FreelanceRateCalculator() {
  const [currency, setCurrency] = useState(getPreferredCurrency);
  const [copied, setCopied] = useState(false);

  /* ── Inputs ── */
  const [annualIncome, setAnnualIncome] = useState(60000);
  const [annualExpenses, setAnnualExpenses] = useState(5000);
  const [taxRate, setTaxRate] = useState(25);
  const [vacationDays, setVacationDays] = useState(15);
  const [billableHours, setBillableHours] = useState(6);
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState(5);
  const [selectedIndustry, setSelectedIndustry] = useState("Web Development");

  const fmt = (v: number) => fmtCurrency(v, currency);

  /* ── Core calculations ── */
  const results = useMemo(() => {
    const totalWeeksPerYear = 52;
    const vacationWeeks = vacationDays / workDaysPerWeek;
    const workingWeeks = totalWeeksPerYear - vacationWeeks;
    const workingDays = workingWeeks * workDaysPerWeek;
    const totalBillableHours = workingDays * billableHours;

    const taxMultiplier = 1 / (1 - taxRate / 100);
    const annualRevenueNeeded = (annualIncome + annualExpenses) * taxMultiplier;

    const hourlyRate = totalBillableHours > 0 ? annualRevenueNeeded / totalBillableHours : 0;
    const dailyRate = hourlyRate * billableHours;
    const weeklyRate = dailyRate * workDaysPerWeek;
    const monthlyTarget = annualRevenueNeeded / 12;

    return {
      hourlyRate,
      dailyRate,
      weeklyRate,
      monthlyTarget,
      annualRevenueNeeded,
      totalBillableHours,
      workingDays,
      workingWeeks,
    };
  }, [annualIncome, annualExpenses, taxRate, vacationDays, billableHours, workDaysPerWeek]);

  /* ── Utilization scenarios ── */
  const scenarios = useMemo(() => {
    return utilizationLevels.map((level) => {
      const adjustedHourly = level.value > 0 ? results.hourlyRate / level.value : 0;
      return {
        ...level,
        hourlyRate: adjustedHourly,
        dailyRate: adjustedHourly * billableHours,
      };
    });
  }, [results.hourlyRate, billableHours]);

  /* ── Share / Copy ── */
  const buildSummary = () => {
    return [
      "Freelance Rate Calculation",
      "─────────────────────────",
      `Desired Annual Income: ${fmt(annualIncome)}`,
      `Annual Expenses: ${fmt(annualExpenses)}`,
      `Tax Rate: ${taxRate}%`,
      `Vacation Days: ${vacationDays}`,
      `Billable Hours/Day: ${billableHours}`,
      `Working Days/Week: ${workDaysPerWeek}`,
      "",
      "Recommended Rates",
      `  Hourly:  ${fmt(results.hourlyRate)}`,
      `  Daily:   ${fmt(results.dailyRate)}`,
      `  Weekly:  ${fmt(results.weeklyRate)}`,
      `  Monthly Target: ${fmt(results.monthlyTarget)}`,
      `  Annual Revenue Needed: ${fmt(results.annualRevenueNeeded)}`,
      "",
      "— Generated with TechTrendi Freelance Rate Calculator",
    ].join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary());
      setCopied(true);
      toast.success("Results copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — try again.");
    }
  };

  const handleShare = async () => {
    const text = buildSummary();
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Freelance Rate", text });
        toast.success("Shared successfully!");
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    setPreferredCurrency(code);
  };

  /* ── Number input helper ── */
  const numInput = (
    value: number,
    setter: (v: number) => void,
    opts?: { min?: number; step?: number; prefix?: string }
  ) => (
    <div className="relative">
      {opts?.prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {opts.prefix}
        </span>
      )}
      <Input
        type="number"
        min={opts?.min ?? 0}
        step={opts?.step ?? 1}
        value={value}
        onChange={(e) => setter(Number(e.target.value) || 0)}
        className={cn(opts?.prefix && "pl-7")}
      />
    </div>
  );

  return (
    <Layout>
      <SEOHead
        title="Freelance Rate Calculator | TechTrendi"
        description="Calculate your ideal freelance hourly, daily, and project rates based on income goals, expenses, taxes, and availability."
      />

      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Freelance Rate Calculator</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Figure out exactly what to charge so you hit your income goals after
            taxes, expenses, and time off.
          </p>
        </div>

        {/* ── Currency selector ── */}
        <div className="flex justify-end">
          <div className="w-48">
            <CurrencySelector value={currency} onChange={handleCurrencyChange} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ═══════════ LEFT — Inputs ═══════════ */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Income &amp; Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Desired Annual Income</Label>
                  {numInput(annualIncome, setAnnualIncome, { min: 0, step: 1000 })}
                </div>
                <div className="space-y-2">
                  <Label>Annual Business Expenses</Label>
                  {numInput(annualExpenses, setAnnualExpenses, { min: 0, step: 500 })}
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate: {taxRate}%</Label>
                  <Slider
                    min={10}
                    max={50}
                    step={1}
                    value={[taxRate]}
                    onValueChange={([v]) => setTaxRate(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10%</span>
                    <span>50%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Vacation Days / Year: {vacationDays}</Label>
                  <Slider
                    min={0}
                    max={60}
                    step={1}
                    value={[vacationDays]}
                    onValueChange={([v]) => setVacationDays(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>60</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Billable Hours / Day: {billableHours}</Label>
                  <Slider
                    min={4}
                    max={10}
                    step={0.5}
                    value={[billableHours]}
                    onValueChange={([v]) => setBillableHours(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>4 h</span>
                    <span>10 h</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Working Days / Week: {workDaysPerWeek}</Label>
                  <Slider
                    min={3}
                    max={7}
                    step={1}
                    value={[workDaysPerWeek]}
                    onValueChange={([v]) => setWorkDaysPerWeek(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3</span>
                    <span>7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══════════ RIGHT — Results ═══════════ */}
          <div className="lg:col-span-2 space-y-6">
            {/* ── Primary result cards ── */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="pt-6 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="text-3xl font-bold text-primary">
                    {fmt(results.hourlyRate)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-blue-500/40 bg-blue-500/5">
                <CardContent className="pt-6 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Daily Rate</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {fmt(results.dailyRate)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/40 bg-emerald-500/5">
                <CardContent className="pt-6 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Weekly Rate</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {fmt(results.weeklyRate)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-amber-500/40 bg-amber-500/5">
                <CardContent className="pt-6 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Monthly Target</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {fmt(results.monthlyTarget)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-purple-500/40 bg-purple-500/5 sm:col-span-2">
                <CardContent className="pt-6 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Annual Revenue Needed
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {fmt(results.annualRevenueNeeded)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Income + Expenses + Taxes &middot;{" "}
                    {Math.round(results.workingDays)} billable days &middot;{" "}
                    {Math.round(results.totalBillableHours).toLocaleString()} hours/year
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ── "What if" utilization scenarios ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  What-If Scenarios (Utilization)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Not every working hour is billable. Adjust your rate based on
                  how much of your time you can actually bill.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {scenarios.map((s) => (
                    <div
                      key={s.label}
                      className={cn(
                        "rounded-lg border p-4 text-center space-y-1",
                        s.value === 0.7 && "ring-2 ring-primary"
                      )}
                    >
                      <p className="text-xs text-muted-foreground">
                        {s.description}
                      </p>
                      <p className="font-bold text-lg">{s.label}</p>
                      <p className="text-primary font-semibold">
                        {fmt(s.hourlyRate)}/hr
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {fmt(s.dailyRate)}/day
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Industry comparison ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5 text-indigo-500" />
                  Industry Benchmarks (Hourly, USD)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-48">
                  <Select
                    value={selectedIndustry}
                    onValueChange={setSelectedIndustry}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(industryBenchmarks).map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(() => {
                  const b = industryBenchmarks[selectedIndustry];
                  const yourRate = results.hourlyRate;
                  const max = b.high * 1.15;
                  const pct = (v: number) =>
                    `${Math.min((v / max) * 100, 100)}%`;
                  return (
                    <div className="space-y-3">
                      <div className="relative h-6 rounded-full bg-muted overflow-hidden">
                        {/* range bar */}
                        <div
                          className="absolute top-0 bottom-0 bg-indigo-200 dark:bg-indigo-800 rounded-full"
                          style={{
                            left: pct(b.low),
                            width: `calc(${pct(b.high)} - ${pct(b.low)})`,
                          }}
                        />
                        {/* your rate marker */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-primary rounded-full"
                          style={{ left: pct(yourRate) }}
                          title={`Your rate: ${fmt(yourRate)}`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Low: ${b.low}/hr</span>
                        <span>Mid: ${b.mid}/hr</span>
                        <span>High: ${b.high}/hr</span>
                      </div>
                      <p className="text-sm">
                        Your calculated rate of{" "}
                        <span className="font-semibold text-primary">
                          {fmt(yourRate)}/hr
                        </span>{" "}
                        is{" "}
                        {yourRate < b.low
                          ? "below the typical range. Consider raising your rate."
                          : yourRate <= b.high
                          ? "within the typical range for this field."
                          : "above the typical range — great positioning if your experience supports it."}
                      </p>
                    </div>
                  );
                })()}

                {/* mini table of all industries */}
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Field</th>
                        <th className="text-right px-3 py-2 font-medium">Low</th>
                        <th className="text-right px-3 py-2 font-medium">Mid</th>
                        <th className="text-right px-3 py-2 font-medium">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(industryBenchmarks).map(
                        ([field, { low, mid, high }]) => (
                          <tr
                            key={field}
                            className={cn(
                              "border-t",
                              field === selectedIndustry && "bg-primary/5 font-medium"
                            )}
                          >
                            <td className="px-3 py-2">{field}</td>
                            <td className="text-right px-3 py-2">${low}</td>
                            <td className="text-right px-3 py-2">${mid}</td>
                            <td className="text-right px-3 py-2">${high}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ── Actions ── */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied" : "Copy Results"}
              </Button>
              <Button onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
