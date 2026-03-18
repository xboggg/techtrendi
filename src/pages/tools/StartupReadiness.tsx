import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Rocket, DollarSign, Users, Brain, Shield, Clock, Network,
  CheckCircle2, AlertTriangle, XCircle, RotateCcw, Lightbulb,
  ChevronRight, ChevronLeft, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Question {
  id: string;
  dimension: string;
  icon: React.ComponentType<{ className?: string }>;
  question: string;
  options: { label: string; score: number }[];
}

const questions: Question[] = [
  {
    id: "financial",
    dimension: "Financial Runway",
    icon: DollarSign,
    question: "How many months of personal living expenses do you have saved up?",
    options: [
      { label: "Less than 3 months", score: 15 },
      { label: "3-6 months", score: 45 },
      { label: "6-12 months", score: 75 },
      { label: "12+ months or alternative income", score: 100 },
    ],
  },
  {
    id: "validation",
    dimension: "Validation",
    icon: Users,
    question: "How much customer research or validation have you done for your idea?",
    options: [
      { label: "None — it's just an idea so far", score: 0 },
      { label: "Talked to a few friends/family", score: 30 },
      { label: "Surveyed or interviewed 10+ potential customers", score: 70 },
      { label: "Have pre-orders, waitlist sign-ups, or a working prototype with user feedback", score: 100 },
    ],
  },
  {
    id: "skills",
    dimension: "Relevant Skills",
    icon: Brain,
    question: "How relevant is your current skill set to the business you want to start?",
    options: [
      { label: "I'd be learning everything from scratch", score: 10 },
      { label: "I have some transferable skills", score: 40 },
      { label: "I have strong skills in the core area", score: 75 },
      { label: "I'm an expert in this domain with years of experience", score: 100 },
    ],
  },
  {
    id: "mindset",
    dimension: "Risk Tolerance",
    icon: Shield,
    question: "How do you feel about financial uncertainty and potential failure?",
    options: [
      { label: "It terrifies me — I need guaranteed income", score: 10 },
      { label: "I'm nervous but willing to try if the risk is small", score: 40 },
      { label: "I'm comfortable with calculated risks", score: 70 },
      { label: "I thrive under uncertainty — failure is just a lesson", score: 100 },
    ],
  },
  {
    id: "differentiation",
    dimension: "Competitive Edge",
    icon: Trophy,
    question: "What makes your business idea different from existing solutions?",
    options: [
      { label: "I'm not sure — there's a lot of competition", score: 10 },
      { label: "It's a slightly better version of what exists", score: 35 },
      { label: "I have a unique angle or underserved niche", score: 70 },
      { label: "I have a proprietary advantage (tech, patent, exclusive access, deep expertise)", score: 100 },
    ],
  },
  {
    id: "commitment",
    dimension: "Time Commitment",
    icon: Clock,
    question: "How much time can you realistically dedicate to this venture?",
    options: [
      { label: "A few hours per week at most", score: 15 },
      { label: "10-20 hours per week (side hustle)", score: 45 },
      { label: "30-40 hours per week", score: 75 },
      { label: "Full-time (40+ hours per week, all in)", score: 100 },
    ],
  },
  {
    id: "network",
    dimension: "Support Network",
    icon: Network,
    question: "What kind of support system do you have?",
    options: [
      { label: "I'm going at this completely alone", score: 10 },
      { label: "Friends and family are supportive but can't help professionally", score: 35 },
      { label: "I have a mentor or co-founder", score: 70 },
      { label: "I have mentors, advisors, potential partners, and/or a co-founder with complementary skills", score: 100 },
    ],
  },
];

const dimensionColors: Record<string, string> = {
  "Financial Runway": "bg-emerald-500",
  Validation: "bg-blue-500",
  "Relevant Skills": "bg-purple-500",
  "Risk Tolerance": "bg-amber-500",
  "Competitive Edge": "bg-rose-500",
  "Time Commitment": "bg-cyan-500",
  "Support Network": "bg-indigo-500",
};

const getAdvice = (id: string, score: number): string => {
  if (score >= 70) return "";
  const adviceMap: Record<string, string> = {
    financial:
      "Build a financial cushion before going full-time. Aim for at least 6 months of expenses saved. Consider starting as a side hustle to reduce risk.",
    validation:
      "Do not build before you validate. Talk to at least 20 potential customers. Run a landing page test or create a simple MVP to gauge real interest.",
    skills:
      "Identify your skill gaps and close them fast. Take focused courses, find a co-founder with complementary skills, or hire freelancers for areas outside your expertise.",
    mindset:
      "Work on building your risk tolerance gradually. Start with small bets, read about other founders' journeys, and consider therapy or coaching to manage anxiety.",
    differentiation:
      "Study your competitors deeply. Find what they are missing. Talk to their unhappy customers. Your edge could be price, speed, niche focus, or better UX.",
    commitment:
      "Be honest about your available time. If you cannot commit at least 20 hours/week, consider waiting or simplifying your business model to something leaner.",
    network:
      "Start building your network now. Join startup communities, attend meetups, find a mentor on platforms like MicroMentor or SCORE. A co-founder can double your speed.",
  };
  return adviceMap[id] || "";
};

export default function StartupReadiness() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const progressPercent = (answeredCount / questions.length) * 100;

  const selectAnswer = (questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ((c) => c + 1), 300);
    }
  };

  const overallScore = useMemo(() => {
    if (!allAnswered) return 0;
    const total = Object.values(answers).reduce((a, b) => a + b, 0);
    return Math.round(total / questions.length);
  }, [answers, allAnswered]);

  const verdict = useMemo(() => {
    if (overallScore >= 70)
      return { label: "READY TO LAUNCH", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40", icon: CheckCircle2 };
    if (overallScore >= 50)
      return { label: "GETTING CLOSER", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/40", icon: AlertTriangle };
    return { label: "NOT YET", color: "text-rose-400", bg: "bg-rose-500/20 border-rose-500/40", icon: XCircle };
  }, [overallScore]);

  const weakAreas = useMemo(() => {
    return questions
      .filter((q) => (answers[q.id] ?? 0) < 50)
      .map((q) => ({ ...q, score: answers[q.id] ?? 0, advice: getAdvice(q.id, answers[q.id] ?? 0) }));
  }, [answers]);

  const handleShowResults = () => {
    if (!allAnswered) {
      toast.error("Please answer all 7 questions first");
      return;
    }
    setShowResults(true);
  };

  const reset = () => {
    setAnswers({});
    setCurrentQ(0);
    setShowResults(false);
  };

  const q = questions[currentQ];

  return (
    <Layout>
      <SEOHead
        title="Startup Readiness Calculator | TechTrendi"
        description="Find out if you're ready to launch your startup with this free readiness quiz. Assess your finances, skills, validation, and more."
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-4">
              <Rocket className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Startup Readiness Calculator</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Are You Ready to Launch?
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Answer 7 quick questions to get a personalized readiness score and actionable advice.
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>{answeredCount} of {questions.length} answered</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-slate-800" />
          </div>

          {!showResults ? (
            <>
              {/* Question Card */}
              <Card className="bg-slate-900/80 border-slate-700/60 mb-6">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <q.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-slate-400 border-slate-600 mb-1 text-xs">
                        {q.dimension}
                      </Badge>
                      <CardTitle className="text-white text-lg">{q.question}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {q.options.map((opt, i) => {
                    const isSelected = answers[q.id] === opt.score;
                    return (
                      <button
                        key={i}
                        onClick={() => selectAnswer(q.id, opt.score)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg border transition-all duration-200",
                          isSelected
                            ? "bg-blue-600/30 border-blue-500 text-blue-100"
                            : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                              isSelected ? "border-blue-400 bg-blue-500" : "border-slate-600"
                            )}
                          >
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="text-sm">{opt.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
                  disabled={currentQ === 0}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>

                {currentQ < questions.length - 1 ? (
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentQ((c) => c + 1)}
                    className="text-slate-400 hover:text-white"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleShowResults}
                    disabled={!allAnswered}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Rocket className="w-4 h-4 mr-2" /> See Results
                  </Button>
                )}
              </div>

              {/* Question dots */}
              <div className="flex justify-center gap-2 mt-6">
                {questions.map((qItem, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQ(i)}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      i === currentQ
                        ? "bg-blue-500 scale-125"
                        : answers[qItem.id] !== undefined
                        ? "bg-blue-400/50"
                        : "bg-slate-700"
                    )}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Results */}
              <Card className={cn("border mb-8", verdict.bg)}>
                <CardContent className="pt-8 pb-8 text-center">
                  <verdict.icon className={cn("w-16 h-16 mx-auto mb-4", verdict.color)} />
                  <div className="text-6xl font-bold text-white mb-2">{overallScore}</div>
                  <div className="text-slate-400 text-sm mb-3">out of 100</div>
                  <div className={cn("text-2xl font-bold", verdict.color)}>{verdict.label}</div>
                  <p className="text-slate-400 mt-3 max-w-md mx-auto text-sm">
                    {overallScore >= 70
                      ? "You have a strong foundation. The stars may never align perfectly — consider taking the leap."
                      : overallScore >= 50
                      ? "You're making progress but have some gaps to address. Focus on your weak areas before going all-in."
                      : "You have important groundwork to lay before launching. Use the advice below to strengthen your position."}
                  </p>
                </CardContent>
              </Card>

              {/* Dimension Breakdown */}
              <Card className="bg-slate-900/80 border-slate-700/60 mb-8">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Dimension Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questions.map((qItem) => {
                    const score = answers[qItem.id] ?? 0;
                    const barColor = dimensionColors[qItem.dimension] || "bg-blue-500";
                    return (
                      <div key={qItem.id}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <qItem.icon className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-300">{qItem.dimension}</span>
                          </div>
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-rose-400"
                            )}
                          >
                            {score}
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", barColor)}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Personalized Advice */}
              {weakAreas.length > 0 && (
                <Card className="bg-slate-900/80 border-slate-700/60 mb-8">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      Areas to Strengthen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {weakAreas.map((area) => (
                      <div
                        key={area.id}
                        className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <area.icon className="w-4 h-4 text-amber-400" />
                          <span className="text-white font-medium text-sm">{area.dimension}</span>
                          <Badge variant="outline" className="text-rose-400 border-rose-500/40 text-xs ml-auto">
                            Score: {area.score}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">{area.advice}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Reset */}
              <div className="text-center">
                <Button onClick={reset} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  <RotateCcw className="w-4 h-4 mr-2" /> Retake Quiz
                </Button>
              </div>
            </>
          )}

          {/* How It Works / Tips */}
          <Card className="bg-slate-900/80 border-slate-700/60 mt-12">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-400" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-slate-400 text-sm leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">1.</span>
                  <span>
                    <strong className="text-slate-200">Startup readiness</strong> measures how prepared you are across the dimensions that matter most — finances, validation, skills, mindset, differentiation, commitment, and network. A high score does not guarantee success, but it shows you have a solid foundation.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">2.</span>
                  <span>
                    <strong className="text-slate-200">Financial runway is critical.</strong> Most startups take 12-18 months to become profitable. Having at least 6 months of living expenses saved gives you breathing room to iterate without desperation.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">3.</span>
                  <span>
                    <strong className="text-slate-200">Validation comes before building.</strong> The biggest mistake first-time founders make is spending months building something nobody wants. Talk to real potential customers before writing a single line of code or spending money.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">4.</span>
                  <span>
                    <strong className="text-slate-200">No one is 100% ready.</strong> A score of 70+ means you have enough going for you to start learning by doing. Waiting for perfect conditions means waiting forever.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">5.</span>
                  <span>
                    <strong className="text-slate-200">Focus on your weakest dimension.</strong> Improving your lowest score has a bigger impact than making a strong area even stronger. Use the personalized advice above to create a concrete action plan.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
