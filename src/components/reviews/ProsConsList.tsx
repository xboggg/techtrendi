import { useState } from 'react';
import { Check, X, Plus, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProConItem {
  id: string;
  text: string;
  importance?: 'high' | 'medium' | 'low';
  category?: string;
}

interface ProsConsListProps {
  pros: ProConItem[];
  cons: ProConItem[];
  verdict?: string;
  showImportance?: boolean;
  expandable?: boolean;
  className?: string;
}

export function ProsConsList({
  pros,
  cons,
  verdict,
  showImportance = true,
  expandable = true,
  className,
}: ProsConsListProps) {
  const [expanded, setExpanded] = useState(false);
  const visiblePros = expandable && !expanded ? pros.slice(0, 4) : pros;
  const visibleCons = expandable && !expanded ? cons.slice(0, 4) : cons;
  const hasMore = pros.length > 4 || cons.length > 4;

  const importanceColors = {
    high: 'border-l-4 border-l-green-500',
    medium: 'border-l-4 border-l-yellow-500',
    low: 'border-l-4 border-l-gray-400',
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pros */}
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">Pros</h3>
            <Badge variant="secondary" className="ml-auto bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300">
              {pros.length}
            </Badge>
          </div>
          <ul className="space-y-3">
            {visiblePros.map((pro) => (
              <li
                key={pro.id}
                className={cn(
                  'flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg',
                  showImportance && pro.importance && importanceColors[pro.importance]
                )}
              >
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-foreground">{pro.text}</span>
                  {pro.category && (
                    <Badge variant="outline" className="ml-2 text-xs">{pro.category}</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Cons</h3>
            <Badge variant="secondary" className="ml-auto bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300">
              {cons.length}
            </Badge>
          </div>
          <ul className="space-y-3">
            {visibleCons.map((con) => (
              <li
                key={con.id}
                className={cn(
                  'flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg',
                  showImportance && con.importance && importanceColors[con.importance].replace('green', 'red')
                )}
              >
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-foreground">{con.text}</span>
                  {con.category && (
                    <Badge variant="outline" className="ml-2 text-xs">{con.category}</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {expandable && hasMore && (
        <Button
          variant="outline"
          onClick={() => setExpanded(!expanded)}
          className="w-full"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show All Pros & Cons
            </>
          )}
        </Button>
      )}

      {verdict && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">The Verdict</h3>
          </div>
          <p className="text-muted-foreground">{verdict}</p>
        </div>
      )}
    </div>
  );
}

// Compact Pros/Cons Card
export function ProsConsCard({
  pros,
  cons,
  className,
}: {
  pros: string[];
  cons: string[];
  className?: string;
}) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
            <Check className="w-4 h-4" /> Pros
          </h4>
          <ul className="space-y-1">
            {pros.slice(0, 3).map((pro, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <Plus className="w-3 h-3 text-green-500 flex-shrink-0 mt-1" />
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
            <X className="w-4 h-4" /> Cons
          </h4>
          <ul className="space-y-1">
            {cons.slice(0, 3).map((con, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-red-500 flex-shrink-0">−</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Verdict Card with Score
interface VerdictCardProps {
  score: number;
  maxScore?: number;
  title: string;
  summary: string;
  recommendation: 'highly-recommended' | 'recommended' | 'mixed' | 'not-recommended';
  idealFor?: string[];
  notIdealFor?: string[];
  className?: string;
}

export function VerdictCard({
  score,
  maxScore = 10,
  title,
  summary,
  recommendation,
  idealFor = [],
  notIdealFor = [],
  className,
}: VerdictCardProps) {
  const recommendationStyles = {
    'highly-recommended': {
      bg: 'bg-green-500',
      text: 'Highly Recommended',
      icon: Check,
    },
    recommended: {
      bg: 'bg-blue-500',
      text: 'Recommended',
      icon: Check,
    },
    mixed: {
      bg: 'bg-yellow-500',
      text: 'Mixed Feelings',
      icon: AlertTriangle,
    },
    'not-recommended': {
      bg: 'bg-red-500',
      text: 'Not Recommended',
      icon: X,
    },
  };

  const rec = recommendationStyles[recommendation];
  const Icon = rec.icon;
  const percentage = (score / maxScore) * 100;

  return (
    <div className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
      <div className={cn('p-6', rec.bg)}>
        <div className="flex items-center justify-between">
          <div>
            <Badge className="bg-white/20 text-white mb-2">
              <Icon className="w-3 h-3 mr-1" />
              {rec.text}
            </Badge>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
          </div>
          <div className="w-20 h-20 rounded-full bg-white/20 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{score}</span>
            <span className="text-xs text-white/80">/ {maxScore}</span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <p className="text-muted-foreground mb-6">{summary}</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {idealFor.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 font-medium text-foreground mb-2">
                <Lightbulb className="w-4 h-4 text-green-500" />
                Ideal For
              </h4>
              <ul className="space-y-1">
                {idealFor.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {notIdealFor.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 font-medium text-foreground mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Not Ideal For
              </h4>
              <ul className="space-y-1">
                {notIdealFor.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <X className="w-3 h-3 text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Bottom Line Summary
export function BottomLine({
  summary,
  buyLink,
  price,
  className,
}: {
  summary: string;
  buyLink?: string;
  price?: number;
  className?: string;
}) {
  return (
    <div className={cn('bg-primary/5 border border-primary/20 rounded-xl p-6', className)}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-2">The Bottom Line</h4>
          <p className="text-muted-foreground">{summary}</p>
          {buyLink && (
            <div className="flex items-center gap-4 mt-4">
              {price && (
                <span className="text-2xl font-bold text-foreground">${price}</span>
              )}
              <Button asChild>
                <a href={buyLink} target="_blank" rel="noopener noreferrer">
                  Buy Now
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProsConsList;
