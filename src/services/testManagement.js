import { apiFetch } from './http';

async function parseJson(response) {
  let data = {};
  try {
    data = await response.json();
  } catch {
    const rawText = await response.text().catch(() => '');
    const normalizedText = String(rawText || '').trim();
    if (normalizedText) {
      data = {
        message:
          normalizedText.length > 220
            ? `${normalizedText.slice(0, 220)}...`
            : normalizedText,
      };
    }
  }

  if (!response.ok) {
    const fallback = `Request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ''})`;
    const error = new Error(data?.message || data?.error || fallback);
    error.status = response.status;
    error.code = data?.code;
    error.payload = data;
    throw error;
  }
  return data;
}

export async function fetchProjectTree(orgSlug, projectId) {
  const ts = Date.now();
  const [projectRes, foldersRes, testCasesRes] = await Promise.all([
    apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}?_t=${ts}`),
    apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/folders?_t=${ts}`),
    apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/test-cases?_t=${ts}`),
  ]);

  const project = await parseJson(projectRes);
  const folders = await parseJson(foldersRes);
  const testCases = await parseJson(testCasesRes);

  return {
    project,
    folders: Array.isArray(folders) ? folders : [],
    testCases: Array.isArray(testCases) ? testCases : [],
  };
}

export async function fetchTestProjects(orgSlug) {
  const ts = Date.now();
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects?_t=${ts}`);
  const data = await parseJson(res);
  return Array.isArray(data) ? data : data?.projects || [];
}

export async function createTestProject(orgSlug, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function updateTestProject(orgSlug, projectId, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(payload || {}),
      projectId,
    }),
  });
  return parseJson(res);
}

export async function deleteTestProject(orgSlug, projectId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });
  return parseJson(res);
}

export async function createFolder(orgSlug, projectId, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function renameFolder(orgSlug, projectId, folderId, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function deleteFolder(orgSlug, projectId, folderId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}`, {
    method: 'DELETE',
  });
  return parseJson(res);
}

export async function createTestCase(orgSlug, projectId, payload) {
  const title = payload?.title || payload?.name || '';
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/test-cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(payload || {}),
      title,
    }),
  });
  return parseJson(res);
}

export async function updateTestCase(orgSlug, projectId, testCaseId, payload) {
  const title = payload?.title || payload?.name || '';
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/test-cases/${encodeURIComponent(testCaseId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(payload || {}),
      title,
    }),
  });
  return parseJson(res);
}

export async function deleteTestCase(orgSlug, projectId, testCaseId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/test-cases/${encodeURIComponent(testCaseId)}`, {
    method: 'DELETE',
  });
  return parseJson(res);
}

export async function cloneTestCase(orgSlug, projectId, testCaseId, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/test-cases/${encodeURIComponent(testCaseId)}/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function fetchProjectDocumentation(orgSlug, projectId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/documentation?_t=${Date.now()}`);
  return parseJson(res);
}

export async function updateProjectDocumentation(orgSlug, projectId, documentation) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/documentation`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentation: documentation || '' }),
  });
  return parseJson(res);
}

export async function fetchProjectVariables(orgSlug, projectId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/variables?_t=${Date.now()}`);
  const data = await parseJson(res);
  return Array.isArray(data) ? data : [];
}

export async function createProjectVariable(orgSlug, projectId, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/variables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function deleteProjectVariable(orgSlug, projectId, id) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/variables`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return parseJson(res);
}

export async function fetchProjectSharedSteps(orgSlug, projectId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/shared-steps?_t=${Date.now()}`);
  const data = await parseJson(res);
  return Array.isArray(data) ? data : [];
}

export async function createProjectSharedStep(orgSlug, projectId, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/shared-steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function deleteProjectSharedStep(orgSlug, projectId, id) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/shared-steps`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return parseJson(res);
}

export async function fetchProjectSettings(orgSlug, projectId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/settings?_t=${Date.now()}`);
  return parseJson(res);
}

export async function updateProjectSettings(orgSlug, projectId, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function createProjectEnvironment(orgSlug, projectId, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/environments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function deleteProjectEnvironment(orgSlug, projectId, id) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/environments?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return parseJson(res);
}

export async function moveProjectItem(orgSlug, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/tests/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function generateFunctionalTests(orgSlug, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/ai/generate-functional-tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

export async function cancelFunctionalGeneration(orgSlug, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/ai/generate-functional-tests/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}
