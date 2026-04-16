/**
 * Proactive session keeper — refreshes access tokens in the background
 * before they expire so the user never hits a 401.
 *
 * Also refreshes on visibility change (tab comes back into focus after
 * being hidden) to handle laptop sleep / tab-switching scenarios.
 */

const DEFAULT_TTL_SEC = 7 * 24 * 60 * 60; // 7 days fallback
const REFRESH_RATIO = 0.50; // refresh at 50% of TTL
const RETRY_DELAY_MS = 30_000; // retry after 30s on network error
const VISIBILITY_GRACE_MS = 60_000; // if tab was hidden < 1 min, skip refresh
const MAX_TRANSIENT_RETRIES = 30; // give up after 30 consecutive transient failures
// HTTP status codes that are transient and should be retried
const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

let refreshTimer = null;
let ttlMs = DEFAULT_TTL_SEC * 1000;
let lastRefreshAt = 0;
let apiBaseUrl = '';
let onSessionLost = null;
let transientRetryCount = 0;

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

function scheduleNextRefresh() {
  clearTimeout(refreshTimer);
  const delay = Math.max(ttlMs * REFRESH_RATIO, 10_000); // never less than 10s
  refreshTimer = setTimeout(doProactiveRefresh, delay);
}

async function doProactiveRefresh() {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      lastRefreshAt = Date.now();
      transientRetryCount = 0; // reset on success
      const data = await response.json().catch(() => ({}));
      if (data.accessTokenExpiresIn && data.accessTokenExpiresIn > 0) {
        ttlMs = data.accessTokenExpiresIn * 1000;
      }
      scheduleNextRefresh();
    } else if (TRANSIENT_STATUS_CODES.has(response.status)) {
      // Transient server error — retry with back-off instead of giving up
      transientRetryCount++;
      if (transientRetryCount >= MAX_TRANSIENT_RETRIES) {
        // Too many consecutive transient failures — session is likely lost
        clearTimeout(refreshTimer);
        refreshTimer = null;
        transientRetryCount = 0;
        if (typeof onSessionLost === 'function') {
          onSessionLost();
        }
      } else {
        const backoff = RETRY_DELAY_MS * transientRetryCount;
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(doProactiveRefresh, backoff);
      }
    } else {
      // Definitive auth error (401, 403) — session is truly lost
      clearTimeout(refreshTimer);
      refreshTimer = null;
      transientRetryCount = 0;
      if (typeof onSessionLost === 'function') {
        onSessionLost();
      }
    }
  } catch {
    // Network error — retry after a short delay
    transientRetryCount++;
    clearTimeout(refreshTimer);
    if (transientRetryCount >= MAX_TRANSIENT_RETRIES) {
      transientRetryCount = 0;
      if (typeof onSessionLost === 'function') {
        onSessionLost();
      }
    } else {
      refreshTimer = setTimeout(doProactiveRefresh, RETRY_DELAY_MS);
    }
  }
}

function handleVisibilityChange() {
  if (document.visibilityState !== 'visible') return;

  const elapsed = Date.now() - lastRefreshAt;

  if (elapsed > ttlMs * REFRESH_RATIO) {
    // Token likely expired while tab was hidden — refresh immediately
    doProactiveRefresh();
  } else if (elapsed > VISIBILITY_GRACE_MS) {
    // Been a while — reschedule (timers may have been throttled by the browser)
    scheduleNextRefresh();
  }
}

/**
 * Start the proactive session keeper.
 * @param {{ accessTokenExpiresIn?: number, onSessionLost?: () => void }} options
 *   accessTokenExpiresIn — token TTL in seconds (from server response)
 *   onSessionLost — called when the session cannot be refreshed (token expired / revoked)
 */
export function startSessionKeeper(options = {}) {
  stopSessionKeeper();
  apiBaseUrl = resolveApiBaseUrl();

  if (options.accessTokenExpiresIn && options.accessTokenExpiresIn > 0) {
    ttlMs = options.accessTokenExpiresIn * 1000;
  } else {
    ttlMs = DEFAULT_TTL_SEC * 1000;
  }

  onSessionLost = options.onSessionLost || null;
  lastRefreshAt = Date.now();
  transientRetryCount = 0;

  scheduleNextRefresh();
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Stop the session keeper (on logout or provider unmount).
 */
export function stopSessionKeeper() {
  clearTimeout(refreshTimer);
  refreshTimer = null;
  onSessionLost = null;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Notify the keeper that a successful refresh just happened externally
 * (e.g. via the reactive 401→refresh flow in apiFetch). Resets the timer.
 */
export function notifyRefreshSuccess(accessTokenExpiresIn) {
  lastRefreshAt = Date.now();
  if (accessTokenExpiresIn && accessTokenExpiresIn > 0) {
    ttlMs = accessTokenExpiresIn * 1000;
  }
  if (refreshTimer !== null) {
    scheduleNextRefresh();
  }
}
