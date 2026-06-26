import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Newspaper, Wrench, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// A REAL hero search. As you type it live-queries the actual `articles` and
// `news` tables in Supabase (not a hardcoded sample list), plus matches the
// known local tools by keyword. Quick-tag chips jump straight to the flagship
// Ghana tools. Designed to sit in the dark hero (light text on dark glass).

interface Hit {
  title: string;
  url: string;
  type: "article" | "news" | "tool";
  category?: string | null;
}

const typeIcon = { article: FileText, news: Newspaper, tool: Wrench } as const;
const typeLabel = { article: "Guide", news: "News", tool: "Tool" } as const;

// Flagship local tools — searchable by simple keyword match (tools aren't in the DB).
const LOCAL_TOOLS: { title: string; url: string; keywords: string }[] = [
  { title: "MoMo Fee Calculator", url: "/tools/momo-fee-calculator", keywords: "momo mobile money fee charge mtn at money transfer e-levy" },
  { title: "ECG Bill Estimator", url: "/tools/ecg-bill-estimator", keywords: "ecg electricity bill light prepaid power purc tariff" },
  { title: "Ghana Tax Calculator", url: "/tools/ghana-tax-calculator", keywords: "tax paye ssnit salary take home pay gra income" },
  { title: "Ghana Scam Checker", url: "/tools/ghana-scam-checker", keywords: "scam fraud check message suspicious fake phishing 419" },
  { title: "Password Generator", url: "/tools/password-generator", keywords: "password generate secure strong random" },
  { title: "Password Checker", url: "/tools/password-checker", keywords: "password strength check weak strong" },
  { title: "QR Code Generator", url: "/tools/qr-generator", keywords: "qr code generate scan link" },
  { title: "Image Compressor", url: "/tools/image-compressor", keywords: "image compress optimize photo reduce size" },
];

// Quick-tag chips shown under the search box.
const QUICK_TAGS: { label: string; url: string }[] = [
  { label: "MoMo fees", url: "/tools/momo-fee-calculator" },
  { label: "Scam check", url: "/tools/ghana-scam-checker" },
  { label: "Tax calculator", url: "/tools/ghana-tax-calculator" },
  { label: "ECG bill", url: "/tools/ecg-bill-estimator" },
];

export function HeroSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Live search: local tools instantly + Supabase articles/news (debounced).
  useEffect(() => {
    const q = query.trim();
    if (debounce.current) clearTimeout(debounce.current);
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    // Instant local-tool matches so the box never feels dead.
    const ql = q.toLowerCase();
    const toolHits: Hit[] = LOCAL_TOOLS
      .filter((t) => `${t.title} ${t.keywords}`.toLowerCase().includes(ql))
      .slice(0, 3)
      .map((t) => ({ title: t.title, url: t.url, type: "tool" as const }));
    setHits(toolHits);

    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const pattern = `%${q}%`;
        const [a, n] = await Promise.all([
          supabase
            .from("articles")
            .select("title, slug, category")
            .eq("is_published", true)
            .ilike("title", pattern)
            .limit(5),
          supabase
            .from("news")
            .select("title, slug, category")
            .eq("is_published", true)
            .ilike("title", pattern)
            .limit(4),
        ]);

        const articleHits: Hit[] = (a.data || []).map((r) => ({
          title: r.title, url: `/blog/${r.slug}`, type: "article" as const, category: r.category,
        }));
        const newsHits: Hit[] = (n.data || []).map((r) => ({
          title: r.title, url: `/news/${r.slug}`, type: "news" as const, category: r.category,
        }));

        setHits([...toolHits, ...articleHits, ...newsHits].slice(0, 8));
        setActive(0);
      } catch {
        // keep tool hits on failure
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => debounce.current && clearTimeout(debounce.current);
  }, [query]);

  const go = useCallback((url: string) => {
    setOpen(false);
    setQuery("");
    navigate(url);
  }, [navigate]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      if (hits[active]) go(hits[active].url);
      else if (query.trim()) navigate(`/blog?q=${encodeURIComponent(query.trim())}`);
    }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      {/* Search box */}
      <div
        className={cn(
          "flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl border backdrop-blur-md transition-all",
          "bg-white/10 border-white/25 shadow-lg",
          open && hits.length > 0 ? "rounded-b-none border-b-transparent" : ""
        )}
      >
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="What do you need help with?"
          aria-label="Search TechTrendi"
          className="flex-1 bg-transparent text-white placeholder-white/55 focus:outline-none text-sm sm:text-base md:text-lg"
        />
        {loading && <Loader2 className="w-4 h-4 text-white/60 animate-spin shrink-0" />}
      </div>

      {/* Live results dropdown */}
      {open && hits.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 bg-background border border-white/25 border-t-0 rounded-b-2xl shadow-2xl overflow-hidden">
          {hits.map((h, i) => {
            const Icon = typeIcon[h.type];
            return (
              <button
                key={h.url}
                onClick={() => go(h.url)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  i === active ? "bg-primary/10" : "hover:bg-muted"
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="flex-1 min-w-0 truncate font-medium text-foreground">{h.title}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                  {typeLabel[h.type]}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* No-result hint */}
      {open && query.trim().length >= 2 && !loading && hits.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-30 bg-background border border-white/25 border-t-0 rounded-b-2xl shadow-2xl px-4 py-4 text-sm text-muted-foreground">
          No matches for “{query.trim()}”. Try a tool name, topic, or keyword.
        </div>
      )}

      {/* Quick-tag chips — smaller on mobile to keep the hero uncluttered. */}
      <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-[11px] sm:text-xs text-white/55 mr-0.5 sm:mr-1">Popular:</span>
        {QUICK_TAGS.map((t) => (
          <button
            key={t.url}
            onClick={() => navigate(t.url)}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 transition-colors backdrop-blur-sm"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default HeroSearch;
