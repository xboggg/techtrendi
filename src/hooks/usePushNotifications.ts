import { useState, useEffect, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      let permission: NotificationPermission | null = null;
      let isSubscribed = false;

      if (isSupported) {
        permission = Notification.permission;

        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          isSubscribed = !!subscription;
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }

      setState({ isSupported, isSubscribed, permission });
    };

    checkSupport();
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      await registration.update();
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      throw new Error('Push notifications not supported');
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission;
    } finally {
      setLoading(false);
    }
  }, [state.isSupported]);

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      throw new Error('Push notifications not supported');
    }

    setLoading(true);
    try {
      const registration = await registerServiceWorker();
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });

      setState((prev) => ({ ...prev, isSubscribed: true }));
      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.isSupported, registerServiceWorker]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      setState((prev) => ({ ...prev, isSubscribed: false }));
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (state.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      ...options,
    });
  }, [state.permission]);

  return {
    ...state,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    registerServiceWorker,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
