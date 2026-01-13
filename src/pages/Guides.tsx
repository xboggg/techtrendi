import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowRight, Clock, ChevronLeft, Loader2 } from "lucide-react";

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

const categories = [
  {
    title: "Phone Guides",
    description: "Expert reviews and buying guides for smartphones",
    href: "/guides/phones",
    slug: "phones",
  },
  {
    title: "Productivity Apps",
    description: "The best apps to boost your workflow",
    href: "/guides/productivity",
    slug: "productivity",
  },
  {
    title: "Security Basics",
    description: "Stay safe online with these essential tips",
    href: "/guides/security",
    slug: "security",
  },
  {
    title: "How-To Tutorials",
    description: "Step-by-step guides for common tech tasks",
    href: "/guides/how-to",
    slug: "how-to",
  },
];

const categoryLabels: Record<string, string> = {
  phones: "Phone Guides",
  productivity: "Productivity",
  security: "Security",
  "how-to": "How-To",
  "ai-tech": "AI Tech",
  "make-money": "Side Hustles",
};

export default function Guides() {
  const { category } = useParams<{ category?: string }>();

  // Fetch guides from articles table where content_type = 'guide'
  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["guides", category],
    queryFn: async (): Promise<Guide[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes, created_at")
        .match({ is_published: true, content_type: "guide" })
        .order("created_at", { ascending: false });

      if (error) throw error;

      let filtered = data || [];
      if (category) {
        filtered = filtered.filter(item => item.category === category);
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
        .eq("is_published", true)
        .eq("content_type", "guide");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((item) => {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });
      return counts;
    },
  });

  // Find the current category info
  const currentCategory = category
    ? categories.find(c => c.slug === category)
    : null;

  // If viewing a specific category
  if (currentCategory) {
    return (
      <Layout>
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {currentCategory.title}
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <Link
                  key={guide.id}
                  to={`/blog/${guide.slug}`}
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
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                      {categoryLabels[guide.category] || guide.category}
                    </span>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {guide.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {guide.read_time_minutes || 5} min read
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No guides yet</h3>
              <p className="text-muted-foreground mb-6">
                We're working on adding guides to this category. Check back soon!
              </p>
              <Link
                to="/guides"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Browse All Guides
              </Link>
            </div>
          )}

          {/* Other Categories */}
          <div className="mt-16">
            <h2 className="text-xl font-bold text-foreground mb-6">Explore Other Categories</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.filter(c => c.slug !== category).map((cat) => (
                <Link
                  key={cat.title}
                  to={cat.href}
                  className="group p-6 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-card transition-all"
                >
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{cat.description}</p>
                  <span className="text-xs font-medium text-primary">
                    {categoryCounts[cat.slug] || 0} guides
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Default view - all guides
  return (
    <Layout>
      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tech Guides & Tutorials
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Expert-written guides to help you navigate the world of technology with confidence.
          </p>
        </div>

        {/* Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              to={cat.href}
              className="group p-6 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-card transition-all"
            >
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {cat.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">{cat.description}</p>
              <span className="text-xs font-medium text-primary">
                {categoryCounts[cat.slug] || 0} guides
              </span>
            </Link>
          ))}
        </div>

        {/* Featured Guides */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-8">Featured Guides</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : guides.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <Link
                  key={guide.id}
                  to={`/blog/${guide.slug}`}
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
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                      {categoryLabels[guide.category] || guide.category}
                    </span>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {guide.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {guide.read_time_minutes || 5} min read
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No guides yet</h3>
              <p className="text-muted-foreground">
                Guides will appear here once you create them in the admin panel.
              </p>
            </div>
          )}
        </div>

        {/* Load More */}
        {guides.length > 0 && (
          <div className="text-center mt-12">
            <button className="inline-flex items-center px-6 py-3 border border-border rounded-xl text-foreground font-medium hover:bg-muted transition-colors">
              Load More Guides
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
