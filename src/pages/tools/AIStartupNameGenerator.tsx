import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Rocket, Copy, RefreshCw, Heart, Sparkles, Globe, Loader2, Check,
} from "lucide-react";

const industries = [
  "Tech",
  "Health",
  "Finance",
  "Education",
  "Food",
  "Fashion",
  "Travel",
  "Gaming",
  "SaaS",
  "E-commerce",
  "Other",
];

const nameStyles = [
  { value: "modern", label: "Modern / Techy" },
  { value: "classic", label: "Classic / Professional" },
  { value: "fun", label: "Fun / Playful" },
  { value: "abstract", label: "Abstract" },
  { value: "compound", label: "Compound Word" },
  { value: "acronym", label: "Acronym" },
];

interface GeneratedName {
  name: string;
  tagline: string;
  reasoning: string;
  domains: { ext: string; hint: string }[];
  saved: boolean;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

export default function AIStartupNameGenerator() {
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [style, setStyle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const callGroq = async () => {
    const styleLabel = nameStyles.find((s) => s.value === style)?.label || "any style";
    const industryLabel = industry || "general";

    const prompt = `You are a creative startup naming expert. Generate exactly 10 unique startup/business name suggestions based on the following:

Business idea: ${description}
Industry: ${industryLabel}
Name style: ${styleLabel}

For each name, provide:
1. The startup name (short, memorable, brandable)
2. A catchy tagline (one short sentence)
3. Brief reasoning why this name works (1-2 sentences)
4. Domain availability hints for .com, .io, and .ai extensions (say "Likely available", "Possibly taken", or "Likely taken" based on how common/generic the word is)

Respond ONLY with valid JSON in this exact format, no markdown:
[
  {
    "name": "ExampleName",
    "tagline": "A catchy tagline here",
    "reasoning": "Why this name works",
    "domains": [
      {"ext": ".com", "hint": "Likely available"},
      {"ext": ".io", "hint": "Possibly taken"},
      {"ext": ".ai", "hint": "Likely available"}
    ]
  }
]`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a startup naming expert. Always respond with valid JSON only, no markdown fences." },
          { role: "user", content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty response from AI");

    // Strip markdown fences if present
    const jsonStr = content.replace(/^```json?\s*/, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) throw new Error("Invalid response format");

    return parsed.map((item: any) => ({
      name: item.name || "Unnamed",
      tagline: item.tagline || "",
      reasoning: item.reasoning || "",
      domains: Array.isArray(item.domains)
        ? item.domains.map((d: any) => ({ ext: d.ext || ".com", hint: d.hint || "Unknown" }))
        : [
            { ext: ".com", hint: "Unknown" },
            { ext: ".io", hint: "Unknown" },
            { ext: ".ai", hint: "Unknown" },
          ],
      saved: false,
    })) as GeneratedName[];
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please describe your startup idea");
      return;
    }

    setIsGenerating(true);

    try {
      const names = await callGroq();
      setGeneratedNames(names);
      toast.success(`Generated ${names.length} startup name ideas!`);
    } catch (err: any) {
      console.error("Name generation error:", err);
      toast.error(err.message || "Failed to generate names. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);

    try {
      const names = await callGroq();
      setGeneratedNames((prev) => {
        // Keep saved names from previous batch, add new ones
        const saved = prev.filter((n) => n.saved);
        return [...saved, ...names];
      });
      toast.success("Fresh batch of names generated!");
    } catch (err: any) {
      console.error("Name generation error:", err);
      toast.error(err.message || "Failed to generate names. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedName(name);
    toast.success("Name copied to clipboard!");
    setTimeout(() => setCopiedName(null), 2000);
  };

  const toggleSave = (name: string) => {
    setGeneratedNames((prev) =>
      prev.map((n) => (n.name === name ? { ...n, saved: !n.saved } : n))
    );
  };

  const savedNames = generatedNames.filter((n) => n.saved);

  const getDomainBadgeColor = (hint: string) => {
    if (hint.toLowerCase().includes("likely available"))
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (hint.toLowerCase().includes("possibly"))
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  };

  return (
    <Layout>
      <SEOHead
        title="AI Startup Name Generator | TechTrendi"
        description="Generate creative AI-powered startup and business names. Get instant name ideas with taglines, reasoning, and domain availability hints."
        canonicalUrl="https://techtrendi.com/tools/ai-startup-name-generator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Startup Name <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Describe your startup idea and let AI craft the perfect name. Get 10 unique suggestions
            with taglines, domain hints, and reasoning.
          </p>
        </div>

        {/* Generator Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Describe Your Startup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Business Idea / Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., An AI-powered platform that helps small businesses automate their social media marketing and content creation..."
                className="mt-1 min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The more detail you provide, the better the name suggestions
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {nameStyles.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Names...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Names
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {generatedNames.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Generated Names ({generatedNames.filter((n) => !n.saved).length} new
                {savedNames.length > 0 && `, ${savedNames.length} saved`})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateMore}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Generate More
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {generatedNames.map((item) => (
                <Card
                  key={item.name}
                  className={cn(
                    "transition-all hover:shadow-md",
                    item.saved && "ring-2 ring-primary/50 bg-primary/5"
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-foreground">{item.name}</h3>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleSave(item.name)}
                        >
                          <Heart
                            className={cn(
                              "w-4 h-4",
                              item.saved && "fill-red-500 text-red-500"
                            )}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyName(item.name)}
                        >
                          {copiedName === item.name ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-primary italic mb-2">
                      "{item.tagline}"
                    </p>

                    <p className="text-sm text-muted-foreground mb-3">{item.reasoning}</p>

                    <div className="flex flex-wrap gap-2">
                      {item.domains.map((d) => (
                        <div key={d.ext} className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <Badge
                            className={cn(
                              "text-xs font-normal",
                              getDomainBadgeColor(d.hint)
                            )}
                          >
                            {item.name.toLowerCase().replace(/[^a-z0-9]/g, "")}{d.ext} — {d.hint}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Saved Names Sidebar */}
            {savedNames.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    Your Favorites ({savedNames.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {savedNames.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20"
                      >
                        <span className="font-semibold">{item.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyName(item.name)}
                        >
                          {copiedName === item.name ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tips Section */}
        {generatedNames.length === 0 && !isGenerating && (
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Rocket className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Be Specific</h3>
                <p className="text-sm text-muted-foreground">
                  Describe your product, target audience, and what makes it unique for better results.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Try Different Styles</h3>
                <p className="text-sm text-muted-foreground">
                  Experiment with different name styles to explore creative directions you hadn't considered.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Globe className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Check Domains</h3>
                <p className="text-sm text-muted-foreground">
                  Domain hints are AI estimates. Always verify availability on a domain registrar before committing.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
