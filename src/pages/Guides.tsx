import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen, ArrowRight, Clock, ChevronLeft, ChevronRight, Loader2, LayoutGrid,
  Smartphone, Shield, Brain, Lightbulb, GraduationCap, Heart, DollarSign, Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Guide {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  created_at: string;
  author?: string;
}

interface CategoryStyle {
  name: string;
  slug: string;
  icon: React.ElementType;
  gradient: string;
  hoverBg: string;
  shadowColor: string;
  textColor: string;
  iconColor: string;
  description: string;
  href: string;
}

const categories: CategoryStyle[] = [
  { name: "All", slug: "all", icon: LayoutGrid, gradient: "from-blue-500 to-indigo-600", hoverBg: "hover:bg-blue-500", shadowColor: "shadow-blue-500/40", textColor: "text-blue-600 dark:text-blue-400", iconColor: "text-blue-500", description: "All guides", href: "/guides" },
  { name: "Phone Guides", slug: "phones", icon: Smartphone, gradient: "from-sky-500 to-blue-600", hoverBg: "hover:bg-sky-500", shadowColor: "shadow-sky-500/40", textColor: "text-sky-600 dark:text-sky-400", iconColor: "text-sky-500", description: "Smartphone reviews, comparisons, and buying advice", href: "/guides/phones" },
  { name: "Security", slug: "security", icon: Shield, gradient: "from-red-500 to-rose-600", hoverBg: "hover:bg-red-500", shadowColor: "shadow-red-500/40", textColor: "text-red-600 dark:text-red-400", iconColor: "text-red-500", description: "Protect yourself online with essential security tips", href: "/guides/security" },
  { name: "AI Tech", slug: "ai-tech", icon: Brain, gradient: "from-violet-500 to-purple-600", hoverBg: "hover:bg-violet-500", shadowColor: "shadow-violet-500/40", textColor: "text-violet-600 dark:text-violet-400", iconColor: "text-violet-500", description: "Master AI tools and understand the technology", href: "/guides/ai-tech" },
  { name: "How-To Tutorials", slug: "how-to", icon: Lightbulb, gradient: "from-amber-500 to-orange-600", hoverBg: "hover:bg-amber-500", shadowColor: "shadow-amber-500/40", textColor: "text-amber-600 dark:text-amber-400", iconColor: "text-amber-500", description: "Step-by-step guides for common tech tasks", href: "/guides/how-to" },
  { name: "Career in Tech", slug: "career-in-tech", icon: GraduationCap, gradient: "from-emerald-500 to-green-600", hoverBg: "hover:bg-emerald-500", shadowColor: "shadow-emerald-500/40", textColor: "text-emerald-600 dark:text-emerald-400", iconColor: "text-emerald-500", description: "Launch or advance your tech career", href: "/guides/career-in-tech" },
  { name: "Health Tech", slug: "health-tech", icon: Heart, gradient: "from-pink-500 to-rose-600", hoverBg: "hover:bg-pink-500", shadowColor: "shadow-pink-500/40", textColor: "text-pink-600 dark:text-pink-400", iconColor: "text-pink-500", description: "Fitness trackers, health apps, and wellness tech", href: "/guides/health-tech" },
  { name: "Side Hustles", slug: "make-money", icon: DollarSign, gradient: "from-green-500 to-emerald-600", hoverBg: "hover:bg-green-500", shadowColor: "shadow-green-500/40", textColor: "text-green-600 dark:text-green-400", iconColor: "text-green-500", description: "Make money online with proven strategies", href: "/guides/make-money" },
  { name: "Productivity", slug: "productivity", icon: Zap, gradient: "from-orange-500 to-amber-600", hoverBg: "hover:bg-orange-500", shadowColor: "shadow-orange-500/40", textColor: "text-orange-600 dark:text-orange-400", iconColor: "text-orange-500", description: "Apps and techniques to boost your efficiency", href: "/guides/productivity" },
];

const categoryLabels: Record<string, string> = {
  phones: "Phone Guides",
  productivity: "Productivity",
  security: "Security",
  "how-to": "How-To",
  "ai-tech": "AI Tech",
  "make-money": "Side Hustles",
  "career-in-tech": "Career in Tech",
  "health-tech": "Health Tech",
};

export default function Guides() {
  const { category } = useParams<{ category?: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const guidesPerPage = 12;

  // Fetch guides from articles table
  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["guides", category],
    queryFn: async (): Promise<Guide[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      let filtered = data || [];
      if (category) {
        // Map URL slug to actual database category name
        const slugToCategory: Record<string, string> = {
          "phones": "Phones",
          "security": "Security",
          "ai-tech": "AI Tech",
          "how-to": "How-To",
          "career-in-tech": "Career in Tech",
          "health-tech": "Health Tech",
          "make-money": "Side Hustles",
          "productivity": "Productivity",
          "gaming": "Gaming",
          "accessories": "Accessories",
          "remote-work": "Remote Work",
          "green-tech": "Green Tech",
        };
        const dbCategory = slugToCategory[category];
        if (dbCategory) {
          filtered = filtered.filter(item => item.category === dbCategory);
        }
      }
      return filtered as Guide[];
    },
  });

  // Get category counts
  const { data: categoryCounts = {} } = useQuery({
    queryKey: ["guide-category-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("category")
        .eq("is_published", true);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((item) => {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });
      return counts;
    },
  });

  // Selected category for filtering
  const [selectedCategory, setSelectedCategory] = useState(category || "all");

  // Find the current category info
  const currentCategory = category
    ? categories.find(c => c.slug === category)
    : null;

  // Pagination
  const totalPages = Math.ceil(guides.length / guidesPerPage);
  const paginatedGuides = guides.slice(
    (currentPage - 1) * guidesPerPage,
    currentPage * guidesPerPage
  );

  // If viewing a specific category
  if (currentCategory) {
    const Icon = currentCategory.icon;
    return (
      <Layout>
        <SEOHead
          title={`${currentCategory.name} - TechTrendi Guides`}
          description={currentCategory.description}
          canonicalUrl={`https://techtrendi.com/guides/${category}`}
        />
        <div className="container py-12 md:py-20">
          {/* Back Link */}
          <Link
            to="/guides"
            className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to All Guides
          </Link>

          {/* Category Header */}
          <div className="text-center mb-12">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentCategory.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {currentCategory.name}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {currentCategory.description}
            </p>
          </div>

          {/* Guides in this category */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : guides.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedGuides.map((guide) => (
                  <Link
                    key={guide.id}
                    to={`/blog/${guide.slug}`}
                    state={{ from: 'guides' }}
                    className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all"
                  >
                    <div className="aspect-video overflow-hidden">
                      {guide.cover_image ? (
                        <img
                          src={guide.cover_image}
                          alt={guide.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-primary/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <Badge variant="secondary" className="mb-3">
                        {categoryLabels[guide.category] || guide.category}
                      </Badge>
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {guide.title}
                      </h3>
                      {guide.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {guide.excerpt}
                        </p>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        {guide.read_time_minutes || 5} min read
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No guides yet</h3>
              <p className="text-muted-foreground">
                We're working on adding guides to this category. Check back soon!
              </p>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Main guides page with categories
  return (
    <Layout>
      <SEOHead
        title="Tech Guides & Tutorials - TechTrendi"
        description="Expert tech guides to help you navigate the world of technology with confidence. Smartphones, security, AI, productivity, and more."
        canonicalUrl="https://techtrendi.com/guides"
      />

      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            Learning Center
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Tech Guides & <span className="text-gradient">Tutorials</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Expert guides to help you navigate the world of technology with confidence.
          </p>
        </div>

        {/* Category Pills - Animated with unique colors and icons */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                to={cat.href}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`
                  group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold
                  transition-all duration-300 ease-out
                  transform hover:scale-105 hover:-translate-y-1
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
                  ${isSelected
                    ? `bg-gradient-to-r ${cat.gradient} text-white shadow-xl ${cat.shadowColor}`
                    : `bg-card border-2 border-border/50 ${cat.textColor} hover:border-transparent hover:shadow-xl`
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
                    bg-gradient-to-r ${cat.gradient}
                    ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  `}
                />
                {/* Icon */}
                <Icon className={`
                  relative z-10 w-4 h-4 transition-all duration-300
                  ${isSelected ? 'text-white' : `${cat.iconColor} group-hover:text-white`}
                `} />
                {/* Text */}
                <span className={`
                  relative z-10 transition-colors duration-300
                  ${isSelected ? 'text-white' : 'group-hover:text-white'}
                `}>
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Featured Guides Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Featured <span className="text-gradient">Guides</span>
            </h2>
            <Link
              to="/blog"
              className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : guides.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedGuides.map((guide) => (
                  <Link
                    key={guide.id}
                    to={`/blog/${guide.slug}`}
                    state={{ from: 'guides' }}
                    className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all"
                  >
                    <div className="aspect-video overflow-hidden relative">
                      {guide.cover_image ? (
                        <img
                          src={guide.cover_image}
                          alt={guide.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-primary/50" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-white/90 text-foreground dark:bg-black/70 dark:text-white">
                        {categoryLabels[guide.category] || guide.category}
                      </Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {guide.title}
                      </h3>
                      {guide.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {guide.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {guide.read_time_minutes || 5} min read
                        </div>
                        <span className="flex items-center text-primary font-medium">
                          Read Guide
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-2xl">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No guides published yet</h3>
              <p className="text-muted-foreground">
                Check back soon for expert tech guides and tutorials!
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
