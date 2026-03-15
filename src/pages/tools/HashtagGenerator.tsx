import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Hash, Copy, Check, RefreshCw, Sparkles, Loader2, Instagram, Twitter,
  Youtube, Linkedin, Target, TrendingUp, Users, Zap
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const platforms = [
  { id: "instagram", label: "Instagram", icon: Instagram, limit: 2200, hashtagLimit: 30 },
  { id: "twitter", label: "Twitter/X", icon: Twitter, limit: 280, hashtagLimit: 5 },
  { id: "tiktok", label: "TikTok", icon: Hash, limit: 2200, hashtagLimit: 8 },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, limit: 3000, hashtagLimit: 5 },
  { id: "youtube", label: "YouTube", icon: Youtube, limit: 500, hashtagLimit: 15 },
];

const styles = [
  { id: "popular", label: "Popular", description: "High-volume, widely-used hashtags", icon: TrendingUp },
  { id: "niche", label: "Niche", description: "Targeted, specific community hashtags", icon: Target },
  { id: "mixed", label: "Mixed", description: "Balance of popular and niche", icon: Users },
  { id: "trending", label: "Trending", description: "Current viral and trending tags", icon: Zap },
];

interface HashtagGroup {
  category: string;
  hashtags: string[];
  description: string;
}

export default function HashtagGenerator() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [style, setStyle] = useState("mixed");
  const [hashtagCount, setHashtagCount] = useState([15]);
  const [generating, setGenerating] = useState(false);
  const [hashtagGroups, setHashtagGroups] = useState<HashtagGroup[]>([]);
  const [allHashtags, setAllHashtags] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndividual, setCopiedIndividual] = useState<string | null>(null);

  const selectedPlatform = platforms.find((p) => p.id === platform);

  const generateHashtags = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or content description");
      return;
    }

    setGenerating(true);
    setHashtagGroups([]);
    setAllHashtags([]);

    const selectedStyle = styles.find((s) => s.id === style)?.label || style;

    const systemMessage = `You are an expert social media strategist specializing in hashtag research and optimization. Your task is to generate highly effective, relevant hashtags that will maximize reach and engagement.

Output your response in valid JSON format with the following structure:
{
  "groups": [
    {
      "category": "Branded",
      "hashtags": ["#example1", "#example2"],
      "description": "Brief description of this category"
    },
    {
      "category": "Community",
      "hashtags": ["#example3", "#example4"],
      "description": "Brief description of this category"
    },
    {
      "category": "Niche",
      "hashtags": ["#example5", "#example6"],
      "description": "Brief description of this category"
    },
    {
      "category": "Trending",
      "hashtags": ["#example7", "#example8"],
      "description": "Brief description of this category"
    }
  ]
}

Important rules:
- Generate exactly ${hashtagCount[0]} hashtags total, distributed across the categories
- All hashtags must start with #
- No spaces within hashtags (use camelCase or underscores)
- Keep hashtags relevant to the topic
- Tailor hashtags for ${selectedPlatform?.label || platform} best practices
- Follow the "${selectedStyle}" style preference
- Output ONLY valid JSON, no markdown, no explanations`;

    const userMessage = `Generate ${hashtagCount[0]} hashtags for the following:
- Platform: ${selectedPlatform?.label || platform}
- Style: ${selectedStyle}
- Topic/Content: ${topic}

Create hashtags that will maximize reach and engagement on ${selectedPlatform?.label || platform}.`;

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
        throw new Error("No hashtags were generated. Please try again.");
      }

      // Parse the JSON response
      const parsed = JSON.parse(result);
      const groups: HashtagGroup[] = parsed.groups || [];

      // Extract all hashtags
      const all: string[] = [];
      groups.forEach((group) => {
        all.push(...group.hashtags);
      });

      setHashtagGroups(groups);
      setAllHashtags(all);
      toast.success(`Generated ${all.length} hashtags!`);
    } catch (err: any) {
      console.error("Hashtag generation error:", err);
      toast.error(err.message || "Failed to generate hashtags. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyAllHashtags = () => {
    const text = allHashtags.join(" ");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success("All hashtags copied to clipboard!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const copyIndividualHashtag = (hashtag: string) => {
    navigator.clipboard.writeText(hashtag);
    setCopiedIndividual(hashtag);
    toast.success(`${hashtag} copied!`);
    setTimeout(() => setCopiedIndividual(null), 2000);
  };

  const totalCharCount = allHashtags.join(" ").length;
  const charLimit = selectedPlatform?.limit || 2200;
  const isOverLimit = totalCharCount > charLimit;

  return (
    <Layout>
      <SEOHead
        title="AI Hashtag Generator | TechTrendi"
        description="Generate perfect hashtags for Instagram, Twitter, TikTok, LinkedIn, and YouTube. AI-powered hashtag research for maximum reach and engagement."
        canonicalUrl="https://techtrendi.com/tools/hashtag-generator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            Free AI Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Hashtag{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Generator
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Generate powerful, targeted hashtags to maximize your social media reach
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            <Card className="border-purple-200/50 dark:border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="w-4 h-4 text-purple-600" />
                  Hashtag Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Topic Input */}
                <div className="space-y-2">
                  <Label>Topic / Content Description *</Label>
                  <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Travel photography in Bali, sunset beach photos with palm trees..."
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe your content, niche, or what your post is about
                  </p>
                </div>

                {/* Platform Selector */}
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <p.icon className="w-4 h-4" />
                            <span>{p.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              (max {p.hashtagLimit} tags)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Style Selector */}
                <div className="space-y-3">
                  <Label>Hashtag Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {styles.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                          style === s.id
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 ring-1 ring-purple-500"
                            : "border-border hover:border-purple-300 dark:hover:border-purple-700"
                        )}
                      >
                        <s.icon className={cn(
                          "w-4 h-4",
                          style === s.id ? "text-purple-600" : "text-muted-foreground"
                        )} />
                        <div>
                          <p className={cn(
                            "text-sm font-medium",
                            style === s.id && "text-purple-700 dark:text-purple-400"
                          )}>
                            {s.label}
                          </p>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {s.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hashtag Count Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Number of Hashtags</Label>
                    <span className="text-sm font-medium text-purple-600">
                      {hashtagCount[0]} hashtags
                    </span>
                  </div>
                  <Slider
                    value={hashtagCount}
                    onValueChange={setHashtagCount}
                    min={5}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5</span>
                    <span>30</span>
                  </div>
                  {selectedPlatform && hashtagCount[0] > selectedPlatform.hashtagLimit && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Note: {selectedPlatform.label} recommends max {selectedPlatform.hashtagLimit} hashtags
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generateHashtags}
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
                  Generating Hashtags...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Hashtags
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            <Card className={cn(
              "min-h-[600px] transition-all",
              allHashtags.length > 0 && "border-purple-300 dark:border-purple-700/50 shadow-lg shadow-purple-100/50 dark:shadow-purple-900/20"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Hash className="w-4 h-4 text-purple-600" />
                    Generated Hashtags
                  </CardTitle>
                  {allHashtags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyAllHashtags}
                        className="gap-1.5"
                      >
                        {copiedAll ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            Copied All
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy All
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateHashtags}
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
                {allHashtags.length > 0 ? (
                  <div className="space-y-6">
                    {/* Character Count */}
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      isOverLimit
                        ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                        : "bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800"
                    )}>
                      <span className="text-sm">Character Count:</span>
                      <span className={cn(
                        "font-mono text-sm font-medium",
                        isOverLimit ? "text-red-600" : "text-purple-600"
                      )}>
                        {totalCharCount} / {charLimit}
                      </span>
                    </div>

                    {/* Hashtag Groups */}
                    {hashtagGroups.map((group, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-700">
                            {group.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {group.description}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.hashtags.map((hashtag, hIndex) => (
                            <button
                              key={hIndex}
                              onClick={() => copyIndividualHashtag(hashtag)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/30",
                                "text-purple-700 dark:text-purple-300",
                                "hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/50 dark:hover:to-pink-800/40",
                                "border border-purple-200/50 dark:border-purple-700/50",
                                "hover:scale-105 active:scale-95",
                                copiedIndividual === hashtag && "ring-2 ring-green-500 bg-green-100 dark:bg-green-900/30"
                              )}
                            >
                              {copiedIndividual === hashtag ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Copied
                                </span>
                              ) : (
                                hashtag
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* All Hashtags Preview */}
                    <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200/60 dark:border-purple-800/40">
                      <p className="text-xs text-muted-foreground mb-2">All hashtags (ready to copy):</p>
                      <p className="text-sm text-foreground break-words">
                        {allHashtags.join(" ")}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-purple-600">{allHashtags.length}</p>
                        <p className="text-xs text-muted-foreground">Hashtags</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-pink-600">{hashtagGroups.length}</p>
                        <p className="text-xs text-muted-foreground">Categories</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-purple-600">{totalCharCount}</p>
                        <p className="text-xs text-muted-foreground">Characters</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-20 animate-pulse" />
                      <Hash className="w-14 h-14 opacity-40 relative" />
                    </div>
                    <p className="font-medium">Your hashtags will appear here</p>
                    <p className="text-sm mt-1 text-center max-w-xs">
                      Describe your content, select your platform and style, then generate
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-16">
          <h2 className="text-xl font-semibold text-center mb-6">Hashtag Best Practices</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Mix It Up",
                description: "Combine popular, niche, and branded hashtags for the best reach and engagement balance.",
              },
              {
                title: "Platform Limits",
                description: "Instagram allows 30, but 5-15 is optimal. Twitter works best with 1-3. TikTok recommends 3-5.",
              },
              {
                title: "Stay Relevant",
                description: "Only use hashtags directly related to your content. Irrelevant tags hurt engagement.",
              },
              {
                title: "Research Trends",
                description: "Check trending hashtags in your niche and include timely, seasonal tags when appropriate.",
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

        {/* Platform Guide */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-center mb-6">Platform-Specific Guidelines</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((p) => (
              <Card key={p.id} className="border-purple-100 dark:border-purple-900/30">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                      <p.icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-medium">{p.label}</h3>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Max hashtags: <span className="font-medium text-foreground">{p.hashtagLimit}</span></p>
                    <p>Caption limit: <span className="font-medium text-foreground">{p.limit.toLocaleString()} chars</span></p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
