const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

async function tryRefresh() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  return response.ok;
}

export async function apiFetch(path, options = {}, retryOn401 = true) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 && retryOn401 && path !== '/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch(path, options, false);
    }
  }

  return response;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
