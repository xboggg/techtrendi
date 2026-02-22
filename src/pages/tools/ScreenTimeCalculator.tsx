import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Monitor, Smartphone, Tv, Tablet, Share2, Clock, Calendar, TrendingUp,
  AlertTriangle, Book, Dumbbell, Users, Coffee, Plane, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScreenTimeData {
  phone: number;
  computer: number;
  tv: number;
  tablet: number;
  gaming: number;
  age: number;
}

const defaultData: ScreenTimeData = {
  phone: 4,
  computer: 6,
  tv: 2,
  tablet: 0,
  gaming: 1,
  age: 30,
};

export default function ScreenTimeCalculator() {
  const [data, setData] = useState<ScreenTimeData>(defaultData);

  const updateData = (field: keyof ScreenTimeData, value: number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const calculations = useMemo(() => {
    const totalDaily = data.phone + data.computer + data.tv + data.tablet + data.gaming;
    const totalWeekly = totalDaily * 7;
    const totalMonthly = totalDaily * 30;
    const totalYearly = totalDaily * 365;

    // Remaining life calculations (assuming life expectancy of 80)
    const remainingYears = Math.max(80 - data.age, 0);
    const lifetimeHours = totalYearly * remainingYears;
    const lifetimeDays = lifetimeHours / 24;
    const lifetimeYears = lifetimeDays / 365;

    // Hours already spent (assuming started at age 10)
    const yearsWithScreens = Math.max(data.age - 10, 0);
    const alreadySpentHours = totalYearly * yearsWithScreens * 0.5; // Assume half current usage historically
    const alreadySpentYears = alreadySpentHours / (24 * 365);

    // Awake hours (assuming 16 hours awake per day)
    const awakeHours = 16;
    const screenPercentage = (totalDaily / awakeHours) * 100;

    // What you could do instead
    const booksPerYear = Math.floor((totalYearly * 0.2) / 5); // If 20% was reading, 5 hours per book
    const workoutsPerYear = Math.floor((totalYearly * 0.1) / 1); // If 10% was exercise, 1 hour per workout
    const languageProgress = Math.floor((totalYearly * 0.1) / 600); // 600 hours to learn a language
    const vacationDays = Math.floor(totalYearly / 24);

    // Economic impact
    const averageHourlyWage = 30;
    const opportunityCostYearly = totalYearly * averageHourlyWage;
    const opportunityCostLifetime = lifetimeHours * averageHourlyWage;

    return {
      totalDaily,
      totalWeekly,
      totalMonthly,
      totalYearly,
      lifetimeHours,
      lifetimeDays: Math.floor(lifetimeDays),
      lifetimeYears: lifetimeYears.toFixed(1),
      alreadySpentYears: alreadySpentYears.toFixed(1),
      screenPercentage: Math.min(screenPercentage, 100).toFixed(1),
      booksPerYear,
      workoutsPerYear,
      languageProgress,
      vacationDays,
      opportunityCostYearly,
      opportunityCostLifetime,
    };
  }, [data]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.floor(num));
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const shareResults = async () => {
    const text = `My Screen Time Stats:
Daily: ${calculations.totalDaily} hours
Weekly: ${calculations.totalWeekly} hours
Yearly: ${formatNumber(calculations.totalYearly)} hours

That's ${calculations.screenPercentage}% of my waking hours!

Calculate yours: techtrendi.com/tools/screen-time-calculator`;

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

  const DeviceSlider = ({
    icon: Icon,
    label,
    field,
    color,
  }: {
    icon: any;
    label: string;
    field: keyof ScreenTimeData;
    color: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", color)}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-lg font-bold">{data[field]}h</span>
      </div>
      <Slider
        value={[data[field]]}
        onValueChange={([v]) => updateData(field, v)}
        min={0}
        max={12}
        step={0.5}
      />
    </div>
  );

  return (
    <Layout>
      <SEOHead
        title="Screen Time Calculator - See Your Digital Life Stats | TechTrendi"
        description="Calculate your daily screen time and see shocking statistics about how much of your life you spend on screens."
        canonicalUrl="https://techtrendi.com/tools/screen-time-calculator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Screen Time <span className="text-primary">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover how much of your life you spend staring at screens
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Screen Time by Device</CardTitle>
                <CardDescription>Estimate your average daily usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <DeviceSlider
                  icon={Smartphone}
                  label="Phone"
                  field="phone"
                  color="bg-blue-500"
                />
                <DeviceSlider
                  icon={Monitor}
                  label="Computer/Laptop"
                  field="computer"
                  color="bg-purple-500"
                />
                <DeviceSlider
                  icon={Tv}
                  label="TV/Streaming"
                  field="tv"
                  color="bg-red-500"
                />
                <DeviceSlider
                  icon={Tablet}
                  label="Tablet"
                  field="tablet"
                  color="bg-green-500"
                />
                <DeviceSlider
                  icon={Monitor}
                  label="Gaming"
                  field="gaming"
                  color="bg-orange-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Age</CardTitle>
                <CardDescription>For lifetime calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[data.age]}
                    onValueChange={([v]) => updateData("age", v)}
                    min={10}
                    max={80}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold w-16 text-right">{data.age}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {/* Main Stats */}
            <Card className="border-primary/30">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-5xl font-bold text-primary">
                  {calculations.totalDaily}h
                </CardTitle>
                <CardDescription className="text-lg">per day on screens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>% of waking hours</span>
                    <span>{calculations.screenPercentage}%</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all rounded-full",
                        parseFloat(calculations.screenPercentage) > 75
                          ? "bg-red-500"
                          : parseFloat(calculations.screenPercentage) > 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      )}
                      style={{ width: `${calculations.screenPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold">{calculations.totalWeekly}h</p>
                    <p className="text-xs text-muted-foreground">Weekly</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold">{formatNumber(calculations.totalMonthly)}h</p>
                    <p className="text-xs text-muted-foreground">Monthly</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold">{formatNumber(calculations.totalYearly)}h</p>
                    <p className="text-xs text-muted-foreground">Yearly</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lifetime Impact */}
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Lifetime Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-500">{calculations.lifetimeYears}</p>
                    <p className="text-sm text-muted-foreground">Years remaining on screens</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-500">{calculations.alreadySpentYears}</p>
                    <p className="text-sm text-muted-foreground">Years already spent</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  At your current rate, you'll spend approximately{" "}
                  <strong>{formatNumber(calculations.lifetimeHours)} hours</strong> on screens
                  for the rest of your life.
                </p>
              </CardContent>
            </Card>

            {/* What You Could Do Instead */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What You Could Do With That Time</CardTitle>
                <CardDescription>If you cut your screen time by 20%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Book className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-bold">{calculations.booksPerYear}</p>
                      <p className="text-xs text-muted-foreground">Books/year</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Dumbbell className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-bold">{calculations.workoutsPerYear}</p>
                      <p className="text-xs text-muted-foreground">Workouts/year</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Users className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-bold">{calculations.languageProgress}</p>
                      <p className="text-xs text-muted-foreground">Languages learned</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Plane className="w-5 h-5 text-cyan-500" />
                    <div>
                      <p className="font-bold">{calculations.vacationDays}</p>
                      <p className="text-xs text-muted-foreground">Vacation days/year</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Economic Cost */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Opportunity Cost
                </CardTitle>
                <CardDescription>If that time was used productively</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(calculations.opportunityCostYearly)}
                    </p>
                    <p className="text-sm text-muted-foreground">Per year</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(calculations.opportunityCostLifetime)}
                    </p>
                    <p className="text-sm text-muted-foreground">Lifetime</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Based on average hourly wage of $30
                </p>
              </CardContent>
            </Card>

            <Button onClick={shareResults} className="w-full" size="lg">
              <Share2 className="w-4 h-4 mr-2" />
              Share Your Stats
            </Button>
          </div>
        </div>

        {/* Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Tips to Reduce Screen Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Set time limits</p>
                  <p className="text-xs text-muted-foreground">
                    Use built-in screen time tools on your devices
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Monitor className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Create phone-free zones</p>
                  <p className="text-xs text-muted-foreground">
                    Bedroom and dining table are great starts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Schedule offline activities</p>
                  <p className="text-xs text-muted-foreground">
                    Plan activities that don't involve screens
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
