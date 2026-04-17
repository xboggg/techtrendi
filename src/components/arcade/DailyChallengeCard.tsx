// ─── DailyChallengeCard — Today's challenge with countdown ───────────────────

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Trophy, Check, Loader2 } from 'lucide-react';
import { ARCADE_GAMES } from '@/lib/arcade/constants';

interface DailyChallengeCardProps {
  gameSlug?: string;
  timeUntilNext: string;
  alreadyPlayed: boolean;
  myScore: number | null;
  loading?: boolean;
  onPlay: () => void;
  className?: string;
}

export function DailyChallengeCard({
  gameSlug,
  timeUntilNext,
  alreadyPlayed,
  myScore,
  loading,
  onPlay,
  className,
}: DailyChallengeCardProps) {
  const game = ARCADE_GAMES.find((g) => g.slug === gameSlug);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border',
        'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10',
        'dark:from-amber-500/5 dark:via-orange-500/5 dark:to-red-500/5',
        className
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Daily Challenge
              </span>
            </div>
            <h3 className="font-bold text-lg">{today}</h3>
            {game && (
              <p className="text-sm text-muted-foreground mt-0.5">{game.name}</p>
            )}
          </div>

          {/* Countdown */}
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <Clock className="w-3 h-3" />
              <span>Next in</span>
            </div>
            <div className="font-mono font-bold text-sm tabular-nums">
              {timeUntilNext}
            </div>
          </div>
        </div>

        {/* Status / Play button */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : alreadyPlayed ? (
          <div className="flex items-center justify-between bg-green-500/10 dark:bg-green-500/5 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="font-medium text-sm">Completed!</span>
            </div>
            {myScore !== null && (
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-bold tabular-nums">{myScore.toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold"
            onClick={onPlay}
          >
            <Trophy className="w-5 h-5 mr-2" />
            Play Today's Challenge
          </Button>
        )}
      </div>
    </div>
  );
}
