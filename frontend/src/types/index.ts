export type RoleName = 'customer' | 'tailor' | 'fabric_seller' | 'delivery' | 'admin';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  roles: RoleName[];
  created_at: string;
}

export interface TailorProfile {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  bio?: string;
  specialties: string[];
  shop_name?: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  reviews_count: number;
  completed_orders: number;
  is_verified: boolean;
  portfolio_count: number;
}

export interface ServiceCategory {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar?: string;
  description_en?: string;
  icon?: string;
}

export type JobRequestStatus = 
  | 'draft' 
  | 'open' 
  | 'quotes_received' 
  | 'tailor_selected' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'expired';

export interface JobRequest {
  id: string;
  customer_id: string;
  customer_name: string;
  category: string;
  title: string;
  description: string;
  budget?: number;
  currency: string;
  needs_delivery: boolean;
  city: string;
  status: JobRequestStatus;
  quotes_count: number;
  created_at: string;
}

export interface Quote {
  id: string;
  request_id: string;
  tailor_id: string;
  tailor_name: string;
  tailor_rating: number;
  price: number;
  estimated_days: number;
  includes_delivery: boolean;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'at_tailor'
  | 'in_progress'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface Order {
  id: string;
  customer_id: string;
  tailor_id: string;
  request_id?: string;
  quote_id?: string;
  total_amount: number;
  platform_fee: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface FabricProduct {
  id: string;
  seller_id: string;
  seller_name: string;
  name: string;
  description: string;
  material: string;
  color: string;
  price_per_meter: number;
  stock_meters: number;
  image_url?: string;
  created_at: string;
}

export interface RFC7807ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Array<{ field: string; message: string }>;
}
