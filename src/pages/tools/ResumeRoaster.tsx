import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Flame, Target, Eye, Bot, BarChart3, Wrench } from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface RoastResult {
  scores: {
    overall: number;
    impact: number;
    clarity: number;
    ats_score: number;
    experience_depth: number;
  };
  roast: string;
  fixes: { issue: string; fix: string }[];
}

const intensities = [
  {
    value: "gentle",
    label: "Gentle",
    emoji: "~",
    color: "bg-green-600",
    desc: "Constructive & encouraging",
  },
  {
    value: "honest",
    label: "Honest",
    emoji: "!",
    color: "bg-yellow-600",
    desc: "Straight talk, no fluff",
  },
  {
    value: "brutal",
    label: "Brutal",
    emoji: "!!!",
    color: "bg-red-600",
    desc: "No mercy, full roast",
  },
];

const scoreConfig: {
  key: keyof RoastResult["scores"];
  label: string;
  icon: typeof BarChart3;
  color: string;
}[] = [
  { key: "overall", label: "Overall", icon: BarChart3, color: "text-blue-500" },
  { key: "impact", label: "Impact", icon: Target, color: "text-green-500" },
  { key: "clarity", label: "Clarity", icon: Eye, color: "text-purple-500" },
  { key: "ats_score", label: "ATS Score", icon: Bot, color: "text-orange-500" },
  {
    key: "experience_depth",
    label: "Experience Depth",
    icon: BarChart3,
    color: "text-cyan-500",
  },
];

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-green-500/10 border-green-500/30";
  if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
  if (score >= 40) return "bg-orange-500/10 border-orange-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function parseJSON(raw: string): RoastResult | null {
  try {
    const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```/g, "");
    return JSON.parse(cleaned.trim());
  } catch {
    return null;
  }
}

export default function ResumeRoaster() {
  const [intensity, setIntensity] = useState("honest");
  const [resume, setResume] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoastResult | null>(null);

  const canSubmit = resume.trim().length >= 50;

  async function handleRoast() {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);

    const intensityLabel = intensities.find((i) => i.value === intensity)?.label;

    const prompt = `You are a ${intensityLabel?.toLowerCase()} resume reviewer and career coach. Analyze this resume${targetRole ? ` for the target role of "${targetRole}"` : ""}.

Roast intensity: ${intensityLabel} (${intensity === "gentle" ? "be encouraging but point out issues" : intensity === "honest" ? "be direct and practical" : "be brutally honest, use humor, hold nothing back"})

Resume content:
"""
${resume}
"""

Return ONLY valid JSON with this exact structure:
{
  "scores": {
    "overall": <number 0-100>,
    "impact": <number 0-100>,
    "clarity": <number 0-100>,
    "ats_score": <number 0-100>,
    "experience_depth": <number 0-100>
  },
  "roast": "<2-3 paragraphs roasting/reviewing the resume at the chosen intensity level>",
  "fixes": [
    { "issue": "<specific problem>", "fix": "<actionable fix>" },
    { "issue": "<specific problem>", "fix": "<actionable fix>" },
    { "issue": "<specific problem>", "fix": "<actionable fix>" },
    { "issue": "<specific problem>", "fix": "<actionable fix>" },
    { "issue": "<specific problem>", "fix": "<actionable fix>" }
  ]
}

Be specific to the actual resume content. The fixes should be prioritized from most to least impactful.`;

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
        err instanceof Error ? err.message : "Failed to roast resume"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <SEOHead
        title="Resume Roaster & Rewrite Coach | TechTrendi"
        description="Get your resume roasted by AI with honest feedback, ATS scoring, and actionable fixes to land more interviews."
      />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Resume Roaster & Rewrite Coach
          </h1>
          <p className="text-muted-foreground">
            Paste your resume and choose your roast intensity. Get scored,
            roasted, and fixed.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Roast Intensity</Label>
              <div className="flex flex-wrap gap-2">
                {intensities.map((i) => (
                  <Button
                    key={i.value}
                    variant={intensity === i.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIntensity(i.value)}
                    className={intensity === i.value ? i.color : ""}
                  >
                    <span className="mr-1">{i.emoji}</span> {i.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {intensities.find((i) => i.value === intensity)?.desc}
              </p>
            </div>

            <div>
              <Label htmlFor="resume">
                Resume Content{" "}
                <span className="text-muted-foreground text-xs">
                  (min 50 chars)
                </span>
              </Label>
              <Textarea
                id="resume"
                placeholder="Paste your resume text here... Include your summary, experience, skills, education, etc."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                rows={10}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {resume.length} characters
              </p>
            </div>

            <div>
              <Label htmlFor="targetRole">
                Target Role{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <input
                id="targetRole"
                type="text"
                placeholder="e.g. Senior Frontend Developer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button
              onClick={handleRoast}
              disabled={!canSubmit || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Roasting Your Resume...
                </>
              ) : (
                <>
                  <Flame className="mr-2 h-4 w-4" />
                  Roast My Resume
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4">
            {/* Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {scoreConfig.map((s) => {
                const score = result.scores[s.key];
                const Icon = s.icon;
                return (
                  <Card
                    key={s.key}
                    className={`border ${getScoreBg(score)}`}
                  >
                    <CardContent className="pt-4 pb-3 text-center">
                      <Icon
                        className={`h-5 w-5 mx-auto mb-1 ${s.color}`}
                      />
                      <p
                        className={`text-2xl font-bold ${getScoreColor(score)}`}
                      >
                        {score}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.label}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Roast Box */}
            <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  The Roast
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs border-orange-500/50 text-orange-600"
                  >
                    {intensities.find((i) => i.value === intensity)?.label}{" "}
                    Mode
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm whitespace-pre-line leading-relaxed">
                  {result.roast}
                </div>
              </CardContent>
            </Card>

            {/* Fix-It Action Plan */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-500" />
                  Fix-It Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.fixes.map((fix, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          {fix.issue}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {fix.fix}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
