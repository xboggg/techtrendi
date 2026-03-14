import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart, Scale, Ruler, Activity, TrendingUp, Calculator, User, Trash2, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────
interface BmiRecord {
  id: string;
  date: string;
  bmi: number;
  weight: number;
  height: number;
  category: string;
}

type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (office job)",
  light: "Light (1-3 days/week)",
  moderate: "Moderate (3-5 days/week)",
  active: "Active (6-7 days/week)",
  very_active: "Very Active (athlete)",
};

const BMI_ZONES = [
  { label: "Underweight", min: 0, max: 18.5, color: "bg-blue-400", textColor: "text-blue-600", lightBg: "bg-blue-50 dark:bg-blue-950/30" },
  { label: "Normal", min: 18.5, max: 24.9, color: "bg-green-500", textColor: "text-green-600", lightBg: "bg-green-50 dark:bg-green-950/30" },
  { label: "Overweight", min: 25, max: 29.9, color: "bg-yellow-500", textColor: "text-yellow-600", lightBg: "bg-yellow-50 dark:bg-yellow-950/30" },
  { label: "Obese", min: 30, max: 50, color: "bg-red-500", textColor: "text-red-600", lightBg: "bg-red-50 dark:bg-red-950/30" },
];

// ─── Helpers ────────────────────────────────────────────────────────
function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return BMI_ZONES[0];
  if (bmi < 25) return BMI_ZONES[1];
  if (bmi < 30) return BMI_ZONES[2];
  return BMI_ZONES[3];
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function loadHistory(): BmiRecord[] {
  try {
    return JSON.parse(localStorage.getItem("bmi_history") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(records: BmiRecord[]) {
  localStorage.setItem("bmi_history", JSON.stringify(records));
}

// ─── BMI Gauge Component ────────────────────────────────────────────
function BmiGauge({ bmi }: { bmi: number | null }) {
  // Map bmi 10-50 across the gauge (0%-100%)
  const pct = bmi ? clamp(((bmi - 10) / 40) * 100, 0, 100) : 0;

  return (
    <div className="w-full space-y-2">
      {/* Zone labels */}
      <div className="flex text-[10px] sm:text-xs font-medium">
        {BMI_ZONES.map((z) => {
          const width = ((Math.min(z.max, 50) - Math.max(z.min, 10)) / 40) * 100;
          return (
            <div key={z.label} style={{ width: `${width}%` }} className="text-center truncate">
              <span className={z.textColor}>{z.label}</span>
            </div>
          );
        })}
      </div>

      {/* Colored bar */}
      <div className="relative h-5 rounded-full overflow-hidden flex">
        {BMI_ZONES.map((z) => {
          const width = ((Math.min(z.max, 50) - Math.max(z.min, 10)) / 40) * 100;
          return <div key={z.label} style={{ width: `${width}%` }} className={cn("h-full", z.color)} />;
        })}

        {/* Needle */}
        {bmi !== null && (
          <motion.div
            className="absolute top-0 h-full w-0.5"
            initial={{ left: "0%" }}
            animate={{ left: `${pct}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
          >
            <div className="relative h-full">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-foreground" />
              <div className="w-0.5 h-full bg-foreground" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-foreground" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Scale numbers */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-1">
        <span>10</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>50</span>
      </div>
    </div>
  );
}

// ─── History Chart (simple SVG) ─────────────────────────────────────
function HistoryChart({ records }: { records: BmiRecord[] }) {
  if (records.length < 2) return null;

  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const values = sorted.map((r) => r.bmi);
  const minV = Math.floor(Math.min(...values) - 2);
  const maxV = Math.ceil(Math.max(...values) + 2);
  const range = maxV - minV || 1;

  const W = 500;
  const H = 200;
  const pad = 40;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  const points = sorted.map((r, i) => ({
    x: pad + (i / (sorted.length - 1)) * innerW,
    y: pad + innerH - ((r.bmi - minV) / range) * innerH,
    record: r,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Zone background rects
  const zoneRects = BMI_ZONES.map((z) => {
    const top = pad + innerH - ((Math.min(z.max, maxV) - minV) / range) * innerH;
    const bottom = pad + innerH - ((Math.max(z.min, minV) - minV) / range) * innerH;
    return { ...z, y: Math.max(top, pad), height: Math.min(bottom - top, innerH) };
  }).filter((r) => r.height > 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Zone backgrounds */}
      {zoneRects.map((z) => (
        <rect
          key={z.label}
          x={pad}
          y={z.y}
          width={innerW}
          height={z.height}
          className={cn(
            z.label === "Normal" ? "fill-green-500/10" :
            z.label === "Underweight" ? "fill-blue-500/10" :
            z.label === "Overweight" ? "fill-yellow-500/10" : "fill-red-500/10"
          )}
        />
      ))}

      {/* Grid lines */}
      {[minV, 18.5, 25, 30, maxV].filter((v) => v >= minV && v <= maxV).map((v) => {
        const y = pad + innerH - ((v - minV) / range) * innerH;
        return (
          <g key={v}>
            <line x1={pad} y1={y} x2={pad + innerW} y2={y} stroke="currentColor" strokeOpacity={0.1} />
            <text x={pad - 4} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
              {v}
            </text>
          </g>
        );
      })}

      {/* Line */}
      <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" className="fill-primary" />
          <text x={p.x} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[8px]">
            {new Date(p.record.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function BmiCalculator() {
  // Unit system
  const [isMetric, setIsMetric] = useState(true);

  // BMI inputs
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [weightLbs, setWeightLbs] = useState("");

  // Body fat inputs
  const [waistCm, setWaistCm] = useState("");
  const [neckCm, setNeckCm] = useState("");
  const [hipCm, setHipCm] = useState("");

  // Calorie inputs
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

  // WHR inputs
  const [whrWaist, setWhrWaist] = useState("");
  const [whrHip, setWhrHip] = useState("");

  // History
  const [history, setHistory] = useState<BmiRecord[]>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // ── Derived values ──
  const heightInCm = useMemo(() => {
    if (isMetric) return parseFloat(heightCm) || 0;
    const ft = parseFloat(heightFt) || 0;
    const inches = parseFloat(heightIn) || 0;
    return (ft * 12 + inches) * 2.54;
  }, [isMetric, heightCm, heightFt, heightIn]);

  const weightInKg = useMemo(() => {
    if (isMetric) return parseFloat(weightKg) || 0;
    return (parseFloat(weightLbs) || 0) * 0.453592;
  }, [isMetric, weightKg, weightLbs]);

  const bmi = useMemo(() => {
    if (heightInCm <= 0 || weightInKg <= 0) return null;
    const heightM = heightInCm / 100;
    return parseFloat((weightInKg / (heightM * heightM)).toFixed(1));
  }, [heightInCm, weightInKg]);

  const bmiCategory = bmi ? getBmiCategory(bmi) : null;

  // Ideal weight range (BMI 18.5 - 24.9)
  const idealWeight = useMemo(() => {
    if (heightInCm <= 0) return null;
    const hm = heightInCm / 100;
    const low = 18.5 * hm * hm;
    const high = 24.9 * hm * hm;
    return { low: parseFloat(low.toFixed(1)), high: parseFloat(high.toFixed(1)) };
  }, [heightInCm]);

  // Body fat % (US Navy method)
  const bodyFat = useMemo(() => {
    const waist = parseFloat(waistCm) || 0;
    const neck = parseFloat(neckCm) || 0;
    const hip = parseFloat(hipCm) || 0;
    if (heightInCm <= 0 || waist <= 0 || neck <= 0) return null;
    if (gender === "female" && hip <= 0) return null;
    if (waist - neck <= 0) return null;

    let bf: number;
    if (gender === "male") {
      bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightInCm)) - 450;
    } else {
      if (waist + hip - neck <= 0) return null;
      bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(heightInCm)) - 450;
    }
    return parseFloat(clamp(bf, 2, 60).toFixed(1));
  }, [waistCm, neckCm, hipCm, heightInCm, gender]);

  // BMR & TDEE (Mifflin-St Jeor)
  const calories = useMemo(() => {
    const a = parseFloat(age) || 0;
    if (weightInKg <= 0 || heightInCm <= 0 || a <= 0) return null;
    let bmr: number;
    if (gender === "male") {
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * a + 5;
    } else {
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * a - 161;
    }
    const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
    return {
      bmr: Math.round(bmr),
      maintenance: Math.round(tdee),
      loss: Math.round(tdee - 500),
      gain: Math.round(tdee + 500),
    };
  }, [weightInKg, heightInCm, age, gender, activityLevel]);

  // Waist-to-Hip Ratio
  const whr = useMemo(() => {
    const w = parseFloat(whrWaist) || 0;
    const h = parseFloat(whrHip) || 0;
    if (w <= 0 || h <= 0) return null;
    return parseFloat((w / h).toFixed(2));
  }, [whrWaist, whrHip]);

  const whrRisk = useMemo(() => {
    if (!whr) return null;
    if (gender === "male") {
      if (whr < 0.90) return { level: "Low", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" };
      if (whr < 1.0) return { level: "Moderate", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30" };
      return { level: "High", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" };
    } else {
      if (whr < 0.80) return { level: "Low", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" };
      if (whr < 0.85) return { level: "Moderate", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30" };
      return { level: "High", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" };
    }
  }, [whr, gender]);

  // ── Actions ──
  const saveBmi = () => {
    if (!bmi) return;
    const record: BmiRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      bmi,
      weight: parseFloat(weightInKg.toFixed(1)),
      height: parseFloat(heightInCm.toFixed(1)),
      category: bmiCategory?.label || "",
    };
    setHistory((prev) => [record, ...prev].slice(0, 50));
  };

  const clearHistory = () => setHistory([]);
  const deleteRecord = (id: string) => setHistory((prev) => prev.filter((r) => r.id !== id));

  const resetAll = () => {
    setHeightCm(""); setHeightFt(""); setHeightIn("");
    setWeightKg(""); setWeightLbs("");
    setWaistCm(""); setNeckCm(""); setHipCm("");
    setAge("");
    setWhrWaist(""); setWhrHip("");
  };

  // ── Number input helper ──
  const numInput = (value: string, setter: (v: string) => void, placeholder: string, label?: string) => (
    <div className="space-y-1.5">
      {label && <Label className="text-sm">{label}</Label>}
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        className="h-10"
      />
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <Layout>
      <SEOHead
        title="BMI & Health Calculator - Body Mass Index, Body Fat, Calorie Calculator | TechTrendi"
        description="Free BMI calculator with body fat estimation, ideal weight range, daily calorie needs, and waist-to-hip ratio. Track your health metrics over time."
        canonicalUrl="https://techtrendi.com/tools/bmi-calculator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            BMI & Health <span className="text-primary">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Calculate your BMI, body fat percentage, ideal weight, daily calorie needs, and waist-to-hip ratio -- all in one place.
          </p>
        </div>

        {/* Unit toggle + Gender + Reset */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2">
            <Label className={cn("text-sm font-medium transition-colors", !isMetric && "text-muted-foreground")}>Metric</Label>
            <Switch checked={!isMetric} onCheckedChange={(v) => setIsMetric(!v)} />
            <Label className={cn("text-sm font-medium transition-colors", isMetric && "text-muted-foreground")}>Imperial</Label>
          </div>

          <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
            <SelectTrigger className="w-36 h-10">
              <User className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={resetAll}>
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="bmi" className="space-y-6">
          <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full max-w-2xl mx-auto h-auto gap-1">
            <TabsTrigger value="bmi" className="text-xs sm:text-sm py-2">
              <Scale className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" /> BMI
            </TabsTrigger>
            <TabsTrigger value="bodyfat" className="text-xs sm:text-sm py-2">
              <Heart className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" /> Body Fat
            </TabsTrigger>
            <TabsTrigger value="calories" className="text-xs sm:text-sm py-2">
              <Activity className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" /> Calories
            </TabsTrigger>
            <TabsTrigger value="whr" className="text-xs sm:text-sm py-2">
              <Ruler className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" /> WHR
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm py-2 col-span-3 sm:col-span-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" /> History
            </TabsTrigger>
          </TabsList>

          {/* ═══════ BMI Tab ═══════ */}
          <TabsContent value="bmi">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Input card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-primary" /> BMI Calculator
                    </CardTitle>
                    <CardDescription>Enter your height and weight to calculate BMI</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isMetric ? (
                      <>
                        {numInput(heightCm, setHeightCm, "e.g. 175", "Height (cm)")}
                        {numInput(weightKg, setWeightKg, "e.g. 70", "Weight (kg)")}
                      </>
                    ) : (
                      <>
                        <Label className="text-sm">Height</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {numInput(heightFt, setHeightFt, "Feet")}
                          {numInput(heightIn, setHeightIn, "Inches")}
                        </div>
                        {numInput(weightLbs, setWeightLbs, "e.g. 154", "Weight (lbs)")}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Result card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-primary" /> Your Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                    {/* Big BMI number */}
                    <AnimatePresence mode="wait">
                      {bmi !== null ? (
                        <motion.div
                          key={bmi}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="text-center"
                        >
                          <div className="text-6xl font-bold text-foreground">{bmi}</div>
                          <Badge className={cn("mt-2 text-sm", bmiCategory?.lightBg, bmiCategory?.textColor)}>
                            {bmiCategory?.label}
                          </Badge>
                        </motion.div>
                      ) : (
                        <motion.div className="text-center py-6 text-muted-foreground text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          Enter height & weight to see results
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Gauge */}
                    <BmiGauge bmi={bmi} />

                    {/* Ideal weight */}
                    {idealWeight && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center p-3 rounded-lg bg-muted/50"
                      >
                        <p className="text-xs text-muted-foreground mb-1">Ideal Weight Range (BMI 18.5 - 24.9)</p>
                        <p className="text-lg font-semibold text-foreground">
                          {isMetric
                            ? `${idealWeight.low} - ${idealWeight.high} kg`
                            : `${(idealWeight.low / 0.453592).toFixed(1)} - ${(idealWeight.high / 0.453592).toFixed(1)} lbs`}
                        </p>
                      </motion.div>
                    )}

                    {/* Save button */}
                    {bmi !== null && (
                      <Button onClick={saveBmi} className="w-full">
                        <TrendingUp className="w-4 h-4 mr-2" /> Save to History
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* BMI Info cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {BMI_ZONES.map((z) => (
                <motion.div
                  key={z.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={cn("text-center", bmiCategory?.label === z.label && "ring-2 ring-primary")}>
                    <CardContent className="pt-4 pb-4">
                      <div className={cn("w-3 h-3 rounded-full mx-auto mb-2", z.color)} />
                      <p className="font-semibold text-sm text-foreground">{z.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {z.min === 0 ? `< ${z.max}` : z.max === 50 ? `${z.min}+` : `${z.min} - ${z.max}`}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* ═══════ Body Fat Tab ═══════ */}
          <TabsContent value="bodyfat">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-primary" /> Body Measurements
                    </CardTitle>
                    <CardDescription>US Navy method -- measure in centimeters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isMetric ? (
                      numInput(heightCm, setHeightCm, "e.g. 175", "Height (cm)")
                    ) : (
                      <>
                        <Label className="text-sm">Height</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {numInput(heightFt, setHeightFt, "Feet")}
                          {numInput(heightIn, setHeightIn, "Inches")}
                        </div>
                      </>
                    )}
                    {numInput(waistCm, setWaistCm, "e.g. 85", "Waist circumference (cm)")}
                    {numInput(neckCm, setNeckCm, "e.g. 38", "Neck circumference (cm)")}
                    {gender === "female" && numInput(hipCm, setHipCm, "e.g. 95", "Hip circumference (cm)")}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" /> Body Fat Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center space-y-6">
                    <AnimatePresence mode="wait">
                      {bodyFat !== null ? (
                        <motion.div
                          key={bodyFat}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="text-center"
                        >
                          <div className="text-6xl font-bold text-foreground">{bodyFat}%</div>
                          <p className="text-muted-foreground text-sm mt-2">Estimated Body Fat</p>

                          {/* Category badge */}
                          <Badge className={cn("mt-3", (() => {
                            if (gender === "male") {
                              if (bodyFat < 6) return "bg-blue-50 text-blue-600 dark:bg-blue-950/30";
                              if (bodyFat < 14) return "bg-green-50 text-green-600 dark:bg-green-950/30";
                              if (bodyFat < 18) return "bg-green-50 text-green-600 dark:bg-green-950/30";
                              if (bodyFat < 25) return "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30";
                              return "bg-red-50 text-red-600 dark:bg-red-950/30";
                            } else {
                              if (bodyFat < 14) return "bg-blue-50 text-blue-600 dark:bg-blue-950/30";
                              if (bodyFat < 21) return "bg-green-50 text-green-600 dark:bg-green-950/30";
                              if (bodyFat < 25) return "bg-green-50 text-green-600 dark:bg-green-950/30";
                              if (bodyFat < 32) return "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30";
                              return "bg-red-50 text-red-600 dark:bg-red-950/30";
                            }
                          })())}>
                            {(() => {
                              if (gender === "male") {
                                if (bodyFat < 6) return "Essential Fat";
                                if (bodyFat < 14) return "Athletes";
                                if (bodyFat < 18) return "Fitness";
                                if (bodyFat < 25) return "Average";
                                return "Above Average";
                              } else {
                                if (bodyFat < 14) return "Essential Fat";
                                if (bodyFat < 21) return "Athletes";
                                if (bodyFat < 25) return "Fitness";
                                if (bodyFat < 32) return "Average";
                                return "Above Average";
                              }
                            })()}
                          </Badge>
                        </motion.div>
                      ) : (
                        <motion.div className="text-center py-8 text-muted-foreground text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          Enter height and body measurements to estimate body fat
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reference table */}
                    <div className="w-full rounded-lg border overflow-hidden text-sm">
                      <div className="grid grid-cols-3 bg-muted/50 p-2 font-medium text-muted-foreground">
                        <span>Category</span>
                        <span className="text-center">Male</span>
                        <span className="text-center">Female</span>
                      </div>
                      {[
                        { cat: "Essential", m: "2-5%", f: "10-13%" },
                        { cat: "Athletes", m: "6-13%", f: "14-20%" },
                        { cat: "Fitness", m: "14-17%", f: "21-24%" },
                        { cat: "Average", m: "18-24%", f: "25-31%" },
                        { cat: "Above Avg", m: "25%+", f: "32%+" },
                      ].map((row) => (
                        <div key={row.cat} className="grid grid-cols-3 p-2 border-t text-muted-foreground">
                          <span>{row.cat}</span>
                          <span className="text-center">{row.m}</span>
                          <span className="text-center">{row.f}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* ═══════ Calories Tab ═══════ */}
          <TabsContent value="calories">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" /> Daily Calorie Needs
                    </CardTitle>
                    <CardDescription>Mifflin-St Jeor equation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isMetric ? (
                      <>
                        {numInput(heightCm, setHeightCm, "e.g. 175", "Height (cm)")}
                        {numInput(weightKg, setWeightKg, "e.g. 70", "Weight (kg)")}
                      </>
                    ) : (
                      <>
                        <Label className="text-sm">Height</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {numInput(heightFt, setHeightFt, "Feet")}
                          {numInput(heightIn, setHeightIn, "Inches")}
                        </div>
                        {numInput(weightLbs, setWeightLbs, "e.g. 154", "Weight (lbs)")}
                      </>
                    )}
                    {numInput(age, setAge, "e.g. 30", "Age (years)")}

                    <div className="space-y-1.5">
                      <Label className="text-sm">Activity Level</Label>
                      <Select value={activityLevel} onValueChange={(v) => setActivityLevel(v as ActivityLevel)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((key) => (
                            <SelectItem key={key} value={key}>{ACTIVITY_LABELS[key]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-primary" /> Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence mode="wait">
                      {calories ? (
                        <motion.div
                          key={calories.maintenance}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          {/* BMR */}
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Basal Metabolic Rate (BMR)</p>
                            <p className="text-3xl font-bold text-foreground">{calories.bmr.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">calories/day at rest</p>
                          </div>

                          {/* TDEE cards */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                              <p className="text-[10px] sm:text-xs text-green-600 mb-1 font-medium">Weight Loss</p>
                              <p className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-400">
                                {calories.loss.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-green-600/70">-500 cal/day</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center ring-2 ring-primary/30">
                              <p className="text-[10px] sm:text-xs text-blue-600 mb-1 font-medium">Maintain</p>
                              <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400">
                                {calories.maintenance.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-blue-600/70">cal/day</p>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-center">
                              <p className="text-[10px] sm:text-xs text-orange-600 mb-1 font-medium">Weight Gain</p>
                              <p className="text-lg sm:text-xl font-bold text-orange-700 dark:text-orange-400">
                                {calories.gain.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-orange-600/70">+500 cal/day</p>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground text-center">
                            A deficit of ~500 cal/day leads to ~0.45 kg (1 lb) loss per week
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div className="text-center py-12 text-muted-foreground text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          Enter height, weight, age, and activity level to calculate daily calorie needs
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* ═══════ WHR Tab ═══════ */}
          <TabsContent value="whr">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-primary" /> Waist-to-Hip Ratio
                    </CardTitle>
                    <CardDescription>Measure at the narrowest waist and widest hip</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {numInput(whrWaist, setWhrWaist, "e.g. 80", "Waist circumference (cm)")}
                    {numInput(whrHip, setWhrHip, "e.g. 100", "Hip circumference (cm)")}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" /> Health Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence mode="wait">
                      {whr !== null && whrRisk ? (
                        <motion.div
                          key={whr}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="text-center space-y-4"
                        >
                          <div className="text-6xl font-bold text-foreground">{whr}</div>
                          <Badge className={cn("text-sm", whrRisk.bg, whrRisk.color)}>
                            {whrRisk.level} Risk
                          </Badge>

                          <div className="w-full rounded-lg border overflow-hidden text-sm mt-4">
                            <div className="grid grid-cols-3 bg-muted/50 p-2 font-medium text-muted-foreground">
                              <span>Risk</span>
                              <span className="text-center">Male</span>
                              <span className="text-center">Female</span>
                            </div>
                            {[
                              { risk: "Low", m: "< 0.90", f: "< 0.80" },
                              { risk: "Moderate", m: "0.90 - 0.99", f: "0.80 - 0.84" },
                              { risk: "High", m: "1.00+", f: "0.85+" },
                            ].map((row) => (
                              <div
                                key={row.risk}
                                className={cn(
                                  "grid grid-cols-3 p-2 border-t text-muted-foreground",
                                  whrRisk.level === row.risk && "bg-primary/5 font-medium text-foreground"
                                )}
                              >
                                <span>{row.risk}</span>
                                <span className="text-center">{row.m}</span>
                                <span className="text-center">{row.f}</span>
                              </div>
                            ))}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Higher ratios indicate greater visceral fat and cardiovascular risk (WHO guidelines).
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div className="text-center py-12 text-muted-foreground text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          Enter waist and hip measurements to assess health risk
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* ═══════ History Tab ═══════ */}
          <TabsContent value="history">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" /> BMI History
                      </CardTitle>
                      <CardDescription>Track your BMI over time</CardDescription>
                    </div>
                    {history.length > 0 && (
                      <Button variant="outline" size="sm" onClick={clearHistory}>
                        <Trash2 className="w-4 h-4 mr-2" /> Clear All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Scale className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No history yet. Calculate your BMI and save it to start tracking.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Chart */}
                      {history.length >= 2 && (
                        <div className="p-4 rounded-lg border bg-muted/20">
                          <HistoryChart records={history} />
                        </div>
                      )}

                      {/* Records list */}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {history.map((record) => {
                          const cat = getBmiCategory(record.bmi);
                          return (
                            <motion.div
                              key={record.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                            >
                              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", cat.color)} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="font-semibold text-foreground">{record.bmi}</span>
                                  <Badge variant="outline" className={cn("text-[10px]", cat.textColor)}>
                                    {record.category}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {record.weight} kg | {record.height} cm |{" "}
                                  {new Date(record.date).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => deleteRecord(record.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-8 max-w-xl mx-auto">
          This tool is for informational purposes only and is not a substitute for professional medical advice.
          Always consult a healthcare provider for personalized health assessments.
        </p>
      </div>
    </Layout>
  );
}
