import { Product } from '../types/product';
import { STORES, addItem, getAllItems, getItemById, updateItem, deleteItem } from './dbService';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const products = await getAllItems<Product>(STORES.PRODUCTS);
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

export const getProduct = async (id: string): Promise<Product> => {
  try {
    const product = await getItemById<Product>(STORES.PRODUCTS, id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    console.error(`Error getting product ${id}:`, error);
    throw error;
  }
};

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  try {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await addItem<Product>(STORES.PRODUCTS, newProduct);
    return newProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  try {
    const existingProduct = await getItemById<Product>(STORES.PRODUCTS, id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }
    const updatedProduct: Product = {
      ...existingProduct,
      ...updates,
      updatedAt: new Date()
    };
    await updateItem<Product>(STORES.PRODUCTS, updatedProduct);
    return updatedProduct;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await deleteItem(STORES.PRODUCTS, id);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};