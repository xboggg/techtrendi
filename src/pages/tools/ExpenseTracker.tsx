import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet, Plus, Trash2, TrendingUp, TrendingDown, PieChart, Calendar,
  DollarSign, CreditCard, ShoppingCart, Home, Car, Utensils, Film,
  Heart, Briefcase, Plane, GraduationCap, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
}

const STORAGE_KEY = "techtrendi_expenses";

const categories = [
  { value: "food", label: "Food & Dining", icon: Utensils, color: "bg-orange-500" },
  { value: "shopping", label: "Shopping", icon: ShoppingCart, color: "bg-pink-500" },
  { value: "housing", label: "Housing", icon: Home, color: "bg-blue-500" },
  { value: "transportation", label: "Transportation", icon: Car, color: "bg-green-500" },
  { value: "entertainment", label: "Entertainment", icon: Film, color: "bg-purple-500" },
  { value: "health", label: "Health", icon: Heart, color: "bg-red-500" },
  { value: "work", label: "Work", icon: Briefcase, color: "bg-gray-500" },
  { value: "travel", label: "Travel", icon: Plane, color: "bg-cyan-500" },
  { value: "education", label: "Education", icon: GraduationCap, color: "bg-indigo-500" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "bg-slate-500" },
];

export default function ExpenseTracker() {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  // Load data
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        setExpenses(JSON.parse(saved));
      }
    }
  }, [user]);

  // Save data
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(expenses));
    }
  }, [expenses, user]);

  const addExpense = () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
      createdAt: new Date().toISOString(),
    };

    setExpenses([newExpense, ...expenses]);
    setDescription("");
    setAmount("");
    toast.success("Expense added!");
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
    toast.success("Expense deleted");
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(filterMonth));
  }, [expenses, filterMonth]);

  const totalThisMonth = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  const dailyAverage = useMemo(() => {
    const daysInMonth = new Date(
      parseInt(filterMonth.split("-")[0]),
      parseInt(filterMonth.split("-")[1]),
      0
    ).getDate();
    const today = new Date();
    const filterDate = new Date(filterMonth + "-01");
    const isCurrentMonth =
      today.getFullYear() === filterDate.getFullYear() &&
      today.getMonth() === filterDate.getMonth();
    const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;
    return totalThisMonth / daysElapsed;
  }, [totalThisMonth, filterMonth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCategoryInfo = (cat: string) => {
    return categories.find((c) => c.value === cat) || categories[categories.length - 1];
  };

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Expense Tracker - Track Your Spending | TechTrendi"
          description="Track your daily expenses and see where your money goes. Free expense tracking with categories and monthly reports."
          canonicalUrl="https://techtrendi.com/tools/expense-tracker"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Wallet className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Expense Tracker</h1>
              <p className="text-muted-foreground mb-6">
                Track your daily expenses and see where your money goes. Sign in to save your data.
              </p>
              <Button asChild size="lg">
                <a href="/auth">Sign In to Continue</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Expense Tracker - Track Your Spending | TechTrendi"
        description="Track your daily expenses and see where your money goes. Free expense tracking with categories and monthly reports."
        canonicalUrl="https://techtrendi.com/tools/expense-tracker"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Badge className="mb-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Free + Account
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Expense <span className="text-primary">Tracker</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Track where your money goes
            </p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Filter by month</Label>
            <Input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-[180px]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">This Month</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(totalThisMonth)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Daily Average</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(dailyAverage)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">Transactions</span>
              </div>
              <p className="text-3xl font-bold">{filteredExpenses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <PieChart className="w-4 h-4" />
                <span className="text-sm">Categories</span>
              </div>
              <p className="text-3xl font-bold">{categoryTotals.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Add Expense & Category Breakdown */}
          <div className="space-y-6">
            {/* Add Expense */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Expense
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you spend on?"
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
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
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
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <Button onClick={addExpense} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryTotals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No expenses this month
                  </p>
                ) : (
                  categoryTotals.map(({ category, total }) => {
                    const catInfo = getCategoryInfo(category);
                    const percentage = (total / totalThisMonth) * 100;
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", catInfo.color)} />
                            <span className="text-sm">{catInfo.label}</span>
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(total)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full transition-all", catInfo.color)}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Expense List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>
                  {new Date(filterMonth + "-01").toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No expenses this month</p>
                    <p className="text-sm">Add your first expense above</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredExpenses.map((expense) => {
                      const catInfo = getCategoryInfo(expense.category);
                      return (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", catInfo.color)}>
                              <catInfo.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{catInfo.label}</span>
                                <span>•</span>
                                <span>{new Date(expense.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg">
                              {formatCurrency(expense.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteExpense(expense.id)}
                              className="text-red-500 hover:text-red-600"
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
