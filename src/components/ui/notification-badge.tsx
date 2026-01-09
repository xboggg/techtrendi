import { useState, useEffect, ReactNode } from 'react';
import { Bell, X, Check, Trash2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  link?: string;
}

// Badge Component
interface BadgeProps {
  count?: number;
  max?: number;
  dot?: boolean;
  color?: 'primary' | 'destructive' | 'success' | 'warning';
  children: ReactNode;
  className?: string;
}

export function NotificationBadge({
  count = 0,
  max = 99,
  dot = false,
  color = 'destructive',
  children,
  className,
}: BadgeProps) {
  const colorClasses = {
    primary: 'bg-primary text-primary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
  };

  const displayCount = count > max ? `${max}+` : count;
  const showBadge = dot ? count > 0 : count > 0;

  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      {showBadge && (
        <span
          className={cn(
            'absolute flex items-center justify-center',
            colorClasses[color],
            dot
              ? 'top-0 right-0 w-2.5 h-2.5 rounded-full'
              : 'top-0 right-0 -translate-y-1/2 translate-x-1/2 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-medium'
          )}
        >
          {!dot && displayCount}
        </span>
      )}
    </div>
  );
}

// Notification Bell with Dropdown
export function NotificationBell({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Review Published',
      message: 'iPhone 15 Pro Max review is now live!',
      type: 'info',
      read: false,
      timestamp: new Date().toISOString(),
      link: '/reviews/iphone-15-pro-max',
    },
    {
      id: '2',
      title: 'Comment Reply',
      message: 'Someone replied to your comment on Samsung S24 Ultra',
      type: 'info',
      read: false,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      title: 'Weekly Digest',
      message: 'Your personalized weekly tech digest is ready',
      type: 'success',
      read: true,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={cn('relative', className)}>
      <NotificationBadge count={unreadCount}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="w-5 h-5" />
        </button>
      </NotificationBadge>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button className="p-1 rounded hover:bg-muted transition-colors">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors',
                      !notification.read && 'bg-primary/5'
                    )}
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                        notification.read ? 'bg-muted' : 'bg-primary'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border">
              <Button variant="ghost" className="w-full" size="sm">
                View all notifications
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Simple status badge
export function StatusBadge({
  status,
  className,
}: {
  status: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  return (
    <span
      className={cn(
        'inline-block w-3 h-3 rounded-full border-2 border-background',
        statusColors[status],
        className
      )}
      aria-label={status}
    />
  );
}

export default NotificationBadge;
