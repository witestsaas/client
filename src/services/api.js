const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1"; //middleware server

// Example: Fetch test execution stats
export async function fetchTestExecutions() {
  const res = await fetch(`${API_BASE_URL}/test-execution`);
  if (!res.ok) throw new Error("Failed to fetch test executions");
  return res.json();
}

// Example: Fetch health status
export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error("Failed to fetch health status");
  return res.json();
}

// Example: Fetch authenticated user info
export async function fetchUser() {
  const res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
  if (!res.ok) throw new Error("Failed to fetch user info");
  return res.json();
}

// Fetch stats from /test-execution endpoint
export async function fetchStats() {
  const response = await fetch(`${API_BASE_URL}/test-execution`);
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  return response.json();
}
// Add more API functions as needed
// Fetch trends from /test-execution endpoint (adjust endpoint if needed)
// Fetch activity from /test-execution endpoint (adjust endpoint if needed)
export async function fetchActivity() {
  const response = await fetch(`${API_BASE_URL}/test-execution`);
  if (!response.ok) {
    throw new Error('Failed to fetch activity');
  }
  return response.json();
}
export async function fetchTrends() {
  const response = await fetch(`${API_BASE_URL}/test-execution`);
  if (!response.ok) {
    throw new Error('Failed to fetch trends');
  }
  return response.json();
}
