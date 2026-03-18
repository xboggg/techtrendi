import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Clock,
  Briefcase,
  Code,
  Video,
  ShoppingCart,
  Cpu,
  Users,
  GraduationCap,
} from "lucide-react";

interface HustleType {
  id: string;
  label: string;
  growth: number;
  rate: number;
  icon: React.ReactNode;
  color: string;
}

const hustleTypes: HustleType[] = [
  {
    id: "freelancing",
    label: "Freelancing",
    growth: 0.12,
    rate: 50,
    icon: <Code className="h-5 w-5" />,
    color: "bg-blue-500",
  },
  {
    id: "content-creator",
    label: "Content Creator",
    growth: 0.18,
    rate: 0,
    icon: <Video className="h-5 w-5" />,
    color: "bg-pink-500",
  },
  {
    id: "ecommerce",
    label: "E-Commerce",
    growth: 0.15,
    rate: 0,
    icon: <ShoppingCart className="h-5 w-5" />,
    color: "bg-green-500",
  },
  {
    id: "saas-app",
    label: "SaaS / App",
    growth: 0.2,
    rate: 0,
    icon: <Cpu className="h-5 w-5" />,
    color: "bg-purple-500",
  },
  {
    id: "consulting",
    label: "Consulting",
    growth: 0.1,
    rate: 80,
    icon: <Users className="h-5 w-5" />,
    color: "bg-orange-500",
  },
  {
    id: "online-course",
    label: "Online Course",
    growth: 0.22,
    rate: 0,
    icon: <GraduationCap className="h-5 w-5" />,
    color: "bg-teal-500",
  },
];

const currencies = [
  { code: "GHS", symbol: "GH\u20B5", label: "GHS" },
  { code: "USD", symbol: "$", label: "USD" },
  { code: "EUR", symbol: "\u20AC", label: "EUR" },
  { code: "GBP", symbol: "\u00A3", label: "GBP" },
  { code: "NGN", symbol: "\u20A6", label: "NGN" },
  { code: "KES", symbol: "KSh", label: "KES" },
  { code: "ZAR", symbol: "R", label: "ZAR" },
];

function formatCurrency(value: number, symbol: string) {
  return `${symbol}${Math.round(value).toLocaleString()}`;
}

export default function SideHustleProjector() {
  const [selectedHustle, setSelectedHustle] = useState<string>("freelancing");
  const [capital, setCapital] = useState(500);
  const [hours, setHours] = useState(10);
  const [reinvestment, setReinvestment] = useState(20);
  const [currency, setCurrency] = useState("GHS");

  const currencyObj = currencies.find((c) => c.code === currency) || currencies[0];
  const hustle = hustleTypes.find((h) => h.id === selectedHustle) || hustleTypes[0];

  const projection = useMemo(() => {
    const { growth, rate } = hustle;
    const months: { month: string; revenue: number }[] = [];

    let baseMonthly =
      rate > 0
        ? hours * 4 * rate * 0.15
        : capital * 0.05 + hours * 4 * 8;

    let totalYear = 0;

    for (let m = 1; m <= 12; m++) {
      const reinvestBoost = 1 + reinvestment / 100 / 12;
      baseMonthly = baseMonthly * (1 + growth / 12) * reinvestBoost;
      totalYear += baseMonthly;
      months.push({
        month: `M${m}`,
        revenue: Math.round(baseMonthly),
      });
    }

    return {
      months,
      month12: months[11].revenue,
      totalYear: Math.round(totalYear),
    };
  }, [hustle, capital, hours, reinvestment]);

  const milestoneMonths = [0, 2, 5, 8, 11]; // indices for months 1,3,6,9,12

  return (
    <Layout>
      <SEOHead
        title="Side Hustle Revenue Projector | TechTrendi"
        description="Project your side hustle revenue over 12 months. Calculate earnings for freelancing, content creation, e-commerce, SaaS, consulting, and online courses."
      />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 dark:bg-green-900/30">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Revenue Calculator
            </span>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Side Hustle Revenue Projector
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pick your hustle, set your inputs, and see a 12-month revenue
            projection.
          </p>
        </div>

        {/* Hustle Type Buttons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Hustle Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {hustleTypes.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHustle(h.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-medium transition-all",
                    selectedHustle === h.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-accent"
                  )}
                >
                  {h.icon}
                  <span className="text-center text-xs">{h.label}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {Math.round(h.growth * 100)}% growth
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Input Sliders + Currency */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Your Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Currency Selector */}
            <div className="max-w-[200px]">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Starting Capital */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Starting Capital</Label>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(capital, currencyObj.symbol)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10000}
                step={100}
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>{currencyObj.symbol}0</span>
                <span>{currencyObj.symbol}10,000</span>
              </div>
            </div>

            {/* Hours Per Week */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Hours Per Week
                </Label>
                <span className="text-sm font-semibold tabular-nums">
                  {hours}h / week
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={40}
                step={1}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>2h</span>
                <span>40h</span>
              </div>
            </div>

            {/* Monthly Reinvestment */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Monthly Reinvestment</Label>
                <span className="text-sm font-semibold tabular-nums">
                  {reinvestment}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                step={5}
                value={reinvestment}
                onChange={(e) => setReinvestment(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>80%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">Month 12 Revenue</p>
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                {formatCurrency(projection.month12, currencyObj.symbol)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                per month by end of year
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Total Year 1 Revenue
              </p>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {formatCurrency(projection.totalYear, currencyObj.symbol)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                cumulative over 12 months
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>12-Month Revenue Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projection.months}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      `${currencyObj.symbol}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value, currencyObj.symbol),
                      "Revenue",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Milestone Bars */}
        <Card>
          <CardHeader>
            <CardTitle>Milestone Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestoneMonths.map((idx) => {
                const monthData = projection.months[idx];
                const maxRevenue = projection.month12;
                const pct = maxRevenue > 0
                  ? Math.min((monthData.revenue / maxRevenue) * 100, 100)
                  : 0;

                return (
                  <div key={idx}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{monthData.month}</span>
                      <span className="tabular-nums font-semibold">
                        {formatCurrency(monthData.revenue, currencyObj.symbol)}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          hustle.color
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
