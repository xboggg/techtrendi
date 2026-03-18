import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Car, Plane, Zap, Utensils, ShoppingBag, Leaf, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

const FUEL_FACTORS: Record<string, number> = {
  petrol: 1.0,
  hybrid: 0.6,
  electric: 0.2,
  none: 0,
};

const ENERGY_FACTORS: Record<string, number> = {
  grid: 1.0,
  fossil: 1.3,
  partial_renewable: 0.5,
  full_renewable: 0.1,
};

const PIE_COLORS = ["#3fb950", "#388bfd", "#58a6ff", "#f0883e", "#bc8cff"];

const GLOBAL_AVG = 4.8;

interface Tip {
  category: string;
  icon: React.ReactNode;
  text: string;
  threshold: number;
}

const ALL_TIPS: Tip[] = [
  { category: "transport", icon: <Car className="w-4 h-4" />, text: "Switch to public transport or cycling for short trips to cut car emissions by up to 50%.", threshold: 0.5 },
  { category: "transport", icon: <Car className="w-4 h-4" />, text: "Consider an electric or hybrid vehicle for your next car — they produce far less CO2.", threshold: 1.0 },
  { category: "flights", icon: <Plane className="w-4 h-4" />, text: "Reduce flights by 1-2 per year. One round-trip flight equals months of driving.", threshold: 1.2 },
  { category: "flights", icon: <Plane className="w-4 h-4" />, text: "Choose direct flights when possible — takeoffs and landings produce the most emissions.", threshold: 2.4 },
  { category: "energy", icon: <Zap className="w-4 h-4" />, text: "Switch to LED bulbs and energy-efficient appliances to reduce electricity usage by 30%.", threshold: 1.0 },
  { category: "energy", icon: <Zap className="w-4 h-4" />, text: "Consider switching to a renewable energy provider or installing solar panels.", threshold: 2.0 },
  { category: "food", icon: <Utensils className="w-4 h-4" />, text: "Replace 2-3 meat meals per week with plant-based alternatives to significantly cut food emissions.", threshold: 1.0 },
  { category: "food", icon: <Utensils className="w-4 h-4" />, text: "Buy local and seasonal produce to reduce food transport emissions.", threshold: 0.8 },
  { category: "shopping", icon: <ShoppingBag className="w-4 h-4" />, text: "Buy second-hand or refurbished items when possible. Fast fashion is a major polluter.", threshold: 1.0 },
  { category: "shopping", icon: <ShoppingBag className="w-4 h-4" />, text: "Choose quality over quantity — durable items have a lower lifetime carbon cost.", threshold: 1.5 },
];

export default function CarbonFootprintV2() {
  // Transport
  const [carKm, setCarKm] = useState(150);
  const [fuelType, setFuelType] = useState("petrol");
  const [flights, setFlights] = useState(2);
  const [publicTransport, setPublicTransport] = useState(30);

  // Home & Energy
  const [electricity, setElectricity] = useState(400);
  const [energySource, setEnergySource] = useState("grid");

  // Diet
  const [meatMeals, setMeatMeals] = useState(7);

  // Shopping
  const [newItems, setNewItems] = useState(8);

  const calculations = useMemo(() => {
    const fuelFactor = FUEL_FACTORS[fuelType] ?? 1;
    const energyFactor = ENERGY_FACTORS[energySource] ?? 1;

    const carCO2 = carKm * 52 * 0.00021 * fuelFactor;
    const flightCO2 = flights * 1.2;
    const elecCO2 = electricity * 12 * energyFactor * 0.0005;
    const foodCO2 = meatMeals * 52 * 0.003 + 0.5;
    const shopCO2 = newItems * 12 * 0.06;

    const total = carCO2 + flightCO2 + elecCO2 + foodCO2 + shopCO2;

    return { carCO2, flightCO2, elecCO2, foodCO2, shopCO2, total };
  }, [carKm, fuelType, flights, electricity, energySource, meatMeals, newItems]);

  const pieData = useMemo(
    () => [
      { name: "Transport", value: parseFloat(calculations.carCO2.toFixed(2)) },
      { name: "Flights", value: parseFloat(calculations.flightCO2.toFixed(2)) },
      { name: "Energy", value: parseFloat(calculations.elecCO2.toFixed(2)) },
      { name: "Food", value: parseFloat(calculations.foodCO2.toFixed(2)) },
      { name: "Shopping", value: parseFloat(calculations.shopCO2.toFixed(2)) },
    ],
    [calculations]
  );

  const sortedCategories = useMemo(() => {
    const cats = [
      { key: "transport", value: calculations.carCO2 },
      { key: "flights", value: calculations.flightCO2 },
      { key: "energy", value: calculations.elecCO2 },
      { key: "food", value: calculations.foodCO2 },
      { key: "shopping", value: calculations.shopCO2 },
    ];
    return cats.sort((a, b) => b.value - a.value);
  }, [calculations]);

  const tips = useMemo(() => {
    const result: Tip[] = [];
    // Get tips for top categories
    for (const cat of sortedCategories) {
      const categoryTips = ALL_TIPS.filter((t) => t.category === cat.key && cat.value >= t.threshold);
      if (categoryTips.length > 0) {
        result.push(categoryTips[0]);
      }
      if (result.length >= 4) break;
    }
    return result;
  }, [sortedCategories]);

  const comparisonPct = ((calculations.total / GLOBAL_AVG) * 100).toFixed(0);
  const isAboveAvg = calculations.total > GLOBAL_AVG;

  return (
    <Layout>
      <SEOHead
        title="Carbon Footprint Calculator | TechTrendi Tools"
        description="Calculate your annual carbon footprint with detailed category breakdown and personalized tips to reduce your environmental impact."
      />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            Carbon Footprint Calculator <span className="text-2xl">🌱</span>
          </h1>
          <p className="text-muted-foreground">
            Estimate your annual CO2 emissions and discover ways to reduce your environmental impact.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Inputs */}
          <div className="space-y-4">
            {/* Transport */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="w-5 h-5 text-green-400" /> Transport
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Car km/week</Label>
                    <span className="text-sm text-muted-foreground font-mono">{carKm} km</span>
                  </div>
                  <Slider
                    value={[carKm]}
                    onValueChange={(v) => setCarKm(v[0])}
                    min={0}
                    max={1000}
                    step={10}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Car fuel type</Label>
                  <Select value={fuelType} onValueChange={setFuelType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petrol">Petrol / Diesel</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="none">No Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Flights per year</Label>
                    <span className="text-sm text-muted-foreground font-mono">{flights}</span>
                  </div>
                  <Slider
                    value={[flights]}
                    onValueChange={(v) => setFlights(v[0])}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Public transport trips/week</Label>
                    <span className="text-sm text-muted-foreground font-mono">{publicTransport}</span>
                  </div>
                  <Slider
                    value={[publicTransport]}
                    onValueChange={(v) => setPublicTransport(v[0])}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Home & Energy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" /> Home & Energy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Electricity kWh/month</Label>
                    <span className="text-sm text-muted-foreground font-mono">{electricity} kWh</span>
                  </div>
                  <Slider
                    value={[electricity]}
                    onValueChange={(v) => setElectricity(v[0])}
                    min={0}
                    max={1000}
                    step={10}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Energy source</Label>
                  <Select value={energySource} onValueChange={setEnergySource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid (mixed)</SelectItem>
                      <SelectItem value="fossil">Mostly fossil fuels</SelectItem>
                      <SelectItem value="partial_renewable">Partial renewable</SelectItem>
                      <SelectItem value="full_renewable">Full renewable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Diet */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-400" /> Diet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Meat meals per week</Label>
                    <span className="text-sm text-muted-foreground font-mono">{meatMeals}</span>
                  </div>
                  <Slider
                    value={[meatMeals]}
                    onValueChange={(v) => setMeatMeals(v[0])}
                    min={0}
                    max={21}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shopping */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-400" /> Shopping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>New items purchased/month</Label>
                    <span className="text-sm text-muted-foreground font-mono">{newItems}</span>
                  </div>
                  <Slider
                    value={[newItems]}
                    onValueChange={(v) => setNewItems(v[0])}
                    min={0}
                    max={30}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="space-y-4">
            {/* Total */}
            <Card className="border-green-500/30">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <Leaf className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <div className="text-sm text-muted-foreground mb-1">Your Annual Carbon Footprint</div>
                  <div className="text-5xl font-bold text-green-400">{calculations.total.toFixed(1)}</div>
                  <div className="text-lg text-muted-foreground">tonnes CO2/year</div>
                </div>

                {/* Comparison */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">vs Global Average ({GLOBAL_AVG}t)</span>
                    <Badge variant={isAboveAvg ? "destructive" : "secondary"} className="gap-1">
                      {isAboveAvg ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {comparisonPct}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isAboveAvg ? "bg-red-500" : "bg-green-500"
                      )}
                      style={{ width: `${Math.min(parseFloat(comparisonPct), 200) / 2}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0t</span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      {GLOBAL_AVG}t avg
                    </span>
                    <span>{(GLOBAL_AVG * 2).toFixed(1)}t</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}t`}
                        labelLine={true}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} tonnes`, "CO2"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category bars */}
                <div className="space-y-2 mt-2">
                  {[
                    { name: "Transport", value: calculations.carCO2, icon: <Car className="w-4 h-4" />, color: PIE_COLORS[0] },
                    { name: "Flights", value: calculations.flightCO2, icon: <Plane className="w-4 h-4" />, color: PIE_COLORS[1] },
                    { name: "Energy", value: calculations.elecCO2, icon: <Zap className="w-4 h-4" />, color: PIE_COLORS[2] },
                    { name: "Food", value: calculations.foodCO2, icon: <Utensils className="w-4 h-4" />, color: PIE_COLORS[3] },
                    { name: "Shopping", value: calculations.shopCO2, icon: <ShoppingBag className="w-4 h-4" />, color: PIE_COLORS[4] },
                  ].map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-5">{cat.icon}</span>
                      <span className="w-20 truncate">{cat.name}</span>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${calculations.total > 0 ? (cat.value / calculations.total) * 100 : 0}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                      <span className="text-muted-foreground font-mono w-14 text-right">
                        {cat.value.toFixed(1)}t
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            {tips.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-green-400" /> Reduction Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                    >
                      <div className="text-green-400 mt-0.5">{tip.icon}</div>
                      <p className="text-sm text-muted-foreground">{tip.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
