import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrencyFromUSD, formatCurrency, getPreferredCurrency, setPreferredCurrency } from "@/lib/currencies";
import { CurrencySelector } from "@/components/tools/CurrencySelector";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Calculator,
  Eye,
  MousePointer,
  Share2,
  Lightbulb,
  Info,
} from "lucide-react";

// ── Niche CPC suggestions (in USD) ──────────────────────────────────
const NICHE_CPC: Record<string, number> = {
  Technology: 0.35,
  Finance: 1.50,
  Health: 0.65,
  Education: 0.45,
  Entertainment: 0.12,
  Travel: 0.40,
  Food: 0.20,
  Fashion: 0.25,
  Legal: 2.50,
  Insurance: 3.00,
};

const NICHES = Object.keys(NICHE_CPC);

// ── Tips data ────────────────────────────────────────────────────────
const OPTIMIZATION_TIPS = [
  "Place ads above the fold and near your main content for higher CTR.",
  "High-CPC niches like Finance, Insurance, and Legal can earn 5-10x more per click.",
  "Use responsive ad units to maximize fill rate across all devices.",
  "Longer content (1500+ words) tends to earn more because users see more ad impressions.",
  "Avoid placing too many ads on a single page - Google may penalize ad-heavy pages.",
  "Experiment with ad placements using A/B testing to find the sweet spot.",
  "Focus on high-intent keywords - commercial queries generate higher CPC.",
  "Page speed matters: faster sites have lower bounce rates and more ad impressions.",
  "Enable Auto Ads to let Google find optimal placements automatically.",
  "Organic traffic from search engines typically has the highest AdSense RPM.",
];

export default function AdSenseCalculator() {
  // Input state
  const [dailyPageViews, setDailyPageViews] = useState(10000);
  const [ctr, setCtr] = useState(2);
  const [cpc, setCpc] = useState(0.25);
  const [niche, setNiche] = useState("Technology");
  const [growthRate, setGrowthRate] = useState(5);
  const [currency, setCurrency] = useState(getPreferredCurrency);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleNicheChange = (value: string) => {
    setNiche(value);
    const suggestedCpc = NICHE_CPC[value];
    if (suggestedCpc) {
      setCpc(suggestedCpc);
    }
  };

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    setPreferredCurrency(code);
  };

  const handlePageViewsInput = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setDailyPageViews(Math.min(num, 1000000));
    } else if (value === "") {
      setDailyPageViews(0);
    }
  };

  // ── Calculations ─────────────────────────────────────────────────────
  const results = useMemo(() => {
    const dailyClicks = dailyPageViews * (ctr / 100);
    const dailyRevenue = dailyClicks * cpc;
    const monthlyRevenue = dailyRevenue * 30;
    const yearlyRevenue = dailyRevenue * 365;
    const rpm = dailyPageViews > 0 ? (dailyRevenue / dailyPageViews) * 1000 : 0;

    return { dailyClicks, dailyRevenue, monthlyRevenue, yearlyRevenue, rpm };
  }, [dailyPageViews, ctr, cpc]);

  // ── 12-month projection ─────────────────────────────────────────────
  const projection = useMemo(() => {
    const months: { month: number; pageViews: number; revenue: number; cumulative: number }[] = [];
    let currentDailyViews = dailyPageViews;
    let cumulative = 0;

    for (let i = 1; i <= 12; i++) {
      const dailyClicks = currentDailyViews * (ctr / 100);
      const dailyRev = dailyClicks * cpc;
      const monthlyRev = dailyRev * 30;
      cumulative += monthlyRev;

      months.push({
        month: i,
        pageViews: Math.round(currentDailyViews),
        revenue: monthlyRev,
        cumulative,
      });

      currentDailyViews *= 1 + growthRate / 100;
    }

    return months;
  }, [dailyPageViews, ctr, cpc, growthRate]);

  // ── Share ────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const text = [
      "AdSense Revenue Estimate",
      "=".repeat(30),
      `Daily Page Views: ${dailyPageViews.toLocaleString()}`,
      `CTR: ${ctr}%`,
      `CPC: ${formatCurrencyFromUSD(cpc, currency)}`,
      `Niche: ${niche}`,
      "",
      `Daily Revenue: ${formatCurrencyFromUSD(results.dailyRevenue, currency)}`,
      `Monthly Revenue: ${formatCurrencyFromUSD(results.monthlyRevenue, currency)}`,
      `Yearly Revenue: ${formatCurrencyFromUSD(results.yearlyRevenue, currency)}`,
      `RPM: ${formatCurrencyFromUSD(results.rpm, currency)}`,
      "",
      "Generated by TechTrendi AdSense Calculator",
      "https://techtrendi.com/tools/adsense-calculator",
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Results copied to clipboard!");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Results copied to clipboard!");
      } catch {
        toast.error("Could not copy to clipboard");
      }
    }
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <Layout>
      <SEOHead
        title="AdSense Revenue Calculator | TechTrendi"
        description="Estimate your Google AdSense earnings based on page views, CTR, and CPC. Includes 12-month revenue projections and optimization tips for bloggers and YouTubers."
        canonicalUrl="https://techtrendi.com/tools/adsense-calculator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium mb-4">
            Free Tool
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AdSense Revenue <span className="text-primary">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Estimate your potential Google AdSense earnings. Adjust page views, CTR, CPC, and niche to see daily, monthly, and yearly projections.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left Column: Inputs ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Niche & Currency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Niche / Category</Label>
                    <Select value={niche} onValueChange={handleNicheChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NICHES.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n} (avg {formatCurrency(NICHE_CPC[n], "USD")} CPC)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecting a niche auto-fills a suggested CPC
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Display Currency</Label>
                    <CurrencySelector
                      value={currency}
                      onChange={handleCurrencyChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Page Views */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Daily Page Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={100}
                      max={1000000}
                      value={dailyPageViews}
                      onChange={(e) => handlePageViewsInput(e.target.value)}
                      className="w-40"
                    />
                    <span className="text-sm text-muted-foreground">views/day</span>
                  </div>
                  <Slider
                    value={[dailyPageViews]}
                    onValueChange={([v]) => setDailyPageViews(v)}
                    min={100}
                    max={1000000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>100</span>
                    <span>250K</span>
                    <span>500K</span>
                    <span>750K</span>
                    <span>1M</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTR & CPC */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="w-5 h-5 text-primary" />
                  CTR & CPC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* CTR */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Click-Through Rate (CTR)</Label>
                      <span className="text-sm font-semibold text-primary">{ctr.toFixed(1)}%</span>
                    </div>
                    <Slider
                      value={[ctr]}
                      onValueChange={([v]) => setCtr(v)}
                      min={0.5}
                      max={10}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.5%</span>
                      <span>5%</span>
                      <span>10%</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      Average CTR is 1-3%. Higher with well-placed ads.
                    </p>
                  </div>

                  {/* CPC */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Cost Per Click (CPC)</Label>
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrencyFromUSD(cpc, currency)}
                      </span>
                    </div>
                    <Slider
                      value={[cpc]}
                      onValueChange={([v]) => setCpc(parseFloat(v.toFixed(2)))}
                      min={0.01}
                      max={5}
                      step={0.01}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrencyFromUSD(0.01, currency)}</span>
                      <span>{formatCurrencyFromUSD(2.5, currency)}</span>
                      <span>{formatCurrencyFromUSD(5, currency)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      CPC varies by niche. Finance & Insurance are highest.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 12-Month Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  12-Month Revenue Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Monthly Traffic Growth Rate</Label>
                    <span className="text-sm font-semibold text-primary">{growthRate}%</span>
                  </div>
                  <Slider
                    value={[growthRate]}
                    onValueChange={([v]) => setGrowthRate(v)}
                    min={0}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% (no growth)</span>
                    <span>10%</span>
                    <span>20%</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Month</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">Daily Views</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">Monthly Rev.</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projection.map((row) => (
                        <tr
                          key={row.month}
                          className={cn(
                            "border-b last:border-0 transition-colors",
                            row.month % 2 === 0 && "bg-muted/30"
                          )}
                        >
                          <td className="py-2 px-2 font-medium">{row.month}</td>
                          <td className="py-2 px-2 text-right">{row.pageViews.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-medium">
                            {formatCurrencyFromUSD(row.revenue, currency)}
                          </td>
                          <td className="py-2 px-2 text-right font-semibold text-primary">
                            {formatCurrencyFromUSD(row.cumulative, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right Column: Results + Tips ─────────────────────── */}
          <div className="space-y-6">
            {/* Revenue Cards */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="w-5 h-5 text-primary" />
                  Estimated Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Daily */}
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    Daily Revenue
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrencyFromUSD(results.dailyRevenue, currency)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ~{Math.round(results.dailyClicks).toLocaleString()} clicks/day
                  </div>
                </div>

                {/* Monthly */}
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    Monthly Revenue
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrencyFromUSD(results.monthlyRevenue, currency)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Based on 30 days</div>
                </div>

                {/* Yearly */}
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Yearly Revenue
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrencyFromUSD(results.yearlyRevenue, currency)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Based on 365 days</div>
                </div>

                {/* RPM */}
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <BarChart3 className="w-4 h-4" />
                    Revenue Per 1000 Views (RPM)
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrencyFromUSD(results.rpm, currency)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Earnings per 1,000 page views
                  </div>
                </div>

                {/* Share Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Results
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Quick Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Page Views</span>
                    <span className="font-medium">{dailyPageViews.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Clicks</span>
                    <span className="font-medium">{Math.round(results.dailyClicks).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CTR</span>
                    <span className="font-medium">{ctr.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPC</span>
                    <span className="font-medium">{formatCurrencyFromUSD(cpc, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Niche</span>
                    <span className="font-medium">{niche}</span>
                  </div>
                  {growthRate > 0 && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Year-end monthly rev.</span>
                      <span className="font-semibold text-primary">
                        {formatCurrencyFromUSD(projection[11]?.revenue ?? 0, currency)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  AdSense Optimization Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {OPTIMIZATION_TIPS.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="border-yellow-200 dark:border-yellow-900/50">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Disclaimer:</strong> These are estimates only. Actual AdSense earnings
                  depend on many factors including ad placement, traffic quality, geographic
                  location of visitors, seasonality, ad competition, and Google's algorithms.
                  Use these figures as a rough guide, not a guarantee of income.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
