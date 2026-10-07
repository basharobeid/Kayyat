import { RFC7807ProblemDetails } from '@/types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const ACCESS_KEY = 'khayyat_access_token';
const REFRESH_KEY = 'khayyat_refresh_token';

export class APIError extends Error {
  public status: number;
  public details: RFC7807ProblemDetails;

  constructor(details: RFC7807ProblemDetails) {
    super(details.detail || details.title);
    this.name = 'APIError';
    this.status = details.status;
    this.details = details;
  }
}

// One refresh at a time: parallel 401s all wait on the same rotation, because the
// backend revokes the whole session if an already-rotated refresh token is replayed.
let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      return false;
    }
    const tokens = await res.json();
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}, retried = false): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !retried && typeof window !== 'undefined'
      && !endpoint.startsWith('/auth/')) {
    refreshing = refreshing ?? refreshTokens().finally(() => { refreshing = null; });
    if (await refreshing) {
      const retryHeaders = new Headers(options.headers || {});
      return apiFetch<T>(endpoint, { ...options, headers: retryHeaders }, true);
    }
  }

  if (!response.ok) {
    let errorData: RFC7807ProblemDetails;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        title: 'HTTP Error',
        status: response.status,
        detail: response.statusText || 'An unexpected network error occurred.',
      };
    }
    throw new APIError(errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
