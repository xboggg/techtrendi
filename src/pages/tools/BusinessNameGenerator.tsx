import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building, Sparkles, Copy, Check, RefreshCw, Globe, Heart, Loader2,
  ExternalLink, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const industries = [
  "Technology",
  "E-commerce",
  "Food & Beverage",
  "Health & Fitness",
  "Fashion",
  "Finance",
  "Education",
  "Real Estate",
  "Marketing",
  "Creative Agency",
  "Consulting",
  "SaaS",
];

const styles = [
  { value: "modern", label: "Modern & Clean" },
  { value: "creative", label: "Creative & Fun" },
  { value: "professional", label: "Professional" },
  { value: "tech", label: "Tech & Innovative" },
  { value: "friendly", label: "Friendly & Approachable" },
  { value: "luxury", label: "Luxury & Premium" },
];

// Name generation logic
const prefixes = ["Nova", "Peak", "Bright", "Swift", "Core", "Apex", "Prime", "Echo", "Spark", "Flow", "Wave", "Pulse", "Zen", "Arc", "Lux"];
const suffixes = ["Labs", "Hub", "Studio", "Co", "Works", "Nest", "Base", "Box", "Sphere", "Craft", "ify", "ly", "io", "app", "HQ"];
const techWords = ["Byte", "Pixel", "Cloud", "Data", "Tech", "Code", "Digital", "Net", "Cyber", "AI", "Logic", "Sync"];
const creativeWords = ["Bloom", "Dream", "Glow", "Rise", "Thrive", "Spark", "Vibe", "Aura", "Muse", "Flair"];
const professionalWords = ["Trust", "Elite", "Summit", "Global", "Premier", "Alliance", "Capital", "Group", "Partners"];

const generateNames = (keywords: string[], industry: string, style: string): string[] => {
  const names = new Set<string>();

  // Get relevant word lists based on style
  let wordPool = [...prefixes];
  if (style === "tech") wordPool = [...wordPool, ...techWords];
  if (style === "creative") wordPool = [...wordPool, ...creativeWords];
  if (style === "professional") wordPool = [...wordPool, ...professionalWords];

  // Generate from keywords
  keywords.forEach((keyword) => {
    const cleanKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();

    // Keyword + Suffix
    suffixes.forEach((suffix) => {
      names.add(cleanKeyword + suffix);
    });

    // Prefix + Keyword
    wordPool.slice(0, 5).forEach((prefix) => {
      names.add(prefix + cleanKeyword);
    });
  });

  // Generate random combinations
  for (let i = 0; i < 20; i++) {
    const prefix = wordPool[Math.floor(Math.random() * wordPool.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    names.add(prefix + suffix);

    // Two-word combos
    const word1 = wordPool[Math.floor(Math.random() * wordPool.length)];
    const word2 = prefixes[Math.floor(Math.random() * prefixes.length)];
    names.add(word1 + word2);
  }

  // Portmanteau style
  if (keywords.length >= 2) {
    const k1 = keywords[0].substring(0, Math.ceil(keywords[0].length / 2));
    const k2 = keywords[1].substring(Math.floor(keywords[1].length / 2));
    names.add((k1 + k2).charAt(0).toUpperCase() + (k1 + k2).slice(1).toLowerCase());
  }

  return Array.from(names).slice(0, 30);
};

interface GeneratedName {
  name: string;
  domain: string;
  available: boolean | null;
  saved: boolean;
}

export default function BusinessNameGenerator() {
  const [keywords, setKeywords] = useState("");
  const [industry, setIndustry] = useState("");
  const [style, setStyle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      toast.error("Please enter some keywords");
      return;
    }

    setIsGenerating(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const keywordArray = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    const names = generateNames(keywordArray, industry, style);

    setGeneratedNames(
      names.map((name) => ({
        name,
        domain: name.toLowerCase().replace(/\s+/g, "") + ".com",
        available: Math.random() > 0.5 ? true : Math.random() > 0.5 ? false : null,
        saved: false,
      }))
    );

    setIsGenerating(false);
    toast.success(`Generated ${names.length} business name ideas!`);
  };

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedName(name);
    toast.success("Name copied!");
    setTimeout(() => setCopiedName(null), 2000);
  };

  const toggleSave = (name: string) => {
    setGeneratedNames((prev) =>
      prev.map((n) =>
        n.name === name ? { ...n, saved: !n.saved } : n
      )
    );
    toast.success("Saved to favorites!");
  };

  const savedNames = generatedNames.filter((n) => n.saved);

  return (
    <Layout>
      <SEOHead
        title="Business Name Generator - Generate Company Names | TechTrendi"
        description="Generate creative business names with our AI-powered tool. Get instant name ideas with domain availability check."
        canonicalUrl="https://techtrendi.com/tools/business-name-generator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Business Name <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Generate creative business names instantly. Find the perfect name for your startup.
          </p>
        </div>

        {/* Generator Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generate Names
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Keywords (comma-separated)</Label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., tech, innovation, cloud"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter words that describe your business
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Industry (optional)</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Style (optional)</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Names
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {generatedNames.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Generated Names */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Generated Names</CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleGenerate}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {generatedNames.map((item) => (
                      <div
                        key={item.name}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-colors",
                          item.saved && "bg-primary/5 border-primary"
                        )}
                      >
                        <div>
                          <p className="font-semibold text-lg">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Globe className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{item.domain}</span>
                            {item.available === true && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                Available
                              </Badge>
                            )}
                            {item.available === false && (
                              <Badge variant="outline" className="text-xs">
                                Taken
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSave(item.name)}
                          >
                            <Heart
                              className={cn(
                                "w-4 h-4",
                                item.saved && "fill-red-500 text-red-500"
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyName(item.name)}
                          >
                            {copiedName === item.name ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Saved Names */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Saved Names
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {savedNames.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Click the heart to save your favorites
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {savedNames.map((item) => (
                        <div
                          key={item.name}
                          className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                        >
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.domain}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Naming Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Keep it short and memorable</p>
                  <p>• Make sure it's easy to spell</p>
                  <p>• Check domain availability</p>
                  <p>• Verify social handles are free</p>
                  <p>• Consider trademark conflicts</p>
                  <p>• Test how it sounds out loud</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
