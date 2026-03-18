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
import { Input } from "@/components/ui/input";
import { PiggyBank, Wallet, Target, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
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

const GOALS = [
  { value: "emergency", label: "Emergency Fund", defaultTarget: 6 },
  { value: "house", label: "House Down Payment", defaultTarget: 50000 },
  { value: "education", label: "Education", defaultTarget: 20000 },
  { value: "invest", label: "Investment Portfolio", defaultTarget: 100000 },
  { value: "business", label: "Start a Business", defaultTarget: 30000 },
  { value: "retirement", label: "Retirement", defaultTarget: 500000 },
] as const;

const FRAMEWORKS = [
  { value: "50-30-20", label: "50-30-20 Rule", needs: 50, wants: 30, savings: 20 },
  { value: "70-20-10", label: "70-20-10 Rule", needs: 70, wants: 20, savings: 10 },
  { value: "custom", label: "Custom", needs: 0, wants: 0, savings: 0 },
] as const;

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"];

const fmtFull = (amount: number, symbol: string) =>
  `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function PayYourselfFirst() {
  const [currency, setCurrency] = useState("GHS");
  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₵";

  const [monthlyIncome, setMonthlyIncome] = useState(5000);
  const [savingsTargetPct, setSavingsTargetPct] = useState(20);
  const [savingsGoal, setSavingsGoal] = useState("emergency");
  const [goalAmount, setGoalAmount] = useState(30000);
  const [framework, setFramework] = useState("50-30-20");

  const selectedFramework = FRAMEWORKS.find((f) => f.value === framework) ?? FRAMEWORKS[0];

  const results = useMemo(() => {
    const savingsAmount = Math.round(monthlyIncome * (savingsTargetPct / 100));
    const remaining = monthlyIncome - savingsAmount;

    // Allocation breakdown
    let needsAmount: number;
    let wantsAmount: number;

    if (framework === "custom") {
      // In custom mode, savings % is user-defined, rest split roughly 70/30
      needsAmount = Math.round(remaining * 0.65);
      wantsAmount = remaining - needsAmount;
    } else {
      // Use framework ratios for needs/wants, override savings with user slider
      const nonSavingsRatio = selectedFramework.needs + selectedFramework.wants;
      needsAmount = Math.round(remaining * (selectedFramework.needs / nonSavingsRatio));
      wantsAmount = remaining - needsAmount;
    }

    const allocations = [
      { name: "Savings First", amount: savingsAmount, color: PIE_COLORS[0] },
      { name: "Needs", amount: needsAmount, color: PIE_COLORS[1] },
      { name: "Wants", amount: wantsAmount, color: PIE_COLORS[2] },
    ];

    // Time to reach goal
    let targetAmount = goalAmount;
    if (savingsGoal === "emergency") {
      // Emergency fund = 6 months of expenses (needs + wants)
      targetAmount = (needsAmount + wantsAmount) * 6;
    }

    const monthsToGoal = savingsAmount > 0 ? Math.ceil(targetAmount / savingsAmount) : Infinity;
    const yearsToGoal = monthsToGoal / 12;

    return {
      savingsAmount,
      needsAmount,
      wantsAmount,
      allocations,
      targetAmount,
      monthsToGoal,
      yearsToGoal,
    };
  }, [monthlyIncome, savingsTargetPct, savingsGoal, goalAmount, framework, selectedFramework]);

  return (
    <Layout>
      <SEOHead
        title="Pay Yourself First Budget Tool | TechTrendi Tools"
        description="Use the pay-yourself-first strategy to prioritize savings. Calculate your allocations and see how fast you'll reach your goals."
      />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Pay Yourself First</h1>
          <p className="mt-2 text-muted-foreground">
            Save first, spend what's left -- the simplest budgeting strategy that works
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

        {/* Hero savings card */}
        <Card className="mb-8 border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30">
          <CardContent className="flex flex-col items-center gap-2 py-8">
            <PiggyBank className="h-10 w-10 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Transfer this on payday
            </p>
            <p className="text-5xl font-bold text-emerald-700 dark:text-emerald-300">
              {fmtFull(results.savingsAmount, sym)}
            </p>
            <p className="text-muted-foreground">
              {savingsTargetPct}% of your {fmtFull(monthlyIncome, sym)} income
            </p>
          </CardContent>
        </Card>

        {/* Inputs */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Income & Savings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-sm">Monthly Income</Label>
                  <span className="text-sm font-medium">{fmtFull(monthlyIncome, sym)}</span>
                </div>
                <Slider
                  value={[monthlyIncome]}
                  min={500}
                  max={30000}
                  step={100}
                  onValueChange={([v]) => setMonthlyIncome(v)}
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-sm">Savings Target</Label>
                  <span className="text-sm font-medium">{savingsTargetPct}%</span>
                </div>
                <Slider
                  value={[savingsTargetPct]}
                  min={5}
                  max={50}
                  step={1}
                  onValueChange={([v]) => setSavingsTargetPct(v)}
                />
              </div>

              <div>
                <Label className="mb-1 block text-sm">Spending Framework</Label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" /> Savings Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="mb-1 block text-sm">Goal Type</Label>
                <Select value={savingsGoal} onValueChange={setSavingsGoal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {savingsGoal !== "emergency" && (
                <div>
                  <Label className="mb-1 block text-sm">Goal Amount</Label>
                  <Input
                    type="number"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(Number(e.target.value) || 0)}
                    placeholder="Enter target amount"
                  />
                </div>
              )}

              <Card className="bg-muted/50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Target: {fmtFull(results.targetAmount, sym)}
                        {savingsGoal === "emergency" && " (6 months expenses)"}
                      </p>
                      <p className="text-lg font-bold">
                        {results.monthsToGoal === Infinity
                          ? "N/A"
                          : results.monthsToGoal <= 12
                          ? `${results.monthsToGoal} months`
                          : `${results.yearsToGoal.toFixed(1)} years (${results.monthsToGoal} months)`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Allocation breakdown + pie chart */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Allocation rows */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Allocation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.allocations.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: a.color }}
                    />
                    <span className="font-medium">{a.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{fmtFull(a.amount, sym)}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((a.amount / monthlyIncome) * 100)}%
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="font-medium">Total</span>
                <span className="font-bold">{fmtFull(monthlyIncome, sym)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pie chart */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={results.allocations}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {results.allocations.map((a, i) => (
                        <Cell key={i} fill={a.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        fmtFull(value, sym),
                        name,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payday flow */}
        <Card className="mb-8 bg-emerald-50/50 dark:bg-emerald-950/10">
          <CardContent className="py-6">
            <h3 className="mb-3 text-center font-semibold">Your Payday Flow</h3>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <Badge variant="outline" className="text-base">
                Paycheck arrives
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge className="bg-emerald-600 text-base">
                Save {fmtFull(results.savingsAmount, sym)}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-base">
                Needs {fmtFull(results.needsAmount, sym)}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-base">
                Wants {fmtFull(results.wantsAmount, sym)}
              </Badge>
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
                <strong>Pay yourself first:</strong> As soon as your salary hits your account, move
                your savings to a separate account before you spend anything. This removes willpower
                from the equation.
              </li>
              <li>
                <strong>The 50-30-20 rule:</strong> A popular framework where 50% goes to needs
                (rent, food, transport), 30% to wants (entertainment, dining out), and 20% to savings
                and debt repayment. Adjust the percentages to fit your situation.
              </li>
              <li>
                <strong>Automate your savings:</strong> Set up a standing order to transfer your
                savings amount on the same day your salary arrives. What you don't see, you don't
                spend.
              </li>
              <li>
                <strong>Start small, increase gradually:</strong> Even 5% is better than nothing. Try
                increasing your savings rate by 1-2% every few months. You'll barely notice the
                difference in spending but the savings compound significantly.
              </li>
              <li>
                <strong>Emergency fund first:</strong> Before investing or saving for big goals, build
                3-6 months of essential expenses as an emergency cushion. This prevents you from
                dipping into investments when life happens.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
