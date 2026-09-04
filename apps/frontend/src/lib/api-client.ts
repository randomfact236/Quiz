/**
 * ============================================================================
 * API Client
 * ============================================================================
 * Base HTTP client for backend API communication
 * ============================================================================
 */

const BASE = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';
/** Root of the versioned API — also used by the analytics exit-flush beacon. */
export const API_BASE_URL = BASE.endsWith('/v1') ? BASE : `${BASE}/v1`;

import { getItem, setItem, STORAGE_KEYS, removeItem } from './storage';

/**
 * Why two token stores: the admin token pair (ADMIN_TOKEN / ADMIN_REFRESH_TOKEN)
 * is deliberately separate from the user pair (AUTH_TOKEN / REFRESH_TOKEN) so an
 * admin session in the admin panel can coexist with a regular user session in
 * the same browser without either login overwriting the other. Call sites opt in
 * via `{ isAdmin: true }` (or the `adminApi` helpers); everything else defaults
 * to the user pair. Do NOT merge them — one store would log the other side out
 * on every admin/user switch.
 */

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  isAdmin?: boolean;
}

/** Type guard: FormData bodies are sent as-is (browser sets multipart headers). */
function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

/**
 * API-failure observers (analytics `api_failed`, plan/13 §4b A6). A listener
 * list keeps api-client dependency-free — error-tracking subscribes to it, so
 * a failing request can be reported without api-client importing analytics
 * (which would loop: analytics itself posts through this client).
 */
type ApiFailureListener = (endpoint: string, status: number) => void;
const apiFailureListeners = new Set<ApiFailureListener>();

export function onApiFailure(listener: ApiFailureListener): () => void {
  apiFailureListeners.add(listener);
  return () => {
    apiFailureListeners.delete(listener);
  };
}

function notifyApiFailure(endpoint: string, status: number): void {
  for (const listener of apiFailureListeners) {
    try {
      listener(endpoint, status);
    } catch {
      // Observers must never break the failing call's error path.
    }
  }
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

  const formData = isFormData(options.body);
  const config: RequestInit = {
    method: options.method || 'GET',
    headers: {
      // Never set Content-Type for FormData — the browser adds the multipart
      // boundary itself; a manual header would break the request.
      ...(formData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  if (options.body) {
    config.body = formData ? (options.body as FormData) : JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

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
            body: JSON.stringify({ refreshToken }),
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
          // Refresh failed — the session is over. Send admin sessions back to
          // the admin login instead of leaving failed calls everywhere
          // (plan/12-admin-dashboard.md P2).
          if (isAdmin && typeof window !== 'undefined') {
            const { pathname } = window.location;
            if (!pathname.startsWith('/admin/login')) {
              window.location.assign('/admin/login?expired=1');
            }
          }
        } catch (e) {
          clearTokens(isAdmin);
          if (isAdmin && typeof window !== 'undefined') {
            const { pathname } = window.location;
            if (!pathname.startsWith('/admin/login')) {
              window.location.assign('/admin/login?expired=1');
            }
          }
        }
      } else {
        const hadTokens = Boolean(getToken(isAdmin));
        clearTokens(isAdmin);
        if (isAdmin && hadTokens && typeof window !== 'undefined') {
          const { pathname } = window.location;
          if (!pathname.startsWith('/admin/login')) {
            window.location.assign('/admin/login?expired=1');
          }
        }
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
    if (err instanceof ApiError) {
      notifyApiFailure(endpoint, err.status);
      throw err;
    }
    notifyApiFailure(endpoint, 0);
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: { isAdmin?: boolean }) =>
    apiRequest<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body: unknown, options?: { isAdmin?: boolean }) =>
    apiRequest<T>(endpoint, { method: 'POST', body, ...options }),
  put: <T>(endpoint: string, body: unknown, options?: { isAdmin?: boolean }) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, ...options }),
  patch: <T>(endpoint: string, body: unknown, options?: { isAdmin?: boolean }) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body, ...options }),
  delete: <T>(endpoint: string, options?: { isAdmin?: boolean }) =>
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
};

/**
 * Admin-scoped variants — always authenticate with the admin token, so call
 * sites don't have to remember `{ isAdmin: true }` on every request.
 */
export const adminApi = {
  get: <T>(endpoint: string) => api.get<T>(endpoint, { isAdmin: true }),
  post: <T>(endpoint: string, body: unknown) => api.post<T>(endpoint, body, { isAdmin: true }),
  put: <T>(endpoint: string, body: unknown) => api.put<T>(endpoint, body, { isAdmin: true }),
  patch: <T>(endpoint: string, body: unknown) => api.patch<T>(endpoint, body, { isAdmin: true }),
  delete: <T>(endpoint: string) => api.delete<T>(endpoint, { isAdmin: true }),
};
