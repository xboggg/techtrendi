import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, RotateCcw, Settings, Clock, Coffee, Target,
  Volume2, VolumeX, CheckCircle2, Plus, Trash2, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TimerMode = "work" | "shortBreak" | "longBreak";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  pomodoros: number;
}

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [totalPomodoros, setTotalPomodoros] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [pomodorosUntilLongBreak, setPomodorosUntilLongBreak] = useState(4);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getDuration = (timerMode: TimerMode) => {
    switch (timerMode) {
      case "work": return workDuration * 60;
      case "shortBreak": return shortBreakDuration * 60;
      case "longBreak": return longBreakDuration * 60;
    }
  };

  useEffect(() => {
    setTimeLeft(getDuration(mode));
  }, [workDuration, shortBreakDuration, longBreakDuration, mode]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    playSound();

    if (mode === "work") {
      const newCompleted = completedPomodoros + 1;
      setCompletedPomodoros(newCompleted);
      setTotalPomodoros((prev) => prev + 1);

      toast.success("Pomodoro complete! Time for a break.", {
        duration: 5000,
      });

      if (newCompleted % pomodorosUntilLongBreak === 0) {
        setMode("longBreak");
        setTimeLeft(longBreakDuration * 60);
      } else {
        setMode("shortBreak");
        setTimeLeft(shortBreakDuration * 60);
      }
    } else {
      toast.success("Break over! Ready to focus?", {
        duration: 5000,
      });
      setMode("work");
      setTimeLeft(workDuration * 60);
    }
  };

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((getDuration(mode) - timeLeft) / getDuration(mode)) * 100;

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTask.trim(), completed: false, pomodoros: 0 }]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const getModeColor = (timerMode: TimerMode) => {
    switch (timerMode) {
      case "work": return "bg-red-500";
      case "shortBreak": return "bg-green-500";
      case "longBreak": return "bg-blue-500";
    }
  };

  const getModeText = (timerMode: TimerMode) => {
    switch (timerMode) {
      case "work": return "Focus Time";
      case "shortBreak": return "Short Break";
      case "longBreak": return "Long Break";
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Pomodoro Timer - Focus & Productivity Timer | TechTrendi"
        description="Free Pomodoro timer to boost your productivity. Work in focused 25-minute intervals with breaks. Track your sessions and tasks."
        canonicalUrl="https://techtrendi.com/tools/pomodoro-timer"
      />

      {/* Hidden audio element */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleT8IC4PO5NyESQAAP5vi6rFjDwAAe9/23a5sGQAAYuPozaBULgAAQ+n36Z1ACwAANPH84pYrAAAbAAD/" />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pomodoro <span className="text-primary">Timer</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stay focused and boost your productivity with timed work sessions.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Timer Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Selector */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center gap-2 mb-8">
                  <Button
                    variant={mode === "work" ? "default" : "outline"}
                    onClick={() => switchMode("work")}
                    className={cn(mode === "work" && "bg-red-500 hover:bg-red-600")}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Focus
                  </Button>
                  <Button
                    variant={mode === "shortBreak" ? "default" : "outline"}
                    onClick={() => switchMode("shortBreak")}
                    className={cn(mode === "shortBreak" && "bg-green-500 hover:bg-green-600")}
                  >
                    <Coffee className="w-4 h-4 mr-2" />
                    Short Break
                  </Button>
                  <Button
                    variant={mode === "longBreak" ? "default" : "outline"}
                    onClick={() => switchMode("longBreak")}
                    className={cn(mode === "longBreak" && "bg-blue-500 hover:bg-blue-600")}
                  >
                    <Coffee className="w-4 h-4 mr-2" />
                    Long Break
                  </Button>
                </div>

                {/* Timer Display */}
                <div className="relative w-64 h-64 mx-auto mb-8">
                  {/* Progress Ring */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/20"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 120}
                      strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                      className={cn(
                        "transition-all duration-1000",
                        mode === "work" ? "text-red-500" : mode === "shortBreak" ? "text-green-500" : "text-blue-500"
                      )}
                    />
                  </svg>

                  {/* Time Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl md:text-6xl font-bold text-foreground font-mono">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-muted-foreground text-sm mt-2">
                      {getModeText(mode)}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={toggleTimer}
                    className={cn(
                      "w-32 h-14 text-lg",
                      mode === "work" ? "bg-red-500 hover:bg-red-600" : mode === "shortBreak" ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
                    )}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button size="lg" variant="outline" onClick={resetTimer} className="h-14">
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="h-14"
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowSettings(!showSettings)}
                    className="h-14"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Settings Panel */}
            {showSettings && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timer Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Focus Duration</label>
                      <span className="text-sm text-muted-foreground">{workDuration} min</span>
                    </div>
                    <Slider
                      value={[workDuration]}
                      onValueChange={(v) => setWorkDuration(v[0])}
                      min={15}
                      max={60}
                      step={5}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Short Break</label>
                      <span className="text-sm text-muted-foreground">{shortBreakDuration} min</span>
                    </div>
                    <Slider
                      value={[shortBreakDuration]}
                      onValueChange={(v) => setShortBreakDuration(v[0])}
                      min={3}
                      max={15}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Long Break</label>
                      <span className="text-sm text-muted-foreground">{longBreakDuration} min</span>
                    </div>
                    <Slider
                      value={[longBreakDuration]}
                      onValueChange={(v) => setLongBreakDuration(v[0])}
                      min={10}
                      max={30}
                      step={5}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Pomodoros until Long Break</label>
                      <span className="text-sm text-muted-foreground">{pomodorosUntilLongBreak}</span>
                    </div>
                    <Slider
                      value={[pomodorosUntilLongBreak]}
                      onValueChange={(v) => setPomodorosUntilLongBreak(v[0])}
                      min={2}
                      max={6}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{completedPomodoros}</div>
                    <div className="text-xs text-muted-foreground">This Session</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Target className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{totalPomodoros}</div>
                    <div className="text-xs text-muted-foreground">Total Today</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">
                      {Math.floor((totalPomodoros * workDuration) / 60)}h {(totalPomodoros * workDuration) % 60}m
                    </div>
                    <div className="text-xs text-muted-foreground">Focus Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Tasks
                </CardTitle>
                <CardDescription>What are you working on?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a task..."
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                  />
                  <Button onClick={addTask} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks yet. Add one above!
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          task.completed ? "bg-muted/50 border-muted" : "bg-card border-border"
                        )}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            task.completed ? "bg-green-500 border-green-500" : "border-muted-foreground"
                          )}
                        >
                          {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                        <span className={cn(
                          "flex-1 text-sm",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pomodoro Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Work for 25 minutes, then take a 5-minute break</li>
                  <li>• After 4 pomodoros, take a longer 15-30 minute break</li>
                  <li>• During focus time, avoid all distractions</li>
                  <li>• Use breaks to stretch, hydrate, or rest your eyes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
