import { useState, useEffect, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target, Plus, Trash2, TrendingUp, Calendar, DollarSign,
  Sparkles, Trophy, Rocket, Zap, Star, Gift, PartyPopper,
  PiggyBank, Calculator, ChevronDown, ChevronUp, Edit2, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────
interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSavings: number;
  monthlySavings: number;
  interestRate: number; // Annual percentage
  createdAt: string;
  color: string;
}

// ── Constants ──────────────────────────────────────────────────────────
const STORAGE_KEY = "savingsgoal_visualizer_goals";

const GOAL_COLORS = [
  { bg: "from-violet-500 to-purple-600", text: "text-violet-600", light: "bg-violet-100 dark:bg-violet-900/30" },
  { bg: "from-blue-500 to-cyan-500", text: "text-blue-600", light: "bg-blue-100 dark:bg-blue-900/30" },
  { bg: "from-emerald-500 to-teal-500", text: "text-emerald-600", light: "bg-emerald-100 dark:bg-emerald-900/30" },
  { bg: "from-orange-500 to-amber-500", text: "text-orange-600", light: "bg-orange-100 dark:bg-orange-900/30" },
  { bg: "from-pink-500 to-rose-500", text: "text-pink-600", light: "bg-pink-100 dark:bg-pink-900/30" },
  { bg: "from-indigo-500 to-blue-600", text: "text-indigo-600", light: "bg-indigo-100 dark:bg-indigo-900/30" },
  { bg: "from-red-500 to-orange-500", text: "text-red-600", light: "bg-red-100 dark:bg-red-900/30" },
  { bg: "from-cyan-500 to-blue-500", text: "text-cyan-600", light: "bg-cyan-100 dark:bg-cyan-900/30" },
];

const MOTIVATIONAL_MESSAGES = {
  start: [
    "Every journey begins with a single step!",
    "You've got this! Let's start saving!",
    "Small steps lead to big achievements!",
    "Your future self will thank you!",
  ],
  early: [
    "Great start! Keep up the momentum!",
    "You're building a solid foundation!",
    "Consistency is key - you're doing great!",
    "Early progress is the hardest - well done!",
  ],
  quarter: [
    "25% complete! You're making real progress!",
    "A quarter of the way there - fantastic!",
    "Look at you go! Keep pushing!",
    "The first milestone is conquered!",
  ],
  halfway: [
    "HALFWAY THERE! You're unstoppable!",
    "50% done - you're a savings superstar!",
    "The finish line is in sight!",
    "Incredible progress - keep it up!",
  ],
  threeQuarter: [
    "75% - The home stretch awaits!",
    "Almost there! Don't stop now!",
    "You're so close you can taste it!",
    "Just a little more - victory is near!",
  ],
  almostThere: [
    "SO CLOSE! You're about to make it!",
    "The finish line is right there!",
    "One final push - you've got this!",
    "Your goal is within reach!",
  ],
  completed: [
    "YOU DID IT! GOAL ACHIEVED!",
    "CONGRATULATIONS! You're amazing!",
    "VICTORY! Your dedication paid off!",
    "CHAMPION! You reached your goal!",
  ],
};

const PRESET_GOALS = [
  { name: "Emergency Fund", icon: "shield" },
  { name: "New Car", icon: "car" },
  { name: "Vacation", icon: "plane" },
  { name: "House Down Payment", icon: "home" },
  { name: "Wedding", icon: "heart" },
  { name: "Education", icon: "book" },
  { name: "Retirement", icon: "sunset" },
  { name: "Tech Gadget", icon: "laptop" },
];

// ── Helpers ────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCurrencyPrecise = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getMotivationalMessage = (progress: number): string => {
  let category: keyof typeof MOTIVATIONAL_MESSAGES;

  if (progress >= 100) category = "completed";
  else if (progress >= 90) category = "almostThere";
  else if (progress >= 75) category = "threeQuarter";
  else if (progress >= 50) category = "halfway";
  else if (progress >= 25) category = "quarter";
  else if (progress >= 10) category = "early";
  else category = "start";

  const messages = MOTIVATIONAL_MESSAGES[category];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Calculate months to reach goal with compound interest
const calculateTimeToGoal = (
  target: number,
  current: number,
  monthly: number,
  annualRate: number
): { months: number; totalSaved: number; interestEarned: number } => {
  if (current >= target) {
    return { months: 0, totalSaved: current, interestEarned: 0 };
  }

  if (monthly <= 0) {
    return { months: Infinity, totalSaved: current, interestEarned: 0 };
  }

  const monthlyRate = annualRate / 100 / 12;
  let balance = current;
  let months = 0;
  let totalContributions = current;
  const maxMonths = 1200; // 100 years cap

  while (balance < target && months < maxMonths) {
    balance += monthly;
    totalContributions += monthly;
    if (monthlyRate > 0) {
      balance *= (1 + monthlyRate);
    }
    months++;
  }

  const interestEarned = balance - totalContributions;

  return {
    months: months >= maxMonths ? Infinity : months,
    totalSaved: balance,
    interestEarned: Math.max(0, interestEarned),
  };
};

// Calculate savings needed to reach goal faster
const calculateExtraSavingsNeeded = (
  target: number,
  current: number,
  currentMonthly: number,
  annualRate: number,
  targetMonths: number
): number => {
  if (current >= target || targetMonths <= 0) return 0;

  const monthlyRate = annualRate / 100 / 12;

  // Binary search for the monthly savings needed
  let low = 0;
  let high = target;

  while (high - low > 1) {
    const mid = (low + high) / 2;
    let balance = current;

    for (let m = 0; m < targetMonths; m++) {
      balance += mid;
      if (monthlyRate > 0) {
        balance *= (1 + monthlyRate);
      }
    }

    if (balance >= target) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.max(0, Math.ceil(high) - currentMonthly);
};

// ── Confetti Animation Component ──────────────────────────────────────
const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;

  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff", "#5f27cd", "#00d2d3", "#1dd1a1"][Math.floor(Math.random() * 8)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -20, x: `${piece.left}vw`, opacity: 1, rotate: 0 }}
          animate={{
            y: "100vh",
            opacity: [1, 1, 0],
            rotate: Math.random() > 0.5 ? 720 : -720,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "linear",
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: piece.color }}
        />
      ))}
    </div>
  );
};

// ── Milestone Marker Component ────────────────────────────────────────
const MilestoneMarker = ({
  percentage,
  current,
  label
}: {
  percentage: number;
  current: number;
  label: string;
}) => {
  const reached = current >= percentage;

  return (
    <div
      className="absolute top-0 flex flex-col items-center"
      style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: reached ? 1.2 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={cn(
          "w-4 h-4 rounded-full border-2 z-10 transition-all duration-300",
          reached
            ? "bg-gradient-to-r from-yellow-400 to-amber-500 border-yellow-300 shadow-lg shadow-yellow-400/50"
            : "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
        )}
      >
        {reached && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Star className="w-2.5 h-2.5 text-white" fill="white" />
          </motion.div>
        )}
      </motion.div>
      <span className={cn(
        "text-[10px] mt-1 font-medium transition-colors",
        reached ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );
};

// ── Goal Card Component ───────────────────────────────────────────────
const GoalCard = ({
  goal,
  colorIndex,
  onUpdate,
  onDelete,
  onCelebrate,
}: {
  goal: SavingsGoal;
  colorIndex: number;
  onUpdate: (id: string, updates: Partial<SavingsGoal>) => void;
  onDelete: (id: string) => void;
  onCelebrate: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    currentSavings: goal.currentSavings.toString(),
    monthlySavings: goal.monthlySavings.toString(),
  });
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const color = GOAL_COLORS[colorIndex % GOAL_COLORS.length];

  const progress = Math.min(100, (goal.currentSavings / goal.targetAmount) * 100);
  const isCompleted = progress >= 100;

  const calculation = useMemo(() =>
    calculateTimeToGoal(
      goal.targetAmount,
      goal.currentSavings,
      goal.monthlySavings,
      goal.interestRate
    ),
    [goal.targetAmount, goal.currentSavings, goal.monthlySavings, goal.interestRate]
  );

  const fasterBy3Months = useMemo(() => {
    if (isCompleted || calculation.months <= 3) return 0;
    return calculateExtraSavingsNeeded(
      goal.targetAmount,
      goal.currentSavings,
      goal.monthlySavings,
      goal.interestRate,
      calculation.months - 3
    );
  }, [goal, calculation.months, isCompleted]);

  const motivationalMessage = useMemo(() => getMotivationalMessage(progress), [progress]);

  // Trigger celebration when goal is completed
  useEffect(() => {
    if (isCompleted && !hasCelebrated) {
      setHasCelebrated(true);
      onCelebrate();
    }
  }, [isCompleted, hasCelebrated, onCelebrate]);

  const handleSaveEdit = () => {
    const current = parseFloat(editValues.currentSavings);
    const monthly = parseFloat(editValues.monthlySavings);

    if (isNaN(current) || current < 0) {
      toast.error("Please enter a valid current savings amount");
      return;
    }
    if (isNaN(monthly) || monthly < 0) {
      toast.error("Please enter a valid monthly savings amount");
      return;
    }

    onUpdate(goal.id, {
      currentSavings: current,
      monthlySavings: monthly,
    });
    setIsEditing(false);
    toast.success("Goal updated!");
  };

  const formatMonths = (months: number): string => {
    if (months === Infinity) return "Never (increase monthly savings)";
    if (months === 0) return "Goal reached!";

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) return `${months} month${months !== 1 ? "s" : ""}`;
    if (remainingMonths === 0) return `${years} year${years !== 1 ? "s" : ""}`;
    return `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative"
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg",
        isCompleted && "ring-2 ring-yellow-400 dark:ring-yellow-500"
      )}>
        {/* Gradient Header */}
        <div className={cn("h-2 bg-gradient-to-r", color.bg)} />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                color.light
              )}>
                {isCompleted ? (
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Trophy className={cn("w-5 h-5", color.text)} />
                  </motion.div>
                ) : (
                  <Target className={cn("w-5 h-5", color.text)} />
                )}
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {goal.name}
                  {isCompleted && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0">
                      <PartyPopper className="w-3 h-3 mr-1" /> Complete!
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Target: {formatCurrency(goal.targetAmount)}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(goal.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-2xl font-bold">{formatCurrency(goal.currentSavings)}</span>
                <span className="text-muted-foreground text-sm ml-1">saved</span>
              </div>
              <span className="text-lg font-semibold text-muted-foreground">
                {progress.toFixed(1)}%
              </span>
            </div>

            {/* Animated Progress Bar with Milestones */}
            <div className="relative pt-6 pb-4">
              {/* Milestone Markers */}
              <MilestoneMarker percentage={25} current={progress} label="25%" />
              <MilestoneMarker percentage={50} current={progress} label="50%" />
              <MilestoneMarker percentage={75} current={progress} label="75%" />
              <MilestoneMarker percentage={100} current={progress} label="100%" />

              {/* Progress Bar */}
              <div className="relative h-4 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r",
                    color.bg,
                    "relative overflow-hidden"
                  )}
                >
                  {/* Shimmer Effect */}
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
            </div>

            {/* Motivational Message */}
            <motion.div
              key={motivationalMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-3 rounded-lg text-center text-sm font-medium",
                isCompleted
                  ? "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-700 dark:text-yellow-400"
                  : color.light,
                color.text
              )}
            >
              {isCompleted ? (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {motivationalMessage}
                  <Sparkles className="w-4 h-4" />
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Rocket className="w-4 h-4" />
                  {motivationalMessage}
                </span>
              )}
            </motion.div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Time to Goal
              </div>
              <span className="font-semibold text-sm">
                {formatMonths(calculation.months)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Interest Earned
              </div>
              <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                +{formatCurrencyPrecise(calculation.interestEarned)}
              </span>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" /> Less Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" /> More Details
              </>
            )}
          </Button>

          {/* Expanded Section */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-2 border-t">
                  {/* Current Values / Edit Mode */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Current Savings</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.currentSavings}
                          onChange={(e) => setEditValues(prev => ({ ...prev, currentSavings: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Monthly Savings</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.monthlySavings}
                          onChange={(e) => setEditValues(prev => ({ ...prev, monthlySavings: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={handleSaveEdit}>
                          <Check className="w-4 h-4 mr-1" /> Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setIsEditing(false);
                            setEditValues({
                              currentSavings: goal.currentSavings.toString(),
                              monthlySavings: goal.monthlySavings.toString(),
                            });
                          }}
                        >
                          <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                        <span className="text-sm text-muted-foreground">Monthly Savings</span>
                        <span className="font-medium">{formatCurrency(goal.monthlySavings)}/mo</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                        <span className="text-sm text-muted-foreground">Interest Rate</span>
                        <span className="font-medium">{goal.interestRate}% APY</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                        <span className="text-sm text-muted-foreground">Remaining</span>
                        <span className="font-medium">{formatCurrency(Math.max(0, goal.targetAmount - goal.currentSavings))}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" /> Update Progress
                      </Button>
                    </div>
                  )}

                  {/* Speed Up Tip */}
                  {!isCompleted && fasterBy3Months > 0 && calculation.months > 3 && (
                    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-semibold">Speed Tip:</span> Save an extra{" "}
                          <span className="font-bold">{formatCurrency(fasterBy3Months)}/month</span> to reach your goal{" "}
                          <span className="font-bold">3 months faster!</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────
export default function SavingsGoalVisualizer() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Form state
  const [newGoalName, setNewGoalName] = useState("");
  const [newTargetAmount, setNewTargetAmount] = useState("");
  const [newCurrentSavings, setNewCurrentSavings] = useState("");
  const [newMonthlySavings, setNewMonthlySavings] = useState("");
  const [newInterestRate, setNewInterestRate] = useState("0");

  // Load goals from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setGoals(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save goals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch {
      // Ignore storage errors
    }
  }, [goals]);

  const handleAddGoal = () => {
    const name = newGoalName.trim();
    const target = parseFloat(newTargetAmount);
    const current = parseFloat(newCurrentSavings) || 0;
    const monthly = parseFloat(newMonthlySavings);
    const interest = parseFloat(newInterestRate) || 0;

    if (!name) {
      toast.error("Please enter a goal name");
      return;
    }
    if (isNaN(target) || target <= 0) {
      toast.error("Please enter a valid target amount");
      return;
    }
    if (isNaN(monthly) || monthly < 0) {
      toast.error("Please enter a valid monthly savings amount");
      return;
    }
    if (interest < 0 || interest > 100) {
      toast.error("Interest rate must be between 0 and 100");
      return;
    }

    const newGoal: SavingsGoal = {
      id: uid(),
      name,
      targetAmount: target,
      currentSavings: current,
      monthlySavings: monthly,
      interestRate: interest,
      createdAt: new Date().toISOString(),
      color: GOAL_COLORS[goals.length % GOAL_COLORS.length].bg,
    };

    setGoals(prev => [...prev, newGoal]);

    // Reset form
    setNewGoalName("");
    setNewTargetAmount("");
    setNewCurrentSavings("");
    setNewMonthlySavings("");
    setNewInterestRate("0");
    setShowAddForm(false);

    toast.success(`"${name}" goal added! Let's start saving!`);
  };

  const handleUpdateGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setGoals(prev => prev.map(goal =>
      goal.id === id ? { ...goal, ...updates } : goal
    ));
  };

  const handleDeleteGoal = (id: string) => {
    const goal = goals.find(g => g.id === id);
    setGoals(prev => prev.filter(g => g.id !== id));
    if (goal) {
      toast.success(`"${goal.name}" goal removed`);
    }
  };

  const handleCelebrate = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  }, []);

  const selectPresetGoal = (preset: string) => {
    setNewGoalName(preset);
  };

  // Summary stats
  const totalSaved = goals.reduce((sum, g) => sum + g.currentSavings, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const completedGoals = goals.filter(g => g.currentSavings >= g.targetAmount).length;

  return (
    <Layout>
      <SEOHead
        title="Savings Goal Visualizer - Track & Achieve Financial Goals | TechTrendi"
        description="Free savings goal tracker with visual progress bars, milestone markers, interest calculations, and motivational messages. Track multiple goals and celebrate achievements!"
        canonicalUrl="https://techtrendi.com/tools/savings-goal-visualizer"
      />

      <Confetti show={showConfetti} />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-4 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/30 dark:to-teal-900/30 dark:text-emerald-400 border-0">
            <PiggyBank className="w-3.5 h-3.5 mr-1" /> Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Savings Goal <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Visualizer</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Set savings goals, track your progress with beautiful visualizations, and stay motivated with milestone celebrations!
          </p>
        </motion.div>

        {/* Summary Stats */}
        {goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm mb-1">
                  <Target className="w-4 h-4" />
                  Active Goals
                </div>
                <span className="text-2xl font-bold">{goals.length}</span>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  Total Saved
                </div>
                <span className="text-2xl font-bold">{formatCurrency(totalSaved)}</span>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm mb-1">
                  <Calculator className="w-4 h-4" />
                  Total Target
                </div>
                <span className="text-2xl font-bold">{formatCurrency(totalTarget)}</span>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mb-1">
                  <Trophy className="w-4 h-4" />
                  Completed
                </div>
                <span className="text-2xl font-bold">{completedGoals}/{goals.length}</span>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Add Goal Button */}
        {!showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Button
              size="lg"
              onClick={() => setShowAddForm(true)}
              className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-5 h-5 mr-2" /> Add New Savings Goal
            </Button>
          </motion.div>
        )}

        {/* Add Goal Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <Card className="border-2 border-dashed border-emerald-300 dark:border-emerald-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-emerald-500" />
                    Create New Savings Goal
                  </CardTitle>
                  <CardDescription>
                    Set your target and start tracking your progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preset Goals */}
                  <div>
                    <Label className="text-sm mb-2 block">Quick Select</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_GOALS.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => selectPresetGoal(preset.name)}
                          className={cn(
                            newGoalName === preset.name && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                          )}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="goalName">Goal Name *</Label>
                      <Input
                        id="goalName"
                        placeholder="e.g., Dream Vacation to Japan"
                        value={newGoalName}
                        onChange={(e) => setNewGoalName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetAmount">Target Amount ($) *</Label>
                      <Input
                        id="targetAmount"
                        type="number"
                        min="0"
                        step="100"
                        placeholder="10000"
                        value={newTargetAmount}
                        onChange={(e) => setNewTargetAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currentSavings">Current Savings ($)</Label>
                      <Input
                        id="currentSavings"
                        type="number"
                        min="0"
                        step="10"
                        placeholder="0"
                        value={newCurrentSavings}
                        onChange={(e) => setNewCurrentSavings(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthlySavings">Monthly Savings ($) *</Label>
                      <Input
                        id="monthlySavings"
                        type="number"
                        min="0"
                        step="50"
                        placeholder="500"
                        value={newMonthlySavings}
                        onChange={(e) => setNewMonthlySavings(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="interestRate">Expected Interest Rate (% APY)</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0"
                        value={newInterestRate}
                        onChange={(e) => setNewInterestRate(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: Enter if saving in a high-yield account
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleAddGoal}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Create Goal
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewGoalName("");
                        setNewTargetAmount("");
                        setNewCurrentSavings("");
                        setNewMonthlySavings("");
                        setNewInterestRate("0");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals Grid */}
        {goals.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            <AnimatePresence>
              {goals.map((goal, index) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  colorIndex={index}
                  onUpdate={handleUpdateGoal}
                  onDelete={handleDeleteGoal}
                  onCelebrate={handleCelebrate}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Savings Goals Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Start your financial journey by creating your first savings goal. Track your progress and celebrate achievements!
                </p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Savings Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-2xl">1</span> Pay Yourself First
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Set up automatic transfers to savings right after payday before spending on anything else.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-2xl">2</span> Use High-Yield Accounts
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Put your savings in a high-yield savings account to earn interest while you save.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-2xl">3</span> Celebrate Milestones
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Reward yourself (modestly) when you hit 25%, 50%, and 75% to stay motivated!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
