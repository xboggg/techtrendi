import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Shield, Zap, BookOpen, Star, TrendingUp, Clock, Eye, FileText,
  ChevronLeft, ChevronRight, Gamepad2, Send, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
// No static JSON fallback — API-first with sessionStorage cache
import staticNews from "@/data/news.json";
// No static featured articles fallback
import staticFeaturedGuides from "@/data/featured-guides.json";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { WaveFeatureCarousel } from "@/components/ui/wave-feature-carousel";
import { CreepyTechHomeSection } from "@/components/home/CreepyTechCarousel";
import { cn } from "@/lib/utils";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { CardCarousel } from "@/components/ui/card-carousel";

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

interface LatestArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  created_at: string;
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

interface Review {
  id: string;
  title: string;
  slug: string;
  category: string;
  image: string | null;
  rating: number | null;
}

const categoryLabels: Record<string, string> = {
  phones: "Phones",
  productivity: "Productivity",
  security: "Security",
  "how-to": "How-To",
  "ai-tech": "AI Tech",
  "smart-income": "Smart Income",
};

// Tool categories matching image 5
const toolCategories = [
  {
    id: "productivity",
    title: "Productivity",
    description: "Timers, trackers, journals and tools to supercharge your daily workflow",
    icon: Zap,
    gradient: "from-yellow-400 to-orange-500",
    count: 13,
  },
  {
    id: "creator",
    title: "Creator & Marketing",
    description: "Content tools, caption generators, analytics for creators",
    icon: Send,
    gradient: "from-purple-400 to-pink-500",
    count: 11,
  },
  {
    id: "career",
    title: "Career",
    description: "Resume builders, job trackers, salary tools to land your dream job",
    icon: BookOpen,
    gradient: "from-green-400 to-emerald-500",
    count: 6,
  },
  {
    id: "other",
    title: "Life & Fun",
    description: "Decision wheels, life trackers, and fun utilities",
    icon: Gamepad2,
    gradient: "from-red-400 to-pink-500",
    count: 8,
  },
];

function IntlNewsScroller({ news, formatTimeAgo }: { news: NewsItem[]; formatTimeAgo: (d: string) => string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number>(0);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const step = () => {
      if (!isPausedRef.current && el) {
        el.scrollLeft += 0.8;
        // Loop: when scrolled past halfway (the duplicated content), reset
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      autoScrollRef.current = requestAnimationFrame(step);
    };
    autoScrollRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(autoScrollRef.current);
  }, [news]);

  const pause = () => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const resumeAfterDelay = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 4000);
  };

  const scrollBy = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    pause();
    el.scrollBy({ left: dir * 300, behavior: "smooth" });
    resumeAfterDelay();
  };

  return (
    <section className="py-12 bg-gradient-to-b from-white to-slate-50 dark:from-background dark:to-muted/20 overflow-hidden">
      <div className="container mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-sm font-medium text-purple-600 dark:text-purple-400 mb-3">
              <Globe className="w-3.5 h-3.5" />
              World Tech
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              International Tech News
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBy(-1)}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-border transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-border transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <Button variant="ghost" size="sm" asChild className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
              <Link to="/news" className="flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide px-4 md:px-8"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        onMouseEnter={pause}
        onMouseLeave={resumeAfterDelay}
        onTouchStart={pause}
        onTouchEnd={resumeAfterDelay}
      >
        {[...news, ...news].map((item, idx) => (
          <Link
            key={`${item.id}-${idx}`}
            to={`/news/${item.slug}`}
            className="flex-shrink-0 w-64 md:w-72 rounded-2xl overflow-hidden bg-card border border-border hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              {item.cover_image ? (
                <img
                  src={item.cover_image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30" />
              )}
              <div className="absolute top-3 left-3">
                <Badge className="text-xs bg-purple-600 hover:bg-purple-600 text-white border-0 rounded-full px-3 py-1">
                  {item.category}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(item.created_at)}</span>
                <span>·</span>
                <span>{item.read_time_minutes || 3} Min Read</span>
              </div>
            </div>
          </Link>
        ))}
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
  const [latestArticles, setLatestArticles] = useState<LatestArticle[]>(() => {
    try { const c = sessionStorage.getItem("home:latest"); if (c) return JSON.parse(c); } catch {} return [];
  });
  const [loadingLatest, setLoadingLatest] = useState(latestArticles.length === 0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [internationalNews, setInternationalNews] = useState<NewsItem[]>([]);
  const [loadingIntlNews, setLoadingIntlNews] = useState(true);

  useEffect(() => {
    // Removed fetchTrendingArticles — was fetched but never rendered (dead code)
    fetchFeaturedGuides();
    fetchLatestArticles();
    fetchReviews();
    fetchLatestNews();
    fetchInternationalNews();
  }, []);

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

  const fetchLatestArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        setLatestArticles(data);
        try { sessionStorage.setItem("home:latest", JSON.stringify(data)); } catch {}
      }
    } catch (error) {
      // Silent fail — cached data showing if available
    } finally {
      setLoadingLatest(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, title, slug, category, image, rating")
        .match({ is_published: true, is_featured: true })
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        setReviews(data);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoadingReviews(false);
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
        description="Ghana's leading tech destination. Daily tech news from Ghana and Africa, 130+ free tools (MoMo fee calculator, scam checker, electricity calculator), honest reviews, and digital insights built for Africa."
        canonical="/"
        keywords={["Ghana tech news", "Africa technology", "Ghana technology blog", "MoMo calculator", "Ghana cybersecurity", "Africa tech reviews", "Ghana digital tools"]}
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
      {/* Hero Carousel Section (includes News Ticker) */}
      <HeroCarousel />

      {/* Ghana Identity Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-red-600 via-yellow-500 to-green-600 py-6 md:py-8">
        <div className="absolute inset-0 bg-black/10" />
        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl" aria-label="Ghana flag">🇬🇭</span>
              <div>
                <h2 className="text-xl md:text-2xl font-bold leading-tight">
                  Ghana's Home for Tech News, Tools & Insights
                </h2>
                <p className="text-sm md:text-base text-white/90 mt-0.5">
                  Built for Africa. Trusted by tech lovers across Ghana and beyond.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm">
              <Link to="/news?category=Africa Tech" className="px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full font-medium border border-white/20 transition-colors">
                Africa Tech News
              </Link>
              <Link to="/tools/momo-fee-calculator" className="px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full font-medium border border-white/20 transition-colors">
                MoMo Calculator
              </Link>
              <Link to="/tools/ghana-scam-checker" className="px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full font-medium border border-white/20 transition-colors">
                Scam Checker
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Tech News Section */}
      <section className="py-14 md:py-20 bg-gradient-to-b from-slate-50 to-white dark:from-background dark:to-background">
        <div className="container">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-sm font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400 mb-2 block">
                Africa Tech
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                African Tech News
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
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

      {/* International Tech News - Auto-scrolling row */}
      {internationalNews.length > 0 && <IntlNewsScroller news={internationalNews} formatTimeAgo={formatTimeAgo} />}

      {/* 1. Why Choose TechTrendi - Wave Feature Carousel */}
      <WaveFeatureCarousel />

      {/* 2. Latest Posts Section - 3D Card Carousel */}
      <section className="py-16 md:py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="container relative">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              Latest Posts
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Fresh From the Blog
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Our latest articles, guides, and insights — updated daily.
            </p>
          </div>

          <div className="mx-auto w-full max-w-5xl rounded-[24px] border border-border/50 p-2 shadow-sm md:rounded-t-[44px]">
            <div className="relative mx-auto flex w-full flex-col rounded-[24px] border border-border/30 bg-card/50 backdrop-blur-sm p-4 md:rounded-b-[20px] md:rounded-t-[40px]">
              {loadingLatest ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : latestArticles.length > 0 ? (
                <CardCarousel
                  items={latestArticles.map((article) => ({
                    src: article.cover_image || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=750&fit=crop",
                    alt: article.title,
                    label: article.title,
                    sublabel: `${categoryLabels[article.category] || article.category} · ${article.read_time_minutes || 5} min read`,
                    link: `/blog/${article.slug}`,
                  }))}
                  autoplayDelay={5000}
                  showPagination={true}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No articles yet. Check back soon!</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" asChild className="rounded-full px-8 hover:scale-105 transition-transform">
              <Link to="/blog" className="flex items-center gap-2">
                View All Articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Reviews - Horizontal Scroll */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold text-foreground">Featured Reviews</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex gap-1">
                <button
                  onClick={() => { const el = document.getElementById("reviews-scroll"); if (el) el.scrollBy({ left: -300, behavior: "smooth" }); }}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => { const el = document.getElementById("reviews-scroll"); if (el) el.scrollBy({ left: 300, behavior: "smooth" }); }}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                <Link to="/reviews" className="flex items-center gap-1">
                  View All Reviews
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {loadingReviews ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-shrink-0 w-64 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/5] bg-muted" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div id="reviews-scroll" className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {reviews.map((review) => (
                <Link
                  key={review.id}
                  to={`/reviews/${review.slug}`}
                  className="flex-shrink-0 w-64 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                    {review.image ? (
                      <img
                        src={review.image}
                        alt={review.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                    )}
                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="text-xs bg-blue-500 hover:bg-blue-500 text-white border-0 rounded-full px-3 py-1">
                        {review.category}
                      </Badge>
                    </div>
                    {/* Rating badge */}
                    {review.rating && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400 text-gray-900 text-xs font-semibold">
                        <Star className="w-3 h-3 fill-current" />
                        {review.rating}/10
                      </div>
                    )}
                    {/* Gradient overlay and title at bottom */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-4 px-4">
                      <h4 className="font-semibold text-white text-base line-clamp-2">
                        {review.title}
                      </h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No reviews yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. Creepy Tech & Cyber Awareness */}
      <CreepyTechHomeSection />

      {/* 6. Explore Tool Categories Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="container">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">Free Utilities</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Explore Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Tool Categories</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Free tools to boost productivity, advance your career, and have fun.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {toolCategories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <AnimatedCard key={cat.id} delay={index * 80} animation="fade-up">
                  <Link
                    to={`/tools/${cat.id}`}
                    className="group flex flex-col p-6 rounded-2xl bg-card border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform",
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
                </AnimatedCard>
              );
            })}
          </div>
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
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">Curated by Our Team</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Editor's <span className="text-primary">Picks</span>
              </h2>
              <p className="text-muted-foreground">Hand-picked articles our editors think you should not miss.</p>
            </div>
            <Button variant="outline" asChild className="hidden md:inline-flex rounded-xl">
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
          ) : (() => {
            // Deduplicate featured guides against articles already shown in Latest Articles section
            const latestIds = new Set(latestArticles.map(a => a.id));
            const uniqueFeatured = featuredGuides.filter(g => !latestIds.has(g.id));
            return uniqueFeatured.length > 0;
          })() ? (
            <div className="space-y-6">
              {/* Top Row: 2 Big Cards Side by Side */}
              <div className="grid md:grid-cols-2 gap-6">
                {featuredGuides
                  .filter(g => !new Set(latestArticles.map(a => a.id)).has(g.id))
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
                  .filter(g => !new Set(latestArticles.map(a => a.id)).has(g.id))
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
    </Layout>
  );
}
