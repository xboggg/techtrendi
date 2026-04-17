// ─── Anagram Blitz — Unscramble letters against the clock ────────────────────
// Modes: Solo (60s blitz), Daily Challenge (same set for all), 1v1 Online
// (Supabase Realtime), Local (P1 then P2, same letters).

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shuffle, Clock, Trophy, Sparkles, Check, X,
  Volume2, VolumeX, Calendar, Wifi, Users, Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Arcade shared infrastructure
import { GameModeSelector } from '@/components/arcade/GameModeSelector';
import { RoomLobby } from '@/components/arcade/RoomLobby';
import { CountdownOverlay } from '@/components/arcade/CountdownOverlay';
import { GameOverScreen } from '@/components/arcade/GameOverScreen';
import { Leaderboard } from '@/components/arcade/Leaderboard';
import { RankBadge } from '@/components/arcade/RankBadge';
import { StreakIndicator } from '@/components/arcade/StreakIndicator';
import { useGameRoom } from '@/lib/arcade/useGameRoom';
import { usePlayerProfile } from '@/lib/arcade/usePlayerProfile';
import { useLeaderboard } from '@/lib/arcade/useLeaderboard';
import { useRankSystem } from '@/lib/arcade/useRankSystem';
import { useStreakTracker } from '@/lib/arcade/useStreakTracker';
import { useDailyChallenge } from '@/lib/arcade/useDailyChallenge';
import { ELO } from '@/lib/arcade/constants';
import type { GameMode } from '@/lib/arcade/types';

// Game data
import {
  ANAGRAM_SETS,
  isValidWord,
  getWordPoints,
  type AnagramSet,
} from '@/data/arcade/anagram-sets';

// ─── Types ──────────────────────────────────────────────────────────────────

type GamePhase =
  | 'menu'
  | 'mode-select'
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'waiting-p2'   // local mode: waiting for P2 turn
  | 'playing-p2'   // local mode: P2 is playing
  | 'finished';

interface FoundWord {
  word: string;
  points: number;
  timestamp: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GAME_DURATION = 60; // seconds
const GAME_SLUG = 'anagram-blitz' as const;

// ─── Helper: shuffle array ──────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Helper: get daily seed-based set ───────────────────────────────────────

function getDailySetIndex(): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return Math.abs(seed) % ANAGRAM_SETS.length;
}

// ─── Helper: pick random set ────────────────────────────────────────────────

function pickRandomSet(): AnagramSet {
  return ANAGRAM_SETS[Math.floor(Math.random() * ANAGRAM_SETS.length)];
}

// ─── Circular Timer Component ───────────────────────────────────────────────

function CircularTimer({
  timeLeft,
  maxTime,
  size = 80,
}: {
  timeLeft: number;
  maxTime: number;
  size?: number;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, timeLeft / maxTime);
  const offset = circumference * (1 - progress);

  const color =
    progress > 0.5 ? 'stroke-green-500' : progress > 0.25 ? 'stroke-yellow-500' : 'stroke-red-500';
  const textColor =
    progress > 0.5 ? 'text-green-500' : progress > 0.25 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-1000 ease-linear', color)}
        />
      </svg>
      <span
        className={cn(
          'absolute text-xl font-black tabular-nums',
          textColor,
          timeLeft <= 10 && 'animate-pulse'
        )}
      >
        {timeLeft}
      </span>
    </div>
  );
}

// ─── Letter Tile Component ──────────────────────────────────────────────────

// Scrabble-style point values for letters
const SCRABBLE_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

function LetterTile({
  letter,
  used,
  index,
  onClick,
}: {
  letter: string;
  used: boolean;
  index: number;
  onClick?: () => void;
}) {
  const pointValue = SCRABBLE_VALUES[letter.toUpperCase()] || 1;

  return (
    <motion.button
      layout
      initial={{ scale: 0, rotate: -180 }}
      animate={{
        scale: used ? 0.85 : 1,
        rotate: 0,
        opacity: used ? 0.4 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: index * 0.05,
      }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={used}
      className={cn(
        'relative w-12 h-14 sm:w-14 sm:h-16 rounded-lg font-black text-2xl sm:text-3xl',
        'flex items-center justify-center select-none cursor-pointer',
        'transition-all duration-200',
        used
          ? 'bg-muted text-muted-foreground/30 border border-muted shadow-none'
          : [
              'bg-gradient-to-b from-amber-100 via-amber-50 to-amber-200',
              'dark:from-amber-200 dark:via-amber-100 dark:to-amber-300',
              'text-gray-900 border border-amber-300',
              'shadow-[0_3px_0_0_#b45309,0_4px_6px_-1px_rgba(180,83,9,0.3),inset_0_1px_0_0_rgba(255,255,255,0.6)]',
              'hover:shadow-[0_2px_0_0_#b45309,0_3px_4px_-1px_rgba(180,83,9,0.3),inset_0_1px_0_0_rgba(255,255,255,0.6)]',
              'hover:translate-y-[1px]',
              'active:shadow-[0_0px_0_0_#b45309,inset_0_2px_4px_rgba(0,0,0,0.15)]',
              'active:translate-y-[3px]',
            ].join(' ')
      )}
    >
      {letter}
      {/* Scrabble point value in bottom-right corner */}
      {!used && (
        <span className="absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-bold text-amber-800 dark:text-amber-900 leading-none">
          {pointValue}
        </span>
      )}
    </motion.button>
  );
}

// ─── Word Chip ──────────────────────────────────────────────────────────────

// Color scheme based on word length / points
function getWordChipColors(points: number) {
  if (points >= 1600) return 'from-purple-500/25 to-pink-500/25 text-purple-600 dark:text-purple-300 border-purple-500/40';
  if (points >= 800) return 'from-amber-500/25 to-yellow-500/25 text-amber-600 dark:text-amber-300 border-amber-500/40';
  if (points >= 400) return 'from-blue-500/25 to-cyan-500/25 text-blue-600 dark:text-blue-300 border-blue-500/40';
  if (points >= 200) return 'from-emerald-500/25 to-green-500/25 text-emerald-600 dark:text-emerald-300 border-emerald-500/40';
  return 'from-gray-500/20 to-slate-500/20 text-gray-600 dark:text-gray-300 border-gray-500/30';
}

function WordChip({
  word,
  points,
  isNew,
}: {
  word: string;
  points: number;
  isNew?: boolean;
}) {
  return (
    <motion.div
      initial={isNew ? { scale: 0, y: 10 } : false}
      animate={{ scale: 1, y: 0 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold',
        'bg-gradient-to-r border',
        getWordChipColors(points)
      )}
    >
      <span className="uppercase tracking-wide">{word}</span>
      <span className="text-xs font-black opacity-80">
        +{points}
      </span>
    </motion.div>
  );
}

// ─── Missed Word (post-game reveal) ─────────────────────────────────────────

function MissedWordChip({ word, points }: { word: string; points: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
        'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
      )}
    >
      <span className="uppercase">{word}</span>
      <span className="opacity-60">+{points}</span>
    </span>
  );
}

// ─── Input Feedback Flash ───────────────────────────────────────────────────

function InputFeedback({
  type,
  message,
}: {
  type: 'success' | 'error' | null;
  message: string;
}) {
  if (!type) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        'text-sm font-semibold mt-1',
        type === 'success' ? 'text-green-500' : 'text-red-500'
      )}
    >
      <span className="flex items-center gap-1 justify-center">
        {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
        {message}
      </span>
    </motion.div>
  );
}

// ─── Score Breakdown (post-game) ────────────────────────────────────────────

function ScoreBreakdown({
  foundWords,
  allValidWords,
  letters,
}: {
  foundWords: FoundWord[];
  allValidWords: string[];
  letters: string[];
}) {
  const foundSet = new Set(foundWords.map((w) => w.word.toLowerCase()));
  const missed = allValidWords.filter((w) => !foundSet.has(w));

  // Group missed words by length
  const missedByLength: Record<number, string[]> = {};
  missed.forEach((w) => {
    const len = w.length;
    if (!missedByLength[len]) missedByLength[len] = [];
    missedByLength[len].push(w);
  });

  const foundPercent = Math.round((foundWords.length / allValidWords.length) * 100);

  return (
    <div className="space-y-4 mt-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-muted/50 rounded-xl p-3">
          <div className="text-2xl font-black text-emerald-500">{foundWords.length}</div>
          <div className="text-xs text-muted-foreground">Found</div>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <div className="text-2xl font-black text-red-500">{missed.length}</div>
          <div className="text-xs text-muted-foreground">Missed</div>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <div className="text-2xl font-black text-amber-500">{foundPercent}%</div>
          <div className="text-xs text-muted-foreground">Coverage</div>
        </div>
      </div>

      {/* Found words */}
      {foundWords.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-muted-foreground mb-2">Your Words</h4>
          <div className="flex flex-wrap gap-1.5">
            {foundWords
              .sort((a, b) => b.points - a.points)
              .map((w) => (
                <WordChip key={w.word} word={w.word} points={w.points} />
              ))}
          </div>
        </div>
      )}

      {/* Missed words by length */}
      {missed.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-muted-foreground mb-2">Missed Words</h4>
          {Object.keys(missedByLength)
            .map(Number)
            .sort((a, b) => b - a)
            .map((len) => (
              <div key={len} className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">
                  {len} letters ({getWordPoints(missedByLength[len][0])} pts each)
                </p>
                <div className="flex flex-wrap gap-1">
                  {missedByLength[len].sort().map((w) => (
                    <MissedWordChip key={w} word={w} points={getWordPoints(w)} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function AnagramBlitz() {
  const navigate = useNavigate();

  // ─── Shared hooks ─────────────────────────────────────────────────────────
  const { player, getPlayerId, getDisplayName } = usePlayerProfile();
  const { calculateElo, getTierForRating } = useRankSystem();
  const { streak, recordWin, recordLoss } = useStreakTracker();
  const { entries: leaderboard, submitScore } = useLeaderboard({ gameSlug: GAME_SLUG });
  const dailyChallenge = useDailyChallenge({ gameSlug: GAME_SLUG });

  // ─── Game state ───────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [mode, setMode] = useState<GameMode>('solo');
  const [currentSet, setCurrentSet] = useState<AnagramSet | null>(null);
  const [displayLetters, setDisplayLetters] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Local mode state
  const [p1Score, setP1Score] = useState(0);
  const [p1Words, setP1Words] = useState<FoundWord[]>([]);
  const [p2Score, setP2Score] = useState(0);
  const [p2Words, setP2Words] = useState<FoundWord[]>([]);
  const [localPlayer, setLocalPlayer] = useState<1 | 2>(1);

  // Online mode state
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentWordCount, setOpponentWordCount] = useState(0);
  const [onlineSetIndex, setOnlineSetIndex] = useState(-1);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const foundWordsSetRef = useRef<Set<string>>(new Set());

  // ─── Online room ──────────────────────────────────────────────────────────
  const room = useGameRoom({
    gameSlug: GAME_SLUG,
    playerName: getDisplayName(),
    onPlayerJoined: (name) => {
      toast.success(`${name} joined the room!`);
    },
    onGameStart: (payload) => {
      const idx = payload.setIndex as number;
      setOnlineSetIndex(idx);
      const set = ANAGRAM_SETS[idx];
      setCurrentSet(set);
      setDisplayLetters(shuffleArray(set.letters));
      setPhase('countdown');
    },
    onBroadcast: (event, payload) => {
      if (event === 'score_update') {
        setOpponentScore(payload.score as number);
        setOpponentWordCount(payload.wordCount as number);
      }
      if (event === 'game_finished') {
        // Opponent finished — we might still be playing
        setOpponentScore(payload.score as number);
        setOpponentWordCount(payload.wordCount as number);
      }
    },
  });

  // ─── Sound effects (simple audio context) ─────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(
    (freq: number, duration: number, type: OscillatorType = 'sine') => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = 0.15;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // audio not available
      }
    },
    [soundEnabled]
  );

  // ─── Initialize a game ────────────────────────────────────────────────────
  const initGame = useCallback(
    (set: AnagramSet) => {
      setCurrentSet(set);
      setDisplayLetters(shuffleArray(set.letters));
      setFoundWords([]);
      setScore(0);
      setTimeLeft(GAME_DURATION);
      setInputValue('');
      setFeedback(null);
      foundWordsSetRef.current = new Set();
    },
    []
  );

  // ─── Start solo game ──────────────────────────────────────────────────────
  const startSolo = useCallback(() => {
    setMode('solo');
    initGame(pickRandomSet());
    setPhase('countdown');
  }, [initGame]);

  // ─── Start daily challenge ────────────────────────────────────────────────
  const startDaily = useCallback(() => {
    setMode('solo');
    const idx = getDailySetIndex();
    initGame(ANAGRAM_SETS[idx]);
    setPhase('countdown');
  }, [initGame]);

  // ─── Start local game ─────────────────────────────────────────────────────
  const startLocal = useCallback(() => {
    setMode('local');
    setLocalPlayer(1);
    setP1Score(0);
    setP1Words([]);
    setP2Score(0);
    setP2Words([]);
    initGame(pickRandomSet());
    setPhase('countdown');
  }, [initGame]);

  // ─── Start online game (host starts) ──────────────────────────────────────
  const startOnline = useCallback(() => {
    const idx = Math.floor(Math.random() * ANAGRAM_SETS.length);
    room.broadcast('game_start', { setIndex: idx });
    setOnlineSetIndex(idx);
    const set = ANAGRAM_SETS[idx];
    setCurrentSet(set);
    setDisplayLetters(shuffleArray(set.letters));
    setPhase('countdown');
  }, [room]);

  // ─── Handle mode selection ────────────────────────────────────────────────
  const handleModeSelect = useCallback(
    (selectedMode: GameMode) => {
      setMode(selectedMode);
      if (selectedMode === 'solo') {
        startSolo();
      } else if (selectedMode === 'local') {
        startLocal();
      } else if (selectedMode === 'online') {
        setPhase('lobby');
      }
    },
    [startSolo, startLocal]
  );

  // ─── Shuffle displayed letters ────────────────────────────────────────────
  const shuffleLetters = useCallback(() => {
    if (!currentSet) return;
    setDisplayLetters(shuffleArray(currentSet.letters));
    playSound(300, 0.1, 'triangle');
  }, [currentSet, playSound]);

  // ─── Submit a word ────────────────────────────────────────────────────────
  const submitWord = useCallback(() => {
    if (!currentSet || !inputValue.trim()) return;

    const word = inputValue.trim().toLowerCase();
    setInputValue('');

    // Clear previous feedback
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Check duplicate
    if (foundWordsSetRef.current.has(word)) {
      setFeedback({ type: 'error', message: 'Already found!' });
      playSound(200, 0.2, 'sawtooth');
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 1500);
      return;
    }

    // Check validity
    if (!isValidWord(word, currentSet.letters)) {
      setFeedback({ type: 'error', message: 'Not valid!' });
      playSound(200, 0.2, 'sawtooth');
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 1500);
      return;
    }

    // Valid word!
    const points = getWordPoints(word);
    const newWord: FoundWord = { word, points, timestamp: Date.now() };

    foundWordsSetRef.current.add(word);
    setFoundWords((prev) => [newWord, ...prev]);
    setScore((prev) => prev + points);

    setFeedback({ type: 'success', message: `+${points} points!` });
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 1200);

    // Sound based on word length
    const freqs = [0, 0, 0, 523, 659, 784, 988, 1175];
    playSound(freqs[word.length] || 523, 0.15, 'sine');

    // Broadcast score in online mode
    if (mode === 'online') {
      room.broadcast('score_update', {
        score: score + points,
        wordCount: foundWordsSetRef.current.size,
      });
    }

    // Refocus input
    inputRef.current?.focus();
  }, [currentSet, inputValue, mode, room, score, playSound]);

  // ─── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'playing-p2') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        // Tick sound in last 10 seconds
        if (prev <= 11 && prev > 1) {
          playSound(880, 0.05, 'sine');
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, playSound]);

  // ─── Handle time up ───────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft > 0) return;
    if (phase !== 'playing' && phase !== 'playing-p2') return;

    playSound(330, 0.4, 'sawtooth');

    if (mode === 'local' && phase === 'playing' && localPlayer === 1) {
      // P1 finished, save scores
      setP1Score(score);
      setP1Words([...foundWords]);
      setPhase('waiting-p2');
      return;
    }

    if (mode === 'local' && phase === 'playing-p2') {
      // P2 finished
      setP2Score(score);
      setP2Words([...foundWords]);
      setPhase('finished');
      return;
    }

    // Solo or online — game over
    if (mode === 'online') {
      room.broadcast('game_finished', {
        score,
        wordCount: foundWordsSetRef.current.size,
      });
    }

    setPhase('finished');

    // Submit to leaderboard
    submitScore({
      playerId: getPlayerId(),
      playerName: getDisplayName(),
      gameSlug: GAME_SLUG,
      score,
      gameMode: mode,
      metadata: {
        wordsFound: foundWordsSetRef.current.size,
        totalPossible: currentSet?.validWords.length || 0,
      },
    });

    // Track streak
    if (score > 0) {
      recordWin();
    } else {
      recordLoss();
    }
  }, [
    timeLeft,
    phase,
    mode,
    localPlayer,
    score,
    foundWords,
    currentSet,
    room,
    submitScore,
    getPlayerId,
    getDisplayName,
    recordWin,
    recordLoss,
    playSound,
  ]);

  // ─── Start P2 turn (local) ────────────────────────────────────────────────
  const startP2Turn = useCallback(() => {
    if (!currentSet) return;
    setLocalPlayer(2);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setInputValue('');
    setFeedback(null);
    foundWordsSetRef.current = new Set();
    setDisplayLetters(shuffleArray(currentSet.letters));
    setPhase('countdown');
  }, [currentSet]);

  // ─── Play again ───────────────────────────────────────────────────────────
  const playAgain = useCallback(() => {
    if (mode === 'local') {
      startLocal();
    } else if (mode === 'online') {
      setPhase('lobby');
      setScore(0);
      setOpponentScore(0);
      setOpponentWordCount(0);
    } else {
      startSolo();
    }
  }, [mode, startSolo, startLocal]);

  // ─── Countdown complete handler ───────────────────────────────────────────
  const handleCountdownComplete = useCallback(() => {
    if (mode === 'local' && localPlayer === 2) {
      setPhase('playing-p2');
    } else {
      setPhase('playing');
    }
    inputRef.current?.focus();
  }, [mode, localPlayer]);

  // ─── Handle input key press ───────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitWord();
      }
    },
    [submitWord]
  );

  // ─── Determine winner for local/online modes ─────────────────────────────
  const getWinState = useMemo(() => {
    if (phase !== 'finished') return { won: false, isDraw: false };
    if (mode === 'local') {
      if (p1Score > p2Score) return { won: true, isDraw: false };
      if (p1Score < p2Score) return { won: false, isDraw: false };
      return { won: false, isDraw: true };
    }
    if (mode === 'online') {
      if (score > opponentScore) return { won: true, isDraw: false };
      if (score < opponentScore) return { won: false, isDraw: false };
      return { won: false, isDraw: true };
    }
    // Solo — always "won" if scored anything
    return { won: score > 0, isDraw: false };
  }, [phase, mode, score, p1Score, p2Score, opponentScore]);

  // ─── Memoize final score for display ──────────────────────────────────────
  const finalPlayerScore = mode === 'local' ? p1Score : score;
  const finalOpponentScore = mode === 'local' ? p2Score : mode === 'online' ? opponentScore : undefined;

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── RENDER ───────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <Layout>
      <SEOHead
        title="Anagram Blitz - TechTrendi Arcade"
        description="Unscramble letters and find as many words as possible in 60 seconds. Play solo, daily challenges, local or online multiplayer."
      />

      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/30 py-4 sm:py-8">
        <div className="container max-w-2xl mx-auto px-4">

          {/* ─── Header ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/arcade"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Arcade</span>
            </Link>

            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Anagram Blitz
              </h1>
              <Shuffle className="w-5 h-5 text-amber-500" />
            </div>

            <div className="flex items-center gap-2">
              {player && (
                <RankBadge
                  tier={getTierForRating(player.eloRating)}
                  rating={player.eloRating}
                  showRating
                />
              )}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* ─── MENU PHASE ──────────────────────────────────────────── */}
          {phase === 'menu' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Hero card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 text-white text-center">
                <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute bottom-2 left-6 w-16 h-16 rounded-full bg-white/5" />

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center"
                >
                  <Shuffle className="w-10 h-10" />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-black mb-2">Anagram Blitz</h2>
                <p className="text-white/80 text-sm sm:text-base max-w-sm mx-auto">
                  Unscramble 7 letters into as many words as you can in 60 seconds.
                  Longer words score more points!
                </p>

                <div className="flex justify-center gap-6 mt-6 text-xs font-bold uppercase tracking-wide">
                  <div>
                    <div className="text-2xl font-black">3+</div>
                    <div className="text-white/60">Letters</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black">60s</div>
                    <div className="text-white/60">Timer</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black">1600</div>
                    <div className="text-white/60">Max Pts</div>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="h-14 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"
                  onClick={startSolo}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Quick Play
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 text-base border-2 border-amber-500/30 hover:bg-amber-500/10"
                  onClick={startDaily}
                  disabled={dailyChallenge.alreadyPlayed}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {dailyChallenge.alreadyPlayed ? 'Done Today' : 'Daily'}
                </Button>
              </div>

              {/* All modes */}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setPhase('mode-select')}
              >
                All Game Modes
              </Button>

              {/* How to Play */}
              <div className="rounded-2xl bg-muted/50 border border-muted p-5 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  How to Play
                </h3>
                <div className="space-y-2.5 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold shrink-0 mt-0.5">1</span>
                    <span>You get <strong className="text-foreground">7 scrambled letters</strong>. Make as many words as possible in 60 seconds.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold shrink-0 mt-0.5">2</span>
                    <span>Words must be <strong className="text-foreground">3+ letters</strong>. Tap letter tiles or type on keyboard.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-500 text-xs font-bold shrink-0 mt-0.5">3</span>
                    <span><strong className="text-foreground">Longer words = way more points:</strong> 3 letters = 100, 7 letters = 1,600!</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold shrink-0 mt-0.5">4</span>
                    <span>Hit <strong className="text-foreground">Shuffle</strong> to rearrange the letters and spot new words.</span>
                  </div>
                </div>
              </div>

              {/* Scoring guide */}
              <div className="rounded-2xl bg-muted/50 p-4">
                <h3 className="font-bold text-sm mb-3">Scoring</h3>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { len: 3, pts: 100 },
                    { len: 4, pts: 200 },
                    { len: 5, pts: 400 },
                    { len: 6, pts: 800 },
                    { len: 7, pts: 1600 },
                  ].map(({ len, pts }) => (
                    <div key={len} className="bg-background rounded-lg p-2">
                      <div className="font-black text-amber-500">{pts}</div>
                      <div className="text-muted-foreground">{len} letters</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak */}
              {streak.current > 0 && (
                <div className="flex justify-center">
                  <StreakIndicator streak={streak.current} />
                </div>
              )}

              {/* Leaderboard */}
              <Leaderboard gameSlug={GAME_SLUG} />
            </motion.div>
          )}

          {/* ─── MODE SELECT PHASE ───────────────────────────────────── */}
          {phase === 'mode-select' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <button
                onClick={() => setPhase('menu')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-xl font-bold text-center mb-4">Choose Mode</h2>
              <GameModeSelector onSelect={handleModeSelect} />
            </motion.div>
          )}

          {/* ─── LOBBY PHASE (online) ────────────────────────────────── */}
          {phase === 'lobby' && (
            <RoomLobby
              roomCode={room.roomCode}
              isHost={room.isHost}
              opponentJoined={room.opponentJoined}
              onCreateRoom={room.createRoom}
              onJoinRoom={room.joinRoom}
              onStartGame={startOnline}
              onBack={() => setPhase('menu')}
            />
          )}

          {/* ─── COUNTDOWN PHASE ─────────────────────────────────────── */}
          {phase === 'countdown' && (
            <>
              {mode === 'local' && localPlayer === 2 && (
                <div className="text-center mb-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <p className="text-lg font-bold text-blue-500">Player 2 — Your Turn!</p>
                  <p className="text-sm text-muted-foreground">Same letters, same rules. Beat Player 1!</p>
                </div>
              )}
              <CountdownOverlay onComplete={handleCountdownComplete} />
            </>
          )}

          {/* ─── PLAYING PHASE ───────────────────────────────────────── */}
          {(phase === 'playing' || phase === 'playing-p2') && currentSet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Top bar: timer, score, word count */}
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl font-black tabular-nums text-amber-500">
                    {score}
                  </div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>

                <CircularTimer timeLeft={timeLeft} maxTime={GAME_DURATION} />

                <div className="text-center">
                  <div className="text-3xl font-black tabular-nums">
                    {foundWords.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    / {currentSet.validWords.length}
                  </div>
                </div>
              </div>

              {/* Online opponent score */}
              {mode === 'online' && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Wifi className="w-3 h-3" />
                  Opponent: {opponentScore} pts ({opponentWordCount} words)
                </div>
              )}

              {/* Local player indicator */}
              {mode === 'local' && (
                <div className="text-center text-sm font-bold text-blue-500">
                  Player {localPlayer}
                </div>
              )}

              {/* Letter tiles */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                {displayLetters.map((letter, i) => (
                  <LetterTile
                    key={`${letter}-${i}`}
                    letter={letter}
                    used={false}
                    index={i}
                    onClick={() => {
                      setInputValue((prev) => prev + letter.toLowerCase());
                      inputRef.current?.focus();
                    }}
                  />
                ))}
              </div>

              {/* Shuffle button */}
              <div className="flex justify-center">
                <button
                  onClick={shuffleLetters}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle
                </button>
              </div>

              {/* Input */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) =>
                    setInputValue(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="Type a word..."
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className={cn(
                    'w-full h-14 px-4 pr-24 rounded-2xl text-lg font-semibold tracking-wide',
                    'bg-muted/50 border-2 border-muted focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                    'outline-none transition-all duration-200',
                    'placeholder:text-muted-foreground/40'
                  )}
                />
                <Button
                  onClick={submitWord}
                  disabled={!inputValue.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl"
                >
                  Submit
                </Button>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {feedback && (
                  <InputFeedback type={feedback.type} message={feedback.message} />
                )}
              </AnimatePresence>

              {/* Found words - sorted by points descending */}
              {foundWords.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Found Words ({foundWords.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {[...foundWords]
                      .sort((a, b) => b.points - a.points)
                      .map((w, i) => (
                        <WordChip
                          key={w.word}
                          word={w.word}
                          points={w.points}
                          isNew={i === 0 && w.word === foundWords[0]?.word}
                        />
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── WAITING FOR P2 (local) ──────────────────────────────── */}
          {phase === 'waiting-p2' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-black mb-1">Player 1 Done!</h2>
                <p className="text-muted-foreground">
                  Score: <span className="font-bold text-amber-500">{p1Score}</span> ({p1Words.length} words)
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                Pass the device to Player 2. They will get the same letters.
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white"
                onClick={startP2Turn}
              >
                Start Player 2 Turn
              </Button>
            </motion.div>
          )}

          {/* ─── FINISHED PHASE ──────────────────────────────────────── */}
          {phase === 'finished' && currentSet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <GameOverScreen
                won={getWinState.won}
                isDraw={getWinState.isDraw}
                score={finalPlayerScore}
                opponentScore={finalOpponentScore}
                streak={streak.current}
                onPlayAgain={playAgain}
                onBackToArcade={() => navigate('/arcade')}
                playerName={mode === 'local' ? 'Player 1' : getDisplayName()}
                opponentName={mode === 'local' ? 'Player 2' : undefined}
              />

              {/* Score breakdown */}
              <div className="rounded-2xl border bg-card p-4">
                <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  {mode === 'local' ? 'Player 1 Results' : 'Results'}
                </h3>
                <ScoreBreakdown
                  foundWords={mode === 'local' ? p1Words : foundWords}
                  allValidWords={currentSet.validWords}
                  letters={currentSet.letters}
                />
              </div>

              {/* P2 breakdown for local mode */}
              {mode === 'local' && (
                <div className="rounded-2xl border bg-card p-4">
                  <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-blue-500" />
                    Player 2 Results
                  </h3>
                  <ScoreBreakdown
                    foundWords={p2Words}
                    allValidWords={currentSet.validWords}
                    letters={currentSet.letters}
                  />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
