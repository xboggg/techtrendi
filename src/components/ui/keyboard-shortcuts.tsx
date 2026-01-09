import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { Keyboard, X, Search, Home, Moon, Sun, ArrowUp, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Shortcut {
  id: string;
  keys: string[];
  description: string;
  category: string;
  action: () => void;
}

interface ShortcutsContextType {
  shortcuts: Shortcut[];
  registerShortcut: (shortcut: Omit<Shortcut, 'id'>) => string;
  unregisterShortcut: (id: string) => void;
  isDialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const registerShortcut = useCallback((shortcut: Omit<Shortcut, 'id'>) => {
    const id = `shortcut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setShortcuts((prev) => [...prev, { ...shortcut, id }]);
    return id;
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Global keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).contentEditable === 'true'
      ) {
        return;
      }

      // Build pressed keys array
      const pressedKeys: string[] = [];
      if (e.metaKey || e.ctrlKey) pressedKeys.push('Cmd');
      if (e.shiftKey) pressedKeys.push('Shift');
      if (e.altKey) pressedKeys.push('Alt');

      // Add the actual key
      if (e.key && !['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) {
        pressedKeys.push(e.key.toUpperCase());
      }

      // Check for matching shortcuts
      for (const shortcut of shortcuts) {
        const shortcutKeys = shortcut.keys.map((k) => k.toUpperCase());
        if (
          pressedKeys.length === shortcutKeys.length &&
          pressedKeys.every((k) => shortcutKeys.includes(k))
        ) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }

      // Built-in: ? to open shortcuts dialog
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return (
    <ShortcutsContext.Provider
      value={{
        shortcuts,
        registerShortcut,
        unregisterShortcut,
        isDialogOpen,
        openDialog: () => setIsDialogOpen(true),
        closeDialog: () => setIsDialogOpen(false),
      }}
    >
      {children}
      {isDialogOpen && <ShortcutsDialog onClose={() => setIsDialogOpen(false)} />}
    </ShortcutsContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
}

// Hook to register a shortcut
export function useShortcut(
  keys: string[],
  action: () => void,
  description: string,
  category: string = 'General'
) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    const id = registerShortcut({ keys, action, description, category });
    return () => unregisterShortcut(id);
  }, [keys.join('+'), description, category]);
}

// Shortcuts Dialog
function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const { shortcuts } = useKeyboardShortcuts();
  const [searchQuery, setSearchQuery] = useState('');

  // Group shortcuts by category
  const categories = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  // Filter by search
  const filteredCategories = Object.entries(categories).reduce((acc, [category, shortcuts]) => {
    const filtered = shortcuts.filter(
      (s) =>
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Shortcut[]>);

  // Add default shortcuts
  const defaultShortcuts = [
    { keys: ['?'], description: 'Show keyboard shortcuts', category: 'General' },
    { keys: ['Esc'], description: 'Close dialogs', category: 'General' },
    { keys: ['Cmd', 'K'], description: 'Open search', category: 'Navigation' },
    { keys: ['G', 'H'], description: 'Go to home', category: 'Navigation' },
    { keys: ['G', 'R'], description: 'Go to reviews', category: 'Navigation' },
    { keys: ['G', 'B'], description: 'Go to blog', category: 'Navigation' },
    { keys: ['Shift', 'D'], description: 'Toggle dark mode', category: 'Appearance' },
    { keys: ['Shift', 'T'], description: 'Scroll to top', category: 'Navigation' },
  ];

  const allCategories = {
    ...filteredCategories,
    General: [
      ...(filteredCategories.General || []),
      ...defaultShortcuts.filter((s) => s.category === 'General'),
    ],
    Navigation: [
      ...(filteredCategories.Navigation || []),
      ...defaultShortcuts.filter((s) => s.category === 'Navigation'),
    ],
    Appearance: [
      ...(filteredCategories.Appearance || []),
      ...defaultShortcuts.filter((s) => s.category === 'Appearance'),
    ],
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {Object.entries(allCategories).map(([category, shortcuts]) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j}>
                          <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                            {formatKey(key)}
                          </kbd>
                          {j < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground mx-1">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">?</kbd> anywhere to open this dialog
          </p>
        </div>
      </div>
    </>
  );
}

// Format key for display
function formatKey(key: string): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const keyMap: Record<string, string> = {
    Cmd: isMac ? '⌘' : 'Ctrl',
    Shift: '⇧',
    Alt: isMac ? '⌥' : 'Alt',
    Enter: '↵',
    Esc: 'Esc',
    Up: '↑',
    Down: '↓',
    Left: '←',
    Right: '→',
  };
  return keyMap[key] || key;
}

// Shortcut Indicator Badge
export function ShortcutBadge({
  keys,
  className,
}: {
  keys: string[];
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {keys.map((key, i) => (
        <span key={i} className="flex items-center">
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono text-muted-foreground">
            {formatKey(key)}
          </kbd>
          {i < keys.length - 1 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
        </span>
      ))}
    </div>
  );
}

// Shortcut Button
export function ShortcutButton({ onClick, className }: { onClick?: () => void; className?: string }) {
  const { openDialog } = useKeyboardShortcuts();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick || openDialog}
      className={className}
    >
      <Keyboard className="w-4 h-4 mr-2" />
      Shortcuts
      <ShortcutBadge keys={['?']} className="ml-2" />
    </Button>
  );
}

export default KeyboardShortcutsProvider;
