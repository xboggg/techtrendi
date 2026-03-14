import { useState, useEffect, useCallback, useRef } from "react";
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
  Home, DollarSign, Calendar, TrendingDown, Calculator,
  Percent, PiggyBank, Printer, Trash2, Save, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

interface LoanInputs {
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  downPayment: number;
  downPaymentType: "amount" | "percent";
  extraMonthlyPayment: number;
  currency: string;
}

interface LoanResults {
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  effectiveLoan: number;
  amortization: AmortizationRow[];
  monthlyPaymentWithExtra: number;
  totalInterestWithExtra: number;
  totalAmountWithExtra: number;
  monthsSavedWithExtra: number;
  interestSavedWithExtra: number;
  amortizationWithExtra: AmortizationRow[];
}

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface SavedCalculation {
  id: string;
  name: string;
  inputs: LoanInputs;
  results: LoanResults;
  date: string;
}

// --- Currency config ---

const CURRENCIES: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "\u20AC", name: "Euro" },
  GBP: { symbol: "\u00A3", name: "British Pound" },
  GHS: { symbol: "GH\u20B5", name: "Ghana Cedi" },
  NGN: { symbol: "\u20A6", name: "Nigerian Naira" },
  KES: { symbol: "KSh", name: "Kenyan Shilling" },
  ZAR: { symbol: "R", name: "South African Rand" },
  INR: { symbol: "\u20B9", name: "Indian Rupee" },
  CAD: { symbol: "C$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
};

// --- Calculation helpers ---

function calculateLoan(inputs: LoanInputs): LoanResults {
  const { loanAmount, interestRate, loanTermYears, downPayment, downPaymentType, extraMonthlyPayment } = inputs;

  const downPaymentAmount = downPaymentType === "percent"
    ? (loanAmount * downPayment) / 100
    : downPayment;
  const effectiveLoan = Math.max(loanAmount - downPaymentAmount, 0);
  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = loanTermYears * 12;

  // Standard monthly payment (no extra)
  let monthlyPayment = 0;
  if (monthlyRate > 0 && totalMonths > 0 && effectiveLoan > 0) {
    monthlyPayment =
      (effectiveLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  } else if (totalMonths > 0 && effectiveLoan > 0) {
    monthlyPayment = effectiveLoan / totalMonths;
  }

  // Build standard amortization
  const amortization = buildAmortization(effectiveLoan, monthlyRate, monthlyPayment, totalMonths, 0);
  const totalAmount = amortization.reduce((s, r) => s + r.payment, 0);
  const totalInterest = totalAmount - effectiveLoan;

  // Build amortization with extra payments
  const amortizationWithExtra = buildAmortization(effectiveLoan, monthlyRate, monthlyPayment, totalMonths, extraMonthlyPayment);
  const totalAmountWithExtra = amortizationWithExtra.reduce((s, r) => s + r.payment, 0);
  const totalInterestWithExtra = totalAmountWithExtra - effectiveLoan;
  const monthsSavedWithExtra = totalMonths - amortizationWithExtra.length;
  const interestSavedWithExtra = totalInterest - totalInterestWithExtra;

  return {
    monthlyPayment,
    totalInterest: Math.max(totalInterest, 0),
    totalAmount,
    effectiveLoan,
    amortization,
    monthlyPaymentWithExtra: monthlyPayment + extraMonthlyPayment,
    totalInterestWithExtra: Math.max(totalInterestWithExtra, 0),
    totalAmountWithExtra,
    monthsSavedWithExtra: Math.max(monthsSavedWithExtra, 0),
    interestSavedWithExtra: Math.max(interestSavedWithExtra, 0),
    amortizationWithExtra,
  };
}

function buildAmortization(
  principal: number,
  monthlyRate: number,
  basePayment: number,
  maxMonths: number,
  extraPayment: number
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let m = 1; m <= maxMonths && balance > 0.01; m++) {
    const interestCharge = balance * monthlyRate;
    let totalPayment = basePayment + extraPayment;
    if (totalPayment > balance + interestCharge) {
      totalPayment = balance + interestCharge;
    }
    const principalPaid = totalPayment - interestCharge;
    balance = Math.max(balance - principalPaid, 0);
    rows.push({
      month: m,
      payment: totalPayment,
      principal: principalPaid,
      interest: interestCharge,
      balance,
    });
  }
  return rows;
}

// --- Format helpers ---

function formatCurrency(amount: number, currency: string): string {
  const c = CURRENCIES[currency] || CURRENCIES.USD;
  return `${c.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y > 0 && m > 0) return `${y}y ${m}m`;
  if (y > 0) return `${y}y`;
  return `${m}m`;
}

// --- SVG Pie Chart ---

function PieChart({ principal, interest, currency }: { principal: number; interest: number; currency: string }) {
  const total = principal + interest;
  if (total === 0) return null;
  const principalPct = (principal / total) * 100;
  const interestPct = (interest / total) * 100;
  // SVG arc calculation
  const principalAngle = (principalPct / 100) * 360;
  const r = 80;
  const cx = 100;
  const cy = 100;

  function polarToCartesian(angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(startAngle: number, endAngle: number) {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-lg">
        {principalPct >= 100 ? (
          <circle cx={cx} cy={cy} r={r} fill="#3b82f6" />
        ) : interestPct >= 100 ? (
          <circle cx={cx} cy={cy} r={r} fill="#ef4444" />
        ) : (
          <>
            <path d={describeArc(0, principalAngle)} fill="#3b82f6" />
            <path d={describeArc(principalAngle, 360)} fill="#ef4444" />
          </>
        )}
        <circle cx={cx} cy={cy} r="45" className="fill-background" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-xs font-bold" fontSize="11">
          Total
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-foreground text-[10px] font-semibold" fontSize="10">
          {formatCurrency(total, currency)}
        </text>
      </svg>
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Principal: {principalPct.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Interest: {interestPct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

// --- localStorage helpers ---

const STORAGE_KEY = "techtrendi_mortgage_calculations";

function loadSavedCalculations(): SavedCalculation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function persistCalculations(calcs: SavedCalculation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(calcs));
}

// --- Default inputs ---

const DEFAULT_INPUTS: LoanInputs = {
  loanAmount: 250000,
  interestRate: 6.5,
  loanTermYears: 30,
  downPayment: 20,
  downPaymentType: "percent",
  extraMonthlyPayment: 0,
  currency: "USD",
};

// --- Component ---

export default function MortgageCalculator() {
  const [inputs, setInputs] = useState<LoanInputs>({ ...DEFAULT_INPUTS });
  const [results, setResults] = useState<LoanResults | null>(null);
  const [activeTab, setActiveTab] = useState("calculator");
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [savedCalcs, setSavedCalcs] = useState<SavedCalculation[]>(loadSavedCalculations);
  const [saveName, setSaveName] = useState("");

  // Compare scenario
  const [compareInputs, setCompareInputs] = useState<LoanInputs>({ ...DEFAULT_INPUTS, interestRate: 7.5, loanTermYears: 15 });
  const [compareResults, setCompareResults] = useState<LoanResults | null>(null);

  // Affordability
  const [monthlyIncome, setMonthlyIncome] = useState(5000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(2000);
  const [affordInterestRate, setAffordInterestRate] = useState(6.5);
  const [affordTermYears, setAffordTermYears] = useState(30);
  const [debtToIncomeRatio, setDebtToIncomeRatio] = useState(28);

  const printRef = useRef<HTMLDivElement>(null);

  // Auto-calculate on input change
  useEffect(() => {
    const r = calculateLoan(inputs);
    setResults(r);
  }, [inputs]);

  // Load saved calculations from localStorage on mount
  useEffect(() => {
    setSavedCalcs(loadSavedCalculations());
  }, []);

  const updateInput = useCallback(<K extends keyof LoanInputs>(key: K, value: LoanInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateCompareInput = useCallback(<K extends keyof LoanInputs>(key: K, value: LoanInputs[K]) => {
    setCompareInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCompare = () => {
    setCompareResults(calculateLoan(compareInputs));
  };

  const handleSave = () => {
    if (!results) return;
    const name = saveName.trim() || `Calculation ${savedCalcs.length + 1}`;
    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      name,
      inputs: { ...inputs },
      results,
      date: new Date().toLocaleDateString(),
    };
    const updated = [newCalc, ...savedCalcs];
    setSavedCalcs(updated);
    persistCalculations(updated);
    setSaveName("");
    toast.success(`Saved "${name}"`);
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedCalcs.filter((c) => c.id !== id);
    setSavedCalcs(updated);
    persistCalculations(updated);
    toast.success("Calculation deleted");
  };

  const handleLoadSaved = (calc: SavedCalculation) => {
    setInputs({ ...calc.inputs });
    setActiveTab("calculator");
    toast.success(`Loaded "${calc.name}"`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Affordability calculations
  const maxMonthlyPayment = ((monthlyIncome - monthlyExpenses) * debtToIncomeRatio) / 100;
  const affordMonthlyRate = affordInterestRate / 100 / 12;
  const affordTotalMonths = affordTermYears * 12;
  let maxAffordableLoan = 0;
  if (affordMonthlyRate > 0 && affordTotalMonths > 0 && maxMonthlyPayment > 0) {
    maxAffordableLoan =
      (maxMonthlyPayment * (Math.pow(1 + affordMonthlyRate, affordTotalMonths) - 1)) /
      (affordMonthlyRate * Math.pow(1 + affordMonthlyRate, affordTotalMonths));
  } else if (affordTotalMonths > 0 && maxMonthlyPayment > 0) {
    maxAffordableLoan = maxMonthlyPayment * affordTotalMonths;
  }

  const cs = CURRENCIES[inputs.currency] || CURRENCIES.USD;

  return (
    <Layout>
      <SEOHead
        title="Mortgage & Loan Calculator - Free Payment Calculator | TechTrendi"
        description="Free mortgage and loan calculator. Calculate monthly payments, view amortization schedules, compare scenarios, and see how extra payments save you money."
        canonicalUrl="https://techtrendi.com/tools/mortgage-calculator"
      />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Mortgage & Loan <span className="text-primary">Calculator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Calculate monthly payments, compare loan options, and see a full amortization schedule.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 no-print">
            <TabsTrigger value="calculator" className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" />
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
            <TabsTrigger value="affordability" className="flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4" />
              <span className="hidden sm:inline">Affordability</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Saved</span>
              {savedCalcs.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{savedCalcs.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ==================== CALCULATOR TAB ==================== */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Inputs Column */}
              <div className="lg:col-span-1 space-y-6 no-print">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Home className="w-5 h-5" />
                      Loan Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Currency */}
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={inputs.currency} onValueChange={(v) => updateInput("currency", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CURRENCIES).map(([code, c]) => (
                            <SelectItem key={code} value={code}>
                              {c.symbol} {code} - {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Loan Amount */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Loan Amount
                        </Label>
                        <span className="text-sm text-muted-foreground font-mono">
                          {formatCurrency(inputs.loanAmount, inputs.currency)}
                        </span>
                      </div>
                      <Slider
                        value={[inputs.loanAmount]}
                        onValueChange={(v) => updateInput("loanAmount", v[0])}
                        min={10000}
                        max={2000000}
                        step={5000}
                      />
                      <Input
                        type="number"
                        value={inputs.loanAmount}
                        onChange={(e) => updateInput("loanAmount", Number(e.target.value) || 0)}
                        min={0}
                      />
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5" /> Interest Rate
                        </Label>
                        <span className="text-sm text-muted-foreground font-mono">{inputs.interestRate}%</span>
                      </div>
                      <Slider
                        value={[inputs.interestRate]}
                        onValueChange={(v) => updateInput("interestRate", v[0])}
                        min={0.5}
                        max={25}
                        step={0.1}
                      />
                      <Input
                        type="number"
                        value={inputs.interestRate}
                        onChange={(e) => updateInput("interestRate", Number(e.target.value) || 0)}
                        min={0}
                        step={0.1}
                      />
                    </div>

                    {/* Loan Term */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Loan Term
                        </Label>
                        <span className="text-sm text-muted-foreground font-mono">{inputs.loanTermYears} years</span>
                      </div>
                      <Slider
                        value={[inputs.loanTermYears]}
                        onValueChange={(v) => updateInput("loanTermYears", v[0])}
                        min={1}
                        max={40}
                        step={1}
                      />
                    </div>

                    {/* Down Payment */}
                    <div className="space-y-2">
                      <Label>Down Payment</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={inputs.downPayment}
                          onChange={(e) => updateInput("downPayment", Number(e.target.value) || 0)}
                          min={0}
                          className="flex-1"
                        />
                        <Select
                          value={inputs.downPaymentType}
                          onValueChange={(v) => updateInput("downPaymentType", v as "amount" | "percent")}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">%</SelectItem>
                            <SelectItem value="amount">{cs.symbol}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {inputs.downPaymentType === "percent" && (
                        <p className="text-xs text-muted-foreground">
                          = {formatCurrency((inputs.loanAmount * inputs.downPayment) / 100, inputs.currency)}
                        </p>
                      )}
                    </div>

                    {/* Extra Monthly Payment */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" /> Extra Monthly Payment
                      </Label>
                      <Input
                        type="number"
                        value={inputs.extraMonthlyPayment}
                        onChange={(e) => updateInput("extraMonthlyPayment", Number(e.target.value) || 0)}
                        min={0}
                        placeholder="0"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handlePrint} variant="outline" className="flex-1">
                        <Printer className="w-4 h-4 mr-2" /> Print
                      </Button>
                      <div className="flex-1 flex gap-1">
                        <Input
                          value={saveName}
                          onChange={(e) => setSaveName(e.target.value)}
                          placeholder="Name..."
                          className="flex-1"
                        />
                        <Button onClick={handleSave} size="icon" title="Save calculation">
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results Column */}
              <div className="lg:col-span-2 space-y-6 print-area" ref={printRef}>
                {results && (
                  <>
                    {/* Summary Cards */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid sm:grid-cols-3 gap-4">
                        <Card className="border-blue-200 dark:border-blue-800">
                          <CardContent className="pt-5 text-center">
                            <DollarSign className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-foreground">
                              {formatCurrency(results.monthlyPayment, inputs.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">Monthly Payment</div>
                          </CardContent>
                        </Card>
                        <Card className="border-red-200 dark:border-red-800">
                          <CardContent className="pt-5 text-center">
                            <Percent className="w-6 h-6 text-red-500 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-foreground">
                              {formatCurrency(results.totalInterest, inputs.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Interest</div>
                          </CardContent>
                        </Card>
                        <Card className="border-green-200 dark:border-green-800">
                          <CardContent className="pt-5 text-center">
                            <Home className="w-6 h-6 text-green-500 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-foreground">
                              {formatCurrency(results.totalAmount, inputs.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Cost</div>
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>

                    {/* Extra Payment Savings */}
                    {inputs.extraMonthlyPayment > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                              <PiggyBank className="w-5 h-5" />
                              Extra Payment Savings
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                  {formatCurrency(results.interestSavedWithExtra, inputs.currency)}
                                </div>
                                <div className="text-xs text-muted-foreground">Interest Saved</div>
                              </div>
                              <div>
                                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                  {formatMonths(results.monthsSavedWithExtra)}
                                </div>
                                <div className="text-xs text-muted-foreground">Time Saved</div>
                              </div>
                              <div>
                                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                  {formatCurrency(results.monthlyPaymentWithExtra, inputs.currency)}
                                </div>
                                <div className="text-xs text-muted-foreground">New Monthly</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Pie Chart */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Payment Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <PieChart
                            principal={results.effectiveLoan}
                            interest={results.totalInterest}
                            currency={inputs.currency}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Amortization Schedule */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Calendar className="w-5 h-5" />
                              Amortization Schedule
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowFullSchedule(!showFullSchedule)}
                              className="no-print"
                            >
                              {showFullSchedule ? (
                                <>Collapse <ChevronUp className="w-4 h-4 ml-1" /></>
                              ) : (
                                <>Show All ({results.amortization.length}) <ChevronDown className="w-4 h-4 ml-1" /></>
                              )}
                            </Button>
                          </div>
                          <CardDescription>
                            {inputs.extraMonthlyPayment > 0
                              ? "Showing schedule with extra payments applied"
                              : `${results.amortization.length} monthly payments over ${inputs.loanTermYears} years`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">#</th>
                                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Payment</th>
                                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Principal</th>
                                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Interest</th>
                                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(inputs.extraMonthlyPayment > 0 ? results.amortizationWithExtra : results.amortization)
                                  .slice(0, showFullSchedule ? undefined : 12)
                                  .map((row) => (
                                    <tr key={row.month} className="border-b border-border/50 hover:bg-muted/30">
                                      <td className="py-1.5 px-2 text-muted-foreground">{row.month}</td>
                                      <td className="py-1.5 px-2 text-right font-mono text-xs">
                                        {formatCurrency(row.payment, inputs.currency)}
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-mono text-xs text-blue-600 dark:text-blue-400">
                                        {formatCurrency(row.principal, inputs.currency)}
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-mono text-xs text-red-600 dark:text-red-400">
                                        {formatCurrency(row.interest, inputs.currency)}
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-mono text-xs">
                                        {formatCurrency(row.balance, inputs.currency)}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                          {!showFullSchedule && results.amortization.length > 12 && (
                            <p className="text-xs text-muted-foreground text-center mt-3 no-print">
                              Showing first 12 of {(inputs.extraMonthlyPayment > 0 ? results.amortizationWithExtra : results.amortization).length} months.
                              Click "Show All" to view the full schedule.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ==================== COMPARE TAB ==================== */}
          <TabsContent value="compare" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Scenario A */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scenario A (Current)</CardTitle>
                  <CardDescription>Your main calculator values</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-muted-foreground text-xs">Loan Amount</div>
                      <div className="font-bold">{formatCurrency(inputs.loanAmount, inputs.currency)}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-muted-foreground text-xs">Interest Rate</div>
                      <div className="font-bold">{inputs.interestRate}%</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-muted-foreground text-xs">Term</div>
                      <div className="font-bold">{inputs.loanTermYears} years</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-muted-foreground text-xs">Down Payment</div>
                      <div className="font-bold">
                        {inputs.downPaymentType === "percent" ? `${inputs.downPayment}%` : formatCurrency(inputs.downPayment, inputs.currency)}
                      </div>
                    </div>
                  </div>
                  {results && (
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Payment</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(results.monthlyPayment, inputs.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Interest</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(results.totalInterest, inputs.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Cost</span>
                        <span className="font-bold">{formatCurrency(results.totalAmount, inputs.currency)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scenario B */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scenario B</CardTitle>
                  <CardDescription>Adjust to compare</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Loan Amount</Label>
                    <Input
                      type="number"
                      value={compareInputs.loanAmount}
                      onChange={(e) => updateCompareInput("loanAmount", Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interest Rate (%)</Label>
                    <Input
                      type="number"
                      value={compareInputs.interestRate}
                      onChange={(e) => updateCompareInput("interestRate", Number(e.target.value) || 0)}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Term (years)</Label>
                    <Input
                      type="number"
                      value={compareInputs.loanTermYears}
                      onChange={(e) => updateCompareInput("loanTermYears", Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Down Payment (%)</Label>
                    <Input
                      type="number"
                      value={compareInputs.downPayment}
                      onChange={(e) => updateCompareInput("downPayment", Number(e.target.value) || 0)}
                    />
                  </div>
                  <Button onClick={handleCompare} className="w-full">
                    <Calculator className="w-4 h-4 mr-2" /> Compare
                  </Button>

                  {compareResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-t pt-3 mt-3 space-y-2"
                    >
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Payment</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(compareResults.monthlyPayment, compareInputs.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Interest</span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(compareResults.totalInterest, compareInputs.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Cost</span>
                        <span className="font-bold">
                          {formatCurrency(compareResults.totalAmount, compareInputs.currency)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Comparison Summary */}
            {results && compareResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-base">Comparison Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Monthly Difference</div>
                        <div className={cn(
                          "text-xl font-bold",
                          compareResults.monthlyPayment < results.monthlyPayment
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {compareResults.monthlyPayment < results.monthlyPayment ? "-" : "+"}
                          {formatCurrency(Math.abs(compareResults.monthlyPayment - results.monthlyPayment), inputs.currency)}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Interest Difference</div>
                        <div className={cn(
                          "text-xl font-bold",
                          compareResults.totalInterest < results.totalInterest
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {compareResults.totalInterest < results.totalInterest ? "-" : "+"}
                          {formatCurrency(Math.abs(compareResults.totalInterest - results.totalInterest), inputs.currency)}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Total Cost Difference</div>
                        <div className={cn(
                          "text-xl font-bold",
                          compareResults.totalAmount < results.totalAmount
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {compareResults.totalAmount < results.totalAmount ? "-" : "+"}
                          {formatCurrency(Math.abs(compareResults.totalAmount - results.totalAmount), inputs.currency)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* ==================== AFFORDABILITY TAB ==================== */}
          <TabsContent value="affordability" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PiggyBank className="w-5 h-5" />
                    Your Finances
                  </CardTitle>
                  <CardDescription>Enter your monthly income and expenses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Monthly Income</Label>
                      <span className="text-sm text-muted-foreground font-mono">
                        {formatCurrency(monthlyIncome, inputs.currency)}
                      </span>
                    </div>
                    <Slider
                      value={[monthlyIncome]}
                      onValueChange={(v) => setMonthlyIncome(v[0])}
                      min={500}
                      max={50000}
                      step={100}
                    />
                    <Input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Monthly Expenses</Label>
                      <span className="text-sm text-muted-foreground font-mono">
                        {formatCurrency(monthlyExpenses, inputs.currency)}
                      </span>
                    </div>
                    <Slider
                      value={[monthlyExpenses]}
                      onValueChange={(v) => setMonthlyExpenses(v[0])}
                      min={0}
                      max={30000}
                      step={100}
                    />
                    <Input
                      type="number"
                      value={monthlyExpenses}
                      onChange={(e) => setMonthlyExpenses(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Debt-to-Income Ratio</Label>
                      <span className="text-sm text-muted-foreground font-mono">{debtToIncomeRatio}%</span>
                    </div>
                    <Slider
                      value={[debtToIncomeRatio]}
                      onValueChange={(v) => setDebtToIncomeRatio(v[0])}
                      min={10}
                      max={50}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lenders typically recommend 28% or less for housing expenses.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Expected Interest Rate</Label>
                      <span className="text-sm text-muted-foreground font-mono">{affordInterestRate}%</span>
                    </div>
                    <Slider
                      value={[affordInterestRate]}
                      onValueChange={(v) => setAffordInterestRate(v[0])}
                      min={1}
                      max={25}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Loan Term</Label>
                      <span className="text-sm text-muted-foreground font-mono">{affordTermYears} years</span>
                    </div>
                    <Slider
                      value={[affordTermYears]}
                      onValueChange={(v) => setAffordTermYears(v[0])}
                      min={5}
                      max={40}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-base">Affordability Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Maximum Affordable Loan</div>
                      <div className="text-3xl font-bold text-primary">
                        {formatCurrency(maxAffordableLoan, inputs.currency)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">Disposable Income</span>
                        <span className="font-semibold">{formatCurrency(monthlyIncome - monthlyExpenses, inputs.currency)}/mo</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">Max Housing Payment</span>
                        <span className="font-semibold">{formatCurrency(maxMonthlyPayment, inputs.currency)}/mo</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">At {affordInterestRate}% for {affordTermYears}yr</span>
                        <span className="font-semibold">{formatCurrency(maxAffordableLoan, inputs.currency)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>-- Keep total housing costs under 28% of gross income</li>
                      <li>-- Total debt payments should stay under 36% of income</li>
                      <li>-- Save at least 20% down to avoid PMI</li>
                      <li>-- Budget for property taxes, insurance, and maintenance</li>
                      <li>-- Keep 3-6 months of expenses as an emergency fund</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ==================== SAVED TAB ==================== */}
          <TabsContent value="saved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Saved Calculations
                </CardTitle>
                <CardDescription>
                  Your calculations are stored locally in your browser.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedCalcs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No saved calculations yet.</p>
                    <p className="text-sm mt-1">Use the save button on the calculator tab.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {savedCalcs.map((calc) => (
                        <motion.div
                          key={calc.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{calc.name}</h3>
                              <p className="text-xs text-muted-foreground">{calc.date}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => handleLoadSaved(calc)}>
                                Load
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSaved(calc.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 bg-muted/50 rounded">
                              <div className="text-muted-foreground">Loan</div>
                              <div className="font-mono font-semibold">{formatCurrency(calc.inputs.loanAmount, calc.inputs.currency)}</div>
                            </div>
                            <div className="p-2 bg-muted/50 rounded">
                              <div className="text-muted-foreground">Rate</div>
                              <div className="font-mono font-semibold">{calc.inputs.interestRate}%</div>
                            </div>
                            <div className="p-2 bg-muted/50 rounded">
                              <div className="text-muted-foreground">Monthly</div>
                              <div className="font-mono font-semibold">{formatCurrency(calc.results.monthlyPayment, calc.inputs.currency)}</div>
                            </div>
                            <div className="p-2 bg-muted/50 rounded">
                              <div className="text-muted-foreground">Total Interest</div>
                              <div className="font-mono font-semibold">{formatCurrency(calc.results.totalInterest, calc.inputs.currency)}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
