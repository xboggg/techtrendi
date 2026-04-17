// Google Analytics 4 (GA4) Integration
// Replace GA_MEASUREMENT_ID with your actual GA4 Measurement ID (e.g., G-XXXXXXXXXX)

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-3BEQ4KP5CD';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize gtag
export const initGA = () => {
  if (!isBrowser) return;

  // Don't initialize if already done
  if ((window as any).gtagInitialized) return;

  // Create gtag function
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;

  // Default consent mode - deny all until user consents
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });

  // Initialize GA4
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  });

  (window as any).gtagInitialized = true;
};

// Page view tracking
export const pageview = (url: string, title?: string) => {
  if (!isBrowser || !(window as any).gtag) return;

  (window as any).gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title,
  });
};

// Event tracking
interface GTagEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export const event = ({ action, category, label, value, ...params }: GTagEvent) => {
  if (!isBrowser || !(window as any).gtag) return;

  (window as any).gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    ...params,
  });
};

// Predefined events for common actions
export const trackEvents = {
  // User engagement
  signup: () => event({ action: 'sign_up', category: 'engagement' }),
  login: () => event({ action: 'login', category: 'engagement' }),

  // Content
  articleView: (articleId: string, title: string) =>
    event({ action: 'view_item', category: 'content', label: title, article_id: articleId }),
  articleShare: (articleId: string, method: string) =>
    event({ action: 'share', category: 'content', label: articleId, method }),

  // Tools
  toolUse: (toolName: string) =>
    event({ action: 'tool_use', category: 'tools', label: toolName }),

  // Premium
  premiumView: () => event({ action: 'view_item', category: 'premium' }),
  premiumSubscribe: (plan: string) =>
    event({ action: 'purchase', category: 'premium', label: plan }),

  // Search
  search: (query: string) =>
    event({ action: 'search', category: 'engagement', search_term: query }),

  // Newsletter
  newsletterSignup: () => event({ action: 'newsletter_signup', category: 'engagement' }),

  // Affiliate
  affiliateClick: (partner: string, productId?: string) =>
    event({ action: 'affiliate_click', category: 'affiliate', label: partner, product_id: productId }),

  // Errors
  error: (description: string, fatal: boolean = false) =>
    event({ action: 'exception', category: 'error', description, fatal }),
};

// Update consent
export const updateConsent = (analytics: boolean, advertising: boolean) => {
  if (!isBrowser || !(window as any).gtag) return;

  (window as any).gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: advertising ? 'granted' : 'denied',
    ad_user_data: advertising ? 'granted' : 'denied',
    ad_personalization: advertising ? 'granted' : 'denied',
  });
};

export default {
  GA_MEASUREMENT_ID,
  initGA,
  pageview,
  event,
  trackEvents,
  updateConsent,
};
