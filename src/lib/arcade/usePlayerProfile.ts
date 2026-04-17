// ─── usePlayerProfile — Anonymous player management ──────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS, ELO } from './constants';
import type { PlayerStats, RankTier } from './types';

interface UsePlayerProfileReturn {
  player: PlayerStats | null;
  loading: boolean;
  isNewPlayer: boolean;
  setDisplayName: (name: string) => Promise<void>;
  updateStats: (won: boolean) => Promise<void>;
  getPlayerId: () => string;
  getDisplayName: () => string;
}

function generatePlayerId(): string {
  return 'player_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

function getDefaultNames(): string[] {
  return [
    'SpeedRunner', 'QuizMaster', 'BrainWave', 'PixelKing',
    'ByteForce', 'LogicLord', 'CodeWolf', 'NeonNinja',
    'CyberFox', 'TechTitan', 'DataDragon', 'QuantumKid',
  ];
}

function generateRandomName(): string {
  const names = getDefaultNames();
  const name = names[Math.floor(Math.random() * names.length)];
  const suffix = Math.floor(Math.random() * 999);
  return `${name}${suffix}`;
}

export function usePlayerProfile(): UsePlayerProfileReturn {
  const [player, setPlayer] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewPlayer, setIsNewPlayer] = useState(false);

  const getPlayerId = useCallback((): string => {
    let id = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
    if (!id) {
      id = generatePlayerId();
      localStorage.setItem(STORAGE_KEYS.PLAYER_ID, id);
    }
    return id;
  }, []);

  const getDisplayName = useCallback((): string => {
    let name = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    if (!name) {
      name = generateRandomName();
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    }
    return name;
  }, []);

  // Load or create player on mount
  useEffect(() => {
    async function loadPlayer() {
      setLoading(true);
      const id = getPlayerId();
      const name = getDisplayName();

      try {
        // Try to fetch from DB
        const { data, error } = await supabase
          .from('arcade_players')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.warn('Player fetch error:', error.message);
          // Fall back to local-only player
          setPlayer(createLocalPlayer(id, name));
          setIsNewPlayer(true);
          setLoading(false);
          return;
        }

        if (data) {
          setPlayer({
            id: data.id as string,
            displayName: data.display_name as string,
            eloRating: data.elo_rating as number,
            rankTier: data.rank_tier as RankTier,
            totalWins: data.total_wins as number,
            totalLosses: data.total_losses as number,
            totalGames: data.total_games as number,
            currentStreak: data.current_streak as number,
            bestStreak: data.best_streak as number,
            createdAt: data.created_at as string,
            updatedAt: data.updated_at as string,
          });
          setIsNewPlayer(false);
        } else {
          // Create new player in DB
          const newPlayer = createLocalPlayer(id, name);
          setPlayer(newPlayer);
          setIsNewPlayer(true);

          // Attempt DB insert (may fail if table doesn't exist yet)
          try {
            await supabase.from('arcade_players').insert({
              id,
              display_name: name,
              elo_rating: ELO.DEFAULT_RATING,
              rank_tier: 'bronze',
              total_wins: 0,
              total_losses: 0,
              total_games: 0,
              current_streak: 0,
              best_streak: 0,
            });
          } catch {
            // Fail silently
          }
        }
      } catch {
        setPlayer(createLocalPlayer(id, name));
        setIsNewPlayer(true);
      } finally {
        setLoading(false);
      }
    }

    loadPlayer();
  }, [getPlayerId, getDisplayName]);

  const setDisplayName = useCallback(
    async (name: string) => {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
      setPlayer((prev) => (prev ? { ...prev, displayName: name } : prev));

      const id = getPlayerId();
      try {
        await supabase
          .from('arcade_players')
          .update({ display_name: name })
          .eq('id', id);
      } catch {
        // Fail silently
      }
    },
    [getPlayerId]
  );

  const updateStats = useCallback(
    async (won: boolean) => {
      setPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalGames: prev.totalGames + 1,
          totalWins: prev.totalWins + (won ? 1 : 0),
          totalLosses: prev.totalLosses + (won ? 0 : 1),
          currentStreak: won ? prev.currentStreak + 1 : 0,
          bestStreak: won
            ? Math.max(prev.bestStreak, prev.currentStreak + 1)
            : prev.bestStreak,
        };
      });

      // Sync to DB
      const id = getPlayerId();
      try {
        const updates: Record<string, unknown> = {
          total_games: (player?.totalGames ?? 0) + 1,
          total_wins: (player?.totalWins ?? 0) + (won ? 1 : 0),
          total_losses: (player?.totalLosses ?? 0) + (won ? 0 : 1),
        };

        if (won) {
          updates.current_streak = (player?.currentStreak ?? 0) + 1;
          updates.best_streak = Math.max(
            player?.bestStreak ?? 0,
            (player?.currentStreak ?? 0) + 1
          );
        } else {
          updates.current_streak = 0;
        }

        await supabase
          .from('arcade_players')
          .update(updates)
          .eq('id', id);
      } catch {
        // Fail silently
      }
    },
    [getPlayerId, player]
  );

  return {
    player,
    loading,
    isNewPlayer,
    setDisplayName,
    updateStats,
    getPlayerId,
    getDisplayName,
  };
}

function createLocalPlayer(id: string, name: string): PlayerStats {
  const now = new Date().toISOString();
  return {
    id,
    displayName: name,
    eloRating: ELO.DEFAULT_RATING,
    rankTier: 'bronze',
    totalWins: 0,
    totalLosses: 0,
    totalGames: 0,
    currentStreak: 0,
    bestStreak: 0,
    createdAt: now,
    updatedAt: now,
  };
}
