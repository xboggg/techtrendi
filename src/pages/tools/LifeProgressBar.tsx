import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Clock, Calendar, Heart, Target, Share2, Download, Sun, Moon,
  Coffee, Utensils, Bed, Briefcase, Sparkles, Timer, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LifeStats {
  birthDate: string;
  lifeExpectancy: number;
}

const defaultStats: LifeStats = {
  birthDate: "",
  lifeExpectancy: 80,
};

export default function LifeProgressBar() {
  const [stats, setStats] = useState<LifeStats>(defaultStats);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem("techtrendi_life_progress");
    if (saved) {
      setStats(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("techtrendi_life_progress", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const calculations = useMemo(() => {
    if (!stats.birthDate) return null;

    const birth = new Date(stats.birthDate);
    const ageMs = now.getTime() - birth.getTime();
    const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    const ageWeeks = ageDays / 7;
    const ageMonths = ageYears * 12;
    const ageHours = ageMs / (60 * 60 * 1000);
    const ageMinutes = ageMs / (60 * 1000);
    const ageSeconds = ageMs / 1000;

    const totalLifeMs = stats.lifeExpectancy * 365.25 * 24 * 60 * 60 * 1000;
    const lifeProgress = (ageMs / totalLifeMs) * 100;
    const remainingMs = totalLifeMs - ageMs;
    const remainingYears = remainingMs / (365.25 * 24 * 60 * 60 * 1000);
    const remainingDays = remainingMs / (24 * 60 * 60 * 1000);
    const remainingWeeks = remainingDays / 7;
    const remainingMonths = remainingYears * 12;
    const remainingHours = remainingMs / (60 * 60 * 1000);
    const remainingSaturdays = remainingWeeks;

    // Year progress
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const yearProgress = ((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100;

    // Day progress
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayProgress = ((now.getTime() - startOfDay.getTime()) / (24 * 60 * 60 * 1000)) * 100;

    // Week progress (starting Monday)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    const weekProgress = ((now.getTime() - startOfWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)) * 100;

    // Month progress
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthProgress = ((now.getTime() - startOfMonth.getTime()) / (endOfMonth.getTime() - startOfMonth.getTime())) * 100;

    // Estimates (assuming 8 hours sleep, 8 hours work, etc.)
    const sleepHoursLived = (ageDays * 8);
    const workHoursLived = (ageYears - 18 > 0 ? (ageYears - 18) * 250 * 8 : 0); // 250 work days per year
    const mealsEaten = Math.floor(ageDays * 3);
    const heartbeats = Math.floor(ageMinutes * 70); // ~70 bpm average

    return {
      ageYears,
      ageDays: Math.floor(ageDays),
      ageWeeks: Math.floor(ageWeeks),
      ageMonths: Math.floor(ageMonths),
      ageHours: Math.floor(ageHours),
      ageMinutes: Math.floor(ageMinutes),
      ageSeconds: Math.floor(ageSeconds),
      lifeProgress: Math.min(lifeProgress, 100),
      remainingYears: Math.max(remainingYears, 0),
      remainingDays: Math.max(Math.floor(remainingDays), 0),
      remainingWeeks: Math.max(Math.floor(remainingWeeks), 0),
      remainingMonths: Math.max(Math.floor(remainingMonths), 0),
      remainingHours: Math.max(Math.floor(remainingHours), 0),
      remainingSaturdays: Math.max(Math.floor(remainingSaturdays), 0),
      yearProgress,
      dayProgress,
      weekProgress,
      monthProgress,
      sleepHoursLived: Math.floor(sleepHoursLived),
      workHoursLived: Math.floor(workHoursLived),
      mealsEaten,
      heartbeats,
    };
  }, [stats.birthDate, stats.lifeExpectancy, now]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.floor(num));
  };

  const shareStats = async () => {
    if (!calculations) return;

    const text = `Life Progress: ${calculations.lifeProgress.toFixed(1)}%
Age: ${calculations.ageYears.toFixed(1)} years
Days lived: ${formatNumber(calculations.ageDays)}
Remaining: ~${formatNumber(calculations.remainingDays)} days

Make every day count!
Check yours: techtrendi.com/tools/life-progress-bar`;

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

  const ProgressBar = ({
    value,
    label,
    icon: Icon,
    color = "bg-primary",
    showPercent = true,
  }: {
    value: number;
    label: string;
    icon: any;
    color?: string;
    showPercent?: boolean;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {showPercent && (
          <span className="text-sm text-muted-foreground">{value.toFixed(1)}%</span>
        )}
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-1000 rounded-full", color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <Layout>
      <SEOHead
        title="Life Progress Bar - See Your Life in Perspective | TechTrendi"
        description="Visualize your life progress. See how much of your life you've lived, remaining time, and fascinating stats about your existence."
        canonicalUrl="https://techtrendi.com/tools/life-progress-bar"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Life <span className="text-primary">Progress Bar</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See your life in perspective. Make every moment count.
          </p>
        </div>

        {/* Input */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Your Birth Date</Label>
                <Input
                  type="date"
                  value={stats.birthDate}
                  onChange={(e) => setStats((prev) => ({ ...prev, birthDate: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label>Life Expectancy: {stats.lifeExpectancy} years</Label>
                <Slider
                  value={[stats.lifeExpectancy]}
                  onValueChange={([v]) => setStats((prev) => ({ ...prev, lifeExpectancy: v }))}
                  min={50}
                  max={120}
                  step={1}
                  className="mt-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {calculations ? (
          <div className="space-y-8">
            {/* Main Life Progress */}
            <Card className="border-primary/30">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-5xl md:text-7xl font-bold text-primary">
                  {calculations.lifeProgress.toFixed(2)}%
                </CardTitle>
                <CardDescription className="text-lg">
                  of your life has been lived
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-muted rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000 rounded-full"
                    style={{ width: `${calculations.lifeProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{calculations.ageYears.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Years Old</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{formatNumber(calculations.ageDays)}</p>
                    <p className="text-sm text-muted-foreground">Days Lived</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{formatNumber(calculations.remainingDays)}</p>
                    <p className="text-sm text-muted-foreground">Days Remaining</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{formatNumber(calculations.remainingSaturdays)}</p>
                    <p className="text-sm text-muted-foreground">Saturdays Left</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Progress */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Time Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProgressBar
                    value={calculations.dayProgress}
                    label="Today"
                    icon={Sun}
                    color="bg-yellow-500"
                  />
                  <ProgressBar
                    value={calculations.weekProgress}
                    label="This Week"
                    icon={Calendar}
                    color="bg-blue-500"
                  />
                  <ProgressBar
                    value={calculations.monthProgress}
                    label="This Month"
                    icon={Calendar}
                    color="bg-purple-500"
                  />
                  <ProgressBar
                    value={calculations.yearProgress}
                    label={`Year ${now.getFullYear()}`}
                    icon={Target}
                    color="bg-green-500"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Remaining Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Years</span>
                      </div>
                      <span className="font-bold">{calculations.remainingYears.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Months</span>
                      </div>
                      <span className="font-bold">{formatNumber(calculations.remainingMonths)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Weeks</span>
                      </div>
                      <span className="font-bold">{formatNumber(calculations.remainingWeeks)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Hours</span>
                      </div>
                      <span className="font-bold">{formatNumber(calculations.remainingHours)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fun Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Fascinating Stats About Your Life
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-lg text-center">
                    <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <p className="text-lg font-bold">{formatNumber(calculations.heartbeats)}</p>
                    <p className="text-xs text-muted-foreground">Heartbeats</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg text-center">
                    <Bed className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-lg font-bold">{formatNumber(calculations.sleepHoursLived)}</p>
                    <p className="text-xs text-muted-foreground">Hours Slept</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-lg text-center">
                    <Utensils className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-lg font-bold">{formatNumber(calculations.mealsEaten)}</p>
                    <p className="text-xs text-muted-foreground">Meals Eaten</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-lg text-center">
                    <Briefcase className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                    <p className="text-lg font-bold">{formatNumber(calculations.workHoursLived)}</p>
                    <p className="text-xs text-muted-foreground">Work Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Counter */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Live Counter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-mono font-bold text-primary">
                    {formatNumber(calculations.ageSeconds)}
                  </p>
                  <p className="text-muted-foreground">seconds lived</p>
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <div className="flex justify-center">
              <Button onClick={shareStats} size="lg" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share Your Stats
              </Button>
            </div>

            {/* Motivational Quote */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 text-center">
                <p className="text-lg italic text-muted-foreground">
                  "The trouble is, you think you have time."
                </p>
                <p className="text-sm text-muted-foreground mt-2">— Buddha</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Enter Your Birth Date</h2>
              <p className="text-muted-foreground">
                See fascinating stats about your life journey
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
