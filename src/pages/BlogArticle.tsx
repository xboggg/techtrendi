import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import staticArticles from "@/data/articles.json";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Calendar, ArrowLeft, Crown, User, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { ShareButtons } from "@/components/ui/share-buttons";
import { BookmarkButton } from "@/components/ui/bookmark-system";
import { useReadingHistory } from "@/components/ui/reading-history";
import { sanitizeInput } from "@/lib/security";
import DOMPurify from "dompurify";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db.techtrendi.com";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

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

// Fallback images by category when article images don't exist
const categoryImages: Record<string, string> = {
  "How-To": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=600&fit=crop",
  "Security": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop",
  "Phones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop",
  "phones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop",
  "Accessories": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=600&fit=crop",
  "AI Tech": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
  "ai-tech": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
  "Gaming": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=600&fit=crop",
  "how-to": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=600&fit=crop",
  "security": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop",
  "productivity": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=600&fit=crop",
  "make-money": "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&h=600&fit=crop",
  "default": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop",
};

// Get image URL with fallback - ONLY use http URLs, ignore local paths from static JSON
function getArticleImage(article: Article): string {
  // Only use cover_image if it's a real http URL (from database)
  if (article.cover_image?.startsWith("http")) {
    return article.cover_image;
  }
  // Otherwise use category fallback - never use local /images/ paths
  return categoryImages[article.category] || categoryImages["default"];
}

// Get article from static data first (instant)
function getStaticArticle(slug: string): Article | undefined {
  return (staticArticles as Article[]).find(a => a.slug === slug);
}

// Get related articles
function getRelatedArticles(articles: Article[], category: string, excludeId: string): Article[] {
  return articles
    .filter(a => a.category === category && a.id !== excludeId)
    .slice(0, 3);
}

export default function BlogArticle() {
  const { slug } = useParams();
  const location = useLocation();
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);
  const { subscription, user } = useAuth();
  const { addToHistory } = useReadingHistory();
  const [article, setArticle] = useState<Article | undefined>(slug ? getStaticArticle(slug) : undefined);
  const [allArticles, setAllArticles] = useState<Article[]>(staticArticles as Article[]);
  const [loading, setLoading] = useState(!getStaticArticle(slug || "")); // Only loading if not in static data

  const [imageLoaded, setImageLoaded] = useState(false);

  // Check if user came from guides section
  const cameFromGuides = location.state?.from === 'guides' ||
    (typeof document !== 'undefined' && document.referrer.includes('/guides'));
  const backLink = cameFromGuides ? '/guides' : '/blog';
  const backLabel = cameFromGuides ? 'Back to Guides' : 'Back to Blog';

  // Fetch fresh article data in background
  useEffect(() => {
    if (!slug) return;
    setImageLoaded(false); // Reset image state when slug changes
    const controller = new AbortController();
    fetch(`${SUPABASE_URL}/rest/v1/articles?slug=eq.${slug}&select=*`, {
      headers: { "apikey": SUPABASE_KEY },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setArticle(data[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Also fetch all articles for related
    fetch(`${SUPABASE_URL}/rest/v1/articles?select=*&order=created_at.desc`, {
      headers: { "apikey": SUPABASE_KEY },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAllArticles(data);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [slug]);

  const relatedArticles = article ? getRelatedArticles(allArticles, article.category, article.id) : [];

  useEffect(() => {
    if (article?.content) {
      generateTOC(article.content);
      // Add to reading history
      addToHistory({
        id: article.id,
        type: 'article',
        title: article.title,
        url: `/blog/${article.slug}`,
        image: article.cover_image || undefined,
        category: article.category,
      });
    }
  }, [article]);

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
    const sanitizedContent = sanitizeInput(content);

    let html = sanitizedContent
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
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, (match, linkText, url) => {
        const cleanUrl = url.trim();
        if (cleanUrl.match(/^https?:\/\//i) || cleanUrl.startsWith('/')) {
          return `<a href="${cleanUrl}" class="text-primary hover:underline" rel="noopener noreferrer">${linkText}</a>`;
        }
        return linkText;
      })
      .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      .replace(/\n\n/g, '</p><p class="text-muted-foreground leading-relaxed mb-4">')
      .replace(/\n/g, '<br />');

    return `<p class="text-muted-foreground leading-relaxed mb-4">${html}</p>`;
  };

  // Show loading state while fetching
  if (loading) {
    return (
      <Layout>
        <div className="container py-12 md:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-6 w-24 bg-muted rounded mb-6" />
              <div className="h-10 w-3/4 bg-muted rounded mb-4" />
              <div className="h-6 w-1/2 bg-muted rounded mb-8" />
              <div className="aspect-video bg-muted rounded-2xl mb-10" />
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/5" />
              </div>
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
          <Link to={backLink}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel}
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
            <Link
              to={backLink}
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel}
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
      <SEOHead
        title={article.title}
        description={article.excerpt || `Read ${article.title} on TechTrendi`}
        canonical={`/blog/${article.slug}`}
        image={getArticleImage(article)}
        type="article"
        author={article.author || "TechTrendi Team"}
        publishedTime={article.created_at}
        category={article.category}
        tags={article.tags || []}
        keywords={article.tags || [article.category]}
      />
      <ReadingProgress />
      <article className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            to={backLink}
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
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
          <div className="rounded-2xl overflow-hidden mb-10 bg-muted aspect-video">
            <img
              src={getArticleImage(article)}
              alt={article.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = categoryImages[article.category] || categoryImages["default"];
              }}
            />
          </div>

          <div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-12">
            {/* Article Content */}
            <div
              className="prose max-w-none text-lg article-content
                prose-headings:text-foreground prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-3
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-3 prose-ul:list-disc prose-ul:pl-6
                prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-6
                prose-li:text-muted-foreground prose-li:my-0.5 prose-li:leading-normal
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg
                prose-img:rounded-xl prose-img:my-4
                prose-hr:my-6 prose-hr:border-border"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderContent(article.content), { ADD_ATTR: ['target', 'rel', 'class'], ADD_TAGS: ['iframe'] }) }}
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

          {/* Newsletter Signup */}
          <div className="mt-12">
            <NewsletterForm variant="default" />
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
                    <div className="h-32 rounded-lg overflow-hidden mb-3">
                      <img
                        src={getArticleImage(related)}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = categoryImages[related.category] || categoryImages["default"];
                        }}
                      />
                    </div>
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
