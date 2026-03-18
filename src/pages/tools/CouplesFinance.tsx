import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Heart, Users, CheckCircle2, AlertTriangle, Lightbulb, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    id: "spending",
    category: "Spending",
    question: "When you get extra money, what do you do first?",
    options: [
      "Save or invest it immediately",
      "Pay off debt or bills",
      "Treat myself to something nice",
      "Spend it on experiences (travel, dining)",
    ],
  },
  {
    id: "risk",
    category: "Risk",
    question: "How do you feel about investing in stocks or crypto?",
    options: [
      "Love it -- high risk, high reward",
      "Comfortable with moderate risk",
      "Prefer safe options like savings accounts",
      "Too risky -- I avoid it entirely",
    ],
  },
  {
    id: "lifestyle",
    category: "Lifestyle",
    question: "What's your ideal lifestyle spending level?",
    options: [
      "Minimalist -- spend as little as possible",
      "Comfortable -- spend reasonably, save the rest",
      "Generous -- enjoy life now, save some",
      "Luxury -- life is short, enjoy the best",
    ],
  },
  {
    id: "emergencies",
    category: "Emergencies",
    question: "How many months of expenses do you keep as emergency savings?",
    options: [
      "6+ months -- always prepared",
      "3-6 months -- reasonably covered",
      "1-2 months -- working on it",
      "None -- I'll figure it out when it happens",
    ],
  },
  {
    id: "debt",
    category: "Debt",
    question: "How do you feel about borrowing money?",
    options: [
      "Never borrow -- if I can't afford it, I wait",
      "Only for major purchases (house, education)",
      "Sometimes use credit cards for convenience",
      "Comfortable with debt -- it's a tool",
    ],
  },
  {
    id: "transparency",
    category: "Transparency",
    question: "How much should partners share about their finances?",
    options: [
      "Full transparency -- joint accounts, shared everything",
      "Mostly open -- shared account + personal spending money",
      "Independent -- split bills but keep finances separate",
      "Private -- each person handles their own money",
    ],
  },
  {
    id: "goals",
    category: "Goals",
    question: "What's your top financial goal for the next 5 years?",
    options: [
      "Buy a home or property",
      "Build a business or side income",
      "Travel and experiences",
      "Retire early or achieve financial freedom",
    ],
  },
  {
    id: "conflict",
    category: "Conflict",
    question: "How should couples handle a big financial disagreement?",
    options: [
      "Compromise -- meet in the middle",
      "The more financially savvy partner decides",
      "Set a spending threshold -- discuss above it",
      "Take turns making big decisions",
    ],
  },
];

export default function CouplesFinance() {
  const [partner1Answers, setPartner1Answers] = useState<Record<string, number>>({});
  const [partner2Answers, setPartner2Answers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const allAnswered =
    Object.keys(partner1Answers).length === QUESTIONS.length &&
    Object.keys(partner2Answers).length === QUESTIONS.length;

  const results = useMemo(() => {
    if (!allAnswered) return null;

    let matches = 0;
    const categoryResults: {
      category: string;
      match: boolean;
      p1Answer: string;
      p2Answer: string;
    }[] = [];

    QUESTIONS.forEach((q) => {
      const p1 = partner1Answers[q.id];
      const p2 = partner2Answers[q.id];
      const isMatch = p1 === p2;
      if (isMatch) matches++;
      categoryResults.push({
        category: q.category,
        match: isMatch,
        p1Answer: q.options[p1],
        p2Answer: q.options[p2],
      });
    });

    const score = Math.round((matches / QUESTIONS.length) * 100);

    const aligned = categoryResults.filter((r) => r.match);
    const conflicts = categoryResults.filter((r) => !r.match);

    const chartData = categoryResults.map((r) => ({
      category: r.category,
      score: r.match ? 100 : 25,
    }));

    return { score, aligned, conflicts, chartData, categoryResults };
  }, [partner1Answers, partner2Answers, allAnswered]);

  const handleCalculate = () => {
    if (!allAnswered) {
      toast.error("Both partners must answer all 8 questions before seeing results.");
      return;
    }
    setShowResults(true);
  };

  const handleReset = () => {
    setPartner1Answers({});
    setPartner2Answers({});
    setShowResults(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 88) return "Excellent Match";
    if (score >= 75) return "Strong Compatibility";
    if (score >= 50) return "Some Differences";
    if (score >= 25) return "Significant Gaps";
    return "Very Different Views";
  };

  return (
    <Layout>
      <SEOHead
        title="Couples Financial Compatibility Quiz | TechTrendi Tools"
        description="Take our couples financial compatibility quiz to discover how aligned you and your partner are on money matters."
      />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">
            Couples Financial Compatibility Quiz
          </h1>
          <p className="mt-2 text-muted-foreground">
            Both partners answer independently -- discover where you align and where you differ
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Questions */}
            <div className="space-y-6">
              {QUESTIONS.map((q, qi) => (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <Badge variant="outline" className="mr-2">
                        {qi + 1}/{QUESTIONS.length}
                      </Badge>
                      {q.category}: {q.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Partner 1 */}
                      <div>
                        <Label className="mb-2 flex items-center gap-1 text-sm font-semibold text-pink-600 dark:text-pink-400">
                          <Heart className="h-4 w-4" /> Partner 1
                        </Label>
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => (
                            <button
                              key={oi}
                              onClick={() =>
                                setPartner1Answers((prev) => ({ ...prev, [q.id]: oi }))
                              }
                              className={cn(
                                "w-full rounded-lg border p-3 text-left text-sm transition-colors",
                                partner1Answers[q.id] === oi
                                  ? "border-pink-500 bg-pink-50 text-pink-900 dark:bg-pink-950/40 dark:text-pink-200"
                                  : "hover:bg-muted"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Partner 2 */}
                      <div>
                        <Label className="mb-2 flex items-center gap-1 text-sm font-semibold text-purple-600 dark:text-purple-400">
                          <Users className="h-4 w-4" /> Partner 2
                        </Label>
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => (
                            <button
                              key={oi}
                              onClick={() =>
                                setPartner2Answers((prev) => ({ ...prev, [q.id]: oi }))
                              }
                              className={cn(
                                "w-full rounded-lg border p-3 text-left text-sm transition-colors",
                                partner2Answers[q.id] === oi
                                  ? "border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200"
                                  : "hover:bg-muted"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <Button size="lg" onClick={handleCalculate} disabled={!allAnswered}>
                <Heart className="mr-2 h-4 w-4" /> See Compatibility
              </Button>
              <Button variant="outline" size="lg" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>

            {!allAnswered && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                {Object.keys(partner1Answers).length}/8 Partner 1 &middot;{" "}
                {Object.keys(partner2Answers).length}/8 Partner 2
              </p>
            )}
          </>
        ) : results ? (
          <>
            {/* Score card */}
            <Card className="mb-8 border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <Heart className="h-10 w-10 text-pink-500" />
                <p className={cn("text-6xl font-bold", getScoreColor(results.score))}>
                  {results.score}%
                </p>
                <Badge
                  variant="secondary"
                  className="text-base"
                >
                  {getScoreLabel(results.score)}
                </Badge>
                <p className="text-muted-foreground">
                  You matched on {results.aligned.length} of {QUESTIONS.length} categories
                </p>
              </CardContent>
            </Card>

            {/* Category chart */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Compatibility by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="category" width={100} />
                      <Tooltip formatter={(value: number) => [`${value}%`, "Match"]} />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {results.chartData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.score === 100 ? "#ec4899" : "#d1d5db"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Aligned areas */}
            {results.aligned.length > 0 && (
              <Card className="mb-6 border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" /> Aligned Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.aligned.map((a) => (
                    <div key={a.category} className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                      <p className="font-medium">{a.category}</p>
                      <p className="text-sm text-muted-foreground">Both said: {a.p1Answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Conflict areas */}
            {results.conflicts.length > 0 && (
              <Card className="mb-6 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" /> Areas to Discuss
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.conflicts.map((c) => (
                    <div key={c.category} className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                      <p className="font-medium">{c.category}</p>
                      <div className="mt-1 grid gap-1 text-sm md:grid-cols-2">
                        <p>
                          <span className="font-medium text-pink-600 dark:text-pink-400">P1:</span>{" "}
                          {c.p1Answer}
                        </p>
                        <p>
                          <span className="font-medium text-purple-600 dark:text-purple-400">P2:</span>{" "}
                          {c.p2Answer}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="mb-8 flex justify-center">
              <Button variant="outline" size="lg" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" /> Take Quiz Again
              </Button>
            </div>
          </>
        ) : null}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" /> Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <strong>Financial compatibility matters:</strong> Studies show that money disagreements
                are the #1 predictor of divorce. Understanding each other's money mindset early prevents
                surprises later.
              </li>
              <li>
                <strong>Discussing disagreements:</strong> Differences aren't dealbreakers. Use conflict
                areas as conversation starters. Schedule a monthly "money date" to talk openly about
                finances without judgment.
              </li>
              <li>
                <strong>Joint vs separate accounts:</strong> Many successful couples use a hybrid
                approach: one joint account for shared expenses and individual accounts for personal
                spending. There's no single right answer.
              </li>
              <li>
                <strong>Align on big goals:</strong> You don't need to agree on everything, but alignment
                on major goals (buying a house, saving for kids' education, retirement age) is crucial
                for long-term harmony.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
