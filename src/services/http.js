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
import { getAccessToken } from '../auth/token-manager.js';

function getCookieValue(name) {
  if (typeof document === 'undefined') return undefined;
  const pairs = document.cookie ? document.cookie.split(';') : [];
  for (const pair of pairs) {
    const [key, ...rest] = pair.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

let refreshPromise = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const { _retry = false, _usedBearerFallback = false, authMode = 'cookie', ...fetchOptions } = options;
  const method = String(fetchOptions.method || 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const cacheMode = fetchOptions.cache ?? (method === 'GET' ? 'no-store' : undefined);
  const headers = {
    ...(fetchOptions.headers || {}),
  };

  if (method === 'GET') {
    headers['Cache-Control'] = headers['Cache-Control'] || 'no-store';
    headers.Pragma = headers.Pragma || 'no-cache';
  }

  if (isMutating && !headers['x-csrf-token'] && !headers['X-CSRF-Token']) {
    const csrfToken = getCookieValue('qalion_csrf_token');
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }

  if (authMode === 'bearer' && !headers.Authorization) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    cache: cacheMode,
    credentials: 'include',
  });

  if (response.status === 401 && !_retry && path !== '/auth/refresh' && path !== '/auth/logout') {
    let refreshSucceeded = false;
    try {
      const refreshResponse = await refreshSession();
      refreshSucceeded = Boolean(refreshResponse?.ok);
    } catch {
      refreshSucceeded = false;
    }

    if (refreshSucceeded) {
      return apiFetch(path, { ...fetchOptions, _retry: true, _usedBearerFallback });
    }

    const hasAuthorizationHeader = Boolean(headers.Authorization);
    if (authMode === 'cookie' && !_usedBearerFallback && !hasAuthorizationHeader) {
      return apiFetch(path, {
        ...fetchOptions,
        authMode: 'bearer',
        _retry: true,
        _usedBearerFallback: true,
      });
    }
  }

  return response;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
