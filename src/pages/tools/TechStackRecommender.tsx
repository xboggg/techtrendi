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
import {
  Loader2,
  Copy,
  Check,
  Layers,
  Server,
  Database,
  Cloud,
  Plug,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface StackResult {
  frontend: string;
  backend: string;
  database: string;
  hosting: string;
  integrations: string;
  why_this_stack: string;
  alternatives: string;
}

const teamSizes = [
  { value: "solo", label: "Solo Developer" },
  { value: "small", label: "Small (2-5)" },
  { value: "medium", label: "Medium (6-15)" },
  { value: "large", label: "Large (16+)" },
];

const projectScales = [
  { value: "mvp", label: "MVP / Prototype" },
  { value: "startup", label: "Startup / Early Stage" },
  { value: "growth", label: "Growth / Scaling" },
  { value: "enterprise", label: "Enterprise" },
];

const platforms = [
  { value: "web", label: "Web App" },
  { value: "mobile", label: "Mobile App" },
  { value: "both", label: "Web + Mobile" },
  { value: "api", label: "API / Backend Only" },
];

const budgets = [
  { value: "free", label: "Free / Open Source Only" },
  { value: "low", label: "Low Budget ($0-50/mo)" },
  { value: "mid", label: "Mid Budget ($50-500/mo)" },
  { value: "premium", label: "Premium (No Limit)" },
];

const sectionConfig: {
  key: keyof StackResult;
  label: string;
  icon: typeof Layers;
  color: string;
}[] = [
  { key: "frontend", label: "Frontend", icon: Layers, color: "text-blue-500" },
  { key: "backend", label: "Backend", icon: Server, color: "text-green-500" },
  {
    key: "database",
    label: "Database",
    icon: Database,
    color: "text-purple-500",
  },
  { key: "hosting", label: "Hosting", icon: Cloud, color: "text-orange-500" },
  {
    key: "integrations",
    label: "Integrations",
    icon: Plug,
    color: "text-pink-500",
  },
  {
    key: "why_this_stack",
    label: "Why This Stack",
    icon: Lightbulb,
    color: "text-yellow-500",
  },
  {
    key: "alternatives",
    label: "Alternatives",
    icon: RefreshCw,
    color: "text-cyan-500",
  },
];

function parseJSON(raw: string): StackResult | null {
  try {
    const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```/g, "");
    return JSON.parse(cleaned.trim());
  } catch {
    return null;
  }
}

export default function TechStackRecommender() {
  const [description, setDescription] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [scale, setScale] = useState("");
  const [platform, setPlatform] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StackResult | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit =
    description.trim().length >= 20 && teamSize && scale && platform && budget;

  async function handleAnalyze() {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);

    const prompt = `You are an expert software architect. Based on the following project details, recommend a complete tech stack.

Project Description: ${description}
Team Size: ${teamSize}
Project Scale: ${scale}
Platform: ${platform}
Budget Priority: ${budget}

Return ONLY valid JSON with these exact keys (all values are strings with your recommendations):
{
  "frontend": "recommended frontend tech with brief reasoning",
  "backend": "recommended backend tech with brief reasoning",
  "database": "recommended database(s) with brief reasoning",
  "hosting": "recommended hosting/deployment with brief reasoning",
  "integrations": "key tools, services, CI/CD, monitoring to integrate",
  "why_this_stack": "2-3 sentences on why this combination is ideal for this project",
  "alternatives": "alternative stack options if the primary doesn't fit"
}

Be specific with version numbers and tool names. Consider the team size and budget constraints.`;

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
        err instanceof Error ? err.message : "Failed to get recommendation"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    const text = sectionConfig
      .map((s) => `## ${s.label}\n${result[s.key]}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Stack recommendation copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Layout>
      <SEOHead
        title="AI Tech Stack Recommender | TechTrendi"
        description="Get AI-powered tech stack recommendations for your project based on team size, scale, platform, and budget."
      />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            AI Tech Stack Recommender
          </h1>
          <p className="text-muted-foreground">
            Describe your project and get a tailored technology stack
            recommendation powered by AI.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">
                Project Description{" "}
                <span className="text-muted-foreground text-xs">
                  (min 20 chars)
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what you're building, key features, target users, and any specific requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {description.length} characters
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Team Size</Label>
                <Select value={teamSize} onValueChange={setTeamSize}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamSizes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Project Scale</Label>
                <Select value={scale} onValueChange={setScale}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select project scale" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectScales.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Budget Priority</Label>
                <Select value={budget} onValueChange={setBudget}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  Analyzing Project...
                </>
              ) : (
                "Get Stack Recommendation"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Recommended Stack
              </h2>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-1 h-4 w-4" />
                ) : (
                  <Copy className="mr-1 h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy All"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionConfig.map((section) => {
                const Icon = section.icon;
                return (
                  <Card
                    key={section.key}
                    className={
                      section.key === "why_this_stack" ||
                      section.key === "alternatives"
                        ? "md:col-span-2"
                        : ""
                    }
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${section.color}`} />
                        {section.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {result[section.key]}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
