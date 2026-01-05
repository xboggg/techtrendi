import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GradientPreset =
  | 'aurora'
  | 'sunset'
  | 'ocean'
  | 'forest'
  | 'purple-haze'
  | 'tech-blue'
  | 'warm-glow'
  | 'midnight';

interface GradientMeshProps {
  children?: ReactNode;
  preset?: GradientPreset;
  className?: string;
  animated?: boolean;
  overlay?: boolean;
  overlayOpacity?: number;
}

const gradientPresets: Record<GradientPreset, string> = {
  aurora: `
    radial-gradient(at 40% 20%, rgba(0, 255, 136, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(0, 204, 255, 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(136, 0, 255, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 50%, rgba(0, 255, 204, 0.2) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(0, 136, 255, 0.2) 0px, transparent 50%)
  `,
  sunset: `
    radial-gradient(at 0% 0%, rgba(255, 136, 0, 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 20%, rgba(255, 68, 136, 0.3) 0px, transparent 50%),
    radial-gradient(at 40% 80%, rgba(255, 0, 68, 0.3) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(255, 204, 0, 0.2) 0px, transparent 50%)
  `,
  ocean: `
    radial-gradient(at 0% 100%, rgba(0, 68, 255, 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 80%, rgba(0, 136, 255, 0.3) 0px, transparent 50%),
    radial-gradient(at 40% 20%, rgba(0, 204, 255, 0.3) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(136, 204, 255, 0.2) 0px, transparent 50%)
  `,
  forest: `
    radial-gradient(at 0% 50%, rgba(34, 197, 94, 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 20%, rgba(16, 185, 129, 0.3) 0px, transparent 50%),
    radial-gradient(at 40% 100%, rgba(5, 150, 105, 0.3) 0px, transparent 50%),
    radial-gradient(at 100% 80%, rgba(110, 231, 183, 0.2) 0px, transparent 50%)
  `,
  'purple-haze': `
    radial-gradient(at 40% 20%, rgba(147, 51, 234, 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(192, 132, 252, 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(124, 58, 237, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 80%, rgba(167, 139, 250, 0.2) 0px, transparent 50%)
  `,
  'tech-blue': `
    radial-gradient(at 40% 20%, rgba(0, 102, 255, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(59, 130, 246, 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(37, 99, 235, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 50%, rgba(96, 165, 250, 0.2) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(147, 197, 253, 0.2) 0px, transparent 50%)
  `,
  'warm-glow': `
    radial-gradient(at 0% 0%, rgba(251, 146, 60, 0.4) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(252, 211, 77, 0.3) 0px, transparent 50%),
    radial-gradient(at 50% 100%, rgba(245, 158, 11, 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(253, 186, 116, 0.2) 0px, transparent 50%)
  `,
  midnight: `
    radial-gradient(at 40% 20%, rgba(30, 58, 138, 0.5) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(55, 48, 163, 0.4) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(49, 46, 129, 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 80%, rgba(67, 56, 202, 0.3) 0px, transparent 50%)
  `,
};

/**
 * Gradient mesh background component for hero sections
 */
export function GradientMesh({
  children,
  preset = 'tech-blue',
  className,
  animated = true,
  overlay = false,
  overlayOpacity = 0.5,
}: GradientMeshProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Gradient Background */}
      <div
        className={cn(
          'absolute inset-0 -z-10',
          animated && 'animate-gradient-shift'
        )}
        style={{
          background: gradientPresets[preset],
          backgroundSize: animated ? '200% 200%' : '100% 100%',
        }}
      />

      {/* Optional Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 -z-10 bg-white dark:bg-gray-900"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content */}
      {children}

      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 15s ease infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Hero section with gradient mesh background
 */
interface GradientHeroProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  preset?: GradientPreset;
  className?: string;
  centerContent?: boolean;
}

export function GradientHero({
  title,
  subtitle,
  children,
  preset = 'tech-blue',
  className,
  centerContent = true,
}: GradientHeroProps) {
  return (
    <GradientMesh
      preset={preset}
      className={cn(
        'min-h-[50vh] flex flex-col',
        centerContent && 'items-center justify-center text-center',
        'py-20 px-4',
        className
      )}
      overlay
      overlayOpacity={0.7}
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-8">
          {subtitle}
        </p>
      )}
      {children}
    </GradientMesh>
  );
}

/**
 * Animated blob background
 */
interface BlobBackgroundProps {
  children?: ReactNode;
  className?: string;
  color1?: string;
  color2?: string;
  color3?: string;
}

export function BlobBackground({
  children,
  className,
  color1 = 'rgba(0, 102, 255, 0.3)',
  color2 = 'rgba(147, 51, 234, 0.3)',
  color3 = 'rgba(236, 72, 153, 0.3)',
}: BlobBackgroundProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Animated Blobs */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl animate-blob"
          style={{ backgroundColor: color1, top: '-10%', left: '10%' }}
        />
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl animate-blob animation-delay-2000"
          style={{ backgroundColor: color2, top: '50%', right: '10%' }}
        />
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl animate-blob animation-delay-4000"
          style={{ backgroundColor: color3, bottom: '-10%', left: '30%' }}
        />
      </div>

      {/* Content */}
      {children}

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 20s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default GradientMesh;
