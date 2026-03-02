import { apiFetch } from './http';

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }
  return data;
}

export async function fetchProjects(orgSlug) {
  const response = await apiFetch(
    `/projects?orgSlug=${encodeURIComponent(orgSlug)}&_t=${Date.now()}`,
  );
  return parseJson(response);
}

export async function fetchProject(orgSlug, projectId) {
  const response = await apiFetch(
    `/projects/${projectId}?orgSlug=${encodeURIComponent(orgSlug)}&_t=${Date.now()}`,
  );
  return parseJson(response);
}

export async function createProject(orgSlug, payload) {
  const response = await apiFetch('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgSlug,
      name: payload.name,
      description: payload.description,
    }),
  });
  return parseJson(response);
}

export async function updateProject(orgSlug, projectId, payload) {
  const response = await apiFetch(`/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgSlug,
      ...payload,
    }),
  });
  return parseJson(response);
}

export async function deleteProject(orgSlug, projectId) {
  const response = await apiFetch(`/projects/${projectId}?orgSlug=${encodeURIComponent(orgSlug)}`, {
    method: 'DELETE',
  });
  return parseJson(response);
}
