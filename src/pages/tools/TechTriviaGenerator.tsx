import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Sparkles,
  Trophy,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Timer,
  Zap,
  Target,
  Award,
  TrendingUp,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

interface GameStats {
  totalQuestions: number;
  correctAnswers: number;
  streak: number;
  bestStreak: number;
  lastPlayed: string;
}

const categories = [
  "Programming",
  "Tech History",
  "Hardware",
  "Internet",
  "AI & ML",
  "Cybersecurity",
  "Mobile Tech",
  "Gaming",
  "Science",
  "General Knowledge",
];

const GROQ_API_KEY = "GROQ_KEY_REMOVED";

export default function TechTriviaGenerator() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Programming");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    streak: 0,
    bestStreak: 0,
    lastPlayed: "",
  });

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("techtrendi-trivia-stats");
    if (saved) {
      setStats(JSON.parse(saved));
    }
  }, []);

  // Save stats to localStorage
  const saveStats = (newStats: GameStats) => {
    localStorage.setItem("techtrendi-trivia-stats", JSON.stringify(newStats));
    setStats(newStats);
  };

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleTimeout();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleTimeout = () => {
    setTimerActive(false);
    setShowResult(true);
    // Update stats for wrong answer (timeout)
    const newStats = {
      ...stats,
      totalQuestions: stats.totalQuestions + 1,
      streak: 0,
      lastPlayed: new Date().toISOString(),
    };
    saveStats(newStats);
  };

  const generateQuestion = async () => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(difficulty === "easy" ? 45 : difficulty === "medium" ? 30 : 20);
    setTimerActive(false);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a trivia question generator specializing in ${selectedCategory}. Generate engaging, educational trivia questions.

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, just pure JSON.

The JSON structure must be:
{
  "question": "The trivia question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Brief explanation of why this is correct",
  "category": "${selectedCategory}"
}

Rules:
- Difficulty level: ${difficulty}
- Make questions interesting and educational
- correctAnswer is the index (0-3) of the correct option
- Ensure all 4 options are plausible
- Keep explanation concise but informative`,
            },
            {
              role: "user",
              content: `Generate a ${difficulty} difficulty trivia question about ${selectedCategory}. Return ONLY the JSON object, nothing else.`,
            },
          ],
          temperature: 0.9,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse the JSON response
      let parsed: TriviaQuestion;
      try {
        // Try to extract JSON if wrapped in code blocks
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(content);
        }
        parsed.difficulty = difficulty;
        setQuestion(parsed);
        setTimerActive(true);
      } catch {
        console.error("Failed to parse trivia question");
        // Fallback question
        setQuestion({
          question: "What programming language was created by Guido van Rossum?",
          options: ["Java", "Python", "Ruby", "JavaScript"],
          correctAnswer: 1,
          explanation: "Python was created by Guido van Rossum and first released in 1991.",
          difficulty: difficulty,
          category: selectedCategory,
        });
        setTimerActive(true);
      }
    } catch (error) {
      console.error("Error generating trivia:", error);
      // Fallback question
      setQuestion({
        question: "Which company developed the first commercially successful personal computer?",
        options: ["Microsoft", "Apple", "IBM", "HP"],
        correctAnswer: 2,
        explanation: "IBM released the IBM PC in 1981, which became the standard for personal computers.",
        difficulty: difficulty,
        category: selectedCategory,
      });
      setTimerActive(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;

    setSelectedAnswer(index);
    setShowResult(true);
    setTimerActive(false);

    const isCorrect = index === question?.correctAnswer;

    const newStats = {
      ...stats,
      totalQuestions: stats.totalQuestions + 1,
      correctAnswers: stats.correctAnswers + (isCorrect ? 1 : 0),
      streak: isCorrect ? stats.streak + 1 : 0,
      bestStreak: isCorrect ? Math.max(stats.bestStreak, stats.streak + 1) : stats.bestStreak,
      lastPlayed: new Date().toISOString(),
    };
    saveStats(newStats);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      default:
        return "";
    }
  };

  const getTimerColor = () => {
    if (timeLeft > 20) return "text-green-500";
    if (timeLeft > 10) return "text-yellow-500";
    return "text-red-500";
  };

  const accuracy = stats.totalQuestions > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
    : 0;

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tech Trivia Generator</h1>
          <p className="text-muted-foreground">
            Test your knowledge with AI-generated trivia questions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-foreground">{stats.totalQuestions}</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-foreground">{accuracy}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-4 text-center">
              <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold text-foreground">{stats.streak}</div>
              <div className="text-xs text-muted-foreground">Current Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-foreground">{stats.bestStreak}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Game Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="text-xs"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Difficulty</label>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as const).map((diff) => (
                  <Button
                    key={diff}
                    variant={difficulty === diff ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficulty(diff)}
                    className={cn(
                      "capitalize",
                      difficulty === diff && getDifficultyColor(diff)
                    )}
                  >
                    {diff}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={generateQuestion}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Question...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {question ? "Next Question" : "Start Trivia"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Question Card */}
        {question && (
          <Card className="border-2 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                    {question.difficulty}
                  </Badge>
                  <Badge variant="outline">{question.category}</Badge>
                </div>
                {timerActive && (
                  <div className={cn("flex items-center gap-1 font-mono text-lg font-bold", getTimerColor())}>
                    <Timer className="w-5 h-5" />
                    {timeLeft}s
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">{question.question}</h3>

              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const isCorrect = index === question.correctAnswer;
                  const isSelected = index === selectedAnswer;

                  let optionClass = "border-border hover:border-primary hover:bg-primary/5";
                  if (showResult) {
                    if (isCorrect) {
                      optionClass = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                    } else if (isSelected && !isCorrect) {
                      optionClass = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
                        "flex items-center gap-3",
                        optionClass,
                        !showResult && "cursor-pointer"
                      )}
                    >
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showResult && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Result & Explanation */}
              {showResult && (
                <div className={cn(
                  "mt-6 p-4 rounded-lg border",
                  selectedAnswer === question.correctAnswer
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedAnswer === question.correctAnswer ? (
                      <>
                        <Award className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-green-600 dark:text-green-400">Correct!</span>
                        {stats.streak > 1 && (
                          <Badge className="bg-orange-500 ml-2">
                            <Flame className="w-3 h-3 mr-1" />
                            {stats.streak} streak!
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {selectedAnswer === null ? "Time's up!" : "Incorrect"}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card className="mt-8 bg-gradient-to-br from-slate-500/5 to-slate-600/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Tips for High Scores
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Build streaks by answering correctly in a row for bonus points</li>
              <li>• Harder difficulties have shorter time limits but better bragging rights</li>
              <li>• Explore different categories to become a well-rounded tech expert</li>
              <li>• Read the explanations to learn from each question</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
