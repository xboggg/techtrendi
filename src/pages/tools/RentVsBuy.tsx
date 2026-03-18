import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Building2, TrendingUp, TrendingDown, Scale, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CURRENCIES = [
  { code: "GHS", symbol: "₵", label: "GHS (₵)" },
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "NGN", symbol: "₦", label: "NGN (₦)" },
  { code: "KES", symbol: "KSh", label: "KES (KSh)" },
  { code: "ZAR", symbol: "R", label: "ZAR (R)" },
] as const;

const fmt = (amount: number, symbol: string) => {
  if (Math.abs(amount) >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  }
  return `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const fmtFull = (amount: number, symbol: string) =>
  `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function RentVsBuy() {
  const [currency, setCurrency] = useState("GHS");
  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₵";

  // Buying inputs
  const [homePrice, setHomePrice] = useState(300000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(15);
  const [loanTerm, setLoanTerm] = useState(20);
  const [appreciation, setAppreciation] = useState(5);

  // Renting inputs
  const [monthlyRent, setMonthlyRent] = useState(2000);
  const [rentIncrease, setRentIncrease] = useState(8);
  const [investmentReturn, setInvestmentReturn] = useState(12);
  const [yearsToCompare, setYearsToCompare] = useState(15);

  const results = useMemo(() => {
    const downPayment = homePrice * (downPaymentPct / 100);
    const loanAmount = homePrice - downPayment;
    const monthlyRate = mortgageRate / 100 / 12;
    const totalPayments = loanTerm * 12;

    // Monthly mortgage payment (PMT formula)
    const monthlyPayment =
      monthlyRate > 0
        ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1)
        : loanAmount / totalPayments;

    // Maintenance 1% + property tax 0.5% of home value annually
    const annualMaintenanceRate = 0.01;
    const annualPropertyTaxRate = 0.005;

    // Build year-by-year data
    const chartData: { year: number; buyNetWorth: number; rentNetWorth: number }[] = [];

    let totalBuyCost = downPayment;
    let remainingBalance = loanAmount;
    let homeValue = homePrice;

    let totalRentCost = 0;
    let rentInvestmentPortfolio = downPayment; // renter invests the down payment
    let currentRent = monthlyRent;

    for (let year = 1; year <= yearsToCompare; year++) {
      // Buy side for this year
      const yearlyMortgage = year <= loanTerm ? monthlyPayment * 12 : 0;
      const maintenance = homeValue * annualMaintenanceRate;
      const propertyTax = homeValue * annualPropertyTaxRate;
      totalBuyCost += yearlyMortgage + maintenance + propertyTax;

      // Remaining balance after this year's payments
      if (year <= loanTerm) {
        for (let m = 0; m < 12; m++) {
          const interestPortion = remainingBalance * monthlyRate;
          const principalPortion = monthlyPayment - interestPortion;
          remainingBalance = Math.max(0, remainingBalance - principalPortion);
        }
      }

      homeValue *= 1 + appreciation / 100;
      const buyEquity = homeValue - remainingBalance;

      // Rent side for this year
      const yearlyRent = currentRent * 12;
      totalRentCost += yearlyRent;

      // Renter invests difference (mortgage + maintenance + tax - rent)
      const buyMonthlyTotal = (yearlyMortgage + maintenance + propertyTax) / 12;
      const monthlySavings = buyMonthlyTotal - currentRent;
      if (monthlySavings > 0) {
        // Add monthly savings to portfolio
        for (let m = 0; m < 12; m++) {
          rentInvestmentPortfolio *= 1 + investmentReturn / 100 / 12;
          rentInvestmentPortfolio += monthlySavings;
        }
      } else {
        // Renter pays more, just grow existing portfolio
        rentInvestmentPortfolio *= 1 + investmentReturn / 100;
      }

      currentRent *= 1 + rentIncrease / 100;

      chartData.push({
        year,
        buyNetWorth: Math.round(buyEquity),
        rentNetWorth: Math.round(rentInvestmentPortfolio),
      });
    }

    const finalBuyNetWorth = chartData[chartData.length - 1]?.buyNetWorth ?? 0;
    const finalRentNetWorth = chartData[chartData.length - 1]?.rentNetWorth ?? 0;
    const buyWins = finalBuyNetWorth > finalRentNetWorth;

    return {
      monthlyPayment,
      totalBuyCost,
      totalRentCost,
      homeValue,
      remainingBalance: Math.max(0, remainingBalance),
      finalBuyNetWorth,
      finalRentNetWorth,
      buyWins,
      chartData,
    };
  }, [
    homePrice, downPaymentPct, mortgageRate, loanTerm, appreciation,
    monthlyRent, rentIncrease, investmentReturn, yearsToCompare,
  ]);

  return (
    <Layout>
      <SEOHead
        title="Rent vs Buy Calculator | TechTrendi Tools"
        description="Should you rent or buy a home? Compare costs, net worth, and opportunity cost over time with our interactive calculator."
      />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Rent vs Buy Calculator</h1>
          <p className="mt-2 text-muted-foreground">
            Compare the true cost of renting versus buying over time
          </p>
        </div>

        {/* Currency selector */}
        <div className="mb-6 flex justify-end">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Verdict banner */}
        <Card
          className={cn(
            "mb-8 border-2",
            results.buyWins
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
              : "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          )}
        >
          <CardContent className="flex flex-col items-center gap-2 py-6">
            <Scale className="h-8 w-8" />
            <h2 className="text-2xl font-bold">
              {results.buyWins ? "Buying wins!" : "Renting wins!"} after {yearsToCompare} years
            </h2>
            <p className="text-muted-foreground">
              Net worth difference:{" "}
              <span className="font-semibold">
                {fmtFull(Math.abs(results.finalBuyNetWorth - results.finalRentNetWorth), sym)}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Input panels */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Buying side */}
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Home className="h-5 w-5" /> Buying
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <SliderField
                label="Home Price"
                value={homePrice}
                min={50000}
                max={2000000}
                step={10000}
                display={fmtFull(homePrice, sym)}
                onChange={setHomePrice}
              />
              <SliderField
                label="Down Payment"
                value={downPaymentPct}
                min={5}
                max={50}
                step={1}
                display={`${downPaymentPct}% (${fmtFull(homePrice * downPaymentPct / 100, sym)})`}
                onChange={setDownPaymentPct}
              />
              <SliderField
                label="Mortgage Rate"
                value={mortgageRate}
                min={8}
                max={30}
                step={0.5}
                display={`${mortgageRate}%`}
                onChange={setMortgageRate}
              />
              <SliderField
                label="Loan Term"
                value={loanTerm}
                min={5}
                max={30}
                step={1}
                display={`${loanTerm} years`}
                onChange={setLoanTerm}
              />
              <SliderField
                label="Annual Appreciation"
                value={appreciation}
                min={0}
                max={15}
                step={0.5}
                display={`${appreciation}%`}
                onChange={setAppreciation}
              />
            </CardContent>
          </Card>

          {/* Renting side */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Building2 className="h-5 w-5" /> Renting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <SliderField
                label="Monthly Rent"
                value={monthlyRent}
                min={500}
                max={10000}
                step={100}
                display={fmtFull(monthlyRent, sym)}
                onChange={setMonthlyRent}
              />
              <SliderField
                label="Annual Rent Increase"
                value={rentIncrease}
                min={0}
                max={20}
                step={1}
                display={`${rentIncrease}%`}
                onChange={setRentIncrease}
              />
              <SliderField
                label="Investment Return (saved capital)"
                value={investmentReturn}
                min={0}
                max={25}
                step={0.5}
                display={`${investmentReturn}%`}
                onChange={setInvestmentReturn}
              />
              <SliderField
                label="Years to Compare"
                value={yearsToCompare}
                min={5}
                max={30}
                step={1}
                display={`${yearsToCompare} years`}
                onChange={setYearsToCompare}
              />
            </CardContent>
          </Card>
        </div>

        {/* Comparison cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Buy Cost"
            value={fmt(results.totalBuyCost, sym)}
            icon={<TrendingDown className="h-5 w-5 text-red-500" />}
            sub="Including mortgage, tax, maintenance"
          />
          <MetricCard
            label="Total Rent Cost"
            value={fmt(results.totalRentCost, sym)}
            icon={<TrendingDown className="h-5 w-5 text-red-500" />}
            sub={`Over ${yearsToCompare} years`}
          />
          <MetricCard
            label="Buy Net Worth"
            value={fmt(results.finalBuyNetWorth, sym)}
            icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
            sub="Home equity after appreciation"
            highlight={results.buyWins}
          />
          <MetricCard
            label="Rent Net Worth"
            value={fmt(results.finalRentNetWorth, sym)}
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            sub="Investment portfolio value"
            highlight={!results.buyWins}
          />
        </div>

        {/* Monthly payment & home value */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Monthly Mortgage Payment</p>
              <p className="text-2xl font-bold">{fmtFull(Math.round(results.monthlyPayment), sym)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Home Value (Year {yearsToCompare})</p>
              <p className="text-2xl font-bold">{fmt(Math.round(results.homeValue), sym)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Remaining Loan Balance</p>
              <p className="text-2xl font-bold">
                {yearsToCompare >= loanTerm
                  ? `${sym}0`
                  : fmt(Math.round(results.remainingBalance), sym)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Net Worth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                  <YAxis tickFormatter={(v: number) => fmt(v, sym)} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      fmtFull(value, sym),
                      name === "buyNetWorth" ? "Buy Net Worth" : "Rent Net Worth",
                    ]}
                    labelFormatter={(l) => `Year ${l}`}
                  />
                  <Legend formatter={(v) => (v === "buyNetWorth" ? "Buy Net Worth" : "Rent Net Worth")} />
                  <Line
                    type="monotone"
                    dataKey="buyNetWorth"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rentNetWorth"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" /> How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <strong>Opportunity cost matters:</strong> The down payment you use to buy a house could
                be invested instead. This calculator compares both paths fairly by tracking the renter's
                investment portfolio.
              </li>
              <li>
                <strong>Mortgage rates matter more in Africa:</strong> With rates often above 15%, a huge
                portion of your payment goes to interest. Even a 2% rate reduction can save you hundreds
                of thousands over the loan term.
              </li>
              <li>
                <strong>The 5-year rule:</strong> Buying usually only makes sense if you plan to stay at
                least 5 years. Transaction costs (legal fees, agent commissions) eat into your equity if
                you sell too soon.
              </li>
              <li>
                <strong>Hidden costs of ownership:</strong> This calculator includes 1% annual
                maintenance and 0.5% property tax. In reality, repairs, insurance, and renovations can
                push costs higher.
              </li>
              <li>
                <strong>Rent increases erode savings:</strong> If your rent climbs 8-10% per year (common
                in many African cities), renting becomes very expensive over time, often tipping the
                scales toward buying.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function SliderField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-medium">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(highlight && "ring-2 ring-primary")}>
      <CardContent className="py-4">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        {highlight && <Badge className="mt-2">Winner</Badge>}
      </CardContent>
    </Card>
  );
}
