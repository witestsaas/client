import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearBootstrapToken, setAccessTokenGetter } from './token-manager.js';
import { startSessionKeeper, stopSessionKeeper } from './session-keeper.js';
import { apiFetch } from '../services/http.js';

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return '/api/v1';
  }

  try {
    const configuredUrl = new URL(configured);
    const currentHost = window.location.hostname;
    const isLocalAlias = ['localhost', '127.0.0.1'].includes(configuredUrl.hostname);
    const isCurrentLocal = ['localhost', '127.0.0.1'].includes(currentHost);

    if (isLocalAlias && isCurrentLocal && configuredUrl.hostname !== currentHost) {
      configuredUrl.hostname = currentHost;
    }

    return configuredUrl.toString().replace(/\/$/, '');
  } catch {
    return configured;
  }
}

const API_BASE_URL = resolveApiBaseUrl();
const AuthContext = createContext(null);
const PUBLIC_AUTH_ROUTES = new Set([
  '/',
  '/signin',
  '/signup',
  '/auth/mfa',
  '/verified',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/reset-password/update',
  '/reset-password/confirm',
]);

function normalizeUserProfile(profile) {
  if (!profile) return profile;

  const apiOrigin = (() => {
    try {
      return new URL(API_BASE_URL).origin;
    } catch {
      return '';
    }
  })();

  const normalizedAvatarUrl =
    profile.avatarUrl && profile.avatarUrl.startsWith('/') && apiOrigin
      ? `${apiOrigin}${profile.avatarUrl}`
      : profile.avatarUrl;

  return {
    ...profile,
    avatarUrl: normalizedAvatarUrl,
  };
}

async function fetchCurrentUser() {
  const response = await apiFetch('/auth/me', {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch current user');
  }

  return response.json();
}

async function fetchPrimaryOrgSlug() {
  const response = await apiFetch('/organizations/user-orgs', {
    cache: 'no-store',
  });

  if (!response.ok) {
    return undefined;
  }

  const data = await response.json().catch(() => ({}));
  const organizations = Array.isArray(data?.organizations) ? data.organizations : [];
  return organizations[0]?.slug;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const profile = await fetchCurrentUser();
    const primaryOrgSlug = profile?.orgSlug || (await fetchPrimaryOrgSlug());
    const normalizedProfile = normalizeUserProfile({
      ...profile,
      orgSlug: primaryOrgSlug,
    });
    setUser(normalizedProfile);
    return normalizedProfile;
  }, []);

  useEffect(() => {
    clearBootstrapToken();
    setAccessTokenGetter(async () => null);

    // When apiFetch encounters an unrecoverable 401, redirect to login
    const handleSessionExpired = () => {
      stopSessionKeeper();
      setUser(null);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      setAccessTokenGetter(null);
      stopSessionKeeper();
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncUser() {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const onPublicAuthRoute = PUBLIC_AUTH_ROUTES.has(currentPath);
      if (onPublicAuthRoute) {
        if (!cancelled) {
          setUser(null);
          setProfileLoading(false);
        }
        return;
      }

      try {
        const normalizedProfile = await refreshProfile();
        if (!cancelled) {
          setUser(normalizedProfile);
          startSessionKeeper({ onSessionLost: () => setUser(null) });
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    setProfileLoading(true);
    syncUser();

    return () => {
      cancelled = true;
    };
  }, [refreshProfile]);

  const getCaptchaChallenge = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/auth/captcha/challenge`, {
      method: 'GET',
      credentials: 'include',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to load CAPTCHA challenge');
    }

    return payload;
  }, []);

  const login = useCallback(async (username, password, captcha = {}) => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        captchaToken: captcha?.captchaToken,
        captchaId: captcha?.captchaId,
        captchaAnswer: captcha?.captchaAnswer,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || 'Invalid username or password');
    }

    if (payload?.requiresMfa && payload?.challengeToken) {
      return {
        requiresMfa: true,
        challengeToken: payload.challengeToken,
        expiresInSec: payload.expiresInSec,
      };
    }

    startSessionKeeper({
      accessTokenExpiresIn: payload?.accessTokenExpiresIn,
      onSessionLost: () => setUser(null),
    });
    return refreshProfile();
  }, [refreshProfile]);

  const verifyMfaLogin = useCallback(async (challengeToken, code) => {
    const response = await apiFetch('/auth/mfa/verify-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challengeToken,
        code,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || 'MFA verification failed');
    }

    startSessionKeeper({
      accessTokenExpiresIn: payload?.accessTokenExpiresIn,
      onSessionLost: () => setUser(null),
    });
    return refreshProfile();
  }, [refreshProfile]);

  const signup = useCallback(async (payload, captcha = {}) => {
    const response = await apiFetch('/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: payload?.firstName,
        lastName: payload?.lastName,
        username: payload?.username,
        email: payload?.email,
        password: payload?.password,
        captchaToken: captcha?.captchaToken,
        captchaId: captcha?.captchaId,
        captchaAnswer: captcha?.captchaAnswer,
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.message || 'Failed to create account');
    }

    return body;
  }, []);

  const startGoogleAuth = useCallback(async () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }, []);

  const startMicrosoftAuth = useCallback(async () => {
    window.location.href = `${API_BASE_URL}/auth/microsoft`;
  }, []);

  const completeGoogleAuth = useCallback(async () => {
    const profile = await refreshProfile();
    startSessionKeeper({ onSessionLost: () => setUser(null) });
    return profile;
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    stopSessionKeeper();
    setUser(null);
    clearBootstrapToken();
    await apiFetch('/auth/logout', {
      method: 'POST',
    }).catch(() => undefined);
  }, []);

  const isLoading = profileLoading;
  const appIsAuthenticated = Boolean(user?.userId);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: appIsAuthenticated,
      isLoading,
      login,
      verifyMfaLogin,
      signup,
      getCaptchaChallenge,
      logout,
      startGoogleAuth,
      startMicrosoftAuth,
      completeGoogleAuth,
      refreshProfile,
    }),
    [
      user,
      appIsAuthenticated,
      isLoading,
      login,
      verifyMfaLogin,
      signup,
      getCaptchaChallenge,
      logout,
      startGoogleAuth,
      startMicrosoftAuth,
      completeGoogleAuth,
      refreshProfile,
    ],
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
