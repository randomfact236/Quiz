/**
 * ============================================================================
 * API Client
 * ============================================================================
 * Base HTTP client for backend API communication
 * ============================================================================
 */

const BASE = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';
const API_BASE_URL = BASE.endsWith('/v1') ? BASE : `${BASE}/v1`;

// DEBUG: Log the actual API URL being used
console.log('[API Client] Using BASE URL:', BASE);
console.log('[API Client] Using API_BASE_URL:', API_BASE_URL);

import { getItem, setItem, STORAGE_KEYS, removeItem } from './storage';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

/**
 * Make an API request to the backend
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = getItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);

  const config: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  // Abort after 10 seconds — prevents infinite loading spinners
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { ...config, signal: controller.signal });
    clearTimeout(timeout);

    // If 401 Unauthorized and we have a refresh token, try to refresh and retry
    if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
      const refreshToken = getItem<string | null>(STORAGE_KEYS.REFRESH_TOKEN, null);
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();

            // Determine where to save tokens based on where the original tokens were stored
            const hadSessionToken = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) !== null;
            const hadLocalToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) !== null;

            // Save new tokens to the same storage(s) as original
            if (hadSessionToken || !hadLocalToken) {
              // If had session token OR didn't have local token, save to sessionStorage
              sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, refreshData.token);
              sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshData.refreshToken);
            }
            if (hadLocalToken) {
              // If had local token (Remember Me was checked), also save to localStorage
              localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, refreshData.token);
              localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshData.refreshToken);
            }

            // Retrofit config and retry original request
            const retryHeaders = new Headers(config.headers);
            retryHeaders.set('Authorization', `Bearer ${refreshData.token}`);
            const retryConfig = { ...config, headers: retryHeaders };

            const retryRes = await fetch(url, retryConfig);
            if (!retryRes.ok) throw new Error('Retry failed');

            return {
              data: await retryRes.json(),
              status: retryRes.status,
              ok: retryRes.ok,
            };
          }
        } catch (e) {
          // If refresh fails, clear tokens so the user is forced to log in again
          removeItem(STORAGE_KEYS.AUTH_TOKEN);
          removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (typeof window !== 'undefined') {
            window.location.href = '/admin/login';
          }
        }
      } else {
        // No refresh token available, force login
        removeItem(STORAGE_KEYS.AUTH_TOKEN);
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(response.status, error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      data,
      status: response.status,
      ok: response.ok,
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'PUT', body }),
  patch: <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
