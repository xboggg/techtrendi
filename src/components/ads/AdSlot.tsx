import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Ad slot sizes following Google AdSense standards
type AdSize =
  | 'responsive'
  | 'leaderboard'     // 728x90
  | 'banner'          // 468x60
  | 'half-banner'     // 234x60
  | 'large-rectangle' // 336x280
  | 'medium-rectangle'// 300x250
  | 'square'          // 250x250
  | 'small-square'    // 200x200
  | 'skyscraper'      // 120x600
  | 'wide-skyscraper' // 160x600
  | 'mobile-banner'   // 320x50
  | 'large-mobile'    // 320x100
  | 'in-article'      // Responsive in-article
  | 'in-feed';        // Responsive in-feed

interface AdSlotProps {
  slotId: string;
  size?: AdSize;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  className?: string;
  testMode?: boolean;
  lazyLoad?: boolean;
}

const AD_SIZES: Record<AdSize, { width: number | 'auto'; height: number | 'auto' }> = {
  responsive: { width: 'auto', height: 'auto' },
  leaderboard: { width: 728, height: 90 },
  banner: { width: 468, height: 60 },
  'half-banner': { width: 234, height: 60 },
  'large-rectangle': { width: 336, height: 280 },
  'medium-rectangle': { width: 300, height: 250 },
  square: { width: 250, height: 250 },
  'small-square': { width: 200, height: 200 },
  skyscraper: { width: 120, height: 600 },
  'wide-skyscraper': { width: 160, height: 600 },
  'mobile-banner': { width: 320, height: 50 },
  'large-mobile': { width: 320, height: 100 },
  'in-article': { width: 'auto', height: 'auto' },
  'in-feed': { width: 'auto', height: 'auto' },
};

// Placeholder component for development/preview
function AdPlaceholder({ size, slotId }: { size: AdSize; slotId: string }) {
  const dimensions = AD_SIZES[size];

  return (
    <div
      className="bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground/50 text-sm"
      style={{
        width: dimensions.width === 'auto' ? '100%' : dimensions.width,
        height: dimensions.height === 'auto' ? 200 : dimensions.height,
        minHeight: 90,
      }}
    >
      <div className="text-center p-4">
        <p className="font-medium">Ad Space</p>
        <p className="text-xs">{size} ({slotId})</p>
      </div>
    </div>
  );
}

export function AdSlot({
  slotId,
  size = 'responsive',
  format = 'auto',
  className = '',
  testMode = false,
  lazyLoad = true,
}: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [adLoaded, setAdLoaded] = useState(false);
  const { subscription } = useAuth();

  // Don't show ads to premium subscribers
  if (subscription.subscribed) {
    return null;
  }

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!lazyLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad]);

  // Load AdSense ad
  useEffect(() => {
    if (!isVisible || adLoaded || testMode) return;

    // Check if AdSense script is loaded
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, [isVisible, adLoaded, testMode]);

  const dimensions = AD_SIZES[size];

  // Development/test mode - show placeholder
  if (testMode || process.env.NODE_ENV === 'development') {
    return (
      <div ref={adRef} className={`ad-container ${className}`}>
        <AdPlaceholder size={size} slotId={slotId} />
      </div>
    );
  }

  return (
    <div ref={adRef} className={`ad-container ${className}`}>
      {isVisible && (
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            width: dimensions.width === 'auto' ? '100%' : dimensions.width,
            height: dimensions.height === 'auto' ? 'auto' : dimensions.height,
          }}
          data-ad-client="ca-pub-XXXXXXXXXX" // Replace with actual AdSense publisher ID
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive={size === 'responsive' ? 'true' : 'false'}
        />
      )}
    </div>
  );
}

// Pre-configured ad components for common placements
export function HeaderAd({ className = '' }: { className?: string }) {
  return (
    <AdSlot
      slotId="header-ad"
      size="leaderboard"
      className={`hidden md:block mx-auto ${className}`}
      lazyLoad={false}
    />
  );
}

export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <AdSlot
      slotId="sidebar-ad"
      size="medium-rectangle"
      className={className}
    />
  );
}

export function InArticleAd({ className = '' }: { className?: string }) {
  return (
    <AdSlot
      slotId="in-article-ad"
      size="in-article"
      format="fluid"
      className={`my-8 ${className}`}
    />
  );
}

export function InFeedAd({ className = '' }: { className?: string }) {
  return (
    <AdSlot
      slotId="in-feed-ad"
      size="in-feed"
      format="fluid"
      className={className}
    />
  );
}

export function FooterAd({ className = '' }: { className?: string }) {
  return (
    <AdSlot
      slotId="footer-ad"
      size="leaderboard"
      className={`hidden md:block mx-auto ${className}`}
    />
  );
}

export function MobileBannerAd({ className = '' }: { className?: string }) {
  return (
    <AdSlot
      slotId="mobile-banner-ad"
      size="mobile-banner"
      className={`md:hidden mx-auto ${className}`}
    />
  );
}

export default AdSlot;
