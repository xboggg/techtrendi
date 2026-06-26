import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BookmarkItem {
  id: string;
  type: 'article' | 'review' | 'tool';
  title: string;
  url: string;
  excerpt?: string;
  image?: string;
  savedAt: string;
}

interface BookmarkContextType {
  bookmarks: BookmarkItem[];
  addBookmark: (item: Omit<BookmarkItem, 'savedAt'>) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  clearAllBookmarks: () => void;
}

const BookmarkContext = createContext<BookmarkContextType | null>(null);

const STORAGE_KEY = 'techtrendi_bookmarks';

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const { toast } = useToast();

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse bookmarks:', e);
      }
    }
  }, []);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = (item: Omit<BookmarkItem, 'savedAt'>) => {
    if (isBookmarked(item.id)) return;

    const newBookmark: BookmarkItem = {
      ...item,
      savedAt: new Date().toISOString(),
    };

    setBookmarks((prev) => [newBookmark, ...prev]);
    toast({
      title: 'Saved to your reading list',
      description: item.title,
    });
  };

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: 'Removed from your reading list',
    });
  };

  const isBookmarked = (id: string) => {
    return bookmarks.some((item) => item.id === id);
  };

  const clearAllBookmarks = () => {
    setBookmarks([]);
    toast({
      title: 'Reading list cleared',
    });
  };

  return (
    <BookmarkContext.Provider
      value={{ bookmarks, addBookmark, removeBookmark, isBookmarked, clearAllBookmarks }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}

// Bookmark button component
interface BookmarkButtonProps {
  item: Omit<BookmarkItem, 'savedAt'>;
  variant?: 'default' | 'icon' | 'text';
  className?: string;
}

export function BookmarkButton({ item, variant = 'default', className }: BookmarkButtonProps) {
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const saved = isBookmarked(item.id);

  const handleClick = () => {
    if (saved) {
      removeBookmark(item.id);
    } else {
      addBookmark(item);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'p-2 rounded-lg transition-colors',
          saved
            ? 'text-primary bg-primary/10 hover:bg-primary/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          className
        )}
        aria-label={saved ? 'Remove from reading list' : 'Add to reading list'}
      >
        {saved ? (
          <BookmarkCheck className="w-5 h-5" />
        ) : (
          <Bookmark className="w-5 h-5" />
        )}
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-2 text-sm font-medium transition-colors',
          saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          className
        )}
      >
        {saved ? (
          <>
            <BookmarkCheck className="w-4 h-4" />
            Saved
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4" />
            Save
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
        saved
          ? 'bg-primary/10 text-primary hover:bg-primary/20'
          : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20',
        className
      )}
    >
      {saved ? (
        <>
          <BookmarkCheck className="w-4 h-4" />
          Saved
        </>
      ) : (
        <>
          <Bookmark className="w-4 h-4" />
          Save for later
        </>
      )}
    </button>
  );
}

// Bookmarks list component
interface BookmarksListProps {
  className?: string;
}

export function BookmarksList({ className }: BookmarksListProps) {
  const { bookmarks, removeBookmark, clearAllBookmarks } = useBookmarks();

  if (bookmarks.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No bookmarks yet</h3>
        <p className="text-muted-foreground">
          Save articles, reviews, and tools to read later.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Saved Items ({bookmarks.length})
        </h2>
        <button
          onClick={clearAllBookmarks}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        {bookmarks.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs text-primary font-medium uppercase">
                    {item.type}
                  </span>
                  <a
                    href={item.url}
                    className="block font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.title}
                  </a>
                </div>
                <button
                  onClick={() => removeBookmark(item.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {item.excerpt && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {item.excerpt}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Saved {formatDate(item.savedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookmarkProvider;
