/**
 * ============================================================================
 * API Client
 * ============================================================================
 * Base HTTP client for backend API communication
 * ============================================================================
 */

const BASE = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';
const API_BASE_URL = BASE.endsWith('/v1') ? BASE : `${BASE}/v1`;

import { getItem, setItem, STORAGE_KEYS, removeItem } from './storage';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  isAdmin?: boolean;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

function getToken(isAdmin?: boolean): string | null {
  if (isAdmin) {
    return getItem<string | null>(STORAGE_KEYS.ADMIN_TOKEN, null);
  }
  return getItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
}

function getRefreshToken(isAdmin?: boolean): string | null {
  if (isAdmin) {
    return getItem<string | null>(STORAGE_KEYS.ADMIN_REFRESH_TOKEN, null);
  }
  return getItem<string | null>(STORAGE_KEYS.REFRESH_TOKEN, null);
}

function saveTokens(token: string, refreshToken: string, isAdmin?: boolean): void {
  if (isAdmin) {
    setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
    setItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN, refreshToken);
  } else {
    setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

function clearTokens(isAdmin?: boolean): void {
  if (isAdmin) {
    removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
  } else {
    removeItem(STORAGE_KEYS.AUTH_TOKEN);
    removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
}

/**
 * Make an API request to the backend
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { isAdmin } = options;
  const token = getToken(isAdmin);

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { ...config, signal: controller.signal });
    clearTimeout(timeout);

    if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
      const refreshToken = getRefreshToken(isAdmin);
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            saveTokens(refreshData.token, refreshData.refreshToken, isAdmin);

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
          clearTokens(isAdmin);
        }
      } else {
        clearTokens(isAdmin);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(response.status, error.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return {
        data: undefined as T,
        status: response.status,
        ok: response.ok,
      };
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
  get: <T>(endpoint: string, options?: { isAdmin?: boolean }) => apiRequest<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body: unknown, options?: { isAdmin?: boolean }) => apiRequest<T>(endpoint, { method: 'POST', body, ...options }),
  put: <T>(endpoint: string, body: unknown, options?: { isAdmin?: boolean }) => apiRequest<T>(endpoint, { method: 'PUT', body, ...options }),
  patch: <T>(endpoint: string, body: unknown, options?: { isAdmin?: boolean }) => apiRequest<T>(endpoint, { method: 'PATCH', body, ...options }),
  delete: <T>(endpoint: string, options?: { isAdmin?: boolean }) => apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
};
