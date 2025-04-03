// Currency constants for the application

export interface Currency {
  symbol: string;
  code: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  { symbol: '¥', code: 'CNY', name: 'Chinese Yuan' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '₽', code: 'RUB', name: 'Russian Ruble' },
  { symbol: '₩', code: 'KRW', name: 'South Korean Won' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  { symbol: 'Fr', code: 'CHF', name: 'Swiss Franc' },
  { symbol: 'GH₵', code: 'GHS', name: 'Ghana Cedi' },
  { symbol: 'ZMW', code: 'ZMW', name: 'Zambian Kwacha' },
  { symbol: '₦', code: 'NGN', name: 'Nigerian Naira' },
  { symbol: 'MK', code: 'MWK', name: 'Malawian Kwacha' },
];

// Default currency
export const DEFAULT_CURRENCY = CURRENCIES[0];

// Helper function to get currency by symbol
export const getCurrencyBySymbol = (symbol: string): Currency => {
  return CURRENCIES.find(currency => currency.symbol === symbol) || DEFAULT_CURRENCY;
};

// Helper function to get currency by code
export const getCurrencyByCode = (code: string): Currency => {
  return CURRENCIES.find(currency => currency.code === code) || DEFAULT_CURRENCY;
};

// Format for currency display in dropdowns
export const getCurrencyDisplayText = (currency: Currency): string => {
  return `${currency.symbol} (${currency.code})`;
};