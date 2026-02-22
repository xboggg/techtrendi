import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code, Copy, Check, RefreshCw, Eye, Search, Share2, Twitter, Facebook,
  Globe, FileText, AlertCircle, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MetaConfig {
  // Basic
  title: string;
  description: string;
  keywords: string;
  author: string;
  canonicalUrl: string;

  // OpenGraph
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  ogSiteName: string;

  // Twitter
  twitterCard: string;
  twitterSite: string;
  twitterCreator: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;

  // Additional
  robots: string;
  viewport: string;
  charset: string;
  language: string;
  themeColor: string;
}

const defaultConfig: MetaConfig = {
  title: "",
  description: "",
  keywords: "",
  author: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  ogUrl: "",
  ogType: "website",
  ogSiteName: "",
  twitterCard: "summary_large_image",
  twitterSite: "",
  twitterCreator: "",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
  charset: "UTF-8",
  language: "en",
  themeColor: "#ffffff",
};

export default function MetaTagGenerator() {
  const [config, setConfig] = useState<MetaConfig>(defaultConfig);
  const [copied, setCopied] = useState(false);
  const [syncOG, setSyncOG] = useState(true);
  const [syncTwitter, setSyncTwitter] = useState(true);

  const updateConfig = (updates: Partial<MetaConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };

      // Sync OpenGraph with basic if enabled
      if (syncOG && (updates.title || updates.description)) {
        if (updates.title && !prev.ogTitle) newConfig.ogTitle = updates.title;
        if (updates.description && !prev.ogDescription) newConfig.ogDescription = updates.description;
      }

      // Sync Twitter with OpenGraph if enabled
      if (syncTwitter && (updates.ogTitle || updates.ogDescription || updates.ogImage)) {
        if (updates.ogTitle && !prev.twitterTitle) newConfig.twitterTitle = updates.ogTitle;
        if (updates.ogDescription && !prev.twitterDescription) newConfig.twitterDescription = updates.ogDescription;
        if (updates.ogImage && !prev.twitterImage) newConfig.twitterImage = updates.ogImage;
      }

      return newConfig;
    });
  };

  const generateMetaTags = () => {
    let tags = "";

    // Charset
    if (config.charset) {
      tags += `<meta charset="${config.charset}">\n`;
    }

    // Viewport
    if (config.viewport) {
      tags += `<meta name="viewport" content="${config.viewport}">\n`;
    }

    tags += "\n<!-- Primary Meta Tags -->\n";

    // Basic Meta Tags
    if (config.title) {
      tags += `<title>${config.title}</title>\n`;
      tags += `<meta name="title" content="${config.title}">\n`;
    }
    if (config.description) {
      tags += `<meta name="description" content="${config.description}">\n`;
    }
    if (config.keywords) {
      tags += `<meta name="keywords" content="${config.keywords}">\n`;
    }
    if (config.author) {
      tags += `<meta name="author" content="${config.author}">\n`;
    }
    if (config.robots) {
      tags += `<meta name="robots" content="${config.robots}">\n`;
    }
    if (config.language) {
      tags += `<meta http-equiv="content-language" content="${config.language}">\n`;
    }
    if (config.canonicalUrl) {
      tags += `<link rel="canonical" href="${config.canonicalUrl}">\n`;
    }
    if (config.themeColor) {
      tags += `<meta name="theme-color" content="${config.themeColor}">\n`;
    }

    // OpenGraph
    const hasOG = config.ogTitle || config.ogDescription || config.ogImage;
    if (hasOG) {
      tags += "\n<!-- Open Graph / Facebook -->\n";
      tags += `<meta property="og:type" content="${config.ogType}">\n`;
      if (config.ogUrl || config.canonicalUrl) {
        tags += `<meta property="og:url" content="${config.ogUrl || config.canonicalUrl}">\n`;
      }
      if (config.ogTitle || config.title) {
        tags += `<meta property="og:title" content="${config.ogTitle || config.title}">\n`;
      }
      if (config.ogDescription || config.description) {
        tags += `<meta property="og:description" content="${config.ogDescription || config.description}">\n`;
      }
      if (config.ogImage) {
        tags += `<meta property="og:image" content="${config.ogImage}">\n`;
      }
      if (config.ogSiteName) {
        tags += `<meta property="og:site_name" content="${config.ogSiteName}">\n`;
      }
    }

    // Twitter
    const hasTwitter = config.twitterTitle || config.twitterDescription || config.twitterImage;
    if (hasTwitter || hasOG) {
      tags += "\n<!-- Twitter -->\n";
      tags += `<meta property="twitter:card" content="${config.twitterCard}">\n`;
      if (config.ogUrl || config.canonicalUrl) {
        tags += `<meta property="twitter:url" content="${config.ogUrl || config.canonicalUrl}">\n`;
      }
      if (config.twitterTitle || config.ogTitle || config.title) {
        tags += `<meta property="twitter:title" content="${config.twitterTitle || config.ogTitle || config.title}">\n`;
      }
      if (config.twitterDescription || config.ogDescription || config.description) {
        tags += `<meta property="twitter:description" content="${config.twitterDescription || config.ogDescription || config.description}">\n`;
      }
      if (config.twitterImage || config.ogImage) {
        tags += `<meta property="twitter:image" content="${config.twitterImage || config.ogImage}">\n`;
      }
      if (config.twitterSite) {
        tags += `<meta property="twitter:site" content="${config.twitterSite}">\n`;
      }
      if (config.twitterCreator) {
        tags += `<meta property="twitter:creator" content="${config.twitterCreator}">\n`;
      }
    }

    return tags;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMetaTags());
    setCopied(true);
    toast.success("Meta tags copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setConfig(defaultConfig);
    toast.success("Reset to defaults");
  };

  const getSEOScore = () => {
    let score = 0;
    const checks: { label: string; passed: boolean; tip: string }[] = [];

    // Title check (60 chars max)
    const titleLength = config.title.length;
    const titleOk = titleLength > 0 && titleLength <= 60;
    checks.push({
      label: "Title length (50-60 chars)",
      passed: titleOk && titleLength >= 50,
      tip: titleLength === 0 ? "Add a title" : titleLength > 60 ? "Title too long" : titleLength < 50 ? "Title could be longer" : "Perfect!",
    });
    if (titleOk) score += 20;

    // Description check (150-160 chars)
    const descLength = config.description.length;
    const descOk = descLength >= 120 && descLength <= 160;
    checks.push({
      label: "Description length (120-160 chars)",
      passed: descOk,
      tip: descLength === 0 ? "Add a description" : descLength > 160 ? "Description too long" : descLength < 120 ? "Description too short" : "Perfect!",
    });
    if (descOk) score += 20;

    // Canonical URL
    const hasCanonical = config.canonicalUrl.length > 0;
    checks.push({
      label: "Canonical URL",
      passed: hasCanonical,
      tip: hasCanonical ? "Perfect!" : "Add a canonical URL to prevent duplicate content issues",
    });
    if (hasCanonical) score += 15;

    // OG Image
    const hasOGImage = config.ogImage.length > 0;
    checks.push({
      label: "OpenGraph image",
      passed: hasOGImage,
      tip: hasOGImage ? "Perfect!" : "Add an image for better social sharing",
    });
    if (hasOGImage) score += 20;

    // Keywords
    const hasKeywords = config.keywords.length > 0;
    checks.push({
      label: "Keywords (optional)",
      passed: hasKeywords,
      tip: hasKeywords ? "Good!" : "Keywords are less important now but still useful",
    });
    if (hasKeywords) score += 10;

    // Author
    const hasAuthor = config.author.length > 0;
    checks.push({
      label: "Author",
      passed: hasAuthor,
      tip: hasAuthor ? "Good!" : "Add author for attribution",
    });
    if (hasAuthor) score += 5;

    // Robots
    const hasRobots = config.robots.includes("index");
    checks.push({
      label: "Robots (indexable)",
      passed: hasRobots,
      tip: hasRobots ? "Page is indexable" : "Page won't be indexed by search engines",
    });
    if (hasRobots) score += 10;

    return { score, checks };
  };

  const seoAnalysis = getSEOScore();

  return (
    <Layout>
      <SEOHead
        title="Meta Tag Generator - SEO Meta Tags Creator | TechTrendi"
        description="Generate SEO-friendly meta tags for your website. Create OpenGraph, Twitter Cards, and basic meta tags with live preview."
        canonicalUrl="https://techtrendi.com/tools/meta-tag-generator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meta Tag <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Generate SEO-optimized meta tags for your website. Includes OpenGraph and Twitter Cards.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Input Forms */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">
                  <FileText className="w-4 h-4 mr-2 hidden sm:inline" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="og">
                  <Facebook className="w-4 h-4 mr-2 hidden sm:inline" />
                  OpenGraph
                </TabsTrigger>
                <TabsTrigger value="twitter">
                  <Twitter className="w-4 h-4 mr-2 hidden sm:inline" />
                  Twitter
                </TabsTrigger>
                <TabsTrigger value="advanced">
                  <Globe className="w-4 h-4 mr-2 hidden sm:inline" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Basic Meta Tags</CardTitle>
                    <CardDescription>Essential meta tags for SEO</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>
                        Page Title
                        <span className={cn(
                          "ml-2 text-xs",
                          config.title.length > 60 ? "text-red-500" : "text-muted-foreground"
                        )}>
                          {config.title.length}/60
                        </span>
                      </Label>
                      <Input
                        value={config.title}
                        onChange={(e) => updateConfig({ title: e.target.value })}
                        placeholder="Your awesome page title"
                      />
                    </div>
                    <div>
                      <Label>
                        Description
                        <span className={cn(
                          "ml-2 text-xs",
                          config.description.length > 160 ? "text-red-500" : "text-muted-foreground"
                        )}>
                          {config.description.length}/160
                        </span>
                      </Label>
                      <Textarea
                        value={config.description}
                        onChange={(e) => updateConfig({ description: e.target.value })}
                        placeholder="A brief description of your page (150-160 chars ideal)"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Keywords (comma separated)</Label>
                      <Input
                        value={config.keywords}
                        onChange={(e) => updateConfig({ keywords: e.target.value })}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Author</Label>
                        <Input
                          value={config.author}
                          onChange={(e) => updateConfig({ author: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Canonical URL</Label>
                        <Input
                          value={config.canonicalUrl}
                          onChange={(e) => updateConfig({ canonicalUrl: e.target.value })}
                          placeholder="https://example.com/page"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="og" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Facebook className="w-4 h-4" />
                      OpenGraph Tags
                    </CardTitle>
                    <CardDescription>For Facebook, LinkedIn, and other social platforms</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Auto-sync with Basic</p>
                        <p className="text-xs text-muted-foreground">Copy title & description from basic tags</p>
                      </div>
                      <Switch checked={syncOG} onCheckedChange={setSyncOG} />
                    </div>

                    <div>
                      <Label>OG Title</Label>
                      <Input
                        value={config.ogTitle}
                        onChange={(e) => updateConfig({ ogTitle: e.target.value })}
                        placeholder={config.title || "Same as page title"}
                      />
                    </div>
                    <div>
                      <Label>OG Description</Label>
                      <Textarea
                        value={config.ogDescription}
                        onChange={(e) => updateConfig({ ogDescription: e.target.value })}
                        placeholder={config.description || "Same as page description"}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>OG Image URL</Label>
                      <Input
                        value={config.ogImage}
                        onChange={(e) => updateConfig({ ogImage: e.target.value })}
                        placeholder="https://example.com/image.jpg (1200x630 recommended)"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Site Name</Label>
                        <Input
                          value={config.ogSiteName}
                          onChange={(e) => updateConfig({ ogSiteName: e.target.value })}
                          placeholder="My Website"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Input
                          value={config.ogType}
                          onChange={(e) => updateConfig({ ogType: e.target.value })}
                          placeholder="website"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="twitter" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      Twitter Card Tags
                    </CardTitle>
                    <CardDescription>For Twitter/X sharing previews</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Auto-sync with OpenGraph</p>
                        <p className="text-xs text-muted-foreground">Copy from OpenGraph tags</p>
                      </div>
                      <Switch checked={syncTwitter} onCheckedChange={setSyncTwitter} />
                    </div>

                    <div>
                      <Label>Card Type</Label>
                      <select
                        value={config.twitterCard}
                        onChange={(e) => updateConfig({ twitterCard: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border bg-background"
                      >
                        <option value="summary">Summary</option>
                        <option value="summary_large_image">Summary Large Image</option>
                        <option value="app">App</option>
                        <option value="player">Player</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Site (@username)</Label>
                        <Input
                          value={config.twitterSite}
                          onChange={(e) => updateConfig({ twitterSite: e.target.value })}
                          placeholder="@yourbrand"
                        />
                      </div>
                      <div>
                        <Label>Creator (@username)</Label>
                        <Input
                          value={config.twitterCreator}
                          onChange={(e) => updateConfig({ twitterCreator: e.target.value })}
                          placeholder="@author"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Title (override)</Label>
                      <Input
                        value={config.twitterTitle}
                        onChange={(e) => updateConfig({ twitterTitle: e.target.value })}
                        placeholder={config.ogTitle || config.title || "Uses OG/basic title"}
                      />
                    </div>
                    <div>
                      <Label>Image URL (override)</Label>
                      <Input
                        value={config.twitterImage}
                        onChange={(e) => updateConfig({ twitterImage: e.target.value })}
                        placeholder={config.ogImage || "Uses OG image"}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Advanced Settings</CardTitle>
                    <CardDescription>Technical meta tags</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Robots</Label>
                        <select
                          value={config.robots}
                          onChange={(e) => updateConfig({ robots: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border bg-background"
                        >
                          <option value="index, follow">Index, Follow</option>
                          <option value="noindex, follow">Noindex, Follow</option>
                          <option value="index, nofollow">Index, Nofollow</option>
                          <option value="noindex, nofollow">Noindex, Nofollow</option>
                        </select>
                      </div>
                      <div>
                        <Label>Language</Label>
                        <Input
                          value={config.language}
                          onChange={(e) => updateConfig({ language: e.target.value })}
                          placeholder="en"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Charset</Label>
                        <Input
                          value={config.charset}
                          onChange={(e) => updateConfig({ charset: e.target.value })}
                          placeholder="UTF-8"
                        />
                      </div>
                      <div>
                        <Label>Theme Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={config.themeColor}
                            onChange={(e) => updateConfig({ themeColor: e.target.value })}
                            className="w-10 h-10 rounded cursor-pointer border"
                          />
                          <Input
                            value={config.themeColor}
                            onChange={(e) => updateConfig({ themeColor: e.target.value })}
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Viewport</Label>
                      <Input
                        value={config.viewport}
                        onChange={(e) => updateConfig({ viewport: e.target.value })}
                        placeholder="width=device-width, initial-scale=1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Generated Code */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Generated Meta Tags
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={reset}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={copyToClipboard}>
                      {copied ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-80">
                  {generateMetaTags()}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview & SEO Score */}
          <div className="space-y-6">
            {/* SEO Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  SEO Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className={cn(
                    "text-4xl font-bold mb-1",
                    seoAnalysis.score >= 80 ? "text-green-500" :
                    seoAnalysis.score >= 50 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {seoAnalysis.score}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {seoAnalysis.score >= 80 ? "Excellent!" :
                     seoAnalysis.score >= 50 ? "Good, but can improve" : "Needs improvement"}
                  </p>
                </div>
                <div className="space-y-2">
                  {seoAnalysis.checks.map((check, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {check.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={check.passed ? "" : "text-muted-foreground"}>{check.label}</p>
                        <p className="text-xs text-muted-foreground">{check.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Google Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Google Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                    {config.title || "Page Title"}
                  </p>
                  <p className="text-green-700 text-sm truncate">
                    {config.canonicalUrl || "https://example.com/page"}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {config.description || "Page description will appear here. Make it compelling to increase click-through rates."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Social Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  {config.ogImage ? (
                    <img
                      src={config.ogImage}
                      alt="OG Preview"
                      className="w-full h-32 object-cover bg-muted"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">No image set</p>
                    </div>
                  )}
                  <div className="p-3 bg-muted/50">
                    <p className="text-xs text-muted-foreground uppercase mb-1">
                      {config.ogSiteName || "example.com"}
                    </p>
                    <p className="font-semibold text-sm truncate">
                      {config.ogTitle || config.title || "Page Title"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {config.ogDescription || config.description || "Page description"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
