'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, session, type Department, type User } from './api';

type AuthState = {
  user: User | null;
  ready: boolean; // false until we have read the saved session in the browser
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (...departments: Department[]) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(session.user);
    setReady(true);
  }, []);

  const value: AuthState = {
    user,
    ready,
    async login(email, password) {
      const res = await api<{ token: string; user: User }>('/auth/login', { body: { email, password } });
      session.save(res.token, res.user);
      setUser(res.user);
    },
    logout() {
      session.clear();
      setUser(null);
      window.location.href = '/login';
    },
    // ADMIN can do everything; others only their own department's actions.
    can: (...departments) => !!user && (user.department === 'ADMIN' || departments.includes(user.department)),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
