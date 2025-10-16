import axios, { AxiosRequestConfig } from 'axios';

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  suppressErrorLog?: boolean;
}

// Determine if we're in a development environment (localhost)
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Use localhost in development, otherwise use the environment variable
const API_URL = isDevelopment ? 'http://localhost:5001/api' : import.meta.env.VITE_API_URL;

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Enable cookies for session-based auth
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    // No need to add Authorization header since we use HttpOnly cookies
    // Just ensure withCredentials is set for this request
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only log errors if not explicitly suppressed
    // Check if this is a request from React Query with suppressErrorLog meta
    const shouldSuppressLog = error.config?.suppressErrorLog;

    if (!shouldSuppressLog) {
      // Handle errors globally
      console.error('API Error:', error);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
