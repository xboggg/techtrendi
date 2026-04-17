// ─── Wordle Clone — TechTrendi Arcade ──────────────────────────────────────
// Solo / Daily Challenge / 1v1 Online / Local multiplayer
// 5-letter word guessing game with animations and stats tracking

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, BarChart3, Share2, Trophy, RotateCcw, X,
  Calendar, Users, Wifi, Bot, Gamepad2, Delete, CornerDownLeft, HelpCircle,
} from 'lucide-react';
import {
  GameModeSelector,
  CountdownOverlay,
  RoomLobby,
} from '@/components/arcade';
import { useGameRoom } from '@/lib/arcade/useGameRoom';
import { useLeaderboard } from '@/lib/arcade/useLeaderboard';
import { usePlayerProfile } from '@/lib/arcade/usePlayerProfile';
import { useStreakTracker } from '@/lib/arcade/useStreakTracker';
import {
  TARGET_WORDS, isValidWord, getRandomTarget, getDailyTarget,
} from '@/data/arcade/wordle-words';
import { toast } from 'sonner';
import type { GameMode } from '@/lib/arcade/types';

// ─── Types ──────────────────────────────────────────────────────────────────

type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

interface TileData {
  letter: string;
  state: LetterState;
}

type WordleMode = 'solo' | 'daily' | 'online' | 'local';

type GamePhase =
  | 'menu'
  | 'mode-select'
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'game-over';

interface WordleStats {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[]; // index 0 = solved in 1, etc.
}

interface LocalPlayerState {
  guesses: string[];
  board: TileData[][];
  currentRow: number;
  currentGuess: string;
  solved: boolean;
  failed: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const STATS_KEY = 'wordle_stats';
const DAILY_KEY = 'wordle_daily';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

const FLIP_DURATION = 300; // ms per tile
const FLIP_STAGGER = 150; // ms between tiles

// ─── Stats Persistence ──────────────────────────────────────────────────────

function loadStats(): WordleStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  };
}

function saveStats(stats: WordleStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch { /* ignore */ }
}

function loadDailyState(): { date: string; guesses: string[]; solved: boolean } | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const today = new Date().toISOString().split('T')[0];
      if (parsed.date === today) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function saveDailyState(date: string, guesses: string[], solved: boolean) {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify({ date, guesses, solved }));
  } catch { /* ignore */ }
}

// ─── Evaluation Logic ───────────────────────────────────────────────────────

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill('absent');
  const targetChars = target.split('');
  const guessChars = guess.split('');
  const used = Array(WORD_LENGTH).fill(false);

  // First pass: correct positions (green)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = 'correct';
      used[i] = true;
    }
  }

  // Second pass: present but wrong position (yellow)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!used[j] && guessChars[i] === targetChars[j]) {
        result[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

function buildBoardFromGuesses(guesses: string[], target: string): TileData[][] {
  const board: TileData[][] = [];
  for (let r = 0; r < MAX_GUESSES; r++) {
    if (r < guesses.length) {
      const states = evaluateGuess(guesses[r], target);
      board.push(
        guesses[r].split('').map((letter, i) => ({ letter, state: states[i] }))
      );
    } else {
      board.push(Array(WORD_LENGTH).fill(null).map(() => ({ letter: '', state: 'empty' as LetterState })));
    }
  }
  return board;
}

function buildKeyboardMap(board: TileData[][]): Record<string, LetterState> {
  const map: Record<string, LetterState> = {};
  for (const row of board) {
    for (const tile of row) {
      if (!tile.letter || tile.state === 'empty' || tile.state === 'tbd') continue;
      const letter = tile.letter.toUpperCase();
      const existing = map[letter];
      if (!existing || tile.state === 'correct' || (tile.state === 'present' && existing === 'absent')) {
        map[letter] = tile.state;
      }
    }
  }
  return map;
}

function generateEmojiGrid(board: TileData[][], rowCount: number): string {
  const emojiMap: Record<LetterState, string> = {
    correct: '🟩',
    present: '🟨',
    absent: '⬛',
    empty: '⬜',
    tbd: '⬜',
  };
  const lines: string[] = [];
  for (let r = 0; r < rowCount; r++) {
    lines.push(board[r].map(t => emojiMap[t.state]).join(''));
  }
  return lines.join('\n');
}

// ─── CSS Animation Styles ───────────────────────────────────────────────────

const animationStyles = `
@keyframes wordle-flip {
  0% { transform: perspective(400px) rotateX(0deg); }
  45% { transform: perspective(400px) rotateX(-90deg); }
  55% { transform: perspective(400px) rotateX(-90deg); }
  100% { transform: perspective(400px) rotateX(0deg); }
}
@keyframes wordle-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
@keyframes wordle-bounce {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-24px); }
  70% { transform: translateY(-6px); }
}
@keyframes wordle-pop {
  0% { transform: scale(1); border-color: inherit; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes wordle-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes wordle-win-dance {
  0%, 100% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-20px) scale(1.05); }
  50% { transform: translateY(0) scale(1); }
  75% { transform: translateY(-10px) scale(1.02); }
}
.wordle-flip {
  animation: wordle-flip 0.5s ease-in-out forwards;
  transform-style: preserve-3d;
}
.wordle-shake {
  animation: wordle-shake 0.5s ease-in-out;
}
.wordle-bounce {
  animation: wordle-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.wordle-pop {
  animation: wordle-pop 0.12s ease-in-out;
}
.wordle-slide-up {
  animation: wordle-slide-up 0.3s ease-out forwards;
}
.wordle-win-dance {
  animation: wordle-win-dance 0.8s ease-in-out forwards;
}
.wordle-game-bg {
  background-image: radial-gradient(circle at 20% 50%, rgba(34,197,94,0.04) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(234,179,8,0.04) 0%, transparent 50%),
                    radial-gradient(circle at 50% 80%, rgba(99,102,241,0.03) 0%, transparent 50%);
}
.dark .wordle-game-bg {
  background-image: radial-gradient(circle at 20% 50%, rgba(34,197,94,0.06) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(234,179,8,0.04) 0%, transparent 50%),
                    radial-gradient(circle at 50% 80%, rgba(99,102,241,0.05) 0%, transparent 50%);
}
`;

// ─── Tile Component ─────────────────────────────────────────────────────────

function Tile({
  letter,
  state,
  flipDelay,
  isRevealing,
  bounceDelay,
  isBouncing,
}: {
  letter: string;
  state: LetterState;
  flipDelay?: number;
  isRevealing?: boolean;
  bounceDelay?: number;
  isBouncing?: boolean;
}) {
  const [revealed, setRevealed] = useState(!isRevealing);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (!isRevealing) {
      setRevealed(true);
      return;
    }
    const t1 = setTimeout(() => setFlipping(true), flipDelay || 0);
    const t2 = setTimeout(() => {
      setRevealed(true);
      setFlipping(false);
    }, (flipDelay || 0) + FLIP_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isRevealing, flipDelay]);

  const bgColor = revealed
    ? state === 'correct'
      ? 'bg-green-600 border-green-600 text-white'
      : state === 'present'
        ? 'bg-yellow-500 border-yellow-500 text-white'
        : state === 'absent'
          ? 'bg-gray-600 border-gray-600 text-white dark:bg-gray-700 dark:border-gray-700'
          : 'bg-transparent border-gray-300 dark:border-gray-600'
    : letter
      ? 'bg-transparent border-gray-500 dark:border-gray-400'
      : 'bg-transparent border-gray-300 dark:border-gray-600';

  return (
    <div
      className={cn(
        'w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] md:w-[62px] md:h-[62px]',
        'border-2 rounded-md flex items-center justify-center',
        'text-2xl sm:text-3xl font-bold uppercase select-none',
        'transition-colors duration-100',
        bgColor,
        flipping && 'wordle-flip',
        isBouncing && 'wordle-win-dance',
        letter && !revealed && !flipping && 'wordle-pop',
      )}
      style={{
        animationDelay: isBouncing ? `${bounceDelay || 0}ms` : undefined,
        perspective: '300px',
      }}
    >
      {letter}
    </div>
  );
}

// ─── Keyboard Component ─────────────────────────────────────────────────────

function Keyboard({
  keyStates,
  onKey,
  disabled,
}: {
  keyStates: Record<string, LetterState>;
  onKey: (key: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-[500px] mx-auto px-1">
      {KEYBOARD_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1 sm:gap-1.5 justify-center w-full">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACK';
            const state = keyStates[key];
            const bg = state === 'correct'
              ? 'bg-green-600 text-white border-green-600'
              : state === 'present'
                ? 'bg-yellow-500 text-white border-yellow-500'
                : state === 'absent'
                  ? 'bg-gray-600 text-white dark:bg-gray-700 border-gray-600 dark:border-gray-700'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500';

            return (
              <button
                key={key}
                onClick={() => !disabled && onKey(key)}
                disabled={disabled}
                className={cn(
                  'rounded-lg font-semibold border flex items-center justify-center',
                  'transition-all duration-150 active:scale-95 shadow-sm hover:shadow-md',
                  'h-[46px] sm:h-[52px] md:h-[56px]',
                  isSpecial
                    ? 'px-2 sm:px-3 text-xs sm:text-sm min-w-[52px] sm:min-w-[65px]'
                    : 'w-[30px] sm:w-[36px] md:w-[40px] text-sm sm:text-base',
                  bg,
                  disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {key === 'BACK' ? (
                  <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : key === 'ENTER' ? (
                  <CornerDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Stats Modal ────────────────────────────────────────────────────────────

function StatsModal({
  stats,
  open,
  onClose,
  lastGuessCount,
}: {
  stats: WordleStats;
  open: boolean;
  onClose: () => void;
  lastGuessCount?: number;
}) {
  if (!open) return null;

  const winPct = stats.gamesPlayed > 0
    ? Math.round((stats.wins / stats.gamesPlayed) * 100)
    : 0;

  const maxDist = Math.max(...stats.guessDistribution, 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl wordle-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Statistics</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-2 mb-6 text-center">
          {[
            { value: stats.gamesPlayed, label: 'Played' },
            { value: winPct, label: 'Win %' },
            { value: stats.currentStreak, label: 'Current\nStreak' },
            { value: stats.maxStreak, label: 'Max\nStreak' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* Guess distribution */}
        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Guess Distribution</h4>
        <div className="space-y-1">
          {stats.guessDistribution.map((count, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold w-3 text-gray-600 dark:text-gray-400">{i + 1}</span>
              <div
                className={cn(
                  'h-5 rounded-sm flex items-center justify-end px-1.5 min-w-[20px] transition-all',
                  lastGuessCount === i + 1
                    ? 'bg-green-600'
                    : 'bg-gray-400 dark:bg-gray-600',
                )}
                style={{ width: `${Math.max((count / maxDist) * 100, 8)}%` }}
              >
                <span className="text-xs font-bold text-white">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Toast Helper ───────────────────────────────────────────────────────────

function showToast(message: string) {
  toast(message, { duration: 1500 });
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function WordleGame() {
  const navigate = useNavigate();
  const { player, getPlayerId, getDisplayName } = usePlayerProfile();
  const { submitScore } = useLeaderboard({ gameSlug: 'wordle' });
  const { streak, recordWin, recordLoss } = useStreakTracker();

  // ─── State ──────────────────────────────────────────────────────────────

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [mode, setMode] = useState<WordleMode>('solo');
  const [target, setTarget] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [bounceRow, setBounceRow] = useState<number | null>(null);
  const [stats, setStats] = useState<WordleStats>(loadStats);
  const [showStats, setShowStats] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [lastGuessCount, setLastGuessCount] = useState<number | undefined>();

  // Local multiplayer
  const [localPlayer, setLocalPlayer] = useState<1 | 2>(1);
  const [p1State, setP1State] = useState<LocalPlayerState | null>(null);
  const [p2State, setP2State] = useState<LocalPlayerState | null>(null);
  const [localWinner, setLocalWinner] = useState<string | null>(null);

  // Online multiplayer
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentSolved, setOpponentSolved] = useState(false);
  const [opponentGuessCount, setOpponentGuessCount] = useState(0);

  const gameContainerRef = useRef<HTMLDivElement>(null);

  // ─── Online Room ──────────────────────────────────────────────────────

  const gameRoom = useGameRoom({
    gameSlug: 'word-chain-battle', // Using existing slug for compatibility
    playerName: getDisplayName(),
    onGameStart: (payload) => {
      if (payload.target && typeof payload.target === 'string') {
        setTarget(payload.target);
      }
      setPhase('countdown');
    },
    onBroadcast: (event, payload) => {
      if (event === 'guess-made') {
        setOpponentProgress(payload.row as number);
        setOpponentGuessCount(payload.guessCount as number);
      }
      if (event === 'game-solved') {
        setOpponentSolved(true);
        setOpponentGuessCount(payload.guessCount as number);
      }
      if (event === 'game-failed') {
        setOpponentSolved(false);
        setOpponentGuessCount(MAX_GUESSES);
      }
    },
  });

  // ─── Board Construction ───────────────────────────────────────────────

  const board = useMemo((): TileData[][] => {
    const rows: TileData[][] = [];
    for (let r = 0; r < MAX_GUESSES; r++) {
      if (r < guesses.length) {
        const states = evaluateGuess(guesses[r], target);
        rows.push(guesses[r].split('').map((l, i) => ({ letter: l, state: states[i] })));
      } else if (r === currentRow) {
        const row: TileData[] = [];
        for (let c = 0; c < WORD_LENGTH; c++) {
          row.push({
            letter: c < currentGuess.length ? currentGuess[c] : '',
            state: 'tbd',
          });
        }
        rows.push(row);
      } else {
        rows.push(Array(WORD_LENGTH).fill(null).map(() => ({ letter: '', state: 'empty' as LetterState })));
      }
    }
    return rows;
  }, [guesses, currentGuess, currentRow, target]);

  const keyStates = useMemo(() => buildKeyboardMap(board), [board]);

  // ─── Keyboard Input ───────────────────────────────────────────────────

  const handleKey = useCallback(
    (key: string) => {
      if (phase !== 'playing' || solved || failed || revealingRow !== null) return;

      if (key === 'BACK' || key === 'BACKSPACE') {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (key === 'ENTER') {
        if (currentGuess.length !== WORD_LENGTH) {
          setShakeRow(currentRow);
          setTimeout(() => setShakeRow(null), 600);
          showToast('Not enough letters');
          return;
        }

        if (!isValidWord(currentGuess)) {
          setShakeRow(currentRow);
          setTimeout(() => setShakeRow(null), 600);
          showToast('Not in word list');
          return;
        }

        // Submit guess
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setRevealingRow(currentRow);

        const revealTime = WORD_LENGTH * FLIP_STAGGER + FLIP_DURATION;

        // Broadcast for online mode
        if (mode === 'online') {
          gameRoom.broadcast('guess-made', {
            row: currentRow + 1,
            guessCount: newGuesses.length,
          });
        }

        setTimeout(() => {
          setRevealingRow(null);

          if (currentGuess === target) {
            // Win
            setSolved(true);
            setBounceRow(currentRow);
            setTimeout(() => setBounceRow(null), 1500);

            if (mode === 'online') {
              gameRoom.broadcast('game-solved', { guessCount: newGuesses.length });
            }

            if (mode === 'solo' || mode === 'daily') {
              handleWin(newGuesses.length);
            } else if (mode === 'local') {
              handleLocalGuessComplete(newGuesses, true);
              return;
            }

            setTimeout(() => {
              if (mode !== 'local') {
                setPhase('game-over');
              }
            }, 1800);
          } else if (newGuesses.length >= MAX_GUESSES) {
            // Loss
            setFailed(true);

            if (mode === 'online') {
              gameRoom.broadcast('game-failed', { guessCount: MAX_GUESSES });
            }

            if (mode === 'solo' || mode === 'daily') {
              handleLoss();
            } else if (mode === 'local') {
              handleLocalGuessComplete(newGuesses, false);
              return;
            }

            setTimeout(() => {
              showToast(target);
              if (mode !== 'local') {
                setTimeout(() => setPhase('game-over'), 1500);
              }
            }, 300);
          } else {
            if (mode === 'local') {
              handleLocalGuessComplete(newGuesses, false);
              return;
            }
          }

          setCurrentRow((r) => r + 1);
          setCurrentGuess('');
        }, revealTime);

        return;
      }

      // Letter key
      if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, solved, failed, revealingRow, currentGuess, currentRow, guesses, target, mode]
  );

  // Physical keyboard listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (showStats || showHowToPlay) return;

      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        e.preventDefault();
        handleKey('ENTER');
      } else if (key === 'BACKSPACE') {
        e.preventDefault();
        handleKey('BACK');
      } else if (/^[A-Z]$/.test(key)) {
        handleKey(key);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey, showStats, showHowToPlay]);

  // ─── Stats Management ─────────────────────────────────────────────────

  function handleWin(guessCount: number) {
    setLastGuessCount(guessCount);
    setStats((prev) => {
      const updated = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins + 1,
        currentStreak: prev.currentStreak + 1,
        maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
        guessDistribution: [...prev.guessDistribution],
      };
      updated.guessDistribution[guessCount - 1]++;
      saveStats(updated);
      return updated;
    });
    recordWin();

    if (mode === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      saveDailyState(today, [...guesses, currentGuess], true);
    }
  }

  function handleLoss() {
    setLastGuessCount(undefined);
    setStats((prev) => {
      const updated = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        currentStreak: 0,
      };
      saveStats(updated);
      return updated;
    });
    recordLoss();

    if (mode === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      saveDailyState(today, guesses, false);
    }
  }

  // ─── Local Multiplayer Logic ──────────────────────────────────────────

  function handleLocalGuessComplete(newGuesses: string[], didSolve: boolean) {
    const revealTime = WORD_LENGTH * FLIP_STAGGER + FLIP_DURATION + 200;

    setTimeout(() => {
      if (localPlayer === 1) {
        // Save P1 state, switch to P2
        setP1State({
          guesses: newGuesses,
          board: buildBoardFromGuesses(newGuesses, target),
          currentRow: newGuesses.length,
          currentGuess: '',
          solved: didSolve,
          failed: newGuesses.length >= MAX_GUESSES && !didSolve,
        });

        if (didSolve || newGuesses.length >= MAX_GUESSES) {
          // P1 is done, P2's turn
          setLocalPlayer(2);
          resetBoardForNewPlayer();
          showToast('Player 2, your turn!');
        } else {
          // P1 still playing
          setCurrentRow(newGuesses.length);
          setCurrentGuess('');
        }
      } else {
        // Save P2 state
        setP2State({
          guesses: newGuesses,
          board: buildBoardFromGuesses(newGuesses, target),
          currentRow: newGuesses.length,
          currentGuess: '',
          solved: didSolve,
          failed: newGuesses.length >= MAX_GUESSES && !didSolve,
        });

        if (didSolve || newGuesses.length >= MAX_GUESSES) {
          // Both done — determine winner
          const p1 = p1State!;
          const p2Solved = didSolve;
          const p2Guesses = newGuesses.length;

          if (p1.solved && p2Solved) {
            if (p1.guesses.length < p2Guesses) {
              setLocalWinner('Player 1 wins! (fewer guesses)');
            } else if (p2Guesses < p1.guesses.length) {
              setLocalWinner('Player 2 wins! (fewer guesses)');
            } else {
              setLocalWinner('It is a tie!');
            }
          } else if (p1.solved) {
            setLocalWinner('Player 1 wins!');
          } else if (p2Solved) {
            setLocalWinner('Player 2 wins!');
          } else {
            setLocalWinner('Nobody guessed the word!');
          }

          setPhase('game-over');
        } else {
          setCurrentRow(newGuesses.length);
          setCurrentGuess('');
        }
      }
    }, revealTime);
  }

  function resetBoardForNewPlayer() {
    setGuesses([]);
    setCurrentGuess('');
    setCurrentRow(0);
    setSolved(false);
    setFailed(false);
  }

  // ─── Game Lifecycle ───────────────────────────────────────────────────

  function startGame(selectedMode: WordleMode) {
    setMode(selectedMode);
    setSolved(false);
    setFailed(false);
    setGuesses([]);
    setCurrentGuess('');
    setCurrentRow(0);
    setRevealingRow(null);
    setShakeRow(null);
    setBounceRow(null);
    setLocalPlayer(1);
    setP1State(null);
    setP2State(null);
    setLocalWinner(null);
    setOpponentProgress(0);
    setOpponentSolved(false);
    setOpponentGuessCount(0);

    if (selectedMode === 'solo') {
      setTarget(getRandomTarget());
      setPhase('playing');
    } else if (selectedMode === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      const dailyWord = getDailyTarget(today);
      setTarget(dailyWord);

      // Restore daily state if already played
      const saved = loadDailyState();
      if (saved && saved.solved) {
        const board = buildBoardFromGuesses(saved.guesses, dailyWord);
        setGuesses(saved.guesses);
        setCurrentRow(saved.guesses.length);
        setSolved(true);
        setPhase('game-over');
        showToast('You already completed today\'s Wordle!');
        return;
      } else if (saved) {
        setGuesses(saved.guesses);
        setCurrentRow(saved.guesses.length);
      }

      setPhase('playing');
    } else if (selectedMode === 'online') {
      setPhase('lobby');
    } else if (selectedMode === 'local') {
      setTarget(getRandomTarget());
      showToast('Player 1, start guessing!');
      setPhase('playing');
    }
  }

  function handleCountdownComplete() {
    if (!target) {
      // Host picks a word and broadcasts it
      if (gameRoom.isHost) {
        const word = getRandomTarget();
        setTarget(word);
        gameRoom.broadcast('set-target', { target: word });
      }
    }
    setPhase('playing');
  }

  function handlePlayAgain() {
    startGame(mode);
  }

  function handleBackToMenu() {
    gameRoom.leaveRoom();
    setPhase('menu');
  }

  function handleShare() {
    if (!solved && !failed) return;

    const rowCount = guesses.length;
    const emojiGrid = generateEmojiGrid(
      buildBoardFromGuesses(guesses, target),
      rowCount,
    );

    const header = mode === 'daily'
      ? `TechTrendi Wordle ${new Date().toISOString().split('T')[0]} ${solved ? rowCount : 'X'}/${MAX_GUESSES}`
      : `TechTrendi Wordle ${solved ? rowCount : 'X'}/${MAX_GUESSES}`;

    const text = `${header}\n\n${emojiGrid}\n\nPlay at techtrendi.com/arcade/wordle`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
      });
    }

    if (navigator.share) {
      navigator.share({ title: 'TechTrendi Wordle', text }).catch(() => {});
    }
  }

  // ─── Online Lobby Handlers ────────────────────────────────────────────

  function handleOnlineCreateRoom() {
    gameRoom.createRoom();
  }

  function handleOnlineJoinRoom(code: string) {
    gameRoom.joinRoom(code);
  }

  function handleOnlineStartGame() {
    const word = getRandomTarget();
    setTarget(word);
    gameRoom.broadcast('game-start', { target: word });
    setPhase('countdown');
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <Layout>
      <SEOHead
        title="Wordle - TechTrendi Arcade"
        description="Guess the 5-letter word in 6 tries. Play solo, daily challenge, or multiplayer!"
        path="/arcade/wordle"
      />
      <style>{animationStyles}</style>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 wordle-game-bg">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-lg mx-auto px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                to="/arcade"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
                Wordle
              </h1>
              {mode === 'daily' && phase !== 'menu' && (
                <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  Daily
                </span>
              )}
              {mode === 'online' && phase === 'playing' && (
                <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  1v1
                </span>
              )}
              {mode === 'local' && phase === 'playing' && (
                <span className="text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  P{localPlayer}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHowToPlay(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="How to play"
              >
                <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setShowStats(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div ref={gameContainerRef} className="max-w-lg mx-auto px-3 pb-4">

          {/* ─── MENU ─── */}
          {phase === 'menu' && (
            <div className="pt-12 sm:pt-16 text-center wordle-slide-up">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Gamepad2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2">Wordle</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm sm:text-base">
                Guess the 5-letter word in 6 tries
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <button
                  onClick={() => startGame('solo')}
                  className="group relative flex flex-col items-center justify-center rounded-2xl p-5 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] min-h-[110px]"
                >
                  <Bot className="w-8 h-8 mb-2 drop-shadow-md" />
                  <span className="text-base font-bold">Practice</span>
                  <span className="text-[11px] text-white/80 mt-0.5">Random word</span>
                </button>

                <button
                  onClick={() => startGame('daily')}
                  className="group relative flex flex-col items-center justify-center rounded-2xl p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] min-h-[110px]"
                >
                  <Calendar className="w-8 h-8 mb-2 drop-shadow-md" />
                  <span className="text-base font-bold">Daily</span>
                  <span className="text-[11px] text-white/80 mt-0.5">Same word for all</span>
                </button>

                <button
                  onClick={() => { setMode('online'); setPhase('lobby'); }}
                  className="group relative flex flex-col items-center justify-center rounded-2xl p-5 bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] min-h-[110px]"
                >
                  <Wifi className="w-8 h-8 mb-2 drop-shadow-md" />
                  <span className="text-base font-bold">1v1 Online</span>
                  <span className="text-[11px] text-white/80 mt-0.5">Race a friend</span>
                </button>

                <button
                  onClick={() => startGame('local')}
                  className="group relative flex flex-col items-center justify-center rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] min-h-[110px]"
                >
                  <Users className="w-8 h-8 mb-2 drop-shadow-md" />
                  <span className="text-base font-bold">Local</span>
                  <span className="text-[11px] text-white/80 mt-0.5">Same device, 2P</span>
                </button>
              </div>

              {/* Quick stats */}
              {stats.gamesPlayed > 0 && (
                <div className="mt-8 flex justify-center gap-6 text-center">
                  <div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">{stats.gamesPlayed}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Played</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-green-600 dark:text-green-400">
                      {stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0}%
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.currentStreak}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Streak</div>
                  </div>
                </div>
              )}

              {/* How to Play */}
              <div className="mt-8 max-w-sm mx-auto text-left">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    How to Play
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>Guess the hidden <span className="font-semibold text-gray-900 dark:text-white">5-letter word</span> in <span className="font-semibold text-gray-900 dark:text-white">6 tries</span></li>
                    <li className="flex items-center gap-2">
                      <span className="inline-block w-6 h-6 rounded bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0">A</span>
                      <span>Green = correct letter, correct position</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="inline-block w-6 h-6 rounded bg-yellow-500 text-white text-xs font-bold flex items-center justify-center shrink-0">B</span>
                      <span>Yellow = correct letter, wrong position</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="inline-block w-6 h-6 rounded bg-gray-600 text-white text-xs font-bold flex items-center justify-center shrink-0">C</span>
                      <span>Gray = letter not in the word</span>
                    </li>
                    <li>Each guess must be a valid English word</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/60 space-y-1 text-xs text-gray-500 dark:text-gray-500">
                    <p><span className="font-semibold text-amber-600 dark:text-amber-400">Daily Challenge:</span> same word for everyone — share your result!</p>
                    <p><span className="font-semibold text-blue-600 dark:text-blue-400">Multiplayer:</span> race opponents to solve first</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── LOBBY (Online) ─── */}
          {phase === 'lobby' && mode === 'online' && (
            <div className="pt-8">
              <RoomLobby
                roomCode={gameRoom.roomCode}
                isHost={gameRoom.isHost}
                opponentJoined={gameRoom.opponentJoined}
                onCreateRoom={handleOnlineCreateRoom}
                onJoinRoom={handleOnlineJoinRoom}
                onStartGame={handleOnlineStartGame}
                onBack={handleBackToMenu}
              />
            </div>
          )}

          {/* ─── COUNTDOWN ─── */}
          {phase === 'countdown' && (
            <CountdownOverlay onComplete={handleCountdownComplete} />
          )}

          {/* ─── PLAYING ─── */}
          {phase === 'playing' && (
            <div className="flex flex-col items-center pt-3 sm:pt-4">
              {/* Online opponent indicator */}
              {mode === 'online' && (
                <div className="w-full mb-3 flex items-center justify-between px-2 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/60 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Opponent progress</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-3 h-3 rounded-sm',
                          i < opponentProgress
                            ? opponentSolved && i === opponentProgress - 1
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                            : 'bg-gray-300 dark:bg-gray-700',
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Board */}
              <div className="grid grid-rows-6 gap-1.5 mb-4">
                {board.map((row, ri) => (
                  <div
                    key={ri}
                    className={cn(
                      'flex gap-1.5',
                      shakeRow === ri && 'wordle-shake',
                    )}
                  >
                    {row.map((tile, ci) => (
                      <Tile
                        key={`${ri}-${ci}`}
                        letter={tile.letter}
                        state={tile.state}
                        isRevealing={revealingRow === ri}
                        flipDelay={ci * FLIP_STAGGER}
                        isBouncing={bounceRow === ri}
                        bounceDelay={ci * 80}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Keyboard */}
              <Keyboard
                keyStates={keyStates}
                onKey={handleKey}
                disabled={solved || failed || revealingRow !== null}
              />
            </div>
          )}

          {/* ─── GAME OVER ─── */}
          {phase === 'game-over' && (
            <div className="pt-8 sm:pt-12 wordle-slide-up">
              {/* Result */}
              <div className="text-center mb-6">
                {mode === 'local' ? (
                  <>
                    <div className="text-5xl mb-3">
                      {localWinner?.includes('tie') ? '🤝' : '🏆'}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">
                      {localWinner}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      The word was <span className="font-bold text-green-600 dark:text-green-400">{target}</span>
                    </p>
                    {p1State && (
                      <p className="text-sm text-gray-500 mt-1">
                        P1: {p1State.solved ? `${p1State.guesses.length} guesses` : 'failed'} | P2: {p2State?.solved ? `${p2State.guesses.length} guesses` : 'failed'}
                      </p>
                    )}
                  </>
                ) : mode === 'online' ? (
                  <>
                    <div className="text-5xl mb-3">
                      {solved && (!opponentSolved || guesses.length <= opponentGuessCount) ? '🏆' : '😔'}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">
                      {solved && (!opponentSolved || guesses.length <= opponentGuessCount)
                        ? 'You Win!'
                        : solved && opponentSolved && guesses.length === opponentGuessCount
                          ? 'Tie!'
                          : 'You Lose!'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      The word was <span className="font-bold text-green-600 dark:text-green-400">{target}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      You: {solved ? guesses.length : 'X'} | Opponent: {opponentSolved ? opponentGuessCount : 'X'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-3">{solved ? '🎉' : '😔'}</div>
                    <h2 className={cn(
                      'text-2xl sm:text-3xl font-black mb-1',
                      solved ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
                    )}>
                      {solved
                        ? ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'][guesses.length - 1] || 'Nice!'
                        : 'Better luck next time'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      {solved
                        ? `Solved in ${guesses.length}/${MAX_GUESSES} guesses`
                        : <>The word was <span className="font-bold text-green-600 dark:text-green-400">{target}</span></>}
                    </p>
                  </>
                )}
              </div>

              {/* Solved board (mini) */}
              {guesses.length > 0 && mode !== 'local' && (
                <div className="flex justify-center mb-6">
                  <div className="grid gap-0.5">
                    {buildBoardFromGuesses(guesses, target).slice(0, guesses.length).map((row, ri) => (
                      <div key={ri} className="flex gap-0.5">
                        {row.map((tile, ci) => (
                          <div
                            key={ci}
                            className={cn(
                              'w-7 h-7 sm:w-8 sm:h-8 rounded-[3px]',
                              tile.state === 'correct' && 'bg-green-600',
                              tile.state === 'present' && 'bg-yellow-500',
                              tile.state === 'absent' && 'bg-gray-500 dark:bg-gray-600',
                            )}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="max-w-xs mx-auto space-y-3">
                <Button
                  size="lg"
                  className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
                  onClick={handlePlayAgain}
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  {mode === 'daily' ? 'Play Practice' : 'Play Again'}
                </Button>

                <div className="flex gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setShowStats(true)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Stats
                  </Button>
                </div>

                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full h-11"
                  onClick={handleBackToMenu}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Menu
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowHowToPlay(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl wordle-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">How to Play</h3>
              <button onClick={() => setShowHowToPlay(false)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Guess the hidden <span className="font-semibold text-gray-900 dark:text-white">5-letter word</span> in <span className="font-semibold text-gray-900 dark:text-white">6 tries</span>. Each guess must be a valid English word.
            </p>

            {/* Example tiles */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex gap-1 mb-1">
                  <div className="w-9 h-9 rounded bg-green-600 text-white text-sm font-bold flex items-center justify-center">W</div>
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">O</div>
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">R</div>
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">D</div>
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">S</div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold text-green-600">W</span> is in the word and in the correct spot</p>
              </div>
              <div>
                <div className="flex gap-1 mb-1">
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">L</div>
                  <div className="w-9 h-9 rounded bg-yellow-500 text-white text-sm font-bold flex items-center justify-center">I</div>
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">G</div>
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">H</div>
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">T</div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold text-yellow-500">I</span> is in the word but in the wrong spot</p>
              </div>
              <div>
                <div className="flex gap-1 mb-1">
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">P</div>
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">L</div>
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">A</div>
                  <div className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center text-gray-900 dark:text-white">N</div>
                  <div className="w-9 h-9 rounded bg-gray-600 text-white text-sm font-bold flex items-center justify-center">E</div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold text-gray-500">E</span> is not in the word at all</p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1 text-xs text-gray-500 dark:text-gray-500">
              <p><span className="font-semibold text-amber-600 dark:text-amber-400">Daily Challenge:</span> same word for everyone, every day. Share your result!</p>
              <p><span className="font-semibold text-blue-600 dark:text-blue-400">Multiplayer:</span> race opponents to solve the word first</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      <StatsModal
        stats={stats}
        open={showStats}
        onClose={() => setShowStats(false)}
        lastGuessCount={lastGuessCount}
      />
    </Layout>
  );
}
