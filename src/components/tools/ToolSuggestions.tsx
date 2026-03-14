import { Link } from 'react-router-dom';
import { allTools, Tool, getToolsByCategory } from '@/data/tools';
import { useTools } from '@/contexts/ToolsContext';
import { Crown, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolSuggestionsProps {
  currentToolId: string;
  maxSuggestions?: number;
  className?: string;
}

const TierBadge = ({ tier }: { tier: string }) => {
  if (tier === "free") {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400">
        Free
      </span>
    );
  }
  if (tier === "free-account") {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
        Free+
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
      <Crown className="w-2.5 h-2.5" />
      Pro
    </span>
  );
};

export function ToolSuggestions({ currentToolId, maxSuggestions = 4, className }: ToolSuggestionsProps) {
  const { isFavorite, toggleFavorite, recordToolUse } = useTools();

  // Get current tool
  const currentTool = allTools.find(t => t.id === currentToolId);
  if (!currentTool) return null;

  // Get suggestions from same category, excluding current tool
  const sameCategory = getToolsByCategory(currentTool.categoryId)
    .filter(t => t.id !== currentToolId);

  // Get some tools from complementary categories
  const complementaryCategories: Record<string, string[]> = {
    business: ['productivity', 'career'],
    productivity: ['business', 'career'],
    career: ['business', 'productivity'],
    creator: ['design', 'business'],
    developer: ['design', 'productivity'],
    security: ['developer', 'productivity'],
    design: ['creator', 'developer'],
    other: ['productivity', 'design'],
  };

  const complementary = (complementaryCategories[currentTool.categoryId] || [])
    .flatMap(catId => getToolsByCategory(catId))
    .filter(t => t.id !== currentToolId)
    .slice(0, 4);

  // Combine and dedupe
  const suggestions = [...sameCategory, ...complementary]
    .filter((tool, index, self) => self.findIndex(t => t.id === tool.id) === index)
    .slice(0, maxSuggestions);

  if (suggestions.length === 0) return null;

  const handleToolClick = (tool: Tool) => {
    recordToolUse(tool.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(toolId);
  };

  return (
    <div className={cn("py-8", className)}>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">You might also like</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {suggestions.map((tool) => (
          <Link
            key={tool.id}
            to={tool.href}
            onClick={() => handleToolClick(tool)}
            className="group relative flex flex-col p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
          >
            {/* Icon & Badge Row */}
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-gradient-to-br",
                tool.gradient
              )}>
                <tool.icon className="w-5 h-5 text-white" />
              </div>

              <div className="flex items-center gap-1.5">
                {tool.isNew && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500 text-white">
                    NEW
                  </span>
                )}
                <TierBadge tier={tool.tier} />
              </div>
            </div>

            {/* Content */}
            <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              {tool.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">
              {tool.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">{tool.category}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleFavoriteClick(e, tool.id)}
                  className={cn(
                    "p-1 rounded-lg transition-all",
                    isFavorite(tool.id)
                      ? "text-red-500 hover:bg-red-500/10"
                      : "text-muted-foreground hover:text-red-500 hover:bg-muted"
                  )}
                >
                  <Heart className={cn("w-3.5 h-3.5", isFavorite(tool.id) && "fill-current")} />
                </button>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ToolSuggestions;
