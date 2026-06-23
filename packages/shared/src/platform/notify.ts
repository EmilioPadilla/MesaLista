/**
 * Platform-neutral notification adapter.
 *
 * The portable spine (hooks/services) must not import a UI toolkit. Instead it
 * calls `notify.*`, and each platform registers a concrete implementation at
 * boot via `setNotify`:
 *   - web   → antd `message` / `notification` (see contexts/NotificationContext)
 *   - mobile → a React Native toast
 *
 * Calls made before an implementation is registered are no-ops (safe default).
 */
export interface NotifyApi {
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const noop = () => {};

let impl: NotifyApi = {
  success: noop,
  error: noop,
  warning: noop,
  info: noop,
};

/** Register the platform-specific notification implementation. */
export function setNotify(api: NotifyApi): void {
  impl = api;
}

/** Stable proxy the spine imports. Forwards to the registered implementation. */
export const notify: NotifyApi = {
  success: (message, description) => impl.success(message, description),
  error: (message, description) => impl.error(message, description),
  warning: (message, description) => impl.warning(message, description),
  info: (message, description) => impl.info(message, description),
};
