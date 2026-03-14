import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Shield, Zap, BookOpen, Star, TrendingUp, Clock, Eye, FileText,
  Briefcase, GraduationCap, Megaphone, Braces, PenTool, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { WaveFeatureCarousel } from "@/components/ui/wave-feature-carousel";
import { CreepyTechHomeSection } from "@/components/home/CreepyTechCarousel";
import { FeaturedSection } from "@/components/content/EditorsPicks";
import { NewsTicker } from "@/components/home/NewsTicker";
import { cn } from "@/lib/utils";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";

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

const categoryLabels: Record<string, string> = {
  phones: "Phone Guides",
  productivity: "Productivity",
  security: "Security",
  "how-to": "How-To",
  "ai-tech": "AI Tech",
  "make-money": "Side Hustles",
};

const toolCategories = [
  { id: "business", title: "Business & Freelancer", icon: Briefcase, gradient: "from-blue-500 via-blue-600 to-indigo-600", count: 14 },
  { id: "productivity", title: "Productivity", icon: Zap, gradient: "from-orange-500 via-amber-500 to-yellow-500", count: 7 },
  { id: "career", title: "Career", icon: GraduationCap, gradient: "from-emerald-500 via-green-500 to-teal-500", count: 6 },
  { id: "creator", title: "Creator & Marketing", icon: Megaphone, gradient: "from-purple-500 via-violet-500 to-fuchsia-500", count: 14 },
  { id: "developer", title: "Developer Tools", icon: Braces, gradient: "from-slate-600 via-gray-600 to-zinc-700", count: 10 },
  { id: "security", title: "Security & Privacy", icon: Shield, gradient: "from-red-500 via-rose-500 to-pink-500", count: 5 },
  { id: "design", title: "Design & Writing", icon: PenTool, gradient: "from-pink-500 via-rose-400 to-fuchsia-500", count: 10 },
  { id: "other", title: "Lifestyle & Fun", icon: Smartphone, gradient: "from-teal-500 via-cyan-500 to-sky-500", count: 9 },
];

export default function Index() {
  const { subscription } = useAuth();
  const [trendingArticles, setTrendingArticles] = useState<TrendingArticle[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [featuredGuides, setFeaturedGuides] = useState<FeaturedGuide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [latestArticles, setLatestArticles] = useState<LatestArticle[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(true);

  useEffect(() => {
    fetchTrendingArticles();
    fetchFeaturedGuides();
    fetchLatestArticles();
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
        .limit(3);

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
        .limit(4);

      if (error) throw error;
      setLatestArticles(data || []);
    } catch (error) {
      console.error("Error fetching latest articles:", error);
    } finally {
      setLoadingLatest(false);
    }
  };

  return (
    <Layout>
      {/* Hero Carousel Section (includes News Ticker) */}
      <HeroCarousel />

      {/* 1. Latest Posts Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                  <div className="h-32 bg-muted rounded-lg mb-3" />
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-5 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : latestArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestArticles.map((article, index) => (
                <AnimatedCard key={article.id} delay={index * 100} animation="fade-up">
                  <Link
                    to={`/blog/${article.slug}`}
                    className="block group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="relative h-32 bg-muted overflow-hidden">
                      {article.cover_image ? (
                        <img
                          src={article.cover_image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <Badge variant="secondary" className="text-xs mb-2">
                        {categoryLabels[article.category] || article.category}
                      </Badge>
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.read_time_minutes || 5} min
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No articles yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. Why Choose TechTrendi - Wave Feature Carousel */}
      <WaveFeatureCarousel />

      {/* 3. Creepy Tech & Cyber Awareness */}
      <CreepyTechHomeSection />

      {/* 4. Trending Now Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-foreground">Trending Now</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>Most viewed this week</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link to="/blog" className="flex items-center gap-1">
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {loadingTrending ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                  <div className="h-32 bg-muted rounded-lg mb-3" />
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-5 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : trendingArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingArticles.map((article, index) => (
                <AnimatedCard key={article.id} delay={index * 100} animation="fade-up">
                  <Link
                    to={`/blog/${article.slug}`}
                    className="block group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    <div className="relative h-32 bg-muted overflow-hidden">
                      {article.cover_image ? (
                        <img
                          src={article.cover_image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                      )}
                    </div>
                    <div className="p-4">
                      <Badge variant="secondary" className="text-xs mb-2">
                        {article.category}
                      </Badge>
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.read_time_minutes || 5} min
                        </span>
                        {article.views && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <AnimatedCounter end={article.views} duration={2} />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </AnimatedCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No trending articles yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. Explore Tool Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">90+ Free Tools</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Explore Our <span className="text-primary">Tool Categories</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From business essentials to developer utilities, find the perfect tool for any task.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {toolCategories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <AnimatedCard key={cat.id} delay={index * 80} animation="fade-up">
                  <Link
                    to={`/tools/${cat.id}`}
                    className="group flex flex-col items-center p-5 rounded-2xl bg-card border border-border hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform",
                      cat.gradient
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground text-center group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    <span className="text-xs text-muted-foreground mt-1">{cat.count} tools</span>
                  </Link>
                </AnimatedCard>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8" asChild>
              <Link to="/tools" className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Explore All Tools
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 6. Featured Guides Section */}
      <section className="py-16 bg-background">
        <div className="container">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-5">
                    <div className="h-5 bg-muted rounded w-1/4 mb-3" />
                    <div className="h-6 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredGuides.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGuides.map((guide, index) => (
                <AnimatedCard key={guide.id} delay={index * 150} animation="fade-up">
                  <Link
                    to={`/blog/${guide.slug}`}
                    className="block group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full"
                  >
                    <div className="aspect-video overflow-hidden">
                      {guide.cover_image ? (
                        <img
                          src={guide.cover_image}
                          alt={guide.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                        {categoryLabels[guide.category] || guide.category}
                      </span>
                      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {guide.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{guide.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {guide.read_time_minutes || 5} min read
                      </div>
                    </div>
                  </Link>
                </AnimatedCard>
              ))}
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
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild className="rounded-xl">
              <Link to="/guides" className="flex items-center gap-2">
                View All Guides
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 7. Featured Reviews */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <FeaturedSection />
        </div>
      </section>

      {/* CTA Section - Premium Glass Panel with Living Background */}
      <section className="py-24 relative overflow-hidden">
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
