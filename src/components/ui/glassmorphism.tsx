import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  border?: boolean;
  hover?: boolean;
}

/**
 * Glassmorphism card component with frosted glass effect
 */
export function GlassCard({
  children,
  className,
  blur = 'md',
  opacity = 0.7,
  border = true,
  hover = true,
}: GlassCardProps) {
  const blurValues = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  return (
    <div
      className={cn(
        'rounded-2xl',
        blurValues[blur],
        border && 'border border-white/20 dark:border-white/10',
        hover && 'transition-all duration-300 hover:shadow-xl hover:scale-[1.02]',
        className
      )}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${opacity})`,
      }}
    >
      <style>
        {`
          .dark [data-glass-card] {
            background-color: rgba(30, 30, 30, ${opacity});
          }
        `}
      </style>
      <div data-glass-card className="dark:bg-gray-800/70">
        {children}
      </div>
    </div>
  );
}

/**
 * Glass panel for overlays and modals
 */
interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Glass navbar component
 */
interface GlassNavbarProps {
  children: ReactNode;
  className?: string;
  scrolled?: boolean;
}

export function GlassNavbar({ children, className, scrolled }: GlassNavbarProps) {
  return (
    <nav
      className={cn(
        'transition-all duration-300',
        scrolled
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg'
          : 'bg-transparent',
        className
      )}
    >
      {children}
    </nav>
  );
}

/**
 * Glass button component
 */
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'light' | 'dark' | 'primary';
}

export function GlassButton({
  children,
  className,
  variant = 'light',
  ...props
}: GlassButtonProps) {
  const variants = {
    light:
      'bg-white/30 hover:bg-white/50 text-gray-800 border-white/40',
    dark:
      'bg-black/30 hover:bg-black/50 text-white border-white/20',
    primary:
      'bg-primary/30 hover:bg-primary/50 text-primary-foreground border-primary/40',
  };

  return (
    <button
      className={cn(
        'px-6 py-3 rounded-xl backdrop-blur-md border transition-all duration-200 font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Glass input component
 */
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function GlassInput({ label, className, ...props }: GlassInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400',
          className
        )}
        {...props}
      />
    </div>
  );
}

/**
 * Glass badge component
 */
interface GlassBadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function GlassBadge({
  children,
  className,
  variant = 'default',
}: GlassBadgeProps) {
  const variants = {
    default: 'bg-white/40 text-gray-800 dark:bg-white/20 dark:text-white',
    success: 'bg-green-500/30 text-green-700 dark:text-green-300',
    warning: 'bg-yellow-500/30 text-yellow-700 dark:text-yellow-300',
    error: 'bg-red-500/30 text-red-700 dark:text-red-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export default GlassCard;
