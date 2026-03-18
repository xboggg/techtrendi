import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Copy,
  Check,
  Sparkles,
  Building,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface NameResult {
  name: string;
  style: string;
  domain: string;
  why: string;
}

interface GenerationResult {
  names: NameResult[];
  taglines: string[];
}

const industries = [
  { value: "technology-saas", label: "Technology / SaaS" },
  { value: "fashion", label: "Fashion" },
  { value: "food", label: "Food & Beverage" },
  { value: "finance", label: "Finance / Fintech" },
  { value: "health", label: "Health & Wellness" },
  { value: "education", label: "Education" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "creative", label: "Creative / Design" },
  { value: "logistics", label: "Logistics / Delivery" },
  { value: "agriculture", label: "Agriculture" },
  { value: "realestate", label: "Real Estate" },
  { value: "general", label: "General / Other" },
];

const targetMarkets = [
  { value: "ghana-westafrica", label: "Ghana / West Africa" },
  { value: "pan-africa", label: "Pan-Africa" },
  { value: "global", label: "Global" },
  { value: "diaspora", label: "Diaspora" },
  { value: "local", label: "Local" },
];

const brandTones = [
  { value: "modern-tech", label: "Modern & Tech" },
  { value: "premium", label: "Premium" },
  { value: "friendly", label: "Friendly" },
  { value: "bold", label: "Bold" },
  { value: "clean", label: "Clean" },
  { value: "african-cultural", label: "African Cultural" },
  { value: "professional", label: "Professional" },
];

const styleOptions = [
  "Made-up",
  "Descriptive",
  "Single word",
  "Two-word",
  "Acronyms",
  "African-inspired",
  "Metaphorical",
];

export default function AIBusinessNameGenerator() {
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [market, setMarket] = useState("");
  const [tone, setTone] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const copyName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedName(name);
      toast.success(`"${name}" copied!`);
      setTimeout(() => setCopiedName(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please describe your business.");
      return;
    }
    if (!industry) {
      toast.error("Please select an industry.");
      return;
    }
    if (!market) {
      toast.error("Please select a target market.");
      return;
    }
    if (!tone) {
      toast.error("Please select a brand tone.");
      return;
    }
    if (!GROQ_API_KEY) {
      toast.error("Groq API key not configured.");
      return;
    }

    setLoading(true);
    setResult(null);

    const industryLabel = industries.find((i) => i.value === industry)?.label;
    const marketLabel = targetMarkets.find((m) => m.value === market)?.label;
    const toneLabel = brandTones.find((t) => t.value === tone)?.label;
    const stylesText =
      selectedStyles.length > 0
        ? `Preferred naming styles: ${selectedStyles.join(", ")}.`
        : "Use a mix of naming styles.";

    const prompt = `You are a world-class branding expert. Generate business names and return ONLY valid JSON (no markdown, no code fences).

Business Description: ${description}
Industry: ${industryLabel}
Target Market: ${marketLabel}
Brand Tone: ${toneLabel}
${stylesText}

Return this exact JSON structure:
{
  "names": [
    {
      "name": "BusinessName",
      "style": "Made-up" or "Descriptive" or "Single word" or "Two-word" or "Acronyms" or "African-inspired" or "Metaphorical",
      "domain": ".com suggestion e.g. businessname.com or businessname.io",
      "why": "Brief explanation of why this name works"
    }
  ],
  "taglines": ["tagline1", "tagline2", "tagline3", "tagline4", "tagline5"]
}

Generate exactly 20 unique names and 5 taglines. Names should be memorable, brandable, and appropriate for the target market. If the market is African, consider names with African language roots where appropriate.`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No valid JSON in response");

      const parsed: GenerationResult = JSON.parse(jsonMatch[0]);

      if (!parsed.names?.length) {
        throw new Error("No names generated");
      }

      setResult(parsed);
      toast.success(`Generated ${parsed.names.length} business names!`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="AI Business Name Generator | TechTrendi"
        description="Generate unique, brandable business names with AI. Get domain suggestions, style tags, and taglines tailored to your industry and market."
      />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 dark:bg-blue-900/30">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              AI-Powered Naming
            </span>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            AI Business Name Generator
          </h1>
          <p className="mt-2 text-muted-foreground">
            Describe your business and get 20 AI-generated names with domain
            suggestions, style tags, and taglines.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Your Business
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                placeholder="e.g. An online marketplace connecting African artisans with global buyers. We sell handmade crafts, jewelry, and textiles..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => (
                      <SelectItem key={i.value} value={i.value}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Market</Label>
                <Select value={market} onValueChange={setMarket}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetMarkets.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Brand Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandTones.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Naming Styles (optional)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {styleOptions.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      selectedStyles.includes(style)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent"
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating names...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Business Names
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Names Grid */}
            <div>
              <h2 className="mb-4 text-xl font-bold">
                Generated Names ({result.names.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.names.map((item, idx) => (
                  <Card
                    key={idx}
                    className="group cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => copyName(item.name)}
                  >
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="text-lg font-bold">{item.name}</h3>
                        <button
                          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyName(item.name);
                          }}
                        >
                          {copiedName === item.name ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-xs">
                          {item.style}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs font-mono"
                        >
                          <Globe className="mr-1 h-3 w-3" />
                          {item.domain}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.why}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Taglines */}
            {result.taglines?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Taglines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.taglines.map((tagline, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <span className="italic text-muted-foreground">
                          "{tagline}"
                        </span>
                        <button
                          onClick={() => copyName(tagline)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
                        >
                          {copiedName === tagline ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
