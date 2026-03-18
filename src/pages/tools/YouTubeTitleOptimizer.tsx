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
import { Loader2, Copy, Check, Youtube, Image, Sparkles } from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface TitleItem {
  title: string;
  style: string;
  ctr_potential: string;
  why: string;
}

interface OptimizerResult {
  titles: TitleItem[];
  thumbnail_suggestions: string;
}

const niches = [
  "Tech",
  "Finance",
  "Productivity",
  "Business",
  "AI",
  "Education",
  "Health",
  "Travel",
];

const audiences = [
  "Beginners",
  "Intermediate",
  "Professionals",
  "General",
  "Entrepreneurs",
  "Students",
];

function getCTRBadge(ctr: string) {
  const lower = ctr.toLowerCase();
  if (lower.includes("hot") || lower.includes("high") || lower.includes("90"))
    return { label: "Hot", className: "bg-red-600 text-white" };
  if (lower.includes("good") || lower.includes("strong") || lower.includes("7"))
    return { label: "Good", className: "bg-green-600 text-white" };
  return { label: "Decent", className: "bg-yellow-600 text-white" };
}

function parseJSON(raw: string): OptimizerResult | null {
  try {
    const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```/g, "");
    return JSON.parse(cleaned.trim());
  } catch {
    return null;
  }
}

export default function YouTubeTitleOptimizer() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizerResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const canSubmit = topic.trim().length >= 10 && niche && audience;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);

    const prompt = `You are a YouTube title optimization expert who understands CTR, algorithm ranking, and viewer psychology. Generate 10 optimized YouTube video titles.

Video Topic: ${topic}
Niche: ${niche}
Target Audience: ${audience}
${currentTitle ? `Current Title (to improve): ${currentTitle}` : ""}

Return ONLY valid JSON with this exact structure:
{
  "titles": [
    {
      "title": "<optimized title, max 70 chars>",
      "style": "<style tag e.g. Curiosity Gap, How-To, Listicle, Shock Value, Authority, Challenge, Story, Contrarian, FOMO, Direct>",
      "ctr_potential": "<Hot / Good / Decent>",
      "why": "<1 sentence explaining why this title works>"
    }
  ],
  "thumbnail_suggestions": "<3-4 sentences with specific thumbnail text overlay ideas, color schemes, and visual concepts that pair well with these titles>"
}

Generate exactly 10 titles ranked from highest to lowest CTR potential. Use proven YouTube title formulas: numbers, power words, curiosity gaps, brackets, emotional triggers. Keep titles under 70 characters. Make them specific to the ${niche} niche and ${audience} audience.`;

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
        err instanceof Error ? err.message : "Failed to generate titles"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(title: string, index: number) {
    navigator.clipboard.writeText(title);
    setCopiedIndex(index);
    toast.success("Title copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <Layout>
      <SEOHead
        title="YouTube Title Optimizer | TechTrendi"
        description="Generate high-CTR YouTube video titles with AI. Get 10 optimized title options with style tags and thumbnail suggestions."
      />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Youtube className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold">YouTube Title Optimizer</h1>
          </div>
          <p className="text-muted-foreground">
            Generate click-worthy YouTube titles optimized for CTR and the
            algorithm.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Video Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="topic">
                Video Topic{" "}
                <span className="text-muted-foreground text-xs">
                  (min 10 chars)
                </span>
              </Label>
              <Textarea
                id="topic"
                placeholder="Describe what your video is about in detail..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {topic.length} characters
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Niche</Label>
                <Select value={niche} onValueChange={setNiche}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select niche" />
                  </SelectTrigger>
                  <SelectContent>
                    {niches.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {audiences.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="currentTitle">
                Current Title{" "}
                <span className="text-muted-foreground text-xs">
                  (optional - we'll improve it)
                </span>
              </Label>
              <input
                id="currentTitle"
                type="text"
                placeholder="e.g. How to Build an AI App"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!canSubmit || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Titles...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate 10 Titles
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4">
            {/* Title Cards */}
            <h2 className="text-xl font-semibold">
              Optimized Titles
            </h2>

            <div className="space-y-3">
              {result.titles.map((item, i) => {
                const ctrBadge = getCTRBadge(item.ctr_potential);
                return (
                  <Card
                    key={i}
                    className="group hover:border-primary/50 transition-colors"
                  >
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-7 h-7 rounded-full bg-muted text-muted-foreground text-sm font-bold flex items-center justify-center">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm sm:text-base">
                              {item.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleCopy(item.title, i)}
                            >
                              {copiedIndex === i ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge className={ctrBadge.className}>
                              {ctrBadge.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.style}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.title.length} chars
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {item.why}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Thumbnail Suggestions */}
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="h-5 w-5 text-red-500" />
                  Thumbnail Text & Design Ideas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">
                  {result.thumbnail_suggestions}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
