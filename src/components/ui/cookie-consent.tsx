import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
  functional: boolean;
  timestamp: string;
}

const COOKIE_CONSENT_KEY = 'cookie-consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    analytics: false,
    advertising: false,
    functional: false,
    timestamp: '',
  });

  useEffect(() => {
    // Check if user has already made a choice
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        // Apply stored preferences
        applyPreferences(parsed);
      } catch {
        setIsVisible(true);
      }
    }
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    // Enable/disable analytics based on preference
    if (typeof window !== 'undefined') {
      (window as any).cookieConsent = prefs;

      // Dispatch event for other scripts to listen to
      window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: prefs }));

      // Enable Google Analytics if consent given
      if (prefs.analytics && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      }

      // Enable advertising cookies if consent given
      if (prefs.advertising && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
      }
    }
  };

  const savePreferences = (prefs: CookiePreferences) => {
    const finalPrefs = {
      ...prefs,
      essential: true, // Always true
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(finalPrefs));
    setPreferences(finalPrefs);
    applyPreferences(finalPrefs);
    setIsVisible(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      advertising: true,
      functional: true,
      timestamp: '',
    });
  };

  const acceptEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      advertising: false,
      functional: false,
      timestamp: '',
    });
  };

  const saveCustom = () => {
    savePreferences(preferences);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] animate-in fade-in duration-300"
        onClick={() => setShowSettings(false)}
      />

      {/* Cookie Banner */}
      <div className={cn(
        "fixed z-[9999] animate-in slide-in-from-bottom duration-500",
        showSettings
          ? "inset-4 md:inset-auto md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl"
          : "bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto md:max-w-md"
      )}>
        <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl shadow-elevated p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Cookie className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Cookie Preferences</h3>
                <p className="text-xs text-muted-foreground">Manage your privacy settings</p>
              </div>
            </div>
            <button
              onClick={acceptEssential}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!showSettings ? (
            <>
              {/* Simple View */}
              <p className="text-sm text-muted-foreground mb-6">
                We use cookies to enhance your experience, analyze site traffic, and serve personalized ads.
                By clicking "Accept All", you consent to our use of cookies.{' '}
                <Link to="/cookies" className="text-primary hover:underline">
                  Learn more
                </Link>
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={acceptAll} className="flex-1">
                  Accept All
                </Button>
                <Button onClick={acceptEssential} variant="outline" className="flex-1">
                  Essential Only
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="ghost"
                  className="flex-1"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Settings View */}
              <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-green-500" />
                      <h4 className="font-medium text-foreground">Essential Cookies</h4>
                      <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">
                        Always Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for the website to function properly. Cannot be disabled.
                    </p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex-1 mr-4">
                    <h4 className="font-medium text-foreground mb-1">Analytics Cookies</h4>
                    <p className="text-xs text-muted-foreground">
                      Help us understand how visitors interact with our website using Google Analytics.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>

                {/* Advertising Cookies */}
                <div className="flex items-start justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex-1 mr-4">
                    <h4 className="font-medium text-foreground mb-1">Advertising Cookies</h4>
                    <p className="text-xs text-muted-foreground">
                      Used to show personalized ads through Google AdSense and track ad performance.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.advertising}
                      onChange={(e) => setPreferences(p => ({ ...p, advertising: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>

                {/* Functional Cookies */}
                <div className="flex items-start justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex-1 mr-4">
                    <h4 className="font-medium text-foreground mb-1">Functional Cookies</h4>
                    <p className="text-xs text-muted-foreground">
                      Enable enhanced functionality like saving preferences and personalization.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences(p => ({ ...p, functional: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={saveCustom} className="flex-1">
                  Save Preferences
                </Button>
                <Button onClick={acceptAll} variant="outline" className="flex-1">
                  Accept All
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </>
          )}

          {/* Footer Links */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">
              Cookie Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook to check consent status
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        setConsent(null);
      }
    }

    // Listen for updates
    const handleUpdate = (e: CustomEvent<CookiePreferences>) => {
      setConsent(e.detail);
    };

    window.addEventListener('cookieConsentUpdate', handleUpdate as EventListener);
    return () => window.removeEventListener('cookieConsentUpdate', handleUpdate as EventListener);
  }, []);

  return consent;
}

export default CookieConsent;
