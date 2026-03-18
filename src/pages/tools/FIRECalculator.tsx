import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Flame,
  TrendingUp,
  Target,
  Calendar,
  PiggyBank,
  Percent,
  Wallet,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Currency Configuration ---

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: CurrencyConfig[] = [
  { code: "GHS", symbol: "₵", name: "Ghana Cedi" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
];

// --- Types ---

interface FIREInputs {
  currentAge: number;
  annualIncome: number;
  annualExpenses: number;
  currentSavings: number;
  expectedReturn: number;
  safeWithdrawalRate: number;
}

interface GrowthDataPoint {
  year: number;
  age: number;
  portfolio: number;
  contributions: number;
}

// --- Helpers ---

function formatCurrency(value: number, symbol: string): string {
  if (value >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(1)}K`;
  }
  return `${symbol}${value.toLocaleString("en", { maximumFractionDigits: 0 })}`;
}

function formatCurrencyFull(value: number, symbol: string): string {
  return `${symbol}${value.toLocaleString("en", { maximumFractionDigits: 0 })}`;
}

// --- Component ---

const FIRECalculator = () => {
  const [currency, setCurrency] = useState("GHS");
  const [inputs, setInputs] = useState<FIREInputs>({
    currentAge: 30,
    annualIncome: 120000,
    annualExpenses: 60000,
    currentSavings: 50000,
    expectedReturn: 7,
    safeWithdrawalRate: 4,
  });

  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || "₵";

  const update = (field: keyof FIREInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  // --- Calculations ---

  const results = useMemo(() => {
    const {
      currentAge,
      annualIncome,
      annualExpenses,
      currentSavings,
      expectedReturn,
      safeWithdrawalRate,
    } = inputs;

    const fireNumber = annualExpenses / (safeWithdrawalRate / 100);
    const annualSavings = annualIncome - annualExpenses;
    const savingsRate = annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0;
    const monthlyInvestment = annualSavings / 12;
    const monthlyReturn = expectedReturn / 100 / 12;

    // Calculate years to FIRE via simulation
    let portfolio = currentSavings;
    let yearsToFIRE = 0;
    const maxYears = 80;
    const growthData: GrowthDataPoint[] = [];
    let totalContributions = currentSavings;

    growthData.push({
      year: 0,
      age: currentAge,
      portfolio: Math.round(portfolio),
      contributions: Math.round(totalContributions),
    });

    if (annualSavings <= 0) {
      // Can't reach FIRE with zero or negative savings
      for (let y = 1; y <= 40; y++) {
        portfolio = portfolio * (1 + expectedReturn / 100) + annualSavings;
        if (portfolio < 0) portfolio = 0;
        totalContributions += annualSavings;
        growthData.push({
          year: y,
          age: currentAge + y,
          portfolio: Math.round(portfolio),
          contributions: Math.round(Math.max(0, totalContributions)),
        });
      }
      return {
        fireNumber,
        yearsToFIRE: -1,
        retireAtAge: -1,
        savingsRate,
        monthlyInvestment,
        progress: Math.min((currentSavings / fireNumber) * 100, 100),
        growthData,
      };
    }

    for (let y = 1; y <= maxYears; y++) {
      // Compound monthly
      for (let m = 0; m < 12; m++) {
        portfolio = portfolio * (1 + monthlyReturn) + monthlyInvestment;
      }
      totalContributions += annualSavings;

      growthData.push({
        year: y,
        age: currentAge + y,
        portfolio: Math.round(portfolio),
        contributions: Math.round(totalContributions),
      });

      if (portfolio >= fireNumber && yearsToFIRE === 0) {
        yearsToFIRE = y;
      }
    }

    if (yearsToFIRE === 0) yearsToFIRE = -1;

    const retireAtAge = yearsToFIRE > 0 ? currentAge + yearsToFIRE : -1;
    const progress = Math.min((currentSavings / fireNumber) * 100, 100);

    // Trim chart data to a reasonable range
    const chartEnd = yearsToFIRE > 0 ? Math.min(yearsToFIRE + 10, maxYears) : 40;
    const trimmedData = growthData.slice(0, chartEnd + 1);

    return {
      fireNumber,
      yearsToFIRE,
      retireAtAge,
      savingsRate,
      monthlyInvestment,
      progress,
      growthData: trimmedData,
    };
  }, [inputs]);

  // --- Render Helpers ---

  const renderSlider = (
    label: string,
    field: keyof FIREInputs,
    min: number,
    max: number,
    step: number,
    icon: React.ReactNode,
    formatter: (v: number) => string
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </Label>
        <span className="text-sm font-bold text-primary tabular-nums">
          {formatter(inputs[field])}
        </span>
      </div>
      <Slider
        value={[inputs[field]]}
        onValueChange={([v]) => update(field, v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatter(min)}</span>
        <span>{formatter(max)}</span>
      </div>
    </div>
  );

  const StatCard = ({
    title,
    value,
    icon,
    accent,
  }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    accent?: string;
  }) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={cn("text-xl font-bold tabular-nums", accent || "text-foreground")}>
              {value}
            </p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <SEOHead
        title="FIRE Calculator — Financial Independence Retire Early | TechTrendi"
        description="Calculate your Financial Independence, Retire Early (FIRE) number. See how long until you can retire based on your income, expenses, and investment returns."
      />

      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-orange-500 text-sm font-medium">
            <Flame className="h-4 w-4" />
            FIRE Calculator
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Financial Independence, Retire Early
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find out your FIRE number and how many years until you can achieve financial
            independence based on your savings rate and investment returns.
          </p>
        </div>

        {/* Currency Selector */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} — {c.code} ({c.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left Column — Inputs */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderSlider(
                  "Current Age",
                  "currentAge",
                  18,
                  70,
                  1,
                  <Calendar className="h-4 w-4" />,
                  (v) => `${v} yrs`
                )}
                {renderSlider(
                  "Annual Income",
                  "annualIncome",
                  0,
                  1_000_000,
                  5000,
                  <Wallet className="h-4 w-4" />,
                  (v) => formatCurrency(v, currencySymbol)
                )}
                {renderSlider(
                  "Annual Expenses",
                  "annualExpenses",
                  0,
                  1_000_000,
                  5000,
                  <PiggyBank className="h-4 w-4" />,
                  (v) => formatCurrency(v, currencySymbol)
                )}
                {renderSlider(
                  "Current Savings",
                  "currentSavings",
                  0,
                  5_000_000,
                  10000,
                  <Target className="h-4 w-4" />,
                  (v) => formatCurrency(v, currencySymbol)
                )}
                {renderSlider(
                  "Expected Return Rate",
                  "expectedReturn",
                  2,
                  15,
                  0.5,
                  <TrendingUp className="h-4 w-4" />,
                  (v) => `${v}%`
                )}
                {renderSlider(
                  "Safe Withdrawal Rate",
                  "safeWithdrawalRate",
                  2,
                  6,
                  0.25,
                  <Percent className="h-4 w-4" />,
                  (v) => `${v}%`
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column — Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="FIRE Number"
                value={formatCurrencyFull(results.fireNumber, currencySymbol)}
                icon={<Flame className="h-5 w-5" />}
                accent="text-orange-500"
              />
              <StatCard
                title="Years to FIRE"
                value={results.yearsToFIRE > 0 ? `${results.yearsToFIRE} yrs` : "N/A"}
                icon={<Clock className="h-5 w-5" />}
                accent={
                  results.yearsToFIRE > 0 && results.yearsToFIRE <= 15
                    ? "text-green-500"
                    : results.yearsToFIRE > 0
                      ? "text-yellow-500"
                      : "text-red-500"
                }
              />
              <StatCard
                title="Retire At Age"
                value={results.retireAtAge > 0 ? `${results.retireAtAge}` : "N/A"}
                icon={<Calendar className="h-5 w-5" />}
                accent={
                  results.retireAtAge > 0 && results.retireAtAge <= 50
                    ? "text-green-500"
                    : results.retireAtAge > 0
                      ? "text-yellow-500"
                      : "text-red-500"
                }
              />
              <StatCard
                title="Savings Rate"
                value={`${results.savingsRate.toFixed(1)}%`}
                icon={<PiggyBank className="h-5 w-5" />}
                accent={
                  results.savingsRate >= 50
                    ? "text-green-500"
                    : results.savingsRate >= 25
                      ? "text-yellow-500"
                      : "text-red-500"
                }
              />
              <StatCard
                title="Monthly Investment"
                value={formatCurrencyFull(
                  Math.max(0, results.monthlyInvestment),
                  currencySymbol
                )}
                icon={<Wallet className="h-5 w-5" />}
              />
              <StatCard
                title="Current Progress"
                value={`${results.progress.toFixed(1)}%`}
                icon={<Target className="h-5 w-5" />}
                accent={
                  results.progress >= 75
                    ? "text-green-500"
                    : results.progress >= 25
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                }
              />
            </div>

            {/* Progress Bar */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress to FIRE</span>
                  <span className="font-semibold">
                    {formatCurrencyFull(inputs.currentSavings, currencySymbol)} /{" "}
                    {formatCurrencyFull(results.fireNumber, currencySymbol)}
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      results.progress >= 75
                        ? "bg-green-500"
                        : results.progress >= 50
                          ? "bg-yellow-500"
                          : "bg-orange-500"
                    )}
                    style={{ width: `${Math.min(results.progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {results.progress < 100
                    ? `${results.progress.toFixed(1)}% of your FIRE goal reached`
                    : "You've reached your FIRE number!"}
                </p>
              </CardContent>
            </Card>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Portfolio Growth Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={results.growthData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="age"
                        label={{ value: "Age", position: "insideBottom", offset: -2 }}
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tickFormatter={(v: number) => formatCurrency(v, currencySymbol)}
                        tick={{ fontSize: 11 }}
                        width={70}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrencyFull(value, currencySymbol),
                          name === "portfolio" ? "Portfolio" : "Contributions",
                        ]}
                        labelFormatter={(label: number) => `Age ${label}`}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Legend
                        formatter={(value: string) =>
                          value === "portfolio" ? "Portfolio Value" : "Total Contributions"
                        }
                      />
                      <ReferenceLine
                        y={results.fireNumber}
                        stroke="hsl(var(--destructive))"
                        strokeDasharray="6 4"
                        label={{
                          value: `FIRE: ${formatCurrency(results.fireNumber, currencySymbol)}`,
                          position: "right",
                          fill: "hsl(var(--destructive))",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="portfolio"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="contributions"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">FIRE Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Flame className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                    <span>
                      <strong>FIRE Number</strong> = Annual Expenses / Safe Withdrawal Rate. This is
                      the amount you need invested to live off your portfolio.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                    <span>
                      A <strong>savings rate above 50%</strong> dramatically shortens your path to
                      FIRE. Cutting expenses is often more impactful than increasing income.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Percent className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                    <span>
                      The <strong>4% rule</strong> suggests withdrawing 4% of your portfolio
                      annually in retirement. Adjust based on your risk tolerance and local
                      inflation.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="h-4 w-4 mt-0.5 text-purple-500 shrink-0" />
                    <span>
                      Consider <strong>Coast FIRE</strong> (stop contributing once compound growth
                      will carry you) or <strong>Barista FIRE</strong> (part-time work covers
                      expenses while investments grow).
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FIRECalculator;
