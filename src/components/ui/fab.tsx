import { useState, useEffect } from 'react';
import { ArrowUp, Plus, X, MessageCircle, Share2, Bookmark, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FABProps {
  actions?: FABAction[];
  showScrollTop?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

export function FAB({
  actions = [],
  showScrollTop = true,
  position = 'bottom-right',
  className,
}: FABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  const hasActions = actions.length > 0;

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Action buttons */}
      {hasActions && isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 mb-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-full shadow-lg',
                'hover:shadow-xl transition-all duration-200',
                'animate-fade-in'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {action.label}
              </span>
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', action.color || 'bg-primary text-primary-foreground')}>
                <action.icon className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Scroll to top button */}
        {showScrollTop && showScrollButton && (
          <button
            onClick={scrollToTop}
            className={cn(
              'w-12 h-12 rounded-full bg-muted/90 backdrop-blur border border-border shadow-lg',
              'flex items-center justify-center',
              'hover:bg-muted hover:shadow-xl transition-all duration-200',
              'animate-fade-in'
            )}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Main FAB button */}
        {hasActions && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'w-14 h-14 rounded-full shadow-lg',
              'flex items-center justify-center',
              'transition-all duration-300',
              isOpen
                ? 'bg-destructive text-destructive-foreground rotate-45'
                : 'bg-gradient-to-br from-primary to-secondary text-white'
            )}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Scroll to Top only component
export function ScrollToTop({ className }: { className?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'flex items-center justify-center',
        'hover:shadow-xl hover:scale-110 transition-all duration-200',
        'animate-fade-in',
        className
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

// Progress-based scroll to top
export function ScrollToTopWithProgress({ className }: { className?: string }) {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      setShow(scrollTop > 400);
      setProgress(scrollPercent);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed bottom-6 right-6 z-50 w-14 h-14',
        'flex items-center justify-center',
        'animate-fade-in',
        className
      )}
      aria-label="Scroll to top"
    >
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-150"
        />
      </svg>
      <ArrowUp className="w-5 h-5 absolute text-foreground" />
    </button>
  );
}

export default FAB;
