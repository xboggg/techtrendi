import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Search,
  FileText,
  Wrench,
  Star,
  BookOpen,
  Home,
  User,
  Settings,
  Moon,
  Sun,
  ArrowRight,
  Command,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  customCommands?: CommandItem[];
}

/**
 * Command Palette (CMD+K) for quick navigation
 */
export function CommandPalette({
  isOpen,
  onClose,
  customCommands = [],
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Default commands
  const defaultCommands: CommandItem[] = [
    {
      id: 'home',
      title: 'Go to Home',
      description: 'Navigate to homepage',
      icon: <Home className="w-4 h-4" />,
      category: 'Navigation',
      action: () => (window.location.href = '/'),
      keywords: ['home', 'main', 'start'],
    },
    {
      id: 'reviews',
      title: 'Go to Reviews',
      description: 'Browse tech reviews',
      icon: <Star className="w-4 h-4" />,
      category: 'Navigation',
      action: () => (window.location.href = '/reviews'),
      keywords: ['reviews', 'products', 'ratings'],
    },
    {
      id: 'guides',
      title: 'Go to Guides',
      description: 'Read tech guides',
      icon: <BookOpen className="w-4 h-4" />,
      category: 'Navigation',
      action: () => (window.location.href = '/guides'),
      keywords: ['guides', 'tutorials', 'how-to'],
    },
    {
      id: 'tools',
      title: 'Go to Tools',
      description: 'Access free tools',
      icon: <Wrench className="w-4 h-4" />,
      category: 'Navigation',
      action: () => (window.location.href = '/tools'),
      keywords: ['tools', 'utilities', 'free'],
    },
    {
      id: 'blog',
      title: 'Go to Blog',
      description: 'Read latest articles',
      icon: <FileText className="w-4 h-4" />,
      category: 'Navigation',
      action: () => (window.location.href = '/blog'),
      keywords: ['blog', 'articles', 'news'],
    },
    {
      id: 'password-generator',
      title: 'Password Generator',
      description: 'Generate secure passwords',
      icon: <Wrench className="w-4 h-4" />,
      category: 'Tools',
      action: () => (window.location.href = '/tools/password-generator'),
      keywords: ['password', 'security', 'generate'],
    },
    {
      id: 'qr-generator',
      title: 'QR Code Generator',
      description: 'Create QR codes',
      icon: <Wrench className="w-4 h-4" />,
      category: 'Tools',
      action: () => (window.location.href = '/tools/qr-generator'),
      keywords: ['qr', 'code', 'barcode'],
    },
    {
      id: 'image-compressor',
      title: 'Image Compressor',
      description: 'Compress images',
      icon: <Wrench className="w-4 h-4" />,
      category: 'Tools',
      action: () => (window.location.href = '/tools/image-compressor'),
      keywords: ['image', 'compress', 'optimize'],
    },
    {
      id: 'toggle-theme',
      title: 'Toggle Dark Mode',
      description: 'Switch between light and dark mode',
      icon: <Moon className="w-4 h-4" />,
      category: 'Actions',
      action: () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem(
          'theme',
          document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        );
      },
      keywords: ['theme', 'dark', 'light', 'mode'],
    },
  ];

  const allCommands = [...defaultCommands, ...customCommands];

  // Filter commands based on search
  const filteredCommands = allCommands.filter((command) => {
    const searchLower = search.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.description?.toLowerCase().includes(searchLower) ||
      command.keywords?.some((k) => k.toLowerCase().includes(searchLower)) ||
      command.category.toLowerCase().includes(searchLower)
    );
  });

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Flatten for keyboard navigation
  const flatCommands = Object.values(groupedCommands).flat();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, flatCommands, selectedIndex, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/4 z-50 w-full max-w-xl -translate-x-1/2 p-4">
        <div className="overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search commands..."
              className="flex-1 bg-transparent px-4 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>

          {/* Commands List */}
          <div
            ref={listRef}
            className="max-h-80 overflow-y-auto py-2"
          >
            {Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                {commands.map((command) => {
                  const globalIndex = flatCommands.findIndex(
                    (c) => c.id === command.id
                  );
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={command.id}
                      data-index={globalIndex}
                      onClick={() => {
                        command.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700'
                        )}
                      >
                        {command.icon}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium">{command.title}</div>
                        {command.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {command.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {flatCommands.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No commands found for "{search}"
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-300 dark:border-gray-600 px-1.5 py-0.5">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-300 dark:border-gray-600 px-1.5 py-0.5">
                  ↵
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-300 dark:border-gray-600 px-1.5 py-0.5">
                  Esc
                </kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hook to manage command palette state
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K or CTRL+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

export default CommandPalette;
