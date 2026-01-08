import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Mail, Check, Loader2, Sparkles, ArrowRight } from 'lucide-react';

interface NewsletterSignupProps {
  className?: string;
  variant?: 'inline' | 'card' | 'minimal' | 'hero';
  title?: string;
  description?: string;
  buttonText?: string;
  successMessage?: string;
  onSubscribe?: (email: string) => Promise<boolean>;
}

export function NewsletterSignup({
  className,
  variant = 'card',
  title = 'Stay Updated',
  description = 'Get the latest tech news, reviews, and deals delivered to your inbox.',
  buttonText = 'Subscribe',
  successMessage = "You're subscribed! Check your inbox for confirmation.",
  onSubscribe,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      if (onSubscribe) {
        const success = await onSubscribe(email);
        if (success) {
          setStatus('success');
          setEmail('');
        } else {
          throw new Error('Subscription failed');
        }
      } else {
        // Default: Store in localStorage for demo
        const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
        if (subscribers.includes(email)) {
          setStatus('error');
          setErrorMessage('This email is already subscribed');
          return;
        }
        subscribers.push(email);
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
        setStatus('success');
        setEmail('');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={status === 'loading' || status === 'success'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {status === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : status === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            buttonText
          )}
        </button>
      </form>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-col sm:flex-row gap-4 items-start sm:items-center', className)}>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 sm:w-64 px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={status === 'loading' || status === 'success'}
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {status === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : status === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </form>
        {status === 'error' && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}
        {status === 'success' && (
          <p className="text-sm text-green-500">{successMessage}</p>
        )}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-8 md:p-12',
          className
        )}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-4 right-4">
          <Sparkles className="w-8 h-8 text-white/30" />
        </div>
        <div className="relative z-10 max-w-xl mx-auto text-center text-white">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{title}</h2>
          <p className="text-white/90 mb-6">{description}</p>

          {status === 'success' ? (
            <div className="flex items-center justify-center gap-2 py-4 px-6 bg-white/20 rounded-xl">
              <Check className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-5 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3 bg-white text-primary rounded-xl font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {buttonText}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-3 text-sm text-red-200">{errorMessage}</p>
          )}

          <p className="mt-4 text-xs text-white/60">
            No spam, unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
          <Check className="w-5 h-5" />
          <span className="text-sm">{successMessage}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                {buttonText}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
      )}

      <p className="mt-3 text-xs text-muted-foreground text-center">
        No spam, unsubscribe anytime.
      </p>
    </div>
  );
}

// Footer Newsletter Section
export function FooterNewsletter({ className }: { className?: string }) {
  return (
    <div className={cn('py-8', className)}>
      <NewsletterSignup
        variant="inline"
        title="Subscribe to our newsletter"
        description="Get weekly tech updates"
        buttonText="Subscribe"
      />
    </div>
  );
}

export default NewsletterSignup;
