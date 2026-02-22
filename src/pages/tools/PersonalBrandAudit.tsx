import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User, Globe, Linkedin, Twitter, Instagram, Youtube, Github,
  CheckCircle2, XCircle, AlertTriangle, Share2, TrendingUp, Target,
  Sparkles, Award, Eye, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AuditSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  questions: {
    id: string;
    question: string;
    weight: number;
  }[];
}

const auditSections: AuditSection[] = [
  {
    id: "online-presence",
    title: "Online Presence",
    icon: Globe,
    questions: [
      { id: "website", question: "Do you have a personal website or portfolio?", weight: 15 },
      { id: "linkedin", question: "Is your LinkedIn profile complete and optimized?", weight: 12 },
      { id: "consistent-handle", question: "Do you use consistent handles across platforms?", weight: 8 },
      { id: "professional-photo", question: "Do you have a professional profile photo?", weight: 10 },
    ],
  },
  {
    id: "content-authority",
    title: "Content & Authority",
    icon: MessageSquare,
    questions: [
      { id: "regular-posting", question: "Do you post content regularly (at least weekly)?", weight: 10 },
      { id: "niche-focus", question: "Is your content focused on a specific niche or expertise?", weight: 12 },
      { id: "valuable-content", question: "Does your content provide value to your audience?", weight: 10 },
      { id: "engagement", question: "Do you engage with your community (comments, replies)?", weight: 8 },
    ],
  },
  {
    id: "credibility",
    title: "Credibility & Trust",
    icon: Award,
    questions: [
      { id: "testimonials", question: "Do you have testimonials or recommendations visible?", weight: 10 },
      { id: "credentials", question: "Are your credentials and experience clearly stated?", weight: 8 },
      { id: "featured", question: "Have you been featured in media, podcasts, or publications?", weight: 5 },
    ],
  },
];

export default function PersonalBrandAudit() {
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [socialFollowers, setSocialFollowers] = useState({
    linkedin: 0,
    twitter: 0,
    instagram: 0,
    youtube: 0,
  });
  const [audited, setAudited] = useState(false);

  const toggleAnswer = (id: string) => {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scores = useMemo(() => {
    if (!audited) return [];

    return auditSections.map((section) => {
      const maxScore = section.questions.reduce((sum, q) => sum + q.weight, 0);
      const score = section.questions.reduce(
        (sum, q) => sum + (answers[q.id] ? q.weight : 0),
        0
      );
      return {
        section: section.title,
        score,
        maxScore,
        percentage: Math.round((score / maxScore) * 100),
        icon: section.icon,
      };
    });
  }, [audited, answers]);

  const totalScore = useMemo(() => {
    return scores.reduce((sum, s) => sum + s.score, 0);
  }, [scores]);

  const maxScore = auditSections.reduce(
    (sum, s) => sum + s.questions.reduce((qSum, q) => qSum + q.weight, 0),
    0
  );

  const socialScore = useMemo(() => {
    let score = 0;
    const total = Object.values(socialFollowers).reduce((a, b) => a + b, 0);
    if (total >= 10000) score = 20;
    else if (total >= 5000) score = 15;
    else if (total >= 1000) score = 10;
    else if (total >= 100) score = 5;
    return score;
  }, [socialFollowers]);

  const finalScore = totalScore + socialScore;
  const finalMaxScore = maxScore + 20;
  const percentage = Math.round((finalScore / finalMaxScore) * 100);

  const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: "A+", label: "Exceptional", color: "text-green-500" };
    if (pct >= 80) return { grade: "A", label: "Strong", color: "text-green-500" };
    if (pct >= 70) return { grade: "B", label: "Good", color: "text-blue-500" };
    if (pct >= 60) return { grade: "C", label: "Average", color: "text-yellow-500" };
    if (pct >= 50) return { grade: "D", label: "Needs Work", color: "text-orange-500" };
    return { grade: "F", label: "Poor", color: "text-red-500" };
  };

  const grade = audited ? getGrade(percentage) : null;

  const runAudit = () => {
    setAudited(true);
    toast.success("Audit complete!");
  };

  const reset = () => {
    setAudited(false);
    setAnswers({});
    setName("");
    setSocialFollowers({ linkedin: 0, twitter: 0, instagram: 0, youtube: 0 });
  };

  const shareResults = async () => {
    const text = `Personal Brand Audit Results:
Grade: ${grade?.grade} (${grade?.label})
Score: ${finalScore}/${finalMaxScore} (${percentage}%)

${scores.map((s) => `${s.section}: ${s.percentage}%`).join("\n")}

Audit your brand: techtrendi.com/tools/personal-brand-audit`;

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
        title="Personal Brand Audit - Check Your Online Presence | TechTrendi"
        description="Audit your personal brand and online presence. Get actionable tips to improve your visibility and credibility."
        canonicalUrl="https://techtrendi.com/tools/personal-brand-audit"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Personal Brand <span className="text-primary">Audit</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Evaluate your online presence and get tips to strengthen your personal brand
          </p>
        </div>

        {!audited ? (
          <div className="space-y-6">
            {/* Name */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label>Your Name (optional)</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="For your personalized report"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Audit Questions */}
            {auditSections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <section.icon className="w-4 h-4" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.questions.map((q) => (
                    <div key={q.id} className="flex items-start gap-3">
                      <Checkbox
                        id={q.id}
                        checked={answers[q.id] || false}
                        onCheckedChange={() => toggleAnswer(q.id)}
                      />
                      <label
                        htmlFor={q.id}
                        className="text-sm cursor-pointer leading-tight"
                      >
                        {q.question}
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Social Following */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Social Media Reach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </Label>
                    <Input
                      type="number"
                      value={socialFollowers.linkedin || ""}
                      onChange={(e) =>
                        setSocialFollowers((prev) => ({
                          ...prev,
                          linkedin: Number(e.target.value),
                        }))
                      }
                      placeholder="Followers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Twitter className="w-4 h-4" /> Twitter/X
                    </Label>
                    <Input
                      type="number"
                      value={socialFollowers.twitter || ""}
                      onChange={(e) =>
                        setSocialFollowers((prev) => ({
                          ...prev,
                          twitter: Number(e.target.value),
                        }))
                      }
                      placeholder="Followers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" /> Instagram
                    </Label>
                    <Input
                      type="number"
                      value={socialFollowers.instagram || ""}
                      onChange={(e) =>
                        setSocialFollowers((prev) => ({
                          ...prev,
                          instagram: Number(e.target.value),
                        }))
                      }
                      placeholder="Followers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Youtube className="w-4 h-4" /> YouTube
                    </Label>
                    <Input
                      type="number"
                      value={socialFollowers.youtube || ""}
                      onChange={(e) =>
                        setSocialFollowers((prev) => ({
                          ...prev,
                          youtube: Number(e.target.value),
                        }))
                      }
                      placeholder="Subscribers"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={runAudit} size="lg" className="w-full">
              <Sparkles className="w-5 h-5 mr-2" />
              Run Brand Audit
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Grade */}
            <Card className="border-primary/30">
              <CardContent className="pt-8 pb-8 text-center">
                <div className={cn("text-7xl font-bold mb-2", grade?.color)}>
                  {grade?.grade}
                </div>
                <p className={cn("text-xl font-semibold", grade?.color)}>
                  {grade?.label} Personal Brand
                </p>
                <p className="text-muted-foreground mt-2">
                  {name ? `${name}'s` : "Your"} Score: {finalScore}/{finalMaxScore} ({percentage}%)
                </p>
              </CardContent>
            </Card>

            {/* Section Scores */}
            <div className="grid md:grid-cols-3 gap-4">
              {scores.map((score) => (
                <Card key={score.section}>
                  <CardContent className="pt-6 text-center">
                    <score.icon className={cn(
                      "w-8 h-8 mx-auto mb-2",
                      score.percentage >= 70 ? "text-green-500" :
                      score.percentage >= 50 ? "text-yellow-500" : "text-red-500"
                    )} />
                    <p className="text-2xl font-bold">{score.percentage}%</p>
                    <p className="text-sm text-muted-foreground">{score.section}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {auditSections.flatMap((section) =>
                    section.questions
                      .filter((q) => !answers[q.id])
                      .map((q) => (
                        <li key={q.id} className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{q.question}</span>
                        </li>
                      ))
                  )}
                  {Object.values(answers).every((a) => a) && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Great job! You've covered all the basics.</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Quick Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Update your LinkedIn headline to include keywords
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Post valuable content at least 3x per week
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Request testimonials from clients or colleagues
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Create a simple personal website or portfolio
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={reset} variant="outline" className="flex-1">
                Start New Audit
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
