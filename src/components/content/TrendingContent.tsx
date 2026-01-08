import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Eye, MessageSquare, ArrowUp, Flame, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TrendingItem {
  id: string;
  title: string;
  slug: string;
  type: 'review' | 'blog' | 'guide';
  category: string;
  image?: string;
  views: number;
  viewsChange: number;
  comments: number;
  readTime: string;
  trendScore: number;
  publishedAt: string;
}

// Sample trending data
const sampleTrending: TrendingItem[] = [
  {
    id: '1',
    title: 'iPhone 16 Pro Max Review: The Best iPhone Ever?',
    slug: 'iphone-16-pro-max-review',
    type: 'review',
    category: 'Smartphones',
    views: 15420,
    viewsChange: 45,
    comments: 234,
    readTime: '12 min',
    trendScore: 98,
    publishedAt: '2024-01-10',
  },
  {
    id: '2',
    title: 'Best Password Managers 2024: Complete Security Guide',
    slug: 'best-password-managers-2024',
    type: 'guide',
    category: 'Security',
    views: 12350,
    viewsChange: 32,
    comments: 156,
    readTime: '15 min',
    trendScore: 94,
    publishedAt: '2024-01-08',
  },
  {
    id: '3',
    title: 'Samsung Galaxy S24 Ultra vs iPhone 15 Pro Max',
    slug: 'samsung-s24-vs-iphone-15-comparison',
    type: 'review',
    category: 'Smartphones',
    views: 10890,
    viewsChange: 28,
    comments: 189,
    readTime: '10 min',
    trendScore: 91,
    publishedAt: '2024-01-12',
  },
  {
    id: '4',
    title: 'How AI is Changing Cybersecurity in 2024',
    slug: 'ai-cybersecurity-2024',
    type: 'blog',
    category: 'Security',
    views: 8920,
    viewsChange: 52,
    comments: 98,
    readTime: '8 min',
    trendScore: 89,
    publishedAt: '2024-01-14',
  },
  {
    id: '5',
    title: 'MacBook Pro M3 Max: 6 Months Later',
    slug: 'macbook-pro-m3-max-long-term',
    type: 'review',
    category: 'Laptops',
    views: 7650,
    viewsChange: 18,
    comments: 76,
    readTime: '14 min',
    trendScore: 85,
    publishedAt: '2024-01-11',
  },
];

// Trending Widget (sidebar)
export function TrendingWidget({ className, limit = 5 }: { className?: string; limit?: number }) {
  const [items, setItems] = useState<TrendingItem[]>(sampleTrending.slice(0, limit));

  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Flame className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-foreground">Trending Now</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <Link
            key={item.id}
            to={`/${item.type === 'review' ? 'reviews' : item.type === 'blog' ? 'blog' : 'guides'}/${item.slug}`}
            className="flex items-start gap-3 group"
          >
            <span className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
              index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-orange-900' :
              'bg-muted text-muted-foreground'
            )}>
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {(item.views / 1000).toFixed(1)}k
                </span>
                <span className="flex items-center gap-0.5 text-green-500">
                  <ArrowUp className="w-3 h-3" />
                  {item.viewsChange}%
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link
        to="/trending"
        className="block mt-4 pt-4 border-t border-border text-sm text-primary hover:underline text-center"
      >
        View all trending
      </Link>
    </div>
  );
}

// Trending Section (full page)
export function TrendingSection({ className }: { className?: string }) {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [items, setItems] = useState<TrendingItem[]>(sampleTrending);

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Trending Content</h2>
            <p className="text-sm text-muted-foreground">Most popular right now</p>
          </div>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {(['today', 'week', 'month'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors capitalize',
                timeframe === t ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => (
          <Link
            key={item.id}
            to={`/${item.type === 'review' ? 'reviews' : item.type === 'blog' ? 'blog' : 'guides'}/${item.slug}`}
            className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Rank badge */}
            <div className={cn(
              'absolute top-3 left-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
              index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-orange-900' :
              'bg-background/90 backdrop-blur text-foreground'
            )}>
              #{index + 1}
            </div>

            {/* Trend score */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 bg-background/90 backdrop-blur rounded-full text-xs">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="font-medium text-foreground">{item.trendScore}</span>
            </div>

            {/* Image placeholder */}
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50" />

            {/* Content */}
            <div className="p-4">
              <Badge variant="secondary" className="mb-2 text-xs">
                {item.category}
              </Badge>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                {item.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {(item.views / 1000).toFixed(1)}k views
                </span>
                <span className="flex items-center gap-1 text-green-500">
                  <ArrowUp className="w-3 h-3" />
                  {item.viewsChange}%
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {item.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.readTime}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Trending Banner (homepage hero)
export function TrendingBanner({ className }: { className?: string }) {
  const topItem = sampleTrending[0];

  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500', className)}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-white animate-pulse" />
          <span className="text-white/90 font-medium">Trending #1</span>
        </div>
        <Link to={`/reviews/${topItem.slug}`}>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 hover:underline">
            {topItem.title}
          </h2>
        </Link>
        <div className="flex items-center gap-4 text-white/80 text-sm">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {(topItem.views / 1000).toFixed(1)}k views
          </span>
          <span className="flex items-center gap-1">
            <ArrowUp className="w-4 h-4 text-green-400" />
            {topItem.viewsChange}% this week
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {topItem.comments} comments
          </span>
        </div>
      </div>
    </div>
  );
}

export default TrendingSection;
