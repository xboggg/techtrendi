import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator, TrendingUp, DollarSign, PieChart, Target, Clock,
  ArrowUpRight, ArrowDownRight, Share2, Copy, Check, Percent, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BasicROIData {
  initialInvestment: number;
  returnValue: number;
  timePeriodMonths: number;
}

interface MarketingROIData {
  adSpend: number;
  revenueGenerated: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  conversionRate: number;
}

interface InvestmentROIData {
  principal: number;
  contributions: number;
  contributionFrequency: "monthly" | "yearly";
  expectedReturn: number;
  years: number;
  inflationRate: number;
}

const defaultBasic: BasicROIData = {
  initialInvestment: 10000,
  returnValue: 15000,
  timePeriodMonths: 12,
};

const defaultMarketing: MarketingROIData = {
  adSpend: 5000,
  revenueGenerated: 25000,
  customerAcquisitionCost: 50,
  customerLifetimeValue: 500,
  conversionRate: 2.5,
};

const defaultInvestment: InvestmentROIData = {
  principal: 10000,
  contributions: 500,
  contributionFrequency: "monthly",
  expectedReturn: 7,
  years: 10,
  inflationRate: 3,
};

export default function ROICalculator() {
  const [mode, setMode] = useState<"basic" | "marketing" | "investment">("basic");
  const [basic, setBasic] = useState<BasicROIData>(defaultBasic);
  const [marketing, setMarketing] = useState<MarketingROIData>(defaultMarketing);
  const [investment, setInvestment] = useState<InvestmentROIData>(defaultInvestment);
  const [copied, setCopied] = useState(false);

  const basicCalc = useMemo(() => {
    const gain = basic.returnValue - basic.initialInvestment;
    const roi = (gain / basic.initialInvestment) * 100;
    const annualizedROI = ((Math.pow(1 + roi / 100, 12 / basic.timePeriodMonths) - 1) * 100);
    const monthlyReturn = roi / basic.timePeriodMonths;

    return {
      gain,
      roi: roi.toFixed(2),
      annualizedROI: annualizedROI.toFixed(2),
      monthlyReturn: monthlyReturn.toFixed(2),
      breakEvenMonths: gain > 0 ? Math.ceil(basic.timePeriodMonths * (basic.initialInvestment / basic.returnValue)) : 0,
    };
  }, [basic]);

  const marketingCalc = useMemo(() => {
    const netProfit = marketing.revenueGenerated - marketing.adSpend;
    const roi = (netProfit / marketing.adSpend) * 100;
    const roas = marketing.revenueGenerated / marketing.adSpend;
    const cltToCAC = marketing.customerLifetimeValue / marketing.customerAcquisitionCost;
    const customersAcquired = Math.floor(marketing.adSpend / marketing.customerAcquisitionCost);
    const profitPerCustomer = marketing.customerLifetimeValue - marketing.customerAcquisitionCost;
    const lifetimeROI = (profitPerCustomer / marketing.customerAcquisitionCost) * 100;

    return {
      netProfit,
      roi: roi.toFixed(2),
      roas: roas.toFixed(2),
      cltToCAC: cltToCAC.toFixed(2),
      customersAcquired,
      profitPerCustomer: profitPerCustomer.toFixed(2),
      lifetimeROI: lifetimeROI.toFixed(2),
      breakEvenCustomers: Math.ceil(marketing.adSpend / marketing.customerLifetimeValue),
    };
  }, [marketing]);

  const investmentCalc = useMemo(() => {
    const r = investment.expectedReturn / 100;
    const n = investment.years;
    const P = investment.principal;
    const c = investment.contributions;
    const frequency = investment.contributionFrequency === "monthly" ? 12 : 1;

    // Future value with compound interest and regular contributions
    let futureValue = P * Math.pow(1 + r, n);

    // Add contributions
    if (frequency === 12) {
      // Monthly contributions
      const monthlyRate = r / 12;
      const totalMonths = n * 12;
      futureValue += c * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    } else {
      // Yearly contributions
      futureValue += c * ((Math.pow(1 + r, n) - 1) / r);
    }

    const totalContributions = P + (c * frequency * n);
    const totalGains = futureValue - totalContributions;
    const roi = ((futureValue - totalContributions) / totalContributions) * 100;

    // Adjust for inflation
    const realReturn = investment.expectedReturn - investment.inflationRate;
    const realFutureValue = P * Math.pow(1 + realReturn / 100, n);
    let realValueWithContributions = realFutureValue;
    if (frequency === 12) {
      const monthlyRealRate = realReturn / 100 / 12;
      const totalMonths = n * 12;
      realValueWithContributions += c * ((Math.pow(1 + monthlyRealRate, totalMonths) - 1) / monthlyRealRate);
    } else {
      realValueWithContributions += c * ((Math.pow(1 + realReturn / 100, n) - 1) / (realReturn / 100));
    }

    // Year by year breakdown
    const yearByYear: { year: number; value: number }[] = [];
    for (let year = 1; year <= n; year++) {
      let value = P * Math.pow(1 + r, year);
      if (frequency === 12) {
        const monthlyRate = r / 12;
        const totalMonths = year * 12;
        value += c * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
      } else {
        value += c * ((Math.pow(1 + r, year) - 1) / r);
      }
      yearByYear.push({ year, value: Math.round(value) });
    }

    return {
      futureValue: Math.round(futureValue),
      totalContributions: Math.round(totalContributions),
      totalGains: Math.round(totalGains),
      roi: roi.toFixed(2),
      realFutureValue: Math.round(realValueWithContributions),
      yearByYear,
      doublingTime: Math.log(2) / Math.log(1 + r),
    };
  }, [investment]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const copyResults = () => {
    let text = "";
    if (mode === "basic") {
      text = `ROI Analysis:
Initial Investment: ${formatCurrency(basic.initialInvestment)}
Return Value: ${formatCurrency(basic.returnValue)}
ROI: ${basicCalc.roi}%
Annualized ROI: ${basicCalc.annualizedROI}%`;
    } else if (mode === "marketing") {
      text = `Marketing ROI Analysis:
Ad Spend: ${formatCurrency(marketing.adSpend)}
Revenue: ${formatCurrency(marketing.revenueGenerated)}
ROI: ${marketingCalc.roi}%
ROAS: ${marketingCalc.roas}x`;
    } else {
      text = `Investment Projection:
Initial: ${formatCurrency(investment.principal)}
Monthly: ${formatCurrency(investment.contributions)}
Years: ${investment.years}
Future Value: ${formatCurrency(investmentCalc.futureValue)}
Total Gains: ${formatCurrency(investmentCalc.totalGains)}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="ROI Calculator - Calculate Return on Investment | TechTrendi"
        description="Calculate ROI for investments, marketing campaigns, and business decisions. Free ROI calculator with multiple modes."
        canonicalUrl="https://techtrendi.com/tools/roi-calculator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ROI <span className="text-primary">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Calculate return on investment for any scenario
          </p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="basic">
              <Calculator className="w-4 h-4 mr-2 hidden sm:inline" />
              Basic ROI
            </TabsTrigger>
            <TabsTrigger value="marketing">
              <Target className="w-4 h-4 mr-2 hidden sm:inline" />
              Marketing
            </TabsTrigger>
            <TabsTrigger value="investment">
              <TrendingUp className="w-4 h-4 mr-2 hidden sm:inline" />
              Investment
            </TabsTrigger>
          </TabsList>

          {/* Basic ROI */}
          <TabsContent value="basic">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Investment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Initial Investment ($)</Label>
                    <Input
                      type="number"
                      value={basic.initialInvestment}
                      onChange={(e) =>
                        setBasic((prev) => ({
                          ...prev,
                          initialInvestment: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Return Value ($)</Label>
                    <Input
                      type="number"
                      value={basic.returnValue}
                      onChange={(e) =>
                        setBasic((prev) => ({
                          ...prev,
                          returnValue: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Time Period: {basic.timePeriodMonths} months</Label>
                    <Slider
                      value={[basic.timePeriodMonths]}
                      onValueChange={([v]) =>
                        setBasic((prev) => ({ ...prev, timePeriodMonths: v }))
                      }
                      min={1}
                      max={60}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-primary/30">
                  <CardHeader className="text-center">
                    <CardTitle className="text-muted-foreground text-sm">Return on Investment</CardTitle>
                    <p className={cn(
                      "text-5xl font-bold",
                      parseFloat(basicCalc.roi) >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {basicCalc.roi}%
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className={cn(
                          "text-xl font-bold",
                          basicCalc.gain >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {formatCurrency(basicCalc.gain)}
                        </p>
                        <p className="text-sm text-muted-foreground">Net Gain/Loss</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xl font-bold">{basicCalc.annualizedROI}%</p>
                        <p className="text-sm text-muted-foreground">Annualized</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Monthly Return</span>
                        <span className="font-bold">{basicCalc.monthlyReturn}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Break-even Point</span>
                        <span className="font-bold">{basicCalc.breakEvenMonths} months</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Marketing ROI */}
          <TabsContent value="marketing">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Campaign Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Total Ad Spend ($)</Label>
                      <Input
                        type="number"
                        value={marketing.adSpend}
                        onChange={(e) =>
                          setMarketing((prev) => ({
                            ...prev,
                            adSpend: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Revenue Generated ($)</Label>
                      <Input
                        type="number"
                        value={marketing.revenueGenerated}
                        onChange={(e) =>
                          setMarketing((prev) => ({
                            ...prev,
                            revenueGenerated: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Customer Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Customer Acquisition Cost ($)</Label>
                      <Input
                        type="number"
                        value={marketing.customerAcquisitionCost}
                        onChange={(e) =>
                          setMarketing((prev) => ({
                            ...prev,
                            customerAcquisitionCost: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Customer Lifetime Value ($)</Label>
                      <Input
                        type="number"
                        value={marketing.customerLifetimeValue}
                        onChange={(e) =>
                          setMarketing((prev) => ({
                            ...prev,
                            customerLifetimeValue: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Conversion Rate: {marketing.conversionRate}%</Label>
                      <Slider
                        value={[marketing.conversionRate]}
                        onValueChange={([v]) =>
                          setMarketing((prev) => ({ ...prev, conversionRate: v }))
                        }
                        min={0.1}
                        max={20}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-primary/30">
                  <CardHeader className="text-center">
                    <CardTitle className="text-muted-foreground text-sm">Marketing ROI</CardTitle>
                    <p className={cn(
                      "text-5xl font-bold",
                      parseFloat(marketingCalc.roi) >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {marketingCalc.roi}%
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className={cn(
                          "text-xl font-bold",
                          marketingCalc.netProfit >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {formatCurrency(marketingCalc.netProfit)}
                        </p>
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xl font-bold">{marketingCalc.roas}x</p>
                        <p className="text-sm text-muted-foreground">ROAS</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Customer Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>CLV:CAC Ratio</span>
                      <span className={cn(
                        "font-bold",
                        parseFloat(marketingCalc.cltToCAC) >= 3 ? "text-green-500" :
                        parseFloat(marketingCalc.cltToCAC) >= 1 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {marketingCalc.cltToCAC}:1
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>Customers Acquired</span>
                      <span className="font-bold">{marketingCalc.customersAcquired}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>Lifetime ROI per Customer</span>
                      <span className="font-bold text-green-500">{marketingCalc.lifetimeROI}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>Break-even Customers</span>
                      <span className="font-bold">{marketingCalc.breakEvenCustomers}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">
                      {parseFloat(marketingCalc.cltToCAC) >= 3
                        ? "Excellent CLV:CAC ratio! Your marketing is very efficient."
                        : parseFloat(marketingCalc.cltToCAC) >= 1
                        ? "Good ratio, but there's room for improvement."
                        : "Your CAC is higher than CLV. Consider optimizing your funnel."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Investment ROI */}
          <TabsContent value="investment">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Investment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Initial Principal ($)</Label>
                      <Input
                        type="number"
                        value={investment.principal}
                        onChange={(e) =>
                          setInvestment((prev) => ({
                            ...prev,
                            principal: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Regular Contribution ($)</Label>
                      <Input
                        type="number"
                        value={investment.contributions}
                        onChange={(e) =>
                          setInvestment((prev) => ({
                            ...prev,
                            contributions: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Contribution Frequency</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant={investment.contributionFrequency === "monthly" ? "default" : "outline"}
                          onClick={() =>
                            setInvestment((prev) => ({ ...prev, contributionFrequency: "monthly" }))
                          }
                          className="flex-1"
                        >
                          Monthly
                        </Button>
                        <Button
                          variant={investment.contributionFrequency === "yearly" ? "default" : "outline"}
                          onClick={() =>
                            setInvestment((prev) => ({ ...prev, contributionFrequency: "yearly" }))
                          }
                          className="flex-1"
                        >
                          Yearly
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Growth Parameters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Expected Annual Return: {investment.expectedReturn}%</Label>
                      <Slider
                        value={[investment.expectedReturn]}
                        onValueChange={([v]) =>
                          setInvestment((prev) => ({ ...prev, expectedReturn: v }))
                        }
                        min={1}
                        max={20}
                        step={0.5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Investment Period: {investment.years} years</Label>
                      <Slider
                        value={[investment.years]}
                        onValueChange={([v]) =>
                          setInvestment((prev) => ({ ...prev, years: v }))
                        }
                        min={1}
                        max={40}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Expected Inflation: {investment.inflationRate}%</Label>
                      <Slider
                        value={[investment.inflationRate]}
                        onValueChange={([v]) =>
                          setInvestment((prev) => ({ ...prev, inflationRate: v }))
                        }
                        min={0}
                        max={10}
                        step={0.5}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-primary/30">
                  <CardHeader className="text-center">
                    <CardTitle className="text-muted-foreground text-sm">Future Value</CardTitle>
                    <p className="text-5xl font-bold text-green-500">
                      {formatCurrency(investmentCalc.futureValue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(investmentCalc.realFutureValue)} in today's dollars
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xl font-bold">{formatCurrency(investmentCalc.totalContributions)}</p>
                        <p className="text-sm text-muted-foreground">Total Invested</p>
                      </div>
                      <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                        <p className="text-xl font-bold text-green-500">
                          {formatCurrency(investmentCalc.totalGains)}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Gains</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Growth Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40 flex items-end gap-1">
                      {investmentCalc.yearByYear.slice(0, 20).map((year, i) => (
                        <div
                          key={year.year}
                          className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t"
                          style={{
                            height: `${(year.value / investmentCalc.futureValue) * 100}%`,
                          }}
                          title={`Year ${year.year}: ${formatCurrency(year.value)}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Year 1</span>
                      <span>Year {Math.min(investment.years, 20)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>Total ROI</span>
                      <span className="font-bold text-green-500">{investmentCalc.roi}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>Doubling Time</span>
                      <span className="font-bold">{investmentCalc.doublingTime.toFixed(1)} years</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center mt-8">
          <Button onClick={copyResults}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            Copy Results
          </Button>
        </div>
      </div>
    </Layout>
  );
}
