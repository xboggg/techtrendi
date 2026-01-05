import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useScrollToTop } from '@/hooks/useScrollAnimation';
import {
  ArrowUp,
  Plus,
  X,
  MessageCircle,
  Search,
  Share2,
  Wrench,
} from 'lucide-react';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
  showScrollTop?: boolean;
  className?: string;
}

/**
 * Floating Action Button with expandable actions
 */
export function FloatingActionButton({
  actions = [],
  showScrollTop = true,
  className,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { showButton, progress, scrollToTop } = useScrollToTop();

  // Default actions if none provided
  const defaultActions: FABAction[] = [
    {
      icon: <Search className="w-5 h-5" />,
      label: 'Search',
      onClick: () => {
        // Trigger command palette
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      },
    },
    {
      icon: <Wrench className="w-5 h-5" />,
      label: 'Tools',
      onClick: () => (window.location.href = '/tools'),
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'Contact',
      onClick: () => (window.location.href = '/about#contact'),
    },
  ];

  const fabActions = actions.length > 0 ? actions : defaultActions;

  // Only show scroll-to-top button if enabled and scrolled down
  if (showScrollTop && showButton && !isOpen) {
    return (
      <div className={cn('fixed bottom-6 right-6 z-50', className)}>
        <button
          onClick={scrollToTop}
          className="relative w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Scroll to top"
        >
          {/* Progress Ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 56 56"
          >
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.2"
            />
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </svg>
          <ArrowUp className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Action Buttons */}
      <div
        className={cn(
          'flex flex-col-reverse gap-3 mb-3 transition-all duration-300',
          isOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {fabActions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              setIsOpen(false);
            }}
            className={cn(
              'w-12 h-12 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              action.className
            )}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
            }}
            aria-label={action.label}
            title={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          isOpen && 'rotate-45'
        )}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}

/**
 * Simple scroll-to-top button without FAB menu
 */
export function ScrollToTopButton({ className }: { className?: string }) {
  const { showButton, progress, scrollToTop } = useScrollToTop();

  if (!showButton) return null;

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5 mx-auto" />
    </button>
  );
}

export default FloatingActionButton;
