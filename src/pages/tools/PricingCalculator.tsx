import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator, DollarSign, Clock, Target, TrendingUp, PiggyBank,
  Briefcase, Calendar, Coffee, Home, Car, Heart, Plane, Lightbulb,
  Copy, Check, Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FreelanceData {
  // Income Goals
  annualIncomeGoal: number;

  // Time
  workHoursPerDay: number;
  workDaysPerWeek: number;
  vacationWeeksPerYear: number;

  // Overhead
  monthlyExpenses: number;
  taxRate: number;

  // Billable
  billablePercentage: number;

  // Project-based
  averageProjectHours: number;
  desiredProfitMargin: number;
}

interface ProductData {
  // Costs
  productionCost: number;
  shippingCost: number;
  overheadPerUnit: number;

  // Goals
  desiredMargin: number;
  competitorPrice: number;

  // Volume
  monthlySalesGoal: number;

  // Additional
  includeTax: boolean;
  taxRate: number;
}

const defaultFreelance: FreelanceData = {
  annualIncomeGoal: 100000,
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  vacationWeeksPerYear: 4,
  monthlyExpenses: 2000,
  taxRate: 25,
  billablePercentage: 65,
  averageProjectHours: 40,
  desiredProfitMargin: 20,
};

const defaultProduct: ProductData = {
  productionCost: 10,
  shippingCost: 3,
  overheadPerUnit: 2,
  desiredMargin: 40,
  competitorPrice: 35,
  monthlySalesGoal: 100,
  includeTax: false,
  taxRate: 8,
};

export default function PricingCalculator() {
  const [mode, setMode] = useState<"freelance" | "product">("freelance");
  const [freelance, setFreelance] = useState<FreelanceData>(defaultFreelance);
  const [product, setProduct] = useState<ProductData>(defaultProduct);
  const [copied, setCopied] = useState(false);

  const freelanceCalc = useMemo(() => {
    // Available work time
    const workWeeksPerYear = 52 - freelance.vacationWeeksPerYear;
    const workDaysPerYear = workWeeksPerYear * freelance.workDaysPerWeek;
    const totalWorkHours = workDaysPerYear * freelance.workHoursPerDay;
    const billableHours = totalWorkHours * (freelance.billablePercentage / 100);

    // Annual overhead
    const annualOverhead = freelance.monthlyExpenses * 12;

    // Required gross revenue
    const netIncomeNeeded = freelance.annualIncomeGoal;
    const taxMultiplier = 1 / (1 - freelance.taxRate / 100);
    const grossIncomeNeeded = netIncomeNeeded * taxMultiplier;
    const totalRevenue = grossIncomeNeeded + annualOverhead;

    // Rates
    const hourlyRate = totalRevenue / billableHours;
    const dailyRate = hourlyRate * freelance.workHoursPerDay;
    const weeklyRate = dailyRate * freelance.workDaysPerWeek;
    const monthlyRate = totalRevenue / 12;

    // Project rate
    const projectRate = hourlyRate * freelance.averageProjectHours;
    const projectWithProfit = projectRate * (1 + freelance.desiredProfitMargin / 100);

    return {
      billableHours: Math.round(billableHours),
      hourlyRate: Math.round(hourlyRate),
      dailyRate: Math.round(dailyRate),
      weeklyRate: Math.round(weeklyRate),
      monthlyRate: Math.round(monthlyRate),
      projectRate: Math.round(projectRate),
      projectWithProfit: Math.round(projectWithProfit),
      annualOverhead: Math.round(annualOverhead),
      grossIncomeNeeded: Math.round(grossIncomeNeeded),
      totalRevenue: Math.round(totalRevenue),
      effectiveTaxAmount: Math.round(grossIncomeNeeded - netIncomeNeeded),
    };
  }, [freelance]);

  const productCalc = useMemo(() => {
    const totalCost = product.productionCost + product.shippingCost + product.overheadPerUnit;
    const marginMultiplier = 1 / (1 - product.desiredMargin / 100);
    const suggestedPrice = totalCost * marginMultiplier;
    const priceWithTax = product.includeTax
      ? suggestedPrice * (1 + product.taxRate / 100)
      : suggestedPrice;

    const profitPerUnit = suggestedPrice - totalCost;
    const monthlyProfit = profitPerUnit * product.monthlySalesGoal;
    const annualProfit = monthlyProfit * 12;

    const competitorComparison = ((suggestedPrice - product.competitorPrice) / product.competitorPrice) * 100;

    // Break-even
    const monthlyOverhead = product.overheadPerUnit * product.monthlySalesGoal;
    const breakEvenUnits = Math.ceil(monthlyOverhead / profitPerUnit) || 0;

    return {
      totalCost: totalCost.toFixed(2),
      suggestedPrice: suggestedPrice.toFixed(2),
      priceWithTax: priceWithTax.toFixed(2),
      profitPerUnit: profitPerUnit.toFixed(2),
      monthlyProfit: Math.round(monthlyProfit),
      annualProfit: Math.round(annualProfit),
      competitorComparison: competitorComparison.toFixed(1),
      breakEvenUnits,
      actualMargin: (((suggestedPrice - totalCost) / suggestedPrice) * 100).toFixed(1),
    };
  }, [product]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const copyRates = () => {
    let text = "";
    if (mode === "freelance") {
      text = `My Rates:
Hourly: ${formatCurrency(freelanceCalc.hourlyRate)}
Daily: ${formatCurrency(freelanceCalc.dailyRate)}
Weekly: ${formatCurrency(freelanceCalc.weeklyRate)}
Project (${freelance.averageProjectHours}h): ${formatCurrency(freelanceCalc.projectWithProfit)}

Calculated with TechTrendi Pricing Calculator`;
    } else {
      text = `Pricing Analysis:
Cost per unit: $${productCalc.totalCost}
Suggested price: $${productCalc.suggestedPrice}
Profit per unit: $${productCalc.profitPerUnit}
Target margin: ${product.desiredMargin}%

Calculated with TechTrendi Pricing Calculator`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="Pricing Calculator - Calculate Your Rates | TechTrendi"
        description="Calculate your freelance hourly rate or product pricing. Factor in expenses, taxes, and profit margins to price your services correctly."
        canonicalUrl="https://techtrendi.com/tools/pricing-calculator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pricing <span className="text-primary">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Calculate the right price for your services or products
          </p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "freelance" | "product")}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="freelance">
              <Briefcase className="w-4 h-4 mr-2" />
              Freelance Rates
            </TabsTrigger>
            <TabsTrigger value="product">
              <DollarSign className="w-4 h-4 mr-2" />
              Product Pricing
            </TabsTrigger>
          </TabsList>

          {/* Freelance Calculator */}
          <TabsContent value="freelance">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input */}
              <div className="space-y-6">
                {/* Income Goal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Income Goal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label>Annual Take-Home Income Goal</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={freelance.annualIncomeGoal}
                          onChange={(e) =>
                            setFreelance((prev) => ({
                              ...prev,
                              annualIncomeGoal: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="text-xl font-bold"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Work Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Work Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Work Hours Per Day: {freelance.workHoursPerDay}</Label>
                      <Slider
                        value={[freelance.workHoursPerDay]}
                        onValueChange={([v]) =>
                          setFreelance((prev) => ({ ...prev, workHoursPerDay: v }))
                        }
                        min={4}
                        max={12}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Work Days Per Week: {freelance.workDaysPerWeek}</Label>
                      <Slider
                        value={[freelance.workDaysPerWeek]}
                        onValueChange={([v]) =>
                          setFreelance((prev) => ({ ...prev, workDaysPerWeek: v }))
                        }
                        min={1}
                        max={7}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Vacation Weeks Per Year: {freelance.vacationWeeksPerYear}</Label>
                      <Slider
                        value={[freelance.vacationWeeksPerYear]}
                        onValueChange={([v]) =>
                          setFreelance((prev) => ({ ...prev, vacationWeeksPerYear: v }))
                        }
                        min={0}
                        max={12}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Billable Hours: {freelance.billablePercentage}%</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Time actually spent on client work
                      </p>
                      <Slider
                        value={[freelance.billablePercentage]}
                        onValueChange={([v]) =>
                          setFreelance((prev) => ({ ...prev, billablePercentage: v }))
                        }
                        min={30}
                        max={90}
                        step={5}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Expenses & Taxes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <PiggyBank className="w-4 h-4" />
                      Expenses & Taxes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Monthly Business Expenses ($)</Label>
                      <Input
                        type="number"
                        value={freelance.monthlyExpenses}
                        onChange={(e) =>
                          setFreelance((prev) => ({
                            ...prev,
                            monthlyExpenses: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Software, tools, workspace, insurance, etc.
                      </p>
                    </div>
                    <div>
                      <Label>Estimated Tax Rate: {freelance.taxRate}%</Label>
                      <Slider
                        value={[freelance.taxRate]}
                        onValueChange={([v]) =>
                          setFreelance((prev) => ({ ...prev, taxRate: v }))
                        }
                        min={10}
                        max={50}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Project Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Average Project Hours: {freelance.averageProjectHours}</Label>
                      <Slider
                        value={[freelance.averageProjectHours]}
                        onValueChange={([v]) =>
                          setFreelance((prev) => ({ ...prev, averageProjectHours: v }))
                        }
                        min={5}
                        max={200}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Desired Profit Margin: {freelance.desiredProfitMargin}%</Label>
                      <Slider
                        value={[freelance.desiredProfitMargin]}
                        onValueChange={([v]) =>
                          setFreelance((prev) => ({ ...prev, desiredProfitMargin: v }))
                        }
                        min={0}
                        max={50}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results */}
              <div className="space-y-6">
                <Card className="border-primary/30">
                  <CardHeader className="text-center">
                    <CardTitle className="text-muted-foreground text-sm">Your Minimum Hourly Rate</CardTitle>
                    <p className="text-5xl font-bold text-primary">
                      {formatCurrency(freelanceCalc.hourlyRate)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{formatCurrency(freelanceCalc.dailyRate)}</p>
                        <p className="text-sm text-muted-foreground">Daily</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{formatCurrency(freelanceCalc.weeklyRate)}</p>
                        <p className="text-sm text-muted-foreground">Weekly</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Base Project Rate ({freelance.averageProjectHours}h)</span>
                        <span className="font-bold">{formatCurrency(freelanceCalc.projectRate)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/30">
                        <span>With {freelance.desiredProfitMargin}% Profit Margin</span>
                        <span className="font-bold text-primary">
                          {formatCurrency(freelanceCalc.projectWithProfit)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Annual Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Billable Hours</span>
                        <span>{freelanceCalc.billableHours} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Annual Overhead</span>
                        <span>{formatCurrency(freelanceCalc.annualOverhead)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated Taxes</span>
                        <span>{formatCurrency(freelanceCalc.effectiveTaxAmount)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total Revenue Needed</span>
                        <span className="text-primary">{formatCurrency(freelanceCalc.totalRevenue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={copyRates} className="w-full">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy My Rates
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Product Pricing Calculator */}
          <TabsContent value="product">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost Structure</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Production Cost Per Unit ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={product.productionCost}
                        onChange={(e) =>
                          setProduct((prev) => ({
                            ...prev,
                            productionCost: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Shipping Cost Per Unit ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={product.shippingCost}
                        onChange={(e) =>
                          setProduct((prev) => ({
                            ...prev,
                            shippingCost: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Overhead Per Unit ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={product.overheadPerUnit}
                        onChange={(e) =>
                          setProduct((prev) => ({
                            ...prev,
                            overheadPerUnit: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Marketing, packaging, platform fees, etc.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pricing Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Desired Profit Margin: {product.desiredMargin}%</Label>
                      <Slider
                        value={[product.desiredMargin]}
                        onValueChange={([v]) =>
                          setProduct((prev) => ({ ...prev, desiredMargin: v }))
                        }
                        min={10}
                        max={80}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Competitor Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={product.competitorPrice}
                        onChange={(e) =>
                          setProduct((prev) => ({
                            ...prev,
                            competitorPrice: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Monthly Sales Goal (units)</Label>
                      <Input
                        type="number"
                        value={product.monthlySalesGoal}
                        onChange={(e) =>
                          setProduct((prev) => ({
                            ...prev,
                            monthlySalesGoal: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tax Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Include Sales Tax in Price</Label>
                      <Switch
                        checked={product.includeTax}
                        onCheckedChange={(v) =>
                          setProduct((prev) => ({ ...prev, includeTax: v }))
                        }
                      />
                    </div>
                    {product.includeTax && (
                      <div>
                        <Label>Tax Rate: {product.taxRate}%</Label>
                        <Slider
                          value={[product.taxRate]}
                          onValueChange={([v]) =>
                            setProduct((prev) => ({ ...prev, taxRate: v }))
                          }
                          min={0}
                          max={25}
                          step={0.5}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Results */}
              <div className="space-y-6">
                <Card className="border-primary/30">
                  <CardHeader className="text-center">
                    <CardTitle className="text-muted-foreground text-sm">Suggested Price</CardTitle>
                    <p className="text-5xl font-bold text-primary">
                      ${productCalc.suggestedPrice}
                    </p>
                    {product.includeTax && (
                      <p className="text-sm text-muted-foreground">
                        (${productCalc.priceWithTax} with tax)
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">${productCalc.profitPerUnit}</p>
                        <p className="text-sm text-muted-foreground">Profit/Unit</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{productCalc.actualMargin}%</p>
                        <p className="text-sm text-muted-foreground">Margin</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Profit Projections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Monthly Profit</span>
                        <span className="font-bold text-green-500">
                          {formatCurrency(productCalc.monthlyProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                        <span>Annual Profit</span>
                        <span className="font-bold text-green-500">
                          {formatCurrency(productCalc.annualProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Break-even Units</span>
                        <span className="font-bold">{productCalc.breakEvenUnits}/month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Competitor Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">vs Competitor Price</p>
                        <p className="font-bold">${product.competitorPrice}</p>
                      </div>
                      <div className={cn(
                        "text-lg font-bold",
                        parseFloat(productCalc.competitorComparison) > 0 ? "text-red-500" : "text-green-500"
                      )}>
                        {parseFloat(productCalc.competitorComparison) > 0 ? "+" : ""}
                        {productCalc.competitorComparison}%
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {parseFloat(productCalc.competitorComparison) > 10
                        ? "Your price is significantly higher - ensure your value proposition justifies this"
                        : parseFloat(productCalc.competitorComparison) < -10
                        ? "Your price is competitive - you may have room to increase"
                        : "Your price is in line with competitors"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Production</span>
                        <span>${product.productionCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>${product.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Overhead</span>
                        <span>${product.overheadPerUnit.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total Cost</span>
                        <span>${productCalc.totalCost}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={copyRates} className="w-full">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy Pricing Analysis
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
