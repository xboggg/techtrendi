import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen, Calendar, Flame, Star, Heart, Sun, Cloud, CloudRain,
  Smile, Meh, Frown, ChevronLeft, ChevronRight, Sparkles, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface JournalEntry {
  id: string;
  date: string;
  gratitude: string[];
  mood: string;
  highlight: string;
  reflection: string;
  tomorrowGoal: string;
}

const moods = [
  { value: "amazing", icon: Star, label: "Amazing", color: "text-yellow-500" },
  { value: "good", icon: Smile, label: "Good", color: "text-green-500" },
  { value: "okay", icon: Meh, label: "Okay", color: "text-blue-500" },
  { value: "meh", icon: Cloud, label: "Meh", color: "text-gray-500" },
  { value: "bad", icon: Frown, label: "Bad", color: "text-red-500" },
];

const STORAGE_KEY = "techtrendi_journal";

export default function DailyJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>({
    id: "",
    date: currentDate,
    gratitude: ["", "", ""],
    mood: "",
    highlight: "",
    reflection: "",
    tomorrowGoal: "",
  });

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        setEntries(JSON.parse(saved));
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && entries.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(entries));
    }
  }, [entries, user]);

  useEffect(() => {
    const existingEntry = entries.find((e) => e.date === currentDate);
    if (existingEntry) {
      setCurrentEntry(existingEntry);
    } else {
      setCurrentEntry({
        id: "",
        date: currentDate,
        gratitude: ["", "", ""],
        mood: "",
        highlight: "",
        reflection: "",
        tomorrowGoal: "",
      });
    }
  }, [currentDate, entries]);

  const updateGratitude = (index: number, value: string) => {
    setCurrentEntry((prev) => ({
      ...prev,
      gratitude: prev.gratitude.map((g, i) => (i === index ? value : g)),
    }));
  };

  const saveEntry = () => {
    const filteredEntry = {
      ...currentEntry,
      id: currentEntry.id || Date.now().toString(),
      gratitude: currentEntry.gratitude.filter((g) => g.trim()),
    };

    if (filteredEntry.gratitude.length === 0 && !filteredEntry.mood && !filteredEntry.highlight) {
      toast.error("Please fill in at least one field");
      return;
    }

    const existingIndex = entries.findIndex((e) => e.date === currentDate);
    if (existingIndex >= 0) {
      setEntries((prev) => prev.map((e, i) => (i === existingIndex ? filteredEntry : e)));
    } else {
      setEntries((prev) => [filteredEntry, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    }

    toast.success("Journal entry saved!");
  };

  const navigateDay = (direction: "prev" | "next") => {
    const current = new Date(currentDate);
    current.setDate(current.getDate() + (direction === "next" ? 1 : -1));
    setCurrentDate(current.toISOString().split("T")[0]);
  };

  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      if (entries.some((e) => e.date === dateStr)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [entries]);

  const moodStats = useMemo(() => {
    const last30Days = entries.slice(0, 30);
    const counts: Record<string, number> = {};
    last30Days.forEach((e) => {
      if (e.mood) {
        counts[e.mood] = (counts[e.mood] || 0) + 1;
      }
    });
    return counts;
  }, [entries]);

  const isToday = currentDate === new Date().toISOString().split("T")[0];
  const hasEntry = entries.some((e) => e.date === currentDate);

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Daily Journal - Gratitude & Reflection | TechTrendi"
          description="Build a daily journaling habit. Track gratitude, mood, and reflections. Build streaks and see your progress."
          canonicalUrl="https://techtrendi.com/tools/daily-journal"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Daily Journal</h1>
              <p className="text-muted-foreground mb-6">
                Build a daily journaling habit. Track gratitude, mood, and reflections.
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
        title="Daily Journal - Gratitude & Reflection | TechTrendi"
        description="Build a daily journaling habit. Track gratitude, mood, and reflections. Build streaks and see your progress."
        canonicalUrl="https://techtrendi.com/tools/daily-journal"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Daily <span className="text-primary">Journal</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Build a daily journaling habit with gratitude, mood tracking, and reflections
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="pt-6 text-center">
              <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <p className="text-3xl font-bold text-orange-500">{streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-3xl font-bold">{entries.length}</p>
              <p className="text-xs text-muted-foreground">Total Entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <p className="text-3xl font-bold">
                {entries.reduce((sum, e) => sum + e.gratitude.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Gratitudes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-3xl font-bold">{moodStats["amazing"] || 0}</p>
              <p className="text-xs text-muted-foreground">Amazing Days</p>
            </CardContent>
          </Card>
        </div>

        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => navigateDay("prev")}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {new Date(currentDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {isToday && (
                  <Badge className="mt-1 bg-green-100 text-green-700">Today</Badge>
                )}
                {hasEntry && !isToday && (
                  <Badge className="mt-1 bg-blue-100 text-blue-700">Entry Exists</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDay("next")}
                disabled={isToday}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Journal Entry */}
          <div className="space-y-6">
            {/* Mood */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  How are you feeling?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setCurrentEntry((prev) => ({ ...prev, mood: mood.value }))}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg transition-all",
                        currentEntry.mood === mood.value
                          ? "bg-primary/10 scale-110"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <mood.icon className={cn("w-8 h-8", mood.color)} />
                      <span className="text-xs">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gratitude */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  3 Things I'm Grateful For
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentEntry.gratitude.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-lg">{index + 1}.</span>
                    <Input
                      value={item}
                      onChange={(e) => updateGratitude(index, e.target.value)}
                      placeholder={`Gratitude ${index + 1}...`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Highlight */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Today's Highlight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={currentEntry.highlight}
                  onChange={(e) => setCurrentEntry((prev) => ({ ...prev, highlight: e.target.value }))}
                  placeholder="What was the best part of your day?"
                  rows={2}
                />
              </CardContent>
            </Card>

            {/* Reflection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Reflection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={currentEntry.reflection}
                  onChange={(e) => setCurrentEntry((prev) => ({ ...prev, reflection: e.target.value }))}
                  placeholder="Any thoughts, lessons, or observations from today?"
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Tomorrow's Goal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Tomorrow's Main Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={currentEntry.tomorrowGoal}
                  onChange={(e) => setCurrentEntry((prev) => ({ ...prev, tomorrowGoal: e.target.value }))}
                  placeholder="What's the #1 thing you want to accomplish?"
                />
              </CardContent>
            </Card>

            <Button onClick={saveEntry} className="w-full" size="lg">
              Save Journal Entry
            </Button>
          </div>

          {/* Right: History & Stats */}
          <div className="space-y-6">
            {/* Mood Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mood Overview (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  {moods.map((mood) => (
                    <div key={mood.value} className="text-center">
                      <mood.icon className={cn("w-6 h-6 mx-auto mb-1", mood.color)} />
                      <p className="text-lg font-bold">{moodStats[mood.value] || 0}</p>
                      <p className="text-xs text-muted-foreground">{mood.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Entries</CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No journal entries yet. Start writing today!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {entries.slice(0, 10).map((entry) => {
                      const moodInfo = moods.find((m) => m.value === entry.mood);
                      return (
                        <button
                          key={entry.id}
                          onClick={() => setCurrentDate(entry.date)}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors",
                            entry.date === currentDate && "border-primary bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {new Date(entry.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {moodInfo && (
                              <moodInfo.icon className={cn("w-4 h-4", moodInfo.color)} />
                            )}
                          </div>
                          {entry.highlight && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {entry.highlight}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Journaling Tips</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Write at the same time each day to build a habit</li>
                  <li>• Focus on specific moments, not generalizations</li>
                  <li>• Even on bad days, find one small thing to appreciate</li>
                  <li>• Review past entries to see your growth</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
