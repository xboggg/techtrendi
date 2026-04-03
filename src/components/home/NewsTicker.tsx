import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TickerItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  type: "article" | "news";
}

const categoryColors: Record<string, string> = {
  "AI Tech": "text-violet-600 dark:text-violet-400",
  Security: "text-emerald-600 dark:text-emerald-400",
  Phones: "text-blue-600 dark:text-blue-400",
  Productivity: "text-amber-600 dark:text-amber-400",
  "How-To": "text-cyan-600 dark:text-cyan-400",
  Gaming: "text-red-600 dark:text-red-400",
  "Smart Income": "text-pink-600 dark:text-pink-400",
  "Health Tech": "text-teal-600 dark:text-teal-400",
  default: "text-primary",
};

export function NewsTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    Promise.all([
      supabase
        .from("articles")
        .select("id, title, slug, category")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("news")
        .select("id, title, slug, category")
        .order("created_at", { ascending: false })
        .limit(6),
    ]).then(([articlesRes, newsRes]) => {
      const articles: TickerItem[] = (articlesRes.data || []).map((a) => ({
        ...a,
        type: "article" as const,
      }));
      const news: TickerItem[] = (newsRes.data || []).map((n) => ({
        ...n,
        type: "news" as const,
      }));
      const merged: TickerItem[] = [];
      const maxLen = Math.max(articles.length, news.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < articles.length) merged.push(articles[i]);
        if (i < news.length) merged.push(news[i]);
      }
      setItems(merged);
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    const animate = () => {
      if (!pausedRef.current) {
        offsetRef.current += 0.5;
        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0 && offsetRef.current >= halfWidth) {
          offsetRef.current -= halfWidth;
        }
        track.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [items]);

  if (items.length === 0) return null;

  const renderItems = [...items, ...items];

  return (
    <div
      className="w-full bg-white dark:bg-gray-900 overflow-hidden relative"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Animated progress bar line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div
          className="absolute h-full w-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
          style={{ animation: 'progress-fill 8s linear infinite' }}
        />
      </div>
      <div className="flex items-center h-10 max-w-full overflow-hidden px-3 md:px-5 gap-3 mt-[2px]">
        {/* TRENDING pill badge */}
        <div className="shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[11px] font-bold tracking-wider uppercase shadow-sm">
          <Flame className="w-3.5 h-3.5" />
          Trending
        </div>

        {/* Scrolling area */}
        <div className="relative flex-1 min-w-0 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />

          {/* Scrolling track */}
          <div
            ref={trackRef}
            className="flex items-center whitespace-nowrap will-change-transform h-10"
            style={{ width: "max-content" }}
          >
            {renderItems.map((item, i) => {
              return (
                <span key={`${item.id}-${i}`} className="inline-flex items-center">
                  {i > 0 && (
                    <span className="mx-3 md:mx-4 w-1 h-1 rounded-full bg-gray-300 dark:bg-white/30 shrink-0" />
                  )}
                  <Link
                    to={item.type === "news" ? `/news/${item.slug}` : `/blog/${item.slug}`}
                    className="inline-flex items-center gap-2 text-[13px] hover:text-violet-600 dark:hover:text-white transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      {item.type === "news" ? "News" : item.category}
                    </span>
                    <span className="text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                      {item.title.length > 55 ? item.title.slice(0, 55) + "\u2026" : item.title}
                    </span>
                  </Link>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
