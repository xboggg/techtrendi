import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import {
  Sprout,
  Wheat,
  Droplets,
  Bug,
  Users,
  Calculator,
  Calendar,
  Lightbulb,
  Leaf,
} from "lucide-react";

// --- Currency ---

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: CurrencyConfig[] = [
  { code: "GHS", symbol: "GH\u20B5", name: "Ghana Cedi" },
  { code: "NGN", symbol: "\u20A6", name: "Nigerian Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
];

// Local prices per currency: [seed/kg, NPK/kg, urea/kg, pesticide/L, labor/day]
const PRICES: Record<string, number[]> = {
  GHS: [12, 8, 6, 45, 50],
  NGN: [2500, 1800, 1200, 9500, 8000],
  USD: [1.5, 1.0, 0.75, 5.5, 7],
};

// --- Crop Data ---

interface CropData {
  name: string;
  seedKgPerAcre: number;
  npkKgPerAcre: number;
  ureaKgPerAcre: number;
  pesticideLPerAcre: number;
  laborDaysPerAcre: number;
  expectedYieldKgPerAcre: number;
  period: string;
}

const CROPS: CropData[] = [
  { name: "Maize", seedKgPerAcre: 10, npkKgPerAcre: 50, ureaKgPerAcre: 25, pesticideLPerAcre: 3, laborDaysPerAcre: 15, expectedYieldKgPerAcre: 1200, period: "90-120 days" },
  { name: "Rice", seedKgPerAcre: 30, npkKgPerAcre: 60, ureaKgPerAcre: 30, pesticideLPerAcre: 4, laborDaysPerAcre: 25, expectedYieldKgPerAcre: 1500, period: "120-150 days" },
  { name: "Cassava", seedKgPerAcre: 0, npkKgPerAcre: 40, ureaKgPerAcre: 20, pesticideLPerAcre: 2, laborDaysPerAcre: 20, expectedYieldKgPerAcre: 5000, period: "9-12 months" },
  { name: "Tomato", seedKgPerAcre: 0.5, npkKgPerAcre: 80, ureaKgPerAcre: 40, pesticideLPerAcre: 6, laborDaysPerAcre: 30, expectedYieldKgPerAcre: 4000, period: "70-90 days" },
  { name: "Cocoa", seedKgPerAcre: 2, npkKgPerAcre: 30, ureaKgPerAcre: 15, pesticideLPerAcre: 5, laborDaysPerAcre: 35, expectedYieldKgPerAcre: 400, period: "3-5 years (first harvest)" },
  { name: "Yam", seedKgPerAcre: 0, npkKgPerAcre: 45, ureaKgPerAcre: 20, pesticideLPerAcre: 2, laborDaysPerAcre: 30, expectedYieldKgPerAcre: 3500, period: "8-10 months" },
  { name: "Plantain", seedKgPerAcre: 0, npkKgPerAcre: 35, ureaKgPerAcre: 15, pesticideLPerAcre: 2, laborDaysPerAcre: 18, expectedYieldKgPerAcre: 4500, period: "12-15 months" },
  { name: "Soybean", seedKgPerAcre: 25, npkKgPerAcre: 30, ureaKgPerAcre: 10, pesticideLPerAcre: 3, laborDaysPerAcre: 12, expectedYieldKgPerAcre: 800, period: "90-120 days" },
  { name: "Pepper", seedKgPerAcre: 0.3, npkKgPerAcre: 70, ureaKgPerAcre: 35, pesticideLPerAcre: 5, laborDaysPerAcre: 28, expectedYieldKgPerAcre: 3000, period: "80-100 days" },
  { name: "Groundnut", seedKgPerAcre: 35, npkKgPerAcre: 25, ureaKgPerAcre: 10, pesticideLPerAcre: 2, laborDaysPerAcre: 14, expectedYieldKgPerAcre: 900, period: "90-120 days" },
];

const SOIL_FERTILITY: { label: string; value: string; multiplier: number }[] = [
  { label: "Poor", value: "poor", multiplier: 0.8 },
  { label: "Average", value: "average", multiplier: 1.0 },
  { label: "Good", value: "good", multiplier: 1.2 },
  { label: "Excellent", value: "excellent", multiplier: 1.4 },
];

const SEASONS = ["Major Season (Mar-Jul)", "Minor Season (Sep-Dec)", "Dry Season (Irrigated)"];

const PLOT_UNITS = [
  { label: "Acres", value: "acres", toAcres: 1 },
  { label: "Hectares", value: "hectares", toAcres: 2.471 },
  { label: "Plots (Ghana)", value: "plots", toAcres: 0.5 },
];

// --- Schedule ---

interface ScheduleItem {
  week: string;
  activity: string;
  input: string;
}

function getSchedule(crop: string): ScheduleItem[] {
  const base: ScheduleItem[] = [
    { week: "Week 1", activity: "Land preparation & planting", input: "Seeds" },
    { week: "Week 2", activity: "First weeding", input: "Labor" },
    { week: "Week 3-4", activity: "Basal fertilizer application", input: "NPK 15-15-15" },
    { week: "Week 5-6", activity: "Pest inspection & spraying", input: "Pesticide" },
    { week: "Week 7-8", activity: "Top-dressing fertilizer", input: "Urea" },
    { week: "Week 9-10", activity: "Second weeding & maintenance", input: "Labor" },
  ];
  if (["Tomato", "Pepper"].includes(crop)) {
    base.push({ week: "Week 10-12", activity: "Staking & harvesting begins", input: "Labor" });
  } else {
    base.push({ week: "Week 12+", activity: "Maturity check & harvesting", input: "Labor" });
  }
  return base;
}

// --- Component ---

export default function FarmInputCalculator() {
  const [cropName, setCropName] = useState("Maize");
  const [plotSize, setPlotSize] = useState("2");
  const [plotUnit, setPlotUnit] = useState("acres");
  const [season, setSeason] = useState(SEASONS[0]);
  const [soilFertility, setSoilFertility] = useState("average");
  const [currency, setCurrency] = useState("GHS");
  const [calculated, setCalculated] = useState(false);

  const crop = CROPS.find((c) => c.name === cropName) || CROPS[0];
  const soilMult = SOIL_FERTILITY.find((s) => s.value === soilFertility)?.multiplier || 1;
  const unitConversion = PLOT_UNITS.find((u) => u.value === plotUnit)?.toAcres || 1;
  const currInfo = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const prices = PRICES[currency] || PRICES.GHS;

  const results = useMemo(() => {
    const sizeNum = parseFloat(plotSize) || 0;
    const acres = sizeNum * unitConversion;

    const seedQty = crop.seedKgPerAcre * acres;
    const npkQty = crop.npkKgPerAcre * acres;
    const ureaQty = crop.ureaKgPerAcre * acres;
    const pestQty = crop.pesticideLPerAcre * acres;
    const laborDays = crop.laborDaysPerAcre * acres;

    const seedCost = seedQty * prices[0];
    const npkCost = npkQty * prices[1];
    const ureaCost = ureaQty * prices[2];
    const pestCost = pestQty * prices[3];
    const laborCost = laborDays * prices[4];
    const totalCost = seedCost + npkCost + ureaCost + pestCost + laborCost;
    const expectedYield = crop.expectedYieldKgPerAcre * acres * soilMult;

    return {
      acres,
      seed: { qty: seedQty, unit: "kg", cost: seedCost },
      npk: { qty: npkQty, unit: "kg", cost: npkCost },
      urea: { qty: ureaQty, unit: "kg", cost: ureaCost },
      pesticide: { qty: pestQty, unit: "L", cost: pestCost },
      labor: { qty: laborDays, unit: "days", cost: laborCost },
      totalCost,
      expectedYield,
    };
  }, [cropName, plotSize, plotUnit, soilFertility, currency]);

  const fmt = (v: number) =>
    `${currInfo.symbol}${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const schedule = getSchedule(cropName);

  const resultCards = [
    { title: "Seeds", icon: Sprout, qty: results.seed.qty, unit: results.seed.unit, cost: results.seed.cost, color: "text-green-600" },
    { title: "NPK 15-15-15", icon: Wheat, qty: results.npk.qty, unit: results.npk.unit, cost: results.npk.cost, color: "text-amber-600" },
    { title: "Urea", icon: Droplets, qty: results.urea.qty, unit: results.urea.unit, cost: results.urea.cost, color: "text-blue-600" },
    { title: "Pesticide", icon: Bug, qty: results.pesticide.qty, unit: results.pesticide.unit, cost: results.pesticide.cost, color: "text-red-600" },
    { title: "Labor", icon: Users, qty: results.labor.qty, unit: results.labor.unit, cost: results.labor.cost, color: "text-purple-600" },
  ];

  return (
    <Layout>
      <SEOHead
        title="Farm Input Calculator | TechTrendi Tools"
        description="Calculate seed, fertilizer, pesticide and labor costs for your farm. Supports Maize, Rice, Cassava, Cocoa and more."
      />

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 text-white">
              <Leaf className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-green-900 dark:text-green-100">
              Farm Input Calculator
            </h1>
            <p className="text-green-700 dark:text-green-300">
              Plan your farming inputs and estimate costs for the season
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Inputs */}
            <Card className="border-green-200 dark:border-green-800 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Calculator className="h-5 w-5" /> Farm Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.code} — {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Crop Type</Label>
                  <Select value={cropName} onValueChange={setCropName}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CROPS.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Plot Size</Label>
                    <Input
                      type="number"
                      min={0}
                      value={plotSize}
                      onChange={(e) => setPlotSize(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select value={plotUnit} onValueChange={setPlotUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLOT_UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Farming Season</Label>
                  <Select value={season} onValueChange={setSeason}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEASONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Soil Fertility</Label>
                  <Select value={soilFertility} onValueChange={setSoilFertility}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOIL_FERTILITY.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label} (x{s.multiplier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setCalculated(true)}
                >
                  <Calculator className="mr-2 h-4 w-4" /> Calculate Inputs
                </Button>

                {calculated && results.acres > 0 && (
                  <div className="rounded-lg bg-green-100 p-3 text-center dark:bg-green-900/40">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {cropName} growing period
                    </p>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      {crop.period}
                    </p>
                    <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                      Expected yield: {results.expectedYield.toLocaleString()} kg
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6 lg:col-span-2">
              {calculated && results.acres > 0 ? (
                <>
                  {/* Total hero card */}
                  <Card className="border-green-300 bg-green-600 text-white dark:bg-green-800">
                    <CardContent className="py-6 text-center">
                      <p className="text-sm text-green-100">Total Input Cost</p>
                      <p className="text-4xl font-bold">{fmt(results.totalCost)}</p>
                      <p className="mt-1 text-sm text-green-200">
                        for {parseFloat(plotSize)} {PLOT_UNITS.find((u) => u.value === plotUnit)?.label} of {cropName} ({results.acres.toFixed(2)} acres)
                      </p>
                    </CardContent>
                  </Card>

                  {/* 5 input cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {resultCards.map((item) => (
                      <Card key={item.title} className="border-green-200 dark:border-green-800">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <item.icon className={cn("h-5 w-5", item.color)} />
                            <span className="font-semibold text-sm">{item.title}</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {item.qty.toFixed(1)} {item.unit}
                          </p>
                          <p className="text-sm text-muted-foreground">{fmt(item.cost)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Application Schedule */}
                  <Card className="border-green-200 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                        <Calendar className="h-5 w-5" /> Application Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative space-y-0">
                        {schedule.map((item, idx) => (
                          <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                            {/* timeline line */}
                            {idx < schedule.length - 1 && (
                              <div className="absolute left-[11px] top-6 h-full w-0.5 bg-green-200 dark:bg-green-700" />
                            )}
                            <div className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{item.week}</p>
                              <p className="text-sm text-muted-foreground">{item.activity}</p>
                              <Badge variant="outline" className="mt-1 border-green-300 text-green-700 dark:text-green-300">
                                {item.input}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <Sprout className="mb-4 h-12 w-12 text-green-400" />
                    <p className="text-lg font-medium">Select your crop and plot details</p>
                    <p className="text-sm">Then click "Calculate Inputs" to see your farming plan</p>
                  </CardContent>
                </Card>
              )}

              {/* Tips Section */}
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Lightbulb className="h-5 w-5 text-yellow-500" /> Tips for Farmers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-green-500">&#8226;</span>
                      <span><strong>NPK 15-15-15</strong> means 15% Nitrogen, 15% Phosphorus, and 15% Potassium. Nitrogen promotes leaf growth, Phosphorus helps roots and flowers, and Potassium strengthens the plant overall.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-green-500">&#8226;</span>
                      <span><strong>Soil testing matters</strong> because it tells you exactly which nutrients your soil lacks. Without a test you may over-apply some fertilizers and waste money, or under-apply and get poor yields.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-green-500">&#8226;</span>
                      <span><strong>Urea (46-0-0)</strong> is a concentrated nitrogen source. Apply it 3-4 weeks after planting as a top-dress when the crop is actively growing. Avoid applying right before heavy rain as it washes away easily.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-green-500">&#8226;</span>
                      <span><strong>1 Ghana Plot = 0.5 acres.</strong> Always confirm your actual land size with a surveyor. Many disputes arise from inaccurate plot measurements.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-green-500">&#8226;</span>
                      <span><strong>Soil fertility multiplier</strong> adjusts expected yields. Poor soil produces about 80% of the standard yield while excellent soil can produce up to 140%. Invest in compost and organic matter to improve fertility over time.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
