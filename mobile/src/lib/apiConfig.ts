import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Base URL for the MesaLista API.
 *
 * - Production: set `EXPO_PUBLIC_API_URL` (e.g. https://api.mesalista.com.mx/api).
 * - Development: defaults to the local Express server. On a physical device the
 *   loopback `localhost` won't reach your machine, so we derive the LAN IP from
 *   the Expo dev server host; Android emulator uses 10.0.2.2.
 */
function devBaseUrl(): string {
  // Host the Metro/Expo dev server is served from, e.g. "192.168.1.20:8081".
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? '';
  const host = hostUri.split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:5001/api`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/api';
  }
  return 'http://localhost:5001/api';
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || devBaseUrl();

/** Public web base URL (no trailing slash) — used to build shareable links. */
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL?.trim() || 'https://mesalista.com.mx').replace(/\/$/, '');
