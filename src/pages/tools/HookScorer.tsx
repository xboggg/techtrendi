import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Target, Loader2, Sparkles, Lightbulb, Zap, Eye, Heart,
  RefreshCw, Copy, Check,
} from "lucide-react";

const contentTypes = [
  { id: "social", label: "Social Post" },
  { id: "youtube", label: "YouTube" },
  { id: "email", label: "Email" },
  { id: "blog", label: "Blog" },
  { id: "ad", label: "Ad" },
];

interface HookResult {
  overall_score: number;
  curiosity_score: number;
  emotion_score: number;
  clarity_score: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  rewrite: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

export default function HookScorer() {
  const [hook, setHook] = useState("");
  const [contentType, setContentType] = useState("social");
  const [result, setResult] = useState<HookResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedRewrite, setCopiedRewrite] = useState(false);

  const scoreHook = async () => {
    if (!hook.trim()) {
      toast.error("Please enter a hook to score");
      return;
    }

    setGenerating(true);
    setResult(null);

    const typeLabel = contentTypes.find((t) => t.id === contentType)?.label || contentType;

    const prompt = `You are an expert copywriter and content strategist. Score the following hook/opening line for a ${typeLabel}.

Hook: "${hook.trim()}"

Analyze it and return a JSON object with these exact keys:
- overall_score: number 0-100
- curiosity_score: number 0-100 (does it make people want to know more?)
- emotion_score: number 0-100 (does it trigger an emotional response?)
- clarity_score: number 0-100 (is it clear and easy to understand?)
- verdict: string (exactly 5 words summarizing the hook quality)
- strengths: array of 2-3 strings listing what works well
- weaknesses: array of 2-3 strings listing what could improve
- rewrite: string (a better version of the hook)

Be honest and critical. A score of 80+ should be genuinely excellent. Return ONLY valid JSON, no markdown, no code fences, no extra text.`;

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
              content: "You are a copywriting expert. Always respond with valid JSON only. No markdown, no explanation.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
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

      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed: HookResult = JSON.parse(cleaned);

      setResult(parsed);
      toast.success("Hook scored!");
    } catch (err: any) {
      console.error("Hook scoring error:", err);
      toast.error(err.message || "Failed to score hook. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-green-500/20 to-green-500/5";
    if (score >= 60) return "from-yellow-500/20 to-yellow-500/5";
    if (score >= 40) return "from-orange-500/20 to-orange-500/5";
    return "from-red-500/20 to-red-500/5";
  };

  const copyRewrite = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.rewrite);
    setCopiedRewrite(true);
    toast.success("Rewrite copied!");
    setTimeout(() => setCopiedRewrite(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="AI Hook Scorer | TechTrendi"
        description="Score your hooks and opening lines with AI. Get curiosity, emotion, and clarity sub-scores plus a rewrite suggestion."
        canonical="/tools/hook-scorer"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-zinc-800 text-zinc-200 dark:bg-zinc-700 dark:text-zinc-300">
            AI-Powered Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Hook <span className="text-primary">Scorer</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Test your opening lines before publishing. Get an AI score, sub-metrics, and a rewrite suggestion.
          </p>
        </div>

        {/* Content Type Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {contentTypes.map((type) => (
            <Button
              key={type.id}
              variant={contentType === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setContentType(type.id)}
              className={cn(
                "rounded-full",
                contentType !== type.id && "border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
              )}
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* Input */}
        <Card className="mb-8 bg-zinc-950/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="space-y-3">
              <Label className="text-zinc-300">Your hook / opening line</Label>
              <Textarea
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="Type your hook here... e.g., 'Most people waste 3 hours a day on this one thing and don't even know it.'"
                className="min-h-[120px] resize-y bg-zinc-900/50 border-zinc-700 text-foreground"
              />
            </div>
            <Button
              onClick={scoreHook}
              size="lg"
              className="w-full mt-4"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Hook...
                </>
              ) : result ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Re-Score
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 mr-2" />
                  Score My Hook
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {generating && (
          <div className="space-y-6 animate-pulse">
            <div className="h-40 bg-zinc-900 rounded-xl" />
            <div className="grid md:grid-cols-3 gap-4">
              <div className="h-28 bg-zinc-900 rounded-xl" />
              <div className="h-28 bg-zinc-900 rounded-xl" />
              <div className="h-28 bg-zinc-900 rounded-xl" />
            </div>
          </div>
        )}

        {result && !generating && (
          <div className="space-y-6">
            {/* Big Score + Verdict */}
            <Card className={cn("bg-gradient-to-br border-zinc-800", getScoreBg(result.overall_score))}>
              <CardContent className="p-8 text-center">
                <p className={cn("text-7xl md:text-8xl font-black tabular-nums", getScoreColor(result.overall_score))}>
                  {result.overall_score}
                </p>
                <p className="text-sm text-zinc-400 mt-1">out of 100</p>
                <p className="text-lg font-semibold text-foreground mt-3">
                  {result.verdict}
                </p>
              </CardContent>
            </Card>

            {/* Sub-Score Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-zinc-950/50 border-zinc-800">
                <CardContent className="p-5 text-center">
                  <Eye className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                  <p className={cn("text-3xl font-bold tabular-nums", getScoreColor(result.curiosity_score))}>
                    {result.curiosity_score}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wide">Curiosity</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-950/50 border-zinc-800">
                <CardContent className="p-5 text-center">
                  <Heart className="w-5 h-5 mx-auto mb-2 text-pink-400" />
                  <p className={cn("text-3xl font-bold tabular-nums", getScoreColor(result.emotion_score))}>
                    {result.emotion_score}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wide">Emotion</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-950/50 border-zinc-800">
                <CardContent className="p-5 text-center">
                  <Zap className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                  <p className={cn("text-3xl font-bold tabular-nums", getScoreColor(result.clarity_score))}>
                    {result.clarity_score}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wide">Clarity</p>
                </CardContent>
              </Card>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-zinc-950/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm text-green-400">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5 shrink-0">+</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-zinc-950/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm text-red-400">Weaknesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5 shrink-0">-</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Rewrite Suggestion */}
            <Card className="bg-zinc-950/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Suggested Rewrite
                </CardTitle>
                <Button variant="outline" size="sm" onClick={copyRewrite} className="border-zinc-700">
                  {copiedRewrite ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-base leading-relaxed italic">
                  "{result.rewrite}"
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tips Section */}
        <Card className="mt-12 bg-zinc-950/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">1.</span>
                <span>
                  A <strong className="text-zinc-300">hook</strong> is the very first line your audience reads or hears. It determines whether they keep scrolling or stop and engage. On social media, you have roughly 1-2 seconds to capture attention.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">2.</span>
                <span>
                  <strong className="text-zinc-300">First lines matter more than anything else.</strong> Research shows 80% of people read headlines but only 20% read the body. Your hook is the gateway to all other content.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">3.</span>
                <span>
                  The <strong className="text-zinc-300">curiosity gap</strong> technique works by hinting at valuable information without revealing it. Phrases like "Most people don't know..." or "Here's what nobody tells you about..." create an itch the reader must scratch.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">4.</span>
                <span>
                  Great hooks combine <strong className="text-zinc-300">specificity</strong> (use numbers and concrete details) with <strong className="text-zinc-300">emotion</strong> (surprise, fear, excitement). "5 mistakes that cost me $10,000" beats "Common mistakes people make."
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
