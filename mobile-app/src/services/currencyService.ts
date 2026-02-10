// Currency conversion service for Lobi
// Using hardcoded rates for now - can be replaced with real-time API later

export interface ExchangeRates {
  ZAR_to_USD: number;
  USD_to_CDF: number;
}

// Hardcoded rates (update manually or integrate with API later)
const DEFAULT_RATES: ExchangeRates = {
  ZAR_to_USD: 0.056, // 1 ZAR ≈ 0.056 USD (as of Jan 2026)
  USD_to_CDF: 2500,   // 1 USD ≈ 2500 CDF (Congolese Franc)
};

export const currencyService = {
  /**
   * Get current exchange rates
   * TODO: Replace with real-time API (e.g., ExchangeRate-API.com)
   */
  async getExchangeRates(): Promise<ExchangeRates> {
    // For now, return hardcoded rates
    // In production, fetch from API:
    // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    // const data = await response.json();
    return DEFAULT_RATES;
  },

  /**
   * Convert ZAR to USD
   */
  zarToUsd(zarAmount: number): number {
    return zarAmount * DEFAULT_RATES.ZAR_to_USD;
  },

  /**
   * Convert USD to CDF
   */
  usdToCdf(usdAmount: number): number {
    return usdAmount * DEFAULT_RATES.USD_to_CDF;
  },

  /**
   * Convert ZAR to CDF (via USD)
   */
  zarToCdf(zarAmount: number): number {
    const usd = this.zarToUsd(zarAmount);
    return this.usdToCdf(usd);
  },

  /**
   * Format currency display with multiple currencies
   */
  formatMultiCurrency(zarAmount: number): string {
    const usd = this.zarToUsd(zarAmount);
    const cdf = this.usdToCdf(usd);
    
    return `R${zarAmount.toFixed(2)} ≈ $${usd.toFixed(2)} USD ≈ ${cdf.toLocaleString('fr-CD')} CDF`;
  },

  /**
   * Extract numeric value from price string (e.g., "R148" -> 148)
   */
  extractNumericPrice(priceString: string): number {
    const match = priceString.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  },
};
