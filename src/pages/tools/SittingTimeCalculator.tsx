import { useState, useMemo, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Armchair,
  Clock,
  Calendar,
  AlertTriangle,
  Heart,
  Flame,
  Activity,
  TrendingUp,
  Moon,
  Footprints,
  RotateCcw,
  Play,
  Pause,
  Bell,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lightbulb,
  Share2,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SittingData {
  hoursPerDay: number;
  daysPerWeek: number;
  yearsAtJob: number;
}

const defaultData: SittingData = {
  hoursPerDay: 8,
  daysPerWeek: 5,
  yearsAtJob: 5,
};

const exercises = [
  { name: "Neck Rolls", duration: "30 sec", description: "Slowly roll your head in circles" },
  { name: "Shoulder Shrugs", duration: "30 sec", description: "Raise shoulders to ears, hold, release" },
  { name: "Seated Spinal Twist", duration: "30 sec each side", description: "Twist torso, hold chair for support" },
  { name: "Leg Extensions", duration: "10 reps each leg", description: "Straighten leg, hold 3 seconds" },
  { name: "Standing Calf Raises", duration: "15 reps", description: "Rise on toes, lower slowly" },
  { name: "Hip Flexor Stretch", duration: "30 sec each side", description: "Lunge position, push hips forward" },
  { name: "Chest Opener", duration: "30 sec", description: "Clasp hands behind back, lift chest" },
  { name: "Wrist Circles", duration: "30 sec", description: "Rotate wrists in both directions" },
];

const healthTips = [
  "Set a timer to stand every 30 minutes",
  "Take walking meetings when possible",
  "Use a standing desk for part of the day",
  "Do calf raises while on phone calls",
  "Park farther away from building entrances",
  "Take stairs instead of elevators",
  "Walk to a colleague instead of emailing",
  "Stand during TV commercials at home",
];

export default function SittingTimeCalculator() {
  const [data, setData] = useState<SittingData>(defaultData);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30 * 60); // 30 minutes
  const [showExercises, setShowExercises] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);

  const updateData = (field: keyof SittingData, value: number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            toast.success("Time to stand up and stretch!", {
              duration: 10000,
              icon: <Bell className="w-5 h-5 text-orange-500" />,
            });
            setShowExercises(true);
            return 30 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculations = useMemo(() => {
    const hoursPerWeek = data.hoursPerDay * data.daysPerWeek;
    const hoursPerYear = hoursPerWeek * 52;
    const totalHours = hoursPerYear * data.yearsAtJob;
    const totalDays = totalHours / 24;
    const totalYears = totalDays / 365;

    // Distance to moon: 384,400 km, average walking speed: 5 km/h
    // Hours of walking that equals sitting time
    const distanceWalked = totalHours * 5; // km if they had walked instead
    const moonDistance = 384400;
    const moonTrips = distanceWalked / (moonDistance * 2); // Round trip

    // Health impact calculations (based on research approximations)
    // Cardiovascular risk increases by ~14% for each 2 hours of daily sitting over 4 hours
    const excessHours = Math.max(data.hoursPerDay - 4, 0);
    const cardiovascularRisk = Math.min(Math.round((excessHours / 2) * 14), 100);

    // Calories not burned: Sitting burns ~1.5 cal/min, standing/walking burns ~3-5 cal/min
    // Difference of ~2 cal/min or 120 cal/hour
    const caloriesNotBurnedDaily = data.hoursPerDay * 120;
    const caloriesNotBurnedYearly = caloriesNotBurnedDaily * data.daysPerWeek * 52;
    const caloriesNotBurnedTotal = caloriesNotBurnedYearly * data.yearsAtJob;

    // Muscle atrophy risk (0-100 scale)
    const muscleAtrophyRisk = Math.min(Math.round((data.hoursPerDay / 12) * 100), 100);

    // Posture impact score (0-100, higher is worse)
    const postureImpact = Math.min(Math.round(((data.hoursPerDay * data.yearsAtJob) / 50) * 100), 100);

    // What if walked 10 min/hour instead
    const walkingMinutesPerDay = data.hoursPerDay * 10;
    const walkingHoursPerYear = (walkingMinutesPerDay * data.daysPerWeek * 52) / 60;
    const caloriesSavedPerYear = walkingHoursPerYear * 180; // ~180 cal/hour walking
    const poundsSavedPerYear = caloriesSavedPerYear / 3500; // 3500 cal = 1 pound
    const milesWalkedPerYear = walkingHoursPerYear * 3; // ~3 mph walking pace

    return {
      hoursPerWeek,
      hoursPerYear,
      totalHours,
      totalDays: Math.round(totalDays),
      totalYears: totalYears.toFixed(1),
      moonTrips: moonTrips.toFixed(2),
      cardiovascularRisk,
      caloriesNotBurnedDaily: Math.round(caloriesNotBurnedDaily),
      caloriesNotBurnedYearly: Math.round(caloriesNotBurnedYearly),
      caloriesNotBurnedTotal: Math.round(caloriesNotBurnedTotal),
      muscleAtrophyRisk,
      postureImpact,
      walkingMinutesPerDay,
      walkingHoursPerYear: Math.round(walkingHoursPerYear),
      caloriesSavedPerYear: Math.round(caloriesSavedPerYear),
      poundsSavedPerYear: poundsSavedPerYear.toFixed(1),
      milesWalkedPerYear: Math.round(milesWalkedPerYear),
    };
  }, [data]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getRiskColor = (value: number) => {
    if (value >= 70) return "text-red-500";
    if (value >= 40) return "text-orange-500";
    return "text-yellow-500";
  };

  const getRiskBgColor = (value: number) => {
    if (value >= 70) return "bg-red-500";
    if (value >= 40) return "bg-orange-500";
    return "bg-yellow-500";
  };

  const shareResults = async () => {
    const text = `My Sitting Time Impact:
Total sitting time: ${formatNumber(calculations.totalHours)} hours (${calculations.totalYears} years!)
Cardiovascular risk increase: +${calculations.cardiovascularRisk}%
Calories not burned: ${formatNumber(calculations.caloriesNotBurnedYearly)}/year

That's like ${calculations.moonTrips} round trips to the moon!

Calculate yours: techtrendi.com/tools/sitting-time-calculator`;

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
        title="Sitting Time Calculator - See Your Desk Job Health Impact | TechTrendi"
        description="Calculate the health impact of your desk job. See cardiovascular risk, calories not burned, and muscle atrophy from sitting all day."
        canonicalUrl="https://techtrendi.com/tools/sitting-time-calculator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            Health Awareness Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sitting Time <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the shocking health impact of your desk job and get motivated to move more
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Input */}
          <div className="space-y-6">
            <Card className="border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Armchair className="w-5 h-5 text-orange-500" />
                  Your Sitting Habits
                </CardTitle>
                <CardDescription>How much do you sit at work?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Hours sitting per day</Label>
                    <span className="text-xl font-bold text-orange-500">{data.hoursPerDay}h</span>
                  </div>
                  <Slider
                    value={[data.hoursPerDay]}
                    onValueChange={([v]) => updateData("hoursPerDay", v)}
                    min={1}
                    max={16}
                    step={0.5}
                    className="[&_[role=slider]]:bg-orange-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Days per week</Label>
                    <span className="text-xl font-bold text-orange-500">{data.daysPerWeek}</span>
                  </div>
                  <Slider
                    value={[data.daysPerWeek]}
                    onValueChange={([v]) => updateData("daysPerWeek", v)}
                    min={1}
                    max={7}
                    step={1}
                    className="[&_[role=slider]]:bg-orange-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Years at desk job</Label>
                    <span className="text-xl font-bold text-orange-500">{data.yearsAtJob}</span>
                  </div>
                  <Slider
                    value={[data.yearsAtJob]}
                    onValueChange={([v]) => updateData("yearsAtJob", v)}
                    min={1}
                    max={40}
                    step={1}
                    className="[&_[role=slider]]:bg-orange-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stand Up Timer */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  Stand Up Reminder
                </CardTitle>
                <CardDescription>Get reminded to stand and stretch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-orange-500 font-mono mb-2">
                    {formatTime(timerSeconds)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {timerRunning ? "Until next break" : "Timer paused"}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className={cn(
                        "gap-2",
                        timerRunning
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      )}
                    >
                      {timerRunning ? (
                        <>
                          <Pause className="w-4 h-4" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" /> Start
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTimerSeconds(30 * 60);
                        setTimerRunning(false);
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle: Results */}
          <div className="space-y-6">
            {/* Total Time Stats */}
            <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 to-orange-500/5">
              <CardHeader className="text-center pb-2">
                <CardDescription className="text-sm">Total time spent sitting</CardDescription>
                <CardTitle className="text-5xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  {formatNumber(calculations.totalHours)}h
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-background rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-500">{calculations.totalDays}</p>
                    <p className="text-xs text-muted-foreground">Days</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-500">{calculations.totalYears}</p>
                    <p className="text-xs text-muted-foreground">Years</p>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Rocket className="w-5 h-5 text-purple-500" />
                    <span className="font-bold text-purple-500">{calculations.moonTrips}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Round trips to the Moon if you walked instead
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Health Impact Scores */}
            <Card className="border-red-500/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Health Impact Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cardiovascular Risk */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">Cardiovascular Risk</span>
                    </div>
                    <span className={cn("font-bold", getRiskColor(calculations.cardiovascularRisk))}>
                      +{calculations.cardiovascularRisk}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all rounded-full", getRiskBgColor(calculations.cardiovascularRisk))}
                      style={{ width: `${calculations.cardiovascularRisk}%` }}
                    />
                  </div>
                </div>

                {/* Muscle Atrophy Risk */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Muscle Atrophy Risk</span>
                    </div>
                    <span className={cn("font-bold", getRiskColor(calculations.muscleAtrophyRisk))}>
                      {calculations.muscleAtrophyRisk}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all rounded-full", getRiskBgColor(calculations.muscleAtrophyRisk))}
                      style={{ width: `${calculations.muscleAtrophyRisk}%` }}
                    />
                  </div>
                </div>

                {/* Posture Impact */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Posture Impact Score</span>
                    </div>
                    <span className={cn("font-bold", getRiskColor(calculations.postureImpact))}>
                      {calculations.postureImpact}/100
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all rounded-full", getRiskBgColor(calculations.postureImpact))}
                      style={{ width: `${calculations.postureImpact}%` }}
                    />
                  </div>
                </div>

                {/* Calories */}
                <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold">Calories Not Burned</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-orange-500">{formatNumber(calculations.caloriesNotBurnedDaily)}</p>
                      <p className="text-xs text-muted-foreground">Daily</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-orange-500">{formatNumber(calculations.caloriesNotBurnedYearly)}</p>
                      <p className="text-xs text-muted-foreground">Yearly</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-500">{formatNumber(calculations.caloriesNotBurnedTotal)}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Body Diagram */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Affected Body Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mx-auto w-48 h-80">
                  {/* Simple body outline SVG */}
                  <svg viewBox="0 0 100 200" className="w-full h-full">
                    {/* Head */}
                    <circle cx="50" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                    {/* Neck - affected */}
                    <line x1="50" y1="35" x2="50" y2="45" stroke="currentColor" strokeWidth="4" className={calculations.postureImpact > 30 ? "text-red-500" : "text-muted-foreground"} />
                    {/* Shoulders - affected */}
                    <line x1="25" y1="55" x2="75" y2="55" stroke="currentColor" strokeWidth="4" className={calculations.postureImpact > 40 ? "text-orange-500" : "text-muted-foreground"} />
                    {/* Torso */}
                    <path d="M 35 55 L 35 100 L 65 100 L 65 55" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                    {/* Lower back - affected */}
                    <line x1="35" y1="85" x2="65" y2="85" stroke="currentColor" strokeWidth="6" className={calculations.muscleAtrophyRisk > 50 ? "text-red-500" : "text-orange-500"} />
                    {/* Heart area - affected */}
                    <circle cx="55" cy="65" r="8" fill="currentColor" className={calculations.cardiovascularRisk > 30 ? "text-red-500/50" : "text-muted-foreground/30"} />
                    {/* Hips */}
                    <ellipse cx="50" cy="110" rx="20" ry="10" fill="none" stroke="currentColor" strokeWidth="2" className={calculations.muscleAtrophyRisk > 60 ? "text-orange-500" : "text-muted-foreground"} />
                    {/* Legs */}
                    <line x1="40" y1="120" x2="35" y2="170" stroke="currentColor" strokeWidth="3" className={calculations.muscleAtrophyRisk > 40 ? "text-yellow-500" : "text-muted-foreground"} />
                    <line x1="60" y1="120" x2="65" y2="170" stroke="currentColor" strokeWidth="3" className={calculations.muscleAtrophyRisk > 40 ? "text-yellow-500" : "text-muted-foreground"} />
                    {/* Feet */}
                    <ellipse cx="32" cy="175" rx="8" ry="5" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                    <ellipse cx="68" cy="175" rx="8" ry="5" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                    {/* Arms */}
                    <line x1="25" y1="55" x2="15" y2="95" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                    <line x1="75" y1="55" x2="85" y2="95" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                  </svg>

                  {/* Labels */}
                  <div className="absolute top-8 left-0 text-xs text-red-500 font-medium">Neck strain</div>
                  <div className="absolute top-16 right-0 text-xs text-red-500 font-medium">Heart risk</div>
                  <div className="absolute top-32 left-0 text-xs text-orange-500 font-medium">Back pain</div>
                  <div className="absolute top-44 right-0 text-xs text-orange-500 font-medium">Hip tightness</div>
                  <div className="absolute bottom-16 left-0 text-xs text-yellow-500 font-medium">Leg weakness</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Recommendations */}
          <div className="space-y-6">
            {/* Walking Comparison */}
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-green-500" />
                  What If You Walked 10 min/hour?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-background rounded-lg text-center">
                    <p className="text-xl font-bold text-green-500">{calculations.walkingMinutesPerDay}</p>
                    <p className="text-xs text-muted-foreground">Minutes/day</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg text-center">
                    <p className="text-xl font-bold text-green-500">{calculations.walkingHoursPerYear}</p>
                    <p className="text-xs text-muted-foreground">Hours/year</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg text-center">
                    <p className="text-xl font-bold text-green-500">{formatNumber(calculations.caloriesSavedPerYear)}</p>
                    <p className="text-xs text-muted-foreground">Calories/year</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg text-center">
                    <p className="text-xl font-bold text-green-500">{calculations.poundsSavedPerYear}</p>
                    <p className="text-xs text-muted-foreground">Lbs lost/year</p>
                  </div>
                </div>
                <div className="p-3 bg-background rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-500">{formatNumber(calculations.milesWalkedPerYear)} miles</p>
                  <p className="text-xs text-muted-foreground">Walked per year</p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Standing Desk</p>
                    <p className="text-xs text-muted-foreground">Alternate between sitting and standing throughout the day</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Walking Breaks</p>
                    <p className="text-xs text-muted-foreground">Take a 5-10 minute walk every hour</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Desk Exercises</p>
                    <p className="text-xs text-muted-foreground">Simple stretches and movements at your desk</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Walking Meetings</p>
                    <p className="text-xs text-muted-foreground">Take phone calls while walking</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercises */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Desk Stretches & Exercises
                </CardTitle>
                <CardDescription>Click any exercise for details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedExercise(selectedExercise === index ? null : index)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all",
                      selectedExercise === index
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{exercise.name}</span>
                      <Badge variant="outline" className="text-xs">{exercise.duration}</Badge>
                    </div>
                    {selectedExercise === index && (
                      <p className="text-xs text-muted-foreground mt-2 animate-in fade-in-0 slide-in-from-top-1">
                        {exercise.description}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Health Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Health Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {healthTips.slice(0, 5).map((tip, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Button onClick={shareResults} className="w-full gap-2" size="lg">
              <Share2 className="w-4 h-4" />
              Share Your Results
            </Button>
          </div>
        </div>

        {/* Bottom Warning */}
        <Card className="mt-8 border-red-500/30 bg-gradient-to-r from-red-500/5 to-orange-500/5">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="p-4 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Research Shows</h3>
                <p className="text-muted-foreground">
                  Prolonged sitting is linked to increased risk of heart disease, diabetes, obesity, and certain cancers.
                  Studies suggest that sitting for more than 8 hours a day with no physical activity has a similar mortality risk to smoking.
                  <span className="block mt-2 font-medium text-foreground">
                    The good news? Even small changes can make a big difference!
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
