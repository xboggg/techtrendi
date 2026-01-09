import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from './button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

export function NotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { isSupported, isSubscribed, permission, requestPermission, subscribe, loading } = usePushNotifications();

  useEffect(() => {
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const timer = setTimeout(() => {
      if (isSupported && !isSubscribed && permission !== 'denied') {
        setIsVisible(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, permission]);

  const handleEnable = async () => {
    try {
      const result = await requestPermission();
      if (result === 'granted') {
        await subscribe();
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className={cn(
      'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50',
      'bg-card border border-border rounded-2xl shadow-elevated p-4',
      'animate-in slide-in-from-bottom-5 fade-in duration-300'
    )}>
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Bell className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">Stay Updated</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Get notified about new tech reviews, deals, and exclusive content.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleEnable} disabled={loading} size="sm">
              {loading ? 'Enabling...' : 'Enable'}
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationPrompt;
