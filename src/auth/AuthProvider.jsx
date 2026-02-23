import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

const AuthContext = createContext(null);

async function tryRefreshSession() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  return response.ok;
}

async function fetchCurrentUserWithRefresh() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (response.ok) {
    return response.json();
  }

  if (response.status === 401) {
    const refreshed = await tryRefreshSession();
    if (!refreshed) {
      throw new Error('Unauthorized');
    }

    const retry = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!retry.ok) {
      throw new Error('Failed to fetch current user');
    }

    return retry.json();
  }

  throw new Error('Failed to fetch current user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function syncUser() {
      try {
        const profile = await fetchCurrentUserWithRefresh();
        if (!cancelled) {
          setUser(profile);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    syncUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message || 'Invalid credentials');
    }

    const profile = data?.user || (await fetchCurrentUserWithRefresh());
    setUser(profile);
    return { user: profile };
  }

  async function signup(payload) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message || 'Signup failed');
    }

    const profile = data?.user || (await fetchCurrentUserWithRefresh());
    setUser(profile);
    return { user: profile };
  }

  function startGoogleAuth() {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  async function completeGoogleAuth() {
    const profile = await fetchCurrentUserWithRefresh();
    setUser(profile);
    return profile;
  }

  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      signup,
      logout,
      startGoogleAuth,
      completeGoogleAuth,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
