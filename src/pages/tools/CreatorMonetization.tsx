import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Star,
  Lightbulb,
  Sparkles,
  Crown,
} from "lucide-react";
import { CurrencySelector } from "@/components/tools/CurrencySelector";
import { formatCurrencyFromUSD, getPreferredCurrency, setPreferredCurrency } from "@/lib/currencies";

// --- Platform CPMs (USD per 1000 views) ---

const PLATFORM_CPMS: Record<string, number> = {
  YouTube: 4.0,
  Instagram: 1.5,
  TikTok: 0.5,
  LinkedIn: 6.0,
  Twitter: 1.0,
  Blog: 5.0,
};

const PLATFORMS = Object.keys(PLATFORM_CPMS);

// --- Niches ---

interface NicheConfig {
  name: string;
  multiplier: number;
}

const NICHES: NicheConfig[] = [
  { name: "General", multiplier: 1.0 },
  { name: "Tech", multiplier: 2.5 },
  { name: "Finance", multiplier: 3.0 },
  { name: "Health", multiplier: 1.5 },
  { name: "Business", multiplier: 2.0 },
  { name: "Entertainment", multiplier: 1.2 },
  { name: "B2B", multiplier: 2.8 },
];

// --- Colors ---

const PIE_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444"];

// --- Component ---

export default function CreatorMonetization() {
  const [followers, setFollowers] = useState(10000);
  const [avgViews, setAvgViews] = useState(5000);
  const [engagement, setEngagement] = useState(3.5);
  const [postsPerWeek, setPostsPerWeek] = useState(3);
  const [platform, setPlatform] = useState("YouTube");
  const [niche, setNiche] = useState("General");
  const [currency, setCurrency] = useState(getPreferredCurrency);

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    setPreferredCurrency(code);
  };

  const nicheMult = NICHES.find((n) => n.name === niche)?.multiplier || 1;
  const cpm = PLATFORM_CPMS[platform] || 2;

  const results = useMemo(() => {
    const monthlyPosts = postsPerWeek * 4.33;

    // 1. Ad Revenue / RPM
    const monthlyViews = avgViews * monthlyPosts;
    const adRevenue = (monthlyViews / 1000) * cpm * nicheMult * 0.6; // 60% creator share

    // 2. Brand Sponsorships
    const sponsorsPerMonth = followers >= 100000 ? 4 : followers >= 10000 ? 2 : 1;
    const sponsorRevenue = followers * 0.01 * nicheMult * sponsorsPerMonth;

    // 3. Affiliate Marketing
    const affiliateRevenue = avgViews * monthlyPosts * 0.002 * nicheMult * 10;

    // 4. Digital Products
    const digitalRevenue = followers * (engagement / 100) * 0.002 * 50 * nicheMult;

    const total = adRevenue + sponsorRevenue + affiliateRevenue + digitalRevenue;
    const annual = total * 12;

    return {
      adRevenue,
      sponsorRevenue,
      affiliateRevenue,
      digitalRevenue,
      total,
      annual,
      monthlyViews,
    };
  }, [followers, avgViews, engagement, postsPerWeek, platform, niche]);

  const pieData = [
    { name: "Ad Revenue", value: results.adRevenue },
    { name: "Sponsorships", value: results.sponsorRevenue },
    { name: "Affiliate", value: results.affiliateRevenue },
    { name: "Digital Products", value: results.digitalRevenue },
  ].filter((d) => d.value > 0);

  const growthTip = useMemo(() => {
    if (followers < 1000) {
      return "Focus on consistency. Post daily, engage with every comment, and find your unique angle. Your first 1,000 followers are the hardest — after that, growth compounds.";
    }
    if (followers < 10000) {
      return "You are in the micro-influencer sweet spot. Brands love high engagement rates. Start reaching out for paid collaborations and build an email list for digital products.";
    }
    if (followers < 100000) {
      return "Diversify your revenue. Launch a digital product (course, template, ebook) and set up affiliate partnerships. Consider hiring a virtual assistant for content scheduling.";
    }
    return "You are at scale. Negotiate long-term brand deals, build a team, and invest in evergreen content. Consider launching a membership community for recurring revenue.";
  }, [followers]);

  const fmt = (v: number) => formatCurrencyFromUSD(v, currency);

  function formatSliderValue(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  }

  return (
    <Layout>
      <SEOHead
        title="Creator Monetization Calculator | TechTrendi Tools"
        description="Estimate your earnings as a content creator across YouTube, Instagram, TikTok, and more. Calculate ad revenue, sponsorships, affiliates, and digital product income."
      />

      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-white">
              <Crown className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-purple-900 dark:text-purple-100">
              Creator Monetization Calculator
            </h1>
            <p className="text-purple-700 dark:text-purple-300">
              Estimate your potential earnings across 4 revenue streams
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Inputs */}
            <Card className="border-purple-200 dark:border-purple-800 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                  <Sparkles className="h-5 w-5" /> Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Currency</Label>
                  <CurrencySelector value={currency} onChange={handleCurrencyChange} />
                </div>

                <div>
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Niche</Label>
                  <Select value={niche} onValueChange={setNiche}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NICHES.map((n) => (
                        <SelectItem key={n.name} value={n.name}>
                          {n.name} (x{n.multiplier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Followers</Label>
                    <Badge variant="outline">{formatSliderValue(followers)}</Badge>
                  </div>
                  <Slider
                    min={100}
                    max={1000000}
                    step={100}
                    value={[followers]}
                    onValueChange={([v]) => setFollowers(v)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Avg Views / Post</Label>
                    <Badge variant="outline">{formatSliderValue(avgViews)}</Badge>
                  </div>
                  <Slider
                    min={50}
                    max={500000}
                    step={50}
                    value={[avgViews]}
                    onValueChange={([v]) => setAvgViews(v)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Engagement Rate</Label>
                    <Badge variant="outline">{engagement.toFixed(1)}%</Badge>
                  </div>
                  <Slider
                    min={0.5}
                    max={15}
                    step={0.1}
                    value={[engagement]}
                    onValueChange={([v]) => setEngagement(v)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Posts per Week</Label>
                    <Badge variant="outline">{postsPerWeek}</Badge>
                  </div>
                  <Slider
                    min={1}
                    max={14}
                    step={1}
                    value={[postsPerWeek]}
                    onValueChange={([v]) => setPostsPerWeek(v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6 lg:col-span-2">
              {/* Hero revenue cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-purple-300 bg-purple-600 text-white dark:bg-purple-800">
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-purple-100">Estimated Monthly Revenue</p>
                    <p className="text-4xl font-bold">{fmt(results.total)}</p>
                  </CardContent>
                </Card>
                <Card className="border-purple-300 bg-purple-500 text-white dark:bg-purple-700">
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-purple-100">Estimated Annual Revenue</p>
                    <p className="text-4xl font-bold">{fmt(results.annual)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdown */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">Ad Revenue / RPM</span>
                    </div>
                    <p className="text-xl font-bold">{fmt(results.adRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{platform} CPM: ${cpm.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium">Brand Sponsorships</span>
                    </div>
                    <p className="text-xl font-bold">{fmt(results.sponsorRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Based on follower count & niche</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Affiliate Marketing</span>
                    </div>
                    <p className="text-xl font-bold">{fmt(results.affiliateRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Commission on referred sales</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Digital Products</span>
                    </div>
                    <p className="text-xl font-bold">{fmt(results.digitalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Courses, templates, ebooks</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" /> Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => fmt(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Growth Tip */}
              <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
                <CardContent className="flex gap-3 p-4">
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
                  <div>
                    <p className="mb-1 font-semibold text-purple-800 dark:text-purple-200">Growth Tip</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{growthTip}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" /> How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-purple-500">&#8226;</span>
                      <span><strong>CPM (Cost Per Mille)</strong> is what advertisers pay per 1,000 ad impressions. YouTube typically pays $2-8 CPM, while TikTok pays $0.20-$1. Higher-value niches like Finance and B2B command premium CPMs.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-purple-500">&#8226;</span>
                      <span><strong>Engagement Rate</strong> measures how actively your audience interacts with your content (likes, comments, shares divided by followers). A rate above 3% is considered good. Brands often value engagement more than raw follower counts.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-purple-500">&#8226;</span>
                      <span><strong>The 1,000 True Fans concept</strong> by Kevin Kelly states that a creator only needs 1,000 dedicated fans who each spend $100/year to earn $100K annually. Focus on deepening relationships rather than chasing vanity metrics.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-purple-500">&#8226;</span>
                      <span><strong>Diversify revenue streams.</strong> Relying on ad revenue alone is risky since platform algorithms and CPMs change constantly. The most successful creators earn from 3-4 sources simultaneously.</span>
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
