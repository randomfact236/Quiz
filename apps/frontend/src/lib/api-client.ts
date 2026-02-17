/**
 * ============================================================================
 * API Client
 * ============================================================================
 * Base HTTP client for backend API communication
 * ============================================================================
 */

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';

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
  
  const config: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(url, config);
  
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
