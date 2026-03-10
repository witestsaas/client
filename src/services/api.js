import { apiFetch, getApiBaseUrl } from './http';

const API_BASE_URL = getApiBaseUrl();

/*------------------------------------------------------------------------------------------------------------------------------------------------------------*/

async function fetchRunsPayload() {
  const response = await apiFetch('/test-execution');
  if (!response.ok) {
    throw new Error('Failed to fetch test executions');
  }
  return response.json();
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchTestExecutions() {
  return fetchRunsPayload();
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return res.json();
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchUser() {
  const res = await apiFetch('/auth/me');
  if (!res.ok) throw new Error('Failed to fetch user info');
  return res.json();
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchStats() {
  const data = await fetchRunsPayload();
  const runs = data.testRuns || [];
  const total = runs.length;
  const passed = runs.filter((r) => r.status === 'Completed').length;

  return {
    projects: total > 0 ? 1 : 0,
    testCases: total,
    successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
  };
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchActivity() {
  const data = await fetchRunsPayload();
  const runs = data.testRuns || [];

  return runs.slice(0, 8).map((run) => ({
    id: run.id,
    user: 'You',
    action: `Test run ${run.status || 'updated'}`,
    time: run.updatedAt ? new Date(run.updatedAt).toLocaleString() : '-',
  }));
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function fetchTrends() {
  const data = await fetchRunsPayload();
  const runs = data.testRuns || [];
  const total = runs.length || 1;
  const byStatus = (status) => runs.filter((r) => r.status === status).length;

  return [
    { label: 'Completed', value: Math.round((byStatus('Completed') / total) * 100) },
    { label: 'Running', value: Math.round((byStatus('Running') / total) * 100) },
    { label: 'Failed', value: Math.round((byStatus('Failed') / total) * 100) },
  ];
}
