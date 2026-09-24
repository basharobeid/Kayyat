/**
 * Minimal typed client for the Khayyat API. Errors arrive as RFC 7807 problem details
 * (see backend/app/core/exceptions.py) and are surfaced as ApiError.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: { field: string; message: string }[];
}

export class ApiError extends Error {
  constructor(public readonly problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
  }

  get status() {
    return this.problem.status;
  }

  /** Field errors keyed by field name, ready for react-hook-form's setError. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries((this.problem.errors ?? []).map((e) => [e.field, e.message]));
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  token?: string;
  json?: unknown;
};

export async function api<T>(path: string, { token, json, headers, ...init }: RequestOptions = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  if (!res.ok) {
    let problem: Problem;
    try {
      problem = await res.json();
    } catch {
      problem = { type: 'about:blank', title: res.statusText || 'Request failed', status: res.status };
    }
    throw new ApiError(problem);
  }

  return (res.status === 204 ? undefined : await res.json()) as T;
}
