import { useState, useEffect, useMemo, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet, Plus, Trash2, TrendingUp, TrendingDown, PieChart, Calendar,
  DollarSign, Landmark, Home, Car, Briefcase, CreditCard, GraduationCap,
  Building2, ChevronDown, ChevronUp, Download, Image, Lightbulb,
  Target, Award, ArrowUpRight, ArrowDownRight, History, Sparkles, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Types
interface AssetItem {
  id: string;
  name: string;
  value: number;
  category: string;
}

interface LiabilityItem {
  id: string;
  name: string;
  value: number;
  category: string;
}

interface HistoryEntry {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

interface NetWorthData {
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  history: HistoryEntry[];
  lastUpdated: string;
}

const STORAGE_KEY = "techtrendi_networth";

// Asset categories
const assetCategories = [
  { value: "cash", label: "Cash & Savings", icon: DollarSign, color: "bg-green-500" },
  { value: "investments", label: "Investments", icon: TrendingUp, color: "bg-blue-500" },
  { value: "real_estate", label: "Real Estate", icon: Home, color: "bg-purple-500" },
  { value: "vehicles", label: "Vehicles", icon: Car, color: "bg-orange-500" },
  { value: "other_assets", label: "Other Assets", icon: Briefcase, color: "bg-cyan-500" },
];

// Liability categories
const liabilityCategories = [
  { value: "mortgage", label: "Mortgage", icon: Building2, color: "bg-red-500" },
  { value: "car_loans", label: "Car Loans", icon: Car, color: "bg-pink-500" },
  { value: "student_loans", label: "Student Loans", icon: GraduationCap, color: "bg-amber-500" },
  { value: "credit_cards", label: "Credit Cards", icon: CreditCard, color: "bg-rose-500" },
  { value: "other_debts", label: "Other Debts", icon: MoreHorizontal, color: "bg-slate-500" },
];

// Net worth rating thresholds
const getNetWorthRating = (netWorth: number, age: number = 30) => {
  const targetByAge = age * 10000; // Simple target: age * $10,000
  const ratio = netWorth / targetByAge;

  if (ratio >= 2) return { score: "Excellent", color: "text-green-500", emoji: "A+", message: "Outstanding! You're well ahead of typical benchmarks." };
  if (ratio >= 1.5) return { score: "Very Good", color: "text-emerald-500", emoji: "A", message: "Great progress! You're above average for your age." };
  if (ratio >= 1) return { score: "Good", color: "text-blue-500", emoji: "B+", message: "Solid foundation. You're on track!" };
  if (ratio >= 0.5) return { score: "Fair", color: "text-yellow-500", emoji: "B", message: "Room for improvement, but you're building wealth." };
  if (ratio >= 0) return { score: "Building", color: "text-orange-500", emoji: "C", message: "Keep going! Focus on reducing debt and increasing savings." };
  return { score: "Rebuilding", color: "text-red-500", emoji: "D", message: "Don't give up! Every step towards positive net worth counts." };
};

// Tips for improving net worth
const improvementTips = [
  { icon: DollarSign, title: "Pay Yourself First", tip: "Automate savings of at least 20% of your income before spending on anything else." },
  { icon: CreditCard, title: "Eliminate High-Interest Debt", tip: "Focus on paying off credit cards and other high-interest debt using the avalanche or snowball method." },
  { icon: TrendingUp, title: "Invest Consistently", tip: "Set up automatic investments in diversified index funds or ETFs to build long-term wealth." },
  { icon: Home, title: "Build Equity", tip: "Consider homeownership to build equity over time instead of paying rent." },
  { icon: Briefcase, title: "Increase Income", tip: "Develop high-value skills, negotiate raises, or start a side business to boost your earning potential." },
  { icon: Target, title: "Track Everything", tip: "Monitor your net worth monthly to stay motivated and catch issues early." },
];

export default function NetWorthTracker() {
  const { user } = useAuth();
  const summaryRef = useRef<HTMLDivElement>(null);

  // State
  const [data, setData] = useState<NetWorthData>({
    assets: [],
    liabilities: [],
    history: [],
    lastUpdated: "",
  });

  // Form states for assets
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetValue, setNewAssetValue] = useState("");
  const [newAssetCategory, setNewAssetCategory] = useState("cash");

  // Form states for liabilities
  const [newLiabilityName, setNewLiabilityName] = useState("");
  const [newLiabilityValue, setNewLiabilityValue] = useState("");
  const [newLiabilityCategory, setNewLiabilityCategory] = useState("credit_cards");

  // UI states
  const [showAssets, setShowAssets] = useState(true);
  const [showLiabilities, setShowLiabilities] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [userAge, setUserAge] = useState(30);

  // Load data
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        setData(JSON.parse(saved));
      }
    }
  }, [user]);

  // Save data and record history
  useEffect(() => {
    if (user && (data.assets.length > 0 || data.liabilities.length > 0)) {
      const today = new Date().toISOString().split("T")[0];
      const totalAssets = data.assets.reduce((sum, a) => sum + a.value, 0);
      const totalLiabilities = data.liabilities.reduce((sum, l) => sum + l.value, 0);
      const netWorth = totalAssets - totalLiabilities;

      // Check if we need to add a new history entry (once per day)
      let updatedHistory = [...data.history];
      const lastEntry = updatedHistory[updatedHistory.length - 1];

      if (!lastEntry || lastEntry.date !== today) {
        updatedHistory.push({
          date: today,
          totalAssets,
          totalLiabilities,
          netWorth,
        });
        // Keep only last 365 days
        if (updatedHistory.length > 365) {
          updatedHistory = updatedHistory.slice(-365);
        }
      } else {
        // Update today's entry
        updatedHistory[updatedHistory.length - 1] = {
          date: today,
          totalAssets,
          totalLiabilities,
          netWorth,
        };
      }

      const updatedData = {
        ...data,
        history: updatedHistory,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(updatedData));

      // Only update history in state if it changed
      if (JSON.stringify(updatedHistory) !== JSON.stringify(data.history)) {
        setData(updatedData);
      }
    }
  }, [user, data.assets, data.liabilities]);

  // Calculations
  const totalAssets = useMemo(() => {
    return data.assets.reduce((sum, a) => sum + a.value, 0);
  }, [data.assets]);

  const totalLiabilities = useMemo(() => {
    return data.liabilities.reduce((sum, l) => sum + l.value, 0);
  }, [data.liabilities]);

  const netWorth = useMemo(() => {
    return totalAssets - totalLiabilities;
  }, [totalAssets, totalLiabilities]);

  const assetsByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.assets.forEach((a) => {
      grouped[a.category] = (grouped[a.category] || 0) + a.value;
    });
    return Object.entries(grouped)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [data.assets]);

  const liabilitiesByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.liabilities.forEach((l) => {
      grouped[l.category] = (grouped[l.category] || 0) + l.value;
    });
    return Object.entries(grouped)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [data.liabilities]);

  const netWorthChange = useMemo(() => {
    if (data.history.length < 2) return { value: 0, percentage: 0 };
    const current = data.history[data.history.length - 1]?.netWorth || 0;
    const previous = data.history[data.history.length - 2]?.netWorth || 0;
    const change = current - previous;
    const percentage = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;
    return { value: change, percentage };
  }, [data.history]);

  const rating = useMemo(() => {
    return getNetWorthRating(netWorth, userAge);
  }, [netWorth, userAge]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get category info
  const getAssetCategoryInfo = (cat: string) => {
    return assetCategories.find((c) => c.value === cat) || assetCategories[4];
  };

  const getLiabilityCategoryInfo = (cat: string) => {
    return liabilityCategories.find((c) => c.value === cat) || liabilityCategories[4];
  };

  // Add asset
  const addAsset = () => {
    if (!newAssetName.trim()) {
      toast.error("Please enter an asset name");
      return;
    }
    if (!newAssetValue || parseFloat(newAssetValue) <= 0) {
      toast.error("Please enter a valid value");
      return;
    }

    const newAsset: AssetItem = {
      id: Date.now().toString(),
      name: newAssetName.trim(),
      value: parseFloat(newAssetValue),
      category: newAssetCategory,
    };

    setData({ ...data, assets: [...data.assets, newAsset] });
    setNewAssetName("");
    setNewAssetValue("");
    toast.success("Asset added!");
  };

  // Add liability
  const addLiability = () => {
    if (!newLiabilityName.trim()) {
      toast.error("Please enter a liability name");
      return;
    }
    if (!newLiabilityValue || parseFloat(newLiabilityValue) <= 0) {
      toast.error("Please enter a valid value");
      return;
    }

    const newLiability: LiabilityItem = {
      id: Date.now().toString(),
      name: newLiabilityName.trim(),
      value: parseFloat(newLiabilityValue),
      category: newLiabilityCategory,
    };

    setData({ ...data, liabilities: [...data.liabilities, newLiability] });
    setNewLiabilityName("");
    setNewLiabilityValue("");
    toast.success("Liability added!");
  };

  // Delete asset
  const deleteAsset = (id: string) => {
    setData({ ...data, assets: data.assets.filter((a) => a.id !== id) });
    toast.success("Asset removed");
  };

  // Delete liability
  const deleteLiability = (id: string) => {
    setData({ ...data, liabilities: data.liabilities.filter((l) => l.id !== id) });
    toast.success("Liability removed");
  };

  // Export as PDF
  const exportPDF = async () => {
    if (!summaryRef.current) return;

    try {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`net-worth-summary-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exported successfully!");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  // Export as Image
  const exportImage = async () => {
    if (!summaryRef.current) return;

    try {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `net-worth-summary-${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image exported successfully!");
    } catch {
      toast.error("Failed to export image");
    }
  };

  // Simple pie chart component
  const SimplePieChart = ({ data, colors, total }: { data: { category: string; total: number }[]; colors: (cat: string) => string; total: number }) => {
    if (data.length === 0) return null;

    let currentAngle = 0;
    const paths = data.map((item, index) => {
      const percentage = item.total / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const pathData = angle === 360
        ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
        : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return (
        <path
          key={index}
          d={pathData}
          className={colors(item.category)}
          style={{ fill: "currentColor" }}
        />
      );
    });

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {paths}
        <circle cx="50" cy="50" r="20" className="fill-background" />
      </svg>
    );
  };

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Net Worth Tracker - Track Your Financial Health | TechTrendi"
          description="Track your net worth over time. Monitor assets, liabilities, and see your financial progress with charts and insights."
          canonicalUrl="https://techtrendi.com/tools/net-worth-tracker"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Landmark className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Net Worth Tracker</h1>
              <p className="text-muted-foreground mb-6">
                Track your assets, liabilities, and net worth over time. Get insights into your financial health.
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <a href="/auth">Sign In to Continue</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Net Worth Tracker - Track Your Financial Health | TechTrendi"
        description="Track your net worth over time. Monitor assets, liabilities, and see your financial progress with charts and insights."
        canonicalUrl="https://techtrendi.com/tools/net-worth-tracker"
      />

      <div className="container py-12 md:py-20 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Badge className="mb-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400">
              Free + Account
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Net Worth <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Tracker</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor your financial health and track progress over time
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportImage} className="gap-2">
              <Image className="w-4 h-4" />
              Image
            </Button>
          </div>
        </div>

        {/* Summary Section (for export) */}
        <div ref={summaryRef} className="bg-background p-4 rounded-lg">
          {/* Net Worth Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Net Worth Card */}
            <Card className="md:col-span-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-blue-100 mb-2">
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm font-medium">Net Worth</span>
                </div>
                <p className={cn("text-4xl md:text-5xl font-bold", netWorth < 0 && "text-red-200")}>
                  {formatCurrency(netWorth)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {netWorthChange.value >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-300" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-300" />
                  )}
                  <span className={cn("text-sm", netWorthChange.value >= 0 ? "text-green-300" : "text-red-300")}>
                    {formatCurrency(Math.abs(netWorthChange.value))} ({netWorthChange.percentage.toFixed(1)}%)
                  </span>
                  <span className="text-blue-200 text-sm">vs previous</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Assets */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Total Assets</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalAssets)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.assets.length} item{data.assets.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            {/* Total Liabilities */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Total Liabilities</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalLiabilities)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.liabilities.length} item{data.liabilities.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Net Worth Score */}
          <Card className="mb-8 border-2 border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold", rating.color, "bg-current/10")}>
                    {rating.emoji}
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-bold", rating.color)}>{rating.score}</h3>
                    <p className="text-sm text-muted-foreground max-w-md">{rating.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Your Age:</Label>
                  <Input
                    type="number"
                    value={userAge}
                    onChange={(e) => setUserAge(parseInt(e.target.value) || 30)}
                    className="w-20"
                    min={18}
                    max={100}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Assets Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-green-500" />
                  Assets Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32">
                    {assetsByCategory.length > 0 ? (
                      <SimplePieChart
                        data={assetsByCategory}
                        colors={(cat) => getAssetCategoryInfo(cat).color}
                        total={totalAssets}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No data</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    {assetsByCategory.map(({ category, total }) => {
                      const catInfo = getAssetCategoryInfo(category);
                      const percentage = totalAssets > 0 ? (total / totalAssets) * 100 : 0;
                      return (
                        <div key={category} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", catInfo.color)} />
                            <span>{catInfo.label}</span>
                          </div>
                          <span className="font-medium">{percentage.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-red-500" />
                  Liabilities Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32">
                    {liabilitiesByCategory.length > 0 ? (
                      <SimplePieChart
                        data={liabilitiesByCategory}
                        colors={(cat) => getLiabilityCategoryInfo(cat).color}
                        total={totalLiabilities}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No debt!</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    {liabilitiesByCategory.map(({ category, total }) => {
                      const catInfo = getLiabilityCategoryInfo(category);
                      const percentage = totalLiabilities > 0 ? (total / totalLiabilities) * 100 : 0;
                      return (
                        <div key={category} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", catInfo.color)} />
                            <span>{catInfo.label}</span>
                          </div>
                          <span className="font-medium">{percentage.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Historical Chart */}
        <Card className="mb-8">
          <CardHeader>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowHistory(!showHistory)}
            >
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Net Worth History
              </CardTitle>
              {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          {showHistory && (
            <CardContent>
              {data.history.length < 2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Track your progress over time</p>
                  <p className="text-sm">History will appear as you update your net worth</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Simple line chart visualization */}
                  <div className="h-48 relative border rounded-lg p-4 bg-muted/20">
                    <div className="absolute inset-4 flex items-end justify-between gap-1">
                      {data.history.slice(-30).map((entry, idx) => {
                        const maxNetWorth = Math.max(...data.history.slice(-30).map((h) => Math.abs(h.netWorth)));
                        const height = maxNetWorth > 0 ? (Math.abs(entry.netWorth) / maxNetWorth) * 100 : 0;
                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center group relative"
                          >
                            <div
                              className={cn(
                                "w-full rounded-t transition-all",
                                entry.netWorth >= 0 ? "bg-gradient-to-t from-blue-500 to-indigo-500" : "bg-gradient-to-t from-red-400 to-red-500"
                              )}
                              style={{ height: `${Math.max(height, 5)}%` }}
                            />
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg whitespace-nowrap z-10">
                              <p className="font-medium">{new Date(entry.date).toLocaleDateString()}</p>
                              <p className={entry.netWorth >= 0 ? "text-green-500" : "text-red-500"}>
                                {formatCurrency(entry.netWorth)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{data.history.length > 30 ? "Last 30 days" : `${data.history.length} entries`}</span>
                    <span>Today</span>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Assets and Liabilities Sections */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Assets Section */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowAssets(!showAssets)}
              >
                <CardTitle className="text-lg flex items-center gap-2 text-green-600 dark:text-green-400">
                  <TrendingUp className="w-5 h-5" />
                  Assets
                  <Badge variant="secondary" className="ml-2">{formatCurrency(totalAssets)}</Badge>
                </CardTitle>
                {showAssets ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            {showAssets && (
              <CardContent className="space-y-4">
                {/* Add Asset Form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Input
                    placeholder="Asset name"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Value ($)"
                    value={newAssetValue}
                    onChange={(e) => setNewAssetValue(e.target.value)}
                    min="0"
                  />
                  <div className="flex gap-2">
                    <Select value={newAssetCategory} onValueChange={setNewAssetCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assetCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="w-4 h-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addAsset} size="icon" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Asset List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {data.assets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No assets added yet</p>
                  ) : (
                    data.assets.map((asset) => {
                      const catInfo = getAssetCategoryInfo(asset.category);
                      return (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", catInfo.color)}>
                              <catInfo.icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-xs text-muted-foreground">{catInfo.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(asset.value)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAsset(asset.id)}
                              className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Liabilities Section */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowLiabilities(!showLiabilities)}
              >
                <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                  <TrendingDown className="w-5 h-5" />
                  Liabilities
                  <Badge variant="secondary" className="ml-2">{formatCurrency(totalLiabilities)}</Badge>
                </CardTitle>
                {showLiabilities ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            {showLiabilities && (
              <CardContent className="space-y-4">
                {/* Add Liability Form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <Input
                    placeholder="Liability name"
                    value={newLiabilityName}
                    onChange={(e) => setNewLiabilityName(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Amount ($)"
                    value={newLiabilityValue}
                    onChange={(e) => setNewLiabilityValue(e.target.value)}
                    min="0"
                  />
                  <div className="flex gap-2">
                    <Select value={newLiabilityCategory} onValueChange={setNewLiabilityCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {liabilityCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="w-4 h-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addLiability} size="icon" className="bg-red-600 hover:bg-red-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Liability List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {data.liabilities.length === 0 ? (
                    <div className="text-center py-4">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="text-green-600 dark:text-green-400 font-medium">Debt Free!</p>
                      <p className="text-xs text-muted-foreground">No liabilities to show</p>
                    </div>
                  ) : (
                    data.liabilities.map((liability) => {
                      const catInfo = getLiabilityCategoryInfo(liability.category);
                      return (
                        <div
                          key={liability.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", catInfo.color)}>
                              <catInfo.icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{liability.name}</p>
                              <p className="text-xs text-muted-foreground">{catInfo.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {formatCurrency(liability.value)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLiability(liability.id)}
                              className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowTips(!showTips)}
            >
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Tips to Improve Your Net Worth
              </CardTitle>
              {showTips ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          {showTips && (
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {improvementTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <tip.icon className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-sm">{tip.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{tip.tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Your data is stored locally on this device. Last updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "Never"}</p>
        </div>
      </div>
    </Layout>
  );
}
