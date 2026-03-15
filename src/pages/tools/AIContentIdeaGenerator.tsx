import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Lightbulb, Copy, RefreshCw, Sparkles, TrendingUp,
  Check, Loader2, Clipboard
} from "lucide-react";

const platforms = [
  { id: "blog", label: "Blog" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "Twitter/X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "podcast", label: "Podcast" },
];

const contentGoals = [
  { id: "educate", label: "Educate" },
  { id: "entertain", label: "Entertain" },
  { id: "inspire", label: "Inspire" },
  { id: "sell", label: "Sell" },
  { id: "engage", label: "Engage" },
];

interface ContentIdea {
  title: string;
  description: string;
  engagement: "High" | "Medium" | "Low";
  format: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

export default function AIContentIdeaGenerator() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("blog");
  const [goal, setGoal] = useState("educate");
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generateIdeas = async () => {
    if (!niche.trim()) {
      toast.error("Please enter a niche or topic");
      return;
    }

    setGenerating(true);
    setIdeas([]);

    const platformLabel = platforms.find(p => p.id === platform)?.label || platform;
    const goalLabel = contentGoals.find(g => g.id === goal)?.label || goal;

    const prompt = `You are a content strategy expert. Generate exactly 10 unique content ideas for the following:

Niche/Topic: ${niche.trim()}
Platform: ${platformLabel}
Content Goal: ${goalLabel}

For each idea, provide:
- title: A catchy, specific content title
- description: A brief 1-2 sentence description of what the content covers and why it would resonate
- engagement: Estimated engagement level — "High", "Medium", or "Low"
- format: Suggested content format (e.g., "Tutorial Video", "Carousel Post", "Thread", "Long-form Article", "Short Reel", "Interview Episode", etc.)

Return ONLY valid JSON — an array of 10 objects with keys: title, description, engagement, format. No markdown, no code fences, no extra text.`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: "You are a content strategist. Always respond with valid JSON arrays only. No markdown, no explanation." },
            { role: "user", content: prompt },
          ],
          temperature: 0.9,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) throw new Error("Empty response from AI");

      // Parse JSON — strip code fences if present
      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed: ContentIdea[] = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid response format");
      }

      // Normalize engagement values
      const normalized = parsed.map((idea) => ({
        title: idea.title || "Untitled Idea",
        description: idea.description || "",
        engagement: (["High", "Medium", "Low"].includes(idea.engagement) ? idea.engagement : "Medium") as "High" | "Medium" | "Low",
        format: idea.format || "General",
      }));

      setIdeas(normalized);
      toast.success(`Generated ${normalized.length} content ideas!`);
    } catch (err: any) {
      console.error("Content idea generation error:", err);
      toast.error(err.message || "Failed to generate ideas. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyIdea = (index: number) => {
    const idea = ideas[index];
    const text = `${idea.title}\n${idea.description}\nFormat: ${idea.format} | Engagement: ${idea.engagement}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Idea copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    const text = ideas
      .map(
        (idea, i) =>
          `${i + 1}. ${idea.title}\n   ${idea.description}\n   Format: ${idea.format} | Engagement: ${idea.engagement}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success("All ideas copied!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const engagementColor = (level: string) => {
    switch (level) {
      case "High":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Low":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Layout>
      <SEOHead
        title="AI Content Idea Generator | TechTrendi"
        description="Generate creative content ideas for blogs, YouTube, TikTok, Instagram, and more. Powered by AI to help creators never run out of ideas."
        canonicalUrl="https://techtrendi.com/tools/ai-content-idea-generator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            AI-Powered Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Content Idea <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Never run out of content ideas. Get AI-generated suggestions tailored to your niche, platform, and goals.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Content Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Niche / Topic *</Label>
                  <Input
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g., Personal Finance, Fitness, AI Technology, Cooking"
                    onKeyDown={(e) => e.key === "Enter" && generateIdeas()}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Content Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentGoals.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button onClick={generateIdeas} size="lg" className="w-full" disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Ideas...
                </>
              ) : ideas.length > 0 ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Generate More
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Ideas
                </>
              )}
            </Button>

            {ideas.length > 0 && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={copyAll}
              >
                {copiedAll ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    Copied All!
                  </>
                ) : (
                  <>
                    <Clipboard className="w-5 h-5 mr-2" />
                    Copy All Ideas
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            {generating ? (
              // Loading skeleton
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="flex gap-2">
                        <div className="h-5 bg-muted rounded w-16" />
                        <div className="h-5 bg-muted rounded w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : ideas.length > 0 ? (
              <div className="space-y-4">
                {ideas.map((idea, index) => (
                  <Card
                    key={index}
                    className="group hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground text-sm font-medium mt-0.5 shrink-0">
                              {index + 1}.
                            </span>
                            <h3 className="font-semibold text-sm leading-tight">
                              {idea.title}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground pl-5">
                            {idea.description}
                          </p>
                          <div className="flex items-center gap-2 pl-5 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={cn("text-xs", engagementColor(idea.engagement))}
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {idea.engagement}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {idea.format}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyIdea(index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="min-h-[500px]">
                <CardContent className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                  <Lightbulb className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-medium">Your content ideas will appear here</p>
                  <p className="text-sm mt-1">Enter your niche and hit generate</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
