export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const storageKey = 'dependable-clean-session';

export function readSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return stored && stored.token && stored.user?.email ? stored : null;
  } catch {
    return null;
  }
}

export function storeSession(session) {
  try {
    if (session) localStorage.setItem(storageKey, JSON.stringify(session));
    else localStorage.removeItem(storageKey);
  } catch {
    // The session still works for this page view when storage is blocked.
  }
}

export async function api(path, options = {}) {
  const token = typeof window === 'undefined' ? null : readSession()?.token;
  const headers = { ...options.headers, ...(token ? { authorization: 'Bearer ' + token } : {}) };
  const response = await fetch(API_BASE + path, { ...options, headers });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const error = new Error((data && data.error) || 'Something went wrong. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function jsonOptions(method, body) {
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}
