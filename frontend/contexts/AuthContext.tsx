import { createContext, useEffect, useMemo, useState, type ReactNode, useCallback } from 'react';

export interface JwtUser {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthContextType {
  user: JwtUser | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = (import.meta as ImportMeta).env?.VITE_SERVER_URL ?? '';

  // Initialize from localStorage
  useEffect(() => {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
    if (!t) {
      setLoading(false);
      return;
    }
    setToken(t);
    // Validate token and load profile
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${t}` }
        });
        if (res.ok) {
          const u = await res.json();
          setUser(u as JwtUser);
        } else {
          // Invalid token
          window.localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      } catch (e) {
        console.warn('Auth init failed', e);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) {
        let errorMsg = 'Login failed';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || `HTTP ${res.status}: ${res.statusText}`;
        } catch {
          errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        }
        console.error('Login error:', errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await res.json() as { token: string; user: JwtUser };
      setUser(data.user);
      setToken(data.token);
      if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, data.token);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error during login';
      console.error('Login failed:', err);
      setError(errorMsg);
      throw err;
    }
  }, [backendUrl]);

  const signUpEmail = useCallback(async (email: string, password: string, name?: string) => {
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      
      if (!res.ok) {
        let errorMsg = 'Registration failed';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || `HTTP ${res.status}: ${res.statusText}`;
        } catch {
          errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        }
        console.error('Registration error:', errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await res.json() as { token: string; user: JwtUser };
      setUser(data.user);
      setToken(data.token);
      if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, data.token);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error during registration';
      console.error('Registration failed:', err);
      setError(errorMsg);
      throw err;
    }
  }, [backendUrl]);

  const signInGoogle = useCallback(async () => {
    const msg = 'Google sign-in not supported with JWT auth';
    setError(msg);
    throw new Error(msg);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, token, signInEmail, signUpEmail, signInGoogle, logout }),
    [user, loading, error, token, signInEmail, signUpEmail, signInGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
