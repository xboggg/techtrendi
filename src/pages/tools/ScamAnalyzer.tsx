import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquareWarning,
  Lightbulb,
  ClipboardPaste,
  Search,
  Info,
  ArrowRight,
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface ScamFlag {
  indicator: string;
  severity: "high" | "medium" | "low";
  explanation: string;
}

interface AnalysisResult {
  verdict: "SCAM" | "SUSPICIOUS" | "LIKELY SAFE";
  risk_score: number;
  title: string;
  subtitle: string;
  flags: ScamFlag[];
  advice: string;
}

const exampleMessages = [
  {
    label: "MoMo Scam",
    icon: "💰",
    message:
      "Congratulations! Your MTN MoMo number has been selected for a GHS 3,500 reward in our annual customer loyalty draw. To claim, send your MoMo PIN and full name to this number immediately. Offer expires in 2 hours! Ref: MTN/PROMO/2026",
  },
  {
    label: "WhatsApp Hijack",
    icon: "💬",
    message:
      "Hi, this is WhatsApp Support. We noticed unusual activity on your account. To prevent suspension, please share the 6-digit verification code we just sent to your phone number. Failure to verify within 30 minutes will result in permanent account deletion.",
  },
  {
    label: "Fake GRA",
    icon: "🏛️",
    message:
      "URGENT: Ghana Revenue Authority. You have an outstanding tax debt of GHS 12,450.00 for the 2025 fiscal year. Pay immediately via MoMo to 0551234567 to avoid legal prosecution and asset seizure. Reference: GRA/ENF/2026/4491. Reply STOP to opt out.",
  },
  {
    label: "Fake Job",
    icon: "💼",
    message:
      "URGENT HIRING: Shell Ghana is recruiting remote workers. Earn GHS 800-2,500 daily from your phone! No experience needed. WhatsApp the HR Manager now at +233 55 987 6543 to secure your position. Limited slots available — only 15 remaining!",
  },
  {
    label: "Real Bank SMS",
    icon: "🏦",
    message:
      "Your Ecobank account ending 4521 has been credited with GHS 500.00 on 18/03/2026 at 14:32. Available balance: GHS 2,150.75. Ref: FT26077ABCDE. If not you, call 0302 21 4444.",
  },
];

const SYSTEM_PROMPT = `You are a cybersecurity expert specializing in scams targeting people in Ghana and West Africa. Analyze the message provided and determine if it is a scam, suspicious, or likely safe.

You must respond ONLY with valid JSON in this exact format (no markdown, no code fences, no extra text):
{
  "verdict": "SCAM" | "SUSPICIOUS" | "LIKELY SAFE",
  "risk_score": <number 0-100>,
  "title": "<short verdict title>",
  "subtitle": "<one sentence summary>",
  "flags": [
    {
      "indicator": "<what was found>",
      "severity": "high" | "medium" | "low",
      "explanation": "<why this is suspicious>"
    }
  ],
  "advice": "<specific actionable advice for the recipient>"
}

Consider these Ghana-specific scam patterns:
- Mobile Money (MoMo) fraud: fake prize notifications asking for PINs
- WhatsApp OTP hijacking: fake support asking for verification codes
- Fake government agencies: GRA, SSNIT, ECG impersonation
- Fake job offers: unrealistic salaries, no interview process
- CEO/boss fraud: impersonating managers requesting urgent transfers
- Advance fee fraud: paying money to receive a larger sum
- Romance scams and sextortion

For legitimate messages, still note any mild concerns but give a low risk score.
For the flags array, include 2-6 indicators depending on how suspicious the message is.
For safe messages, you can have 0-1 flags.`;

export default function ScamAnalyzer() {
  const [message, setMessage] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeMessage = async () => {
    if (!message.trim()) {
      toast.error("Please paste a message to analyze");
      return;
    }

    if (!GROQ_API_KEY) {
      toast.error("API key not configured");
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Analyze this message for scam indicators:\n\n"${message.trim()}"`,
            },
          ],
          temperature: 0.3,
          max_tokens: 900,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      // Parse JSON from response, handling possible markdown fences
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse AI response");
      }

      const parsed: AnalysisResult = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.verdict || typeof parsed.risk_score !== "number") {
        throw new Error("Invalid response format");
      }

      setResult(parsed);
      toast.success("Analysis complete");
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case "SCAM":
        return {
          bg: "bg-red-500/10 dark:bg-red-500/20",
          border: "border-red-500/30",
          text: "text-red-700 dark:text-red-400",
          badgeBg: "bg-red-600",
          icon: ShieldX,
          barColor: "bg-red-500",
        };
      case "SUSPICIOUS":
        return {
          bg: "bg-amber-500/10 dark:bg-amber-500/20",
          border: "border-amber-500/30",
          text: "text-amber-700 dark:text-amber-400",
          badgeBg: "bg-amber-600",
          icon: ShieldAlert,
          barColor: "bg-amber-500",
        };
      default:
        return {
          bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
          border: "border-emerald-500/30",
          text: "text-emerald-700 dark:text-emerald-400",
          badgeBg: "bg-emerald-600",
          icon: ShieldCheck,
          barColor: "bg-emerald-500",
        };
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          bg: "bg-red-100 dark:bg-red-900/30",
          text: "text-red-700 dark:text-red-400",
          icon: XCircle,
          label: "High Risk",
        };
      case "medium":
        return {
          bg: "bg-amber-100 dark:bg-amber-900/30",
          text: "text-amber-700 dark:text-amber-400",
          icon: AlertTriangle,
          label: "Medium",
        };
      default:
        return {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-700 dark:text-blue-400",
          icon: Info,
          label: "Low",
        };
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Ghana Scam Message Analyzer | TechTrendi"
        description="Free AI-powered tool to detect scam SMS, WhatsApp, and email messages targeting Ghanaians. Identify MoMo fraud, fake GRA messages, and more."
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ghana Scam Message Analyzer
            </h1>
            <p className="mt-2 text-muted-foreground">
              Paste any suspicious SMS, WhatsApp, or email message and let AI
              check if it's a scam.
            </p>
          </div>

          {/* Main Input Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardPaste className="h-5 w-5" />
                Paste Suspicious Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste the suspicious message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[140px] resize-none text-base"
              />

              {/* Example Buttons */}
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Try an example:
                </p>
                <div className="flex flex-wrap gap-2">
                  {exampleMessages.map((ex) => (
                    <Button
                      key={ex.label}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMessage(ex.message);
                        setResult(null);
                      }}
                      className="text-xs"
                    >
                      <span className="mr-1">{ex.icon}</span>
                      {ex.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={analyzeMessage}
                disabled={analyzing || !message.trim()}
                className="w-full"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Analyze Message
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Loading Shimmer */}
          {analyzing && (
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-12 animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 animate-pulse rounded bg-muted" />
                  <div className="space-y-3 pt-2">
                    <div className="h-16 animate-pulse rounded-lg bg-muted" />
                    <div className="h-16 animate-pulse rounded-lg bg-muted" />
                    <div className="h-16 animate-pulse rounded-lg bg-muted" />
                  </div>
                  <div className="h-20 animate-pulse rounded-lg bg-muted" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && !analyzing && (
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                {/* Verdict Banner */}
                {(() => {
                  const config = getVerdictConfig(result.verdict);
                  const VerdictIcon = config.icon;
                  return (
                    <div
                      className={cn(
                        "border-b p-6",
                        config.bg,
                        config.border
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                            config.bg
                          )}
                        >
                          <VerdictIcon className={cn("h-7 w-7", config.text)} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                "text-sm font-bold text-white",
                                config.badgeBg
                              )}
                            >
                              {result.verdict}
                            </Badge>
                          </div>
                          <h2
                            className={cn(
                              "mt-1 text-xl font-bold",
                              config.text
                            )}
                          >
                            {result.title}
                          </h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {result.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-5 p-6">
                  {/* Risk Score Bar */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Risk Level</span>
                      <span
                        className={cn(
                          "text-lg font-bold",
                          getVerdictConfig(result.verdict).text
                        )}
                      >
                        {result.risk_score}/100
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700 ease-out",
                          getVerdictConfig(result.verdict).barColor
                        )}
                        style={{ width: `${result.risk_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Red Flags */}
                  {result.flags && result.flags.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 font-semibold">
                        <MessageSquareWarning className="h-4 w-4" />
                        Red Flags Detected ({result.flags.length})
                      </h3>
                      <div className="space-y-2">
                        {result.flags.map((flag, i) => {
                          const sevConfig = getSeverityConfig(flag.severity);
                          const SevIcon = sevConfig.icon;
                          return (
                            <div
                              key={i}
                              className={cn(
                                "rounded-lg border p-3",
                                sevConfig.bg
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <SevIcon
                                  className={cn(
                                    "mt-0.5 h-4 w-4 shrink-0",
                                    sevConfig.text
                                  )}
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "text-sm font-semibold",
                                        sevConfig.text
                                      )}
                                    >
                                      {flag.indicator}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[10px] px-1.5 py-0",
                                        sevConfig.text
                                      )}
                                    >
                                      {sevConfig.label}
                                    </Badge>
                                  </div>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {flag.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Advice Box */}
                  {result.advice && (
                    <div
                      className={cn(
                        "rounded-lg border p-4",
                        result.verdict === "LIKELY SAFE"
                          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                          : result.verdict === "SUSPICIOUS"
                          ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                          : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                      )}
                    >
                      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                        <Lightbulb className="h-4 w-4" />
                        Advice
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {result.advice}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* How It Works & Tips */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-primary" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {[
                    {
                      step: "1",
                      title: "Paste the Message",
                      desc: "Copy and paste the suspicious SMS, WhatsApp, or email message you received.",
                    },
                    {
                      step: "2",
                      title: "AI Analyzes It",
                      desc: "Our AI checks for known scam patterns, urgency tactics, and fraud indicators common in Ghana.",
                    },
                    {
                      step: "3",
                      title: "Get Your Verdict",
                      desc: "See a clear risk score, red flags, and actionable advice on how to stay safe.",
                    },
                  ].map((item) => (
                    <li key={item.step} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {item.step}
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Common Scam Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    {
                      icon: "⏰",
                      text: "Creates urgency — \"Act NOW or lose your account!\"",
                    },
                    {
                      icon: "🔑",
                      text: "Asks for your PIN, OTP, or MoMo password",
                    },
                    {
                      icon: "📱",
                      text: "Comes from an unknown number or unverified sender",
                    },
                    {
                      icon: "🎁",
                      text: "Offers that sound too good to be true (free money, easy jobs)",
                    },
                    {
                      icon: "🏛️",
                      text: "Claims to be GRA, SSNIT, or ECG but uses a personal number",
                    },
                    {
                      icon: "🔗",
                      text: "Contains suspicious links or asks you to click/download",
                    },
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0 text-base">{tip.icon}</span>
                      <span className="text-muted-foreground">{tip.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Disclaimer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            This tool uses AI for educational purposes only. It may not catch
            every scam. When in doubt, do not respond to the message and contact
            the organization directly through their official channels.
          </p>
        </div>
      </div>
    </Layout>
  );
}
