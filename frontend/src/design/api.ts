import type { Session } from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const storageKey = 'dependable-clean-session';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function readSession(): Session | null {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || 'null') as Session | null;
    return stored && stored.token && stored.user?.email ? stored : null;
  } catch {
    return null;
  }
}

export function storeSession(session: Session | null): void {
  try {
    if (session) localStorage.setItem(storageKey, JSON.stringify(session));
    else localStorage.removeItem(storageKey);
  } catch {
    // The session still works for this page view when storage is blocked.
  }
}

// Calls the API with the signed-in user's token. Every successful response is a 200 with a JSON body.
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window === 'undefined' ? null : readSession()?.token;
  const headers = { ...(options.headers as Record<string, string> | undefined), ...(token ? { authorization: 'Bearer ' + token } : {}) };
  const response = await fetch(API_BASE + path, { ...options, headers });
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data ? String((data as { error: unknown }).error) : 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export function jsonOptions(method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown): RequestInit {
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : 'Something went wrong. Please try again.';
