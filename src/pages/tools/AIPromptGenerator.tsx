import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sparkles, Copy, Check, RefreshCw, Wand2, Brain, Loader2, Clipboard
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const aiPlatforms = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude" },
  { id: "midjourney", label: "Midjourney" },
  { id: "dall-e", label: "DALL-E" },
  { id: "stable-diffusion", label: "Stable Diffusion" },
  { id: "gemini", label: "Gemini" },
];

const promptTypes = [
  { id: "creative-writing", label: "Creative Writing" },
  { id: "code-generation", label: "Code Generation" },
  { id: "image-generation", label: "Image Generation" },
  { id: "data-analysis", label: "Data Analysis" },
  { id: "marketing-copy", label: "Marketing Copy" },
  { id: "education", label: "Education" },
  { id: "brainstorming", label: "Brainstorming" },
];

const tones = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "academic", label: "Academic" },
  { id: "creative", label: "Creative" },
  { id: "persuasive", label: "Persuasive" },
];

export default function AIPromptGenerator() {
  const [platform, setPlatform] = useState("chatgpt");
  const [promptType, setPromptType] = useState("creative-writing");
  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState("professional");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePrompt = async () => {
    if (!idea.trim()) {
      toast.error("Please enter a topic or idea");
      return;
    }

    setGenerating(true);
    setGeneratedPrompt("");

    const selectedPlatform = aiPlatforms.find((p) => p.id === platform)?.label || platform;
    const selectedType = promptTypes.find((t) => t.id === promptType)?.label || promptType;
    const selectedTone = tones.find((t) => t.id === tone)?.label || tone;

    const systemMessage = `You are an expert AI prompt engineer. Your job is to take a user's basic idea and transform it into a highly effective, detailed prompt optimized for a specific AI platform. Output ONLY the optimized prompt text — no explanations, no labels, no markdown formatting. Just the raw prompt the user can copy and paste directly into the target AI tool.`;

    const userMessage = `Create an optimized prompt for the following:
- AI Platform: ${selectedPlatform}
- Prompt Type: ${selectedType}
- Tone: ${selectedTone}
- User's Idea: ${idea}

Craft a detailed, well-structured prompt that will get the best results from ${selectedPlatform}. Include specific instructions, context, constraints, and formatting guidance appropriate for ${selectedType} tasks. Tailor the prompt style to ${selectedPlatform}'s strengths and expected input format.${
      ["midjourney", "dall-e", "stable-diffusion"].includes(platform)
        ? " For image generation, include style keywords, lighting, composition, aspect ratio, and quality parameters as appropriate for the platform."
        : ""
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
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage },
          ],
          temperature: 0.8,
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
        throw new Error("No prompt was generated. Please try again.");
      }

      setGeneratedPrompt(result);
      toast.success("Prompt generated successfully!");
    } catch (err: any) {
      console.error("Prompt generation error:", err);
      toast.error(err.message || "Failed to generate prompt. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="AI Prompt Generator | TechTrendi"
        description="Craft effective, optimized prompts for ChatGPT, Claude, Midjourney, DALL-E, and more. Get better AI results with expertly engineered prompts."
        canonicalUrl="https://techtrendi.com/tools/ai-prompt-generator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            Free AI Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Prompt{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Generator
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Turn simple ideas into powerful, optimized prompts for any AI platform
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            <Card className="border-purple-200/50 dark:border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  Prompt Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>AI Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiPlatforms.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prompt Type</Label>
                  <Select value={promptType} onValueChange={setPromptType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {promptTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tone (optional)</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Your Idea / Topic *</Label>
                  <Textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="e.g., Write a blog post about the future of remote work in 2026..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe what you want the AI to help you with
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generatePrompt}
              size="lg"
              className={cn(
                "w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white",
                generating && "opacity-80"
              )}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Prompt
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            <Card className={cn(
              "min-h-[500px] transition-all",
              generatedPrompt && "border-purple-300 dark:border-purple-700/50 shadow-lg shadow-purple-100/50 dark:shadow-purple-900/20"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Generated Prompt
                  </CardTitle>
                  {generatedPrompt && (
                    <div className="flex items-center gap-2">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generatePrompt}
                        disabled={generating}
                        className="gap-1.5"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
                        Regenerate
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedPrompt ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 p-5 border border-purple-200/60 dark:border-purple-800/40">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {generatedPrompt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clipboard className="w-3 h-3" />
                      <span>
                        Optimized for{" "}
                        <strong>{aiPlatforms.find((p) => p.id === platform)?.label}</strong>
                        {" "}&middot;{" "}
                        {promptTypes.find((t) => t.id === promptType)?.label}
                        {" "}&middot;{" "}
                        {tones.find((t) => t.id === tone)?.label} tone
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-20 animate-pulse" />
                      <Sparkles className="w-14 h-14 opacity-40 relative" />
                    </div>
                    <p className="font-medium">Your optimized prompt will appear here</p>
                    <p className="text-sm mt-1">Select your platform, type, and describe your idea</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-16">
          <h2 className="text-xl font-semibold text-center mb-6">Tips for Better Prompts</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                title: "Be Specific",
                description:
                  "Include details like format, length, audience, and purpose to get more targeted results.",
              },
              {
                title: "Add Context",
                description:
                  "Tell the AI what role to play, what background to assume, and what constraints to follow.",
              },
              {
                title: "Iterate & Refine",
                description:
                  "Use the Regenerate button to explore different angles. Small changes in input can yield very different prompts.",
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
