import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Filter, Clock, TrendingUp, ArrowRight, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  type: 'review' | 'blog' | 'guide' | 'tool';
  category: string;
  excerpt: string;
  image?: string;
  highlight?: string;
}

interface SearchFilters {
  type: string[];
  category: string[];
  dateRange: 'all' | 'week' | 'month' | 'year';
  sortBy: 'relevance' | 'date' | 'popularity';
}

const defaultFilters: SearchFilters = {
  type: [],
  category: [],
  dateRange: 'all',
  sortBy: 'relevance',
};

const categories = ['Smartphones', 'Laptops', 'Audio', 'Wearables', 'Security', 'Software'];
const contentTypes = ['review', 'blog', 'guide', 'tool'];

// Sample results
const sampleResults: SearchResult[] = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max Review: The Ultimate Smartphone',
    slug: 'iphone-15-pro-max-review',
    type: 'review',
    category: 'Smartphones',
    excerpt: 'Our comprehensive review of Apple\'s flagship phone with the new titanium design...',
    highlight: '<mark>iPhone</mark> 15 Pro Max features the new A17 Pro chip...',
  },
  {
    id: '2',
    title: 'Best Password Managers in 2024',
    slug: 'best-password-managers-2024',
    type: 'guide',
    category: 'Security',
    excerpt: 'Complete guide to choosing the right password manager for your needs...',
  },
  {
    id: '3',
    title: 'How to Protect Your Privacy Online',
    slug: 'online-privacy-guide',
    type: 'blog',
    category: 'Security',
    excerpt: 'Essential tips and tools for maintaining your digital privacy...',
  },
];

export function AdvancedSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('techtrendi_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search handler
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      // Simulate search - filter sample results
      const filtered = sampleResults.filter((r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.excerpt.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters]);

  const saveSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('techtrendi_recent_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('techtrendi_recent_searches');
  };

  const toggleFilter = (filterType: 'type' | 'category', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter((v) => v !== value)
        : [...prev[filterType], value],
    }));
  };

  const hasActiveFilters =
    filters.type.length > 0 ||
    filters.category.length > 0 ||
    filters.dateRange !== 'all' ||
    filters.sortBy !== 'relevance';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-muted-foreground hover:bg-muted/80 transition-colors',
          className
        )}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-background rounded text-xs">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh]">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query) {
                saveSearch(query);
              }
            }}
            placeholder="Search articles, reviews, tools..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showFilters || hasActiveFilters ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-border bg-muted/30 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Content Type</h4>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleFilter('type', type)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm capitalize transition-colors',
                      filters.type.includes(type)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border border-border hover:bg-muted'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Category</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleFilter('category', cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm transition-colors',
                      filters.category.includes(cat)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border border-border hover:bg-muted'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters((f) => ({ ...f, dateRange: e.target.value as SearchFilters['dateRange'] }))}
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="all">Any time</option>
                  <option value="week">Past week</option>
                  <option value="month">Past month</option>
                  <option value="year">Past year</option>
                </select>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as SearchFilters['sortBy'] }))}
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="relevance">Most relevant</option>
                  <option value="date">Most recent</option>
                  <option value="popularity">Most popular</option>
                </select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={() => setFilters(defaultFilters)}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Results / Suggestions */}
        <div className="max-h-96 overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-4 space-y-4">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recent searches
                    </h4>
                    <button onClick={clearRecentSearches} className="text-xs text-muted-foreground hover:text-foreground">
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(search)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['iPhone 16', 'Best laptops', 'Password security', 'AI tools'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : isSearching ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No results found for "{query}"</p>
              <p className="text-sm text-muted-foreground mt-1">Try different keywords or filters</p>
            </div>
          ) : (
            <div className="p-2">
              {results.map((result) => (
                <Link
                  key={result.id}
                  to={`/${result.type === 'review' ? 'reviews' : result.type === 'blog' ? 'blog' : result.type === 'tool' ? 'tools' : 'guides'}/${result.slug}`}
                  onClick={() => {
                    saveSearch(query);
                    setIsOpen(false);
                  }}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {result.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{result.category}</span>
                    </div>
                    <h4 className="font-medium text-foreground line-clamp-1">{result.title}</h4>
                    {result.highlight ? (
                      <p
                        className="text-sm text-muted-foreground line-clamp-1"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground line-clamp-1">{result.excerpt}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">esc</kbd>
              to close
            </span>
          </div>
          {results.length > 0 && <span>{results.length} results</span>}
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />
    </div>
  );
}

export default AdvancedSearch;
