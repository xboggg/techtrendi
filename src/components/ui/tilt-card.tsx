import React, { ReactNode, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  perspective?: number;
  scale?: number;
  glare?: boolean;
  glareOpacity?: number;
}

/**
 * 3D Tilt Card that responds to mouse position
 */
export function TiltCard({
  children,
  className,
  intensity = 15,
  perspective = 1000,
  scale = 1.02,
  glare = true,
  glareOpacity = 0.2,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
  });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    // Glare position (percentage)
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTransform({ rotateX, rotateY, glareX, glareY });
  };

  const handleMouseEnter = () => setIsHovering(true);

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTransform({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  return (
    <div
      ref={cardRef}
      className={cn('relative transition-transform duration-200', className)}
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: isHovering
            ? `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${scale})`
            : 'rotateX(0deg) rotateY(0deg) scale(1)',
        }}
      >
        {children}

        {/* Glare Effect */}
        {glare && isHovering && (
          <div
            className="absolute inset-0 pointer-events-none rounded-inherit"
            style={{
              background: `radial-gradient(circle at ${transform.glareX}% ${transform.glareY}%, rgba(255, 255, 255, ${glareOpacity}) 0%, transparent 60%)`,
              borderRadius: 'inherit',
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Simpler hover card with lift effect
 */
interface LiftCardProps {
  children: ReactNode;
  className?: string;
  lift?: number;
  shadow?: boolean;
}

export function LiftCard({
  children,
  className,
  lift = 8,
  shadow = true,
}: LiftCardProps) {
  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        shadow && 'hover:shadow-xl',
        className
      )}
      style={{
        transform: 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `translateY(-${lift}px)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {children}
    </div>
  );
}

/**
 * Card with subtle rotation on hover
 */
interface RotateCardProps {
  children: ReactNode;
  className?: string;
  rotation?: number;
}

export function RotateCard({
  children,
  className,
  rotation = 2,
}: RotateCardProps) {
  return (
    <div
      className={cn(
        'transition-transform duration-300 ease-out hover:scale-[1.02]',
        className
      )}
      style={{
        transform: 'rotate(0deg)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `rotate(${rotation}deg) scale(1.02)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
      }}
    >
      {children}
    </div>
  );
}

export default TiltCard;
