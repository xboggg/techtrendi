import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Building2, Loader2, MapPin, Clock, DollarSign, FileText,
  Lightbulb, AlertTriangle, CheckCircle2, Copy, ChevronDown,
  ChevronUp, Globe
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

const countries = [
  "Ghana",
  "Nigeria",
  "Kenya",
  "South Africa",
  "Rwanda",
  "Uganda",
  "Tanzania",
  "Other African Country",
];

const structures = [
  "Sole Proprietorship",
  "Partnership",
  "LLC / Limited Liability Company",
  "Non-profit / NGO",
  "Not sure",
];

const capitalRanges = [
  "Under $500",
  "$500 - $2,000",
  "$2,000 - $10,000",
  "$10,000 - $50,000",
  "$50,000+",
];

interface Step {
  name: string;
  description: string;
  duration: string;
  cost: string;
  where: string;
  documents: string[];
}

interface GuideResult {
  steps: Step[];
  totalTimeline: string;
  totalCostEstimate: string;
  proTips: string[];
  commonMistakes: string[];
}

export default function BusinessRegGuide() {
  const [country, setCountry] = useState("");
  const [structure, setStructure] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [capital, setCapital] = useState("");
  const [questions, setQuestions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GuideResult | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const generate = async () => {
    if (!country) {
      toast.error("Please select a country");
      return;
    }
    if (!structure) {
      toast.error("Please select a business structure");
      return;
    }
    if (!businessType.trim()) {
      toast.error("Please describe your business type");
      return;
    }

    setGenerating(true);
    setResult(null);

    const prompt = `You are an expert business registration consultant specializing in African countries. Provide a step-by-step business registration guide for:

Country: ${country}
Business Structure: ${structure}
Business Type: ${businessType.trim()}
Starting Capital: ${capital || "Not specified"}
${questions.trim() ? `Additional Questions: ${questions.trim()}` : ""}

Provide 4-7 clear, numbered steps. For each step include:
- name: Short step title (e.g., "Reserve Business Name")
- description: 2-3 sentence explanation of what to do
- duration: Estimated time (e.g., "1-3 business days")
- cost: Estimated cost in local currency with USD equivalent (e.g., "GHS 50 (~$4)")
- where: Where to go / website (e.g., "Registrar General's Department (rgd.gov.gh)")
- documents: Array of required documents for this step

Also provide:
- totalTimeline: Overall estimated time from start to finish
- totalCostEstimate: Total estimated cost range
- proTips: Array of exactly 3 insider tips to save time or money
- commonMistakes: Array of exactly 3 common mistakes to avoid

Return ONLY valid JSON with keys: steps (array), totalTimeline (string), totalCostEstimate (string), proTips (array of strings), commonMistakes (array of strings). No markdown, no code fences, no extra text.`;

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              {
                role: "system",
                content:
                  "You are a business registration expert for African countries. Respond with valid JSON only. Be specific about offices, websites, fees, and required documents. Use current 2025/2026 information.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.5,
            max_tokens: 3000,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData?.error?.message || `API error: ${response.status}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty response from AI");

      const cleaned = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed: GuideResult = JSON.parse(cleaned);

      if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        throw new Error("Invalid response format — no steps returned");
      }

      setResult(parsed);
      toast.success(`Guide generated with ${parsed.steps.length} steps!`);
    } catch (err: any) {
      console.error("Business reg guide error:", err);
      toast.error(
        err.message || "Failed to generate guide. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const copyGuide = () => {
    if (!result) return;
    const text = result.steps
      .map(
        (s, i) =>
          `Step ${i + 1}: ${s.name}\n${s.description}\nDuration: ${s.duration}\nCost: ${s.cost}\nWhere: ${s.where}\nDocuments: ${s.documents.join(", ")}`
      )
      .join("\n\n");
    const full = `Business Registration Guide\n${"=".repeat(30)}\n\n${text}\n\nTotal Timeline: ${result.totalTimeline}\nTotal Cost: ${result.totalCostEstimate}\n\nPro Tips:\n${result.proTips.map((t) => `- ${t}`).join("\n")}\n\nCommon Mistakes:\n${result.commonMistakes.map((m) => `- ${m}`).join("\n")}`;
    navigator.clipboard.writeText(full);
    toast.success("Guide copied to clipboard!");
  };

  return (
    <Layout>
      <SEOHead
        title="AI Business Registration Guide | TechTrendi"
        description="Get a step-by-step guide to registering your business in Ghana, Nigeria, Kenya, and other African countries. AI-powered, free, and personalized."
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-4">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-300 text-sm font-medium">
                AI Business Registration Guide
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Register Your Business the Right Way
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Get a personalized, step-by-step guide with costs, timelines, and
              required documents for your country.
            </p>
          </div>

          {/* Input Form */}
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">
                Tell Us About Your Business
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Business Structure</Label>
                  <Select value={structure} onValueChange={setStructure}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder="Select structure" />
                    </SelectTrigger>
                    <SelectContent>
                      {structures.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Business Type</Label>
                  <Input
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="e.g., Online clothing store, Restaurant, Tech consulting"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Starting Capital</Label>
                  <Select value={capital} onValueChange={setCapital}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder="Select range (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {capitalRanges.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Additional Questions (optional)
                </Label>
                <Textarea
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  placeholder="e.g., Do I need a tax clearance certificate? Can I register online?"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 min-h-[80px]"
                />
              </div>

              <Button
                onClick={generate}
                disabled={generating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Your Guide...
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5 mr-2" />
                    Generate Registration Guide
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <>
              {/* Cost & Timeline Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/20">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Total Timeline</p>
                      <p className="text-foreground font-semibold text-lg">
                        {result.totalTimeline}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/20">
                      <DollarSign className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Estimated Total Cost
                      </p>
                      <p className="text-foreground font-semibold text-lg">
                        {result.totalCostEstimate}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline Steps */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-foreground">
                    Registration Steps
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyGuide}
                    className="border-border text-muted-foreground hover:bg-muted"
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copy Guide
                  </Button>
                </div>

                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {result.steps.map((step, i) => {
                      const isExpanded = expandedStep === i;
                      return (
                        <div key={i} className="relative pl-14">
                          {/* Numbered circle */}
                          <div className="absolute left-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm z-10 border-4 border-background">
                            {i + 1}
                          </div>

                          <Card className="bg-card border-border">
                            <CardContent className="pt-5 pb-5">
                              <button
                                onClick={() =>
                                  setExpandedStep(isExpanded ? null : i)
                                }
                                className="w-full text-left"
                              >
                                <div className="flex justify-between items-start">
                                  <h3 className="text-foreground font-semibold text-base">
                                    {step.name}
                                  </h3>
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>

                                {/* Meta pills */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <Badge
                                    variant="outline"
                                    className="text-blue-300 border-blue-500/40 bg-blue-500/10"
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    {step.duration}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                                  >
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    {step.cost}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-amber-300 border-amber-500/40 bg-amber-500/10"
                                  >
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {step.where}
                                  </Badge>
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="mt-4 space-y-3 border-t border-border pt-4">
                                  <p className="text-muted-foreground text-sm leading-relaxed">
                                    {step.description}
                                  </p>
                                  {step.documents &&
                                    step.documents.length > 0 && (
                                      <div>
                                        <p className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-1.5">
                                          <FileText className="w-4 h-4 text-muted-foreground" />
                                          Required Documents
                                        </p>
                                        <ul className="space-y-1">
                                          {step.documents.map((doc, j) => (
                                            <li
                                              key={j}
                                              className="text-muted-foreground text-sm flex items-center gap-2"
                                            >
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                              {doc}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pro Tips & Common Mistakes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Pro Tips */}
                <Card className="bg-emerald-950/40 border-emerald-500/30">
                  <CardHeader>
                    <CardTitle className="text-emerald-300 text-base flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Pro Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.proTips.map((tip, i) => (
                        <li
                          key={i}
                          className="text-muted-foreground text-sm flex gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Common Mistakes */}
                <Card className="bg-rose-950/40 border-rose-500/30">
                  <CardHeader>
                    <CardTitle className="text-rose-300 text-base flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Common Mistakes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.commonMistakes.map((mistake, i) => (
                        <li
                          key={i}
                          className="text-muted-foreground text-sm flex gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* How It Works / Tips */}
          <Card className="bg-card border-border mt-4">
            <CardHeader>
              <CardTitle className="text-foreground text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-emerald-400" />
                Tips for Business Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">1.</span>
                  <span>
                    <strong className="text-foreground">
                      Sole Proprietorship vs LLC:
                    </strong>{" "}
                    A sole proprietorship is the simplest and cheapest to register — you and the business are legally one entity. An LLC (Limited Liability Company) separates your personal assets from business debts, giving you legal protection if things go wrong. LLCs cost more to set up but are worth it as you grow.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">2.</span>
                  <span>
                    <strong className="text-foreground">
                      Why registration matters:
                    </strong>{" "}
                    A registered business can open a business bank account, sign contracts, access loans, win government tenders, and build trust with customers. Operating informally limits your growth and exposes you to legal risk.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">3.</span>
                  <span>
                    <strong className="text-foreground">
                      RGD vs ORC in Ghana:
                    </strong>{" "}
                    In Ghana, the Registrar General's Department (RGD) handles business name registration and company incorporation. The Office of the Registrar of Companies (ORC) was created in 2020 to take over company-related functions from RGD. For sole proprietorships, you still go to RGD. For LLCs, check with ORC at orc.gov.gh.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">4.</span>
                  <span>
                    <strong className="text-foreground">
                      Reserve your business name first:
                    </strong>{" "}
                    In most African countries, the first step is reserving your business name. Prepare 2-3 alternatives — your first choice may already be taken. Name reservation is usually the fastest and cheapest step.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">5.</span>
                  <span>
                    <strong className="text-foreground">
                      Do not skip tax registration:
                    </strong>{" "}
                    After registering your business, register for a Tax Identification Number (TIN). In Ghana, this is done at the Ghana Revenue Authority (GRA). Skipping this step means you cannot issue proper invoices or bid for contracts.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
