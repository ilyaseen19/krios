import { Product } from '../types/product';
import { mockProducts } from '../data/mockProducts';

// Function to get inventory data filtered by date range
export const getFilteredInventory = async (startDate: Date, endDate: Date): Promise<any[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real application, you would filter products based on their creation or update dates
  // For this mock implementation, we'll return all products with some additional inventory metrics
  return mockProducts.map(product => ({
    id: product.id,
    name: product.name,
    category: product.category,
    sku: product.barcode,
    currentStock: product.stock,
    minimumStock: product.minimumStock,
    stockValue: product.stock * product.price,
    costValue: product.stock * product.cost,
    potentialProfit: product.stock * (product.price - product.cost),
    status: product.stock <= product.minimumStock ? 'Low Stock' : 'In Stock',
    lastUpdated: new Date() // In a real app, this would be the actual update date
  }));
};

// Function to get inventory summary metrics
export const getInventorySummary = async (): Promise<{
  totalProducts: number;
  totalStockValue: number;
  totalCostValue: number;
  potentialProfit: number;
  lowStockItems: number;
}> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const lowStockItems = mockProducts.filter(p => p.stock <= p.minimumStock).length;
  const totalStockValue = mockProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalCostValue = mockProducts.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  
  return {
    totalProducts: mockProducts.length,
    totalStockValue,
    totalCostValue,
    potentialProfit: totalStockValue - totalCostValue,
    lowStockItems
  };
};