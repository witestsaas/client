let accessTokenGetter = null;
const SESSION_BOOTSTRAP_TOKEN_KEY = 'qualion_bootstrap_token';

export function setAccessTokenGetter(getter) {
  accessTokenGetter = getter;
}

export function setBootstrapToken(token) {
  if (typeof window === 'undefined') return;

  if (!token) {
    window.sessionStorage.removeItem(SESSION_BOOTSTRAP_TOKEN_KEY);
    return;
  }

  window.sessionStorage.setItem(SESSION_BOOTSTRAP_TOKEN_KEY, token);
}

export function clearBootstrapToken() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_BOOTSTRAP_TOKEN_KEY);
}

export function hasBootstrapToken() {
  if (typeof window === 'undefined') return false;

  try {
    return Boolean(window.sessionStorage.getItem(SESSION_BOOTSTRAP_TOKEN_KEY));
  } catch {
    return false;
  }
}

export async function getAccessToken() {
  if (accessTokenGetter) {
    try {
      const token = await accessTokenGetter();
      if (token) {
        return token;
      }
    } catch {
      // no-op
    }
  }

  try {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.sessionStorage.getItem(SESSION_BOOTSTRAP_TOKEN_KEY);
  } catch {
    return null;
  }
}
