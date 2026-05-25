'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from './api';
import { Employee } from '@/types';

interface AuthContextType {
  user: Employee | null;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const guest = localStorage.getItem('isGuest') === 'true';
    if (token) {
      api.users.me()
        .then((u: Employee) => {
          setUser(u);
          setIsGuest(guest);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('isGuest');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/login');
    }
  }, [isLoading, user, pathname, router]);

  const login = async (email: string) => {
    const apiUrl = typeof window !== 'undefined' && window.location.hostname.includes('github.dev') ? window.location.origin.replace('-3000.', '-8000.') : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
    const res = await fetch(`${apiUrl}/api/v1/auth/login?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('isGuest', 'false');
    setUser(data.user);
    setIsGuest(false);
    router.push('/');
  };

  const loginAsGuest = async () => {
    const apiUrl = typeof window !== 'undefined' && window.location.hostname.includes('github.dev') ? window.location.origin.replace('-3000.', '-8000.') : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
    const res = await fetch(`${apiUrl}/api/v1/auth/guest`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Guest login failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('isGuest', 'true');
    setUser(data.user);
    setIsGuest(true);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isGuest');
    setUser(null);
    setIsGuest(false);
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, isLoading, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
