export interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin";
  address?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  status: "pending" | "allocated" | "preparing" | "delivered" | "cancelled";
  customer_note?: string;
  note_category?: string;
  note_confidence?: number;
  total_amount: number;
  customer_address?: string;
  allocation_score?: number;
  branch?: Branch;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  allocated_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_branches: number;
  active_branches: number;
  total_products: number;
}

export interface ClassifyResponse {
  category: string;
  confidence: number;
  is_confident: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}