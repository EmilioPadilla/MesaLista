/**
 * Web HTTP implementation: an axios instance using cookie-based auth.
 *
 * Importing this module for its side effect registers the instance as the
 * spine's `apiClient` (see `client.ts`). Import it once, early, at app boot
 * (main.tsx) before any request is made.
 */
import axios, { AxiosRequestConfig } from 'axios';
import { setApiClient, type ApiClient } from 'services/client';

export interface AxiosCustomRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  suppressErrorLog?: boolean;
}

// Determine if we're in a development environment (localhost)
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Use localhost in development, otherwise use the environment variable
const API_URL = isDevelopment ? 'http://localhost:5001/api' : import.meta.env.VITE_API_URL;

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Enable cookies for session-based auth
});

axiosClient.interceptors.request.use(
  (config) => {
    // Auth travels in the HttpOnly cookie; just ensure credentials are sent.
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const shouldSuppressLog = error.config?.suppressErrorLog;
    if (!shouldSuppressLog) {
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  },
);

// axios's instance is structurally compatible with our ApiClient contract.
setApiClient(axiosClient as unknown as ApiClient);

export default axiosClient;
