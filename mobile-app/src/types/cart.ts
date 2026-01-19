export interface CartItem {
  name?: string;
  price?: string;
  quantity?: string;
  image?: string;
  sku?: string;
  color?: string;
  size?: string;
}

export interface ScrapeResponse {
  success: boolean;
  items: CartItem[];
  total_items: number;
  message?: string;
}
