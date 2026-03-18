import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  BarChart3, TrendingUp, AlertTriangle, Lightbulb,
  Sparkles, Hash, Copy, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Pre-defined datasets
const presets: { label: string; data: number[] }[] = [
  {
    label: "Bell curve",
    data: [22, 25, 27, 28, 29, 30, 30, 31, 31, 31, 32, 32, 32, 32, 33, 33, 33, 33, 33, 34, 34, 34, 34, 35, 35, 35, 36, 36, 37, 38, 39, 41],
  },
  {
    label: "Skewed",
    data: [1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 6, 7, 8, 10, 12, 15, 20, 30, 45, 60],
  },
  {
    label: "Bimodal",
    data: [10, 11, 12, 12, 13, 13, 14, 14, 14, 15, 15, 35, 36, 36, 37, 37, 38, 38, 38, 39, 39, 40],
  },
  {
    label: "With outliers",
    data: [48, 49, 50, 50, 51, 51, 51, 52, 52, 52, 52, 53, 53, 53, 54, 54, 55, 56, 57, 85, 92],
  },
  {
    label: "Uniform",
    data: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50],
  },
  {
    label: "Exam scores",
    data: [32, 45, 48, 52, 55, 58, 60, 62, 63, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 78, 80, 82, 85, 88, 91, 95],
  },
];

// Stats computation
function computeStats(nums: number[]) {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const median =
    n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  // Mode
  const freq: Record<number, number> = {};
  sorted.forEach((v) => (freq[v] = (freq[v] || 0) + 1));
  const maxFreq = Math.max(...Object.values(freq));
  const modes = Object.entries(freq)
    .filter(([, f]) => f === maxFreq && f > 1)
    .map(([v]) => Number(v));
  const modeStr = modes.length === 0 ? "None" : modes.join(", ");

  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;

  // Skewness (Pearson's second)
  const skewness = n >= 3
    ? (sorted.reduce((acc, v) => acc + ((v - mean) / stdDev) ** 3, 0) * n) /
      ((n - 1) * (n - 2))
    : 0;

  const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  // Outliers (IQR method)
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);

  return {
    count: n,
    mean,
    median,
    mode: modeStr,
    stdDev,
    variance,
    min,
    max,
    range,
    q1,
    q3,
    iqr,
    skewness,
    cv,
    outliers,
    lowerFence,
    upperFence,
    sorted,
  };
}

function percentile(sorted: number[], p: number): number {
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function buildHistogram(sorted: number[]) {
  if (sorted.length === 0) return [];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const binCount = Math.max(5, Math.min(20, Math.ceil(Math.sqrt(sorted.length))));
  const binWidth = (max - min) / binCount || 1;
  const bins: { range: string; count: number; from: number; to: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    const from = min + i * binWidth;
    const to = from + binWidth;
    const count = sorted.filter(
      (v) => (i === binCount - 1 ? v >= from && v <= to : v >= from && v < to)
    ).length;
    bins.push({
      range: `${from.toFixed(1)}-${to.toFixed(1)}`,
      count,
      from,
      to,
    });
  }
  return bins;
}

function buildCDF(sorted: number[]) {
  return sorted.map((val, i) => ({
    value: val,
    cumulative: ((i + 1) / sorted.length) * 100,
  }));
}

function buildDotPlot(sorted: number[]) {
  const freq: Record<number, number> = {};
  return sorted.map((val) => {
    freq[val] = (freq[val] || 0) + 1;
    return { x: val, y: freq[val] };
  });
}

const fmt = (n: number) => (Number.isInteger(n) ? n.toString() : n.toFixed(3));

export default function StatisticsVisualizer() {
  const [input, setInput] = useState("");

  const numbers = useMemo(() => {
    if (!input.trim()) return [];
    return input
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map(Number)
      .filter((n) => !isNaN(n));
  }, [input]);

  const stats = useMemo(() => computeStats(numbers), [numbers]);
  const histogram = useMemo(() => (stats ? buildHistogram(stats.sorted) : []), [stats]);
  const cdf = useMemo(() => (stats ? buildCDF(stats.sorted) : []), [stats]);
  const dotPlot = useMemo(() => (stats ? buildDotPlot(stats.sorted) : []), [stats]);

  const loadPreset = (data: number[]) => {
    setInput(data.join(", "));
  };

  const copyStats = () => {
    if (!stats) return;
    const text = `Count: ${stats.count}\nMean: ${fmt(stats.mean)}\nMedian: ${fmt(stats.median)}\nMode: ${stats.mode}\nStd Dev: ${fmt(stats.stdDev)}\nVariance: ${fmt(stats.variance)}\nMin: ${stats.min}\nMax: ${stats.max}\nRange: ${stats.range}\nQ1: ${fmt(stats.q1)}\nQ3: ${fmt(stats.q3)}\nIQR: ${fmt(stats.iqr)}`;
    navigator.clipboard.writeText(text);
    toast.success("Statistics copied!");
  };

  const statCards = stats
    ? [
        { label: "Count", value: stats.count, color: "text-blue-400" },
        { label: "Mean", value: fmt(stats.mean), color: "text-emerald-400" },
        { label: "Median", value: fmt(stats.median), color: "text-emerald-400" },
        { label: "Mode", value: stats.mode, color: "text-purple-400" },
        { label: "Std Dev", value: fmt(stats.stdDev), color: "text-amber-400" },
        { label: "Variance", value: fmt(stats.variance), color: "text-amber-400" },
        { label: "Min", value: stats.min, color: "text-cyan-400" },
        { label: "Max", value: stats.max, color: "text-cyan-400" },
        { label: "Range", value: stats.range, color: "text-cyan-400" },
        { label: "Q1 (25th)", value: fmt(stats.q1), color: "text-indigo-400" },
        { label: "Q3 (75th)", value: fmt(stats.q3), color: "text-indigo-400" },
        { label: "IQR", value: fmt(stats.iqr), color: "text-indigo-400" },
      ]
    : [];

  return (
    <Layout>
      <SEOHead
        title="Statistics Visualizer | TechTrendi"
        description="Paste your numbers and instantly see mean, median, mode, standard deviation, histograms, and more. Free online statistics calculator with charts."
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-1.5 mb-4">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 text-sm font-medium">
                Statistics Visualizer
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Visualize Your Data Instantly
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Paste numbers, see statistics and charts in real time. No sign-up required.
            </p>
          </div>

          {/* Input */}
          <Card className="bg-slate-900/80 border-slate-700/60 mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Hash className="w-5 h-5 text-violet-400" />
                  Enter Your Numbers
                </CardTitle>
                {numbers.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInput("")}
                    className="text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter numbers separated by commas or spaces, e.g.: 12, 15, 18, 22, 25, 30, 35"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px] font-mono text-sm"
              />
              {numbers.length > 0 && (
                <p className="text-slate-400 text-sm">
                  Parsed <span className="text-violet-400 font-semibold">{numbers.length}</span> numbers
                </p>
              )}

              {/* Preset buttons */}
              <div>
                <Label className="text-slate-400 text-xs mb-2 block">
                  Try a preset dataset:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <Button
                      key={p.label}
                      variant="outline"
                      size="sm"
                      onClick={() => loadPreset(p.data)}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs"
                    >
                      <Sparkles className="w-3 h-3 mr-1 text-violet-400" />
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {stats && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                {statCards.map((s) => (
                  <Card
                    key={s.label}
                    className="bg-slate-900/80 border-slate-700/60"
                  >
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                      <p className={cn("font-bold text-lg truncate", s.color)}>
                        {s.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyStats}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy Stats
                </Button>
              </div>

              {/* Charts */}
              <Card className="bg-slate-900/80 border-slate-700/60 mb-8">
                <CardContent className="pt-6">
                  <Tabs defaultValue="histogram">
                    <TabsList className="bg-slate-800 border border-slate-700 mb-4">
                      <TabsTrigger value="histogram">Histogram</TabsTrigger>
                      <TabsTrigger value="cdf">Cumulative Distribution</TabsTrigger>
                      <TabsTrigger value="dot">Dot Plot</TabsTrigger>
                    </TabsList>

                    <TabsContent value="histogram">
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={histogram}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                              dataKey="range"
                              tick={{ fill: "#94a3b8", fontSize: 11 }}
                              angle={-30}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #475569",
                                borderRadius: "8px",
                                color: "#e2e8f0",
                              }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {histogram.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={`hsl(${250 + i * 8}, 70%, 55%)`}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>

                    <TabsContent value="cdf">
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={cdf}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                              dataKey="value"
                              tick={{ fill: "#94a3b8", fontSize: 12 }}
                              label={{
                                value: "Value",
                                fill: "#94a3b8",
                                position: "insideBottom",
                                offset: -5,
                              }}
                            />
                            <YAxis
                              tick={{ fill: "#94a3b8", fontSize: 12 }}
                              label={{
                                value: "Cumulative %",
                                fill: "#94a3b8",
                                angle: -90,
                                position: "insideLeft",
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #475569",
                                borderRadius: "8px",
                                color: "#e2e8f0",
                              }}
                              formatter={(value: number) => [
                                `${value.toFixed(1)}%`,
                                "Cumulative",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="cumulative"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              dot={{ fill: "#8b5cf6", r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>

                    <TabsContent value="dot">
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                              dataKey="x"
                              type="number"
                              tick={{ fill: "#94a3b8", fontSize: 12 }}
                              label={{
                                value: "Value",
                                fill: "#94a3b8",
                                position: "insideBottom",
                                offset: -5,
                              }}
                            />
                            <YAxis
                              dataKey="y"
                              type="number"
                              tick={{ fill: "#94a3b8", fontSize: 12 }}
                              label={{
                                value: "Frequency",
                                fill: "#94a3b8",
                                angle: -90,
                                position: "insideLeft",
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #475569",
                                borderRadius: "8px",
                                color: "#e2e8f0",
                              }}
                              formatter={(value: number, name: string) => [
                                value,
                                name === "x" ? "Value" : "Count",
                              ]}
                            />
                            <Scatter data={dotPlot} fill="#a78bfa">
                              {dotPlot.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill="#a78bfa"
                                />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Insights */}
              <Card className="bg-slate-900/80 border-slate-700/60 mb-8">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Skewness */}
                  <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <p className="text-slate-300 font-medium text-sm mb-1">
                      Skewness: {fmt(stats.skewness)}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {Math.abs(stats.skewness) < 0.5
                        ? "Your data is approximately symmetric (bell-shaped). The mean and median are close together."
                        : stats.skewness > 0
                        ? "Your data is right-skewed (positively skewed). A few high values pull the mean above the median. The median may be a better measure of center."
                        : "Your data is left-skewed (negatively skewed). A few low values pull the mean below the median. The median may be a better measure of center."}
                    </p>
                  </div>

                  {/* Coefficient of Variation */}
                  <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <p className="text-slate-300 font-medium text-sm mb-1">
                      Coefficient of Variation: {fmt(stats.cv)}%
                    </p>
                    <p className="text-slate-400 text-sm">
                      {stats.cv < 15
                        ? "Low variability. Your data points are tightly clustered around the mean."
                        : stats.cv < 30
                        ? "Moderate variability. There is a reasonable spread in your data."
                        : "High variability. Your data is widely spread out. Consider whether this indicates diverse subgroups."}
                    </p>
                  </div>

                  {/* Outliers */}
                  <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      {stats.outliers.length > 0 && (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <p className="text-slate-300 font-medium text-sm">
                        Outliers (IQR method):{" "}
                        {stats.outliers.length === 0
                          ? "None detected"
                          : stats.outliers.join(", ")}
                      </p>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Values below {fmt(stats.lowerFence)} or above{" "}
                      {fmt(stats.upperFence)} are considered outliers.
                      {stats.outliers.length > 0
                        ? ` Found ${stats.outliers.length} outlier${stats.outliers.length > 1 ? "s" : ""}. These may be data entry errors or genuinely extreme values worth investigating.`
                        : " All values fall within the expected range."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Tips */}
          <Card className="bg-slate-900/80 border-slate-700/60">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-violet-400" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-slate-400 text-sm leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-violet-400 font-bold mt-0.5">1.</span>
                  <span>
                    <strong className="text-slate-200">Mean vs Median:</strong>{" "}
                    The mean (average) is sensitive to extreme values. The median is the middle value and is more robust. If your data is skewed, the median gives a better picture of the "typical" value. For example, average income is misleading because billionaires pull it up — median income is more useful.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-400 font-bold mt-0.5">2.</span>
                  <span>
                    <strong className="text-slate-200">
                      What Standard Deviation tells you:
                    </strong>{" "}
                    Standard deviation measures how spread out your data is. A small std dev means most values are close to the mean. A large std dev means wide variation. In a bell curve, about 68% of data falls within 1 std dev of the mean, and 95% within 2 std devs.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-400 font-bold mt-0.5">3.</span>
                  <span>
                    <strong className="text-slate-200">
                      How to spot outliers:
                    </strong>{" "}
                    The IQR (Interquartile Range) method flags values below Q1 - 1.5*IQR or above Q3 + 1.5*IQR. These are not necessarily errors — they could be legitimately extreme values. Always investigate outliers rather than automatically removing them.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-400 font-bold mt-0.5">4.</span>
                  <span>
                    <strong className="text-slate-200">
                      Reading a histogram:
                    </strong>{" "}
                    A histogram shows how often values fall into specific ranges (bins). A bell shape means normally distributed data. Two peaks (bimodal) might mean you have two distinct groups mixed together.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-400 font-bold mt-0.5">5.</span>
                  <span>
                    <strong className="text-slate-200">
                      All computation is local:
                    </strong>{" "}
                    Your data never leaves your browser. Everything is calculated in real-time on your device — no server calls, no data stored.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
