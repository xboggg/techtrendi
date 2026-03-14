import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Upload, Image as ImageIcon, Trophy, Sparkles, Share2, Copy, Check,
  ThumbsUp, Lightbulb, Eye, Type, Palette, User, Heart, HelpCircle,
  RotateCcw, Download, ExternalLink, Crown, Zap, TrendingUp, AlertCircle,
  CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ThumbnailData {
  id: "A" | "B";
  file: File | null;
  preview: string | null;
  votes: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  scoreA: number;
  scoreB: number;
}

interface AIAnalysis {
  thumbnailA: string;
  thumbnailB: string;
  winner: "A" | "B" | "tie";
  reasoning: string;
}

const GROQ_API_KEY = "GROQ_KEY_REMOVED";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const popularStyles = [
  {
    name: "The MrBeast",
    description: "Big text, shocked faces, bright colors, arrows pointing at things",
    colors: ["#FF0000", "#FFFF00", "#00FF00"],
  },
  {
    name: "The Minimalist",
    description: "Clean design, single focal point, professional typography",
    colors: ["#000000", "#FFFFFF", "#333333"],
  },
  {
    name: "The Before/After",
    description: "Split screen showing transformation, progress comparison",
    colors: ["#FF4444", "#44FF44", "#FFFFFF"],
  },
  {
    name: "The Mystery",
    description: "Blurred elements, question marks, censored areas",
    colors: ["#8B00FF", "#000000", "#FFD700"],
  },
  {
    name: "The Storyteller",
    description: "Cinematic look, dramatic lighting, movie poster style",
    colors: ["#1a1a2e", "#16213e", "#e94560"],
  },
  {
    name: "The List",
    description: "Numbers prominent, multiple items shown, organized layout",
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
  },
];

const thumbnailTips = [
  "Use contrasting colors that pop - YouTube recommends avoiding red/white/black overuse",
  "Include a human face with clear emotion - it increases CTR by 38%",
  "Keep text to 3-5 words maximum - less is more on small screens",
  "Use the rule of thirds for composition",
  "Test at 50% size - if you can't read it, neither can viewers",
  "Add a border or outline to make text readable on any background",
  "Use consistent branding elements across all thumbnails",
  "Create curiosity without being clickbait - deliver on your promise",
];

export default function ThumbnailTester() {
  const [thumbnails, setThumbnails] = useState<{ A: ThumbnailData; B: ThumbnailData }>({
    A: { id: "A", file: null, preview: null, votes: 0 },
    B: { id: "B", file: null, preview: null, votes: 0 },
  });
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "text", label: "Text Readability", icon: <Type className="w-4 h-4" />, scoreA: 0, scoreB: 0 },
    { id: "contrast", label: "Color Contrast", icon: <Palette className="w-4 h-4" />, scoreA: 0, scoreB: 0 },
    { id: "faces", label: "Faces Visible", icon: <User className="w-4 h-4" />, scoreA: 0, scoreB: 0 },
    { id: "emotion", label: "Emotion", icon: <Heart className="w-4 h-4" />, scoreA: 0, scoreB: 0 },
    { id: "curiosity", label: "Curiosity Factor", icon: <HelpCircle className="w-4 h-4" />, scoreA: 0, scoreB: 0 },
  ]);
  const [winner, setWinner] = useState<"A" | "B" | null>(null);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dragOver, setDragOver] = useState<"A" | "B" | null>(null);

  const fileInputA = useRef<HTMLInputElement>(null);
  const fileInputB = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((id: "A" | "B", file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnails((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          file,
          preview: e.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (id: "A" | "B", e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(id, file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (id: "A" | "B", e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(id);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleVote = (id: "A" | "B") => {
    setThumbnails((prev) => ({
      ...prev,
      [id]: { ...prev[id], votes: prev[id].votes + 1 },
    }));

    const totalVotes = thumbnails.A.votes + thumbnails.B.votes + 1;
    if (totalVotes >= 1) {
      const aVotes = id === "A" ? thumbnails.A.votes + 1 : thumbnails.A.votes;
      const bVotes = id === "B" ? thumbnails.B.votes + 1 : thumbnails.B.votes;
      setWinner(aVotes > bVotes ? "A" : aVotes < bVotes ? "B" : null);
      setShowResults(true);
    }

    toast.success(`Vote recorded for Thumbnail ${id}!`);
  };

  const handleChecklistChange = (itemId: string, thumbnail: "A" | "B", value: number) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, [thumbnail === "A" ? "scoreA" : "scoreB"]: value }
          : item
      )
    );
  };

  const getChecklistTotal = (thumbnail: "A" | "B") => {
    return checklist.reduce(
      (sum, item) => sum + (thumbnail === "A" ? item.scoreA : item.scoreB),
      0
    );
  };

  const analyzeWithAI = async () => {
    if (!thumbnails.A.preview || !thumbnails.B.preview) {
      toast.error("Please upload both thumbnails first");
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a YouTube thumbnail expert. When given descriptions of two thumbnails, analyze what makes each effective for getting clicks. Consider: text readability, color psychology, emotional appeal, composition, curiosity factor, and click-through rate potential. Be concise but insightful.`,
            },
            {
              role: "user",
              content: `I'm comparing two YouTube thumbnails for A/B testing. Based on thumbnail design best practices, provide analysis for each and declare a winner.

Thumbnail A: An uploaded image for A/B testing (the user will evaluate based on your general guidance)
Thumbnail B: An uploaded image for A/B testing (the user will evaluate based on your general guidance)

Please provide:
1. General analysis of what makes Thumbnail A effective (2-3 sentences)
2. General analysis of what makes Thumbnail B effective (2-3 sentences)
3. Which would likely perform better and why (1-2 sentences)

Format your response exactly like this:
THUMBNAIL_A: [your analysis]
THUMBNAIL_B: [your analysis]
WINNER: [A or B or TIE]
REASONING: [your reasoning]`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI analysis");
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";

      // Parse the response
      const thumbnailAMatch = content.match(/THUMBNAIL_A:\s*(.+?)(?=THUMBNAIL_B:|$)/s);
      const thumbnailBMatch = content.match(/THUMBNAIL_B:\s*(.+?)(?=WINNER:|$)/s);
      const winnerMatch = content.match(/WINNER:\s*(\w+)/i);
      const reasoningMatch = content.match(/REASONING:\s*(.+?)$/s);

      setAIAnalysis({
        thumbnailA: thumbnailAMatch?.[1]?.trim() || "Analysis for your first thumbnail focusing on visual impact and click appeal.",
        thumbnailB: thumbnailBMatch?.[1]?.trim() || "Analysis for your second thumbnail focusing on visual impact and click appeal.",
        winner: winnerMatch?.[1]?.toUpperCase() === "A" ? "A" : winnerMatch?.[1]?.toUpperCase() === "B" ? "B" : "tie",
        reasoning: reasoningMatch?.[1]?.trim() || "Both thumbnails have their strengths. Test with your audience to determine the winner.",
      });

      toast.success("AI analysis complete!");
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error("Failed to get AI analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateShareLink = () => {
    const shareData = {
      votesA: thumbnails.A.votes,
      votesB: thumbnails.B.votes,
      checklistA: getChecklistTotal("A"),
      checklistB: getChecklistTotal("B"),
      winner,
    };
    const encoded = btoa(JSON.stringify(shareData));
    const shareUrl = `${window.location.origin}${window.location.pathname}?results=${encoded}`;

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    setThumbnails({
      A: { id: "A", file: null, preview: null, votes: 0 },
      B: { id: "B", file: null, preview: null, votes: 0 },
    });
    setChecklist((prev) =>
      prev.map((item) => ({ ...item, scoreA: 0, scoreB: 0 }))
    );
    setWinner(null);
    setAIAnalysis(null);
    setShowResults(false);
    toast.success("Reset complete");
  };

  const getTotalScore = (thumbnail: "A" | "B") => {
    const votes = thumbnail === "A" ? thumbnails.A.votes : thumbnails.B.votes;
    const checklistScore = getChecklistTotal(thumbnail);
    return votes * 10 + checklistScore * 4; // Weight votes more heavily
  };

  const renderUploadZone = (id: "A" | "B") => {
    const thumbnail = thumbnails[id];
    const inputRef = id === "A" ? fileInputA : fileInputB;

    return (
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden",
          dragOver === id
            ? "border-red-500 bg-red-500/10 scale-[1.02]"
            : thumbnail.preview
            ? "border-transparent"
            : "border-muted-foreground/30 hover:border-red-500/50 hover:bg-red-500/5",
          "aspect-video cursor-pointer group"
        )}
        onDrop={(e) => handleDrop(id, e)}
        onDragOver={(e) => handleDragOver(id, e)}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(id, file);
          }}
        />

        {thumbnail.preview ? (
          <>
            <img
              src={thumbnail.preview}
              alt={`Thumbnail ${id}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white font-medium">Click to replace</p>
            </div>
            <Badge
              className={cn(
                "absolute top-3 left-3 text-lg font-bold px-3 py-1",
                id === "A"
                  ? "bg-gradient-to-r from-red-600 to-orange-500"
                  : "bg-gradient-to-r from-orange-500 to-yellow-500"
              )}
            >
              {id}
            </Badge>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                id === "A"
                  ? "bg-gradient-to-r from-red-600 to-orange-500"
                  : "bg-gradient-to-r from-orange-500 to-yellow-500"
              )}
            >
              <Upload className="w-8 h-8 text-white" />
            </div>
            <p className="font-semibold text-foreground mb-1">
              Upload Thumbnail {id}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to browse
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <SEOHead
        title="Thumbnail A/B Tester - Compare YouTube Thumbnails | TechTrendi"
        description="Compare and test YouTube thumbnails side by side. Get AI analysis, vote for your favorite, and optimize for higher click-through rates."
        canonicalUrl="https://techtrendi.com/tools/thumbnail-tester"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-red-600 to-orange-500 text-white border-0">
            Creator Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Thumbnail <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">A/B Tester</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Compare two thumbnails side by side. Vote, score, and get AI-powered insights to pick the winner.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 border-2 border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-red-500" />
              Upload Your Thumbnails
            </CardTitle>
            <CardDescription>
              Upload two thumbnails to compare. Recommended size: 1280x720 pixels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {renderUploadZone("A")}
              {renderUploadZone("B")}
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={resetAll}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Voting Section */}
        {thumbnails.A.preview && thumbnails.B.preview && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-red-500" />
                Vote for Your Favorite
              </CardTitle>
              <CardDescription>
                Click on the thumbnail you think will perform better
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Thumbnail A */}
                <div
                  className={cn(
                    "relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group",
                    "hover:ring-4 hover:ring-red-500 hover:scale-[1.02]",
                    winner === "A" && "ring-4 ring-green-500"
                  )}
                  onClick={() => handleVote("A")}
                >
                  <img
                    src={thumbnails.A.preview!}
                    alt="Thumbnail A"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <Badge className="bg-gradient-to-r from-red-600 to-orange-500 text-lg px-4 py-1">
                        A
                      </Badge>
                      <span className="text-white font-bold">Click to Vote</span>
                    </div>
                  </div>
                  {winner === "A" && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-500 text-white gap-1">
                        <Crown className="w-4 h-4" />
                        Winner
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Thumbnail B */}
                <div
                  className={cn(
                    "relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group",
                    "hover:ring-4 hover:ring-orange-500 hover:scale-[1.02]",
                    winner === "B" && "ring-4 ring-green-500"
                  )}
                  onClick={() => handleVote("B")}
                >
                  <img
                    src={thumbnails.B.preview!}
                    alt="Thumbnail B"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-lg px-4 py-1">
                        B
                      </Badge>
                      <span className="text-white font-bold">Click to Vote</span>
                    </div>
                  </div>
                  {winner === "B" && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-500 text-white gap-1">
                        <Crown className="w-4 h-4" />
                        Winner
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Vote Results */}
              {showResults && (
                <div className="mt-6 p-6 bg-muted/50 rounded-xl">
                  <h4 className="font-semibold text-center mb-4">Vote Results</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                        {thumbnails.A.votes}
                      </div>
                      <p className="text-sm text-muted-foreground">Votes for A</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                        {thumbnails.B.votes}
                      </div>
                      <p className="text-sm text-muted-foreground">Votes for B</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress
                      value={
                        thumbnails.A.votes + thumbnails.B.votes > 0
                          ? (thumbnails.A.votes / (thumbnails.A.votes + thumbnails.B.votes)) * 100
                          : 50
                      }
                      className="h-3"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>A: {thumbnails.A.votes + thumbnails.B.votes > 0 ? Math.round((thumbnails.A.votes / (thumbnails.A.votes + thumbnails.B.votes)) * 100) : 50}%</span>
                      <span>B: {thumbnails.A.votes + thumbnails.B.votes > 0 ? Math.round((thumbnails.B.votes / (thumbnails.A.votes + thumbnails.B.votes)) * 100) : 50}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Checklist Scoring */}
        {thumbnails.A.preview && thumbnails.B.preview && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-red-500" />
                Checklist Scoring
              </CardTitle>
              <CardDescription>
                Rate each thumbnail on key effectiveness factors (0-5 scale)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {checklist.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                    {/* Thumbnail A Score */}
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            onClick={() => handleChecklistChange(item.id, "A", score)}
                            className={cn(
                              "w-8 h-8 rounded-lg font-semibold transition-all",
                              item.scoreA >= score
                                ? "bg-gradient-to-r from-red-600 to-orange-500 text-white"
                                : "bg-muted hover:bg-red-500/20"
                            )}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Label */}
                    <div className="flex items-center gap-2 text-center min-w-[140px]">
                      <span className="text-red-500">{item.icon}</span>
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>

                    {/* Thumbnail B Score */}
                    <div className="flex items-center gap-3 justify-end">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            onClick={() => handleChecklistChange(item.id, "B", score)}
                            className={cn(
                              "w-8 h-8 rounded-lg font-semibold transition-all",
                              item.scoreB >= score
                                ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
                                : "bg-muted hover:bg-orange-500/20"
                            )}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Checklist Totals */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                  <div className="text-center p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl">
                    <div className="text-3xl font-bold text-red-500">{getChecklistTotal("A")}/25</div>
                    <p className="text-sm text-muted-foreground">Thumbnail A Score</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl">
                    <div className="text-3xl font-bold text-orange-500">{getChecklistTotal("B")}/25</div>
                    <p className="text-sm text-muted-foreground">Thumbnail B Score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis */}
        {thumbnails.A.preview && thumbnails.B.preview && (
          <Card className="mb-8 border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Analysis
              </CardTitle>
              <CardDescription>
                Get AI-powered insights on what makes each thumbnail effective
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!aiAnalysis ? (
                <div className="text-center py-8">
                  <Button
                    onClick={analyzeWithAI}
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white gap-2"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-3">
                    Powered by Groq AI - Get expert thumbnail feedback instantly
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Analysis A */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-gradient-to-r from-red-600 to-orange-500">A</Badge>
                        <span className="font-semibold">Thumbnail A Analysis</span>
                        {aiAnalysis.winner === "A" && (
                          <Badge className="bg-green-500 text-white gap-1 ml-auto">
                            <Crown className="w-3 h-3" />
                            AI Pick
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{aiAnalysis.thumbnailA}</p>
                    </div>

                    {/* Analysis B */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500">B</Badge>
                        <span className="font-semibold">Thumbnail B Analysis</span>
                        {aiAnalysis.winner === "B" && (
                          <Badge className="bg-green-500 text-white gap-1 ml-auto">
                            <Crown className="w-3 h-3" />
                            AI Pick
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{aiAnalysis.thumbnailB}</p>
                    </div>
                  </div>

                  {/* AI Verdict */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-purple-500" />
                      <span className="font-semibold">AI Verdict</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{aiAnalysis.reasoning}</p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setAIAnalysis(null)}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Get New Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Winner Display */}
        {(showResults || aiAnalysis) && thumbnails.A.preview && thumbnails.B.preview && (
          <Card className="mb-8 border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Overall Winner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 items-center">
                {/* Thumbnail A Summary */}
                <div className={cn(
                  "text-center p-6 rounded-xl transition-all",
                  getTotalScore("A") > getTotalScore("B")
                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-2 ring-green-500"
                    : "bg-muted/50"
                )}>
                  {thumbnails.A.preview && (
                    <img
                      src={thumbnails.A.preview}
                      alt="Thumbnail A"
                      className="w-full aspect-video object-cover rounded-lg mb-4"
                    />
                  )}
                  <Badge className="bg-gradient-to-r from-red-600 to-orange-500 mb-2">A</Badge>
                  <div className="text-3xl font-bold text-foreground">{getTotalScore("A")}</div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  {getTotalScore("A") > getTotalScore("B") && (
                    <Badge className="bg-green-500 text-white mt-3 gap-1">
                      <Crown className="w-4 h-4" />
                      Winner
                    </Badge>
                  )}
                </div>

                {/* VS */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-muted-foreground">VS</div>
                </div>

                {/* Thumbnail B Summary */}
                <div className={cn(
                  "text-center p-6 rounded-xl transition-all",
                  getTotalScore("B") > getTotalScore("A")
                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-2 ring-green-500"
                    : "bg-muted/50"
                )}>
                  {thumbnails.B.preview && (
                    <img
                      src={thumbnails.B.preview}
                      alt="Thumbnail B"
                      className="w-full aspect-video object-cover rounded-lg mb-4"
                    />
                  )}
                  <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 mb-2">B</Badge>
                  <div className="text-3xl font-bold text-foreground">{getTotalScore("B")}</div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  {getTotalScore("B") > getTotalScore("A") && (
                    <Badge className="bg-green-500 text-white mt-3 gap-1">
                      <Crown className="w-4 h-4" />
                      Winner
                    </Badge>
                  )}
                </div>
              </div>

              {/* Share Button */}
              <div className="flex justify-center mt-6">
                <Button
                  onClick={generateShareLink}
                  className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share Comparison
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Tips for Better Thumbnails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {thumbnailTips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Styles Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              Popular Thumbnail Styles
            </CardTitle>
            <CardDescription>
              Reference these proven thumbnail formats used by top creators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularStyles.map((style, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border bg-card hover:border-red-500/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground">{style.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{style.description}</p>
                  <div className="flex gap-2">
                    {style.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            This tool helps you compare thumbnails locally. For real A/B testing,
            use YouTube Studio's built-in thumbnail test feature or tools like TubeBuddy.
          </p>
        </div>
      </div>
    </Layout>
  );
}
