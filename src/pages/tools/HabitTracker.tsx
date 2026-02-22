import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare, Plus, Trash2, Flame, Target, Calendar, Trophy,
  ChevronLeft, ChevronRight, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Habit {
  id: string;
  name: string;
  color: string;
  completedDates: string[];
  createdAt: string;
}

const habitColors = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
];

const getDateKey = (date: Date) => date.toISOString().split("T")[0];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export default function HabitTracker() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [selectedColor, setSelectedColor] = useState(habitColors[4].value);
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = getDateKey(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("techtrendi_habits");
    if (saved) {
      setHabits(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("techtrendi_habits", JSON.stringify(habits));
  }, [habits]);

  const addHabit = () => {
    if (!newHabitName.trim()) {
      toast.error("Please enter a habit name");
      return;
    }

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      color: selectedColor,
      completedDates: [],
      createdAt: today,
    };

    setHabits([...habits, habit]);
    setNewHabitName("");
    toast.success("Habit added! Start tracking today.");
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
    toast.success("Habit deleted");
  };

  const toggleHabitForDate = (habitId: string, date: string) => {
    setHabits(
      habits.map((h) => {
        if (h.id !== habitId) return h;
        const completed = h.completedDates.includes(date);
        return {
          ...h,
          completedDates: completed
            ? h.completedDates.filter((d) => d !== date)
            : [...h.completedDates, date],
        };
      })
    );
  };

  const getStreak = (habit: Habit) => {
    let streak = 0;
    const sortedDates = [...habit.completedDates].sort().reverse();
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateKey = getDateKey(checkDate);
      if (sortedDates.includes(dateKey)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Today not completed yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }
    return streak;
  };

  const getLongestStreak = (habit: Habit) => {
    if (habit.completedDates.length === 0) return 0;
    const sortedDates = [...habit.completedDates].sort();
    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }
    return longest;
  };

  const getCompletionRate = (habit: Habit) => {
    const createdDate = new Date(habit.createdAt);
    const todayDate = new Date();
    const daysSinceCreated = Math.floor(
      (todayDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    return Math.round((habit.completedDates.length / daysSinceCreated) * 100);
  };

  const totalCompletedToday = habits.filter((h) =>
    h.completedDates.includes(today)
  ).length;

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <Layout>
      <SEOHead
        title="Habit Tracker - Build Better Habits with Streaks | TechTrendi"
        description="Track your daily habits, build streaks, and achieve your goals. Free habit tracking tool with visual progress and statistics."
        canonicalUrl="https://techtrendi.com/tools/habit-tracker"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Habit <span className="text-primary">Tracker</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Build better habits with daily tracking, streaks, and visual progress.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{habits.length}</div>
              <div className="text-xs text-muted-foreground">Active Habits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalCompletedToday}</div>
              <div className="text-xs text-muted-foreground">Done Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {habits.length > 0 ? Math.max(...habits.map(getStreak)) : 0}
              </div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {habits.reduce((sum, h) => sum + h.completedDates.length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Check-ins</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Habit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Habit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="e.g., Exercise, Read, Meditate..."
                    onKeyDown={(e) => e.key === "Enter" && addHabit()}
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    {habitColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-transform",
                          color.value,
                          selectedColor === color.value && "ring-2 ring-offset-2 ring-primary scale-110"
                        )}
                      />
                    ))}
                  </div>
                  <Button onClick={addHabit}>Add</Button>
                </div>
              </CardContent>
            </Card>

            {/* Habits List */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Habits</CardTitle>
                <CardDescription>Check off your habits for today</CardDescription>
              </CardHeader>
              <CardContent>
                {habits.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No habits yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add your first habit above to start tracking!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {habits.map((habit) => {
                      const isCompletedToday = habit.completedDates.includes(today);
                      const streak = getStreak(habit);

                      return (
                        <div
                          key={habit.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all",
                            isCompletedToday
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-card border-border hover:border-primary/20"
                          )}
                        >
                          <button
                            onClick={() => toggleHabitForDate(habit.id, today)}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                              isCompletedToday ? "bg-green-500 text-white" : habit.color + " text-white/50"
                            )}
                          >
                            {isCompletedToday && <CheckSquare className="w-5 h-5" />}
                          </button>

                          <div className="flex-1">
                            <div className={cn(
                              "font-medium",
                              isCompletedToday && "line-through text-muted-foreground"
                            )}>
                              {habit.name}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {streak > 0 && (
                                <span className="flex items-center gap-1 text-xs text-orange-500">
                                  <Flame className="w-3 h-3" />
                                  {streak} day streak
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {getCompletionRate(habit)}% completion
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteHabit(habit.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calendar Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {monthNames[currentMonth]} {currentYear}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div key={i} className="text-muted-foreground font-medium py-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for first day offset */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {/* Days of month */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const completedCount = habits.filter((h) =>
                      h.completedDates.includes(dateKey)
                    ).length;
                    const isToday = dateKey === today;

                    return (
                      <div
                        key={day}
                        className={cn(
                          "aspect-square rounded-lg flex items-center justify-center text-sm relative",
                          isToday && "ring-2 ring-primary",
                          completedCount > 0 && "bg-green-500/20",
                          completedCount === habits.length && habits.length > 0 && "bg-green-500 text-white"
                        )}
                      >
                        {day}
                        {completedCount > 0 && completedCount < habits.length && (
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500/20" />
                    <span>Partial</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>Complete</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Habit Building Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Start with just 1-3 habits</li>
                  <li>• Make habits tiny at first</li>
                  <li>• Stack habits with existing routines</li>
                  <li>• Never miss twice in a row</li>
                  <li>• Celebrate small wins</li>
                </ul>
              </CardContent>
            </Card>

            {!user && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-center">
                    <strong>Sign in</strong> to save your habits and sync across devices!
                  </p>
                  <Button className="w-full mt-4" asChild>
                    <a href="/auth">Sign In Free</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
