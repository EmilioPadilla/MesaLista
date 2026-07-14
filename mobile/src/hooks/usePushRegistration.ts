import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { push } from 'platform/push';
import { useRegisterPushToken } from 'hooks/usePush';
import { useAuth } from '@/auth/AuthContext';

/**
 * Registers this device's Expo push token with the backend once the user is
 * authenticated, and deep-links when a notification is tapped. Mount inside the
 * protected (app) group where a user is guaranteed.
 */
export function usePushRegistration(): void {
  const { user, isAuthenticated } = useAuth();
  const { mutate: registerToken } = useRegisterPushToken();
  const registeredForUser = useRef<number | null>(null);

  // Register the push token after login (once per user id per session).
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (registeredForUser.current === user.id) return;
    registeredForUser.current = user.id;

    (async () => {
      const token = await push.getExpoPushToken();
      if (!token) {
        registeredForUser.current = null; // allow a retry on next mount (e.g. permission later granted)
        return;
      }
      registerToken({ token, platform: push.platform });
    })();
  }, [isAuthenticated, user, registerToken]);

  // Deep-link when the user taps a notification.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string };
      if (data?.type === 'gift_received') {
        router.push('/(app)');
      }
    });
    return () => sub.remove();
  }, []);
}
