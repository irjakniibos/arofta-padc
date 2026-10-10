'use client';

/**
 * Status login pengguna di sisi browser.
 * Sumber kebenaran tetap backend (cookie httpOnly); context ini hanya menyimpan profil hasil /auth/me.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import { HOME_BY_ROLE } from './config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | guest

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      setStatus('authenticated');
      return res.data;
    } catch {
      setUser(null);
      setStatus('guest');
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const onExpired = () => { setUser(null); setStatus('guest'); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data);
    setStatus('authenticated');
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally {
      setUser(null);
      setStatus('guest');
      router.replace('/masuk');
    }
  }, [router]);

  const value = useMemo(() => ({
    user, status, refresh, login, logout, homePath: user ? HOME_BY_ROLE[user.role] : '/',
  }), [user, status, refresh, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
