import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Calendar, ArrowLeft, Crown, User, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { ShareButtons } from "@/components/ui/share-buttons";
import { BookmarkButton } from "@/components/ui/bookmark-system";
import { useReadingHistory } from "@/components/ui/reading-history";
import { sanitizeHTML, sanitizeInput } from "@/lib/security";
import { ArticleReactions } from "@/components/article/ArticleReactions";
import { SocialShare } from "@/components/article/SocialShare";
import { CommentsSection } from "@/components/article/CommentsSection";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  created_at: string;
  updated_at: string;
  is_premium: boolean;
  tags: string[] | null;
  author: string | null;
  views: number | null;
}

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

export default function BlogArticle() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);
  const { subscription, user } = useAuth();
  const { toast } = useToast();
  const { addToHistory } = useReadingHistory();

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      setArticle(data);

      // Generate TOC from content
      if (data?.content) {
        generateTOC(data.content);
      }

      // Fetch related articles
      if (data?.category) {
        fetchRelatedArticles(data.category, data.id);
      }

      // Increment views and add to reading history
      if (data?.id) {
        await supabase
          .from("articles")
          .update({ views: (data.views || 0) + 1 })
          .eq("id", data.id);

        // Add to reading history
        addToHistory({
          id: data.id,
          type: 'article',
          title: data.title,
          url: `/blog/${data.slug}`,
          image: data.cover_image || undefined,
          category: data.category,
        });
      }
    } catch (error) {
      console.error("Error fetching article:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedArticles = async (category: string, currentId: string) => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("category", category)
        .eq("is_published", true)
        .neq("id", currentId)
        .limit(3);

      if (error) throw error;
      setRelatedArticles(data || []);
    } catch (error) {
      console.error("Error fetching related articles:", error);
    }
  };

  const generateTOC = (content: string) => {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TableOfContentsItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      items.push({ id, text, level });
    }

    setToc(items);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderContent = (content: string) => {
    // Sanitize the raw content first to prevent XSS
    const sanitizedContent = sanitizeInput(content);

    // Simple markdown-like rendering
    let html = sanitizedContent
      // Headers
      .replace(/^### (.+)$/gm, (match, text) => {
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return `<h3 id="${id}" class="text-xl font-semibold mt-8 mb-4 text-foreground scroll-mt-20">${text}</h3>`;
      })
      .replace(/^## (.+)$/gm, (match, text) => {
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return `<h2 id="${id}" class="text-2xl font-bold mt-10 mb-4 text-foreground scroll-mt-20">${text}</h2>`;
      })
      .replace(/^# (.+)$/gm, (match, text) => {
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return `<h1 id="${id}" class="text-3xl font-bold mt-12 mb-6 text-foreground scroll-mt-20">${text}</h1>`;
      })
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links - sanitize URLs
      .replace(/\[(.+?)\]\((.+?)\)/g, (match, linkText, url) => {
        // Basic URL validation - only allow http/https
        const cleanUrl = url.trim();
        if (cleanUrl.match(/^https?:\/\//i) || cleanUrl.startsWith('/')) {
          return `<a href="${cleanUrl}" class="text-primary hover:underline" rel="noopener noreferrer">${linkText}</a>`;
        }
        return linkText; // If invalid URL, just return the text
      })
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="text-muted-foreground leading-relaxed mb-4">')
      // Line breaks
      .replace(/\n/g, '<br />');

    return `<p class="text-muted-foreground leading-relaxed mb-4">${html}</p>`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-8" />
            <div className="h-64 bg-muted rounded mb-8" />
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Premium content gate
  if (article.is_premium && !subscription.subscribed) {
    return (
      <Layout>
        <div className="container py-12 md:py-20">
          <div className="max-w-4xl mx-auto">
            {/* Article Header Preview */}
            <Link
              to="/blog"
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>

            <Badge className="bg-gradient-accent text-accent-foreground mb-4">
              <Crown className="w-3 h-3 mr-1" />
              Premium Content
            </Badge>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-lg text-muted-foreground mb-6">{article.excerpt}</p>
            )}

            {/* Premium Gate */}
            <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center">
              <Crown className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-primary-foreground mb-4">
                This is Premium Content
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
                Upgrade to Premium to access this article and all other exclusive content, tools, and features.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/premium">
                  <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
                    Upgrade to Premium - $4.99/mo
                  </Button>
                </Link>
                {!user && (
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ReadingProgress />
      <article className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            to="/blog"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{article.category}</Badge>
              {article.is_premium && (
                <Badge className="bg-gradient-accent text-accent-foreground">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">{article.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {article.author || "TechTrendi Team"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.read_time_minutes || 5} min read
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-6">
              <ShareButtons
                url={window.location.href}
                title={article.title}
                description={article.excerpt || undefined}
                variant="compact"
              />
              <BookmarkButton
                item={{
                  id: article.id,
                  type: 'article',
                  title: article.title,
                  url: `/blog/${article.slug}`,
                  excerpt: article.excerpt || undefined,
                  image: article.cover_image || undefined,
                }}
              />
            </div>
          </header>

          {/* Cover Image */}
          {article.cover_image && (
            <div className="rounded-2xl overflow-hidden mb-10">
              <img
                src={article.cover_image}
                alt={article.title}
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-12">
            {/* Article Content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: renderContent(article.content) }}
            />

            {/* Sidebar - Table of Contents */}
            {toc.length > 0 && (
              <aside className="hidden lg:block">
                <div className="sticky top-24 bg-card rounded-xl border border-border p-6">
                  <h4 className="flex items-center gap-2 font-semibold text-foreground mb-4">
                    <List className="w-4 h-4" />
                    Table of Contents
                  </h4>
                  <nav className="space-y-2">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-sm text-muted-foreground hover:text-primary transition-colors ${
                          item.level === 2 ? "pl-0" : item.level === 3 ? "pl-4" : ""
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-6 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Article Reactions */}
          <div className="mt-12 pt-8 border-t border-border">
            <ArticleReactions
              articleId={article.id}
              articleTitle={article.title}
            />
          </div>

          {/* Social Share */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Share this article</h3>
            <SocialShare
              articleId={article.id}
              articleTitle={article.title}
              articleUrl={window.location.href}
            />
          </div>

          {/* Newsletter Signup */}
          <div className="mt-12">
            <NewsletterForm variant="default" />
          </div>

          {/* Comments Section */}
          <div className="mt-12 pt-8 border-t border-border">
            <CommentsSection articleId={article.id} />
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    to={`/blog/${related.slug}`}
                    className="group bg-card rounded-xl border border-border p-4 hover:shadow-elevated hover:border-primary/20 transition-all"
                  >
                    {related.cover_image && (
                      <div className="h-32 rounded-lg overflow-hidden mb-3">
                        <img
                          src={related.cover_image}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {related.read_time_minutes || 5} min read
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </Layout>
  );
}
