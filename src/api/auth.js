// Authentication API utilities
// Example: login, signup, logout, token management

export async function login(credentials) {
  // Replace with your middleware endpoint
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return response.json();
}

export async function logout() {
  // Replace with your middleware endpoint
  return fetch('/api/auth/logout', { method: 'POST' });
}
