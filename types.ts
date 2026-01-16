export interface Restaurant {
  id: string; // UUID
  name: string;
  slug: string;
  cuisine_type: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  theme_primary_color: string;
  theme_accent_color: string;
  theme_background_color: string;
  theme_font: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string; // UUID
  restaurant_id: string; // UUID
  table_number: number;
  qr_token: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  created_at: string;
  restaurant?: Restaurant;
}

export interface MenuCategory {
  id: string; // UUID
  restaurant_id: string; // UUID
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string; // UUID
  category_id: string; // UUID
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  allergens: string[];
  dietary_tags: string[];
  is_available: boolean;
  prep_time_minutes: number;
  created_at: string;
  category?: MenuCategory;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled';

export interface Order {
  id: string; // UUID
  table_id: string; // UUID
  order_number: number;
  customer_name: string | null;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  service_charge: number;
  total: number;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  table?: Table;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string; // UUID
  order_id: string; // UUID
  menu_item_id: string | null; // UUID
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  special_instructions: string | null;
  created_at: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  special_instructions: string;
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
}