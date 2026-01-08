import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, ArrowRight, FileText, Wrench, BookOpen, Star, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: 'article' | 'review' | 'tool' | 'guide' | 'page';
  category?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sample searchable content - in production, this would come from API/database
const searchableContent: SearchResult[] = [
  // Tools
  { id: 't1', title: 'Password Generator', description: 'Generate secure passwords', url: '/tools/password-generator', type: 'tool', category: 'Security' },
  { id: 't2', title: 'Password Checker', description: 'Check password strength', url: '/tools/password-checker', type: 'tool', category: 'Security' },
  { id: 't3', title: 'QR Code Generator', description: 'Create QR codes instantly', url: '/tools/qr-generator', type: 'tool', category: 'Utility' },
  { id: 't4', title: 'Image Compressor', description: 'Optimize and compress images', url: '/tools/image-compressor', type: 'tool', category: 'Media' },
  { id: 't5', title: 'Phone Comparison', description: 'Compare phone specifications', url: '/tools/phone-comparison', type: 'tool', category: 'Reviews' },
  { id: 't6', title: 'Upgrade Calculator', description: 'Should you upgrade your device?', url: '/tools/upgrade-calculator', type: 'tool', category: 'Reviews' },
  { id: 't7', title: 'JSON Formatter', description: 'Format and validate JSON', url: '/tools/json-formatter', type: 'tool', category: 'Developer' },
  { id: 't8', title: 'Base64 Encoder', description: 'Encode/decode Base64', url: '/tools/base64-encoder', type: 'tool', category: 'Developer' },
  { id: 't9', title: 'Color Picker', description: 'Pick and convert colors', url: '/tools/color-picker', type: 'tool', category: 'Design' },

  // Pages
  { id: 'p1', title: 'Home', description: 'TechTrendi homepage', url: '/', type: 'page' },
  { id: 'p2', title: 'Blog', description: 'Latest tech articles', url: '/blog', type: 'page' },
  { id: 'p3', title: 'Reviews', description: 'Product reviews', url: '/reviews', type: 'page' },
  { id: 'p4', title: 'Guides', description: 'How-to guides', url: '/guides', type: 'page' },
  { id: 'p5', title: 'Tools', description: 'Free online tools', url: '/tools', type: 'page' },
  { id: 'p6', title: 'Premium', description: 'Premium membership', url: '/premium', type: 'page' },
  { id: 'p7', title: 'About', description: 'About TechTrendi', url: '/about', type: 'page' },

  // Guides
  { id: 'g1', title: 'Phone Buying Guide', description: 'How to choose the perfect phone', url: '/guides/phones', type: 'guide', category: 'Phones' },
  { id: 'g2', title: 'Security Guide', description: 'Protect your digital life', url: '/guides/security', type: 'guide', category: 'Security' },
  { id: 'g3', title: 'Laptop Buying Guide', description: 'Find the right laptop', url: '/guides/laptops', type: 'guide', category: 'Laptops' },
];

const typeIcons = {
  article: FileText,
  review: Star,
  tool: Wrench,
  guide: BookOpen,
  page: ArrowRight,
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
    const filtered = searchableContent.filter((item) => {
      const searchText = `${item.title} ${item.description || ''} ${item.category || ''}`.toLowerCase();
      return searchTerms.every((term) => searchText.includes(term));
    });

    setResults(filtered.slice(0, 10));
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    },
    [results, selectedIndex, onClose]
  );

  const handleSelect = (result: SearchResult) => {
    // Save to recent searches
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
    onClose();
    window.location.href = result.url;
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-background rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search articles, tools, guides..."
            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-lg"
          />
          <kbd className="hidden sm:inline-flex px-2 py-1 text-xs bg-muted rounded">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Show results if query exists */}
          {query && results.length > 0 && (
            <div className="p-2">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type];
                return (
                  <Link
                    key={result.id}
                    to={result.url}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      index === selectedIndex
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {result.description}
                        </p>
                      )}
                    </div>
                    {result.category && (
                      <span className="text-xs px-2 py-1 bg-muted rounded-full">
                        {result.category}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query && results.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          )}

          {/* Empty state with suggestions */}
          {!query && (
            <div className="p-4 space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recent Searches
                    </h4>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(search)}
                        className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Popular
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {['Password Generator', 'Phone Comparison', 'Security Guide', 'QR Generator'].map(
                    (item) => (
                      <button
                        key={item}
                        onClick={() => setQuery(item)}
                        className="px-3 py-2 text-sm text-left bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd>
              to select
            </span>
          </div>
          <span>Powered by TechTrendi</span>
        </div>
      </div>
    </div>
  );
}

// Search Button/Trigger
export function SearchButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors',
          className
        )}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex px-1.5 py-0.5 text-xs bg-background rounded border border-border">
          ⌘K
        </kbd>
      </button>
      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default SearchModal;
