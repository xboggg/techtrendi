import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

type ThreatCategory =
  | "password"
  | "authentication"
  | "phishing"
  | "network"
  | "backup"
  | "patching"
  | "physical"
  | "malware"
  | "privacy"
  | "monitoring";

interface Option {
  text: string;
  score: number;
  bad?: boolean;
}

interface Question {
  id: number;
  question: string;
  category: ThreatCategory;
  options: Option[];
}

const categoryLabels: Record<ThreatCategory, string> = {
  password: "Password Hygiene",
  authentication: "Authentication",
  phishing: "Phishing Awareness",
  network: "Network Security",
  backup: "Data Backup",
  patching: "Software Patching",
  physical: "Physical Security",
  malware: "Malware Protection",
  privacy: "Privacy Practices",
  monitoring: "Account Monitoring",
};

const categoryIcons: Record<ThreatCategory, string> = {
  password: "🔑",
  authentication: "🔐",
  phishing: "🎣",
  network: "🌐",
  backup: "💾",
  patching: "🔄",
  physical: "🔒",
  malware: "🛡️",
  privacy: "👁️",
  monitoring: "📊",
};

const questions: Question[] = [
  {
    id: 1,
    question: "How do you create passwords for your online accounts?",
    category: "password",
    options: [
      {
        text: "I use a unique, complex password (12+ characters with mixed types) for each account",
        score: 100,
      },
      {
        text: "I use strong passwords but reuse them across a few sites",
        score: 60,
      },
      {
        text: "I use simple but different passwords for each site",
        score: 30,
      },
      {
        text: "I use the same password everywhere",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 2,
    question: "How often do you update your operating system and apps?",
    category: "patching",
    options: [
      {
        text: "I enable automatic updates and install them as soon as they're available",
        score: 100,
      },
      {
        text: "I update within a week of being notified",
        score: 70,
      },
      {
        text: "I update occasionally when I remember",
        score: 30,
      },
      {
        text: "I rarely or never update — updates are annoying",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 3,
    question: "Do you use two-factor authentication (2FA)?",
    category: "authentication",
    options: [
      {
        text: "Yes, on all accounts that support it, using an authenticator app or hardware key",
        score: 100,
      },
      {
        text: "Yes, but only via SMS codes on important accounts",
        score: 60,
      },
      {
        text: "Only on one or two accounts",
        score: 30,
      },
      {
        text: "No, I don't use 2FA at all",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 4,
    question:
      "You receive an urgent email from your bank asking you to verify your account. What do you do?",
    category: "phishing",
    options: [
      {
        text: "I never click links in emails — I go directly to the bank's website or call them",
        score: 100,
      },
      {
        text: "I check the sender address and hover over links before deciding",
        score: 70,
      },
      {
        text: "I click the link if it looks legitimate",
        score: 20,
        bad: true,
      },
      {
        text: "I click immediately — it's from my bank so it must be real",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 5,
    question: "How do you handle public Wi-Fi (coffee shops, airports, hotels)?",
    category: "network",
    options: [
      {
        text: "I always use a VPN when on public Wi-Fi, or I avoid it entirely",
        score: 100,
      },
      {
        text: "I use public Wi-Fi but avoid logging into sensitive accounts",
        score: 60,
      },
      {
        text: "I use public Wi-Fi for everything but only on HTTPS sites",
        score: 30,
      },
      {
        text: "I connect to any open Wi-Fi and use it freely",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 6,
    question: "How do you back up your important files and data?",
    category: "backup",
    options: [
      {
        text: "I use the 3-2-1 rule: 3 copies, 2 different media, 1 offsite/cloud",
        score: 100,
      },
      {
        text: "I back up to the cloud regularly (e.g., Google Drive, iCloud)",
        score: 70,
      },
      {
        text: "I back up occasionally to a USB drive",
        score: 30,
      },
      {
        text: "I don't back up my data",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 7,
    question: "What happens when you walk away from your computer or phone?",
    category: "physical",
    options: [
      {
        text: "It locks automatically within 1 minute and requires biometric or strong PIN",
        score: 100,
      },
      {
        text: "It locks automatically within 5 minutes with a password",
        score: 70,
      },
      {
        text: "I manually lock it sometimes but often forget",
        score: 30,
      },
      {
        text: "My devices don't have a lock screen / I disabled it",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 8,
    question: "How do you store your passwords?",
    category: "password",
    options: [
      {
        text: "I use a reputable password manager (Bitwarden, 1Password, etc.)",
        score: 100,
      },
      {
        text: "I use my browser's built-in password saver",
        score: 60,
      },
      {
        text: "I write them down in a notebook kept in a safe place",
        score: 30,
      },
      {
        text: "I memorize them or keep them in a notes app / sticky note",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 9,
    question: "Do you check for HTTPS (the padlock icon) before entering sensitive information?",
    category: "network",
    options: [
      {
        text: "Always — I also verify the domain name matches the legitimate site",
        score: 100,
      },
      {
        text: "I look for the padlock but don't check the domain closely",
        score: 60,
      },
      {
        text: "Sometimes, if I remember",
        score: 30,
      },
      {
        text: "I never check — what's HTTPS?",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 10,
    question: "Have you ever shared your password with someone?",
    category: "password",
    options: [
      {
        text: "Never — I use shared vaults or account delegation features instead",
        score: 100,
      },
      {
        text: "Only with a trusted family member for emergencies, securely",
        score: 60,
      },
      {
        text: "Yes, I've texted or emailed a password before",
        score: 20,
        bad: true,
      },
      {
        text: "Yes, I share passwords regularly with friends/family/coworkers",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 11,
    question: "What antivirus / endpoint protection do you use?",
    category: "malware",
    options: [
      {
        text: "I use a reputable, regularly updated security suite with real-time protection",
        score: 100,
      },
      {
        text: "I rely on built-in protection (Windows Defender / macOS XProtect)",
        score: 70,
      },
      {
        text: "I have antivirus installed but it's probably outdated",
        score: 30,
      },
      {
        text: "I don't use any antivirus software",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 12,
    question: "When installing a new app, do you review its permissions?",
    category: "privacy",
    options: [
      {
        text: "Always — I deny unnecessary permissions and use privacy-focused alternatives",
        score: 100,
      },
      {
        text: "I skim the permissions and deny ones that seem excessive",
        score: 70,
      },
      {
        text: "I approve everything to get the app working quickly",
        score: 20,
        bad: true,
      },
      {
        text: "I don't even know apps ask for permissions",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 13,
    question:
      "A friend's account sends you a strange link via social media. What do you do?",
    category: "phishing",
    options: [
      {
        text: "I contact my friend through a different channel to verify before clicking anything",
        score: 100,
      },
      {
        text: "I ignore it — it's probably a hack",
        score: 70,
      },
      {
        text: "I click it to see what it is but wouldn't enter any info",
        score: 20,
        bad: true,
      },
      {
        text: "I click it — it's from my friend so it must be safe",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 14,
    question: "How is your home Wi-Fi network secured?",
    category: "network",
    options: [
      {
        text: "WPA3 (or WPA2) with a strong unique password, default credentials changed, firmware updated",
        score: 100,
      },
      {
        text: "WPA2 with a decent password but I haven't changed the router's admin credentials",
        score: 60,
      },
      {
        text: "I'm using the default password that came with the router",
        score: 20,
        bad: true,
      },
      {
        text: "My Wi-Fi is open / I'm not sure how it's secured",
        score: 0,
        bad: true,
      },
    ],
  },
  {
    id: 15,
    question: "How often do you review your account activity and security settings?",
    category: "monitoring",
    options: [
      {
        text: "Monthly — I check login activity, connected apps, and enable breach alerts",
        score: 100,
      },
      {
        text: "A few times a year when I hear about a data breach",
        score: 60,
      },
      {
        text: "Only when something seems wrong (e.g., locked out of an account)",
        score: 30,
      },
      {
        text: "Never — I don't even know where to check",
        score: 0,
        bad: true,
      },
    ],
  },
];

interface RiskGrade {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Shield;
  description: string;
}

function getRiskGrade(score: number): RiskGrade {
  if (score >= 80) {
    return {
      label: "SECURE",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      icon: CheckCircle,
      description:
        "Excellent! Your cybersecurity habits are strong. Keep up the good work and stay vigilant.",
    };
  }
  if (score >= 60) {
    return {
      label: "MODERATE RISK",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      icon: AlertTriangle,
      description:
        "You have decent security practices but there are gaps that attackers could exploit. Address the priority actions below.",
    };
  }
  if (score >= 40) {
    return {
      label: "HIGH RISK",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      icon: AlertTriangle,
      description:
        "Your digital security has significant weaknesses. You are vulnerable to common attacks. Take immediate action on the items below.",
    };
  }
  return {
    label: "CRITICAL RISK",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    icon: XCircle,
    description:
      "Your cybersecurity posture is dangerously weak. You are highly vulnerable to data breaches, identity theft, and financial fraud. Prioritize the fixes below urgently.",
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getBarColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

const actionPlan: Record<ThreatCategory, string[]> = {
  password: [
    "Install a password manager (Bitwarden is free and open-source)",
    "Generate unique 16+ character passwords for every account",
    "Change any reused or weak passwords immediately, starting with email and banking",
  ],
  authentication: [
    "Enable 2FA on all accounts — prioritize email, banking, and social media",
    "Switch from SMS-based 2FA to an authenticator app (Authy, Google Authenticator)",
    "Consider a hardware security key (YubiKey) for critical accounts",
  ],
  phishing: [
    "Never click links in unsolicited emails — navigate to sites directly",
    "Verify sender email addresses carefully (look for subtle misspellings)",
    "When in doubt, contact the organization through official channels",
  ],
  network: [
    "Subscribe to a reputable VPN service and use it on all public Wi-Fi",
    "Change your home router's default admin password and update its firmware",
    "Always verify HTTPS and the exact domain before entering credentials",
  ],
  backup: [
    "Set up automatic cloud backup for your most important files today",
    "Create a local backup on an external drive and store it securely",
    "Test your backups periodically to make sure you can actually restore from them",
  ],
  patching: [
    "Enable automatic updates on all devices (OS, browser, apps)",
    "Remove apps and software you no longer use — they're attack surface",
    "Check for firmware updates on your router and IoT devices quarterly",
  ],
  physical: [
    "Set your devices to auto-lock after 1 minute of inactivity",
    "Use biometric unlock (fingerprint/face) combined with a strong PIN",
    "Enable remote wipe capability on all mobile devices",
  ],
  malware: [
    "Ensure Windows Defender is active and up to date (or install a reputable alternative)",
    "Never download software from unofficial sources or torrent sites",
    "Run a full system scan now if you haven't in the past month",
  ],
  privacy: [
    "Audit app permissions on your phone — revoke anything unnecessary",
    "Uninstall apps you haven't used in 3+ months",
    "Use privacy-focused browsers and search engines for sensitive activities",
  ],
  monitoring: [
    "Sign up for Have I Been Pwned breach notifications for your email addresses",
    "Review login activity on your Google, Microsoft, and social media accounts monthly",
    "Set up transaction alerts on all bank accounts and credit cards",
  ],
};

export default function CyberRiskScorecard() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const allAnswered = answeredCount === questions.length;

  function handleSelect(questionId: number, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function calculateOverallScore(): number {
    if (answeredCount === 0) return 0;
    const total = questions.reduce((sum, q) => {
      const selectedIndex = answers[q.id];
      if (selectedIndex === undefined) return sum;
      return sum + q.options[selectedIndex].score;
    }, 0);
    return Math.round(total / questions.length);
  }

  function calculateCategoryScores(): Record<ThreatCategory, number> {
    const catTotals: Record<string, { sum: number; count: number }> = {};
    questions.forEach((q) => {
      const selectedIndex = answers[q.id];
      if (selectedIndex === undefined) return;
      if (!catTotals[q.category]) catTotals[q.category] = { sum: 0, count: 0 };
      catTotals[q.category].sum += q.options[selectedIndex].score;
      catTotals[q.category].count += 1;
    });
    const result: Record<string, number> = {};
    for (const cat of Object.keys(categoryLabels)) {
      if (catTotals[cat]) {
        result[cat] = Math.round(catTotals[cat].sum / catTotals[cat].count);
      }
    }
    return result as Record<ThreatCategory, number>;
  }

  function getWeakestCategories(): ThreatCategory[] {
    const scores = calculateCategoryScores();
    return (Object.entries(scores) as [ThreatCategory, number][])
      .sort((a, b) => a[1] - b[1])
      .filter(([, score]) => score < 80)
      .map(([cat]) => cat);
  }

  function handleSubmit() {
    if (allAnswered) setShowResults(true);
  }

  function handleRetake() {
    setAnswers({});
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const overallScore = calculateOverallScore();
  const grade = getRiskGrade(overallScore);
  const GradeIcon = grade.icon;
  const categoryScores = calculateCategoryScores();
  const weakCategories = getWeakestCategories();

  return (
    <Layout>
      <SEOHead
        title="Cybersecurity Risk Scorecard | TechTrendi"
        description="Assess your personal cybersecurity habits with this 15-question quiz. Get your risk grade, threat category breakdown, and a priority action plan."
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Cybersecurity Risk Scorecard
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Answer 15 questions about your digital habits to get a personalized
              risk assessment and action plan.
            </p>
          </div>

          {!showResults ? (
            <>
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>
                    {answeredCount} of {questions.length} answered
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {questions.map((q, qi) => (
                  <Card
                    key={q.id}
                    className={cn(
                      "transition-all duration-300",
                      answers[q.id] !== undefined &&
                        "border-primary/30 bg-primary/5"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg font-semibold flex gap-2">
                        <span className="text-muted-foreground shrink-0">
                          {qi + 1}.
                        </span>
                        <span>{q.question}</span>
                      </CardTitle>
                      <Badge variant="outline" className="w-fit text-xs mt-1">
                        {categoryLabels[q.category]}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const isSelected = answers[q.id] === oi;
                        const showBad = isSelected && opt.bad;
                        return (
                          <button
                            key={oi}
                            onClick={() => handleSelect(q.id, oi)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg border transition-all duration-200 text-sm",
                              isSelected
                                ? showBad
                                  ? "border-red-500/50 bg-red-500/10 text-red-300"
                                  : "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-muted-foreground/50 hover:bg-muted/50 text-foreground"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className={cn(
                                  "mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                                  isSelected
                                    ? showBad
                                      ? "border-red-500 bg-red-500"
                                      : "border-primary bg-primary"
                                    : "border-muted-foreground/40"
                                )}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>
                              <span>{opt.text}</span>
                            </div>
                            {showBad && (
                              <div className="flex items-center gap-1 mt-2 ml-6 text-xs text-red-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span>This practice puts you at risk</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Submit */}
              <div className="mt-8 text-center">
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className="px-8"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {allAnswered
                    ? "Get My Risk Score"
                    : `Answer all ${questions.length} questions to continue`}
                </Button>
              </div>
            </>
          ) : (
            /* Results */
            <div className="space-y-6">
              {/* Overall Score */}
              <Card
                className={cn(
                  "border-2",
                  grade.borderColor,
                  grade.bgColor
                )}
              >
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="mb-4">
                    <GradeIcon
                      className={cn("w-16 h-16 mx-auto", grade.color)}
                    />
                  </div>
                  <div
                    className={cn(
                      "text-6xl sm:text-7xl font-bold mb-2",
                      grade.color
                    )}
                  >
                    {overallScore}
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    out of 100
                  </div>
                  <Badge
                    className={cn(
                      "text-lg px-4 py-1 font-bold",
                      grade.color,
                      grade.bgColor,
                      "border",
                      grade.borderColor
                    )}
                    variant="outline"
                  >
                    {grade.label}
                  </Badge>
                  <p className="mt-4 text-muted-foreground max-w-md mx-auto">
                    {grade.description}
                  </p>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Threat Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(
                    Object.entries(categoryScores) as [
                      ThreatCategory,
                      number,
                    ][]
                  )
                    .sort((a, b) => a[1] - b[1])
                    .map(([cat, score]) => (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <span>{categoryIcons[cat]}</span>
                            {categoryLabels[cat]}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-bold",
                              getScoreColor(score)
                            )}
                          >
                            {score}/100
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700 ease-out",
                              getBarColor(score)
                            )}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Priority Action Plan */}
              {weakCategories.length > 0 && (
                <Card className="border-orange-500/30">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      Priority Action Plan
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Focus on these areas first, ordered from weakest to
                      strongest.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {weakCategories.map((cat) => (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2">
                          <span>{categoryIcons[cat]}</span>
                          <span className="font-semibold">
                            {categoryLabels[cat]}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "ml-auto text-xs",
                              getScoreColor(categoryScores[cat])
                            )}
                          >
                            {categoryScores[cat]}/100
                          </Badge>
                        </div>
                        <ul className="space-y-1.5 ml-7">
                          {actionPlan[cat].map((action, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* All Clear */}
              {weakCategories.length === 0 && (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="pt-6 text-center">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="font-semibold text-green-400 text-lg">
                      All categories scored 80 or above!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You're doing great. Stay vigilant and keep your habits up
                      to date.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Retake */}
              <div className="text-center pt-4">
                <Button variant="outline" size="lg" onClick={handleRetake}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake Assessment
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
