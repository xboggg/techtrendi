import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Plus,
  Trash2,
  DollarSign,
  TrendingDown,
  PiggyBank,
  BarChart3,
  Home,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  Film,
  Landmark,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Category {
  id: string;
  label: string;
  budget: number;
  icon: React.ElementType;
  color: string;
  barColor: string;
}

interface Transaction {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
}

const defaultCategories: Category[] = [
  { id: "housing", label: "Housing", budget: 1500, icon: Home, color: "bg-blue-500", barColor: "#3b82f6" },
  { id: "food", label: "Food", budget: 600, icon: Utensils, color: "bg-orange-500", barColor: "#f97316" },
  { id: "transport", label: "Transport", budget: 300, icon: Car, color: "bg-green-500", barColor: "#22c55e" },
  { id: "utilities", label: "Utilities", budget: 200, icon: Zap, color: "bg-yellow-500", barColor: "#eab308" },
  { id: "healthcare", label: "Healthcare", budget: 150, icon: HeartPulse, color: "bg-red-500", barColor: "#ef4444" },
  { id: "entertainment", label: "Entertainment", budget: 200, icon: Film, color: "bg-purple-500", barColor: "#a855f7" },
  { id: "savings", label: "Savings", budget: 500, icon: Landmark, color: "bg-cyan-500", barColor: "#06b6d4" },
  { id: "other", label: "Other", budget: 250, icon: MoreHorizontal, color: "bg-slate-500", barColor: "#64748b" },
];

const defaultTransactions: Transaction[] = [
  { id: "1", categoryId: "housing", description: "Rent", amount: 1500 },
  { id: "2", categoryId: "food", description: "Supermarket", amount: 180 },
  { id: "3", categoryId: "food", description: "Restaurants", amount: 95 },
  { id: "4", categoryId: "transport", description: "Fuel", amount: 120 },
  { id: "5", categoryId: "utilities", description: "Electricity", amount: 88 },
  { id: "6", categoryId: "entertainment", description: "Netflix", amount: 15 },
  { id: "7", categoryId: "healthcare", description: "Pharmacy", amount: 40 },
];

let nextId = 100;

export default function BudgetTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("housing");
  const [currency, setCurrency] = useState("GHS");
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || "₵";

  const totalBudget = useMemo(
    () => defaultCategories.reduce((sum, c) => sum + c.budget, 0),
    []
  );

  const totalSpent = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const remaining = totalBudget - totalSpent;
  const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    return map;
  }, [transactions]);

  const chartData = useMemo(() => {
    return defaultCategories.map((cat) => {
      const spent = spentByCategory[cat.id] || 0;
      return {
        name: cat.label,
        Budget: cat.budget,
        Spent: spent,
        overBudget: spent > cat.budget,
        barColor: cat.barColor,
      };
    });
  }, [spentByCategory]);

  const formatCurrency = (val: number) =>
    `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const addTransaction = () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const newTx: Transaction = {
      id: String(nextId++),
      categoryId,
      description: description.trim(),
      amount: parseFloat(amount),
    };
    setTransactions([newTx, ...transactions]);
    setDescription("");
    setAmount("");
    toast.success("Transaction added!");
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
    toast.success("Transaction deleted");
  };

  const getCategoryInfo = (id: string) =>
    defaultCategories.find((c) => c.id === id) || defaultCategories[defaultCategories.length - 1];

  return (
    <Layout>
      <SEOHead
        title="Budget Tracker - Manage Your Budget | TechTrendi"
        description="Track your budget with category breakdowns, progress bars, and visual charts. Free budget management tool with spending analysis."
        canonicalUrl="https://techtrendi.com/tools/budget-tracker"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Budget <span className="text-primary">Tracker</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Set budgets by category and track your spending
          </p>
          <div className="mt-3 flex items-center gap-2">
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

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Total Budget</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(totalBudget)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Total Spent</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <PiggyBank className="w-4 h-4" />
                <span className="text-sm">Remaining</span>
              </div>
              <p className={cn("text-2xl md:text-3xl font-bold", remaining < 0 ? "text-red-500" : "text-green-600")}>
                {formatCurrency(remaining)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">Overall %</span>
              </div>
              <p className={cn("text-2xl md:text-3xl font-bold", overallPercent > 100 ? "text-red-500" : "")}>
                {overallPercent}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Add Transaction + Category Breakdown */}
          <div className="space-y-6">
            {/* Add Transaction Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you spend on?"
                    onKeyDown={(e) => e.key === "Enter" && addTransaction()}
                  />
                </div>
                <div>
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    onKeyDown={(e) => e.key === "Enter" && addTransaction()}
                  />
                </div>
                <Button onClick={addTransaction} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {defaultCategories.map((cat) => {
                  const spent = spentByCategory[cat.id] || 0;
                  const pct = cat.budget > 0 ? Math.round((spent / cat.budget) * 100) : 0;
                  const over = spent > cat.budget;
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", cat.color)} />
                          <span className="text-sm font-medium">{cat.label}</span>
                        </div>
                        <span className={cn("text-sm", over ? "text-red-500 font-semibold" : "text-muted-foreground")}>
                          {formatCurrency(spent)} / {formatCurrency(cat.budget)}
                        </span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            over ? "bg-red-500" : cat.color
                          )}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className={cn("text-xs mt-0.5 text-right", over ? "text-red-500" : "text-muted-foreground")}>
                        {pct}%{over && " - Over budget!"}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Chart + Transaction List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Budget vs Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.overBudget ? "#ef4444" : entry.barColor}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Transaction List */}
            <Card>
              <CardHeader>
                <CardTitle>Transactions ({transactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Add your first transaction above</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {transactions.map((tx) => {
                      const catInfo = getCategoryInfo(tx.categoryId);
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                catInfo.color
                              )}
                            >
                              <catInfo.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              <p className="text-sm text-muted-foreground">{catInfo.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg">
                              {formatCurrency(tx.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTransaction(tx.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
