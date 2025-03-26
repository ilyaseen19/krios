// Utility functions for price formatting and calculations
import { formatCurrency, calculateTax, calculateTotalWithTax } from './formatUtils';
import { useSettings } from '../contexts/SettingsContext';

/**
 * Custom hook to format prices with the current currency symbol from settings
 * @returns Object with formatting and calculation functions
 */
export const usePriceFormatter = () => {
  const { generalSettings } = useSettings();
  
  return {
    /**
     * Format a price with the current currency symbol
     * @param price The price to format
     * @returns Formatted price string with currency symbol
     */
    formatPrice: (price: number): string => {
      return formatCurrency(price, generalSettings.currencySymbol);
    },
    
    /**
     * Calculate tax amount based on the current tax rate
     * @param subtotal The amount before tax
     * @returns The tax amount
     */
    calculateTaxAmount: (subtotal: number): number => {
      return calculateTax(subtotal, parseFloat(generalSettings.taxRate));
    },
    
    /**
     * Calculate total with tax included based on the current tax rate
     * @param subtotal The amount before tax
     * @returns The total amount including tax
     */
    calculateTotal: (subtotal: number): number => {
      return calculateTotalWithTax(subtotal, parseFloat(generalSettings.taxRate));
    }
  };
};