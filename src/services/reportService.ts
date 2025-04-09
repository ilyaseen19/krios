import { Transaction } from '../types/product';
import { getAllItems } from './dbService';
import { STORES } from './dbService';

// Get filtered transactions based on date range
export const getFilteredTransactions = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
  try {
    const transactions = await getAllItems<Transaction>(STORES.SALES);
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  } catch (error) {
    console.error('Error getting filtered transactions:', error);
    throw error;
  }
};

// Get filtered inventory data based on date range with calculated values
export const getFilteredInventory = async (startDate: Date, endDate: Date): Promise<any[]> => {
  try {
    const products = await getAllItems(STORES.PRODUCTS);
    
    // Filter products by date range
    const filteredProducts = products.filter(product => {
      const productDate = new Date(product.updatedAt);
      return productDate >= startDate && productDate <= endDate;
    });
    
    // Calculate additional inventory metrics for each product
    return filteredProducts.map(product => {
      // Assume cost is 70% of price (30% margin)
      const costPrice = product.price * 0.7;
      const stockValue = product.price * product.stock;
      const costValue = costPrice * product.stock;
      const potentialProfit = stockValue - costValue;
      
      // Determine stock status based on product's actual minimumStock
      const minimumStock = product.minimumStock || 0;
      const status = product.stock < minimumStock ? 'Low Stock' : 'In Stock';
      
      return {
        ...product,
        sku: product.id.substring(0, 8), // Use part of ID as SKU
        currentStock: product.stock,
        minimumStock: product.minimumStock || 0, // Use actual minimumStock from product
        stockValue,
        costValue,
        potentialProfit,
        status
      };
    });
  } catch (error) {
    console.error('Error getting filtered inventory:', error);
    throw error;
  }
};