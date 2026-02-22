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
  DollarSign, Clock, TrendingUp, Calculator, Share2, Briefcase,
  AlertTriangle, CheckCircle2, Target, Zap, PiggyBank
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const hustleTypes = [
  { id: "freelance", label: "Freelancing", avgHourly: 50, growth: "medium" },
  { id: "ecommerce", label: "E-commerce/Dropshipping", avgHourly: 25, growth: "high" },
  { id: "content", label: "Content Creation", avgHourly: 20, growth: "high" },
  { id: "consulting", label: "Consulting", avgHourly: 100, growth: "medium" },
  { id: "tutoring", label: "Tutoring/Teaching", avgHourly: 40, growth: "low" },
  { id: "rideshare", label: "Rideshare/Delivery", avgHourly: 18, growth: "low" },
  { id: "photography", label: "Photography", avgHourly: 75, growth: "medium" },
  { id: "writing", label: "Writing/Copywriting", avgHourly: 45, growth: "medium" },
  { id: "development", label: "Web/App Development", avgHourly: 85, growth: "high" },
  { id: "design", label: "Graphic Design", avgHourly: 55, growth: "medium" },
  { id: "coaching", label: "Life/Business Coaching", avgHourly: 80, growth: "high" },
  { id: "other", label: "Other", avgHourly: 30, growth: "medium" },
];

export default function SideHustleCalculator() {
  const [hustleType, setHustleType] = useState("freelance");
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [startupCosts, setStartupCosts] = useState(500);
  const [monthlyExpenses, setMonthlyExpenses] = useState(50);
  const [currentSalary, setCurrentSalary] = useState(50000);
  const [taxRate, setTaxRate] = useState(25);

  const selectedHustle = hustleTypes.find((h) => h.id === hustleType);

  const calculations = useMemo(() => {
    const weeklyGross = hoursPerWeek * hourlyRate;
    const monthlyGross = weeklyGross * 4.33;
    const yearlyGross = monthlyGross * 12;

    const yearlyExpenses = monthlyExpenses * 12 + startupCosts;
    const yearlyNet = yearlyGross - yearlyExpenses;
    const yearlyAfterTax = yearlyNet * (1 - taxRate / 100);

    const monthlyNet = yearlyAfterTax / 12;
    const effectiveHourlyRate = yearlyAfterTax / (hoursPerWeek * 52);

    const percentOfSalary = (yearlyAfterTax / currentSalary) * 100;
    const monthsToRecoupStartup = startupCosts / (monthlyNet > 0 ? monthlyNet : 1);

    const yearsToReplace = currentSalary / (yearlyAfterTax > 0 ? yearlyAfterTax : 1);

    return {
      weeklyGross,
      monthlyGross,
      yearlyGross,
      yearlyNet,
      yearlyAfterTax,
      monthlyNet,
      effectiveHourlyRate,
      percentOfSalary,
      monthsToRecoupStartup,
      yearsToReplace,
    };
  }, [hoursPerWeek, hourlyRate, startupCosts, monthlyExpenses, currentSalary, taxRate]);

  const getViabilityScore = () => {
    let score = 0;
    if (calculations.effectiveHourlyRate > 30) score += 25;
    else if (calculations.effectiveHourlyRate > 20) score += 15;
    else if (calculations.effectiveHourlyRate > 10) score += 5;

    if (calculations.monthsToRecoupStartup < 3) score += 25;
    else if (calculations.monthsToRecoupStartup < 6) score += 15;
    else if (calculations.monthsToRecoupStartup < 12) score += 5;

    if (calculations.percentOfSalary > 50) score += 25;
    else if (calculations.percentOfSalary > 25) score += 15;
    else if (calculations.percentOfSalary > 10) score += 10;

    if (selectedHustle?.growth === "high") score += 25;
    else if (selectedHustle?.growth === "medium") score += 15;
    else score += 5;

    return score;
  };

  const viabilityScore = getViabilityScore();

  const getViabilityLabel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-500", description: "This side hustle has great potential!" };
    if (score >= 60) return { label: "Good", color: "text-blue-500", description: "Solid opportunity with good returns." };
    if (score >= 40) return { label: "Moderate", color: "text-yellow-500", description: "Consider if it fits your goals." };
    return { label: "Risky", color: "text-red-500", description: "May need adjustment to be viable." };
  };

  const viability = getViabilityLabel(viabilityScore);

  const shareResults = async () => {
    const text = `Side Hustle Analysis:
${selectedHustle?.label}
Hours/week: ${hoursPerWeek}
Monthly Income: $${calculations.monthlyNet.toFixed(0)}
Yearly (after tax): $${calculations.yearlyAfterTax.toFixed(0)}
Effective hourly: $${calculations.effectiveHourlyRate.toFixed(2)}
Viability Score: ${viabilityScore}/100

Calculate yours: techtrendi.com/tools/side-hustle-calculator`;

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
        title="Side Hustle Calculator - How Much Can You Earn? | TechTrendi"
        description="Calculate your side hustle income potential. See monthly earnings, ROI, and how long until you can quit your day job."
        canonicalUrl="https://techtrendi.com/tools/side-hustle-calculator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Side Hustle <span className="text-primary">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find out how much you can earn from your side hustle and when you could go full-time
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            {/* Hustle Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Side Hustle Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={hustleType} onValueChange={(v) => {
                  setHustleType(v);
                  const hustle = hustleTypes.find((h) => h.id === v);
                  if (hustle) setHourlyRate(hustle.avgHourly);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hustleTypes.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.label} (avg ${h.avgHourly}/hr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Time & Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time & Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Hours per week</Label>
                    <span className="font-bold">{hoursPerWeek} hrs</span>
                  </div>
                  <Slider
                    value={[hoursPerWeek]}
                    onValueChange={([v]) => setHoursPerWeek(v)}
                    min={1}
                    max={40}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hourly Rate ($)</Label>
                  <Input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    min={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>One-time Startup Costs ($)</Label>
                  <Input
                    type="number"
                    value={startupCosts}
                    onChange={(e) => setStartupCosts(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Expenses ($)</Label>
                  <Input
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Context */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Annual Salary ($)</Label>
                  <Input
                    type="number"
                    value={currentSalary}
                    onChange={(e) => setCurrentSalary(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Estimated Tax Rate</Label>
                    <span className="font-bold">{taxRate}%</span>
                  </div>
                  <Slider
                    value={[taxRate]}
                    onValueChange={([v]) => setTaxRate(v)}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {/* Viability Score */}
            <Card className="border-primary/30">
              <CardContent className="pt-8 pb-8 text-center">
                <div className={cn("text-6xl font-bold mb-2", viability.color)}>
                  {viabilityScore}
                </div>
                <p className={cn("text-lg font-semibold", viability.color)}>
                  {viability.label} Viability
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {viability.description}
                </p>
              </CardContent>
            </Card>

            {/* Income Projections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Income Projections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Weekly (gross)</span>
                  <span className="font-bold">${calculations.weeklyGross.toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Monthly (gross)</span>
                  <span className="font-bold">${calculations.monthlyGross.toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="font-medium">Monthly (after tax)</span>
                  <span className="font-bold text-primary">${calculations.monthlyNet.toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-3 bg-green-500/10 rounded-lg">
                  <span className="font-medium">Yearly (after tax)</span>
                  <span className="font-bold text-green-500">${calculations.yearlyAfterTax.toFixed(0)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">${calculations.effectiveHourlyRate.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Effective Hourly</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Target className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{calculations.percentOfSalary.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Of Current Salary</p>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PiggyBank className="w-4 h-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  {calculations.monthsToRecoupStartup <= 6 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">Recoup Startup Costs</p>
                    <p className="text-sm text-muted-foreground">
                      {calculations.monthsToRecoupStartup < 1
                        ? "Less than 1 month"
                        : `~${Math.ceil(calculations.monthsToRecoupStartup)} months`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {calculations.yearsToReplace <= 2 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">Replace Current Salary</p>
                    <p className="text-sm text-muted-foreground">
                      {calculations.yearsToReplace < 1
                        ? "Less than 1 year (you could go full-time!)"
                        : calculations.yearsToReplace > 10
                        ? "More than 10 years at this rate"
                        : `~${calculations.yearsToReplace.toFixed(1)} years at this rate`}
                    </p>
                  </div>
                </div>
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
