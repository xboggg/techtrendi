import { useState, useEffect } from 'react';
import { Heart, ThumbsUp, ThumbsDown, Laugh, Lightbulb, Fire, Bookmark, Share2, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Reaction {
  type: 'like' | 'love' | 'insightful' | 'funny' | 'fire';
  count: number;
  hasReacted: boolean;
}

interface ArticleReactionsProps {
  articleId: string;
  initialReactions?: Record<string, number>;
  onShare?: () => void;
  onComment?: () => void;
  className?: string;
}

const reactionConfig = {
  like: { icon: ThumbsUp, label: 'Like', color: 'text-blue-500' },
  love: { icon: Heart, label: 'Love', color: 'text-red-500' },
  insightful: { icon: Lightbulb, label: 'Insightful', color: 'text-yellow-500' },
  funny: { icon: Laugh, label: 'Funny', color: 'text-orange-500' },
  fire: { icon: Fire, label: 'Fire', color: 'text-orange-600' },
};

export function ArticleReactions({
  articleId,
  initialReactions = {},
  onShare,
  onComment,
  className,
}: ArticleReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, Reaction>>(() => {
    const stored = localStorage.getItem(`reactions_${articleId}`);
    const userReactions = stored ? JSON.parse(stored) : {};

    return Object.keys(reactionConfig).reduce((acc, type) => {
      acc[type] = {
        type: type as Reaction['type'],
        count: initialReactions[type] || Math.floor(Math.random() * 50),
        hasReacted: userReactions[type] || false,
      };
      return acc;
    }, {} as Record<string, Reaction>);
  });

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  useEffect(() => {
    const userReactions = Object.entries(reactions).reduce((acc, [type, data]) => {
      if (data.hasReacted) acc[type] = true;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem(`reactions_${articleId}`, JSON.stringify(userReactions));
  }, [reactions, articleId]);

  const toggleReaction = (type: string) => {
    setReactions((prev) => {
      const reaction = prev[type];
      const newHasReacted = !reaction.hasReacted;

      // If selecting a new reaction
      if (newHasReacted) {
        // Remove other reactions if any
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (key !== type && updated[key].hasReacted) {
            updated[key] = {
              ...updated[key],
              hasReacted: false,
              count: Math.max(0, updated[key].count - 1),
            };
          }
        });
        updated[type] = {
          ...reaction,
          hasReacted: true,
          count: reaction.count + 1,
        };
        setSelectedReaction(type);
        return updated;
      } else {
        setSelectedReaction(null);
        return {
          ...prev,
          [type]: {
            ...reaction,
            hasReacted: false,
            count: Math.max(0, reaction.count - 1),
          },
        };
      }
    });
    setShowReactionPicker(false);
  };

  const totalReactions = Object.values(reactions).reduce((sum, r) => sum + r.count, 0);

  return (
    <div className={cn('flex items-center justify-between py-4 border-y border-border', className)}>
      {/* Reaction counts */}
      <div className="flex items-center gap-4">
        {/* Main reaction button with picker */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
            onClick={() => toggleReaction(selectedReaction || 'like')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
              selectedReaction
                ? `bg-${selectedReaction === 'like' ? 'blue' : selectedReaction === 'love' ? 'red' : 'yellow'}-500/10`
                : 'hover:bg-muted'
            )}
          >
            {selectedReaction ? (
              <>
                {(() => {
                  const config = reactionConfig[selectedReaction as keyof typeof reactionConfig];
                  const Icon = config.icon;
                  return <Icon className={cn('w-5 h-5', config.color, 'fill-current')} />;
                })()}
                <span className={cn('font-medium', reactionConfig[selectedReaction as keyof typeof reactionConfig].color)}>
                  {reactionConfig[selectedReaction as keyof typeof reactionConfig].label}
                </span>
              </>
            ) : (
              <>
                <ThumbsUp className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Like</span>
              </>
            )}
          </button>

          {/* Reaction picker */}
          {showReactionPicker && (
            <div
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setShowReactionPicker(false)}
              className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-2 bg-card border border-border rounded-full shadow-lg"
            >
              {Object.entries(reactionConfig).map(([type, config]) => {
                const Icon = config.icon;
                const isSelected = reactions[type].hasReacted;
                return (
                  <button
                    key={type}
                    onClick={() => toggleReaction(type)}
                    className={cn(
                      'p-2 rounded-full transition-all hover:scale-125',
                      isSelected ? 'bg-muted' : 'hover:bg-muted'
                    )}
                    title={config.label}
                  >
                    <Icon className={cn('w-6 h-6', config.color, isSelected && 'fill-current')} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Total reactions display */}
        <div className="flex items-center -space-x-1">
          {Object.entries(reactions)
            .filter(([_, data]) => data.count > 0)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3)
            .map(([type, _]) => {
              const config = reactionConfig[type as keyof typeof reactionConfig];
              const Icon = config.icon;
              return (
                <div
                  key={type}
                  className={cn('w-6 h-6 rounded-full bg-card border-2 border-background flex items-center justify-center')}
                >
                  <Icon className={cn('w-3 h-3', config.color)} />
                </div>
              );
            })}
          {totalReactions > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {totalReactions.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onComment}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-muted transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">Comment</span>
        </button>
        <button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-muted transition-colors"
        >
          <Share2 className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">Share</span>
        </button>
      </div>
    </div>
  );
}

// Compact inline reactions
export function InlineReactions({ articleId, className }: { articleId: string; className?: string }) {
  const [reactions, setReactions] = useState(() => {
    const stored = localStorage.getItem(`reactions_${articleId}`);
    return stored ? JSON.parse(stored) : {};
  });

  const toggleReaction = (type: string) => {
    setReactions((prev: Record<string, boolean>) => {
      const updated = { ...prev, [type]: !prev[type] };
      localStorage.setItem(`reactions_${articleId}`, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Object.entries(reactionConfig).slice(0, 3).map(([type, config]) => {
        const Icon = config.icon;
        const isActive = reactions[type];
        return (
          <button
            key={type}
            onClick={() => toggleReaction(type)}
            className={cn(
              'p-1.5 rounded-full transition-colors',
              isActive ? 'bg-muted' : 'hover:bg-muted'
            )}
          >
            <Icon className={cn('w-4 h-4', isActive ? config.color : 'text-muted-foreground', isActive && 'fill-current')} />
          </button>
        );
      })}
    </div>
  );
}

// Floating reaction bar (sticky)
export function FloatingReactionBar({
  articleId,
  onShare,
  onComment,
  visible = true,
  className,
}: ArticleReactionsProps & { visible?: boolean }) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur border border-border rounded-full shadow-lg px-4 py-2',
        'animate-slide-up',
        className
      )}
    >
      <ArticleReactions
        articleId={articleId}
        onShare={onShare}
        onComment={onComment}
        className="border-none py-0"
      />
    </div>
  );
}

export default ArticleReactions;
