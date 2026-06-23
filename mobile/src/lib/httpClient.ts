import { setApiClient, type ApiClient, type ApiResponse, type CustomAxiosRequestConfig } from 'services/client';
import { tokenStore } from './secureStore';
import { API_URL } from './apiConfig';

/**
 * Mobile HTTP implementation of the spine's ApiClient contract: a fetch wrapper
 * that attaches the Bearer token from secure storage and shapes errors like
 * axios (`error.response.data.error`, `error.message`) so the shared hooks read
 * them unchanged.
 */
export class ApiError extends Error {
  response: { status: number; data: any };
  status: number;
  constructor(status: number, data: any) {
    super((data && (data.error || data.message)) || `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.response = { status, data };
  }
}

function buildUrl(url: string, params?: Record<string, unknown>): string {
  const base = url.startsWith('http') ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  if (!params) return base;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  });
  const query = qs.toString();
  return query ? `${base}${base.includes('?') ? '&' : '?'}${query}` : base;
}

async function request<T>(
  method: string,
  url: string,
  data?: unknown,
  config?: CustomAxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(config?.headers as Record<string, string> | undefined),
  };

  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  let body: BodyInit | undefined;
  if (data !== undefined && method !== 'GET' && method !== 'DELETE') {
    if (isFormData) {
      body = data as FormData; // let fetch set the multipart boundary
    } else {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      body = JSON.stringify(data);
    }
  }

  if (!config?.skipAuth) {
    const token = await tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(url, config?.params), { method, headers, body, signal: config?.signal });
  } catch (networkError) {
    if (!config?.suppressErrorLog) console.error('Network error:', networkError);
    throw new ApiError(0, { error: 'Network request failed' });
  }

  const text = await res.text();
  let parsed: any = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    if (!config?.suppressErrorLog) console.error(`API Error ${res.status}:`, parsed);
    throw new ApiError(res.status, parsed);
  }

  return { data: parsed as T, status: res.status };
}

const mobileApiClient: ApiClient = {
  get: (url, config) => request('GET', url, undefined, config),
  delete: (url, config) => request('DELETE', url, undefined, config),
  post: (url, data, config) => request('POST', url, data, config),
  put: (url, data, config) => request('PUT', url, data, config),
  patch: (url, data, config) => request('PATCH', url, data, config),
};

/** Register the fetch client as the spine's apiClient. Call once at boot. */
export function registerApiClient(): void {
  setApiClient(mobileApiClient);
}

export default mobileApiClient;
