import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
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
  BookOpen,
  Flame,
  Users,
  FileText,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardCarousel } from "@/components/ui/card-carousel";
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
    title: "Smart Income",
    description: "Freelancing tips, digital skills, and entrepreneurship strategies that work",
    link: "/smart-income",
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

// Animated counter hook
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);
  const lastTarget = useRef(0);

  useEffect(() => {
    // Don't animate until we have a real target
    if (target <= 0) return;
    // Re-animate if target changed (e.g. data loaded)
    if (target !== lastTarget.current) {
      animated.current = false;
      lastTarget.current = target;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// Fade-in on scroll component
function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function StartHere() {
  const navigate = useNavigate();
  const [popularArticles, setPopularArticles] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteCounts, setSiteCounts] = useState({ articles: 0, reviews: 0 });

  const articleCounter = useCounter(siteCounts.articles, 2500);
  const toolCounter = useCounter(125, 2000);
  const reviewCounter = useCounter(siteCounts.reviews, 2000);

  useEffect(() => {
    fetchPopular();
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [articlesRes, reviewsRes] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact" }).eq("is_published", true),
        supabase.from("reviews").select("id", { count: "exact" }),
      ]);
      setSiteCounts({
        articles: articlesRes.count || 180,
        reviews: reviewsRes.count || 60,
      });
    } catch {}
  };

  const fetchPopular = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, category, cover_image, read_time_minutes, excerpt")
        .eq("is_published", true)
        .order("views", { ascending: false })
        .limit(6);

      if (error) throw error;
      setPopularArticles(data || []);
    } catch (error) {
      console.error("Error fetching popular articles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Start Here - New to TechTrendi?"
        description="Not sure where to begin? Start here for the best of TechTrendi — top articles, essential tools, and recommended reading."
        canonical="/start-here"
      />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 animated-gradient-bg opacity-90" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-20" />

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-[10%] w-20 h-20 rounded-full bg-white/5 blur-xl animate-float" />
        <div className="absolute top-40 right-[15%] w-32 h-32 rounded-full bg-white/5 blur-2xl animate-float-delayed" />
        <div className="absolute bottom-20 left-[20%] w-16 h-16 rounded-full bg-white/8 blur-lg animate-float-slow" />

        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-6 animate-fade-in-down">
            <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-sm font-medium text-white/90">Welcome to TechTrendi</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight animate-fade-in-up">
            Your Tech Journey{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              Starts Here
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            Whether you are buying your next phone, learning AI, or looking for free tools —
            we have got you covered. Pick your path below.
          </p>

          {/* Animated Stats */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {[
              { ref: articleCounter.ref, value: articleCounter.count, suffix: "+", label: "Articles", icon: FileText, gradient: "from-blue-400 to-cyan-300" },
              { ref: toolCounter.ref, value: toolCounter.count, suffix: "+", label: "Free Tools", icon: Wrench, gradient: "from-purple-400 to-pink-300" },
              { ref: reviewCounter.ref, value: reviewCounter.count, suffix: "+", label: "Product Reviews", icon: Star, gradient: "from-amber-400 to-orange-300" },
              { ref: null, value: 12, suffix: "", label: "Categories", icon: BookOpen, gradient: "from-emerald-400 to-green-300" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                ref={stat.ref}
                className="group relative px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/15 transition-all duration-300 hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white tabular-nums">
                      {stat.value}{stat.suffix}
                    </div>
                    <div className="text-xs text-white/60">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pathways — Bento Grid */}
      <section className="py-16 md:py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23888' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="container relative">
          <FadeIn className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Choose Your Path
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              What are you looking for?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Click the topic that interests you most. We'll take you to the best starting point.
            </p>
          </FadeIn>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {/* Row 1: Two large feature cards */}
            {pathways.slice(0, 2).map((path, index) => (
              <FadeIn key={path.title} delay={index * 150} className="md:col-span-2">
                <Link
                  to={path.link}
                  className="group relative block h-full min-h-[220px] rounded-3xl overflow-hidden"
                >
                  {/* Animated gradient background */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-90 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105",
                    path.gradient
                  )} />
                  {/* Decorative shapes */}
                  <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:w-48 group-hover:h-48 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 blur-xl" />

                  <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ring-1 ring-white/20">
                        <path.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{path.title}</h3>
                      <p className="text-white/75 text-sm leading-relaxed max-w-[280px]">{path.description}</p>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-2 text-white/90 text-sm font-semibold group-hover:gap-4 transition-all duration-300">
                      Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}

            {/* Row 2: Four compact cards */}
            {pathways.slice(2).map((path, index) => (
              <FadeIn key={path.title} delay={300 + index * 100} className="md:col-span-1">
                <Link
                  to={path.link}
                  className="group relative block h-full min-h-[200px] rounded-3xl overflow-hidden border border-border/50 bg-card hover:border-transparent transition-all duration-500"
                >
                  {/* Hover gradient reveal */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    path.gradient
                  )} />

                  <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-md",
                        "group-hover:bg-white/20 group-hover:shadow-none group-hover:ring-1 group-hover:ring-white/20 group-hover:backdrop-blur-sm",
                        "transition-all duration-500 group-hover:scale-110",
                        path.gradient
                      )}>
                        <path.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-white transition-colors duration-500 mb-1.5">
                        {path.title}
                      </h3>
                      <p className="text-muted-foreground group-hover:text-white/70 text-sm leading-relaxed transition-colors duration-500">
                        {path.description}
                      </p>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-primary group-hover:text-white/90 text-sm font-semibold group-hover:gap-3 transition-all duration-300">
                      Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles - 3D Card Carousel */}
      <section className="py-16 md:py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="container relative">
          <FadeIn className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-sm font-medium text-amber-600 dark:text-amber-400 mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              Most Popular
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Reader Favorites
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              The articles our readers come back to again and again.
            </p>
          </FadeIn>

          <FadeIn>
            <div className="mx-auto w-full max-w-5xl rounded-[24px] border border-border/50 p-2 shadow-sm md:rounded-t-[44px]">
              <div className="relative mx-auto flex w-full flex-col rounded-[24px] border border-border/30 bg-card/50 backdrop-blur-sm p-4 md:rounded-b-[20px] md:rounded-t-[40px]">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : popularArticles.length > 0 ? (
                  <CardCarousel
                    items={popularArticles.map((article) => ({
                      src: article.cover_image || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=750&fit=crop",
                      alt: article.title,
                      label: article.title,
                      sublabel: `${article.category} · ${article.read_time_minutes || 5} min read`,
                      link: `/blog/${article.slug}`,
                    }))}
                    autoplayDelay={2500}
                    showPagination={true}
                    onSlideClick={(item) => {
                      if (item.link) navigate(item.link);
                    }}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Articles coming soon!</p>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>

          <FadeIn className="mt-10 text-center" delay={400}>
            <Button variant="outline" size="lg" asChild className="rounded-full px-8 hover:scale-105 transition-transform">
              <Link to="/blog" className="flex items-center gap-2">
                Browse All Articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Why TechTrendi - with animated checklist */}
      <section className="py-16 md:py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="container relative">
          <div className="max-w-4xl mx-auto">
            <FadeIn className="text-center mb-14">
              <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why TechTrendi?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                A modern tech publication built for people who want clear, honest, and actionable tech advice.
              </p>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-5 mb-12">
              {[
                { text: `${siteCounts.articles}+ expert articles across 12 categories`, delay: 0 },
                { text: "130+ free tools — no signup required", delay: 100 },
                { text: `${siteCounts.reviews}+ honest product reviews with real ratings`, delay: 200 },
                { text: "New content published daily, Mon-Fri", delay: 300 },
                { text: "Written for a global audience, beginner-friendly", delay: 400 },
                { text: "No clickbait. No filler. Just useful content.", delay: 500 },
              ].map((item, i) => (
                <FadeIn key={i} delay={item.delay}>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-300 group">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-foreground text-sm leading-relaxed">{item.text}</span>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn className="flex flex-wrap justify-center gap-3" delay={600}>
              <Button asChild variant="hero" size="lg" className="rounded-full px-8 hover:scale-105 transition-transform">
                <Link to="/about" className="flex items-center gap-2">
                  Learn More About Us
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 hover:scale-105 transition-transform">
                <Link to="/tools" className="flex items-center gap-2">
                  Explore Free Tools
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />

        {/* Animated orbs */}
        <div className="absolute top-10 left-[5%] w-40 h-40 rounded-full bg-white/5 blur-2xl animate-float" />
        <div className="absolute bottom-10 right-[10%] w-32 h-32 rounded-full bg-white/8 blur-2xl animate-float-delayed" />

        <div className="container relative z-10">
          <FadeIn className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Stay in the loop
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Get the latest reviews, guides, and tool updates delivered to your inbox. No spam, ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-white/90 rounded-full px-8 font-semibold hover:scale-105 transition-transform shadow-xl">
                <Link to="/blog">
                  Read the Blog
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-full px-8 bg-white/15 text-white border-2 border-white/30 hover:bg-white/25 hover:border-white/50 font-semibold hover:scale-105 transition-all shadow-xl backdrop-blur-sm">
                <Link to="/about">
                  Join Our Community
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Animation styles */}
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.08); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out both;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out both;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
}
