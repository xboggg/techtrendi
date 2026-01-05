import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface MenuItem {
  label: string;
  href?: string;
  description?: string;
  icon?: ReactNode;
}

interface MenuColumn {
  title?: string;
  items: MenuItem[];
}

interface MegaMenuItemProps {
  label: string;
  columns: MenuColumn[];
  featured?: {
    title: string;
    description: string;
    image?: string;
    href: string;
  };
}

interface MegaMenuProps {
  items: MegaMenuItemProps[];
  className?: string;
}

/**
 * Mega Menu Navigation Component
 */
export function MegaMenu({ items, className }: MegaMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav ref={menuRef} className={cn('relative', className)}>
      <ul className="flex items-center gap-1">
        {items.map((item) => (
          <MegaMenuItem
            key={item.label}
            {...item}
            isOpen={activeMenu === item.label}
            onOpen={() => setActiveMenu(item.label)}
            onClose={() => setActiveMenu(null)}
          />
        ))}
      </ul>
    </nav>
  );
}

function MegaMenuItem({
  label,
  columns,
  featured,
  isOpen,
  onOpen,
  onClose,
}: MegaMenuItemProps & {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onOpen();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(onClose, 150);
  };

  return (
    <li
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        className={cn(
          'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          isOpen
            ? 'text-primary bg-primary/10'
            : 'text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Panel */}
      <div
        className={cn(
          'absolute left-0 top-full pt-2 z-50 transition-all duration-200',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[600px]">
          <div className="flex">
            {/* Menu Columns */}
            <div className="flex-1 grid grid-cols-2 gap-4 p-6">
              {columns.map((column, colIndex) => (
                <div key={colIndex}>
                  {column.title && (
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      {column.title}
                    </h3>
                  )}
                  <ul className="space-y-1">
                    {column.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <a
                          href={item.href || '#'}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                        >
                          {item.icon && (
                            <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              {item.icon}
                            </span>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                              {item.label}
                            </div>
                            {item.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Featured Section */}
            {featured && (
              <div className="w-64 bg-gray-50 dark:bg-gray-900 p-6">
                <a href={featured.href} className="block group">
                  {featured.image && (
                    <div className="aspect-video rounded-lg overflow-hidden mb-4">
                      <img
                        src={featured.image}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    {featured.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {featured.description}
                  </p>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Simple dropdown menu for mobile/simpler navigation
 */
interface DropdownMenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  className?: string;
}

export function DropdownMenu({ trigger, items, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button onClick={() => setIsOpen(!isOpen)}>{trigger}</button>

      <div
        className={cn(
          'absolute right-0 top-full mt-2 z-50 transition-all duration-200',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href || '#'}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.icon && <span className="w-5 h-5">{item.icon}</span>}
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MegaMenu;
