import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Clock, Calendar, ArrowLeft, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { ShareButtons } from "@/components/ui/share-buttons";
import { BookmarkButton } from "@/components/ui/bookmark-system";
import { useReadingHistory } from "@/components/ui/reading-history";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import DOMPurify from "dompurify";

/**
 * Renders content that may be HTML or Markdown.
 * If content contains HTML tags, it's rendered as-is with prose styling.
 * If it's markdown/plain text, it's converted to formatted HTML.
 */
function renderContent(content: string): string {
  // Check if content already contains HTML tags (from RichTextEditor)
  const hasHtmlTags = /<(h[1-6]|p|div|ul|ol|li|blockquote|strong|em|a|img|pre|code|table|br)\b/i.test(content);

  if (hasHtmlTags) {
    return DOMPurify.sanitize(content, { ADD_ATTR: ['target', 'rel', 'class'], ADD_TAGS: ['iframe'] });
  }

  // Process line by line for proper list grouping
  const lines = content.split('\n');
  const blocks: string[] = [];
  let currentList: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (currentList.length > 0 && listType) {
      blocks.push(`<${listType} class="my-2 pl-6">${currentList.join('')}</${listType}>`);
      currentList = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ulMatch = line.match(/^- (.+)$/);
    const olMatch = line.match(/^(\d+)\. (.+)$/);

    if (ulMatch) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      currentList.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      currentList.push(`<li>${olMatch[2]}</li>`);
    } else {
      flushList();
      if (line.trim() === '') continue;
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
  flushList();

  let html = blocks.join('\n');

  // Inline formatting
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_m, linkText, url) => {
      const cleanUrl = url.trim();
      if (cleanUrl.match(/^https?:\/\//i) || cleanUrl.startsWith('/')) {
        return `<a href="${cleanUrl}" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      }
      return linkText;
    })
    .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/^---$/gm, '<hr />');

  return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel', 'class', 'id'], ADD_TAGS: ['iframe'] });
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db.techtrendi.com";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  created_at: string;
  author: string | null;
  meta_description: string | null;
  tags: string[] | null;
}

const categoryImages: Record<string, string> = {
  "AI Tech": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
  "Big Tech": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=600&fit=crop",
  "Cybersecurity": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop",
  "Gadgets": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop",
  "default": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop",
};

function getNewsImage(news: NewsItem): string {
  if (news.cover_image?.startsWith("http")) {
    return news.cover_image;
  }
  return categoryImages[news.category] || categoryImages["default"];
}

export default function NewsArticle() {
  const { slug } = useParams();
  const { addToHistory } = useReadingHistory();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    setLoading(true);

    // Fetch the news article
    fetch(`${SUPABASE_URL}/rest/v1/news?slug=eq.${slug}&select=*`, {
      headers: { "apikey": SUPABASE_KEY },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNews(data[0]);
          // Add to reading history
          addToHistory({
            id: data[0].id,
            type: 'news',
            title: data[0].title,
            url: `/news/${data[0].slug}`,
            image: data[0].cover_image || undefined,
            category: data[0].category,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch related news
    fetch(`${SUPABASE_URL}/rest/v1/news?select=*&order=created_at.desc&limit=4`, {
      headers: { "apikey": SUPABASE_KEY },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setRelatedNews(data.filter(n => n.slug !== slug).slice(0, 3));
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6" />
            <div className="h-12 bg-muted rounded w-3/4 mb-4" />
            <div className="h-6 bg-muted rounded w-1/2 mb-8" />
            <div className="h-80 bg-muted rounded-2xl mb-8" />
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

  if (!news) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">News Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The news article you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/news">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={news.title}
        description={news.meta_description || news.excerpt || `Read ${news.title} on TechTrendi`}
        canonical={`/news/${news.slug}`}
        image={getNewsImage(news)}
        type="article"
        author={news.author || "TechTrendi Team"}
        publishedTime={news.created_at}
        category={news.category}
        tags={news.tags || []}
        keywords={news.tags || [news.category, "tech news"]}
      />
      <ReadingProgress />
      <article className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            to="/news"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to News
          </Link>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-primary/90 text-primary-foreground">
                <Zap className="w-3 h-3 mr-1" />
                {news.category}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatRelativeDate(news.created_at)}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {news.title}
            </h1>

            {news.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">{news.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {news.author || "TechTrendi Team"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(news.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {news.read_time_minutes || 3} min read
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-6">
              <ShareButtons
                url={window.location.href}
                title={news.title}
                description={news.excerpt || undefined}
                variant="compact"
              />
              <BookmarkButton
                item={{
                  id: news.id,
                  type: 'news',
                  title: news.title,
                  url: `/news/${news.slug}`,
                  excerpt: news.excerpt || undefined,
                  image: news.cover_image || undefined,
                }}
              />
            </div>
          </header>

          {/* Cover Image */}
          <div className="rounded-2xl overflow-hidden mb-10">
            <img
              src={getNewsImage(news)}
              alt={news.title}
              className="w-full h-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = categoryImages["default"];
              }}
            />
          </div>

          {/* Article Content - Renders HTML or Markdown */}
          <div
            className="prose max-w-none text-lg article-content
              prose-headings:text-foreground prose-headings:font-bold
              prose-h1:text-3xl prose-h1:mt-10 prose-h1:mb-4
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-3
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:my-3 prose-ul:list-disc prose-ul:pl-6
              prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-6
              prose-li:text-muted-foreground prose-li:my-0.5 prose-li:leading-normal
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
              prose-img:rounded-xl prose-img:my-4
              prose-hr:my-6 prose-hr:border-border
              prose-table:w-full prose-table:my-4
              prose-th:bg-muted prose-th:p-3 prose-th:text-left prose-th:font-semibold
              prose-td:p-3 prose-td:border-b prose-td:border-border"
            dangerouslySetInnerHTML={{ __html: renderContent(news.content) }}
          />

          {/* Tags */}
          {news.tags && news.tags.length > 0 && (
            <div className="mt-12 pt-6 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {news.tags.map((tag) => (
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

          {/* Related News */}
          {relatedNews.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-6">More Tech News</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedNews.map((related) => (
                  <Link
                    key={related.id}
                    to={`/news/${related.slug}`}
                    className="group bg-card rounded-xl border border-border p-4 hover:shadow-elevated hover:border-primary/20 transition-all"
                  >
                    <div className="h-32 rounded-lg overflow-hidden mb-3">
                      <img
                        src={getNewsImage(related)}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = categoryImages["default"];
                        }}
                      />
                    </div>
                    <Badge className="mb-2 text-xs">{related.category}</Badge>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatRelativeDate(related.created_at)}
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
