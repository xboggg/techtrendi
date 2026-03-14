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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Rocket,
  DollarSign,
  Calculator,
  TrendingUp,
  PieChart,
  Building,
  Plus,
  Trash2,
} from "lucide-react";
import {
  formatCurrency as fmtCurrency,
  getPreferredCurrency,
  setPreferredCurrency,
} from "@/lib/currencies";
import { CurrencySelector } from "@/components/tools/CurrencySelector";

// ── Types ──────────────────────────────────────────────────────────────
interface CostItem {
  id: string;
  name: string;
  amount: number;
}

interface StartupPreset {
  label: string;
  icon: string;
  oneTime: Record<string, number>;
  monthly: Record<string, number>;
}

// ── Presets ────────────────────────────────────────────────────────────
const ONE_TIME_FIELDS = [
  "Legal / Registration",
  "Equipment",
  "Branding / Design",
  "Initial Inventory",
  "Website / App Development",
  "Office Setup",
] as const;

const MONTHLY_FIELDS = [
  "Rent / Co-working",
  "Software / Tools",
  "Marketing / Ads",
  "Salaries / Contractors",
  "Insurance",
  "Utilities",
  "Miscellaneous",
] as const;

const PRESETS: Record<string, StartupPreset> = {
  saas: {
    label: "SaaS Business",
    icon: "cloud",
    oneTime: {
      "Legal / Registration": 2000,
      Equipment: 3000,
      "Branding / Design": 5000,
      "Initial Inventory": 0,
      "Website / App Development": 15000,
      "Office Setup": 1000,
    },
    monthly: {
      "Rent / Co-working": 500,
      "Software / Tools": 400,
      "Marketing / Ads": 2000,
      "Salaries / Contractors": 8000,
      Insurance: 200,
      Utilities: 100,
      Miscellaneous: 300,
    },
  },
  ecommerce: {
    label: "E-commerce Store",
    icon: "shopping-cart",
    oneTime: {
      "Legal / Registration": 1500,
      Equipment: 2000,
      "Branding / Design": 3000,
      "Initial Inventory": 10000,
      "Website / App Development": 5000,
      "Office Setup": 500,
    },
    monthly: {
      "Rent / Co-working": 300,
      "Software / Tools": 250,
      "Marketing / Ads": 3000,
      "Salaries / Contractors": 4000,
      Insurance: 150,
      Utilities: 80,
      Miscellaneous: 500,
    },
  },
  mobileapp: {
    label: "Mobile App",
    icon: "smartphone",
    oneTime: {
      "Legal / Registration": 2000,
      Equipment: 4000,
      "Branding / Design": 4000,
      "Initial Inventory": 0,
      "Website / App Development": 25000,
      "Office Setup": 500,
    },
    monthly: {
      "Rent / Co-working": 400,
      "Software / Tools": 600,
      "Marketing / Ads": 3000,
      "Salaries / Contractors": 10000,
      Insurance: 200,
      Utilities: 100,
      Miscellaneous: 400,
    },
  },
  freelance: {
    label: "Freelance Agency",
    icon: "users",
    oneTime: {
      "Legal / Registration": 1000,
      Equipment: 2500,
      "Branding / Design": 2000,
      "Initial Inventory": 0,
      "Website / App Development": 3000,
      "Office Setup": 800,
    },
    monthly: {
      "Rent / Co-working": 400,
      "Software / Tools": 200,
      "Marketing / Ads": 1000,
      "Salaries / Contractors": 5000,
      Insurance: 150,
      Utilities: 80,
      Miscellaneous: 200,
    },
  },
  content: {
    label: "Content / Media",
    icon: "film",
    oneTime: {
      "Legal / Registration": 800,
      Equipment: 5000,
      "Branding / Design": 2000,
      "Initial Inventory": 0,
      "Website / App Development": 2000,
      "Office Setup": 500,
    },
    monthly: {
      "Rent / Co-working": 300,
      "Software / Tools": 150,
      "Marketing / Ads": 1500,
      "Salaries / Contractors": 3000,
      Insurance: 100,
      Utilities: 60,
      Miscellaneous: 200,
    },
  },
  retail: {
    label: "Physical Retail",
    icon: "store",
    oneTime: {
      "Legal / Registration": 3000,
      Equipment: 8000,
      "Branding / Design": 4000,
      "Initial Inventory": 20000,
      "Website / App Development": 3000,
      "Office Setup": 15000,
    },
    monthly: {
      "Rent / Co-working": 3000,
      "Software / Tools": 200,
      "Marketing / Ads": 2000,
      "Salaries / Contractors": 6000,
      Insurance: 500,
      Utilities: 400,
      Miscellaneous: 500,
    },
  },
  restaurant: {
    label: "Restaurant",
    icon: "utensils",
    oneTime: {
      "Legal / Registration": 5000,
      Equipment: 30000,
      "Branding / Design": 5000,
      "Initial Inventory": 8000,
      "Website / App Development": 3000,
      "Office Setup": 25000,
    },
    monthly: {
      "Rent / Co-working": 4000,
      "Software / Tools": 300,
      "Marketing / Ads": 1500,
      "Salaries / Contractors": 12000,
      Insurance: 600,
      Utilities: 800,
      Miscellaneous: 1000,
    },
  },
  custom: {
    label: "Custom",
    icon: "settings",
    oneTime: {
      "Legal / Registration": 0,
      Equipment: 0,
      "Branding / Design": 0,
      "Initial Inventory": 0,
      "Website / App Development": 0,
      "Office Setup": 0,
    },
    monthly: {
      "Rent / Co-working": 0,
      "Software / Tools": 0,
      "Marketing / Ads": 0,
      "Salaries / Contractors": 0,
      Insurance: 0,
      Utilities: 0,
      Miscellaneous: 0,
    },
  },
};

// ── Helpers ────────────────────────────────────────────────────────────
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-lime-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-sky-500",
];

// ── Component ──────────────────────────────────────────────────────────
export default function StartupCostCalculator() {
  const [currency, setCurrency] = useState(getPreferredCurrency);
  const [selectedPreset, setSelectedPreset] = useState("saas");

  // One-time costs
  const [oneTimeCosts, setOneTimeCosts] = useState<Record<string, number>>(
    () => ({ ...PRESETS.saas.oneTime })
  );
  // Monthly costs
  const [monthlyCosts, setMonthlyCosts] = useState<Record<string, number>>(
    () => ({ ...PRESETS.saas.monthly })
  );

  // Custom line items
  const [customOneTime, setCustomOneTime] = useState<CostItem[]>([]);
  const [customMonthly, setCustomMonthly] = useState<CostItem[]>([]);

  // New custom item form
  const [newOneTimeName, setNewOneTimeName] = useState("");
  const [newOneTimeAmount, setNewOneTimeAmount] = useState("");
  const [newMonthlyName, setNewMonthlyName] = useState("");
  const [newMonthlyAmount, setNewMonthlyAmount] = useState("");

  // Funding
  const [availableFunding, setAvailableFunding] = useState(50000);

  const fmt = (amount: number) => fmtCurrency(amount, currency);

  // ── Preset handler ───────────────────────────────────────────────
  const applyPreset = (key: string) => {
    setSelectedPreset(key);
    const preset = PRESETS[key];
    if (!preset) return;
    setOneTimeCosts({ ...preset.oneTime });
    setMonthlyCosts({ ...preset.monthly });
    setCustomOneTime([]);
    setCustomMonthly([]);
    toast.success(`Loaded "${preset.label}" preset`);
  };

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    setPreferredCurrency(code);
  };

  // ── Cost field updaters ──────────────────────────────────────────
  const updateOneTime = (field: string, value: string) => {
    const num = parseFloat(value);
    setOneTimeCosts((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const updateMonthly = (field: string, value: string) => {
    const num = parseFloat(value);
    setMonthlyCosts((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  // ── Custom items CRUD ────────────────────────────────────────────
  const addCustomOneTime = () => {
    const name = newOneTimeName.trim();
    const amount = parseFloat(newOneTimeAmount);
    if (!name) {
      toast.error("Enter a cost name");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setCustomOneTime((prev) => [...prev, { id: uid(), name, amount }]);
    setNewOneTimeName("");
    setNewOneTimeAmount("");
    toast.success(`Added "${name}"`);
  };

  const addCustomMonthly = () => {
    const name = newMonthlyName.trim();
    const amount = parseFloat(newMonthlyAmount);
    if (!name) {
      toast.error("Enter a cost name");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setCustomMonthly((prev) => [...prev, { id: uid(), name, amount }]);
    setNewMonthlyName("");
    setNewMonthlyAmount("");
    toast.success(`Added "${name}"`);
  };

  const removeCustomOneTime = (id: string) =>
    setCustomOneTime((prev) => prev.filter((c) => c.id !== id));

  const removeCustomMonthly = (id: string) =>
    setCustomMonthly((prev) => prev.filter((c) => c.id !== id));

  // ── Calculations ─────────────────────────────────────────────────
  const results = useMemo(() => {
    const oneTimeTotal =
      Object.values(oneTimeCosts).reduce((s, v) => s + v, 0) +
      customOneTime.reduce((s, c) => s + c.amount, 0);

    const monthlyTotal =
      Object.values(monthlyCosts).reduce((s, v) => s + v, 0) +
      customMonthly.reduce((s, c) => s + c.amount, 0);

    const sixMonthRunway = oneTimeTotal + monthlyTotal * 6;
    const twelveMonthRunway = oneTimeTotal + monthlyTotal * 12;

    const fundingAfterOneTime = availableFunding - oneTimeTotal;
    const monthsOfRunway =
      monthlyTotal > 0
        ? Math.max(0, Math.floor(fundingAfterOneTime / monthlyTotal))
        : fundingAfterOneTime >= 0
          ? Infinity
          : 0;

    const breakEvenRevenue = monthlyTotal;

    // Build combined breakdown for distribution
    const allCosts: { name: string; amount: number; type: "one-time" | "monthly" }[] = [];

    Object.entries(oneTimeCosts).forEach(([name, amount]) => {
      if (amount > 0) allCosts.push({ name, amount, type: "one-time" });
    });
    customOneTime.forEach((c) => {
      if (c.amount > 0) allCosts.push({ name: c.name, amount: c.amount, type: "one-time" });
    });
    Object.entries(monthlyCosts).forEach(([name, amount]) => {
      if (amount > 0)
        allCosts.push({ name: `${name} (monthly)`, amount, type: "monthly" });
    });
    customMonthly.forEach((c) => {
      if (c.amount > 0)
        allCosts.push({
          name: `${c.name} (monthly)`,
          amount: c.amount,
          type: "monthly",
        });
    });

    const totalForDistribution = allCosts.reduce((s, c) => s + c.amount, 0);
    const distribution = allCosts
      .map((c) => ({
        ...c,
        percent:
          totalForDistribution > 0
            ? (c.amount / totalForDistribution) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      oneTimeTotal,
      monthlyTotal,
      sixMonthRunway,
      twelveMonthRunway,
      monthsOfRunway,
      breakEvenRevenue,
      distribution,
    };
  }, [oneTimeCosts, monthlyCosts, customOneTime, customMonthly, availableFunding]);

  // ── Export/share ─────────────────────────────────────────────────
  const generateShareText = () => {
    const preset = PRESETS[selectedPreset];
    let text = `Startup Cost Estimate - ${preset?.label ?? "Custom"}\n`;
    text += "=".repeat(40) + "\n\n";

    text += "ONE-TIME COSTS:\n";
    Object.entries(oneTimeCosts).forEach(([name, amount]) => {
      if (amount > 0) text += `  ${name}: ${fmt(amount)}\n`;
    });
    customOneTime.forEach((c) => {
      if (c.amount > 0) text += `  ${c.name}: ${fmt(c.amount)}\n`;
    });
    text += `  TOTAL: ${fmt(results.oneTimeTotal)}\n\n`;

    text += "MONTHLY COSTS:\n";
    Object.entries(monthlyCosts).forEach(([name, amount]) => {
      if (amount > 0) text += `  ${name}: ${fmt(amount)}\n`;
    });
    customMonthly.forEach((c) => {
      if (c.amount > 0) text += `  ${c.name}: ${fmt(c.amount)}\n`;
    });
    text += `  TOTAL: ${fmt(results.monthlyTotal)}/month\n\n`;

    text += "-".repeat(40) + "\n";
    text += `6-Month Runway Cost: ${fmt(results.sixMonthRunway)}\n`;
    text += `12-Month Runway Cost: ${fmt(results.twelveMonthRunway)}\n`;
    text += `Available Funding: ${fmt(availableFunding)}\n`;
    text += `Months of Runway: ${results.monthsOfRunway === Infinity ? "Unlimited" : results.monthsOfRunway}\n`;
    text += `Break-Even Revenue Needed: ${fmt(results.breakEvenRevenue)}/month\n\n`;
    text += "Generated by TechTrendi Startup Cost Calculator";
    return text;
  };

  const handleCopyResults = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      toast.success("Results copied to clipboard!");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopyResults();
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <Layout>
      <SEOHead
        title="Startup Cost Calculator | TechTrendi"
        description="Free startup cost calculator. Estimate one-time and monthly costs, calculate your runway, and plan your funding needs. Choose from presets for SaaS, e-commerce, mobile apps, and more."
        canonicalUrl="https://techtrendi.com/tools/startup-cost-calculator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Startup Cost <span className="text-primary">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Estimate your startup costs, plan your runway, and figure out how
            much funding you need to get off the ground.
          </p>
        </div>

        {/* Preset Selector + Currency */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedPreset} onValueChange={applyPreset}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Choose startup type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <CurrencySelector
              value={currency}
              onChange={handleCurrencyChange}
              className="w-[200px]"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left Column: Cost Inputs ────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* One-Time Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  One-Time Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {ONE_TIME_FIELDS.map((field) => (
                    <div key={field}>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        {field}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={oneTimeCosts[field] || ""}
                        onChange={(e) => updateOneTime(field, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>

                {/* Custom one-time items */}
                {customOneTime.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {customOneTime.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                      >
                        <span className="flex-1 text-sm font-medium">
                          {item.name}
                        </span>
                        <span className="text-sm font-semibold">
                          {fmt(item.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeCustomOneTime(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add custom one-time */}
                <div className="flex gap-2 mt-4">
                  <Input
                    value={newOneTimeName}
                    onChange={(e) => setNewOneTimeName(e.target.value)}
                    placeholder="Custom cost name..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addCustomOneTime()}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={newOneTimeAmount}
                    onChange={(e) => setNewOneTimeAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-28"
                    onKeyDown={(e) => e.key === "Enter" && addCustomOneTime()}
                  />
                  <Button onClick={addCustomOneTime} size="sm" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total One-Time Costs
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {fmt(results.oneTimeTotal)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Monthly Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {MONTHLY_FIELDS.map((field) => (
                    <div key={field}>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        {field}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="50"
                        value={monthlyCosts[field] || ""}
                        onChange={(e) => updateMonthly(field, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>

                {/* Custom monthly items */}
                {customMonthly.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {customMonthly.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                      >
                        <span className="flex-1 text-sm font-medium">
                          {item.name}
                        </span>
                        <span className="text-sm font-semibold">
                          {fmt(item.amount)}/mo
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeCustomMonthly(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add custom monthly */}
                <div className="flex gap-2 mt-4">
                  <Input
                    value={newMonthlyName}
                    onChange={(e) => setNewMonthlyName(e.target.value)}
                    placeholder="Custom cost name..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addCustomMonthly()}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={newMonthlyAmount}
                    onChange={(e) => setNewMonthlyAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-28"
                    onKeyDown={(e) => e.key === "Enter" && addCustomMonthly()}
                  />
                  <Button onClick={addCustomMonthly} size="sm" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Monthly Costs
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {fmt(results.monthlyTotal)}/mo
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Funding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Available Funding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Total funds available (savings, investments, loans, etc.)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={availableFunding || ""}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    setAvailableFunding(isNaN(num) ? 0 : Math.max(0, num));
                  }}
                  placeholder="50000"
                  className="text-lg font-semibold"
                />
              </CardContent>
            </Card>
          </div>

          {/* ── Right Column: Results + Distribution ────────────── */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="w-5 h-5 text-primary" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total One-Time Costs
                    </span>
                    <span className="font-semibold">
                      {fmt(results.oneTimeTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Monthly Costs
                    </span>
                    <span className="font-semibold">
                      {fmt(results.monthlyTotal)}/mo
                    </span>
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        6-Month Runway Cost
                      </span>
                      <span className="font-semibold">
                        {fmt(results.sixMonthRunway)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        12-Month Runway Cost
                      </span>
                      <span className="font-semibold">
                        {fmt(results.twelveMonthRunway)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Months of Runway
                      </span>
                      <Badge
                        variant="default"
                        className={cn(
                          "text-sm font-bold",
                          results.monthsOfRunway === Infinity
                            ? "bg-emerald-600"
                            : results.monthsOfRunway >= 12
                              ? "bg-emerald-600"
                              : results.monthsOfRunway >= 6
                                ? "bg-amber-600"
                                : "bg-red-600"
                        )}
                      >
                        {results.monthsOfRunway === Infinity
                          ? "Unlimited"
                          : `${results.monthsOfRunway} months`}
                      </Badge>
                    </div>
                    {results.monthsOfRunway !== Infinity &&
                      results.monthsOfRunway < 12 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          {results.monthsOfRunway < 6
                            ? "Warning: Very short runway. Consider securing more funding."
                            : "Tip: Aim for at least 12 months of runway for safety."}
                        </p>
                      )}
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Break-Even Revenue
                      </span>
                      <span className="font-bold text-lg text-primary">
                        {fmt(results.breakEvenRevenue)}/mo
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Monthly revenue needed to cover all recurring costs
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleCopyResults}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleShare}
                  >
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cost Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChart className="w-5 h-5 text-primary" />
                  Cost Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.distribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Enter costs to see the breakdown.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Visual bar */}
                    <div className="flex h-4 rounded-full overflow-hidden">
                      {results.distribution.map((item, idx) => (
                        <div
                          key={item.name}
                          className={cn(
                            COLORS[idx % COLORS.length],
                            "transition-all duration-300"
                          )}
                          style={{ width: `${Math.max(item.percent, 0.5)}%` }}
                          title={`${item.name}: ${item.percent.toFixed(1)}%`}
                        />
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {results.distribution.map((item, idx) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full shrink-0",
                              COLORS[idx % COLORS.length]
                            )}
                          />
                          <span className="flex-1 text-muted-foreground truncate">
                            {item.name}
                          </span>
                          <span className="font-medium whitespace-nowrap">
                            {item.percent.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Choose a startup type preset or start from scratch</li>
                  <li>2. Adjust one-time and monthly cost estimates</li>
                  <li>3. Add any custom cost items specific to your business</li>
                  <li>4. Enter your available funding amount</li>
                  <li>
                    5. Review your runway, break-even point, and cost
                    distribution
                  </li>
                  <li>6. Copy or share the summary with co-founders or investors</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
