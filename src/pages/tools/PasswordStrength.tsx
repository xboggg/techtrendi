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
  Lock,
  Eye,
  EyeOff,
  Shield,
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
  "kumasi",
  "takoradi",
  "tamale",
  "cape coast",
  "capecoast",
  "tema",
  "koforidua",
  "accra",
  "ghana",
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

  // Common password words
  if (lower.includes("password") || lower.includes("passwd")) {
    warnings.push({
      pattern: "password",
      message: "Contains \"password\" - the most commonly guessed word",
      severity: "high",
    });
  }

  // Ghana / Accra
  if (lower.includes("ghana") || lower.includes("accra")) {
    warnings.push({
      pattern: "ghana/accra",
      message: "Contains \"ghana\" or \"accra\" - very common in Ghanaian passwords",
      severity: "high",
    });
  }

  // Ghanaian cities
  for (const city of GHANA_CITIES) {
    if (city !== "accra" && city !== "ghana" && lower.includes(city)) {
      warnings.push({
        pattern: city,
        message: `Contains "${city}" - Ghanaian city names are commonly guessed`,
        severity: "medium",
      });
      break;
    }
  }

  // Telecom names
  for (const name of TELECOM_NAMES) {
    if (lower.includes(name)) {
      warnings.push({
        pattern: name,
        message: `Contains "${name}" - telecom/mobile money names are easy to guess`,
        severity: "medium",
      });
      break;
    }
  }

  // Year of birth pattern (ends with 4-digit year 1960-2010)
  const yearMatch = pwd.match(/(19[6-9]\d|200\d|2010)$/);
  if (yearMatch) {
    warnings.push({
      pattern: "birth year",
      message: `Ends with "${yearMatch[1]}" - birth years are among the first things attackers try`,
      severity: "high",
    });
  }

  // Ghanaian phone number pattern (0XX XXXX XXXX or 0XXXXXXXXX)
  const phonePattern = /0[2-59]\d[\s-]?\d{3,4}[\s-]?\d{4}/;
  if (phonePattern.test(pwd)) {
    warnings.push({
      pattern: "phone number",
      message: "Looks like a Ghanaian phone number - easily found from contacts or social media",
      severity: "high",
    });
  }

  // Number sequences
  for (const seq of NUMBER_SEQUENCES) {
    if (lower.includes(seq)) {
      warnings.push({
        pattern: "number sequence",
        message: `Contains "${seq}" - number sequences are in every attacker's dictionary`,
        severity: "high",
      });
      break;
    }
  }

  // Keyboard patterns
  for (const pat of KEYBOARD_PATTERNS) {
    if (lower.includes(pat)) {
      warnings.push({
        pattern: "keyboard pattern",
        message: `Contains "${pat}" - keyboard patterns are easily guessed`,
        severity: "medium",
      });
      break;
    }
  }

  // Religious words
  for (const word of RELIGIOUS_WORDS) {
    if (lower.includes(word)) {
      warnings.push({
        pattern: "religious word",
        message: `Contains "${word}" - religious words are very common in Ghanaian passwords`,
        severity: "medium",
      });
      break;
    }
  }

  // Romantic words
  for (const word of ROMANTIC_WORDS) {
    if (lower.includes(word)) {
      warnings.push({
        pattern: "romantic word",
        message: `Contains "${word}" - romantic words are frequently used and easily guessed`,
        severity: "medium",
      });
      break;
    }
  }

  return warnings;
}

// --- Entropy & crack time ---

function calculateEntropy(pwd: string): { entropy: number; charsetSize: number } {
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

  let charsetSize = 0;
  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasDigit) charsetSize += 10;
  if (hasSpecial) charsetSize += 32;
  if (charsetSize === 0) charsetSize = 1;

  const entropy = pwd.length * Math.log2(charsetSize);
  return { entropy, charsetSize };
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

// --- Strength scoring ---

type StrengthLevel = "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";

interface AnalysisResult {
  score: number; // 0-4
  strength: StrengthLevel;
  entropy: number;
  crackTime: string;
  checklist: { label: string; met: boolean }[];
  warnings: GhanaWarning[];
}

function analyzePassword(pwd: string): AnalysisResult {
  if (!pwd) {
    return {
      score: 0,
      strength: "Very Weak",
      entropy: 0,
      crackTime: "Instantly",
      checklist: [
        { label: "At least 8 characters", met: false },
        { label: "Uppercase letter (A-Z)", met: false },
        { label: "Lowercase letter (a-z)", met: false },
        { label: "Number (0-9)", met: false },
        { label: "Special character (!@#$...)", met: false },
        { label: "12+ characters (recommended)", met: false },
      ],
      warnings: [],
    };
  }

  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
  const has8 = pwd.length >= 8;
  const has12 = pwd.length >= 12;

  const checklist = [
    { label: "At least 8 characters", met: has8 },
    { label: "Uppercase letter (A-Z)", met: hasUpper },
    { label: "Lowercase letter (a-z)", met: hasLower },
    { label: "Number (0-9)", met: hasDigit },
    { label: "Special character (!@#$...)", met: hasSpecial },
    { label: "12+ characters (recommended)", met: has12 },
  ];

  const { entropy } = calculateEntropy(pwd);
  const guessesPerSecond = 10_000_000_000; // 10 billion
  const crackSeconds = Math.pow(2, entropy) / guessesPerSecond;
  const crackTime = formatCrackTime(crackSeconds);

  const warnings = detectGhanaPatterns(pwd);

  // Score based on entropy + penalties
  let score = 0;
  if (entropy >= 20) score = 1;
  if (entropy >= 40) score = 2;
  if (entropy >= 60) score = 3;
  if (entropy >= 80) score = 4;

  // Penalize for Ghana-specific patterns
  const highSeverityCount = warnings.filter((w) => w.severity === "high").length;
  if (highSeverityCount >= 2) score = Math.max(0, score - 2);
  else if (highSeverityCount >= 1) score = Math.max(0, score - 1);
  if (warnings.filter((w) => w.severity === "medium").length >= 2) {
    score = Math.max(0, score - 1);
  }

  const strengthMap: StrengthLevel[] = [
    "Very Weak",
    "Weak",
    "Fair",
    "Strong",
    "Very Strong",
  ];

  return {
    score,
    strength: strengthMap[score],
    entropy: Math.round(entropy * 10) / 10,
    crackTime,
    checklist,
    warnings,
  };
}

// --- Password suggestion generator ---

const WORD_LIST = [
  "Mango",
  "Tiger",
  "Storm",
  "Pixel",
  "Blade",
  "Crown",
  "Frost",
  "Coral",
  "Plume",
  "Vault",
  "Spark",
  "River",
  "Steel",
  "Orbit",
  "Flame",
  "Cedar",
  "Drift",
  "Prism",
  "Cloud",
  "Lunar",
  "Arrow",
  "Brave",
  "Cliff",
  "Eagle",
  "Forge",
  "Globe",
  "Ivory",
  "Jetty",
  "Knoll",
  "Marsh",
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

export default function PasswordStrength() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    generateSuggestions()
  );

  const analysis = useMemo(() => analyzePassword(password), [password]);

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
        title="Password Strength Analyzer - Ghana Edition | TechTrendi"
        description="Analyze your password strength with Ghana-specific pattern detection. Check for common Ghanaian password patterns, get crack time estimates, and generate stronger passwords."
      />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
            <Shield className="w-4 h-4" />
            Ghana Edition
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Password Strength Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Check how strong your password is with Ghana-specific pattern
            detection. Identifies common patterns used in Ghanaian passwords.
          </p>
        </div>

        {/* Privacy note */}
        <div className="flex items-center gap-2 justify-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-3">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            Your password is never sent anywhere. All analysis happens in your
            browser.
          </span>
        </div>

        {/* Password Input */}
        <Card>
          <CardContent className="pt-6">
            <label
              htmlFor="password-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Strength meter */}
            {password && (
              <div className="mt-4 space-y-3">
                {/* 5-segment bar */}
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-all duration-300",
                        i <= analysis.score
                          ? SEGMENT_COLORS[analysis.score]
                          : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  ))}
                </div>

                {/* Strength label + crack time */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "font-semibold text-lg",
                      STRENGTH_COLORS[analysis.strength]
                    )}
                  >
                    {analysis.strength}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      Crack time:{" "}
                      <strong className="text-gray-800 dark:text-gray-200">
                        {analysis.crackTime}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Entropy */}
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Entropy: {analysis.entropy} bits (assuming 10 billion
                  guesses/sec)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis results - only show when there's a password */}
        {password && (
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
                          : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {item.met ? (
                        <Check className="w-4 h-4 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 shrink-0" />
                      )}
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
                  Ghana Pattern Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.warnings.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg">
                    <Shield className="w-5 h-5 shrink-0" />
                    <span className="text-sm">
                      No common Ghanaian password patterns detected!
                    </span>
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

        {/* Suggested passwords */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-purple-500" />
                Suggested Strong Passwords
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshSuggestions}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg group"
                >
                  <code className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                    {suggestion}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(suggestion, idx)}
                    className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
              These passwords are generated randomly in your browser. Click to
              copy.
            </p>
          </CardContent>
        </Card>

        {/* Beginner section - How It Works & Tips */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="w-5 h-5 text-blue-500" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                    1
                  </span>
                  <span>
                    <strong className="text-gray-800 dark:text-gray-200">
                      Type your password
                    </strong>{" "}
                    - analysis happens instantly as you type, right in your
                    browser
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                    2
                  </span>
                  <span>
                    <strong className="text-gray-800 dark:text-gray-200">
                      See your strength score
                    </strong>{" "}
                    - the meter shows how resistant your password is to cracking
                    attempts
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                    3
                  </span>
                  <span>
                    <strong className="text-gray-800 dark:text-gray-200">
                      Check for Ghana patterns
                    </strong>{" "}
                    - we detect common patterns like city names, phone numbers,
                    and telecom brands
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                    4
                  </span>
                  <span>
                    <strong className="text-gray-800 dark:text-gray-200">
                      Get suggestions
                    </strong>{" "}
                    - use our generated strong passwords or create your own based
                    on the feedback
                  </span>
                </li>
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
              <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>
                    Use <strong className="text-gray-800 dark:text-gray-200">12+ characters</strong> - longer passwords are exponentially harder to crack
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>
                    Mix <strong className="text-gray-800 dark:text-gray-200">uppercase, lowercase, numbers, and symbols</strong> to increase the character pool
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>
                    Avoid <strong className="text-gray-800 dark:text-gray-200">personal info</strong> - names, birthdays, phone numbers, and city names are easily guessed
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>
                    Use <strong className="text-gray-800 dark:text-gray-200">passphrases</strong> - combine random words like "MangoStorm47!" for memorable yet strong passwords
                  </span>
                </li>
                <li className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-800 dark:text-gray-200">Never reuse</strong> passwords across multiple accounts - use a password manager instead
                  </span>
                </li>
                <li className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Avoid <strong className="text-gray-800 dark:text-gray-200">MoMo PINs</strong> and MTN/Vodafone-related words - attackers specifically target these in Ghana
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
