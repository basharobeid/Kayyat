// Mirrors backend/app/schemas. Keep in sync until types are generated from OpenAPI.

export type Role = 'customer' | 'tailor' | 'seller' | 'delivery' | 'admin';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  locale: 'ar' | 'en';
  avatar_url: string | null;
  roles: Role[];
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}
