/**
 * Platform-neutral HTTP client contract.
 *
 * Every service imports `apiClient` from this file and calls `.get/.post/...`.
 * The concrete implementation is registered once at app boot via
 * `setApiClient`:
 *   - web    → an axios instance (cookie auth) — see `client.axios.ts`
 *   - mobile → a fetch wrapper (Bearer token from secure storage)
 *
 * This keeps the portable spine free of axios and cookies. Services are
 * unchanged: they still `import apiClient from './client'`.
 */

export interface CustomAxiosRequestConfig {
  /** Skip attaching auth credentials for public endpoints. */
  skipAuth?: boolean;
  /** Suppress the global console error log for expected failures. */
  suppressErrorLog?: boolean;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  responseType?: string;
  signal?: AbortSignal;
  // Allow platform-specific extras (e.g. axios fields) without breaking callers.
  [key: string]: unknown;
}

// `data` defaults to `any` to match axios's prior behavior — services rely on
// `response.data` being assignable to their declared return types.
export interface ApiResponse<T = any> {
  data: T;
  status?: number;
  [key: string]: unknown;
}

export interface ApiClient {
  get<T = any>(url: string, config?: CustomAxiosRequestConfig): Promise<ApiResponse<T>>;
  delete<T = any>(url: string, config?: CustomAxiosRequestConfig): Promise<ApiResponse<T>>;
  post<T = any>(url: string, data?: unknown, config?: CustomAxiosRequestConfig): Promise<ApiResponse<T>>;
  put<T = any>(url: string, data?: unknown, config?: CustomAxiosRequestConfig): Promise<ApiResponse<T>>;
  patch<T = any>(url: string, data?: unknown, config?: CustomAxiosRequestConfig): Promise<ApiResponse<T>>;
}

let impl: ApiClient | null = null;

/** Register the platform-specific HTTP implementation. Call once at boot. */
export function setApiClient(client: ApiClient): void {
  impl = client;
}

function active(): ApiClient {
  if (!impl) {
    throw new Error('API client not registered. Call setApiClient() at app startup before any request.');
  }
  return impl;
}

/** Stable proxy the spine imports. Forwards to the registered implementation. */
const apiClient: ApiClient = {
  get: (url, config) => active().get(url, config),
  delete: (url, config) => active().delete(url, config),
  post: (url, data, config) => active().post(url, data, config),
  put: (url, data, config) => active().put(url, data, config),
  patch: (url, data, config) => active().patch(url, data, config),
};

export default apiClient;
