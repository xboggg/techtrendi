// ─── Word Chain Battle — Turn-based last-letter word chain game ───────────────
// Modes: Solo (vs AI), Local (2P same device), Online (Supabase Realtime)
// Best of 3 rounds. Timer shrinks each turn. Speed + length bonuses.

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Link2, Clock, Trophy, Zap, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { GameModeSelector } from '@/components/arcade/GameModeSelector';
import { RoomLobby } from '@/components/arcade/RoomLobby';
import { CountdownOverlay } from '@/components/arcade/CountdownOverlay';
import { GameOverScreen } from '@/components/arcade/GameOverScreen';
import { RankBadge } from '@/components/arcade/RankBadge';
import { StreakIndicator } from '@/components/arcade/StreakIndicator';
import { useGameRoom } from '@/lib/arcade/useGameRoom';
import { useGameAI } from '@/lib/arcade/useGameAI';
import { usePlayerProfile } from '@/lib/arcade/usePlayerProfile';
import { useStreakTracker } from '@/lib/arcade/useStreakTracker';
import { useRankSystem } from '@/lib/arcade/useRankSystem';
import { useLeaderboard } from '@/lib/arcade/useLeaderboard';
import { WORD_SET, WORDS_BY_LETTER } from '@/data/arcade/wordlist';
import type { GameMode } from '@/lib/arcade/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type GamePhase = 'menu' | 'difficulty' | 'lobby' | 'countdown' | 'playing' | 'round-end' | 'game-over';

interface PlayedWord {
  word: string;
  player: 0 | 1; // 0 = P1/host, 1 = P2/AI/guest
  points: number;
  timestamp: number;
}

interface RoundResult {
  winner: 0 | 1;
  loser: 0 | 1;
  reason: 'timeout' | 'invalid' | 'duplicate' | 'wrong-letter';
  failedWord?: string;
  wordsPlayed: number;
  p1Score: number;
  p2Score: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const INITIAL_TURN_TIME = 15;
const MIN_TURN_TIME = 5;
const ROUNDS_TO_WIN = 2; // best of 3
const MAX_ROUNDS = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidWord(word: string): boolean {
  return WORD_SET.has(word.toLowerCase());
}

function getWordPoints(word: string, timeLeft: number, turnTime: number): number {
  const len = word.length;
  let base = 1;
  if (len > 9) base = 3;
  else if (len > 6) base = 2;

  const elapsed = turnTime - timeLeft;
  let multiplier = 1.0;
  if (elapsed < 3) multiplier = 1.5;
  else if (elapsed < 5) multiplier = 1.2;

  return Math.round(base * multiplier);
}

function getAIWord(
  startLetter: string,
  usedWords: Set<string>,
  difficulty: 'easy' | 'hard'
): string | null {
  const candidates = WORDS_BY_LETTER[startLetter.toLowerCase()] || [];
  const available = candidates.filter((w) => !usedWords.has(w));

  if (available.length === 0) return null;

  if (difficulty === 'easy') {
    // Prefer short common words
    const short = available.filter((w) => w.length <= 6);
    const pool = short.length > 0 ? short : available;
    return pool[Math.floor(Math.random() * pool.length)];
  } else {
    // Prefer longer words
    const long = available.filter((w) => w.length > 6);
    const pool = long.length > 0 ? long : available;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

// ─── Circular Timer Component ────────────────────────────────────────────────

function CircularTimer({
  timeLeft,
  maxTime,
  size = 72,
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
    progress > 0.5
      ? 'text-green-500'
      : progress > 0.25
      ? 'text-yellow-500'
      : 'text-red-500';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          className="stroke-muted/30"
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
          className={cn(color, 'transition-all duration-200')}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-lg font-black tabular-nums', textColor)}>
          {Math.ceil(timeLeft)}
        </span>
      </div>
    </div>
  );
}

// ─── Word Chain Display ──────────────────────────────────────────────────────

function WordChain({
  words,
  currentPlayer,
}: {
  words: PlayedWord[];
  currentPlayer: 0 | 1;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [words]);

  if (words.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Type the first word to begin the chain!
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto py-3 px-2 scrollbar-thin"
    >
      <AnimatePresence mode="popLayout">
        {words.map((entry, i) => {
          const lastLetter = entry.word[entry.word.length - 1];
          const isP1 = entry.player === 0;
          return (
            <motion.div
              key={`${entry.word}-${i}`}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-0.5"
            >
              {i > 0 && (
                <span className="text-muted-foreground mx-1 text-xs select-none">
                  &rarr;
                </span>
              )}
              <span
                className={cn(
                  'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold',
                  'border shadow-sm',
                  isP1
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-400/40 text-orange-700 dark:text-orange-300'
                    : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/40 text-blue-700 dark:text-blue-300'
                )}
              >
                {entry.word.slice(0, -1)}
                <span className="text-base font-black uppercase">
                  {lastLetter}
                </span>
                {entry.points > 1 && (
                  <span className="ml-1 text-xs opacity-70">+{entry.points}</span>
                )}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── Player Score Display ────────────────────────────────────────────────────

function PlayerScore({
  name,
  score,
  isActive,
  roundsWon,
  color,
}: {
  name: string;
  score: number;
  isActive: boolean;
  roundsWon: number;
  color: 'orange' | 'blue';
}) {
  const colors = {
    orange: {
      bg: 'from-orange-500 to-amber-500',
      ring: 'ring-orange-400',
      text: 'text-orange-500',
      dot: 'bg-orange-500',
    },
    blue: {
      bg: 'from-blue-500 to-cyan-500',
      ring: 'ring-blue-400',
      text: 'text-blue-500',
      dot: 'bg-blue-500',
    },
  };

  const c = colors[color];

  return (
    <motion.div
      animate={isActive ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 0.6, repeat: isActive ? Infinity : 0 }}
      className={cn(
        'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
        isActive
          ? `bg-gradient-to-b ${c.bg}/10 ring-2 ${c.ring}/50 shadow-lg`
          : 'opacity-60'
      )}
    >
      <div className="flex items-center gap-1.5">
        {isActive && (
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className={cn('w-2 h-2 rounded-full', c.dot)}
          />
        )}
        <span className="text-xs font-semibold truncate max-w-[80px]">{name}</span>
      </div>
      <span className="text-2xl font-black tabular-nums">{score}</span>
      <div className="flex gap-1">
        {Array.from({ length: MAX_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full border',
              i < roundsWon
                ? `${c.dot} border-transparent`
                : 'border-muted-foreground/30'
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Required Letter Badge ───────────────────────────────────────────────────

function RequiredLetterBadge({ letter }: { letter: string | null }) {
  if (!letter) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className="flex items-center gap-2 justify-center"
    >
      <span className="text-sm text-muted-foreground">Next word must start with</span>
      <motion.span
        animate={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white text-2xl font-black uppercase shadow-lg shadow-orange-500/30"
      >
        {letter}
      </motion.span>
    </motion.div>
  );
}

// ─── Round End Overlay ───────────────────────────────────────────────────────

function RoundEndOverlay({
  result,
  roundNumber,
  p1Name,
  p2Name,
  onContinue,
}: {
  result: RoundResult;
  roundNumber: number;
  p1Name: string;
  p2Name: string;
  onContinue: () => void;
}) {
  const loserName = result.loser === 0 ? p1Name : p2Name;
  const winnerName = result.winner === 0 ? p1Name : p2Name;

  const reasonText = {
    timeout: `${loserName} ran out of time!`,
    invalid: `${loserName} played an invalid word${result.failedWord ? ` ("${result.failedWord}")` : ''}!`,
    duplicate: `${loserName} repeated a word${result.failedWord ? ` ("${result.failedWord}")` : ''}!`,
    'wrong-letter': `${loserName} started with the wrong letter${result.failedWord ? ` ("${result.failedWord}")` : ''}!`,
  };

  useEffect(() => {
    const timer = setTimeout(onContinue, 3500);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-sm mx-4 p-6 rounded-2xl bg-background border shadow-2xl text-center space-y-3"
      >
        <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
          Round {roundNumber}
        </div>
        <div className="text-4xl font-black text-yellow-500">{winnerName} wins!</div>
        <div className="text-sm text-muted-foreground">{reasonText[result.reason]}</div>
        <div className="flex justify-center gap-8 pt-2">
          <div className="text-center">
            <div className="text-xl font-bold">{result.p1Score}</div>
            <div className="text-xs text-muted-foreground">{p1Name}</div>
          </div>
          <div className="text-2xl text-muted-foreground">vs</div>
          <div className="text-center">
            <div className="text-xl font-bold">{result.p2Score}</div>
            <div className="text-xs text-muted-foreground">{p2Name}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground pt-1">
          {result.wordsPlayed} words played
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Difficulty Selector ─────────────────────────────────────────────────────

function DifficultySelector({
  onSelect,
  onBack,
}: {
  onSelect: (d: 'easy' | 'hard') => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h3 className="text-xl font-bold text-center">Choose Difficulty</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('easy')}
          className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-transform"
        >
          <span className="text-3xl mb-2">😊</span>
          <span className="text-lg font-bold">Easy</span>
          <span className="text-xs text-white/80">Short, common words</span>
        </button>
        <button
          onClick={() => onSelect('hard')}
          className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-transform"
        >
          <span className="text-3xl mb-2">🔥</span>
          <span className="text-lg font-bold">Hard</span>
          <span className="text-xs text-white/80">Longer, trickier words</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function WordChainBattle() {
  const navigate = useNavigate();
  const { player, getPlayerId, getDisplayName } = usePlayerProfile();
  const { streak, recordWin, recordLoss } = useStreakTracker();
  const { calculateElo, getTierForRating } = useRankSystem();
  const { submitScore } = useLeaderboard({ gameSlug: 'word-chain-battle' });
  const aiHook = useGameAI({ difficulty: 0.5, baseResponseTime: 3000 });

  // ── Game State ───────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [mode, setMode] = useState<GameMode>('solo');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'hard'>('easy');

  // Round tracking
  const [currentRound, setCurrentRound] = useState(1);
  const [p1RoundsWon, setP1RoundsWon] = useState(0);
  const [p2RoundsWon, setP2RoundsWon] = useState(0);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  // In-round state
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [words, setWords] = useState<PlayedWord[]>([]);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [turnNumber, setTurnNumber] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState(INITIAL_TURN_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnTimeRef = useRef(INITIAL_TURN_TIME);

  // Input
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Names
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [localP2Name, setLocalP2Name] = useState('Player 2');

  // Online state
  const [onlineOpponentName, setOnlineOpponentName] = useState('Opponent');

  // AI timer ref
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sound
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ── Derived State ────────────────────────────────────────────────────────

  const requiredLetter = useMemo(() => {
    if (words.length === 0) return null;
    const lastWord = words[words.length - 1].word;
    return lastWord[lastWord.length - 1].toUpperCase();
  }, [words]);

  const currentTurnTime = useMemo(() => {
    return Math.max(MIN_TURN_TIME, INITIAL_TURN_TIME - turnNumber);
  }, [turnNumber]);

  // ── Online Room ──────────────────────────────────────────────────────────

  const gameRoom = useGameRoom({
    gameSlug: 'word-chain-battle',
    playerName: getDisplayName(),
    onPlayerJoined: (name) => {
      setOnlineOpponentName(name);
    },
    onGameStart: () => {
      setPhase('countdown');
    },
    onBroadcast: (event, payload) => {
      if (event === 'word_played') {
        handleOnlineWordReceived(payload as { word: string; player: number; points: number });
      } else if (event === 'round_lost') {
        // Remote player timed out or failed
        handleRemotePlayerFailed(payload as { reason: string; failedWord?: string });
      }
    },
  });

  // ── Timer Logic ──────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const turnTime = Math.max(MIN_TURN_TIME, INITIAL_TURN_TIME - turnNumber);
    turnTimeRef.current = turnTime;
    setTimeLeft(turnTime);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 0.1;
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return next;
      });
    }, 100);
  }, [turnNumber]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Handle Timer Running Out ─────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft > 0) return;

    stopTimer();

    // Current player loses this round
    if (mode === 'online' && currentPlayer === 0) {
      // We timed out, notify opponent
      gameRoom.broadcast('round_lost', { reason: 'timeout' });
    }

    endRound(currentPlayer === 0 ? 1 : 0, 'timeout');
  }, [timeLeft, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AI Turn ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' || mode !== 'solo' || currentPlayer !== 1) return;

    const letter = requiredLetter?.toLowerCase() || null;
    if (!letter && words.length > 0) return;

    const responseTime = aiDifficulty === 'easy'
      ? 2000 + Math.random() * 3000
      : 800 + Math.random() * 1500;

    aiTimeoutRef.current = setTimeout(() => {
      if (letter) {
        const aiWord = getAIWord(letter, usedWords, aiDifficulty);
        if (aiWord) {
          const points = getWordPoints(aiWord, timeLeft - responseTime / 1000, turnTimeRef.current);
          playWord(aiWord, 1, points);
        } else {
          // AI cannot find a word — AI loses
          endRound(0, 'timeout');
        }
      } else {
        // First word of round — AI picks any word
        const letters = Object.keys(WORDS_BY_LETTER);
        const randomLetter = letters[Math.floor(Math.random() * letters.length)];
        const aiWord = getAIWord(randomLetter, usedWords, aiDifficulty);
        if (aiWord) {
          const points = getWordPoints(aiWord, timeLeft - responseTime / 1000, turnTimeRef.current);
          playWord(aiWord, 1, points);
        }
      }
    }, responseTime);

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [phase, mode, currentPlayer, requiredLetter, aiDifficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Play a Word ──────────────────────────────────────────────────────────

  const playWord = useCallback(
    (word: string, playerIndex: 0 | 1, points: number) => {
      const entry: PlayedWord = {
        word: word.toLowerCase(),
        player: playerIndex,
        points,
        timestamp: Date.now(),
      };

      setWords((prev) => [...prev, entry]);
      setUsedWords((prev) => new Set(prev).add(word.toLowerCase()));

      if (playerIndex === 0) {
        setP1Score((prev) => prev + points);
      } else {
        setP2Score((prev) => prev + points);
      }

      // Next turn
      setTurnNumber((prev) => prev + 1);
      setCurrentPlayer(playerIndex === 0 ? 1 : 0);
      setInput('');
      setError('');

      // Restart timer for next player
      stopTimer();
      // Small delay before starting next timer
      setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        const nextTurnTime = Math.max(MIN_TURN_TIME, INITIAL_TURN_TIME - (turnNumber + 1));
        turnTimeRef.current = nextTurnTime;
        setTimeLeft(nextTurnTime);
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            const next = prev - 0.1;
            if (next <= 0) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return next;
          });
        }, 100);
      }, 300);

      // Focus input for next player
      setTimeout(() => inputRef.current?.focus(), 350);
    },
    [stopTimer, turnNumber]
  );

  // ── End Round ────────────────────────────────────────────────────────────

  const endRound = useCallback(
    (winner: 0 | 1, reason: RoundResult['reason'], failedWord?: string) => {
      stopTimer();
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);

      const result: RoundResult = {
        winner,
        loser: winner === 0 ? 1 : 0,
        reason,
        failedWord,
        wordsPlayed: words.length,
        p1Score,
        p2Score,
      };

      setRoundResult(result);

      if (winner === 0) {
        setP1RoundsWon((prev) => prev + 1);
      } else {
        setP2RoundsWon((prev) => prev + 1);
      }

      setPhase('round-end');
    },
    [stopTimer, words.length, p1Score, p2Score]
  );

  // ── Handle Submit ────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    const word = input.trim().toLowerCase();

    if (!word) return;

    // Validate word exists in dictionary
    if (!isValidWord(word)) {
      setError(`"${word}" is not a valid word!`);
      if (mode === 'online') {
        gameRoom.broadcast('round_lost', { reason: 'invalid', failedWord: word });
      }
      endRound(currentPlayer === 0 ? 1 : 0, 'invalid', word);
      return;
    }

    // Check duplicate
    if (usedWords.has(word)) {
      setError(`"${word}" was already used!`);
      if (mode === 'online') {
        gameRoom.broadcast('round_lost', { reason: 'duplicate', failedWord: word });
      }
      endRound(currentPlayer === 0 ? 1 : 0, 'duplicate', word);
      return;
    }

    // Check starting letter
    if (requiredLetter && word[0].toUpperCase() !== requiredLetter) {
      setError(`Word must start with "${requiredLetter}"!`);
      if (mode === 'online') {
        gameRoom.broadcast('round_lost', { reason: 'wrong-letter', failedWord: word });
      }
      endRound(currentPlayer === 0 ? 1 : 0, 'wrong-letter', word);
      return;
    }

    const points = getWordPoints(word, timeLeft, turnTimeRef.current);

    if (mode === 'online') {
      gameRoom.broadcast('word_played', { word, player: currentPlayer, points });
    }

    playWord(word, currentPlayer, points);
  }, [input, mode, currentPlayer, requiredLetter, usedWords, timeLeft, endRound, playWord, gameRoom]);

  // ── Online: Receive Word ─────────────────────────────────────────────────

  const handleOnlineWordReceived = useCallback(
    (payload: { word: string; player: number; points: number }) => {
      playWord(payload.word, payload.player as 0 | 1, payload.points);
    },
    [playWord]
  );

  // ── Online: Remote Player Failed ─────────────────────────────────────────

  const handleRemotePlayerFailed = useCallback(
    (payload: { reason: string; failedWord?: string }) => {
      // Remote player (P2 if we're host, P1 if we're guest) lost
      const localPlayer = gameRoom.isHost ? 0 : 1;
      endRound(localPlayer, payload.reason as RoundResult['reason'], payload.failedWord);
    },
    [gameRoom.isHost, endRound]
  );

  // ── Start New Round ──────────────────────────────────────────────────────

  const startNewRound = useCallback(() => {
    // Check if match is over
    const newP1Rounds = roundResult?.winner === 0 ? p1RoundsWon : p1RoundsWon;
    const newP2Rounds = roundResult?.winner === 1 ? p2RoundsWon : p2RoundsWon;

    if (newP1Rounds >= ROUNDS_TO_WIN || newP2Rounds >= ROUNDS_TO_WIN) {
      // Match over
      const matchWinner = newP1Rounds >= ROUNDS_TO_WIN ? 0 : 1;
      const won = matchWinner === 0;

      if (mode !== 'local') {
        if (won) recordWin();
        else recordLoss();

        const eloResult = calculateElo(
          player?.eloRating ?? 800,
          1000, // approximate opponent
          won,
          player?.totalGames ?? 0
        );

        submitScore({
          playerId: getPlayerId(),
          playerName: getDisplayName(),
          gameSlug: 'word-chain-battle',
          score: p1Score + p2Score,
          gameMode: mode,
          metadata: {
            rounds: currentRound,
            p1RoundsWon: newP1Rounds,
            p2RoundsWon: newP2Rounds,
          },
        });
      }

      setPhase('game-over');
      return;
    }

    // Start next round
    setCurrentRound((prev) => prev + 1);
    setWords([]);
    setUsedWords(new Set());
    setP1Score(0);
    setP2Score(0);
    setTurnNumber(0);
    setCurrentPlayer(currentRound % 2 === 0 ? 1 : 0); // alternate who goes first
    setInput('');
    setError('');
    setRoundResult(null);
    setPhase('countdown');
  }, [roundResult, p1RoundsWon, p2RoundsWon, currentRound, mode, player, p1Score, p2Score]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start Game ───────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    setPhase('playing');
    setCurrentPlayer(0);
    setWords([]);
    setUsedWords(new Set());
    setP1Score(0);
    setP2Score(0);
    setTurnNumber(0);
    setCurrentRound(1);
    setP1RoundsWon(0);
    setP2RoundsWon(0);
    setInput('');
    setError('');
    setRoundResult(null);
    startTimer();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [startTimer]);

  // ── Mode Selection ───────────────────────────────────────────────────────

  const handleModeSelect = useCallback(
    (selectedMode: GameMode) => {
      setMode(selectedMode);
      const displayName = getDisplayName();
      setP1Name(displayName);

      if (selectedMode === 'solo') {
        setP2Name(aiHook.aiName);
        setPhase('difficulty');
      } else if (selectedMode === 'local') {
        setP2Name('Player 2');
        setPhase('countdown');
      } else {
        setPhase('lobby');
      }
    },
    [getDisplayName, aiHook.aiName]
  );

  // ── Reset ────────────────────────────────────────────────────────────────

  const resetGame = useCallback(() => {
    stopTimer();
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    gameRoom.leaveRoom();
    setPhase('menu');
    setWords([]);
    setUsedWords(new Set());
    setP1Score(0);
    setP2Score(0);
    setTurnNumber(0);
    setCurrentRound(1);
    setP1RoundsWon(0);
    setP2RoundsWon(0);
    setInput('');
    setError('');
    setRoundResult(null);
  }, [stopTimer, gameRoom]);

  // ── Cleanup ──────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopTimer();
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [stopTimer]);

  // ── Keyboard Handler ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // ── Render ───────────────────────────────────────────────────────────────

  const matchWon = p1RoundsWon >= ROUNDS_TO_WIN;
  const matchLost = p2RoundsWon >= ROUNDS_TO_WIN;

  return (
    <Layout>
      <SEOHead
        title="Word Chain Battle - TechTrendi Arcade"
        description="Challenge opponents in a fast-paced last-letter word chain battle. Type words under pressure, earn bonus points for speed and length."
        canonical="https://techtrendi.com/arcade/word-chain-battle"
      />

      <div className="container py-4 sm:py-8 max-w-2xl mx-auto min-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link
            to="/arcade"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Arcade
          </Link>
          <div className="flex items-center gap-2">
            {player && (
              <RankBadge
                tier={player.rankTier}
                rating={player.eloRating}
                size="sm"
                showRating
              />
            )}
            {streak.current > 0 && <StreakIndicator streak={streak.current} />}
          </div>
        </div>

        {/* Title Section — shown only in menu/difficulty/lobby */}
        {(phase === 'menu' || phase === 'difficulty' || phase === 'lobby') && (
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white mb-3 shadow-lg shadow-orange-500/30"
            >
              <Link2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-black">Word Chain Battle</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Last letter word chain under pressure
            </p>
          </div>
        )}

        {/* ── Menu Phase ──────────────────────────────────────────────────── */}
        {phase === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <GameModeSelector onSelect={handleModeSelect} />

            {/* Rules Card */}
            <div className="rounded-2xl border bg-muted/30 p-4 sm:p-6 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" /> How to Play
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>Type a word. Your opponent must type a word starting with the <strong>last letter</strong> of your word.</li>
                <li>Timer shrinks each turn (15s down to 5s). Run out or play an invalid word and you lose the round.</li>
                <li>Best of 3 rounds wins the match.</li>
                <li>Longer words = more points. Faster answers = bonus multiplier.</li>
                <li>No repeated words allowed!</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* ── Difficulty Phase (Solo) ─────────────────────────────────────── */}
        {phase === 'difficulty' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DifficultySelector
              onSelect={(d) => {
                setAiDifficulty(d);
                setPhase('countdown');
              }}
              onBack={() => setPhase('menu')}
            />
          </motion.div>
        )}

        {/* ── Lobby Phase (Online) ────────────────────────────────────────── */}
        {phase === 'lobby' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RoomLobby
              roomCode={gameRoom.roomCode}
              isHost={gameRoom.isHost}
              opponentJoined={gameRoom.opponentJoined}
              opponentName={onlineOpponentName}
              onCreateRoom={gameRoom.createRoom}
              onJoinRoom={gameRoom.joinRoom}
              onStartGame={() => {
                setP2Name(onlineOpponentName);
                gameRoom.broadcast('game_start', {});
                setPhase('countdown');
              }}
              onBack={() => {
                gameRoom.leaveRoom();
                setPhase('menu');
              }}
            />
          </motion.div>
        )}

        {/* ── Countdown Phase ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {phase === 'countdown' && (
            <CountdownOverlay onComplete={startGame} />
          )}
        </AnimatePresence>

        {/* ── Playing Phase ───────────────────────────────────────────────── */}
        {phase === 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Score Bar */}
            <div className="flex items-center justify-between gap-2">
              <PlayerScore
                name={p1Name}
                score={p1Score}
                isActive={currentPlayer === 0}
                roundsWon={p1RoundsWon}
                color="orange"
              />

              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Round {currentRound}/{MAX_ROUNDS}
                </div>
                <CircularTimer timeLeft={timeLeft} maxTime={turnTimeRef.current} />
              </div>

              <PlayerScore
                name={p2Name}
                score={p2Score}
                isActive={currentPlayer === 1}
                roundsWon={p2RoundsWon}
                color="blue"
              />
            </div>

            {/* Required Letter */}
            <RequiredLetterBadge letter={requiredLetter} />

            {/* Word Chain */}
            <div className="rounded-2xl border bg-muted/20 min-h-[120px]">
              <WordChain words={words} currentPlayer={currentPlayer} />
            </div>

            {/* Turn Indicator */}
            <div className="text-center">
              <motion.div
                key={currentPlayer}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold',
                  currentPlayer === 0
                    ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                    : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                )}
              >
                {currentPlayer === 0 ? p1Name : p2Name}&apos;s turn
              </motion.div>
            </div>

            {/* Input Area */}
            {(mode !== 'solo' || currentPlayer === 0) &&
             (mode !== 'online' || (gameRoom.isHost ? currentPlayer === 0 : currentPlayer === 1)) && (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value.replace(/[^a-zA-Z]/g, ''));
                      setError('');
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      requiredLetter
                        ? `Type a word starting with "${requiredLetter}"...`
                        : 'Type any word to start...'
                    }
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className={cn(
                      'w-full h-14 sm:h-16 px-5 text-lg sm:text-xl font-semibold rounded-2xl',
                      'bg-background border-2 shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2',
                      'transition-all placeholder:text-muted-foreground/50',
                      error
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-primary/30 focus:ring-primary/50 focus:border-primary'
                    )}
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={!input.trim()}
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-md"
                  >
                    Play
                  </Button>
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-red-500 text-sm font-medium px-2"
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* AI / Opponent thinking indicator */}
            {((mode === 'solo' && currentPlayer === 1) ||
              (mode === 'online' && (gameRoom.isHost ? currentPlayer === 1 : currentPlayer === 0))) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-muted-foreground text-sm">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="flex gap-1"
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <span className="w-2 h-2 rounded-full bg-current" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 rounded-full bg-current" style={{ animationDelay: '0.4s' }} />
                  </motion.div>
                  {mode === 'solo' ? `${p2Name} is thinking...` : 'Opponent is thinking...'}
                </div>
              </motion.div>
            )}

            {/* Local mode: player swap reminder */}
            {mode === 'local' && (
              <div className="text-center text-xs text-muted-foreground">
                Pass the device to {currentPlayer === 0 ? p1Name : p2Name}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Round End Overlay ────────────────────────────────────────────── */}
        <AnimatePresence>
          {phase === 'round-end' && roundResult && (
            <RoundEndOverlay
              result={roundResult}
              roundNumber={currentRound}
              p1Name={p1Name}
              p2Name={p2Name}
              onContinue={startNewRound}
            />
          )}
        </AnimatePresence>

        {/* ── Game Over Phase ─────────────────────────────────────────────── */}
        {phase === 'game-over' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GameOverScreen
              won={matchWon}
              score={p1RoundsWon}
              opponentScore={p2RoundsWon}
              streak={matchWon ? streak.current : undefined}
              rankTier={player?.rankTier}
              newRating={player?.eloRating}
              onPlayAgain={resetGame}
              onShare={() => {
                const text = matchWon
                  ? `I won a Word Chain Battle on TechTrendi Arcade! ${p1RoundsWon}-${p2RoundsWon}`
                  : `Tough Word Chain Battle on TechTrendi Arcade. ${p1RoundsWon}-${p2RoundsWon}`;
                if (navigator.share) {
                  navigator.share({
                    title: 'Word Chain Battle',
                    text,
                    url: 'https://techtrendi.com/arcade/word-chain-battle',
                  });
                } else {
                  navigator.clipboard.writeText(text + ' https://techtrendi.com/arcade/word-chain-battle');
                }
              }}
              onBackToArcade={() => navigate('/arcade')}
              playerName={p1Name}
              opponentName={p2Name}
            />
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
