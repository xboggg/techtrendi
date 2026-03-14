import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import {
  Smartphone,
  Shield,
  Brain,
  Zap,
  DollarSign,
  Wrench,
  ArrowRight,
  Star,
  Clock,
  Eye,
  BookOpen,
  Flame,
  Users,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

interface PopularItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  excerpt: string | null;
}

const pathways = [
  {
    icon: Smartphone,
    title: "Buy a Phone",
    description: "Reviews, comparisons, and buying guides for the latest smartphones",
    link: "/reviews",
    gradient: "from-blue-500 to-cyan-400",
    bgGlow: "bg-blue-500/10",
    borderGlow: "border-blue-500/20 hover:border-blue-400/40",
  },
  {
    icon: Brain,
    title: "Learn AI",
    description: "Understand how AI tools work and use them to boost your work and life",
    link: "/ai-tech",
    gradient: "from-violet-500 to-purple-400",
    bgGlow: "bg-violet-500/10",
    borderGlow: "border-violet-500/20 hover:border-violet-400/40",
  },
  {
    icon: Shield,
    title: "Stay Secure",
    description: "Protect your passwords, devices, and personal data with expert guides",
    link: "/security",
    gradient: "from-emerald-500 to-green-400",
    bgGlow: "bg-emerald-500/10",
    borderGlow: "border-emerald-500/20 hover:border-emerald-400/40",
  },
  {
    icon: Zap,
    title: "Be More Productive",
    description: "Apps, workflows, and systems to get more done in less time",
    link: "/productivity",
    gradient: "from-amber-500 to-orange-400",
    bgGlow: "bg-amber-500/10",
    borderGlow: "border-amber-500/20 hover:border-amber-400/40",
  },
  {
    icon: DollarSign,
    title: "Make Money Online",
    description: "Side hustles, freelancing tips, and passive income strategies that work",
    link: "/make-money",
    gradient: "from-rose-500 to-pink-400",
    bgGlow: "bg-rose-500/10",
    borderGlow: "border-rose-500/20 hover:border-rose-400/40",
  },
  {
    icon: Wrench,
    title: "Use Free Tools",
    description: "Free utilities — password generators, resume builders, timers & more",
    link: "/tools",
    gradient: "from-indigo-500 to-blue-400",
    bgGlow: "bg-indigo-500/10",
    borderGlow: "border-indigo-500/20 hover:border-indigo-400/40",
  },
];

const TOOL_COUNT = 90;

export default function StartHere() {
  const [popularArticles, setPopularArticles] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteCounts, setSiteCounts] = useState({ articles: 170, reviews: 59 });

  useEffect(() => {
    fetchPopular();
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [articles, reviews] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact" }).eq("is_published", true),
        supabase.from("reviews").select("id", { count: "exact" }),
      ]);
      setSiteCounts({ articles: articles.count || 170, reviews: reviews.count || 59 });
    } catch {}
  };

  const fetchPopular = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, category, cover_image, read_time_minutes, excerpt")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setPopularArticles(data || []);
    } catch (error) {
      console.error("Error fetching popular articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Articles & Guides", value: `${siteCounts.articles}+`, icon: FileText },
    { label: "Free Tools", value: `${TOOL_COUNT}+`, icon: Wrench },
    { label: "Product Reviews", value: `${siteCounts.reviews}+`, icon: Star },
    { label: "Categories", value: "12", icon: BookOpen },
  ];

  return (
    <Layout>
      <Helmet>
        <title>Start Here | TechTrendi</title>
        <meta name="description" content="New to TechTrendi? Start here. Find the best tech guides, reviews, free tools, and expert advice — organized by what you need." />
      </Helmet>

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 animated-gradient-bg opacity-90" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-20" />
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-6">
            <Flame className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-medium text-white/90">Welcome to TechTrendi</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
            Your Tech Journey{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              Starts Here
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            Whether you're buying your next phone, learning AI, or looking for free tools —
            we've got you covered. Pick your path below.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                <stat.icon className="w-5 h-5 text-white/70" />
                <div className="text-left">
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pathways - "What are you looking for?" */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">
              Choose Your Path
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              What are you looking for?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Click the topic that interests you most. We'll take you to the best starting point.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pathways.map((path, index) => (
              <Link
                key={path.title}
                to={path.link}
                className={cn(
                  "group relative p-6 rounded-2xl border bg-card transition-all duration-300",
                  "hover:shadow-xl hover:-translate-y-1",
                  path.borderGlow
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                  "bg-gradient-to-br shadow-lg",
                  "group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300",
                  path.gradient
                )}>
                  <path.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {path.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {path.description}
                </p>
                <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                  Get Started <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-sm font-medium text-amber-600 dark:text-amber-400 mb-4">
              Most Popular
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Reader Favorites
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              The articles our readers come back to again and again.
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                  <div className="h-40 bg-muted rounded-lg mb-3" />
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-5 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : popularArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {popularArticles.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/blog/${article.slug}`}
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
                >
                  <div className="relative h-40 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                    <OptimizedImage
                      src={article.cover_image}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      fallbackIcon={
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      }
                    />
                    {index < 3 && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">
                        <TrendingUp className="w-3 h-3" />
                        #{index + 1}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <Badge variant="secondary" className="text-xs mb-2">{article.category}</Badge>
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{article.read_time_minutes || 5} min read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Articles coming soon!</p>
            </div>
          )}

          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" asChild className="rounded-full px-8">
              <Link to="/blog" className="flex items-center gap-2">
                Browse All Articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About TechTrendi - brief credibility blurb */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-6">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              About TechTrendi
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              TechTrendi is a modern tech publication built for people who want clear, honest, and actionable tech advice.
              We cover smartphones, AI, cybersecurity, productivity, and online income — with in-depth reviews,
              expert guides, and {TOOL_COUNT}+ free tools you can use right now.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              No clickbait. No filler. Just content that helps you make better decisions about the technology in your life.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="hero" size="lg" className="rounded-full px-8">
                <Link to="/about" className="flex items-center gap-2">
                  Learn More About Us
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link to="/tools" className="flex items-center gap-2">
                  Explore Free Tools
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient-bg" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="container relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Stay in the loop
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Get the latest reviews, guides, and tool updates delivered to your inbox. No spam, ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-white/90 rounded-full px-8 font-semibold">
                <Link to="/premium">
                  Get Premium Access
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 border-white/20 text-white hover:bg-white/10">
                <Link to="/blog">
                  Read the Blog
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
