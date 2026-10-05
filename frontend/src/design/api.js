export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function api(path, options = {}) {
  const response = await fetch(API_BASE + path, options);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error((data && data.error) || 'Something went wrong. Please try again.');
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
