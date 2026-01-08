import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Search, X, Clock, Star, Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SavedSearch {
  id: string;
  query: string;
  filters?: Record<string, string>;
  createdAt: string;
  lastUsed: string;
  useCount: number;
  hasAlert: boolean;
}

interface SavedSearchesContextType {
  searches: SavedSearch[];
  saveSearch: (query: string, filters?: Record<string, string>) => void;
  removeSearch: (id: string) => void;
  toggleAlert: (id: string) => void;
  useSearch: (id: string) => SavedSearch | undefined;
  clearAll: () => void;
}

const SavedSearchesContext = createContext<SavedSearchesContextType | undefined>(undefined);

export function SavedSearchesProvider({ children }: { children: ReactNode }) {
  const [searches, setSearches] = useState<SavedSearch[]>(() => {
    const saved = localStorage.getItem('techtrendi_saved_searches');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('techtrendi_saved_searches', JSON.stringify(searches));
  }, [searches]);

  const saveSearch = (query: string, filters?: Record<string, string>) => {
    const existing = searches.find((s) => s.query.toLowerCase() === query.toLowerCase());
    if (existing) {
      setSearches((prev) =>
        prev.map((s) =>
          s.id === existing.id
            ? { ...s, lastUsed: new Date().toISOString(), useCount: s.useCount + 1 }
            : s
        )
      );
      return;
    }
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      query,
      filters,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 1,
      hasAlert: false,
    };
    setSearches((prev) => [newSearch, ...prev].slice(0, 20));
  };

  const removeSearch = (id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleAlert = (id: string) => {
    setSearches((prev) =>
      prev.map((s) => (s.id === id ? { ...s, hasAlert: !s.hasAlert } : s))
    );
  };

  const useSearch = (id: string) => {
    const search = searches.find((s) => s.id === id);
    if (search) {
      setSearches((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, lastUsed: new Date().toISOString(), useCount: s.useCount + 1 }
            : s
        )
      );
    }
    return search;
  };

  const clearAll = () => {
    setSearches([]);
    localStorage.removeItem('techtrendi_saved_searches');
  };

  return (
    <SavedSearchesContext.Provider
      value={{ searches, saveSearch, removeSearch, toggleAlert, useSearch, clearAll }}
    >
      {children}
    </SavedSearchesContext.Provider>
  );
}

export function useSavedSearches() {
  const context = useContext(SavedSearchesContext);
  if (!context) {
    throw new Error('useSavedSearches must be used within SavedSearchesProvider');
  }
  return context;
}

interface SavedSearchesListProps {
  onSelectSearch?: (query: string, filters?: Record<string, string>) => void;
  className?: string;
}

export function SavedSearchesList({ onSelectSearch, className }: SavedSearchesListProps) {
  const { searches, removeSearch, toggleAlert, useSearch, clearAll } = useSavedSearches();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleSelect = (id: string) => {
    const search = useSearch(id);
    if (search && onSelectSearch) {
      onSelectSearch(search.query, search.filters);
    }
  };

  if (searches.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-foreground mb-2">No saved searches</h3>
        <p className="text-sm text-muted-foreground">
          Your saved searches will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Saved Searches</h3>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear all
        </Button>
      </div>
      <div className="space-y-2">
        {searches.map((search) => (
          <div
            key={search.id}
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <button
              onClick={() => handleSelect(search.id)}
              className="flex-1 flex items-center gap-3 text-left"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{search.query}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(search.lastUsed)}
                  </span>
                  <span>•</span>
                  <span>{search.useCount} searches</span>
                </div>
              </div>
            </button>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => toggleAlert(search.id)}
                className={cn(
                  'p-1.5 rounded hover:bg-muted transition-colors',
                  search.hasAlert ? 'text-primary' : 'text-muted-foreground'
                )}
                title={search.hasAlert ? 'Disable alerts' : 'Enable alerts'}
              >
                <Bell className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeSearch(search.id)}
                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {search.hasAlert && (
              <Badge variant="secondary" className="text-xs">
                Alert on
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SaveSearchButtonProps {
  query: string;
  filters?: Record<string, string>;
  className?: string;
}

export function SaveSearchButton({ query, filters, className }: SaveSearchButtonProps) {
  const { searches, saveSearch, removeSearch } = useSavedSearches();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const isSaved = searches.some((s) => s.query.toLowerCase() === query.toLowerCase());
    setSaved(isSaved);
  }, [searches, query]);

  const handleClick = () => {
    if (saved) {
      const search = searches.find((s) => s.query.toLowerCase() === query.toLowerCase());
      if (search) removeSearch(search.id);
    } else {
      saveSearch(query, filters);
    }
  };

  if (!query.trim()) return null;

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
        saved
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground hover:bg-muted/80',
        className
      )}
    >
      <Star className={cn('w-4 h-4', saved && 'fill-current')} />
      {saved ? 'Saved' : 'Save search'}
    </button>
  );
}

export default SavedSearchesList;
