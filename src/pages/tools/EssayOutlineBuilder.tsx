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
  FileText,
  Copy,
  Check,
  Loader2,
  BookOpen,
  Lightbulb,
  GraduationCap,
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const essayTypes = [
  "Argumentative",
  "Analytical",
  "Descriptive",
  "Expository",
  "Persuasive",
  "Compare & Contrast",
  "Cause & Effect",
];

const wordCounts = ["500", "1000", "1500", "2500", "5000"];

const academicLevels = [
  "High School",
  "University",
  "Postgraduate",
  "Professional",
];

interface EssayOutline {
  title: string;
  thesis: string;
  introduction: string[];
  bodySections: {
    heading: string;
    subPoints: string[];
    wordAllocation: number;
  }[];
  conclusion: string[];
  suggestedSources: string[];
}

export default function EssayOutlineBuilder() {
  const [topic, setTopic] = useState("");
  const [essayType, setEssayType] = useState("Argumentative");
  const [wordCount, setWordCount] = useState("1000");
  const [academicLevel, setAcademicLevel] = useState("University");
  const [keyPoints, setKeyPoints] = useState("");
  const [outline, setOutline] = useState<EssayOutline | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateOutline = async () => {
    if (!topic.trim()) {
      toast.error("Please enter an essay topic");
      return;
    }

    setGenerating(true);
    setOutline(null);

    try {
      const response = await fetch(GROQ_API_URL, {
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
                "You are an expert academic writing advisor. Generate detailed essay outlines in JSON format only. No markdown fences, no extra text.",
            },
            {
              role: "user",
              content: `Generate a detailed essay outline for the following:
- Topic: ${topic}
- Essay Type: ${essayType}
- Target Word Count: ${wordCount} words
- Academic Level: ${academicLevel}
${keyPoints ? `- Key Points to Include: ${keyPoints}` : ""}

Return ONLY valid JSON in this exact format:
{
  "title": "suggested essay title",
  "thesis": "a clear thesis statement",
  "introduction": ["point 1", "point 2", "point 3"],
  "bodySections": [
    {
      "heading": "section heading",
      "subPoints": ["sub-point 1", "sub-point 2", "sub-point 3"],
      "wordAllocation": 200
    }
  ],
  "conclusion": ["point 1", "point 2", "point 3"],
  "suggestedSources": ["source 1", "source 2", "source 3"]
}

Create 3-5 body sections depending on word count. Word allocations should sum to approximately ${wordCount}. Make the outline appropriate for ${academicLevel} level.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate outline");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
      const parsed: EssayOutline = JSON.parse(cleaned);
      setOutline(parsed);
    } catch {
      toast.error("Failed to generate outline. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyOutline = () => {
    if (!outline) return;

    let text = `Title: ${outline.title}\n\n`;
    text += `Thesis: ${outline.thesis}\n\n`;
    text += `INTRODUCTION:\n${outline.introduction.map((p) => `  - ${p}`).join("\n")}\n\n`;
    outline.bodySections.forEach((s, i) => {
      text += `SECTION ${i + 1}: ${s.heading} (~${s.wordAllocation} words)\n`;
      text += s.subPoints.map((p) => `  - ${p}`).join("\n") + "\n\n";
    });
    text += `CONCLUSION:\n${outline.conclusion.map((p) => `  - ${p}`).join("\n")}\n\n`;
    text += `SUGGESTED SOURCES:\n${outline.suggestedSources.map((s) => `  - ${s}`).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Outline copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="AI Essay Outline Builder | TechTrendi"
        description="Generate structured essay outlines with AI. Get thesis statements, body sections, word allocations, and source suggestions instantly."
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <GraduationCap className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Essay Outline Builder
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Generate a structured, detailed essay outline with thesis statement,
            body sections, word allocations, and suggested sources.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-emerald-600" />
              Essay Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="topic">Essay Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., The impact of artificial intelligence on modern education"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Essay Type</Label>
                <Select value={essayType} onValueChange={setEssayType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {essayTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Word Count Target</Label>
                <Select value={wordCount} onValueChange={setWordCount}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {wordCounts.map((wc) => (
                      <SelectItem key={wc} value={wc}>
                        {parseInt(wc).toLocaleString()} words
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Academic Level</Label>
                <Select value={academicLevel} onValueChange={setAcademicLevel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academicLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="keyPoints">Key Points (optional)</Label>
              <Textarea
                id="keyPoints"
                placeholder="Any specific arguments, sources, or points you want included..."
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <Button
              onClick={generateOutline}
              disabled={generating || !topic.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Outline...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Generate Essay Outline
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        {outline && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-emerald-700 dark:text-emerald-400">
                Essay Outline
              </CardTitle>
              <Button variant="outline" size="sm" onClick={copyOutline}>
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Suggested Title
                </h3>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {outline.title}
                </p>
              </div>

              {/* Thesis */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">
                  Thesis Statement
                </h3>
                <p className="text-gray-800 dark:text-gray-200 italic">
                  {outline.thesis}
                </p>
              </div>

              {/* Introduction */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Introduction
                </h3>
                <ul className="space-y-1">
                  {outline.introduction.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-emerald-500 mt-1">&#8226;</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Body Sections */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Body Sections
                </h3>
                {outline.bodySections.map((section, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {i + 1}. {section.heading}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      >
                        ~{section.wordAllocation} words
                      </Badge>
                    </div>
                    <ul className="space-y-1">
                      {section.subPoints.map((point, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm"
                        >
                          <span className="text-emerald-400 mt-0.5">&#8226;</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Conclusion */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Conclusion
                </h3>
                <ul className="space-y-1">
                  {outline.conclusion.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-emerald-500 mt-1">&#8226;</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Sources */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Suggested Sources
                </h3>
                <ul className="space-y-1">
                  {outline.suggestedSources.map((source, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm"
                    >
                      <span className="text-emerald-400 mt-0.5">{i + 1}.</span>
                      {source}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Tips for Writing Great Essays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">1.</span>
                <span>
                  <strong>Start with an outline.</strong> A clear outline saves
                  hours of rewriting. It acts as a roadmap so you always know
                  what to write next, reducing writer's block.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">2.</span>
                <span>
                  <strong>Your thesis statement is king.</strong> Every great
                  essay has a single, clear thesis -- a sentence that states your
                  main argument. Everything in the essay should support this one
                  idea.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">3.</span>
                <span>
                  <strong>Structure matters more than vocabulary.</strong> A
                  well-organized essay with simple language scores higher than a
                  fancy but messy one. Introduction, body paragraphs, and
                  conclusion -- keep it clear.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">4.</span>
                <span>
                  <strong>Each paragraph = one idea.</strong> Start each body
                  paragraph with a topic sentence, provide evidence, then
                  explain how it supports your thesis. This is called the
                  P.E.E.L. method (Point, Evidence, Explain, Link).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">5.</span>
                <span>
                  <strong>Word count targets keep you focused.</strong>{" "}
                  Allocating words to each section prevents you from spending
                  too long on one area and running out of space for others.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
