import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Lock, Check, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  blurContent?: boolean;
  showPreview?: boolean;
  className?: string;
}

export function PremiumGate({
  children,
  feature = 'this content',
  blurContent = true,
  showPreview = true,
  className,
}: PremiumGateProps) {
  const { subscription } = useAuth();

  if (subscription.subscribed) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {showPreview && (
        <div className={cn(blurContent && 'blur-sm pointer-events-none select-none')}>
          {children}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Premium Content</h3>
          <p className="text-muted-foreground mb-6">
            Upgrade to Premium to access {feature} and exclusive features.
          </p>
          <Button asChild className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600">
            <Link to="/premium">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Inline Premium Badge
export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      className
    )}>
      <Crown className="w-3 h-3" />
      Premium
    </span>
  );
}

// Premium CTA Banner
export function PremiumBanner({
  variant = 'default',
  className,
}: {
  variant?: 'default' | 'compact' | 'full';
  className?: string;
}) {
  const { subscription } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (subscription.subscribed || dismissed) return null;

  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl',
        className
      )}>
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">Unlock premium features</span>
        </div>
        <Button size="sm" asChild>
          <Link to="/premium">Upgrade</Link>
        </Button>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent p-8 text-white',
        className
      )}>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6" />
            <span className="text-lg font-medium">TechTrendi Premium</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Elevate Your Tech Experience</h2>
          <ul className="space-y-2 mb-6">
            {[
              'Ad-free browsing experience',
              'Exclusive in-depth reviews',
              'Early access to new content',
              'Premium tools and features',
              'Priority support',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link to="/premium">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <span className="text-sm text-white/80">No credit card required</span>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      'relative flex items-center gap-4 p-6 bg-card border border-border rounded-xl overflow-hidden',
      className
    )}>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
        <Crown className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-1">Upgrade to Premium</h3>
        <p className="text-sm text-muted-foreground">
          Get ad-free reading, exclusive content, and premium tools
        </p>
      </div>
      <Button asChild>
        <Link to="/premium">
          Upgrade
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Content Paywall
export function ContentPaywall({
  title,
  description,
  previewLines = 3,
  className,
}: {
  title?: string;
  description?: string;
  previewLines?: number;
  className?: string;
}) {
  const { subscription } = useAuth();

  if (subscription.subscribed) return null;

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent" />
      <div className="relative pt-12 pb-8 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          {title || 'Continue Reading with Premium'}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {description || 'Subscribe to Premium to read the full article and access all premium content.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button className="bg-gradient-to-r from-yellow-400 to-orange-500" asChild>
            <Link to="/premium">
              <Crown className="w-4 h-4 mr-2" />
              Subscribe Now
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Already a subscriber? <Link to="/auth" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// Premium Feature Lock
export function FeatureLock({
  feature,
  icon: Icon = Lock,
  className,
}: {
  feature: string;
  icon?: React.ElementType;
  className?: string;
}) {
  const { subscription } = useAuth();

  if (subscription.subscribed) return null;

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-dashed border-border',
      className
    )}>
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{feature}</p>
        <p className="text-xs text-muted-foreground">Premium feature</p>
      </div>
      <PremiumBadge />
    </div>
  );
}

export default PremiumGate;
