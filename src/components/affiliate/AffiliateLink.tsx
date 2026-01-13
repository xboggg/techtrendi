import { ReactNode, MouseEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// Affiliate partner configurations
export type AffiliatePartner =
  | 'amazon'
  | 'nordvpn'
  | 'expressvpn'
  | 'surfshark'
  | '1password'
  | 'dashlane'
  | 'bitwarden'
  | 'hostinger'
  | 'bluehost'
  | 'namecheap'
  | 'custom';

interface AffiliateConfig {
  name: string;
  baseUrl?: string;
  trackingParam?: string;
  affiliateId?: string;
  category: string;
}

const AFFILIATE_CONFIG: Record<AffiliatePartner, AffiliateConfig> = {
  amazon: {
    name: 'Amazon',
    baseUrl: 'https://www.amazon.com',
    trackingParam: 'tag',
    affiliateId: 'techtrendi-20', // Replace with actual Amazon Associates ID
    category: 'E-commerce',
  },
  nordvpn: {
    name: 'NordVPN',
    baseUrl: 'https://nordvpn.com',
    trackingParam: 'ref',
    affiliateId: 'techtrendi', // Replace with actual ID
    category: 'VPN',
  },
  expressvpn: {
    name: 'ExpressVPN',
    baseUrl: 'https://expressvpn.com',
    trackingParam: 'offer',
    affiliateId: 'techtrendi', // Replace with actual ID
    category: 'VPN',
  },
  surfshark: {
    name: 'Surfshark',
    baseUrl: 'https://surfshark.com',
    trackingParam: 'ref',
    affiliateId: 'techtrendi', // Replace with actual ID
    category: 'VPN',
  },
  '1password': {
    name: '1Password',
    baseUrl: 'https://1password.com',
    category: 'Password Manager',
  },
  dashlane: {
    name: 'Dashlane',
    baseUrl: 'https://dashlane.com',
    category: 'Password Manager',
  },
  bitwarden: {
    name: 'Bitwarden',
    baseUrl: 'https://bitwarden.com',
    category: 'Password Manager',
  },
  hostinger: {
    name: 'Hostinger',
    baseUrl: 'https://hostinger.com',
    trackingParam: 'REFERRALCODE',
    affiliateId: 'TECHTRENDI', // Replace with actual ID
    category: 'Web Hosting',
  },
  bluehost: {
    name: 'Bluehost',
    baseUrl: 'https://bluehost.com',
    category: 'Web Hosting',
  },
  namecheap: {
    name: 'Namecheap',
    baseUrl: 'https://namecheap.com',
    trackingParam: 'aff',
    affiliateId: 'techtrendi', // Replace with actual ID
    category: 'Domain & Hosting',
  },
  custom: {
    name: 'Custom',
    category: 'Other',
  },
};

interface AffiliateLinkProps {
  partner: AffiliatePartner;
  productUrl?: string;
  productId?: string;
  children: ReactNode;
  className?: string;
  showIcon?: boolean;
  onClick?: (e: MouseEvent) => void;
  variant?: 'text' | 'button' | 'card';
  disclosure?: boolean;
}

export function AffiliateLink({
  partner,
  productUrl,
  productId,
  children,
  className = '',
  showIcon = true,
  onClick,
  variant = 'text',
  disclosure = true,
}: AffiliateLinkProps) {
  const config = AFFILIATE_CONFIG[partner];

  // Build affiliate URL
  const buildAffiliateUrl = (): string => {
    if (partner === 'custom' && productUrl) {
      return productUrl;
    }

    let url = productUrl || config.baseUrl || '';

    // Add Amazon ASIN if provided
    if (partner === 'amazon' && productId) {
      url = `${config.baseUrl}/dp/${productId}`;
    }

    // Add tracking parameter
    if (config.trackingParam && config.affiliateId) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${config.trackingParam}=${config.affiliateId}`;
    }

    return url;
  };

  const handleClick = (e: MouseEvent) => {
    // Track affiliate click (analytics)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'affiliate_click', {
        partner: config.name,
        category: config.category,
        url: buildAffiliateUrl(),
      });
    }

    onClick?.(e);
  };

  const baseClasses = cn(
    'inline-flex items-center gap-1 transition-colors',
    variant === 'text' && 'text-primary hover:text-primary/80 hover:underline',
    variant === 'button' && 'px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium',
    variant === 'card' && 'p-4 bg-card border border-border rounded-xl hover:border-primary/50 w-full justify-between',
    className
  );

  return (
    <a
      href={buildAffiliateUrl()}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={baseClasses}
      onClick={handleClick}
      data-affiliate={partner}
    >
      {children}
      {showIcon && <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />}
      {disclosure && variant === 'card' && (
        <span className="text-xs text-muted-foreground ml-2">Affiliate</span>
      )}
    </a>
  );
}

// Amazon Product Link with price display
interface AmazonProductProps {
  asin: string;
  title: string;
  price?: string;
  image?: string;
  rating?: number;
  className?: string;
}

export function AmazonProduct({
  asin,
  title,
  price,
  image,
  rating,
  className = '',
}: AmazonProductProps) {
  return (
    <AffiliateLink
      partner="amazon"
      productId={asin}
      variant="card"
      className={className}
    >
      <div className="flex items-center gap-4">
        {image && (
          <img
            src={image}
            alt={title}
            className="w-16 h-16 object-contain rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{title}</h4>
          <div className="flex items-center gap-2 mt-1">
            {price && (
              <span className="text-lg font-bold text-primary">{price}</span>
            )}
            {rating && (
              <span className="text-sm text-muted-foreground">
                {rating}/5 stars
              </span>
            )}
          </div>
        </div>
      </div>
    </AffiliateLink>
  );
}

// VPN Comparison Card
interface VPNCardProps {
  provider: 'nordvpn' | 'expressvpn' | 'surfshark';
  price: string;
  features: string[];
  rating: number;
  discount?: string;
  className?: string;
}

export function VPNCard({
  provider,
  price,
  features,
  rating,
  discount,
  className = '',
}: VPNCardProps) {
  const config = AFFILIATE_CONFIG[provider];

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-foreground">{config.name}</h3>
        {discount && (
          <span className="px-2 py-1 bg-green-500/10 text-green-600 text-sm font-medium rounded">
            {discount}
          </span>
        )}
      </div>

      <div className="mb-4">
        <span className="text-3xl font-bold text-foreground">{price}</span>
        <span className="text-muted-foreground">/month</span>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={cn(
              'w-5 h-5',
              i < Math.floor(rating) ? 'text-yellow-500' : 'text-muted'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-muted-foreground ml-1">{rating}/5</span>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <AffiliateLink partner={provider} variant="button" className="w-full justify-center">
        Get {config.name}
      </AffiliateLink>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        We may earn a commission
      </p>
    </div>
  );
}

// Affiliate Disclosure Banner
export function AffiliateDisclosure({ className = '' }: { className?: string }) {
  return (
    <div className={cn('bg-muted/50 border border-border rounded-lg p-4 text-sm', className)}>
      <p className="text-muted-foreground">
        <strong className="text-foreground">Affiliate Disclosure:</strong> This page contains affiliate links. If you make a purchase through these links, we may earn a commission at no additional cost to you.{' '}
        <a href="/disclosure" className="text-primary hover:underline">
          Learn more
        </a>
      </p>
    </div>
  );
}

export default AffiliateLink;
