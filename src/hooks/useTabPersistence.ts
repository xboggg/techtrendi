import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for persisting tab state across page refreshes
 */
export function useTabPersistence(
  key: string,
  defaultValue: string,
  storage: 'local' | 'session' = 'local'
) {
  const storageKey = `tab-state-${key}`;

  // Get initial value from storage or use default
  const getInitialValue = (): string => {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const storageAPI = storage === 'local' ? localStorage : sessionStorage;
      const stored = storageAPI.getItem(storageKey);
      return stored || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialValue);

  // Update storage when tab changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storageAPI = storage === 'local' ? localStorage : sessionStorage;
      storageAPI.setItem(storageKey, activeTab);
    } catch {
      // Storage unavailable
    }
  }, [activeTab, storageKey, storage]);

  const setTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const clearPersistence = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const storageAPI = storage === 'local' ? localStorage : sessionStorage;
      storageAPI.removeItem(storageKey);
      setActiveTab(defaultValue);
    } catch {
      // Storage unavailable
    }
  }, [storageKey, storage, defaultValue]);

  return {
    activeTab,
    setTab,
    clearPersistence,
  };
}

/**
 * Hook for persisting multiple UI preferences
 */
interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
}

const defaultPreferences: UIPreferences = {
  theme: 'system',
  sidebarCollapsed: false,
  fontSize: 'medium',
  reducedMotion: false,
};

export function useUIPreferences() {
  const [preferences, setPreferences] = useState<UIPreferences>(() => {
    if (typeof window === 'undefined') return defaultPreferences;

    try {
      const stored = localStorage.getItem('ui-preferences');
      return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  });

  // Persist preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('ui-preferences', JSON.stringify(preferences));
    } catch {
      // Storage unavailable
    }
  }, [preferences]);

  // Apply theme
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { theme } = preferences;
    const root = document.documentElement;

    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [preferences.theme]);

  // Apply font size
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    root.style.fontSize = sizes[preferences.fontSize];
  }, [preferences.fontSize]);

  // Apply reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('reduce-motion', preferences.reducedMotion);
  }, [preferences.reducedMotion]);

  const updatePreference = useCallback(
    <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('ui-preferences');
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
}

/**
 * Hook for tracking scroll position and restoring it
 */
export function useScrollRestoration(key: string) {
  const storageKey = `scroll-position-${key}`;

  // Save current scroll position
  const savePosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(storageKey, String(window.scrollY));
    } catch {
      // Storage unavailable
    }
  }, [storageKey]);

  // Restore scroll position
  const restorePosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        window.scrollTo(0, parseInt(saved, 10));
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      // Storage unavailable
    }
  }, [storageKey]);

  return { savePosition, restorePosition };
}

/**
 * Hook for persisting form state
 */
export function useFormPersistence<T extends Record<string, unknown>>(
  key: string,
  initialValues: T
) {
  const storageKey = `form-state-${key}`;

  const [values, setValues] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValues;

    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored ? { ...initialValues, ...JSON.parse(stored) } : initialValues;
    } catch {
      return initialValues;
    }
  });

  // Save on change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      // Storage unavailable
    }
  }, [values, storageKey]);

  const updateValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const clearForm = useCallback(() => {
    setValues(initialValues);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Storage unavailable
    }
  }, [initialValues, storageKey]);

  return { values, updateValue, setValues, clearForm };
}

export default useTabPersistence;
