import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  PiggyBank,
  Percent,
  Calendar,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// --- Currencies ---

const CURRENCIES = [
  { code: "GHS", symbol: "₵", label: "GHS (₵)" },
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "NGN", symbol: "₦", label: "NGN (₦)" },
  { code: "KES", symbol: "KSh", label: "KES (KSh)" },
  { code: "ZAR", symbol: "R", label: "ZAR (R)" },
] as const;

const compoundingOptions: { label: string; value: number }[] = [
  { label: "Annually", value: 1 },
  { label: "Quarterly", value: 4 },
  { label: "Monthly", value: 12 },
  { label: "Daily", value: 365 },
];

interface ChartDataPoint {
  year: number;
  principal: number;
  interest: number;
  total: number;
}

// --- Component ---

const CompoundInterest = () => {
  const [principal, setPrincipal] = useState(5000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(20);
  const [frequency, setFrequency] = useState("12"); // Monthly default
  const [currency, setCurrency] = useState("GHS");
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || "₵";
  const formatGHS = (value: number): string =>
    `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const n = parseInt(frequency);
  const r = rate / 100;

  const results = useMemo(() => {
    const chartData: ChartDataPoint[] = [];

    for (let t = 1; t <= years; t++) {
      const total = principal * Math.pow(1 + r / n, n * t);
      chartData.push({
        year: t,
        principal,
        interest: parseFloat((total - principal).toFixed(2)),
        total: parseFloat(total.toFixed(2)),
      });
    }

    const finalBalance = principal * Math.pow(1 + r / n, n * years);
    const interestEarned = finalBalance - principal;

    return { chartData, finalBalance, interestEarned };
  }, [principal, rate, years, n, r]);

  const frequencyLabel = compoundingOptions.find(
    (o) => o.value === n
  )?.label?.toLowerCase() ?? "monthly";

  return (
    <Layout>
      <SEOHead
        title="Compound Interest Calculator | TechTrendi"
        description="Calculate how your money grows over time with compound interest. Visualize principal vs interest growth with our free compound interest calculator."
        keywords="compound interest calculator, investment calculator, savings calculator, interest rate calculator"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4" />
              Financial Tool
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Compound Interest Calculator
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See how your money grows over time with the power of compound
              interest.
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

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Controls */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PiggyBank className="w-5 h-5 text-primary" />
                  Investment Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Initial Amount */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      Initial Amount
                    </Label>
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                      {currencySymbol}{principal.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={[principal]}
                    onValueChange={(v) => setPrincipal(v[0])}
                    min={100}
                    max={50000}
                    step={100}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{currencySymbol}100</span>
                    <span>{currencySymbol}50,000</span>
                  </div>
                </div>

                {/* Annual Interest Rate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-muted-foreground" />
                      Annual Interest Rate
                    </Label>
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                      {rate}%
                    </span>
                  </div>
                  <Slider
                    value={[rate]}
                    onValueChange={(v) => setRate(v[0])}
                    min={1}
                    max={30}
                    step={0.5}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1%</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* Time Period */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      Time Period
                    </Label>
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                      {years} {years === 1 ? "year" : "years"}
                    </span>
                  </div>
                  <Slider
                    value={[years]}
                    onValueChange={(v) => setYears(v[0])}
                    min={1}
                    max={40}
                    step={1}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 year</span>
                    <span>40 years</span>
                  </div>
                </div>

                {/* Compounding Frequency */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Compounding Frequency
                  </Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {compoundingOptions.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value.toString()}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-3 space-y-6">
              {/* Summary Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-5 pb-4 px-5">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                      You Invest
                    </p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                      {formatGHS(principal)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                  <CardContent className="pt-5 pb-4 px-5">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                      Interest Earned
                    </p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300">
                      {formatGHS(results.interestEarned)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-5 pb-4 px-5">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                      Final Balance
                    </p>
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                      {formatGHS(results.finalBalance)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Growth Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={results.chartData}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis
                          dataKey="year"
                          tick={{ fontSize: 12 }}
                          label={{
                            value: "Year",
                            position: "insideBottom",
                            offset: -2,
                            fontSize: 12,
                          }}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v: number) =>
                            v >= 1000
                              ? `${(v / 1000).toFixed(0)}k`
                              : v.toString()
                          }
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatGHS(value),
                            name === "principal" ? "Principal" : "Interest",
                          ]}
                          labelFormatter={(label: number) => `Year ${label}`}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            backgroundColor: "hsl(var(--card))",
                            color: "hsl(var(--card-foreground))",
                          }}
                        />
                        <Legend
                          formatter={(value: string) =>
                            value === "principal" ? "Principal" : "Interest"
                          }
                        />
                        <Bar
                          dataKey="principal"
                          stackId="a"
                          fill="#93c5fd"
                          radius={[0, 0, 0, 0]}
                          name="principal"
                        />
                        <Bar
                          dataKey="interest"
                          stackId="a"
                          fill="#4ade80"
                          radius={[4, 4, 0, 0]}
                          name="interest"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Formula */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Formula Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-5 text-center">
                    <p className="text-lg md:text-xl font-mono font-semibold mb-4">
                      A = P &times; (1 + r/n)
                      <sup>(n&times;t)</sup>
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                      <div>
                        <span className="font-semibold text-foreground">P</span>{" "}
                        = Principal
                        <br />
                        <span className="text-xs">
                          {currencySymbol}{principal.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">r</span>{" "}
                        = Annual Rate
                        <br />
                        <span className="text-xs">{rate}%</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">n</span>{" "}
                        = Compounds/Year
                        <br />
                        <span className="text-xs">
                          {n} ({frequencyLabel})
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">t</span>{" "}
                        = Time in Years
                        <br />
                        <span className="text-xs">{years}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CompoundInterest;
