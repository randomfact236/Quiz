import { api } from './api-client';
import { getGuestId, rotateGuestId } from './guest-id';
import { getItem, setItem, removeItem, STORAGE_KEYS } from './storage';
import { track } from './analytics';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
  /** Set for a brand-new Google account (A7 signup anchor, plan/13 §4b). */
  isNewUser?: boolean;
}

/**
 * Attach this browser's guest activity (likes, comments) to the freshly
 * signed-in account, then retire the guest id: the account owns everything,
 * and a brand-new guest id keeps this device's future anonymous activity
 * from flowing back into the account. Best-effort — a failed merge keeps
 * the guest id so the next sign-in retries it; login itself never blocks.
 */
async function mergeGuestIntoAccount(): Promise<void> {
  const guestId = getGuestId();
  if (!guestId) return;
  try {
    await api.post('/guest-users/merge', { guestId });
    rotateGuestId();
  } catch {
    /* merge retried on next sign-in */
  }
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { token, refreshToken } = response.data;
    setItem(STORAGE_KEYS.AUTH_TOKEN, token, true);
    setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, true);
    // Role-aware single login (plan/01 §6): an admin signing in on the main
    // page gets the admin session too, so the Admin Panel is one click away —
    // no separate /admin/login roundtrip. /admin/login remains the fallback
    // for expired sessions.
    if (response.data.user?.role === 'admin') {
      setItem(STORAGE_KEYS.ADMIN_TOKEN, token, true);
      setItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN, refreshToken, true);
    }
    await mergeGuestIntoAccount();
    return response.data;
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { name, email, password });
    const { token, refreshToken } = response.data;
    setItem(STORAGE_KEYS.AUTH_TOKEN, token, true);
    setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, true);
    await mergeGuestIntoAccount();
    return response.data;
  },

  googleLogin: (): void => {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';
    window.location.href = `${apiUrl}/auth/google`;
  },

  /** Exchanges the single-use code from the OAuth redirect for tokens and stores them. */
  exchangeOAuthCode: async (code: string, remember: boolean): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/oauth/exchange', { code });
    const { token, refreshToken } = response.data;
    setItem(STORAGE_KEYS.AUTH_TOKEN, token, remember);
    setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, remember);
    // A7 signup anchor (plan/13 §4b): Google registrations bypass the register
    // page, so the client completes the funnel join here — emitted BEFORE
    // mergeGuestIntoAccount() rotates the guest id, so signup_completed carries
    // the SAME device guestId as the visitor's pre-signup events.
    if (response.data.isNewUser) {
      track('signup_completed', { method: 'google' }, { module: 'site' });
    }
    await mergeGuestIntoAccount();
    return response.data;
  },

  logout: (): void => {
    // Revoke the refresh token server-side before clearing local storage.
    // Fire-and-forget: logout must succeed even if the API call fails.
    const refreshToken = getItem<string | null>(STORAGE_KEYS.REFRESH_TOKEN, null);
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    }
    removeItem(STORAGE_KEYS.AUTH_TOKEN);
    removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    // Fresh guest identity for whoever uses the browser next — a shared
    // device must not expose (or re-merge) the previous guest's activity.
    rotateGuestId();
  },

  logoutAdmin: (): void => {
    // Same server-side revocation for the separate admin token pair (the
    // deliberate two-store design — see lib/api-client.ts). The endpoint is
    // public and idempotent, so this is safe even if the token is stale.
    const refreshToken = getItem<string | null>(STORAGE_KEYS.ADMIN_REFRESH_TOKEN, null);
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    }
    removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/resend-verification', { email });
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
