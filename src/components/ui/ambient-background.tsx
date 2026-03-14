import React from 'react';
import { cn } from '@/lib/utils';

interface AmbientOrbProps {
  color: 'blue' | 'purple' | 'pink' | 'cyan';
  size?: number;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  delay?: number;
  blur?: number;
}

const orbColors = {
  blue: 'hsl(214, 100%, 60%)',
  purple: 'hsl(263, 84%, 60%)',
  pink: 'hsl(330, 80%, 55%)',
  cyan: 'hsl(180, 100%, 50%)',
};

function AmbientOrb({ color, size = 300, position, delay = 0, blur = 80 }: AmbientOrbProps) {
  return (
    <div
      className="absolute rounded-full pointer-events-none animate-nebula"
      style={{
        width: size,
        height: size,
        ...position,
        background: `radial-gradient(circle, ${orbColors[color]} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity: 0.3,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

interface AmbientBackgroundProps {
  variant?: 'default' | 'hero' | 'section' | 'subtle';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Ambient background with floating gradient orbs
 * Creates atmospheric depth and visual interest
 */
export function AmbientBackground({
  variant = 'default',
  className,
  children,
}: AmbientBackgroundProps) {
  const configs = {
    default: [
      { color: 'blue' as const, size: 400, position: { top: '-10%', left: '10%' }, delay: 0 },
      { color: 'purple' as const, size: 350, position: { top: '20%', right: '5%' }, delay: 2 },
      { color: 'pink' as const, size: 300, position: { bottom: '10%', left: '20%' }, delay: 4 },
    ],
    hero: [
      { color: 'blue' as const, size: 600, position: { top: '-20%', left: '-10%' }, delay: 0, blur: 100 },
      { color: 'purple' as const, size: 500, position: { top: '10%', right: '-5%' }, delay: 1.5, blur: 90 },
      { color: 'pink' as const, size: 450, position: { bottom: '-15%', left: '30%' }, delay: 3, blur: 95 },
      { color: 'cyan' as const, size: 350, position: { bottom: '20%', right: '20%' }, delay: 4.5, blur: 80 },
    ],
    section: [
      { color: 'blue' as const, size: 300, position: { top: '0%', right: '10%' }, delay: 0, blur: 70 },
      { color: 'purple' as const, size: 250, position: { bottom: '10%', left: '5%' }, delay: 2, blur: 60 },
    ],
    subtle: [
      { color: 'blue' as const, size: 200, position: { top: '10%', right: '15%' }, delay: 0, blur: 50 },
    ],
  };

  const orbs = configs[variant];

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Ambient orbs layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {orbs.map((orb, index) => (
          <AmbientOrb key={index} {...orb} />
        ))}
      </div>

      {/* Noise texture overlay for premium feel */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      {children}
    </div>
  );
}

interface SectionGlowProps {
  color?: 'blue' | 'purple' | 'pink';
  position?: 'top' | 'bottom';
  className?: string;
}

/**
 * Subtle glow line for section dividers
 */
export function SectionGlow({ color = 'blue', position = 'top', className }: SectionGlowProps) {
  const colors = {
    blue: 'from-transparent via-blue-500/30 to-transparent',
    purple: 'from-transparent via-purple-500/30 to-transparent',
    pink: 'from-transparent via-pink-500/30 to-transparent',
  };

  return (
    <div
      className={cn(
        'absolute left-0 right-0 h-px',
        position === 'top' ? 'top-0' : 'bottom-0',
        `bg-gradient-to-r ${colors[color]}`,
        className
      )}
    />
  );
}

interface SpotlightProps {
  className?: string;
  size?: number;
}

/**
 * Interactive spotlight that follows cursor
 */
export function Spotlight({ className, size = 400 }: SpotlightProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('absolute inset-0 overflow-hidden', className)}>
      <div
        className="pointer-events-none absolute transition-opacity duration-300"
        style={{
          width: size,
          height: size,
          left: position.x - size / 2,
          top: position.y - size / 2,
          background: `radial-gradient(circle, hsla(214, 100%, 60%, 0.15) 0%, transparent 70%)`,
          opacity: isVisible ? 1 : 0,
        }}
      />
    </div>
  );
}

export default AmbientBackground;
