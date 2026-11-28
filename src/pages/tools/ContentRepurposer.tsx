import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2, Copy, Check, Sparkles, Twitter, Linkedin, Mail, FileText,
  Loader2, RefreshCw, MessageSquare, Hash, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AI_TOOLS_URL, AI_MODEL, AI_REASONING_EFFORT } from "@/lib/aiProxy";

interface GeneratedContent {
  tweets: string[];
  linkedin: string;
  emailNewsletter: string;
  instagramCaption: string;
  summary: string;
}

export default function ContentRepurposer() {

  const [originalContent, setOriginalContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    const text = originalContent.trim();
    if (!text) {
      toast.error("Please enter some content to repurpose");
      return;
    }
    if (text.split(/\s+/).length < 30) {
      toast.error("Paste at least 30 words so there is enough to work with");
      return;
    }

    setIsGenerating(true);
    // Free for everyone since 28 Nov 2026. Before, it sat behind a "premium" wall
    // and even then only filled in templates ("[Key insight from your content]").
    const prompt = `Repurpose the content below into social posts. Use ONLY facts, numbers and claims that are in the content. Never invent statistics, quotes, names or results. Write in the same language as the content. Keep the writer's voice. No placeholders like [Your Name] or [Point 1].

Return ONLY a JSON object with these keys:
- "tweets": an array of 3 strings. The first is a short thread (3-5 numbered posts in one string, separated by blank lines). Each single post under 280 characters.
- "linkedin": one LinkedIn post (120-220 words), short paragraphs, 3 relevant hashtags at the end.
- "emailNewsletter": a short newsletter that starts with "Subject: ..." on the first line.
- "instagramCaption": a caption (60-120 words) with 5-8 relevant hashtags at the end.
- "summary": a 1-2 sentence TL;DR.

CONTENT:
"""
${text.slice(0, 12000)}
"""`;

    try {
      const response = await fetch(AI_TOOLS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODEL,
          reasoning_effort: AI_REASONING_EFFORT,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You turn long content into social posts. Reply with one valid JSON object only." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error("Too many requests. Wait a minute and try again.");
        throw new Error(`The AI is not answering right now (${response.status}). Try again in a minute.`);
      }
      const data = await response.json();
      let raw: string = data?.choices?.[0]?.message?.content ?? "";
      raw = raw.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(raw);
      const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
      const tweets = Array.isArray(parsed.tweets) ? parsed.tweets.map(str).filter(Boolean).slice(0, 3) : [];
      const out: GeneratedContent = {
        tweets,
        linkedin: str(parsed.linkedin),
        emailNewsletter: str(parsed.emailNewsletter),
        instagramCaption: str(parsed.instagramCaption),
        summary: str(parsed.summary),
      };
      if (!out.tweets.length && !out.linkedin && !out.instagramCaption) {
        throw new Error("The AI gave an empty answer. Please try again.");
      }
      setGeneratedContent(out);
      toast.success("Content generated!");
    } catch (err) {
      const msg = err instanceof Error && !(err instanceof SyntaxError)
        ? err.message
        : "The AI answer came back broken. Please try again.";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CopyButton = ({ content, id }: { content: string; id: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(content, id)}
      className="h-8"
    >
      {copiedId === id ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );

  return (
    <Layout>
      <SEOHead
        title="Content Repurposer - Turn One Post Into Many"
        description="Turn one blog post into Twitter threads, LinkedIn posts, email newsletters, and Instagram captions with AI. Save hours of content creation."
        canonical="/tools/content-repurposer"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Sparkles className="w-3 h-3 mr-1" />
            Free AI Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Content <span className="text-primary">Repurposer</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Turn one blog post into Twitter threads, LinkedIn posts, email newsletters, and more with AI.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Original Content
                </CardTitle>
                <CardDescription>
                  Paste your blog post, article, or any long-form content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={originalContent}
                  onChange={(e) => setOriginalContent(e.target.value)}
                  placeholder="Paste your blog post, article, or long-form content here...

For example:

'Today I want to share 5 productivity tips that changed my life. First, I learned to prioritize my most important tasks in the morning when my energy is highest. Second, I started time-blocking my calendar to protect focused work time...'"
                  className="min-h-[300px] resize-none"
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {originalContent.length} characters • {originalContent.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !originalContent.trim()}
                    className="min-w-[150px]"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Repurpose
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tips for Best Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    Include your main points and key takeaways
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    The more context you provide, the better the output
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    Works best with 200-2000 words of content
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    Edit the generated content to add your personal touch
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Output */}
          <div className="space-y-6">
            {!generatedContent ? (
              <Card className="h-[500px] flex items-center justify-center">
                <div className="text-center p-8">
                  <Share2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">Generated Content Will Appear Here</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste your content on the left and click "Repurpose" to generate multiple formats
                  </p>
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Generated Content
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleGenerate}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="twitter" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="twitter" className="flex items-center gap-1">
                        <Twitter className="w-4 h-4" />
                        <span className="hidden sm:inline">Twitter</span>
                      </TabsTrigger>
                      <TabsTrigger value="linkedin" className="flex items-center gap-1">
                        <Linkedin className="w-4 h-4" />
                        <span className="hidden sm:inline">LinkedIn</span>
                      </TabsTrigger>
                      <TabsTrigger value="email" className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span className="hidden sm:inline">Email</span>
                      </TabsTrigger>
                      <TabsTrigger value="instagram" className="flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        <span className="hidden sm:inline">Instagram</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="twitter" className="mt-4 space-y-4">
                      {generatedContent.tweets.map((tweet, i) => (
                        <div key={i} className="p-4 rounded-lg bg-muted/50 border">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm whitespace-pre-line flex-1">{tweet}</p>
                            <CopyButton content={tweet} id={`tweet-${i}`} />
                          </div>
                          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                            <span>{tweet.length}/280 characters</span>
                            <span className={tweet.length > 280 ? "text-red-500 font-medium" : ""}>
                              {tweet.length > 280 ? "Too long!" : "Good length"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="linkedin" className="mt-4">
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm whitespace-pre-line flex-1">{generatedContent.linkedin}</p>
                          <CopyButton content={generatedContent.linkedin} id="linkedin" />
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          {generatedContent.linkedin.length} characters
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="email" className="mt-4">
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm whitespace-pre-line flex-1 font-mono">
                            {generatedContent.emailNewsletter}
                          </p>
                          <CopyButton content={generatedContent.emailNewsletter} id="email" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="instagram" className="mt-4">
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm whitespace-pre-line flex-1">{generatedContent.instagramCaption}</p>
                          <CopyButton content={generatedContent.instagramCaption} id="instagram" />
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          {generatedContent.instagramCaption.length}/2200 characters
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Summary */}
                  <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">TL;DR Summary</span>
                      <CopyButton content={generatedContent.summary} id="summary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{generatedContent.summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
