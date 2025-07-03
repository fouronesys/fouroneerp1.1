import { storage } from './storage';

interface ExchangeRate {
  currency: string;
  rate: number;
  lastUpdated: Date;
}

interface CurrencyAPIResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export class CurrencyService {
  private updateTimer: NodeJS.Timeout | null = null;
  private supportedCurrencies = ['USD', 'EUR', 'DOP', 'CAD', 'GBP', 'JPY', 'CHF', 'AUD'];
  private baseCurrency = 'DOP'; // Dominican Peso as base

  constructor() {
    this.startAutoUpdate();
  }

  /**
   * Start automatic currency rate updates every 24 hours
   */
  public startAutoUpdate(): void {
    console.log('Starting currency rate auto-updater (every 24 hours)');
    
    // Update immediately on start
    this.updateExchangeRates().catch(error => {
      console.error('Initial currency rate update failed:', error);
    });

    // Set up 24-hour interval
    this.updateTimer = setInterval(() => {
      this.updateExchangeRates().catch(error => {
        console.error('Scheduled currency rate update failed:', error);
      });
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Stop automatic currency rate updates
   */
  public stopAutoUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      console.log('Currency rate auto-updater stopped');
    }
  }

  /**
   * Update exchange rates from external API
   */
  public async updateExchangeRates(): Promise<boolean> {
    try {
      console.log('Updating currency exchange rates...');
      
      // Using exchangerate-api.com (free tier)
      const apiUrl = `https://api.exchangerate-api.com/v4/latest/${this.baseCurrency}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Currency API responded with status: ${response.status}`);
      }

      const data: CurrencyAPIResponse = await response.json();
      
      if (!data.success && data.success !== undefined) {
        throw new Error('Currency API request was not successful');
      }

      // Update rates for supported currencies
      for (const currency of this.supportedCurrencies) {
        if (currency === this.baseCurrency) continue;
        
        const rate = data.rates[currency];
        if (rate) {
          await storage.upsertExchangeRate({
            currency,
            rate,
            lastUpdated: new Date(),
            baseCurrency: this.baseCurrency
          });
        }
      }

      console.log(`Currency rates updated successfully for ${this.supportedCurrencies.length} currencies`);
      return true;
    } catch (error) {
      console.error('Failed to update currency exchange rates:', error);
      
      // Use fallback rates if API fails
      await this.setFallbackRates();
      return false;
    }
  }

  /**
   * Set fallback exchange rates when API is unavailable
   */
  private async setFallbackRates(): Promise<void> {
    console.log('Setting fallback currency rates...');
    
    const fallbackRates = {
      USD: 0.017,  // 1 DOP = 0.017 USD (approximate)
      EUR: 0.015,  // 1 DOP = 0.015 EUR (approximate)
      CAD: 0.023,  // 1 DOP = 0.023 CAD (approximate)
      GBP: 0.013,  // 1 DOP = 0.013 GBP (approximate)
      JPY: 2.5,    // 1 DOP = 2.5 JPY (approximate)
      CHF: 0.015,  // 1 DOP = 0.015 CHF (approximate)
      AUD: 0.026   // 1 DOP = 0.026 AUD (approximate)
    };

    for (const [currency, rate] of Object.entries(fallbackRates)) {
      await storage.upsertExchangeRate({
        currency,
        rate,
        lastUpdated: new Date(),
        baseCurrency: this.baseCurrency,
        isFallback: true
      });
    }
  }

  /**
   * Get current exchange rate for a currency
   */
  public async getExchangeRate(currency: string): Promise<number> {
    if (currency === this.baseCurrency) return 1;
    
    const rate = await storage.getExchangeRate(currency);
    return rate?.rate || 1;
  }

  /**
   * Convert amount from one currency to another
   */
  public async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to base currency first, then to target currency
    const fromRate = await this.getExchangeRate(fromCurrency);
    const toRate = await this.getExchangeRate(toCurrency);
    
    // If converting from base currency
    if (fromCurrency === this.baseCurrency) {
      return amount * toRate;
    }
    
    // If converting to base currency
    if (toCurrency === this.baseCurrency) {
      return amount / fromRate;
    }
    
    // Converting between two non-base currencies
    const baseAmount = amount / fromRate;
    return baseAmount * toRate;
  }

  /**
   * Get all supported currencies with current rates
   */
  public async getAllExchangeRates(): Promise<ExchangeRate[]> {
    const rates: ExchangeRate[] = [];
    
    // Add base currency
    rates.push({
      currency: this.baseCurrency,
      rate: 1,
      lastUpdated: new Date()
    });
    
    // Add other currencies
    for (const currency of this.supportedCurrencies) {
      if (currency === this.baseCurrency) continue;
      
      const rateData = await storage.getExchangeRate(currency);
      if (rateData) {
        rates.push({
          currency,
          rate: rateData.rate,
          lastUpdated: rateData.lastUpdated
        });
      }
    }
    
    return rates;
  }

  /**
   * Format currency amount with proper symbol and decimals
   */
  public formatCurrency(amount: number, currency: string): string {
    const symbols: Record<string, string> = {
      DOP: 'RD$',
      USD: '$',
      EUR: '€',
      CAD: 'C$',
      GBP: '£',
      JPY: '¥',
      CHF: 'CHF',
      AUD: 'A$'
    };

    const symbol = symbols[currency] || currency;
    const decimals = currency === 'JPY' ? 0 : 2;
    
    return `${symbol} ${amount.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })}`;
  }

  /**
   * Get service status
   */
  public getStatus() {
    return {
      isRunning: this.updateTimer !== null,
      supportedCurrencies: this.supportedCurrencies,
      baseCurrency: this.baseCurrency,
      lastUpdate: new Date().toISOString(),
      updateInterval: '24 hours'
    };
  }
}

export const currencyService = new CurrencyService();