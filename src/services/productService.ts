import { Product } from '../types/product';

// Mock product data
let mockProducts: Product[] = [
  {
    id: '1',
    name: 'Product 1',
    price: 10.99,
    stock: 100,
    description: 'Description for product 1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Product 2',
    price: 20.99,
    stock: 50,
    description: 'Description for product 2',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const getProducts = async (): Promise<Product[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockProducts;
};

export const getProduct = async (id: string): Promise<Product> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const product = mockProducts.find(p => p.id === id);
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
};

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newProduct: Product = {
    ...product,
    id: String(mockProducts.length + 1),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  mockProducts.push(newProduct);
  return newProduct;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockProducts.findIndex(p => p.id === id);
  if (index === -1) {
    throw new Error('Product not found');
  }
  mockProducts[index] = {
    ...mockProducts[index],
    ...updates,
    updatedAt: new Date()
  };
  return mockProducts[index];
};

export const deleteProduct = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockProducts.findIndex(p => p.id === id);
  if (index === -1) {
    throw new Error('Product not found');
  }
  mockProducts = mockProducts.filter(p => p.id !== id);
};