// ─── useRankSystem — ELO calculation and tier determination ──────────────────

import { useCallback } from 'react';
import { ELO, RANK_TIERS, type RankTierConfig } from './constants';
import type { RankTier } from './types';

interface EloResult {
  newRating: number;
  change: number;
  newTier: RankTier;
}

export function useRankSystem() {
  // Get K-factor based on player rating and games played
  const getKFactor = useCallback((rating: number, gamesPlayed: number): number => {
    if (gamesPlayed < ELO.NEW_PLAYER_THRESHOLD) {
      return ELO.K_FACTOR_NEW;
    }
    if (rating >= ELO.HIGH_RATING_THRESHOLD) {
      return ELO.K_FACTOR_HIGH;
    }
    return ELO.K_FACTOR_NORMAL;
  }, []);

  // Calculate expected score (probability of winning)
  const getExpectedScore = useCallback((ratingA: number, ratingB: number): number => {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }, []);

  // Calculate new ELO rating after a game
  const calculateElo = useCallback(
    (
      playerRating: number,
      opponentRating: number,
      won: boolean,
      gamesPlayed: number
    ): EloResult => {
      const k = getKFactor(playerRating, gamesPlayed);
      const expected = getExpectedScore(playerRating, opponentRating);
      const actual = won ? 1 : 0;
      const change = Math.round(k * (actual - expected));
      const newRating = Math.max(0, playerRating + change);

      return {
        newRating,
        change,
        newTier: getTierForRating(newRating),
      };
    },
    [getKFactor, getExpectedScore]
  );

  // Get the rank tier for a given ELO rating
  const getTierForRating = useCallback((rating: number): RankTier => {
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
      if (rating >= RANK_TIERS[i].minElo) {
        return RANK_TIERS[i].tier;
      }
    }
    return 'bronze';
  }, []);

  // Get the full tier config for a rating
  const getTierConfig = useCallback((rating: number): RankTierConfig => {
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
      if (rating >= RANK_TIERS[i].minElo) {
        return RANK_TIERS[i];
      }
    }
    return RANK_TIERS[0];
  }, []);

  // Get tier config by tier name
  const getTierByName = useCallback((tier: RankTier): RankTierConfig => {
    return RANK_TIERS.find((t) => t.tier === tier) || RANK_TIERS[0];
  }, []);

  // Calculate progress within current tier (0-100)
  const getTierProgress = useCallback((rating: number): number => {
    const config = getTierConfig(rating);
    if (config.maxElo === Infinity) return 100;
    const range = config.maxElo - config.minElo;
    const progress = rating - config.minElo;
    return Math.min(100, Math.round((progress / range) * 100));
  }, [getTierConfig]);

  return {
    calculateElo,
    getTierForRating,
    getTierConfig,
    getTierByName,
    getTierProgress,
    getExpectedScore,
  };
}
