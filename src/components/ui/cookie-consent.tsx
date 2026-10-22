import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Cookie, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateConsent } from '@/lib/gtag';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
  functional: boolean;
  timestamp: string;
}

const COOKIE_CONSENT_KEY = 'cookie-consent';
/** The data bundle pages (preview and launch addresses) get a compact one-row bar on phones,
 *  so the page's answer stays on the first screen (UI audit M3). */
const COMPACT_PATH = /^\/(?:tools-preview\/)?data-bundles(?:\/|$)/;

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

  const { pathname } = useLocation();
  const compact = COMPACT_PATH.test(pathname);
  const barRef = useRef<HTMLDivElement>(null);

  // While the bar shows, the page scrolls focused fields and #anchors clear of it
  // (scroll-padding-bottom = its height; UI audit M4). Put back when it goes.
  useEffect(() => {
    if (!isVisible || showSettings) return;
    const el = barRef.current;
    if (!el || typeof document === 'undefined') return;
    const root = document.documentElement;
    const prev = root.style.scrollPaddingBottom;
    const set = () => { root.style.scrollPaddingBottom = `${el.offsetHeight}px`; };
    set();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(set) : null;
    ro?.observe(el);
    return () => { ro?.disconnect(); root.style.scrollPaddingBottom = prev; };
  }, [isVisible, showSettings, compact]);

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
    if (typeof window === 'undefined') return;

    (window as any).cookieConsent = prefs;
    window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: prefs }));

    // Always send both signals, granted AND denied. The old version only ever
    // sent 'granted' and never revoked, so Decline silently did nothing —
    // which matters now that non-EEA visitors default to granted.
    updateConsent(prefs.analytics, prefs.advertising);
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

  // Accept: white on a darker blue than the site's (the site blue gives 4.45:1 in light and 3.4:1 in
  // dark mode); "Learn more" in blue-700 / blue-300. Both at least 4.5:1 in both themes.
  const acceptCls = 'bg-blue-700 text-white hover:bg-blue-800';

  // Data bundle pages: one row, at most 56 px tall on phones, 44 px buttons.
  if (!showSettings && compact) {
    return (
      <div ref={barRef} data-testid="cookie-banner" data-compact="1" className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-300">
        <div className="bg-card/95 backdrop-blur-md border-t border-border shadow-lg px-4 py-[5px] sm:py-2">
          <div className="container mx-auto flex flex-row items-center justify-between gap-2 sm:gap-3 px-0">
            <p className="min-w-0 text-xs text-muted-foreground">
              We use cookies.{' '}
              <Link to="/cookies" className="inline-flex min-h-11 items-center font-semibold text-blue-700 underline underline-offset-2 dark:text-blue-300 sm:min-h-0">Learn more</Link>
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button onClick={acceptAll} size="sm" className={`h-11 px-3 text-xs sm:h-8 sm:px-4 ${acceptCls}`}>
                Accept
              </Button>
              <Button onClick={acceptEssential} variant="ghost" size="sm" className="h-11 px-3 text-xs text-foreground sm:h-8">
                Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact bottom bar
  if (!showSettings) {
    return (
      <div ref={barRef} data-testid="cookie-banner" className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-300">
        <div className="bg-card/95 backdrop-blur-md border-t border-border shadow-lg px-4 py-3">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              We use cookies to improve your experience.{' '}
              <Link to="/cookies" className="text-blue-700 hover:underline dark:text-blue-300">Learn more</Link>
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={acceptAll} size="sm" className={`h-8 px-4 text-xs ${acceptCls}`}>
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
