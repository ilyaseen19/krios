// Dashboard Service for fetching data from IndexedDB

import { getAllItems } from './dbService';
import { STORES } from './dbService';
import { Product, Transaction } from '../types/product';

// Get total revenue from transactions
export const getTotalRevenue = async (): Promise<number> => {
  try {
    const transactions = await getAllItems<Transaction>(STORES.SALES);
    return transactions.reduce((sum, transaction) => sum + transaction.total, 0);
  } catch (error) {
    console.error('Error getting total revenue:', error);
    return 0;
  }
};

// Get total number of orders
export const getTotalOrders = async (): Promise<number> => {
  try {
    const transactions = await getAllItems<Transaction>(STORES.SALES);
    return transactions.length;
  } catch (error) {
    console.error('Error getting total orders:', error);
    return 0;
  }
};

// Get total number of customers (unique cashierIds)
export const getTotalCustomers = async (): Promise<number> => {
  try {
    const transactions = await getAllItems<Transaction>(STORES.SALES);
    const uniqueCustomers = new Set(transactions.map(t => t.cashierId));
    return uniqueCustomers.size;
  } catch (error) {
    console.error('Error getting total customers:', error);
    return 0;
  }
};

// Get total number of products (based on quantity/stock)
export const getTotalProducts = async (): Promise<number> => {
  try {
    const products = await getAllItems<Product>(STORES.PRODUCTS);
    return products.reduce((sum, product) => sum + product.stock, 0);
  } catch (error) {
    console.error('Error getting total products:', error);
    return 0;
  }
};

// Get total number of categories directly from the categories store
export const getTotalCategories = async (): Promise<number> => {
  try {
    const categories = await getAllItems(STORES.CATEGORIES);
    return categories.length;
  } catch (error) {
    console.error('Error getting total categories:', error);
    return 0;
  }
};

// Get sales data for different time ranges
export const getSalesData = async (timeRange: 'daily' | 'monthly' | 'yearly'): Promise<any[]> => {
  try {
    const transactions = await getAllItems<Transaction>(STORES.SALES);
    
    // Group transactions by date
    const groupedData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.createdAt);
      let key = '';
      
      if (timeRange === 'daily') {
        // Group by day of week
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        key = days[date.getDay()];
      } else if (timeRange === 'monthly') {
        // Group by month
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        key = months[date.getMonth()];
      } else {
        // Group by year
        key = date.getFullYear().toString();
      }
      
      if (!acc[key]) {
        acc[key] = {
          name: key,
          sales: 0,
          profit: 0
        };
      }
      
      acc[key].sales += transaction.total;
      // Estimate profit as 40% of sales for demonstration
      acc[key].profit += transaction.total * 0.4;
      
      return acc;
    }, {} as Record<string, { name: string; sales: number; profit: number }>);
    
    // Convert to array and sort
    let result = Object.values(groupedData);
    
    // Sort by appropriate order
    if (timeRange === 'daily') {
      const dayOrder = {'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6};
      result.sort((a, b) => dayOrder[a.name as keyof typeof dayOrder] - dayOrder[b.name as keyof typeof dayOrder]);
    } else if (timeRange === 'monthly') {
      const monthOrder = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
      result.sort((a, b) => monthOrder[a.name as keyof typeof monthOrder] - monthOrder[b.name as keyof typeof monthOrder]);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  } catch (error) {
    console.error(`Error getting ${timeRange} sales data:`, error);
    return [];
  }
};

// Get top selling products
export const getTopSellingProducts = async (limit: number = 5): Promise<any[]> => {
  try {
    const products = await getAllItems<Product>(STORES.PRODUCTS);
    const transactions = await getAllItems<Transaction>(STORES.SALES);
    
    // Calculate total quantity sold for each product
    const productSales: Record<string, { name: string; value: number }> = {};
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            name: item.name,
            value: 0
          };
        }
        productSales[item.id].value += item.price * item.quantity;
      });
    });
    
    // Convert to array, sort by value, and take top N
    return Object.values(productSales)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting top selling products:', error);
    return [];
  }
};

// Get product category distribution
export const getProductCategoryDistribution = async (): Promise<any[]> => {
  try {
    const products = await getAllItems<Product>(STORES.PRODUCTS);
    
    // Count products by category
    const categoryData = products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      const existingCategory = acc.find(item => item.name === category);
      
      if (existingCategory) {
        existingCategory.value += 1;
      } else {
        acc.push({ name: category, value: 1 });
      }
      
      return acc;
    }, [] as { name: string; value: number }[]);
    
    return categoryData;
  } catch (error) {
    console.error('Error getting product category distribution:', error);
    return [];
  }
};

// Get recent sales data (last 7 days)
export const getRecentSalesData = async (): Promise<any[]> => {
  try {
    const transactions = await getAllItems<Transaction>(STORES.SALES);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter transactions from the last 7 days
    const recentTransactions = transactions.filter(t => 
      new Date(t.createdAt) >= sevenDaysAgo && new Date(t.createdAt) <= now
    );
    
    // Group by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesByDay: Record<string, number> = {};
    
    // Initialize all days with 0
    days.forEach(day => {
      salesByDay[day] = 0;
    });
    
    // Sum sales by day
    recentTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const day = days[date.getDay()];
      salesByDay[day] += transaction.total;
    });
    
    // Convert to array format needed for charts
    return days.map(day => ({
      day,
      sales: salesByDay[day]
    }));
  } catch (error) {
    console.error('Error getting recent sales data:', error);
    return [];
  }
};

// Get sales by payment type
export const getSalesByPaymentType = async (): Promise<any[]> => {
  try {
    const transactions = await getAllItems<Transaction>(STORES.SALES);
    
    // Group by payment type
    const salesByType = transactions.reduce((acc, transaction) => {
      const paymentType = transaction.paymentType || 'Unknown';
      
      if (!acc[paymentType]) {
        acc[paymentType] = {
          name: paymentType.charAt(0).toUpperCase() + paymentType.slice(1),
          value: 0
        };
      }
      
      acc[paymentType].value += transaction.total;
      
      return acc;
    }, {} as Record<string, { name: string; value: number }>);
    
    return Object.values(salesByType);
  } catch (error) {
    console.error('Error getting sales by payment type:', error);
    return [];
  }
};