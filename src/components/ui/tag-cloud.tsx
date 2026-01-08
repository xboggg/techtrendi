import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Tag {
  name: string;
  count: number;
  href?: string;
}

interface TagCloudProps {
  tags: Tag[];
  className?: string;
  maxSize?: number;
  minSize?: number;
  onTagClick?: (tag: Tag) => void;
  variant?: 'default' | 'bubble' | 'list';
}

export function TagCloud({
  tags,
  className,
  maxSize = 24,
  minSize = 12,
  onTagClick,
  variant = 'default',
}: TagCloudProps) {
  if (tags.length === 0) return null;

  const maxCount = Math.max(...tags.map((t) => t.count));
  const minCount = Math.min(...tags.map((t) => t.count));

  const getFontSize = (count: number) => {
    if (maxCount === minCount) return (maxSize + minSize) / 2;
    const scale = (count - minCount) / (maxCount - minCount);
    return minSize + scale * (maxSize - minSize);
  };

  const getOpacity = (count: number) => {
    if (maxCount === minCount) return 1;
    const scale = (count - minCount) / (maxCount - minCount);
    return 0.5 + scale * 0.5;
  };

  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {tags
          .sort((a, b) => b.count - a.count)
          .map((tag) => (
            <TagItem key={tag.name} tag={tag} onTagClick={onTagClick} variant="list" />
          ))}
      </div>
    );
  }

  if (variant === 'bubble') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {tags.map((tag) => (
          <TagItem
            key={tag.name}
            tag={tag}
            onTagClick={onTagClick}
            variant="bubble"
            size={getFontSize(tag.count)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-x-4 gap-y-2', className)}>
      {tags.map((tag) => (
        <TagItem
          key={tag.name}
          tag={tag}
          onTagClick={onTagClick}
          variant="default"
          size={getFontSize(tag.count)}
          opacity={getOpacity(tag.count)}
        />
      ))}
    </div>
  );
}

interface TagItemProps {
  tag: Tag;
  onTagClick?: (tag: Tag) => void;
  variant: 'default' | 'bubble' | 'list';
  size?: number;
  opacity?: number;
}

function TagItem({ tag, onTagClick, variant, size, opacity }: TagItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onTagClick) {
      e.preventDefault();
      onTagClick(tag);
    }
  };

  const content = (
    <>
      {variant === 'list' ? (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
          <span className="text-foreground">{tag.name}</span>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tag.count}
          </span>
        </div>
      ) : variant === 'bubble' ? (
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
          style={{ fontSize: size ? `${size}px` : undefined }}
        >
          {tag.name}
          <span className="text-xs text-muted-foreground">({tag.count})</span>
        </span>
      ) : (
        <span
          className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          style={{
            fontSize: size ? `${size}px` : undefined,
            opacity: opacity,
          }}
        >
          {tag.name}
        </span>
      )}
    </>
  );

  if (tag.href && !onTagClick) {
    return (
      <Link to={tag.href} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className="block text-left">
      {content}
    </button>
  );
}

// Popular tags widget
interface PopularTagsProps {
  tags: Tag[];
  title?: string;
  limit?: number;
  className?: string;
}

export function PopularTags({
  tags,
  title = 'Popular Tags',
  limit = 10,
  className,
}: PopularTagsProps) {
  const sortedTags = [...tags].sort((a, b) => b.count - a.count).slice(0, limit);

  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map((tag) => (
          <Link
            key={tag.name}
            to={tag.href || `/tag/${encodeURIComponent(tag.name)}`}
            className="px-3 py-1.5 text-sm bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Trending tags with trend indicator
interface TrendingTag extends Tag {
  trend: 'up' | 'down' | 'stable';
  trendPercentage?: number;
}

interface TrendingTagsProps {
  tags: TrendingTag[];
  title?: string;
  className?: string;
}

export function TrendingTags({
  tags,
  title = 'Trending Topics',
  className,
}: TrendingTagsProps) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {tags.map((tag, index) => (
          <Link
            key={tag.name}
            to={tag.href || `/tag/${encodeURIComponent(tag.name)}`}
            className="flex items-center gap-3 group"
          >
            <span className="text-lg font-bold text-muted-foreground w-6">
              {index + 1}
            </span>
            <div className="flex-1">
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                {tag.name}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{tag.count.toLocaleString()} posts</span>
                {tag.trendPercentage !== undefined && (
                  <span
                    className={cn(
                      'flex items-center',
                      tag.trend === 'up' && 'text-green-500',
                      tag.trend === 'down' && 'text-red-500'
                    )}
                  >
                    {tag.trend === 'up' && '↑'}
                    {tag.trend === 'down' && '↓'}
                    {tag.trendPercentage}%
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TagCloud;
