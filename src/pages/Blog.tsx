import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import staticArticles from "@/data/articles.json";
import { Clock, Calendar, ArrowRight, Search, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ARTICLES_PER_PAGE = 9;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db.techtrendi.com";
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

const categories = [
  "All",
  "How-To",
  "Security",
  "Phones",
  "Accessories",
  "AI Tech",
  "Gaming",
];

// Fallback images by category when article images don't exist
const categoryImages: Record<string, string> = {
  "How-To": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
  "Security": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
  "Phones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop",
  "Accessories": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=400&fit=crop",
  "AI Tech": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
  "Gaming": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=400&fit=crop",
  "default": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop",
};

// Get image URL with fallback
function getArticleImage(article: Article): string {
  // If cover_image is a full URL (starts with http), use it
  if (article.cover_image?.startsWith("http")) {
    return article.cover_image;
  }
  // Otherwise use category fallback
  return categoryImages[article.category] || categoryImages["default"];
}

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [articles, setArticles] = useState<Article[]>(staticArticles as Article[]);

  // Instant load with static data, then fetch fresh articles in background
  // New articles appear automatically without any rebuild needed
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${SUPABASE_URL}/rest/v1/articles?select=*&order=created_at.desc`, {
      headers: { "apikey": SUPABASE_KEY },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
        }
      })
      .catch(() => {}); // Silent fail - static data already showing
    return () => controller.abort();
  }, []);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

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
      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tech Blog & Insights
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stay updated with the latest tech trends, in-depth guides, and expert reviews.
          </p>
        </div>

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

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              No articles match your search.
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
            {paginatedArticles.map((article) => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
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
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-10 h-10"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
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
