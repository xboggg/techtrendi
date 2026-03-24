import { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Info,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
} from "lucide-react";

// --- Ghana-specific patterns ---

const GHANA_CITIES = [
  "kumasi", "takoradi", "tamale", "cape coast", "capecoast",
  "tema", "koforidua", "accra", "ghana",
];

const TELECOM_NAMES = ["momo", "vodafone", "airtel", "mtn"];
const RELIGIOUS_WORDS = ["jesus", "god", "church", "pastor"];
const ROMANTIC_WORDS = ["love", "sweet", "baby", "heart"];
const KEYBOARD_PATTERNS = ["qwerty", "asdf", "zxcv", "qazwsx"];
const NUMBER_SEQUENCES = ["123456", "654321", "111111", "000000", "123123"];

interface GhanaWarning {
  pattern: string;
  message: string;
  severity: "high" | "medium";
}

function detectGhanaPatterns(pwd: string): GhanaWarning[] {
  const lower = pwd.toLowerCase();
  const warnings: GhanaWarning[] = [];

  if (lower.includes("password") || lower.includes("passwd")) {
    warnings.push({ pattern: "password", message: 'Contains "password" - the most commonly guessed word', severity: "high" });
  }

  if (lower.includes("ghana") || lower.includes("accra")) {
    warnings.push({ pattern: "ghana/accra", message: 'Contains "ghana" or "accra" - very common in Ghanaian passwords', severity: "high" });
  }

  for (const city of GHANA_CITIES) {
    if (city !== "accra" && city !== "ghana" && lower.includes(city)) {
      warnings.push({ pattern: city, message: `Contains "${city}" - Ghanaian city names are commonly guessed`, severity: "medium" });
      break;
    }
  }

  for (const name of TELECOM_NAMES) {
    if (lower.includes(name)) {
      warnings.push({ pattern: name, message: `Contains "${name}" - telecom/mobile money names are easy to guess`, severity: "medium" });
      break;
    }
  }

  const yearMatch = pwd.match(/(19[6-9]\d|200\d|2010)$/);
  if (yearMatch) {
    warnings.push({ pattern: "birth year", message: `Ends with "${yearMatch[1]}" - birth years are among the first things attackers try`, severity: "high" });
  }

  const phonePattern = /0[2-59]\d[\s-]?\d{3,4}[\s-]?\d{4}/;
  if (phonePattern.test(pwd)) {
    warnings.push({ pattern: "phone number", message: "Looks like a Ghanaian phone number - easily found from contacts or social media", severity: "high" });
  }

  for (const seq of NUMBER_SEQUENCES) {
    if (lower.includes(seq)) {
      warnings.push({ pattern: "number sequence", message: `Contains "${seq}" - number sequences are in every attacker's dictionary`, severity: "high" });
      break;
    }
  }

  for (const pat of KEYBOARD_PATTERNS) {
    if (lower.includes(pat)) {
      warnings.push({ pattern: "keyboard pattern", message: `Contains "${pat}" - keyboard patterns are easily guessed`, severity: "medium" });
      break;
    }
  }

  for (const word of RELIGIOUS_WORDS) {
    if (lower.includes(word)) {
      warnings.push({ pattern: "religious word", message: `Contains "${word}" - religious words are very common in Ghanaian passwords`, severity: "medium" });
      break;
    }
  }

  for (const word of ROMANTIC_WORDS) {
    if (lower.includes(word)) {
      warnings.push({ pattern: "romantic word", message: `Contains "${word}" - romantic words are frequently used and easily guessed`, severity: "medium" });
      break;
    }
  }

  return warnings;
}

// --- Analysis ---

type StrengthLevel = "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";

interface AnalysisResult {
  score: number;
  strength: StrengthLevel;
  entropy: number;
  charPool: number;
  combinations: string;
  crackTime: string;
  checklist: { label: string; met: boolean }[];
  warnings: GhanaWarning[];
  suggestions: string[];
}

function formatLargeNumber(n: number): string {
  if (!isFinite(n) || n > 1e30) return "Astronomically large";
  if (n >= 1e24) return `${(n / 1e24).toFixed(2)} septillion`;
  if (n >= 1e21) return `${(n / 1e21).toFixed(2)} sextillion`;
  if (n >= 1e18) return `${(n / 1e18).toFixed(2)} quintillion`;
  if (n >= 1e15) return `${(n / 1e15).toFixed(2)} quadrillion`;
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} trillion`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} million`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)} thousand`;
  return Math.round(n).toLocaleString();
}

function formatCrackTime(seconds: number): string {
  if (!isFinite(seconds) || seconds > 1e20) return "Millions of years";
  if (seconds < 0.001) return "Instantly";
  if (seconds < 1) return "Less than a second";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  const years = seconds / 31536000;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${(years / 1000).toFixed(1)}k years`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)} million years`;
  if (years < 1e12) return `${(years / 1e9).toFixed(1)} billion years`;
  return `${(years / 1e12).toFixed(1)} trillion years`;
}

function analyzePassword(pwd: string): AnalysisResult {
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

  let charPool = 0;
  if (hasLower) charPool += 26;
  if (hasUpper) charPool += 26;
  if (hasNumber) charPool += 10;
  if (hasSpecial) charPool += 33;
  if (charPool === 0) charPool = 1;

  const entropy = pwd.length * Math.log2(charPool);
  const combinations = Math.pow(charPool, pwd.length);
  const guessesPerSecond = 100_000_000_000;
  const crackSeconds = Math.pow(2, entropy) / guessesPerSecond;

  const checklist = [
    { label: "At least 8 characters", met: pwd.length >= 8 },
    { label: "Uppercase letter (A-Z)", met: hasUpper },
    { label: "Lowercase letter (a-z)", met: hasLower },
    { label: "Number (0-9)", met: hasNumber },
    { label: "Special character (!@#$...)", met: hasSpecial },
    { label: "12+ characters (recommended)", met: pwd.length >= 12 },
  ];

  const warnings = detectGhanaPatterns(pwd);

  // Score 0-4 based on entropy + penalties
  let score = 0;
  if (entropy >= 20) score = 1;
  if (entropy >= 40) score = 2;
  if (entropy >= 60) score = 3;
  if (entropy >= 80) score = 4;

  const highSeverityCount = warnings.filter((w) => w.severity === "high").length;
  if (highSeverityCount >= 2) score = Math.max(0, score - 2);
  else if (highSeverityCount >= 1) score = Math.max(0, score - 1);
  if (warnings.filter((w) => w.severity === "medium").length >= 2) {
    score = Math.max(0, score - 1);
  }

  const strengthMap: StrengthLevel[] = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

  // Suggestions
  const suggestions: string[] = [];
  if (pwd.length < 8) suggestions.push("Make your password at least 8 characters long");
  else if (pwd.length < 12) suggestions.push("Aim for 12+ characters for better security");
  if (!hasUpper) suggestions.push("Add uppercase letters to increase complexity");
  if (!hasLower) suggestions.push("Add lowercase letters to increase complexity");
  if (!hasNumber) suggestions.push("Include numbers to broaden the character set");
  if (!hasSpecial) suggestions.push("Add special characters like !@#$%^&* for maximum strength");
  if (/(.)\1{2,}/.test(pwd)) suggestions.push("Avoid repeating the same character multiple times");
  if (/^[a-zA-Z]+$/.test(pwd)) suggestions.push("Don't use only letters — mix in numbers and symbols");
  if (/^[0-9]+$/.test(pwd)) suggestions.push("Don't use only numbers — add letters and symbols");

  return {
    score,
    strength: strengthMap[score],
    entropy: Math.round(entropy * 10) / 10,
    charPool,
    combinations: formatLargeNumber(combinations),
    crackTime: formatCrackTime(crackSeconds),
    checklist,
    warnings,
    suggestions,
  };
}

// --- Password suggestion generator ---

const WORD_LIST = [
  "Mango", "Tiger", "Storm", "Pixel", "Blade", "Crown", "Frost", "Coral",
  "Plume", "Vault", "Spark", "River", "Steel", "Orbit", "Flame", "Cedar",
  "Drift", "Prism", "Cloud", "Lunar", "Arrow", "Brave", "Cliff", "Eagle",
  "Forge", "Globe", "Ivory", "Jetty", "Knoll", "Marsh",
];

const SPECIALS = ["!", "@", "#", "$", "%", "&", "*", "?", "+", "="];

function generateSuggestions(): string[] {
  const suggestions: string[] = [];
  for (let i = 0; i < 3; i++) {
    const w1 = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    const w2 = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    const sp = SPECIALS[Math.floor(Math.random() * SPECIALS.length)];
    suggestions.push(`${w1}${num}${w2}${sp}`);
  }
  return suggestions;
}

// --- Component ---

const SEGMENT_COLORS: Record<number, string> = {
  0: "bg-red-500",
  1: "bg-orange-500",
  2: "bg-amber-500",
  3: "bg-lime-500",
  4: "bg-green-500",
};

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  "Very Weak": "text-red-500 dark:text-red-400",
  Weak: "text-orange-500 dark:text-orange-400",
  Fair: "text-amber-500 dark:text-amber-400",
  Strong: "text-lime-600 dark:text-lime-400",
  "Very Strong": "text-green-600 dark:text-green-400",
};

export default function PasswordAnalyzer() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(() => generateSuggestions());

  const analysis = useMemo(() => (password ? analyzePassword(password) : null), [password]);

  const handleCopy = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Password copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  const refreshSuggestions = useCallback(() => {
    setSuggestions(generateSuggestions());
  }, []);

  return (
    <Layout>
      <SEOHead
        title="Password Strength Checker - Ghana Pattern Detection | TechTrendi"
        description="Check how strong your password is with entropy analysis, crack time estimates, Ghana-specific pattern detection, and strong password suggestions. 100% local — nothing leaves your browser."
      />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Shield className="w-4 h-4" />
            Password Strength Checker
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Analyze Your Password Strength
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get detailed security metrics — entropy, crack time, Ghana-specific pattern warnings, and actionable improvement suggestions.
          </p>
        </div>

        {/* Privacy note */}
        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Your password is never sent anywhere. All analysis happens in your browser.</span>
        </div>

        {/* Password Input */}
        <Card>
          <CardContent className="pt-6">
            <label htmlFor="password-input" className="block text-sm font-medium text-foreground mb-2">
              Enter a password to analyze
            </label>
            <div className="relative">
              <Input
                id="password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type your password here..."
                className="pr-12 text-lg h-12"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Strength meter */}
            {analysis && (
              <div className="mt-4 space-y-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-all duration-300",
                        i <= analysis.score ? SEGMENT_COLORS[analysis.score] : "bg-muted"
                      )}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn("font-semibold text-lg", STRENGTH_COLORS[analysis.strength])}>
                    {analysis.strength}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      Crack time: <strong className="text-foreground">{analysis.crackTime}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        {analysis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Entropy</p>
              <p className="text-lg font-semibold text-foreground">
                {analysis.entropy} <span className="text-sm font-normal text-muted-foreground">bits</span>
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Crack Time</p>
              <p className="text-lg font-semibold text-foreground">{analysis.crackTime}</p>
              <p className="text-[10px] text-muted-foreground">offline @ 100B/s</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Character Pool</p>
              <p className="text-lg font-semibold text-foreground">
                {analysis.charPool} <span className="text-sm font-normal text-muted-foreground">chars</span>
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Combinations</p>
              <p className="text-lg font-semibold text-foreground truncate">{analysis.combinations}</p>
            </div>
          </div>
        )}

        {/* Analysis results */}
        {analysis && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  Requirements Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {analysis.checklist.map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        item.met
                          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.met ? <Check className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ghana-specific warnings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Pattern Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.warnings.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg">
                    <Shield className="w-5 h-5 shrink-0" />
                    <span className="text-sm">No common password patterns detected!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analysis.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm",
                          warning.severity === "high"
                            ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                            : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        )}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span>{warning.message}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "ml-2 text-xs",
                              warning.severity === "high"
                                ? "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                                : "border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400"
                            )}
                          >
                            {warning.severity === "high" ? "High Risk" : "Medium Risk"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Improvement suggestions */}
        {analysis && analysis.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="w-5 h-5 text-blue-500" />
                Suggestions to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Strong password confirmation */}
        {analysis && analysis.score >= 4 && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-medium">
              Excellent! Your password is very strong with {analysis.entropy} bits of entropy.
            </span>
          </div>
        )}

        {/* Suggested passwords */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-purple-500" />
                Suggested Strong Passwords
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={refreshSuggestions} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/50 rounded-lg group">
                  <code className="text-sm font-mono text-foreground break-all">{suggestion}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(suggestion, idx)}
                    className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedIndex === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              These passwords are generated randomly in your browser. Click to copy.
            </p>
          </CardContent>
        </Card>

        {/* How It Works & Tips */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="w-5 h-5 text-blue-500" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  { title: "Type your password", desc: "analysis happens instantly as you type, right in your browser" },
                  { title: "See your strength score", desc: "the meter shows how resistant your password is to cracking attempts" },
                  { title: "Check for weak patterns", desc: "we detect common patterns like city names, phone numbers, and telecom brands" },
                  { title: "Get suggestions", desc: "use our generated strong passwords or create your own based on the feedback" },
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span>
                      <strong className="text-foreground">{step.title}</strong> - {step.desc}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Tips for a Strong Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  { icon: "check", text: 'Use **12+ characters** - longer passwords are exponentially harder to crack' },
                  { icon: "check", text: 'Mix **uppercase, lowercase, numbers, and symbols** to increase the character pool' },
                  { icon: "check", text: 'Avoid **personal info** - names, birthdays, phone numbers, and city names are easily guessed' },
                  { icon: "check", text: 'Use **passphrases** - combine random words like "MangoStorm47!" for memorable yet strong passwords' },
                  { icon: "warn", text: '**Never reuse** passwords across multiple accounts - use a password manager instead' },
                  { icon: "warn", text: 'Avoid **MoMo PINs** and MTN/Vodafone-related words - attackers specifically target these' },
                ].map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    {tip.icon === "check" ? (
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <span dangerouslySetInnerHTML={{ __html: tip.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
