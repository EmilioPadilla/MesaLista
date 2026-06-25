import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'mesalista.session_token';

const isWeb = Platform.OS === 'web';

/**
 * Persisted session token used as `Authorization: Bearer <token>` for API
 * calls. Mirrors the web app's HttpOnly cookie, but device-side.
 *
 * expo-secure-store has no web implementation, so on web (react-native-web dev)
 * we fall back to localStorage. Native platforms use the encrypted store.
 */
export const tokenStore = {
  async get(): Promise<string | null> {
    if (isWeb) return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string): Promise<void> {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
