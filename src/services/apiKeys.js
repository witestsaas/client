import { apiFetch } from './http';
import { createResponseError } from '../utils/api-error.js';

async function parseJson(response) {
  let data = {};
  try {
    data = await response.json();
  } catch {
    const rawText = await response.text().catch(() => '');
    const normalizedText = String(rawText || '').trim();
    if (normalizedText) {
      data = { message: normalizedText.length > 220 ? `${normalizedText.slice(0, 220)}...` : normalizedText };
    }
  }
  if (!response.ok) {
    const fallback = `Request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ''})`;
    throw createResponseError(response, data, fallback);
  }
  return data;
}

export async function fetchApiKeys(orgSlug) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/api-keys`);
  return parseJson(res);
}

export async function createApiKey(orgSlug, payload) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function revokeApiKey(orgSlug, keyId) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/api-keys/${encodeURIComponent(keyId)}`, {
    method: 'DELETE',
  });
  return parseJson(res);
}
