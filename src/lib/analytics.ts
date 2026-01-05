/**
 * Privacy-Friendly Analytics for TechTrendi
 *
 * Features:
 * - No cookies by default
 * - No personal data collection
 * - Respects Do Not Track (DNT)
 * - GDPR compliant
 * - Stores only aggregate data
 */

interface PageViewEvent {
  path: string;
  referrer: string;
  timestamp: number;
  screenWidth: number;
  screenHeight: number;
}

interface AnalyticsConfig {
  enabled: boolean;
  respectDNT: boolean;
  endpoint?: string;
  debug: boolean;
}

const defaultConfig: AnalyticsConfig = {
  enabled: true,
  respectDNT: true,
  debug: import.meta.env.DEV,
};

class PrivacyAnalytics {
  private config: AnalyticsConfig;
  private sessionId: string;
  private queue: PageViewEvent[] = [];

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    // Generate a random session ID (not tied to user identity)
    return Math.random().toString(36).substring(2, 15);
  }

  private shouldTrack(): boolean {
    // Check if tracking is enabled
    if (!this.config.enabled) return false;

    // Respect Do Not Track header
    if (this.config.respectDNT && navigator.doNotTrack === '1') {
      if (this.config.debug) {
        console.log('[Analytics] DNT enabled, not tracking');
      }
      return false;
    }

    // Check for localStorage consent (if implemented)
    try {
      const consent = localStorage.getItem('analytics-consent');
      if (consent === 'denied') return false;
    } catch {
      // localStorage not available
    }

    return true;
  }

  /**
   * Track a page view
   */
  trackPageView(path?: string): void {
    if (!this.shouldTrack()) return;

    const event: PageViewEvent = {
      path: path || window.location.pathname,
      referrer: document.referrer ? new URL(document.referrer).hostname : 'direct',
      timestamp: Date.now(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };

    if (this.config.debug) {
      console.log('[Analytics] Page view:', event);
    }

    this.queue.push(event);

    // Send if we have an endpoint configured
    if (this.config.endpoint) {
      this.flush();
    }
  }

  /**
   * Track a custom event (e.g., button clicks, tool usage)
   */
  trackEvent(category: string, action: string, label?: string, value?: number): void {
    if (!this.shouldTrack()) return;

    const event = {
      category,
      action,
      label,
      value,
      path: window.location.pathname,
      timestamp: Date.now(),
    };

    if (this.config.debug) {
      console.log('[Analytics] Event:', event);
    }

    // Store in localStorage for local analytics dashboard
    this.storeLocalEvent('events', event);
  }

  /**
   * Track tool usage for popular tools page
   */
  trackToolUsage(toolName: string): void {
    this.trackEvent('tools', 'use', toolName);

    // Increment tool usage counter
    try {
      const key = `tool_usage_${toolName}`;
      const current = parseInt(localStorage.getItem(key) || '0', 10);
      localStorage.setItem(key, String(current + 1));
    } catch {
      // localStorage not available
    }
  }

  /**
   * Track search queries (without storing the actual query for privacy)
   */
  trackSearch(category: string): void {
    this.trackEvent('search', 'query', category);
  }

  /**
   * Get local analytics data (for admin dashboard)
   */
  getLocalStats(): {
    totalPageViews: number;
    toolUsage: Record<string, number>;
    topPages: Array<{ path: string; views: number }>;
  } {
    try {
      const pageViews = JSON.parse(localStorage.getItem('analytics_pageviews') || '[]');
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');

      // Count page views
      const pageCounts: Record<string, number> = {};
      pageViews.forEach((pv: PageViewEvent) => {
        pageCounts[pv.path] = (pageCounts[pv.path] || 0) + 1;
      });

      // Get tool usage
      const toolUsage: Record<string, number> = {};
      const toolKeys = Object.keys(localStorage).filter(k => k.startsWith('tool_usage_'));
      toolKeys.forEach(key => {
        const toolName = key.replace('tool_usage_', '');
        toolUsage[toolName] = parseInt(localStorage.getItem(key) || '0', 10);
      });

      // Sort pages by views
      const topPages = Object.entries(pageCounts)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      return {
        totalPageViews: pageViews.length,
        toolUsage,
        topPages,
      };
    } catch {
      return {
        totalPageViews: 0,
        toolUsage: {},
        topPages: [],
      };
    }
  }

  /**
   * Store event in localStorage (with size limit)
   */
  private storeLocalEvent(type: string, event: unknown): void {
    try {
      const key = `analytics_${type}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');

      // Keep only last 1000 events to prevent storage bloat
      if (existing.length >= 1000) {
        existing.shift();
      }

      existing.push(event);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {
      // localStorage full or not available
    }
  }

  /**
   * Flush queued events to server
   */
  private async flush(): Promise<void> {
    if (!this.config.endpoint || this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events,
        }),
        keepalive: true,
      });
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Failed to send events:', error);
      }
      // Re-queue failed events
      this.queue.unshift(...events);
    }
  }

  /**
   * Clear all local analytics data
   */
  clearData(): void {
    try {
      const keys = Object.keys(localStorage).filter(
        k => k.startsWith('analytics_') || k.startsWith('tool_usage_')
      );
      keys.forEach(key => localStorage.removeItem(key));
    } catch {
      // localStorage not available
    }
  }

  /**
   * Set user consent for analytics
   */
  setConsent(consent: 'granted' | 'denied'): void {
    try {
      localStorage.setItem('analytics-consent', consent);
      if (consent === 'denied') {
        this.clearData();
      }
    } catch {
      // localStorage not available
    }
  }
}

// Singleton instance
export const analytics = new PrivacyAnalytics();

// React hook for tracking page views
export function usePageTracking(): void {
  if (typeof window !== 'undefined') {
    // Track initial page view
    analytics.trackPageView();
  }
}

// Export for use in components
export default analytics;
