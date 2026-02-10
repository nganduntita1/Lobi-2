import { CartItem } from './cart';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ordered'
  | 'received'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id?: string;
  order_id?: string;
  name: string;
  price: string;
  quantity?: number | string;
  image?: string | null;
  sku?: string | null;
  color?: string | null;
  size?: string | null;
  created_at?: string;
}

export interface DeliveryAddress {
  id: string;
  user_id?: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  province: string;
  postal_code?: string | null;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string | null;
  changed_by?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  delivery_address_id?: string | null;
  status: OrderStatus;
  total_amount: number;
  cart_url: string;
  cart_screenshot_url?: string | null;
  shein_order_number?: string | null;
  admin_notes?: string | null;
  customer_notes?: string | null;
  estimated_delivery_date?: string | null;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
  delivery_addresses?: DeliveryAddress;
  order_status_history?: OrderStatusHistory[];
}

export interface CreateOrderItem {
  name: string;
  price: string;
  quantity?: number | string;
  image?: string;
  sku?: string;
  color?: string;
  size?: string;
}

export interface CreateOrderData {
  user_id: string;
  delivery_address_id: string;
  cart_url: string;
  cart_screenshot_url?: string;
  total_amount: number;
  customer_notes?: string;
  items?: CartItem[] | CreateOrderItem[];
}
