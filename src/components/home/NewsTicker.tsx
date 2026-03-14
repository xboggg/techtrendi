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
  "AI Tech": "text-violet-500",
  Security: "text-green-500",
  Phones: "text-blue-500",
  Productivity: "text-amber-500",
  "How-To": "text-cyan-500",
  Gaming: "text-red-500",
  default: "text-primary",
};

export function NewsTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    // Fetch latest articles and news
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
      // Interleave articles and news
      const merged: TickerItem[] = [];
      const maxLen = Math.max(articles.length, news.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < articles.length) merged.push(articles[i]);
        if (i < news.length) merged.push(news[i]);
      }
      setItems(merged);
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    const animate = () => {
      if (!pausedRef.current) {
        offsetRef.current += 0.6;
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

  return (
    <div
      className="w-full bg-card/80 backdrop-blur-sm border-b border-border overflow-hidden"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div className="flex items-center">
        {/* TRENDING badge */}
        <div className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold tracking-wider z-10">
          <Flame className="w-3.5 h-3.5" />
          TRENDING
        </div>

        {/* Scrolling track */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={trackRef}
            className="flex items-center gap-6 whitespace-nowrap will-change-transform py-2.5"
            style={{ width: "max-content" }}
          >
            {/* Render items twice for seamless loop */}
            {[...items, ...items].map((item, i) => {
              const color = categoryColors[item.category] || categoryColors.default;
              return (
                <Link
                  key={`${item.id}-${i}`}
                  to={item.type === "news" ? `/news/${item.slug}` : `/blog/${item.slug}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors shrink-0"
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>
                    {item.type === "news" ? "NEWS" : item.category}
                  </span>
                  <span className="text-foreground/80 hover:text-foreground transition-colors">
                    {item.title.length > 55 ? item.title.slice(0, 55) + "..." : item.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
