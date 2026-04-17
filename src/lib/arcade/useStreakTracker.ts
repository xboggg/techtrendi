// ─── useStreakTracker — Track consecutive wins ───────────────────────────────

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS, getStreakMultiplier } from './constants';
import type { StreakInfo } from './types';

interface UseStreakTrackerReturn {
  streak: StreakInfo;
  multiplier: number;
  recordWin: () => void;
  recordLoss: () => void;
  syncToDb: (playerId: string) => Promise<void>;
}

function loadStreakFromStorage(): StreakInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    current: 0,
    best: 0,
    lastGameDate: null,
    isActive: false,
  };
}

function saveStreakToStorage(streak: StreakInfo) {
  try {
    localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streak));
  } catch {
    // ignore
  }
}

export function useStreakTracker(): UseStreakTrackerReturn {
  const [streak, setStreak] = useState<StreakInfo>(loadStreakFromStorage);

  // Persist to localStorage whenever streak changes
  useEffect(() => {
    saveStreakToStorage(streak);
  }, [streak]);

  const recordWin = useCallback(() => {
    setStreak((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const newCurrent = prev.current + 1;
      const newBest = Math.max(prev.best, newCurrent);
      return {
        current: newCurrent,
        best: newBest,
        lastGameDate: today,
        isActive: true,
      };
    });
  }, []);

  const recordLoss = useCallback(() => {
    setStreak((prev) => {
      const today = new Date().toISOString().split('T')[0];
      return {
        ...prev,
        current: 0,
        lastGameDate: today,
        isActive: false,
      };
    });
  }, []);

  const syncToDb = useCallback(
    async (playerId: string) => {
      try {
        await supabase
          .from('arcade_players')
          .update({
            current_streak: streak.current,
            best_streak: streak.best,
          })
          .eq('id', playerId);
      } catch {
        // Fail silently - localStorage is the primary store
      }
    },
    [streak]
  );

  const multiplier = getStreakMultiplier(streak.current);

  return {
    streak,
    multiplier,
    recordWin,
    recordLoss,
    syncToDb,
  };
}
