import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSmartNavbar, useReadingProgress } from '@/hooks/useScrollAnimation';

interface SmartNavbarProps {
  children: ReactNode;
  className?: string;
  showProgress?: boolean;
  threshold?: number;
}

/**
 * Smart Navbar that hides on scroll down, shows on scroll up
 */
export function SmartNavbar({
  children,
  className,
  showProgress = false,
  threshold = 100,
}: SmartNavbarProps) {
  const { isHidden, isScrolled } = useSmartNavbar(threshold);
  const progress = useReadingProgress();

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        isHidden && '-translate-y-full',
        isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-md'
          : 'bg-transparent',
        className
      )}
    >
      {children}

      {/* Reading Progress Bar */}
      {showProgress && isScrolled && (
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
          style={{ width: `${progress}%` }}
        />
      )}
    </header>
  );
}

/**
 * Reading Progress Bar (standalone component)
 */
interface ReadingProgressBarProps {
  className?: string;
  color?: string;
  height?: number;
  position?: 'top' | 'bottom';
}

export function ReadingProgressBar({
  className,
  color,
  height = 3,
  position = 'top',
}: ReadingProgressBarProps) {
  const progress = useReadingProgress();

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
      style={{ height: `${height}px` }}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 transition-all duration-100"
        style={{
          width: `${progress}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

export default SmartNavbar;
