import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
// No static JSON fallback — API-first with sessionStorage cache
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db2.techtrendi.com";
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
  "smart-income": "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&h=600&fit=crop",
  "default": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop",
};

// Get image URL with fallback
function getArticleImage(article: Article): string {
  if (article.cover_image?.startsWith("http") || article.cover_image?.startsWith("/images/")) {
    return article.cover_image;
  }
  return categoryImages[article.category] || categoryImages["default"];
}

// Get related articles
function getRelatedArticles(articles: Article[], category: string, excludeId: string): Article[] {
  return articles
    .filter(a => a.category === category && a.id !== excludeId)
    .slice(0, 3);
}

// Try to get article from sessionStorage cache
function getCachedArticle(slug: string): Article | undefined {
  try {
    const cached = sessionStorage.getItem(`article:${slug}`);
    if (cached) return JSON.parse(cached);
  } catch {}
  return undefined;
}

export default function BlogArticle() {
  const { slug } = useParams();
  const location = useLocation();
  const [toc, setToc] = useState<TableOfContentsItem[]>([]);
  const { subscription, user } = useAuth();
  const { addToHistory } = useReadingHistory();

  // Try cache/static first, then fall back to router state (partial data from listing page)
  const instant = slug ? getCachedArticle(slug) : undefined;
  const routerArticle = location.state?.article as Article | undefined;
  const initialArticle = instant || routerArticle;

  const [article, setArticle] = useState<Article | undefined>(initialArticle);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(!initialArticle);

  const backLink = '/blog';
  const backLabel = 'Back to Blog';

  // Fetch fresh article data from Supabase, fallback to static JSON on cPanel
  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(`${SUPABASE_URL}/rest/v1/articles?slug=eq.${slug}&select=*`, {
      headers: { "apikey": SUPABASE_KEY },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        clearTimeout(timeoutId);
        if (Array.isArray(data) && data.length > 0) {
          setArticle(data[0]);
          try { sessionStorage.setItem(`article:${slug}`, JSON.stringify(data[0])); } catch {};
          fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_views`, {
            method: "POST",
            headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ article_id: data[0].id }),
          }).catch(() => {});
          setLoading(false);
        } else {
          throw new Error("Empty");
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        // Fallback: try static JSON file on cPanel
        if (!article) {
          fetch("/articles-fallback.json")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (Array.isArray(data)) {
                const found = data.find((a: any) => a.slug === slug);
                if (found) {
                  setArticle(found);
                  try { sessionStorage.setItem(`article:${slug}`, JSON.stringify(found)); } catch {}
                }
              }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });

    // Also fetch all articles for related
    fetch(`${SUPABASE_URL}/rest/v1/articles?select=id,title,slug,excerpt,category,cover_image,read_time_minutes,created_at,author,tags,views&order=created_at.desc`, {
      headers: { "apikey": SUPABASE_KEY },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAllArticles(data);
        }
      })
      .catch(() => {});

    return () => { clearTimeout(timeoutId); controller.abort(); };
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
    const items: TableOfContentsItem[] = [];

    // Parse markdown headings: ## Heading
    const mdRegex = /^(#{1,3})\s+(.+)$/gm;
    let match;
    while ((match = mdRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      items.push({ id, text, level });
    }

    // Parse HTML headings: <h2>Heading</h2>
    if (items.length === 0) {
      const htmlRegex = /<h([1-3])[^>]*>([^<]+)<\/h[1-3]>/gi;
      while ((match = htmlRegex.exec(content)) !== null) {
        const level = parseInt(match[1], 10);
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        items.push({ id, text, level });
      }
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
    // Check if content is already HTML
    const hasHtmlTags = /<(h[1-6]|p|div|ul|ol|li|blockquote|strong|em|a|img|pre|code|table|br)\b/i.test(content);
    if (hasHtmlTags) {
      // Add id attributes to headings for TOC anchor links
      return content.replace(/<h([1-3])([^>]*)>([^<]+)<\/h([1-3])>/gi, (_m, lvl, attrs, text, lvl2) => {
        const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (attrs.includes('id=')) return _m; // already has id
        return `<h${lvl} id="${id}"${attrs}>${text}</h${lvl2}>`;
      });
    }

    const sanitizedContent = sanitizeInput(content);

    // Process line by line for proper list grouping (supports nested sub-bullets)
    const lines = sanitizedContent.split('\n');
    const blocks: string[] = [];
    let olItems: { text: string; subItems: string[] }[] = [];
    let ulItems: string[] = [];

    const flushOl = () => {
      if (olItems.length > 0) {
        const lis = olItems.map(item => {
          if (item.subItems.length > 0) {
            const subLis = item.subItems.map(s => `<li>${s}</li>`).join('');
            return `<li>${item.text}<ul class="my-1 pl-6 list-disc">${subLis}</ul></li>`;
          }
          return `<li>${item.text}</li>`;
        }).join('');
        blocks.push(`<ol class="my-2 pl-6 list-decimal">${lis}</ol>`);
        olItems = [];
      }
    };

    const flushUl = () => {
      if (ulItems.length > 0) {
        const lis = ulItems.map(s => `<li>${s}</li>`).join('');
        blocks.push(`<ul class="my-2 pl-6 list-disc">${lis}</ul>`);
        ulItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const indentedUlMatch = line.match(/^(\s+)- (.+)$/);
      const topUlMatch = line.match(/^- (.+)$/);
      const olMatch = line.match(/^\s*(\d+)\. (.+)$/);

      if (olMatch) {
        // Flush any standalone ul before starting/continuing ol
        flushUl();
        olItems.push({ text: olMatch[2], subItems: [] });
      } else if (indentedUlMatch && olItems.length > 0) {
        // Indented bullet while in an ol — attach as sub-item to last ol item
        olItems[olItems.length - 1].subItems.push(indentedUlMatch[2]);
      } else if (topUlMatch || indentedUlMatch) {
        // Top-level bullet (not inside an ol)
        flushOl();
        ulItems.push((topUlMatch || indentedUlMatch)![topUlMatch ? 1 : 2]);
      } else {
        if (line.trim() === '') {
          // Empty lines don't break lists — allows gaps within numbered lists
          continue;
        }
        flushOl();
        flushUl();
        // Process headings
        let processed = line
          .replace(/^### (.+)$/, (_m, text) => {
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return `<h3 id="${id}">${text}</h3>`;
          })
          .replace(/^## (.+)$/, (_m, text) => {
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return `<h2 id="${id}">${text}</h2>`;
          })
          .replace(/^# (.+)$/, (_m, text) => {
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return `<h1 id="${id}">${text}</h1>`;
          });

        if (processed.startsWith('<h')) {
          blocks.push(processed);
        } else {
          blocks.push(`<p>${processed}</p>`);
        }
      }
    }
    flushOl();
    flushUl();

    let html = blocks.join('\n');

    // Inline formatting
    html = html
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, (_m, linkText, url) => {
        const cleanUrl = url.trim();
        if (cleanUrl.match(/^https?:\/\//i) || cleanUrl.startsWith('/')) {
          return `<a href="${cleanUrl}" class="text-primary hover:underline" rel="noopener noreferrer">${linkText}</a>`;
        }
        return linkText;
      })
      .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      .replace(/^---$/gm, '<hr />');

    return html;
  };

  // Minimal loading indicator — no heavy skeleton
  if (loading) {
    return (
      <Layout>
        <div className="container py-12 md:py-20">
          <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[40vh]">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
              className="w-full h-full object-cover"
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
                    state={{ article: related }}
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
