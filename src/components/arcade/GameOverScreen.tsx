// ─── GameOverScreen — Score display, rank change, streak, actions ────────────

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Share2, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { RankBadge } from './RankBadge';
import { StreakIndicator } from './StreakIndicator';
import type { RankTier } from '@/lib/arcade/types';

interface GameOverScreenProps {
  won: boolean;
  isDraw?: boolean;
  score: number;
  opponentScore?: number;
  eloChange?: number;
  newRating?: number;
  rankTier?: RankTier;
  streak?: number;
  onPlayAgain: () => void;
  onShare?: () => void;
  onBackToArcade: () => void;
  playerName?: string;
  opponentName?: string;
  className?: string;
}

export function GameOverScreen({
  won,
  isDraw,
  score,
  opponentScore,
  eloChange,
  newRating,
  rankTier,
  streak,
  onPlayAgain,
  onShare,
  onBackToArcade,
  playerName,
  opponentName,
  className,
}: GameOverScreenProps) {
  // Confetti particles
  const particles = useMemo(() => {
    if (!won) return [];
    const emojis = ['🎉', '🏆', '⭐', '🎊', '✨', '💫', '🌟'];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 1.5,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
  }, [won]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('max-w-md mx-auto text-center relative overflow-hidden', className)}
    >
      {/* Confetti */}
      {won &&
        particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute text-2xl pointer-events-none"
            style={{ left: `${p.x}%` }}
            initial={{ y: -20, opacity: 1 }}
            animate={{ y: 400, opacity: 0, rotate: 360 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeIn',
            }}
          >
            {p.emoji}
          </motion.span>
        ))}

      {/* Result icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className={cn(
          'w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center',
          won
            ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30'
            : isDraw
            ? 'bg-gradient-to-br from-gray-400 to-gray-500'
            : 'bg-gradient-to-br from-red-400 to-rose-500'
        )}
      >
        <Trophy className={cn('w-12 h-12', won ? 'text-white' : 'text-white/70')} />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={cn(
          'text-3xl font-black mb-1',
          won
            ? 'text-yellow-500 dark:text-yellow-400'
            : isDraw
            ? 'text-gray-500'
            : 'text-red-500 dark:text-red-400'
        )}
      >
        {won ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat'}
      </motion.h2>

      {playerName && (
        <p className="text-muted-foreground text-sm mb-4">
          {won ? `${playerName} wins!` : isDraw ? 'It is a tie!' : `${opponentName || 'Opponent'} wins!`}
        </p>
      )}

      {/* Score */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-6 mb-6"
      >
        <div className="text-center">
          <div className="text-4xl font-black tabular-nums">{score}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">You</div>
        </div>
        {opponentScore !== undefined && (
          <>
            <div className="text-2xl text-muted-foreground font-bold">vs</div>
            <div className="text-center">
              <div className="text-4xl font-black tabular-nums text-muted-foreground">
                {opponentScore}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                {opponentName || 'Opponent'}
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ELO change + Rank */}
      {(eloChange !== undefined || rankTier) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-4 mb-4"
        >
          {rankTier && <RankBadge tier={rankTier} rating={newRating} showRating />}
          {eloChange !== undefined && eloChange !== 0 && (
            <div
              className={cn(
                'flex items-center gap-1 font-bold text-sm',
                eloChange > 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {eloChange > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {eloChange > 0 ? '+' : ''}{eloChange} ELO
            </div>
          )}
        </motion.div>
      )}

      {/* Streak */}
      {streak !== undefined && streak > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center mb-6"
        >
          <StreakIndicator streak={streak} />
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-3"
      >
        <Button
          size="lg"
          className="w-full h-14 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          onClick={onPlayAgain}
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Play Again
        </Button>

        <div className="flex gap-3">
          {onShare && (
            <Button
              size="lg"
              variant="outline"
              className="flex-1 h-12"
              onClick={onShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
          <Button
            size="lg"
            variant="ghost"
            className="flex-1 h-12"
            onClick={onBackToArcade}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Arcade
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
