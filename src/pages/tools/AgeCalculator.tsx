import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Calendar, Clock, Heart, Wind, Star, Sparkles, Gift, Share2,
  Timer, Cake, Users, TrendingUp, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AgeData {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  heartbeats: number;
  breaths: number;
  daysUntilBirthday: number;
  zodiacSign: string;
  zodiacEmoji: string;
  generation: string;
  generationDescription: string;
  nextBirthdayAge: number;
}

const zodiacSigns = [
  { name: "Capricorn", emoji: "", start: [12, 22], end: [1, 19] },
  { name: "Aquarius", emoji: "", start: [1, 20], end: [2, 18] },
  { name: "Pisces", emoji: "", start: [2, 19], end: [3, 20] },
  { name: "Aries", emoji: "", start: [3, 21], end: [4, 19] },
  { name: "Taurus", emoji: "", start: [4, 20], end: [5, 20] },
  { name: "Gemini", emoji: "", start: [5, 21], end: [6, 20] },
  { name: "Cancer", emoji: "", start: [6, 21], end: [7, 22] },
  { name: "Leo", emoji: "", start: [7, 23], end: [8, 22] },
  { name: "Virgo", emoji: "", start: [8, 23], end: [9, 22] },
  { name: "Libra", emoji: "", start: [9, 23], end: [10, 22] },
  { name: "Scorpio", emoji: "", start: [10, 23], end: [11, 21] },
  { name: "Sagittarius", emoji: "", start: [11, 22], end: [12, 21] },
];

const getZodiacSign = (month: number, day: number): { name: string; emoji: string } => {
  for (const sign of zodiacSigns) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;

    if (sign.name === "Capricorn") {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return { name: sign.name, emoji: sign.emoji };
      }
    } else {
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay)
      ) {
        return { name: sign.name, emoji: sign.emoji };
      }
    }
  }
  return { name: "Capricorn", emoji: "" };
};

const getGeneration = (birthYear: number): { name: string; description: string } => {
  if (birthYear >= 2013) return { name: "Gen Alpha", description: "Digital natives from birth" };
  if (birthYear >= 1997) return { name: "Gen Z", description: "True digital natives" };
  if (birthYear >= 1981) return { name: "Millennial", description: "The connected generation" };
  if (birthYear >= 1965) return { name: "Gen X", description: "The independent generation" };
  if (birthYear >= 1946) return { name: "Baby Boomer", description: "Post-war prosperity" };
  if (birthYear >= 1928) return { name: "Silent Generation", description: "The traditionalists" };
  return { name: "Greatest Generation", description: "The war generation" };
};

export default function AgeCalculator() {
  const [birthDate, setBirthDate] = useState<string>("");
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const saved = localStorage.getItem("techtrendi_age_calculator_birthdate");
    if (saved) {
      setBirthDate(saved);
    }
  }, []);

  useEffect(() => {
    if (birthDate) {
      localStorage.setItem("techtrendi_age_calculator_birthdate", birthDate);
    }
  }, [birthDate]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const ageData = useMemo<AgeData | null>(() => {
    if (!birthDate) return null;

    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    const diffMs = now.getTime() - birth.getTime();
    if (diffMs < 0) return null;

    // Calculate exact age
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    // Calculate time components
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Total calculations
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalSeconds = Math.floor(diffMs / 1000);

    // Fun stats (averages: 70 bpm heartbeats, 15 breaths per minute)
    const heartbeats = Math.floor(totalMinutes * 70);
    const breaths = Math.floor(totalMinutes * 15);

    // Days until next birthday
    let nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday <= now) {
      nextBirthday = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
    }
    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const nextBirthdayAge = nextBirthday.getFullYear() - birth.getFullYear();

    // Zodiac sign
    const zodiac = getZodiacSign(birth.getMonth() + 1, birth.getDate());

    // Generation
    const generation = getGeneration(birth.getFullYear());

    return {
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      totalDays,
      totalHours,
      totalMinutes,
      totalSeconds,
      heartbeats,
      breaths,
      daysUntilBirthday,
      zodiacSign: zodiac.name,
      zodiacEmoji: zodiac.emoji,
      generation: generation.name,
      generationDescription: generation.description,
      nextBirthdayAge,
    };
  }, [birthDate, now]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const shareStats = async () => {
    if (!ageData) return;

    const text = `My Age: ${ageData.years} years, ${ageData.months} months, ${ageData.days} days
Total Days Lived: ${formatNumber(ageData.totalDays)}
Heartbeats: ${formatNumber(ageData.heartbeats)}
Zodiac: ${ageData.zodiacEmoji} ${ageData.zodiacSign}
Generation: ${ageData.generation}

Calculate yours: techtrendi.com/tools/age-calculator`;

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

  const StatCard = ({
    icon: Icon,
    label,
    value,
    gradient,
    animate = false,
  }: {
    icon: any;
    label: string;
    value: string | number;
    gradient: string;
    animate?: boolean;
  }) => (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4 text-white",
        gradient,
        animate && "animate-pulse"
      )}
    >
      <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
        <Icon className="w-full h-full" />
      </div>
      <div className="relative z-10">
        <Icon className="w-5 h-5 mb-2 opacity-80" />
        <p className="text-2xl md:text-3xl font-bold tabular-nums">{value}</p>
        <p className="text-sm opacity-80">{label}</p>
      </div>
    </div>
  );

  const LiveCounter = ({ value, label }: { value: number; label: string }) => (
    <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl">
      <p className="text-3xl md:text-4xl font-mono font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent tabular-nums">
        {formatNumber(value)}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );

  return (
    <Layout>
      <SEOHead
        title="Age Calculator - Calculate Your Exact Age in Years, Months, Days | TechTrendi"
        description="Calculate your exact age in years, months, days, hours, minutes, and seconds with live updates. Discover fun facts like heartbeats, breaths, zodiac sign, and generation."
        canonicalUrl="https://techtrendi.com/tools/age-calculator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Free Tool
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Age Calculator
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover your exact age down to the second, plus fascinating stats about your life journey.
          </p>
        </div>

        {/* Date Input */}
        <Card className="mb-8 border-2 border-purple-200 dark:border-purple-900 shadow-xl shadow-purple-500/10">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2">
              <Cake className="w-5 h-5 text-pink-500" />
              Enter Your Birth Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm mx-auto">
              <Label htmlFor="birthdate" className="sr-only">Birth Date</Label>
              <Input
                id="birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="text-center text-lg h-12 border-2 focus:border-purple-500"
              />
            </div>
          </CardContent>
        </Card>

        {ageData ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Age Display */}
            <Card className="overflow-hidden border-0 shadow-2xl">
              <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 p-8 md:p-12 text-white text-center">
                <p className="text-sm uppercase tracking-widest opacity-80 mb-2">Your Exact Age</p>
                <div className="flex flex-wrap justify-center items-baseline gap-4 md:gap-6">
                  <div className="text-center">
                    <span className="text-5xl md:text-7xl font-bold tabular-nums">{ageData.years}</span>
                    <span className="block text-sm opacity-80 mt-1">Years</span>
                  </div>
                  <div className="text-center">
                    <span className="text-5xl md:text-7xl font-bold tabular-nums">{ageData.months}</span>
                    <span className="block text-sm opacity-80 mt-1">Months</span>
                  </div>
                  <div className="text-center">
                    <span className="text-5xl md:text-7xl font-bold tabular-nums">{ageData.days}</span>
                    <span className="block text-sm opacity-80 mt-1">Days</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 md:p-8 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                {/* Live Time */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <LiveCounter value={ageData.hours} label="Hours" />
                  <LiveCounter value={ageData.minutes} label="Minutes" />
                  <LiveCounter value={ageData.seconds} label="Seconds" />
                </div>

                {/* Live Second Counter */}
                <Card className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white overflow-hidden">
                  <CardContent className="pt-6 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 animate-pulse" />
                    <Timer className="w-8 h-8 mx-auto mb-3 text-pink-400" />
                    <p className="text-4xl md:text-6xl font-mono font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent tabular-nums">
                      {formatNumber(ageData.totalSeconds)}
                    </p>
                    <p className="text-sm text-slate-400 mt-2">Total Seconds You've Lived</p>
                    <div className="flex justify-center gap-1 mt-3">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-pink-500 animate-ping"
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Calendar}
                label="Total Days"
                value={formatNumber(ageData.totalDays)}
                gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
              />
              <StatCard
                icon={Clock}
                label="Total Hours"
                value={formatNumber(ageData.totalHours)}
                gradient="bg-gradient-to-br from-purple-500 to-pink-500"
              />
              <StatCard
                icon={Timer}
                label="Total Minutes"
                value={formatNumber(ageData.totalMinutes)}
                gradient="bg-gradient-to-br from-orange-500 to-red-500"
              />
              <StatCard
                icon={Zap}
                label="Total Seconds"
                value={formatNumber(ageData.totalSeconds)}
                gradient="bg-gradient-to-br from-green-500 to-emerald-500"
                animate
              />
            </div>

            {/* Fun Facts */}
            <Card className="border-2 border-dashed border-pink-200 dark:border-pink-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Fun Facts About Your Life
                </CardTitle>
                <CardDescription>Based on average human statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-xl">
                    <div className="p-3 bg-red-500 rounded-full text-white">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                        {formatNumber(ageData.heartbeats)}
                      </p>
                      <p className="text-sm text-muted-foreground">Heartbeats (avg 70 bpm)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl">
                    <div className="p-3 bg-blue-500 rounded-full text-white">
                      <Wind className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatNumber(ageData.breaths)}
                      </p>
                      <p className="text-sm text-muted-foreground">Breaths Taken (avg 15/min)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Birthday & Zodiac */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Next Birthday */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white">
                  <Gift className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-4xl font-bold tabular-nums">{ageData.daysUntilBirthday}</p>
                  <p className="text-sm opacity-80">Days Until Your Birthday</p>
                </div>
                <CardContent className="pt-4">
                  <p className="text-muted-foreground">
                    You'll be turning <span className="font-bold text-foreground">{ageData.nextBirthdayAge}</span> years old!
                  </p>
                  {ageData.daysUntilBirthday <= 30 && (
                    <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Birthday Coming Soon!
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Zodiac Sign */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                  <Star className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-4xl font-bold">{ageData.zodiacEmoji} {ageData.zodiacSign}</p>
                  <p className="text-sm opacity-80">Your Zodiac Sign</p>
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Generation:</span>
                  </div>
                  <p className="font-bold text-lg mt-1">{ageData.generation}</p>
                  <p className="text-sm text-muted-foreground">{ageData.generationDescription}</p>
                </CardContent>
              </Card>
            </div>

            {/* Total Stats Summary */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Life Statistics Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                      {Math.floor(ageData.totalDays / 365)}
                    </p>
                    <p className="text-xs text-muted-foreground">Full Years</p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 tabular-nums">
                      {Math.floor(ageData.totalDays / 7)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Weeks</p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {Math.floor(ageData.totalDays / 30)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Months</p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                      {Math.floor(ageData.totalDays * 3)}
                    </p>
                    <p className="text-xs text-muted-foreground">Meals Eaten</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Button */}
            <div className="flex justify-center">
              <Button
                onClick={shareStats}
                size="lg"
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25"
              >
                <Share2 className="w-4 h-4" />
                Share Your Age Stats
              </Button>
            </div>

            {/* Inspirational Quote */}
            <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
              <CardContent className="pt-6 text-center">
                <Sparkles className="w-6 h-6 mx-auto mb-3 text-purple-500" />
                <p className="text-lg italic text-foreground">
                  "Age is merely the number of years the world has been enjoying you."
                </p>
                <p className="text-sm text-muted-foreground mt-2">- Unknown</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-2 border-dashed border-purple-200 dark:border-purple-900">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                <Cake className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Enter Your Birth Date
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Discover your exact age in years, months, days, hours, minutes, and seconds with real-time updates.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
