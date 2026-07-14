/**
 * Platform-neutral push-notification adapter.
 *
 * The portable spine must not import `expo-notifications`. Instead it calls
 * `push.*`, and each platform registers a concrete implementation at boot via
 * `setPush`:
 *   - mobile → requests permission + returns the Expo push token
 *   - web    → no-op (returns null); web push is not supported yet
 *
 * Calls made before an implementation is registered are safe no-ops.
 */
export interface PushApi {
  /**
   * Ensure notification permission and return the device's Expo push token,
   * or null if unavailable (permission denied, simulator, web, not configured).
   */
  getExpoPushToken: () => Promise<string | null>;
  /** Device platform for the registered token: "ios" | "android". */
  platform: string;
}

const defaultImpl: PushApi = {
  getExpoPushToken: async () => null,
  platform: 'web',
};

let impl: PushApi = defaultImpl;

/** Register the platform-specific push implementation. Call once at boot. */
export function setPush(api: PushApi): void {
  impl = api;
}

/** Stable proxy the spine imports. Forwards to the registered implementation. */
export const push: PushApi = {
  getExpoPushToken: () => impl.getExpoPushToken(),
  get platform() {
    return impl.platform;
  },
};
