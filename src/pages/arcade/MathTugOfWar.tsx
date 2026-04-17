// ─── Math Tug of War — Arcade Upgraded Version ──────────────────────────────
// Strategic math battles with difficulty choice, power-ups, streaks, AI, and
// full integration with the TechTrendi Arcade shared infrastructure.

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Swords,
  Zap,
  Shield,
  Timer,
  Clock,
  Bot,
  Crown,
  Flame,
  Sparkles,
} from 'lucide-react';

// Arcade shared infrastructure
import { GameModeSelector } from '@/components/arcade/GameModeSelector';
import { RoomLobby } from '@/components/arcade/RoomLobby';
import { CountdownOverlay } from '@/components/arcade/CountdownOverlay';
import { GameOverScreen } from '@/components/arcade/GameOverScreen';
import { RankBadge } from '@/components/arcade/RankBadge';
import { StreakIndicator } from '@/components/arcade/StreakIndicator';
import { TugOfWarScene } from '@/components/arcade/TugOfWarScene';
import { useGameRoom } from '@/lib/arcade/useGameRoom';
import { useGameAI } from '@/lib/arcade/useGameAI';
import { usePlayerProfile } from '@/lib/arcade/usePlayerProfile';
import { useLeaderboard } from '@/lib/arcade/useLeaderboard';
import { useRankSystem } from '@/lib/arcade/useRankSystem';
import { useStreakTracker } from '@/lib/arcade/useStreakTracker';
import { ELO } from '@/lib/arcade/constants';
import type { GameMode, RankTier } from '@/lib/arcade/types';

// ─── Types ──────────────────────────────────────────────────────────────────

type QuestionDifficulty = 'easy' | 'medium' | 'hard';
type PowerUp = 'double_pull' | 'time_freeze' | 'shield';
type GamePhase =
  | 'menu'
  | 'mode_select'
  | 'ai_difficulty'
  | 'room_lobby'
  | 'countdown'
  | 'choose_difficulty'
  | 'answering'
  | 'round_end'
  | 'game_over';

interface Question {
  text: string;
  answer: number;
  difficulty: QuestionDifficulty;
}

interface PlayerState {
  name: string;
  answer: string;
  question: Question | null;
  answered: boolean;
  streak: number;
  powerUp: PowerUp | null;
  powerUpActive: boolean;
  shieldActive: boolean;
  frozen: boolean;
  frozenUntil: number;
  totalCorrect: number;
  totalWrong: number;
  chosenDifficulty: QuestionDifficulty | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PULL_VALUES: Record<QuestionDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 35,
};

const PENALTY_VALUES: Record<QuestionDifficulty, number> = {
  easy: 0,
  medium: 5,
  hard: 15,
};

const STREAK_BONUS: Record<number, number> = {
  3: 10,
  5: 20,
};

const QUESTION_TIME = 10;
const WIN_THRESHOLD = 100;
const ROUNDS_TO_WIN = 2;
const TOTAL_ROUNDS = 3;
const FREEZE_DURATION = 5000;

// ─── Question Generation ────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(difficulty: QuestionDifficulty): Question {
  if (difficulty === 'easy') {
    const op = Math.random() < 0.5 ? '+' : '-';
    if (op === '+') {
      const a = rand(1, 20);
      const b = rand(1, 20);
      return { text: `${a} + ${b}`, answer: a + b, difficulty };
    }
    const b = rand(1, 10);
    const a = rand(b, 20);
    return { text: `${a} - ${b}`, answer: a - b, difficulty };
  }

  if (difficulty === 'medium') {
    const op = Math.random() < 0.5 ? '\u00d7' : '\u00f7';
    if (op === '\u00d7') {
      const a = rand(2, 12);
      const b = rand(2, 12);
      return { text: `${a} \u00d7 ${b}`, answer: a * b, difficulty };
    }
    const b = rand(2, 12);
    const answer = rand(2, 12);
    const a = b * answer;
    return { text: `${a} \u00f7 ${b}`, answer, difficulty };
  }

  // Hard: percentages, squares, larger multi-step
  const patterns = [
    () => {
      const a = rand(2, 12);
      const b = rand(2, 12);
      const c = rand(1, 30);
      const op2 = Math.random() < 0.5 ? '+' : '-';
      const result = op2 === '+' ? a * b + c : a * b - c;
      return { text: `${a} \u00d7 ${b} ${op2} ${c}`, answer: result, difficulty };
    },
    () => {
      // Percentage: X% of Y
      const pct = [10, 20, 25, 50, 75][rand(0, 4)];
      const base = rand(2, 20) * (100 / pct);
      const answer = (pct / 100) * base;
      return { text: `${pct}% of ${base}`, answer: Math.round(answer), difficulty };
    },
    () => {
      // Squares
      const a = rand(2, 15);
      return { text: `${a}\u00b2`, answer: a * a, difficulty };
    },
    () => {
      const a = rand(10, 50);
      const b = rand(5, 30);
      const c = rand(2, 10);
      return { text: `${a} + ${b} \u00d7 ${c}`, answer: a + b * c, difficulty };
    },
    () => {
      const c = rand(2, 10);
      const answer = rand(2, 10);
      const a = c * answer;
      const b = rand(1, 20);
      return {
        text: `${a} \u00f7 ${c} + ${b}`,
        answer: Math.round(a / c + b),
        difficulty,
      };
    },
  ];
  return patterns[rand(0, patterns.length - 1)]();
}

// ─── Timer Bar ──────────────────────────────────────────────────────────────

function TimerBar({ timeLeft, maxTime }: { timeLeft: number; maxTime: number }) {
  const pct = (timeLeft / maxTime) * 100;
  const isWarning = timeLeft <= 3;

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn('w-4 h-4 shrink-0', isWarning ? 'text-red-500 animate-pulse' : 'text-muted-foreground')} />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            isWarning ? 'bg-red-500' : 'bg-primary'
          )}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span
        className={cn(
          'text-sm font-mono min-w-[2ch] text-right tabular-nums',
          isWarning ? 'text-red-500 font-bold' : 'text-muted-foreground'
        )}
      >
        {timeLeft}
      </span>
    </div>
  );
}

// ─── Difficulty Choice Buttons ──────────────────────────────────────────────

function DifficultyChoice({
  onChoose,
  disabled,
  playerColor,
}: {
  onChoose: (d: QuestionDifficulty) => void;
  disabled: boolean;
  playerColor: 'blue' | 'orange';
}) {
  const choices: { d: QuestionDifficulty; label: string; desc: string; pull: number; risk: string; color: string }[] = [
    { d: 'easy', label: 'Easy', desc: '+/- (1-20)', pull: 10, risk: 'No penalty', color: 'from-emerald-500 to-green-600' },
    { d: 'medium', label: 'Medium', desc: '\u00d7/\u00f7 (up to 12)', pull: 20, risk: '-5 if wrong', color: 'from-amber-500 to-yellow-600' },
    { d: 'hard', label: 'Hard', desc: 'Multi-step / %', pull: 35, risk: '-15 if wrong', color: 'from-red-500 to-rose-600' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-center text-sm font-medium text-muted-foreground">
        Choose difficulty for this question
      </p>
      <div className="grid grid-cols-3 gap-2">
        {choices.map(({ d, label, pull, risk, color }) => (
          <motion.button
            key={d}
            whileTap={{ scale: 0.95 }}
            disabled={disabled}
            onClick={() => onChoose(d)}
            className={cn(
              'relative rounded-xl p-3 text-white font-bold',
              'bg-gradient-to-br', color,
              'shadow-md hover:shadow-lg transition-shadow',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
          >
            <div className="text-base sm:text-lg">{label}</div>
            <div className="text-[10px] sm:text-xs opacity-80">+{pull} pts</div>
            <div className="text-[9px] sm:text-[10px] opacity-60">{risk}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Power-Up Button ────────────────────────────────────────────────────────

const POWER_UP_INFO: Record<PowerUp, { icon: typeof Zap; label: string; color: string }> = {
  double_pull: { icon: Sparkles, label: '2x Pull', color: 'from-yellow-400 to-amber-500' },
  time_freeze: { icon: Timer, label: 'Freeze', color: 'from-cyan-400 to-blue-500' },
  shield: { icon: Shield, label: 'Shield', color: 'from-emerald-400 to-green-500' },
};

function PowerUpButton({
  powerUp,
  onActivate,
  isActive,
}: {
  powerUp: PowerUp | null;
  onActivate: () => void;
  isActive: boolean;
}) {
  if (!powerUp) return null;
  const info = POWER_UP_INFO[powerUp];
  const Icon = info.icon;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileTap={{ scale: 0.9 }}
      onClick={onActivate}
      disabled={isActive}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-sm',
        'bg-gradient-to-r', info.color,
        'shadow-lg',
        isActive ? 'opacity-60 ring-2 ring-white' : 'animate-pulse hover:brightness-110',
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="flex flex-col items-start leading-tight">
        <span>{info.label}</span>
        <span className="text-[9px] opacity-80 font-normal">
          {powerUp === 'double_pull' && 'Next correct = 2x pull'}
          {powerUp === 'time_freeze' && 'Freezes opponent 5s'}
          {powerUp === 'shield' && 'Blocks next wrong penalty'}
        </span>
      </span>
      {!isActive && <span className="text-[10px] opacity-70 ml-1">TAP</span>}
      {isActive && <span className="text-[10px] ml-1">ACTIVE</span>}
    </motion.button>
  );
}

// ─── Numpad ─────────────────────────────────────────────────────────────────

function Numpad({
  value,
  onChange,
  onSubmit,
  disabled,
  showMinus,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  showMinus: boolean;
  color: 'blue' | 'orange';
}) {
  const handleKey = (key: string) => {
    if (disabled) return;
    if (key === 'clear') {
      onChange('');
    } else if (key === 'submit') {
      onSubmit();
    } else if (key === '-') {
      if (value === '') onChange('-');
      else if (value === '-') onChange('');
    } else {
      if (value.length < 6) onChange(value + key);
    }
  };

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    [showMinus ? '-' : null, '0', 'clear'],
  ];

  return (
    <div className="w-full max-w-[260px] mx-auto">
      {/* Answer display */}
      <div
        className={cn(
          'text-center text-2xl font-mono font-bold h-11 flex items-center justify-center mb-1.5 rounded-lg border-2 bg-background',
          color === 'blue' ? 'border-blue-500/50' : 'border-orange-500/50'
        )}
      >
        {value || <span className="text-muted-foreground/40 text-base">?</span>}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1">
        {keys.flat().map((key, i) => {
          if (key === null) return <div key={i} />;
          if (key === 'clear') {
            return (
              <button
                key={i}
                onClick={() => handleKey('clear')}
                disabled={disabled}
                className="h-11 rounded-lg bg-red-500/20 text-red-500 font-bold text-xs hover:bg-red-500/30 active:bg-red-500/40 transition-colors disabled:opacity-40"
              >
                CLR
              </button>
            );
          }
          if (key === '-') {
            return (
              <button
                key={i}
                onClick={() => handleKey('-')}
                disabled={disabled}
                className="h-11 rounded-lg bg-muted hover:bg-muted/80 active:bg-muted/60 font-bold text-lg transition-colors disabled:opacity-40"
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
              className="h-11 rounded-lg bg-muted hover:bg-muted/80 active:bg-muted/60 font-bold text-lg transition-colors disabled:opacity-40"
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Submit */}
      <button
        onClick={() => handleKey('submit')}
        disabled={disabled || value === '' || value === '-'}
        className={cn(
          'w-full h-11 mt-1.5 rounded-lg font-bold text-base text-white transition-colors disabled:opacity-40',
          color === 'blue'
            ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
            : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
        )}
      >
        Submit
      </button>
    </div>
  );
}

// ─── AI Difficulty Picker ───────────────────────────────────────────────────

function AIDifficultyPicker({ onSelect }: { onSelect: (d: number) => void }) {
  const levels = [
    { value: 0.25, label: 'Easy', desc: 'Slow, basic math', color: 'from-emerald-500 to-green-600', icon: '🤖' },
    { value: 0.55, label: 'Medium', desc: 'Moderate speed', color: 'from-amber-500 to-yellow-600', icon: '🧠' },
    { value: 0.85, label: 'Hard', desc: 'Fast and accurate', color: 'from-red-500 to-rose-600', icon: '🔥' },
  ];

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h3 className="text-xl font-bold text-center">AI Difficulty</h3>
      <p className="text-sm text-center text-muted-foreground">Choose your opponent's strength</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {levels.map(({ value, label, desc, color, icon }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(value)}
            className={cn(
              'rounded-2xl p-5 text-white font-bold text-center',
              'bg-gradient-to-br', color,
              'shadow-lg hover:shadow-xl transition-shadow',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
          >
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-lg">{label}</div>
            <div className="text-xs opacity-80">{desc}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Freeze Overlay ─────────────────────────────────────────────────────────

function FreezeOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex items-center justify-center bg-cyan-500/20 backdrop-blur-[2px] rounded-xl pointer-events-none"
    >
      <div className="text-center">
        <Timer className="w-10 h-10 text-cyan-400 mx-auto mb-1 animate-spin" />
        <span className="text-cyan-400 font-bold text-sm">FROZEN</span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function createDefaultPlayer(name: string): PlayerState {
  return {
    name,
    answer: '',
    question: null,
    answered: false,
    streak: 0,
    powerUp: null,
    powerUpActive: false,
    shieldActive: false,
    frozen: false,
    frozenUntil: 0,
    totalCorrect: 0,
    totalWrong: 0,
    chosenDifficulty: null,
  };
}

export default function ArcadeMathTugOfWar() {
  const navigate = useNavigate();

  // ─── Arcade hooks ─────────────────────────────────────────────────────
  const { player, getPlayerId, getDisplayName, updateStats } = usePlayerProfile();
  const { calculateElo, getTierForRating } = useRankSystem();
  const { streak: globalStreak, recordWin, recordLoss } = useStreakTracker();
  const { submitScore } = useLeaderboard({ gameSlug: 'math-tug-of-war' });

  // ─── Game state ───────────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [mode, setMode] = useState<GameMode | null>(null);
  const [ropePosition, setRopePosition] = useState(0);
  const [p1, setP1] = useState<PlayerState>(createDefaultPlayer('Player 1'));
  const [p2, setP2] = useState<PlayerState>(createDefaultPlayer('Player 2'));
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [roundWins, setRoundWins] = useState<[number, number]>([0, 0]);
  const [currentRound, setCurrentRound] = useState(1);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1); // whose turn in local/solo
  const [showCountdown, setShowCountdown] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [aiDifficultyLevel, setAiDifficultyLevel] = useState(0.5);
  const [lastAction, setLastAction] = useState<'p1-correct' | 'p1-wrong' | 'p2-correct' | 'p2-wrong' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── AI hook ──────────────────────────────────────────────────────────
  const ai = useGameAI({ difficulty: aiDifficultyLevel, baseResponseTime: 4000 });
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Online room hook ─────────────────────────────────────────────────
  const room = useGameRoom({
    gameSlug: 'math-tug-of-war',
    playerName: player?.displayName || 'Player',
    onPlayerJoined: (name) => {
      setOpponentName(name);
    },
    onGameStart: (payload) => {
      // Guest receives game start
      setP1(createDefaultPlayer(payload.hostName as string));
      setP2(createDefaultPlayer(player?.displayName || 'Player 2'));
      setRoundWins([0, 0]);
      setCurrentRound(1);
      setRopePosition(0);
      startCountdown();
    },
    onBroadcast: (event, payload) => {
      handleOnlineBroadcast(event, payload);
    },
    onDisconnect: () => {
      stopTimer();
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    },
  });

  // ─── Cleanup ──────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (lastActionTimerRef.current) clearTimeout(lastActionTimerRef.current);
    };
  }, [stopTimer]);

  // ─── Timer ────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // ─── Handle timer expiry ──────────────────────────────────────────────

  useEffect(() => {
    if (timeLeft !== 0) return;
    if (phase !== 'answering') return;

    stopTimer();

    if (mode === 'solo' || mode === 'local') {
      // Current active player ran out of time — treat as wrong
      handleTimeUp();
    } else if (mode === 'online' && room.isHost) {
      handleTimeUp();
    }
  }, [timeLeft, phase, mode]);

  // ─── Countdown ────────────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    setShowCountdown(true);
  }, []);

  const onCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setPhase('choose_difficulty');
    setActivePlayer(1);
  }, []);

  // ─── Mode selection ───────────────────────────────────────────────────

  const handleModeSelect = useCallback((m: GameMode) => {
    setMode(m);
    if (m === 'solo') {
      setPhase('ai_difficulty');
    } else if (m === 'local') {
      // Set up local players
      setP1(createDefaultPlayer(player?.displayName || 'Player 1'));
      setP2(createDefaultPlayer('Player 2'));
      setRoundWins([0, 0]);
      setCurrentRound(1);
      setRopePosition(0);
      startCountdown();
    } else if (m === 'online') {
      setPhase('room_lobby');
    }
  }, [player, startCountdown]);

  // ─── AI difficulty selected ───────────────────────────────────────────

  const handleAIDifficultySelect = useCallback((d: number) => {
    setAiDifficultyLevel(d);
    ai.setDifficulty(d);
    setP1(createDefaultPlayer(player?.displayName || 'Player'));
    setP2(createDefaultPlayer(ai.aiName));
    setRoundWins([0, 0]);
    setCurrentRound(1);
    setRopePosition(0);
    startCountdown();
  }, [player, ai, startCountdown]);

  // ─── Online: host starts game ─────────────────────────────────────────

  const handleOnlineStart = useCallback(() => {
    setP1(createDefaultPlayer(player?.displayName || 'Player 1'));
    setP2(createDefaultPlayer(opponentName || 'Opponent'));
    setRoundWins([0, 0]);
    setCurrentRound(1);
    setRopePosition(0);

    room.broadcast('game_start', {
      hostName: player?.displayName || 'Player 1',
    });

    startCountdown();
  }, [player, opponentName, room, startCountdown]);

  // ─── Online broadcast handler ─────────────────────────────────────────

  const handleOnlineBroadcast = useCallback((event: string, payload: Record<string, unknown>) => {
    switch (event) {
      case 'difficulty_chosen': {
        // Opponent chose their difficulty
        const q = payload.question as Question;
        const pNum = payload.player as number;
        if (pNum === 1) {
          setP1(prev => ({ ...prev, question: q, chosenDifficulty: q.difficulty, answer: '', answered: false }));
        } else {
          setP2(prev => ({ ...prev, question: q, chosenDifficulty: q.difficulty, answer: '', answered: false }));
        }
        break;
      }
      case 'answer_result': {
        const pos = payload.ropePosition as number;
        setRopePosition(pos);
        const p1Data = payload.p1 as Record<string, unknown> | undefined;
        const p2Data = payload.p2 as Record<string, unknown> | undefined;
        if (p1Data) {
          setP1(prev => ({
            ...prev,
            streak: (p1Data.streak as number) ?? prev.streak,
            powerUp: (p1Data.powerUp as PowerUp | null) ?? prev.powerUp,
            totalCorrect: (p1Data.totalCorrect as number) ?? prev.totalCorrect,
          }));
        }
        if (p2Data) {
          setP2(prev => ({
            ...prev,
            streak: (p2Data.streak as number) ?? prev.streak,
            powerUp: (p2Data.powerUp as PowerUp | null) ?? prev.powerUp,
            totalCorrect: (p2Data.totalCorrect as number) ?? prev.totalCorrect,
          }));
        }
        break;
      }
      case 'next_turn': {
        setPhase('choose_difficulty');
        setTimeLeft(QUESTION_TIME);
        break;
      }
      case 'round_over': {
        const wins = payload.roundWins as [number, number];
        setRoundWins(wins);
        setCurrentRound(payload.currentRound as number);
        setPhase('round_end');
        stopTimer();
        break;
      }
      case 'match_over': {
        const wins = payload.roundWins as [number, number];
        setRoundWins(wins);
        setPhase('game_over');
        stopTimer();
        break;
      }
      case 'power_up_used': {
        const pNum = payload.player as number;
        const pu = payload.powerUp as PowerUp;
        if (pu === 'time_freeze') {
          // Freeze the OTHER player
          const target = pNum === 1 ? setP2 : setP1;
          target(prev => ({ ...prev, frozen: true, frozenUntil: Date.now() + FREEZE_DURATION }));
          setTimeout(() => {
            target(prev => ({ ...prev, frozen: false }));
          }, FREEZE_DURATION);
        }
        break;
      }
    }
  }, [stopTimer]);

  // ─── Difficulty choice handler ────────────────────────────────────────

  const handleDifficultyChoice = useCallback((playerNum: 1 | 2, d: QuestionDifficulty) => {
    const q = generateQuestion(d);
    const setter = playerNum === 1 ? setP1 : setP2;
    setter(prev => ({
      ...prev,
      question: q,
      chosenDifficulty: d,
      answer: '',
      answered: false,
    }));

    if (mode === 'online') {
      room.broadcast('difficulty_chosen', {
        player: playerNum,
        question: q,
      });
    }

    if (mode === 'solo' || mode === 'local') {
      setPhase('answering');
      startTimer();

      // In solo mode, make AI choose and answer
      if (mode === 'solo' && playerNum === 1) {
        // AI chooses difficulty based on its own logic
        const aiDiffs: QuestionDifficulty[] = ['easy', 'medium', 'hard'];
        const aiChoice = aiDiffs[Math.min(Math.floor(aiDifficultyLevel * 3), 2)];
        const aiQ = generateQuestion(aiChoice);
        setP2(prev => ({
          ...prev,
          question: aiQ,
          chosenDifficulty: aiChoice,
          answer: '',
          answered: false,
        }));

        // AI answers after a delay
        const responseTime = ai.getResponseTime();
        aiTimerRef.current = setTimeout(() => {
          const correct = ai.shouldAnswerCorrectly();
          processAnswer(2, correct ? aiQ.answer : ai.getWrongAnswer(aiQ.answer), aiQ);
        }, responseTime);
      }
    }

    // Local: switch to answering phase
    if (mode === 'local') {
      // Both players see their question immediately in local split-screen
      if (playerNum === 1) {
        // P1 chose, now P2 needs to choose
        setActivePlayer(2);
        // Stay in choose_difficulty but P2 side will be active
      }
    }
  }, [mode, room, ai, aiDifficultyLevel, startTimer]);

  // ─── Process answer (shared logic) ───────────────────────────────────

  const processAnswer = useCallback((playerNum: 1 | 2, inputAnswer: number, question: Question) => {
    const isP1 = playerNum === 1;
    const currentPlayer = isP1 ? p1 : p2;
    const correct = inputAnswer === question.answer;
    const difficulty = question.difficulty;

    // Set lastAction for TugOfWarScene animation
    const action = isP1
      ? (correct ? 'p1-correct' : 'p1-wrong')
      : (correct ? 'p2-correct' : 'p2-wrong');
    setLastAction(action as typeof lastAction);
    if (lastActionTimerRef.current) clearTimeout(lastActionTimerRef.current);
    lastActionTimerRef.current = setTimeout(() => setLastAction(null), 600);

    let pullAmount = 0;
    let newStreak = currentPlayer.streak;
    let newPowerUp = currentPlayer.powerUp;
    let shieldUsed = false;

    if (correct) {
      pullAmount = PULL_VALUES[difficulty];
      newStreak += 1;

      // Double pull power-up
      if (currentPlayer.powerUpActive && currentPlayer.powerUp === 'double_pull') {
        pullAmount *= 2;
        newPowerUp = null;
      }

      // Streak bonuses
      if (newStreak === 3) {
        pullAmount += STREAK_BONUS[3];
        toast.success(`${currentPlayer.name}: 3 streak! +${STREAK_BONUS[3]} bonus`, { duration: 1500 });
      }
      if (newStreak === 5) {
        pullAmount += STREAK_BONUS[5];
        toast.success(`${currentPlayer.name}: 5 streak! +${STREAK_BONUS[5]} bonus`, { duration: 1500 });
      }

      // Earn power-up at streak of 3 (if none held)
      if (newStreak >= 3 && newStreak % 3 === 0 && !newPowerUp) {
        const options: PowerUp[] = ['double_pull', 'time_freeze', 'shield'];
        newPowerUp = options[Math.floor(Math.random() * options.length)];
        toast(`${currentPlayer.name} earned a power-up: ${POWER_UP_INFO[newPowerUp].label}!`, {
          duration: 2000,
        });
      }

      toast.success(`${currentPlayer.name}: Correct! +${pullAmount}`, { duration: 1500 });
    } else {
      // Wrong answer
      const penalty = PENALTY_VALUES[difficulty];

      if (currentPlayer.shieldActive) {
        // Shield absorbs penalty
        shieldUsed = true;
        toast(`${currentPlayer.name}: Wrong, but shield absorbed the penalty!`, { duration: 2000 });
      } else if (penalty > 0) {
        pullAmount = -penalty; // negative = opponent pulls
        toast.error(`${currentPlayer.name}: Wrong! -${penalty} (answer: ${question.answer})`, { duration: 2000 });
      } else {
        toast.error(`${currentPlayer.name}: Wrong! Answer was ${question.answer}`, { duration: 2000 });
      }
      newStreak = 0;
    }

    // Apply rope movement: P1 pulls left (negative), P2 pulls right (positive)
    const direction = isP1 ? -1 : 1;
    const newPos = Math.max(-WIN_THRESHOLD, Math.min(WIN_THRESHOLD, ropePosition + pullAmount * direction));
    setRopePosition(newPos);

    // Update player state
    const setter = isP1 ? setP1 : setP2;
    setter(prev => ({
      ...prev,
      answered: true,
      streak: newStreak,
      powerUp: (prev.powerUpActive && prev.powerUp !== 'shield') ? null : (newPowerUp ?? prev.powerUp),
      powerUpActive: false,
      shieldActive: shieldUsed ? false : prev.shieldActive,
      totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
      totalWrong: prev.totalWrong + (correct ? 0 : 1),
    }));

    // Broadcast for online
    if (mode === 'online') {
      room.broadcast('answer_result', {
        player: playerNum,
        correct,
        ropePosition: newPos,
        p1: isP1 ? { streak: newStreak, powerUp: newPowerUp, totalCorrect: p1.totalCorrect + (correct ? 1 : 0) } : undefined,
        p2: !isP1 ? { streak: newStreak, powerUp: newPowerUp, totalCorrect: p2.totalCorrect + (correct ? 1 : 0) } : undefined,
      });
    }

    // Check round end
    if (newPos <= -WIN_THRESHOLD || newPos >= WIN_THRESHOLD) {
      handleRoundEnd(newPos);
      return;
    }

    // Move to next turn
    if (mode === 'solo') {
      // After both answered, go to next choose_difficulty
      // Check if P2 (AI) has also answered
      setTimeout(() => {
        setP1(prev => ({ ...prev, question: null, chosenDifficulty: null, answered: false, answer: '' }));
        setP2(prev => ({ ...prev, question: null, chosenDifficulty: null, answered: false, answer: '' }));
        setPhase('choose_difficulty');
        setActivePlayer(1);
        stopTimer();
      }, 800);
    } else if (mode === 'local') {
      // Check if both players have answered
      const otherAnswered = isP1 ? p2.answered : p1.answered;
      if (otherAnswered) {
        setTimeout(() => {
          setP1(prev => ({ ...prev, question: null, chosenDifficulty: null, answered: false, answer: '' }));
          setP2(prev => ({ ...prev, question: null, chosenDifficulty: null, answered: false, answer: '' }));
          setPhase('choose_difficulty');
          setActivePlayer(1);
          stopTimer();
        }, 800);
      }
    }
  }, [p1, p2, ropePosition, mode, room, stopTimer]);

  // ─── Handle answer submit from numpad ─────────────────────────────────

  const handleSubmit = useCallback((playerNum: 1 | 2) => {
    const ps = playerNum === 1 ? p1 : p2;
    if (!ps.question || ps.answered || ps.frozen) return;
    const val = parseInt(ps.answer, 10);
    if (isNaN(val)) return;
    processAnswer(playerNum, val, ps.question);
  }, [p1, p2, processAnswer]);

  // ─── Handle time up ───────────────────────────────────────────────────

  const handleTimeUp = useCallback(() => {
    stopTimer();

    // Mark unanswered players as wrong
    if (mode === 'solo') {
      if (!p1.answered && p1.question) {
        processAnswer(1, NaN, p1.question);
      }
    } else if (mode === 'local') {
      if (!p1.answered && p1.question) {
        processAnswer(1, NaN, p1.question);
      }
      if (!p2.answered && p2.question) {
        processAnswer(2, NaN, p2.question);
      }
    }

    // After timeout, move to next difficulty choice
    setTimeout(() => {
      setP1(prev => ({ ...prev, question: null, chosenDifficulty: null, answered: false, answer: '' }));
      setP2(prev => ({ ...prev, question: null, chosenDifficulty: null, answered: false, answer: '' }));
      setPhase('choose_difficulty');
      setActivePlayer(1);
    }, 1000);
  }, [mode, p1, p2, processAnswer, stopTimer]);

  // ─── Power-up activation ──────────────────────────────────────────────

  const activatePowerUp = useCallback((playerNum: 1 | 2) => {
    const ps = playerNum === 1 ? p1 : p2;
    if (!ps.powerUp || ps.powerUpActive) return;

    const setter = playerNum === 1 ? setP1 : setP2;
    setter(prev => ({ ...prev, powerUpActive: true, shieldActive: prev.powerUp === 'shield' }));

    if (ps.powerUp === 'time_freeze') {
      // Freeze opponent
      const oppSetter = playerNum === 1 ? setP2 : setP1;
      oppSetter(prev => ({ ...prev, frozen: true, frozenUntil: Date.now() + FREEZE_DURATION }));
      toast(`Time Freeze activated! Opponent frozen for 5s`, { duration: 2000 });

      setTimeout(() => {
        oppSetter(prev => ({ ...prev, frozen: false }));
      }, FREEZE_DURATION);

      // Consume power-up immediately for freeze
      setter(prev => ({ ...prev, powerUp: null, powerUpActive: false }));

      if (mode === 'online') {
        room.broadcast('power_up_used', { player: playerNum, powerUp: 'time_freeze' });
      }
    } else {
      toast(`${POWER_UP_INFO[ps.powerUp].label} activated!`, { duration: 1500 });
    }
  }, [p1, p2, mode, room]);

  // ─── Round end ────────────────────────────────────────────────────────

  const handleRoundEnd = useCallback((pos: number) => {
    stopTimer();
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

    const winner = pos <= -WIN_THRESHOLD ? 1 : 2;
    const newWins: [number, number] = [...roundWins];
    newWins[winner - 1] += 1;
    setRoundWins(newWins);

    // Check match end
    if (newWins[0] >= ROUNDS_TO_WIN || newWins[1] >= ROUNDS_TO_WIN) {
      const matchWinner = newWins[0] >= ROUNDS_TO_WIN ? 1 : 2;
      const won = (mode === 'solo' || mode === 'local') ? matchWinner === 1 : (room.isHost ? matchWinner === 1 : matchWinner === 2);

      if (mode === 'online') {
        // ELO and stats
        const eloResult = calculateElo(
          player?.eloRating || ELO.DEFAULT_RATING,
          ELO.DEFAULT_RATING,
          won,
          player?.totalGames || 0
        );
        updateStats(won);
        if (won) recordWin(); else recordLoss();

        submitScore({
          playerId: getPlayerId(),
          playerName: getDisplayName(),
          gameSlug: 'math-tug-of-war',
          score: won ? 100 : 0,
          gameMode: 'online',
          metadata: { roundWins: newWins, eloChange: eloResult.change },
        });

        room.broadcast('match_over', { roundWins: newWins });
      } else {
        if (mode === 'solo') {
          const won = matchWinner === 1;
          updateStats(won);
          if (won) recordWin(); else recordLoss();

          submitScore({
            playerId: getPlayerId(),
            playerName: getDisplayName(),
            gameSlug: 'math-tug-of-war',
            score: won ? 100 : 0,
            gameMode: 'solo',
            metadata: { roundWins: newWins, aiDifficulty: aiDifficultyLevel },
          });
        }
      }

      setPhase('game_over');
    } else {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);

      if (mode === 'online') {
        room.broadcast('round_over', { roundWins: newWins, currentRound: nextRound });
      }

      setPhase('round_end');
    }
  }, [roundWins, currentRound, mode, room, player, calculateElo, updateStats, recordWin, recordLoss, submitScore, getPlayerId, getDisplayName, aiDifficultyLevel, stopTimer]);

  // ─── Start next round ─────────────────────────────────────────────────

  const startNextRound = useCallback(() => {
    setRopePosition(0);
    setP1(prev => ({
      ...createDefaultPlayer(prev.name),
      streak: prev.streak,
      powerUp: prev.powerUp,
      totalCorrect: prev.totalCorrect,
      totalWrong: prev.totalWrong,
    }));
    setP2(prev => ({
      ...createDefaultPlayer(prev.name),
      streak: prev.streak,
      powerUp: prev.powerUp,
      totalCorrect: prev.totalCorrect,
      totalWrong: prev.totalWrong,
    }));
    startCountdown();

    if (mode === 'online') {
      room.broadcast('next_turn', {});
    }
  }, [mode, room, startCountdown]);

  // ─── Reset ────────────────────────────────────────────────────────────

  const goToMenu = useCallback(() => {
    stopTimer();
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    room.leaveRoom();
    setPhase('menu');
    setMode(null);
    setRopePosition(0);
    setRoundWins([0, 0]);
    setCurrentRound(1);
    setP1(createDefaultPlayer('Player 1'));
    setP2(createDefaultPlayer('Player 2'));
  }, [stopTimer, room]);

  const playAgain = useCallback(() => {
    setRopePosition(0);
    setRoundWins([0, 0]);
    setCurrentRound(1);
    setP1(prev => createDefaultPlayer(prev.name));
    setP2(prev => createDefaultPlayer(prev.name));
    startCountdown();
  }, [startCountdown]);

  // ─── Derived ──────────────────────────────────────────────────────────

  const isP1Turn = activePlayer === 1;
  const myPlayerNum = mode === 'online' ? (room.isHost ? 1 : 2) : 1;
  const matchWinner = roundWins[0] >= ROUNDS_TO_WIN ? 1 : roundWins[1] >= ROUNDS_TO_WIN ? 2 : null;
  const iWon = matchWinner !== null && (
    mode === 'online'
      ? (room.isHost ? matchWinner === 1 : matchWinner === 2)
      : matchWinner === 1
  );

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════

  return (
    <Layout>
      <SEOHead
        title="Math Tug of War Arcade — Strategic Math Battles | TechTrendi"
        description="Strategic math battles with power-ups, difficulty choice, and streaks. Play solo against AI, local split-screen, or online. Free, no signup required."
        keywords="math game, tug of war, arcade, multiplayer, power-ups, strategy, brain game"
        url="https://techtrendi.com/arcade/math-tug-of-war"
      />

      {/* Countdown overlay */}
      {showCountdown && <CountdownOverlay onComplete={onCountdownComplete} />}

      <div className="container max-w-2xl mx-auto px-4 py-4 sm:py-6 min-h-[80vh]">
        {/* ─── MENU ──────────────────────────────────────────────────── */}
        {phase === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Back to arcade */}
            <button
              onClick={() => navigate('/arcade')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Arcade
            </button>

            {/* Hero */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
              >
                <Swords className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Math Tug of War
              </h1>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Strategic math battles with power-ups. Choose your risk, build
                streaks, and pull the rope to your side. Best of 3 rounds wins.
              </p>
            </div>

            {/* How to Play */}
            <div className="bg-muted/50 rounded-xl p-4 text-left text-sm max-w-sm mx-auto space-y-2">
              <h3 className="font-bold text-center text-foreground">How to Play</h3>
              <div className="space-y-1.5 text-muted-foreground">
                <p><span className="font-semibold text-green-500">Easy</span> — Simple math, +10 pull, no penalty if wrong</p>
                <p><span className="font-semibold text-amber-500">Medium</span> — Harder math, +20 pull, -5 penalty if wrong</p>
                <p><span className="font-semibold text-red-500">Hard</span> — Complex math, +35 pull, -15 penalty if wrong</p>
                <hr className="border-border" />
                <p><span className="font-semibold text-blue-400">🛡 Shield</span> — Blocks penalty on your next wrong answer</p>
                <p><span className="font-semibold text-cyan-400">❄ Freeze</span> — Pauses opponent's timer for 5 seconds</p>
                <p><span className="font-semibold text-orange-400">⚡ Double</span> — Next correct answer pulls 2x distance</p>
                <hr className="border-border" />
                <p>🔥 Get 3 correct in a row to earn a power-up!</p>
                <p>🏆 First to pull the rope to your side wins the round.</p>
              </div>
            </div>

            {/* Player info */}
            {player && (
              <div className="flex items-center justify-center gap-3">
                <RankBadge tier={player.rankTier} rating={player.eloRating} showRating size="sm" />
                <StreakIndicator streak={globalStreak.current} />
              </div>
            )}

            {/* Mode selector */}
            <GameModeSelector onSelect={handleModeSelect} />
          </motion.div>
        )}

        {/* ─── AI DIFFICULTY ─────────────────────────────────────────── */}
        {phase === 'ai_difficulty' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={() => setPhase('menu')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <AIDifficultyPicker onSelect={handleAIDifficultySelect} />
          </motion.div>
        )}

        {/* ─── ROOM LOBBY ────────────────────────────────────────────── */}
        {phase === 'room_lobby' && (
          <RoomLobby
            roomCode={room.roomCode}
            isHost={room.isHost}
            opponentJoined={room.opponentJoined}
            opponentName={opponentName}
            onCreateRoom={room.createRoom}
            onJoinRoom={room.joinRoom}
            onStartGame={handleOnlineStart}
            onBack={() => { room.leaveRoom(); setPhase('menu'); }}
          />
        )}

        {/* ─── CHOOSE DIFFICULTY ─────────────────────────────────────── */}
        {phase === 'choose_difficulty' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button onClick={goToMenu} className="text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 inline mr-1" />Quit
              </button>
            </div>

            {/* Tug of War Scene */}
            <TugOfWarScene
              p1Score={Math.max(0, -ropePosition)}
              p2Score={Math.max(0, ropePosition)}
              maxScore={WIN_THRESHOLD}
              p1Name={p1.name}
              p2Name={p2.name}
              lastAction={lastAction}
              roundsWon={roundWins}
              totalRounds={TOTAL_ROUNDS}
            />

            {/* Streaks and power-ups summary */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                {p1.streak > 0 && <StreakIndicator streak={p1.streak} />}
                <AnimatePresence>
                  {p1.powerUp && (
                    <PowerUpButton
                      powerUp={p1.powerUp}
                      onActivate={() => activatePowerUp(1)}
                      isActive={p1.powerUpActive}
                    />
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {p2.powerUp && (
                    <PowerUpButton
                      powerUp={p2.powerUp}
                      onActivate={() => activatePowerUp(2)}
                      isActive={p2.powerUpActive}
                    />
                  )}
                </AnimatePresence>
                {p2.streak > 0 && <StreakIndicator streak={p2.streak} />}
              </div>
            </div>

            {mode === 'local' ? (
              /* LOCAL: Split screen difficulty choice */
              <div className="space-y-4">
                {/* P1 side (rotated 180 for face-to-face) */}
                <div className={cn(
                  'rounded-xl border-2 p-3',
                  'border-blue-500/30',
                  !p1.chosenDifficulty ? '' : 'opacity-50',
                  'rotate-180'
                )}>
                  <p className="text-center text-blue-500 font-bold text-sm mb-2">{p1.name}</p>
                  {!p1.chosenDifficulty ? (
                    <DifficultyChoice
                      onChoose={(d) => handleDifficultyChoice(1, d)}
                      disabled={!!p1.chosenDifficulty}
                      playerColor="blue"
                    />
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">Ready!</p>
                  )}
                </div>

                {/* P2 side */}
                <div className={cn(
                  'rounded-xl border-2 p-3',
                  'border-orange-500/30',
                  !p2.chosenDifficulty ? '' : 'opacity-50'
                )}>
                  <p className="text-center text-orange-500 font-bold text-sm mb-2">{p2.name}</p>
                  {!p2.chosenDifficulty ? (
                    <DifficultyChoice
                      onChoose={(d) => handleDifficultyChoice(2, d)}
                      disabled={!!p2.chosenDifficulty}
                      playerColor="orange"
                    />
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">Ready!</p>
                  )}
                </div>

                {/* Auto-advance when both chose */}
                <LocalDifficultyAutoAdvance
                  p1Chosen={!!p1.chosenDifficulty}
                  p2Chosen={!!p2.chosenDifficulty}
                  onBothChosen={() => {
                    setPhase('answering');
                    startTimer();
                    // In solo mode AI would have been handled in handleDifficultyChoice
                  }}
                />
              </div>
            ) : mode === 'solo' ? (
              /* SOLO: Player chooses, AI auto-follows */
              <div className="rounded-xl border-2 border-blue-500/30 p-4">
                <p className="text-center text-blue-500 font-bold text-sm mb-2">Your Turn</p>
                <DifficultyChoice
                  onChoose={(d) => handleDifficultyChoice(1, d)}
                  disabled={false}
                  playerColor="blue"
                />
              </div>
            ) : (
              /* ONLINE: My difficulty choice */
              <div className={cn(
                'rounded-xl border-2 p-4',
                room.isHost ? 'border-blue-500/30' : 'border-orange-500/30'
              )}>
                <p className={cn(
                  'text-center font-bold text-sm mb-2',
                  room.isHost ? 'text-blue-500' : 'text-orange-500'
                )}>
                  Your Turn
                </p>
                <DifficultyChoice
                  onChoose={(d) => handleDifficultyChoice(myPlayerNum, d)}
                  disabled={false}
                  playerColor={room.isHost ? 'blue' : 'orange'}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ─── ANSWERING ─────────────────────────────────────────────── */}
        {phase === 'answering' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button onClick={goToMenu} className="text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 inline mr-1" />Quit
              </button>
            </div>

            {/* Tug of War Scene */}
            <TugOfWarScene
              p1Score={Math.max(0, -ropePosition)}
              p2Score={Math.max(0, ropePosition)}
              maxScore={WIN_THRESHOLD}
              p1Name={p1.name}
              p2Name={p2.name}
              lastAction={lastAction}
              roundsWon={roundWins}
              totalRounds={TOTAL_ROUNDS}
            />

            {/* Timer */}
            <TimerBar timeLeft={timeLeft} maxTime={QUESTION_TIME} />

            {/* Streaks and power-ups */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                {p1.streak > 0 && <StreakIndicator streak={p1.streak} />}
                <AnimatePresence>
                  {p1.powerUp && (
                    <PowerUpButton
                      powerUp={p1.powerUp}
                      onActivate={() => activatePowerUp(1)}
                      isActive={p1.powerUpActive}
                    />
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {p2.powerUp && mode !== 'solo' && (
                    <PowerUpButton
                      powerUp={p2.powerUp}
                      onActivate={() => activatePowerUp(2)}
                      isActive={p2.powerUpActive}
                    />
                  )}
                </AnimatePresence>
                {p2.streak > 0 && <StreakIndicator streak={p2.streak} />}
              </div>
            </div>

            {mode === 'local' ? (
              /* LOCAL: Split screen — P1 rotated top, P2 bottom */
              <div className="space-y-3">
                {/* P1 (rotated 180) */}
                <div className="relative rounded-xl border-2 border-blue-500/30 p-3 rotate-180">
                  <AnimatePresence>{p1.frozen && <FreezeOverlay />}</AnimatePresence>
                  <p className="text-center text-blue-500 font-bold text-sm mb-1">{p1.name}</p>
                  {p1.question && (
                    <p className="text-center text-xl font-bold font-mono mb-1">
                      {p1.question.text} = ?
                    </p>
                  )}
                  <Numpad
                    value={p1.answer}
                    onChange={(v) => setP1(prev => ({ ...prev, answer: v }))}
                    onSubmit={() => handleSubmit(1)}
                    disabled={p1.answered || !p1.question || p1.frozen}
                    showMinus={p1.chosenDifficulty === 'hard'}
                    color="blue"
                  />
                  {p1.answered && (
                    <p className="text-center text-xs text-muted-foreground mt-1">Done</p>
                  )}
                </div>

                {/* P2 */}
                <div className="relative rounded-xl border-2 border-orange-500/30 p-3">
                  <AnimatePresence>{p2.frozen && <FreezeOverlay />}</AnimatePresence>
                  <p className="text-center text-orange-500 font-bold text-sm mb-1">{p2.name}</p>
                  {p2.question && (
                    <p className="text-center text-xl font-bold font-mono mb-1">
                      {p2.question.text} = ?
                    </p>
                  )}
                  <Numpad
                    value={p2.answer}
                    onChange={(v) => setP2(prev => ({ ...prev, answer: v }))}
                    onSubmit={() => handleSubmit(2)}
                    disabled={p2.answered || !p2.question || p2.frozen}
                    showMinus={p2.chosenDifficulty === 'hard'}
                    color="orange"
                  />
                  {p2.answered && (
                    <p className="text-center text-xs text-muted-foreground mt-1">Done</p>
                  )}
                </div>
              </div>
            ) : mode === 'solo' ? (
              /* SOLO: Player question + AI indicator */
              <div className="space-y-3">
                <div className="relative rounded-xl border-2 border-blue-500/30 p-3">
                  <AnimatePresence>{p1.frozen && <FreezeOverlay />}</AnimatePresence>
                  {p1.question && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-blue-500 font-bold text-sm">{p1.name}</span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                          {p1.chosenDifficulty}
                        </span>
                      </div>
                      <p className="text-center text-2xl font-bold font-mono py-2">
                        {p1.question.text} = ?
                      </p>
                    </>
                  )}
                  <Numpad
                    value={p1.answer}
                    onChange={(v) => setP1(prev => ({ ...prev, answer: v }))}
                    onSubmit={() => handleSubmit(1)}
                    disabled={p1.answered || !p1.question || p1.frozen}
                    showMinus={p1.chosenDifficulty === 'hard'}
                    color="blue"
                  />
                  {p1.answered && (
                    <p className="text-center text-xs text-muted-foreground mt-1">Answered! Waiting for AI...</p>
                  )}
                </div>

                {/* AI status */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Bot className="w-4 h-4" />
                  <span>
                    {p2.answered
                      ? `${p2.name} answered`
                      : `${p2.name} is thinking...`}
                  </span>
                  {p2.chosenDifficulty && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500">
                      {p2.chosenDifficulty}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* ONLINE: My question only */
              <div className="space-y-3">
                {room.opponentDisconnected ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 font-bold">Opponent disconnected</p>
                    <Button className="mt-4" onClick={goToMenu}>Back to Menu</Button>
                  </div>
                ) : (
                  <div className={cn(
                    'relative rounded-xl border-2 p-3',
                    room.isHost ? 'border-blue-500/30' : 'border-orange-500/30'
                  )}>
                    <AnimatePresence>{(room.isHost ? p1.frozen : p2.frozen) && <FreezeOverlay />}</AnimatePresence>
                    {(() => {
                      const me = room.isHost ? p1 : p2;
                      const myColor: 'blue' | 'orange' = room.isHost ? 'blue' : 'orange';
                      return (
                        <>
                          {me.question && (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn('font-bold text-sm', myColor === 'blue' ? 'text-blue-500' : 'text-orange-500')}>
                                  {me.name} (You)
                                </span>
                                <span className={cn(
                                  'text-[10px] uppercase tracking-wider px-2 py-0.5 rounded',
                                  myColor === 'blue' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                                )}>
                                  {me.chosenDifficulty}
                                </span>
                              </div>
                              <p className="text-center text-2xl font-bold font-mono py-2">
                                {me.question.text} = ?
                              </p>
                            </>
                          )}
                          <Numpad
                            value={me.answer}
                            onChange={(v) => {
                              if (room.isHost) setP1(prev => ({ ...prev, answer: v }));
                              else setP2(prev => ({ ...prev, answer: v }));
                            }}
                            onSubmit={() => handleSubmit(myPlayerNum)}
                            disabled={me.answered || !me.question || me.frozen}
                            showMinus={me.chosenDifficulty === 'hard'}
                            color={myColor}
                          />
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── ROUND END ─────────────────────────────────────────────── */}
        {phase === 'round_end' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 py-8"
          >
            <div className={cn(
              'inline-flex items-center justify-center w-20 h-20 rounded-full',
              ropePosition <= -WIN_THRESHOLD ? 'bg-blue-500/20' : 'bg-orange-500/20'
            )}>
              <Crown className={cn(
                'w-10 h-10',
                ropePosition <= -WIN_THRESHOLD ? 'text-blue-500' : 'text-orange-500'
              )} />
            </div>

            <h2 className="text-2xl font-bold">
              {ropePosition <= -WIN_THRESHOLD ? p1.name : p2.name} wins Round {currentRound - 1}!
            </h2>

            <div className="flex items-center justify-center gap-3">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold',
                    i < roundWins[0]
                      ? 'border-blue-500 bg-blue-500/20 text-blue-500'
                      : i < (roundWins[0] + roundWins[1]) && i >= roundWins[0]
                      ? 'border-orange-500 bg-orange-500/20 text-orange-500'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <p className="text-muted-foreground">
              {roundWins[0]} - {roundWins[1]}
            </p>

            {mode === 'online' && !room.isHost ? (
              <p className="text-sm text-muted-foreground animate-pulse">Waiting for host to start next round...</p>
            ) : (
              <Button size="lg" className="h-14 px-8 text-lg" onClick={startNextRound}>
                Next Round
              </Button>
            )}
          </motion.div>
        )}

        {/* ─── GAME OVER ─────────────────────────────────────────────── */}
        {phase === 'game_over' && (
          <GameOverScreen
            won={iWon}
            score={roundWins[0]}
            opponentScore={roundWins[1]}
            streak={globalStreak.current}
            rankTier={player?.rankTier}
            eloChange={mode === 'online'
              ? calculateElo(
                  player?.eloRating || ELO.DEFAULT_RATING,
                  ELO.DEFAULT_RATING,
                  iWon,
                  player?.totalGames || 0
                ).change
              : undefined
            }
            newRating={player?.eloRating}
            onPlayAgain={playAgain}
            onBackToArcade={() => navigate('/arcade')}
            playerName={mode === 'online' ? (room.isHost ? p1.name : p2.name) : p1.name}
            opponentName={mode === 'online' ? (room.isHost ? p2.name : p1.name) : p2.name}
            onShare={() => {
              const text = `I ${iWon ? 'won' : 'lost'} at Math Tug of War on TechTrendi Arcade! ${roundWins[0]}-${roundWins[1]}. Can you beat me? techtrendi.com/arcade/math-tug-of-war`;
              if (navigator.share) {
                navigator.share({ text });
              } else {
                navigator.clipboard.writeText(text);
                toast.success('Copied to clipboard!');
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
}

// ─── Helper component: auto-advance when both local players chose difficulty ─

function LocalDifficultyAutoAdvance({
  p1Chosen,
  p2Chosen,
  onBothChosen,
}: {
  p1Chosen: boolean;
  p2Chosen: boolean;
  onBothChosen: () => void;
}) {
  const calledRef = useRef(false);

  useEffect(() => {
    if (p1Chosen && p2Chosen && !calledRef.current) {
      calledRef.current = true;
      // Small delay so players see "Ready!"
      const t = setTimeout(onBothChosen, 400);
      return () => clearTimeout(t);
    }
    if (!p1Chosen || !p2Chosen) {
      calledRef.current = false;
    }
  }, [p1Chosen, p2Chosen, onBothChosen]);

  return null;
}
