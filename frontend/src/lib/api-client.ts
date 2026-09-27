import { RFC7807ProblemDetails } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject token if available in client environment
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('khayyat_access_token');
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

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

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
