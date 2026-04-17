// ─── Leaderboard — Top players with rank badges and time tabs ────────────────

import { cn } from '@/lib/utils';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import { RankBadge } from './RankBadge';
import type { LeaderboardEntry } from '@/lib/arcade/types';

type TimeRange = 'today' | 'week' | 'all';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  title?: string;
  className?: string;
  compact?: boolean;
}

const timeRangeLabels: Record<TimeRange, string> = {
  today: 'Today',
  week: 'This Week',
  all: 'All Time',
};

export function Leaderboard({
  entries,
  loading,
  timeRange,
  onTimeRangeChange,
  title = 'Leaderboard',
  className,
  compact,
}: LeaderboardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {title}
          </h3>
        </div>

        {/* Time range tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['today', 'week', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={cn(
                'flex-1 text-xs sm:text-sm font-medium py-1.5 px-3 rounded-md transition-all',
                timeRange === range
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {timeRangeLabels[range]}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className={cn('p-2', compact ? 'max-h-[300px]' : 'max-h-[500px]', 'overflow-y-auto')}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No scores yet. Be the first!
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl transition-colors',
                  i === 0 && 'bg-yellow-500/10 dark:bg-yellow-500/5',
                  i === 1 && 'bg-gray-500/10 dark:bg-gray-500/5',
                  i === 2 && 'bg-amber-500/10 dark:bg-amber-500/5',
                  i > 2 && 'hover:bg-muted/50'
                )}
              >
                {/* Position */}
                <div className="w-8 text-center flex-shrink-0">
                  {i === 0 ? (
                    <span className="text-xl">🥇</span>
                  ) : i === 1 ? (
                    <span className="text-xl">🥈</span>
                  ) : i === 2 ? (
                    <span className="text-xl">🥉</span>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">
                      {entry.playerName}
                    </span>
                    {entry.rankTier && (
                      <RankBadge tier={entry.rankTier} size="sm" showLabel={false} />
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <span className="font-bold tabular-nums text-base">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
