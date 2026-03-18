import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Trophy, BarChart3, Target, RotateCcw, Download, ListChecks
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ResponsiveContainer, Tooltip
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Option {
  id: string;
  name: string;
}

interface Criterion {
  id: string;
  name: string;
  weight: number;
}

// scores[optionId][criterionId] = score (1-10)
type Scores = Record<string, Record<string, number>>;

const COLORS = [
  "#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#ef4444", "#3b82f6", "#84cc16",
];

const defaultOptions: Option[] = [
  { id: "o1", name: "Option A" },
  { id: "o2", name: "Option B" },
  { id: "o3", name: "Option C" },
];

const defaultCriteria: Criterion[] = [
  { id: "c1", name: "Cost", weight: 8 },
  { id: "c2", name: "Quality", weight: 9 },
  { id: "c3", name: "Speed", weight: 6 },
  { id: "c4", name: "Ease of Use", weight: 7 },
];

function buildDefaultScores(options: Option[], criteria: Criterion[]): Scores {
  const scores: Scores = {};
  for (const o of options) {
    scores[o.id] = {};
    for (const c of criteria) {
      scores[o.id][c.id] = 5;
    }
  }
  return scores;
}

export default function DecisionMatrix() {
  const [options, setOptions] = useState<Option[]>(defaultOptions);
  const [criteria, setCriteria] = useState<Criterion[]>(defaultCriteria);
  const [scores, setScores] = useState<Scores>(() =>
    buildDefaultScores(defaultOptions, defaultCriteria)
  );

  // --- Helpers ---

  const setScore = (optionId: string, criterionId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [optionId]: { ...prev[optionId], [criterionId]: Math.min(10, Math.max(1, value)) },
    }));
  };

  const addOption = () => {
    const id = `o${Date.now()}`;
    const name = `Option ${String.fromCharCode(65 + options.length)}`;
    setOptions((prev) => [...prev, { id, name }]);
    setScores((prev) => {
      const row: Record<string, number> = {};
      for (const c of criteria) row[c.id] = 5;
      return { ...prev, [id]: row };
    });
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      toast.error("You need at least 2 options.");
      return;
    }
    setOptions((prev) => prev.filter((o) => o.id !== id));
    setScores((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const renameOption = (id: string, name: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, name } : o)));
  };

  const addCriterion = () => {
    const id = `c${Date.now()}`;
    setCriteria((prev) => [...prev, { id, name: "New Criterion", weight: 5 }]);
    setScores((prev) => {
      const next: Scores = {};
      for (const oId of Object.keys(prev)) {
        next[oId] = { ...prev[oId], [id]: 5 };
      }
      return next;
    });
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 2) {
      toast.error("You need at least 2 criteria.");
      return;
    }
    setCriteria((prev) => prev.filter((c) => c.id !== id));
    setScores((prev) => {
      const next: Scores = {};
      for (const oId of Object.keys(prev)) {
        const row = { ...prev[oId] };
        delete row[id];
        next[oId] = row;
      }
      return next;
    });
  };

  const updateCriterion = (id: string, field: "name" | "weight", value: string | number) => {
    setCriteria((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (field === "weight") return { ...c, weight: Math.min(10, Math.max(1, Number(value))) };
        return { ...c, [field]: value };
      })
    );
  };

  const resetAll = () => {
    setOptions(defaultOptions);
    setCriteria(defaultCriteria);
    setScores(buildDefaultScores(defaultOptions, defaultCriteria));
    toast.success("Reset to defaults.");
  };

  // --- Calculations ---

  const results = useMemo(() => {
    const maxPossible = criteria.reduce((sum, c) => sum + c.weight * 10, 0);
    const ranked = options
      .map((o) => {
        const weightedTotal = criteria.reduce((sum, c) => {
          const s = scores[o.id]?.[c.id] ?? 5;
          return sum + s * c.weight;
        }, 0);
        return { ...o, weightedTotal, pct: maxPossible > 0 ? (weightedTotal / maxPossible) * 100 : 0 };
      })
      .sort((a, b) => b.weightedTotal - a.weightedTotal);
    return ranked;
  }, [options, criteria, scores]);

  const radarData = useMemo(() => {
    return criteria.map((c) => {
      const point: Record<string, string | number> = { criterion: c.name };
      for (const o of options) {
        point[o.name] = scores[o.id]?.[c.id] ?? 5;
      }
      return point;
    });
  }, [options, criteria, scores]);

  // --- Export CSV ---

  const exportCSV = () => {
    const header = ["Option", ...criteria.map((c) => `${c.name} (w${c.weight})`), "Weighted Total"];
    const rows = results.map((r) => [
      r.name,
      ...criteria.map((c) => String(scores[r.id]?.[c.id] ?? 5)),
      String(r.weightedTotal),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "decision-matrix.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  };

  return (
    <Layout>
      <SEOHead
        title="Decision Matrix Tool - Compare Options Objectively | TechTrendi"
        description="Use our free decision matrix tool to compare options across weighted criteria. Visualize results with a radar chart and find the best choice objectively."
        canonicalUrl="https://techtrendi.com/tools/decision-matrix"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Decision <span className="text-primary">Matrix</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Compare options across weighted criteria and find the best choice with data, not gut feelings.
          </p>
        </div>

        {/* Top controls */}
        <div className="flex flex-wrap gap-3 mb-8 justify-end">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Options + Criteria */}
          <div className="lg:col-span-1 space-y-6">
            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListChecks className="w-5 h-5 text-primary" />
                  Options
                </CardTitle>
                <CardDescription>Add the choices you want to compare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {options.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <Input
                      value={o.name}
                      onChange={(e) => renameOption(o.id, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => removeOption(o.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </CardContent>
            </Card>

            {/* Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-primary" />
                  Criteria
                </CardTitle>
                <CardDescription>Define what matters and how much (weight 1-10)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {criteria.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                    <Input
                      value={c.name}
                      onChange={(e) => updateCriterion(c.id, "name", e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">W:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={c.weight}
                        onChange={(e) => updateCriterion(c.id, "weight", e.target.value)}
                        className="w-16 text-center"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0"
                      onClick={() => removeCriterion(c.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addCriterion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Criterion
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Scoring Matrix + Results + Radar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scoring Matrix */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Scoring Matrix
                </CardTitle>
                <CardDescription>Rate each option on each criterion (1-10)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2 font-medium text-muted-foreground whitespace-nowrap">
                          Option
                        </th>
                        {criteria.map((c) => (
                          <th key={c.id} className="p-2 text-center font-medium text-muted-foreground whitespace-nowrap">
                            {c.name}
                            <span className="block text-xs text-muted-foreground/60">w{c.weight}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {options.map((o, i) => (
                        <tr key={o.id} className="border-t border-border">
                          <td className="p-2 font-medium whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                              />
                              {o.name}
                            </div>
                          </td>
                          {criteria.map((c) => (
                            <td key={c.id} className="p-2 text-center">
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={scores[o.id]?.[c.id] ?? 5}
                                onChange={(e) =>
                                  setScore(o.id, c.id, parseInt(e.target.value) || 1)
                                }
                                className="w-16 mx-auto text-center"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="border-2 border-primary/30 shadow-elevated">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Results
                </CardTitle>
                <CardDescription>Options ranked by weighted total score</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {results.map((r, idx) => {
                  const optIdx = options.findIndex((o) => o.id === r.id);
                  const color = COLORS[optIdx % COLORS.length];
                  const isWinner = idx === 0;
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        isWinner
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-muted/50 border-border"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-semibold text-foreground">{r.name}</span>
                          {isWinner && (
                            <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                              Winner
                            </Badge>
                          )}
                        </div>
                        <span className="font-bold text-foreground text-lg">{r.weightedTotal}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${r.pct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {r.pct.toFixed(1)}%
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Radar Comparison
                </CardTitle>
                <CardDescription>Visual comparison across all criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[350px] md:h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="criterion"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 10]}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      />
                      {options.map((o, i) => (
                        <Radar
                          key={o.id}
                          name={o.name}
                          dataKey={o.name}
                          stroke={COLORS[i % COLORS.length]}
                          fill={COLORS[i % COLORS.length]}
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What is a decision matrix?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                A decision matrix (also called a weighted scoring model) is a tool for evaluating and
                comparing multiple options against a set of criteria. Each criterion gets a weight
                reflecting its importance, and each option is scored on every criterion. The weighted
                totals reveal the objectively best choice.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How do weights work?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Weights (1-10) indicate how important each criterion is. A criterion with weight 10
                has twice the impact of one with weight 5. The final score is the sum of each
                criterion's score multiplied by its weight.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">When should I use a decision matrix?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Use it for any decision with multiple options and criteria: choosing software, hiring
                candidates, selecting vendors, picking a new phone, or even deciding where to live.
                It removes bias and makes trade-offs visible.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Can I export my results?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Yes! Click the "Export CSV" button to download your decision matrix as a CSV file
                that you can open in Excel, Google Sheets, or any spreadsheet application.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
