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

// Get filtered inventory data based on date range
export const getFilteredInventory = async (startDate: Date, endDate: Date): Promise<any[]> => {
  try {
    const products = await getAllItems(STORES.PRODUCTS);
    return products.filter(product => {
      const productDate = new Date(product.updatedAt);
      return productDate >= startDate && productDate <= endDate;
    });
  } catch (error) {
    console.error('Error getting filtered inventory:', error);
    throw error;
  }
};