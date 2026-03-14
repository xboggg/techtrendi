import { useState, useEffect, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator, DollarSign, Calendar, TrendingDown, Percent,
  PiggyBank, Printer, Trash2, ChevronDown, ChevronUp, PieChart,
  Scale, ArrowDownUp, Plus, Minus, BarChart3, RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CURRENCIES, getCurrencyInfo, getPreferredCurrency, setPreferredCurrency, formatCurrency } from "@/lib/currencies";

// --- Types ---

interface LoanInputs {
  loanAmount: number;
  interestRate: number;
  tenure: number;
  tenureType: "months" | "years";
  currency: string;
}

interface PrepaymentInputs {
  prepaymentAmount: number;
  prepaymentMonth: number;
  prepaymentType: "reduce_emi" | "reduce_tenure";
}

interface ComparisonScenario {
  id: string;
  name: string;
  interestRate: number;
  tenure: number;
  tenureType: "months" | "years";
}

interface AmortizationRow {
  month: number;
  principal: number;
  interest: number;
  balance: number;
  emi: number;
  totalPrincipal: number;
  totalInterest: number;
}

interface LoanResults {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  amortization: AmortizationRow[];
}

interface PrepaymentResults extends LoanResults {
  interestSaved: number;
  monthsSaved: number;
  newEmi: number;
}

// --- Helper Functions ---

const calculateEMI = (principal: number, annualRate: number, months: number): number => {
  if (principal <= 0 || months <= 0) return 0;
  if (annualRate <= 0) return principal / months;

  const monthlyRate = annualRate / 100 / 12;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  return emi;
};

const generateAmortization = (principal: number, annualRate: number, months: number): AmortizationRow[] => {
  if (principal <= 0 || months <= 0) return [];

  const monthlyRate = annualRate / 100 / 12;
  const emi = calculateEMI(principal, annualRate, months);
  const schedule: AmortizationRow[] = [];

  let balance = principal;
  let totalPrincipal = 0;
  let totalInterest = 0;

  for (let month = 1; month <= months; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = emi - interestPayment;
    balance -= principalPayment;
    totalPrincipal += principalPayment;
    totalInterest += interestPayment;

    schedule.push({
      month,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
      emi,
      totalPrincipal,
      totalInterest,
    });
  }

  return schedule;
};

const calculateWithPrepayment = (
  principal: number,
  annualRate: number,
  months: number,
  prepaymentAmount: number,
  prepaymentMonth: number,
  prepaymentType: "reduce_emi" | "reduce_tenure"
): PrepaymentResults => {
  const originalEmi = calculateEMI(principal, annualRate, months);
  const originalAmortization = generateAmortization(principal, annualRate, months);
  const originalTotalInterest = originalAmortization.reduce((sum, row) => sum + row.interest, 0);

  if (prepaymentAmount <= 0 || prepaymentMonth <= 0 || prepaymentMonth > months) {
    return {
      emi: originalEmi,
      totalInterest: originalTotalInterest,
      totalPayment: principal + originalTotalInterest,
      amortization: originalAmortization,
      interestSaved: 0,
      monthsSaved: 0,
      newEmi: originalEmi,
    };
  }

  const monthlyRate = annualRate / 100 / 12;
  const schedule: AmortizationRow[] = [];

  let balance = principal;
  let totalPrincipal = 0;
  let totalInterest = 0;
  let currentEmi = originalEmi;
  let actualMonths = 0;

  for (let month = 1; balance > 0.01; month++) {
    // Apply prepayment at specified month
    if (month === prepaymentMonth && prepaymentAmount > 0) {
      balance -= Math.min(prepaymentAmount, balance);

      if (prepaymentType === "reduce_emi" && balance > 0) {
        const remainingMonths = months - month + 1;
        currentEmi = calculateEMI(balance, annualRate, remainingMonths);
      }
    }

    const interestPayment = balance * monthlyRate;
    const principalPayment = Math.min(currentEmi - interestPayment, balance);
    balance -= principalPayment;
    totalPrincipal += principalPayment;
    totalInterest += interestPayment;
    actualMonths = month;

    schedule.push({
      month,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
      emi: currentEmi,
      totalPrincipal,
      totalInterest,
    });

    if (month > months * 2) break; // Safety limit
  }

  return {
    emi: currentEmi,
    totalInterest,
    totalPayment: principal + totalInterest,
    amortization: schedule,
    interestSaved: originalTotalInterest - totalInterest,
    monthsSaved: months - actualMonths,
    newEmi: prepaymentType === "reduce_emi" ? currentEmi : originalEmi,
  };
};

// --- Main Component ---

export default function LoanEmiCalculator() {
  // Main loan inputs
  const [inputs, setInputs] = useState<LoanInputs>({
    loanAmount: 100000,
    interestRate: 8.5,
    tenure: 5,
    tenureType: "years",
    currency: getPreferredCurrency(),
  });

  // Prepayment inputs
  const [prepayment, setPrepayment] = useState<PrepaymentInputs>({
    prepaymentAmount: 0,
    prepaymentMonth: 12,
    prepaymentType: "reduce_tenure",
  });

  // Comparison scenarios
  const [scenarios, setScenarios] = useState<ComparisonScenario[]>([
    { id: "1", name: "Lower Rate", interestRate: 7.5, tenure: 5, tenureType: "years" },
    { id: "2", name: "Shorter Term", interestRate: 8.5, tenure: 3, tenureType: "years" },
  ]);

  // UI state
  const [activeTab, setActiveTab] = useState("calculator");
  const [showAmortization, setShowAmortization] = useState(false);
  const [amortizationPage, setAmortizationPage] = useState(1);
  const rowsPerPage = 12;

  // Convert tenure to months
  const tenureInMonths = inputs.tenureType === "years" ? inputs.tenure * 12 : inputs.tenure;

  // Calculate results
  const results = useMemo((): LoanResults => {
    const emi = calculateEMI(inputs.loanAmount, inputs.interestRate, tenureInMonths);
    const amortization = generateAmortization(inputs.loanAmount, inputs.interestRate, tenureInMonths);
    const totalInterest = amortization.reduce((sum, row) => sum + row.interest, 0);

    return {
      emi,
      totalInterest,
      totalPayment: inputs.loanAmount + totalInterest,
      amortization,
    };
  }, [inputs.loanAmount, inputs.interestRate, tenureInMonths]);

  // Calculate prepayment results
  const prepaymentResults = useMemo((): PrepaymentResults => {
    return calculateWithPrepayment(
      inputs.loanAmount,
      inputs.interestRate,
      tenureInMonths,
      prepayment.prepaymentAmount,
      prepayment.prepaymentMonth,
      prepayment.prepaymentType
    );
  }, [inputs.loanAmount, inputs.interestRate, tenureInMonths, prepayment]);

  // Calculate comparison scenarios
  const comparisonResults = useMemo(() => {
    return scenarios.map(scenario => {
      const months = scenario.tenureType === "years" ? scenario.tenure * 12 : scenario.tenure;
      const emi = calculateEMI(inputs.loanAmount, scenario.interestRate, months);
      const amortization = generateAmortization(inputs.loanAmount, scenario.interestRate, months);
      const totalInterest = amortization.reduce((sum, row) => sum + row.interest, 0);

      return {
        ...scenario,
        emi,
        totalInterest,
        totalPayment: inputs.loanAmount + totalInterest,
        difference: totalInterest - results.totalInterest,
      };
    });
  }, [scenarios, inputs.loanAmount, results.totalInterest]);

  // Pie chart data
  const pieData = useMemo(() => {
    const principalPercent = (inputs.loanAmount / results.totalPayment) * 100;
    const interestPercent = (results.totalInterest / results.totalPayment) * 100;
    return { principalPercent, interestPercent };
  }, [inputs.loanAmount, results.totalInterest, results.totalPayment]);

  // Currency change handler
  const handleCurrencyChange = useCallback((code: string) => {
    setInputs(prev => ({ ...prev, currency: code }));
    setPreferredCurrency(code);
  }, []);

  // Format currency
  const fmt = useCallback((amount: number) => {
    return formatCurrency(amount, inputs.currency);
  }, [inputs.currency]);

  // Pagination for amortization table
  const paginatedAmortization = useMemo(() => {
    const start = (amortizationPage - 1) * rowsPerPage;
    return results.amortization.slice(start, start + rowsPerPage);
  }, [results.amortization, amortizationPage]);

  const totalPages = Math.ceil(results.amortization.length / rowsPerPage);

  // Reset calculator
  const handleReset = useCallback(() => {
    setInputs({
      loanAmount: 100000,
      interestRate: 8.5,
      tenure: 5,
      tenureType: "years",
      currency: getPreferredCurrency(),
    });
    setPrepayment({
      prepaymentAmount: 0,
      prepaymentMonth: 12,
      prepaymentType: "reduce_tenure",
    });
    toast.success("Calculator reset to defaults");
  }, []);

  // Print amortization
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Add comparison scenario
  const addScenario = useCallback(() => {
    const newId = (scenarios.length + 1).toString();
    setScenarios(prev => [
      ...prev,
      {
        id: newId,
        name: `Scenario ${newId}`,
        interestRate: inputs.interestRate,
        tenure: inputs.tenure,
        tenureType: inputs.tenureType,
      },
    ]);
  }, [scenarios.length, inputs.interestRate, inputs.tenure, inputs.tenureType]);

  // Remove comparison scenario
  const removeScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <Layout>
      <SEOHead
        title="Loan EMI Calculator - Calculate Monthly Payments & Interest"
        description="Free online Loan EMI Calculator. Calculate your monthly EMI, total interest, view amortization schedule, compare scenarios, and plan prepayments."
        canonical="/tools/loan-emi-calculator"
        keywords={["loan calculator", "EMI calculator", "monthly payment calculator", "amortization schedule", "loan interest calculator", "prepayment calculator"]}
      />

      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-green-600 text-white mb-4">
              <Calculator className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent mb-2">
              Loan EMI Calculator
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Calculate your monthly EMI, view detailed amortization schedule, compare loan scenarios, and plan prepayments to save on interest.
            </p>
          </motion.div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <TabsTrigger value="calculator" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
                <Calculator className="w-4 h-4 mr-2" />
                EMI
              </TabsTrigger>
              <TabsTrigger value="amortization" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="comparison" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
                <Scale className="w-4 h-4 mr-2" />
                Compare
              </TabsTrigger>
              <TabsTrigger value="prepayment" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
                <PiggyBank className="w-4 h-4 mr-2" />
                Prepay
              </TabsTrigger>
            </TabsList>

            {/* Calculator Tab */}
            <TabsContent value="calculator" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Input Card */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-teal-600" />
                      Loan Details
                    </CardTitle>
                    <CardDescription>Enter your loan information below</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* Currency Selector */}
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={inputs.currency} onValueChange={handleCurrencyChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.symbol} {c.code} - {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Loan Amount */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Loan Amount</Label>
                        <span className="text-sm font-semibold text-teal-600">{fmt(inputs.loanAmount)}</span>
                      </div>
                      <Input
                        type="number"
                        value={inputs.loanAmount}
                        onChange={(e) => setInputs(prev => ({ ...prev, loanAmount: Math.max(0, Number(e.target.value)) }))}
                        className="text-lg font-semibold"
                      />
                      <Slider
                        value={[inputs.loanAmount]}
                        onValueChange={([val]) => setInputs(prev => ({ ...prev, loanAmount: val }))}
                        max={10000000}
                        step={10000}
                        className="mt-2"
                      />
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Annual Interest Rate (%)</Label>
                        <span className="text-sm font-semibold text-teal-600">{inputs.interestRate}%</span>
                      </div>
                      <Input
                        type="number"
                        value={inputs.interestRate}
                        onChange={(e) => setInputs(prev => ({ ...prev, interestRate: Math.max(0, Math.min(50, Number(e.target.value))) }))}
                        step="0.1"
                        className="text-lg font-semibold"
                      />
                      <Slider
                        value={[inputs.interestRate]}
                        onValueChange={([val]) => setInputs(prev => ({ ...prev, interestRate: val }))}
                        max={30}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    {/* Loan Tenure */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Loan Tenure</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-teal-600">
                            {inputs.tenure} {inputs.tenureType}
                          </span>
                          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                            <button
                              onClick={() => setInputs(prev => ({ ...prev, tenureType: "months" }))}
                              className={cn(
                                "px-2 py-1 text-xs rounded-md transition-all",
                                inputs.tenureType === "months"
                                  ? "bg-teal-500 text-white"
                                  : "text-gray-600 dark:text-gray-300"
                              )}
                            >
                              Months
                            </button>
                            <button
                              onClick={() => setInputs(prev => ({ ...prev, tenureType: "years" }))}
                              className={cn(
                                "px-2 py-1 text-xs rounded-md transition-all",
                                inputs.tenureType === "years"
                                  ? "bg-teal-500 text-white"
                                  : "text-gray-600 dark:text-gray-300"
                              )}
                            >
                              Years
                            </button>
                          </div>
                        </div>
                      </div>
                      <Input
                        type="number"
                        value={inputs.tenure}
                        onChange={(e) => setInputs(prev => ({ ...prev, tenure: Math.max(1, Number(e.target.value)) }))}
                        className="text-lg font-semibold"
                      />
                      <Slider
                        value={[inputs.tenure]}
                        onValueChange={([val]) => setInputs(prev => ({ ...prev, tenure: val }))}
                        max={inputs.tenureType === "years" ? 30 : 360}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    {/* Reset Button */}
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="w-full"
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Reset Calculator
                    </Button>
                  </CardContent>
                </Card>

                {/* Results Card */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-green-600" />
                      EMI Breakdown
                    </CardTitle>
                    <CardDescription>Your monthly payment details</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Monthly EMI */}
                    <div className="text-center p-6 bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl mb-6">
                      <p className="text-teal-100 text-sm mb-1">Monthly EMI</p>
                      <p className="text-3xl md:text-4xl font-bold text-white">
                        {fmt(results.emi)}
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-xs">Principal</span>
                        </div>
                        <p className="text-lg font-bold">{fmt(inputs.loanAmount)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Percent className="w-4 h-4" />
                          <span className="text-xs">Total Interest</span>
                        </div>
                        <p className="text-lg font-bold text-amber-600">{fmt(results.totalInterest)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-xs">Total Payment</span>
                        </div>
                        <p className="text-lg font-bold">{fmt(results.totalPayment)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">Total Months</span>
                        </div>
                        <p className="text-lg font-bold">{tenureInMonths}</p>
                      </div>
                    </div>

                    {/* Pie Chart Visual */}
                    <div className="relative">
                      <div className="flex items-center justify-center mb-4">
                        <div className="relative w-48 h-48">
                          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="url(#principalGradient)"
                              strokeWidth="3"
                              strokeDasharray={`${pieData.principalPercent}, 100`}
                            />
                            <defs>
                              <linearGradient id="principalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#14b8a6" />
                                <stop offset="100%" stopColor="#22c55e" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xs text-muted-foreground">Principal</span>
                            <span className="text-xl font-bold text-teal-600">{pieData.principalPercent.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-green-500" />
                          <span className="text-sm">Principal ({pieData.principalPercent.toFixed(1)}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <span className="text-sm">Interest ({pieData.interestPercent.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Amortization Schedule Tab */}
            <TabsContent value="amortization" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-teal-600" />
                      Amortization Schedule
                    </CardTitle>
                    <CardDescription>Month-by-month breakdown of your loan payments</CardDescription>
                  </div>
                  <Button variant="outline" onClick={handlePrint} className="print:hidden">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 rounded-xl">
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly EMI</p>
                      <p className="font-bold text-teal-600">{fmt(results.emi)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Interest</p>
                      <p className="font-bold text-amber-600">{fmt(results.totalInterest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Payment</p>
                      <p className="font-bold">{fmt(results.totalPayment)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-bold">{tenureInMonths} months</p>
                    </div>
                  </div>

                  {/* Amortization Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-semibold">Month</th>
                          <th className="text-right py-3 px-4 font-semibold">EMI</th>
                          <th className="text-right py-3 px-4 font-semibold">Principal</th>
                          <th className="text-right py-3 px-4 font-semibold">Interest</th>
                          <th className="text-right py-3 px-4 font-semibold">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAmortization.map((row) => (
                          <tr key={row.month} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-3 px-4">
                              <Badge variant="outline">{row.month}</Badge>
                            </td>
                            <td className="text-right py-3 px-4">{fmt(row.emi)}</td>
                            <td className="text-right py-3 px-4 text-teal-600">{fmt(row.principal)}</td>
                            <td className="text-right py-3 px-4 text-amber-600">{fmt(row.interest)}</td>
                            <td className="text-right py-3 px-4 font-semibold">{fmt(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-muted-foreground">
                        Showing {((amortizationPage - 1) * rowsPerPage) + 1} to {Math.min(amortizationPage * rowsPerPage, results.amortization.length)} of {results.amortization.length} months
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAmortizationPage(p => Math.max(1, p - 1))}
                          disabled={amortizationPage === 1}
                        >
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAmortizationPage(p => Math.min(totalPages, p + 1))}
                          disabled={amortizationPage === totalPages}
                        >
                          Next
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-teal-600" />
                    What-If Scenarios
                  </CardTitle>
                  <CardDescription>Compare different interest rates and loan terms</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Current Loan Summary */}
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 rounded-xl mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-teal-500">Current Loan</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-bold">{fmt(inputs.loanAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rate</p>
                        <p className="font-bold">{inputs.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">EMI</p>
                        <p className="font-bold text-teal-600">{fmt(results.emi)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Interest</p>
                        <p className="font-bold text-amber-600">{fmt(results.totalInterest)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Scenarios */}
                  <div className="space-y-4">
                    {scenarios.map((scenario, index) => {
                      const result = comparisonResults[index];
                      return (
                        <motion.div
                          key={scenario.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <Input
                              value={scenario.name}
                              onChange={(e) => setScenarios(prev => prev.map(s =>
                                s.id === scenario.id ? { ...s, name: e.target.value } : s
                              ))}
                              className="w-40 h-8 text-sm font-semibold"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScenario(scenario.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-xs">Interest Rate (%)</Label>
                              <Input
                                type="number"
                                value={scenario.interestRate}
                                onChange={(e) => setScenarios(prev => prev.map(s =>
                                  s.id === scenario.id ? { ...s, interestRate: Number(e.target.value) } : s
                                ))}
                                step="0.1"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Tenure</Label>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  type="number"
                                  value={scenario.tenure}
                                  onChange={(e) => setScenarios(prev => prev.map(s =>
                                    s.id === scenario.id ? { ...s, tenure: Number(e.target.value) } : s
                                  ))}
                                  className="w-20"
                                />
                                <Select
                                  value={scenario.tenureType}
                                  onValueChange={(val: "months" | "years") => setScenarios(prev => prev.map(s =>
                                    s.id === scenario.id ? { ...s, tenureType: val } : s
                                  ))}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="months">Months</SelectItem>
                                    <SelectItem value="years">Years</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Monthly EMI</p>
                              <p className="font-bold text-teal-600">{fmt(result.emi)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Interest Difference</p>
                              <p className={cn(
                                "font-bold",
                                result.difference < 0 ? "text-green-600" : result.difference > 0 ? "text-red-600" : ""
                              )}>
                                {result.difference < 0 ? "-" : "+"}{fmt(Math.abs(result.difference))}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Add Scenario Button */}
                  <Button
                    variant="outline"
                    onClick={addScenario}
                    className="w-full mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Scenario
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prepayment Tab */}
            <TabsContent value="prepayment" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Prepayment Inputs */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2">
                      <PiggyBank className="w-5 h-5 text-teal-600" />
                      Prepayment Calculator
                    </CardTitle>
                    <CardDescription>See how prepayment can save you money</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* Prepayment Amount */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Prepayment Amount</Label>
                        <span className="text-sm font-semibold text-teal-600">{fmt(prepayment.prepaymentAmount)}</span>
                      </div>
                      <Input
                        type="number"
                        value={prepayment.prepaymentAmount}
                        onChange={(e) => setPrepayment(prev => ({ ...prev, prepaymentAmount: Math.max(0, Number(e.target.value)) }))}
                        className="text-lg font-semibold"
                      />
                      <Slider
                        value={[prepayment.prepaymentAmount]}
                        onValueChange={([val]) => setPrepayment(prev => ({ ...prev, prepaymentAmount: val }))}
                        max={inputs.loanAmount}
                        step={1000}
                        className="mt-2"
                      />
                    </div>

                    {/* Prepayment Month */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Prepay After Month</Label>
                        <span className="text-sm font-semibold text-teal-600">Month {prepayment.prepaymentMonth}</span>
                      </div>
                      <Input
                        type="number"
                        value={prepayment.prepaymentMonth}
                        onChange={(e) => setPrepayment(prev => ({ ...prev, prepaymentMonth: Math.max(1, Math.min(tenureInMonths, Number(e.target.value))) }))}
                        className="text-lg font-semibold"
                      />
                      <Slider
                        value={[prepayment.prepaymentMonth]}
                        onValueChange={([val]) => setPrepayment(prev => ({ ...prev, prepaymentMonth: val }))}
                        max={tenureInMonths}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    {/* Prepayment Type */}
                    <div className="space-y-2">
                      <Label>Prepayment Strategy</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPrepayment(prev => ({ ...prev, prepaymentType: "reduce_tenure" }))}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all text-left",
                            prepayment.prepaymentType === "reduce_tenure"
                              ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                              : "border-gray-200 dark:border-gray-700"
                          )}
                        >
                          <Calendar className="w-5 h-5 text-teal-600 mb-2" />
                          <p className="font-semibold text-sm">Reduce Tenure</p>
                          <p className="text-xs text-muted-foreground">Keep same EMI, finish faster</p>
                        </button>
                        <button
                          onClick={() => setPrepayment(prev => ({ ...prev, prepaymentType: "reduce_emi" }))}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all text-left",
                            prepayment.prepaymentType === "reduce_emi"
                              ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                              : "border-gray-200 dark:border-gray-700"
                          )}
                        >
                          <ArrowDownUp className="w-5 h-5 text-teal-600 mb-2" />
                          <p className="font-semibold text-sm">Reduce EMI</p>
                          <p className="text-xs text-muted-foreground">Lower monthly payment</p>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Prepayment Results */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-green-600" />
                      Savings Summary
                    </CardTitle>
                    <CardDescription>Your potential savings with prepayment</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {prepayment.prepaymentAmount > 0 ? (
                      <>
                        {/* Savings Highlight */}
                        <div className="text-center p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6">
                          <p className="text-green-100 text-sm mb-1">Total Interest Saved</p>
                          <p className="text-3xl md:text-4xl font-bold text-white">
                            {fmt(prepaymentResults.interestSaved)}
                          </p>
                        </div>

                        {/* Comparison Grid */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                              <p className="text-xs text-muted-foreground mb-1">Original EMI</p>
                              <p className="font-bold">{fmt(results.emi)}</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                              <p className="text-xs text-muted-foreground mb-1">New EMI</p>
                              <p className="font-bold text-green-600">{fmt(prepaymentResults.newEmi)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                              <p className="text-xs text-muted-foreground mb-1">Original Interest</p>
                              <p className="font-bold text-amber-600">{fmt(results.totalInterest)}</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                              <p className="text-xs text-muted-foreground mb-1">New Interest</p>
                              <p className="font-bold text-green-600">{fmt(prepaymentResults.totalInterest)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                              <p className="text-xs text-muted-foreground mb-1">Original Duration</p>
                              <p className="font-bold">{tenureInMonths} months</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                              <p className="text-xs text-muted-foreground mb-1">Months Saved</p>
                              <p className="font-bold text-green-600">{prepaymentResults.monthsSaved} months</p>
                            </div>
                          </div>
                        </div>

                        {/* Savings Percentage */}
                        <div className="mt-6 p-4 border border-green-200 dark:border-green-800 rounded-xl bg-green-50/50 dark:bg-green-900/10">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Interest Reduction</span>
                            <Badge className="bg-green-500">
                              {((prepaymentResults.interestSaved / results.totalInterest) * 100).toFixed(1)}% saved
                            </Badge>
                          </div>
                          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                              style={{ width: `${Math.min(100, (prepaymentResults.interestSaved / results.totalInterest) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <PiggyBank className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-muted-foreground">Enter a prepayment amount to see your potential savings</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-teal-500/10 to-green-500/10 border-teal-200 dark:border-teal-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-teal-600" />
                  Tips to Save on Your Loan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid md:grid-cols-2 gap-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">1.</span>
                    <span>Make prepayments whenever possible - even small amounts add up over time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">2.</span>
                    <span>Consider balance transfer to a lower interest rate loan if available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">3.</span>
                    <span>Choose shorter loan tenure if you can afford higher EMIs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">4.</span>
                    <span>Use bonuses or windfalls for lump sum prepayments</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">What is EMI?</h4>
                  <p className="text-sm text-muted-foreground">
                    EMI (Equated Monthly Installment) is the fixed amount you pay to the lender each month until the loan is fully repaid. It includes both principal and interest components.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">How is EMI calculated?</h4>
                  <p className="text-sm text-muted-foreground">
                    EMI is calculated using the formula: EMI = P x r x (1 + r)^n / ((1 + r)^n - 1), where P is principal, r is monthly interest rate, and n is the number of months.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Should I reduce tenure or EMI when prepaying?</h4>
                  <p className="text-sm text-muted-foreground">
                    Reducing tenure saves more interest overall, while reducing EMI provides immediate cash flow relief. Choose based on your financial goals and situation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
