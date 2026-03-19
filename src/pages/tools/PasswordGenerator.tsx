import { useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw, Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  const generatePassword = useCallback(() => {
    let chars = "";
    if (options.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (options.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
    if (options.numbers) chars += "0123456789";
    if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!chars) {
      toast.error("Please select at least one character type");
      return;
    }

    let newPassword = "";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      newPassword += chars[array[i] % chars.length];
    }
    
    setPassword(newPassword);
    setCopied(false);
  }, [length, options]);

  const copyToClipboard = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getPasswordStrength = () => {
    if (!password) return { label: "None", color: "bg-muted", width: "0%" };
    
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: "Weak", color: "bg-destructive", width: "25%" };
    if (score <= 4) return { label: "Medium", color: "bg-accent", width: "50%" };
    if (score <= 5) return { label: "Strong", color: "bg-secondary", width: "75%" };
    return { label: "Very Strong", color: "bg-primary", width: "100%" };
  };

  const strength = getPasswordStrength();

  return (
    <Layout>
      <SEOHead
        title="Password Generator"
        description="Create strong, random passwords you can trust. Choose length, character types, and copy with one click."
        canonical="/tools/password-generator"
        keywords={["password generator", "random password", "strong password", "secure password generator", "password creator"]}
      />
      <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Password Generator
            </h1>
            <p className="text-muted-foreground text-lg">
              Generate strong, secure passwords to protect your accounts.
            </p>
          </div>

          {/* Generator Card */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
            {/* Password Display */}
            <div className="relative mb-6">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  readOnly
                  placeholder="Click generate to create password"
                  className="flex-1 bg-transparent text-foreground font-mono text-lg focus:outline-none"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={copyToClipboard}
                  disabled={!password}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              {/* Strength Indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Strength</span>
                    <span className="font-medium text-foreground">{strength.label}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Length Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Password Length</label>
                <span className="text-sm font-bold text-primary">{length}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>8</span>
                <span>64</span>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { key: "uppercase", label: "Uppercase (A-Z)" },
                { key: "lowercase", label: "Lowercase (a-z)" },
                { key: "numbers", label: "Numbers (0-9)" },
                { key: "symbols", label: "Symbols (!@#$)" },
              ].map((option) => (
                <label
                  key={option.key}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={options[option.key as keyof typeof options]}
                    onChange={(e) =>
                      setOptions({ ...options, [option.key]: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-border accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Generate Button */}
            <Button variant="hero" size="xl" onClick={generatePassword} className="w-full">
              <RefreshCw className="w-5 h-5 mr-2" />
              Generate Password
            </Button>
          </div>

          {/* Tips Section */}
          <div className="mt-10 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">Password Security Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Use at least 16 characters for maximum security
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Include a mix of uppercase, lowercase, numbers, and symbols
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Never reuse passwords across different accounts
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Consider using a password manager to store your passwords securely
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
