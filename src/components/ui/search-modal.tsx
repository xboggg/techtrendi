import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Search, X, ArrowRight, FileText, Wrench, Newspaper, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// REAL search. As you type it live-queries the actual `articles` and `news`
// tables in Supabase plus matches the known local tools by keyword. (It used to
// search a hardcoded sample list with dead pages — now it searches real content.)

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: 'article' | 'news' | 'tool';
  category?: string | null;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Flagship local tools — tools aren't in the DB, so match them by keyword.
const LOCAL_TOOLS: { title: string; description: string; url: string; keywords: string }[] = [
  { title: 'MoMo Fee Calculator', description: 'Exact MTN & AT Money fees (E-Levy removed)', url: '/tools/momo-fee-calculator', keywords: 'momo mobile money fee charge mtn at money transfer e-levy' },
  { title: 'ECG Bill Estimator', description: 'Estimate your electricity bill (PURC 2026)', url: '/tools/ecg-bill-estimator', keywords: 'ecg electricity bill light prepaid power purc tariff' },
  { title: 'Ghana Tax Calculator', description: 'PAYE, SSNIT & take-home pay (2026 GRA)', url: '/tools/ghana-tax-calculator', keywords: 'tax paye ssnit salary take home pay gra income' },
  { title: 'Ghana Scam Checker', description: 'Check a suspicious message before you reply', url: '/tools/ghana-scam-checker', keywords: 'scam fraud check message suspicious fake phishing 419' },
  { title: 'Password Generator', description: 'Generate secure passwords', url: '/tools/password-generator', keywords: 'password generate secure strong random' },
  { title: 'Password Checker', description: 'Check password strength', url: '/tools/password-checker', keywords: 'password strength check weak strong' },
  { title: 'QR Code Generator', description: 'Create QR codes instantly', url: '/tools/qr-generator', keywords: 'qr code generate scan link' },
  { title: 'Image Compressor', description: 'Optimize and compress images', url: '/tools/image-compressor', keywords: 'image compress optimize photo reduce size' },
];

const typeIcons = {
  article: FileText,
  news: Newspaper,
  tool: Wrench,
};
const typeLabel = { article: 'Guide', news: 'News', tool: 'Tool' } as const;

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      try { setRecentSearches(JSON.parse(saved).slice(0, 5)); } catch { /* ignore */ }
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

  // Live search: instant local tools + debounced Supabase articles/news.
  useEffect(() => {
    const q = query.trim();
    if (debounce.current) clearTimeout(debounce.current);
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const ql = q.toLowerCase();
    const toolHits: SearchResult[] = LOCAL_TOOLS
      .filter((t) => `${t.title} ${t.keywords}`.toLowerCase().includes(ql))
      .slice(0, 4)
      .map((t) => ({ id: t.url, title: t.title, description: t.description, url: t.url, type: 'tool' as const, category: 'Tool' }));
    setResults(toolHits);

    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const pattern = `%${q}%`;
        const [a, n] = await Promise.all([
          supabase.from('articles').select('title, slug, category, excerpt').eq('is_published', true).ilike('title', pattern).limit(6),
          supabase.from('news').select('title, slug, category, excerpt').eq('is_published', true).ilike('title', pattern).limit(5),
        ]);

        const articleHits: SearchResult[] = (a.data || []).map((r: any) => ({
          id: `/blog/${r.slug}`, title: r.title, description: r.excerpt || undefined, url: `/blog/${r.slug}`, type: 'article' as const, category: r.category,
        }));
        const newsHits: SearchResult[] = (n.data || []).map((r: any) => ({
          id: `/news/${r.slug}`, title: r.title, description: r.excerpt || undefined, url: `/news/${r.slug}`, type: 'news' as const, category: r.category,
        }));

        setResults([...toolHits, ...articleHits, ...newsHits].slice(0, 10));
        setSelectedIndex(0);
      } catch {
        // keep tool hits on failure
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => debounce.current && clearTimeout(debounce.current);
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].filter(Boolean).slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
    onClose();
    navigate(result.url);
  }, [query, recentSearches, onClose, navigate]);

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
          if (results[selectedIndex]) handleSelect(results[selectedIndex]);
          break;
        case 'Escape':
          onClose();
          break;
      }
    },
    [results, selectedIndex, onClose, handleSelect]
  );

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
            placeholder="Search guides, news and tools..."
            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-lg"
          />
          {loading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
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
          {query.trim().length >= 2 && results.length > 0 && (
            <div className="p-2">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type];
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
                      index === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
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
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 bg-muted rounded-full text-muted-foreground flex-shrink-0">
                      {typeLabel[result.type]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No results found for "{query.trim()}"</p>
              <p className="text-sm mt-1">Try a tool name, topic, or keyword</p>
            </div>
          )}

          {/* Empty state with suggestions */}
          {query.trim().length < 2 && (
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
                  {['MoMo fees', 'Scam checker', 'Tax calculator', 'ECG bill'].map(
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
export function SearchButton({ className, isOverHero = false }: { className?: string; isOverHero?: boolean }) {
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
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors backdrop-blur-md',
          isOverHero
            ? 'text-white/80 bg-white/10 hover:bg-white/20 border border-white/20'
            : 'text-gray-700 dark:text-white/80 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-gray-300 dark:border-white/20 shadow-sm',
          className
        )}
      >
        <Search className={cn("w-4 h-4", isOverHero ? "text-white/70" : "text-gray-600 dark:text-white/70")} />
        <span className="hidden sm:inline">Search...</span>
        <kbd className={cn(
          "hidden md:inline-flex px-1.5 py-0.5 text-xs rounded border font-medium",
          isOverHero
            ? "text-white/70 bg-white/10 border-white/20"
            : "text-gray-600 dark:text-white/70 bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/20"
        )}>
          ⌘K
        </kbd>
      </button>
      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default SearchModal;
