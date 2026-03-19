import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, Search, X, Loader2, ExternalLink, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const API_URL = "https://db.techtrendi.com/api/compare-phones";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

interface PhoneSpecCategory {
  [key: string]: string;
}

interface PhoneData {
  name: string;
  image?: string;
  specs: Record<string, PhoneSpecCategory>;
  source?: string;
  error?: string;
}

interface CompareResponse {
  phone1: PhoneData;
  phone2: PhoneData;
}

const popularPhones = [
  "Samsung Galaxy S26 Ultra",
  "iPhone 17 Pro Max",
  "Google Pixel 9 Pro",
  "OnePlus 13",
  "Xiaomi 15 Ultra",
  "Samsung Galaxy S25",
  "iPhone 16",
  "Nothing Phone (3)",
];

// Spec sections in GSMArena order
const specSections = [
  { key: "network", label: "NETWORK", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
  { key: "launch", label: "LAUNCH", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  { key: "body", label: "BODY", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  { key: "display", label: "DISPLAY", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  { key: "platform", label: "PLATFORM", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  { key: "memory", label: "MEMORY", color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400" },
  { key: "main_camera", label: "MAIN CAMERA", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400" },
  { key: "selfie_camera", label: "SELFIE CAMERA", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" },
  { key: "sound", label: "SOUND", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  { key: "comms", label: "COMMS", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400" },
  { key: "features", label: "FEATURES", color: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  { key: "battery", label: "BATTERY", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  { key: "misc", label: "MISC", color: "bg-slate-500/10 text-slate-700 dark:text-slate-400" },
];

function formatSpecKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PhoneComparison() {
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [phone1Data, setPhone1Data] = useState<PhoneData | null>(null);
  const [phone2Data, setPhone2Data] = useState<PhoneData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCompare = async () => {
    if (!phone1 || !phone2) {
      toast({ title: "Please enter both phone names", variant: "destructive" });
      return;
    }

    setLoading(true);
    setPhone1Data(null);
    setPhone2Data(null);

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ phone1, phone2 }),
      });

      if (!resp.ok) throw new Error(`API error: ${resp.status}`);

      const data: CompareResponse = await resp.json();
      setPhone1Data(data.phone1);
      setPhone2Data(data.phone2);

      if (data.phone1?.error && data.phone2?.error) {
        toast({
          title: "Could not find specs for either phone",
          description: "Try the full phone name (e.g., 'Samsung Galaxy S25 Ultra')",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Compare error:", error);
      toast({
        title: "Failed to compare phones",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearComparison = () => {
    setPhone1("");
    setPhone2("");
    setPhone1Data(null);
    setPhone2Data(null);
  };

  // Collect all sections that have data
  const activeSections = specSections.filter(({ key }) => {
    const s1 = phone1Data?.specs?.[key];
    const s2 = phone2Data?.specs?.[key];
    return (s1 && Object.keys(s1).length > 0) || (s2 && Object.keys(s2).length > 0);
  });

  const hasResults = phone1Data || phone2Data;

  return (
    <Layout>
      <SEOHead
        title="Phone Comparison Tool"
        description="Compare phone specs side by side. Battery, camera, display, performance — see exactly how two phones stack up."
        canonical="/tools/phone-comparison"
        keywords={["phone comparison", "compare phones", "phone specs", "smartphone comparison", "phone vs phone"]}
      />
      <div className="container py-8 md:py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Smartphone className="w-4 h-4" />
            Phone Comparison Tool
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Compare Specs
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real specifications from GSMArena with AI-powered fallback. Compare any two smartphones side by side.
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-end mb-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Compare With
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g., Samsung Galaxy S26 Ultra"
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCompare()}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center pb-1">
              <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-full">VS</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Compare With
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g., iPhone 17 Pro Max"
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCompare()}
                  className="pl-10 h-11"
                />
              </div>
            </div>
          </div>

          {/* Popular Phones */}
          <div className="mb-5">
            <p className="text-xs text-muted-foreground mb-2">Quick pick:</p>
            <div className="flex flex-wrap gap-1.5">
              {popularPhones.map((phone) => (
                <button
                  key={phone}
                  onClick={() => {
                    if (!phone1) setPhone1(phone);
                    else if (!phone2) setPhone2(phone);
                  }}
                  className="px-3 py-1 text-xs rounded-full border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-muted-foreground transition-all"
                >
                  {phone}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCompare}
              disabled={loading || !phone1 || !phone2}
              className="flex-1 h-11"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching from GSMArena...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Compare Phones
                </>
              )}
            </Button>
            {hasResults && (
              <Button variant="outline" onClick={clearComparison} className="h-11">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {hasResults && (
          <div className="space-y-0">
            {/* Phone Headers with Images */}
            <div className="bg-card rounded-t-2xl border border-border border-b-0 overflow-hidden">
              <div className="grid grid-cols-[120px_1fr_1fr] md:grid-cols-[160px_1fr_1fr]">
                <div className="p-4 bg-muted/50" />
                {[phone1Data, phone2Data].map((phone, i) => (
                  <div key={i} className="p-4 md:p-6 text-center border-l border-border bg-muted/30">
                    {phone?.image && (
                      <img
                        src={phone.image}
                        alt={phone.name}
                        className="w-24 h-32 md:w-32 md:h-40 mx-auto mb-3 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <h3 className="text-sm md:text-base font-bold text-foreground leading-tight">
                      {phone?.name || (i === 0 ? phone1 : phone2)}
                    </h3>
                    {phone?.source && (
                      <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground">
                        <ExternalLink className="w-2.5 h-2.5" />
                        {phone.source === "gsmarena" ? "GSMArena" : phone.source === "groq" ? "AI Generated" : phone.source}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Spec Sections */}
            <div className="bg-card border-x border-border overflow-hidden">
              {activeSections.map(({ key, label, color }) => {
                const specs1 = phone1Data?.specs?.[key] || {};
                const specs2 = phone2Data?.specs?.[key] || {};
                const allKeys = [...new Set([...Object.keys(specs1), ...Object.keys(specs2)])];

                return (
                  <div key={key}>
                    {/* Section Header */}
                    <div className={cn("px-4 py-2 border-y border-border", color)}>
                      <span className="text-xs font-bold tracking-wider">{label}</span>
                    </div>

                    {/* Spec Rows */}
                    {allKeys.map((specKey, idx) => {
                      const val1 = specs1[specKey] || "";
                      const val2 = specs2[specKey] || "";
                      const isDifferent = val1 && val2 && val1 !== val2;

                      return (
                        <div
                          key={specKey}
                          className={cn(
                            "grid grid-cols-[120px_1fr_1fr] md:grid-cols-[160px_1fr_1fr] border-b border-border/50 last:border-b-0",
                            idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                          )}
                        >
                          <div className="p-2.5 md:p-3 text-xs font-medium text-muted-foreground border-r border-border/50">
                            {formatSpecKey(specKey)}
                          </div>
                          <div className={cn(
                            "p-2.5 md:p-3 text-xs text-foreground border-r border-border/50 break-words",
                            isDifferent && "bg-green-500/5"
                          )}>
                            {val1 || <span className="text-muted-foreground/50">—</span>}
                          </div>
                          <div className={cn(
                            "p-2.5 md:p-3 text-xs text-foreground break-words",
                            isDifferent && "bg-blue-500/5"
                          )}>
                            {val2 || <span className="text-muted-foreground/50">—</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="bg-muted/50 rounded-b-2xl border border-border border-t-0 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Specifications sourced from GSMArena. AI fallback powered by Groq when live data is unavailable.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasResults && !loading && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Smartphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Compare Any Two Phones</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Enter phone names above and get detailed specifications pulled directly from GSMArena, including display, camera, battery, processor, and more.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
