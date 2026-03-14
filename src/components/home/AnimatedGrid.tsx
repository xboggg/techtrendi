import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGridProps {
  className?: string;
  lineColor?: string;
  lineOpacity?: number;
  animate?: boolean;
}

/**
 * Animated perspective grid background for hero sections
 * Creates a futuristic digital interface feel
 */
export function AnimatedGrid({
  className,
  lineColor = 'hsl(214, 100%, 70%)',
  lineOpacity = 0.5, // MUCH MORE VISIBLE
  animate = true,
}: AnimatedGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate || !gridRef.current) return;

    // Add mouse move parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gridRef.current.style.setProperty('--mouse-x', `${x * 20}px`);
      gridRef.current.style.setProperty('--mouse-y', `${y * 20}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [animate]);

  return (
    <div
      ref={gridRef}
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-none',
        className
      )}
      style={{
        perspective: '1000px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      {/* Horizontal grid lines */}
      <div
        className="absolute inset-0"
        style={{
          transform: 'rotateX(60deg) translateY(var(--mouse-y, 0)) translateZ(-100px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full"
            style={{
              top: `${i * 5}%`,
              height: '1px',
              background: `linear-gradient(90deg, transparent 0%, ${lineColor} 20%, ${lineColor} 80%, transparent 100%)`,
              opacity: lineOpacity * (1 - i * 0.03),
              animation: animate ? `grid-flow ${4 + i * 0.2}s ease-in-out infinite` : 'none',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Vertical grid lines */}
      <div
        className="absolute inset-0"
        style={{
          transform: 'rotateX(60deg) translateX(var(--mouse-x, 0)) translateZ(-100px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full"
            style={{
              left: `${i * 3.33}%`,
              width: '1px',
              background: `linear-gradient(180deg, transparent 0%, ${lineColor} 30%, ${lineColor} 70%, transparent 100%)`,
              opacity: lineOpacity * 0.7,
            }}
          />
        ))}
      </div>

      {/* Scanning line effect */}
      <div
        className="absolute w-full h-px"
        style={{
          top: '50%',
          background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)`,
          opacity: 0.6,
          animation: animate ? 'grid-scan-h 6s ease-in-out infinite' : 'none',
          boxShadow: `0 0 20px ${lineColor}, 0 0 40px ${lineColor}`,
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div
          className="absolute top-4 left-4 w-20 h-px"
          style={{ background: lineColor, opacity: lineOpacity * 2 }}
        />
        <div
          className="absolute top-4 left-4 w-px h-20"
          style={{ background: lineColor, opacity: lineOpacity * 2 }}
        />
      </div>

      <div className="absolute top-0 right-0 w-32 h-32">
        <div
          className="absolute top-4 right-4 w-20 h-px"
          style={{ background: lineColor, opacity: lineOpacity * 2 }}
        />
        <div
          className="absolute top-4 right-4 w-px h-20"
          style={{ background: lineColor, opacity: lineOpacity * 2 }}
        />
      </div>

      {/* Gradient overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}

export default AnimatedGrid;
