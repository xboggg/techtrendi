import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Brain,
  Copy,
  Check,
  Loader2,
  Lightbulb,
  MessageCircle,
  Send,
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const levels = [
  { id: "kid", label: "Kid (10yr old)", emoji: "🧒" },
  { id: "highschool", label: "High Schooler", emoji: "🎒" },
  { id: "university", label: "University", emoji: "🎓" },
  { id: "professional", label: "Professional", emoji: "💼" },
];

const styles = [
  { id: "analogy", label: "With Analogy" },
  { id: "step-by-step", label: "Step by Step" },
  { id: "story", label: "As a Story" },
  { id: "comparison", label: "By Comparison" },
];

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function ConceptExplainer() {
  const [concept, setConcept] = useState("");
  const [level, setLevel] = useState("university");
  const [style, setStyle] = useState("analogy");
  const [explanation, setExplanation] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [askingFollowUp, setAskingFollowUp] = useState(false);

  const levelDescriptions: Record<string, string> = {
    kid: "a curious 10-year-old child with no technical background",
    highschool: "a high school student with basic knowledge",
    university: "a university student studying the subject",
    professional: "an industry professional wanting deeper understanding",
  };

  const styleInstructions: Record<string, string> = {
    analogy:
      "Use a vivid, relatable analogy to explain the concept. Connect it to everyday experiences.",
    "step-by-step":
      "Break the concept down into numbered, sequential steps that build on each other.",
    story:
      "Explain the concept as a narrative story with characters and a plot that illustrates how it works.",
    comparison:
      "Explain by comparing and contrasting with something the reader already knows well.",
  };

  const generateExplanation = async () => {
    if (!concept.trim()) {
      toast.error("Please enter a concept to explain");
      return;
    }

    setGenerating(true);
    setExplanation("");
    setFollowUpAnswer("");

    const systemMsg: Message = {
      role: "system",
      content: `You are an expert educator who excels at explaining complex concepts clearly. You adapt your language and depth to the audience. Always be accurate but prioritize clarity and understanding.`,
    };

    const userMsg: Message = {
      role: "user",
      content: `Explain the following concept:

Concept: ${concept}
Audience: ${levelDescriptions[level]}
Style: ${styleInstructions[style]}

Provide a clear, engaging explanation. Use formatting with paragraphs. Do NOT use markdown headers or bullet points -- just flowing, clear text with paragraph breaks. Keep it concise but thorough.`,
    };

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [systemMsg, userMsg],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || "";
      setExplanation(result);
      setConversationHistory([systemMsg, userMsg, { role: "assistant", content: result }]);
    } catch {
      toast.error("Failed to generate explanation. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const askFollowUp = async () => {
    if (!followUp.trim()) {
      toast.error("Please enter a follow-up question");
      return;
    }

    setAskingFollowUp(true);
    setFollowUpAnswer("");

    const newUserMsg: Message = { role: "user", content: followUp };
    const messages = [...conversationHistory, newUserMsg];

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || "";
      setFollowUpAnswer(result);
      setConversationHistory([
        ...messages,
        { role: "assistant", content: result },
      ]);
      setFollowUp("");
    } catch {
      toast.error("Failed to get answer. Please try again.");
    } finally {
      setAskingFollowUp(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="AI Concept Explainer | TechTrendi"
        description="Understand any concept instantly. AI explains topics at your level using analogies, stories, step-by-step breakdowns, and comparisons."
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Brain className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Concept Explainer
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Enter any concept and get a clear explanation tailored to your
            level. Ask follow-up questions to deepen your understanding.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-6 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-400">
              <Lightbulb className="h-5 w-5" />
              What do you want to understand?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="concept">Concept or Topic</Label>
              <Textarea
                id="concept"
                placeholder="e.g., Quantum entanglement, Blockchain consensus mechanisms, How neural networks learn..."
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="mt-1 border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                rows={3}
              />
            </div>

            {/* Level Selection */}
            <div>
              <Label className="mb-2 block">Explain it like I'm a...</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {levels.map((l) => (
                  <Button
                    key={l.id}
                    variant="outline"
                    onClick={() => setLevel(l.id)}
                    className={cn(
                      "h-auto py-3 flex flex-col gap-1",
                      level === l.id
                        ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-500"
                        : "hover:border-purple-300"
                    )}
                  >
                    <span className="text-lg">{l.emoji}</span>
                    <span className="text-xs">{l.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Style Selection */}
            <div>
              <Label className="mb-2 block">Explanation Style</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {styles.map((s) => (
                  <Button
                    key={s.id}
                    variant="outline"
                    onClick={() => setStyle(s.id)}
                    className={cn(
                      "text-sm",
                      style === s.id
                        ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-500"
                        : "hover:border-purple-300"
                    )}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={generateExplanation}
              disabled={generating || !concept.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Explaining...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Explain This Concept
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Explanation Result */}
        {explanation && (
          <Card className="mb-6 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-purple-700 dark:text-purple-400">
                Explanation
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyText(explanation)}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {explanation}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Follow-up Section */}
        {explanation && (
          <Card className="mb-6 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-400">
                <MessageCircle className="h-5 w-5" />
                Ask a Follow-Up Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Can you give me a real-world example?"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askFollowUp()}
                  className="border-purple-200 dark:border-purple-800"
                />
                <Button
                  onClick={askFollowUp}
                  disabled={askingFollowUp || !followUp.trim()}
                  className="bg-purple-600 hover:bg-purple-700 shrink-0"
                >
                  {askingFollowUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {followUpAnswer && (
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      Follow-Up Answer
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyText(followUpAnswer)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {followUpAnswer}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tips Section */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 font-bold mt-0.5">1.</span>
                <span>
                  <strong>The Feynman Technique.</strong> Nobel physicist Richard
                  Feynman believed that if you can't explain something simply,
                  you don't truly understand it. This tool helps you test and
                  build understanding by breaking concepts into plain language.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 font-bold mt-0.5">2.</span>
                <span>
                  <strong>Choose your level wisely.</strong> Start with "Kid" to
                  get the simplest version, then move up to "University" or
                  "Professional" to add depth. This layered approach builds
                  stronger understanding than diving straight into complexity.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 font-bold mt-0.5">3.</span>
                <span>
                  <strong>Analogies make knowledge stick.</strong> The "With
                  Analogy" style connects new concepts to things you already
                  know, which is how your brain naturally learns and retains
                  information.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 font-bold mt-0.5">4.</span>
                <span>
                  <strong>Follow-up questions deepen learning.</strong> Don't
                  just read the explanation passively. Ask "Why?", "How?", or
                  "What if?" -- active questioning is the most effective study
                  technique proven by research.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 font-bold mt-0.5">5.</span>
                <span>
                  <strong>Try different styles for the same topic.</strong>{" "}
                  Reading the same concept as a story AND step-by-step creates
                  multiple mental pathways, making it much easier to recall
                  during exams.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
