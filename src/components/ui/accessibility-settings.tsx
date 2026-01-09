import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  Accessibility,
  Eye,
  Type,
  MousePointer2,
  Contrast,
  ZoomIn,
  Volume2,
  Keyboard,
  Settings,
  X,
  RotateCcw,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AccessibilitySettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  contrast: 'normal' | 'high' | 'inverted';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reducedMotion: boolean;
  focusHighlight: boolean;
  linkHighlight: boolean;
  cursorSize: 'normal' | 'large' | 'xlarge';
  readingGuide: boolean;
  dyslexiaFont: boolean;
  textToSpeech: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  lineHeight: 1.5,
  letterSpacing: 0,
  wordSpacing: 0,
  contrast: 'normal',
  colorBlindMode: 'none',
  reducedMotion: false,
  focusHighlight: false,
  linkHighlight: false,
  cursorSize: 'normal',
  readingGuide: false,
  dyslexiaFont: false,
  textToSpeech: false,
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('techtrendi_accessibility');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('techtrendi_accessibility', JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  const applySettings = (s: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font size
    root.style.fontSize = `${s.fontSize}%`;

    // Line height
    root.style.setProperty('--a11y-line-height', s.lineHeight.toString());

    // Letter spacing
    root.style.setProperty('--a11y-letter-spacing', `${s.letterSpacing}px`);

    // Word spacing
    root.style.setProperty('--a11y-word-spacing', `${s.wordSpacing}px`);

    // Contrast
    root.classList.remove('high-contrast', 'inverted-colors');
    if (s.contrast === 'high') root.classList.add('high-contrast');
    if (s.contrast === 'inverted') root.classList.add('inverted-colors');

    // Color blind mode
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (s.colorBlindMode !== 'none') root.classList.add(s.colorBlindMode);

    // Reduced motion
    if (s.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Focus highlight
    if (s.focusHighlight) {
      root.classList.add('focus-highlight');
    } else {
      root.classList.remove('focus-highlight');
    }

    // Link highlight
    if (s.linkHighlight) {
      root.classList.add('link-highlight');
    } else {
      root.classList.remove('link-highlight');
    }

    // Cursor size
    root.classList.remove('cursor-large', 'cursor-xlarge');
    if (s.cursorSize !== 'normal') root.classList.add(`cursor-${s.cursorSize}`);

    // Dyslexia font
    if (s.dyslexiaFont) {
      root.classList.add('dyslexia-font');
    } else {
      root.classList.remove('dyslexia-font');
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

// Main Accessibility Panel
export function AccessibilityPanel({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSetting, resetSettings } = useAccessibility();

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(defaultSettings);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 left-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors',
          className
        )}
        aria-label="Open accessibility settings"
      >
        <Accessibility className="w-6 h-6" />
        {hasChanges && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Accessibility Settings</h2>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Button variant="ghost" size="sm" onClick={resetSettings}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Text Adjustments */}
              <section>
                <h3 className="flex items-center gap-2 font-medium text-foreground mb-4">
                  <Type className="w-5 h-5" />
                  Text Adjustments
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm">Font Size</label>
                      <span className="text-sm text-muted-foreground">{settings.fontSize}%</span>
                    </div>
                    <input
                      type="range"
                      min="75"
                      max="200"
                      step="5"
                      value={settings.fontSize}
                      onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm">Line Height</label>
                      <span className="text-sm text-muted-foreground">{settings.lineHeight}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={settings.lineHeight}
                      onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm">Letter Spacing</label>
                      <span className="text-sm text-muted-foreground">{settings.letterSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={settings.letterSpacing}
                      onChange={(e) => updateSetting('letterSpacing', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm">Word Spacing</label>
                      <span className="text-sm text-muted-foreground">{settings.wordSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={settings.wordSpacing}
                      onChange={(e) => updateSetting('wordSpacing', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <ToggleSetting
                    label="Dyslexia-Friendly Font"
                    description="Use OpenDyslexic font for easier reading"
                    checked={settings.dyslexiaFont}
                    onChange={(v) => updateSetting('dyslexiaFont', v)}
                  />
                </div>
              </section>

              {/* Visual Adjustments */}
              <section>
                <h3 className="flex items-center gap-2 font-medium text-foreground mb-4">
                  <Eye className="w-5 h-5" />
                  Visual Adjustments
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm mb-2 block">Contrast</label>
                    <div className="flex gap-2">
                      {(['normal', 'high', 'inverted'] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => updateSetting('contrast', option)}
                          className={cn(
                            'flex-1 py-2 px-3 rounded-lg text-sm capitalize border transition-colors',
                            settings.contrast === option
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:bg-muted'
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm mb-2 block">Color Blind Mode</label>
                    <select
                      value={settings.colorBlindMode}
                      onChange={(e) => updateSetting('colorBlindMode', e.target.value as AccessibilitySettings['colorBlindMode'])}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    >
                      <option value="none">None</option>
                      <option value="protanopia">Protanopia (Red-Blind)</option>
                      <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                      <option value="tritanopia">Tritanopia (Blue-Blind)</option>
                    </select>
                  </div>
                  <ToggleSetting
                    label="Link Highlight"
                    description="Add underline and color to all links"
                    checked={settings.linkHighlight}
                    onChange={(v) => updateSetting('linkHighlight', v)}
                  />
                </div>
              </section>

              {/* Navigation */}
              <section>
                <h3 className="flex items-center gap-2 font-medium text-foreground mb-4">
                  <MousePointer2 className="w-5 h-5" />
                  Navigation
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm mb-2 block">Cursor Size</label>
                    <div className="flex gap-2">
                      {(['normal', 'large', 'xlarge'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => updateSetting('cursorSize', size)}
                          className={cn(
                            'flex-1 py-2 px-3 rounded-lg text-sm capitalize border transition-colors',
                            settings.cursorSize === size
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:bg-muted'
                          )}
                        >
                          {size === 'xlarge' ? 'X-Large' : size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ToggleSetting
                    label="Focus Highlight"
                    description="Show prominent outline on focused elements"
                    checked={settings.focusHighlight}
                    onChange={(v) => updateSetting('focusHighlight', v)}
                  />
                  <ToggleSetting
                    label="Reading Guide"
                    description="Show a guide line following cursor"
                    checked={settings.readingGuide}
                    onChange={(v) => updateSetting('readingGuide', v)}
                  />
                </div>
              </section>

              {/* Motion & Audio */}
              <section>
                <h3 className="flex items-center gap-2 font-medium text-foreground mb-4">
                  <Settings className="w-5 h-5" />
                  Motion & Audio
                </h3>
                <div className="space-y-4">
                  <ToggleSetting
                    label="Reduce Motion"
                    description="Minimize animations and transitions"
                    checked={settings.reducedMotion}
                    onChange={(v) => updateSetting('reducedMotion', v)}
                  />
                  <ToggleSetting
                    label="Text to Speech"
                    description="Enable screen reader support"
                    checked={settings.textToSpeech}
                    onChange={(v) => updateSetting('textToSpeech', v)}
                  />
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Toggle Setting Component
function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={cn(
          'w-11 h-6 rounded-full transition-colors relative',
          checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        <div
          className={cn(
            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
      </div>
    </label>
  );
}

// Skip Link Component
export function SkipLink({ className }: { className?: string }) {
  return (
    <a
      href="#main-content"
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none',
        className
      )}
    >
      Skip to main content
    </a>
  );
}

// Reading Guide Component
export function ReadingGuide() {
  const { settings } = useAccessibility();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!settings.readingGuide) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.readingGuide]);

  if (!settings.readingGuide) return null;

  return (
    <div
      className="fixed left-0 right-0 h-8 bg-primary/10 pointer-events-none z-[100] transition-transform"
      style={{ transform: `translateY(${position.y - 16}px)` }}
    />
  );
}

export default AccessibilityPanel;
