import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Calculator,
  DollarSign,
  Percent,
  PiggyBank,
  Heart,
  Building2,
  Globe,
  Download,
  Copy,
  Check,
  TrendingDown,
  Wallet,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

// --- Types ---
type Country = "US" | "UK" | "GH" | "NG" | "CA" | "AU";
type FilingStatus = "single" | "married" | "head_of_household";
type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly" | "annual";
type SalaryType = "annual" | "monthly";

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

interface CountryTaxConfig {
  name: string;
  currency: string;
  symbol: string;
  brackets: Record<FilingStatus, TaxBracket[]>;
  socialSecurity?: { rate: number; maxWage: number; name: string };
  medicare?: { rate: number; additionalRate?: number; threshold?: number; name: string };
  stateTax?: { averageRate: number };
  hasPension?: boolean;
  pensionName?: string;
  pensionRate?: number;
}

// --- Tax configurations by country ---
const taxConfigs: Record<Country, CountryTaxConfig> = {
  US: {
    name: "United States",
    currency: "USD",
    symbol: "$",
    brackets: {
      single: [
        { min: 0, max: 11600, rate: 10 },
        { min: 11600, max: 47150, rate: 12 },
        { min: 47150, max: 100525, rate: 22 },
        { min: 100525, max: 191950, rate: 24 },
        { min: 191950, max: 243725, rate: 32 },
        { min: 243725, max: 609350, rate: 35 },
        { min: 609350, max: Infinity, rate: 37 },
      ],
      married: [
        { min: 0, max: 23200, rate: 10 },
        { min: 23200, max: 94300, rate: 12 },
        { min: 94300, max: 201050, rate: 22 },
        { min: 201050, max: 383900, rate: 24 },
        { min: 383900, max: 487450, rate: 32 },
        { min: 487450, max: 731200, rate: 35 },
        { min: 731200, max: Infinity, rate: 37 },
      ],
      head_of_household: [
        { min: 0, max: 16550, rate: 10 },
        { min: 16550, max: 63100, rate: 12 },
        { min: 63100, max: 100500, rate: 22 },
        { min: 100500, max: 191950, rate: 24 },
        { min: 191950, max: 243700, rate: 32 },
        { min: 243700, max: 609350, rate: 35 },
        { min: 609350, max: Infinity, rate: 37 },
      ],
    },
    socialSecurity: { rate: 6.2, maxWage: 168600, name: "Social Security" },
    medicare: { rate: 1.45, additionalRate: 0.9, threshold: 200000, name: "Medicare" },
    stateTax: { averageRate: 4.5 },
  },
  UK: {
    name: "United Kingdom",
    currency: "GBP",
    symbol: "£",
    brackets: {
      single: [
        { min: 0, max: 12570, rate: 0 },
        { min: 12570, max: 50270, rate: 20 },
        { min: 50270, max: 125140, rate: 40 },
        { min: 125140, max: Infinity, rate: 45 },
      ],
      married: [
        { min: 0, max: 12570, rate: 0 },
        { min: 12570, max: 50270, rate: 20 },
        { min: 50270, max: 125140, rate: 40 },
        { min: 125140, max: Infinity, rate: 45 },
      ],
      head_of_household: [
        { min: 0, max: 12570, rate: 0 },
        { min: 12570, max: 50270, rate: 20 },
        { min: 50270, max: 125140, rate: 40 },
        { min: 125140, max: Infinity, rate: 45 },
      ],
    },
    socialSecurity: { rate: 12, maxWage: 50270, name: "National Insurance" },
  },
  GH: {
    name: "Ghana",
    currency: "GHS",
    symbol: "GHS",
    brackets: {
      single: [
        { min: 0, max: 5880, rate: 0 },
        { min: 5880, max: 7440, rate: 5 },
        { min: 7440, max: 11280, rate: 10 },
        { min: 11280, max: 45120, rate: 17.5 },
        { min: 45120, max: 432000, rate: 25 },
        { min: 432000, max: Infinity, rate: 30 },
      ],
      married: [
        { min: 0, max: 5880, rate: 0 },
        { min: 5880, max: 7440, rate: 5 },
        { min: 7440, max: 11280, rate: 10 },
        { min: 11280, max: 45120, rate: 17.5 },
        { min: 45120, max: 432000, rate: 25 },
        { min: 432000, max: Infinity, rate: 30 },
      ],
      head_of_household: [
        { min: 0, max: 5880, rate: 0 },
        { min: 5880, max: 7440, rate: 5 },
        { min: 7440, max: 11280, rate: 10 },
        { min: 11280, max: 45120, rate: 17.5 },
        { min: 45120, max: 432000, rate: 25 },
        { min: 432000, max: Infinity, rate: 30 },
      ],
    },
    hasPension: true,
    pensionName: "SSNIT",
    pensionRate: 5.5,
  },
  NG: {
    name: "Nigeria",
    currency: "NGN",
    symbol: "NGN",
    brackets: {
      single: [
        { min: 0, max: 300000, rate: 7 },
        { min: 300000, max: 600000, rate: 11 },
        { min: 600000, max: 1100000, rate: 15 },
        { min: 1100000, max: 1600000, rate: 19 },
        { min: 1600000, max: 3200000, rate: 21 },
        { min: 3200000, max: Infinity, rate: 24 },
      ],
      married: [
        { min: 0, max: 300000, rate: 7 },
        { min: 300000, max: 600000, rate: 11 },
        { min: 600000, max: 1100000, rate: 15 },
        { min: 1100000, max: 1600000, rate: 19 },
        { min: 1600000, max: 3200000, rate: 21 },
        { min: 3200000, max: Infinity, rate: 24 },
      ],
      head_of_household: [
        { min: 0, max: 300000, rate: 7 },
        { min: 300000, max: 600000, rate: 11 },
        { min: 600000, max: 1100000, rate: 15 },
        { min: 1100000, max: 1600000, rate: 19 },
        { min: 1600000, max: 3200000, rate: 21 },
        { min: 3200000, max: Infinity, rate: 24 },
      ],
    },
    hasPension: true,
    pensionName: "Pension",
    pensionRate: 8,
  },
  CA: {
    name: "Canada",
    currency: "CAD",
    symbol: "CA$",
    brackets: {
      single: [
        { min: 0, max: 55867, rate: 15 },
        { min: 55867, max: 111733, rate: 20.5 },
        { min: 111733, max: 173205, rate: 26 },
        { min: 173205, max: 246752, rate: 29 },
        { min: 246752, max: Infinity, rate: 33 },
      ],
      married: [
        { min: 0, max: 55867, rate: 15 },
        { min: 55867, max: 111733, rate: 20.5 },
        { min: 111733, max: 173205, rate: 26 },
        { min: 173205, max: 246752, rate: 29 },
        { min: 246752, max: Infinity, rate: 33 },
      ],
      head_of_household: [
        { min: 0, max: 55867, rate: 15 },
        { min: 55867, max: 111733, rate: 20.5 },
        { min: 111733, max: 173205, rate: 26 },
        { min: 173205, max: 246752, rate: 29 },
        { min: 246752, max: Infinity, rate: 33 },
      ],
    },
    socialSecurity: { rate: 5.95, maxWage: 68500, name: "CPP" },
    stateTax: { averageRate: 10 },
  },
  AU: {
    name: "Australia",
    currency: "AUD",
    symbol: "A$",
    brackets: {
      single: [
        { min: 0, max: 18200, rate: 0 },
        { min: 18200, max: 45000, rate: 16 },
        { min: 45000, max: 135000, rate: 30 },
        { min: 135000, max: 190000, rate: 37 },
        { min: 190000, max: Infinity, rate: 45 },
      ],
      married: [
        { min: 0, max: 18200, rate: 0 },
        { min: 18200, max: 45000, rate: 16 },
        { min: 45000, max: 135000, rate: 30 },
        { min: 135000, max: 190000, rate: 37 },
        { min: 190000, max: Infinity, rate: 45 },
      ],
      head_of_household: [
        { min: 0, max: 18200, rate: 0 },
        { min: 18200, max: 45000, rate: 16 },
        { min: 45000, max: 135000, rate: 30 },
        { min: 135000, max: 190000, rate: 37 },
        { min: 190000, max: Infinity, rate: 45 },
      ],
    },
    socialSecurity: { rate: 11.5, maxWage: Infinity, name: "Superannuation" },
    medicare: { rate: 2, name: "Medicare Levy" },
  },
};

// --- Helper functions ---
function calculateFederalTax(income: number, brackets: TaxBracket[]): number {
  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableInBracket * (bracket.rate / 100);
    remainingIncome -= taxableInBracket;
  }

  return tax;
}

function getPayPeriodsPerYear(frequency: PayFrequency): number {
  switch (frequency) {
    case "weekly": return 52;
    case "biweekly": return 26;
    case "semimonthly": return 24;
    case "monthly": return 12;
    case "annual": return 1;
  }
}

// --- Main Component ---
export default function PaycheckCalculator() {
  const [copied, setCopied] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Inputs
  const [grossSalary, setGrossSalary] = useState(75000);
  const [salaryType, setSalaryType] = useState<SalaryType>("annual");
  const [country, setCountry] = useState<Country>("US");
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [payFrequency, setPayFrequency] = useState<PayFrequency>("biweekly");

  // Deductions
  const [retirement401k, setRetirement401k] = useState(6);
  const [healthInsurance, setHealthInsurance] = useState(200);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [stateTaxRate, setStateTaxRate] = useState(4.5);

  const config = taxConfigs[country];
  const symbol = config.symbol;

  // Format currency
  const fmt = (value: number): string => {
    if (config.currency === "GHS" || config.currency === "NGN") {
      return `${config.symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${config.symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate everything
  const results = useMemo(() => {
    const annualGross = salaryType === "annual" ? grossSalary : grossSalary * 12;
    const periodsPerYear = getPayPeriodsPerYear(payFrequency);

    // Pre-tax deductions (reduce taxable income)
    const annual401k = annualGross * (retirement401k / 100);
    const annualHealthInsurance = healthInsurance * 12;
    const annualOtherDeductions = otherDeductions * 12;
    const totalPreTaxDeductions = annual401k + annualHealthInsurance + annualOtherDeductions;

    const taxableIncome = Math.max(0, annualGross - totalPreTaxDeductions);

    // Federal/Income Tax
    const federalTax = calculateFederalTax(taxableIncome, config.brackets[filingStatus]);

    // State/Provincial Tax
    let stateTax = 0;
    if (config.stateTax || country === "US" || country === "CA") {
      stateTax = taxableIncome * (stateTaxRate / 100);
    }

    // Social Security
    let socialSecurityTax = 0;
    if (config.socialSecurity) {
      const ssWage = Math.min(annualGross, config.socialSecurity.maxWage);
      socialSecurityTax = ssWage * (config.socialSecurity.rate / 100);
    }

    // Country-specific pension (Ghana/Nigeria)
    let pensionTax = 0;
    if (config.hasPension && config.pensionRate) {
      pensionTax = annualGross * (config.pensionRate / 100);
    }

    // Medicare
    let medicareTax = 0;
    if (config.medicare) {
      medicareTax = annualGross * (config.medicare.rate / 100);
      // Additional Medicare tax for US high earners
      if (config.medicare.additionalRate && config.medicare.threshold && annualGross > config.medicare.threshold) {
        medicareTax += (annualGross - config.medicare.threshold) * (config.medicare.additionalRate / 100);
      }
    }

    // Total taxes and deductions
    const totalTaxes = federalTax + stateTax + socialSecurityTax + medicareTax + pensionTax;
    const totalDeductions = totalTaxes + totalPreTaxDeductions;
    const annualNetPay = annualGross - totalDeductions;

    // Per-period amounts
    const grossPerPeriod = annualGross / periodsPerYear;
    const netPerPeriod = annualNetPay / periodsPerYear;
    const federalTaxPerPeriod = federalTax / periodsPerYear;
    const stateTaxPerPeriod = stateTax / periodsPerYear;
    const socialSecurityPerPeriod = socialSecurityTax / periodsPerYear;
    const medicarePerPeriod = medicareTax / periodsPerYear;
    const pensionPerPeriod = pensionTax / periodsPerYear;
    const retirement401kPerPeriod = annual401k / periodsPerYear;
    const healthInsurancePerPeriod = annualHealthInsurance / periodsPerYear;
    const otherDeductionsPerPeriod = annualOtherDeductions / periodsPerYear;

    // Percentages
    const effectiveTaxRate = annualGross > 0 ? (totalTaxes / annualGross) * 100 : 0;
    const takeHomePercentage = annualGross > 0 ? (annualNetPay / annualGross) * 100 : 0;

    // Breakdown percentages for pie chart
    const federalTaxPct = annualGross > 0 ? (federalTax / annualGross) * 100 : 0;
    const stateTaxPct = annualGross > 0 ? (stateTax / annualGross) * 100 : 0;
    const socialSecurityPct = annualGross > 0 ? (socialSecurityTax / annualGross) * 100 : 0;
    const medicarePct = annualGross > 0 ? (medicareTax / annualGross) * 100 : 0;
    const pensionPct = annualGross > 0 ? (pensionTax / annualGross) * 100 : 0;
    const retirement401kPct = annualGross > 0 ? (annual401k / annualGross) * 100 : 0;
    const healthInsurancePct = annualGross > 0 ? (annualHealthInsurance / annualGross) * 100 : 0;
    const otherDeductionsPct = annualGross > 0 ? (annualOtherDeductions / annualGross) * 100 : 0;
    const takeHomePct = annualGross > 0 ? (annualNetPay / annualGross) * 100 : 0;

    return {
      annual: {
        gross: annualGross,
        federalTax,
        stateTax,
        socialSecurityTax,
        medicareTax,
        pensionTax,
        retirement401k: annual401k,
        healthInsurance: annualHealthInsurance,
        otherDeductions: annualOtherDeductions,
        totalTaxes,
        totalDeductions,
        netPay: annualNetPay,
      },
      perPeriod: {
        gross: grossPerPeriod,
        federalTax: federalTaxPerPeriod,
        stateTax: stateTaxPerPeriod,
        socialSecurityTax: socialSecurityPerPeriod,
        medicareTax: medicarePerPeriod,
        pensionTax: pensionPerPeriod,
        retirement401k: retirement401kPerPeriod,
        healthInsurance: healthInsurancePerPeriod,
        otherDeductions: otherDeductionsPerPeriod,
        netPay: netPerPeriod,
      },
      weekly: {
        gross: annualGross / 52,
        netPay: annualNetPay / 52,
      },
      biweekly: {
        gross: annualGross / 26,
        netPay: annualNetPay / 26,
      },
      monthly: {
        gross: annualGross / 12,
        netPay: annualNetPay / 12,
      },
      percentages: {
        effectiveTaxRate,
        takeHomePercentage,
        federalTax: federalTaxPct,
        stateTax: stateTaxPct,
        socialSecurity: socialSecurityPct,
        medicare: medicarePct,
        pension: pensionPct,
        retirement401k: retirement401kPct,
        healthInsurance: healthInsurancePct,
        otherDeductions: otherDeductionsPct,
        takeHome: takeHomePct,
      },
      periodsPerYear,
    };
  }, [grossSalary, salaryType, country, filingStatus, payFrequency, retirement401k, healthInsurance, otherDeductions, stateTaxRate, config]);

  // Build summary for export/copy
  const buildSummary = () => {
    const lines = [
      "PAYCHECK CALCULATOR SUMMARY",
      "============================",
      "",
      `Country: ${config.name}`,
      `Filing Status: ${filingStatus.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}`,
      `Pay Frequency: ${payFrequency.charAt(0).toUpperCase() + payFrequency.slice(1)}`,
      "",
      "GROSS PAY",
      `---------`,
      `Annual: ${fmt(results.annual.gross)}`,
      `Per Paycheck: ${fmt(results.perPeriod.gross)}`,
      "",
      "DEDUCTIONS",
      "----------",
      `Federal Tax: ${fmt(results.annual.federalTax)} (${results.percentages.federalTax.toFixed(1)}%)`,
    ];

    if (results.annual.stateTax > 0) {
      lines.push(`State/Local Tax: ${fmt(results.annual.stateTax)} (${results.percentages.stateTax.toFixed(1)}%)`);
    }
    if (results.annual.socialSecurityTax > 0) {
      lines.push(`${config.socialSecurity?.name || "Social Security"}: ${fmt(results.annual.socialSecurityTax)} (${results.percentages.socialSecurity.toFixed(1)}%)`);
    }
    if (results.annual.medicareTax > 0) {
      lines.push(`${config.medicare?.name || "Medicare"}: ${fmt(results.annual.medicareTax)} (${results.percentages.medicare.toFixed(1)}%)`);
    }
    if (results.annual.pensionTax > 0) {
      lines.push(`${config.pensionName || "Pension"}: ${fmt(results.annual.pensionTax)} (${results.percentages.pension.toFixed(1)}%)`);
    }
    if (results.annual.retirement401k > 0) {
      lines.push(`401(k)/Pension Contribution: ${fmt(results.annual.retirement401k)} (${results.percentages.retirement401k.toFixed(1)}%)`);
    }
    if (results.annual.healthInsurance > 0) {
      lines.push(`Health Insurance: ${fmt(results.annual.healthInsurance)} (${results.percentages.healthInsurance.toFixed(1)}%)`);
    }
    if (results.annual.otherDeductions > 0) {
      lines.push(`Other Deductions: ${fmt(results.annual.otherDeductions)} (${results.percentages.otherDeductions.toFixed(1)}%)`);
    }

    lines.push(
      "",
      "NET PAY (TAKE-HOME)",
      "-------------------",
      `Annual: ${fmt(results.annual.netPay)}`,
      `Per Paycheck: ${fmt(results.perPeriod.netPay)}`,
      `Weekly: ${fmt(results.weekly.netPay)}`,
      `Monthly: ${fmt(results.monthly.netPay)}`,
      "",
      `Effective Tax Rate: ${results.percentages.effectiveTaxRate.toFixed(1)}%`,
      `Take-Home Percentage: ${results.percentages.takeHomePercentage.toFixed(1)}%`,
      "",
      "--- Generated by TechTrendi Paycheck Calculator ---"
    );

    return lines.join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary());
      setCopied(true);
      toast.success("Results copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please try again.");
    }
  };

  const handleExport = () => {
    const content = buildSummary();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paycheck-summary.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Summary downloaded!");
  };

  // Pie chart data
  const pieData = useMemo(() => {
    const items = [];
    if (results.percentages.federalTax > 0) {
      items.push({ name: "Federal Tax", value: results.percentages.federalTax, color: "#ef4444" });
    }
    if (results.percentages.stateTax > 0) {
      items.push({ name: "State Tax", value: results.percentages.stateTax, color: "#f97316" });
    }
    if (results.percentages.socialSecurity > 0) {
      items.push({ name: config.socialSecurity?.name || "Social Security", value: results.percentages.socialSecurity, color: "#eab308" });
    }
    if (results.percentages.medicare > 0) {
      items.push({ name: config.medicare?.name || "Medicare", value: results.percentages.medicare, color: "#84cc16" });
    }
    if (results.percentages.pension > 0) {
      items.push({ name: config.pensionName || "Pension", value: results.percentages.pension, color: "#22c55e" });
    }
    if (results.percentages.retirement401k > 0) {
      items.push({ name: "401(k)/Pension", value: results.percentages.retirement401k, color: "#14b8a6" });
    }
    if (results.percentages.healthInsurance > 0) {
      items.push({ name: "Health Insurance", value: results.percentages.healthInsurance, color: "#06b6d4" });
    }
    if (results.percentages.otherDeductions > 0) {
      items.push({ name: "Other", value: results.percentages.otherDeductions, color: "#8b5cf6" });
    }
    items.push({ name: "Take-Home Pay", value: results.percentages.takeHome, color: "#3b82f6" });
    return items;
  }, [results, config]);

  // Generate pie chart SVG
  const renderPieChart = () => {
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    return (
      <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-full max-w-[280px] mx-auto transform -rotate-90">
        {pieData.map((slice, i) => {
          const startPercent = cumulativePercent;
          const slicePercent = slice.value / 100;
          cumulativePercent += slicePercent;

          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(" ");

          return (
            <path
              key={i}
              d={pathData}
              fill={slice.color}
              stroke="white"
              strokeWidth="0.02"
              className="transition-all duration-300 hover:opacity-80"
            >
              <title>{`${slice.name}: ${slice.value.toFixed(1)}%`}</title>
            </path>
          );
        })}
        <circle cx="0" cy="0" r="0.5" fill="white" className="dark:fill-gray-900" />
      </svg>
    );
  };

  return (
    <Layout>
      <SEOHead
        title="Paycheck Calculator - Take-Home Pay Calculator | TechTrendi"
        description="Calculate your take-home pay after taxes and deductions. Supports US, UK, Ghana, Nigeria, Canada, and Australia tax systems with accurate federal, state, and social security calculations."
      />

      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Paycheck Calculator
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Calculate your take-home pay after taxes, social security, and other deductions.
            Supports multiple countries with accurate tax brackets.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Salary Input */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  Gross Salary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Salary Amount ({symbol})</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(Number(e.target.value) || 0)}
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={salaryType === "annual" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSalaryType("annual")}
                  >
                    Annual
                  </Button>
                  <Button
                    variant={salaryType === "monthly" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSalaryType("monthly")}
                  >
                    Monthly
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Location & Status */}
            <Card className="border-indigo-200 dark:border-indigo-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-indigo-500" />
                  Location & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Country/Region</Label>
                  <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="GH">Ghana</SelectItem>
                      <SelectItem value="NG">Nigeria</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Filing Status</Label>
                  <Select value={filingStatus} onValueChange={(v) => setFilingStatus(v as FilingStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Single
                        </span>
                      </SelectItem>
                      <SelectItem value="married">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Married Filing Jointly
                        </span>
                      </SelectItem>
                      <SelectItem value="head_of_household">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Head of Household
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pay Frequency</Label>
                  <Select value={payFrequency} onValueChange={(v) => setPayFrequency(v as PayFrequency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly (52/year)</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly (26/year)</SelectItem>
                      <SelectItem value="semimonthly">Semi-Monthly (24/year)</SelectItem>
                      <SelectItem value="monthly">Monthly (12/year)</SelectItem>
                      <SelectItem value="annual">Annual (1/year)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(country === "US" || country === "CA") && (
                  <div className="space-y-2">
                    <Label>State/Provincial Tax Rate: {stateTaxRate}%</Label>
                    <Slider
                      min={0}
                      max={15}
                      step={0.1}
                      value={[stateTaxRate]}
                      onValueChange={([v]) => setStateTaxRate(v)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>15%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PiggyBank className="h-5 w-5 text-green-500" />
                  Pre-Tax Deductions
                </CardTitle>
                <CardDescription>
                  These reduce your taxable income
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>401(k) / Pension Contribution: {retirement401k}%</Label>
                  <Slider
                    min={0}
                    max={25}
                    step={0.5}
                    value={[retirement401k]}
                    onValueChange={([v]) => setRetirement401k(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>25%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Health Insurance (Monthly)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    value={healthInsurance}
                    onChange={(e) => setHealthInsurance(Number(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Other Deductions (Monthly)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(Number(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Result Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                <CardContent className="pt-6 text-center space-y-2">
                  <Wallet className="h-8 w-8 mx-auto opacity-80" />
                  <p className="text-blue-100 text-sm">Take-Home Pay (Per Paycheck)</p>
                  <p className="text-4xl font-bold">{fmt(results.perPeriod.netPay)}</p>
                  <p className="text-blue-100 text-sm">
                    {payFrequency.charAt(0).toUpperCase() + payFrequency.slice(1)} ({results.periodsPerYear}x/year)
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardContent className="pt-6 text-center space-y-2">
                  <Calendar className="h-8 w-8 mx-auto opacity-80" />
                  <p className="text-green-100 text-sm">Annual Take-Home Pay</p>
                  <p className="text-4xl font-bold">{fmt(results.annual.netPay)}</p>
                  <p className="text-green-100 text-sm">
                    {results.percentages.takeHomePercentage.toFixed(1)}% of gross
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Pay Period Comparison */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingDown className="h-5 w-5 text-purple-500" />
                  Pay Period Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="annual">Annual</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-4">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Weekly</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{fmt(results.weekly.netPay)}</p>
                        <p className="text-xs text-muted-foreground">Gross: {fmt(results.weekly.gross)}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Bi-Weekly</p>
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{fmt(results.biweekly.netPay)}</p>
                        <p className="text-xs text-muted-foreground">Gross: {fmt(results.biweekly.gross)}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Monthly</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{fmt(results.monthly.netPay)}</p>
                        <p className="text-xs text-muted-foreground">Gross: {fmt(results.monthly.gross)}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Annual</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">{fmt(results.annual.netPay)}</p>
                        <p className="text-xs text-muted-foreground">Gross: {fmt(results.annual.gross)}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="weekly" className="mt-4">
                    <div className="text-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{fmt(results.weekly.netPay)}</p>
                      <p className="text-muted-foreground mt-2">Weekly take-home pay (52 weeks/year)</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="monthly" className="mt-4">
                    <div className="text-center p-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{fmt(results.monthly.netPay)}</p>
                      <p className="text-muted-foreground mt-2">Monthly take-home pay</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="annual" className="mt-4">
                    <div className="text-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{fmt(results.annual.netPay)}</p>
                      <p className="text-muted-foreground mt-2">Annual take-home pay</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Pie Chart & Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Percent className="h-5 w-5 text-orange-500" />
                    Salary Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderPieChart()}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {pieData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.name}</span>
                        <span className="ml-auto font-medium">{item.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Breakdown */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle
                    className="flex items-center gap-2 text-lg cursor-pointer"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                  >
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Detailed Breakdown
                    {showBreakdown ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </CardTitle>
                </CardHeader>
                {showBreakdown && (
                  <CardContent className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Gross Pay</span>
                      <span className="font-bold text-green-600">{fmt(results.annual.gross)}</span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-red-600">
                        <span>Federal Tax</span>
                        <span>- {fmt(results.annual.federalTax)}</span>
                      </div>
                      {results.annual.stateTax > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>State/Local Tax</span>
                          <span>- {fmt(results.annual.stateTax)}</span>
                        </div>
                      )}
                      {results.annual.socialSecurityTax > 0 && (
                        <div className="flex justify-between text-yellow-600">
                          <span>{config.socialSecurity?.name || "Social Security"}</span>
                          <span>- {fmt(results.annual.socialSecurityTax)}</span>
                        </div>
                      )}
                      {results.annual.medicareTax > 0 && (
                        <div className="flex justify-between text-lime-600">
                          <span>{config.medicare?.name || "Medicare"}</span>
                          <span>- {fmt(results.annual.medicareTax)}</span>
                        </div>
                      )}
                      {results.annual.pensionTax > 0 && (
                        <div className="flex justify-between text-teal-600">
                          <span>{config.pensionName || "Pension"}</span>
                          <span>- {fmt(results.annual.pensionTax)}</span>
                        </div>
                      )}
                      {results.annual.retirement401k > 0 && (
                        <div className="flex justify-between text-cyan-600">
                          <span>401(k)/Pension Contribution</span>
                          <span>- {fmt(results.annual.retirement401k)}</span>
                        </div>
                      )}
                      {results.annual.healthInsurance > 0 && (
                        <div className="flex justify-between text-pink-600">
                          <span>Health Insurance</span>
                          <span>- {fmt(results.annual.healthInsurance)}</span>
                        </div>
                      )}
                      {results.annual.otherDeductions > 0 && (
                        <div className="flex justify-between text-purple-600">
                          <span>Other Deductions</span>
                          <span>- {fmt(results.annual.otherDeductions)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between py-2 border-t border-dashed">
                      <span className="text-muted-foreground">Total Deductions</span>
                      <span className="font-medium text-red-600">- {fmt(results.annual.totalDeductions)}</span>
                    </div>

                    <div className="flex justify-between py-3 border-t-2 border-blue-500">
                      <span className="font-bold text-lg">Net Pay</span>
                      <span className="font-bold text-lg text-blue-600">{fmt(results.annual.netPay)}</span>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 mt-4">
                      <div className="flex justify-between text-sm">
                        <span>Effective Tax Rate</span>
                        <span className="font-medium">{results.percentages.effectiveTaxRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Tax Bracket Info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-blue-500" />
                  {config.name} Tax Brackets ({filingStatus.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">Income Range</th>
                        <th className="text-right py-2 px-3 font-medium">Tax Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.brackets[filingStatus].map((bracket, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-3">
                            {bracket.max === Infinity
                              ? `Over ${fmt(bracket.min)}`
                              : `${fmt(bracket.min)} - ${fmt(bracket.max)}`}
                          </td>
                          <td className="text-right py-2 px-3 font-medium">{bracket.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-end">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy Results"}
              </Button>
              <Button onClick={handleExport} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Download className="h-4 w-4 mr-2" />
                Export Summary
              </Button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Disclaimer</p>
                <p>
                  This calculator provides estimates based on standard tax brackets and rates. Actual taxes may vary based on
                  specific deductions, credits, local taxes, and other factors. For accurate tax calculations, please consult
                  a qualified tax professional or use official government tax calculators.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
