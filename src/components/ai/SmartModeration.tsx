import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Flag,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Settings,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: ModerationFlag[];
  suggestion: 'approve' | 'review' | 'reject';
  categories: CategoryScore[];
}

interface ModerationFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  position?: { start: number; end: number };
}

interface CategoryScore {
  category: string;
  score: number;
  threshold: number;
}

interface ModerationSettings {
  autoApprove: boolean;
  spamThreshold: number;
  toxicityThreshold: number;
  requireReview: boolean;
  allowLinks: boolean;
  minLength: number;
  maxLength: number;
}

const defaultSettings: ModerationSettings = {
  autoApprove: false,
  spamThreshold: 0.7,
  toxicityThreshold: 0.6,
  requireReview: true,
  allowLinks: true,
  minLength: 10,
  maxLength: 5000,
};

// Moderation patterns (simulated - in production, use AI API)
const spamPatterns = [
  /\b(buy now|click here|free money|earn \$|winner|congratulations)\b/gi,
  /(http|https):\/\/(?!techtrendi\.com)[^\s]+/g,
  /(.)\1{5,}/g, // Repeated characters
  /[A-Z]{10,}/g, // All caps
];

const toxicPatterns = [
  /\b(hate|stupid|idiot|dumb|worst|sucks|garbage|trash)\b/gi,
  /\b(kill|die|hurt|attack|destroy)\b/gi,
];

const inappropriatePatterns = [
  /\b(spam|scam|fake|fraud|illegal)\b/gi,
];

// AI Moderation Engine (simulated)
const moderateContent = async (
  content: string,
  settings: ModerationSettings
): Promise<ModerationResult> => {
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

  const flags: ModerationFlag[] = [];
  const categories: CategoryScore[] = [];

  // Length checks
  if (content.length < settings.minLength) {
    flags.push({
      type: 'too_short',
      severity: 'medium',
      description: `Content is too short (minimum: ${settings.minLength} characters)`,
    });
  }

  if (content.length > settings.maxLength) {
    flags.push({
      type: 'too_long',
      severity: 'low',
      description: `Content exceeds maximum length (${settings.maxLength} characters)`,
    });
  }

  // Spam detection
  let spamScore = 0;
  spamPatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      spamScore += matches.length * 0.15;
      flags.push({
        type: 'spam',
        severity: spamScore > 0.5 ? 'high' : 'medium',
        description: `Potential spam pattern detected: "${matches[0]}"`,
      });
    }
  });
  categories.push({
    category: 'Spam',
    score: Math.min(spamScore, 1),
    threshold: settings.spamThreshold,
  });

  // Toxicity detection
  let toxicityScore = 0;
  toxicPatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      toxicityScore += matches.length * 0.2;
      flags.push({
        type: 'toxicity',
        severity: toxicityScore > 0.4 ? 'high' : 'medium',
        description: `Potentially toxic language: "${matches[0]}"`,
      });
    }
  });
  categories.push({
    category: 'Toxicity',
    score: Math.min(toxicityScore, 1),
    threshold: settings.toxicityThreshold,
  });

  // Inappropriate content
  let inappropriateScore = 0;
  inappropriatePatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      inappropriateScore += matches.length * 0.15;
      flags.push({
        type: 'inappropriate',
        severity: 'medium',
        description: `Potentially inappropriate content: "${matches[0]}"`,
      });
    }
  });
  categories.push({
    category: 'Inappropriate',
    score: Math.min(inappropriateScore, 1),
    threshold: 0.5,
  });

  // Link detection
  const linkPattern = /(http|https):\/\/[^\s]+/g;
  const links = content.match(linkPattern);
  if (links && !settings.allowLinks) {
    flags.push({
      type: 'contains_links',
      severity: 'low',
      description: `Content contains ${links.length} link(s)`,
    });
  }
  categories.push({
    category: 'Links',
    score: links ? links.length * 0.1 : 0,
    threshold: settings.allowLinks ? 1 : 0.1,
  });

  // Quality score (positive indicators)
  let qualityScore = 0.5;
  if (content.length > 50) qualityScore += 0.1;
  if (content.includes('?')) qualityScore += 0.1; // Questions are engaging
  if (/[.!?]$/.test(content.trim())) qualityScore += 0.1; // Proper ending
  categories.push({
    category: 'Quality',
    score: Math.min(qualityScore, 1),
    threshold: 0.4,
  });

  // Determine suggestion
  const hasHighSeverity = flags.some((f) => f.severity === 'high');
  const hasMediumSeverity = flags.some((f) => f.severity === 'medium');
  const exceedsThresholds = categories.some((c) => c.score > c.threshold);

  let suggestion: 'approve' | 'review' | 'reject' = 'approve';
  let isApproved = true;

  if (hasHighSeverity || (spamScore > settings.spamThreshold) || (toxicityScore > settings.toxicityThreshold)) {
    suggestion = 'reject';
    isApproved = false;
  } else if (hasMediumSeverity || exceedsThresholds) {
    suggestion = 'review';
    isApproved = settings.autoApprove;
  }

  const confidence = 1 - (flags.length * 0.1);

  return {
    isApproved: settings.autoApprove ? (suggestion !== 'reject') : isApproved,
    confidence: Math.max(0.5, confidence),
    flags,
    suggestion,
    categories,
  };
};

// Smart Moderation Widget
export function SmartModerationWidget({
  content,
  onApprove,
  onReject,
  className,
}: {
  content: string;
  onApprove?: () => void;
  onReject?: () => void;
  className?: string;
}) {
  const [result, setResult] = useState<ModerationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [settings, setSettings] = useState<ModerationSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);

  const analyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    try {
      const moderationResult = await moderateContent(content, settings);
      setResult(moderationResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (content && content.length > 0) {
      analyze();
    }
  }, [content, settings]);

  const getSuggestionBadge = () => {
    if (!result) return null;

    switch (result.suggestion) {
      case 'approve':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approve
          </Badge>
        );
      case 'review':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Eye className="w-3 h-3 mr-1" />
            Review
          </Badge>
        );
      case 'reject':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Reject
          </Badge>
        );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500 bg-red-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className={cn('p-4 bg-card border border-border rounded-xl', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Moderation</h3>
            <p className="text-xs text-muted-foreground">Content safety check</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Moderation Settings</DialogTitle>
                <DialogDescription>
                  Configure AI moderation thresholds and behavior
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Auto-approve safe content</label>
                  <Switch
                    checked={settings.autoApprove}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, autoApprove: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm">Allow external links</label>
                  <Switch
                    checked={settings.allowLinks}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, allowLinks: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Spam threshold: {settings.spamThreshold}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.spamThreshold}
                    onChange={(e) =>
                      setSettings({ ...settings, spamThreshold: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Toxicity threshold: {settings.toxicityThreshold}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.toxicityThreshold}
                    onChange={(e) =>
                      setSettings({ ...settings, toxicityThreshold: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon"
            onClick={analyze}
            disabled={isAnalyzing || !content.trim()}
            className="h-8 w-8"
          >
            <RefreshCw className={cn('w-4 h-4', isAnalyzing && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {isAnalyzing ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : result ? (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {result.isApproved ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <p className="font-medium">
                  {result.isApproved ? 'Content Approved' : 'Content Flagged'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(result.confidence * 100)}% confidence
                </p>
              </div>
            </div>
            {getSuggestionBadge()}
          </div>

          {/* Category Scores */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Category Analysis</h4>
            {result.categories.map((cat) => (
              <div key={cat.category} className="flex items-center gap-2">
                <span className="text-xs w-24">{cat.category}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      cat.score > cat.threshold ? 'bg-red-500' : 'bg-green-500'
                    )}
                    style={{ width: `${cat.score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12">
                  {Math.round(cat.score * 100)}%
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Threshold: {Math.round(cat.threshold * 100)}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>

          {/* Flags */}
          {result.flags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Flag className="w-4 h-4" />
                Flags ({result.flags.length})
              </h4>
              <div className="space-y-1">
                {result.flags.map((flag, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded text-xs',
                      getSeverityColor(flag.severity)
                    )}
                  >
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium capitalize">{flag.type.replace('_', ' ')}</span>
                      <p className="text-muted-foreground">{flag.description}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {flag.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onApprove}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onReject}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Enter content to analyze
        </p>
      )}
    </div>
  );
}

// Moderation Queue Item
export function ModerationQueueItem({
  id,
  author,
  content,
  timestamp,
  onApprove,
  onReject,
  className,
}: {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  className?: string;
}) {
  const [result, setResult] = useState<ModerationResult | null>(null);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    moderateContent(content, defaultSettings).then(setResult);
  }, [content]);

  return (
    <div className={cn('p-4 bg-card border border-border rounded-lg', className)}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-sm">{author}</p>
          <p className="text-xs text-muted-foreground">
            {timestamp.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <Badge
              variant={
                result.suggestion === 'approve'
                  ? 'default'
                  : result.suggestion === 'reject'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {result.suggestion}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowContent(!showContent)}
            className="h-6 w-6"
          >
            {showContent ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {showContent && (
        <div className="mb-3 p-2 bg-muted/50 rounded text-sm">
          <MessageSquare className="w-4 h-4 inline mr-2 text-muted-foreground" />
          {content}
        </div>
      )}

      {result && result.flags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {result.flags.slice(0, 3).map((flag, i) => (
            <Badge
              key={i}
              variant="outline"
              className={cn(
                'text-xs',
                flag.severity === 'high'
                  ? 'border-red-500 text-red-500'
                  : flag.severity === 'medium'
                  ? 'border-yellow-500 text-yellow-500'
                  : ''
              )}
            >
              {flag.type}
            </Badge>
          ))}
          {result.flags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{result.flags.length - 3} more
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onApprove(id)}
          className="flex-1"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReject(id)}
          className="flex-1"
        >
          <XCircle className="w-3 h-3 mr-1" />
          Reject
        </Button>
      </div>
    </div>
  );
}

// Moderation Dashboard Stats
export function ModerationStats({
  stats,
  className,
}: {
  stats: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  className?: string;
}) {
  const approvalRate = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;

  return (
    <div className={cn('grid grid-cols-4 gap-4', className)}>
      <div className="p-4 bg-card border border-border rounded-lg text-center">
        <p className="text-2xl font-bold">{stats.total}</p>
        <p className="text-xs text-muted-foreground">Total</p>
      </div>
      <div className="p-4 bg-card border border-border rounded-lg text-center">
        <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
        <p className="text-xs text-muted-foreground">Approved</p>
      </div>
      <div className="p-4 bg-card border border-border rounded-lg text-center">
        <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
        <p className="text-xs text-muted-foreground">Rejected</p>
      </div>
      <div className="p-4 bg-card border border-border rounded-lg text-center">
        <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        <p className="text-xs text-muted-foreground">Pending</p>
      </div>
    </div>
  );
}

export default SmartModerationWidget;
