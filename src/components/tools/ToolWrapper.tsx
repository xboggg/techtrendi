import { useEffect, ReactNode } from 'react';
import { useTools } from '@/contexts/ToolsContext';
import { ToolSuggestions } from './ToolSuggestions';
import { ShareButtons } from './ShareResults';
import { Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ToolWrapperProps {
  toolId: string;
  toolName: string;
  children: ReactNode;
  showSuggestions?: boolean;
  showRating?: boolean;
  className?: string;
}

export function ToolWrapper({
  toolId,
  toolName,
  children,
  showSuggestions = true,
  showRating = true,
  className
}: ToolWrapperProps) {
  const { recordToolUse, isFavorite, toggleFavorite, rateTool, getToolRating } = useTools();

  // Record tool use on mount
  useEffect(() => {
    recordToolUse(toolId);
  }, [toolId, recordToolUse]);

  const handleToggleFavorite = () => {
    toggleFavorite(toolId);
    if (!isFavorite(toolId)) {
      toast.success('Added to favorites!');
    } else {
      toast.success('Removed from favorites');
    }
  };

  const userRating = getToolRating(toolId);

  const handleRate = (rating: number) => {
    rateTool(toolId, rating);
    toast.success(`Rated ${rating} stars!`);
  };

  return (
    <div className={cn("", className)}>
      {children}

      {/* Tool Actions Bar */}
      <div className="container max-w-5xl mt-8 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4 py-4 px-6 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center gap-4">
            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                isFavorite(toolId)
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              )}
            >
              <Heart className={cn("w-4 h-4", isFavorite(toolId) && "fill-current")} />
              {isFavorite(toolId) ? 'Favorited' : 'Add to Favorites'}
            </button>

            {/* Share Buttons */}
            <ShareButtons toolName={toolName} />
          </div>

          {/* Rating */}
          {showRating && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rate this tool:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        "w-5 h-5 transition-colors",
                        userRating && star <= userRating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground hover:text-yellow-500"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tool Suggestions */}
      {showSuggestions && (
        <div className="container max-w-5xl">
          <ToolSuggestions currentToolId={toolId} maxSuggestions={4} />
        </div>
      )}
    </div>
  );
}

export default ToolWrapper;
