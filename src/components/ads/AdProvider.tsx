import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';

interface AdConfig {
  enabled: boolean;
  publisherId: string;
  testMode: boolean;
  lazyLoadThreshold: number;
}

interface AdContextType {
  config: AdConfig;
  isLoaded: boolean;
  setTestMode: (enabled: boolean) => void;
}

const defaultConfig: AdConfig = {
  enabled: true,
  publisherId: 'ca-pub-XXXXXXXXXX', // Replace with actual AdSense publisher ID
  testMode: process.env.NODE_ENV === 'development',
  lazyLoadThreshold: 200,
};

const AdContext = createContext<AdContextType>({
  config: defaultConfig,
  isLoaded: false,
  setTestMode: () => {},
});

export function useAds() {
  return useContext(AdContext);
}

interface AdProviderProps {
  children: ReactNode;
  publisherId?: string;
  enabled?: boolean;
}

export function AdProvider({
  children,
  publisherId = defaultConfig.publisherId,
  enabled = true,
}: AdProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [testMode, setTestMode] = useState(process.env.NODE_ENV === 'development');

  const config: AdConfig = {
    enabled,
    publisherId,
    testMode,
    lazyLoadThreshold: 200,
  };

  useEffect(() => {
    if (!enabled || testMode) {
      setIsLoaded(true);
      return;
    }

    // Check if script already loaded
    if (document.querySelector(`script[src*="pagead2.googlesyndication.com"]`)) {
      setIsLoaded(true);
      return;
    }

    // Mark as loaded after AdSense script loads
    const checkAdSense = setInterval(() => {
      if ((window as any).adsbygoogle) {
        setIsLoaded(true);
        clearInterval(checkAdSense);
      }
    }, 100);

    // Cleanup after 10 seconds
    setTimeout(() => {
      clearInterval(checkAdSense);
      setIsLoaded(true);
    }, 10000);

    return () => clearInterval(checkAdSense);
  }, [enabled, testMode]);

  return (
    <AdContext.Provider value={{ config, isLoaded, setTestMode }}>
      {/* AdSense Script */}
      {enabled && !testMode && (
        <Helmet>
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous"
          />
        </Helmet>
      )}
      {children}
    </AdContext.Provider>
  );
}

// Utility hook for ad visibility based on user consent
export function useAdConsent() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check cookie consent status
    const consent = localStorage.getItem('cookie-consent');
    if (consent) {
      try {
        const parsed = JSON.parse(consent);
        setHasConsent(parsed.advertising === true);
      } catch {
        setHasConsent(false);
      }
    }
  }, []);

  return hasConsent;
}

export default AdProvider;
