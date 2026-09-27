import { apiFetch } from './api-client';

// ---- Shared vocab -----------------------------------------------------------

export const CITY_SLUGS = [
  'riyadh', 'jeddah', 'makkah', 'madinah', 'dammam', 'khobar',
  'taif', 'abha', 'tabuk', 'qassim',
] as const;

export type CitySlug = (typeof CITY_SLUGS)[number];

export const CITY_LABELS: Record<CitySlug, { ar: string; en: string }> = {
  riyadh: { ar: 'الرياض', en: 'Riyadh' },
  jeddah: { ar: 'جدة', en: 'Jeddah' },
  makkah: { ar: 'مكة المكرمة', en: 'Makkah' },
  madinah: { ar: 'المدينة المنورة', en: 'Madinah' },
  dammam: { ar: 'الدمام', en: 'Dammam' },
  khobar: { ar: 'الخبر', en: 'Khobar' },
  taif: { ar: 'الطائف', en: 'Taif' },
  abha: { ar: 'أبها', en: 'Abha' },
  tabuk: { ar: 'تبوك', en: 'Tabuk' },
  qassim: { ar: 'القصيم', en: 'Qassim' },
};

// ---- Auth ---------------------------------------------------------------

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface RegisterPayload {
  full_name: string;
  email?: string;
  phone?: string;
  password: string;
  role: 'customer' | 'tailor';
  locale?: 'ar' | 'en';
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  locale: 'ar' | 'en';
  avatar_url: string | null;
  roles: string[];
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiFetch<TokenPair>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: LoginPayload) =>
    apiFetch<TokenPair>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => apiFetch<AuthUser>('/auth/me'),
  logout: (refresh_token: string) =>
    apiFetch<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
};

// ---- Catalog --------------------------------------------------------------

export interface ServiceItem {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  category_slug: string;
  is_active: boolean;
}

export interface ServiceCategory {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  services: ServiceItem[];
}

export interface MetaVocab {
  cities: string[];
  specialties: string[];
  currency: string;
  commission_rate: number;
}

export const catalogApi = {
  services: () => apiFetch<ServiceCategory[]>('/services'),
  meta: () => apiFetch<MetaVocab>('/meta'),
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('khayyat_access_token') : null;
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const res = await fetch(`${base}/media/images`, {
      method: 'POST',
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.detail || 'Image upload failed');
    }
    return res.json();
  },
};

// ---- Requests / Quotes / Orders -------------------------------------------

export interface RequestCreatePayload {
  service_id?: number;
  title: string;
  description: string;
  city: string;
  address_id?: string;
  preferred_date?: string;
  budget_max?: number;
  needs_pickup: boolean;
  needs_delivery: boolean;
  photo_urls: string[];
}

// The backend serializes Money as a plain number (see backend/app/schemas/common.py);
// there is no per-value currency, just the platform-wide one from /meta.
export type Money = number;

export interface TailorBrief {
  id: string;
  name: string;
  business_name: string;
  avatar_url: string | null;
  city: string | null;
  rating_avg: number;
  rating_count: number;
  verification_level: 'none' | 'basic' | 'professional' | 'master';
}

export interface QuoteItem {
  id: string;
  request_id: string;
  tailor: TailorBrief;
  price: Money;
  duration_days: number;
  offers_pickup: boolean;
  offers_delivery: boolean;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
  created_at: string;
  conversation_id: string | null;
}

export type RequestStatus =
  | 'draft' | 'open' | 'quotes_received' | 'tailor_selected'
  | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export interface RequestItem {
  id: string;
  title: string;
  description: string;
  city: string;
  service: ServiceItem | null;
  preferred_date: string | null;
  budget_max: Money | null;
  needs_pickup: boolean;
  needs_delivery: boolean;
  photo_urls: string[];
  status: RequestStatus;
  created_at: string;
  customer: { id: string; name: string; avatar_url: string | null };
  quote_count: number;
  quotes: QuoteItem[] | null;
  my_quote: QuoteItem | null;
  order_id: string | null;
  is_owner: boolean;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export const requestsApi = {
  create: (payload: RequestCreatePayload) =>
    apiFetch<RequestItem>('/requests', { method: 'POST', body: JSON.stringify(payload) }),
  list: (page = 1) => apiFetch<Page<RequestItem>>(`/requests?page=${page}`),
  get: (id: string) => apiFetch<RequestItem>(`/requests/${id}`),
  cancel: (id: string) => apiFetch<RequestItem>(`/requests/${id}/cancel`, { method: 'POST' }),
};

export interface OrderItem {
  id: string;
  reference: string;
  title: string;
  request_id: string;
  price: Money;
  status: string;
  created_at: string;
  due_date: string;
  tailor: { id: string; name: string; business_name: string };
  customer: { id: string; name: string };
}

export interface TailorProfileUpdatePayload {
  business_name?: string;
  city?: string;
}

export const tailorApi = {
  updateMyProfile: (payload: TailorProfileUpdatePayload) =>
    apiFetch<unknown>('/tailors/me/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
};

export const quotesApi = {
  accept: (quoteId: string) =>
    apiFetch<OrderItem>(`/quotes/${quoteId}/accept`, { method: 'POST' }),
  withdraw: (quoteId: string) =>
    apiFetch<QuoteItem>(`/quotes/${quoteId}/withdraw`, { method: 'POST' }),
};
