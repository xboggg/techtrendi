import { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// Hook for persisting tab state
export function usePersistentTab(key: string, defaultTab: string) {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(`tab_${key}`);
    return saved || defaultTab;
  });

  useEffect(() => {
    localStorage.setItem(`tab_${key}`, activeTab);
  }, [key, activeTab]);

  return [activeTab, setActiveTab] as const;
}

// Hook for persisting any state
export function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(`state_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(`state_${key}`, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
}

// Session storage version (clears on tab close)
export function useSessionTab(key: string, defaultTab: string) {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem(`tab_${key}`);
    return saved || defaultTab;
  });

  useEffect(() => {
    sessionStorage.setItem(`tab_${key}`, activeTab);
  }, [key, activeTab]);

  return [activeTab, setActiveTab] as const;
}

// Persistent Tabs Component
interface PersistentTabsProps {
  storageKey: string;
  defaultTab: string;
  tabs: {
    id: string;
    label: string;
    icon?: ReactNode;
    content: ReactNode;
  }[];
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
}

export function PersistentTabs({
  storageKey,
  defaultTab,
  tabs,
  className,
  tabsClassName,
  contentClassName,
}: PersistentTabsProps) {
  const [activeTab, setActiveTab] = usePersistentTab(storageKey, defaultTab);

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={className}>
      <div className={cn('flex border-b border-border', tabsClassName)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className={cn('pt-4', contentClassName)}>{activeContent}</div>
    </div>
  );
}

// Scroll Position Persistence
export function useScrollRestoration(key: string) {
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(`scroll_${key}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }

    const handleScroll = () => {
      sessionStorage.setItem(`scroll_${key}`, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [key]);
}

// Form State Persistence
export function usePersistentForm<T extends Record<string, unknown>>(
  key: string,
  defaultValues: T
) {
  const [values, setValues] = useState<T>(() => {
    const saved = sessionStorage.getItem(`form_${key}`);
    return saved ? JSON.parse(saved) : defaultValues;
  });

  useEffect(() => {
    sessionStorage.setItem(`form_${key}`, JSON.stringify(values));
  }, [key, values]);

  const updateField = (field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setValues(defaultValues);
    sessionStorage.removeItem(`form_${key}`);
  };

  return { values, setValues, updateField, resetForm };
}

// Filter State Persistence
export function usePersistentFilters<T extends Record<string, unknown>>(
  key: string,
  defaultFilters: T
) {
  const [filters, setFilters] = useState<T>(() => {
    const saved = localStorage.getItem(`filters_${key}`);
    return saved ? { ...defaultFilters, ...JSON.parse(saved) } : defaultFilters;
  });

  useEffect(() => {
    localStorage.setItem(`filters_${key}`, JSON.stringify(filters));
  }, [key, filters]);

  const updateFilter = (field: keyof T, value: unknown) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    localStorage.removeItem(`filters_${key}`);
  };

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(defaultFilters);

  return { filters, setFilters, updateFilter, resetFilters, hasActiveFilters };
}

export default PersistentTabs;
