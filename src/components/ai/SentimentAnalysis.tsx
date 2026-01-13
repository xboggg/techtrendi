import { useState, useEffect } from 'react';
import {
  SmilePlus,
  Meh,
  Frown,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SentimentResult {
  score: number; // -1 to 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
  aspects: AspectSentiment[];
  emotions: EmotionScore[];
  keywords: KeywordSentiment[];
}

interface AspectSentiment {
  aspect: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
}

interface EmotionScore {
  emotion: string;
  score: number;
}

interface KeywordSentiment {
  keyword: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  count: number;
}

// Sentiment analysis engine (simulated - in production, use AI API)
const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const words = text.toLowerCase().split(/\s+/);

  // Positive and negative word lists
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'perfect', 'awesome', 'fantastic', 'wonderful', 'good', 'nice', 'brilliant', 'outstanding', 'superb', 'impressive', 'recommend', 'fast', 'smooth', 'beautiful', 'quality'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor', 'horrible', 'disappointing', 'slow', 'broken', 'useless', 'waste', 'expensive', 'overpriced', 'cheap', 'frustrating', 'annoying', 'difficult', 'problem', 'issue'];

  let positiveCount = 0;
  let negativeCount = 0;
  const foundKeywords: KeywordSentiment[] = [];

  words.forEach((word) => {
    if (positiveWords.includes(word)) {
      positiveCount++;
      const existing = foundKeywords.find((k) => k.keyword === word);
      if (existing) {
        existing.count++;
      } else {
        foundKeywords.push({ keyword: word, sentiment: 'positive', count: 1 });
      }
    }
    if (negativeWords.includes(word)) {
      negativeCount++;
      const existing = foundKeywords.find((k) => k.keyword === word);
      if (existing) {
        existing.count++;
      } else {
        foundKeywords.push({ keyword: word, sentiment: 'negative', count: 1 });
      }
    }
  });

  const totalSentimentWords = positiveCount + negativeCount;
  const score = totalSentimentWords > 0
    ? (positiveCount - negativeCount) / totalSentimentWords
    : 0;

  const label: 'positive' | 'neutral' | 'negative' =
    score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

  // Detect aspects (simplified)
  const aspects: AspectSentiment[] = [];
  const aspectPatterns = [
    { keywords: ['battery', 'charge', 'power'], aspect: 'Battery' },
    { keywords: ['camera', 'photo', 'picture', 'video'], aspect: 'Camera' },
    { keywords: ['screen', 'display', 'resolution'], aspect: 'Display' },
    { keywords: ['speed', 'fast', 'slow', 'performance', 'lag'], aspect: 'Performance' },
    { keywords: ['price', 'cost', 'expensive', 'cheap', 'value'], aspect: 'Price' },
    { keywords: ['design', 'look', 'build', 'material'], aspect: 'Design' },
  ];

  aspectPatterns.forEach(({ keywords, aspect }) => {
    const hasAspect = keywords.some((k) => text.toLowerCase().includes(k));
    if (hasAspect) {
      // Check sentiment around aspect keywords
      let aspectScore = score; // Default to overall score
      aspects.push({
        aspect,
        sentiment: aspectScore > 0.1 ? 'positive' : aspectScore < -0.1 ? 'negative' : 'neutral',
        score: aspectScore,
      });
    }
  });

  // Emotion detection (simplified)
  const emotions: EmotionScore[] = [
    { emotion: 'Joy', score: Math.max(0, score * 0.8 + Math.random() * 0.2) },
    { emotion: 'Trust', score: Math.max(0, score * 0.6 + Math.random() * 0.3) },
    { emotion: 'Anticipation', score: Math.random() * 0.5 },
    { emotion: 'Surprise', score: Math.random() * 0.3 },
    { emotion: 'Sadness', score: Math.max(0, -score * 0.5 + Math.random() * 0.2) },
    { emotion: 'Anger', score: Math.max(0, -score * 0.4 + Math.random() * 0.1) },
  ];

  return {
    score,
    label,
    confidence: 0.7 + Math.random() * 0.25,
    aspects: aspects.slice(0, 4),
    emotions: emotions.sort((a, b) => b.score - a.score).slice(0, 4),
    keywords: foundKeywords.sort((a, b) => b.count - a.count).slice(0, 6),
  };
};

// Sentiment Analysis Widget
export function SentimentAnalysisWidget({
  text,
  className,
  showDetails = true,
}: {
  text: string;
  className?: string;
  showDetails?: boolean;
}) {
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const sentimentResult = await analyzeSentiment(text);
      setResult(sentimentResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (text && text.length > 20) {
      analyze();
    }
  }, [text]);

  const getSentimentIcon = () => {
    if (!result) return <Meh className="w-5 h-5" />;
    switch (result.label) {
      case 'positive':
        return <SmilePlus className="w-5 h-5 text-green-500" />;
      case 'negative':
        return <Frown className="w-5 h-5 text-red-500" />;
      default:
        return <Meh className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getSentimentColor = () => {
    if (!result) return 'bg-muted';
    switch (result.label) {
      case 'positive':
        return 'bg-green-500';
      case 'negative':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className={cn('p-4 bg-card border border-border rounded-xl', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Sentiment Analysis</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={analyze}
          disabled={isAnalyzing || !text.trim()}
        >
          <RefreshCw className={cn('w-4 h-4', isAnalyzing && 'animate-spin')} />
        </Button>
      </div>

      {isAnalyzing ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : result ? (
        <div className="space-y-4">
          {/* Overall Sentiment */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            {getSentimentIcon()}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium capitalize">{result.label}</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all', getSentimentColor())}
                  style={{ width: `${Math.abs(result.score) * 50 + 50}%` }}
                />
              </div>
            </div>
          </div>

          {showDetails && (
            <>
              {/* Aspect Sentiments */}
              {result.aspects.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    Aspect Analysis
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sentiment breakdown by topic</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {result.aspects.map((aspect) => (
                      <div
                        key={aspect.aspect}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded"
                      >
                        <span className="text-xs">{aspect.aspect}</span>
                        <Badge
                          variant={
                            aspect.sentiment === 'positive'
                              ? 'default'
                              : aspect.sentiment === 'negative'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {aspect.sentiment === 'positive' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : aspect.sentiment === 'negative' ? (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          ) : (
                            <Minus className="w-3 h-3 mr-1" />
                          )}
                          {aspect.sentiment}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotions */}
              {result.emotions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Detected Emotions</h4>
                  <div className="space-y-2">
                    {result.emotions.map((emotion) => (
                      <div key={emotion.emotion} className="flex items-center gap-2">
                        <span className="text-xs w-20">{emotion.emotion}</span>
                        <Progress value={emotion.score * 100} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground w-8">
                          {Math.round(emotion.score * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {result.keywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Sentiment Words</h4>
                  <div className="flex flex-wrap gap-1">
                    {result.keywords.map((kw) => (
                      <Badge
                        key={kw.keyword}
                        variant={kw.sentiment === 'positive' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {kw.keyword} ({kw.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Enter text to analyze sentiment
        </p>
      )}
    </div>
  );
}

// Comment Sentiment Badge
export function CommentSentimentBadge({ text }: { text: string }) {
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative' | null>(null);

  useEffect(() => {
    if (text && text.length > 10) {
      analyzeSentiment(text).then((result) => setSentiment(result.label));
    }
  }, [text]);

  if (!sentiment) return null;

  return (
    <Badge
      variant={
        sentiment === 'positive'
          ? 'default'
          : sentiment === 'negative'
          ? 'destructive'
          : 'secondary'
      }
      className="text-xs"
    >
      {sentiment === 'positive' ? (
        <SmilePlus className="w-3 h-3 mr-1" />
      ) : sentiment === 'negative' ? (
        <Frown className="w-3 h-3 mr-1" />
      ) : (
        <Meh className="w-3 h-3 mr-1" />
      )}
      {sentiment}
    </Badge>
  );
}

// Batch Sentiment Analysis for Reviews
export function ReviewsSentimentSummary({
  reviews,
  className,
}: {
  reviews: { id: string; content: string }[];
  className?: string;
}) {
  const [summary, setSummary] = useState<{
    positive: number;
    neutral: number;
    negative: number;
    avgScore: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeAll = async () => {
    setIsAnalyzing(true);
    try {
      const results = await Promise.all(
        reviews.map((r) => analyzeSentiment(r.content))
      );

      const counts = {
        positive: results.filter((r) => r.label === 'positive').length,
        neutral: results.filter((r) => r.label === 'neutral').length,
        negative: results.filter((r) => r.label === 'negative').length,
      };

      const avgScore =
        results.reduce((sum, r) => sum + r.score, 0) / results.length;

      setSummary({ ...counts, avgScore });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (reviews.length > 0) {
      analyzeAll();
    }
  }, [reviews]);

  if (!summary) {
    return (
      <div className={cn('p-4 bg-card border border-border rounded-xl', className)}>
        <div className="flex items-center justify-center py-4">
          {isAnalyzing ? (
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-sm text-muted-foreground">No reviews to analyze</p>
          )}
        </div>
      </div>
    );
  }

  const total = summary.positive + summary.neutral + summary.negative;

  return (
    <div className={cn('p-4 bg-card border border-border rounded-xl', className)}>
      <h4 className="font-medium mb-3">Review Sentiment Summary</h4>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SmilePlus className="w-4 h-4 text-green-500" />
          <span className="text-sm w-16">Positive</span>
          <Progress value={(summary.positive / total) * 100} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground w-12">
            {Math.round((summary.positive / total) * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Meh className="w-4 h-4 text-yellow-500" />
          <span className="text-sm w-16">Neutral</span>
          <Progress value={(summary.neutral / total) * 100} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground w-12">
            {Math.round((summary.neutral / total) * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Frown className="w-4 h-4 text-red-500" />
          <span className="text-sm w-16">Negative</span>
          <Progress value={(summary.negative / total) * 100} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground w-12">
            {Math.round((summary.negative / total) * 100)}%
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Based on {total} reviews • Average score: {(summary.avgScore * 100).toFixed(0)}%
      </p>
    </div>
  );
}

export default SentimentAnalysisWidget;
