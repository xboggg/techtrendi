import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Lightbulb, Target, Users, DollarSign, Zap, AlertTriangle, CheckCircle2,
  XCircle, TrendingUp, Share2, Rocket, Shield, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ValidationScore {
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function StartupValidator() {
  const [ideaName, setIdeaName] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [uniqueValue, setUniqueValue] = useState("");
  const [marketSize, setMarketSize] = useState(5);
  const [competition, setCompetition] = useState(5);
  const [technicalFeasibility, setTechnicalFeasibility] = useState(5);
  const [monetization, setMonetization] = useState(5);
  const [personalExpertise, setPersonalExpertise] = useState(5);
  const [urgency, setUrgency] = useState(5);
  const [validated, setValidated] = useState(false);

  const scores: ValidationScore[] = useMemo(() => {
    if (!validated) return [];

    const results: ValidationScore[] = [];

    // Problem clarity
    const problemScore = Math.min(20, problemStatement.length / 10);
    results.push({
      category: "Problem Clarity",
      score: Math.round(problemScore),
      maxScore: 20,
      feedback: problemScore >= 15
        ? "Clear, well-defined problem statement"
        : problemScore >= 10
        ? "Good problem definition, could be more specific"
        : "Problem statement needs more clarity and detail",
      icon: Target,
    });

    // Target audience
    const audienceScore = Math.min(15, targetAudience.length / 5);
    results.push({
      category: "Target Audience",
      score: Math.round(audienceScore),
      maxScore: 15,
      feedback: audienceScore >= 12
        ? "Well-defined target market"
        : audienceScore >= 8
        ? "Target audience identified but could be more specific"
        : "Need clearer definition of your target customer",
      icon: Users,
    });

    // Unique value
    const uvpScore = Math.min(15, uniqueValue.length / 5);
    results.push({
      category: "Unique Value Proposition",
      score: Math.round(uvpScore),
      maxScore: 15,
      feedback: uvpScore >= 12
        ? "Strong differentiation from competitors"
        : uvpScore >= 8
        ? "Some differentiation, strengthen your unique angle"
        : "Need clearer unique selling point",
      icon: Zap,
    });

    // Market size
    const marketScore = marketSize * 2;
    results.push({
      category: "Market Size",
      score: marketScore,
      maxScore: 20,
      feedback: marketScore >= 16
        ? "Large market with significant opportunity"
        : marketScore >= 10
        ? "Decent market size with room to grow"
        : "Small market - consider if it's enough",
      icon: BarChart3,
    });

    // Competition (inverted - less competition is better)
    const compScore = (10 - competition) * 1.5;
    results.push({
      category: "Competition Level",
      score: Math.round(compScore),
      maxScore: 15,
      feedback: compScore >= 12
        ? "Low competition, good market entry"
        : compScore >= 8
        ? "Moderate competition, differentiation key"
        : "High competition, need strong differentiation",
      icon: Shield,
    });

    // Monetization
    const moneyScore = monetization * 1.5;
    results.push({
      category: "Monetization Clarity",
      score: Math.round(moneyScore),
      maxScore: 15,
      feedback: moneyScore >= 12
        ? "Clear path to revenue"
        : moneyScore >= 8
        ? "Monetization possible but needs refinement"
        : "Revenue model unclear",
      icon: DollarSign,
    });

    return results;
  }, [validated, problemStatement, targetAudience, uniqueValue, marketSize, competition, monetization]);

  const totalScore = useMemo(() => {
    return scores.reduce((sum, s) => sum + s.score, 0);
  }, [scores]);

  const maxScore = 100;

  const getOverallRating = (score: number) => {
    if (score >= 80) return { label: "Highly Promising", color: "text-green-500", emoji: "🚀" };
    if (score >= 60) return { label: "Good Potential", color: "text-blue-500", emoji: "📈" };
    if (score >= 40) return { label: "Needs Work", color: "text-yellow-500", emoji: "⚠️" };
    return { label: "High Risk", color: "text-red-500", emoji: "🔴" };
  };

  const rating = validated ? getOverallRating(totalScore) : null;

  const validate = () => {
    if (!ideaName.trim()) {
      toast.error("Please enter your startup idea name");
      return;
    }
    if (!problemStatement.trim()) {
      toast.error("Please describe the problem you're solving");
      return;
    }
    setValidated(true);
    toast.success("Validation complete!");
  };

  const reset = () => {
    setValidated(false);
    setIdeaName("");
    setProblemStatement("");
    setTargetAudience("");
    setUniqueValue("");
    setMarketSize(5);
    setCompetition(5);
    setTechnicalFeasibility(5);
    setMonetization(5);
    setPersonalExpertise(5);
    setUrgency(5);
  };

  const shareResults = async () => {
    const text = `Startup Idea Validation: ${ideaName}
Score: ${totalScore}/100 - ${rating?.label} ${rating?.emoji}

Key Scores:
${scores.map((s) => `- ${s.category}: ${s.score}/${s.maxScore}`).join("\n")}

Validate your idea: techtrendi.com/tools/startup-validator`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Startup Idea Validator - Is Your Idea Worth Pursuing? | TechTrendi"
        description="Validate your startup idea with our scoring tool. Get feedback on market size, competition, and viability."
        canonicalUrl="https://techtrendi.com/tools/startup-validator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Startup Idea <span className="text-primary">Validator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Score your startup idea across key factors and see if it's worth pursuing
          </p>
        </div>

        {!validated ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Idea Basics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Your Idea
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Startup/Product Name</Label>
                  <Input
                    value={ideaName}
                    onChange={(e) => setIdeaName(e.target.value)}
                    placeholder="e.g., TaskFlow, BudgetBuddy, FitTrack"
                  />
                </div>
                <div className="space-y-2">
                  <Label>What problem are you solving? *</Label>
                  <Textarea
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    placeholder="Describe the pain point your product addresses..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Target & Value */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Target & Value
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Who is your target audience?</Label>
                  <Textarea
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., Small business owners who struggle with invoicing..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>What makes you different from competitors?</Label>
                  <Textarea
                    value={uniqueValue}
                    onChange={(e) => setUniqueValue(e.target.value)}
                    placeholder="Your unique selling point or advantage..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Market Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Market Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Market Size (potential customers)</Label>
                    <span className="text-sm font-medium">
                      {marketSize <= 3 ? "Niche" : marketSize <= 6 ? "Medium" : "Large"}
                    </span>
                  </div>
                  <Slider
                    value={[marketSize]}
                    onValueChange={([v]) => setMarketSize(v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Competition Level</Label>
                    <span className="text-sm font-medium">
                      {competition <= 3 ? "Low" : competition <= 6 ? "Medium" : "High"}
                    </span>
                  </div>
                  <Slider
                    value={[competition]}
                    onValueChange={([v]) => setCompetition(v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Monetization Clarity</Label>
                    <span className="text-sm font-medium">
                      {monetization <= 3 ? "Unclear" : monetization <= 6 ? "Some Ideas" : "Clear Plan"}
                    </span>
                  </div>
                  <Slider
                    value={[monetization]}
                    onValueChange={([v]) => setMonetization(v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={validate} size="lg" className="w-full">
              <Rocket className="w-5 h-5 mr-2" />
              Validate My Idea
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="border-primary/30">
              <CardContent className="pt-8 pb-8 text-center">
                <p className="text-4xl mb-2">{rating?.emoji}</p>
                <div className={cn("text-6xl font-bold mb-2", rating?.color)}>
                  {totalScore}/{maxScore}
                </div>
                <p className={cn("text-xl font-semibold", rating?.color)}>
                  {rating?.label}
                </p>
                <p className="text-muted-foreground mt-2">
                  {ideaName || "Your Idea"}
                </p>
              </CardContent>
            </Card>

            {/* Detailed Scores */}
            <div className="grid md:grid-cols-2 gap-4">
              {scores.map((score) => (
                <Card key={score.category}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        score.score >= score.maxScore * 0.7 ? "bg-green-500/20" :
                        score.score >= score.maxScore * 0.4 ? "bg-yellow-500/20" : "bg-red-500/20"
                      )}>
                        <score.icon className={cn(
                          "w-5 h-5",
                          score.score >= score.maxScore * 0.7 ? "text-green-500" :
                          score.score >= score.maxScore * 0.4 ? "text-yellow-500" : "text-red-500"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-semibold">{score.category}</p>
                          <span className="font-bold">{score.score}/{score.maxScore}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              score.score >= score.maxScore * 0.7 ? "bg-green-500" :
                              score.score >= score.maxScore * 0.4 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${(score.score / score.maxScore) * 100}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{score.feedback}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {totalScore < 60 && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Consider refining your idea before investing significant resources</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Talk to 10+ potential customers to validate the problem</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Research competitors deeply and find your unique angle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Build a simple MVP to test demand before scaling</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={reset} variant="outline" className="flex-1">
                Validate Another Idea
              </Button>
              <Button onClick={shareResults} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
