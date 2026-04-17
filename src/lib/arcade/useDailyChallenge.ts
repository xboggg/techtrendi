// ─── useDailyChallenge — Daily challenge management ──────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from './constants';
import type { GameSlug, DailyChallenge } from './types';

interface UseDailyChallengeOptions {
  gameSlug?: GameSlug;
}

interface UseDailyChallengeReturn {
  challenge: DailyChallenge | null;
  loading: boolean;
  alreadyPlayed: boolean;
  myScore: number | null;
  timeUntilNext: string;
  submitScore: (playerId: string, score: number, metadata?: Record<string, unknown>) => Promise<boolean>;
}

function getTodayKey(gameSlug?: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${STORAGE_KEYS.DAILY_PLAYED}_${gameSlug || 'global'}_${today}`;
}

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function useDailyChallenge(options: UseDailyChallengeOptions = {}): UseDailyChallengeReturn {
  const { gameSlug } = options;

  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState(getTimeUntilMidnight());

  // Check localStorage for whether today's challenge was already played
  useEffect(() => {
    const key = getTodayKey(gameSlug);
    const stored = localStorage.getItem(key);
    if (stored) {
      setAlreadyPlayed(true);
      try {
        const parsed = JSON.parse(stored);
        setMyScore(parsed.score ?? null);
      } catch {
        // ignore
      }
    }
  }, [gameSlug]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilNext(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's challenge from DB
  useEffect(() => {
    async function fetchChallenge() {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        let query = supabase
          .from('arcade_daily_challenges')
          .select('*')
          .eq('challenge_date', today);

        if (gameSlug) {
          query = query.eq('game_slug', gameSlug);
        }

        const { data, error } = await query.limit(1).maybeSingle();

        if (error) {
          console.warn('Daily challenge fetch error:', error.message);
          // Generate a local fallback challenge
          setChallenge(generateLocalChallenge(gameSlug));
          return;
        }

        if (data) {
          setChallenge({
            id: data.id as string,
            gameSlug: data.game_slug as GameSlug,
            challengeDate: data.challenge_date as string,
            seed: data.seed as number,
            config: (data.config || {}) as Record<string, unknown>,
          });
        } else {
          // No challenge in DB yet — generate local one
          setChallenge(generateLocalChallenge(gameSlug));
        }
      } catch {
        setChallenge(generateLocalChallenge(gameSlug));
      } finally {
        setLoading(false);
      }
    }

    fetchChallenge();
  }, [gameSlug]);

  const submitScore = useCallback(
    async (
      playerId: string,
      score: number,
      metadata?: Record<string, unknown>
    ): Promise<boolean> => {
      if (!challenge) return false;

      // Mark as played locally
      const key = getTodayKey(gameSlug);
      localStorage.setItem(key, JSON.stringify({ score, playedAt: new Date().toISOString() }));
      setAlreadyPlayed(true);
      setMyScore(score);

      // Try to persist to DB
      try {
        await supabase.from('arcade_daily_scores').insert({
          challenge_id: challenge.id,
          player_id: playerId,
          score,
          metadata: metadata || {},
        });
        return true;
      } catch {
        return false;
      }
    },
    [challenge, gameSlug]
  );

  return {
    challenge,
    loading,
    alreadyPlayed,
    myScore,
    timeUntilNext,
    submitScore,
  };
}

// Generate a deterministic local challenge based on today's date
function generateLocalChallenge(gameSlug?: GameSlug): DailyChallenge {
  const today = new Date().toISOString().split('T')[0];
  // Use date string to create a deterministic seed
  const seed = today.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0) * 1337;

  return {
    id: `local-${today}-${gameSlug || 'global'}`,
    gameSlug: gameSlug || 'math-tug-of-war',
    challengeDate: today,
    seed,
    config: {
      difficulty: 'medium',
      timeLimit: 60,
      isLocal: true,
    },
  };
}
