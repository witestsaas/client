// Fetch detailed LLM usage for a single org (now from public org quotas usage endpoint)
export async function fetchOrgLlmUsage(orgSlug) {
  const response = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/quotas/usage`);
  const data = await parseJson(response);
  return data?.aiUsage || null;
}
import { apiFetch } from './http';

/*------------------------------------------------------------------------------------------------------------------------------------------------------------*/

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'Request failed');
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchUserOrganizations() {
  const response = await apiFetch('/organizations/user-orgs');
  return parseJson(response);
}


//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchMyInvitations() {
  const response = await apiFetch('/organizations/my-invitations');
  return parseJson(response);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchOrganization(orgSlug) {
  const response = await apiFetch(`/organizations/${orgSlug}`);
  return parseJson(response);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function createOrganization(name) {
  const response = await apiFetch('/organizations/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return parseJson(response);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function joinOrganizationByCode(token) {
  const response = await apiFetch('/organizations/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return parseJson(response);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchOrgNotifications(orgSlug, options = {}) {
  const params = new URLSearchParams();
  if (typeof options?.limit === 'number') {
    params.set('limit', String(options.limit));
  }
  if (options?.unreadOnly) {
    params.set('unreadOnly', 'true');
  }

  const query = params.toString();
  const response = await apiFetch(
    `/organizations/${encodeURIComponent(orgSlug)}/notifications${query ? `?${query}` : ''}`,
  );
  return parseJson(response);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function markOrgNotificationsAsRead(orgSlug, notificationIds = []) {
  const response = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/notifications`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationIds }),
  });
  return parseJson(response);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchOrgQuotaUsage(orgSlug) {
  const response = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/quotas/usage`);
  return parseJson(response);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchAdminQuotaOrganizations(options = {}) {
  const params = new URLSearchParams();
  if (options?.search) {
    params.set('search', String(options.search));
  }
  if (typeof options?.limit === 'number') {
    params.set('limit', String(options.limit));
  }
  const query = params.toString();
  const response = await apiFetch(`/admin/quotas/organizations${query ? `?${query}` : ''}`);
  return parseJson(response);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchAdminQuotaAccess() {
  const response = await apiFetch('/admin/quotas/access');
  return parseJson(response);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function updateAdminOrgQuota(orgSlug, payload) {
  const response = await apiFetch(`/admin/quotas/organizations/${encodeURIComponent(orgSlug)}/subscription`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(response);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function resetAllAdminQuotas(payload = {}) {
  const response = await apiFetch('/admin/quotas/reset-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(response);
}
