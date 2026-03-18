import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

interface PasswordMetrics {
  score: number;
  strength: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  entropy: number;
  charPool: number;
  combinations: string;
  crackTime: string;
  suggestions: string[];
  requirements: {
    label: string;
    met: boolean;
  }[];
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
  if (seconds < 0.001) return "Instantly";
  if (seconds < 1) return "Less than a second";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / 31536000;
  if (years < 100) return `${Math.round(years)} years`;
  if (years < 1e6) return `${formatLargeNumber(years)} years`;
  return "Centuries+";
}

function analyzePassword(pwd: string): PasswordMetrics {
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

  // Character pool size
  let charPool = 0;
  if (hasLower) charPool += 26;
  if (hasUpper) charPool += 26;
  if (hasNumber) charPool += 10;
  if (hasSpecial) charPool += 33;
  if (charPool === 0) charPool = 1;

  // Entropy
  const entropy = pwd.length * Math.log2(charPool);

  // Combinations
  const combinations = Math.pow(charPool, pwd.length);

  // Crack time at 100 billion guesses/sec (offline attack)
  const guessesPerSecond = 100_000_000_000;
  const crackSeconds = Math.pow(2, entropy) / guessesPerSecond;

  // Score calculation (matching spec)
  let score = 0;
  if (pwd.length >= 8) score += 15;
  if (pwd.length >= 12) score += 10;
  if (pwd.length >= 16) score += 10;
  if (hasUpper) score += 15;
  if (hasLower) score += 15;
  if (hasNumber) score += 15;
  if (hasSpecial) score += 20;

  score = Math.max(0, Math.min(100, score));

  // Strength label
  let strength: PasswordMetrics["strength"];
  if (score < 20) strength = "Very Weak";
  else if (score < 40) strength = "Weak";
  else if (score < 60) strength = "Fair";
  else if (score < 80) strength = "Strong";
  else strength = "Very Strong";

  // Requirements checklist
  const requirements = [
    { label: "At least 8 characters", met: pwd.length >= 8 },
    { label: "Uppercase letter (A-Z)", met: hasUpper },
    { label: "Lowercase letter (a-z)", met: hasLower },
    { label: "Number (0-9)", met: hasNumber },
    { label: "Special character (!@#$%...)", met: hasSpecial },
    { label: "12+ characters (recommended)", met: pwd.length >= 12 },
  ];

  // Dynamic suggestions
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

  const commonPatterns = ["password", "123456", "qwerty", "abc123", "letmein", "admin"];
  if (commonPatterns.some((p) => pwd.toLowerCase().includes(p))) {
    suggestions.push("Avoid common passwords and predictable patterns");
  }

  return {
    score,
    strength,
    entropy,
    charPool,
    combinations: formatLargeNumber(combinations),
    crackTime: formatCrackTime(crackSeconds),
    suggestions,
    requirements,
  };
}

const strengthConfig: Record<
  PasswordMetrics["strength"],
  { color: string; barColor: string; textColor: string }
> = {
  "Very Weak": {
    color: "text-red-500",
    barColor: "bg-red-500",
    textColor: "text-red-500",
  },
  Weak: {
    color: "text-orange-500",
    barColor: "bg-orange-500",
    textColor: "text-orange-500",
  },
  Fair: {
    color: "text-yellow-500",
    barColor: "bg-yellow-500",
    textColor: "text-yellow-500",
  },
  Strong: {
    color: "text-green-500",
    barColor: "bg-green-500",
    textColor: "text-green-500",
  },
  "Very Strong": {
    color: "text-primary",
    barColor: "bg-primary",
    textColor: "text-primary",
  },
};

export default function PasswordAnalyzer() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const analysis = useMemo(() => {
    return password ? analyzePassword(password) : null;
  }, [password]);

  const config = analysis ? strengthConfig[analysis.strength] : null;

  return (
    <Layout>
      <SEOHead
        title="Password Strength Analyzer | TechTrendi"
        description="Analyze your password strength in real-time. Check entropy, crack time, character pool, and get suggestions to improve your password security."
      />

      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Password Strength Analyzer
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Analyze Your Password Strength
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get detailed metrics on your password security including entropy,
            crack time estimates, and actionable suggestions.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Password Input Card */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
            <label className="block text-sm font-medium text-foreground mb-2">
              Enter your password to analyze
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Type a password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Your password is analyzed locally and never sent to any server.
            </p>

            {/* Strength Bar */}
            {analysis && config && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Strength
                  </span>
                  <span className={`text-sm font-semibold ${config.textColor}`}>
                    {analysis.strength}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${config.barColor}`}
                    style={{ width: `${analysis.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          {analysis && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Entropy
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {analysis.entropy.toFixed(1)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    bits
                  </span>
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Crack Time
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {analysis.crackTime}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  offline @ 100B/s
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Character Pool
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {analysis.charPool}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    chars
                  </span>
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Combinations
                </p>
                <p className="text-lg font-semibold text-foreground truncate">
                  {analysis.combinations}
                </p>
              </div>
            </div>
          )}

          {/* Requirements Checklist */}
          {analysis && (
            <div className="bg-card rounded-2xl border border-border shadow-card p-6">
              <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Requirements Checklist
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.requirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm"
                  >
                    {req.met ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    )}
                    <span
                      className={
                        req.met
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis && analysis.suggestions.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-card p-6">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Suggestions to Improve
              </h3>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strong password confirmation */}
          {analysis && analysis.score >= 80 && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-medium">
                Excellent! Your password is very strong with{" "}
                {analysis.entropy.toFixed(0)} bits of entropy.
              </span>
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Password Security Tips
            </h3>
            <ul className="space-y-3">
              {[
                "Use at least 12-16 characters for strong security",
                "Mix uppercase, lowercase, numbers, and symbols",
                "Avoid personal information like names or birthdays",
                "Don't reuse passwords across different sites",
                "Consider using a password manager",
                "Enable two-factor authentication when available",
              ].map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
