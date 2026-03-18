import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Plus,
  Trash2,
  Lightbulb,
  Wallet,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
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

const MONTHS = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"];
const SAVINGS_OPTIONS = ["5", "10", "20", "30"];

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

const fmtFull = (amount: number, symbol: string) =>
  `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export default function VariableIncomeBudget() {
  const [currency, setCurrency] = useState("GHS");
  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₵";

  const [incomeHistory, setIncomeHistory] = useState<number[]>([3000, 4500, 2800, 5200, 3100, 4000]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
    { id: uid(), name: "Rent", amount: 1200 },
    { id: uid(), name: "Utilities", amount: 200 },
    { id: uid(), name: "Transport", amount: 150 },
    { id: uid(), name: "Food", amount: 500 },
  ]);
  const [savingsTargetPct, setSavingsTargetPct] = useState("10");

  const updateIncome = (index: number, value: number) => {
    setIncomeHistory((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addExpense = () => {
    setFixedExpenses((prev) => [...prev, { id: uid(), name: "", amount: 0 }]);
  };

  const removeExpense = (id: string) => {
    if (fixedExpenses.length <= 1) {
      toast.error("You need at least one fixed expense.");
      return;
    }
    setFixedExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const updateExpense = (id: string, field: "name" | "amount", value: string | number) => {
    setFixedExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const results = useMemo(() => {
    const validIncomes = incomeHistory.filter((i) => i > 0);
    if (validIncomes.length === 0) {
      return null;
    }

    const avgIncome = Math.round(validIncomes.reduce((a, b) => a + b, 0) / validIncomes.length);
    const lowestMonth = Math.min(...validIncomes);
    const highestMonth = Math.max(...validIncomes);
    const baselineBudget = Math.round(lowestMonth * 0.9);

    const totalFixed = fixedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const savingsPct = parseInt(savingsTargetPct) / 100;
    const savingsAmount = Math.round(baselineBudget * savingsPct);
    const availableAfterSavings = baselineBudget - savingsAmount;
    const surplusShortfall = availableAfterSavings - totalFixed;

    const emergencyTarget = totalFixed * 6;
    const monthsToEmergency =
      savingsAmount > 0 ? Math.ceil(emergencyTarget / savingsAmount) : Infinity;

    // Good month bonus allocation (income above baseline)
    const avgSurplus = Math.max(0, avgIncome - baselineBudget);
    const bonusSavings = Math.round(avgSurplus * 0.5);
    const bonusSinking = Math.round(avgSurplus * 0.3);
    const bonusLifestyle = Math.round(avgSurplus * 0.2);

    // Chart data
    const chartData = incomeHistory.map((income, i) => ({
      month: MONTHS[i],
      income,
      baseline: baselineBudget,
    }));

    return {
      avgIncome,
      lowestMonth,
      highestMonth,
      baselineBudget,
      totalFixed,
      savingsAmount,
      surplusShortfall,
      emergencyTarget,
      monthsToEmergency,
      avgSurplus,
      bonusSavings,
      bonusSinking,
      bonusLifestyle,
      chartData,
    };
  }, [incomeHistory, fixedExpenses, savingsTargetPct]);

  return (
    <Layout>
      <SEOHead
        title="Variable Income Budget Planner | TechTrendi Tools"
        description="Budget planner for freelancers and gig workers. Plan based on your lowest month, build an emergency fund, and handle income swings."
      />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Variable Income Budget Planner</h1>
          <p className="mt-2 text-muted-foreground">
            For freelancers, gig workers, and anyone with irregular income
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

        {/* Baseline budget hero */}
        {results && (
          <Card className="mb-8 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardContent className="flex flex-col items-center gap-2 py-8">
              <Shield className="h-10 w-10 text-blue-600" />
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Your Baseline Monthly Budget
              </p>
              <p className="text-5xl font-bold text-blue-700 dark:text-blue-300">
                {fmtFull(results.baselineBudget, sym)}
              </p>
              <p className="text-muted-foreground">
                90% of your lowest month ({fmtFull(results.lowestMonth, sym)})
              </p>
            </CardContent>
          </Card>
        )}

        {/* Inputs */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Income history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Income History (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MONTHS.map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Label className="w-20 shrink-0 text-sm">{label}</Label>
                  <Input
                    type="number"
                    value={incomeHistory[i] || ""}
                    onChange={(e) => updateIncome(i, Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Fixed expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" /> Fixed Expenses
                </span>
                <Button size="sm" variant="outline" onClick={addExpense}>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fixedExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center gap-2">
                  <Input
                    value={exp.name}
                    onChange={(e) => updateExpense(exp.id, "name", e.target.value)}
                    placeholder="Expense name"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={exp.amount || ""}
                    onChange={(e) =>
                      updateExpense(exp.id, "amount", Number(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="w-28"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeExpense(exp.id)}
                    className="shrink-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {results && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="font-medium">Total Fixed Expenses</span>
                  <span className="font-bold">{fmtFull(results.totalFixed, sym)}</span>
                </div>
              )}

              <div>
                <Label className="mb-1 block text-sm">Savings Target %</Label>
                <Select value={savingsTargetPct} onValueChange={setSavingsTargetPct}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SAVINGS_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {results && (
          <>
            {/* Metric cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Average Income"
                value={fmtFull(results.avgIncome, sym)}
                icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
                sub={`Range: ${fmtFull(results.lowestMonth, sym)} - ${fmtFull(results.highestMonth, sym)}`}
              />
              <MetricCard
                label="Monthly Savings"
                value={fmtFull(results.savingsAmount, sym)}
                icon={<PiggyBank className="h-5 w-5 text-emerald-500" />}
                sub={`${savingsTargetPct}% of baseline`}
              />
              <MetricCard
                label="After Fixed Expenses"
                value={fmtFull(results.surplusShortfall, sym)}
                icon={
                  results.surplusShortfall >= 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )
                }
                sub={results.surplusShortfall >= 0 ? "Surplus" : "Shortfall -- reduce expenses"}
                alert={results.surplusShortfall < 0}
              />
              <MetricCard
                label="Emergency Fund Target"
                value={fmtFull(results.emergencyTarget, sym)}
                icon={<Shield className="h-5 w-5 text-amber-500" />}
                sub={
                  results.monthsToEmergency === Infinity
                    ? "N/A"
                    : `${results.monthsToEmergency} months to reach`
                }
              />
            </div>

            {/* Allocation breakdown */}
            <div className="mb-8 grid gap-6 md:grid-cols-2">
              {/* Baseline allocation */}
              <Card>
                <CardHeader>
                  <CardTitle>Baseline Month Allocation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AllocationRow
                    label="Savings"
                    amount={results.savingsAmount}
                    sym={sym}
                    color="bg-emerald-500"
                  />
                  <AllocationRow
                    label="Fixed Expenses"
                    amount={results.totalFixed}
                    sym={sym}
                    color="bg-blue-500"
                  />
                  <AllocationRow
                    label={results.surplusShortfall >= 0 ? "Flexible Spending" : "Shortfall"}
                    amount={Math.abs(results.surplusShortfall)}
                    sym={sym}
                    color={results.surplusShortfall >= 0 ? "bg-amber-500" : "bg-red-500"}
                    negative={results.surplusShortfall < 0}
                  />
                </CardContent>
              </Card>

              {/* Good month bonus */}
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="h-5 w-5" /> Good Month Bonus Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    When you earn above baseline, allocate the surplus:
                  </p>
                  {results.avgSurplus > 0 ? (
                    <div className="space-y-3">
                      <AllocationRow
                        label="50% Extra Savings"
                        amount={results.bonusSavings}
                        sym={sym}
                        color="bg-emerald-500"
                      />
                      <AllocationRow
                        label="30% Sinking Fund"
                        amount={results.bonusSinking}
                        sym={sym}
                        color="bg-purple-500"
                      />
                      <AllocationRow
                        label="20% Lifestyle"
                        amount={results.bonusLifestyle}
                        sym={sym}
                        color="bg-pink-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Average surplus: {fmtFull(results.avgSurplus, sym)}/month
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your baseline equals or exceeds your average income. Consider reducing
                      expenses.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Income history chart */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Income History vs Baseline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v: number) => fmtFull(v, sym)} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          fmtFull(value, sym),
                          name === "income" ? "Income" : "Baseline",
                        ]}
                      />
                      <Legend formatter={(v) => (v === "income" ? "Income" : "Baseline")} />
                      <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <ReferenceLine
                        y={results.baselineBudget}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        label={{ value: "Baseline", position: "right" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Emergency fund progress box */}
            <Card className="mb-8 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/10">
              <CardContent className="py-6">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
                  <div>
                    <h3 className="font-semibold">Emergency Fund</h3>
                    <p className="text-sm text-muted-foreground">
                      Target: <strong>{fmtFull(results.emergencyTarget, sym)}</strong> (6 months of
                      fixed expenses)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      At {fmtFull(results.savingsAmount, sym)}/month, you'll reach this in{" "}
                      <strong>
                        {results.monthsToEmergency === Infinity
                          ? "N/A -- increase savings"
                          : `${results.monthsToEmergency} months (${(results.monthsToEmergency / 12).toFixed(1)} years)`}
                      </strong>
                    </p>
                    {results.surplusShortfall < 0 && (
                      <p className="mt-2 text-sm font-medium text-red-600">
                        Warning: Your fixed expenses exceed your baseline budget after savings. Reduce
                        expenses or lower your savings target.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" /> Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <strong>Budget off your lowest month:</strong> Freelancers should base their budget on
                90% of the lowest income month from the past 6 months. This ensures you can always
                cover essentials, even in lean months.
              </li>
              <li>
                <strong>Sinking funds:</strong> Set aside money each month for irregular expenses
                (annual insurance, car repairs, holidays). This prevents "surprise" bills from
                derailing your budget.
              </li>
              <li>
                <strong>Handle windfalls wisely:</strong> When you have a great month, don't inflate
                your lifestyle. Follow the 50/30/20 bonus rule: 50% extra savings, 30% sinking fund,
                20% lifestyle reward.
              </li>
              <li>
                <strong>Emergency fund is critical:</strong> With irregular income, aim for 6 months
                of expenses (not income). This buffer is your safety net during dry spells.
              </li>
              <li>
                <strong>Track and adjust:</strong> Update your income history monthly. If your lowest
                month keeps climbing, you can gradually increase your baseline budget and quality of
                life.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon,
  sub,
  alert,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub: string;
  alert?: boolean;
}) {
  return (
    <Card className={cn(alert && "border-red-300 dark:border-red-800")}>
      <CardContent className="py-4">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <p className={cn("mt-1 text-2xl font-bold", alert && "text-red-600")}>{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function AllocationRow({
  label,
  amount,
  sym,
  color,
  negative,
}: {
  label: string;
  amount: number;
  sym: string;
  color: string;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className={cn("h-3 w-3 rounded-full", color)} />
        <span className="font-medium">{label}</span>
      </div>
      <span className={cn("font-bold", negative && "text-red-600")}>
        {negative && "-"}
        {fmtFull(amount, sym)}
      </span>
    </div>
  );
}
