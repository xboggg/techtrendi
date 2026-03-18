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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Home,
  ShoppingCart,
  Bus,
  Dumbbell,
  Beer,
  Coffee,
  UtensilsCrossed,
  Globe,
} from "lucide-react";

// ---------- DATA ----------

interface CityData {
  name: string;
  country: string;
  rent: number;       // 1-bed city centre, monthly USD
  groceries: number;  // monthly basket USD
  restaurant: number; // meal for two, mid-range USD
  transport: number;  // monthly pass USD
  gym: number;        // monthly membership USD
  beer: number;       // domestic 0.5L at restaurant USD
  coffee: number;     // cappuccino USD
  index: number;      // overall cost index (New York = 100)
}

const cities: CityData[] = [
  { name: "Accra",           country: "Ghana",          rent: 450,  groceries: 250, restaurant: 30,  transport: 40,  gym: 45,  beer: 2.0,  coffee: 3.0,  index: 34 },
  { name: "Lagos",           country: "Nigeria",        rent: 550,  groceries: 220, restaurant: 25,  transport: 30,  gym: 40,  beer: 1.5,  coffee: 2.5,  index: 32 },
  { name: "Nairobi",         country: "Kenya",          rent: 500,  groceries: 230, restaurant: 28,  transport: 35,  gym: 35,  beer: 2.0,  coffee: 2.5,  index: 33 },
  { name: "Cape Town",       country: "South Africa",   rent: 650,  groceries: 280, restaurant: 35,  transport: 50,  gym: 30,  beer: 2.5,  coffee: 2.8,  index: 40 },
  { name: "London",          country: "United Kingdom", rent: 2200, groceries: 450, restaurant: 90,  transport: 180, gym: 55,  beer: 7.0,  coffee: 4.5,  index: 85 },
  { name: "New York",        country: "United States",  rent: 3200, groceries: 500, restaurant: 100, transport: 132, gym: 80,  beer: 8.0,  coffee: 5.0,  index: 100 },
  { name: "San Francisco",   country: "United States",  rent: 3500, groceries: 520, restaurant: 110, transport: 98,  gym: 90,  beer: 8.5,  coffee: 5.5,  index: 105 },
  { name: "Dubai",           country: "UAE",            rent: 1800, groceries: 400, restaurant: 70,  transport: 80,  gym: 65,  beer: 10.0, coffee: 5.0,  index: 65 },
  { name: "Berlin",          country: "Germany",        rent: 1100, groceries: 350, restaurant: 55,  transport: 95,  gym: 35,  beer: 4.0,  coffee: 3.5,  index: 62 },
  { name: "Toronto",         country: "Canada",         rent: 1900, groceries: 400, restaurant: 75,  transport: 120, gym: 50,  beer: 6.0,  coffee: 4.5,  index: 75 },
  { name: "Singapore",       country: "Singapore",      rent: 2500, groceries: 420, restaurant: 60,  transport: 100, gym: 90,  beer: 9.0,  coffee: 5.0,  index: 82 },
  { name: "Bangkok",         country: "Thailand",       rent: 500,  groceries: 200, restaurant: 20,  transport: 30,  gym: 35,  beer: 2.5,  coffee: 2.8,  index: 35 },
  { name: "Lisbon",          country: "Portugal",       rent: 1000, groceries: 320, restaurant: 45,  transport: 45,  gym: 35,  beer: 3.0,  coffee: 1.5,  index: 50 },
  { name: "Amsterdam",       country: "Netherlands",    rent: 1700, groceries: 380, restaurant: 70,  transport: 100, gym: 40,  beer: 5.5,  coffee: 3.8,  index: 73 },
  { name: "Sydney",          country: "Australia",      rent: 2200, groceries: 430, restaurant: 80,  transport: 140, gym: 55,  beer: 7.5,  coffee: 4.2,  index: 80 },
  { name: "Mumbai",          country: "India",          rent: 500,  groceries: 180, restaurant: 15,  transport: 15,  gym: 20,  beer: 3.0,  coffee: 2.0,  index: 25 },
  { name: "Kuala Lumpur",    country: "Malaysia",       rent: 550,  groceries: 210, restaurant: 18,  transport: 25,  gym: 30,  beer: 4.0,  coffee: 2.5,  index: 30 },
  { name: "Johannesburg",    country: "South Africa",   rent: 550,  groceries: 260, restaurant: 30,  transport: 45,  gym: 28,  beer: 2.0,  coffee: 2.5,  index: 37 },
  { name: "Cairo",           country: "Egypt",          rent: 300,  groceries: 150, restaurant: 15,  transport: 15,  gym: 20,  beer: 3.0,  coffee: 1.5,  index: 22 },
  { name: "Dar es Salaam",   country: "Tanzania",       rent: 400,  groceries: 200, restaurant: 20,  transport: 25,  gym: 25,  beer: 1.5,  coffee: 2.0,  index: 28 },
];

// ---------- CURRENCIES ----------

interface Currency {
  code: string;
  symbol: string;
  rate: number; // 1 USD = X of this currency
}

const currencies: Currency[] = [
  { code: "USD", symbol: "$",  rate: 1 },
  { code: "GHS", symbol: "GH\u20B5", rate: 15.5 },
  { code: "EUR", symbol: "\u20AC",  rate: 0.92 },
  { code: "GBP", symbol: "\u00A3",  rate: 0.79 },
  { code: "NGN", symbol: "\u20A6",  rate: 1580 },
  { code: "KES", symbol: "KSh", rate: 154 },
  { code: "ZAR", symbol: "R",   rate: 18.5 },
];

// ---------- HELPERS ----------

function pctDiff(a: number, b: number): number {
  if (a === 0) return 0;
  return ((b - a) / a) * 100;
}

function formatPct(v: number): string {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function formatMoney(value: number, cur: Currency): string {
  return `${cur.symbol}${(value * cur.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// ---------- COMPONENT ----------

const CostOfLiving = () => {
  const [cityAName, setCityAName] = useState<string>("Accra");
  const [cityBName, setCityBName] = useState<string>("London");
  const [salary, setSalary] = useState<string>("3000");
  const [currencyCode, setCurrencyCode] = useState<string>("USD");

  const cityA = useMemo(() => cities.find((c) => c.name === cityAName)!, [cityAName]);
  const cityB = useMemo(() => cities.find((c) => c.name === cityBName)!, [cityBName]);
  const currency = useMemo(() => currencies.find((c) => c.code === currencyCode)!, [currencyCode]);

  const salaryNum = parseFloat(salary) || 0;
  // Convert entered salary to USD, then scale by index ratio
  const salaryUSD = salaryNum / currency.rate;
  const equivalentUSD = cityB.index !== 0 ? salaryUSD * (cityB.index / cityA.index) : 0;
  const equivalentLocal = equivalentUSD * currency.rate;

  // Category breakdowns
  const categories = useMemo(() => {
    const housing = { label: "Housing (Rent)", iconKey: "home" as const, a: cityA.rent, b: cityB.rent };
    const food = { label: "Food & Dining", iconKey: "food" as const, a: cityA.groceries + cityA.restaurant, b: cityB.groceries + cityB.restaurant };
    const transport = { label: "Transport", iconKey: "transport" as const, a: cityA.transport, b: cityB.transport };
    const lifestyle = { label: "Lifestyle", iconKey: "lifestyle" as const, a: cityA.gym + cityA.beer * 30 + cityA.coffee * 30, b: cityB.gym + cityB.beer * 30 + cityB.coffee * 30 };
    return [housing, food, transport, lifestyle];
  }, [cityA, cityB]);

  // Chart data
  const chartData = useMemo(
    () => [
      { category: "Rent", [cityA.name]: cityA.rent, [cityB.name]: cityB.rent },
      { category: "Groceries", [cityA.name]: cityA.groceries, [cityB.name]: cityB.groceries },
      { category: "Restaurant", [cityA.name]: cityA.restaurant, [cityB.name]: cityB.restaurant },
      { category: "Transport", [cityA.name]: cityA.transport, [cityB.name]: cityB.transport },
      { category: "Gym", [cityA.name]: cityA.gym, [cityB.name]: cityB.gym },
      { category: "Beer", [cityA.name]: cityA.beer, [cityB.name]: cityB.beer },
      { category: "Coffee", [cityA.name]: cityA.coffee, [cityB.name]: cityB.coffee },
    ],
    [cityA, cityB]
  );

  const overallDiff = pctDiff(cityA.index, cityB.index);
  const isCheaper = overallDiff < 0;

  const iconMap = {
    home: <Home className="h-5 w-5" />,
    food: <ShoppingCart className="h-5 w-5" />,
    transport: <Bus className="h-5 w-5" />,
    lifestyle: <Dumbbell className="h-5 w-5" />,
  };

  const swapCities = () => {
    setCityAName(cityBName);
    setCityBName(cityAName);
  };

  return (
    <Layout>
      <SEOHead
        title="Cost of Living Comparator | TechTrendi"
        description="Compare cost of living between 20 global cities. See rent, groceries, transport and lifestyle costs side by side with equivalent salary calculations."
        keywords="cost of living, city comparison, salary calculator, rent comparison, global cities"
      />

      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl flex items-center justify-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            Cost of Living Comparator
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Compare everyday expenses across 20 cities worldwide and find out what your salary is really worth.
          </p>
        </div>

        {/* Selectors */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* City selectors row */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
              <div className="space-y-2">
                <Label>City A</Label>
                <Select value={cityAName} onValueChange={setCityAName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}, {c.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="self-end"
                onClick={swapCities}
                aria-label="Swap cities"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>

              <div className="space-y-2">
                <Label>City B</Label>
                <Select value={cityBName} onValueChange={setCityBName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}, {c.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary + currency row */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-4 items-end">
              <div className="space-y-2">
                <Label>Your Monthly Salary in {cityAName}</Label>
                <Input
                  type="number"
                  min={0}
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. 3000"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currencyCode} onValueChange={setCurrencyCode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className={isCheaper ? "border-green-500/40" : "border-red-500/40"}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {isCheaper ? (
                <TrendingDown className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingUp className="h-5 w-5 text-red-500" />
              )}
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm sm:text-base">
            <p>
              <strong>{cityBName}</strong> is{" "}
              <span className={isCheaper ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {Math.abs(overallDiff).toFixed(1)}% {isCheaper ? "cheaper" : "more expensive"}
              </span>{" "}
              than <strong>{cityAName}</strong> overall.
            </p>
            {salaryNum > 0 && (
              <p>
                To maintain the same standard of living, you would need approximately{" "}
                <strong className="text-primary">{formatMoney(equivalentUSD, currency)}</strong>{" "}
                per month in <strong>{cityBName}</strong> (vs. {formatMoney(salaryUSD, currency)} in {cityAName}).
              </p>
            )}
          </CardContent>
        </Card>

        {/* Category breakdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const diff = pctDiff(cat.a, cat.b);
            const cheaper = diff < 0;
            return (
              <Card key={cat.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {iconMap[cat.iconKey]}
                    {cat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{cityAName}: <strong>{formatMoney(cat.a, currency)}</strong></span>
                    <span>{cityBName}: <strong>{formatMoney(cat.b, currency)}</strong></span>
                  </div>
                  <div
                    className={`text-center text-sm font-medium rounded py-1 ${
                      cheaper
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {formatPct(diff)} in {cityBName}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Side-by-Side Comparison (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Legend />
                  <Bar dataKey={cityA.name} fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={cityB.name} fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed item table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Item-by-Item Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Item</th>
                  <th className="py-2 pr-4 font-medium text-right">{cityAName}</th>
                  <th className="py-2 pr-4 font-medium text-right">{cityBName}</th>
                  <th className="py-2 font-medium text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Rent (1-bed, centre)", a: cityA.rent, b: cityB.rent, icon: <Home className="h-4 w-4 inline mr-1" /> },
                  { label: "Groceries (monthly)", a: cityA.groceries, b: cityB.groceries, icon: <ShoppingCart className="h-4 w-4 inline mr-1" /> },
                  { label: "Restaurant (meal for 2)", a: cityA.restaurant, b: cityB.restaurant, icon: <UtensilsCrossed className="h-4 w-4 inline mr-1" /> },
                  { label: "Transport (monthly)", a: cityA.transport, b: cityB.transport, icon: <Bus className="h-4 w-4 inline mr-1" /> },
                  { label: "Gym (monthly)", a: cityA.gym, b: cityB.gym, icon: <Dumbbell className="h-4 w-4 inline mr-1" /> },
                  { label: "Beer (0.5L)", a: cityA.beer, b: cityB.beer, icon: <Beer className="h-4 w-4 inline mr-1" /> },
                  { label: "Coffee (cappuccino)", a: cityA.coffee, b: cityB.coffee, icon: <Coffee className="h-4 w-4 inline mr-1" /> },
                ].map((row) => {
                  const diff = pctDiff(row.a, row.b);
                  return (
                    <tr key={row.label} className="border-b last:border-0">
                      <td className="py-2 pr-4">{row.icon}{row.label}</td>
                      <td className="py-2 pr-4 text-right">${row.a.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right">${row.b.toLocaleString()}</td>
                      <td
                        className={`py-2 text-right font-medium ${
                          diff < 0 ? "text-green-600" : diff > 0 ? "text-red-600" : ""
                        }`}
                      >
                        {formatPct(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Overall index comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Cost Index (New York = 100)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <p className="text-muted-foreground text-sm mb-1">{cityAName}</p>
                <p className="text-4xl font-bold text-indigo-500">{cityA.index}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">{cityBName}</p>
                <p className="text-4xl font-bold text-orange-500">{cityB.index}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Data is approximate and based on aggregated cost-of-living surveys. Actual costs may vary. Prices in USD unless converted via the currency selector.
        </p>
      </div>
    </Layout>
  );
};

export default CostOfLiving;
