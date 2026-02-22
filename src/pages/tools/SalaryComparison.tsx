import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign, TrendingUp, TrendingDown, Share2, Users, Briefcase,
  MapPin, GraduationCap, Clock, ArrowRight, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Salary data by role and experience (in USD, annual)
const salaryData: Record<string, Record<string, { min: number; median: number; max: number }>> = {
  "Software Engineer": {
    "0-2": { min: 60000, median: 75000, max: 95000 },
    "3-5": { min: 85000, median: 110000, max: 140000 },
    "6-10": { min: 120000, median: 150000, max: 200000 },
    "10+": { min: 160000, median: 200000, max: 300000 },
  },
  "Product Manager": {
    "0-2": { min: 70000, median: 90000, max: 110000 },
    "3-5": { min: 100000, median: 130000, max: 160000 },
    "6-10": { min: 140000, median: 175000, max: 220000 },
    "10+": { min: 180000, median: 230000, max: 320000 },
  },
  "Data Scientist": {
    "0-2": { min: 65000, median: 85000, max: 105000 },
    "3-5": { min: 95000, median: 125000, max: 155000 },
    "6-10": { min: 130000, median: 165000, max: 210000 },
    "10+": { min: 170000, median: 220000, max: 300000 },
  },
  "UX Designer": {
    "0-2": { min: 50000, median: 65000, max: 85000 },
    "3-5": { min: 75000, median: 95000, max: 120000 },
    "6-10": { min: 100000, median: 130000, max: 165000 },
    "10+": { min: 130000, median: 165000, max: 220000 },
  },
  "Marketing Manager": {
    "0-2": { min: 45000, median: 60000, max: 75000 },
    "3-5": { min: 65000, median: 85000, max: 110000 },
    "6-10": { min: 90000, median: 120000, max: 160000 },
    "10+": { min: 120000, median: 160000, max: 220000 },
  },
  "DevOps Engineer": {
    "0-2": { min: 65000, median: 85000, max: 105000 },
    "3-5": { min: 95000, median: 125000, max: 155000 },
    "6-10": { min: 130000, median: 165000, max: 210000 },
    "10+": { min: 165000, median: 210000, max: 280000 },
  },
  "Frontend Developer": {
    "0-2": { min: 55000, median: 70000, max: 90000 },
    "3-5": { min: 80000, median: 105000, max: 135000 },
    "6-10": { min: 115000, median: 145000, max: 185000 },
    "10+": { min: 150000, median: 190000, max: 260000 },
  },
  "Backend Developer": {
    "0-2": { min: 60000, median: 75000, max: 95000 },
    "3-5": { min: 85000, median: 115000, max: 145000 },
    "6-10": { min: 125000, median: 155000, max: 200000 },
    "10+": { min: 160000, median: 205000, max: 280000 },
  },
  "Project Manager": {
    "0-2": { min: 50000, median: 65000, max: 80000 },
    "3-5": { min: 70000, median: 90000, max: 115000 },
    "6-10": { min: 95000, median: 125000, max: 160000 },
    "10+": { min: 125000, median: 165000, max: 220000 },
  },
  "Sales Representative": {
    "0-2": { min: 40000, median: 55000, max: 75000 },
    "3-5": { min: 60000, median: 85000, max: 120000 },
    "6-10": { min: 90000, median: 130000, max: 180000 },
    "10+": { min: 120000, median: 170000, max: 250000 },
  },
};

const locationMultipliers: Record<string, number> = {
  "San Francisco": 1.3,
  "New York": 1.25,
  "Seattle": 1.2,
  "Los Angeles": 1.15,
  "Boston": 1.15,
  "Austin": 1.05,
  "Denver": 1.0,
  "Chicago": 1.0,
  "Remote (US)": 0.95,
  "Other US": 0.9,
};

export default function SalaryComparison() {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    if (!role || !experience || !location) return null;

    const baseSalary = salaryData[role]?.[experience];
    if (!baseSalary) return null;

    const multiplier = locationMultipliers[location] || 1;

    return {
      min: Math.round(baseSalary.min * multiplier),
      median: Math.round(baseSalary.median * multiplier),
      max: Math.round(baseSalary.max * multiplier),
    };
  }, [role, experience, location]);

  const comparison = useMemo(() => {
    if (!results || !currentSalary) return null;

    const salary = parseInt(currentSalary.replace(/[^0-9]/g, ""));
    if (isNaN(salary)) return null;

    const percentile = ((salary - results.min) / (results.max - results.min)) * 100;
    const clampedPercentile = Math.max(0, Math.min(100, percentile));

    const diffFromMedian = salary - results.median;
    const percentDiff = ((diffFromMedian / results.median) * 100).toFixed(1);

    return {
      percentile: Math.round(clampedPercentile),
      diffFromMedian,
      percentDiff,
      isAboveMedian: diffFromMedian >= 0,
    };
  }, [results, currentSalary]);

  const handleCompare = () => {
    if (!role || !experience || !location) {
      toast.error("Please fill in all fields");
      return;
    }
    setShowResults(true);
  };

  const shareResult = () => {
    const text = comparison
      ? `I'm in the ${comparison.percentile}th percentile for ${role} salaries! Check your salary at techtrendi.com/tools/salary-comparison`
      : `Check if you're being paid fairly at techtrendi.com/tools/salary-comparison`;
    navigator.clipboard.writeText(text);
    toast.success("Copied! Share with your network.");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 90) return { text: "Top 10%!", color: "text-green-600" };
    if (percentile >= 75) return { text: "Above Average", color: "text-green-500" };
    if (percentile >= 50) return { text: "Average", color: "text-blue-500" };
    if (percentile >= 25) return { text: "Below Average", color: "text-yellow-600" };
    return { text: "Below Market", color: "text-red-500" };
  };

  return (
    <Layout>
      <SEOHead
        title="Salary Comparison Tool - Are You Underpaid? | TechTrendi"
        description="Compare your salary to market rates. See where you stand compared to others in your role, experience level, and location."
        canonicalUrl="https://techtrendi.com/tools/salary-comparison"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Salary <span className="text-primary">Comparison</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Are you being paid fairly? Compare your salary to market rates.
          </p>
        </div>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Your Details</CardTitle>
            <CardDescription>We'll compare your salary to market data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Job Role
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(salaryData).map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Years of Experience
                </Label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(locationMultipliers).map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Your Current Salary (Annual)
                </Label>
                <Input
                  type="text"
                  value={currentSalary}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setCurrentSalary(value ? formatCurrency(parseInt(value)) : "");
                  }}
                  placeholder="$100,000"
                  className="mt-1"
                />
              </div>
            </div>

            <Button onClick={handleCompare} size="lg" className="w-full">
              Compare My Salary
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {showResults && results && (
          <div className="space-y-6">
            {/* Salary Range */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Market Salary Range
                </CardTitle>
                <CardDescription>
                  {role} with {experience} years in {location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Minimum</p>
                    <p className="text-2xl font-bold">{formatCurrency(results.min)}</p>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                    <p className="text-sm text-primary mb-1">Median</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(results.median)}</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Maximum</p>
                    <p className="text-2xl font-bold">{formatCurrency(results.max)}</p>
                  </div>
                </div>

                {/* Salary Bar */}
                <div className="relative">
                  <div className="h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>{formatCurrency(results.min)}</span>
                    <span>{formatCurrency(results.max)}</span>
                  </div>
                  {comparison && (
                    <div
                      className="absolute top-0 -mt-1"
                      style={{ left: `${comparison.percentile}%`, transform: "translateX(-50%)" }}
                    >
                      <div className="w-6 h-6 bg-white border-2 border-primary rounded-full shadow flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Your Position */}
            {comparison && (
              <Card className={cn(
                "border-2",
                comparison.isAboveMedian ? "border-green-500" : "border-yellow-500"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Your Position</p>
                      <p className={cn("text-3xl font-bold", getPercentileLabel(comparison.percentile).color)}>
                        {comparison.percentile}th Percentile
                      </p>
                      <p className={cn("font-medium", getPercentileLabel(comparison.percentile).color)}>
                        {getPercentileLabel(comparison.percentile).text}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {comparison.isAboveMedian ? (
                          <TrendingUp className="w-6 h-6 text-green-500" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-red-500" />
                        )}
                        <span className={cn(
                          "text-2xl font-bold",
                          comparison.isAboveMedian ? "text-green-500" : "text-red-500"
                        )}>
                          {comparison.isAboveMedian ? "+" : ""}{comparison.percentDiff}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {comparison.isAboveMedian ? "above" : "below"} median
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>What This Means</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comparison && comparison.percentile < 50 && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">You may be underpaid</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Consider negotiating a raise or exploring new opportunities. The median salary for your role is {formatCurrency(results.median)}.
                      </p>
                    </div>
                  </div>
                )}
                {comparison && comparison.percentile >= 50 && comparison.percentile < 75 && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">You're at market rate</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your salary is competitive for your role and experience level.
                      </p>
                    </div>
                  </div>
                )}
                {comparison && comparison.percentile >= 75 && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">You're well compensated!</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your salary is above average for your role. Great job negotiating!
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={shareResult}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Your Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-8">
          Salary data is approximate and based on industry surveys. Actual compensation may vary based on company size, specific skills, and other factors.
        </p>
      </div>
    </Layout>
  );
}
