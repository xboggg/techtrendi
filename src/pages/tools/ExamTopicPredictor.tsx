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
  Target,
  Copy,
  Check,
  Loader2,
  Lightbulb,
  BookOpen,
  TrendingUp,
  Clock,
  Brain,
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const examLevels = [
  "WASSCE",
  "University",
  "Professional (ICAG/ACCA)",
  "GRE",
  "Secondary",
  "Primary",
];

interface PredictedTopic {
  topic: string;
  probability: "high" | "medium" | "low";
  description: string;
  subtopics: string[];
  reasoning: string;
}

interface StudyStep {
  step: number;
  title: string;
  description: string;
  duration: string;
}

interface PredictionResult {
  predictedTopics: PredictedTopic[];
  studyPlan: StudyStep[];
}

export default function ExamTopicPredictor() {
  const [subject, setSubject] = useState("");
  const [examLevel, setExamLevel] = useState("University");
  const [timeUntilExam, setTimeUntilExam] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [weakAreas, setWeakAreas] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const probabilityColors: Record<string, string> = {
    high: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const probabilityLabels: Record<string, string> = {
    high: "High Probability",
    medium: "Medium Probability",
    low: "Low Probability",
  };

  const generatePredictions = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject name");
      return;
    }
    if (!syllabus.trim()) {
      toast.error("Please enter syllabus topics");
      return;
    }

    setGenerating(true);
    setResult(null);

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
                "You are an expert exam preparation coach with deep knowledge of exam patterns, syllabus weighting, and topic frequency. Return JSON only, no markdown fences.",
            },
            {
              role: "user",
              content: `Predict the most likely exam topics and create a study plan:

- Subject: ${subject}
- Exam Level: ${examLevel}
- Time Until Exam: ${timeUntilExam || "Not specified"}
- Study Hours Available: ${studyHours || "Not specified"}
- Syllabus/Topics: ${syllabus}
- Weak Areas: ${weakAreas || "None specified"}

Return ONLY valid JSON in this format:
{
  "predictedTopics": [
    {
      "topic": "topic name",
      "probability": "high",
      "description": "why this topic is likely to appear",
      "subtopics": ["subtopic1", "subtopic2", "subtopic3"],
      "reasoning": "based on exam patterns and syllabus weighting"
    }
  ],
  "studyPlan": [
    {
      "step": 1,
      "title": "step title",
      "description": "detailed description",
      "duration": "time allocation"
    }
  ]
}

Generate 8-10 predicted topics with probability levels (high/medium/low). Create a 5-step study plan. Base predictions on typical ${examLevel} exam patterns for ${subject}.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
      const parsed: PredictionResult = JSON.parse(cleaned);
      setResult(parsed);
    } catch {
      toast.error("Failed to generate predictions. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyResult = () => {
    if (!result) return;

    let text = `EXAM TOPIC PREDICTIONS - ${subject} (${examLevel})\n\n`;
    result.predictedTopics.forEach((t, i) => {
      text += `${i + 1}. ${t.topic} [${t.probability.toUpperCase()}]\n`;
      text += `   ${t.description}\n`;
      text += `   Subtopics: ${t.subtopics.join(", ")}\n`;
      text += `   Reasoning: ${t.reasoning}\n\n`;
    });
    text += `\nSTUDY PLAN\n`;
    result.studyPlan.forEach((s) => {
      text += `Step ${s.step}: ${s.title} (${s.duration})\n${s.description}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <SEOHead
        title="AI Exam Topic Predictor | TechTrendi"
        description="Predict likely exam topics with AI. Get probability-ranked predictions and a personalized study plan for WASSCE, University, ACCA, GRE, and more."
      />

      <div className="min-h-screen bg-gray-950">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Target className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-white">
                AI Exam Topic Predictor
              </h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Predict high-probability exam topics and get a personalized study
              plan. Powered by AI analysis of exam patterns and syllabus
              weighting.
            </p>
          </div>

          {/* Input Section */}
          <Card className="mb-6 bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-yellow-500">
                <BookOpen className="h-5 w-5" />
                Exam Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Subject Name</Label>
                  <Input
                    placeholder="e.g., Mathematics, Economics, Accounting"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Exam Level</Label>
                  <Select value={examLevel} onValueChange={setExamLevel}>
                    <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {examLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Time Until Exam</Label>
                  <Input
                    placeholder="e.g., 2 weeks, 1 month, 3 days"
                    value={timeUntilExam}
                    onChange={(e) => setTimeUntilExam(e.target.value)}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Study Hours Available</Label>
                  <Input
                    placeholder="e.g., 4 hours/day, 20 hours total"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Syllabus / Topics Covered</Label>
                <Textarea
                  placeholder="List all the topics in your syllabus, separated by commas or new lines..."
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-gray-300">Weak Areas (optional)</Label>
                <Input
                  placeholder="e.g., Integration, Financial statements, Organic chemistry"
                  value={weakAreas}
                  onChange={(e) => setWeakAreas(e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <Button
                onClick={generatePredictions}
                disabled={generating || !subject.trim() || !syllabus.trim()}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Exam Patterns...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Predict Exam Topics
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <>
              {/* Copy Button */}
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyResult}
                  className="border-gray-700 text-gray-300 hover:text-white"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copied" : "Copy All"}
                </Button>
              </div>

              {/* Predicted Topics */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
                  Predicted Topics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.predictedTopics.map((topic, i) => (
                    <Card
                      key={i}
                      className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white text-sm flex-1 mr-2">
                            {i + 1}. {topic.topic}
                          </h3>
                          <Badge
                            className={cn(
                              "shrink-0 text-xs border",
                              probabilityColors[topic.probability]
                            )}
                          >
                            {probabilityLabels[topic.probability]}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-xs mb-3">
                          {topic.description}
                        </p>
                        <div className="mb-3">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            Key Subtopics
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {topic.subtopics.map((st, j) => (
                              <Badge
                                key={j}
                                variant="secondary"
                                className="text-xs bg-gray-800 text-gray-300"
                              >
                                {st}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <span className="text-xs text-yellow-500 font-medium">
                            Why:
                          </span>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {topic.reasoning}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Study Plan */}
              <Card className="mb-6 bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-yellow-500">
                    <Clock className="h-5 w-5" />
                    Your 5-Step Study Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.studyPlan.map((step) => (
                    <div
                      key={step.step}
                      className="flex gap-4 items-start border-l-2 border-yellow-500/30 pl-4"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 font-bold text-sm shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white text-sm">
                            {step.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-xs text-yellow-500 border-yellow-500/30"
                          >
                            {step.duration}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* Tips Section */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Tips for Smarter Exam Prep
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold mt-0.5">1.</span>
                  <span>
                    <strong className="text-gray-200">
                      How exam prediction works.
                    </strong>{" "}
                    Examiners follow patterns -- certain topics appear more
                    frequently because they cover core competencies. This tool
                    analyzes syllabus weighting and common exam structures to
                    estimate which topics are most likely to appear.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold mt-0.5">2.</span>
                  <span>
                    <strong className="text-gray-200">
                      The Pareto Principle (80/20 rule).
                    </strong>{" "}
                    About 80% of exam marks come from 20% of the syllabus.
                    Focus your energy on high-probability topics first, then
                    move to medium and low. This gives you the best score for
                    the time invested.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold mt-0.5">3.</span>
                  <span>
                    <strong className="text-gray-200">
                      Active recall beats passive reading.
                    </strong>{" "}
                    Instead of re-reading notes, close the book and try to
                    recall the information. Test yourself with practice
                    questions. Research shows active recall is 50% more
                    effective than highlighting or re-reading.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold mt-0.5">4.</span>
                  <span>
                    <strong className="text-gray-200">
                      Don't ignore weak areas.
                    </strong>{" "}
                    Enter your weak topics above to get targeted advice.
                    Strengthening a weak area from 30% to 70% gains more marks
                    than pushing a strong area from 80% to 90%.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold mt-0.5">5.</span>
                  <span>
                    <strong className="text-gray-200">
                      Spaced repetition is key.
                    </strong>{" "}
                    Review high-probability topics at increasing intervals (1
                    day, 3 days, 7 days). This leverages how memory works --
                    each review strengthens the neural pathway, making recall
                    faster and more reliable on exam day.
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
