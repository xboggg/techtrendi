import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Moon, Sun, Monitor, Bell, Eye, Palette, Lock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
  highContrast: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  newContentAlerts: boolean;
  preferredCategories: string[];
  showReadingTime: boolean;
  autoPlayVideos: boolean;
  showRelatedContent: boolean;
  trackReadingHistory: boolean;
  shareAnalytics: boolean;
  showOnlineStatus: boolean;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  reduceMotion: false,
  highContrast: false,
  emailNotifications: true,
  pushNotifications: false,
  weeklyDigest: true,
  newContentAlerts: true,
  preferredCategories: [],
  showReadingTime: true,
  autoPlayVideos: false,
  showRelatedContent: true,
  trackReadingHistory: true,
  shareAnalytics: false,
  showOnlineStatus: true,
};

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('techtrendi_preferences');
    return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('techtrendi_preferences', JSON.stringify(preferences));
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else if (preferences.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    }
    const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };
    root.style.fontSize = fontSizeMap[preferences.fontSize];
    if (preferences.reduceMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
    }
    root.classList.toggle('high-contrast', preferences.highContrast);
  }, [preferences]);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('techtrendi_preferences');
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}

export function PreferencePanel({ className }: { className?: string }) {
  const { preferences, updatePreference, resetPreferences } = usePreferences();
  const categories = ['Smartphones', 'Laptops', 'Audio', 'Wearables', 'Gaming', 'Security', 'Software', 'Smart Home'];

  const toggleCategory = (category: string) => {
    const current = preferences.preferredCategories;
    const updated = current.includes(category) ? current.filter((c) => c !== category) : [...current, category];
    updatePreference('preferredCategories', updated);
  };

  return (
    <div className={cn('space-y-8', className)}>
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Display</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Theme</p>
              <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <div className="flex gap-2">
              {[
                { value: 'light' as const, icon: Sun, label: 'Light' },
                { value: 'dark' as const, icon: Moon, label: 'Dark' },
                { value: 'system' as const, icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => updatePreference('theme', value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                    preferences.theme === value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Reduce Motion</p>
              <p className="text-sm text-muted-foreground">Minimize animations</p>
            </div>
            <Switch checked={preferences.reduceMotion} onCheckedChange={(checked) => updatePreference('reduceMotion', checked)} />
          </div>
        </div>
      </section>
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch checked={preferences.emailNotifications} onCheckedChange={(checked) => updatePreference('emailNotifications', checked)} />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Weekly Digest</p>
              <p className="text-sm text-muted-foreground">Get a weekly summary of top content</p>
            </div>
            <Switch checked={preferences.weeklyDigest} onCheckedChange={(checked) => updatePreference('weeklyDigest', checked)} />
          </div>
        </div>
      </section>
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Content</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium text-foreground mb-2">Preferred Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-colors',
                    preferences.preferredCategories.includes(category) ? 'bg-primary text-primary-foreground' : 'bg-background border border-border hover:bg-muted'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Privacy</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Track Reading History</p>
              <p className="text-sm text-muted-foreground">Save your reading history locally</p>
            </div>
            <Switch checked={preferences.trackReadingHistory} onCheckedChange={(checked) => updatePreference('trackReadingHistory', checked)} />
          </div>
        </div>
      </section>
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={resetPreferences}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}

export function ThemeToggle() {
  const { preferences, updatePreference } = usePreferences();
  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(preferences.theme);
    updatePreference('theme', themes[(currentIndex + 1) % themes.length]);
  };
  const Icon = preferences.theme === 'light' ? Sun : preferences.theme === 'dark' ? Moon : Monitor;
  return (
    <button onClick={cycleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Toggle theme">
      <Icon className="w-5 h-5" />
    </button>
  );
}

export default PreferencePanel;
