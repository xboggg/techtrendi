import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RatingCategory {
  name: string;
  score: number;
  maxScore: number;
  weight?: number;
  description?: string;
}

interface UserRating {
  id: string;
  user: { name: string; avatar?: string; verified?: boolean };
  overall: number;
  categories: { name: string; score: number }[];
  title?: string;
  review?: string;
  date: string;
  helpful: number;
  notHelpful: number;
}

interface RatingBreakdownProps {
  overallScore: number;
  maxScore?: number;
  categories: RatingCategory[];
  userRatings?: UserRating[];
  totalReviews?: number;
  distribution?: { stars: number; count: number }[];
  className?: string;
}

export function RatingBreakdown({
  overallScore,
  maxScore = 10,
  categories,
  userRatings = [],
  totalReviews = 0,
  distribution = [],
  className,
}: RatingBreakdownProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('helpful');

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 5);
  const maxDistribution = Math.max(...distribution.map((d) => d.count), 1);

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-500 bg-green-500';
    if (percentage >= 60) return 'text-yellow-500 bg-yellow-500';
    if (percentage >= 40) return 'text-orange-500 bg-orange-500';
    return 'text-red-500 bg-red-500';
  };

  const getScoreLabel = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'Exceptional';
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 70) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 50) return 'Average';
    if (percentage >= 40) return 'Below Average';
    return 'Poor';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Score */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Score Circle */}
          <div className="flex flex-col items-center justify-center">
            <div
              className={cn(
                'w-32 h-32 rounded-full flex flex-col items-center justify-center',
                getScoreColor(overallScore, maxScore).replace('text-', 'bg-').replace('bg-', 'bg-') + '/10'
              )}
            >
              <span className={cn('text-4xl font-bold', getScoreColor(overallScore, maxScore).split(' ')[0])}>
                {overallScore.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/ {maxScore}</span>
            </div>
            <Badge className="mt-3" variant="secondary">
              <Award className="w-3 h-3 mr-1" />
              {getScoreLabel(overallScore, maxScore)}
            </Badge>
          </div>

          {/* Distribution */}
          {distribution.length > 0 && (
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-3">Rating Distribution</h4>
              <div className="space-y-2">
                {distribution
                  .sort((a, b) => b.stars - a.stars)
                  .map((d) => (
                    <div key={d.stars} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm">{d.stars}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                          style={{ width: `${(d.count / maxDistribution) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{d.count}</span>
                    </div>
                  ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Based on {totalReviews} reviews
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h4 className="font-medium text-foreground mb-4">Score Breakdown</h4>
        <div className="space-y-4">
          {visibleCategories.map((category) => {
            const percentage = (category.score / category.maxScore) * 100;
            return (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{category.name}</span>
                    {category.weight && (
                      <Badge variant="outline" className="text-xs">
                        {category.weight}%
                      </Badge>
                    )}
                  </div>
                  <span className={cn('font-semibold', getScoreColor(category.score, category.maxScore).split(' ')[0])}>
                    {category.score.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      getScoreColor(category.score, category.maxScore).split(' ')[1]
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {category.description && (
                  <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                )}
              </div>
            );
          })}
        </div>
        {categories.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="w-full mt-4"
          >
            {showAllCategories ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show All ({categories.length - 5} more)
              </>
            )}
          </Button>
        )}
      </div>

      {/* User Reviews */}
      {userRatings.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground">User Reviews</h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
            >
              <option value="helpful">Most Helpful</option>
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>
          <div className="space-y-4">
            {userRatings.map((rating) => (
              <UserReviewCard key={rating.id} rating={rating} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// User Review Card
function UserReviewCard({ rating }: { rating: UserRating }) {
  const [expanded, setExpanded] = useState(false);
  const [helpfulVote, setHelpfulVote] = useState<'up' | 'down' | null>(null);

  return (
    <div className="border-b border-border last:border-0 pb-4 last:pb-0">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          {rating.user.avatar ? (
            <img src={rating.user.avatar} alt={rating.user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-medium">{rating.user.name[0]}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{rating.user.name}</span>
            {rating.user.verified && (
              <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-4 h-4',
                    star <= rating.overall
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {new Date(rating.date).toLocaleDateString()}
            </span>
          </div>
          {rating.title && (
            <h5 className="font-medium text-foreground mt-2">{rating.title}</h5>
          )}
          {rating.review && (
            <p className={cn('text-sm text-muted-foreground mt-1', !expanded && 'line-clamp-3')}>
              {rating.review}
            </p>
          )}
          {rating.review && rating.review.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-primary hover:underline mt-1"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm text-muted-foreground">Was this helpful?</span>
            <button
              onClick={() => setHelpfulVote(helpfulVote === 'up' ? null : 'up')}
              className={cn(
                'flex items-center gap-1 text-sm transition-colors',
                helpfulVote === 'up' ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ThumbsUp className="w-4 h-4" />
              {rating.helpful + (helpfulVote === 'up' ? 1 : 0)}
            </button>
            <button
              onClick={() => setHelpfulVote(helpfulVote === 'down' ? null : 'down')}
              className={cn(
                'flex items-center gap-1 text-sm transition-colors',
                helpfulVote === 'down' ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ThumbsDown className="w-4 h-4" />
              {rating.notHelpful + (helpfulVote === 'down' ? 1 : 0)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Score Badge
export function ScoreBadge({
  score,
  maxScore = 10,
  size = 'md',
  showLabel = false,
  className,
}: {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}) {
  const percentage = (score / maxScore) * 100;
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500 text-white';
    if (percentage >= 60) return 'bg-yellow-500 text-white';
    if (percentage >= 40) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-lg flex items-center justify-center font-bold',
          getColor(),
          sizes[size]
        )}
      >
        {score.toFixed(size === 'sm' ? 0 : 1)}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">/ {maxScore}</span>
      )}
    </div>
  );
}

// Star Rating Input
export function StarRatingInput({
  value,
  onChange,
  max = 5,
  size = 'md',
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('flex gap-1', className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(null)}
          onClick={() => onChange(star)}
          className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          <Star
            className={cn(
              sizes[size],
              'transition-colors',
              star <= (hoverValue ?? value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground hover:text-yellow-200'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default RatingBreakdown;
