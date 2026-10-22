import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  /** The theme in force: the visitor's own choice, else the open page's default, else light. */
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  /** A page's own default, used only while no theme has been chosen (see usePageDefaultTheme). */
  setPageDefault: (theme: 'light' | 'dark' | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'techtrendi-theme';
// Before paint in the browser (no flash of the other theme); a plain effect on the server.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The visitor's explicit choice, if any (stored site-wide). The site's default stays light.
  const [chosen, setChosen] = useState<Theme | null>(() => {
    if (typeof window !== 'undefined') {
      try { return (localStorage.getItem(STORAGE_KEY) as Theme) || null; } catch { return null; }
    }
    return null;
  });
  // A page's own default (the data bundle pages: dark), only while that page is open.
  const [pageDefault, setPageDefault] = useState<'light' | 'dark' | null>(null);
  const theme: Theme = chosen ?? pageDefault ?? (typeof window !== 'undefined' ? 'light' : 'system');

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useIsoLayoutEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (newTheme: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      setResolvedTheme(newTheme);
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    try { localStorage.setItem(STORAGE_KEY, newTheme); } catch { /* private mode: still applies for this visit */ }
    setChosen(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, setPageDefault }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/** Give the open page its own default theme. It applies only while the page is mounted
 *  and only if the visitor has never chosen a theme; their choice always wins and stays
 *  site-wide. Set before paint, so the page does not flash in the other theme. */
export function usePageDefaultTheme(theme: 'light' | 'dark') {
  const ctx = useContext(ThemeContext);
  const set = ctx?.setPageDefault;
  useIsoLayoutEffect(() => {
    if (!set) return;
    set(theme);
    return () => set(null);
  }, [set, theme]);
}
