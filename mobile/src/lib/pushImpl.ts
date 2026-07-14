import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { setPush } from 'platform/push';

/**
 * Mobile implementation of the spine's PushApi seam. Requests notification
 * permission and returns the device's Expo push token, or null when it can't
 * (simulator, permission denied, missing EAS projectId). Registered once at boot
 * via registerPushImpl(), mirroring registerApiClient()/setNotify().
 */

// Show alerts/sounds even when a push arrives while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getProjectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;

async function getExpoPushToken(): Promise<string | null> {
  // Remote push requires a physical device (and does not work in Expo Go on SDK 53+;
  // use an EAS dev build). Silently no-op on simulators.
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('No EAS projectId found; cannot fetch Expo push token.');
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    console.error('Error fetching Expo push token:', error);
    return null;
  }
}

/** Register the mobile push implementation as the spine's push adapter. */
export function registerPushImpl(): void {
  setPush({
    getExpoPushToken,
    platform: Platform.OS === 'android' ? 'android' : 'ios',
  });
}
