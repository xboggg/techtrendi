// ─── RankBadge — Tier badge with icon, color, and animated glow ──────────────

import { cn } from '@/lib/utils';
import { RANK_TIERS, type RankTierConfig } from '@/lib/arcade/constants';
import type { RankTier } from '@/lib/arcade/types';

interface RankBadgeProps {
  tier: RankTier;
  rating?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showRating?: boolean;
  className?: string;
}

function getTierConfig(tier: RankTier): RankTierConfig {
  return RANK_TIERS.find((t) => t.tier === tier) || RANK_TIERS[0];
}

export function RankBadge({
  tier,
  rating,
  size = 'md',
  showLabel = true,
  showRating = false,
  className,
}: RankBadgeProps) {
  const config = getTierConfig(tier);
  const hasGlow = tier === 'diamond' || tier === 'legend';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold border',
        'transition-all duration-300',
        sizeClasses[size],
        config.bgColor,
        config.color,
        config.borderColor,
        hasGlow && config.glowColor,
        hasGlow && 'animate-pulse',
        className
      )}
    >
      <span className={iconSizes[size]}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
      {showRating && rating !== undefined && (
        <span className="opacity-70 text-[0.85em]">({rating})</span>
      )}
    </span>
  );
}
