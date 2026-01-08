import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReadingHistory } from '@/components/ui/reading-history';
import { useBookmarks } from '@/components/ui/bookmark-system';
import {
  Sparkles,
  Brain,
  Target,
  Zap,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AIRecommendation {
  id: string;
  title: string;
  slug: string;
  type: 'review' | 'blog' | 'guide' | 'tool';
  category: string;
  matchScore: number;
  reason: string;
  image?: string;
}

interface UserProfile {
  interests: string[];
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredCategories: string[];
  averageReadTime: number;
}

// Sample AI recommendations
const sampleRecommendations: AIRecommendation[] = [
  {
    id: '1',
    title: 'Best Privacy-Focused Smartphones 2024',
    slug: 'privacy-focused-smartphones-2024',
    type: 'guide',
    category: 'Security',
    matchScore: 95,
    reason: 'Based on your interest in security and smartphone reviews',
  },
  {
    id: '2',
    title: 'How to Set Up a Home VPN Server',
    slug: 'home-vpn-server-setup',
    type: 'guide',
    category: 'Security',
    matchScore: 92,
    reason: 'Matches your advanced technical reading level',
  },
  {
    id: '3',
    title: 'Samsung Galaxy S24 Ultra Review',
    slug: 'samsung-s24-ultra-review',
    type: 'review',
    category: 'Smartphones',
    matchScore: 88,
    reason: 'Similar to content you\'ve bookmarked',
  },
  {
    id: '4',
    title: 'Password Manager Comparison Tool',
    slug: 'password-manager-comparison',
    type: 'tool',
    category: 'Security',
    matchScore: 85,
    reason: 'Related to your recent searches',
  },
];

// AI Recommendations Widget
export function AIRecommendationsWidget({ className, limit = 4 }: { className?: string; limit?: number }) {
  const { user } = useAuth();
  const { history } = useReadingHistory();
  const { bookmarks } = useBookmarks();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike'>>({});

  useEffect(() => {
    // Simulate AI processing
    const generateRecommendations = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In production, this would call an AI service
      setRecommendations(sampleRecommendations.slice(0, limit));
      setIsLoading(false);
    };

    generateRecommendations();
  }, [history, bookmarks, limit]);

  const handleFeedback = (id: string, type: 'like' | 'dislike') => {
    setFeedback((prev) => ({ ...prev, [id]: type }));
    // In production, send feedback to improve recommendations
  };

  const refreshRecommendations = () => {
    setIsLoading(true);
    setTimeout(() => {
      setRecommendations([...sampleRecommendations].sort(() => Math.random() - 0.5).slice(0, limit));
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Picks for You</h3>
            <p className="text-xs text-muted-foreground">Personalized recommendations</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={refreshRecommendations} disabled={isLoading}>
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.id} className="group">
              <Link
                to={`/${rec.type === 'review' ? 'reviews' : rec.type === 'blog' ? 'blog' : rec.type === 'tool' ? 'tools' : 'guides'}/${rec.slug}`}
                className="flex gap-3"
              >
                <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center">
                  <Target className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {rec.category}
                    </Badge>
                    <span className="text-xs text-green-500 font-medium">{rec.matchScore}% match</span>
                  </div>
                  <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    <Lightbulb className="w-3 h-3 inline mr-1" />
                    {rec.reason}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-1 mt-2 ml-19">
                <button
                  onClick={() => handleFeedback(rec.id, 'like')}
                  className={cn(
                    'p-1 rounded hover:bg-muted transition-colors',
                    feedback[rec.id] === 'like' && 'text-green-500'
                  )}
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleFeedback(rec.id, 'dislike')}
                  className={cn(
                    'p-1 rounded hover:bg-muted transition-colors',
                    feedback[rec.id] === 'dislike' && 'text-red-500'
                  )}
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/recommendations"
        className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border text-sm text-primary hover:underline"
      >
        View all recommendations
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// AI Content Summary
export function AIContentSummary({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const generateSummary = () => {
    setIsGenerating(true);
    // Simulate AI summarization
    setTimeout(() => {
      // Simple extractive summary (in production, use AI API)
      const sentences = content.split('.').filter((s) => s.trim().length > 20);
      const summaryText = sentences.slice(0, 3).join('. ') + '.';
      setSummary(summaryText || 'This article provides insights on the topic with detailed analysis and practical recommendations.');
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className={cn('p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <span className="font-medium text-foreground">AI Summary</span>
      </div>

      {summary ? (
        <>
          <p className={cn('text-sm text-muted-foreground', !showFull && 'line-clamp-3')}>
            {summary}
          </p>
          {summary.length > 200 && (
            <button
              onClick={() => setShowFull(!showFull)}
              className="text-sm text-primary hover:underline mt-2"
            >
              {showFull ? 'Show less' : 'Read more'}
            </button>
          )}
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummary}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Generate Summary
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Smart Search Suggestions
export function SmartSearchSuggestions({
  query,
  onSelect,
  className,
}: {
  query: string;
  onSelect: (suggestion: string) => void;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Simulate AI-powered suggestions
    const baseSuggestions = [
      `${query} review`,
      `${query} comparison`,
      `${query} vs`,
      `best ${query} 2024`,
      `${query} buying guide`,
      `${query} alternatives`,
    ];

    setSuggestions(baseSuggestions.slice(0, 5));
  }, [query]);

  if (suggestions.length === 0) return null;

  return (
    <div className={cn('p-2 bg-card border border-border rounded-lg shadow-lg', className)}>
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground mb-1">
        <Sparkles className="w-3 h-3" />
        AI Suggestions
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

export default AIRecommendationsWidget;
