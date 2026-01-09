import { useState, useEffect, ReactNode } from 'react';
import { Check, Circle, Loader2, AlertCircle, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Circular Progress
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
  color?: string;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 'md',
  strokeWidth = 8,
  showValue = true,
  label,
  color = 'stroke-primary',
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: { width: 48, fontSize: 'text-xs' },
    md: { width: 80, fontSize: 'text-lg' },
    lg: { width: 120, fontSize: 'text-2xl' },
    xl: { width: 160, fontSize: 'text-3xl' },
  };

  const { width, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width, height: width }}>
        <svg className="transform -rotate-90" width={width} height={width}>
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none stroke-muted"
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn('fill-none transition-all duration-500', color)}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-bold text-foreground', fontSize)}>
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

// Linear Progress Bar
interface LinearProgressProps {
  value: number;
  max?: number;
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  striped?: boolean;
  className?: string;
}

export function LinearProgress({
  value,
  max = 100,
  showValue = true,
  showLabel = false,
  label,
  color = 'primary',
  size = 'md',
  animated = false,
  striped = false,
  className,
}: LinearProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colors = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    destructive: 'bg-red-500',
  };

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {showLabel && label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showValue && <span className="text-sm font-medium text-foreground">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            colors[color],
            striped && 'bg-stripes',
            animated && 'animate-progress-stripes'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Step Progress
interface Step {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

interface StepProgressProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function StepProgress({ steps, orientation = 'horizontal', className }: StepProgressProps) {
  const isVertical = orientation === 'vertical';

  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'current':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStepColors = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'current':
        return 'bg-primary text-primary-foreground border-primary';
      case 'error':
        return 'bg-red-500 text-white border-red-500';
      default:
        return 'bg-background text-muted-foreground border-muted';
    }
  };

  return (
    <div
      className={cn(
        'flex',
        isVertical ? 'flex-col gap-4' : 'items-center justify-between',
        className
      )}
    >
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn('flex items-center', isVertical ? 'gap-4' : 'flex-1')}
        >
          {/* Step indicator */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors',
                getStepColors(step.status)
              )}
            >
              {getStepIcon(step.status)}
            </div>
            {!isVertical && index < steps.length - 1 && (
              <div className="flex-1 h-0.5 w-full mt-5 -ml-2">
                <div
                  className={cn(
                    'h-full transition-colors',
                    step.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                  )}
                />
              </div>
            )}
          </div>

          {/* Step content */}
          <div className={cn(isVertical ? 'flex-1' : 'mt-2 text-center')}>
            <h4
              className={cn(
                'text-sm font-medium',
                step.status === 'current' ? 'text-primary' : 'text-foreground'
              )}
            >
              {step.label}
            </h4>
            {step.description && (
              <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
            )}
          </div>

          {/* Connector line for vertical */}
          {isVertical && index < steps.length - 1 && (
            <div className="absolute left-5 top-12 w-0.5 h-8 bg-muted" />
          )}
        </div>
      ))}
    </div>
  );
}

// Reading Progress Bar
export function ReadingProgress({ className }: { className?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(scrollPercent);
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className={cn('fixed top-0 left-0 right-0 z-50 h-1 bg-muted', className)}>
      <div
        className="h-full bg-primary transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Loading Progress
interface LoadingProgressProps {
  isLoading: boolean;
  children: ReactNode;
  loadingText?: string;
  className?: string;
}

export function LoadingProgress({
  isLoading,
  children,
  loadingText = 'Loading...',
  className,
}: LoadingProgressProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={cn('relative', className)}>
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        <span className="text-sm text-muted-foreground">{loadingText}</span>
      </div>
    </div>
  );
}

// Multi-segment Progress
interface Segment {
  value: number;
  color: string;
  label?: string;
}

interface MultiProgressProps {
  segments: Segment[];
  max?: number;
  showLegend?: boolean;
  className?: string;
}

export function MultiProgress({ segments, max = 100, showLegend = true, className }: MultiProgressProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const normalizedMax = max || total;

  return (
    <div className={className}>
      <div className="h-3 bg-muted rounded-full overflow-hidden flex">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={cn('h-full first:rounded-l-full last:rounded-r-full', segment.color)}
            style={{ width: `${(segment.value / normalizedMax) * 100}%` }}
          />
        ))}
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-4 mt-3">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', segment.color)} />
              <span className="text-sm text-muted-foreground">
                {segment.label || `Segment ${index + 1}`}: {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Countdown Timer
interface CountdownProps {
  targetDate: Date;
  onComplete?: () => void;
  className?: string;
}

export function Countdown({ targetDate, onComplete, className }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - Date.now();

      if (difference <= 0) {
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="bg-card border border-border rounded-lg p-3 min-w-[60px]">
            <span className="text-2xl font-bold text-foreground">{String(value).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 capitalize">{unit}</span>
        </div>
      ))}
    </div>
  );
}

// Estimated Time
export function EstimatedTime({
  minutes,
  className,
}: {
  minutes: number;
  className?: string;
}) {
  const formatTime = () => {
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 min read';
    if (minutes < 60) return `${minutes} min read`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m read`;
  };

  return (
    <div className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
      <Clock className="w-4 h-4" />
      <span>{formatTime()}</span>
    </div>
  );
}

export default CircularProgress;
