import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/layout/PageHero";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Clock, Calendar, ArrowRight, Search, ChevronLeft, ChevronRight, Zap,
  LayoutGrid, Brain, Building2, Shield, Cpu, Smartphone, Briefcase,
  Gamepad2, DollarSign, Wifi, Leaf, Globe, Bitcoin, Rocket, Heart, Lightbulb
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import staticNews from "@/data/news.json";

const NEWS_PER_PAGE = 12;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db2.techtrendi.com";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  created_at: string;
  content: string | null;
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

const newsCategories: CategoryStyle[] = [
  { name: "All", icon: LayoutGrid, gradient: "from-blue-500 to-indigo-600", shadowColor: "shadow-blue-500/40", textColor: "text-blue-600 dark:text-blue-400", iconColor: "text-blue-500" },
  { name: "AI Tech", icon: Brain, gradient: "from-violet-500 to-purple-600", shadowColor: "shadow-violet-500/40", textColor: "text-violet-600 dark:text-violet-400", iconColor: "text-violet-500" },
  { name: "Big Tech", icon: Building2, gradient: "from-slate-500 to-zinc-700", shadowColor: "shadow-slate-500/40", textColor: "text-slate-600 dark:text-slate-400", iconColor: "text-slate-500" },
  { name: "Cybersecurity", icon: Shield, gradient: "from-red-500 to-rose-600", shadowColor: "shadow-red-500/40", textColor: "text-red-600 dark:text-red-400", iconColor: "text-red-500" },
  { name: "Gadgets", icon: Cpu, gradient: "from-cyan-500 to-teal-600", shadowColor: "shadow-cyan-500/40", textColor: "text-cyan-600 dark:text-cyan-400", iconColor: "text-cyan-500" },
  { name: "Phones", icon: Smartphone, gradient: "from-sky-500 to-blue-600", shadowColor: "shadow-sky-500/40", textColor: "text-sky-600 dark:text-sky-400", iconColor: "text-sky-500" },
  { name: "Productivity", icon: Briefcase, gradient: "from-orange-500 to-amber-600", shadowColor: "shadow-orange-500/40", textColor: "text-orange-600 dark:text-orange-400", iconColor: "text-orange-500" },
  { name: "Security", icon: Shield, gradient: "from-amber-500 to-orange-600", shadowColor: "shadow-amber-500/40", textColor: "text-amber-600 dark:text-amber-400", iconColor: "text-amber-500" },
  { name: "Gaming", icon: Gamepad2, gradient: "from-pink-500 to-fuchsia-600", shadowColor: "shadow-pink-500/40", textColor: "text-pink-600 dark:text-pink-400", iconColor: "text-pink-500" },
  { name: "Smart Income", icon: DollarSign, gradient: "from-green-500 to-emerald-600", shadowColor: "shadow-green-500/40", textColor: "text-green-600 dark:text-green-400", iconColor: "text-green-500" },
  { name: "Remote Work", icon: Wifi, gradient: "from-indigo-500 to-blue-600", shadowColor: "shadow-indigo-500/40", textColor: "text-indigo-600 dark:text-indigo-400", iconColor: "text-indigo-500" },
  { name: "Green Tech", icon: Leaf, gradient: "from-lime-500 to-green-600", shadowColor: "shadow-lime-500/40", textColor: "text-lime-600 dark:text-lime-400", iconColor: "text-lime-500" },
  { name: "Africa Tech", icon: Globe, gradient: "from-yellow-500 to-orange-600", shadowColor: "shadow-yellow-500/40", textColor: "text-yellow-600 dark:text-yellow-400", iconColor: "text-yellow-500" },
  { name: "Crypto", icon: Bitcoin, gradient: "from-amber-500 to-yellow-600", shadowColor: "shadow-amber-500/40", textColor: "text-amber-600 dark:text-amber-400", iconColor: "text-amber-500" },
  { name: "Space", icon: Rocket, gradient: "from-blue-600 to-purple-700", shadowColor: "shadow-blue-600/40", textColor: "text-blue-700 dark:text-blue-300", iconColor: "text-blue-600" },
  { name: "Health Tech", icon: Heart, gradient: "from-rose-500 to-pink-600", shadowColor: "shadow-rose-500/40", textColor: "text-rose-600 dark:text-rose-400", iconColor: "text-rose-500" },
  { name: "Startups", icon: Lightbulb, gradient: "from-teal-500 to-cyan-600", shadowColor: "shadow-teal-500/40", textColor: "text-teal-600 dark:text-teal-400", iconColor: "text-teal-500" },
];

// Fallback images by category
const categoryImages: Record<string, string> = {
  "AI Tech": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
  "Big Tech": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop",
  "Cybersecurity": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
  "Gadgets": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop",
  "Phones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop",
  "Productivity": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop",
  "Security": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
  "Gaming": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=400&fit=crop",
  "Smart Income": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
  "Remote Work": "https://images.unsplash.com/photo-1587825140708-dfaf18c4c5ad?w=800&h=400&fit=crop",
  "Green Tech": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=400&fit=crop",
  "Africa Tech": "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&h=400&fit=crop",
  "Crypto": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=400&fit=crop",
  "Space": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=400&fit=crop",
  "Health Tech": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop",
  "Startups": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop",
  "default": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop",
};

function getNewsImage(news: NewsItem): string {
  if (news.cover_image && (news.cover_image.startsWith("http") || news.cover_image.startsWith("/"))) {
    return news.cover_image;
  }
  return categoryImages[news.category] || categoryImages["default"];
}

export default function News() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch fresh data from API, fall back to static JSON on failure
  useEffect(() => {
    const controller = new AbortController();

    fetch(`${SUPABASE_URL}/rest/v1/news?select=id,title,slug,excerpt,category,cover_image,read_time_minutes,created_at,author&order=created_at.desc`, {
      headers: { "apikey": SUPABASE_KEY },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNews(data);
        } else {
          setNews(staticNews as NewsItem[]);
        }
      })
      .catch(() => { setNews(staticNews as NewsItem[]); })
      .finally(() => { setLoading(false); });

    return () => controller.abort();
  }, []);

  const filteredNews = news
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ||
        item.category === selectedCategory ||
        (selectedCategory === "Cybersecurity" && item.category === "Security");
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) =>
      sortBy === "oldest"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const totalPages = Math.ceil(filteredNews.length / NEWS_PER_PAGE);
  const startIndex = (currentPage - 1) * NEWS_PER_PAGE;
  const paginatedNews = filteredNews.slice(startIndex, startIndex + NEWS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Tech News - Breaking Tech Stories"
        description="Get the latest tech news, breaking stories about AI, Big Tech, cybersecurity, and gadgets. Stay informed with TechTrendi's daily tech news updates."
        canonical="/news"
        keywords={["tech news", "breaking tech", "AI news", "cybersecurity news", "gadget news", "Big Tech news"]}
      />
      <PageHero
        variant="dark"
        accent="blue"
        eyebrow="Updated daily"
        title="Africa Tech"
        accentText="News"
        subtitle="The latest from Ghana and across Africa — AI, cybersecurity, Big Tech, gadgets and the moves that matter."
      />
      <div className="container py-12 md:py-20">
        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Pills - Animated with unique colors and icons */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {newsCategories.map((category) => {
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
                >
                  <span
                    className={`
                      absolute inset-0 rounded-full transition-all duration-300 ease-out
                      bg-gradient-to-r ${category.gradient}
                      ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    `}
                  />
                  <Icon className={`
                    relative z-10 w-4 h-4 transition-all duration-300
                    ${isSelected ? 'text-white' : `${category.iconColor} group-hover:text-white`}
                  `} />
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
            {(["latest", "oldest"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  sortBy === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {s === "latest" ? "Latest First" : "Oldest First"}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-6 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              {news.length === 0
                ? "No news articles yet. Check back soon!"
                : "No news matches your search."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedNews.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.slug}`}
                className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  <img
                    src={getNewsImage(item)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = categoryImages["default"];
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary/90 text-primary-foreground">
                      {item.category}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  {item.excerpt && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.read_time_minutes || 3} min
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
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

        {filteredNews.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Showing {startIndex + 1}-{Math.min(startIndex + NEWS_PER_PAGE, filteredNews.length)} of {filteredNews.length} news articles
          </p>
        )}
      </div>
    </Layout>
  );
}
