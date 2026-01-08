import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ReadingProgressProps {
  className?: string;
  color?: string;
  height?: number;
  showPercentage?: boolean;
  position?: 'top' | 'bottom';
}

export function ReadingProgress({
  className,
  color,
  height = 3,
  showPercentage = false,
  position = 'top',
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    calculateProgress();
    window.addEventListener('scroll', calculateProgress, { passive: true });
    window.addEventListener('resize', calculateProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', calculateProgress);
      window.removeEventListener('resize', calculateProgress);
    };
  }, []);

  return (
    <>
      <div
        className={cn(
          'fixed left-0 right-0 z-50 transition-all duration-150',
          position === 'top' ? 'top-0' : 'bottom-0',
          className
        )}
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      >
        <div
          className={cn(
            'h-full transition-all duration-150 ease-out',
            color || 'bg-gradient-to-r from-primary via-purple-500 to-pink-500'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {showPercentage && progress > 0 && (
        <div
          className={cn(
            'fixed right-4 z-50 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg text-sm font-medium',
            position === 'top' ? 'top-4' : 'bottom-4'
          )}
        >
          {Math.round(progress)}%
        </div>
      )}
    </>
  );
}

// Circular Reading Progress
export function CircularReadingProgress({
  className,
  size = 48,
  strokeWidth = 4,
}: {
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    calculateProgress();
    window.addEventListener('scroll', calculateProgress, { passive: true });

    return () => window.removeEventListener('scroll', calculateProgress);
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (progress === 0) return null;

  return (
    <div
      className={cn('fixed bottom-20 right-4 z-40', className)}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-150 ease-out"
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
        {Math.round(progress)}%
      </span>
    </div>
  );
}

// Reading Time Estimator
export function ReadingTime({
  content,
  wordsPerMinute = 200,
  className,
}: {
  content: string;
  wordsPerMinute?: number;
  className?: string;
}) {
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  return (
    <span className={cn('text-sm text-muted-foreground', className)}>
      {readingTime} min read
    </span>
  );
}

// Estimated Time with Icon
export function ReadingTimeWithIcon({
  minutes,
  className,
}: {
  minutes: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span>{minutes} min read</span>
    </div>
  );
}

export default ReadingProgress;
