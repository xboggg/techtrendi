import { useState, useEffect, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  PiggyBank,
  Target,
  Clock,
  Sparkles,
  Calculator,
  RefreshCw,
  ChevronRight,
  Award,
  Rocket,
  Zap,
  Trophy,
  Star,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

interface InvestmentInputs {
  initialInvestment: number;
  monthlyContribution: number;
  annualInterestRate: number;
  investmentYears: number;
  compoundFrequency: "daily" | "monthly" | "quarterly" | "annually";
}

interface InvestmentResults {
  finalAmount: number;
  totalContributions: number;
  totalInterestEarned: number;
  growthData: GrowthDataPoint[];
  yearlyBreakdown: YearlyBreakdown[];
}

interface GrowthDataPoint {
  year: number;
  balance: number;
  contributions: number;
  interest: number;
}

interface YearlyBreakdown {
  year: number;
  startBalance: number;
  contributions: number;
  interestEarned: number;
  endBalance: number;
}

interface ScenarioComparison {
  rate: number;
  finalAmount: number;
  totalInterest: number;
}

interface HistoricalInsight {
  yearsAgo: number;
  wouldBeWorth: number;
  totalContributed: number;
  interestEarned: number;
}

// --- Constants ---

const RATE_PRESETS = [
  { value: 5, label: "Conservative (5%)", description: "Bond-like returns" },
  { value: 7, label: "Moderate (7%)", description: "Balanced portfolio" },
  { value: 10, label: "Growth (10%)", description: "Stock market average" },
  { value: 12, label: "Aggressive (12%)", description: "High-growth stocks" },
];

const COMPOUND_FREQUENCIES = [
  { value: "daily", label: "Daily", periodsPerYear: 365 },
  { value: "monthly", label: "Monthly", periodsPerYear: 12 },
  { value: "quarterly", label: "Quarterly", periodsPerYear: 4 },
  { value: "annually", label: "Annually", periodsPerYear: 1 },
];

const MOTIVATIONAL_QUOTES = [
  "Compound interest is the eighth wonder of the world. He who understands it, earns it; he who doesn't, pays it. - Albert Einstein",
  "The best time to start investing was yesterday. The second best time is today.",
  "Small consistent investments today create life-changing wealth tomorrow.",
  "Your future self will thank you for the financial decisions you make today.",
  "Building wealth isn't about getting rich quick; it's about getting rich for certain.",
];

// --- Calculation Functions ---

const getPeriodsPerYear = (frequency: string): number => {
  const freq = COMPOUND_FREQUENCIES.find(f => f.value === frequency);
  return freq ? freq.periodsPerYear : 12;
};

const calculateCompoundInterest = (inputs: InvestmentInputs): InvestmentResults => {
  const { initialInvestment, monthlyContribution, annualInterestRate, investmentYears, compoundFrequency } = inputs;

  const periodsPerYear = getPeriodsPerYear(compoundFrequency);
  const ratePerPeriod = annualInterestRate / 100 / periodsPerYear;
  const totalPeriods = investmentYears * periodsPerYear;

  const growthData: GrowthDataPoint[] = [];
  const yearlyBreakdown: YearlyBreakdown[] = [];

  let balance = initialInvestment;
  let totalContributions = initialInvestment;
  let totalInterest = 0;

  // Monthly contribution adjusted to period
  const contributionPerPeriod = monthlyContribution * (12 / periodsPerYear);

  for (let year = 1; year <= investmentYears; year++) {
    const startBalance = balance;
    let yearContributions = 0;
    let yearInterest = 0;

    for (let period = 0; period < periodsPerYear; period++) {
      // Add contribution at the start of each period
      balance += contributionPerPeriod;
      yearContributions += contributionPerPeriod;
      totalContributions += contributionPerPeriod;

      // Calculate and add interest
      const periodInterest = balance * ratePerPeriod;
      balance += periodInterest;
      yearInterest += periodInterest;
      totalInterest += periodInterest;
    }

    growthData.push({
      year,
      balance: Math.round(balance * 100) / 100,
      contributions: Math.round(totalContributions * 100) / 100,
      interest: Math.round(totalInterest * 100) / 100,
    });

    yearlyBreakdown.push({
      year,
      startBalance: Math.round(startBalance * 100) / 100,
      contributions: Math.round(yearContributions * 100) / 100,
      interestEarned: Math.round(yearInterest * 100) / 100,
      endBalance: Math.round(balance * 100) / 100,
    });
  }

  return {
    finalAmount: Math.round(balance * 100) / 100,
    totalContributions: Math.round(totalContributions * 100) / 100,
    totalInterestEarned: Math.round(totalInterest * 100) / 100,
    growthData,
    yearlyBreakdown,
  };
};

const calculateTimeToMillionaire = (
  initialInvestment: number,
  monthlyContribution: number,
  annualInterestRate: number,
  targetAmount: number = 1000000
): number | null => {
  if (monthlyContribution <= 0 && initialInvestment <= 0) return null;
  if (annualInterestRate <= 0) return null;

  const monthlyRate = annualInterestRate / 100 / 12;
  let balance = initialInvestment;
  let months = 0;
  const maxMonths = 100 * 12; // Cap at 100 years

  while (balance < targetAmount && months < maxMonths) {
    balance += monthlyContribution;
    balance *= (1 + monthlyRate);
    months++;
  }

  if (months >= maxMonths) return null;
  return Math.round(months / 12 * 10) / 10; // Return years with 1 decimal
};

const calculateScenarioComparisons = (inputs: InvestmentInputs): ScenarioComparison[] => {
  const rates = [5, 7, 10, 12, 15];
  return rates.map(rate => {
    const result = calculateCompoundInterest({ ...inputs, annualInterestRate: rate });
    return {
      rate,
      finalAmount: result.finalAmount,
      totalInterest: result.totalInterestEarned,
    };
  });
};

const calculateHistoricalInsights = (inputs: InvestmentInputs): HistoricalInsight[] => {
  const yearsAgoOptions = [5, 10, 15, 20, 25];
  return yearsAgoOptions
    .filter(years => years <= 30) // Reasonable limit
    .map(yearsAgo => {
      const result = calculateCompoundInterest({ ...inputs, investmentYears: yearsAgo });
      return {
        yearsAgo,
        wouldBeWorth: result.finalAmount,
        totalContributed: result.totalContributions,
        interestEarned: result.totalInterestEarned,
      };
    });
};

// --- Formatting Functions ---

const formatCurrency = (value: number): string => {
  if (value >= 1000000000) {
    return "$" + (value / 1000000000).toFixed(2) + "B";
  }
  if (value >= 1000000) {
    return "$" + (value / 1000000).toFixed(2) + "M";
  }
  if (value >= 1000) {
    return "$" + (value / 1000).toFixed(1) + "K";
  }
  return "$" + value.toFixed(2);
};

const formatFullCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// --- Component ---

export default function CompoundInterestCalculator() {
  const [inputs, setInputs] = useState<InvestmentInputs>({
    initialInvestment: 10000,
    monthlyContribution: 500,
    annualInterestRate: 7,
    investmentYears: 20,
    compoundFrequency: "monthly",
  });

  const [results, setResults] = useState<InvestmentResults | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioComparison[]>([]);
  const [historicalInsights, setHistoricalInsights] = useState<HistoricalInsight[]>([]);
  const [timeToMillionaire, setTimeToMillionaire] = useState<number | null>(null);
  const [showYearlyBreakdown, setShowYearlyBreakdown] = useState(false);
  const [randomQuote, setRandomQuote] = useState("");

  // Calculate results whenever inputs change
  useEffect(() => {
    const result = calculateCompoundInterest(inputs);
    setResults(result);
    setScenarios(calculateScenarioComparisons(inputs));
    setHistoricalInsights(calculateHistoricalInsights(inputs));
    setTimeToMillionaire(
      calculateTimeToMillionaire(inputs.initialInvestment, inputs.monthlyContribution, inputs.annualInterestRate)
    );
  }, [inputs]);

  // Set random quote on mount
  useEffect(() => {
    setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  const handleInputChange = useCallback((field: keyof InvestmentInputs, value: number | string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setInputs({
      initialInvestment: 10000,
      monthlyContribution: 500,
      annualInterestRate: 7,
      investmentYears: 20,
      compoundFrequency: "monthly",
    });
  }, []);

  // Calculate chart dimensions
  const chartHeight = 300;
  const chartWidth = 100; // percentage

  const maxValue = useMemo(() => {
    if (!results) return 0;
    return Math.max(...results.growthData.map(d => d.balance));
  }, [results]);

  // Interest percentage of final amount
  const interestPercentage = useMemo(() => {
    if (!results || results.finalAmount === 0) return 0;
    return Math.round((results.totalInterestEarned / results.finalAmount) * 100);
  }, [results]);

  return (
    <Layout>
      <SEOHead
        title="Investment Compound Interest Calculator - Watch Your Money Grow"
        description="Calculate your investment growth with our powerful compound interest calculator. See how your money grows over time with different interest rates and contribution amounts."
        canonical="/tools/compound-interest-calculator"
        keywords={["compound interest calculator", "investment calculator", "money growth", "retirement calculator", "savings calculator", "wealth building"]}
      />

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-emerald-950/30 dark:to-gray-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-green-500/10 to-teal-600/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-400/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Investment Calculator
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 bg-clip-text text-transparent">
                Watch Your Money Grow
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Discover the power of compound interest. See how small, consistent investments can transform into life-changing wealth.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 italic">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>"{randomQuote}"</span>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-20">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <Card className="sticky top-24 border-emerald-200 dark:border-emerald-800 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Investment Details
                  </CardTitle>
                  <CardDescription className="text-emerald-100">
                    Enter your investment parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Initial Investment */}
                  <div className="space-y-2">
                    <Label htmlFor="initialInvestment" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <PiggyBank className="w-4 h-4 text-emerald-500" />
                      Initial Investment
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="initialInvestment"
                        type="number"
                        value={inputs.initialInvestment}
                        onChange={(e) => handleInputChange("initialInvestment", Math.max(0, Number(e.target.value)))}
                        className="pl-9 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                        min={0}
                      />
                    </div>
                  </div>

                  {/* Monthly Contribution */}
                  <div className="space-y-2">
                    <Label htmlFor="monthlyContribution" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      Monthly Contribution
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="monthlyContribution"
                        type="number"
                        value={inputs.monthlyContribution}
                        onChange={(e) => handleInputChange("monthlyContribution", Math.max(0, Number(e.target.value)))}
                        className="pl-9 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                        min={0}
                      />
                    </div>
                  </div>

                  {/* Annual Interest Rate */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Percent className="w-4 h-4 text-emerald-500" />
                      Annual Interest Rate: {inputs.annualInterestRate}%
                    </Label>
                    <Slider
                      value={[inputs.annualInterestRate]}
                      onValueChange={(value) => handleInputChange("annualInterestRate", value[0])}
                      min={1}
                      max={20}
                      step={0.5}
                      className="py-2"
                    />
                    <div className="flex flex-wrap gap-2">
                      {RATE_PRESETS.map((preset) => (
                        <Button
                          key={preset.value}
                          variant={inputs.annualInterestRate === preset.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleInputChange("annualInterestRate", preset.value)}
                          className={cn(
                            "text-xs",
                            inputs.annualInterestRate === preset.value
                              ? "bg-gradient-to-r from-emerald-500 to-green-500 border-0"
                              : "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
                          )}
                        >
                          {preset.value}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Investment Period */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      Investment Period: {inputs.investmentYears} years
                    </Label>
                    <Slider
                      value={[inputs.investmentYears]}
                      onValueChange={(value) => handleInputChange("investmentYears", value[0])}
                      min={1}
                      max={50}
                      step={1}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 year</span>
                      <span>25 years</span>
                      <span>50 years</span>
                    </div>
                  </div>

                  {/* Compound Frequency */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <RefreshCw className="w-4 h-4 text-emerald-500" />
                      Compound Frequency
                    </Label>
                    <Select
                      value={inputs.compoundFrequency}
                      onValueChange={(value) => handleInputChange("compoundFrequency", value)}
                    >
                      <SelectTrigger className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPOUND_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label} ({freq.periodsPerYear}x/year)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Results Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Results Summary Cards */}
              {results && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg shadow-emerald-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <Trophy className="w-8 h-8 opacity-80" />
                          <Badge className="bg-white/20 text-white border-0">Final</Badge>
                        </div>
                        <p className="text-emerald-100 text-sm">Final Amount</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(results.finalAmount)}</p>
                        <p className="text-emerald-100 text-xs mt-2">{formatFullCurrency(results.finalAmount)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <PiggyBank className="w-8 h-8 opacity-80" />
                          <Badge className="bg-white/20 text-white border-0">Invested</Badge>
                        </div>
                        <p className="text-blue-100 text-sm">Total Contributions</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(results.totalContributions)}</p>
                        <p className="text-blue-100 text-xs mt-2">{formatFullCurrency(results.totalContributions)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <TrendingUp className="w-8 h-8 opacity-80" />
                          <Badge className="bg-white/20 text-white border-0">{interestPercentage}%</Badge>
                        </div>
                        <p className="text-amber-100 text-sm">Interest Earned</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(results.totalInterestEarned)}</p>
                        <p className="text-amber-100 text-xs mt-2">{formatFullCurrency(results.totalInterestEarned)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}

              {/* Growth Chart */}
              {results && (
                <Card className="border-emerald-200 dark:border-emerald-800 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Investment Growth Over Time
                    </CardTitle>
                    <CardDescription>
                      Visual representation of your wealth building journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-80 w-full">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-500">
                        <span>{formatCurrency(maxValue)}</span>
                        <span>{formatCurrency(maxValue * 0.75)}</span>
                        <span>{formatCurrency(maxValue * 0.5)}</span>
                        <span>{formatCurrency(maxValue * 0.25)}</span>
                        <span>$0</span>
                      </div>

                      {/* Chart area */}
                      <div className="absolute left-16 right-0 top-0 bottom-8 border-l border-b border-gray-200 dark:border-gray-700">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="border-t border-gray-100 dark:border-gray-800 w-full" />
                          ))}
                        </div>

                        {/* Bars */}
                        <div className="absolute inset-0 flex items-end justify-around px-2">
                          {results.growthData.map((data, index) => {
                            const totalHeight = (data.balance / maxValue) * 100;
                            const contributionHeight = (data.contributions / maxValue) * 100;
                            const interestHeight = totalHeight - contributionHeight;

                            // Only show every nth bar for readability
                            const showBar = results.growthData.length <= 20 || index % Math.ceil(results.growthData.length / 20) === 0;

                            if (!showBar) return null;

                            return (
                              <motion.div
                                key={data.year}
                                initial={{ height: 0 }}
                                animate={{ height: "100%" }}
                                transition={{ duration: 0.5, delay: index * 0.02 }}
                                className="relative flex flex-col justify-end"
                                style={{ width: `${100 / Math.min(results.growthData.length, 20)}%`, maxWidth: "40px" }}
                              >
                                <div
                                  className="group relative flex flex-col justify-end cursor-pointer"
                                  style={{ height: `${totalHeight}%` }}
                                >
                                  {/* Interest portion (top) */}
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(interestHeight / totalHeight) * 100}%` }}
                                    transition={{ duration: 0.3, delay: index * 0.02 + 0.3 }}
                                    className="bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-sm"
                                  />
                                  {/* Contribution portion (bottom) */}
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(contributionHeight / totalHeight) * 100}%` }}
                                    transition={{ duration: 0.3, delay: index * 0.02 }}
                                    className="bg-gradient-to-t from-emerald-600 to-emerald-400"
                                  />

                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                    <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap shadow-xl">
                                      <p className="font-semibold mb-1">Year {data.year}</p>
                                      <p>Balance: {formatFullCurrency(data.balance)}</p>
                                      <p>Contributed: {formatFullCurrency(data.contributions)}</p>
                                      <p>Interest: {formatFullCurrency(data.interest)}</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* X-axis labels */}
                      <div className="absolute left-16 right-0 bottom-0 h-8 flex justify-between items-center text-xs text-gray-500 px-2">
                        <span>Year 1</span>
                        <span>Year {Math.floor(inputs.investmentYears / 2)}</span>
                        <span>Year {inputs.investmentYears}</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-t from-emerald-600 to-emerald-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Contributions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-t from-amber-400 to-amber-300" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Interest Earned</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Millionaire Calculator */}
              <Card className="border-emerald-200 dark:border-emerald-800 shadow-xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-yellow-600" />
                    Millionaire Calculator
                  </CardTitle>
                  <CardDescription>
                    How long until you reach $1,000,000?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {timeToMillionaire !== null ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center py-6"
                      >
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 mb-4 shadow-lg shadow-yellow-500/30">
                          <Rocket className="w-12 h-12 text-white" />
                        </div>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                          At your current pace, you'll become a millionaire in
                        </p>
                        <p className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                          {timeToMillionaire} years
                        </p>
                        <p className="text-sm text-gray-500 mt-4">
                          That's around the year {new Date().getFullYear() + Math.ceil(timeToMillionaire)}!
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="no-result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-6"
                      >
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                          <Target className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-500">
                          Start investing to see your path to $1 million!
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Scenario Comparison */}
              <Card className="border-emerald-200 dark:border-emerald-800 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    Compare Different Returns
                  </CardTitle>
                  <CardDescription>
                    See how different interest rates affect your final amount
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-emerald-200 dark:border-emerald-800">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Rate</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Final Amount</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Interest Earned</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Interest %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarios.map((scenario, index) => (
                          <motion.tr
                            key={scenario.rate}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className={cn(
                              "border-b border-gray-100 dark:border-gray-800 transition-colors",
                              scenario.rate === inputs.annualInterestRate
                                ? "bg-emerald-50 dark:bg-emerald-900/20"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            )}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn(
                                    "font-semibold",
                                    scenario.rate === inputs.annualInterestRate
                                      ? "bg-emerald-500"
                                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                  )}
                                >
                                  {scenario.rate}%
                                </Badge>
                                {scenario.rate === inputs.annualInterestRate && (
                                  <ChevronRight className="w-4 h-4 text-emerald-500" />
                                )}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 font-semibold">
                              {formatFullCurrency(scenario.finalAmount)}
                            </td>
                            <td className="text-right py-3 px-4 text-emerald-600 dark:text-emerald-400">
                              +{formatFullCurrency(scenario.totalInterest)}
                            </td>
                            <td className="text-right py-3 px-4 text-gray-500 hidden sm:table-cell">
                              {Math.round((scenario.totalInterest / scenario.finalAmount) * 100)}%
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Historical Insight */}
              <Card className="border-emerald-200 dark:border-emerald-800 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-500" />
                    "If You Started X Years Ago..."
                  </CardTitle>
                  <CardDescription>
                    See what your investment would be worth if you had started earlier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {historicalInsights.map((insight, index) => (
                      <motion.div
                        key={insight.yearsAgo}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                            <ArrowUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="font-semibold text-purple-700 dark:text-purple-300">
                            {insight.yearsAgo} years ago
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                          {formatCurrency(insight.wouldBeWorth)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          From {formatCurrency(insight.totalContributed)} invested
                        </p>
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{formatCurrency(insight.interestEarned)} in interest
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4 italic">
                    The best time to start was years ago. The second best time is today.
                  </p>
                </CardContent>
              </Card>

              {/* Yearly Breakdown Table */}
              {results && (
                <Card className="border-emerald-200 dark:border-emerald-800 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-emerald-500" />
                          Year-by-Year Breakdown
                        </CardTitle>
                        <CardDescription>
                          Detailed view of your investment growth each year
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowYearlyBreakdown(!showYearlyBreakdown)}
                        className="border-emerald-200 hover:bg-emerald-50"
                      >
                        {showYearlyBreakdown ? "Hide" : "Show"} Details
                      </Button>
                    </div>
                  </CardHeader>
                  <AnimatePresence>
                    {showYearlyBreakdown && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent>
                          <div className="overflow-x-auto max-h-96 overflow-y-auto">
                            <table className="w-full">
                              <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <tr className="border-b-2 border-emerald-200 dark:border-emerald-800">
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Year</th>
                                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Start</th>
                                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Contributions</th>
                                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Interest</th>
                                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">End</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.yearlyBreakdown.map((row, index) => (
                                  <motion.tr
                                    key={row.year}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.1, delay: index * 0.02 }}
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
                                  >
                                    <td className="py-2 px-4 font-medium">Year {row.year}</td>
                                    <td className="text-right py-2 px-4 text-gray-600 dark:text-gray-400">
                                      {formatFullCurrency(row.startBalance)}
                                    </td>
                                    <td className="text-right py-2 px-4 text-blue-600 dark:text-blue-400">
                                      +{formatFullCurrency(row.contributions)}
                                    </td>
                                    <td className="text-right py-2 px-4 text-emerald-600 dark:text-emerald-400">
                                      +{formatFullCurrency(row.interestEarned)}
                                    </td>
                                    <td className="text-right py-2 px-4 font-semibold">
                                      {formatFullCurrency(row.endBalance)}
                                    </td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )}

              {/* Motivational Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-center py-8"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 mb-4 shadow-lg shadow-emerald-500/30">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Your Future Awaits
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                  Every journey to financial freedom starts with a single step. Start investing today and let compound interest work its magic for you.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
