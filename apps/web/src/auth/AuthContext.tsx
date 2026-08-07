import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../api/client';
import { clearAuth, loadAuth, saveAuth, updateStoredUser } from './tokenStorage';
import type { AuthUser, LoginResponse } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setUser(loadAuth()?.user ?? null);
    setIsInitializing(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    saveAuth(data, rememberMe);
    setUser(data.user);
  };

  const logout = () => {
    const stored = loadAuth();
    setUser(null);
    clearAuth();
    if (stored?.refreshToken) {
      apiClient.post('/auth/logout', { refreshToken: stored.refreshToken }).catch(() => {
        // best-effort revoke; the local session is already cleared either way
      });
    }
  };

  const updateUser = (nextUser: AuthUser) => {
    updateStoredUser(nextUser);
    setUser(nextUser);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isInitializing, login, logout, updateUser }),
    [user, isInitializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
