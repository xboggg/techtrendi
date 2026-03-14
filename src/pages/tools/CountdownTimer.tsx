import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Clock, Calendar, Plus, Trash2, Edit, Share2, PartyPopper, Timer, Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Countdown {
  id: string;
  title: string;
  targetDate: string; // ISO string
  theme: ThemeKey;
  createdAt: string;
  isTimer?: boolean; // true = simple timer mode (counts down from duration)
  timerDurationSec?: number;
  timerStartedAt?: string | null;
  alarmEnabled?: boolean;
}

type ThemeKey =
  | "sunset"
  | "ocean"
  | "forest"
  | "dark"
  | "festive"
  | "neon"
  | "rose"
  | "midnight";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const THEMES: Record<ThemeKey, { label: string; bg: string; text: string; card: string; accent: string }> = {
  sunset:   { label: "Sunset",   bg: "bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600", text: "text-white", card: "bg-white/15 backdrop-blur-md border-white/20", accent: "bg-orange-400" },
  ocean:    { label: "Ocean",    bg: "bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700",   text: "text-white", card: "bg-white/15 backdrop-blur-md border-white/20", accent: "bg-cyan-400" },
  forest:   { label: "Forest",   bg: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700", text: "text-white", card: "bg-white/15 backdrop-blur-md border-white/20", accent: "bg-emerald-400" },
  dark:     { label: "Dark",     bg: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",     text: "text-white", card: "bg-white/10 backdrop-blur-md border-white/10", accent: "bg-gray-500" },
  festive:  { label: "Festive",  bg: "bg-gradient-to-br from-red-600 via-green-600 to-red-600",      text: "text-white", card: "bg-white/15 backdrop-blur-md border-white/20", accent: "bg-yellow-400" },
  neon:     { label: "Neon",     bg: "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500", text: "text-white", card: "bg-white/15 backdrop-blur-md border-white/20", accent: "bg-fuchsia-400" },
  rose:     { label: "Rose",     bg: "bg-gradient-to-br from-rose-400 via-pink-500 to-red-500",      text: "text-white", card: "bg-white/15 backdrop-blur-md border-white/20", accent: "bg-rose-300" },
  midnight: { label: "Midnight", bg: "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900", text: "text-white", card: "bg-white/10 backdrop-blur-md border-white/10", accent: "bg-indigo-400" },
};

const STORAGE_KEY = "techtrendi_countdowns";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function calcProgress(created: string, target: string): number {
  const start = new Date(created).getTime();
  const end = new Date(target).getTime();
  const now = Date.now();
  if (end <= start) return 100;
  const pct = ((now - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, pct));
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function loadCountdowns(): Countdown[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCountdowns(items: Countdown[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getNextNewYear(): string {
  const now = new Date();
  return `${now.getFullYear() + 1}-01-01T00:00:00`;
}

function getNextChristmas(): string {
  const now = new Date();
  const yr = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear();
  return `${yr}-12-25T00:00:00`;
}

// Web Audio API beep generator
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    // Three beeps
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.setValueAtTime(0, now + 0.15);
    gain.gain.setValueAtTime(0.3, now + 0.25);
    gain.gain.setValueAtTime(0, now + 0.4);
    gain.gain.setValueAtTime(0.3, now + 0.5);
    gain.gain.setValueAtTime(0, now + 0.65);
    osc.stop(now + 0.7);
  } catch {
    // silently fail if Web Audio not available
  }
}

// ─── Confetti CSS Animation ──────────────────────────────────────────────────

function ConfettiEffect() {
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  const colors = [
    "#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#a855f7",
  ];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length];
        const rotation = Math.random() * 360;
        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: `${left}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: "110vh", opacity: 0, rotate: rotation + 720 }}
            transition={{ duration, delay, ease: "easeIn" }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: size,
              height: size * 0.6,
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Flip Digit Component ────────────────────────────────────────────────────

function FlipDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 md:px-5 md:py-3 border border-white/20 shadow-lg"
            style={{ perspective: 400 }}
          >
            <span className="text-3xl md:text-5xl lg:text-6xl font-bold font-mono tabular-nums tracking-wider">
              {value}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="text-[10px] md:text-xs uppercase tracking-widest mt-2 opacity-80 font-medium">
        {label}
      </span>
    </div>
  );
}

// ─── Countdown Card ──────────────────────────────────────────────────────────

function CountdownCard({
  countdown,
  onEdit,
  onDelete,
  onShare,
}: {
  countdown: Countdown;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const [tl, setTl] = useState<TimeLeft>(calcTimeLeft(countdown.targetDate));
  const [showConfetti, setShowConfetti] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const t = calcTimeLeft(countdown.targetDate);
      setTl(t);
      if (t.total <= 0 && !completedRef.current) {
        completedRef.current = true;
        setShowConfetti(true);
        if (countdown.alarmEnabled !== false) playBeep();
        setTimeout(() => setShowConfetti(false), 4000);
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [countdown.targetDate, countdown.alarmEnabled]);

  const theme = THEMES[countdown.theme] || THEMES.sunset;
  const progress = calcProgress(countdown.createdAt, countdown.targetDate);
  const isComplete = tl.total <= 0;

  return (
    <>
      {showConfetti && <ConfettiEffect />}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn("overflow-hidden border-0 shadow-xl", theme.bg, theme.text)}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-xl truncate">
                  {countdown.isTimer ? (
                    <Timer className="w-5 h-5 inline mr-2 -mt-0.5" />
                  ) : (
                    <Calendar className="w-5 h-5 inline mr-2 -mt-0.5" />
                  )}
                  {countdown.title}
                </CardTitle>
                <p className="text-xs opacity-70 mt-1">
                  {countdown.isTimer
                    ? "Timer"
                    : new Date(countdown.targetDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </p>
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-white/20" onClick={onShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-white/20" onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-white/20 hover:text-red-300" onClick={onDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-2 pb-5">
            {isComplete ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center py-4"
              >
                <PartyPopper className="w-12 h-12 mx-auto mb-3 animate-bounce" />
                <p className="text-xl font-bold">Countdown Complete!</p>
              </motion.div>
            ) : (
              <>
                {/* Flip-style digits */}
                <div className="flex justify-center gap-2 md:gap-4 my-4">
                  <FlipDigit value={pad2(tl.days)} label="Days" />
                  <span className="text-3xl md:text-5xl font-bold self-start mt-2 md:mt-3 opacity-60">:</span>
                  <FlipDigit value={pad2(tl.hours)} label="Hours" />
                  <span className="text-3xl md:text-5xl font-bold self-start mt-2 md:mt-3 opacity-60">:</span>
                  <FlipDigit value={pad2(tl.minutes)} label="Min" />
                  <span className="text-3xl md:text-5xl font-bold self-start mt-2 md:mt-3 opacity-60">:</span>
                  <FlipDigit value={pad2(tl.seconds)} label="Sec" />
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] opacity-70 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", theme.accent)}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CountdownTimer() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("00:00");
  const [formTheme, setFormTheme] = useState<ThemeKey>("sunset");
  const [formAlarm, setFormAlarm] = useState(true);

  // Timer mode state
  const [formMode, setFormMode] = useState<"countdown" | "timer">("countdown");
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(5);

  // Load from localStorage + URL params on mount
  useEffect(() => {
    const stored = loadCountdowns();

    // Check URL for shared countdown
    const params = new URLSearchParams(window.location.search);
    const sharedTitle = params.get("title");
    const sharedDate = params.get("date");
    const sharedTheme = params.get("theme") as ThemeKey | null;

    if (sharedTitle && sharedDate) {
      const exists = stored.some(
        (c) => c.title === sharedTitle && c.targetDate === sharedDate
      );
      if (!exists) {
        const shared: Countdown = {
          id: Date.now().toString(),
          title: decodeURIComponent(sharedTitle),
          targetDate: sharedDate,
          theme: sharedTheme && THEMES[sharedTheme] ? sharedTheme : "sunset",
          createdAt: new Date().toISOString(),
          alarmEnabled: true,
        };
        const updated = [shared, ...stored];
        setCountdowns(updated);
        saveCountdowns(updated);
        toast.success(`Shared countdown "${shared.title}" added!`);
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }
    }

    setCountdowns(stored);
  }, []);

  const persistCountdowns = useCallback(
    (items: Countdown[]) => {
      setCountdowns(items);
      saveCountdowns(items);
    },
    []
  );

  const resetForm = () => {
    setFormTitle("");
    setFormDate("");
    setFormTime("00:00");
    setFormTheme("sunset");
    setFormAlarm(true);
    setFormMode("countdown");
    setTimerHours(0);
    setTimerMinutes(5);
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (cd: Countdown) => {
    setEditingId(cd.id);
    setFormTitle(cd.title);
    setFormTheme(cd.theme);
    setFormAlarm(cd.alarmEnabled !== false);
    if (cd.isTimer) {
      setFormMode("timer");
      const dur = cd.timerDurationSec || 300;
      setTimerHours(Math.floor(dur / 3600));
      setTimerMinutes(Math.floor((dur % 3600) / 60));
      setFormDate("");
      setFormTime("00:00");
    } else {
      setFormMode("countdown");
      const d = new Date(cd.targetDate);
      setFormDate(d.toISOString().slice(0, 10));
      setFormTime(d.toISOString().slice(11, 16));
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    let targetDate: string;
    let isTimer = false;
    let timerDurationSec: number | undefined;

    if (formMode === "timer") {
      const totalSec = timerHours * 3600 + timerMinutes * 60;
      if (totalSec <= 0) {
        toast.error("Timer duration must be greater than zero.");
        return;
      }
      targetDate = new Date(Date.now() + totalSec * 1000).toISOString();
      isTimer = true;
      timerDurationSec = totalSec;
    } else {
      if (!formDate) {
        toast.error("Please select a date.");
        return;
      }
      targetDate = new Date(`${formDate}T${formTime}:00`).toISOString();
      if (new Date(targetDate).getTime() <= Date.now()) {
        toast.error("Target date must be in the future.");
        return;
      }
    }

    if (editingId) {
      const updated = countdowns.map((c) =>
        c.id === editingId
          ? { ...c, title: formTitle.trim(), targetDate, theme: formTheme, alarmEnabled: formAlarm, isTimer, timerDurationSec }
          : c
      );
      persistCountdowns(updated);
      toast.success("Countdown updated!");
    } else {
      const newCd: Countdown = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        targetDate,
        theme: formTheme,
        createdAt: new Date().toISOString(),
        isTimer,
        timerDurationSec,
        alarmEnabled: formAlarm,
      };
      persistCountdowns([newCd, ...countdowns]);
      toast.success("Countdown created!");
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    persistCountdowns(countdowns.filter((c) => c.id !== id));
    toast.success("Countdown deleted.");
  };

  const handleShare = (cd: Countdown) => {
    const url = new URL(window.location.href.split("?")[0]);
    url.searchParams.set("title", cd.title);
    url.searchParams.set("date", cd.targetDate);
    url.searchParams.set("theme", cd.theme);
    navigator.clipboard.writeText(url.toString()).then(
      () => toast.success("Share link copied to clipboard!"),
      () => toast.error("Failed to copy link.")
    );
  };

  const applyPreset = (title: string, date: string) => {
    setFormTitle(title);
    const d = new Date(date);
    setFormDate(d.toISOString().slice(0, 10));
    setFormTime(d.toISOString().slice(11, 16));
    setFormMode("countdown");
  };

  return (
    <Layout>
      <SEOHead
        title="Countdown Timer - Event Countdown & Timer Tool | TechTrendi"
        description="Create beautiful countdowns to any date or event. Animated flip-style display, multiple themes, shareable links, timer mode, and celebration effects. Free online tool."
        canonicalUrl="https://techtrendi.com/tools/countdown-timer"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Countdown <span className="text-primary">Timer</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create beautiful countdowns to events, holidays, or set quick timers.
            Share them with anyone via a link.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="lg" onClick={openCreateDialog}>
                <Plus className="w-5 h-5 mr-2" />
                New Countdown
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Countdown" : "Create Countdown"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Quick Presets */}
                {!editingId && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Quick Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyPreset("New Year", getNextNewYear())}
                      >
                        <PartyPopper className="w-4 h-4 mr-1" /> New Year
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyPreset("Christmas", getNextChristmas())}
                      >
                        <Calendar className="w-4 h-4 mr-1" /> Christmas
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormTitle("My Birthday");
                          setFormMode("countdown");
                        }}
                      >
                        <PartyPopper className="w-4 h-4 mr-1" /> Birthday
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mode Toggle */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={formMode === "countdown" ? "default" : "outline"}
                      onClick={() => setFormMode("countdown")}
                    >
                      <Calendar className="w-4 h-4 mr-1" /> Countdown
                    </Button>
                    <Button
                      size="sm"
                      variant={formMode === "timer" ? "default" : "outline"}
                      onClick={() => setFormMode("timer")}
                    >
                      <Timer className="w-4 h-4 mr-1" /> Timer
                    </Button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="cd-title">Title</Label>
                  <Input
                    id="cd-title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Product Launch, Vacation..."
                    className="mt-1"
                  />
                </div>

                {formMode === "countdown" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cd-date">Date</Label>
                      <Input
                        id="cd-date"
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cd-time">Time</Label>
                      <Input
                        id="cd-time"
                        type="time"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tm-hours">Hours</Label>
                      <Input
                        id="tm-hours"
                        type="number"
                        min={0}
                        max={99}
                        value={timerHours}
                        onChange={(e) => setTimerHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tm-minutes">Minutes</Label>
                      <Input
                        id="tm-minutes"
                        type="number"
                        min={0}
                        max={59}
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Theme Selector */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Theme</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setFormTheme(key)}
                        className={cn(
                          "h-12 rounded-lg text-xs font-medium text-white transition-all",
                          THEMES[key].bg,
                          formTheme === key
                            ? "ring-2 ring-offset-2 ring-primary scale-105"
                            : "opacity-70 hover:opacity-100"
                        )}
                      >
                        {THEMES[key].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alarm Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label>Alarm sound when complete</Label>
                  </div>
                  <button
                    onClick={() => setFormAlarm(!formAlarm)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative",
                      formAlarm ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow",
                        formAlarm && "translate-x-5"
                      )}
                    />
                  </button>
                </div>

                {/* Save */}
                <Button className="w-full" size="lg" onClick={handleSave}>
                  {editingId ? "Update Countdown" : "Create Countdown"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Countdown Grid */}
        {countdowns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Clock className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No countdowns yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first countdown to an event, holiday, or set a quick timer.
                Beautiful animated displays and shareable links.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" /> Create Your First Countdown
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {countdowns.map((cd) => (
                <CountdownCard
                  key={cd.id}
                  countdown={cd}
                  onEdit={() => openEditDialog(cd)}
                  onDelete={() => handleDelete(cd.id)}
                  onShare={() => handleShare(cd)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Tips Card */}
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Countdown Timer Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <li>Use <strong>Quick Presets</strong> for popular events like New Year or Christmas</li>
              <li><strong>Timer mode</strong> works like a kitchen timer - set hours and minutes</li>
              <li><strong>Share</strong> your countdown via a link - recipients see the same countdown</li>
              <li>All countdowns are saved locally and persist across sessions</li>
              <li>Choose from <strong>8 beautiful themes</strong> to personalize each countdown</li>
              <li>A <strong>celebration animation</strong> plays when the countdown reaches zero</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
