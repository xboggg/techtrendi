import { useState, useEffect } from 'react';
import {
  Tags,
  Sparkles,
  Plus,
  X,
  RefreshCw,
  Check,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SuggestedTag {
  tag: string;
  confidence: number;
  category: string;
}

interface TagCategory {
  name: string;
  color: string;
  tags: string[];
}

// Tag categories for tech content
const tagCategories: TagCategory[] = [
  {
    name: 'Device Type',
    color: 'blue',
    tags: ['smartphone', 'laptop', 'tablet', 'smartwatch', 'headphones', 'camera', 'tv', 'gaming', 'pc', 'accessories'],
  },
  {
    name: 'Brand',
    color: 'purple',
    tags: ['apple', 'samsung', 'google', 'microsoft', 'sony', 'lg', 'oneplus', 'xiaomi', 'asus', 'dell', 'hp', 'lenovo'],
  },
  {
    name: 'Feature',
    color: 'green',
    tags: ['5g', 'ai', 'oled', 'wireless', 'bluetooth', 'usb-c', 'fast-charging', 'waterproof', 'foldable', 'touchscreen'],
  },
  {
    name: 'Topic',
    color: 'orange',
    tags: ['review', 'comparison', 'guide', 'tutorial', 'news', 'deal', 'unboxing', 'benchmark', 'tips', 'troubleshooting'],
  },
  {
    name: 'Security',
    color: 'red',
    tags: ['privacy', 'security', 'vpn', 'encryption', 'password', 'antivirus', 'malware', 'phishing', 'two-factor', 'data-protection'],
  },
];

// AI tag extraction (simulated - in production, use AI API)
const extractTags = async (
  title: string,
  content: string
): Promise<SuggestedTag[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const combinedText = `${title} ${content}`.toLowerCase();
  const suggestions: SuggestedTag[] = [];

  // Check for tag matches
  tagCategories.forEach((category) => {
    category.tags.forEach((tag) => {
      const regex = new RegExp(`\\b${tag.replace('-', '[- ]?')}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        const confidence = Math.min(0.95, 0.5 + matches.length * 0.15);
        suggestions.push({
          tag,
          confidence,
          category: category.name,
        });
      }
    });
  });

  // Add contextual tags based on patterns
  if (combinedText.includes('vs') || combinedText.includes('versus') || combinedText.includes('compare')) {
    suggestions.push({ tag: 'comparison', confidence: 0.9, category: 'Topic' });
  }
  if (combinedText.includes('how to') || combinedText.includes('step by step')) {
    suggestions.push({ tag: 'tutorial', confidence: 0.88, category: 'Topic' });
  }
  if (combinedText.includes('best') && combinedText.includes('2024')) {
    suggestions.push({ tag: 'buying-guide', confidence: 0.85, category: 'Topic' });
  }
  if (combinedText.includes('review') || combinedText.includes('tested')) {
    suggestions.push({ tag: 'review', confidence: 0.92, category: 'Topic' });
  }

  // Remove duplicates and sort by confidence
  const uniqueTags = suggestions.reduce((acc, curr) => {
    if (!acc.find((t) => t.tag === curr.tag)) {
      acc.push(curr);
    }
    return acc;
  }, [] as SuggestedTag[]);

  return uniqueTags.sort((a, b) => b.confidence - a.confidence);
};

// Auto-Tagging Widget
export function AutoTaggingWidget({
  title,
  content,
  existingTags = [],
  onTagsChange,
  className,
}: {
  title: string;
  content: string;
  existingTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<SuggestedTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(existingTags);
  const [customTag, setCustomTag] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = async () => {
    if (!title && !content) return;
    setIsAnalyzing(true);
    try {
      const tags = await extractTags(title, content);
      setSuggestions(tags);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (title || content) {
      analyze();
    }
  }, [title, content]);

  useEffect(() => {
    onTagsChange?.(selectedTags);
  }, [selectedTags, onTagsChange]);

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const addCustomTag = () => {
    const tag = customTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setCustomTag('');
    }
  };

  const acceptAllSuggestions = () => {
    const newTags = suggestions
      .filter((s) => s.confidence >= 0.7)
      .map((s) => s.tag)
      .filter((t) => !selectedTags.includes(t));
    setSelectedTags([...selectedTags, ...newTags]);
  };

  const getCategoryColor = (category: string) => {
    const cat = tagCategories.find((c) => c.name === category);
    return cat?.color || 'gray';
  };

  return (
    <div className={cn('p-4 bg-card border border-border rounded-xl', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Auto-Tagging</h3>
            <p className="text-xs text-muted-foreground">Smart tag suggestions</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={analyze}
          disabled={isAnalyzing || (!title && !content)}
        >
          <RefreshCw className={cn('w-4 h-4', isAnalyzing && 'animate-spin')} />
        </Button>
      </div>

      {/* Selected Tags */}
      <div className="mb-4">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Selected Tags ({selectedTags.length})
        </label>
        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-muted/30 rounded-lg">
          {selectedTags.length === 0 ? (
            <span className="text-xs text-muted-foreground">No tags selected</span>
          ) : (
            selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs gap-1">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Suggestions
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={acceptAllSuggestions}
              className="h-6 text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Accept High Confidence
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <TooltipProvider key={suggestion.tag}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => addTag(suggestion.tag)}
                      disabled={selectedTags.includes(suggestion.tag)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all',
                        selectedTags.includes(suggestion.tag)
                          ? 'bg-primary/20 text-primary cursor-not-allowed'
                          : 'bg-muted hover:bg-muted/80 cursor-pointer'
                      )}
                    >
                      {selectedTags.includes(suggestion.tag) ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      {suggestion.tag}
                      <span
                        className={cn(
                          'ml-1 px-1 rounded text-[10px]',
                          suggestion.confidence >= 0.8
                            ? 'bg-green-500/20 text-green-600'
                            : suggestion.confidence >= 0.6
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : 'bg-gray-500/20 text-gray-600'
                        )}
                      >
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Category: {suggestion.category}</p>
                    <p>Confidence: {Math.round(suggestion.confidence * 100)}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}

      {/* Custom Tag Input */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Add Custom Tag
        </label>
        <div className="flex gap-2">
          <Input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="Enter custom tag..."
            className="flex-1 h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomTag();
              }
            }}
          />
          <Button
            size="sm"
            onClick={addCustomTag}
            disabled={!customTag.trim()}
            className="h-8"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tag Categories Browser */}
      <div className="mt-4 pt-4 border-t border-border">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Browse Categories
        </label>
        <div className="space-y-2">
          {tagCategories.map((category) => (
            <details key={category.name} className="group">
              <summary className="cursor-pointer text-xs font-medium flex items-center gap-2 py-1">
                <Tags className={`w-3 h-3 text-${category.color}-500`} />
                {category.name}
                <span className="text-muted-foreground">({category.tags.length})</span>
              </summary>
              <div className="flex flex-wrap gap-1 mt-2 ml-5">
                {category.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    disabled={selectedTags.includes(tag)}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded transition-all',
                      selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline Tag Suggestions
export function InlineTagSuggestions({
  title,
  content,
  onSelectTag,
  className,
}: {
  title: string;
  content: string;
  onSelectTag: (tag: string) => void;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<SuggestedTag[]>([]);

  useEffect(() => {
    if (title || content) {
      extractTags(title, content).then((tags) =>
        setSuggestions(tags.slice(0, 5))
      );
    }
  }, [title, content]);

  if (suggestions.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Sparkles className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Suggested:</span>
      {suggestions.map((s) => (
        <button
          key={s.tag}
          onClick={() => onSelectTag(s.tag)}
          className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {s.tag}
        </button>
      ))}
    </div>
  );
}

// Tag Analytics
export function TagAnalytics({
  tags,
  className,
}: {
  tags: { tag: string; count: number }[];
  className?: string;
}) {
  const sortedTags = [...tags].sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...tags.map((t) => t.count));

  return (
    <div className={cn('p-4 bg-card border border-border rounded-xl', className)}>
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <Tags className="w-4 h-4" />
        Popular Tags
      </h4>
      <div className="space-y-2">
        {sortedTags.slice(0, 10).map((item) => (
          <div key={item.tag} className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs min-w-[80px]">
              {item.tag}
            </Badge>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AutoTaggingWidget;
