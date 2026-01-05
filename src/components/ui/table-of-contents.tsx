import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { List, ChevronRight } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentSelector?: string;
  className?: string;
  title?: string;
  sticky?: boolean;
  collapsible?: boolean;
  highlightOffset?: number;
}

/**
 * Sticky Table of Contents with auto-highlighting
 */
export function TableOfContents({
  contentSelector = 'article',
  className,
  title = 'Table of Contents',
  sticky = true,
  collapsible = true,
  highlightOffset = 100,
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract headings from content
  useEffect(() => {
    const content = document.querySelector(contentSelector);
    if (!content) return;

    const headingElements = content.querySelectorAll('h2, h3, h4');
    const items: TOCItem[] = [];

    headingElements.forEach((heading, index) => {
      // Generate ID if not present
      if (!heading.id) {
        heading.id = `heading-${index}`;
      }

      items.push({
        id: heading.id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      });
    });

    setHeadings(items);
  }, [contentSelector]);

  // Track active heading on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + highlightOffset;

      // Find the heading that's currently in view
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = document.getElementById(headings[i].id);
        if (heading && heading.offsetTop <= scrollPosition) {
          setActiveId(headings[i].id);
          return;
        }
      }

      // Default to first heading if none in view
      if (headings.length > 0) {
        setActiveId(headings[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings, highlightOffset]);

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = highlightOffset - 20;
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, [highlightOffset]);

  if (headings.length === 0) return null;

  return (
    <nav
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        sticky && 'sticky top-24',
        className
      )}
      aria-label="Table of contents"
    >
      {/* Header */}
      <button
        className={cn(
          'w-full flex items-center justify-between p-4 text-left',
          collapsible && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
        )}
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <List className="w-5 h-5" />
          {title}
        </div>
        {collapsible && (
          <ChevronRight
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform duration-200',
              !isCollapsed && 'rotate-90'
            )}
          />
        )}
      </button>

      {/* Content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isCollapsed ? 'max-h-0' : 'max-h-[60vh]'
        )}
      >
        <div className="p-4 pt-0 overflow-y-auto max-h-[50vh]">
          <ul className="space-y-1">
            {headings.map((heading) => (
              <li
                key={heading.id}
                style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
              >
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
                    activeId === heading.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="h-1 bg-gray-100 dark:bg-gray-700">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{
            width: `${
              headings.length > 0
                ? ((headings.findIndex((h) => h.id === activeId) + 1) /
                    headings.length) *
                  100
                : 0
            }%`,
          }}
        />
      </div>
    </nav>
  );
}

/**
 * Inline TOC for mobile or within content
 */
export function InlineTableOfContents({
  contentSelector = 'article',
  className,
}: Pick<TableOfContentsProps, 'contentSelector' | 'className'>) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const content = document.querySelector(contentSelector);
    if (!content) return;

    const headingElements = content.querySelectorAll('h2, h3');
    const items: TOCItem[] = [];

    headingElements.forEach((heading, index) => {
      if (!heading.id) heading.id = `heading-${index}`;
      items.push({
        id: heading.id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      });
    });

    setHeadings(items);
  }, [contentSelector]);

  if (headings.length === 0) return null;

  return (
    <div
      className={cn(
        'bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 my-6',
        className
      )}
    >
      <button
        className="flex items-center justify-between w-full text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-900 dark:text-white">
          In this article
        </span>
        <ChevronRight
          className={cn(
            'w-5 h-5 transition-transform',
            isOpen && 'rotate-90'
          )}
        />
      </button>

      {isOpen && (
        <ul className="mt-4 space-y-2">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
            >
              <a
                href={`#${heading.id}`}
                className="text-gray-600 dark:text-gray-400 hover:text-primary text-sm"
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TableOfContents;
