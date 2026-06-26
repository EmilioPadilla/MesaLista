import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const GUEST_ID_KEY = 'mesalista.guest_id';

const isWeb = Platform.OS === 'web';

/** RFC4122-ish v4 UUID. Math.random is fine here — this only namespaces a
 * guest's cart on the server, it is not a security boundary. */
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Persisted anonymous guest id, the mobile equivalent of the web app's
 * `localStorage.guestId`. It scopes the server-side cart for an un-authenticated
 * shopper. expo-secure-store has no web build, so we fall back to localStorage
 * when running under react-native-web.
 */
export const guestIdStore = {
  async get(): Promise<string | null> {
    if (isWeb) return typeof localStorage !== 'undefined' ? localStorage.getItem(GUEST_ID_KEY) : null;
    return SecureStore.getItemAsync(GUEST_ID_KEY);
  },
  async set(id: string): Promise<void> {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(GUEST_ID_KEY, id);
      return;
    }
    await SecureStore.setItemAsync(GUEST_ID_KEY, id);
  },
  async getOrCreate(): Promise<string> {
    const existing = await this.get();
    if (existing) return existing;
    const created = uuidv4();
    await this.set(created);
    return created;
  },
  async regenerate(): Promise<string> {
    const created = uuidv4();
    await this.set(created);
    return created;
  },
};
