import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    essential: true,
    analytics: false,
    advertising: false,
    functional: false,
    timestamp: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        applyPreferences(parsed);
      } catch {
        setIsVisible(true);
      }
    }
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    if (typeof window !== 'undefined') {
      (window as any).cookieConsent = prefs;
      window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: prefs }));
      if (prefs.analytics && (window as any).gtag) {
        (window as any).gtag('consent', 'update', { analytics_storage: 'granted' });
      }
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
    const finalPrefs = { ...prefs, essential: true, timestamp: new Date().toISOString() };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(finalPrefs));
    setPreferences(finalPrefs);
    applyPreferences(finalPrefs);
    setIsVisible(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    savePreferences({ essential: true, analytics: true, advertising: true, functional: true, timestamp: '' });
  };

  const acceptEssential = () => {
    savePreferences({ essential: true, analytics: false, advertising: false, functional: false, timestamp: '' });
  };

  if (!isVisible) return null;

  // Compact bottom bar
  if (!showSettings) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-300">
        <div className="bg-card/95 backdrop-blur-md border-t border-border shadow-lg px-4 py-3">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              We use cookies to improve your experience.{' '}
              <Link to="/cookies" className="text-primary hover:underline">Learn more</Link>
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={acceptAll} size="sm" className="h-8 px-4 text-xs">
                Accept
              </Button>
              <Button onClick={acceptEssential} variant="ghost" size="sm" className="h-8 px-3 text-xs">
                Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Settings modal
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={() => setShowSettings(false)} />
      <div className="fixed z-[9999] inset-4 md:inset-auto md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg">
        <div className="bg-card border border-border rounded-2xl shadow-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Cookie Settings</h3>
            </div>
            <button onClick={() => setShowSettings(false)} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Essential</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded">Always On</span>
              </div>
            </div>

            {[
              { key: 'analytics', label: 'Analytics' },
              { key: 'advertising', label: 'Advertising' },
              { key: 'functional', label: 'Functional' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[key as keyof CookiePreferences] as boolean}
                    onChange={(e) => setPreferences(p => ({ ...p, [key]: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={() => savePreferences(preferences)} className="flex-1" size="sm">Save</Button>
            <Button onClick={acceptAll} variant="outline" className="flex-1" size="sm">Accept All</Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try { setConsent(JSON.parse(stored)); } catch { setConsent(null); }
    }
    const handleUpdate = (e: CustomEvent<CookiePreferences>) => setConsent(e.detail);
    window.addEventListener('cookieConsentUpdate', handleUpdate as EventListener);
    return () => window.removeEventListener('cookieConsentUpdate', handleUpdate as EventListener);
  }, []);

  return consent;
}

export default CookieConsent;
