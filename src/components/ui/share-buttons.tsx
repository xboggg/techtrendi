import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  Mail,
  MessageCircle,
  Check,
  Share2,
} from 'lucide-react';

interface ShareButtonsProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
}

export function ShareButtons({
  url,
  title = '',
  description = '',
  className,
  variant = 'horizontal',
  showLabels = false,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:bg-[#1DA1F2] hover:text-white',
      bgColor: 'bg-[#1DA1F2]',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:bg-[#4267B2] hover:text-white',
      bgColor: 'bg-[#4267B2]',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
      color: 'hover:bg-[#0A66C2] hover:text-white',
      bgColor: 'bg-[#0A66C2]',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:bg-[#25D366] hover:text-white',
      bgColor: 'bg-[#25D366]',
    },
    {
      name: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
      color: 'hover:bg-gray-600 hover:text-white',
      bgColor: 'bg-gray-600',
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  const buttonClass = cn(
    'flex items-center justify-center gap-2 rounded-lg transition-all duration-200',
    variant === 'compact' ? 'p-2' : 'p-3',
    'bg-muted/50 text-muted-foreground'
  );

  return (
    <div
      className={cn(
        'flex gap-2',
        variant === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
    >
      {/* Native Share (mobile) */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          onClick={handleNativeShare}
          className={cn(buttonClass, 'hover:bg-primary hover:text-white')}
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
          {showLabels && <span className="text-sm">Share</span>}
        </button>
      )}

      {/* Social Share Links */}
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonClass, link.color)}
          aria-label={`Share on ${link.name}`}
        >
          <link.icon className="w-5 h-5" />
          {showLabels && <span className="text-sm">{link.name}</span>}
        </a>
      ))}

      {/* Copy Link Button */}
      <button
        onClick={copyToClipboard}
        className={cn(
          buttonClass,
          copied ? 'bg-green-500 text-white' : 'hover:bg-gray-500 hover:text-white'
        )}
        aria-label="Copy link"
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            {showLabels && <span className="text-sm">Copied!</span>}
          </>
        ) : (
          <>
            <Link2 className="w-5 h-5" />
            {showLabels && <span className="text-sm">Copy Link</span>}
          </>
        )}
      </button>
    </div>
  );
}

// Floating Share Bar (sticky on scroll)
export function FloatingShareBar({
  url,
  title,
  description,
  className,
}: ShareButtonsProps) {
  return (
    <div
      className={cn(
        'fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block',
        className
      )}
    >
      <ShareButtons
        url={url}
        title={title}
        description={description}
        variant="vertical"
      />
    </div>
  );
}

// Inline Share Section
export function ShareSection({
  url,
  title,
  description,
  className,
}: ShareButtonsProps) {
  return (
    <div className={cn('py-6 border-t border-b border-border', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          Share this article:
        </p>
        <ShareButtons
          url={url}
          title={title}
          description={description}
          variant="horizontal"
        />
      </div>
    </div>
  );
}

export default ShareButtons;
