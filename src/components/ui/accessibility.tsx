import React, { useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// SKIP LINK (Accessibility)
// ============================================

interface SkipLinkProps {
  href?: string;
  children?: ReactNode;
}

export function SkipLink({ href = '#main-content', children = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    >
      {children}
    </a>
  );
}

// ============================================
// FOCUS TRAP (for modals, dialogs)
// ============================================

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

export function FocusTrap({ children, active = true, className }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap activates
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// ============================================
// VISUALLY HIDDEN (Screen Reader Only)
// ============================================

interface VisuallyHiddenProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
}

// ============================================
// LIVE REGION (Announcements)
// ============================================

type LiveRegionPoliteness = 'polite' | 'assertive' | 'off';

interface LiveRegionProps {
  children: ReactNode;
  politeness?: LiveRegionPoliteness;
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions',
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
}

// ============================================
// ANNOUNCE (Programmatic announcements)
// ============================================

let announceElement: HTMLDivElement | null = null;

export function announce(message: string, politeness: LiveRegionPoliteness = 'polite') {
  if (typeof document === 'undefined') return;

  // Create announcement element if it doesn't exist
  if (!announceElement) {
    announceElement = document.createElement('div');
    announceElement.setAttribute('aria-live', politeness);
    announceElement.setAttribute('aria-atomic', 'true');
    announceElement.className = 'sr-only';
    document.body.appendChild(announceElement);
  }

  // Update politeness if different
  announceElement.setAttribute('aria-live', politeness);

  // Clear and set message (forces re-announcement)
  announceElement.textContent = '';
  requestAnimationFrame(() => {
    if (announceElement) {
      announceElement.textContent = message;
    }
  });
}

// ============================================
// FOCUS RING (Custom focus indicator)
// ============================================

interface FocusRingProps {
  children: ReactNode;
  className?: string;
  offset?: number;
  color?: string;
}

export function FocusRing({
  children,
  className,
  offset = 2,
  color = 'primary',
}: FocusRingProps) {
  return (
    <div
      className={cn(
        'focus-within:ring-2 focus-within:ring-offset-2 rounded-lg transition-shadow',
        color === 'primary' && 'focus-within:ring-primary',
        color === 'white' && 'focus-within:ring-white',
        className
      )}
      style={{ '--ring-offset': `${offset}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// ============================================
// KEYBOARD NAVIGATION HOOK
// ============================================

export function useKeyboardNavigation(
  itemCount: number,
  options?: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    onSelect?: (index: number) => void;
  }
) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const { loop = true, orientation = 'vertical', onSelect } = options || {};

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newIndex = focusedIndex;
      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      switch (e.key) {
        case 'ArrowDown':
          if (isVertical) {
            e.preventDefault();
            newIndex = focusedIndex + 1;
          }
          break;
        case 'ArrowUp':
          if (isVertical) {
            e.preventDefault();
            newIndex = focusedIndex - 1;
          }
          break;
        case 'ArrowRight':
          if (isHorizontal) {
            e.preventDefault();
            newIndex = focusedIndex + 1;
          }
          break;
        case 'ArrowLeft':
          if (isHorizontal) {
            e.preventDefault();
            newIndex = focusedIndex - 1;
          }
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = itemCount - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect?.(focusedIndex);
          return;
        default:
          return;
      }

      // Handle bounds
      if (loop) {
        if (newIndex < 0) newIndex = itemCount - 1;
        if (newIndex >= itemCount) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(newIndex, itemCount - 1));
      }

      setFocusedIndex(newIndex);
    },
    [focusedIndex, itemCount, loop, orientation, onSelect]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getItemProps: (index: number) => ({
      tabIndex: index === focusedIndex ? 0 : -1,
      'aria-selected': index === focusedIndex,
      onFocus: () => setFocusedIndex(index),
    }),
  };
}

// ============================================
// REDUCED MOTION HOOK
// ============================================

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

// ============================================
// FONT SIZE CONTROLS
// ============================================

interface FontSizeControlsProps {
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function FontSizeControls({
  className,
  min = 12,
  max = 24,
  step = 2,
}: FontSizeControlsProps) {
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    // Load saved font size
    const saved = localStorage.getItem('font-size');
    if (saved) {
      const size = parseInt(saved, 10);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}px`;
    }
  }, []);

  const updateFontSize = (newSize: number) => {
    const clamped = Math.max(min, Math.min(max, newSize));
    setFontSize(clamped);
    document.documentElement.style.fontSize = `${clamped}px`;
    localStorage.setItem('font-size', String(clamped));
    announce(`Font size changed to ${clamped} pixels`);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={() => updateFontSize(fontSize - step)}
        disabled={fontSize <= min}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Decrease font size"
      >
        <span className="text-sm font-bold">A-</span>
      </button>

      <span className="text-sm text-gray-500 min-w-[3rem] text-center">
        {fontSize}px
      </span>

      <button
        onClick={() => updateFontSize(fontSize + step)}
        disabled={fontSize >= max}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increase font size"
      >
        <span className="text-lg font-bold">A+</span>
      </button>

      <button
        onClick={() => updateFontSize(16)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs text-gray-500"
        aria-label="Reset font size"
      >
        Reset
      </button>
    </div>
  );
}

// ============================================
// READING MODE
// ============================================

interface ReadingModeProps {
  children: ReactNode;
  className?: string;
}

export function ReadingMode({ children, className }: ReadingModeProps) {
  const [isActive, setIsActive] = useState(false);
  const [bgColor, setBgColor] = useState<'white' | 'sepia' | 'dark'>('white');

  const bgColors = {
    white: 'bg-white text-gray-900',
    sepia: 'bg-amber-50 text-amber-900',
    dark: 'bg-gray-900 text-gray-100',
  };

  if (!isActive) {
    return (
      <div className={className}>
        <button
          onClick={() => setIsActive(true)}
          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          Enter Reading Mode
        </button>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 overflow-y-auto',
        bgColors[bgColor],
        className
      )}
    >
      {/* Controls */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-inherit">
        <div className="flex items-center gap-4">
          <FontSizeControls />

          <div className="flex items-center gap-1">
            {(['white', 'sepia', 'dark'] as const).map((color) => (
              <button
                key={color}
                onClick={() => setBgColor(color)}
                className={cn(
                  'w-8 h-8 rounded-full border-2',
                  color === 'white' && 'bg-white border-gray-300',
                  color === 'sepia' && 'bg-amber-50 border-amber-300',
                  color === 'dark' && 'bg-gray-900 border-gray-600',
                  bgColor === color && 'ring-2 ring-primary ring-offset-2'
                )}
                aria-label={`${color} background`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsActive(false)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Exit Reading Mode
        </button>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 prose dark:prose-invert">
        {children}
      </div>
    </div>
  );
}

export default SkipLink;
