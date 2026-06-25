import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Calculator, Smartphone, ArrowRight, CheckCircle2, XCircle, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface UpgradeResult {
  shouldUpgrade: boolean;
  score: number;
  reasons: string[];
  recommendation: string;
}

export default function UpgradeCalculator() {
  const [currentDevice, setCurrentDevice] = useState("");
  const [deviceAge, setDeviceAge] = useState([2]);
  const [batteryHealth, setBatteryHealth] = useState("good");
  const [performanceSatisfaction, setPerformanceSatisfaction] = useState([7]);
  const [primaryUse, setPrimaryUse] = useState("general");
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState<UpgradeResult | null>(null);
  const { subscription } = useAuth();

  const calculate = () => {
    let score = 50; // Start neutral
    const reasons: string[] = [];

    // Age factor
    if (deviceAge[0] >= 4) {
      score += 25;
      reasons.push("Your device is 4+ years old - newer models offer significant improvements");
    } else if (deviceAge[0] >= 3) {
      score += 15;
      reasons.push("At 3 years, you may benefit from software and security updates on newer devices");
    } else if (deviceAge[0] <= 1) {
      score -= 20;
      reasons.push("Your device is relatively new - upgrading may not be cost-effective");
    }

    // Battery health
    if (batteryHealth === "poor") {
      score += 20;
      reasons.push("Poor battery health significantly impacts daily use - consider upgrade or battery replacement");
    } else if (batteryHealth === "fair") {
      score += 10;
      reasons.push("Battery health is declining - monitor closely");
    } else {
      score -= 5;
      reasons.push("Good battery health means your device can last longer");
    }

    // Performance satisfaction
    if (performanceSatisfaction[0] <= 4) {
      score += 25;
      reasons.push("Low satisfaction indicates you'd benefit from a performance upgrade");
    } else if (performanceSatisfaction[0] <= 6) {
      score += 10;
      reasons.push("Moderate satisfaction - consider waiting for a compelling upgrade");
    } else {
      score -= 15;
      reasons.push("High satisfaction means your current device meets your needs well");
    }

    // Primary use
    if (primaryUse === "gaming" || primaryUse === "professional") {
      score += 10;
      reasons.push("Power users often benefit more from the latest hardware");
    } else if (primaryUse === "basic") {
      score -= 10;
      reasons.push("For basic use, current devices often remain capable for longer");
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    let shouldUpgrade = score >= 60;
    let recommendation = "";

    if (score >= 80) {
      recommendation = "Strong recommendation to upgrade. Your current device shows multiple signs of aging.";
    } else if (score >= 60) {
      recommendation = "Consider upgrading soon. You would likely benefit from newer hardware.";
    } else if (score >= 40) {
      recommendation = "You can wait. Your device still serves you well for now.";
    } else {
      recommendation = "No need to upgrade. Your current device is still a great fit for your needs.";
    }

    setResult({ shouldUpgrade, score, reasons, recommendation });
  };

  return (
    <Layout>
      <SEOHead
        title="Tech Upgrade Calculator"
        description="Not sure if that new phone or laptop is worth it? Answer a few questions and get a personalized upgrade recommendation."
        canonical="/tools/upgrade-calculator"
        keywords={["upgrade calculator", "should i upgrade", "tech upgrade", "device upgrade", "phone upgrade"]}
      />
      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Calculator className="w-4 h-4" />
            Should I Upgrade? Calculator
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Should You Upgrade Your Device?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Answer a few questions about your current device and usage to get a personalized recommendation.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
            <div className="space-y-8">
              {/* Current Device */}
              <div>
                <Label className="text-foreground">Current Device (optional)</Label>
                <Input
                  placeholder="e.g., iPhone 12, Samsung Galaxy S21"
                  value={currentDevice}
                  onChange={(e) => setCurrentDevice(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Device Age */}
              <div>
                <Label className="text-foreground">
                  How old is your device? ({deviceAge[0]} {deviceAge[0] === 1 ? "year" : "years"})
                </Label>
                <Slider
                  value={deviceAge}
                  onValueChange={setDeviceAge}
                  max={6}
                  min={0}
                  step={0.5}
                  className="mt-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>New</span>
                  <span>6+ years</span>
                </div>
              </div>

              {/* Battery Health */}
              <div>
                <Label className="text-foreground mb-3 block">Battery Health</Label>
                <RadioGroup value={batteryHealth} onValueChange={setBatteryHealth} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="good" id="good" />
                    <Label htmlFor="good" className="text-sm cursor-pointer">Good (80%+)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fair" id="fair" />
                    <Label htmlFor="fair" className="text-sm cursor-pointer">Fair (60-80%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poor" id="poor" />
                    <Label htmlFor="poor" className="text-sm cursor-pointer">Poor (&lt;60%)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Performance Satisfaction */}
              <div>
                <Label className="text-foreground">
                  Performance Satisfaction ({performanceSatisfaction[0]}/10)
                </Label>
                <Slider
                  value={performanceSatisfaction}
                  onValueChange={setPerformanceSatisfaction}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Very Slow</span>
                  <span>Perfect</span>
                </div>
              </div>

              {/* Primary Use */}
              <div>
                <Label className="text-foreground mb-3 block">Primary Use</Label>
                <RadioGroup value={primaryUse} onValueChange={setPrimaryUse} className="grid grid-cols-2 gap-3">
                  {[
                    { value: "basic", label: "Basic (calls, texts, browsing)" },
                    { value: "general", label: "General (social, photos, apps)" },
                    { value: "gaming", label: "Gaming & Media" },
                    { value: "professional", label: "Professional Work" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="text-sm cursor-pointer">{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Budget */}
              <div>
                <Label className="text-foreground">Budget for new device (optional)</Label>
                <Input
                  placeholder="e.g., $800, $1000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Button onClick={calculate} className="w-full" size="lg">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Recommendation
              </Button>
            </div>

            {/* Result */}
            {result && (
              <div className="mt-8 pt-8 border-t border-border">
                <div
                  className={`p-6 rounded-xl mb-6 ${
                    result.shouldUpgrade
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-green-500/10 border border-green-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {result.shouldUpgrade ? (
                      <Smartphone className="w-8 h-8 text-primary" />
                    ) : (
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {result.shouldUpgrade ? "Consider Upgrading" : "Keep Your Current Device"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Upgrade Score: {result.score}/100
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground">{result.recommendation}</p>
                </div>

                {/* Reasons */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Analysis Details</h4>
                  <ul className="space-y-2">
                    {result.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Premium Upsell */}
          {!subscription.subscribed && (
            <div className="mt-8 bg-gradient-primary rounded-2xl p-8 text-center">
              <Crown className="w-10 h-10 text-primary-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-primary-foreground mb-2">
                Get Personalized Recommendations
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
                Premium users get AI-powered device recommendations, trade-in value estimates, and best deal alerts.
              </p>
              <Link to="/auth">
                <Button variant="secondary" className="bg-background text-foreground hover:bg-background/90">
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
