import { apiFetch } from './http';
import { createResponseError } from '../utils/api-error.js';

/*------------------------------------------------------------------------------------------------------------------------------------------------------------*/

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw createResponseError(response, data, 'Execution request failed.');
  }
  return data;
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function listPlans(orgSlug, options = {}) {
  const params = new URLSearchParams({ _t: String(Date.now()) });
  if (options?.projectId) {
    params.set('projectId', options.projectId);
  }
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/plans?${params.toString()}`);
  const data = await parseJson(res);
  return Array.isArray(data) ? data : [];
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function createPlan(orgSlug, payload) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getPlan(orgSlug, planId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/plans/${encodeURIComponent(planId)}?_t=${Date.now()}`);
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function updatePlan(orgSlug, planId, payload = {}) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/plans/${encodeURIComponent(planId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function replacePlanTestCases(orgSlug, planId, payload = {}) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/plans/${encodeURIComponent(planId)}/test-cases`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function patchPlanTestCase(orgSlug, planId, payload = {}) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/plans/${encodeURIComponent(planId)}/test-cases`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function deletePlan(orgSlug, planId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/plans/${encodeURIComponent(planId)}`, {
    method: 'DELETE',
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function runPlan(orgSlug, planId, payload = {}) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/plans/${encodeURIComponent(planId)}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getExecutionSlots(orgSlug) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/test-execution/slots?_t=${Date.now()}`);
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function addPlanTestCases(orgSlug, planId, payload = {}) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/plans/${encodeURIComponent(planId)}/test-cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function listRuns(orgSlug, options = {}) {
  const params = new URLSearchParams({ _t: String(Date.now()) });
  if (options?.projectId) params.set('projectId', options.projectId);
  if (options?.planId) params.set('planId', options.planId);
  if (options?.status) params.set('status', options.status);
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/runs?${params.toString()}`);
  const data = await parseJson(res);
  return Array.isArray(data) ? data : [];
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getRun(orgSlug, runId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/runs/${encodeURIComponent(runId)}?_t=${Date.now()}`);
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getRunResultLogs(orgSlug, runId, resultId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/runs/${encodeURIComponent(runId)}/results/${encodeURIComponent(resultId)}/logs?_t=${Date.now()}`);
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getRunLiveActions(orgSlug, runId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/runs/${encodeURIComponent(runId)}/live-actions?_t=${Date.now()}`);
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function getResultArtifacts(resultId) {
  const res = await apiFetch(`/test-results/${encodeURIComponent(resultId)}/artifacts?_t=${Date.now()}`);
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function cancelRun(orgSlug, runId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/runs/${encodeURIComponent(runId)}/cancel`, {
    method: 'POST',
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function rerunRun(orgSlug, runId, payload = {}) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/runs/${encodeURIComponent(runId)}/rerun`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function rerunRunResult(orgSlug, runId, resultId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/runs/${encodeURIComponent(runId)}/results/${encodeURIComponent(resultId)}/rerun`, {
    method: 'POST',
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function deleteRun(orgSlug, runId) {
  const res = await apiFetch(`/${encodeURIComponent(orgSlug)}/runs/${encodeURIComponent(runId)}`, {
    method: 'DELETE',
  });
  return parseJson(res);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function listRunActivities(orgSlug, runId, options = {}) {
  const params = new URLSearchParams({
    entityType: 'TestRun',
    entityId: String(runId),
    type: 'Comment',
    sort: options?.sort || 'desc',
    limit: String(options?.limit || 100),
  });

  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/activities?${params.toString()}`);
  const data = await parseJson(res);
  return Array.isArray(data?.activities) ? data.activities : [];
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function createRunActivity(orgSlug, runId, content) {
  const res = await apiFetch(`/organizations/${encodeURIComponent(orgSlug)}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'Comment',
      entityType: 'TestRun',
      entityId: String(runId),
      content,
    }),
  });

  return parseJson(res);
}
