// ─── Arcade Constants ────────────────────────────────────────────────────────

import type { RankTier, ArcadeGame } from './types';

// ─── Rank Tiers ──────────────────────────────────────────────────────────────

export interface RankTierConfig {
  tier: RankTier;
  label: string;
  minElo: number;
  maxElo: number;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  icon: string; // emoji
}

export const RANK_TIERS: RankTierConfig[] = [
  {
    tier: 'bronze',
    label: 'Bronze',
    minElo: 0,
    maxElo: 999,
    color: 'text-amber-700 dark:text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-500',
    glowColor: '',
    icon: '🥉',
  },
  {
    tier: 'silver',
    label: 'Silver',
    minElo: 1000,
    maxElo: 1499,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/40',
    borderColor: 'border-gray-400',
    glowColor: '',
    icon: '🥈',
  },
  {
    tier: 'gold',
    label: 'Gold',
    minElo: 1500,
    maxElo: 1999,
    color: 'text-yellow-600 dark:text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-500',
    glowColor: '',
    icon: '🥇',
  },
  {
    tier: 'diamond',
    label: 'Diamond',
    minElo: 2000,
    maxElo: 2499,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-400',
    glowColor: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    icon: '💎',
  },
  {
    tier: 'legend',
    label: 'Legend',
    minElo: 2500,
    maxElo: Infinity,
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    icon: '👑',
  },
];

// ─── Points & Scoring ────────────────────────────────────────────────────────

export const POINTS = {
  WIN: 25,
  LOSS: 5,
  DRAW: 10,
  DAILY_CHALLENGE_BONUS: 50,
  STREAK_BASE: 10,
} as const;

export const STREAK_MULTIPLIERS: Record<number, number> = {
  3: 1.5,   // 3-win streak = 1.5x
  5: 2.0,   // 5-win streak = 2x
  7: 2.5,   // 7-win streak = 2.5x
  10: 3.0,  // 10-win streak = 3x
  15: 4.0,  // 15+ streak = 4x
  20: 5.0,  // 20+ streak = 5x
};

export function getStreakMultiplier(streak: number): number {
  const thresholds = Object.keys(STREAK_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of thresholds) {
    if (streak >= threshold) {
      return STREAK_MULTIPLIERS[threshold];
    }
  }
  return 1.0;
}

// ─── ELO Configuration ──────────────────────────────────────────────────────

export const ELO = {
  DEFAULT_RATING: 800,
  K_FACTOR_NEW: 40,      // first 30 games
  K_FACTOR_NORMAL: 20,   // after 30 games
  K_FACTOR_HIGH: 10,     // above 2000 ELO
  NEW_PLAYER_THRESHOLD: 30,
  HIGH_RATING_THRESHOLD: 2000,
} as const;

// ─── Game Definitions ────────────────────────────────────────────────────────

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    slug: 'math-tug-of-war',
    name: 'Math Tug of War',
    description: 'Strategic math battles with power-ups',
    icon: 'Swords',
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    path: '/arcade/math-tug-of-war',
    color: 'blue',
  },
  {
    slug: 'speed-typing-race',
    name: 'Speed Typing Race',
    description: 'Race opponents in real-time typing',
    icon: 'Keyboard',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    path: '/arcade/speed-typing-race',
    color: 'emerald',
  },
  {
    slug: 'wordle',
    name: 'Wordle',
    description: 'Guess the 5-letter word in 6 tries',
    icon: 'SquareAsterisk',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    path: '/arcade/wordle',
    color: 'green',
  },
  {
    slug: 'reflex-duel',
    name: 'Reflex Duel',
    description: 'Test your reaction speed',
    icon: 'Zap',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
    path: '/arcade/reflex-duel',
    color: 'rose',
  },
  {
    slug: 'trivia-challenge',
    name: 'Trivia Challenge',
    description: 'Prove your knowledge',
    icon: 'Brain',
    gradient: 'from-violet-500 via-purple-500 to-indigo-600',
    path: '/arcade/trivia-challenge',
    color: 'violet',
  },
  {
    slug: 'anagram-blitz',
    name: 'Anagram Blitz',
    description: 'Unscramble letters against the clock',
    icon: 'Shuffle',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    path: '/arcade/anagram-blitz',
    color: 'amber',
  },
  {
    slug: 'word-bomb',
    name: 'Word Bomb',
    description: 'Type words with letter combos before the bomb explodes',
    icon: 'Bomb',
    gradient: 'from-orange-500 via-red-600 to-yellow-500',
    path: '/arcade/word-bomb',
    color: 'red',
  },
  {
    slug: 'crossword-sprint',
    name: 'Crossword Sprint',
    description: 'Race to complete mini 5x5 crosswords',
    icon: 'Grid3X3',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    path: '/arcade/crossword-sprint',
    color: 'amber',
  },
];

// ─── Room Settings ───────────────────────────────────────────────────────────

export const ROOM = {
  CODE_LENGTH: 4,
  MAX_PLAYERS: 2,
  EXPIRY_MINUTES: 30,
  RECONNECT_TIMEOUT_MS: 10000,
} as const;

// ─── Local Storage Keys ──────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  PLAYER_ID: 'arcade_player_id',
  PLAYER_NAME: 'arcade_player_name',
  STREAK: 'arcade_streak',
  DAILY_PLAYED: 'arcade_daily_played',
} as const;
