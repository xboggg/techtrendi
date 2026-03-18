import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Lightbulb, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface ValidationResult {
  verdict: "BUILD IT" | "MAYBE" | "PASS";
  verdict_summary: string;
  scores: {
    market_size: number;
    competition: number;
    technical_complexity: number;
    monetization: number;
    timing: number;
  };
  report: string;
}

const targetMarkets = [
  { value: "ghana-westafrica", label: "Ghana / West Africa" },
  { value: "pan-africa", label: "Pan-Africa" },
  { value: "global", label: "Global" },
  { value: "usa", label: "USA" },
  { value: "europe", label: "Europe" },
  { value: "developing-markets", label: "Developing Markets" },
];

const stages = [
  { value: "idea", label: "Just an idea" },
  { value: "research", label: "Done research" },
  { value: "prototype", label: "Have prototype" },
];

const scoreLabels: { key: keyof ValidationResult["scores"]; label: string }[] = [
  { key: "market_size", label: "Market Size" },
  { key: "competition", label: "Competition" },
  { key: "technical_complexity", label: "Technical Complexity" },
  { key: "monetization", label: "Monetization" },
  { key: "timing", label: "Timing" },
];

function getScoreColor(score: number) {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case "BUILD IT":
      return "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "MAYBE":
      return "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "PASS":
      return "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "";
  }
}

export default function AppIdeaValidator() {
  const [idea, setIdea] = useState("");
  const [market, setMarket] = useState("");
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    if (!idea.trim()) {
      toast.error("Please describe your app idea.");
      return;
    }
    if (!market) {
      toast.error("Please select a target market.");
      return;
    }
    if (!stage) {
      toast.error("Please select your current stage.");
      return;
    }
    if (!GROQ_API_KEY) {
      toast.error("Groq API key not configured.");
      return;
    }

    setLoading(true);
    setResult(null);

    const marketLabel = targetMarkets.find((m) => m.value === market)?.label;
    const stageLabel = stages.find((s) => s.value === stage)?.label;

    const prompt = `You are a startup advisor and product strategist. Validate this app idea and return ONLY valid JSON (no markdown, no code fences).

App Idea: ${idea}
Target Market: ${marketLabel}
Stage: ${stageLabel}

Return this exact JSON structure:
{
  "verdict": "BUILD IT" or "MAYBE" or "PASS",
  "verdict_summary": "One sentence summary of your verdict",
  "scores": {
    "market_size": 0-100,
    "competition": 0-100 (higher = less competitive = better),
    "technical_complexity": 0-100 (higher = more feasible = better),
    "monetization": 0-100,
    "timing": 0-100
  },
  "report": "A detailed 5-section analysis covering: 1) Market Opportunity, 2) Competitive Landscape, 3) Technical Feasibility, 4) Monetization Strategy, 5) Recommendations. Use newlines between sections. Be specific to the target market."
}`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No valid JSON in response");

      const parsed: ValidationResult = JSON.parse(jsonMatch[0]);

      if (!parsed.verdict || !parsed.scores || !parsed.report) {
        throw new Error("Incomplete response from AI");
      }

      setResult(parsed);
      toast.success("Validation complete!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const avgScore = result
    ? Math.round(
        Object.values(result.scores).reduce((a, b) => a + b, 0) / 5
      )
    : 0;

  return (
    <Layout>
      <SEOHead
        title="App Idea Validator | TechTrendi"
        description="Validate your app or startup idea with AI-powered analysis. Get scores on market size, competition, monetization and more."
      />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 dark:bg-purple-900/30">
            <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              AI-Powered Validation
            </span>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">App Idea Validator</h1>
          <p className="mt-2 text-muted-foreground">
            Describe your app idea and get an AI-powered feasibility analysis
            with scores and a detailed report.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Describe Your Idea
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="idea">App / Product Idea</Label>
              <Textarea
                id="idea"
                placeholder="e.g. A mobile app that connects local farmers in Ghana directly with restaurants, cutting out middlemen. Features include real-time pricing, delivery coordination, and quality ratings..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="mt-1 min-h-[120px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Target Market</Label>
                <Select value={market} onValueChange={setMarket}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetMarkets.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Your Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleValidate}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing your idea...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Validate My Idea
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Verdict Box */}
            <Card
              className={cn(
                "border-2",
                getVerdictStyle(result.verdict)
              )}
            >
              <CardContent className="py-6 text-center">
                <div className="text-4xl font-extrabold tracking-tight">
                  {result.verdict}
                </div>
                <p className="mt-2 text-lg">{result.verdict_summary}</p>
                <Badge variant="outline" className="mt-3">
                  Overall Score: {avgScore}/100
                </Badge>
              </CardContent>
            </Card>

            {/* Score Bars */}
            <Card>
              <CardHeader>
                <CardTitle>Scores Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scoreLabels.map(({ key, label }) => {
                  const score = result.scores[key];
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{label}</span>
                        <span className="tabular-nums font-semibold">
                          {score}/100
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            getScoreColor(score)
                          )}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Full Report */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {result.report}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
