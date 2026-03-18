import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sparkles, Copy, Check, Wand2, Loader2, Zap, Code2, Pen, Image, BarChart3,
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

type Mode = "general" | "coding" | "writing" | "image" | "analysis";

interface ModeConfig {
  id: Mode;
  label: string;
  icon: typeof Zap;
  color: string;
  activeColor: string;
  systemPrompt: string;
  examples: string[];
}

const modes: ModeConfig[] = [
  {
    id: "general",
    label: "General",
    icon: Zap,
    color: "text-blue-500",
    activeColor: "bg-blue-600 text-white border-blue-600",
    systemPrompt:
      "You are an expert prompt engineer. Take the user's prompt and improve it to be more specific, well-structured, and effective. Add clarity, context, constraints, and formatting guidance. Make it detailed enough to get high-quality results from any AI. Output ONLY the improved prompt — no explanations, no labels, no meta-commentary.",
    examples: [
      "Help me write an email to my boss",
      "Explain quantum computing",
      "Create a meal plan for the week",
      "Help me prepare for a job interview",
    ],
  },
  {
    id: "coding",
    label: "Coding",
    icon: Code2,
    color: "text-green-500",
    activeColor: "bg-green-600 text-white border-green-600",
    systemPrompt:
      "You are an expert prompt engineer specializing in coding prompts. Take the user's prompt and improve it by adding specifics about programming language, framework, error handling, edge cases, code style preferences, and expected input/output formats. Include instructions for comments, type safety, and best practices. Output ONLY the improved prompt — no explanations, no labels, no meta-commentary.",
    examples: [
      "Write a function to sort an array",
      "Build a REST API for a todo app",
      "Fix this React component that re-renders too much",
      "Create a database schema for an e-commerce site",
    ],
  },
  {
    id: "writing",
    label: "Writing",
    icon: Pen,
    color: "text-purple-500",
    activeColor: "bg-purple-600 text-white border-purple-600",
    systemPrompt:
      "You are an expert prompt engineer specializing in writing prompts. Take the user's prompt and improve it by specifying the target audience, desired tone, length, style, structure, and purpose. Add instructions about voice, perspective, formatting, and any rhetorical techniques to use. Output ONLY the improved prompt — no explanations, no labels, no meta-commentary.",
    examples: [
      "Write a blog post about productivity",
      "Draft a LinkedIn post about my new job",
      "Create a short story about a robot",
      "Write marketing copy for a fitness app",
    ],
  },
  {
    id: "image",
    label: "Image Gen",
    icon: Image,
    color: "text-pink-500",
    activeColor: "bg-pink-600 text-white border-pink-600",
    systemPrompt:
      "You are an expert prompt engineer specializing in AI image generation prompts (Midjourney, DALL-E, Stable Diffusion). Take the user's prompt and enhance it with detailed style descriptors, lighting conditions, composition details, camera angle, color palette, mood, artistic style references, aspect ratio, and quality parameters. Make it vivid and specific. Output ONLY the improved prompt — no explanations, no labels, no meta-commentary.",
    examples: [
      "A cat sitting on a windowsill",
      "A futuristic city at sunset",
      "Portrait of a warrior princess",
      "Logo for a coffee shop",
    ],
  },
  {
    id: "analysis",
    label: "Data Analysis",
    icon: BarChart3,
    color: "text-amber-500",
    activeColor: "bg-amber-600 text-white border-amber-600",
    systemPrompt:
      "You are an expert prompt engineer specializing in data analysis prompts. Take the user's prompt and improve it by specifying the type of analysis needed, expected output format (tables, charts, summaries), statistical methods to apply, data handling instructions, and how to present findings. Include instructions for handling missing data, outliers, and formatting results. Output ONLY the improved prompt — no explanations, no labels, no meta-commentary.",
    examples: [
      "Analyze this sales data",
      "Find trends in customer feedback",
      "Compare revenue across regions",
      "Create a report from survey results",
    ],
  },
];

export default function AIPromptImprover() {
  const [activeMode, setActiveMode] = useState<Mode>("general");
  const [inputPrompt, setInputPrompt] = useState("");
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentMode = modes.find((m) => m.id === activeMode)!;

  const improvePrompt = async () => {
    if (!inputPrompt.trim()) {
      toast.error("Please enter a prompt to improve");
      return;
    }

    setLoading(true);
    setImprovedPrompt("");

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
            { role: "system", content: currentMode.systemPrompt },
            { role: "user", content: inputPrompt },
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
      const result = data.choices?.[0]?.message?.content?.trim();

      if (!result) {
        throw new Error("No improved prompt was generated. Please try again.");
      }

      setImprovedPrompt(result);
      toast.success("Prompt improved successfully!");
    } catch (err: any) {
      console.error("Prompt improvement error:", err);
      toast.error(err.message || "Failed to improve prompt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(improvedPrompt);
    setCopied(true);
    toast.success("Improved prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExampleClick = (example: string) => {
    setInputPrompt(example);
    setImprovedPrompt("");
  };

  return (
    <Layout>
      <SEOHead
        title="AI Prompt Improver | TechTrendi"
        description="Instantly improve your AI prompts for better results. Supports coding, writing, image generation, data analysis, and general prompts. Free tool powered by AI."
        canonicalUrl="https://techtrendi.com/tools/ai-prompt-generator"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            Free AI Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Prompt{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Improver
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Paste your prompt and get an enhanced, more effective version instantly
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setActiveMode(mode.id);
                  setImprovedPrompt("");
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
                  isActive
                    ? mode.activeColor
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Main Card */}
        <Card className="border-purple-200/50 dark:border-purple-800/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className={cn("w-4 h-4", currentMode.color)} />
              {currentMode.label} Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input */}
            <div className="space-y-2">
              <Label>Your Original Prompt</Label>
              <Textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Paste or type your prompt here..."
                rows={5}
                className="resize-none"
              />
            </div>

            {/* Example Chips */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Try an example:</Label>
              <div className="flex flex-wrap gap-2">
                {currentMode.examples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(example)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Improve Button */}
            <Button
              onClick={improvePrompt}
              size="lg"
              className={cn(
                "w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white",
                loading && "opacity-80"
              )}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Improve My Prompt
                </>
              )}
            </Button>

            {/* Loading Shimmer */}
            {loading && (
              <div className="space-y-3">
                <div className="h-4 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-pulse" />
                <div className="h-4 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-pulse w-3/4" />
                <div className="h-4 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-pulse w-1/2" />
              </div>
            )}

            {/* Result */}
            {improvedPrompt && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Sparkles className={cn("w-4 h-4", currentMode.color)} />
                    Improved Prompt
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 p-5 border border-purple-200/60 dark:border-purple-800/40">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {improvedPrompt}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Section */}
        <div className="mt-16">
          <h2 className="text-xl font-semibold text-center mb-6">
            Why Improve Your Prompts?
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                title: "Better Results",
                description:
                  "Specific, well-structured prompts consistently produce higher-quality AI outputs across every platform.",
              },
              {
                title: "Save Time",
                description:
                  "Reduce back-and-forth iterations. A great prompt gets you closer to the right answer on the first try.",
              },
              {
                title: "Mode-Specific",
                description:
                  "Each mode adds domain-specific enhancements — coding best practices, image style descriptors, writing structure, and more.",
              },
            ].map((tip, i) => (
              <Card key={i} className="bg-muted/30">
                <CardContent className="pt-5 pb-4 px-5">
                  <h3 className="font-medium text-sm mb-1">{tip.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tip.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
