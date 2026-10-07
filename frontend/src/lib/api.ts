import { apiFetch } from './api-client';

// ---- Shared vocab -----------------------------------------------------------

// Syrian governorates; must match backend/app/core/constants.py CITIES.
export const CITY_SLUGS = [
  'damascus', 'rif_dimashq', 'aleppo', 'homs', 'hama', 'latakia', 'tartus',
  'daraa', 'as_suwayda', 'quneitra', 'idlib', 'deir_ez_zor', 'raqqa', 'hasakah',
] as const;

export type CitySlug = (typeof CITY_SLUGS)[number];

export const CITY_LABELS: Record<CitySlug, { ar: string; en: string }> = {
  damascus: { ar: 'دمشق', en: 'Damascus' },
  rif_dimashq: { ar: 'ريف دمشق', en: 'Rif Dimashq' },
  aleppo: { ar: 'حلب', en: 'Aleppo' },
  homs: { ar: 'حمص', en: 'Homs' },
  hama: { ar: 'حماة', en: 'Hama' },
  latakia: { ar: 'اللاذقية', en: 'Latakia' },
  tartus: { ar: 'طرطوس', en: 'Tartus' },
  daraa: { ar: 'درعا', en: 'Daraa' },
  as_suwayda: { ar: 'السويداء', en: 'As-Suwayda' },
  quneitra: { ar: 'القنيطرة', en: 'Quneitra' },
  idlib: { ar: 'إدلب', en: 'Idlib' },
  deir_ez_zor: { ar: 'دير الزور', en: 'Deir ez-Zor' },
  raqqa: { ar: 'الرقة', en: 'Raqqa' },
  hasakah: { ar: 'الحسكة', en: 'Al-Hasakah' },
};

export const DAMASCUS_DISTRICTS: { ar: string; en: string }[] = [
  { ar: 'المزة', en: 'Mezzeh' },
  { ar: 'كفرسوسة', en: 'Kafr Sousa' },
  { ar: 'المالكي', en: 'Malki' },
  { ar: 'أبو رمانة', en: 'Abu Rummaneh' },
  { ar: 'الشعلان', en: 'Shaalan' },
  { ar: 'البرامكة', en: 'Baramkeh' },
  { ar: 'المهاجرين', en: 'Muhajirin' },
  { ar: 'ركن الدين', en: 'Rukn al-Din' },
  { ar: 'الصالحية', en: 'Salihiyah' },
  { ar: 'القصاع', en: 'Qassaa' },
  { ar: 'باب توما', en: 'Bab Touma' },
  { ar: 'الميدان', en: 'Midan' },
  { ar: 'دمر', en: 'Dummar' },
  { ar: 'برزة', en: 'Barzeh' },
  { ar: 'القابون', en: 'Qaboun' },
  { ar: 'جرمانا', en: 'Jaramana' },
  { ar: 'مشروع دمر', en: 'Dummar Project' },
  { ar: 'أخرى', en: 'Other' },
];

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
  google: (id_token: string) =>
    apiFetch<TokenPair>('/auth/google', { method: 'POST', body: JSON.stringify({ id_token }) }),
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

// ---- Bookings (direct service) ---------------------------------------------

export type ServiceType = 'shop_visit' | 'van_pickup' | 'home_service' | 'quick_fix';
export type QuickItem = 'button' | 'stitching' | 'tear' | 'zipper' | 'adjustment' | 'other';

export interface BookingOptions {
  usd_to_syp: number;
  service_cities: string[];
  shop_address: string | null;
  visit_fees_usd: Record<ServiceType, number>;
  quick_items_usd: Record<QuickItem, [number, number]>;
  slots: Record<ServiceType, string[]>;
  closed_weekday: number; // Python weekday: Monday = 0
  horizon_days: number;
  google_client_id: string | null;
}

export interface Recommendation {
  service_type: ServiceType;
  reason_ar: string;
  reason_en: string;
}

export interface PipelineStep {
  status: string;
  reached_at: string | null;
  current: boolean;
}

export interface Booking {
  id: string;
  reference: string;
  service_type: ServiceType;
  status: string;
  description: string;
  garment: string | null;
  quick_items: QuickItem[];
  photo_urls: string[];
  city: string;
  district: string | null;
  address_line: string | null;
  contact_phone: string | null;
  scheduled_date: string;
  slot: string;
  visit_fee_usd: number;
  estimate_min_usd: number | null;
  estimate_max_usd: number | null;
  final_price_usd: number | null;
  payment_status: 'unpaid' | 'paid';
  paid_at: string | null;
  assignee_name: string | null;
  rating: number | null;
  review_comment: string | null;
  cancel_reason: string | null;
  created_at: string;
  completed_at: string | null;
  pipeline: PipelineStep[];
  events: { status: string; note: string | null; created_at: string }[];
  next_status: string | null;
  can_cancel: boolean;
  can_review: boolean;
  customer_name: string | null;
  shop_address: string | null;
}

export interface BookingCreatePayload {
  service_type: ServiceType;
  description: string;
  garment?: string;
  quick_items: QuickItem[];
  photo_urls: string[];
  city: string;
  district?: string;
  address_line?: string;
  contact_phone?: string;
  scheduled_date: string;
  slot: string;
  followed_recommendation: boolean;
}

export interface SupportMessage {
  id: string;
  body: string;
  photo_url: string | null;
  booking_id: string | null;
  from_staff: boolean;
  created_at: string;
}

export interface SupportThread {
  customer_id: string;
  customer_name: string;
  last_message: string;
  last_at: string;
  last_from_staff: boolean;
}

export interface AppNotification {
  id: string;
  type: string;
  data: Record<string, string>;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export const bookingsApi = {
  options: () => apiFetch<BookingOptions>('/bookings/options'),
  recommend: (description: string, quick_items: QuickItem[], prefers_home: boolean) =>
    apiFetch<Recommendation>('/bookings/recommend', {
      method: 'POST',
      body: JSON.stringify({ description, quick_items, prefers_home }),
    }),
  availability: (service_type: ServiceType, date: string) =>
    apiFetch<{ slot: string; available: boolean }[]>(
      `/bookings/availability?service_type=${service_type}&date=${date}`
    ),
  create: (payload: BookingCreatePayload) =>
    apiFetch<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  mine: () => apiFetch<Booking[]>('/bookings'),
  get: (id: string) => apiFetch<Booking>(`/bookings/${id}`),
  cancel: (id: string, reason?: string) =>
    apiFetch<Booking>(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  review: (id: string, rating: number, comment?: string) =>
    apiFetch<Booking>(`/bookings/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
};

export const supportApi = {
  messages: () => apiFetch<SupportMessage[]>('/support/messages'),
  send: (body: string, booking_id?: string, photo_url?: string) =>
    apiFetch<SupportMessage>('/support/messages', {
      method: 'POST',
      body: JSON.stringify({ body, booking_id, photo_url }),
    }),
};

export const staffApi = {
  bookings: (active = true) =>
    apiFetch<Page<Booking>>(`/staff/bookings?active=${active}&per_page=50`),
  advance: (id: string, assignee_name?: string, note?: string) =>
    apiFetch<Booking>(`/staff/bookings/${id}/advance`, {
      method: 'POST',
      body: JSON.stringify({ assignee_name: assignee_name || undefined, note: note || undefined }),
    }),
  price: (id: string, final_price_usd: number) =>
    apiFetch<Booking>(`/staff/bookings/${id}/price`, {
      method: 'POST',
      body: JSON.stringify({ final_price_usd }),
    }),
  paid: (id: string) => apiFetch<Booking>(`/staff/bookings/${id}/paid`, { method: 'POST' }),
  cancel: (id: string, reason?: string) =>
    apiFetch<Booking>(`/staff/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  threads: () => apiFetch<SupportThread[]>('/staff/support'),
  thread: (customerId: string) => apiFetch<SupportMessage[]>(`/staff/support/${customerId}`),
  reply: (customerId: string, body: string) =>
    apiFetch<SupportMessage>(`/staff/support/${customerId}`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
};

export const notificationsApi = {
  list: () => apiFetch<Page<AppNotification>>('/notifications?per_page=30'),
  unread: () => apiFetch<{ unread: number }>('/notifications/unread-count'),
  readAll: () => apiFetch<void>('/notifications/read-all', { method: 'PATCH' }),
};

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  district: string | null;
  city: string;
  is_default: boolean;
}

export const accountApi = {
  update: (payload: { full_name?: string; locale?: 'ar' | 'en' }) =>
    apiFetch<AuthUser>('/users/me', { method: 'PATCH', body: JSON.stringify(payload) }),
  addresses: () => apiFetch<Address[]>('/users/me/addresses'),
  addAddress: (payload: { label: string; line1: string; district?: string; city: string }) =>
    apiFetch<Address>('/users/me/addresses', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAddress: (id: string) =>
    apiFetch<void>(`/users/me/addresses/${id}`, { method: 'DELETE' }),
};

// Prices are stored in USD; show both, SYP rounded to a sensible step.
export function formatPrice(usd: number, rate: number, isAr: boolean): string {
  const syp = Math.round((usd * rate) / 50) * 50;
  const sypText = syp.toLocaleString(isAr ? 'ar-SY' : 'en-US');
  return isAr ? `${sypText} ل.س ($${usd})` : `SYP ${sypText} ($${usd})`;
}

// Server timestamps are UTC, but arrive without an offset from SQLite and with "+00:00"
// from Postgres. Treat offset-less values as UTC so the browser converts to local time.
export function serverDate(iso: string): Date {
  return new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`);
}
