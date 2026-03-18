import { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, CalendarDays, CheckCircle2, Clock, BarChart3, ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: "todo" | "in-progress" | "done";
  color: ColorKey;
}

type ColorKey = "green" | "teal" | "blue" | "purple" | "amber" | "red";

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS: Record<ColorKey, { label: string; bar: string; bg: string }> = {
  green:  { label: "Green",  bar: "bg-green-500",  bg: "bg-green-500/20" },
  teal:   { label: "Teal",   bar: "bg-teal-500",   bg: "bg-teal-500/20" },
  blue:   { label: "Blue",   bar: "bg-blue-500",   bg: "bg-blue-500/20" },
  purple: { label: "Purple", bar: "bg-purple-500",  bg: "bg-purple-500/20" },
  amber:  { label: "Amber",  bar: "bg-amber-500",  bg: "bg-amber-500/20" },
  red:    { label: "Red",    bar: "bg-red-500",     bg: "bg-red-500/20" },
};

const STATUS_CONFIG = {
  todo:        { label: "To Do",       badge: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",      dot: "bg-gray-400" },
  "in-progress": { label: "In Progress", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", dot: "bg-blue-500" },
  done:        { label: "Done",        badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", dot: "bg-green-500" },
};

const DEFAULT_TASKS: Task[] = [
  { id: "1", name: "Project Kickoff",        startDate: "2026-03-01", endDate: "2026-03-05", status: "done",        color: "green" },
  { id: "2", name: "Requirements Gathering",  startDate: "2026-03-05", endDate: "2026-03-15", status: "done",        color: "teal" },
  { id: "3", name: "Design & Wireframes",     startDate: "2026-03-15", endDate: "2026-04-01", status: "in-progress", color: "blue" },
  { id: "4", name: "Frontend Development",    startDate: "2026-03-25", endDate: "2026-04-20", status: "in-progress", color: "purple" },
  { id: "5", name: "Backend Development",     startDate: "2026-04-01", endDate: "2026-04-25", status: "todo",        color: "amber" },
  { id: "6", name: "QA & Testing",            startDate: "2026-04-20", endDate: "2026-05-05", status: "todo",        color: "red" },
  { id: "7", name: "Deployment",              startDate: "2026-05-05", endDate: "2026-05-10", status: "todo",        color: "blue" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dayMs = 86400000;

function toDate(s: string) {
  return new Date(s + "T00:00:00");
}

function diffDays(a: string, b: string) {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / dayMs);
}

function formatDate(s: string) {
  return toDate(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Component ───────────────────────────────────────────────────────────────

const ProjectTimeline = () => {
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);

  // form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [color, setColor] = useState<ColorKey>("blue");

  // ─── derived data ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const done = tasks.filter((t) => t.status === "done").length;
    if (total === 0) return { total, inProgress, done, duration: 0 };
    const minStart = Math.min(...tasks.map((t) => toDate(t.startDate).getTime()));
    const maxEnd = Math.max(...tasks.map((t) => toDate(t.endDate).getTime()));
    const duration = Math.round((maxEnd - minStart) / dayMs);
    return { total, inProgress, done, duration };
  }, [tasks]);

  // timeline range (with 2-day padding each side)
  const { rangeStart, rangeEnd, months } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      return { rangeStart: s.getTime(), rangeEnd: e.getTime(), months: [] as { label: string; leftPct: number; widthPct: number }[] };
    }
    const minT = Math.min(...tasks.map((t) => toDate(t.startDate).getTime()));
    const maxT = Math.max(...tasks.map((t) => toDate(t.endDate).getTime()));
    const pad = dayMs * 2;
    const rStart = minT - pad;
    const rEnd = maxT + pad;
    const span = rEnd - rStart;

    // build month headers
    const ms: { label: string; leftPct: number; widthPct: number }[] = [];
    const d = new Date(rStart);
    d.setDate(1);
    while (d.getTime() < rEnd) {
      const mStart = Math.max(d.getTime(), rStart);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const mEnd = Math.min(nextMonth.getTime(), rEnd);
      const leftPct = ((mStart - rStart) / span) * 100;
      const widthPct = ((mEnd - mStart) / span) * 100;
      if (widthPct > 0) {
        ms.push({
          label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          leftPct,
          widthPct,
        });
      }
      d.setTime(nextMonth.getTime());
    }
    return { rangeStart: rStart, rangeEnd: rEnd, months: ms };
  }, [tasks]);

  const totalSpan = rangeEnd - rangeStart;

  // ─── handlers ──────────────────────────────────────────────────────────────

  const addTask = useCallback(() => {
    if (!name.trim()) { toast.error("Enter a task name"); return; }
    if (!startDate || !endDate) { toast.error("Select start and end dates"); return; }
    if (toDate(endDate) <= toDate(startDate)) { toast.error("End date must be after start date"); return; }
    const task: Task = { id: uid(), name: name.trim(), startDate, endDate, status, color };
    setTasks((prev) => [...prev, task]);
    setName("");
    setStartDate("");
    setEndDate("");
    setStatus("todo");
    setColor("blue");
    toast.success("Task added");
  }, [name, startDate, endDate, status, color]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success("Task deleted");
  }, []);

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <SEOHead
        title="Project Timeline & Gantt Chart | TechTrendi Tools"
        description="Plan and visualize your project timeline with this free interactive Gantt chart tool. Add tasks, set dates and status, and see a visual timeline."
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Project Timeline</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Plan and visualize your project with an interactive Gantt chart. Add tasks, set dates and statuses, and track progress at a glance.
          </p>
        </div>

        {/* Add Task Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" /> Add Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              {/* Task Name */}
              <div className="lg:col-span-2 space-y-1.5">
                <Label htmlFor="taskName">Task Name</Label>
                <Input
                  id="taskName"
                  placeholder="e.g. Sprint Planning"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Task["status"])}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex items-center gap-1.5 h-10">
                  {(Object.keys(COLORS) as ColorKey[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      title={COLORS[c].label}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all",
                        COLORS[c].bar,
                        color === c
                          ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                          : "opacity-60 hover:opacity-100"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={addTask} className="mt-4 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" /> Add Task
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ListTodo className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.done}</p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <CalendarDays className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.duration}</p>
                <p className="text-xs text-muted-foreground">Duration (days)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gantt Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" /> Gantt Chart
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {tasks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No tasks yet. Add your first task above to see the timeline.
              </div>
            ) : (
              <div className="min-w-[700px]">
                {/* Month Headers */}
                <div className="flex border-b">
                  {/* left column spacer */}
                  <div className="w-60 shrink-0 border-r px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Task
                  </div>
                  {/* month bar area */}
                  <div className="flex-1 relative h-9">
                    {months.map((m, i) => (
                      <div
                        key={i}
                        className="absolute top-0 h-full flex items-center border-r border-dashed border-border/50 px-2 text-xs font-medium text-muted-foreground"
                        style={{ left: `${m.leftPct}%`, width: `${m.widthPct}%` }}
                      >
                        {m.widthPct > 8 ? m.label : ""}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Rows */}
                {tasks.map((task) => {
                  const tStart = toDate(task.startDate).getTime();
                  const tEnd = toDate(task.endDate).getTime();
                  const leftPct = ((tStart - rangeStart) / totalSpan) * 100;
                  const widthPct = ((tEnd - tStart) / totalSpan) * 100;
                  const dur = diffDays(task.startDate, task.endDate);
                  const sc = STATUS_CONFIG[task.status];

                  return (
                    <div key={task.id} className="flex border-b last:border-b-0 hover:bg-muted/30 transition-colors group">
                      {/* Task info column */}
                      <div className="w-60 shrink-0 border-r px-4 py-3 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0", sc.badge)}>
                              {sc.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(task.startDate)} - {formatDate(task.endDate)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-destructive"
                          title="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Bar area */}
                      <div className="flex-1 relative py-3 px-1">
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-7 rounded-md flex items-center px-2 text-[10px] font-medium text-white shadow-sm transition-all",
                            COLORS[task.color].bar,
                            task.status === "done" && "opacity-80",
                          )}
                          style={{
                            left: `${leftPct}%`,
                            width: `${Math.max(widthPct, 1.5)}%`,
                          }}
                          title={`${task.name}: ${formatDate(task.startDate)} - ${formatDate(task.endDate)} (${dur}d)`}
                        >
                          <span className="truncate">
                            {widthPct > 6 ? `${dur}d` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {(["todo", "in-progress", "done"] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className={cn("w-3 h-3 rounded-full", STATUS_CONFIG[s].dot)} />
              <span>{STATUS_CONFIG[s].label}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProjectTimeline;
