import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CreditCard, Plus, Trash2, Edit2, DollarSign, Calendar, TrendingUp,
  AlertTriangle, PieChart, BarChart3, Save, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Subscription {
  id: string;
  name: string;
  cost: number;
  billingCycle: "monthly" | "yearly" | "weekly";
  category: string;
  nextBilling?: string;
  color: string;
}

const categories = [
  { name: "Streaming", color: "bg-red-500" },
  { name: "Software", color: "bg-blue-500" },
  { name: "Cloud Storage", color: "bg-purple-500" },
  { name: "Gaming", color: "bg-green-500" },
  { name: "News/Media", color: "bg-yellow-500" },
  { name: "Music", color: "bg-pink-500" },
  { name: "Fitness", color: "bg-orange-500" },
  { name: "Productivity", color: "bg-indigo-500" },
  { name: "Other", color: "bg-gray-500" },
];

const popularServices = [
  { name: "Netflix", cost: 15.99, category: "Streaming" },
  { name: "Spotify", cost: 10.99, category: "Music" },
  { name: "Disney+", cost: 13.99, category: "Streaming" },
  { name: "Amazon Prime", cost: 14.99, category: "Streaming" },
  { name: "YouTube Premium", cost: 13.99, category: "Streaming" },
  { name: "Apple Music", cost: 10.99, category: "Music" },
  { name: "HBO Max", cost: 15.99, category: "Streaming" },
  { name: "Adobe Creative Cloud", cost: 54.99, category: "Software" },
  { name: "Microsoft 365", cost: 9.99, category: "Software" },
  { name: "iCloud", cost: 2.99, category: "Cloud Storage" },
  { name: "Google One", cost: 2.99, category: "Cloud Storage" },
  { name: "Dropbox", cost: 11.99, category: "Cloud Storage" },
  { name: "ChatGPT Plus", cost: 20.00, category: "Software" },
  { name: "Notion", cost: 10.00, category: "Productivity" },
  { name: "Gym Membership", cost: 30.00, category: "Fitness" },
];

export default function SubscriptionTracker() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newSub, setNewSub] = useState({
    name: "",
    cost: "",
    billingCycle: "monthly" as "monthly" | "yearly" | "weekly",
    category: "Other",
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("techtrendi_subscriptions");
    if (saved) {
      setSubscriptions(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("techtrendi_subscriptions", JSON.stringify(subscriptions));
  }, [subscriptions]);

  const addSubscription = () => {
    if (!newSub.name || !newSub.cost) {
      toast.error("Please fill in name and cost");
      return;
    }

    const categoryColor = categories.find((c) => c.name === newSub.category)?.color || "bg-gray-500";

    const subscription: Subscription = {
      id: Date.now().toString(),
      name: newSub.name,
      cost: parseFloat(newSub.cost),
      billingCycle: newSub.billingCycle,
      category: newSub.category,
      color: categoryColor,
    };

    setSubscriptions([...subscriptions, subscription]);
    setNewSub({ name: "", cost: "", billingCycle: "monthly", category: "Other" });
    setIsAddingNew(false);
    toast.success("Subscription added!");
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions(subscriptions.filter((s) => s.id !== id));
    toast.success("Subscription removed");
  };

  const addPopularService = (service: typeof popularServices[0]) => {
    const categoryColor = categories.find((c) => c.name === service.category)?.color || "bg-gray-500";
    const subscription: Subscription = {
      id: Date.now().toString(),
      name: service.name,
      cost: service.cost,
      billingCycle: "monthly",
      category: service.category,
      color: categoryColor,
    };
    setSubscriptions([...subscriptions, subscription]);
    toast.success(`${service.name} added!`);
  };

  const getMonthlyCost = (sub: Subscription) => {
    switch (sub.billingCycle) {
      case "yearly": return sub.cost / 12;
      case "weekly": return sub.cost * 4.33;
      default: return sub.cost;
    }
  };

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + getMonthlyCost(sub), 0);
  const totalYearly = totalMonthly * 12;

  const categoryTotals = categories.map((cat) => ({
    ...cat,
    total: subscriptions
      .filter((s) => s.category === cat.name)
      .reduce((sum, s) => sum + getMonthlyCost(s), 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <Layout>
      <SEOHead
        title="Subscription Tracker - Track Your Monthly Subscriptions | TechTrendi"
        description="Track all your subscriptions in one place. See how much you're really spending monthly and yearly on streaming, software, and services."
        canonicalUrl="https://techtrendi.com/tools/subscription-tracker"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Subscription <span className="text-primary">Tracker</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how much you're really spending on subscriptions. You might be surprised!
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Total</p>
                  <p className="text-3xl font-bold text-foreground">${totalMonthly.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Yearly Total</p>
                  <p className="text-3xl font-bold text-foreground">${totalYearly.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-foreground">{subscriptions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning if spending high */}
        {totalMonthly > 100 && (
          <Card className="mb-8 border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    You're spending ${totalMonthly.toFixed(2)}/month on subscriptions!
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                    That's ${totalYearly.toFixed(2)} per year. Consider reviewing which services you actually use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add New */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Your Subscriptions
                  </CardTitle>
                  <Button onClick={() => setIsAddingNew(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Add Form */}
                {isAddingNew && (
                  <div className="p-4 mb-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Service Name</Label>
                        <Input
                          value={newSub.name}
                          onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                          placeholder="e.g., Netflix"
                        />
                      </div>
                      <div>
                        <Label>Cost</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={newSub.cost}
                            onChange={(e) => setNewSub({ ...newSub, cost: e.target.value })}
                            placeholder="0.00"
                            className="pl-8"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Billing Cycle</Label>
                        <Select
                          value={newSub.billingCycle}
                          onValueChange={(v: "monthly" | "yearly" | "weekly") =>
                            setNewSub({ ...newSub, billingCycle: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={newSub.category}
                          onValueChange={(v) => setNewSub({ ...newSub, category: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.name} value={cat.name}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-3 h-3 rounded-full", cat.color)} />
                                  {cat.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addSubscription}>
                        <Save className="w-4 h-4 mr-2" />
                        Add Subscription
                      </Button>
                    </div>
                  </div>
                )}

                {/* Subscriptions List */}
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No subscriptions added yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add your first subscription above or choose from popular services below
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:border-primary/20 transition-colors"
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold", sub.color)}>
                          {sub.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{sub.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {sub.category} • {sub.billingCycle}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">
                            ${sub.cost.toFixed(2)}
                            <span className="text-xs text-muted-foreground font-normal">
                              /{sub.billingCycle === "yearly" ? "yr" : sub.billingCycle === "weekly" ? "wk" : "mo"}
                            </span>
                          </div>
                          {sub.billingCycle !== "monthly" && (
                            <div className="text-xs text-muted-foreground">
                              ${getMonthlyCost(sub).toFixed(2)}/mo
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteSubscription(sub.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Popular Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Add Popular Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularServices
                    .filter((s) => !subscriptions.some((sub) => sub.name === s.name))
                    .slice(0, 10)
                    .map((service) => (
                      <Button
                        key={service.name}
                        variant="outline"
                        size="sm"
                        onClick={() => addPopularService(service)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {service.name} (${service.cost})
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  By Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryTotals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Add subscriptions to see breakdown
                  </p>
                ) : (
                  <div className="space-y-3">
                    {categoryTotals.map((cat) => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", cat.color)} />
                            <span>{cat.name}</span>
                          </div>
                          <span className="font-medium">${cat.total.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", cat.color)}
                            style={{ width: `${(cat.total / totalMonthly) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Money-Saving Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Review unused subscriptions monthly</li>
                  <li>• Consider annual plans for savings</li>
                  <li>• Share family plans when possible</li>
                  <li>• Use free trials strategically</li>
                  <li>• Check for student/military discounts</li>
                </ul>
              </CardContent>
            </Card>

            {!user && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-center">
                    <strong>Sign in</strong> to save your subscriptions and access them anywhere!
                  </p>
                  <Button className="w-full mt-4" asChild>
                    <a href="/auth">Sign In Free</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
