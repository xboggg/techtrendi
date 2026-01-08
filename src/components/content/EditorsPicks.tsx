import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Star, Crown, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditorPick {
  id: string;
  title: string;
  slug: string;
  type: 'review' | 'blog' | 'guide' | 'tool';
  category: string;
  image?: string;
  rating?: number;
  excerpt: string;
  editorNote: string;
  author: string;
  publishedAt: string;
  badge: 'top-pick' | 'best-value' | 'premium-choice' | 'most-innovative';
}

interface FeaturedCollection {
  id: string;
  title: string;
  description: string;
  items: EditorPick[];
  color: string;
}

// Sample data
const samplePicks: EditorPick[] = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max-review',
    type: 'review',
    category: 'Smartphones',
    rating: 9.2,
    excerpt: 'The most powerful iPhone ever made with incredible camera capabilities.',
    editorNote: 'Best overall smartphone for most users in 2024.',
    author: 'Tech Team',
    publishedAt: '2024-01-10',
    badge: 'top-pick',
  },
  {
    id: '2',
    title: 'Google Pixel 8 Pro',
    slug: 'google-pixel-8-pro-review',
    type: 'review',
    category: 'Smartphones',
    rating: 8.8,
    excerpt: 'Pure Android experience with the best computational photography.',
    editorNote: 'Best value flagship with incredible AI features.',
    author: 'Tech Team',
    publishedAt: '2024-01-08',
    badge: 'best-value',
  },
  {
    id: '3',
    title: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra-review',
    type: 'review',
    category: 'Smartphones',
    rating: 9.0,
    excerpt: 'The ultimate Android powerhouse with S Pen and AI.',
    editorNote: 'Most feature-packed smartphone on the market.',
    author: 'Tech Team',
    publishedAt: '2024-01-12',
    badge: 'premium-choice',
  },
  {
    id: '4',
    title: 'OnePlus 12',
    slug: 'oneplus-12-review',
    type: 'review',
    category: 'Smartphones',
    rating: 8.5,
    excerpt: 'Flagship killer returns with Hasselblad cameras.',
    editorNote: 'Most innovative charging and display technology.',
    author: 'Tech Team',
    publishedAt: '2024-01-14',
    badge: 'most-innovative',
  },
];

const badgeConfig = {
  'top-pick': { label: "Editor's Top Pick", color: 'from-yellow-400 to-orange-500', icon: Award },
  'best-value': { label: 'Best Value', color: 'from-green-400 to-emerald-500', icon: Star },
  'premium-choice': { label: 'Premium Choice', color: 'from-purple-400 to-violet-500', icon: Crown },
  'most-innovative': { label: 'Most Innovative', color: 'from-blue-400 to-cyan-500', icon: Sparkles },
};

// Editor's Pick Card
function EditorPickCard({ pick, featured = false }: { pick: EditorPick; featured?: boolean }) {
  const badge = badgeConfig[pick.badge];
  const BadgeIcon = badge.icon;

  return (
    <Link
      to={`/reviews/${pick.slug}`}
      className={cn(
        'group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300',
        featured && 'md:col-span-2 md:row-span-2'
      )}
    >
      {/* Badge */}
      <div className={cn(
        'absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-medium bg-gradient-to-r',
        badge.color
      )}>
        <BadgeIcon className="w-3.5 h-3.5" />
        {badge.label}
      </div>

      {/* Image */}
      <div className={cn(
        'bg-gradient-to-br from-muted to-muted/50',
        featured ? 'aspect-[16/9]' : 'aspect-video'
      )} />

      {/* Content */}
      <div className={cn('p-5', featured && 'p-6')}>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {pick.category}
          </Badge>
          {pick.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span className="font-medium text-foreground">{pick.rating}</span>
            </div>
          )}
        </div>

        <h3 className={cn(
          'font-bold text-foreground group-hover:text-primary transition-colors mb-2',
          featured ? 'text-2xl' : 'text-lg'
        )}>
          {pick.title}
        </h3>

        <p className={cn(
          'text-muted-foreground mb-3',
          featured ? 'text-base' : 'text-sm line-clamp-2'
        )}>
          {pick.excerpt}
        </p>

        {/* Editor's Note */}
        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-medium">Editor's Note:</span> {pick.editorNote}
          </p>
        </div>
      </div>
    </Link>
  );
}

// Editor's Picks Grid
export function EditorsPicksGrid({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Editor's Picks</h2>
            <p className="text-sm text-muted-foreground">Hand-selected by our experts</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to="/editors-picks">
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {samplePicks.map((pick, index) => (
          <EditorPickCard key={pick.id} pick={pick} featured={index === 0} />
        ))}
      </div>
    </div>
  );
}

// Featured Section (horizontal scroll)
export function FeaturedSection({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-foreground">Featured Reviews</h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {samplePicks.map((pick) => (
          <Link
            key={pick.id}
            to={`/reviews/${pick.slug}`}
            className="flex-shrink-0 w-72 bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative">
              <div className={cn(
                'absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-medium bg-gradient-to-r',
                badgeConfig[pick.badge].color
              )}>
                {badgeConfig[pick.badge].label}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">{pick.category}</Badge>
                {pick.rating && (
                  <span className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    {pick.rating}
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-foreground mb-1">{pick.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{pick.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Editor's Choice Badge Component
export function EditorsChoiceBadge({
  type = 'top-pick',
  size = 'default',
  className,
}: {
  type?: keyof typeof badgeConfig;
  size?: 'small' | 'default' | 'large';
  className?: string;
}) {
  const badge = badgeConfig[type];
  const BadgeIcon = badge.icon;

  const sizeClasses = {
    small: 'px-2 py-1 text-xs gap-1',
    default: 'px-3 py-1.5 text-sm gap-1.5',
    large: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  return (
    <div className={cn(
      'inline-flex items-center rounded-full text-white font-medium bg-gradient-to-r',
      badge.color,
      sizeClasses[size],
      className
    )}>
      <BadgeIcon className={iconSizes[size]} />
      {badge.label}
    </div>
  );
}

// Sidebar Widget
export function EditorsPicksWidget({ className, limit = 3 }: { className?: string; limit?: number }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-foreground">Editor's Picks</h3>
      </div>
      <div className="space-y-3">
        {samplePicks.slice(0, limit).map((pick) => (
          <Link
            key={pick.id}
            to={`/reviews/${pick.slug}`}
            className="flex items-start gap-3 group"
          >
            <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white bg-gradient-to-r mb-1',
                badgeConfig[pick.badge].color
              )}>
                {badgeConfig[pick.badge].label}
              </div>
              <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {pick.title}
              </h4>
              {pick.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs font-medium text-foreground">{pick.rating}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      <Link
        to="/editors-picks"
        className="block mt-4 pt-4 border-t border-border text-sm text-primary hover:underline text-center"
      >
        View all picks
      </Link>
    </div>
  );
}

export default EditorsPicksGrid;
