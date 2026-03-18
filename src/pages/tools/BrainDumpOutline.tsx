import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Brain, Copy, Check, Loader2, Sparkles, ListTree, Lightbulb,
} from "lucide-react";

const contentTypes = [
  { id: "blog", label: "Blog Post" },
  { id: "essay", label: "Essay" },
  { id: "presentation", label: "Presentation" },
  { id: "business-plan", label: "Business Plan" },
  { id: "report", label: "Report" },
];

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

export default function BrainDumpOutline() {
  const [thoughts, setThoughts] = useState("");
  const [contentType, setContentType] = useState("blog");
  const [outline, setOutline] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateOutline = async () => {
    if (!thoughts.trim()) {
      toast.error("Please enter your thoughts first");
      return;
    }

    setGenerating(true);
    setOutline("");

    const typeLabel = contentTypes.find((t) => t.id === contentType)?.label || contentType;

    const prompt = `You are a professional editor and content strategist. A user has done a brain dump — messy, unstructured thoughts — and needs you to turn them into a clean, structured outline for a ${typeLabel}.

Here are their raw thoughts:
"""
${thoughts.trim()}
"""

Create a well-organized outline with:
- A compelling title
- Clear sections with Roman numerals (I, II, III, etc.)
- Sub-points with letters (A, B, C)
- Sub-sub-points with numbers (1, 2, 3) where needed
- A logical flow from introduction to conclusion
- Key talking points under each section

Return ONLY the plain text outline. No markdown formatting, no bold/italic markers, no code fences. Just clean, indented text.`;

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
              content: "You are an expert at organizing messy thoughts into clear, structured outlines. Return plain text only — no markdown.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) throw new Error("Empty response from AI");

      setOutline(content);
      toast.success("Outline generated!");
    } catch (err: any) {
      console.error("Outline generation error:", err);
      toast.error(err.message || "Failed to generate outline. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyOutline = () => {
    navigator.clipboard.writeText(outline);
    setCopied(true);
    toast.success("Outline copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="AI Brain Dump to Outline | TechTrendi"
        description="Turn your messy thoughts into a clean, structured outline. AI-powered brain dump organizer for blog posts, essays, presentations, and more."
        canonical="/tools/brain-dump"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
            AI-Powered Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Brain Dump to <span className="text-primary">Outline</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Dump your messy thoughts and let AI turn them into a clean, structured outline ready for writing.
          </p>
        </div>

        {/* Content Type Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {contentTypes.map((type) => (
            <Button
              key={type.id}
              variant={contentType === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setContentType(type.id)}
              className={cn(
                "rounded-full",
                contentType === type.id && "shadow-md"
              )}
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* Side-by-side layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Your Brain Dump
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Dump your thoughts here — messy is fine!</Label>
                  <Textarea
                    value={thoughts}
                    onChange={(e) => setThoughts(e.target.value)}
                    placeholder="Just start typing everything on your mind about the topic... Don't worry about order, grammar, or structure. Mix ideas, questions, points you want to make, random notes — anything goes."
                    className="min-h-[300px] resize-y"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {thoughts.length} characters
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generateOutline}
              size="lg"
              className="w-full"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Structuring Your Thoughts...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Structure My Thoughts
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            {generating ? (
              <Card className="min-h-[400px] animate-pulse">
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-4/5" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ) : outline ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListTree className="w-4 h-4" />
                    Your Structured Outline
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyOutline}
                  >
                    {copied ? (
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
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-muted/50 rounded-lg p-4 overflow-x-auto">
                    {outline}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <Card className="min-h-[400px]">
                <CardContent className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <ListTree className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-medium">Your outline will appear here</p>
                  <p className="text-sm mt-1">Dump your thoughts and hit the button</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">1.</span>
                <span>
                  <strong>Brain dumping</strong> is the practice of writing down every thought about a topic without filtering or organizing. It clears mental clutter and captures ideas you might otherwise forget.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">2.</span>
                <span>
                  <strong>Outlines improve writing quality</strong> by giving you a roadmap before you start drafting. They help you spot gaps in logic, ensure a natural flow, and prevent writer's block.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">3.</span>
                <span>
                  Use <strong>Blog Post</strong> for web content, <strong>Essay</strong> for academic or opinion pieces, <strong>Presentation</strong> for slides and talks, <strong>Business Plan</strong> for proposals, and <strong>Report</strong> for data-driven documents.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">4.</span>
                <span>
                  The messier your brain dump, the better — don't self-edit while dumping. Include questions, half-formed ideas, and random associations. The AI will find the structure in the chaos.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
