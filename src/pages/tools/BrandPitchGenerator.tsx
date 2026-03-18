import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Mail, Copy, Check, Loader2, Sparkles, Lightbulb, Handshake,
} from "lucide-react";

const collabTypes = [
  { id: "sponsored", label: "Sponsored Post" },
  { id: "review", label: "Product Review" },
  { id: "ambassador", label: "Brand Ambassador" },
  { id: "affiliate", label: "Affiliate Partnership" },
  { id: "takeover", label: "Account Takeover" },
];

interface PitchResult {
  subject_line: string;
  email_body: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

export default function BrandPitchGenerator() {
  const [creatorName, setCreatorName] = useState("");
  const [niche, setNiche] = useState("");
  const [followers, setFollowers] = useState("");
  const [avgViews, setAvgViews] = useState("");
  const [brandName, setBrandName] = useState("");
  const [collabType, setCollabType] = useState("sponsored");
  const [uvp, setUvp] = useState("");
  const [result, setResult] = useState<PitchResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const generatePitch = async () => {
    if (!creatorName.trim() || !niche.trim() || !brandName.trim()) {
      toast.error("Please fill in your name, niche, and the brand name");
      return;
    }

    setGenerating(true);
    setResult(null);

    const collabLabel = collabTypes.find((c) => c.id === collabType)?.label || collabType;

    const prompt = `You are an expert at writing brand pitch emails for content creators. Write a professional, personalized pitch email.

Creator Details:
- Name/Channel: ${creatorName.trim()}
- Niche: ${niche.trim()}
- Followers/Subscribers: ${followers.trim() || "Not specified"}
- Average Views: ${avgViews.trim() || "Not specified"}
- Brand to Pitch: ${brandName.trim()}
- Collaboration Type: ${collabLabel}
${uvp.trim() ? `- Unique Value Proposition: ${uvp.trim()}` : ""}

Write a pitch that:
- Has a compelling subject line that gets opened (not spammy)
- Opens with something specific about the brand (shows research)
- Clearly states who the creator is and their audience
- Proposes a specific collaboration idea
- Includes social proof (metrics, engagement)
- Ends with a clear call to action
- Is professional but personable (not robotic)
- Is concise (under 250 words for the body)

Return ONLY valid JSON with two keys:
- subject_line: the email subject line
- email_body: the full email body text (use \\n for line breaks)

No markdown, no code fences, no extra text.`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
              content: "You are a brand deal strategist for creators. Always respond with valid JSON only. No markdown, no explanation.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) throw new Error("Empty response from AI");

      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed: PitchResult = JSON.parse(cleaned);

      if (!parsed.subject_line || !parsed.email_body) {
        throw new Error("Invalid response format");
      }

      setResult(parsed);
      toast.success("Pitch email generated!");
    } catch (err: any) {
      console.error("Pitch generation error:", err);
      toast.error(err.message || "Failed to generate pitch. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyText = (text: string, type: "subject" | "body") => {
    navigator.clipboard.writeText(text);
    if (type === "subject") {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  return (
    <Layout>
      <SEOHead
        title="AI Brand Pitch Email Generator | TechTrendi"
        description="Generate professional brand pitch emails for sponsorships, reviews, and collaborations. AI-powered pitch writer for content creators."
        canonical="/tools/brand-pitch"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700">
            AI-Powered Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Brand Pitch <span className="text-amber-500">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Craft professional brand pitch emails that get responses. Land your next sponsorship deal.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-amber-500" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Your Name / Channel *</Label>
                  <Input
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="e.g., TechTrendi, @yourhandle"
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Niche *</Label>
                  <Input
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g., Tech Reviews, Fitness, Personal Finance"
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Followers / Subs</Label>
                    <Input
                      value={followers}
                      onChange={(e) => setFollowers(e.target.value)}
                      placeholder="e.g., 25,000"
                      className="bg-muted/50 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Avg. Views</Label>
                    <Input
                      value={avgViews}
                      onChange={(e) => setAvgViews(e.target.value)}
                      placeholder="e.g., 5,000"
                      className="bg-muted/50 border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-500" />
                  Pitch Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Brand to Pitch *</Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g., Nike, Notion, Skillshare"
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Collaboration Type</Label>
                  <Select value={collabType} onValueChange={setCollabType}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {collabTypes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Unique Value Proposition <span className="text-muted-foreground/70">(optional)</span>
                  </Label>
                  <Textarea
                    value={uvp}
                    onChange={(e) => setUvp(e.target.value)}
                    placeholder="What makes you different? e.g., 'My audience is 85% US-based tech professionals aged 25-40 with high purchase intent.'"
                    className="bg-muted/50 border-border min-h-[80px] resize-y"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generatePitch}
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Writing Your Pitch...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Pitch Email
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            {generating && (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-muted rounded-xl" />
                <div className="h-80 bg-muted rounded-xl" />
              </div>
            )}

            {result && !generating && (
              <div className="space-y-4">
                {/* Subject Line */}
                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm text-amber-600 dark:text-amber-400">Subject Line</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyText(result.subject_line, "subject")}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                    >
                      {copiedSubject ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground font-semibold text-lg">
                      {result.subject_line}
                    </p>
                  </CardContent>
                </Card>

                {/* Email Body */}
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      Email Body
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(result.email_body, "body")}
                      className="border-border"
                    >
                      {copiedBody ? (
                        <>
                          <Check className="w-4 h-4 mr-1 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {result.email_body}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!result && !generating && (
              <Card className="min-h-[500px] bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                  <Mail className="w-12 h-12 mb-4 opacity-50 text-amber-500/50" />
                  <p className="font-medium">Your pitch email will appear here</p>
                  <p className="text-sm mt-1">Fill in your details and generate</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <Card className="mt-12 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold mt-0.5">1.</span>
                <span>
                  <strong className="text-foreground">Brand deals</strong> are partnerships where companies pay creators to promote products. They range from free products (gifting) to five-figure sponsorships. Even creators with 1,000 followers can land micro-deals.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold mt-0.5">2.</span>
                <span>
                  <strong className="text-foreground">Know your rate.</strong> A common starting formula: $10-$25 per 1,000 followers for a single post. Video content commands 2-3x more. Factor in your engagement rate — a 5% rate is worth more than 100K followers with 0.5% engagement.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold mt-0.5">3.</span>
                <span>
                  <strong className="text-foreground">Don't pitch too early.</strong> Build at least 90 days of consistent content and genuine engagement before reaching out. Brands check your recent posts — an active, growing account is more attractive than a large but stale one.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold mt-0.5">4.</span>
                <span>
                  Always <strong className="text-foreground">personalize</strong> the generated email. Mention a specific product you love, reference a recent brand campaign, or share a genuine story. Generic pitches get ignored — specific ones get replies.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold mt-0.5">5.</span>
                <span>
                  <strong className="text-foreground">Follow up</strong> after 5-7 business days if you don't hear back. Most deals happen on the second or third email, not the first. Be polite and brief — one follow-up line is enough.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
