import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sparkles, Copy, Check, RefreshCw, Loader2, Zap, Heart, Star,
  Youtube, Instagram, Twitter, Linkedin, Video, MessageSquare
} from "lucide-react";

const platforms = [
  { id: "youtube", label: "YouTube", icon: Youtube, maxLength: 100 },
  { id: "tiktok", label: "TikTok", icon: Video, maxLength: 150 },
  { id: "instagram", label: "Instagram Reels", icon: Instagram, maxLength: 150 },
  { id: "twitter", label: "Twitter/X", icon: Twitter, maxLength: 280 },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, maxLength: 200 },
];

const hookStyles = [
  { id: "curiosity", label: "Curiosity", description: "Create intrigue and mystery" },
  { id: "controversial", label: "Controversial", description: "Challenge common beliefs" },
  { id: "story", label: "Story", description: "Start with a personal story" },
  { id: "question", label: "Question", description: "Ask thought-provoking questions" },
  { id: "statistic", label: "Statistic", description: "Lead with shocking data" },
  { id: "challenge", label: "Challenge", description: "Challenge the viewer" },
];

const tones = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "funny", label: "Funny" },
  { id: "dramatic", label: "Dramatic" },
  { id: "inspiring", label: "Inspiring" },
];

interface Hook {
  text: string;
  rating: number;
  isFavorite: boolean;
}

const GROQ_API_KEY = "GROQ_KEY_REMOVED";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export default function HookGenerator() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [hookStyle, setHookStyle] = useState("curiosity");
  const [tone, setTone] = useState("casual");
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hookCount, setHookCount] = useState("7");

  const generateHooks = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or content theme");
      return;
    }

    setGenerating(true);
    setHooks([]);

    const platformLabel = platforms.find(p => p.id === platform)?.label || platform;
    const styleLabel = hookStyles.find(s => s.id === hookStyle)?.label || hookStyle;
    const toneLabel = tones.find(t => t.id === tone)?.label || tone;
    const count = parseInt(hookCount) || 7;

    const prompt = `You are a viral content expert specializing in attention-grabbing hooks. Generate exactly ${count} unique, scroll-stopping hooks for the following:

Topic/Theme: ${topic.trim()}
Platform: ${platformLabel}
Hook Style: ${styleLabel}
Tone: ${toneLabel}

Guidelines:
- Each hook should be optimized for ${platformLabel}
- Use ${styleLabel.toLowerCase()} approach to grab attention
- Maintain a ${toneLabel.toLowerCase()} tone throughout
- Make them punchy and impossible to scroll past
- No generic openings - each hook must be unique and creative
- Focus on the first 3-5 seconds of attention

Return ONLY valid JSON - an array of ${count} strings (the hooks only). No markdown, no code fences, no extra text. Example format: ["Hook 1", "Hook 2", ...]`;

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
            { role: "system", content: "You are a viral content strategist. Always respond with valid JSON arrays of strings only. No markdown, no explanation, no code fences." },
            { role: "user", content: prompt },
          ],
          temperature: 0.95,
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

      // Parse JSON - strip code fences if present
      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed: string[] = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid response format");
      }

      // Convert to Hook objects
      const newHooks: Hook[] = parsed.map((text) => ({
        text: typeof text === "string" ? text : String(text),
        rating: 0,
        isFavorite: false,
      }));

      setHooks(newHooks);
      toast.success(`Generated ${newHooks.length} viral hooks!`);
    } catch (err: any) {
      console.error("Hook generation error:", err);
      toast.error(err.message || "Failed to generate hooks. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyHook = (index: number) => {
    const hook = hooks[index];
    navigator.clipboard.writeText(hook.text);
    setCopiedIndex(index);
    toast.success("Hook copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const rateHook = (index: number, rating: number) => {
    setHooks(prev => prev.map((hook, i) =>
      i === index ? { ...hook, rating } : hook
    ));
    toast.success(`Rated ${rating} stars!`);
  };

  const toggleFavorite = (index: number) => {
    setHooks(prev => prev.map((hook, i) =>
      i === index ? { ...hook, isFavorite: !hook.isFavorite } : hook
    ));
    const hook = hooks[index];
    toast.success(hook.isFavorite ? "Removed from favorites" : "Added to favorites!");
  };

  const selectedPlatform = platforms.find(p => p.id === platform);
  const favoriteHooks = hooks.filter(h => h.isFavorite);

  return (
    <Layout>
      <SEOHead
        title="AI Hook Generator - Create Viral Content Hooks | TechTrendi"
        description="Generate scroll-stopping hooks for YouTube, TikTok, Instagram Reels, Twitter, and LinkedIn. AI-powered viral content hooks that grab attention instantly."
        canonicalUrl="https://techtrendi.com/tools/hook-generator"
      />

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container py-12 md:py-20 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 bg-clip-text text-transparent">
                Viral Hook Generator
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Create attention-grabbing hooks that stop the scroll. AI-powered hooks for every platform.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Inputs (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-orange-200/50 dark:border-orange-900/30 shadow-lg shadow-orange-500/5">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    Hook Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Topic / Content Theme *</Label>
                    <Textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Why most people fail at building habits, Hidden iPhone features you didn't know about, The truth about passive income..."
                      rows={3}
                      className="resize-none border-orange-200/50 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="border-orange-200/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center gap-2">
                              <p.icon className="w-4 h-4" />
                              {p.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Hook Style</Label>
                    <Select value={hookStyle} onValueChange={setHookStyle}>
                      <SelectTrigger className="border-orange-200/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hookStyles.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div>
                              <span className="font-medium">{s.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">- {s.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="border-orange-200/50">
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
                    <Label className="text-sm font-medium">Number of Hooks</Label>
                    <Select value={hookCount} onValueChange={setHookCount}>
                      <SelectTrigger className="border-orange-200/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["5", "6", "7", "8", "9", "10"].map((n) => (
                          <SelectItem key={n} value={n}>
                            {n} hooks
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={generateHooks}
                size="lg"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Hooks...
                  </>
                ) : hooks.length > 0 ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Generate More Hooks
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Generate Viral Hooks
                  </>
                )}
              </Button>

              {/* Favorites Section */}
              {favoriteHooks.length > 0 && (
                <Card className="border-red-200/50 dark:border-red-900/30 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
                      <Heart className="w-4 h-4 fill-current" />
                      Favorites ({favoriteHooks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {favoriteHooks.map((hook, i) => (
                      <div key={i} className="text-sm p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        {hook.text.substring(0, 60)}...
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Output (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              {generating ? (
                // Loading skeleton
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse border-orange-200/30">
                      <CardContent className="p-5">
                        <div className="h-5 bg-gradient-to-r from-orange-200 to-red-200 dark:from-orange-900/30 dark:to-red-900/30 rounded w-full mb-2" />
                        <div className="h-5 bg-gradient-to-r from-orange-200 to-red-200 dark:from-orange-900/30 dark:to-red-900/30 rounded w-3/4" />
                        <div className="flex gap-2 mt-4">
                          <div className="h-8 bg-orange-200/50 dark:bg-orange-900/20 rounded w-20" />
                          <div className="h-8 bg-orange-200/50 dark:bg-orange-900/20 rounded w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : hooks.length > 0 ? (
                <div className="space-y-4">
                  {hooks.map((hook, index) => (
                    <Card
                      key={index}
                      className={cn(
                        "group hover:shadow-lg transition-all duration-300 border-orange-200/50 dark:border-orange-900/30",
                        hook.isFavorite && "ring-2 ring-red-400 ring-offset-2 dark:ring-offset-gray-900"
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <span className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <p className="text-base leading-relaxed font-medium">
                                {hook.text}
                              </p>
                            </div>

                            {/* Character count */}
                            <div className="mt-3 ml-10 flex items-center gap-4 text-xs text-muted-foreground">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full",
                                hook.text.length <= (selectedPlatform?.maxLength || 150)
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}>
                                {hook.text.length} / {selectedPlatform?.maxLength || 150} chars
                              </span>
                              {selectedPlatform && (
                                <span className="flex items-center gap-1">
                                  <selectedPlatform.icon className="w-3 h-3" />
                                  {selectedPlatform.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 ml-10 flex items-center gap-3 flex-wrap">
                          {/* Star Rating */}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => rateHook(index, star)}
                                className="p-1 hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={cn(
                                    "w-4 h-4 transition-colors",
                                    star <= hook.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300 dark:text-gray-600 hover:text-yellow-400"
                                  )}
                                />
                              </button>
                            ))}
                          </div>

                          <div className="flex-1" />

                          {/* Favorite */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(index)}
                            className={cn(
                              "gap-1.5",
                              hook.isFavorite && "text-red-500 hover:text-red-600"
                            )}
                          >
                            <Heart className={cn("w-4 h-4", hook.isFavorite && "fill-current")} />
                            {hook.isFavorite ? "Saved" : "Save"}
                          </Button>

                          {/* Copy */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyHook(index)}
                            className="gap-1.5 border-orange-200/50 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/20"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-4 h-4 text-green-500" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="min-h-[500px] border-orange-200/50 dark:border-orange-900/30 bg-gradient-to-br from-white to-orange-50/50 dark:from-gray-900 dark:to-orange-950/10">
                  <CardContent className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 blur-2xl opacity-20 animate-pulse" />
                      <div className="relative p-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
                        <MessageSquare className="w-12 h-12 text-orange-500" />
                      </div>
                    </div>
                    <p className="font-semibold text-lg mb-2">Your viral hooks will appear here</p>
                    <p className="text-sm text-center max-w-xs">
                      Enter your topic, choose your platform and style, then generate scroll-stopping hooks
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Tips Card */}
              {hooks.length === 0 && !generating && (
                <Card className="border-orange-200/50 dark:border-orange-900/30 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      Hook Writing Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                        <span><strong>Be specific</strong> - "3 habits that changed my life" beats "habits for success"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                        <span><strong>Create urgency</strong> - Make viewers feel they'll miss out if they scroll</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                        <span><strong>Challenge beliefs</strong> - Controversial hooks get more engagement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                        <span><strong>Use numbers</strong> - Specific numbers are more credible than vague claims</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
