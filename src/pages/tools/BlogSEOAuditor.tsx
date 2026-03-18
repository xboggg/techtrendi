import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Search,
  Copy,
  Check,
  Loader2,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface SEOCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  note: string;
}

interface Recommendation {
  priority: "high" | "medium" | "low";
  text: string;
}

interface AuditResult {
  overallScore: number;
  verdict: string;
  checks: SEOCheck[];
  recommendations: Recommendation[];
}

export default function BlogSEOAuditor() {
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("");
  const [wordCount, setWordCount] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [imageCount, setImageCount] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusIcons = {
    pass: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    warn: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    fail: <XCircle className="h-5 w-5 text-red-500" />,
  };

  const statusColors = {
    pass: "bg-green-500/10 border-green-500/20 text-green-400",
    warn: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    fail: "bg-red-500/10 border-red-500/20 text-red-400",
  };

  const priorityColors: Record<string, string> = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-green-500";
    if (score >= 60) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  const runAudit = async () => {
    if (!title.trim()) {
      toast.error("Please enter an article title");
      return;
    }
    if (!keyword.trim()) {
      toast.error("Please enter a target keyword");
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const response = await fetch(GROQ_API_URL, {
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
                "You are an expert SEO auditor for blog content. Analyze the provided article metadata and return a detailed audit. Return JSON only, no markdown fences.",
            },
            {
              role: "user",
              content: `Audit this blog post for SEO:

- Article Title: ${title}
- Target Keyword: ${keyword}
- Estimated Word Count: ${wordCount || "Not provided"}
- Article Excerpt (first 150 words): ${excerpt || "Not provided"}
- Meta Description: ${metaDescription || "Not provided"}
- Number of Images: ${imageCount || "Not provided"}

Return ONLY valid JSON:
{
  "overallScore": 75,
  "verdict": "one-line summary of SEO health",
  "checks": [
    {
      "name": "Title Optimization",
      "status": "pass",
      "note": "explanation"
    },
    {
      "name": "Keyword Placement",
      "status": "warn",
      "note": "explanation"
    },
    {
      "name": "Content Length",
      "status": "pass",
      "note": "explanation"
    },
    {
      "name": "Meta Description",
      "status": "fail",
      "note": "explanation"
    },
    {
      "name": "Intro Hook",
      "status": "pass",
      "note": "explanation"
    },
    {
      "name": "Internal Linking Potential",
      "status": "warn",
      "note": "explanation"
    },
    {
      "name": "Image Optimization",
      "status": "pass",
      "note": "explanation"
    },
    {
      "name": "Readability",
      "status": "pass",
      "note": "explanation"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "text": "specific actionable recommendation"
    }
  ]
}

Provide exactly 8 checks with status "pass", "warn", or "fail". Provide 4-6 prioritized recommendations (high/medium/low). Be specific and actionable. Score 0-100 based on the checks.`,
            },
          ],
          temperature: 0.6,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
      const parsed: AuditResult = JSON.parse(cleaned);
      setResult(parsed);
    } catch {
      toast.error("Failed to run audit. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyResult = () => {
    if (!result) return;

    let text = `SEO AUDIT REPORT\nScore: ${result.overallScore}/100\nVerdict: ${result.verdict}\n\n`;
    text += `CHECKS:\n`;
    result.checks.forEach((c) => {
      text += `[${c.status.toUpperCase()}] ${c.name}: ${c.note}\n`;
    });
    text += `\nRECOMMENDATIONS:\n`;
    result.recommendations.forEach((r) => {
      text += `[${r.priority.toUpperCase()}] ${r.text}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Audit report copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const circumference = 2 * Math.PI * 45;

  return (
    <Layout>
      <SEOHead
        title="AI Blog SEO Auditor | TechTrendi"
        description="Audit your blog post for SEO. Get a score, check title optimization, keyword placement, readability, meta descriptions, and get prioritized recommendations."
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Search className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Blog SEO Auditor
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Check your blog post's SEO health before publishing. Get an instant
            score, detailed checks, and actionable recommendations.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-6 border-indigo-200 dark:border-indigo-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-indigo-700 dark:text-indigo-400">
              <BarChart3 className="h-5 w-5" />
              Article Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Article Title</Label>
                <Input
                  placeholder="e.g., 10 Best Productivity Apps for 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Target Keyword</Label>
                <Input
                  placeholder="e.g., best productivity apps"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Estimated Word Count</Label>
                <Input
                  type="number"
                  placeholder="e.g., 1500"
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Number of Images</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={imageCount}
                  onChange={(e) => setImageCount(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Article Excerpt (first 150 words)</Label>
              <Textarea
                placeholder="Paste the opening paragraph or first 150 words of your article..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>Meta Description</Label>
              <Textarea
                placeholder="The meta description for search engines (ideally 150-160 characters)..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <Button
              onClick={runAudit}
              disabled={generating || !title.trim() || !keyword.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running SEO Audit...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Run SEO Audit
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <>
            {/* Score + Copy */}
            <Card className="mb-6 border-indigo-200 dark:border-indigo-900">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Score Circle */}
                  <div className="relative w-32 h-32 shrink-0">
                    <svg
                      className="w-32 h-32 -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-gray-200 dark:text-gray-800"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={
                          circumference -
                          (result.overallScore / 100) * circumference
                        }
                        className={getScoreRingColor(result.overallScore)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className={cn(
                          "text-3xl font-bold",
                          getScoreColor(result.overallScore)
                        )}
                      >
                        {result.overallScore}
                      </span>
                      <span className="text-xs text-gray-500">/100</span>
                    </div>
                  </div>

                  {/* Verdict */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      SEO Score
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {result.verdict}
                    </p>
                    <div className="flex items-center gap-4 mt-3 justify-center md:justify-start">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {result.checks.filter((c) => c.status === "pass").length}{" "}
                        Pass
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        {result.checks.filter((c) => c.status === "warn").length}{" "}
                        Warn
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <XCircle className="h-3 w-3 text-red-500" />
                        {result.checks.filter((c) => c.status === "fail").length}{" "}
                        Fail
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyResult}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied ? "Copied" : "Copy Report"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Checks Grid */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                SEO Checks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.checks.map((check, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-3 rounded-lg p-4 border",
                      check.status === "pass" &&
                        "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900",
                      check.status === "warn" &&
                        "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900",
                      check.status === "fail" &&
                        "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      {statusIcons[check.status]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {check.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                        {check.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <Card className="mb-6 border-indigo-200 dark:border-indigo-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-indigo-700 dark:text-indigo-400">
                  <Lightbulb className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Badge
                        className={cn(
                          "shrink-0 text-xs border mt-0.5",
                          priorityColors[rec.priority]
                        )}
                      >
                        {rec.priority}
                      </Badge>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {rec.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {/* Tips Section */}
        <Card className="border-indigo-200 dark:border-indigo-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              SEO Tips for Beginners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">1.</span>
                <span>
                  <strong>What is SEO?</strong> Search Engine Optimization is
                  the practice of making your content easier for Google to find
                  and rank. When your article follows SEO best practices, it
                  appears higher in search results, bringing more readers to
                  your blog for free.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">2.</span>
                <span>
                  <strong>Why keywords matter.</strong> Keywords are the words
                  people type into Google. If your article naturally includes
                  the keyword in the title, first paragraph, headings, and meta
                  description, Google knows your article is relevant and ranks
                  it higher.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">3.</span>
                <span>
                  <strong>The 80/20 of blog SEO.</strong> Focus on these 4
                  things and you'll cover 80% of SEO: (1) keyword in title, (2)
                  compelling meta description under 160 chars, (3) article over
                  1000 words, and (4) at least 2-3 images with alt text. The
                  rest is bonus.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">4.</span>
                <span>
                  <strong>Your title is your first impression.</strong> Keep it
                  under 60 characters so Google doesn't cut it off. Include
                  your target keyword near the beginning. Numbers and power
                  words ("Best", "Ultimate", "Easy") increase click-through
                  rates.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">5.</span>
                <span>
                  <strong>Write for humans first, search engines second.</strong>{" "}
                  Google's algorithms now prioritize content that genuinely
                  helps readers. Focus on answering the reader's question
                  clearly and completely -- that's the best SEO strategy of
                  all.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
