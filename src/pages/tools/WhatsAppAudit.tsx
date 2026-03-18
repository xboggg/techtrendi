import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Share2,
  Info,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

interface AuditQuestion {
  id: number;
  question: string;
  whyItMatters: string;
  severity: "critical" | "warning";
  fixSteps: string[];
}

const auditQuestions: AuditQuestion[] = [
  {
    id: 1,
    question: "Have you enabled Two-Step Verification on WhatsApp?",
    whyItMatters:
      "Two-Step Verification adds a PIN that prevents anyone from registering your number on a new device without it. Without this, a stolen SIM or intercepted SMS code gives full access to your account.",
    severity: "critical",
    fixSteps: [
      "Open WhatsApp and go to Settings",
      "Tap Account > Two-step verification",
      "Tap Enable and choose a 6-digit PIN you'll remember",
      "Enter an email address for recovery (optional but recommended)",
      "Tap Done to activate",
    ],
  },
  {
    id: 2,
    question: "Have you recently checked your linked devices for anything suspicious?",
    whyItMatters:
      "WhatsApp Web and linked devices can stay connected indefinitely. An attacker who briefly had access to your phone could have linked a device and is now reading all your messages remotely.",
    severity: "critical",
    fixSteps: [
      "Open WhatsApp and go to Settings",
      "Tap Linked Devices",
      "Review all active sessions listed",
      "Tap any device you don't recognize",
      "Tap Log Out to disconnect it",
      "Do this check at least once a month",
    ],
  },
  {
    id: 3,
    question: "Do you know never to share the 6-digit SMS verification code with anyone?",
    whyItMatters:
      "This is the #1 way WhatsApp accounts get hijacked. Scammers pose as friends, WhatsApp support, or delivery services to trick you into sharing the code. Once shared, they take over your account instantly.",
    severity: "critical",
    fixSteps: [
      "Remember: WhatsApp will NEVER ask for your code via message or call",
      "Never share the code even if the request comes from a trusted contact (their account may be hacked)",
      "If you accidentally shared it, immediately re-verify your number in WhatsApp",
      "Enable Two-Step Verification as a backup layer of protection",
    ],
  },
  {
    id: 4,
    question: "Is your profile picture hidden from non-contacts?",
    whyItMatters:
      "A visible profile picture can be downloaded and used for impersonation. Scammers create fake accounts with your photo to trick your contacts into sending money or sharing sensitive information.",
    severity: "warning",
    fixSteps: [
      "Open WhatsApp and go to Settings",
      "Tap Privacy",
      "Tap Profile Photo",
      "Select My Contacts (or Nobody for maximum privacy)",
    ],
  },
  {
    id: 5,
    question: "Is your Last Seen hidden from non-contacts?",
    whyItMatters:
      "Last Seen data reveals your activity patterns, when you're awake, and when you're online. Stalkers and social engineers use this information to track your habits and time their attacks.",
    severity: "warning",
    fixSteps: [
      "Open WhatsApp and go to Settings",
      "Tap Privacy",
      "Tap Last Seen & Online",
      "Set Last Seen to My Contacts or Nobody",
      "Optionally toggle off 'Who can see when I'm online'",
    ],
  },
  {
    id: 6,
    question: "Have you turned on disappearing messages for new chats?",
    whyItMatters:
      "Messages that persist forever create a growing archive of sensitive data. If your phone is lost, stolen, or compromised, all that history is exposed. Disappearing messages limit the damage window.",
    severity: "warning",
    fixSteps: [
      "Open WhatsApp and go to Settings",
      "Tap Privacy",
      "Tap Default Message Timer",
      "Choose a duration (24 hours, 7 days, or 90 days)",
      "This applies to all new chats going forward",
    ],
  },
  {
    id: 7,
    question: "Is your chat backup encrypted (end-to-end)?",
    whyItMatters:
      "WhatsApp messages are encrypted in transit, but cloud backups (Google Drive/iCloud) are not encrypted by default. Anyone who accesses your cloud account can read your entire chat history.",
    severity: "warning",
    fixSteps: [
      "Open WhatsApp and go to Settings",
      "Tap Chats > Chat Backup",
      "Tap End-to-end Encrypted Backup",
      "Tap Turn On",
      "Create a password or use a 64-digit encryption key",
      "Store this password somewhere safe; you cannot recover it",
    ],
  },
  {
    id: 8,
    question: "Are your group settings restricted so only your contacts can add you?",
    whyItMatters:
      "Open group settings let anyone add you to spam, scam, or malicious groups. These groups can expose your phone number to strangers and bombard you with phishing links.",
    severity: "warning",
    fixSteps: [
      "Open WhatsApp and go to Settings",
      "Tap Privacy",
      "Tap Groups",
      "Select My Contacts (or My Contacts Except... for more control)",
    ],
  },
  {
    id: 9,
    question: "Have you enabled fingerprint or face lock for WhatsApp?",
    whyItMatters:
      "If someone picks up your unlocked phone, they can open WhatsApp and read everything. App lock adds a biometric barrier even when the phone itself is unlocked.",
    severity: "warning",
    fixSteps: [
      "Open WhatsApp and go to Settings",
      "Tap Privacy",
      "Scroll down to App Lock (or Fingerprint Lock / Screen Lock)",
      "Toggle it on",
      "Choose how quickly it locks (Immediately is recommended)",
    ],
  },
  {
    id: 10,
    question: "Have you enabled the Silence Unknown Callers feature?",
    whyItMatters:
      "Spam and scam calls through WhatsApp are increasing. Unknown callers can also use voice calls to probe whether your number is active, making you a target for further attacks.",
    severity: "warning",
    fixSteps: [
      "Open WhatsApp and go to Settings",
      "Tap Privacy",
      "Scroll down to Calls",
      "Toggle on Silence Unknown Callers",
      "Unknown calls will still appear in your call log but won't ring",
    ],
  },
  {
    id: 11,
    question: "Are you careful not to screenshot sensitive conversations?",
    whyItMatters:
      "Screenshots of private conversations bypass end-to-end encryption. They can be forwarded, leaked, or found on your device. Once screenshotted, you lose all control over that information.",
    severity: "warning",
    fixSteps: [
      "Avoid screenshotting sensitive financial, medical, or personal chats",
      "Use View Once for photos and videos containing sensitive content",
      "If you must save information, write it down securely offline",
      "Regularly clear your phone's screenshot folder",
    ],
  },
  {
    id: 12,
    question: "Is your Status visible only to your contacts?",
    whyItMatters:
      "Status updates can reveal your location, activities, and personal life to anyone who has your number. This information can be used for social engineering, stalking, or targeted attacks.",
    severity: "warning",
    fixSteps: [
      "Open WhatsApp and go to Settings",
      "Tap Privacy",
      "Tap Status",
      "Select My Contacts (or My Contacts Except... to exclude specific people)",
    ],
  },
];

type Answer = "yes" | "no" | null;

export default function WhatsAppAudit() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(
    new Array(auditQuestions.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const progress = ((currentQuestion + 1) / auditQuestions.length) * 100;

  const handleAnswer = (answer: Answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const goNext = () => {
    if (currentQuestion < auditQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const resetAudit = () => {
    setCurrentQuestion(0);
    setAnswers(new Array(auditQuestions.length).fill(null));
    setShowResults(false);
    setExpandedCards(new Set());
  };

  const toggleCard = (id: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const yesCount = answers.filter((a) => a === "yes").length;
  const scorePercent = Math.round((yesCount / auditQuestions.length) * 100);

  const getVerdict = () => {
    if (scorePercent >= 80)
      return {
        label: "Well Secured",
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-950/30",
        border: "border-green-200 dark:border-green-800",
        description:
          "Your WhatsApp account is well protected. Keep these settings enabled and review them periodically.",
      };
    if (scorePercent >= 50)
      return {
        label: "Needs Improvement",
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
        border: "border-yellow-200 dark:border-yellow-800",
        description:
          "Your account has some protections but several gaps remain. Follow the fix guides below to strengthen your security.",
      };
    return {
      label: "High Risk Account",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      description:
        "Your WhatsApp account is vulnerable to common attacks. Take action on the critical items below immediately.",
    };
  };

  const gaps = auditQuestions.filter((_, i) => answers[i] === "no");
  const criticalGaps = gaps.filter((q) => q.severity === "critical");
  const warningGaps = gaps.filter((q) => q.severity === "warning");

  const handleShare = async () => {
    const text = `I scored ${scorePercent}% on the WhatsApp Security Audit! ${
      scorePercent >= 80
        ? "My account is well secured."
        : scorePercent >= 50
        ? "I have some improvements to make."
        : "Time to lock down my settings."
    } Check yours at TechTrendi.com`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "WhatsApp Security Audit", text });
        toast.success("Shared successfully!");
      } catch {
        await navigator.clipboard.writeText(text);
        toast.success("Score copied to clipboard!");
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Score copied to clipboard!");
    }
  };

  const question = auditQuestions[currentQuestion];

  return (
    <Layout>
      <SEOHead
        title="WhatsApp Security Audit | TechTrendi"
        description="Check if your WhatsApp is secure with this 12-question audit. Get a security score and step-by-step fix instructions for every gap."
      />

      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/40 px-4 py-1.5 text-green-700 dark:text-green-300 text-sm font-medium">
            <MessageCircle className="w-4 h-4" />
            WhatsApp Security
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            WhatsApp Security Audit
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Answer 12 quick questions to find out how secure your WhatsApp
            account really is. Get step-by-step fix guides for every gap.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* How It Works & Tips - shown before first answer */}
            {currentQuestion === 0 && answers[0] === null && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      How It Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1.5">
                    <p>1. Answer 12 yes/no questions about your settings</p>
                    <p>2. Get an instant security score</p>
                    <p>3. Fix every gap with step-by-step guides</p>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Top 3 Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1.5">
                    <p>
                      <strong>1.</strong> Enable Two-Step Verification &mdash;
                      the single most important setting
                    </p>
                    <p>
                      <strong>2.</strong> Never share your SMS verification code
                      with anyone
                    </p>
                    <p>
                      <strong>3.</strong> Check Linked Devices monthly for
                      unauthorized access
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Question {currentQuestion + 1} of {auditQuestions.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg leading-relaxed">
                    {question.question}
                  </CardTitle>
                  <Badge
                    variant={
                      question.severity === "critical"
                        ? "destructive"
                        : "secondary"
                    }
                    className="shrink-0"
                  >
                    {question.severity === "critical" ? (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    ) : (
                      <Shield className="w-3 h-3 mr-1" />
                    )}
                    {question.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>Why it matters:</strong> {question.whyItMatters}
                </p>

                {/* Answer Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={
                      answers[currentQuestion] === "yes"
                        ? "default"
                        : "outline"
                    }
                    className={cn(
                      "h-14 text-base",
                      answers[currentQuestion] === "yes" &&
                        "bg-green-600 hover:bg-green-700 text-white"
                    )}
                    onClick={() => handleAnswer("yes")}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Yes, I have
                  </Button>
                  <Button
                    variant={
                      answers[currentQuestion] === "no"
                        ? "default"
                        : "outline"
                    }
                    className={cn(
                      "h-14 text-base",
                      answers[currentQuestion] === "no" &&
                        "bg-red-600 hover:bg-red-700 text-white"
                    )}
                    onClick={() => handleAnswer("no")}
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    No / Not sure
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost"
                    onClick={goBack}
                    disabled={currentQuestion === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    onClick={goNext}
                    disabled={answers[currentQuestion] === null}
                  >
                    {currentQuestion === auditQuestions.length - 1
                      ? "See Results"
                      : "Next"}
                    {currentQuestion < auditQuestions.length - 1 && (
                      <ArrowRight className="w-4 h-4 ml-1" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Results Screen */
          <div className="space-y-6">
            {/* Score Card */}
            <Card
              className={cn(
                "border-2",
                getVerdict().border,
                getVerdict().bg
              )}
            >
              <CardContent className="pt-6 text-center space-y-4">
                <div
                  className={cn(
                    "text-6xl font-bold",
                    getVerdict().color
                  )}
                >
                  {scorePercent}%
                </div>
                <Badge
                  className={cn(
                    "text-base px-4 py-1",
                    scorePercent >= 80
                      ? "bg-green-600"
                      : scorePercent >= 50
                      ? "bg-yellow-600"
                      : "bg-red-600",
                    "text-white"
                  )}
                >
                  {getVerdict().label}
                </Badge>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {getVerdict().description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {yesCount} of {auditQuestions.length} security checks passed
                  {criticalGaps.length > 0 && (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {" "}
                      &middot; {criticalGaps.length} critical{" "}
                      {criticalGaps.length === 1 ? "gap" : "gaps"}
                    </span>
                  )}
                </p>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button onClick={handleShare} variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Score
                  </Button>
                  <Button onClick={resetAudit} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake Audit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gap Cards */}
            {gaps.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Fix Your Security Gaps ({gaps.length})
                </h2>

                {/* Critical gaps first */}
                {criticalGaps.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                      Critical
                    </p>
                    {criticalGaps.map((q) => (
                      <GapCard
                        key={q.id}
                        question={q}
                        expanded={expandedCards.has(q.id)}
                        onToggle={() => toggleCard(q.id)}
                      />
                    ))}
                  </div>
                )}

                {warningGaps.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                      Recommended
                    </p>
                    {warningGaps.map((q) => (
                      <GapCard
                        key={q.id}
                        question={q}
                        expanded={expandedCards.has(q.id)}
                        onToggle={() => toggleCard(q.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="pt-6 text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto" />
                  <p className="font-medium text-green-700 dark:text-green-300">
                    No security gaps found!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You've enabled all the recommended WhatsApp security
                    settings. Keep them active and review monthly.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function GapCard({
  question,
  expanded,
  onToggle,
}: {
  question: AuditQuestion;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      className={cn(
        "transition-colors",
        question.severity === "critical"
          ? "border-red-200 dark:border-red-900"
          : "border-yellow-200 dark:border-yellow-900"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <XCircle
            className={cn(
              "w-5 h-5 shrink-0",
              question.severity === "critical"
                ? "text-red-500"
                : "text-yellow-500"
            )}
          />
          <span className="font-medium text-sm sm:text-base truncate">
            {question.question}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 sm:px-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {question.whyItMatters}
          </p>
          <div className="space-y-2">
            <p className="text-sm font-semibold">How to fix:</p>
            <ol className="space-y-1.5">
              {question.fixSteps.map((step, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex gap-2"
                >
                  <span className="font-medium text-foreground shrink-0">
                    {i + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
