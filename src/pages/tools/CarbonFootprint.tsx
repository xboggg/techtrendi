import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Leaf, Car, Home, Plane, ShoppingBag, Utensils, Zap, Droplets,
  Share2, TrendingDown, AlertTriangle, CheckCircle2, TreePine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CarbonFootprint() {
  // Transportation
  const [carMiles, setCarMiles] = useState(200);
  const [carType, setCarType] = useState("gasoline");
  const [flights, setFlights] = useState(2);
  const [publicTransport, setPublicTransport] = useState(20);

  // Home
  const [electricity, setElectricity] = useState(500);
  const [naturalGas, setNaturalGas] = useState(50);
  const [householdSize, setHouseholdSize] = useState(2);

  // Lifestyle
  const [dietType, setDietType] = useState("omnivore");
  const [shoppingHabit, setShoppingHabit] = useState("moderate");

  // Emission factors (kg CO2e)
  const carEmissions: Record<string, number> = {
    gasoline: 0.21, // per mile
    hybrid: 0.12,
    electric: 0.05,
    diesel: 0.24,
  };

  const dietEmissions: Record<string, number> = {
    vegan: 1500,
    vegetarian: 1700,
    pescatarian: 2000,
    omnivore: 2500,
    "heavy-meat": 3300,
  };

  const shoppingEmissions: Record<string, number> = {
    minimal: 500,
    moderate: 1000,
    frequent: 2000,
  };

  const calculations = useMemo(() => {
    // Transportation (kg CO2e per year)
    const carYearly = carMiles * 52 * carEmissions[carType];
    const flightYearly = flights * 500; // Average 500kg per flight
    const transitYearly = publicTransport * 52 * 0.05;
    const transportTotal = carYearly + flightYearly + transitYearly;

    // Home (kg CO2e per year) - divided by household size
    const elecYearly = (electricity * 12 * 0.42) / householdSize;
    const gasYearly = (naturalGas * 12 * 5.3) / householdSize;
    const homeTotal = elecYearly + gasYearly;

    // Lifestyle (kg CO2e per year)
    const dietYearly = dietEmissions[dietType];
    const shoppingYearly = shoppingEmissions[shoppingHabit];
    const lifestyleTotal = dietYearly + shoppingYearly;

    const total = transportTotal + homeTotal + lifestyleTotal;
    const totalTons = total / 1000;

    return {
      transport: {
        car: carYearly,
        flights: flightYearly,
        transit: transitYearly,
        total: transportTotal,
      },
      home: {
        electricity: elecYearly,
        gas: gasYearly,
        total: homeTotal,
      },
      lifestyle: {
        diet: dietYearly,
        shopping: shoppingYearly,
        total: lifestyleTotal,
      },
      total,
      totalTons,
    };
  }, [carMiles, carType, flights, publicTransport, electricity, naturalGas, householdSize, dietType, shoppingHabit]);

  const getComparison = (tons: number) => {
    const avgUS = 16; // US average
    const avgWorld = 4.7; // World average
    const target = 2; // Paris agreement target

    return {
      vsUS: ((tons / avgUS) * 100).toFixed(0),
      vsWorld: ((tons / avgWorld) * 100).toFixed(0),
      vsTarget: ((tons / target) * 100).toFixed(0),
      treesNeeded: Math.ceil(tons / 0.022), // Each tree absorbs ~22kg CO2/year
    };
  };

  const comparison = getComparison(calculations.totalTons);

  const getGrade = (tons: number) => {
    if (tons <= 2) return { grade: "A+", label: "Excellent", color: "text-green-500" };
    if (tons <= 4) return { grade: "A", label: "Great", color: "text-green-500" };
    if (tons <= 8) return { grade: "B", label: "Good", color: "text-blue-500" };
    if (tons <= 12) return { grade: "C", label: "Average", color: "text-yellow-500" };
    if (tons <= 16) return { grade: "D", label: "High", color: "text-orange-500" };
    return { grade: "F", label: "Very High", color: "text-red-500" };
  };

  const grade = getGrade(calculations.totalTons);

  const shareResults = async () => {
    const text = `My Carbon Footprint: ${calculations.totalTons.toFixed(1)} tons CO2e/year
Grade: ${grade.grade} (${grade.label})

Breakdown:
- Transport: ${(calculations.transport.total / 1000).toFixed(1)}t
- Home: ${(calculations.home.total / 1000).toFixed(1)}t
- Lifestyle: ${(calculations.lifestyle.total / 1000).toFixed(1)}t

${comparison.vsUS}% of US average
${comparison.treesNeeded} trees needed to offset

Calculate yours: techtrendi.com/tools/carbon-footprint`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Carbon Footprint Calculator - Calculate Your Impact | TechTrendi"
        description="Calculate your annual carbon footprint. See your environmental impact and get tips to reduce your emissions."
        canonicalUrl="https://techtrendi.com/tools/carbon-footprint"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Carbon Footprint <span className="text-green-500">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Estimate your annual carbon emissions and find ways to reduce your impact
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            {/* Transportation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Transportation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Miles driven per week</Label>
                    <span className="font-bold">{carMiles} mi</span>
                  </div>
                  <Slider
                    value={[carMiles]}
                    onValueChange={([v]) => setCarMiles(v)}
                    min={0}
                    max={500}
                    step={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select value={carType} onValueChange={setCarType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasoline</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Round-trip flights per year</Label>
                    <span className="font-bold">{flights}</span>
                  </div>
                  <Slider
                    value={[flights]}
                    onValueChange={([v]) => setFlights(v)}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Public transit miles/week</Label>
                    <span className="font-bold">{publicTransport} mi</span>
                  </div>
                  <Slider
                    value={[publicTransport]}
                    onValueChange={([v]) => setPublicTransport(v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Home */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Home Energy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Monthly electricity (kWh)</Label>
                  <Input
                    type="number"
                    value={electricity}
                    onChange={(e) => setElectricity(Number(e.target.value))}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Monthly natural gas (therms)</Label>
                  <Input
                    type="number"
                    value={naturalGas}
                    onChange={(e) => setNaturalGas(Number(e.target.value))}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Household size</Label>
                    <span className="font-bold">{householdSize}</span>
                  </div>
                  <Slider
                    value={[householdSize]}
                    onValueChange={([v]) => setHouseholdSize(v)}
                    min={1}
                    max={8}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  Lifestyle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Diet</Label>
                  <Select value={dietType} onValueChange={setDietType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="pescatarian">Pescatarian</SelectItem>
                      <SelectItem value="omnivore">Omnivore (mixed)</SelectItem>
                      <SelectItem value="heavy-meat">Heavy meat eater</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Shopping habits</Label>
                  <Select value={shoppingHabit} onValueChange={setShoppingHabit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal (buy only essentials)</SelectItem>
                      <SelectItem value="moderate">Moderate (average consumer)</SelectItem>
                      <SelectItem value="frequent">Frequent (regular shopping)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {/* Total Score */}
            <Card className="border-green-500/30">
              <CardContent className="pt-8 pb-8 text-center">
                <Leaf className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <div className={cn("text-5xl font-bold mb-2", grade.color)}>
                  {calculations.totalTons.toFixed(1)}
                </div>
                <p className="text-lg text-muted-foreground">tons CO2e per year</p>
                <div className="mt-4">
                  <span className={cn("text-2xl font-bold", grade.color)}>
                    Grade: {grade.grade}
                  </span>
                  <p className={cn("text-sm", grade.color)}>{grade.label}</p>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-500" />
                    <span>Transportation</span>
                  </div>
                  <span className="font-bold">{(calculations.transport.total / 1000).toFixed(1)}t</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-orange-500" />
                    <span>Home Energy</span>
                  </div>
                  <span className="font-bold">{(calculations.home.total / 1000).toFixed(1)}t</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-purple-500" />
                    <span>Lifestyle</span>
                  </div>
                  <span className="font-bold">{(calculations.lifestyle.total / 1000).toFixed(1)}t</span>
                </div>
              </CardContent>
            </Card>

            {/* Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How You Compare</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">vs US Average (16t)</span>
                  <span className={cn("font-bold", Number(comparison.vsUS) < 100 ? "text-green-500" : "text-red-500")}>
                    {comparison.vsUS}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">vs World Average (4.7t)</span>
                  <span className={cn("font-bold", Number(comparison.vsWorld) < 100 ? "text-green-500" : "text-red-500")}>
                    {comparison.vsWorld}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">vs Paris Target (2t)</span>
                  <span className={cn("font-bold", Number(comparison.vsTarget) < 100 ? "text-green-500" : "text-red-500")}>
                    {comparison.vsTarget}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Offset */}
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="pt-6 text-center">
                <TreePine className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-500">{comparison.treesNeeded}</p>
                <p className="text-sm text-muted-foreground">trees needed to offset your emissions</p>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Ways to Reduce
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {calculations.transport.flights > 1000 && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      Reduce flights - one less trip saves ~500kg CO2
                    </li>
                  )}
                  {carType === "gasoline" && carMiles > 100 && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      Consider hybrid or electric vehicle
                    </li>
                  )}
                  {dietType === "heavy-meat" && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      Reducing meat can save 1+ tons annually
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Switch to renewable energy provider
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Use public transit, bike, or walk when possible
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Button onClick={shareResults} className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
