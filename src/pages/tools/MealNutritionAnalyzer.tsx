import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  UtensilsCrossed,
  Loader2,
  Lightbulb,
  Heart,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

// --- Config ---

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

const GOALS = [
  { value: "balanced", label: "Balanced Diet" },
  { value: "weight_loss", label: "Weight Loss" },
  { value: "muscle_building", label: "Muscle Building" },
  { value: "energy", label: "Energy & Performance" },
  { value: "diabetic_friendly", label: "Diabetic-Friendly" },
  { value: "high_protein", label: "High Protein" },
];

const PROFILES = [
  { value: "adult_male_sedentary", label: "Adult Male (Sedentary)" },
  { value: "adult_male_active", label: "Adult Male (Active)" },
  { value: "adult_female_sedentary", label: "Adult Female (Sedentary)" },
  { value: "adult_female_active", label: "Adult Female (Active)" },
  { value: "teenager", label: "Teenager" },
  { value: "pregnant_woman", label: "Pregnant Woman" },
];

const PIE_COLORS = ["#10b981", "#6366f1", "#f59e0b"];

// --- Types ---

interface MicroStatus {
  name: string;
  status: "good" | "low" | "high";
}

interface NutritionResult {
  calories: number;
  protein_g: number;
  protein_pct: number;
  carbs_g: number;
  carbs_pct: number;
  fat_g: number;
  fat_pct: number;
  score: number;
  verdict: string;
  balance_summary: string;
  micronutrients: MicroStatus[];
  recommendations: string[];
}

// --- Component ---

export default function MealNutritionAnalyzer() {
  const [meal, setMeal] = useState("");
  const [goal, setGoal] = useState("balanced");
  const [profile, setProfile] = useState("adult_male_sedentary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);

  const analyze = async () => {
    if (!meal.trim()) {
      toast.error("Please describe your meal");
      return;
    }

    if (!GROQ_API_KEY) {
      toast.error("Groq API key not configured");
      return;
    }

    setLoading(true);
    setResult(null);

    const goalLabel = GOALS.find((g) => g.value === goal)?.label || goal;
    const profileLabel = PROFILES.find((p) => p.value === profile)?.label || profile;

    const prompt = `You are a professional nutritionist. Analyze this meal and return ONLY valid JSON (no markdown, no code fences, no extra text).

Meal: ${meal.trim()}
Goal: ${goalLabel}
Profile: ${profileLabel}

Return a single JSON object with these exact keys:
{
  "calories": <number>,
  "protein_g": <number>,
  "protein_pct": <number 0-100>,
  "carbs_g": <number>,
  "carbs_pct": <number 0-100>,
  "fat_g": <number>,
  "fat_pct": <number 0-100>,
  "score": <number 0-100, how well this meal fits the goal>,
  "verdict": "<one of: Excellent, Good, Fair, Poor>",
  "balance_summary": "<1-2 sentence summary of nutritional balance>",
  "micronutrients": [
    {"name": "Iron", "status": "<good|low|high>"},
    {"name": "Calcium", "status": "<good|low|high>"},
    {"name": "Vitamin C", "status": "<good|low|high>"},
    {"name": "Vitamin A", "status": "<good|low|high>"},
    {"name": "Fiber", "status": "<good|low|high>"}
  ],
  "recommendations": ["<tip 1>", "<tip 2>", "<tip 3>"]
}

Be realistic with calorie and macro estimates. Percentages should add up to approximately 100.`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are a nutritionist. Always respond with valid JSON only. No markdown, no explanation.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty response from AI");

      const cleaned = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed: NutritionResult = JSON.parse(cleaned);

      // Validate
      if (typeof parsed.calories !== "number" || !Array.isArray(parsed.recommendations)) {
        throw new Error("Invalid response format");
      }

      setResult(parsed);
      toast.success("Meal analyzed!");
    } catch (err: any) {
      console.error("Nutrition analysis error:", err);
      toast.error(err.message || "Failed to analyze meal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pieData = result
    ? [
        { name: "Protein", value: result.protein_pct },
        { name: "Carbs", value: result.carbs_pct },
        { name: "Fat", value: result.fat_pct },
      ]
    : [];

  function getVerdictColor(verdict: string) {
    switch (verdict) {
      case "Excellent":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-200";
      case "Good":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200";
      case "Fair":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200";
      default:
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200";
    }
  }

  function getMicroIcon(status: string) {
    if (status === "good") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "low") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  }

  function getMicroBadge(status: string) {
    const colors =
      status === "good"
        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
        : status === "low"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    return (
      <Badge className={cn("capitalize", colors)}>
        {status}
      </Badge>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="AI Meal Nutrition Analyzer | TechTrendi Tools"
        description="Get AI-powered nutrition analysis for your meals. Track calories, macros, micronutrients, and get personalized dietary recommendations."
      />

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <UtensilsCrossed className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-emerald-900 dark:text-emerald-100">
              AI Meal Nutrition Analyzer
            </h1>
            <p className="text-emerald-700 dark:text-emerald-300">
              Describe your meals and get instant nutritional breakdown powered by AI
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Input Panel */}
            <Card className="border-emerald-200 dark:border-emerald-800 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <Sparkles className="h-5 w-5" /> Meal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe Your Meal</Label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] resize-y"
                    placeholder="e.g. Breakfast: 2 eggs, bread, tea. Lunch: rice and groundnut soup with chicken"
                    value={meal}
                    onChange={(e) => setMeal(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Dietary Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOALS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Profile</Label>
                  <Select value={profile} onValueChange={setProfile}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFILES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={analyze}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Analyze Meal
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6 lg:col-span-2">
              {result ? (
                <>
                  {/* Macro cards */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    <Card className="border-emerald-200 dark:border-emerald-800">
                      <CardContent className="p-4 text-center">
                        <Flame className="mx-auto mb-1 h-6 w-6 text-orange-500" />
                        <p className="text-xs text-muted-foreground">Calories</p>
                        <p className="text-2xl font-bold">{result.calories}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-200 dark:border-emerald-800">
                      <CardContent className="p-4 text-center">
                        <Beef className="mx-auto mb-1 h-6 w-6 text-red-500" />
                        <p className="text-xs text-muted-foreground">Protein</p>
                        <p className="text-2xl font-bold">{result.protein_g}g</p>
                        <p className="text-xs text-muted-foreground">{result.protein_pct}%</p>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-200 dark:border-emerald-800">
                      <CardContent className="p-4 text-center">
                        <Wheat className="mx-auto mb-1 h-6 w-6 text-amber-500" />
                        <p className="text-xs text-muted-foreground">Carbs</p>
                        <p className="text-2xl font-bold">{result.carbs_g}g</p>
                        <p className="text-xs text-muted-foreground">{result.carbs_pct}%</p>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-200 dark:border-emerald-800">
                      <CardContent className="p-4 text-center">
                        <Droplets className="mx-auto mb-1 h-6 w-6 text-blue-500" />
                        <p className="text-xs text-muted-foreground">Fat</p>
                        <p className="text-2xl font-bold">{result.fat_g}g</p>
                        <p className="text-xs text-muted-foreground">{result.fat_pct}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pie Chart + Score */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Macro Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                                label={({ name, value }) => `${name} ${value}%`}
                              >
                                {pieData.map((_, idx) => (
                                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(val: number) => `${val}%`} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      {/* Score */}
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Nutrition Score</p>
                          <p
                            className={cn(
                              "text-5xl font-bold",
                              result.score >= 80
                                ? "text-green-600"
                                : result.score >= 60
                                ? "text-blue-600"
                                : result.score >= 40
                                ? "text-yellow-600"
                                : "text-red-600"
                            )}
                          >
                            {result.score}
                          </p>
                          <p className="text-xs text-muted-foreground">/100</p>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                result.score >= 80
                                  ? "bg-green-500"
                                  : result.score >= 60
                                  ? "bg-blue-500"
                                  : result.score >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              )}
                              style={{ width: `${result.score}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Verdict */}
                      <Card className={cn("border", getVerdictColor(result.verdict))}>
                        <CardContent className="p-4">
                          <p className="mb-1 font-semibold">{result.verdict}</p>
                          <p className="text-sm">{result.balance_summary}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Macro Progress Bars */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Macro Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { name: "Protein", pct: result.protein_pct, g: result.protein_g, color: "bg-emerald-500" },
                        { name: "Carbs", pct: result.carbs_pct, g: result.carbs_g, color: "bg-indigo-500" },
                        { name: "Fat", pct: result.fat_pct, g: result.fat_g, color: "bg-amber-500" },
                      ].map((m) => (
                        <div key={m.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{m.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {m.g}g ({m.pct}%)
                            </span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className={cn("h-full rounded-full transition-all", m.color)}
                              style={{ width: `${Math.min(m.pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Micronutrients */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Heart className="h-4 w-4 text-pink-500" /> Micronutrients
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.micronutrients.map((micro) => (
                          <div
                            key={micro.name}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-2">
                              {getMicroIcon(micro.status)}
                              <span className="text-sm font-medium">{micro.name}</span>
                            </div>
                            {getMicroBadge(micro.status)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-sm">
                        <Lightbulb className="h-5 w-5 text-yellow-500" /> Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                            <span className="mt-0.5 shrink-0">&#8226;</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <UtensilsCrossed className="mb-4 h-12 w-12 text-emerald-400" />
                    <p className="text-lg font-medium">Describe your meals</p>
                    <p className="text-sm">
                      Then click "Analyze Meal" to get a full nutritional breakdown
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" /> Tips for Better Nutrition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-emerald-500">&#8226;</span>
                      <span><strong>Macronutrients</strong> are the three main nutrients your body needs in large amounts: Protein (builds and repairs muscle), Carbohydrates (primary energy source), and Fat (supports hormones and cell function). A balanced meal typically has 25-35% protein, 40-55% carbs, and 20-30% fat.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-emerald-500">&#8226;</span>
                      <span><strong>Daily calorie needs</strong> vary by person. Sedentary adult males need roughly 2,000-2,400 kcal/day, active males 2,600-3,000, sedentary females 1,600-2,000, and active females 2,000-2,400. Pregnant women need about 300 extra calories daily.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-emerald-500">&#8226;</span>
                      <span><strong>Reading nutrition labels:</strong> Look at serving size first (many packages contain multiple servings). Check calories, then protein and fiber (higher is usually better), then added sugars and sodium (lower is better). The % Daily Value column tells you if a nutrient level is high (&gt;20%) or low (&lt;5%).</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-emerald-500">&#8226;</span>
                      <span><strong>Micronutrients matter.</strong> Iron deficiency is the most common nutritional deficiency worldwide, causing fatigue and weakness. Vitamin C boosts iron absorption — pair leafy greens with citrus fruits. Calcium and Vitamin D work together for strong bones.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
