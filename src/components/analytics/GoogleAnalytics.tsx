import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GA_MEASUREMENT_ID, initGA, pageview } from '@/lib/gtag';

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export function GoogleAnalytics({ measurementId = GA_MEASUREMENT_ID }: GoogleAnalyticsProps) {
  const location = useLocation();

  // Initialize GA on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on route change
  useEffect(() => {
    const url = location.pathname + location.search;
    pageview(url, document.title);
  }, [location]);

  // Don't render script in development unless explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_GA_DEV) {
    return null;
  }

  return (
    <Helmet>
      {/* Google Analytics Script */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
    </Helmet>
  );
}

export default GoogleAnalytics;
