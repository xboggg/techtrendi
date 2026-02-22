import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShoppingBag, Sparkles, Copy, Check, RefreshCw, Wand2, Target,
  MessageSquare, Zap, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tones = [
  { id: "professional", label: "Professional", description: "Business-like and trustworthy" },
  { id: "casual", label: "Casual", description: "Friendly and conversational" },
  { id: "luxury", label: "Luxury", description: "Elegant and premium" },
  { id: "playful", label: "Playful", description: "Fun and energetic" },
  { id: "minimalist", label: "Minimalist", description: "Clean and simple" },
];

const formats = [
  { id: "short", label: "Short (50 words)", length: 50 },
  { id: "medium", label: "Medium (100 words)", length: 100 },
  { id: "long", label: "Long (200 words)", length: 200 },
  { id: "bullets", label: "Bullet Points", length: 0 },
];

const templates: Record<string, (p: { name: string; features: string[]; benefit: string; price: string }) => string> = {
  professional: ({ name, features, benefit, price }) => `
Introducing the ${name} - designed for those who demand excellence.

${features.map((f) => `• ${f}`).join("\n")}

${benefit}

${price ? `Invest in quality at ${price}.` : ""}

Order now and experience the difference.
  `.trim(),

  casual: ({ name, features, benefit, price }) => `
Meet the ${name} - your new favorite thing!

Here's what makes it awesome:
${features.map((f) => `✓ ${f}`).join("\n")}

${benefit}

${price ? `All this for just ${price}!` : ""}

Grab yours today - you won't regret it!
  `.trim(),

  luxury: ({ name, features, benefit, price }) => `
The ${name} - Where Elegance Meets Excellence.

Meticulously crafted for the discerning individual:
${features.map((f) => `◆ ${f}`).join("\n")}

${benefit}

${price ? `An investment in sophistication at ${price}.` : ""}

Elevate your experience. Order your exclusive piece today.
  `.trim(),

  playful: ({ name, features, benefit, price }) => `
🎉 Say hello to the ${name}!

Why you'll LOVE it:
${features.map((f) => `🔥 ${f}`).join("\n")}

${benefit}

${price ? `Best part? It's only ${price}! 🤑` : ""}

Don't wait - get yours NOW! 🚀
  `.trim(),

  minimalist: ({ name, features, benefit, price }) => `
${name}

${features.join(". ")}.

${benefit}

${price || ""}
  `.trim(),
};

export default function ProductDescriptionGenerator() {
  const [productName, setProductName] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mainBenefit, setMainBenefit] = useState("");
  const [price, setPrice] = useState("");
  const [tone, setTone] = useState("professional");
  const [format, setFormat] = useState("medium");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateDescription = () => {
    if (!productName.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    setGenerating(true);

    // Simulate generation delay
    setTimeout(() => {
      const features = keyFeatures
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      if (features.length === 0) {
        features.push("High quality materials");
        features.push("Expert craftsmanship");
        features.push("Satisfaction guaranteed");
      }

      let benefit = mainBenefit.trim();
      if (!benefit) {
        benefit = targetAudience
          ? `Perfect for ${targetAudience.toLowerCase()}.`
          : "Transform your daily routine with this exceptional product.";
      }

      const template = templates[tone];
      let description = template({
        name: productName,
        features,
        benefit,
        price: price.trim(),
      });

      // Adjust length based on format
      const selectedFormat = formats.find((f) => f.id === format);
      if (selectedFormat && selectedFormat.length > 0) {
        const words = description.split(/\s+/);
        if (words.length > selectedFormat.length * 1.5) {
          description = words.slice(0, selectedFormat.length).join(" ") + "...";
        }
      }

      setGeneratedDescription(description);
      setGenerating(false);
      toast.success("Description generated!");
    }, 800);
  };

  const copyDescription = () => {
    navigator.clipboard.writeText(generatedDescription);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerate = () => {
    generateDescription();
  };

  return (
    <Layout>
      <SEOHead
        title="Product Description Generator - AI-Powered Copy | TechTrendi"
        description="Generate compelling product descriptions for your e-commerce store. Choose tone, length, and style."
        canonicalUrl="https://techtrendi.com/tools/product-description-generator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Product Description <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create compelling product descriptions that sell
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            {/* Product Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g., Wireless Bluetooth Headphones"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Key Features (one per line)</Label>
                  <Textarea
                    value={keyFeatures}
                    onChange={(e) => setKeyFeatures(e.target.value)}
                    placeholder="Active noise cancellation
40-hour battery life
Premium memory foam ear cups"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Target Audience
                  </Label>
                  <Input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., Music lovers, Remote workers"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Main Benefit
                  </Label>
                  <Input
                    value={mainBenefit}
                    onChange={(e) => setMainBenefit(e.target.value)}
                    placeholder="e.g., Experience music like never before"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Price (optional)
                  </Label>
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g., $99.99"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Style Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Style Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label} - {t.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button onClick={generateDescription} size="lg" className="w-full" disabled={generating}>
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Description
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            <Card className="min-h-[400px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generated Description
                  </CardTitle>
                  {generatedDescription && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={regenerate}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={copyDescription}>
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedDescription ? (
                  <div className="whitespace-pre-wrap font-sans text-foreground leading-relaxed">
                    {generatedDescription}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <ShoppingBag className="w-12 h-12 mb-4 opacity-50" />
                    <p>Your product description will appear here</p>
                    <p className="text-sm">Fill in the details and click generate</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Writing Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Focus on benefits, not just features
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Use sensory words (feel, experience, enjoy)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Include social proof when possible
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Create urgency without being pushy
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Keep your target audience in mind
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Use Cases */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Perfect For</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">E-commerce</Badge>
                  <Badge variant="outline">Amazon Listings</Badge>
                  <Badge variant="outline">Shopify</Badge>
                  <Badge variant="outline">Social Selling</Badge>
                  <Badge variant="outline">Marketplaces</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
