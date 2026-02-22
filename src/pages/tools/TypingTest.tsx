import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Keyboard, RotateCcw, Play, Trophy, Clock, Target, Zap, Share2, Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const passages = [
  "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet at least once.",
  "Programming is not about typing, it is about thinking. The best programmers spend most of their time thinking, not coding.",
  "Success is not final, failure is not fatal. It is the courage to continue that counts. Keep moving forward always.",
  "Technology is best when it brings people together. It has the power to connect us across distances and time zones.",
  "The only way to do great work is to love what you do. If you have not found it yet, keep looking and do not settle.",
  "In the middle of difficulty lies opportunity. Every challenge you face is a chance to grow stronger and wiser.",
  "Innovation distinguishes between a leader and a follower. Never be afraid to try new things and push boundaries.",
  "The future belongs to those who believe in the beauty of their dreams. Dream big and work hard to achieve them.",
  "Quality is not an act, it is a habit. Excellence comes from consistently doing the right things the right way.",
  "Knowledge is power, but enthusiasm pulls the switch. Stay curious and passionate about learning new things.",
];

const durations = [
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 120, label: "2 minutes" },
  { value: 300, label: "5 minutes" },
];

export default function TypingTest() {
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [passage, setPassage] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(selectedDuration);
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);

  const getRandomPassage = useCallback(() => {
    // Get multiple passages to fill the time
    const shuffled = [...passages].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).join(" ");
  }, []);

  const resetTest = useCallback(() => {
    setPassage(getRandomPassage());
    setUserInput("");
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(selectedDuration);
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setCorrectChars(0);
    setIncorrectChars(0);
  }, [selectedDuration, getRandomPassage]);

  useEffect(() => {
    resetTest();
  }, [selectedDuration]);

  useEffect(() => {
    if (!isRunning || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsFinished(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isFinished]);

  useEffect(() => {
    if (!startTime || !isRunning) return;

    const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
    const words = correctChars / 5; // standard: 5 chars = 1 word
    const currentWpm = Math.round(words / elapsed) || 0;
    setWpm(currentWpm);

    const totalChars = correctChars + incorrectChars;
    const currentAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
    setAccuracy(currentAccuracy);
  }, [correctChars, incorrectChars, startTime, isRunning]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!isRunning && !isFinished && value.length > 0) {
      setIsRunning(true);
      setStartTime(Date.now());
    }

    if (isFinished) return;

    setUserInput(value);

    // Calculate correct/incorrect
    let correct = 0;
    let incorrect = 0;

    for (let i = 0; i < value.length; i++) {
      if (value[i] === passage[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }

    setCorrectChars(correct);
    setIncorrectChars(incorrect);

    // Check if completed the passage
    if (value.length >= passage.length) {
      setIsRunning(false);
      setIsFinished(true);
    }
  };

  const startTest = () => {
    resetTest();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const shareResult = () => {
    const text = `I just scored ${wpm} WPM with ${accuracy}% accuracy on TechTrendi Typing Test! Can you beat my score? https://techtrendi.com/tools/typing-test`;
    navigator.clipboard.writeText(text);
    toast.success("Result copied! Share it with friends.");
  };

  const getSpeedRating = () => {
    if (wpm >= 80) return { label: "Expert", color: "text-purple-500" };
    if (wpm >= 60) return { label: "Fast", color: "text-green-500" };
    if (wpm >= 40) return { label: "Average", color: "text-blue-500" };
    if (wpm >= 20) return { label: "Beginner", color: "text-yellow-500" };
    return { label: "Getting Started", color: "text-gray-500" };
  };

  const progress = ((selectedDuration - timeLeft) / selectedDuration) * 100;

  return (
    <Layout>
      <SEOHead
        title="Typing Speed Test - Test Your WPM | TechTrendi"
        description="Test your typing speed and accuracy. See your WPM (words per minute) and share your results. Free online typing test."
        canonicalUrl="https://techtrendi.com/tools/typing-test"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Typing <span className="text-primary">Speed Test</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Test how fast you can type. Challenge yourself and share your score!
          </p>
        </div>

        {/* Duration Selection */}
        {!isRunning && !isFinished && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-wrap justify-center gap-2">
                {durations.map((d) => (
                  <Button
                    key={d.value}
                    variant={selectedDuration === d.value ? "default" : "outline"}
                    onClick={() => setSelectedDuration(d.value)}
                  >
                    <Timer className="w-4 h-4 mr-2" />
                    {d.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-4xl font-bold">{wpm}</p>
              <p className="text-sm text-muted-foreground">WPM</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-4xl font-bold">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-4xl font-bold">{formatTime(timeLeft)}</p>
              <p className="text-sm text-muted-foreground">Time Left</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <Progress value={progress} className="mb-6 h-2" />
        )}

        {/* Typing Area */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            {isFinished ? (
              <div className="text-center py-8">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                <h2 className="text-3xl font-bold mb-2">Test Complete!</h2>
                <p className={cn("text-2xl font-semibold mb-4", getSpeedRating().color)}>
                  {getSpeedRating().label} Typist
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-primary">{wpm}</p>
                    <p className="text-sm text-muted-foreground">WPM</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-green-500">{accuracy}%</p>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{correctChars}</p>
                    <p className="text-sm text-muted-foreground">Characters</p>
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <Button onClick={resetTest}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={shareResult}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Result
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Passage Display */}
                <div className="mb-6 p-6 bg-muted/50 rounded-lg text-lg leading-relaxed font-mono">
                  {passage.split("").map((char, i) => {
                    let className = "text-muted-foreground";
                    if (i < userInput.length) {
                      if (userInput[i] === char) {
                        className = "text-green-500";
                      } else {
                        className = "text-red-500 bg-red-100 dark:bg-red-900/30";
                      }
                    } else if (i === userInput.length) {
                      className = "text-foreground bg-primary/20 border-l-2 border-primary";
                    }
                    return (
                      <span key={i} className={className}>
                        {char}
                      </span>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={handleInput}
                    className="w-full p-4 text-lg font-mono border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={isRunning ? "Keep typing..." : "Start typing to begin the test..."}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  {!isRunning && (
                    <Button
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={startTest}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Speed Reference */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Typing Speed Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-sm">
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                <p className="font-bold text-gray-500">&lt;20 WPM</p>
                <p className="text-xs text-muted-foreground">Beginner</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <p className="font-bold text-yellow-600">20-40 WPM</p>
                <p className="text-xs text-muted-foreground">Learning</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <p className="font-bold text-blue-600">40-60 WPM</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <p className="font-bold text-green-600">60-80 WPM</p>
                <p className="text-xs text-muted-foreground">Fast</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <p className="font-bold text-purple-600">80+ WPM</p>
                <p className="text-xs text-muted-foreground">Expert</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
