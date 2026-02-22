import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Mail, AlertTriangle, CheckCircle2, XCircle, Lightbulb, RotateCcw,
  Sparkles, Clock, Smartphone, Eye, TrendingUp, Copy, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AnalysisResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  issues: { type: "error" | "warning" | "success"; message: string }[];
  suggestions: string[];
  stats: {
    charCount: number;
    wordCount: number;
    hasEmoji: boolean;
    hasNumber: boolean;
    hasQuestion: boolean;
    hasUrgency: boolean;
    hasPersonalization: boolean;
    spamScore: number;
  };
}

const spamTriggerWords = [
  "free", "winner", "congratulations", "urgent", "act now", "limited time",
  "click here", "buy now", "order now", "special offer", "exclusive deal",
  "100%", "guarantee", "no obligation", "risk-free", "cash", "money",
  "earn money", "make money", "extra income", "billion", "million",
  "credit card", "loan", "insurance", "mortgage", "debt", "bankruptcy"
];

const powerWords = [
  "exclusive", "limited", "secret", "proven", "discover", "unlock",
  "instant", "now", "today", "new", "introducing", "finally",
  "breakthrough", "revolutionary", "simple", "easy", "quick", "fast"
];

const analyzeSubjectLine = (subject: string): AnalysisResult => {
  const issues: AnalysisResult["issues"] = [];
  const suggestions: string[] = [];
  let score = 100;

  const charCount = subject.length;
  const wordCount = subject.trim().split(/\s+/).filter(Boolean).length;
  const hasEmoji = /\p{Emoji}/u.test(subject);
  const hasNumber = /\d/.test(subject);
  const hasQuestion = subject.includes("?");
  const hasUrgency = /urgent|now|today|limited|last chance|ending/i.test(subject);
  const hasPersonalization = /\{|%|{{|\[name\]|\[first/i.test(subject);
  const lowerSubject = subject.toLowerCase();

  // Check spam words
  let spamWordsFound = 0;
  spamTriggerWords.forEach(word => {
    if (lowerSubject.includes(word.toLowerCase())) {
      spamWordsFound++;
    }
  });
  const spamScore = Math.min(100, spamWordsFound * 20);

  // Length analysis
  if (charCount === 0) {
    return {
      score: 0,
      grade: "F",
      issues: [{ type: "error", message: "Enter a subject line to analyze" }],
      suggestions: [],
      stats: { charCount: 0, wordCount: 0, hasEmoji: false, hasNumber: false, hasQuestion: false, hasUrgency: false, hasPersonalization: false, spamScore: 0 }
    };
  }

  if (charCount < 20) {
    issues.push({ type: "warning", message: "Subject line is too short. Aim for 30-50 characters." });
    suggestions.push("Add more descriptive words to improve engagement");
    score -= 15;
  } else if (charCount > 60) {
    issues.push({ type: "warning", message: "Subject line may be cut off on mobile (60+ chars)" });
    suggestions.push("Shorten to ensure it displays fully on all devices");
    score -= 10;
  } else if (charCount >= 30 && charCount <= 50) {
    issues.push({ type: "success", message: "Perfect length for most email clients" });
  }

  // Word count
  if (wordCount < 3) {
    issues.push({ type: "warning", message: "Too few words - may lack context" });
    score -= 10;
  } else if (wordCount > 9) {
    issues.push({ type: "warning", message: "Too many words - keep it concise" });
    score -= 10;
  } else {
    issues.push({ type: "success", message: "Good word count (4-9 words)" });
  }

  // Spam analysis
  if (spamScore > 40) {
    issues.push({ type: "error", message: "High spam risk! Contains multiple spam trigger words" });
    suggestions.push("Remove or replace spam trigger words to improve deliverability");
    score -= 30;
  } else if (spamScore > 20) {
    issues.push({ type: "warning", message: "Contains some spam trigger words" });
    suggestions.push("Consider replacing words that might trigger spam filters");
    score -= 15;
  } else {
    issues.push({ type: "success", message: "Low spam risk" });
  }

  // ALL CAPS check
  if (subject === subject.toUpperCase() && charCount > 5) {
    issues.push({ type: "error", message: "ALL CAPS looks spammy and aggressive" });
    suggestions.push("Use sentence case or title case instead");
    score -= 25;
  }

  // Emoji check
  if (hasEmoji) {
    issues.push({ type: "success", message: "Emoji can increase open rates by 56%" });
    score += 5;
  } else {
    suggestions.push("Consider adding an emoji to stand out in the inbox");
  }

  // Number check
  if (hasNumber) {
    issues.push({ type: "success", message: "Numbers grab attention and add specificity" });
    score += 5;
  } else {
    suggestions.push("Try adding a number (e.g., '5 tips', '24 hours')");
  }

  // Question check
  if (hasQuestion) {
    issues.push({ type: "success", message: "Questions can increase curiosity and engagement" });
    score += 5;
  }

  // Power words
  let powerWordsFound = 0;
  powerWords.forEach(word => {
    if (lowerSubject.includes(word.toLowerCase())) {
      powerWordsFound++;
    }
  });
  if (powerWordsFound > 0) {
    issues.push({ type: "success", message: `Contains ${powerWordsFound} power word(s)` });
    score += powerWordsFound * 3;
  } else {
    suggestions.push("Add power words like 'exclusive', 'proven', or 'instant'");
  }

  // Personalization
  if (hasPersonalization) {
    issues.push({ type: "success", message: "Personalization can boost open rates by 26%" });
    score += 10;
  } else {
    suggestions.push("Consider adding personalization like [First Name]");
  }

  // Exclamation marks
  const exclamationCount = (subject.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    issues.push({ type: "warning", message: "Multiple exclamation marks look spammy" });
    score -= 10;
  }

  // Calculate final score and grade
  score = Math.max(0, Math.min(100, score));
  let grade: AnalysisResult["grade"];
  if (score >= 90) grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 40) grade = "D";
  else grade = "F";

  return {
    score,
    grade,
    issues,
    suggestions: suggestions.slice(0, 4),
    stats: {
      charCount,
      wordCount,
      hasEmoji,
      hasNumber,
      hasQuestion,
      hasUrgency,
      hasPersonalization,
      spamScore
    }
  };
};

const exampleSubjects = [
  "🎉 Your exclusive 50% discount expires tonight",
  "John, here's your weekly report",
  "5 proven ways to double your productivity",
  "Quick question about your project",
  "FREE!!! CLICK NOW TO WIN $1000!!!",
  "The secret tool top performers use daily"
];

export default function EmailSubjectTester() {
  const [subject, setSubject] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = () => {
    const analysis = analyzeSubjectLine(subject);
    setResult(analysis);
  };

  const handleExample = (example: string) => {
    setSubject(example);
    setResult(analyzeSubjectLine(example));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(subject);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-green-500 bg-green-500/10 border-green-500/30";
      case "B": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      case "C": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "D": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "F": return "text-red-500 bg-red-500/10 border-red-500/30";
      default: return "text-gray-500 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Layout>
      <SEOHead
        title="Email Subject Line Tester - Score Your Subject Lines | TechTrendi"
        description="Test and optimize your email subject lines for better open rates. Get instant feedback on length, spam triggers, and engagement factors."
        canonicalUrl="https://techtrendi.com/tools/email-subject-tester"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Email Subject Line <span className="text-primary">Tester</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Score your subject lines before you send. Optimize for higher open rates.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Enter Your Subject Line
            </CardTitle>
            <CardDescription>Type or paste your email subject line to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., 🎉 Your exclusive offer expires tonight!"
                className="text-lg h-12"
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
              <Button onClick={handleAnalyze} size="lg" className="h-12 px-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{subject.length} characters</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setSubject(""); setResult(null); }}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                {subject && (
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    Copy
                  </Button>
                )}
              </div>
            </div>

            {/* Example subjects */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {exampleSubjects.slice(0, 3).map((ex, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleExample(ex)}
                  >
                    {ex.substring(0, 30)}...
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && result.stats.charCount > 0 && (
          <div className="space-y-6">
            {/* Score Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Grade Circle */}
                  <div className={cn(
                    "w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center",
                    getGradeColor(result.grade)
                  )}>
                    <span className="text-5xl font-bold">{result.grade}</span>
                    <span className="text-sm opacity-70">Grade</span>
                  </div>

                  {/* Score Bar */}
                  <div className="flex-1 w-full">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Overall Score</span>
                      <span className="font-bold text-2xl">{result.score}/100</span>
                    </div>
                    <Progress value={result.score} className={cn("h-3", getScoreColor(result.score))} />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-foreground">{result.stats.charCount}</div>
                        <div className="text-xs text-muted-foreground">Characters</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-foreground">{result.stats.wordCount}</div>
                        <div className="text-xs text-muted-foreground">Words</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className={cn(
                          "text-2xl font-bold",
                          result.stats.spamScore > 40 ? "text-red-500" : result.stats.spamScore > 20 ? "text-yellow-500" : "text-green-500"
                        )}>
                          {result.stats.spamScore}%
                        </div>
                        <div className="text-xs text-muted-foreground">Spam Risk</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-center gap-1">
                          {result.stats.hasEmoji && <span>✓</span>}
                          {result.stats.hasNumber && <span>#</span>}
                          {result.stats.hasQuestion && <span>?</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">Elements</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issues & Suggestions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {issue.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                        {issue.type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                        {issue.type === "error" && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                        <span className="text-sm">{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.suggestions.length > 0 ? (
                    <ul className="space-y-3">
                      {result.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Great job! Your subject line is well optimized.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Inbox Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 space-y-3">
                  {/* Desktop Preview */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">Your Company</div>
                        <div className="text-foreground font-medium truncate">{subject}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1" />
                        2m ago
                      </div>
                    </div>
                  </div>

                  {/* Mobile Preview */}
                  <div className="max-w-[320px] mx-auto">
                    <p className="text-xs text-muted-foreground mb-2 text-center">Mobile Preview</p>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-sm mb-1">Your Company</div>
                      <div className="text-foreground text-sm truncate">{subject.substring(0, 40)}{subject.length > 40 ? "..." : ""}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Email Subject Line Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2 text-foreground">Do:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Keep it 30-50 characters</li>
                  <li>• Use numbers for specificity</li>
                  <li>• Add emojis sparingly</li>
                  <li>• Personalize when possible</li>
                  <li>• Create urgency (honestly)</li>
                  <li>• A/B test your subject lines</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-foreground">Don't:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Use ALL CAPS</li>
                  <li>• Use multiple exclamation marks!!!</li>
                  <li>• Use spam trigger words</li>
                  <li>• Be misleading or clickbaity</li>
                  <li>• Make it too long (60+ chars)</li>
                  <li>• Forget mobile users</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
