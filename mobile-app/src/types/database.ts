<<<<<<< HEAD
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
=======
// Database types for Lobi application

export type UserRole = 'customer' | 'admin';

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'ordered' 
  | 'received' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'proof_submitted' 
  | 'verified' 
  | 'failed';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
>>>>>>> 03bf60a9fe63bf71016e8319191c7de9bf644209
}

export interface DeliveryAddress {
  id: string;
<<<<<<< HEAD
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
=======
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
>>>>>>> 03bf60a9fe63bf71016e8319191c7de9bf644209
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
<<<<<<< HEAD
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
=======
  delivery_address_id?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  subtotal_zar?: number;
  subtotal_usd?: number;
  delivery_fee: number;
  cart_url: string;
  shein_order_number?: string;
  admin_notes?: string;
  customer_notes?: string;
  payment_proof_url?: string;
  payment_reference?: string;
  whatsapp_number?: string;
  currency: string;
  exchange_rate_zar_to_usd?: number;
  exchange_rate_usd_to_cdf?: number;
  estimated_delivery_date?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  name: string;
  price: string;
  quantity: number;
>>>>>>> 03bf60a9fe63bf71016e8319191c7de9bf644209
  image?: string;
  sku?: string;
  color?: string;
  size?: string;
<<<<<<< HEAD
=======
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  changed_by?: string;
  created_at: string;
>>>>>>> 03bf60a9fe63bf71016e8319191c7de9bf644209
}

export interface CreateOrderData {
  user_id: string;
  delivery_address_id: string;
  cart_url: string;
<<<<<<< HEAD
  cart_screenshot_url?: string;
  total_amount: number;
  customer_notes?: string;
  items?: CartItem[] | CreateOrderItem[];
=======
  total_amount: number;
  subtotal_zar?: number;
  subtotal_usd?: number;
  delivery_fee: number;
  customer_notes?: string;
  whatsapp_number?: string;
  payment_reference?: string;
  currency?: string;
  exchange_rate_zar_to_usd?: number;
  exchange_rate_usd_to_cdf?: number;
  items: {
    name: string;
    price: string;
    quantity: number | string;
    image?: string;
    sku?: string;
    color?: string;
    size?: string;
  }[];
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  description?: string;
  created_at: string;
  updated_at: string;
>>>>>>> 03bf60a9fe63bf71016e8319191c7de9bf644209
}
