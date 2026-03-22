import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle2, XCircle, Trophy, ArrowRight, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface QuickQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  emoji: string;
}

// Pool of daily questions — rotated by day of year
const questionPool: QuickQuestion[] = [
  {
    question: "You get an SMS saying your MoMo account will be blocked unless you send your PIN. What do you do?",
    options: ["Send the PIN quickly", "Ignore and delete it", "Call the number back"],
    correctIndex: 1,
    explanation: "MTN, Vodafone, and AirtelTigo will NEVER ask for your PIN via SMS. This is always a scam. Delete it.",
    emoji: "📱",
  },
  {
    question: "What makes a strong password?",
    options: ["Your birthday", "A mix of letters, numbers, and symbols (12+ characters)", "Your pet's name"],
    correctIndex: 1,
    explanation: "Strong passwords are at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols.",
    emoji: "🔑",
  },
  {
    question: "Someone on WhatsApp is offering you a job paying GHS 1,000/day with no experience needed. What is this?",
    options: ["A great opportunity", "Probably a scam", "A government programme"],
    correctIndex: 1,
    explanation: "If a job offer sounds too good to be true, it is. Real jobs don't recruit through random WhatsApp messages.",
    emoji: "💼",
  },
  {
    question: "You're at a hotel. Should you do mobile banking on the hotel's free Wi-Fi?",
    options: ["Yes, it's convenient", "No, use mobile data instead", "Only if it has a password"],
    correctIndex: 1,
    explanation: "Public Wi-Fi, even with a password, can be monitored. Always use your mobile data for banking.",
    emoji: "📶",
  },
  {
    question: "A friend messages you on Facebook asking you to urgently send them money. What should you do first?",
    options: ["Send it immediately — they need help", "Call them on the phone to verify", "Ask them to send you money first"],
    correctIndex: 1,
    explanation: "Scammers hack accounts and message contacts asking for money. Always verify by calling the person directly.",
    emoji: "💬",
  },
  {
    question: "What is two-factor authentication (2FA)?",
    options: ["Using two passwords", "An extra verification step beyond your password", "Having two accounts"],
    correctIndex: 1,
    explanation: "2FA adds an extra security layer — like a code sent to your phone — so even if your password is stolen, your account stays safe.",
    emoji: "🔐",
  },
  {
    question: "You receive an email from 'your bank' asking you to click a link to verify your account. The email address looks slightly off. What do you do?",
    options: ["Click the link and check", "Delete it and go to the bank's website directly", "Reply asking for more information"],
    correctIndex: 1,
    explanation: "Phishing emails mimic real companies. Never click links — go directly to the company's official website instead.",
    emoji: "🎣",
  },
];

export function DailyQuizWidget() {
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  // Get today's question based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todayQuestion = questionPool[dayOfYear % questionPool.length];

  // Check if already answered today
  useEffect(() => {
    const lastAnswered = localStorage.getItem("security_quiz_last_date");
    const today = new Date().toISOString().split("T")[0];
    if (lastAnswered === today) {
      const wasCorrect = localStorage.getItem("security_quiz_last_correct") === "true";
      const lastSelected = parseInt(localStorage.getItem("security_quiz_last_selected") || "-1");
      setAnswered(true);
      setIsCorrect(wasCorrect);
      setSelectedOption(lastSelected);
    }
  }, []);

  const handleAnswer = (index: number) => {
    if (answered) return;
    const correct = index === todayQuestion.correctIndex;
    setSelectedOption(index);
    setIsCorrect(correct);
    setAnswered(true);

    // Save to localStorage
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("security_quiz_last_date", today);
    localStorage.setItem("security_quiz_last_correct", String(correct));
    localStorage.setItem("security_quiz_last_selected", String(index));

    // Update streak
    const streak = parseInt(localStorage.getItem("security_quiz_streak") || "0");
    const lastDate = localStorage.getItem("security_quiz_streak_date");
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (lastDate === yesterday) {
      localStorage.setItem("security_quiz_streak", String(streak + 1));
    } else if (lastDate !== today) {
      localStorage.setItem("security_quiz_streak", "1");
    }
    localStorage.setItem("security_quiz_streak_date", today);
  };

  const streak = parseInt(localStorage.getItem("security_quiz_streak") || "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 p-5 md:p-6 overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-[80px]" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <span className="text-sm font-bold text-purple-700 dark:text-purple-400">Daily Quiz</span>
              <p className="text-[10px] text-muted-foreground">Test your safety knowledge</p>
            </div>
          </div>
          {streak > 0 && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{streak} day streak</span>
            </motion.div>
          )}
        </div>

        {/* Question */}
        <p className="text-foreground font-medium text-sm mb-4 leading-relaxed">
          <span className="text-lg mr-1">{todayQuestion.emoji}</span>
          {todayQuestion.question}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {todayQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = index === todayQuestion.correctIndex;
            const showResult = answered;

            return (
              <motion.button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={answered}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border",
                  showResult && isCorrectOption
                    ? "bg-green-100 dark:bg-green-900/30 border-green-500/50 text-green-800 dark:text-green-300"
                    : showResult && isSelected && !isCorrectOption
                    ? "bg-red-100 dark:bg-red-900/30 border-red-500/50 text-red-800 dark:text-red-300"
                    : answered
                    ? "bg-white/50 dark:bg-white/5 border-border/50 text-muted-foreground"
                    : "bg-white dark:bg-white/5 border-border hover:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-foreground cursor-pointer"
                )}
                whileHover={!answered ? { scale: 1.01 } : {}}
                whileTap={!answered ? { scale: 0.99 } : {}}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />}
                  {showResult && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {answered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <div className={cn(
                "p-3 rounded-xl text-sm",
                isCorrect
                  ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                  : "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
              )}>
                <p className="font-medium mb-1">
                  {isCorrect ? "Correct!" : "Not quite!"}
                </p>
                <p className="text-xs opacity-80">{todayQuestion.explanation}</p>
              </div>
              <Link
                to="/tools/phishing-quiz"
                className="flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline mt-3"
              >
                <Target className="w-3 h-3" />
                Take the full Phishing Quiz
                <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
