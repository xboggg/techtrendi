// ─── useLeaderboard — Fetch and submit leaderboard entries ───────────────────

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GameSlug, LeaderboardEntry } from './types';

type TimeRange = 'today' | 'week' | 'all';

interface UseLeaderboardOptions {
  gameSlug?: GameSlug;
  timeRange?: TimeRange;
  limit?: number;
}

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  submitScore: (entry: {
    playerId: string;
    playerName: string;
    gameSlug: GameSlug;
    score: number;
    gameMode: string;
    metadata?: Record<string, unknown>;
  }) => Promise<boolean>;
  refresh: () => void;
}

function getTimeRangeFilter(range: TimeRange): string | null {
  const now = new Date();
  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (range === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return weekAgo.toISOString();
  }
  return null; // all time
}

export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const { gameSlug, limit = 10 } = options;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(options.timeRange || 'all');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('arcade_leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (gameSlug) {
        query = query.eq('game_slug', gameSlug);
      }

      const timeFilter = getTimeRangeFilter(timeRange);
      if (timeFilter) {
        query = query.gte('created_at', timeFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        // Table might not exist yet — fail silently
        console.warn('Leaderboard fetch error:', fetchError.message);
        setEntries([]);
        return;
      }

      const mapped: LeaderboardEntry[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        playerId: row.player_id as string,
        playerName: row.player_name as string,
        gameSlug: row.game_slug as GameSlug,
        score: row.score as number,
        gameMode: row.game_mode as LeaderboardEntry['gameMode'],
        rankTier: row.rank_tier as LeaderboardEntry['rankTier'],
        eloRating: row.elo_rating as number,
        metadata: (row.metadata || {}) as Record<string, unknown>,
        createdAt: row.created_at as string,
      }));

      setEntries(mapped);
    } catch (err) {
      console.warn('Leaderboard error:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [gameSlug, timeRange, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const submitScore = useCallback(
    async (entry: {
      playerId: string;
      playerName: string;
      gameSlug: GameSlug;
      score: number;
      gameMode: string;
      metadata?: Record<string, unknown>;
    }): Promise<boolean> => {
      try {
        const { error: insertError } = await supabase
          .from('arcade_leaderboard')
          .insert({
            player_id: entry.playerId,
            player_name: entry.playerName,
            game_slug: entry.gameSlug,
            score: entry.score,
            game_mode: entry.gameMode,
            metadata: entry.metadata || {},
          });

        if (insertError) {
          console.warn('Score submit error:', insertError.message);
          return false;
        }

        // Refresh the leaderboard
        fetchLeaderboard();
        return true;
      } catch {
        return false;
      }
    },
    [fetchLeaderboard]
  );

  return {
    entries,
    loading,
    error,
    timeRange,
    setTimeRange,
    submitScore,
    refresh: fetchLeaderboard,
  };
}
