'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthUser } from '@/lib/auth';
import { getItem, STORAGE_KEYS } from '@/lib/storage';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
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
