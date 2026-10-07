'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, AuthUser, LoginPayload, RegisterPayload, TokenPair } from './api';
import { APIError } from './api-client';

const ACCESS_KEY = 'khayyat_access_token';
const REFRESH_KEY = 'khayyat_refresh_token';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  googleLogin: (idToken: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function storeTokens(tokens: TokenPair) {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(ACCESS_KEY)) {
      setUser(null);
      return;
    }
    try {
      setUser(await authApi.me());
    } catch (err) {
      if (err instanceof APIError && err.status === 401) {
        clearTokens();
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshUser();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const tokens = await authApi.login(payload);
    storeTokens(tokens);
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const tokens = await authApi.register(payload);
    storeTokens(tokens);
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const tokens = await authApi.google(idToken);
    storeTokens(tokens);
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    clearTokens();
    setUser(null);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // token already invalid/expired -- logging out locally is enough
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
