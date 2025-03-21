// Mock products data for the application

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  minimumStock: number;
  tax: number;
  cost: number;
  barcode: string;
  description: string;
  image: string;
}

export const mockProducts: Product[] = [
  { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 89.99, stock: 45, minimumStock: 10, tax: 5, cost: 65.99, barcode: 'WH-001', description: 'High-quality wireless headphones with noise cancellation', image: '' },
  { id: 2, name: 'Smart Watch', category: 'Electronics', price: 199.99, stock: 28, minimumStock: 5, tax: 5, cost: 149.99, barcode: 'SW-002', description: 'Smart watch with fitness tracking and notifications', image: '' },
  { id: 3, name: 'Bluetooth Speaker', category: 'Electronics', price: 59.99, stock: 36, minimumStock: 8, tax: 5, cost: 39.99, barcode: 'BS-003', description: 'Portable bluetooth speaker with excellent sound quality', image: '' },
  { id: 4, name: 'Laptop Backpack', category: 'Accessories', price: 49.99, stock: 52, minimumStock: 10, tax: 5, cost: 29.99, barcode: 'LB-004', description: 'Durable laptop backpack with multiple compartments', image: '' },
  { id: 5, name: 'USB-C Cable', category: 'Accessories', price: 12.99, stock: 120, minimumStock: 30, tax: 5, cost: 5.99, barcode: 'UC-005', description: 'High-speed USB-C charging cable', image: '' },
  { id: 6, name: 'Wireless Mouse', category: 'Electronics', price: 29.99, stock: 65, minimumStock: 15, tax: 5, cost: 18.99, barcode: 'WM-006', description: 'Ergonomic wireless mouse with long battery life', image: '' },
  { id: 7, name: 'Phone Case', category: 'Accessories', price: 19.99, stock: 85, minimumStock: 20, tax: 5, cost: 8.99, barcode: 'PC-007', description: 'Protective phone case with sleek design', image: '' },
  { id: 8, name: 'Power Bank', category: 'Electronics', price: 39.99, stock: 42, minimumStock: 10, tax: 5, cost: 24.99, barcode: 'PB-008', description: 'High-capacity power bank for charging on the go', image: '' },
  { id: 9, name: 'Fitness Tracker', category: 'Electronics', price: 79.99, stock: 18, minimumStock: 5, tax: 5, cost: 49.99, barcode: 'FT-009', description: 'Fitness tracker with heart rate monitoring', image: '' },
  { id: 10, name: 'Laptop Sleeve', category: 'Accessories', price: 24.99, stock: 37, minimumStock: 8, tax: 5, cost: 14.99, barcode: 'LS-010', description: 'Padded laptop sleeve for protection', image: '' },
  { id: 11, name: 'Wireless Charger', category: 'Electronics', price: 34.99, stock: 53, minimumStock: 12, tax: 5, cost: 19.99, barcode: 'WC-011', description: 'Fast wireless charger compatible with most devices', image: '' },
  { id: 12, name: 'Bluetooth Earbuds', category: 'Electronics', price: 69.99, stock: 31, minimumStock: 8, tax: 5, cost: 45.99, barcode: 'BE-012', description: 'Wireless bluetooth earbuds with charging case', image: '' },
  { id: 13, name: 'HDMI Cable', category: 'Accessories', price: 14.99, stock: 94, minimumStock: 25, tax: 5, cost: 7.99, barcode: 'HC-013', description: 'High-definition multimedia interface cable', image: '' },
  { id: 14, name: 'Graphic T-Shirt', category: 'Clothing', price: 22.99, stock: 76, minimumStock: 15, tax: 5, cost: 12.99, barcode: 'GT-014', description: 'Comfortable cotton t-shirt with graphic design', image: '' },
  { id: 15, name: 'Denim Jacket', category: 'Clothing', price: 59.99, stock: 23, minimumStock: 5, tax: 5, cost: 39.99, barcode: 'DJ-015', description: 'Classic denim jacket with modern fit', image: '' },
  { id: 16, name: 'Running Shoes', category: 'Clothing', price: 89.99, stock: 15, minimumStock: 5, tax: 5, cost: 59.99, barcode: 'RS-016', description: 'Lightweight running shoes with cushioned sole', image: '' },
];

export const productCategories = ['Electronics', 'Accessories', 'Clothing'];

export const sortOptions = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'stock-asc', label: 'Stock (Low to High)' },
  { value: 'stock-desc', label: 'Stock (High to Low)' }
];