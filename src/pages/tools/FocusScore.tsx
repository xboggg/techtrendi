import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Target, Brain, Clock, Zap, TrendingUp, Calendar, Share2,
  CheckCircle2, XCircle, AlertCircle, Coffee, Moon, Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface DailyScore {
  date: string;
  scores: {
    deepWork: number;
    distractions: number;
    energy: number;
    tasksCompleted: number;
    sleepQuality: number;
    breaks: number;
  };
  totalScore: number;
}

const STORAGE_KEY = "techtrendi_focus_score";

const metrics = [
  { id: "deepWork", label: "Deep Work Hours", icon: Brain, max: 8, unit: "hours", description: "Uninterrupted focused work time" },
  { id: "distractions", label: "Distraction Level", icon: Smartphone, max: 10, unit: "level", description: "How often were you distracted? (0=lots, 10=none)", inverted: true },
  { id: "energy", label: "Energy Level", icon: Zap, max: 10, unit: "level", description: "Your mental energy throughout the day" },
  { id: "tasksCompleted", label: "Tasks Completed", icon: CheckCircle2, max: 10, unit: "tasks", description: "Important tasks you finished" },
  { id: "sleepQuality", label: "Sleep Quality", icon: Moon, max: 10, unit: "level", description: "How well did you sleep last night?" },
  { id: "breaks", label: "Healthy Breaks", icon: Coffee, max: 5, unit: "breaks", description: "Mindful breaks taken (walks, stretches)" },
];

export default function FocusScore() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyScore[]>([]);
  const [currentScores, setCurrentScores] = useState({
    deepWork: 4,
    distractions: 5,
    energy: 5,
    tasksCompleted: 3,
    sleepQuality: 6,
    breaks: 2,
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEntries(parsed.entries || []);

        const todayEntry = parsed.entries?.find((e: DailyScore) => e.date === today);
        if (todayEntry) {
          setCurrentScores(todayEntry.scores);
        }
      }
    }
  }, [user, today]);

  const calculateScore = (scores: typeof currentScores) => {
    const weights = {
      deepWork: 25, // 25 points max (25/8 = 3.125 per hour)
      distractions: 20, // 20 points max
      energy: 15, // 15 points max
      tasksCompleted: 20, // 20 points max (2 per task)
      sleepQuality: 10, // 10 points max
      breaks: 10, // 10 points max (2 per break)
    };

    let total = 0;
    total += (scores.deepWork / 8) * weights.deepWork;
    total += (scores.distractions / 10) * weights.distractions;
    total += (scores.energy / 10) * weights.energy;
    total += (scores.tasksCompleted / 10) * weights.tasksCompleted;
    total += (scores.sleepQuality / 10) * weights.sleepQuality;
    total += (scores.breaks / 5) * weights.breaks;

    return Math.round(total);
  };

  const todayScore = calculateScore(currentScores);

  const saveScore = () => {
    const newEntry: DailyScore = {
      date: today,
      scores: currentScores,
      totalScore: todayScore,
    };

    const updatedEntries = entries.filter((e) => e.date !== today);
    updatedEntries.unshift(newEntry);
    setEntries(updatedEntries);

    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify({ entries: updatedEntries }));
    }

    toast.success("Focus score saved!");
  };

  const weeklyStats = useMemo(() => {
    const last7Days: DailyScore[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const entry = entries.find((e) => e.date === dateStr);
      if (entry) {
        last7Days.push(entry);
      }
    }
    return last7Days;
  }, [entries]);

  const averageScore = useMemo(() => {
    if (weeklyStats.length === 0) return 0;
    return Math.round(weeklyStats.reduce((sum, e) => sum + e.totalScore, 0) / weeklyStats.length);
  }, [weeklyStats]);

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: "Exceptional", color: "text-green-500", icon: Zap };
    if (score >= 75) return { label: "Excellent", color: "text-green-400", icon: TrendingUp };
    if (score >= 60) return { label: "Good", color: "text-blue-500", icon: CheckCircle2 };
    if (score >= 40) return { label: "Average", color: "text-yellow-500", icon: AlertCircle };
    return { label: "Needs Work", color: "text-red-500", icon: XCircle };
  };

  const scoreInfo = getScoreLabel(todayScore);

  const shareScore = async () => {
    const text = `My Focus Score Today: ${todayScore}/100 (${scoreInfo.label})

Deep Work: ${currentScores.deepWork}h
Tasks Completed: ${currentScores.tasksCompleted}
Energy Level: ${currentScores.energy}/10

Track your focus: techtrendi.com/tools/focus-score`;

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

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Focus Score Calculator - Rate Your Productivity | TechTrendi"
          description="Calculate your daily focus score. Track deep work, distractions, and energy to improve your productivity."
          canonicalUrl="https://techtrendi.com/tools/focus-score"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Target className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Focus Score Calculator</h1>
              <p className="text-muted-foreground mb-6">
                Rate your daily focus and productivity. Sign in to track your progress.
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
        title="Focus Score Calculator - Rate Your Productivity | TechTrendi"
        description="Calculate your daily focus score. Track deep work, distractions, and energy to improve your productivity."
        canonicalUrl="https://techtrendi.com/tools/focus-score"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Focus <span className="text-primary">Score</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Rate your daily productivity and track your focus over time
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Score Input */}
          <div className="space-y-6">
            {/* Score Display */}
            <Card className="border-primary/30">
              <CardContent className="pt-8 pb-8 text-center">
                <div className={cn("text-7xl font-bold mb-2", scoreInfo.color)}>
                  {todayScore}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <scoreInfo.icon className={cn("w-5 h-5", scoreInfo.color)} />
                  <span className={cn("text-lg font-medium", scoreInfo.color)}>
                    {scoreInfo.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rate Your Day</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {metrics.map((metric) => (
                  <div key={metric.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <metric.icon className="w-4 h-4 text-muted-foreground" />
                        <Label>{metric.label}</Label>
                      </div>
                      <span className="font-bold">
                        {currentScores[metric.id as keyof typeof currentScores]}{" "}
                        <span className="text-muted-foreground font-normal">{metric.unit}</span>
                      </span>
                    </div>
                    <Slider
                      value={[currentScores[metric.id as keyof typeof currentScores]]}
                      onValueChange={([v]) =>
                        setCurrentScores((prev) => ({ ...prev, [metric.id]: v }))
                      }
                      min={0}
                      max={metric.max}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={saveScore} className="flex-1">
                Save Today's Score
              </Button>
              <Button variant="outline" onClick={shareScore}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="space-y-6">
            {/* Weekly Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-3xl font-bold">{averageScore}</p>
                  <p className="text-xs text-muted-foreground">7-Day Average</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-3xl font-bold">{entries.length}</p>
                  <p className="text-xs text-muted-foreground">Days Tracked</p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyStats.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No data yet. Start tracking today!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {weeklyStats.map((entry) => {
                      const info = getScoreLabel(entry.totalScore);
                      return (
                        <div
                          key={entry.date}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <span className="text-sm">
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  entry.totalScore >= 75 ? "bg-green-500" :
                                  entry.totalScore >= 50 ? "bg-blue-500" :
                                  entry.totalScore >= 25 ? "bg-yellow-500" : "bg-red-500"
                                )}
                                style={{ width: `${entry.totalScore}%` }}
                              />
                            </div>
                            <span className={cn("font-bold w-8 text-right", info.color)}>
                              {entry.totalScore}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Focus Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {currentScores.deepWork < 4 && (
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span>Try to increase deep work time to at least 4 hours for optimal productivity</span>
                    </li>
                  )}
                  {currentScores.distractions < 5 && (
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span>Consider using website blockers or phone-free time to reduce distractions</span>
                    </li>
                  )}
                  {currentScores.sleepQuality < 6 && (
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span>Poor sleep affects focus. Try a consistent sleep schedule</span>
                    </li>
                  )}
                  {currentScores.breaks < 2 && (
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span>Taking regular breaks actually improves focus. Try the Pomodoro technique</span>
                    </li>
                  )}
                  {todayScore >= 75 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Great job! Your focus habits are on point today</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
