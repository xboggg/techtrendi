import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GA_MEASUREMENT_ID, initGA, pageview } from '@/lib/gtag';

interface GoogleAnalyticsProps {
  measurementId?: string;
}

// The gtag.js script is added with a plain <script> element, NOT react-helmet-async's <Helmet>.
// The site has two copies of react-helmet-async: SEOHead writes title/robots/canonical through
// vite-react-ssg's own copy (v1), and this component used the app's copy (v2). When v2 applied
// its <Helmet> it removed every data-rh tag it did not own, so robots, canonical, description
// and the Open Graph tags vanished from every page ~3 s after load (found 7 Nov 2026, T-210).
const scriptSrc = (id: string) => `https://www.googletagmanager.com/gtag/js?id=${id}`;

export function GoogleAnalytics({ measurementId = GA_MEASUREMENT_ID }: GoogleAnalyticsProps) {
  const location = useLocation();

  // Initialize GA on mount (consent defaults first), then load gtag.js once.
  useEffect(() => {
    initGA();
    // Don't load the script in development unless explicitly enabled
    if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_GA_DEV) return;
    const src = scriptSrc(measurementId);
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }, [measurementId]);

  // Track page views on route change
  useEffect(() => {
    const url = location.pathname + location.search;
    pageview(url, document.title);
  }, [location]);

  return null;
}

export default GoogleAnalytics;
