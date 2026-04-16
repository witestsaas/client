import { apiFetch } from './http';

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

// ─── Scheduling ─────────────────────────────────────────────────────────

export async function listSchedules(orgSlug) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/schedules?_t=${Date.now()}`);
  return parseJson(res);
}

export async function createSchedule(orgSlug, payload) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function updateSchedule(orgSlug, scheduleId, payload) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/schedules/${encodeURIComponent(scheduleId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function deleteSchedule(orgSlug, scheduleId) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/schedules/${encodeURIComponent(scheduleId)}`, {
    method: 'DELETE',
  });
  return parseJson(res);
}

// ─── Webhooks ───────────────────────────────────────────────────────────

export async function listWebhooks(orgSlug) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/webhooks?_t=${Date.now()}`);
  return parseJson(res);
}

export async function createWebhook(orgSlug, payload) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function updateWebhook(orgSlug, webhookId, payload) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/webhooks/${encodeURIComponent(webhookId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function deleteWebhook(orgSlug, webhookId) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/webhooks/${encodeURIComponent(webhookId)}`, {
    method: 'DELETE',
  });
  return parseJson(res);
}

export async function testWebhook(orgSlug, webhookId) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/webhooks/${encodeURIComponent(webhookId)}/test`, {
    method: 'POST',
  });
  return parseJson(res);
}

// ─── Performance ────────────────────────────────────────────────────────

export async function fetchPerformanceOverview(orgSlug, days = 30) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/performance?days=${days}&_t=${Date.now()}`);
  return parseJson(res);
}

export async function fetchSessionMetrics(orgSlug) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/performance/sessions?_t=${Date.now()}`);
  return parseJson(res);
}

// ─── API Tests ──────────────────────────────────────────────────────────

export async function listApiTests(orgSlug, projectId) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/api-tests?_t=${Date.now()}`);
  return parseJson(res);
}

export async function createApiTest(orgSlug, projectId, payload) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/api-tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function updateApiTest(orgSlug, projectId, testId, payload) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/api-tests/${encodeURIComponent(testId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function deleteApiTest(orgSlug, projectId, testId) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/api-tests/${encodeURIComponent(testId)}`, {
    method: 'DELETE',
  });
  return parseJson(res);
}

export async function executeApiTest(orgSlug, projectId, testId) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/api-tests/${encodeURIComponent(testId)}/run`, {
    method: 'POST',
  });
  return parseJson(res);
}

export async function listApiTestExecutions(orgSlug, projectId, testId) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/tests/projects/${encodeURIComponent(projectId)}/api-tests/${encodeURIComponent(testId)}/executions?_t=${Date.now()}`);
  return parseJson(res);
}
