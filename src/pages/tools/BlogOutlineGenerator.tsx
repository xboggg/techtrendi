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
  FileText, Sparkles, Copy, Check, RefreshCw, Wand2, List,
  Target, BookOpen, ChevronDown, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const blogTypes = [
  { id: "how-to", label: "How-To Guide", structure: ["Introduction", "Prerequisites", "Step-by-Step", "Tips", "Conclusion"] },
  { id: "listicle", label: "Listicle", structure: ["Introduction", "Items", "Bonus Tip", "Conclusion"] },
  { id: "comparison", label: "Comparison", structure: ["Introduction", "Overview", "Feature Comparison", "Pros/Cons", "Verdict"] },
  { id: "ultimate-guide", label: "Ultimate Guide", structure: ["Introduction", "Chapters", "FAQ", "Resources", "Conclusion"] },
  { id: "case-study", label: "Case Study", structure: ["Background", "Challenge", "Solution", "Results", "Key Takeaways"] },
  { id: "opinion", label: "Opinion/Thought Leadership", structure: ["Hook", "Context", "Main Argument", "Counter-Arguments", "Call to Action"] },
];

const audienceLevels = [
  { id: "beginner", label: "Beginner", description: "New to the topic" },
  { id: "intermediate", label: "Intermediate", description: "Some experience" },
  { id: "advanced", label: "Advanced", description: "Expert level" },
];

interface OutlineSection {
  heading: string;
  subpoints: string[];
  expanded: boolean;
}

export default function BlogOutlineGenerator() {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [blogType, setBlogType] = useState("how-to");
  const [audienceLevel, setAudienceLevel] = useState("intermediate");
  const [wordCount, setWordCount] = useState("1500");
  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateOutline = () => {
    if (!topic.trim()) {
      toast.error("Please enter a blog topic");
      return;
    }

    setGenerating(true);

    setTimeout(() => {
      const selectedType = blogTypes.find((t) => t.id === blogType);
      const keywordList = keywords.split(",").map((k) => k.trim()).filter((k) => k);

      let sections: OutlineSection[] = [];

      if (blogType === "how-to") {
        sections = [
          {
            heading: `Introduction: Why ${topic} Matters`,
            subpoints: [
              "Hook with a relatable problem or statistic",
              `Brief overview of what readers will learn`,
              `Who this guide is for (${audienceLevel} level)`,
            ],
            expanded: true,
          },
          {
            heading: "Prerequisites / What You'll Need",
            subpoints: [
              "List required tools or knowledge",
              "Time commitment",
              "Estimated difficulty level",
            ],
            expanded: true,
          },
          {
            heading: `Step 1: Getting Started with ${topic}`,
            subpoints: [
              "First action item",
              "Common mistakes to avoid",
              "Pro tip for this step",
            ],
            expanded: true,
          },
          {
            heading: "Step 2: [Core Process Step]",
            subpoints: [
              "Detailed instructions",
              "Visual examples or screenshots",
              "Troubleshooting common issues",
            ],
            expanded: true,
          },
          {
            heading: "Step 3: [Advanced Techniques]",
            subpoints: [
              "Building on basics",
              "Optimization tips",
              "Real-world examples",
            ],
            expanded: true,
          },
          {
            heading: "Pro Tips and Best Practices",
            subpoints: [
              "Expert insights",
              "Time-saving shortcuts",
              "Quality assurance checks",
            ],
            expanded: true,
          },
          {
            heading: "Conclusion & Next Steps",
            subpoints: [
              "Summary of key points",
              "Encourage action",
              "Related resources",
              "Call to action",
            ],
            expanded: true,
          },
        ];
      } else if (blogType === "listicle") {
        const itemCount = parseInt(wordCount) > 2000 ? 10 : 7;
        sections = [
          {
            heading: `Introduction: Why These ${itemCount} [Items] Matter`,
            subpoints: [
              "Hook with an interesting fact",
              "Preview what readers will discover",
            ],
            expanded: true,
          },
          ...Array.from({ length: itemCount }, (_, i) => ({
            heading: `#${i + 1}: [Item Name]`,
            subpoints: [
              "What it is",
              "Why it matters",
              "How to apply it",
              keywordList[0] ? `Connection to ${keywordList[0]}` : "Example or case study",
            ],
            expanded: true,
          })),
          {
            heading: "Bonus Tip",
            subpoints: ["Extra value for readers who made it this far"],
            expanded: true,
          },
          {
            heading: "Conclusion",
            subpoints: ["Summary", "Call to action", "Invite comments"],
            expanded: true,
          },
        ];
      } else if (blogType === "comparison") {
        sections = [
          {
            heading: "Introduction: The Comparison",
            subpoints: [
              "Why this comparison matters",
              "What we'll cover",
              "How we evaluated",
            ],
            expanded: true,
          },
          {
            heading: "Option A: Overview",
            subpoints: ["Background", "Key features", "Ideal user"],
            expanded: true,
          },
          {
            heading: "Option B: Overview",
            subpoints: ["Background", "Key features", "Ideal user"],
            expanded: true,
          },
          {
            heading: "Feature-by-Feature Comparison",
            subpoints: [
              "Feature 1: [Key Feature]",
              "Feature 2: [Key Feature]",
              "Feature 3: [Key Feature]",
              "Pricing comparison",
            ],
            expanded: true,
          },
          {
            heading: "Pros and Cons Summary",
            subpoints: [
              "Option A: Pros",
              "Option A: Cons",
              "Option B: Pros",
              "Option B: Cons",
            ],
            expanded: true,
          },
          {
            heading: "Verdict: Which Should You Choose?",
            subpoints: [
              "Best for [use case 1]",
              "Best for [use case 2]",
              "Final recommendation",
            ],
            expanded: true,
          },
        ];
      } else if (blogType === "ultimate-guide") {
        sections = [
          {
            heading: `Introduction to ${topic}`,
            subpoints: [
              "What is it?",
              "Why it matters in 2024",
              "What this guide covers",
            ],
            expanded: true,
          },
          {
            heading: "Chapter 1: Fundamentals",
            subpoints: ["Core concepts", "Key terminology", "Historical context"],
            expanded: true,
          },
          {
            heading: "Chapter 2: Getting Started",
            subpoints: ["Prerequisites", "First steps", "Quick wins"],
            expanded: true,
          },
          {
            heading: "Chapter 3: Intermediate Strategies",
            subpoints: ["Building on basics", "Common challenges", "Solutions"],
            expanded: true,
          },
          {
            heading: "Chapter 4: Advanced Techniques",
            subpoints: ["Expert methods", "Optimization", "Scaling"],
            expanded: true,
          },
          {
            heading: "FAQ Section",
            subpoints: [
              "Question 1: [Common question]",
              "Question 2: [Common question]",
              "Question 3: [Common question]",
            ],
            expanded: true,
          },
          {
            heading: "Resources & Tools",
            subpoints: ["Recommended tools", "Further reading", "Templates"],
            expanded: true,
          },
          {
            heading: "Conclusion",
            subpoints: ["Key takeaways", "Action items", "Call to action"],
            expanded: true,
          },
        ];
      } else if (blogType === "case-study") {
        sections = [
          {
            heading: "Executive Summary",
            subpoints: ["The client/company", "The challenge", "Key results"],
            expanded: true,
          },
          {
            heading: "Background & Context",
            subpoints: ["Industry overview", "Company profile", "Initial situation"],
            expanded: true,
          },
          {
            heading: "The Challenge",
            subpoints: ["Problem definition", "Constraints", "Goals"],
            expanded: true,
          },
          {
            heading: "The Solution",
            subpoints: ["Approach", "Implementation", "Timeline"],
            expanded: true,
          },
          {
            heading: "Results & Outcomes",
            subpoints: ["Quantitative results", "Qualitative improvements", "ROI"],
            expanded: true,
          },
          {
            heading: "Key Takeaways",
            subpoints: ["Lessons learned", "Replicable strategies", "What's next"],
            expanded: true,
          },
        ];
      } else {
        sections = [
          {
            heading: "Opening Hook",
            subpoints: ["Controversial statement or question", "Personal story"],
            expanded: true,
          },
          {
            heading: "Context & Background",
            subpoints: ["Current state of the industry", "Why now?"],
            expanded: true,
          },
          {
            heading: "Main Argument",
            subpoints: ["Thesis statement", "Supporting evidence", "Examples"],
            expanded: true,
          },
          {
            heading: "Addressing Counter-Arguments",
            subpoints: ["Common objections", "Your response"],
            expanded: true,
          },
          {
            heading: "Call to Action",
            subpoints: ["What readers should do", "Join the conversation"],
            expanded: true,
          },
        ];
      }

      setOutline(sections);
      setGenerating(false);
      toast.success("Outline generated!");
    }, 1000);
  };

  const toggleSection = (index: number) => {
    setOutline((prev) =>
      prev.map((section, i) =>
        i === index ? { ...section, expanded: !section.expanded } : section
      )
    );
  };

  const copyOutline = () => {
    const text = outline
      .map(
        (section, i) =>
          `${i + 1}. ${section.heading}\n${section.subpoints.map((p) => `   - ${p}`).join("\n")}`
      )
      .join("\n\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Outline copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="Blog Outline Generator - Structure Your Posts | TechTrendi"
        description="Generate structured blog outlines for any topic. Choose from different formats and get a complete structure in seconds."
        canonicalUrl="https://techtrendi.com/tools/blog-outline-generator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Blog Outline <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create structured blog outlines that make writing easier
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Blog Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Blog Topic *</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., How to Start a Podcast in 2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Keywords (comma-separated)</Label>
                  <Input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., start podcast, podcast tips, podcast equipment"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Blog Type</Label>
                  <Select value={blogType} onValueChange={setBlogType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blogTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={audienceLevel} onValueChange={setAudienceLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audienceLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.label} - {level.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Word Count</Label>
                  <Select value={wordCount} onValueChange={setWordCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="800">Short (~800 words)</SelectItem>
                      <SelectItem value="1500">Medium (~1500 words)</SelectItem>
                      <SelectItem value="2500">Long (~2500 words)</SelectItem>
                      <SelectItem value="4000">Comprehensive (~4000 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button onClick={generateOutline} size="lg" className="w-full" disabled={generating}>
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Outline
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            <Card className="min-h-[500px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Your Outline
                  </CardTitle>
                  {outline.length > 0 && (
                    <Button variant="outline" size="sm" onClick={copyOutline}>
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {outline.length > 0 ? (
                  <div className="space-y-3">
                    {outline.map((section, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSection(index)}
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <span className="font-medium text-sm">
                            {index + 1}. {section.heading}
                          </span>
                          {section.expanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {section.expanded && (
                          <div className="px-3 pb-3 pt-0">
                            <ul className="space-y-1 pl-4">
                              {section.subpoints.map((point, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-muted-foreground flex items-start gap-2"
                                >
                                  <span className="text-primary">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                    <p>Your outline will appear here</p>
                    <p className="text-sm">Enter your topic and generate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
