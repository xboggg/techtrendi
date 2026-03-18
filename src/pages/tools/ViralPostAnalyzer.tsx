import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  TrendingUp,
  Share2,
  Eye,
  MessageCircle,
  Flame,
  Target,
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface AnalysisResult {
  overall_score: number;
  verdict: string;
  metrics: {
    hook_strength: number;
    emotional_pull: number;
    shareability: number;
    clarity: number;
    controversy_index: number;
    cta_strength: number;
  };
  strengths: string[];
  weaknesses: string[];
  rewrite_tip: string;
  predicted_reach: string;
}

const platformOptions = [
  { value: "twitter", label: "X / Twitter", maxChars: 280 },
  { value: "linkedin", label: "LinkedIn", maxChars: 3000 },
  { value: "instagram", label: "Instagram", maxChars: 2200 },
  { value: "facebook", label: "Facebook", maxChars: 5000 },
  { value: "tiktok", label: "TikTok", maxChars: 2200 },
];

const metricConfig: {
  key: keyof AnalysisResult["metrics"];
  label: string;
  icon: typeof TrendingUp;
}[] = [
  { key: "hook_strength", label: "Hook Strength", icon: Target },
  { key: "emotional_pull", label: "Emotional Pull", icon: Flame },
  { key: "shareability", label: "Shareability", icon: Share2 },
  { key: "clarity", label: "Clarity", icon: Eye },
  { key: "controversy_index", label: "Controversy Index", icon: MessageCircle },
  { key: "cta_strength", label: "CTA Strength", icon: TrendingUp },
];

function getScoreColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreBadge(score: number) {
  if (score >= 80)
    return { label: "Viral Potential", variant: "default" as const, className: "bg-green-600" };
  if (score >= 60)
    return { label: "Solid Post", variant: "default" as const, className: "bg-yellow-600" };
  if (score >= 40)
    return { label: "Needs Work", variant: "default" as const, className: "bg-orange-600" };
  return { label: "Rethink This", variant: "destructive" as const, className: "" };
}

function parseJSON(raw: string): AnalysisResult | null {
  try {
    const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```/g, "");
    return JSON.parse(cleaned.trim());
  } catch {
    return null;
  }
}

export default function ViralPostAnalyzer() {
  const [platform, setPlatform] = useState("twitter");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const selectedPlatform = platformOptions.find((p) => p.value === platform)!;
  const canSubmit = content.trim().length >= 10;

  async function handleAnalyze() {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);

    const prompt = `You are an expert social media strategist and viral content analyst. Analyze this ${selectedPlatform.label} post for viral potential.

Post content:
"""
${content}
"""

Return ONLY valid JSON with this exact structure:
{
  "overall_score": <number 0-100>,
  "verdict": "<one-line verdict about the post's viral potential>",
  "metrics": {
    "hook_strength": <number 0-100>,
    "emotional_pull": <number 0-100>,
    "shareability": <number 0-100>,
    "clarity": <number 0-100>,
    "controversy_index": <number 0-100>,
    "cta_strength": <number 0-100>
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "rewrite_tip": "<specific actionable tip to improve this post>",
  "predicted_reach": "<estimated reach multiplier or engagement prediction>"
}

Be honest and specific. Consider ${selectedPlatform.label}'s algorithm and audience behavior.`;

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
          max_tokens: 1200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const parsed = parseJSON(text);

      if (!parsed) throw new Error("Could not parse AI response");

      setResult(parsed);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to analyze post"
      );
    } finally {
      setLoading(false);
    }
  }

  const scoreBadge = result ? getScoreBadge(result.overall_score) : null;

  return (
    <Layout>
      <SEOHead
        title="Viral Post Analyzer | TechTrendi"
        description="Analyze your social media posts for viral potential with AI-powered scoring and actionable feedback."
      />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Viral Post Analyzer</h1>
          <p className="text-muted-foreground">
            Paste your post and get an AI-powered virality score with detailed
            feedback.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Platform</Label>
              <div className="flex flex-wrap gap-2">
                {platformOptions.map((p) => (
                  <Button
                    key={p.value}
                    variant={platform === p.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlatform(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="content">Post Content</Label>
              <Textarea
                id="content"
                placeholder="Paste your post content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="mt-1"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Min 10 characters
                </p>
                <p
                  className={`text-xs ${
                    content.length > selectedPlatform.maxChars
                      ? "text-red-500 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {content.length} / {selectedPlatform.maxChars}
                </p>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!canSubmit || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Viral Potential...
                </>
              ) : (
                "Analyze Post"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4">
            {/* Score Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <div
                      className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-bold ${getScoreColor(result.overall_score)}`}
                    >
                      {result.overall_score}
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-1">
                      / 100
                    </p>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    {scoreBadge && (
                      <Badge
                        variant={scoreBadge.variant}
                        className={`mb-2 ${scoreBadge.className}`}
                      >
                        {scoreBadge.label}
                      </Badge>
                    )}
                    <p className="text-lg font-medium">{result.verdict}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Predicted Reach: {result.predicted_reach}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detailed Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metricConfig.map((m) => {
                  const score = result.metrics[m.key];
                  const Icon = m.icon;
                  return (
                    <div key={m.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {m.label}
                        </div>
                        <span className="text-sm font-medium">{score}/100</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getScoreColor(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-green-600">
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-green-500 shrink-0">+</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-red-600">
                    Weaknesses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-red-500 shrink-0">-</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Rewrite Tip */}
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rewrite Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.rewrite_tip}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
