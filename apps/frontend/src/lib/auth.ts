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

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { name, email, password });
    const { token, refreshToken } = response.data;
    setItem(STORAGE_KEYS.AUTH_TOKEN, token, true);
    setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, true);
    return response.data;
  },

  googleLogin: (): void => {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';
    window.location.href = `${apiUrl}/auth/google`;
  },

  logout: (): void => {
    removeItem(STORAGE_KEYS.AUTH_TOKEN);
    removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword });
    return response.data;
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
