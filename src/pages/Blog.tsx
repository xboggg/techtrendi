import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/layout/PageHero";
import { SEOHead } from "@/components/seo/SEOHead";
// No static JSON fallback — API-first with sessionStorage cache
import {
  Clock, Calendar, ArrowRight, Search, Crown, ChevronLeft, ChevronRight,
  LayoutGrid, Lightbulb, Shield, Briefcase, Smartphone, Watch, Brain,
  GraduationCap, DollarSign, HeartPulse, Wifi, Gamepad2, Leaf, Ghost
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ARTICLES_PER_PAGE = 9;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db2.techtrendi.com";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  created_at: string;
  is_premium: boolean;
  tags: string[] | null;
  author: string | null;
}

interface CategoryStyle {
  name: string;
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
  textColor: string;
  iconColor: string;
}

const categories: CategoryStyle[] = [
  { name: "All", icon: LayoutGrid, gradient: "from-blue-500 to-indigo-600", shadowColor: "shadow-blue-500/40", textColor: "text-blue-600 dark:text-blue-400", iconColor: "text-blue-500" },
  { name: "How-To", icon: Lightbulb, gradient: "from-amber-500 to-orange-600", shadowColor: "shadow-amber-500/40", textColor: "text-amber-600 dark:text-amber-400", iconColor: "text-amber-500" },
  { name: "Security", icon: Shield, gradient: "from-red-500 to-rose-600", shadowColor: "shadow-red-500/40", textColor: "text-red-600 dark:text-red-400", iconColor: "text-red-500" },
  { name: "Productivity", icon: Briefcase, gradient: "from-orange-500 to-amber-600", shadowColor: "shadow-orange-500/40", textColor: "text-orange-600 dark:text-orange-400", iconColor: "text-orange-500" },
  { name: "Phones", icon: Smartphone, gradient: "from-sky-500 to-blue-600", shadowColor: "shadow-sky-500/40", textColor: "text-sky-600 dark:text-sky-400", iconColor: "text-sky-500" },
  { name: "Accessories", icon: Watch, gradient: "from-cyan-500 to-teal-600", shadowColor: "shadow-cyan-500/40", textColor: "text-cyan-600 dark:text-cyan-400", iconColor: "text-cyan-500" },
  { name: "AI Tech", icon: Brain, gradient: "from-violet-500 to-purple-600", shadowColor: "shadow-violet-500/40", textColor: "text-violet-600 dark:text-violet-400", iconColor: "text-violet-500" },
  { name: "Career in Tech", icon: GraduationCap, gradient: "from-emerald-500 to-green-600", shadowColor: "shadow-emerald-500/40", textColor: "text-emerald-600 dark:text-emerald-400", iconColor: "text-emerald-500" },
  { name: "Smart Income", icon: DollarSign, gradient: "from-green-500 to-emerald-600", shadowColor: "shadow-green-500/40", textColor: "text-green-600 dark:text-green-400", iconColor: "text-green-500" },
  { name: "Health Tech", icon: HeartPulse, gradient: "from-rose-500 to-pink-600", shadowColor: "shadow-rose-500/40", textColor: "text-rose-600 dark:text-rose-400", iconColor: "text-rose-500" },
  { name: "Remote Work", icon: Wifi, gradient: "from-indigo-500 to-blue-600", shadowColor: "shadow-indigo-500/40", textColor: "text-indigo-600 dark:text-indigo-400", iconColor: "text-indigo-500" },
  { name: "Gaming", icon: Gamepad2, gradient: "from-pink-500 to-fuchsia-600", shadowColor: "shadow-pink-500/40", textColor: "text-pink-600 dark:text-pink-400", iconColor: "text-pink-500" },
  { name: "Green Tech", icon: Leaf, gradient: "from-lime-500 to-green-600", shadowColor: "shadow-lime-500/40", textColor: "text-lime-600 dark:text-lime-400", iconColor: "text-lime-500" },
];

// Fallback images by category when article images don't exist
const categoryImages: Record<string, string> = {
  "How-To": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
  "Security": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
  "Productivity": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop",
  "Phones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop",
  "Accessories": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=400&fit=crop",
  "AI Tech": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
  "Career in Tech": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=400&fit=crop",
  "Smart Income": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
  "Health Tech": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop",
  "Remote Work": "https://images.unsplash.com/photo-1587825140708-dfaf18c4c5ad?w=800&h=400&fit=crop",
  "Gaming": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=400&fit=crop",
  "Green Tech": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=400&fit=crop",
  "Creepy Tech": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop",
  "default": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop",
};

// Get image URL with fallback
function getArticleImage(article: Article): string {
  if (article.cover_image?.startsWith("http") || article.cover_image?.startsWith("/images/")) {
    return article.cover_image;
  }
  return categoryImages[article.category] || categoryImages["default"];
}

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "longest">("latest");

  // SessionStorage cache for instant repeat visits, API fetch for fresh data
  const [articles, setArticles] = useState<Article[]>(() => {
    try {
      const cached = sessionStorage.getItem("blog:articles");
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(articles.length === 0);

  // Fetch articles: try API first, fall back to static JSON on cPanel
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(`${SUPABASE_URL}/rest/v1/articles?select=id,title,slug,excerpt,category,cover_image,read_time_minutes,created_at,author,tags,views,is_premium&is_published=eq.true&order=created_at.desc`, {
      headers: { "apikey": SUPABASE_KEY },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        clearTimeout(timeoutId);
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
          try { sessionStorage.setItem("blog:articles", JSON.stringify(data)); } catch {}
          setLoading(false);
        } else {
          throw new Error("Empty response");
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        // Fallback: fetch static JSON from cPanel (always available, updated daily by cron)
        if (articles.length === 0) {
          fetch("/articles-fallback.json")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (Array.isArray(data) && data.length > 0) {
                setArticles(data);
                try { sessionStorage.setItem("blog:articles", JSON.stringify(data)); } catch {}
              }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
    return () => { clearTimeout(timeoutId); controller.abort(); };
  }, []);

  const filteredArticles = articles
    .filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      const selectedCat = categories.find(c => c.name === selectedCategory);
      const matchesCategory = selectedCat?.name === "All" || article.category === selectedCat?.name;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "longest") return (b.read_time_minutes || 0) - (a.read_time_minutes || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // latest
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Layout>
      <SEOHead
        title="Tech Blog & Insights"
        description="Stay updated with the latest tech trends, in-depth guides, and expert reviews. Expert technology articles covering phones, security, AI, and productivity."
        canonical="/blog"
        keywords={["tech blog", "technology articles", "tech guides", "smartphone reviews", "AI articles", "cybersecurity tips"]}
      />
      <PageHero
        variant="light"
        accent="purple"
        eyebrow="Guides & insights"
        title="The"
        accentText="TechTrendi Blog"
        subtitle="In-depth guides, online-safety know-how, and honest takes — written plainly, for how we actually use tech."
      />
      <div className="container py-12 md:py-20">
        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Pills - Animated with unique colors and icons */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.name;
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`
                    group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold
                    transition-all duration-300 ease-out
                    transform hover:scale-105 hover:-translate-y-1
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
                    ${isSelected
                      ? `bg-gradient-to-r ${category.gradient} text-white shadow-xl ${category.shadowColor}`
                      : `bg-card border-2 border-border/50 ${category.textColor} hover:border-transparent hover:shadow-xl`
                    }
                  `}
                  style={{
                    boxShadow: isSelected ? `0 10px 30px -5px var(--tw-shadow-color), 0 4px 6px -2px rgba(0,0,0,0.1)` : undefined,
                  }}
                >
                  {/* Animated gradient background on hover (for non-selected) */}
                  <span
                    className={`
                      absolute inset-0 rounded-full transition-all duration-300 ease-out
                      bg-gradient-to-r ${category.gradient}
                      ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    `}
                  />
                  {/* Icon */}
                  <Icon className={`
                    relative z-10 w-4 h-4 transition-all duration-300
                    ${isSelected ? 'text-white' : `${category.iconColor} group-hover:text-white`}
                  `} />
                  {/* Text */}
                  <span className={`
                    relative z-10 transition-colors duration-300
                    ${isSelected ? 'text-white' : 'group-hover:text-white'}
                  `}>
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort controls */}
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-sm text-muted-foreground mr-1">Sort:</span>
            {(["latest", "oldest", "longest"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  sortBy === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {s === "latest" ? "Latest" : s === "oldest" ? "Oldest" : "Longest Read"}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              {articles.length === 0 ? "Unable to load articles. Please try again." : "No articles match your search."}
            </p>
            {articles.length === 0 ? (
              <button onClick={() => window.location.reload()} className="text-primary hover:underline">
                Refresh page
              </button>
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="text-primary hover:underline"
              >
                Clear search
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedArticles.map((article) => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
                state={{ article }}
                className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  <img
                    src={getArticleImage(article)}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = categoryImages[article.category] || categoryImages["default"];
                    }}
                  />
                  {article.is_premium && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-accent text-accent-foreground">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>

                  {article.excerpt && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.read_time_minutes || 5} min read
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground sm:hidden">
              {currentPage} / {totalPages}
            </span>
            <div className="hidden sm:flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <span key={page} className="flex items-center gap-2">
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-muted-foreground">...</span>}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10 h-10 rounded-full"
                    >
                      {page}
                    </Button>
                  </span>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-full"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Results Info */}
        {filteredArticles.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Showing {startIndex + 1}-{Math.min(startIndex + ARTICLES_PER_PAGE, filteredArticles.length)} of {filteredArticles.length} articles
          </p>
        )}
      </div>
    </Layout>
  );
}
