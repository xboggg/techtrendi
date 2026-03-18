import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Label } from "@/components/ui/label";
import { DollarSign, Percent, Calendar, TrendingDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = [
  { code: "GHS", symbol: "₵", label: "GHS (₵)" },
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "NGN", symbol: "₦", label: "NGN (₦)" },
  { code: "KES", symbol: "KSh", label: "KES (KSh)" },
  { code: "ZAR", symbol: "R", label: "ZAR (R)" },
] as const;
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- Types ---

interface AmortizationYear {
  year: number;
  principal: number;
  interest: number;
  balance: number;
}

interface LoanResults {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortization: AmortizationYear[];
}

// --- Calculation ---

function calculateLoan(
  principal: number,
  annualRate: number,
  termYears: number
): LoanResults {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = termYears * 12;

  let monthlyPayment = 0;
  if (monthlyRate > 0 && totalMonths > 0 && principal > 0) {
    monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  } else if (monthlyRate === 0 && totalMonths > 0) {
    monthlyPayment = principal / totalMonths;
  }

  const totalPayment = monthlyPayment * totalMonths;
  const totalInterest = totalPayment - principal;

  // Build yearly amortization
  const amortization: AmortizationYear[] = [];
  let balance = principal;

  for (let year = 1; year <= termYears; year++) {
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(
        monthlyPayment - interestPayment,
        balance
      );
      yearInterest += interestPayment;
      yearPrincipal += principalPayment;
      balance -= principalPayment;
    }

    amortization.push({
      year,
      principal: Math.round(yearPrincipal),
      interest: Math.round(yearInterest),
      balance: Math.max(0, Math.round(balance)),
    });
  }

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    amortization,
  };
}

// --- Helpers ---

// These will be replaced by instance methods that use the currency state
function formatCurrency(value: number, sym = "$"): string {
  return `${sym}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatCompact(value: number, sym = "$"): string {
  if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${sym}${(value / 1_000).toFixed(0)}K`;
  return `${sym}${value.toFixed(0)}`;
}

// --- Chart colors ---

const COLORS = {
  principal: "#3b82f6",
  interest: "#f97316",
};

// --- Component ---

const LoanCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(250000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [termYears, setTermYears] = useState(30);
  const [currency, setCurrency] = useState("GHS");
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || "₵";

  const fmt = (v: number) => formatCurrency(v, currencySymbol);
  const fmtC = (v: number) => formatCompact(v, currencySymbol);

  const results = useMemo(
    () => calculateLoan(loanAmount, interestRate, termYears),
    [loanAmount, interestRate, termYears]
  );

  const pieData = [
    { name: "Principal", value: Math.round(loanAmount) },
    { name: "Interest", value: Math.max(0, Math.round(results.totalInterest)) },
  ];

  return (
    <Layout>
      <SEOHead
        title="Loan Calculator - Calculate Monthly Payments & Amortization | TechTrendi"
        description="Free online loan calculator with amortization schedule. Calculate monthly payments, total interest, and visualize your loan breakdown with interactive charts."
        keywords="loan calculator, mortgage calculator, amortization schedule, monthly payment calculator, interest calculator, loan payment"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <DollarSign className="w-4 h-4" />
              Financial Tool
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Loan Calculator
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Calculate your monthly payments, total interest, and view a full
              amortization schedule with interactive charts.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Label className="text-sm text-muted-foreground">Currency:</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[130px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main grid: inputs + results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left: Sliders */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Loan Amount */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      Loan Amount
                    </Label>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {fmt(loanAmount)}
                    </span>
                  </div>
                  <Slider
                    value={[loanAmount]}
                    onValueChange={([v]) => setLoanAmount(v)}
                    min={1000}
                    max={1000000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>$1,000</span>
                    <span>$1,000,000</span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-gray-500" />
                      Annual Interest Rate
                    </Label>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {interestRate.toFixed(1)}%
                    </span>
                  </div>
                  <Slider
                    value={[interestRate]}
                    onValueChange={([v]) => setInterestRate(v)}
                    min={0.5}
                    max={20}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0.5%</span>
                    <span>20%</span>
                  </div>
                </div>

                {/* Loan Term */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      Loan Term
                    </Label>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {termYears} {termYears === 1 ? "year" : "years"}
                    </span>
                  </div>
                  <Slider
                    value={[termYears]}
                    onValueChange={([v]) => setTermYears(v)}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>1 year</span>
                    <span>30 years</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Results + Pie */}
            <div className="space-y-6">
              {/* Result cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-lg bg-blue-600 text-white">
                  <CardContent className="p-5 text-center">
                    <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">
                      Monthly Payment
                    </p>
                    <p className="text-2xl md:text-3xl font-bold">
                      {fmt(results.monthlyPayment)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-5 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Total Payment
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      {fmt(results.totalPayment)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-5 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Total Interest
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {fmt(results.totalInterest)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pie Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-blue-500" />
                    Principal vs Interest
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          <Cell fill={COLORS.principal} />
                          <Cell fill={COLORS.interest} />
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          formatter={(value: string) => (
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Principal: {fmt(loanAmount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Interest: {fmt(results.totalInterest)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Amortization section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stacked Bar Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  Yearly Amortization Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={results.amortization}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) =>
                          termYears > 15 && v % 2 !== 0 ? "" : `${v}`
                        }
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => fmtC(v)}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          fmt(value),
                          name.charAt(0).toUpperCase() + name.slice(1),
                        ]}
                        labelFormatter={(label) => `Year ${label}`}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend
                        formatter={(value: string) => (
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {value}
                          </span>
                        )}
                      />
                      <Bar
                        dataKey="principal"
                        stackId="a"
                        fill={COLORS.principal}
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="interest"
                        stackId="a"
                        fill={COLORS.interest}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Amortization Table */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  Amortization Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">
                          Year
                        </th>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">
                          Principal
                        </th>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">
                          Interest
                        </th>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {results.amortization.map((row) => (
                        <tr
                          key={row.year}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                            {row.year}
                          </td>
                          <td className="px-4 py-2.5 text-right text-blue-600 dark:text-blue-400">
                            {fmt(row.principal)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-orange-600 dark:text-orange-400">
                            {fmt(row.interest)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300">
                            {fmt(row.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoanCalculator;
