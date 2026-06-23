import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'mesalista.session_token';

/**
 * Persisted session token used as `Authorization: Bearer <token>` for API
 * calls. Mirrors the web app's HttpOnly cookie, but device-side.
 */
export const tokenStore = {
  async get(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
