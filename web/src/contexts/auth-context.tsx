'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  clearTokens,
  getStoredRefresh,
  getUser,
  setTokens,
  setUser,
  type AuthUser,
} from '@/lib/api';

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setU] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setU(getUser());
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      setU(data.user);
      router.push('/dashboard');
    },
    [router],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
        skipAuth: true,
      });
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      setU(data.user);
      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: getStoredRefresh() }),
      });
    } catch {
      /* ignore */
    }
    clearTokens();
    setU(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be inside AuthProvider');
  return v;
}
