// ─── Crossword Sprint — Mini 5x5 Crossword Race Game ─────────────────────────

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Grid3X3,
  Timer,
  Trophy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  Users,
  Wifi,
  Bot,
  Zap,
} from 'lucide-react';

import { GameModeSelector } from '@/components/arcade/GameModeSelector';
import { CountdownOverlay } from '@/components/arcade/CountdownOverlay';
import { GameOverScreen } from '@/components/arcade/GameOverScreen';
import { RoomLobby } from '@/components/arcade/RoomLobby';
import { useGameRoom } from '@/lib/arcade/useGameRoom';
import { usePlayerProfile } from '@/lib/arcade/usePlayerProfile';
import type { GameMode } from '@/lib/arcade/types';

import PUZZLES, { type CrosswordPuzzle, type CrosswordClue } from '@/data/arcade/crossword-puzzles';

// ─── Types ──────────────────────────────────────────────────────────────────

type GamePhase =
  | 'menu'
  | 'mode-select'
  | 'difficulty-select'
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'finished'
  | 'local-switch'
  | 'local-p2'
  | 'local-results';

type Difficulty = 'easy' | 'medium' | 'hard';

interface CellState {
  value: string;
  isBlack: boolean;
  isCorrect: boolean;
  number: number | null;
}

interface GameResult {
  time: number; // ms
  mistakes: number;
  perfectRun: boolean;
  score: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPuzzlesByDifficulty(diff: Difficulty): CrosswordPuzzle[] {
  return PUZZLES.filter((p) => p.difficulty === diff);
}

function pickRandomPuzzle(diff: Difficulty, exclude?: number): CrosswordPuzzle {
  const pool = getPuzzlesByDifficulty(diff);
  if (pool.length === 0) return PUZZLES[0]; // fallback
  const filtered = exclude ? pool.filter((p) => p.id !== exclude) : pool;
  const arr = filtered.length > 0 ? filtered : pool;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDailyPuzzle(): CrosswordPuzzle {
  const today = new Date();
  const dayIndex = today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate();
  return PUZZLES[dayIndex % PUZZLES.length];
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function buildGrid(puzzle: CrosswordPuzzle): CellState[][] {
  const grid: CellState[][] = [];
  const numberMap = new Map<string, number>();

  // Collect all clue numbers by position
  for (const clue of [...puzzle.across, ...puzzle.down]) {
    const key = `${clue.row},${clue.col}`;
    if (!numberMap.has(key)) {
      numberMap.set(key, clue.number);
    } else {
      // Keep the smaller number
      numberMap.set(key, Math.min(numberMap.get(key)!, clue.number));
    }
  }

  for (let r = 0; r < 5; r++) {
    grid[r] = [];
    for (let c = 0; c < 5; c++) {
      const sol = puzzle.solution[r]?.[c];
      const key = `${r},${c}`;
      grid[r][c] = {
        value: '',
        isBlack: sol === null,
        isCorrect: false,
        number: numberMap.get(key) ?? null,
      };
    }
  }
  return grid;
}

function countFillableCells(puzzle: CrosswordPuzzle): number {
  let count = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (puzzle.solution[r]?.[c] !== null) count++;
    }
  }
  return count;
}

function countFilledCorrect(grid: CellState[][], puzzle: CrosswordPuzzle): number {
  let count = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (!grid[r][c].isBlack && grid[r][c].value.toUpperCase() === puzzle.solution[r]?.[c]) {
        count++;
      }
    }
  }
  return count;
}

function isGridComplete(grid: CellState[][], puzzle: CrosswordPuzzle): boolean {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (!grid[r][c].isBlack) {
        if (grid[r][c].value.toUpperCase() !== puzzle.solution[r]?.[c]) {
          return false;
        }
      }
    }
  }
  return true;
}

function getClueForCell(
  row: number,
  col: number,
  direction: 'across' | 'down',
  puzzle: CrosswordPuzzle,
): CrosswordClue | null {
  const clues = direction === 'across' ? puzzle.across : puzzle.down;
  for (const clue of clues) {
    if (direction === 'across') {
      if (clue.row === row && col >= clue.col && col < clue.col + clue.answer.length) {
        return clue;
      }
    } else {
      if (clue.col === col && row >= clue.row && row < clue.row + clue.answer.length) {
        return clue;
      }
    }
  }
  return null;
}

function getWordCells(
  clue: CrosswordClue,
): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i < clue.answer.length; i++) {
    if (clue.direction === 'across') {
      cells.push({ row: clue.row, col: clue.col + i });
    } else {
      cells.push({ row: clue.row + i, col: clue.col });
    }
  }
  return cells;
}

// ─── On-Screen Keyboard ────────────────────────────────────────────────────

const KB_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

function OnScreenKeyboard({
  onKey,
  onBackspace,
  className,
}: {
  onKey: (key: string) => void;
  onBackspace: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-[3px]">
          {ri === 2 && (
            <button
              onClick={onBackspace}
              className="flex items-center justify-center h-10 w-12 rounded-md bg-muted hover:bg-muted/80 text-sm font-semibold transition-colors active:scale-95"
            >
              DEL
            </button>
          )}
          {row.split('').map((key) => (
            <button
              key={key}
              onClick={() => onKey(key)}
              className="flex items-center justify-center h-10 w-8 sm:w-9 rounded-md bg-muted hover:bg-muted/80 text-sm font-bold transition-colors active:scale-95"
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Crossword Grid Component ──────────────────────────────────────────────

function CrosswordGrid({
  grid,
  puzzle,
  selectedRow,
  selectedCol,
  direction,
  onCellClick,
  highlightedCells,
  showErrors,
}: {
  grid: CellState[][];
  puzzle: CrosswordPuzzle;
  selectedRow: number;
  selectedCol: number;
  direction: 'across' | 'down';
  onCellClick: (row: number, col: number) => void;
  highlightedCells: Set<string>;
  showErrors?: boolean;
}) {
  return (
    <div
      className="grid gap-[2px] mx-auto"
      style={{
        gridTemplateColumns: 'repeat(5, minmax(44px, 60px))',
        gridTemplateRows: 'repeat(5, minmax(44px, 60px))',
        maxWidth: '320px',
      }}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          if (cell.isBlack) {
            return (
              <div
                key={`${r}-${c}`}
                className="bg-gray-900 dark:bg-gray-950 rounded-sm"
              />
            );
          }

          const isSelected = r === selectedRow && c === selectedCol;
          const isHighlighted = highlightedCells.has(`${r},${c}`);
          const isCorrect = cell.value.toUpperCase() === puzzle.solution[r]?.[c];
          const hasValue = cell.value.length > 0;
          const isWrong = showErrors && hasValue && !isCorrect;

          return (
            <button
              key={`${r}-${c}`}
              onClick={() => onCellClick(r, c)}
              className={cn(
                'relative flex items-center justify-center',
                'rounded-sm text-lg sm:text-xl font-bold uppercase',
                'transition-all duration-150',
                'focus:outline-none',
                'min-w-[44px] min-h-[44px]',
                // Base background with inset shadow for depth
                'bg-white dark:bg-gray-800',
                'shadow-[inset_0_1px_3px_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(255,255,255,0.05)]',
                'dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),inset_0_-1px_0_rgba(255,255,255,0.03)]',
                'border border-gray-200 dark:border-gray-700',
                // Highlighted word
                isHighlighted && !isSelected && 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
                // Selected cell with prominent blue glow
                isSelected && [
                  'bg-blue-100 dark:bg-blue-900/60',
                  'border-blue-500 dark:border-blue-400',
                  'ring-2 ring-blue-500/50 dark:ring-blue-400/50',
                  'shadow-[0_0_12px_rgba(59,130,246,0.4),inset_0_1px_3px_rgba(0,0,0,0.05)]',
                  'dark:shadow-[0_0_12px_rgba(96,165,250,0.35),inset_0_1px_3px_rgba(0,0,0,0.2)]',
                  'z-10',
                ].join(' '),
                // Error state
                isWrong && 'text-red-500 dark:text-red-400',
                // Correct state (when finished)
                showErrors && isCorrect && hasValue && 'text-green-600 dark:text-green-400',
                // Default text
                !showErrors && 'text-gray-900 dark:text-gray-100',
              )}
            >
              {/* Cell number */}
              {cell.number !== null && (
                <span className="absolute top-[1px] left-[3px] text-[9px] sm:text-[10px] font-semibold text-gray-500 dark:text-gray-400 leading-none">
                  {cell.number}
                </span>
              )}
              {/* Letter */}
              {cell.value}
            </button>
          );
        }),
      )}
    </div>
  );
}

// ─── Clue List Component ───────────────────────────────────────────────────

function ClueList({
  puzzle,
  activeClue,
  onClueClick,
  className,
}: {
  puzzle: CrosswordPuzzle;
  activeClue: CrosswordClue | null;
  onClueClick: (clue: CrosswordClue) => void;
  className?: string;
}) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Active clue card with prominent number */}
      {activeClue && (
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-3 border border-blue-200 dark:border-blue-800 shadow-sm flex items-start gap-3">
          <div className="flex flex-col items-center shrink-0">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 text-white font-black text-lg leading-none">
              {activeClue.number}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 mt-0.5">
              {activeClue.direction === 'across' ? 'Across' : 'Down'}
            </span>
          </div>
          <span className="text-sm sm:text-base leading-snug pt-1.5">{activeClue.clue}</span>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setShowAll(!showAll)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showAll ? 'Hide' : 'Show'} all clues
      </button>

      {/* Full list */}
      {showAll && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {/* Across */}
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Across
            </div>
            {puzzle.across.map((clue) => (
              <button
                key={`a-${clue.number}`}
                onClick={() => onClueClick(clue)}
                className={cn(
                  'block w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors',
                  activeClue?.number === clue.number && activeClue?.direction === 'across'
                    && 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                )}
              >
                <span className="font-semibold mr-1">{clue.number}.</span>
                {clue.clue}
              </button>
            ))}
          </div>
          {/* Down */}
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Down
            </div>
            {puzzle.down.map((clue) => (
              <button
                key={`d-${clue.number}`}
                onClick={() => onClueClick(clue)}
                className={cn(
                  'block w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors',
                  activeClue?.number === clue.number && activeClue?.direction === 'down'
                    && 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                )}
              >
                <span className="font-semibold mr-1">{clue.number}.</span>
                {clue.clue}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Game Component ───────────────────────────────────────────────────

export default function CrosswordSprint() {
  const navigate = useNavigate();
  const { profile, updateName } = usePlayerProfile();

  // ── Phase & Mode ──
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [mode, setMode] = useState<GameMode>('solo');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  // ── Puzzle & Grid ──
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle>(PUZZLES[0]);
  const [grid, setGrid] = useState<CellState[][]>(() => buildGrid(PUZZLES[0]));
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [direction, setDirection] = useState<'across' | 'down'>('across');

  // ── Timer ──
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  // ── Score tracking ──
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);

  // ── Local mode ──
  const [p1Result, setP1Result] = useState<GameResult | null>(null);
  const [p2Result, setP2Result] = useState<GameResult | null>(null);

  // ── Online mode ──
  const [playerName] = useState(() => profile?.displayName || `Player${Math.floor(Math.random() * 9999)}`);
  const [opponentName, setOpponentName] = useState('Opponent');
  const [opponentResult, setOpponentResult] = useState<GameResult | null>(null);

  const room = useGameRoom({
    gameSlug: 'crossword-sprint',
    playerName,
    onPlayerJoined: (name: string) => setOpponentName(name),
    onGameStart: () => setPhase('countdown'),
    onBroadcast: (event: string, payload: Record<string, unknown>) => {
      if (event === 'puzzle_id') {
        const p = PUZZLES.find((pp) => pp.id === payload.id);
        if (p) {
          setPuzzle(p);
          setGrid(buildGrid(p));
        }
      }
      if (event === 'finished') {
        setOpponentResult(payload as unknown as GameResult);
      }
    },
  });

  // ── Derived state ──
  const totalCells = useMemo(() => countFillableCells(puzzle), [puzzle]);
  const filledCorrect = useMemo(() => countFilledCorrect(grid, puzzle), [grid, puzzle]);
  const activeClue = useMemo(
    () => getClueForCell(selectedRow, selectedCol, direction, puzzle),
    [selectedRow, selectedCol, direction, puzzle],
  );
  const highlightedCells = useMemo(() => {
    const set = new Set<string>();
    if (activeClue) {
      for (const cell of getWordCells(activeClue)) {
        set.add(`${cell.row},${cell.col}`);
      }
    }
    return set;
  }, [activeClue]);

  // ── Timer control ──
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return Date.now() - startTimeRef.current;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Select next empty cell in current word ──
  const selectFirstEmpty = useCallback(
    (g: CellState[][], p: CrosswordPuzzle, dir: 'across' | 'down') => {
      // Find the first clue in the given direction
      const clues = dir === 'across' ? p.across : p.down;
      for (const clue of clues) {
        const cells = getWordCells(clue);
        for (const cell of cells) {
          if (g[cell.row]?.[cell.col] && !g[cell.row][cell.col].isBlack && !g[cell.row][cell.col].value) {
            setSelectedRow(cell.row);
            setSelectedCol(cell.col);
            setDirection(dir);
            return;
          }
        }
      }
      // If all filled, select first cell of first clue
      if (clues.length > 0) {
        setSelectedRow(clues[0].row);
        setSelectedCol(clues[0].col);
        setDirection(dir);
      }
    },
    [],
  );

  // ── Initialize puzzle ──
  const initPuzzle = useCallback(
    (p: CrosswordPuzzle) => {
      setPuzzle(p);
      const g = buildGrid(p);
      setGrid(g);
      setMistakes(0);
      setResult(null);
      selectFirstEmpty(g, p, 'across');
    },
    [selectFirstEmpty],
  );

  // ── Start game ──
  const startGame = useCallback(
    (diff: Difficulty, isOnline = false, onlinePuzzle?: CrosswordPuzzle) => {
      const p = onlinePuzzle || (diff === 'easy' || diff === 'medium' || diff === 'hard'
        ? pickRandomPuzzle(diff)
        : PUZZLES[0]);
      initPuzzle(p);
      if (!isOnline) {
        setPhase('countdown');
      }
    },
    [initPuzzle],
  );

  // ── Handle completion ──
  const handleComplete = useCallback(() => {
    const finalTime = stopTimer();
    const perfectRun = mistakes === 0;
    const baseScore = Math.max(1, Math.round(300000 / finalTime)); // lower time = higher score
    const score = perfectRun ? Math.round(baseScore * 1.5) : baseScore;
    const gameResult: GameResult = { time: finalTime, mistakes, perfectRun, score };

    if (mode === 'local' && phase === 'playing') {
      setP1Result(gameResult);
      setPhase('local-switch');
    } else if (mode === 'local' && phase === 'local-p2') {
      setP2Result(gameResult);
      setPhase('local-results');
    } else {
      setResult(gameResult);
      setPhase('finished');
      if (mode === 'online') {
        room.broadcast('finished', gameResult as unknown as Record<string, unknown>);
      }
    }
  }, [stopTimer, mistakes, mode, phase, room]);

  // ── Check completion after grid changes ──
  useEffect(() => {
    if ((phase === 'playing' || phase === 'local-p2') && isGridComplete(grid, puzzle)) {
      handleComplete();
    }
  }, [grid, puzzle, phase, handleComplete]);

  // ── Cell click handler ──
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (grid[row]?.[col]?.isBlack) return;
      if (row === selectedRow && col === selectedCol) {
        // Toggle direction
        setDirection((d) => (d === 'across' ? 'down' : 'across'));
      } else {
        setSelectedRow(row);
        setSelectedCol(col);
      }
    },
    [grid, selectedRow, selectedCol],
  );

  // ── Clue click handler ──
  const handleClueClick = useCallback((clue: CrosswordClue) => {
    setSelectedRow(clue.row);
    setSelectedCol(clue.col);
    setDirection(clue.direction);
  }, []);

  // ── Move to next cell ──
  const moveToNext = useCallback(
    (row: number, col: number, dir: 'across' | 'down') => {
      let nr = row;
      let nc = col;
      if (dir === 'across') {
        nc++;
        if (nc >= 5 || grid[nr]?.[nc]?.isBlack) return; // stop at end
      } else {
        nr++;
        if (nr >= 5 || grid[nr]?.[nc]?.isBlack) return;
      }
      if (!grid[nr]?.[nc]?.isBlack) {
        setSelectedRow(nr);
        setSelectedCol(nc);
      }
    },
    [grid],
  );

  // ── Move to previous cell ──
  const moveToPrev = useCallback(
    (row: number, col: number, dir: 'across' | 'down') => {
      let nr = row;
      let nc = col;
      if (dir === 'across') {
        nc--;
        if (nc < 0 || grid[nr]?.[nc]?.isBlack) return;
      } else {
        nr--;
        if (nr < 0 || grid[nr]?.[nc]?.isBlack) return;
      }
      if (!grid[nr]?.[nc]?.isBlack) {
        setSelectedRow(nr);
        setSelectedCol(nc);
      }
    },
    [grid],
  );

  // ── Key input handler ──
  const handleKeyInput = useCallback(
    (key: string) => {
      if (phase !== 'playing' && phase !== 'local-p2') return;

      const letter = key.toUpperCase();
      if (/^[A-Z]$/.test(letter)) {
        // Place letter
        setGrid((prev) => {
          const next = prev.map((row) => row.map((cell) => ({ ...cell })));
          if (!next[selectedRow]?.[selectedCol]?.isBlack) {
            const wasCorrect = next[selectedRow][selectedCol].value.toUpperCase() === puzzle.solution[selectedRow]?.[selectedCol];
            next[selectedRow][selectedCol].value = letter;
            const isNowCorrect = letter === puzzle.solution[selectedRow]?.[selectedCol];
            if (!isNowCorrect && !wasCorrect) {
              setMistakes((m) => m + 1);
            }
          }
          return next;
        });
        moveToNext(selectedRow, selectedCol, direction);
      }
    },
    [phase, selectedRow, selectedCol, direction, puzzle, moveToNext],
  );

  const handleBackspace = useCallback(() => {
    if (phase !== 'playing' && phase !== 'local-p2') return;

    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      if (next[selectedRow]?.[selectedCol] && !next[selectedRow][selectedCol].isBlack) {
        if (next[selectedRow][selectedCol].value) {
          next[selectedRow][selectedCol].value = '';
        } else {
          // Move back then clear
          moveToPrev(selectedRow, selectedCol, direction);
        }
      }
      return next;
    });

    if (!grid[selectedRow]?.[selectedCol]?.value) {
      moveToPrev(selectedRow, selectedCol, direction);
    }
  }, [phase, selectedRow, selectedCol, direction, grid, moveToPrev]);

  // ── Keyboard event listener ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== 'playing' && phase !== 'local-p2') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setDirection((d) => (d === 'across' ? 'down' : 'across'));
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveToNext(selectedRow, selectedCol, 'across');
        setDirection('across');
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveToPrev(selectedRow, selectedCol, 'across');
        setDirection('across');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveToNext(selectedRow, selectedCol, 'down');
        setDirection('down');
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveToPrev(selectedRow, selectedCol, 'down');
        setDirection('down');
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleKeyInput(e.key);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, selectedRow, selectedCol, direction, handleKeyInput, handleBackspace, moveToNext, moveToPrev]);

  // ── Mode handlers ──
  const handleModeSelect = useCallback((m: GameMode) => {
    setMode(m);
    if (m === 'online') {
      setPhase('lobby');
    } else {
      setPhase('difficulty-select');
    }
  }, []);

  const handleDifficultySelect = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      startGame(diff);
    },
    [startGame],
  );

  const handleCountdownComplete = useCallback(() => {
    setPhase('playing');
    startTimer();
  }, [startTimer]);

  const handlePlayAgain = useCallback(() => {
    setResult(null);
    setP1Result(null);
    setP2Result(null);
    setOpponentResult(null);
    setPhase('difficulty-select');
  }, []);

  const handleLocalP2Start = useCallback(() => {
    initPuzzle(puzzle);
    setPhase('countdown');
  }, [puzzle, initPuzzle]);

  const handleLocalP2CountdownComplete = useCallback(() => {
    setPhase('local-p2');
    startTimer();
  }, [startTimer]);

  // ── Online room handlers ──
  const handleCreateRoom = useCallback(() => {
    room.createRoom();
  }, [room]);

  const handleJoinRoom = useCallback(
    (code: string) => {
      room.joinRoom(code);
    },
    [room],
  );

  const handleStartOnlineGame = useCallback(() => {
    const p = pickRandomPuzzle(difficulty);
    setPuzzle(p);
    setGrid(buildGrid(p));
    setMistakes(0);
    setResult(null);
    room.broadcast('puzzle_id', { id: p.id });
    setPhase('countdown');
  }, [difficulty, room]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Layout>
      <SEOHead
        title="Crossword Sprint | TechTrendi Arcade"
        description="Race to complete mini 5x5 crossword puzzles. Beat your time, challenge friends, or compete online."
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
            <Link
              to="/arcade"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Arcade
            </Link>
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-lg">Crossword Sprint</span>
            </div>
            <div className="w-16" /> {/* spacer */}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* ── MENU ── */}
          {phase === 'menu' && (
            <div className="space-y-8 text-center">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-lg">
                  <Grid3X3 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-black">Crossword Sprint</h1>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Complete mini 5x5 crosswords as fast as you can. No wrong letters = 1.5x bonus!
                </p>
              </div>

              <div className="space-y-3 max-w-sm mx-auto">
                <Button
                  size="lg"
                  className="w-full h-14 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                  onClick={() => setPhase('mode-select')}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Play Now
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => {
                    setMode('solo');
                    const dp = getDailyPuzzle();
                    initPuzzle(dp);
                    setPhase('countdown');
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Daily Challenge
                </Button>
              </div>

              {/* How to Play */}
              <div className="text-left bg-muted/50 rounded-xl p-5 border border-muted space-y-3">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-amber-500" />
                  How to Play
                </h3>
                <div className="space-y-2.5 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold shrink-0 mt-0.5">1</span>
                    <span>Complete a <strong className="text-foreground">5x5 crossword</strong> as fast as you can. Tap a cell, then type letters.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold shrink-0 mt-0.5">2</span>
                    <span>Tap the <strong className="text-foreground">same cell again</strong> to switch between Across and Down directions.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 text-xs font-bold shrink-0 mt-0.5">3</span>
                    <span>Your score is based on <strong className="text-foreground">speed</strong>. The faster you finish, the higher you score.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold shrink-0 mt-0.5">4</span>
                    <span>No mistakes? You get a <strong className="text-foreground">1.5x score bonus</strong>. Every wrong letter counts!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MODE SELECT ── */}
          {phase === 'mode-select' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">Choose Mode</h2>
                <p className="text-muted-foreground text-sm">How do you want to play?</p>
              </div>
              <GameModeSelector onSelect={handleModeSelect} />
              <Button variant="ghost" className="w-full" onClick={() => setPhase('menu')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>
          )}

          {/* ── DIFFICULTY SELECT ── */}
          {phase === 'difficulty-select' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">Select Difficulty</h2>
                <p className="text-muted-foreground text-sm">
                  {mode === 'local' ? 'Both players solve the same puzzle' : 'Choose your challenge level'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { diff: 'easy' as Difficulty, label: 'Easy', color: 'from-green-500 to-emerald-600', desc: 'Common words' },
                  { diff: 'medium' as Difficulty, label: 'Medium', color: 'from-yellow-500 to-amber-600', desc: 'Moderate clues' },
                  { diff: 'hard' as Difficulty, label: 'Hard', color: 'from-red-500 to-rose-600', desc: 'Tricky words' },
                ]).map(({ diff, label, color, desc }) => (
                  <button
                    key={diff}
                    onClick={() => handleDifficultySelect(diff)}
                    className={cn(
                      'rounded-2xl p-6 text-white shadow-lg',
                      'bg-gradient-to-br', color,
                      'hover:scale-[1.03] active:scale-[0.98]',
                      'transition-all duration-200',
                      'min-h-[100px] flex flex-col items-center justify-center',
                    )}
                  >
                    <span className="text-xl font-bold">{label}</span>
                    <span className="text-sm text-white/80">{desc}</span>
                  </button>
                ))}
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setPhase('mode-select')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>
          )}

          {/* ── LOBBY (online) ── */}
          {phase === 'lobby' && (
            <div className="space-y-6">
              <RoomLobby
                roomCode={room.roomCode}
                isHost={room.isHost}
                opponentJoined={room.opponentJoined}
                opponentName={opponentName}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                onStartGame={handleStartOnlineGame}
                onBack={() => setPhase('mode-select')}
              />
            </div>
          )}

          {/* ── COUNTDOWN ── */}
          {(phase === 'countdown') && (
            <CountdownOverlay
              onComplete={phase === 'countdown' && p1Result ? handleLocalP2CountdownComplete : handleCountdownComplete}
            />
          )}

          {/* ── PLAYING ── */}
          {(phase === 'playing' || phase === 'local-p2') && (
            <div className="space-y-4">
              {/* Status bar */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-amber-500" />
                    <span className="font-mono font-bold text-lg tabular-nums">
                      {formatTime(elapsedMs)}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {filledCorrect}/{totalCells} letters
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {mistakes > 0 && (
                    <span className="text-red-500 text-xs font-medium">
                      {mistakes} mistake{mistakes !== 1 ? 's' : ''}
                    </span>
                  )}
                  {mistakes === 0 && filledCorrect > 0 && (
                    <span className="text-green-500 text-xs font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Perfect
                    </span>
                  )}
                  {phase === 'local-p2' && (
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded">
                      P2
                    </span>
                  )}
                </div>
              </div>

              {/* Direction indicator */}
              <div className="flex items-center justify-center gap-2 text-xs">
                <button
                  onClick={() => setDirection('across')}
                  className={cn(
                    'px-3 py-1 rounded-full transition-colors',
                    direction === 'across'
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  Across
                </button>
                <button
                  onClick={() => setDirection('down')}
                  className={cn(
                    'px-3 py-1 rounded-full transition-colors',
                    direction === 'down'
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  Down
                </button>
              </div>

              {/* Grid */}
              <CrosswordGrid
                grid={grid}
                puzzle={puzzle}
                selectedRow={selectedRow}
                selectedCol={selectedCol}
                direction={direction}
                onCellClick={handleCellClick}
                highlightedCells={highlightedCells}
              />

              {/* Clues */}
              <ClueList
                puzzle={puzzle}
                activeClue={activeClue}
                onClueClick={handleClueClick}
              />

              {/* On-screen keyboard (visible on mobile) */}
              <OnScreenKeyboard
                onKey={handleKeyInput}
                onBackspace={handleBackspace}
                className="sm:hidden pt-2"
              />
            </div>
          )}

          {/* ── LOCAL SWITCH ── */}
          {phase === 'local-switch' && p1Result && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Player 1 Finished!</h2>
                <p className="text-muted-foreground">
                  Time: <span className="font-mono font-bold text-foreground">{formatTime(p1Result.time)}</span>
                  {p1Result.perfectRun && (
                    <span className="ml-2 text-green-500">Perfect Run!</span>
                  )}
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                Pass the device to Player 2. They will solve the same puzzle.
              </div>
              <Button
                size="lg"
                className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-cyan-500"
                onClick={() => {
                  initPuzzle(puzzle);
                  setPhase('countdown');
                }}
              >
                <Users className="w-5 h-5 mr-2" />
                Player 2: Start
              </Button>
            </div>
          )}

          {/* ── LOCAL RESULTS ── */}
          {phase === 'local-results' && p1Result && p2Result && (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold">Results</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Player 1', r: p1Result },
                  { label: 'Player 2', r: p2Result },
                ].map(({ label, r }) => {
                  const isWinner = r.time <= Math.min(p1Result.time, p2Result.time);
                  return (
                    <div
                      key={label}
                      className={cn(
                        'rounded-xl p-4',
                        isWinner ? 'bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-500' : 'bg-muted/50',
                      )}
                    >
                      {isWinner && <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />}
                      <div className="font-bold">{label}</div>
                      <div className="text-2xl font-mono font-black tabular-nums">
                        {formatTime(r.time)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.mistakes} mistake{r.mistakes !== 1 ? 's' : ''}
                        {r.perfectRun && ' | 1.5x'}
                      </div>
                      <div className="text-sm font-bold mt-1">Score: {r.score}</div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3">
                <Button size="lg" className="w-full h-12" onClick={handlePlayAgain}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                </Button>
                <Button size="lg" variant="ghost" className="w-full h-12" onClick={() => setPhase('menu')}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Menu
                </Button>
              </div>
            </div>
          )}

          {/* ── FINISHED (solo / online) ── */}
          {phase === 'finished' && result && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                {result.perfectRun && (
                  <div className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-bold px-3 py-1 rounded-full">
                    <Sparkles className="w-4 h-4" />
                    Perfect Run! 1.5x Bonus
                  </div>
                )}
              </div>

              <GameOverScreen
                won={mode === 'online' ? (!opponentResult || result.time < opponentResult.time) : true}
                score={result.score}
                opponentScore={opponentResult?.score}
                opponentName={mode === 'online' ? opponentName : undefined}
                playerName={playerName}
                onPlayAgain={handlePlayAgain}
                onBackToArcade={() => navigate('/arcade')}
              />

              {/* Extra stats */}
              <div className="bg-muted/50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-mono font-black tabular-nums">{formatTime(result.time)}</div>
                  <div className="text-xs text-muted-foreground">Time</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-black tabular-nums">{result.mistakes}</div>
                  <div className="text-xs text-muted-foreground">Mistakes</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-black tabular-nums">{result.score}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              </div>

              {/* Show completed grid */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground text-center">Completed Puzzle</h3>
                <CrosswordGrid
                  grid={grid}
                  puzzle={puzzle}
                  selectedRow={-1}
                  selectedCol={-1}
                  direction="across"
                  onCellClick={() => {}}
                  highlightedCells={new Set()}
                  showErrors
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
