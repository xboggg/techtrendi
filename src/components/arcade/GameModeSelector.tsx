// ─── GameModeSelector — Beautiful card-based game mode picker ────────────────

import { cn } from '@/lib/utils';
import { Bot, Users, Wifi } from 'lucide-react';
import type { GameMode } from '@/lib/arcade/types';

interface GameModeSelectorProps {
  onSelect: (mode: GameMode) => void;
  disabled?: boolean;
  className?: string;
}

const modes: {
  mode: GameMode;
  label: string;
  description: string;
  icon: typeof Bot;
  gradient: string;
  hoverGradient: string;
}[] = [
  {
    mode: 'solo',
    label: 'Solo',
    description: 'Play against AI',
    icon: Bot,
    gradient: 'from-violet-500 to-purple-600',
    hoverGradient: 'hover:from-violet-400 hover:to-purple-500',
  },
  {
    mode: 'local',
    label: 'Local',
    description: 'Same device, 2 players',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-600',
    hoverGradient: 'hover:from-emerald-400 hover:to-teal-500',
  },
  {
    mode: 'online',
    label: 'Online',
    description: 'Play with anyone',
    icon: Wifi,
    gradient: 'from-blue-500 to-cyan-600',
    hoverGradient: 'hover:from-blue-400 hover:to-cyan-500',
  },
];

export function GameModeSelector({ onSelect, disabled, className }: GameModeSelectorProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4', className)}>
      {modes.map(({ mode, label, description, icon: Icon, gradient, hoverGradient }) => (
        <button
          key={mode}
          onClick={() => onSelect(mode)}
          disabled={disabled}
          className={cn(
            'group relative flex flex-col items-center justify-center',
            'rounded-2xl p-6 sm:p-8',
            'bg-gradient-to-br', gradient,
            'text-white shadow-lg',
            'transition-all duration-300 ease-out',
            'hover:scale-[1.03] hover:shadow-xl',
            hoverGradient,
            'active:scale-[0.98]',
            'min-h-[120px] sm:min-h-[160px]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
            'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-background'
          )}
        >
          {/* Decorative circles */}
          <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/10 -translate-y-4 translate-x-4" />
          <div className="absolute bottom-1 left-1 w-10 h-10 rounded-full bg-white/5" />

          <Icon className="w-10 h-10 sm:w-12 sm:h-12 mb-3 drop-shadow-md transition-transform duration-300 group-hover:-translate-y-1" />
          <span className="text-lg sm:text-xl font-bold tracking-wide">{label}</span>
          <span className="text-xs sm:text-sm text-white/80 mt-1">{description}</span>
        </button>
      ))}
    </div>
  );
}
