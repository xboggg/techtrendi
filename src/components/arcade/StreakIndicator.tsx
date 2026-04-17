// ─── StreakIndicator — Fire chain showing current streak ──────────────────────

import { cn } from '@/lib/utils';
import { getStreakMultiplier } from '@/lib/arcade/constants';

interface StreakIndicatorProps {
  streak: number;
  className?: string;
}

export function StreakIndicator({ streak, className }: StreakIndicatorProps) {
  if (streak <= 0) return null;

  const multiplier = getStreakMultiplier(streak);
  const fireCount = Math.min(streak, 5); // max 5 fire icons

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center">
        {Array.from({ length: fireCount }).map((_, i) => (
          <span
            key={i}
            className="text-lg animate-bounce"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.6s',
            }}
          >
            🔥
          </span>
        ))}
      </div>
      <span className="font-bold text-orange-500 dark:text-orange-400 tabular-nums">
        {streak}
      </span>
      {multiplier > 1 && (
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
          {multiplier}x
        </span>
      )}
    </div>
  );
}
