import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Shield, Zap, BookOpen, Star, TrendingUp, Clock, Eye, FileText,
  ChevronLeft, ChevronRight, Gamepad2, Send, Globe, Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GhanaFlag } from "@/components/ui/ghana-flag";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
// No static JSON fallback — API-first with sessionStorage cache
import staticNews from "@/data/news.json";
// No static featured articles fallback
import staticFeaturedGuides from "@/data/featured-guides.json";
import { CreepyTechHomeSection } from "@/components/home/CreepyTechCarousel";
import { cn } from "@/lib/utils";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AutoCarousel } from "@/components/home/AutoCarousel";
import { CarouselItem } from "@/components/ui/carousel";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

interface TrendingArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  views: number | null;
}

interface FeaturedGuide {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
}

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  created_at: string;
}

interface TickerItem {
  text: string;
  link: string | null;
  emoji: string | null;
  sort_order: number;
}
interface TickerSettings {
  enabled: boolean;
  position: "fixed" | "static";
  speed_secs: number;
}

const categoryLabels: Record<string, string> = {
  phones: "Phones",
  productivity: "Productivity",
  security: "Security",
  "how-to": "How-To",
  "ai-tech": "AI Tech",
  "smart-income": "Smart Income",
};

// Flagship local tools — TechTrendi's real differentiation (no global site has these).
const flagshipTools = [
  { title: "MoMo Fee Calculator", description: "Exact MTN & AT Money fees — E-Levy correctly removed", icon: Calculator, gradient: "from-yellow-400 to-orange-500", href: "/tools/momo-fee-calculator" },
  { title: "ECG Bill Estimator", description: "Estimate your electricity bill on the PURC 2026 tariff", icon: Zap, gradient: "from-amber-500 to-yellow-600", href: "/tools/ecg-bill-estimator" },
  { title: "Ghana Tax Calculator", description: "PAYE, SSNIT & take-home pay (2026 GRA bands)", icon: Calculator, gradient: "from-green-600 to-emerald-700", href: "/tools/ghana-tax-calculator" },
  { title: "Ghana Scam Checker", description: "Check a suspicious message before you reply", icon: Shield, gradient: "from-cyan-500 to-blue-600", href: "/tools/ghana-scam-checker" },
];

// Browse-by-category — the biggest/most relevant categories (counts are real).
const toolCategories = [
  {
    id: "business",
    title: "Business & Freelancer",
    description: "Invoicing, calculators, and money tools for hustlers and small businesses",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-600",
    count: 28,
  },
  {
    id: "security",
    title: "Security & Privacy",
    description: "Scam checkers, password tools, and privacy utilities to keep you safe",
    icon: Shield,
    gradient: "from-cyan-500 to-blue-600",
    count: 7,
  },
  {
    id: "productivity",
    title: "Productivity",
    description: "Timers, trackers, journals and tools to supercharge your daily workflow",
    icon: Zap,
    gradient: "from-yellow-400 to-orange-500",
    count: 22,
  },
  {
    id: "creator",
    title: "Creator & Marketing",
    description: "Content tools, caption generators, and analytics for creators",
    icon: Send,
    gradient: "from-purple-400 to-pink-500",
    count: 23,
  },
];

// World Tech in Brief — a light, editorial horizontal strip. International news
// is secondary to the Africa-first pillars, so it's a clean swipe-rail of
// headlines (full titles visible, no crowding) rather than a dark terminal panel.
function IntlNewsScroller({ news, formatTimeAgo }: { news: NewsItem[]; formatTimeAgo: (d: string) => string }) {
  const items = news.slice(0, 8);
  if (items.length === 0) return null;
  return (
    <section className="py-10 md:py-14">
      <div className="container">
        <div className="rounded-2xl md:rounded-3xl bg-card border border-border p-5 md:p-7 shadow-sm">
          {/* header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono text-[10px] font-semibold tracking-[0.2em] uppercase text-emerald-600">Live</span>
              <h2 className="text-base md:text-lg font-bold text-foreground">
                World Tech <span className="text-muted-foreground font-normal">in Brief</span>
              </h2>
            </div>
            <Link to="/news" className="group flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
              <span className="font-mono text-xs tracking-wide">THE WIRE</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* horizontal editorial strip — swipe-rail on mobile, full headlines visible */}
          <div className="flex gap-4 md:gap-5 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.slug}`}
                className="group snap-start shrink-0 w-[230px] md:w-[210px] border-l-2 border-primary/30 hover:border-primary pl-3 md:pl-4 transition-colors"
              >
                <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                  {item.category} · {formatTimeAgo(item.created_at)}
                </span>
                <p className="text-sm md:text-[15px] font-medium text-foreground group-hover:text-primary mt-1 leading-snug line-clamp-3 transition-colors">
                  {item.title}
                </p>
              </Link>
            ))}
          </div>
          <p className="text-center text-[10px] text-muted-foreground/60 mt-1 md:hidden">← swipe for more →</p>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const { subscription } = useAuth();
  // SessionStorage cache for instant repeat visits, API fetch for fresh data
  const [trendingArticles, setTrendingArticles] = useState<TrendingArticle[]>(() => {
    try { const c = sessionStorage.getItem("home:trending"); if (c) return JSON.parse(c); } catch {} return [];
  });
  const [loadingTrending, setLoadingTrending] = useState(trendingArticles.length === 0);
  const [featuredGuides, setFeaturedGuides] = useState<FeaturedGuide[]>(
    staticFeaturedGuides as FeaturedGuide[]
  );
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [internationalNews, setInternationalNews] = useState<NewsItem[]>([]);
  const [loadingIntlNews, setLoadingIntlNews] = useState(true);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [tickerSettings, setTickerSettings] = useState<TickerSettings | null>(null);

  useEffect(() => {
    // Removed fetchTrendingArticles — was fetched but never rendered (dead code)
    fetchFeaturedGuides();
    fetchLatestNews();
    fetchInternationalNews();
    fetchTicker();
  }, []);

  const fetchTicker = async () => {
    try {
      const [{ data: its }, { data: st }] = await Promise.all([
        supabase.from("ticker_items").select("text,link,emoji,sort_order")
          .eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("ticker_settings").select("enabled,position,speed_secs").eq("id", 1).single(),
      ]);
      if (its) setTickerItems(its as TickerItem[]);
      if (st) setTickerSettings(st as TickerSettings);
    } catch { /* silent — ticker just won't render */ }
  };

  const fetchTrendingArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes, views")
        .eq("is_published", true)
        .order("views", { ascending: false, nullsFirst: false })
        .limit(4);

      if (!error && data && data.length > 0) {
        setTrendingArticles(data);
        try { sessionStorage.setItem("home:trending", JSON.stringify(data)); } catch {}
      }
    } catch (error) {
      // Silent fail — cached data showing if available
    } finally {
      setLoadingTrending(false);
    }
  };

  const fetchFeaturedGuides = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes")
        .match({ is_published: true, is_featured: true })
        .order("created_at", { ascending: false })
        .limit(8);

      if (!error && data && data.length > 0) {
        setFeaturedGuides(data);
      }
    } catch (error) {
      // Silent fail — static data already showing
    } finally {
      setLoadingGuides(false);
    }
  };



  const fetchLatestNews = async () => {
    try {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes, created_at")
        .eq("is_published", true)
        .eq("category", "Africa Tech")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error && data && data.length > 0) {
        setLatestNews(data);
      } else {
        setLatestNews([]);
      }
    } catch {
      setLatestNews([]);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchInternationalNews = async () => {
    try {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes, created_at")
        .eq("is_published", true)
        .neq("category", "Africa Tech")
        .order("created_at", { ascending: false })
        .limit(12);

      if (!error && data && data.length > 0) {
        setInternationalNews(data);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingIntlNews(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const newsCategoryColors: Record<string, string> = {
    "AI Tech": "bg-purple-500",
    "Big Tech": "bg-blue-600",
    Cybersecurity: "bg-red-500",
    Gadgets: "bg-teal-500",
    Crypto: "bg-amber-500",
    Gaming: "bg-rose-500",
  };

  return (
    <Layout>
      <SEOHead
        title="TechTrendi – Ghana's Tech News, Tools & Digital Insights"
        description="Ghana's leading tech destination. Daily tech news from Ghana and Africa, 130+ free tools (MoMo fee calculator, scam checker, electricity calculator), and practical online-safety guides built for Africa."
        canonical="/"
        keywords={["Ghana tech news", "Africa technology", "Ghana technology blog", "MoMo calculator", "Ghana cybersecurity", "online safety Ghana", "Ghana digital tools"]}
      />
      {/* WebSite + Organization Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": "https://techtrendi.com/#website",
            "url": "https://techtrendi.com",
            "name": "TechTrendi",
            "description": "Tech News, Expert Guides & Free Tools for Africa",
            "publisher": { "@id": "https://techtrendi.com/#organization" },
            "potentialAction": {
              "@type": "SearchAction",
              "target": { "@type": "EntryPoint", "urlTemplate": "https://techtrendi.com/blog?q={search_term_string}" },
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "Organization",
            "@id": "https://techtrendi.com/#organization",
            "name": "TechTrendi",
            "url": "https://techtrendi.com",
            "logo": { "@type": "ImageObject", "url": "https://techtrendi.com/og-image.jpg" },
            "founder": { "@type": "Person", "name": "Edmund A.", "url": "https://techtrendi.com/about" },
            "sameAs": [
              "https://twitter.com/techtrendi",
              "https://facebook.com/techtrendi",
              "https://instagram.com/techtrendi",
              "https://tiktok.com/@tech.trendi"
            ],
            "contactPoint": { "@type": "ContactPoint", "contactType": "editorial", "url": "https://techtrendi.com/contact" }
          }
        ]
      })}} />
      {/* Hero — full-bleed dark image; fills the viewport so it meets the bottom ticker */}
      <section className="relative overflow-hidden min-h-[100svh] flex items-center border-b border-border/50">
        {/* Full-bleed background image with a slow breathing zoom */}
        <img
          src="/images/hero/hero-smartphone.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center animate-hero-zoom"
        />
        {/* Dark overlay — heavier on the left so the headline (and the white nav) stay readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

        <div className="container relative z-10 py-16 md:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white mb-5 backdrop-blur-sm">
              <span aria-hidden="true">🇬🇭</span> News · Tools · Online Safety
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-5 drop-shadow-lg">
              Tech made simple,{" "}
              <span className="text-amber-400">built for Ghana</span>
            </h1>
            <p className="text-lg text-white/80 max-w-xl mb-8">
              News that matters. Tools that work. Safety that sticks. All free —
              all built for how we actually live in Ghana.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild className="rounded-xl px-6">
                <Link to="/news?category=Africa Tech" className="flex items-center gap-2">
                  <Globe className="w-5 h-5" /> Read the News
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-xl px-6 border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                <Link to="/security" className="flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Stay Safe Online
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-xl px-6 border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                <Link to="/tools" className="flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Free Tools
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* (Trust strip moved to a fixed bottom ticker — rendered at the end of the page) */}

      {/* Africa Tech News — the lead pillar (tightened top so it flows from the dark bar) */}
      <section className="relative pt-10 md:pt-14 pb-16 md:pb-20 bg-gradient-to-b from-slate-50 to-white dark:from-background dark:to-background">
        <div className="container">
          {/* Section Header — premium eyebrow + gradient headline */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="h-px w-8 bg-gradient-to-r from-blue-500 to-cyan-400" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 dark:text-blue-400">
                  Africa Tech · Updated daily
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Fresh from{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  Ghana &amp; Africa
                </span>
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="self-start sm:self-auto text-blue-600 hover:text-blue-700 dark:text-blue-400">
              <Link to="/news?category=Africa Tech" className="flex items-center gap-1 font-medium">
                View All News
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {loadingNews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={cn(
                  "rounded-2xl overflow-hidden animate-pulse bg-muted",
                  i === 2 ? "md:row-span-2 aspect-[3/4]" : "aspect-[16/10]"
                )} />
              ))}
            </div>
          ) : latestNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestNews.slice(0, 5).map((news, index) => {
                const isLarge = index === 1;
                return (
                  <Link
                    key={news.id}
                    to={`/news/${news.slug}`}
                    className={cn(
                      "group relative rounded-2xl overflow-hidden bg-muted",
                      isLarge ? "md:row-span-2" : ""
                    )}
                  >
                    <div className={cn(
                      "relative w-full h-full overflow-hidden",
                      isLarge ? "aspect-[3/4] md:aspect-auto md:h-full" : "aspect-[16/10]"
                    )}>
                      {news.cover_image ? (
                        <img
                          src={news.cover_image}
                          alt={news.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
                      )}

                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      {/* Category badge */}
                      <div className="absolute top-4 left-4">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-xs font-semibold text-white",
                          newsCategoryColors[news.category] || "bg-blue-500"
                        )}>
                          {news.category}
                        </span>
                      </div>

                      {/* Content at bottom */}
                      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                        <h3 className={cn(
                          "font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors duration-300",
                          isLarge ? "text-xl md:text-2xl" : "text-base md:text-lg"
                        )}>
                          {news.title}
                        </h3>
                        <div className="flex items-center gap-3 text-white/60 text-xs">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(news.created_at)}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {news.read_time_minutes || 3} Min Read
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No news yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* World Tech in Brief — slim international-news strip (secondary to pillars) */}
      {internationalNews.length > 0 && <IntlNewsScroller news={internationalNews} formatTimeAgo={formatTimeAgo} />}




      {/* 5. Creepy Tech & Cyber Awareness */}
      <CreepyTechHomeSection />

      {/* 6. Explore Tool Categories Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="container">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">Free Utilities</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Free Tools, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Built for Ghana</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              130+ free tools made for everyday life in Ghana — from MoMo fees to your light bill — plus everything you need to work and create.
            </p>
          </div>

          {/* Built for Ghana — flagship local tools (our differentiation) */}
          <div className="mb-5 flex items-center gap-3">
            <GhanaFlag className="w-7 h-5 rounded shadow ring-1 ring-black/5 shrink-0" />
            <h3 className="text-lg font-bold text-foreground">Built for Ghana</h3>
            <span className="hidden sm:inline text-sm text-muted-foreground">— tools you won't find on any global site</span>
            <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>
          <AutoCarousel className="mb-14">
            {flagshipTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <CarouselItem key={tool.href} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Link
                    to={tool.href}
                    className="group relative flex flex-col p-5 rounded-2xl bg-card border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
                  >
                    {/* top gradient accent + soft glow behind the icon */}
                    <div className={cn("absolute top-0 inset-x-0 h-1 bg-gradient-to-r", tool.gradient)} />
                    <div className={cn("absolute -top-8 -left-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-gradient-to-br", tool.gradient)} aria-hidden="true" />
                    <div className="relative flex flex-col h-full">
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300",
                        tool.gradient
                      )}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {tool.title}
                      </h4>
                      <p className="text-sm text-muted-foreground flex-1">{tool.description}</p>
                      <span className="mt-3 text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Open tool
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </CarouselItem>
              );
            })}
          </AutoCarousel>

          {/* Browse by category */}
          <h3 className="text-lg font-bold text-foreground mb-4">Browse by category</h3>
          <AutoCarousel>
            {toolCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <CarouselItem key={cat.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Link
                    to={`/tools/${cat.id}`}
                    className="group relative flex flex-col p-6 rounded-2xl bg-card border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
                  >
                    <div className={cn("absolute top-0 inset-x-0 h-1 bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity", cat.gradient)} />
                    <div className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300",
                      cat.gradient
                    )}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      {cat.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{cat.count} tools</span>
                      <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Explore
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </CarouselItem>
              );
            })}
          </AutoCarousel>
          <div className="mt-10 text-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8" asChild>
              <Link to="/tools" className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                View All Tools
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 7. Featured Articles Section - Magazine Layout */}
      <section className="py-16 bg-background">
        <div className="container">
          {/* Section Header — premium eyebrow + gradient */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="h-px w-8 bg-gradient-to-r from-primary to-purple-400" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Curated by our team</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
                Editor's <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Picks</span>
              </h2>
              <p className="text-muted-foreground">Hand-picked guides on Ghana tech, online safety, and the tools worth your time.</p>
            </div>
            <Button variant="outline" asChild className="self-start sm:self-auto hidden md:inline-flex rounded-xl">
              <Link to="/blog" className="flex items-center gap-2">
                View All Articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {loadingGuides ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-muted rounded-2xl aspect-[4/5] animate-pulse" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-32 h-24 bg-muted rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : featuredGuides.length > 0 ? (
            <div className="space-y-6">
              {/* Top Row: 2 Big Cards Side by Side */}
              <div className="grid md:grid-cols-2 gap-6">
                {featuredGuides
                  .slice(0, 2).map((guide) => (
                  <Link
                    key={guide.id}
                    to={`/blog/${guide.slug}`}
                    className="group relative rounded-2xl overflow-hidden bg-muted aspect-[16/10]"
                  >
                    {guide.cover_image ? (
                      <img
                        src={guide.cover_image}
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-primary hover:bg-primary text-primary-foreground border-0 rounded-full px-3 py-1 text-xs">
                          {categoryLabels[guide.category] || guide.category}
                        </Badge>
                        <span className="flex items-center gap-1 text-white/70 text-xs">
                          <Clock className="w-3 h-3" />
                          {guide.read_time_minutes || 5} Minutes
                        </span>
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-white group-hover:text-primary/90 transition-colors line-clamp-2">
                        {guide.title}
                      </h2>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom Row: 6 Small Cards in 3x2 Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredGuides
                  .slice(2, 8).map((guide) => (
                  <Link
                    key={guide.id}
                    to={`/blog/${guide.slug}`}
                    className="group flex gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-md transition-all"
                  >
                    <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      {guide.cover_image ? (
                        <img
                          src={guide.cover_image}
                          alt={guide.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {guide.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {categoryLabels[guide.category] || guide.category}
                        </Badge>
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock className="w-3 h-3" />
                          {guide.read_time_minutes || 5} min
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No featured articles yet</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Featured articles will appear here once you mark them as featured in the admin panel.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/blog">Browse All Articles</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Premium Glass Panel with Living Background */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient-bg" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-20" />

        {/* Glowing breathing orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-breathe opacity-50 bg-[radial-gradient(circle,rgba(255,255,255,0.3)_0%,transparent_70%)]" style={{ boxShadow: '0 0 100px 50px rgba(255, 255, 255, 0.15)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px] animate-breathe-slow opacity-45 bg-[radial-gradient(circle,rgba(255,255,255,0.25)_0%,transparent_70%)]" style={{ animationDelay: '-4s', boxShadow: '0 0 100px 50px rgba(255, 255, 255, 0.12)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px] animate-breathe opacity-30 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,transparent_70%)]" />

        {/* Glowing floating particles */}
        <div className="absolute top-[20%] left-[20%] w-2 h-2 bg-white rounded-full animate-float opacity-60" style={{ boxShadow: '0 0 15px 8px rgba(255, 255, 255, 0.4)' }} />
        <div className="absolute top-[30%] right-[30%] w-3 h-3 bg-white rounded-full animate-float opacity-50" style={{ animationDelay: '-5s', boxShadow: '0 0 20px 10px rgba(255, 255, 255, 0.35)' }} />
        <div className="absolute bottom-[25%] left-[40%] w-2 h-2 bg-white rounded-full animate-float opacity-55" style={{ animationDelay: '-3s', boxShadow: '0 0 15px 8px rgba(255, 255, 255, 0.4)' }} />
        <div className="container relative">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 rounded-3xl bg-white/10 backdrop-blur-sm mb-6 animate-float">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Take a Break, Try Something <span className="text-gradient-accent">Fun</span>
            </h2>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
              Quick interactive tools that are actually entertaining
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { title: "Phishing Quiz", hook: "Can you spot the scam?", icon: "🎣", path: "/tools/phishing-quiz" },
              { title: "This Day in History", hook: "What happened today?", icon: "📅", path: "/tools/this-day-in-history" },
              { title: "Life Progress Bar", hook: "How far along are you?", icon: "⏳", path: "/tools/life-progress-bar" },
              { title: "Job Tracker", hook: "Track your applications", icon: "💼", path: "/tools/job-tracker" },
            ].map((tool) => (
              <Link
                key={tool.title}
                to={tool.path}
                className="group p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 text-center"
              >
                <div className="text-4xl mb-3">{tool.icon}</div>
                <h3 className="font-bold text-white text-base md:text-lg mb-2">{tool.title}</h3>
                <p className="text-white/70 text-xs md:text-sm mb-4">{tool.hook}</p>
                <span className="inline-flex items-center gap-1 text-white text-sm font-medium group-hover:gap-2 transition-all">
                  Try It <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Admin-managed ticker — DB-driven (see /admin/ticker). Renders only when
          enabled and there are active items. Position fixed (pinned) or static. */}
      {tickerSettings?.enabled && tickerItems.length > 0 && (() => {
        const isFixed = tickerSettings.position === "fixed";
        const dur = `${Math.max(10, tickerSettings.speed_secs || 40)}s`;
        return (
          <>
            {/* Spacer so the footer clears the bar only when it's pinned */}
            {isFixed && <div aria-hidden="true" className="h-10" />}
            <div className={`ticker-wrap z-40 bg-slate-950/95 backdrop-blur-sm border-t border-white/10 overflow-hidden ${isFixed ? "fixed bottom-0 inset-x-0" : "relative w-full"}`}>
              <div className="h-0.5 bg-gradient-to-r from-[#ce1126] via-[#fcd116] to-[#006b3f] animate-flag-flow" />
              <div className="overflow-hidden py-2">
                <div className="flex w-max animate-ticker-scroll" style={{ animationDuration: dur }}>
                  {[0, 1].map((dup) => (
                    <div
                      key={dup}
                      className="flex items-center shrink-0 text-sm text-white/55"
                      aria-hidden={dup === 1 ? true : undefined}
                    >
                      {tickerItems.map((it, idx) => {
                        const content = (
                          <span className="inline-flex items-center gap-1.5">
                            {it.emoji && <span>{it.emoji}</span>}
                            {it.text}
                          </span>
                        );
                        const inner = it.link
                          ? (it.link.startsWith("/")
                              ? <Link to={it.link} className="text-white/85 hover:text-white transition-colors underline-offset-2 hover:underline">{content}</Link>
                              : <a href={it.link} target="_blank" rel="noopener noreferrer" className="text-white/85 hover:text-white transition-colors underline-offset-2 hover:underline">{content}</a>)
                          : <span className="text-white/70">{content}</span>;
                        return (
                          <span key={idx} className="flex items-center">
                            <span className="px-6">{inner}</span>
                            <span className="text-white/15">•</span>
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </Layout>
  );
}
