/**
 * Utility functions for inventory calculations
 * These functions properly account for product quantities in all calculations
 */

// Define a product interface that includes all necessary properties for calculations
export interface InventoryProduct {
  id: string | number;
  name: string;
  price: number;  // Selling price per unit
  stock: number;  // Current quantity in stock
  cost: number;   // Cost price per unit
  minimumStock?: number;
}

/**
 * Calculate the total inventory cost based on quantity × unit cost for each product
 * @param products Array of products with cost and stock information
 * @returns Total inventory cost
 */
export const calculateTotalInventoryCost = (products: InventoryProduct[]): number => {
  return products.reduce((sum, product) => sum + (product.cost * product.stock), 0);
};

/**
 * Calculate the total stock value based on quantity × selling price for each product
 * @param products Array of products with price and stock information
 * @returns Total stock value
 */
export const calculateTotalStockValue = (products: InventoryProduct[]): number => {
  return products.reduce((sum, product) => sum + (product.price * product.stock), 0);
};

/**
 * Calculate the potential profit based on the difference between stock value and inventory cost
 * @param products Array of products with price, cost, and stock information
 * @returns Potential profit
 */
export const calculatePotentialProfit = (products: InventoryProduct[]): number => {
  return products.reduce((sum, product) => sum + ((product.price - product.cost) * product.stock), 0);
};

/**
 * Calculate the expected revenue based on selling price × quantity × markup factor
 * @param products Array of products with price and stock information
 * @param markupFactor Optional markup factor (default: 1.0 - no markup)
 * @returns Expected revenue
 */
export const calculateExpectedRevenue = (products: InventoryProduct[], markupFactor: number = 1.0): number => {
  return products.reduce((sum, product) => sum + (product.price * product.stock * markupFactor), 0);
};

/**
 * Count the total number of product units in inventory
 * @param products Array of products with stock information
 * @returns Total product units
 */
export const countTotalProductUnits = (products: InventoryProduct[]): number => {
  return products.reduce((sum, product) => sum + product.stock, 0);
};

/**
 * Count the number of products that are low on stock
 * @param products Array of products with stock and minimumStock information
 * @returns Number of low stock products
 */
export const countLowStockItems = (products: InventoryProduct[]): number => {
  return products.filter(product => {
    const minimumStock = product.minimumStock || 0;
    return product.stock <= minimumStock;
  }).length;
};