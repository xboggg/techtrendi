import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Droplets, Plus, Minus, Target, Flame, TrendingUp, Calendar,
  GlassWater, Coffee, Wine, Sparkles, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface WaterEntry {
  date: string;
  glasses: number;
  goal: number;
}

const STORAGE_KEY = "techtrendi_water_tracker";

const quickAddOptions = [
  { icon: GlassWater, label: "Glass", amount: 1, color: "bg-blue-500" },
  { icon: Coffee, label: "Cup", amount: 1, color: "bg-amber-600" },
  { icon: Droplets, label: "Bottle", amount: 2, color: "bg-cyan-500" },
];

export default function WaterTracker() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [dailyGoal, setDailyGoal] = useState(8);
  const [todayGlasses, setTodayGlasses] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEntries(parsed.entries || []);
        setDailyGoal(parsed.dailyGoal || 8);

        const todayEntry = parsed.entries?.find((e: WaterEntry) => e.date === today);
        if (todayEntry) {
          setTodayGlasses(todayEntry.glasses);
        }
      }
    }
  }, [user, today]);

  useEffect(() => {
    if (user) {
      const updatedEntries = entries.filter((e) => e.date !== today);
      updatedEntries.unshift({ date: today, glasses: todayGlasses, goal: dailyGoal });
      setEntries(updatedEntries);
      localStorage.setItem(
        `${STORAGE_KEY}_${user.id}`,
        JSON.stringify({ entries: updatedEntries, dailyGoal })
      );
    }
  }, [todayGlasses, dailyGoal, user, today]);

  const addGlasses = (amount: number) => {
    const newAmount = Math.max(0, todayGlasses + amount);
    setTodayGlasses(newAmount);

    if (amount > 0) {
      toast.success(`Added ${amount} glass${amount > 1 ? "es" : ""}`);
      if (newAmount >= dailyGoal && todayGlasses < dailyGoal) {
        toast.success("Goal reached! Great job staying hydrated!", {
          icon: "🎉",
        });
      }
    }
  };

  const progress = Math.min((todayGlasses / dailyGoal) * 100, 100);
  const remaining = Math.max(dailyGoal - todayGlasses, 0);

  const streak = useMemo(() => {
    let count = 0;
    const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

    for (const entry of sortedEntries) {
      if (entry.glasses >= entry.goal) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [entries]);

  const weeklyStats = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const entry = entries.find((e) => e.date === dateStr);
      last7Days.push({
        date: dateStr,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        glasses: entry?.glasses || 0,
        goal: entry?.goal || dailyGoal,
      });
    }
    return last7Days;
  }, [entries, dailyGoal]);

  const averageGlasses = useMemo(() => {
    const last7 = weeklyStats.filter((d) => d.glasses > 0);
    if (last7.length === 0) return 0;
    return last7.reduce((sum, d) => sum + d.glasses, 0) / last7.length;
  }, [weeklyStats]);

  const waterInOz = todayGlasses * 8;
  const waterInMl = Math.round(waterInOz * 29.5735);

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Water Tracker - Stay Hydrated | TechTrendi"
          description="Track your daily water intake. Set goals, build streaks, and stay healthy with our free water tracker."
          canonicalUrl="https://techtrendi.com/tools/water-tracker"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Droplets className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Water Tracker</h1>
              <p className="text-muted-foreground mb-6">
                Track your daily water intake and build healthy hydration habits.
              </p>
              <Button asChild size="lg">
                <a href="/auth">Sign In to Continue</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Water Tracker - Stay Hydrated | TechTrendi"
        description="Track your daily water intake. Set goals, build streaks, and stay healthy with our free water tracker."
        canonicalUrl="https://techtrendi.com/tools/water-tracker"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Water <span className="text-blue-500">Tracker</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stay hydrated and track your daily water intake
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Main Tracker */}
          <div className="space-y-6">
            {/* Progress Circle */}
            <Card className="border-blue-500/30">
              <CardContent className="pt-8 pb-8">
                <div className="relative w-48 h-48 mx-auto mb-6">
                  {/* Background circle */}
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 88}
                      strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                      className="text-blue-500 transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Droplets className="w-8 h-8 text-blue-500 mb-1" />
                    <span className="text-4xl font-bold">{todayGlasses}</span>
                    <span className="text-muted-foreground text-sm">of {dailyGoal} glasses</span>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="flex justify-center gap-6 text-center mb-6">
                  <div>
                    <p className="text-2xl font-bold">{waterInOz}</p>
                    <p className="text-xs text-muted-foreground">oz</p>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <p className="text-2xl font-bold">{waterInMl}</p>
                    <p className="text-xs text-muted-foreground">ml</p>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <p className="text-2xl font-bold">{remaining}</p>
                    <p className="text-xs text-muted-foreground">left</p>
                  </div>
                </div>

                {/* Add/Remove Buttons */}
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => addGlasses(-1)}
                    disabled={todayGlasses === 0}
                    className="w-16 h-16 rounded-full"
                  >
                    <Minus className="w-6 h-6" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => addGlasses(1)}
                    className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Add */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Add</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-4">
                  {quickAddOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => addGlasses(option.amount)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn("p-3 rounded-full text-white", option.color)}>
                        <option.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        +{option.amount} {option.amount > 1 ? "glasses" : "glass"}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Goal Setting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Daily Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Glasses per day</span>
                    <span className="text-2xl font-bold">{dailyGoal}</span>
                  </div>
                  <Slider
                    value={[dailyGoal]}
                    onValueChange={([v]) => setDailyGoal(v)}
                    min={4}
                    max={16}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {dailyGoal * 8} oz / {Math.round(dailyGoal * 8 * 29.5735)} ml per day
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Stats */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className={streak > 0 ? "border-orange-500/30 bg-orange-500/5" : ""}>
                <CardContent className="pt-6 text-center">
                  <Flame className={cn("w-6 h-6 mx-auto mb-2", streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                  <p className={cn("text-3xl font-bold", streak > 0 ? "text-orange-500" : "")}>{streak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-3xl font-bold">{averageGlasses.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">7-Day Avg</p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end h-32">
                  {weeklyStats.map((day) => {
                    const height = (day.glasses / dailyGoal) * 100;
                    const isGoalMet = day.glasses >= day.goal;
                    const isToday = day.date === today;
                    return (
                      <div key={day.date} className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-full px-1 h-24 flex items-end">
                          <div
                            className={cn(
                              "w-full rounded-t transition-all",
                              isGoalMet ? "bg-green-500" : "bg-blue-400",
                              isToday && "ring-2 ring-primary ring-offset-2"
                            )}
                            style={{ height: `${Math.min(height, 100)}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs",
                          isToday ? "font-bold" : "text-muted-foreground"
                        )}>
                          {day.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>Goal met</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-400" />
                    <span>Below goal</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievement */}
            {progress >= 100 && (
              <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                <CardContent className="pt-6 text-center">
                  <Award className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
                  <h3 className="font-bold text-lg">Goal Achieved!</h3>
                  <p className="text-sm text-muted-foreground">
                    You've hit your hydration goal for today
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Hydration Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Drink a glass of water right when you wake up</li>
                  <li>• Keep a water bottle at your desk</li>
                  <li>• Set reminders throughout the day</li>
                  <li>• Drink a glass before each meal</li>
                  <li>• Your body needs more water during exercise</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
