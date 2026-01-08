import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  image?: string;
  readTime: string;
  publishedAt: string;
  relevanceScore?: number;
}

interface RelatedArticlesProps {
  currentArticleId: string;
  currentCategory: string;
  tags?: string[];
  className?: string;
  layout?: 'grid' | 'list' | 'compact';
  limit?: number;
}

// Sample related articles (in production, this would come from API)
const sampleArticles: RelatedArticle[] = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max vs Samsung S24 Ultra: Ultimate Comparison',
    slug: 'iphone-15-vs-samsung-s24',
    excerpt: 'A detailed comparison of the two flagship smartphones of 2024.',
    category: 'Smartphones',
    readTime: '12 min',
    publishedAt: '2024-01-10',
    relevanceScore: 95,
  },
  {
    id: '2',
    title: 'Best Camera Phones of 2024: Complete Guide',
    slug: 'best-camera-phones-2024',
    excerpt: 'Our top picks for smartphone photography enthusiasts.',
    category: 'Smartphones',
    readTime: '10 min',
    publishedAt: '2024-01-08',
    relevanceScore: 88,
  },
  {
    id: '3',
    title: 'How to Protect Your Privacy on Android',
    slug: 'android-privacy-guide',
    excerpt: 'Essential privacy settings every Android user should know.',
    category: 'Security',
    readTime: '8 min',
    publishedAt: '2024-01-12',
    relevanceScore: 72,
  },
  {
    id: '4',
    title: 'The Future of Foldable Phones',
    slug: 'future-foldable-phones',
    excerpt: 'What to expect from the next generation of foldables.',
    category: 'Smartphones',
    readTime: '6 min',
    publishedAt: '2024-01-14',
    relevanceScore: 65,
  },
];

export function RelatedArticles({
  currentArticleId,
  currentCategory,
  tags = [],
  className,
  layout = 'grid',
  limit = 4,
}: RelatedArticlesProps) {
  const [articles, setArticles] = useState<RelatedArticle[]>([]);

  useEffect(() => {
    // Filter out current article and sort by relevance
    const related = sampleArticles
      .filter((a) => a.id !== currentArticleId)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, limit);
    setArticles(related);
  }, [currentArticleId, currentCategory, tags, limit]);

  if (articles.length === 0) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (layout === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        <h3 className="font-semibold text-foreground">Related Articles</h3>
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/blog/${article.slug}`}
            className="flex items-start gap-3 group"
          >
            <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h4>
              <span className="text-xs text-muted-foreground">{article.readTime}</span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Related Articles</h3>
          <Link to="/blog" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/blog/${article.slug}`}
              className="flex gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow group"
            >
              <div className="w-24 h-24 rounded-lg bg-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Badge variant="secondary" className="mb-2 text-xs">
                  {article.category}
                </Badge>
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                  {article.title}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{article.excerpt}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{article.readTime}</span>
                  <span>•</span>
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Default grid layout
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">You Might Also Like</h3>
        </div>
        <Link to="/blog" className="text-sm text-primary hover:underline flex items-center gap-1">
          More articles <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/blog/${article.slug}`}
            className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50" />
            <div className="p-4">
              <Badge variant="secondary" className="mb-2 text-xs">
                {article.category}
              </Badge>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                {article.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{article.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// "Read Next" single recommendation
export function ReadNextRecommendation({
  currentArticleId,
  className,
}: {
  currentArticleId: string;
  className?: string;
}) {
  const nextArticle = sampleArticles.find((a) => a.id !== currentArticleId);

  if (!nextArticle) return null;

  return (
    <Link
      to={`/blog/${nextArticle.slug}`}
      className={cn(
        'block p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl hover:shadow-lg transition-shadow',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-primary mb-2">
        <ArrowRight className="w-4 h-4" />
        <span className="font-medium">Read Next</span>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{nextArticle.title}</h3>
      <p className="text-muted-foreground mb-4">{nextArticle.excerpt}</p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{nextArticle.category}</Badge>
        <span>•</span>
        <span>{nextArticle.readTime}</span>
      </div>
    </Link>
  );
}

// Inline "More from this category"
export function MoreFromCategory({
  category,
  currentArticleId,
  className,
}: {
  category: string;
  currentArticleId: string;
  className?: string;
}) {
  const categoryArticles = sampleArticles
    .filter((a) => a.category === category && a.id !== currentArticleId)
    .slice(0, 3);

  if (categoryArticles.length === 0) return null;

  return (
    <div className={cn('bg-muted/50 rounded-xl p-4', className)}>
      <h4 className="font-semibold text-foreground mb-3">More from {category}</h4>
      <div className="space-y-3">
        {categoryArticles.map((article) => (
          <Link
            key={article.id}
            to={`/blog/${article.slug}`}
            className="block text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {article.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RelatedArticles;
