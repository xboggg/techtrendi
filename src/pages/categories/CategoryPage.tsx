import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Calendar, ArrowRight, Search, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";

const ARTICLES_PER_PAGE = 12;

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

interface CategoryPageProps {
  categoryName: string;
  categoryTitle: string;
  categoryDescription: string;
  categoryTags: string[];
  heroIcon: React.ReactNode;
}

export default function CategoryPage({
  categoryName,
  categoryTitle,
  categoryDescription,
  categoryTags,
  heroIcon,
}: CategoryPageProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchArticles();
  }, [categoryTags]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter articles that have any of the category tags
      const filteredData = (data || []).filter((article) => {
        const articleTags = article.tags || [];
        const articleCategory = article.category?.toLowerCase() || "";

        // Check if article matches any of the category tags
        return categoryTags.some(tag =>
          articleTags.some((t: string) => t.toLowerCase().includes(tag.toLowerCase())) ||
          articleCategory.includes(tag.toLowerCase())
        );
      });

      setArticles(filteredData);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const paginatedArticles = filteredArticles.slice(
    (safePage - 1) * ARTICLES_PER_PAGE,
    safePage * ARTICLES_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
        title={categoryTitle}
        description={categoryDescription}
        canonical={`/${categoryName.toLowerCase().replace(/\s+/g, "-")}`}
      />

      <div className="container py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            {heroIcon}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {categoryTitle}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {categoryDescription}
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${categoryName.toLowerCase()} articles...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border shadow-card overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-muted" />
                <div className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              {articles.length === 0
                ? `No ${categoryName.toLowerCase()} articles published yet. Check back soon!`
                : "No articles match your search."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-primary hover:underline"
              >
                Clear search
              </button>
            )}
            <div className="mt-8">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Browse all articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
          <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedArticles.map((article) => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
                state={{ article }}
                className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  {article.cover_image ? (
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-primary opacity-20" />
                  )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10">
              <p className="text-sm text-muted-foreground">
                Showing {(safePage - 1) * ARTICLES_PER_PAGE + 1}–{Math.min(safePage * ARTICLES_PER_PAGE, filteredArticles.length)} of {filteredArticles.length} articles
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 1}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card text-foreground text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground text-sm">...</span>
                      )}
                      <button
                        onClick={() => goToPage(p)}
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm transition-colors ${
                          p === safePage
                            ? "bg-primary text-primary-foreground font-medium"
                            : "border border-border bg-card text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card text-foreground text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </Layout>
  );
}
