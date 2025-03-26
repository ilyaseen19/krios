// Utility functions for formatting currency and dates based on user settings

/**
 * Format a number as currency using the provided currency symbol
 * @param amount The amount to format
 * @param currencySymbol The currency symbol to use
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currencySymbol: string = '$'): string => {
  return `${currencySymbol}${amount.toFixed(2)}`;
};

/**
 * Format a date according to the specified format
 * @param date The date to format
 * @param format The date format to use
 * @returns Formatted date string
 */
export const formatDate = (date: Date, format: string = 'MM/DD/YYYY'): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
    default:
      return `${month}/${day}/${year}`;
  }
};

/**
 * Apply timezone offset to a date
 * @param date The date to adjust
 * @param timezone The timezone string (e.g., 'UTC-5 (Eastern Time)')
 * @returns Date adjusted for the timezone
 */
export const applyTimezone = (date: Date, timezone: string = 'UTC-5 (Eastern Time)'): Date => {
  // Extract UTC offset from timezone string (e.g., 'UTC-5' -> -5)
  const match = timezone.match(/UTC([+-]\d+)/);
  if (!match) return date;
  
  const utcOffset = parseInt(match[1]);
  const newDate = new Date(date);
  
  // Adjust the date by the UTC offset
  // First reset to UTC
  const minutesOffset = newDate.getTimezoneOffset();
  newDate.setMinutes(newDate.getMinutes() + minutesOffset);
  
  // Then apply the desired UTC offset
  newDate.setHours(newDate.getHours() + utcOffset);
  
  return newDate;
};

/**
 * Calculate tax amount based on a subtotal and tax rate
 * @param subtotal The amount before tax
 * @param taxRate The tax rate percentage
 * @returns The tax amount
 */
export const calculateTax = (subtotal: number, taxRate: number): number => {
  return subtotal * (taxRate / 100);
};

/**
 * Calculate total with tax included
 * @param subtotal The amount before tax
 * @param taxRate The tax rate percentage
 * @returns The total amount including tax
 */
export const calculateTotalWithTax = (subtotal: number, taxRate: number): number => {
  return subtotal + calculateTax(subtotal, taxRate);
};