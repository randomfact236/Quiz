'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthUser } from '@/lib/auth';
import { getItem, STORAGE_KEYS } from '@/lib/storage';
import { ensureGuestToken } from '@/lib/guest-id';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Mount-time session hydration only. Login/logout flows call authService
 * directly (lib/auth.ts) and the session state is re-read on the next mount.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
      if (token) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // Warm the signed guest pair. Guest-scoped READS (session history,
    // achievement re-hydration, "did I already like this", duel polling) are
    // now guarded server-side, and the api client attaches the cached token
    // synchronously — so a first-time visitor with an empty cache would get a
    // 403 on the very first read. Fetching the pair once on mount means it is
    // cached before any of those fire. Fire-and-forget: anonymous visitors
    // never block on it, and a failure just leaves the reads unsigned.
    void ensureGuestToken();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
