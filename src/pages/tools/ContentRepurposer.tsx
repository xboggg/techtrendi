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
  Crown, Loader2, RefreshCw, MessageSquare, Hash, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface GeneratedContent {
  tweets: string[];
  linkedin: string;
  emailNewsletter: string;
  instagramCaption: string;
  summary: string;
}

export default function ContentRepurposer() {
  const { user, subscription } = useAuth();
  const isPremium = subscription?.subscribed;

  const [originalContent, setOriginalContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!originalContent.trim()) {
      toast.error("Please enter some content to repurpose");
      return;
    }

    if (!isPremium) {
      toast.error("Premium required to use AI content generation");
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation (in real app, this would call an API)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate mock content based on input
    const words = originalContent.split(" ").slice(0, 10).join(" ");
    const shortContent = originalContent.substring(0, 200);

    setGeneratedContent({
      tweets: [
        `🧵 Thread: ${words}...\n\nHere's what I learned:\n\n1/ [Key insight from your content]\n2/ [Another important point]\n3/ [Actionable takeaway]\n\nSave this for later! ⬇️`,
        `Did you know? ${shortContent.substring(0, 100)}...\n\nRetweet to share! 🔄`,
        `Hot take: ${words}...\n\nAgree or disagree? Let me know in the replies 👇`,
      ],
      linkedin: `I've been thinking about ${words}...\n\n${shortContent}\n\nHere are my key takeaways:\n\n✅ Point 1\n✅ Point 2\n✅ Point 3\n\nWhat's your experience with this? Share in the comments!\n\n#Professional #Insights #Growth`,
      emailNewsletter: `Subject: ${words}...\n\nHey there,\n\nI wanted to share something important with you today.\n\n${shortContent}\n\nHere's why this matters:\n\n1. First reason\n2. Second reason\n3. Third reason\n\nTake action today by [specific call to action].\n\nBest,\n[Your Name]`,
      instagramCaption: `${words}... ✨\n\n${shortContent.substring(0, 150)}...\n\nDouble tap if you agree! ❤️\n\n.\n.\n.\n#ContentCreator #Tips #Motivation #Success #Growth`,
      summary: `TL;DR: ${shortContent.substring(0, 150)}...`,
    });

    setIsGenerating(false);
    toast.success("Content generated!");
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
        title="Content Repurposer - Turn One Post Into Many | TechTrendi"
        description="Turn one blog post into Twitter threads, LinkedIn posts, email newsletters, and Instagram captions with AI. Save hours of content creation."
        canonicalUrl="https://techtrendi.com/tools/content-repurposer"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Crown className="w-3 h-3 mr-1" />
            Premium Tool
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
                    disabled={isGenerating || !originalContent.trim() || !isPremium}
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

        {!isPremium && (
          <Card className="mt-8 border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Upgrade to Premium</h3>
              <p className="text-muted-foreground mb-4">
                Unlock AI-powered content repurposing and save hours of work every week.
              </p>
              <Button asChild>
                <a href="/premium">
                  <Crown className="w-4 h-4 mr-2" />
                  Get Premium - $4.99/month
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
