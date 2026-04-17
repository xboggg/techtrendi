// ─── Arcade Shared Types ─────────────────────────────────────────────────────

export type GameMode = 'solo' | 'local' | 'online';

export type RankTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend';

export type GameSlug =
  | 'math-tug-of-war'
  | 'speed-typing-race'
  | 'word-chain-battle'
  | 'reflex-duel'
  | 'trivia-challenge'
  | 'anagram-blitz'
  | 'word-bomb'
  | 'crossword-sprint';

export interface PlayerStats {
  id: string;
  displayName: string;
  eloRating: number;
  rankTier: RankTier;
  totalWins: number;
  totalLosses: number;
  totalGames: number;
  currentStreak: number;
  bestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameStats {
  playerId: string;
  gameSlug: GameSlug;
  wins: number;
  losses: number;
  bestScore: number;
  gamesPlayed: number;
  eloRating: number;
  rankTier: RankTier;
}

export interface RoomState {
  roomCode: string;
  gameSlug: GameSlug;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
  currentPlayers: number;
  config: Record<string, unknown>;
  expiresAt: string;
}

export interface GameConfig {
  gameSlug: GameSlug;
  mode: GameMode;
  difficulty?: 'easy' | 'medium' | 'hard';
  rounds?: number;
  timeLimit?: number;
  aiDifficulty?: number; // 0-1 scale
}

export interface DailyChallenge {
  id: string;
  gameSlug: GameSlug;
  challengeDate: string;
  seed: number;
  config: Record<string, unknown>;
}

export interface DailyChallengeScore {
  id: string;
  challengeId: string;
  playerId: string;
  score: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  playerId: string;
  playerName: string;
  gameSlug: GameSlug;
  score: number;
  gameMode: GameMode;
  rankTier: RankTier;
  eloRating: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface StreakInfo {
  current: number;
  best: number;
  lastGameDate: string | null;
  isActive: boolean;
}

export interface RoomBroadcastEvent {
  type: 'broadcast';
  event: string;
  payload: Record<string, unknown>;
}

export interface ArcadeGame {
  slug: GameSlug;
  name: string;
  description: string;
  icon: string; // lucide icon name
  gradient: string; // tailwind gradient classes
  path: string;
  color: string;
}
