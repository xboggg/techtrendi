import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, Search, X, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface PhoneSpec {
  name: string;
  brand: string;
  image?: string;
  specs: {
    display: string;
    processor: string;
    ram: string;
    storage: string;
    battery: string;
    camera: string;
    os: string;
    dimensions: string;
    weight: string;
    price?: string;
  };
}

const popularPhones = [
  "iPhone 15 Pro Max",
  "Samsung Galaxy S24 Ultra",
  "Google Pixel 8 Pro",
  "OnePlus 12",
  "iPhone 15",
  "Samsung Galaxy S24",
];

export default function PhoneComparison() {
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [phone1Data, setPhone1Data] = useState<PhoneSpec | null>(null);
  const [phone2Data, setPhone2Data] = useState<PhoneSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const { subscription } = useAuth();
  const { toast } = useToast();

  const fetchPhoneSpecs = async (phoneName: string): Promise<PhoneSpec | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("fetch-phone-specs", {
        body: { phoneName },
      });

      if (error) throw error;
      return data as PhoneSpec;
    } catch (error) {
      console.error("Error fetching phone specs:", error);
      return null;
    }
  };

  const handleCompare = async () => {
    if (!phone1 || !phone2) {
      toast({
        title: "Please enter both phone names",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const [data1, data2] = await Promise.all([
        fetchPhoneSpecs(phone1),
        fetchPhoneSpecs(phone2),
      ]);

      if (data1) setPhone1Data(data1);
      if (data2) setPhone2Data(data2);

      if (!data1 || !data2) {
        toast({
          title: "Could not find specs for one or both phones",
          description: "Try using the full phone name (e.g., 'iPhone 15 Pro Max')",
          variant: "destructive",
        });
      }
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

  const specLabels = [
    { key: "display", label: "Display" },
    { key: "processor", label: "Processor" },
    { key: "ram", label: "RAM" },
    { key: "storage", label: "Storage" },
    { key: "battery", label: "Battery" },
    { key: "camera", label: "Camera" },
    { key: "os", label: "Operating System" },
    { key: "dimensions", label: "Dimensions" },
    { key: "weight", label: "Weight" },
    { key: "price", label: "Price" },
  ];

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Smartphone className="w-4 h-4" />
            Phone Comparison Tool
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Compare Smartphones Side by Side
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get real specifications and make informed decisions on your next smartphone purchase.
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  First Phone
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., iPhone 15 Pro Max"
                    value={phone1}
                    onChange={(e) => setPhone1(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Second Phone
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Samsung Galaxy S24 Ultra"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Popular Phones */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2">Popular phones:</p>
              <div className="flex flex-wrap gap-2">
                {popularPhones.map((phone) => (
                  <button
                    key={phone}
                    onClick={() => {
                      if (!phone1) setPhone1(phone);
                      else if (!phone2) setPhone2(phone);
                    }}
                    className="px-3 py-1 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
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
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching Specs...
                  </>
                ) : (
                  "Compare Phones"
                )}
              </Button>
              {(phone1Data || phone2Data) && (
                <Button variant="outline" onClick={clearComparison}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        {(phone1Data || phone2Data) && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              {/* Header Row */}
              <div className="grid grid-cols-3 bg-muted">
                <div className="p-4 font-medium text-muted-foreground">Specification</div>
                <div className="p-4 font-semibold text-foreground text-center border-l border-border">
                  {phone1Data?.name || phone1}
                </div>
                <div className="p-4 font-semibold text-foreground text-center border-l border-border">
                  {phone2Data?.name || phone2}
                </div>
              </div>

              {/* Spec Rows */}
              {specLabels.map(({ key, label }, index) => (
                <div
                  key={key}
                  className={`grid grid-cols-3 ${
                    index % 2 === 0 ? "bg-background" : "bg-muted/30"
                  }`}
                >
                  <div className="p-4 font-medium text-muted-foreground">{label}</div>
                  <div className="p-4 text-foreground text-center border-l border-border">
                    {phone1Data?.specs?.[key as keyof PhoneSpec["specs"]] || "—"}
                  </div>
                  <div className="p-4 text-foreground text-center border-l border-border">
                    {phone2Data?.specs?.[key as keyof PhoneSpec["specs"]] || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Upsell */}
        {!subscription.subscribed && (
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-gradient-primary rounded-2xl p-8 text-center">
              <Crown className="w-10 h-10 text-primary-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-primary-foreground mb-2">
                Unlock Premium Features
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
                Get detailed benchmarks, historical price tracking, and AI-powered upgrade recommendations.
              </p>
              <Link to="/premium">
                <Button variant="secondary" className="bg-background text-foreground hover:bg-background/90">
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
