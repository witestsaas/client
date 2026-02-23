import { apiFetch } from './http';

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }
  return data;
}

export async function fetchUserOrganizations() {
  const response = await apiFetch('/organizations/user-orgs');
  return parseJson(response);
}

export async function fetchMyInvitations() {
  const response = await apiFetch('/organizations/my-invitations');
  return parseJson(response);
}

export async function fetchOrganization(orgSlug) {
  const response = await apiFetch(`/organizations/${orgSlug}`);
  return parseJson(response);
}

export async function createOrganization(name) {
  const response = await apiFetch('/organizations/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return parseJson(response);
}

export async function joinOrganizationByCode(token) {
  const response = await apiFetch('/organizations/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return parseJson(response);
}
