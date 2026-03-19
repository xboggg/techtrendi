import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PasswordAnalysis {
  score: number;
  strength: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  feedback: string[];
  timeToCrack: string;
}

export default function PasswordChecker() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null);

  const analyzePassword = (pwd: string): PasswordAnalysis => {
    let score = 0;
    const feedback: string[] = [];

    // Length checks
    if (pwd.length >= 8) score += 10;
    if (pwd.length >= 12) score += 10;
    if (pwd.length >= 16) score += 10;
    if (pwd.length < 8) feedback.push("Use at least 8 characters");

    // Character type checks
    if (/[a-z]/.test(pwd)) score += 10;
    else feedback.push("Add lowercase letters");

    if (/[A-Z]/.test(pwd)) score += 10;
    else feedback.push("Add uppercase letters");

    if (/[0-9]/.test(pwd)) score += 10;
    else feedback.push("Add numbers");

    if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;
    else feedback.push("Add special characters (!@#$%^&*)");

    // Pattern checks
    if (/(.)\1{2,}/.test(pwd)) {
      score -= 10;
      feedback.push("Avoid repeated characters");
    }

    if (/^[a-zA-Z]+$/.test(pwd)) {
      score -= 5;
      feedback.push("Don't use only letters");
    }

    if (/^[0-9]+$/.test(pwd)) {
      score -= 15;
      feedback.push("Don't use only numbers");
    }

    // Common patterns
    const commonPatterns = ["password", "123456", "qwerty", "abc123", "letmein", "admin"];
    if (commonPatterns.some(p => pwd.toLowerCase().includes(p))) {
      score -= 30;
      feedback.push("Avoid common passwords and patterns");
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    // Determine strength
    let strength: PasswordAnalysis["strength"];
    if (score < 20) strength = "Very Weak";
    else if (score < 40) strength = "Weak";
    else if (score < 60) strength = "Fair";
    else if (score < 80) strength = "Strong";
    else strength = "Very Strong";

    // Estimate time to crack
    const entropy = pwd.length * Math.log2(
      ((/[a-z]/.test(pwd) ? 26 : 0) +
        (/[A-Z]/.test(pwd) ? 26 : 0) +
        (/[0-9]/.test(pwd) ? 10 : 0) +
        (/[^a-zA-Z0-9]/.test(pwd) ? 33 : 0)) || 1
    );

    const guessesPerSecond = 10000000000; // 10 billion
    const seconds = Math.pow(2, entropy) / guessesPerSecond;

    let timeToCrack: string;
    if (seconds < 1) timeToCrack = "Instantly";
    else if (seconds < 60) timeToCrack = `${Math.round(seconds)} seconds`;
    else if (seconds < 3600) timeToCrack = `${Math.round(seconds / 60)} minutes`;
    else if (seconds < 86400) timeToCrack = `${Math.round(seconds / 3600)} hours`;
    else if (seconds < 31536000) timeToCrack = `${Math.round(seconds / 86400)} days`;
    else if (seconds < 31536000 * 100) timeToCrack = `${Math.round(seconds / 31536000)} years`;
    else timeToCrack = "Centuries+";

    return { score, strength, feedback, timeToCrack };
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    if (pwd) {
      setAnalysis(analyzePassword(pwd));
    } else {
      setAnalysis(null);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "Very Weak":
        return "bg-destructive";
      case "Weak":
        return "bg-orange-500";
      case "Fair":
        return "bg-yellow-500";
      case "Strong":
        return "bg-green-500";
      case "Very Strong":
        return "bg-primary";
      default:
        return "bg-muted";
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Password Strength Checker"
        description="Test how strong your password really is. Get a strength score, estimated crack time, and tips to make it better."
        canonical="/tools/password-checker"
        keywords={["password checker", "password strength", "password tester", "secure password", "password security"]}
      />
      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Password Strength Checker
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Check Your Password Strength
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Analyze your password security and get recommendations for improvement.
          </p>
        </div>

        {/* Checker Tool */}
        <div className="max-w-xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Enter your password to check
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Your password is checked locally and never sent to any server.
              </p>
            </div>

            {analysis && (
              <div className="space-y-6">
                {/* Strength Meter */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Strength</span>
                    <span
                      className={`text-sm font-semibold ${
                        analysis.score >= 60 ? "text-green-500" : analysis.score >= 40 ? "text-yellow-500" : "text-destructive"
                      }`}
                    >
                      {analysis.strength}
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor(analysis.strength)}`}
                      style={{ width: `${analysis.score}%` }}
                    />
                  </div>
                </div>

                {/* Time to Crack */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <span className="text-sm text-muted-foreground">Time to crack:</span>
                  <span className="font-semibold text-foreground">{analysis.timeToCrack}</span>
                </div>

                {/* Feedback */}
                {analysis.feedback.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Suggestions for improvement
                    </h3>
                    <ul className="space-y-2">
                      {analysis.feedback.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Score >= 80 */}
                {analysis.score >= 80 && (
                  <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-xl text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Excellent! Your password is very strong.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-card rounded-2xl border border-border shadow-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Password Security Tips</h3>
            <ul className="space-y-3">
              {[
                "Use at least 12-16 characters",
                "Mix uppercase, lowercase, numbers, and symbols",
                "Avoid personal information like names or birthdays",
                "Don't reuse passwords across different sites",
                "Consider using a password manager",
                "Enable two-factor authentication when available",
              ].map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
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
