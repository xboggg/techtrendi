import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Flame, Trophy, CheckCircle2, Circle, Target, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Habit {
  id: number;
  name: string;
  color: string;
}

interface Completions {
  [dateKey: string]: number[]; // date "YYYY-MM-DD" -> array of habit ids
}

const LS_HABITS = "ht_habits";
const LS_COMPLETIONS = "ht_completions";
const LS_NEXT_ID = "ht_nextId";

const DEFAULT_HABITS: Habit[] = [
  { id: 1, name: "Exercise 30min", color: "#3fb950" },
  { id: 2, name: "Read 20 pages", color: "#388bfd" },
  { id: 3, name: "Drink 2L water", color: "#58a6ff" },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getStreak(habitId: number, completions: Completions): number {
  let streak = 0;
  const d = new Date();
  // Start from today and go backwards
  while (true) {
    const key = dateStr(d);
    if (completions[key]?.includes(habitId)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // If today is not done yet, check from yesterday
      if (streak === 0 && dateStr(new Date()) === key) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

function getBestStreak(habitId: number, completions: Completions): number {
  // Collect all dates with this habit completed, sort them
  const dates = Object.keys(completions)
    .filter((k) => completions[k]?.includes(habitId))
    .sort();
  if (dates.length === 0) return 0;

  let best = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffMs = curr.getTime() - prev.getTime();
    if (diffMs === 86400000) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best;
}

function getHeatmapDays(weeks: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  const totalDays = weeks * 7;
  // Find the start: go back totalDays - 1 from today, align to start of that week (Sunday)
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  // Align to Sunday
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay())); // end of this week

  const d = new Date(start);
  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function completionRatio(date: Date, habits: Habit[], completions: Completions): number {
  if (habits.length === 0) return 0;
  const key = dateStr(date);
  const done = completions[key] || [];
  const valid = done.filter((id) => habits.some((h) => h.id === id));
  return valid.length / habits.length;
}

function heatColor(ratio: number, isFuture: boolean): string {
  if (isFuture) return "#1b1f23";
  if (ratio === 0) return "#2d333b";
  if (ratio <= 0.25) return "#0e4429";
  if (ratio <= 0.5) return "#006d32";
  if (ratio <= 0.75) return "#26a641";
  return "#39d353";
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HabitTrackerV2() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const stored = localStorage.getItem(LS_HABITS);
      return stored ? JSON.parse(stored) : DEFAULT_HABITS;
    } catch {
      return DEFAULT_HABITS;
    }
  });

  const [completions, setCompletions] = useState<Completions>(() => {
    try {
      const stored = localStorage.getItem(LS_COMPLETIONS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [nextId, setNextId] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(LS_NEXT_ID);
      return stored ? JSON.parse(stored) : 4;
    } catch {
      return 4;
    }
  });

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3fb950");

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(LS_HABITS, JSON.stringify(habits));
  }, [habits]);
  useEffect(() => {
    localStorage.setItem(LS_COMPLETIONS, JSON.stringify(completions));
  }, [completions]);
  useEffect(() => {
    localStorage.setItem(LS_NEXT_ID, JSON.stringify(nextId));
  }, [nextId]);

  const today = todayStr();

  const todayCompletions = completions[today] || [];

  const isDoneToday = (habitId: number) => todayCompletions.includes(habitId);

  const toggleHabit = (habitId: number) => {
    setCompletions((prev) => {
      const dayList = prev[today] || [];
      const updated = dayList.includes(habitId)
        ? dayList.filter((id) => id !== habitId)
        : [...dayList, habitId];
      return { ...prev, [today]: updated };
    });
  };

  const addHabit = () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Please enter a habit name");
      return;
    }
    setHabits((prev) => [...prev, { id: nextId, name, color: newColor }]);
    setNextId((prev) => prev + 1);
    setNewName("");
    toast.success(`Habit "${name}" added!`);
  };

  const deleteHabit = (id: number) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    // Clean up completions
    setCompletions((prev) => {
      const cleaned: Completions = {};
      for (const [key, ids] of Object.entries(prev)) {
        const filtered = ids.filter((hid) => hid !== id);
        if (filtered.length > 0) cleaned[key] = filtered;
      }
      return cleaned;
    });
    toast.success("Habit deleted");
  };

  // Stats
  const stats = useMemo(() => {
    const doneToday = todayCompletions.filter((id) => habits.some((h) => h.id === id)).length;
    const totalCheckIns = Object.values(completions).reduce(
      (sum, ids) => sum + ids.filter((id) => habits.some((h) => h.id === id)).length,
      0
    );

    // This week %
    const now = new Date();
    const dayOfWeek = now.getDay();
    let weekTotal = 0;
    let weekDone = 0;
    for (let i = 0; i <= dayOfWeek; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (dayOfWeek - i));
      const key = dateStr(d);
      weekTotal += habits.length;
      const dayDone = (completions[key] || []).filter((id) => habits.some((h) => h.id === id)).length;
      weekDone += dayDone;
    }
    const weekPct = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

    const bestStreak = habits.reduce((best, h) => Math.max(best, getBestStreak(h.id, completions)), 0);

    return { total: habits.length, doneToday, weekPct, totalCheckIns, bestStreak };
  }, [habits, completions, today]);

  // Heatmap
  const heatmapDays = useMemo(() => getHeatmapDays(16), []);
  const weeks = useMemo(() => {
    const w: Date[][] = [];
    for (let i = 0; i < heatmapDays.length; i += 7) {
      w.push(heatmapDays.slice(i, i + 7));
    }
    return w;
  }, [heatmapDays]);

  const todayDate = new Date();

  return (
    <Layout>
      <SEOHead
        title="Habit Tracker | TechTrendi Tools"
        description="Track your daily habits with a GitHub-style heatmap, streaks, and statistics. Build better routines."
      />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Habit Tracker</h1>
          <p className="text-muted-foreground">
            Build consistency with daily habit tracking, streaks, and a visual heatmap.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Habits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-400" />
              <div className="text-2xl font-bold">
                {stats.doneToday}/{stats.total}
              </div>
              <div className="text-xs text-muted-foreground">Done Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-purple-400" />
              <div className="text-2xl font-bold">{stats.weekPct}%</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
              <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
              <div className="text-xs text-muted-foreground">Total Check-ins</div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-400" />
              <div className="text-2xl font-bold">{stats.bestStreak}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Habits List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Add Habit */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Add Habit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="habit-name">Name</Label>
                  <Input
                    id="habit-name"
                    placeholder="e.g. Meditate 10 min"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addHabit()}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="habit-color">Color</Label>
                  <input
                    id="habit-color"
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-border bg-transparent"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-border"
                    style={{ backgroundColor: newColor }}
                  />
                </div>
                <Button onClick={addHabit} className="w-full" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Habit
                </Button>
              </CardContent>
            </Card>

            {/* Habits */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Today&apos;s Habits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {habits.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No habits yet. Add one above!
                  </p>
                )}
                {habits.map((habit) => {
                  const done = isDoneToday(habit.id);
                  const streak = getStreak(habit.id, completions);
                  return (
                    <div
                      key={habit.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                        done
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-card border-border hover:border-muted-foreground/30"
                      )}
                      onClick={() => toggleHabit(habit.id)}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-sm font-medium truncate", done && "line-through opacity-70")}>
                          {habit.name}
                        </div>
                      </div>
                      {streak > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1 flex-shrink-0">
                          <Flame className="w-3 h-3 text-orange-400" />
                          {streak}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHabit(habit.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right: Heatmap */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Activity Heatmap
                  <span className="text-xs text-muted-foreground font-normal">(last 16 weeks)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="flex gap-0.5" style={{ minWidth: "fit-content" }}>
                    {/* Day labels */}
                    <div className="flex flex-col gap-0.5 mr-1 pt-0">
                      {DAY_LABELS.map((label, i) => (
                        <div
                          key={label}
                          className="text-[10px] text-muted-foreground flex items-center justify-end"
                          style={{ height: 14, lineHeight: "14px" }}
                        >
                          {i % 2 === 1 ? label : ""}
                        </div>
                      ))}
                    </div>
                    {/* Weeks */}
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5">
                        {week.map((day, di) => {
                          const ratio = completionRatio(day, habits, completions);
                          const isFuture = day > todayDate;
                          const isToday = dateStr(day) === today;
                          const dKey = dateStr(day);
                          const doneCount = (completions[dKey] || []).filter((id) =>
                            habits.some((h) => h.id === id)
                          ).length;
                          return (
                            <div
                              key={di}
                              title={`${dKey}: ${doneCount}/${habits.length} habits`}
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 3,
                                backgroundColor: heatColor(ratio, isFuture),
                                border: isToday ? "2px solid #58a6ff" : "1px solid rgba(255,255,255,0.04)",
                              }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground justify-end">
                  <span>Less</span>
                  {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                    <div
                      key={r}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        backgroundColor: heatColor(r, false),
                      }}
                    />
                  ))}
                  <span>More</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
