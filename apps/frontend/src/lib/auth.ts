import { api } from './api-client';
import { setItem, removeItem, STORAGE_KEYS } from './storage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { token, refreshToken } = response.data;
    setItem(STORAGE_KEYS.AUTH_TOKEN, token, true);
    setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, true);
    return response.data;
  },

  googleLogin: (): void => {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';
    window.location.href = `${apiUrl}/auth/google`;
  },

  googleCallback: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>('/auth/google/callback');
    const { token, refreshToken } = response.data;
    setItem(STORAGE_KEYS.AUTH_TOKEN, token, true);
    setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, true);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
    const { token, refreshToken: newRefreshToken } = response.data;
    setItem(STORAGE_KEYS.AUTH_TOKEN, token, true);
    setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken, true);
    return response.data;
  },

  logout: (): void => {
    removeItem(STORAGE_KEYS.AUTH_TOKEN);
    removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getCurrentUser: async (): Promise<AuthUser | null> => {
    try {
      const response = await api.get<AuthUser>('/users/profile');
      return response.data;
    } catch {
      return null;
    }
  },
};
