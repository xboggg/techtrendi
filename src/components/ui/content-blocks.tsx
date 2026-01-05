import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Quote,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';

// ============================================
// ALERT/CALLOUT BOXES
// ============================================

type AlertVariant = 'info' | 'warning' | 'success' | 'error' | 'tip';

interface AlertBoxProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const alertConfig: Record<
  AlertVariant,
  { icon: ReactNode; bgColor: string; borderColor: string; iconColor: string }
> = {
  info: {
    icon: <Info className="w-5 h-5" />,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-500',
  },
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-500',
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500',
  },
  tip: {
    icon: <Lightbulb className="w-5 h-5" />,
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-500',
  },
};

export function AlertBox({
  variant = 'info',
  title,
  children,
  className,
  dismissible,
  onDismiss,
}: AlertBoxProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = alertConfig[variant];

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        config.bgColor,
        config.borderColor,
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <span className={cn('flex-shrink-0', config.iconColor)}>{config.icon}</span>
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h4>
          )}
          <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Dismiss"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// BLOCKQUOTE
// ============================================

interface BlockquoteProps {
  children: ReactNode;
  author?: string;
  source?: string;
  className?: string;
  variant?: 'default' | 'large' | 'minimal';
}

export function Blockquote({
  children,
  author,
  source,
  className,
  variant = 'default',
}: BlockquoteProps) {
  return (
    <blockquote
      className={cn(
        'relative',
        variant === 'default' && 'pl-6 border-l-4 border-primary',
        variant === 'large' && 'text-center py-8',
        variant === 'minimal' && 'pl-4 border-l-2 border-gray-300 dark:border-gray-600',
        className
      )}
    >
      {variant === 'large' && (
        <Quote className="w-12 h-12 mx-auto mb-4 text-primary/20" />
      )}

      <p
        className={cn(
          'text-gray-700 dark:text-gray-300 italic',
          variant === 'large' && 'text-xl md:text-2xl max-w-3xl mx-auto'
        )}
      >
        {children}
      </p>

      {(author || source) && (
        <footer className={cn('mt-4', variant === 'large' && 'text-center')}>
          {author && (
            <cite className="font-semibold text-gray-900 dark:text-white not-italic">
              — {author}
            </cite>
          )}
          {source && (
            <span className="text-gray-500 dark:text-gray-400">
              {author && ', '}
              {source}
            </span>
          )}
        </footer>
      )}
    </blockquote>
  );
}

// ============================================
// CODE BLOCK
// ============================================

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
}

export function CodeBlock({
  code,
  language = 'plaintext',
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden bg-gray-900 text-gray-100',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {/* Traffic light dots */}
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          {filename && (
            <span className="ml-3 text-sm text-gray-400">{filename}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase">{language}</span>
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded hover:bg-gray-700 transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <pre className="overflow-x-auto p-4 text-sm">
        <code>
          {lines.map((line, index) => (
            <div
              key={index}
              className={cn(
                'flex',
                highlightLines.includes(index + 1) &&
                  'bg-yellow-500/10 -mx-4 px-4'
              )}
            >
              {showLineNumbers && (
                <span className="select-none text-gray-500 w-8 flex-shrink-0 text-right pr-4">
                  {index + 1}
                </span>
              )}
              <span className="flex-1">{line || ' '}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

// ============================================
// ACCORDION / FAQ
// ============================================

interface AccordionItem {
  id: string;
  question: string;
  answer: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  allowMultiple?: boolean;
}

export function Accordion({
  items,
  className,
  allowMultiple = false,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);

        return (
          <div
            key={item.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-gray-500 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                isOpen ? 'max-h-96' : 'max-h-0'
              )}
            >
              <div className="p-4 pt-0 text-gray-600 dark:text-gray-400">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// TIMELINE
// ============================================

interface TimelineItem {
  date: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Vertical Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-purple-500 to-pink-500" />

      <div className="space-y-8">
        {items.map((item, index) => (
          <div key={index} className="relative pl-12">
            {/* Dot */}
            <div className="absolute left-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-4 border-primary flex items-center justify-center">
              {item.icon || (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <time className="text-sm text-primary font-medium">
                {item.date}
              </time>
              <h4 className="font-semibold text-gray-900 dark:text-white mt-1">
                {item.title}
              </h4>
              {item.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// STAT COUNTER
// ============================================

interface StatCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function StatCounter({
  value,
  label,
  prefix = '',
  suffix = '',
  className,
}: StatCounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  React.useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);

          // Animate counter
          const duration = 2000;
          const steps = 60;
          const stepValue = value / steps;
          let current = 0;

          const interval = setInterval(() => {
            current += stepValue;
            if (current >= value) {
              setCount(value);
              clearInterval(interval);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);

          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`stat-${label}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [value, label, hasAnimated]);

  return (
    <div id={`stat-${label}`} className={cn('text-center', className)}>
      <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
        {prefix}
        <span className="tabular-nums">{count.toLocaleString()}</span>
        {suffix}
      </div>
      <div className="text-gray-600 dark:text-gray-400 mt-2">{label}</div>
    </div>
  );
}

export default AlertBox;
