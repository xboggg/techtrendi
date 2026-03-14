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
  Hash, Copy, RefreshCw, Sparkles, TrendingUp, Users,
  Check, Loader2, Clock, Target, BarChart3, Zap,
  ChevronDown, ChevronUp, Scale, Lightbulb
} from "lucide-react";

const platforms = [
  { id: "instagram", label: "Instagram", icon: "IG" },
  { id: "twitter", label: "Twitter/X", icon: "X" },
  { id: "tiktok", label: "TikTok", icon: "TT" },
  { id: "linkedin", label: "LinkedIn", icon: "LI" },
];

interface HashtagAnalysis {
  hashtag: string;
  popularityScore: number;
  competitionLevel: "Low" | "Medium" | "High" | "Very High";
  recommendedFor: "Small" | "Medium" | "Large" | "All";
  relatedHashtags: string[];
  bestTimeToUse: string;
  estimatedReach: string;
  trendingStatus: "Rising" | "Stable" | "Declining" | "New";
}

interface StrategyAnalysis {
  overallScore: number;
  mixRecommendation: string;
  popularRatio: number;
  nicheRatio: number;
  suggestions: string[];
  optimizedSet: string[];
}

const GROQ_API_KEY = "GROQ_KEY_REMOVED";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export default function HashtagAnalyzer() {
  const [hashtagInput, setHashtagInput] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [analyses, setAnalyses] = useState<HashtagAnalysis[]>([]);
  const [strategy, setStrategy] = useState<StrategyAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedOptimized, setCopiedOptimized] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const parseHashtags = (input: string): string[] => {
    return input
      .split(/[,\n]+/)
      .map(tag => tag.trim().replace(/^#/, "").toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 30)
      .slice(0, 20);
  };

  const analyzeHashtags = async () => {
    const hashtags = parseHashtags(hashtagInput);

    if (hashtags.length === 0) {
      toast.error("Please enter at least one hashtag");
      return;
    }

    setAnalyzing(true);
    setAnalyses([]);
    setStrategy(null);

    const platformLabel = platforms.find(p => p.id === platform)?.label || platform;

    const prompt = `You are a social media hashtag analytics expert. Analyze the following hashtags for ${platformLabel}.

Hashtags to analyze: ${hashtags.map(h => "#" + h).join(", ")}

For EACH hashtag, provide:
1. hashtag: the hashtag without #
2. popularityScore: 1-100 score based on estimated usage volume
3. competitionLevel: "Low", "Medium", "High", or "Very High"
4. recommendedFor: "Small" (under 10K followers), "Medium" (10K-100K), "Large" (100K+), or "All"
5. relatedHashtags: array of 5 related hashtags (without #)
6. bestTimeToUse: specific time recommendation (e.g., "Weekdays 9-11 AM EST")
7. estimatedReach: estimated potential reach (e.g., "50K-100K impressions")
8. trendingStatus: "Rising", "Stable", "Declining", or "New"

Also provide an overall strategy analysis:
1. overallScore: 1-100 score for the hashtag set quality
2. mixRecommendation: advice on the mix of popular vs niche hashtags
3. popularRatio: percentage of popular/competitive hashtags (0-100)
4. nicheRatio: percentage of niche/low-competition hashtags (0-100)
5. suggestions: array of 3-5 strategy improvement suggestions
6. optimizedSet: array of 10-15 optimized hashtags (mix of input + recommended)

Return ONLY valid JSON with this exact structure:
{
  "hashtags": [array of hashtag analysis objects],
  "strategy": {strategy analysis object}
}

No markdown, no code fences, no extra text.`;

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
            { role: "system", content: "You are a social media analytics expert. Always respond with valid JSON only. No markdown, no explanation." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) throw new Error("Empty response from AI");

      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed.hashtags || !Array.isArray(parsed.hashtags)) {
        throw new Error("Invalid response format");
      }

      const normalizedHashtags: HashtagAnalysis[] = parsed.hashtags.map((h: any) => ({
        hashtag: h.hashtag || "",
        popularityScore: Math.min(100, Math.max(1, Number(h.popularityScore) || 50)),
        competitionLevel: ["Low", "Medium", "High", "Very High"].includes(h.competitionLevel)
          ? h.competitionLevel
          : "Medium",
        recommendedFor: ["Small", "Medium", "Large", "All"].includes(h.recommendedFor)
          ? h.recommendedFor
          : "All",
        relatedHashtags: Array.isArray(h.relatedHashtags)
          ? h.relatedHashtags.slice(0, 5).map((r: string) => r.replace(/^#/, ""))
          : [],
        bestTimeToUse: h.bestTimeToUse || "Peak hours",
        estimatedReach: h.estimatedReach || "Varies",
        trendingStatus: ["Rising", "Stable", "Declining", "New"].includes(h.trendingStatus)
          ? h.trendingStatus
          : "Stable",
      }));

      const normalizedStrategy: StrategyAnalysis = {
        overallScore: Math.min(100, Math.max(1, Number(parsed.strategy?.overallScore) || 50)),
        mixRecommendation: parsed.strategy?.mixRecommendation || "Consider adding more variety",
        popularRatio: Math.min(100, Math.max(0, Number(parsed.strategy?.popularRatio) || 50)),
        nicheRatio: Math.min(100, Math.max(0, Number(parsed.strategy?.nicheRatio) || 50)),
        suggestions: Array.isArray(parsed.strategy?.suggestions)
          ? parsed.strategy.suggestions.slice(0, 5)
          : [],
        optimizedSet: Array.isArray(parsed.strategy?.optimizedSet)
          ? parsed.strategy.optimizedSet.slice(0, 15).map((h: string) => h.replace(/^#/, ""))
          : [],
      };

      setAnalyses(normalizedHashtags);
      setStrategy(normalizedStrategy);
      toast.success(`Analyzed ${normalizedHashtags.length} hashtag${normalizedHashtags.length > 1 ? "s" : ""}!`);
    } catch (err: any) {
      console.error("Hashtag analysis error:", err);
      toast.error(err.message || "Failed to analyze hashtags. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const copyHashtag = (index: number) => {
    const analysis = analyses[index];
    const text = `#${analysis.hashtag}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Hashtag copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyOptimizedSet = () => {
    if (!strategy) return;
    const text = strategy.optimizedSet.map(h => `#${h}`).join(" ");
    navigator.clipboard.writeText(text);
    setCopiedOptimized(true);
    toast.success("Optimized hashtag set copied!");
    setTimeout(() => setCopiedOptimized(false), 2000);
  };

  const copyAllAnalyzed = () => {
    const text = analyses.map(a => `#${a.hashtag}`).join(" ");
    navigator.clipboard.writeText(text);
    toast.success("All hashtags copied!");
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case "Low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "High":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "Very High":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTrendingColor = (status: string) => {
    switch (status) {
      case "Rising":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Stable":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Declining":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400";
      case "New":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRecommendedColor = (rec: string) => {
    switch (rec) {
      case "Small":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400";
      case "Medium":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
      case "Large":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400";
      case "All":
        return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-amber-500";
    if (score >= 40) return "from-orange-500 to-red-500";
    return "from-red-500 to-rose-500";
  };

  return (
    <Layout>
      <SEOHead
        title="Hashtag Analyzer - Score Popularity & Competition | TechTrendi"
        description="Analyze hashtags for Instagram, Twitter, TikTok, and LinkedIn. Get popularity scores, competition levels, and AI-powered strategy recommendations."
        canonicalUrl="https://techtrendi.com/tools/hashtag-analyzer"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            AI-Powered Analytics
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Hashtag <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Analyzer</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the best hashtags for your content. Get AI-powered insights on popularity, competition, and optimal usage strategies.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-purple-100 dark:border-purple-900/30">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="w-4 h-4 text-purple-600" />
                  Enter Hashtags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Hashtags (comma or newline separated)</Label>
                  <textarea
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    placeholder="e.g., photography, travel, foodie&#10;or paste multiple hashtags..."
                    className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        analyzeHashtags();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Press Ctrl+Enter to analyze. Max 20 hashtags.
                  </p>
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
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs flex items-center justify-center font-bold">
                              {p.icon}
                            </span>
                            {p.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={analyzeHashtags}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : analyses.length > 0 ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Analyze Again
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze Hashtags
                </>
              )}
            </Button>

            {analyses.length > 1 && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setCompareMode(!compareMode)}
              >
                <Scale className="w-5 h-5 mr-2" />
                {compareMode ? "Exit Compare Mode" : "Compare Hashtags"}
              </Button>
            )}

            {/* Strategy Summary Card */}
            {strategy && (
              <Card className="border-2 border-purple-100 dark:border-purple-900/30">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    Strategy Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="url(#scoreGradient)"
                          strokeWidth="12"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${(strategy.overallScore / 100) * 352} 352`}
                        />
                        <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#9333ea" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn("text-3xl font-bold", getScoreColor(strategy.overallScore))}>
                          {strategy.overallScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Popular hashtags</span>
                      <span className="font-medium">{strategy.popularRatio}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${strategy.popularRatio}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Niche hashtags</span>
                      <span className="font-medium">{strategy.nicheRatio}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${strategy.nicheRatio}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      <Lightbulb className="w-4 h-4 inline mr-1" />
                      {strategy.mixRecommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Results Panel */}
          <div className="lg:col-span-3 space-y-6">
            {analyzing ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 space-y-3">
                      <div className="h-6 bg-muted rounded w-1/3" />
                      <div className="flex gap-2">
                        <div className="h-5 bg-muted rounded w-20" />
                        <div className="h-5 bg-muted rounded w-24" />
                        <div className="h-5 bg-muted rounded w-16" />
                      </div>
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : analyses.length > 0 ? (
              <>
                {/* Comparison View */}
                {compareMode && analyses.length > 1 && (
                  <Card className="mb-6 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Scale className="w-4 h-4 text-purple-600" />
                        Hashtag Comparison
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 font-medium">Hashtag</th>
                              <th className="text-center p-3 font-medium">Popularity</th>
                              <th className="text-center p-3 font-medium">Competition</th>
                              <th className="text-center p-3 font-medium">Best For</th>
                              <th className="text-center p-3 font-medium">Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyses.map((analysis, index) => (
                              <tr key={index} className="border-t hover:bg-muted/30">
                                <td className="p-3 font-medium">#{analysis.hashtag}</td>
                                <td className="p-3 text-center">
                                  <span className={cn("font-bold", getScoreColor(analysis.popularityScore))}>
                                    {analysis.popularityScore}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <Badge className={cn("text-xs", getCompetitionColor(analysis.competitionLevel))}>
                                    {analysis.competitionLevel}
                                  </Badge>
                                </td>
                                <td className="p-3 text-center">
                                  <Badge className={cn("text-xs", getRecommendedColor(analysis.recommendedFor))}>
                                    {analysis.recommendedFor}
                                  </Badge>
                                </td>
                                <td className="p-3 text-center">
                                  <Badge className={cn("text-xs", getTrendingColor(analysis.trendingStatus))}>
                                    {analysis.trendingStatus}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Individual Hashtag Cards */}
                <div className="space-y-4">
                  {analyses.map((analysis, index) => (
                    <Card
                      key={index}
                      className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200 dark:hover:border-purple-800"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {/* Header Row */}
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                #{analysis.hashtag}
                              </h3>
                              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full">
                                <TrendingUp className="w-3 h-3 text-purple-600" />
                                <span className={cn("text-sm font-bold", getScoreColor(analysis.popularityScore))}>
                                  {analysis.popularityScore}/100
                                </span>
                              </div>
                            </div>

                            {/* Badges Row */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge className={cn("text-xs", getCompetitionColor(analysis.competitionLevel))}>
                                <Target className="w-3 h-3 mr-1" />
                                {analysis.competitionLevel} Competition
                              </Badge>
                              <Badge className={cn("text-xs", getRecommendedColor(analysis.recommendedFor))}>
                                <Users className="w-3 h-3 mr-1" />
                                {analysis.recommendedFor} Accounts
                              </Badge>
                              <Badge className={cn("text-xs", getTrendingColor(analysis.trendingStatus))}>
                                <Zap className="w-3 h-3 mr-1" />
                                {analysis.trendingStatus}
                              </Badge>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{analysis.bestTimeToUse}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <BarChart3 className="w-4 h-4" />
                                <span>{analysis.estimatedReach}</span>
                              </div>
                            </div>

                            {/* Expandable Section */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto text-purple-600 hover:text-purple-700"
                              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            >
                              {expandedIndex === index ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-1" />
                                  Hide Related
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-1" />
                                  Show Related Hashtags
                                </>
                              )}
                            </Button>

                            {expandedIndex === index && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">Related Hashtags:</p>
                                <div className="flex flex-wrap gap-2">
                                  {analysis.relatedHashtags.map((related, rIndex) => (
                                    <Badge
                                      key={rIndex}
                                      variant="outline"
                                      className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                      onClick={() => {
                                        setHashtagInput(prev => prev ? `${prev}, ${related}` : related);
                                        toast.success(`Added #${related} to input`);
                                      }}
                                    >
                                      #{related}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Copy Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => copyHashtag(index)}
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

                {/* Optimized Set */}
                {strategy && strategy.optimizedSet.length > 0 && (
                  <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Optimized Hashtag Set
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {strategy.optimizedSet.map((tag, index) => (
                          <Badge
                            key={index}
                            className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(`#${tag}`);
                              toast.success(`Copied #${tag}`);
                            }}
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        onClick={copyOptimizedSet}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {copiedOptimized ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Optimized Set
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Strategy Suggestions */}
                {strategy && strategy.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Strategy Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {strategy.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                              {index + 1}
                            </span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={copyAllAnalyzed}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Analyzed
                  </Button>
                </div>
              </>
            ) : (
              <Card className="min-h-[500px]">
                <CardContent className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-4">
                    <Hash className="w-10 h-10 text-purple-500" />
                  </div>
                  <p className="font-medium text-lg">Your hashtag analysis will appear here</p>
                  <p className="text-sm mt-1">Enter hashtags and click analyze to get started</p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
                    {["travel", "photography", "foodie", "fitness", "entrepreneur"].map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30"
                        onClick={() => setHashtagInput(prev => prev ? `${prev}, ${tag}` : tag)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Click a hashtag above to add it</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
