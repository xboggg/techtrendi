import { useState, useEffect, useRef, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Clock, Play, Pause, Square, Plus, Trash2, DollarSign, Calendar,
  BarChart3, Download, Tag, Timer, StopCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface TimeEntry {
  id: string;
  description: string;
  project: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  date: string;
  billable: boolean;
  hourlyRate?: number;
}

interface Project {
  id: string;
  name: string;
  color: string;
  hourlyRate?: number;
}

const STORAGE_KEY = "techtrendi_timetracker";

const defaultProjects: Project[] = [
  { id: "general", name: "General", color: "bg-gray-500" },
  { id: "client-a", name: "Client A", color: "bg-blue-500", hourlyRate: 75 },
  { id: "client-b", name: "Client B", color: "bg-green-500", hourlyRate: 100 },
  { id: "internal", name: "Internal", color: "bg-purple-500" },
];

export default function TimeTracker() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [isRunning, setIsRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<TimeEntry>>({
    description: "",
    project: "general",
    billable: true,
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEntries(parsed.entries || []);
        setProjects(parsed.projects || defaultProjects);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify({ entries, projects }));
    }
  }, [entries, projects, user]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const startTimer = () => {
    startTimeRef.current = new Date();
    setElapsedTime(0);
    setIsRunning(true);
  };

  const stopTimer = () => {
    if (!startTimeRef.current) return;

    const project = projects.find((p) => p.id === currentEntry.project);
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      description: currentEntry.description || "Untitled",
      project: currentEntry.project || "general",
      startTime: startTimeRef.current.toISOString(),
      endTime: new Date().toISOString(),
      duration: elapsedTime,
      date: new Date().toISOString().split("T")[0],
      billable: currentEntry.billable ?? true,
      hourlyRate: project?.hourlyRate,
    };

    setEntries((prev) => [newEntry, ...prev]);
    setIsRunning(false);
    setElapsedTime(0);
    setCurrentEntry({ description: "", project: "general", billable: true });
    startTimeRef.current = null;
    toast.success("Time entry saved!");
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Entry deleted");
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => e.date === filterDate);
  }, [entries, filterDate]);

  const todayStats = useMemo(() => {
    const totalSeconds = filteredEntries.reduce((sum, e) => sum + e.duration, 0);
    const billableSeconds = filteredEntries
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + e.duration, 0);
    const earnings = filteredEntries
      .filter((e) => e.billable && e.hourlyRate)
      .reduce((sum, e) => sum + (e.duration / 3600) * (e.hourlyRate || 0), 0);

    return {
      totalTime: totalSeconds,
      billableTime: billableSeconds,
      earnings: earnings.toFixed(2),
      entryCount: filteredEntries.length,
    };
  }, [filteredEntries]);

  const weekStats = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEntries = entries.filter((e) => new Date(e.date) >= weekAgo);
    const totalSeconds = weekEntries.reduce((sum, e) => sum + e.duration, 0);
    const earnings = weekEntries
      .filter((e) => e.billable && e.hourlyRate)
      .reduce((sum, e) => sum + (e.duration / 3600) * (e.hourlyRate || 0), 0);

    return {
      totalTime: totalSeconds,
      earnings: earnings.toFixed(2),
    };
  }, [entries]);

  const getProjectById = (id: string) => projects.find((p) => p.id === id);

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Time Tracker - Track Billable Hours | TechTrendi"
          description="Track your work hours and billable time. Perfect for freelancers and consultants."
          canonicalUrl="https://techtrendi.com/tools/time-tracker"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Time Tracker</h1>
              <p className="text-muted-foreground mb-6">
                Track your work hours and billable time. Sign in to save your data.
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
        title="Time Tracker - Track Billable Hours | TechTrendi"
        description="Track your work hours and billable time. Perfect for freelancers and consultants."
        canonicalUrl="https://techtrendi.com/tools/time-tracker"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Time <span className="text-primary">Tracker</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Track your billable hours and see how much you're earning
          </p>
        </div>

        {/* Timer */}
        <Card className="mb-8 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <Input
                value={currentEntry.description}
                onChange={(e) => setCurrentEntry((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What are you working on?"
                className="flex-1 text-lg"
                disabled={isRunning}
              />
              <Select
                value={currentEntry.project}
                onValueChange={(v) => setCurrentEntry((prev) => ({ ...prev, project: v }))}
                disabled={isRunning}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", project.color)} />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold min-w-[120px] text-center">
                  {formatTime(elapsedTime)}
                </span>
                {isRunning ? (
                  <Button onClick={stopTimer} size="lg" variant="destructive">
                    <Square className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                ) : (
                  <Button onClick={startTimer} size="lg">
                    <Play className="w-5 h-5 mr-2" />
                    Start
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Timer className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatDuration(todayStats.totalTime)}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">${todayStats.earnings}</p>
              <p className="text-xs text-muted-foreground">Earned Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatDuration(weekStats.totalTime)}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-5 h-5 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-500">${weekStats.earnings}</p>
              <p className="text-xs text-muted-foreground">Week Earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Entries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Time Entries</CardTitle>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No time entries for this day</p>
                <p className="text-sm">Start the timer above to track your work</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => {
                  const project = getProjectById(entry.project);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-3 h-3 rounded-full", project?.color || "bg-gray-500")} />
                        <div>
                          <p className="font-medium">{entry.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{project?.name}</span>
                            {entry.billable && entry.hourlyRate && (
                              <>
                                <span>•</span>
                                <span className="text-green-500">
                                  ${((entry.duration / 3600) * entry.hourlyRate).toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium">{formatDuration(entry.duration)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
