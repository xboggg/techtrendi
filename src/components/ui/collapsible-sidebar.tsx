import React, { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Star,
  BookOpen,
  Wrench,
  Settings,
  User,
  Menu,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string | number;
  children?: SidebarItem[];
}

interface CollapsibleSidebarProps {
  items?: SidebarItem[];
  className?: string;
  defaultCollapsed?: boolean;
  position?: 'left' | 'right';
  logo?: ReactNode;
  footer?: ReactNode;
}

const defaultItems: SidebarItem[] = [
  { label: 'Home', href: '/', icon: <Home className="w-5 h-5" /> },
  { label: 'Reviews', href: '/reviews', icon: <Star className="w-5 h-5" /> },
  { label: 'Guides', href: '/guides', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Blog', href: '/blog', icon: <FileText className="w-5 h-5" /> },
  {
    label: 'Tools',
    href: '/tools',
    icon: <Wrench className="w-5 h-5" />,
    children: [
      { label: 'Password Generator', href: '/tools/password-generator', icon: <Wrench className="w-4 h-4" /> },
      { label: 'QR Generator', href: '/tools/qr-generator', icon: <Wrench className="w-4 h-4" /> },
      { label: 'Image Compressor', href: '/tools/image-compressor', icon: <Wrench className="w-4 h-4" /> },
    ],
  },
];

/**
 * Collapsible Sidebar Navigation
 */
export function CollapsibleSidebar({
  items = defaultItems,
  className,
  defaultCollapsed = false,
  position = 'left',
  logo,
  footer,
}: CollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg md:hidden"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col',
          position === 'left' ? 'left-0' : 'right-0',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="font-bold text-xl text-gray-900 dark:text-white">
              {logo || 'TechTrendi'}
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:flex"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
            aria-label="Close menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {items.map((item) => (
              <SidebarItemComponent
                key={item.label}
                item={item}
                isCollapsed={isCollapsed}
                isExpanded={expandedItems.includes(item.label)}
                currentPath={currentPath}
                onToggleExpand={() => toggleExpanded(item.label)}
              />
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </aside>

      {/* Spacer for content */}
      <div
        className={cn(
          'hidden md:block transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      />
    </>
  );
}

function SidebarItemComponent({
  item,
  isCollapsed,
  isExpanded,
  currentPath,
  onToggleExpand,
}: {
  item: SidebarItem;
  isCollapsed: boolean;
  isExpanded: boolean;
  currentPath: string;
  onToggleExpand: () => void;
}) {
  const isActive = currentPath === item.href;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li>
      <div className="relative group">
        {hasChildren ? (
          <button
            onClick={onToggleExpand}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            {item.icon}
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
              </>
            )}
          </button>
        ) : (
          <a
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            {item.icon}
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-white">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </a>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && !isCollapsed && (
        <ul
          className={cn(
            'ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-200',
            isExpanded ? 'max-h-96' : 'max-h-0'
          )}
        >
          {item.children?.map((child) => (
            <li key={child.label}>
              <a
                href={child.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  currentPath === child.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                {child.icon}
                <span>{child.label}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default CollapsibleSidebar;
