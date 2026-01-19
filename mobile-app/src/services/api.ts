import { CartItem } from '../types/cart';

export interface ScrapeResponse {
  success: boolean;
  items: CartItem[];
  total_items: number;
  message?: string;
}

const API_URL = 'http://localhost:8000'; // Local backend with Playwright

export const scrapeCart = async (url: string): Promise<ScrapeResponse> => {
  try {
    const response = await fetch(`${API_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as ScrapeResponse;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to scrape cart');
  }
};
