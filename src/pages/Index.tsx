import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Shield, Zap, BookOpen, Star, TrendingUp, Clock, Eye, FileText,
  ChevronLeft, ChevronRight, Gamepad2, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { WaveFeatureCarousel } from "@/components/ui/wave-feature-carousel";
import { CreepyTechHomeSection } from "@/components/home/CreepyTechCarousel";
import { cn } from "@/lib/utils";
import { AnimatedCard } from "@/components/ui/animated-card";
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
  "make-money": "Side Hustles",
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

export default function Index() {
  const { subscription } = useAuth();
  const [trendingArticles, setTrendingArticles] = useState<TrendingArticle[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [featuredGuides, setFeaturedGuides] = useState<FeaturedGuide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [latestArticles, setLatestArticles] = useState<LatestArticle[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    fetchTrendingArticles();
    fetchFeaturedGuides();
    fetchLatestArticles();
    fetchReviews();
    fetchLatestNews();
  }, []);

  const fetchTrendingArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes, views")
        .eq("is_published", true)
        .order("views", { ascending: false, nullsFirst: false })
        .limit(4);

      if (error) throw error;
      setTrendingArticles(data || []);
    } catch (error) {
      console.error("Error fetching trending articles:", error);
    } finally {
      setLoadingTrending(false);
    }
  };

  const fetchFeaturedGuides = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes")
        .match({ is_published: true, content_type: "guide", is_featured: true })
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setFeaturedGuides(data || []);
    } catch (error) {
      console.error("Error fetching featured guides:", error);
    } finally {
      setLoadingGuides(false);
    }
  };

  const fetchLatestArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes, created_at")
        .match({ is_published: true, content_type: "article" })
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setLatestArticles(data || []);
    } catch (error) {
      console.error("Error fetching latest articles:", error);
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

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
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
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setLatestNews(data || []);
    } catch (error) {
      console.error("Error fetching latest news:", error);
    } finally {
      setLoadingNews(false);
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
      {/* Hero Carousel Section (includes News Ticker) */}
      <HeroCarousel />

      {/* Latest Tech News Section */}
      <section className="py-14 md:py-20 bg-gradient-to-b from-slate-50 to-white dark:from-background dark:to-background">
        <div className="container">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-sm font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400 mb-2 block">
                Stay Informed
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Latest Tech News
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              <Link to="/news" className="flex items-center gap-1 font-medium">
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
              {latestNews.map((news, index) => {
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

      {/* 1. Why Choose TechTrendi - Wave Feature Carousel */}
      <WaveFeatureCarousel />

      {/* 2. Latest Posts Section - Animated Testimonials Style */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-foreground">Latest Posts</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Fresh from the blog</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link to="/blog" className="flex items-center gap-1">
                View All Articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {loadingLatest ? (
            <div className="grid md:grid-cols-2 gap-12 items-center py-20">
              <div className="h-80 bg-muted rounded-3xl animate-pulse" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
          ) : latestArticles.length > 0 ? (
            <AnimatedTestimonials
              testimonials={latestArticles.map((article) => ({
                quote: article.excerpt || "Read this amazing article on TechTrendi.",
                name: article.title,
                designation: `${categoryLabels[article.category] || article.category} · ${article.read_time_minutes || 5} min read`,
                src: article.cover_image || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&h=500&fit=crop",
                href: `/blog/${article.slug}`,
              }))}
              autoplay={true}
              className="py-8"
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No articles yet. Check back soon!</p>
            </div>
          )}
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
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                <Link to="/reviews" className="flex items-center gap-1">
                  View All Reviews
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <div className="flex gap-1">
                <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
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
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
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

      {/* 7. Featured Guides Section - Magazine Layout */}
      <section className="py-16 bg-background">
        <div className="container">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">Expert Content</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured <span className="text-primary">Guides</span>
              </h2>
              <p className="text-muted-foreground">Expert-written guides to help you navigate technology.</p>
            </div>
            <Button variant="outline" asChild className="hidden md:inline-flex rounded-xl">
              <Link to="/guides" className="flex items-center gap-2">
                View All Guides
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
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Main Featured Guide - Large Card */}
              <Link
                to={`/blog/${featuredGuides[0].slug}`}
                className="group relative rounded-2xl overflow-hidden bg-muted"
              >
                <div className="aspect-[4/5] lg:aspect-auto lg:h-full">
                  {featuredGuides[0].cover_image ? (
                    <img
                      src={featuredGuides[0].cover_image}
                      alt={featuredGuides[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                {/* Overlay with content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-primary hover:bg-primary text-primary-foreground border-0 rounded-full px-3 py-1 text-xs">
                      {categoryLabels[featuredGuides[0].category] || featuredGuides[0].category}
                    </Badge>
                    <span className="flex items-center gap-1 text-white/70 text-xs">
                      <Clock className="w-3 h-3" />
                      {featuredGuides[0].read_time_minutes || 5} Minutes
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-primary/90 transition-colors line-clamp-3">
                    {featuredGuides[0].title}
                  </h2>
                </div>
              </Link>

              {/* Side Cards - Stacked */}
              <div className="flex flex-col gap-4">
                {featuredGuides.slice(1, 4).map((guide) => (
                  <Link
                    key={guide.id}
                    to={`/blog/${guide.slug}`}
                    className="group flex gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-md transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="w-28 h-20 md:w-32 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      {guide.cover_image ? (
                        <img
                          src={guide.cover_image}
                          alt={guide.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm md:text-base group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {guide.title}
                      </h3>
                      <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-2">
                        {guide.excerpt}
                      </p>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {categoryLabels[guide.category] || guide.category}
                        </Badge>
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock className="w-3 h-3" />
                          {guide.read_time_minutes || 5} Minutes
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
              <h3 className="text-lg font-semibold text-foreground mb-2">No featured guides yet</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Featured guides will appear here once you mark them as featured in the admin panel.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/guides">Browse All Guides</Link>
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
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex p-4 rounded-3xl bg-white/10 backdrop-blur-sm mb-8 animate-float">
              <Star className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Get <span className="text-gradient-accent">Premium</span> Access
            </h2>
            <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Unlock ad-free browsing, premium tools, downloadable guides, and early access to new content.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {["Ad-Free Experience", "Premium Tools", "Downloadable Guides", "Early Access"].map((feature) => (
                <span key={feature} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  {feature}
                </span>
              ))}
            </div>
            <Button
              size="xl"
              className="bg-white text-foreground hover:bg-white/90 shadow-elevated rounded-2xl px-10 font-semibold"
              asChild
            >
              <Link to="/premium" className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {subscription.subscribed ? "Manage Subscription" : "Get Premium Access"}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            {!subscription.subscribed && (
              <p className="text-white/60 text-sm mt-6">
                Just $4.99/month - Cancel anytime
              </p>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
