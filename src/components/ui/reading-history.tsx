import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { History, Trash2, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface HistoryItem {
  id: string;
  type: 'article' | 'review' | 'guide' | 'tool';
  title: string;
  url: string;
  image?: string;
  category?: string;
  visitedAt: string;
  readProgress?: number; // 0-100
}

interface ReadingHistoryContextType {
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'visitedAt'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  updateReadProgress: (id: string, progress: number) => void;
  getRecentlyViewed: (limit?: number) => HistoryItem[];
}

const ReadingHistoryContext = createContext<ReadingHistoryContextType | null>(null);

const STORAGE_KEY = 'techtrendi_reading_history';
const MAX_HISTORY_ITEMS = 50;

export function ReadingHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse reading history:', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: Omit<HistoryItem, 'visitedAt'>) => {
    setHistory((prev) => {
      // Remove existing entry if present
      const filtered = prev.filter((h) => h.id !== item.id);

      // Add new entry at the beginning
      const newHistory = [
        { ...item, visitedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS);

      return newHistory;
    });
  };

  const removeFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const updateReadProgress = (id: string, progress: number) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, readProgress: Math.min(100, Math.max(0, progress)) }
          : item
      )
    );
  };

  const getRecentlyViewed = (limit = 10) => {
    return history.slice(0, limit);
  };

  return (
    <ReadingHistoryContext.Provider
      value={{
        history,
        addToHistory,
        removeFromHistory,
        clearHistory,
        updateReadProgress,
        getRecentlyViewed,
      }}
    >
      {children}
    </ReadingHistoryContext.Provider>
  );
}

export function useReadingHistory() {
  const context = useContext(ReadingHistoryContext);
  if (!context) {
    throw new Error('useReadingHistory must be used within a ReadingHistoryProvider');
  }
  return context;
}

// Hook to automatically track page visits
export function useTrackPageVisit(item: Omit<HistoryItem, 'visitedAt'> | null) {
  const { addToHistory } = useReadingHistory();

  useEffect(() => {
    if (item) {
      addToHistory(item);
    }
  }, [item?.id]);
}

// Reading History List component
interface ReadingHistoryListProps {
  limit?: number;
  className?: string;
  showClearButton?: boolean;
}

export function ReadingHistoryList({
  limit,
  className,
  showClearButton = true,
}: ReadingHistoryListProps) {
  const { history, removeFromHistory, clearHistory } = useReadingHistory();
  const displayHistory = limit ? history.slice(0, limit) : history;

  if (displayHistory.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No reading history</h3>
        <p className="text-muted-foreground">
          Articles and reviews you read will appear here.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Group by date
  const groupedHistory = displayHistory.reduce((acc, item) => {
    const date = new Date(item.visitedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }

    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  return (
    <div className={className}>
      {showClearButton && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <History className="w-5 h-5" />
            Reading History
          </h2>
          <button
            onClick={clearHistory}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedHistory).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.visitedAt}`}
                  className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow group"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-medium uppercase">
                        {item.type}
                      </span>
                      {item.category && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{item.category}</span>
                        </>
                      )}
                    </div>
                    <Link
                      to={item.url}
                      className="block font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.visitedAt)}
                      </span>
                      {item.readProgress !== undefined && item.readProgress > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {item.readProgress}% read
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={item.url}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Open"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => removeFromHistory(item.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recently viewed widget for sidebars
interface RecentlyViewedWidgetProps {
  limit?: number;
  className?: string;
}

export function RecentlyViewedWidget({ limit = 5, className }: RecentlyViewedWidgetProps) {
  const { getRecentlyViewed } = useReadingHistory();
  const recent = getRecentlyViewed(limit);

  if (recent.length === 0) return null;

  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <History className="w-4 h-4" />
        Recently Viewed
      </h3>
      <div className="space-y-3">
        {recent.map((item) => (
          <Link
            key={`${item.id}-${item.visitedAt}`}
            to={item.url}
            className="block text-sm text-muted-foreground hover:text-primary transition-colors line-clamp-2"
          >
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ReadingHistoryProvider;
