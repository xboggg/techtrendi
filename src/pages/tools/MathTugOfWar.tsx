import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Swords, Trophy, Clock, RotateCcw, Users, Wifi, WifiOff,
  ArrowLeft, Copy, Check, Loader2, Crown
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";
type GameScreen =
  | "home"
  | "local-setup"
  | "online-create"
  | "online-join"
  | "game"
  | "round-end"
  | "match-end";

interface Question {
  question: string;
  answer: number;
}

interface TeamState {
  name: string;
  currentAnswer: string;
  question: Question | null;
  answered: boolean;
}

interface RoundResult {
  winner: 1 | 2;
  team1Name: string;
  team2Name: string;
}

// ─── Question Generation ─────────────────────────────────────────────────────

function generateQuestion(difficulty: Difficulty): Question {
  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  if (difficulty === "easy") {
    const op = Math.random() < 0.5 ? "+" : "-";
    if (op === "+") {
      const a = rand(1, 15);
      const b = rand(1, 15);
      return { question: `${a} + ${b}`, answer: a + b };
    } else {
      const b = rand(1, 10);
      const a = rand(b, 20); // ensure positive answer
      return { question: `${a} - ${b}`, answer: a - b };
    }
  }

  if (difficulty === "medium") {
    const op = Math.random() < 0.5 ? "*" : "/";
    if (op === "*") {
      const a = rand(2, 12);
      const b = rand(2, 12);
      return { question: `${a} \u00d7 ${b}`, answer: a * b };
    } else {
      const b = rand(2, 12);
      const answer = rand(2, 12);
      const a = b * answer;
      return { question: `${a} \u00f7 ${b}`, answer };
    }
  }

  // hard: two-step problems
  const patterns = [
    () => {
      const a = rand(2, 12);
      const b = rand(2, 12);
      const c = rand(1, 20);
      const op2 = Math.random() < 0.5 ? "+" : "-";
      const result = op2 === "+" ? a * b + c : a * b - c;
      return { question: `${a} \u00d7 ${b} ${op2} ${c}`, answer: result };
    },
    () => {
      const a = rand(5, 50);
      const b = rand(1, Math.min(a - 1, 30));
      const c = rand(1, 20);
      const op2 = Math.random() < 0.5 ? "+" : "-";
      const result = op2 === "+" ? a - b + c : a - b - c;
      return { question: `${a} - ${b} ${op2} ${c}`, answer: result };
    },
    () => {
      const a = rand(10, 50);
      const b = rand(5, 30);
      const c = rand(2, 10);
      const result = a + b * c;
      return { question: `${a} + ${b} \u00d7 ${c}`, answer: result };
    },
    () => {
      const c = rand(2, 10);
      const answer = rand(2, 10);
      const a = c * answer;
      const b = rand(1, 20);
      const result = a / c + b;
      return {
        question: `${a} \u00f7 ${c} + ${b}`,
        answer: Math.round(result),
      };
    },
  ];

  return patterns[rand(0, patterns.length - 1)]();
}

function generateQuestionBatch(
  difficulty: Difficulty,
  count: number = 10
): Question[] {
  return Array.from({ length: count }, () => generateQuestion(difficulty));
}

// ─── Rope Animation Component ───────────────────────────────────────────────

function TugOfWarRope({
  position,
  team1Name,
  team2Name,
  team1Score,
  team2Score,
}: {
  position: number;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
}) {
  // position: -100 (team1 wins) to 100 (team2 wins)
  const pct = ((position + 100) / 200) * 100;

  return (
    <div className="w-full select-none mb-4">
      {/* Score header */}
      <div className="flex justify-between items-center mb-2 px-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-500 font-bold text-sm sm:text-base">
            {team1Name}
          </span>
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-500 text-xs"
          >
            {team1Score}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-orange-500 text-orange-500 text-xs"
          >
            {team2Score}
          </Badge>
          <span className="text-orange-500 font-bold text-sm sm:text-base">
            {team2Name}
          </span>
        </div>
      </div>

      {/* Rope area */}
      <div className="relative h-20 sm:h-24 bg-muted/30 rounded-xl border border-border overflow-hidden">
        {/* Win zones */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-blue-500/20 border-r border-blue-500/40" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-orange-500/20 border-l border-orange-500/40" />

        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

        {/* Rope assembly - shifts based on position */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-full flex items-center justify-center"
          style={{
            transform: `translateX(${position * 0.35}%) translateY(-50%)`,
            transition: "transform 0.5s ease-out",
          }}
        >
          {/* Team 1 stick figures */}
          <div className="flex items-center gap-0.5 sm:gap-1 mr-1">
            <span className="text-lg sm:text-2xl">🏃</span>
            <span className="text-lg sm:text-2xl">🏃</span>
            <span className="text-lg sm:text-2xl hidden sm:inline">🏃</span>
          </div>

          {/* Rope */}
          <div className="relative flex items-center">
            <div className="w-24 sm:w-40 h-3 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 rounded-full shadow-md" />
            {/* Flag marker */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-5">
              <div className="w-0.5 h-5 bg-foreground mx-auto" />
              <div className="w-3 h-3 bg-red-500 rotate-45 -mt-1 ml-0.5" />
            </div>
          </div>

          {/* Team 2 stick figures */}
          <div className="flex items-center gap-0.5 sm:gap-1 ml-1">
            <span className="text-lg sm:text-2xl scale-x-[-1]">🏃</span>
            <span className="text-lg sm:text-2xl scale-x-[-1]">🏃</span>
            <span className="text-lg sm:text-2xl scale-x-[-1] hidden sm:inline">
              🏃
            </span>
          </div>
        </div>

        {/* Position indicator bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-muted/50">
          <div
            className="absolute top-0 h-full w-3 rounded-full"
            style={{
              left: `calc(${pct}% - 6px)`,
              transition: "left 0.5s ease-out",
              background:
                position < 0
                  ? "rgb(59, 130, 246)"
                  : position > 0
                  ? "rgb(249, 115, 22)"
                  : "rgb(156, 163, 175)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Timer Component ─────────────────────────────────────────────────────────

function CountdownTimer({
  timeLeft,
  maxTime,
}: {
  timeLeft: number;
  maxTime: number;
}) {
  const pct = (timeLeft / maxTime) * 100;
  const isWarning = timeLeft <= 5;

  return (
    <div className="flex items-center gap-2">
      <Clock
        className={cn("w-4 h-4", isWarning ? "text-red-500" : "text-muted-foreground")}
      />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-linear",
            isWarning ? "bg-red-500" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "text-sm font-mono min-w-[2ch] text-right",
          isWarning ? "text-red-500 font-bold" : "text-muted-foreground"
        )}
      >
        {timeLeft}
      </span>
    </div>
  );
}

// ─── Numpad Component ────────────────────────────────────────────────────────

function Numpad({
  value,
  onChange,
  onSubmit,
  disabled,
  showMinus,
  teamColor,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  showMinus: boolean;
  teamColor: "blue" | "orange";
}) {
  const handleKey = (key: string) => {
    if (disabled) return;
    if (key === "clear") {
      onChange("");
    } else if (key === "submit") {
      onSubmit();
    } else if (key === "-") {
      if (value === "") onChange("-");
      else if (value === "-") onChange("");
    } else {
      if (value.length < 6) onChange(value + key);
    }
  };

  const keys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    [showMinus ? "-" : null, "0", "clear"],
  ];

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Answer display */}
      <div
        className={cn(
          "text-center text-2xl sm:text-3xl font-mono font-bold h-12 sm:h-14 flex items-center justify-center mb-2 rounded-lg border-2 bg-background",
          teamColor === "blue" ? "border-blue-500/50" : "border-orange-500/50"
        )}
      >
        {value || (
          <span className="text-muted-foreground/40 text-lg">Your answer</span>
        )}
      </div>

      {/* Keypad grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {keys.flat().map((key, i) => {
          if (key === null) return <div key={i} />;
          if (key === "clear") {
            return (
              <button
                key={i}
                onClick={() => handleKey("clear")}
                disabled={disabled}
                className="h-12 sm:h-14 rounded-lg bg-red-500/20 text-red-500 font-bold text-sm hover:bg-red-500/30 active:bg-red-500/40 transition-colors disabled:opacity-40"
              >
                CLR
              </button>
            );
          }
          if (key === "-") {
            return (
              <button
                key={i}
                onClick={() => handleKey("-")}
                disabled={disabled}
                className="h-12 sm:h-14 rounded-lg bg-muted hover:bg-muted/80 active:bg-muted/60 font-bold text-xl transition-colors disabled:opacity-40"
              >
                &minus;
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleKey(key)}
              disabled={disabled}
              className="h-12 sm:h-14 rounded-lg bg-muted hover:bg-muted/80 active:bg-muted/60 font-bold text-xl transition-colors disabled:opacity-40"
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      <button
        onClick={() => handleKey("submit")}
        disabled={disabled || value === "" || value === "-"}
        className={cn(
          "w-full h-12 sm:h-14 mt-1.5 sm:mt-2 rounded-lg font-bold text-lg text-white transition-colors disabled:opacity-40",
          teamColor === "blue"
            ? "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
            : "bg-orange-500 hover:bg-orange-600 active:bg-orange-700"
        )}
      >
        Submit
      </button>
    </div>
  );
}

// ─── Celebration Component ───────────────────────────────────────────────────

function Celebration({ winner }: { winner: string }) {
  const [particles, setParticles] = useState<
    { id: number; x: number; delay: number; emoji: string }[]
  >([]);

  useEffect(() => {
    const emojis = ["🎉", "🏆", "⭐", "🎊", "🥇", "✨"];
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      }))
    );
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl p-8 text-center">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute text-2xl animate-bounce"
          style={{
            left: `${p.x}%`,
            top: "-10%",
            animationDelay: `${p.delay}s`,
            animationDuration: "1.5s",
          }}
        >
          {p.emoji}
        </span>
      ))}
      <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-3xl font-bold mb-2">{winner} Wins!</h2>
      <p className="text-muted-foreground">Champion of the Math Tug of War</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MathTugOfWar() {
  // Screen & mode state
  const [screen, setScreen] = useState<GameScreen>("home");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isOnline, setIsOnline] = useState(false);

  // Team state
  const [team1Name, setTeam1Name] = useState("Blue Team");
  const [team2Name, setTeam2Name] = useState("Orange Team");

  // Game state
  const [ropePosition, setRopePosition] = useState(0);
  const [team1, setTeam1] = useState<TeamState>({
    name: "Blue Team",
    currentAnswer: "",
    question: null,
    answered: false,
  });
  const [team2, setTeam2] = useState<TeamState>({
    name: "Orange Team",
    currentAnswer: "",
    question: null,
    answered: false,
  });
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [roundScores, setRoundScores] = useState<(1 | 2)[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundWinner, setRoundWinner] = useState<1 | 2 | null>(null);
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);

  // Online state
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<Question[]>([]);

  // Keep queueRef in sync
  useEffect(() => {
    queueRef.current = questionQueue;
  }, [questionQueue]);

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // ─── Question Management ────────────────────────────────────────────────

  const getNextQuestion = useCallback((): Question => {
    let queue = queueRef.current;
    if (queue.length === 0) {
      queue = generateQuestionBatch(difficulty, 10);
    }
    const [next, ...rest] = queue;
    queueRef.current = rest;
    setQuestionQueue(rest);
    return next;
  }, [difficulty]);

  const loadNewQuestions = useCallback(() => {
    const q1 = getNextQuestion();
    const q2 = getNextQuestion();
    setTeam1((prev) => ({
      ...prev,
      question: q1,
      currentAnswer: "",
      answered: false,
    }));
    setTeam2((prev) => ({
      ...prev,
      question: q2,
      currentAnswer: "",
      answered: false,
    }));
    setTimeLeft(15);
  }, [getNextQuestion]);

  // ─── Timer ───────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - treat as wrong for unanswered teams
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Handle timer expiry
  useEffect(() => {
    if (timeLeft === 0 && isGameActive && screen === "game") {
      // Both teams who haven't answered get a penalty
      let newPos = ropePosition;

      setTeam1((prev) => {
        if (!prev.answered) {
          newPos += 5; // penalty: move toward team 2's side
          return { ...prev, answered: true };
        }
        return prev;
      });

      setTeam2((prev) => {
        if (!prev.answered) {
          newPos -= 5; // penalty: move toward team 1's side
          return { ...prev, answered: true };
        }
        return prev;
      });

      newPos = Math.max(-100, Math.min(100, newPos));
      setRopePosition(newPos);

      if (isOnline && isHost && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "rope_moved",
          payload: { position: newPos },
        });
      }

      // Check if round over
      if (newPos <= -100 || newPos >= 100) {
        handleRoundEnd(newPos);
      } else {
        // Load next questions after a brief pause
        setTimeout(() => {
          if (isOnline && isHost) {
            const q1 = getNextQuestion();
            const q2 = getNextQuestion();
            setTeam1((prev) => ({
              ...prev,
              question: q1,
              currentAnswer: "",
              answered: false,
            }));
            setTeam2((prev) => ({
              ...prev,
              question: q2,
              currentAnswer: "",
              answered: false,
            }));
            setTimeLeft(15);
            channelRef.current?.send({
              type: "broadcast",
              event: "new_questions",
              payload: { q1, q2 },
            });
          } else if (!isOnline) {
            loadNewQuestions();
            startTimer();
          }
        }, 800);
      }
    }
  }, [timeLeft, isGameActive, screen]);

  // ─── Answer Handling ─────────────────────────────────────────────────────

  const handleAnswer = useCallback(
    (teamNum: 1 | 2) => {
      const team = teamNum === 1 ? team1 : team2;
      if (!team.question || team.answered) return;

      const userAnswer = parseInt(team.currentAnswer, 10);
      const correct = userAnswer === team.question.answer;
      let newPos = ropePosition;

      if (correct) {
        newPos += teamNum === 1 ? -10 : 10;
        toast.success(
          `${teamNum === 1 ? team1.name : team2.name}: Correct! +10`,
          { duration: 1500 }
        );
      } else {
        newPos += teamNum === 1 ? 5 : -5;
        toast.error(
          `${teamNum === 1 ? team1.name : team2.name}: Wrong! Answer was ${team.question.answer}`,
          { duration: 2000 }
        );
      }

      newPos = Math.max(-100, Math.min(100, newPos));
      setRopePosition(newPos);

      if (teamNum === 1) {
        setTeam1((prev) => ({ ...prev, answered: true }));
      } else {
        setTeam2((prev) => ({ ...prev, answered: true }));
      }

      // Online: broadcast result
      if (isOnline && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "answer_submitted",
          payload: {
            team: teamNum,
            correct,
            newPosition: newPos,
            answer: team.question.answer,
          },
        });
      }

      // Check round end
      if (newPos <= -100 || newPos >= 100) {
        handleRoundEnd(newPos);
        return;
      }

      // In local mode, if both answered, load next question
      if (!isOnline) {
        const otherAnswered =
          teamNum === 1 ? team2.answered : team1.answered;
        // Also check if BOTH have now answered (current team just answered)
        if (otherAnswered) {
          setTimeout(() => {
            loadNewQuestions();
            startTimer();
          }, 600);
        }
      } else {
        // Online mode: load new question for this team
        const newQ = getNextQuestion();
        if (teamNum === 1) {
          setTeam1((prev) => ({
            ...prev,
            question: newQ,
            currentAnswer: "",
            answered: false,
          }));
        } else {
          setTeam2((prev) => ({
            ...prev,
            question: newQ,
            currentAnswer: "",
            answered: false,
          }));
        }
        setTimeLeft(15);
      }
    },
    [team1, team2, ropePosition, isOnline, loadNewQuestions, startTimer, getNextQuestion]
  );

  // ─── Round / Match End ───────────────────────────────────────────────────

  const handleRoundEnd = useCallback(
    (pos: number) => {
      setIsGameActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const winner: 1 | 2 = pos <= -100 ? 1 : 2;
      setRoundWinner(winner);
      const newScores = [...roundScores, winner];
      setRoundScores(newScores);

      // Check if match is over (best of 3)
      const team1Wins = newScores.filter((s) => s === 1).length;
      const team2Wins = newScores.filter((s) => s === 2).length;

      if (team1Wins >= 2 || team2Wins >= 2) {
        setMatchWinner(team1Wins >= 2 ? team1.name : team2.name);
        setScreen("match-end");

        if (isOnline && isHost && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "match_end",
            payload: {
              winner: team1Wins >= 2 ? 1 : 2,
              scores: newScores,
            },
          });
        }
      } else {
        setScreen("round-end");

        if (isOnline && isHost && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "round_end",
            payload: { winner, round: currentRound, scores: newScores },
          });
        }
      }
    },
    [roundScores, currentRound, team1.name, team2.name, isOnline, isHost]
  );

  // ─── Start Game / Round ──────────────────────────────────────────────────

  const startRound = useCallback(() => {
    const batch = generateQuestionBatch(difficulty, 10);
    queueRef.current = batch;
    setQuestionQueue(batch);
    setRopePosition(0);
    setRoundWinner(null);
    setCurrentRound((prev) => (screen === "round-end" ? prev + 1 : prev));

    const q1 = batch[0];
    const q2 = batch[1];
    const rest = batch.slice(2);
    queueRef.current = rest;
    setQuestionQueue(rest);

    setTeam1((prev) => ({
      ...prev,
      question: q1,
      currentAnswer: "",
      answered: false,
    }));
    setTeam2((prev) => ({
      ...prev,
      question: q2,
      currentAnswer: "",
      answered: false,
    }));
    setTimeLeft(15);
    setIsGameActive(true);
    setScreen("game");
    startTimer();

    if (isOnline && isHost && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "new_questions",
        payload: { q1, q2 },
      });
    }
  }, [difficulty, screen, startTimer, isOnline, isHost]);

  // ─── Local Mode Setup ───────────────────────────────────────────────────

  const startLocalGame = () => {
    setIsOnline(false);
    setTeam1((prev) => ({ ...prev, name: team1Name }));
    setTeam2((prev) => ({ ...prev, name: team2Name }));
    setRoundScores([]);
    setCurrentRound(1);
    setMatchWinner(null);
    startRound();
  };

  // ─── Online Mode ─────────────────────────────────────────────────────────

  const generateRoomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const setupChannel = useCallback(
    (code: string, hosting: boolean) => {
      const channel = supabase.channel(`tow-game-${code}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "player_joined" }, ({ payload }) => {
          if (hosting) {
            setTeam2((prev) => ({
              ...prev,
              name: payload.name,
            }));
            setTeam2Name(payload.name);
            setOpponentJoined(true);
            toast.success(`${payload.name} joined the game!`);
          }
        })
        .on("broadcast", { event: "answer_submitted" }, ({ payload }) => {
          const { team, correct, newPosition, answer } = payload;
          setRopePosition(newPosition);

          if (hosting && team === 2) {
            toast(correct ? "Opponent got it right!" : `Opponent got it wrong! Answer: ${answer}`, {
              duration: 1500,
            });
          } else if (!hosting && team === 1) {
            toast(correct ? "Opponent got it right!" : `Opponent got it wrong! Answer: ${answer}`, {
              duration: 1500,
            });
          }
        })
        .on("broadcast", { event: "rope_moved" }, ({ payload }) => {
          setRopePosition(payload.position);
        })
        .on("broadcast", { event: "new_questions" }, ({ payload }) => {
          const myQuestion = hosting ? payload.q1 : payload.q2;
          if (hosting) {
            setTeam1((prev) => ({
              ...prev,
              question: myQuestion,
              currentAnswer: "",
              answered: false,
            }));
          } else {
            setTeam2((prev) => ({
              ...prev,
              question: myQuestion,
              currentAnswer: "",
              answered: false,
            }));
          }
          setTimeLeft(15);
          setIsGameActive(true);
          setScreen("game");
        })
        .on("broadcast", { event: "round_end" }, ({ payload }) => {
          setRoundWinner(payload.winner);
          setRoundScores(payload.scores);
          setIsGameActive(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setScreen("round-end");
        })
        .on("broadcast", { event: "match_end" }, ({ payload }) => {
          setRoundScores(payload.scores);
          const w = payload.winner === 1 ? team1.name : team2.name;
          setMatchWinner(w);
          setIsGameActive(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setScreen("match-end");
        })
        .on("broadcast", { event: "game_start" }, ({ payload }) => {
          setDifficulty(payload.difficulty);
          setTeam1((prev) => ({ ...prev, name: payload.hostName }));
          setRoundScores([]);
          setCurrentRound(1);
          setMatchWinner(null);
          // Questions will come via new_questions event
        })
        .on("broadcast", { event: "disconnect" }, () => {
          setOpponentDisconnected(true);
          setIsGameActive(false);
          if (timerRef.current) clearInterval(timerRef.current);
          toast.error("Opponent disconnected");
        })
        .subscribe();

      channelRef.current = channel;
    },
    [team1.name, team2.name]
  );

  const createRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    setIsOnline(true);
    setOpponentJoined(false);
    setOpponentDisconnected(false);
    setTeam1((prev) => ({ ...prev, name: playerName || "Player 1" }));
    setTeam1Name(playerName || "Player 1");
    setupChannel(code, true);
    setScreen("online-create");
  };

  const joinRoom = () => {
    if (joinCode.length !== 4) {
      toast.error("Enter a 4-digit room code");
      return;
    }
    setIsHost(false);
    setIsOnline(true);
    setOpponentDisconnected(false);
    setTeam2((prev) => ({ ...prev, name: playerName || "Player 2" }));
    setTeam2Name(playerName || "Player 2");
    setupChannel(joinCode, false);

    // Notify the host
    setTimeout(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "player_joined",
        payload: { name: playerName || "Player 2" },
      });
    }, 1000);

    setScreen("online-join");
  };

  const startOnlineGame = () => {
    if (!opponentJoined) {
      toast.error("Wait for an opponent to join");
      return;
    }

    // Broadcast game start info
    channelRef.current?.send({
      type: "broadcast",
      event: "game_start",
      payload: {
        difficulty,
        hostName: team1.name,
      },
    });

    setRoundScores([]);
    setCurrentRound(1);
    setMatchWinner(null);

    // Start the round (this also broadcasts questions)
    startRound();
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCodeCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const goHome = () => {
    cleanup();
    setScreen("home");
    setIsGameActive(false);
    setOpponentJoined(false);
    setOpponentDisconnected(false);
    setRopePosition(0);
    setRoundScores([]);
    setCurrentRound(1);
    setMatchWinner(null);
    setRoundWinner(null);
  };

  // Send disconnect on unmount if online
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "disconnect",
          payload: {},
        });
      }
    };
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  const renderHomeScreen = () => (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-orange-500 mb-4">
          <Swords className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">Math Tug of War</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Challenge a friend to a math battle! Answer questions correctly to pull
          the rope to your side. First to pull it all the way wins the round.
          Best of 3 rounds wins the match.
        </p>
      </div>

      {/* Difficulty selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Difficulty
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <Button
                key={d}
                variant={difficulty === d ? "default" : "outline"}
                onClick={() => setDifficulty(d)}
                className="capitalize"
              >
                {d}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {difficulty === "easy" && "Addition & subtraction (1-20)"}
            {difficulty === "medium" && "Multiplication & division (up to 12\u00d712)"}
            {difficulty === "hard" && "Two-step problems, mixed operations"}
          </p>
        </CardContent>
      </Card>

      {/* Mode buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          size="lg"
          className="h-16 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          onClick={() => setScreen("local-setup")}
        >
          <Users className="w-5 h-5 mr-2" />
          Play Local
        </Button>
        <Button
          size="lg"
          className="h-16 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          onClick={() => setScreen("online-create")}
        >
          <Wifi className="w-5 h-5 mr-2" />
          Play Online
        </Button>
      </div>
    </div>
  );

  const renderLocalSetup = () => (
    <div className="max-w-lg mx-auto space-y-6">
      <Button variant="ghost" onClick={goHome} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">Local Game Setup</h2>
        <p className="text-muted-foreground text-sm">
          Both players share this screen
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-blue-500 mb-1 block">
              Team 1 Name
            </label>
            <Input
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value || "Blue Team")}
              placeholder="Blue Team"
              className="border-blue-500/30 focus-visible:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-orange-500 mb-1 block">
              Team 2 Name
            </label>
            <Input
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value || "Orange Team")}
              placeholder="Orange Team"
              className="border-orange-500/30 focus-visible:ring-orange-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {difficulty}
            </Badge>
            <span>difficulty</span>
          </div>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full h-14 text-lg"
        onClick={startLocalGame}
      >
        Start Game
      </Button>
    </div>
  );

  const renderOnlineCreate = () => (
    <div className="max-w-lg mx-auto space-y-6">
      <Button variant="ghost" onClick={goHome} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">Create Online Game</h2>
        <p className="text-muted-foreground text-sm">
          Share the room code with your opponent
        </p>
      </div>

      {!roomCode ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Your Name
              </label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <Button className="w-full" onClick={createRoom}>
              Create Room
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <span>or </span>
              <button
                className="text-primary underline"
                onClick={() => {
                  setScreen("online-join");
                }}
              >
                join an existing room
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">Room Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-mono font-bold tracking-[0.3em]">
                {roomCode}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyRoomCode}
              >
                {codeCopied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>

            {opponentJoined ? (
              <div className="space-y-3">
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  {team2Name} joined!
                </Badge>
                <Button
                  size="lg"
                  className="w-full h-14 text-lg"
                  onClick={startOnlineGame}
                >
                  Start Match
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Waiting for opponent...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderOnlineJoin = () => (
    <div className="max-w-lg mx-auto space-y-6">
      <Button variant="ghost" onClick={goHome} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">Join Online Game</h2>
        <p className="text-muted-foreground text-sm">
          Enter the room code from your opponent
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Your Name</label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Room Code</label>
            <Input
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="4-digit code"
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={4}
            />
          </div>
          <Button className="w-full" onClick={joinRoom}>
            Join Room
          </Button>
        </CardContent>
      </Card>

      {/* Show waiting state after joining */}
      {channelRef.current && !isGameActive && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connected! Waiting for host to start...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderLocalGameScreen = () => (
    <div className="space-y-4">
      {/* Round indicator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goHome}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Quit
        </Button>
        <Badge variant="outline">
          Round {currentRound} / 3
        </Badge>
        <Badge variant="outline" className="capitalize">
          {difficulty}
        </Badge>
      </div>

      {/* Rope animation */}
      <TugOfWarRope
        position={ropePosition}
        team1Name={team1.name}
        team2Name={team2.name}
        team1Score={roundScores.filter((s) => s === 1).length}
        team2Score={roundScores.filter((s) => s === 2).length}
      />

      {/* Timer */}
      <CountdownTimer timeLeft={timeLeft} maxTime={15} />

      {/* Split screen for two teams */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Team 1 */}
        <Card className="border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-500 text-center text-sm sm:text-base">
              {team1.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team1.question && (
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold font-mono py-2">
                  {team1.question.question} = ?
                </p>
              </div>
            )}
            <Numpad
              value={team1.currentAnswer}
              onChange={(v) =>
                setTeam1((prev) => ({ ...prev, currentAnswer: v }))
              }
              onSubmit={() => handleAnswer(1)}
              disabled={team1.answered || !isGameActive}
              showMinus={difficulty === "hard"}
              teamColor="blue"
            />
            {team1.answered && (
              <p className="text-center text-sm text-muted-foreground">
                Waiting for next question...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Team 2 */}
        <Card className="border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-500 text-center text-sm sm:text-base">
              {team2.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team2.question && (
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold font-mono py-2">
                  {team2.question.question} = ?
                </p>
              </div>
            )}
            <Numpad
              value={team2.currentAnswer}
              onChange={(v) =>
                setTeam2((prev) => ({ ...prev, currentAnswer: v }))
              }
              onSubmit={() => handleAnswer(2)}
              disabled={team2.answered || !isGameActive}
              showMinus={difficulty === "hard"}
              teamColor="orange"
            />
            {team2.answered && (
              <p className="text-center text-sm text-muted-foreground">
                Waiting for next question...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOnlineGameScreen = () => {
    const myTeamNum = isHost ? 1 : 2;
    const myTeam = isHost ? team1 : team2;
    const myColor: "blue" | "orange" = isHost ? "blue" : "orange";

    if (opponentDisconnected) {
      return (
        <div className="max-w-lg mx-auto text-center space-y-4 py-12">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Opponent Disconnected</h2>
          <p className="text-muted-foreground">
            Your opponent left the game.
          </p>
          <Button onClick={goHome}>Back to Home</Button>
        </div>
      );
    }

    return (
      <div className="max-w-lg mx-auto space-y-4">
        {/* Round indicator */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goHome}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Quit
          </Button>
          <Badge variant="outline">Round {currentRound} / 3</Badge>
          <Badge variant="outline" className="capitalize">
            {difficulty}
          </Badge>
        </div>

        {/* Rope */}
        <TugOfWarRope
          position={ropePosition}
          team1Name={team1.name}
          team2Name={team2.name}
          team1Score={roundScores.filter((s) => s === 1).length}
          team2Score={roundScores.filter((s) => s === 2).length}
        />

        {/* Timer */}
        <CountdownTimer timeLeft={timeLeft} maxTime={15} />

        {/* My question */}
        <Card className={cn("border-2", myColor === "blue" ? "border-blue-500/30" : "border-orange-500/30")}>
          <CardHeader className="pb-2">
            <CardTitle
              className={cn(
                "text-center",
                myColor === "blue" ? "text-blue-500" : "text-orange-500"
              )}
            >
              {myTeam.name} (You)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myTeam.question && (
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold font-mono py-3">
                  {myTeam.question.question} = ?
                </p>
              </div>
            )}
            <Numpad
              value={myTeam.currentAnswer}
              onChange={(v) => {
                if (isHost) {
                  setTeam1((prev) => ({ ...prev, currentAnswer: v }));
                } else {
                  setTeam2((prev) => ({ ...prev, currentAnswer: v }));
                }
              }}
              onSubmit={() => handleAnswer(myTeamNum)}
              disabled={myTeam.answered || !isGameActive}
              showMinus={difficulty === "hard"}
              teamColor={myColor}
            />
            {myTeam.answered && (
              <p className="text-center text-sm text-muted-foreground">
                Waiting for next question...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRoundEnd = () => (
    <div className="max-w-lg mx-auto text-center space-y-6 py-8">
      <div
        className={cn(
          "inline-flex items-center justify-center w-20 h-20 rounded-full",
          roundWinner === 1 ? "bg-blue-500/20" : "bg-orange-500/20"
        )}
      >
        <Trophy
          className={cn(
            "w-10 h-10",
            roundWinner === 1 ? "text-blue-500" : "text-orange-500"
          )}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-1">
          {roundWinner === 1 ? team1.name : team2.name} wins Round{" "}
          {currentRound}!
        </h2>
        <p className="text-muted-foreground">
          Score: {roundScores.filter((s) => s === 1).length} -{" "}
          {roundScores.filter((s) => s === 2).length}
        </p>
      </div>

      {/* Round indicators */}
      <div className="flex items-center justify-center gap-3">
        {[1, 2, 3].map((r) => {
          const result = roundScores[r - 1];
          return (
            <div
              key={r}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold",
                result === 1
                  ? "border-blue-500 bg-blue-500/20 text-blue-500"
                  : result === 2
                  ? "border-orange-500 bg-orange-500/20 text-orange-500"
                  : "border-border text-muted-foreground"
              )}
            >
              {result ? (result === 1 ? "B" : "O") : r}
            </div>
          );
        })}
      </div>

      {isOnline && !isHost ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Waiting for host to start next round...</span>
        </div>
      ) : (
        <Button size="lg" className="h-14 px-8 text-lg" onClick={startRound}>
          Next Round
        </Button>
      )}
    </div>
  );

  const renderMatchEnd = () => (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <Celebration winner={matchWinner || ""} />

      {/* Final score */}
      <div className="flex items-center justify-center gap-3">
        {[1, 2, 3].map((r) => {
          const result = roundScores[r - 1];
          return (
            <div
              key={r}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold",
                result === 1
                  ? "border-blue-500 bg-blue-500/20 text-blue-500"
                  : result === 2
                  ? "border-orange-500 bg-orange-500/20 text-orange-500"
                  : "border-border text-muted-foreground"
              )}
            >
              {result ? (result === 1 ? "B" : "O") : "-"}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Final Score: {roundScores.filter((s) => s === 1).length} -{" "}
          {roundScores.filter((s) => s === 2).length}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          size="lg"
          onClick={goHome}
          variant="outline"
          className="h-12"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Play Again
        </Button>
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case "home":
        return renderHomeScreen();
      case "local-setup":
        return renderLocalSetup();
      case "online-create":
        return renderOnlineCreate();
      case "online-join":
        return renderOnlineJoin();
      case "game":
        return isOnline
          ? renderOnlineGameScreen()
          : renderLocalGameScreen();
      case "round-end":
        return renderRoundEnd();
      case "match-end":
        return renderMatchEnd();
      default:
        return renderHomeScreen();
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Math Tug of War — Free Multiplayer Math Game | TechTrendi"
        description="Challenge a friend to Math Tug of War! Answer math questions to pull the rope to your side. Play locally on one device or online with a room code. Free, no signup required."
        keywords="math game, tug of war, multiplayer math, math challenge, brain game, educational game"
        url="https://techtrendi.com/tools/math-tug-of-war"
      />

      <div className="container max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* SEO intro (visible on home screen) */}
        {screen === "home" && (
          <p className="text-center text-muted-foreground text-sm mb-6 max-w-xl mx-auto">
            A free multiplayer math game for two players. Test your mental math
            speed against a friend — play on one device or create an online room.
            Choose from Easy, Medium, or Hard difficulty levels.
          </p>
        )}

        {renderScreen()}
      </div>
    </Layout>
  );
}
