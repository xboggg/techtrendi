import { useState } from 'react';
import { Shield, AlertTriangle, Info, Eye, EyeOff, Lock, Unlock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ContentRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
type ContentWarning = 'violence' | 'language' | 'sexual' | 'drugs' | 'gambling' | 'scary' | 'ads';

interface ContentRatingProps {
  rating: ContentRating;
  warnings?: ContentWarning[];
  showDetails?: boolean;
  className?: string;
}

const ratingInfo: Record<ContentRating, { label: string; description: string; color: string; minAge?: number }> = {
  G: {
    label: 'General Audiences',
    description: 'Suitable for all ages',
    color: 'bg-green-500',
  },
  PG: {
    label: 'Parental Guidance',
    description: 'Some content may not be suitable for children',
    color: 'bg-blue-500',
    minAge: 7,
  },
  'PG-13': {
    label: 'Parents Strongly Cautioned',
    description: 'May be inappropriate for children under 13',
    color: 'bg-yellow-500',
    minAge: 13,
  },
  R: {
    label: 'Restricted',
    description: 'Under 17 requires accompanying parent or adult guardian',
    color: 'bg-orange-500',
    minAge: 17,
  },
  'NC-17': {
    label: 'Adults Only',
    description: 'No one 17 and under admitted',
    color: 'bg-red-500',
    minAge: 18,
  },
};

const warningInfo: Record<ContentWarning, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  violence: { label: 'Violence', icon: AlertTriangle },
  language: { label: 'Strong Language', icon: AlertTriangle },
  sexual: { label: 'Sexual Content', icon: EyeOff },
  drugs: { label: 'Drug References', icon: AlertTriangle },
  gambling: { label: 'Gambling', icon: AlertTriangle },
  scary: { label: 'Scary Scenes', icon: Eye },
  ads: { label: 'Contains Ads', icon: Info },
};

export function ContentRatingBadge({ rating, warnings = [], showDetails = false, className }: ContentRatingProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const info = ratingInfo[rating];

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded text-white text-sm font-bold',
          info.color
        )}
      >
        <Shield className="w-3.5 h-3.5" />
        {rating}
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn('w-8 h-8 rounded flex items-center justify-center text-white font-bold', info.color)}>
              {rating}
            </div>
            <div>
              <h4 className="font-semibold text-sm">{info.label}</h4>
              <p className="text-xs text-muted-foreground">{info.description}</p>
            </div>
          </div>
          {warnings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Content Warnings:</p>
              <div className="flex flex-wrap gap-1">
                {warnings.map((warning) => {
                  const w = warningInfo[warning];
                  return (
                    <Badge key={warning} variant="outline" className="text-xs">
                      <w.icon className="w-3 h-3 mr-1" />
                      {w.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Age Gate Component
interface AgeGateProps {
  minAge: number;
  onVerify: () => void;
  onDeny: () => void;
  title?: string;
  description?: string;
}

export function AgeGate({ minAge, onVerify, onDeny, title, description }: AgeGateProps) {
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    const year = parseInt(birthYear);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (isNaN(year) || year < 1900 || year > currentYear) {
      setError('Please enter a valid year');
      return;
    }

    if (age >= minAge) {
      localStorage.setItem('age_verified', 'true');
      onVerify();
    } else {
      setError(`You must be ${minAge} or older to view this content`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {title || 'Age Verification Required'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {description || `You must be ${minAge} years or older to view this content.`}
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Enter your birth year
          </label>
          <input
            type="number"
            value={birthYear}
            onChange={(e) => {
              setBirthYear(e.target.value);
              setError('');
            }}
            placeholder="YYYY"
            className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-center text-lg font-mono"
            min="1900"
            max={new Date().getFullYear()}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onDeny}>
            Go Back
          </Button>
          <Button className="flex-1" onClick={handleVerify}>
            <Check className="w-4 h-4 mr-2" />
            Verify Age
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          By proceeding, you confirm that you are {minAge} years of age or older.
        </p>
      </div>
    </div>
  );
}

// Content Warning Banner
interface ContentWarningBannerProps {
  warnings: ContentWarning[];
  onContinue: () => void;
  onGoBack: () => void;
  className?: string;
}

export function ContentWarningBanner({ warnings, onContinue, onGoBack, className }: ContentWarningBannerProps) {
  return (
    <div className={cn('bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6', className)}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-2">Content Warning</h3>
          <p className="text-muted-foreground mb-4">
            This content may contain material that some viewers may find sensitive or triggering:
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {warnings.map((warning) => {
              const w = warningInfo[warning];
              return (
                <Badge key={warning} variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
                  <w.icon className="w-3 h-3 mr-1" />
                  {w.label}
                </Badge>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={onGoBack}>
              Go Back
            </Button>
            <Button size="sm" onClick={onContinue}>
              <Eye className="w-4 h-4 mr-2" />
              Continue Anyway
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sensitive Content Wrapper
interface SensitiveContentProps {
  children: React.ReactNode;
  warnings: ContentWarning[];
  blurred?: boolean;
  className?: string;
}

export function SensitiveContent({ children, warnings, blurred = true, className }: SensitiveContentProps) {
  const [revealed, setRevealed] = useState(false);

  if (!blurred || revealed) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      <div className="blur-lg pointer-events-none">{children}</div>
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
        <div className="text-center p-6">
          <EyeOff className="w-12 h-12 text-white/80 mx-auto mb-4" />
          <h4 className="text-white font-semibold mb-2">Sensitive Content</h4>
          <p className="text-white/70 text-sm mb-4">
            This content contains: {warnings.map((w) => warningInfo[w].label).join(', ')}
          </p>
          <Button onClick={() => setRevealed(true)} variant="secondary">
            <Eye className="w-4 h-4 mr-2" />
            Show Content
          </Button>
        </div>
      </div>
    </div>
  );
}

// Parental Control Settings
interface ParentalControlsProps {
  maxRating: ContentRating;
  blockedWarnings: ContentWarning[];
  onUpdate: (maxRating: ContentRating, blockedWarnings: ContentWarning[]) => void;
  className?: string;
}

export function ParentalControls({ maxRating, blockedWarnings, onUpdate, className }: ParentalControlsProps) {
  const [rating, setRating] = useState(maxRating);
  const [warnings, setWarnings] = useState(blockedWarnings);

  const toggleWarning = (warning: ContentWarning) => {
    setWarnings((prev) =>
      prev.includes(warning) ? prev.filter((w) => w !== warning) : [...prev, warning]
    );
  };

  const handleSave = () => {
    onUpdate(rating, warnings);
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Parental Controls</h3>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Maximum Content Rating
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ratingInfo) as ContentRating[]).map((r) => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  rating === r
                    ? cn(ratingInfo[r].color, 'text-white')
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {ratingInfo[rating].description}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Block Content With
          </label>
          <div className="space-y-2">
            {(Object.entries(warningInfo) as [ContentWarning, typeof warningInfo[ContentWarning]][]).map(
              ([key, info]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <info.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{info.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={warnings.includes(key)}
                    onChange={() => toggleWarning(key)}
                    className="rounded"
                  />
                </label>
              )
            )}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Lock className="w-4 h-4 mr-2" />
          Save Parental Controls
        </Button>
      </div>
    </div>
  );
}

export default ContentRatingBadge;
