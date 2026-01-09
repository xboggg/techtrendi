import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { BookOpen, X, Sun, Moon, Type, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReadingModeSettings {
  enabled: boolean;
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
  theme: 'light' | 'dark' | 'sepia';
  fontFamily: 'sans' | 'serif' | 'mono';
}

const defaultSettings: ReadingModeSettings = {
  enabled: false,
  fontSize: 18,
  lineHeight: 1.8,
  maxWidth: 680,
  theme: 'light',
  fontFamily: 'serif',
};

interface ReadingModeContextType {
  settings: ReadingModeSettings;
  updateSettings: (updates: Partial<ReadingModeSettings>) => void;
  toggleReadingMode: () => void;
}

const ReadingModeContext = createContext<ReadingModeContextType | undefined>(undefined);

export function ReadingModeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReadingModeSettings>(() => {
    const saved = localStorage.getItem('techtrendi_reading_mode');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('techtrendi_reading_mode', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<ReadingModeSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const toggleReadingMode = () => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  return (
    <ReadingModeContext.Provider value={{ settings, updateSettings, toggleReadingMode }}>
      {children}
    </ReadingModeContext.Provider>
  );
}

export function useReadingMode() {
  const context = useContext(ReadingModeContext);
  if (!context) {
    throw new Error('useReadingMode must be used within ReadingModeProvider');
  }
  return context;
}

// Reading Mode Toggle Button
export function ReadingModeToggle({ className }: { className?: string }) {
  const { settings, toggleReadingMode } = useReadingMode();

  return (
    <Button
      variant={settings.enabled ? 'default' : 'outline'}
      size="sm"
      onClick={toggleReadingMode}
      className={className}
    >
      <BookOpen className="w-4 h-4 mr-2" />
      {settings.enabled ? 'Exit Reading Mode' : 'Reading Mode'}
    </Button>
  );
}

// Reading Mode Wrapper
export function ReadingModeWrapper({ children, className }: { children: ReactNode; className?: string }) {
  const { settings } = useReadingMode();

  if (!settings.enabled) {
    return <>{children}</>;
  }

  const themeStyles = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-gray-100',
    sepia: 'bg-amber-50 text-amber-900',
  };

  const fontFamilies = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 overflow-y-auto',
        themeStyles[settings.theme],
        fontFamilies[settings.fontFamily],
        className
      )}
    >
      <ReadingModeControls />
      <div
        className="mx-auto px-6 py-16"
        style={{
          maxWidth: `${settings.maxWidth}px`,
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Reading Mode Controls
function ReadingModeControls() {
  const { settings, updateSettings, toggleReadingMode } = useReadingMode();
  const [showControls, setShowControls] = useState(false);

  return (
    <>
      {/* Toggle controls button */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        <Type className="w-5 h-5" />
      </button>

      {/* Exit button */}
      <button
        onClick={toggleReadingMode}
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Controls panel */}
      {showControls && (
        <div className="fixed top-16 right-4 z-50 w-72 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4">Reading Settings</h3>

          {/* Font Size */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Font Size</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 2) })}
                className="p-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="flex-1 text-center">{settings.fontSize}px</span>
              <button
                onClick={() => updateSettings({ fontSize: Math.min(28, settings.fontSize + 2) })}
                className="p-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Theme</label>
            <div className="flex gap-2">
              {(['light', 'dark', 'sepia'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSettings({ theme })}
                  className={cn(
                    'flex-1 py-2 px-3 rounded text-sm capitalize',
                    settings.theme === theme
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Font</label>
            <div className="flex gap-2">
              {(['sans', 'serif', 'mono'] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => updateSettings({ fontFamily: font })}
                  className={cn(
                    'flex-1 py-2 px-3 rounded text-sm capitalize',
                    font === 'serif' && 'font-serif',
                    font === 'mono' && 'font-mono',
                    settings.fontFamily === font
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          {/* Line Height */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
              Line Height: {settings.lineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="1.4"
              max="2.2"
              step="0.1"
              value={settings.lineHeight}
              onChange={(e) => updateSettings({ lineHeight: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </>
  );
}

// Font Size Controls (standalone)
export function FontSizeControls({ className }: { className?: string }) {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('techtrendi_font_size');
    return saved ? parseInt(saved) : 16;
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem('techtrendi_font_size', fontSize.toString());
  }, [fontSize]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={() => setFontSize((s) => Math.max(14, s - 2))}
        className="p-2 rounded hover:bg-muted transition-colors"
        aria-label="Decrease font size"
      >
        <span className="text-sm font-medium">A-</span>
      </button>
      <button
        onClick={() => setFontSize(16)}
        className="p-2 rounded hover:bg-muted transition-colors"
        aria-label="Reset font size"
      >
        <span className="text-base font-medium">A</span>
      </button>
      <button
        onClick={() => setFontSize((s) => Math.min(24, s + 2))}
        className="p-2 rounded hover:bg-muted transition-colors"
        aria-label="Increase font size"
      >
        <span className="text-lg font-medium">A+</span>
      </button>
    </div>
  );
}

export default ReadingModeToggle;
