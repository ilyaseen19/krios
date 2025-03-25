import { Product } from '../types/product';
import { STORES, addItem, getAllItems, getItemById, updateItem, deleteItem, addPendingOperation, getPendingOperations, deletePendingOperation } from './dbService';

// Check if we're online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Get all products from IndexedDB
export const getProducts = async (): Promise<Product[]> => {
  try {
    // Try to get products from IndexedDB
    const products = await getAllItems<Product>(STORES.PRODUCTS);
    return products;
  } catch (error) {
    console.error('Error getting products from IndexedDB:', error);
    throw error;
  }
};

// Get a single product by ID from IndexedDB
export const getProduct = async (id: string): Promise<Product> => {
  try {
    const product = await getItemById<Product>(STORES.PRODUCTS, id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    console.error(`Error getting product ${id} from IndexedDB:`, error);
    throw error;
  }
};

// Create a new product in IndexedDB
export const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  try {
    // Generate a unique ID for the product
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the new product object
    const newProduct: Product = {
      ...product,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add the product to IndexedDB
    await addItem<Product>(STORES.PRODUCTS, newProduct);
    
    // If online, we would sync with the server here
    // For now, just add it to pending operations
    if (!isOnline()) {
      await addPendingOperation({
        type: 'add',
        entityType: STORES.PRODUCTS,
        data: newProduct,
        timestamp: new Date()
      });
    }
    
    return newProduct;
  } catch (error) {
    console.error('Error creating product in IndexedDB:', error);
    throw error;
  }
};

// Update a product in IndexedDB
export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  try {
    // Get the existing product
    const existingProduct = await getItemById<Product>(STORES.PRODUCTS, id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }
    
    // Update the product
    const updatedProduct: Product = {
      ...existingProduct,
      ...productData,
      updatedAt: new Date()
    };
    
    // Update the product in IndexedDB
    await updateItem<Product>(STORES.PRODUCTS, updatedProduct);
    
    // If online, we would sync with the server here
    // For now, just add it to pending operations
    if (!isOnline()) {
      await addPendingOperation({
        type: 'edit',
        entityType: STORES.PRODUCTS,
        data: updatedProduct,
        timestamp: new Date()
      });
    }
    
    return updatedProduct;
  } catch (error) {
    console.error(`Error updating product ${id} in IndexedDB:`, error);
    throw error;
  }
};

// Delete a product from IndexedDB
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    // Get the product first to store in pending operations
    const product = await getItemById<Product>(STORES.PRODUCTS, id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Delete the product from IndexedDB
    await deleteItem(STORES.PRODUCTS, id);
    
    // If online, we would sync with the server here
    // For now, just add it to pending operations
    if (!isOnline()) {
      await addPendingOperation({
        type: 'delete',
        entityType: STORES.PRODUCTS,
        data: { id, product },
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error(`Error deleting product ${id} from IndexedDB:`, error);
    throw error;
  }
};

// Sync products with server
export const syncProducts = async (): Promise<void> => {
  if (!navigator.onLine) {
    console.log('Cannot sync products: Application is offline');
    return;
  }

  console.log('Syncing products with server...');
  
  try {
    // Get all pending operations related to products
    const pendingOps = await getPendingOperations();
    const productOps = pendingOps.filter(op => op.entityType === STORES.PRODUCTS);
    
    // Sort operations by timestamp to process in order
    productOps.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`Processing ${productOps.length} pending product operations`);
    
    for (const op of productOps) {
      try {
        let success = false;
        
        switch (op.type) {
          case 'add':
            // For adds, send POST to /products
            const productToAdd = { ...op.data };
            // Remove local_ prefix from ID if present
            if (productToAdd.id && productToAdd.id.startsWith('local_')) {
              delete productToAdd.id; // Let the server generate a new ID
            }
            
            const response = await fetch('/api/products', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(productToAdd)
            });
            
            if (response.ok) {
              success = true;
              console.log(`Successfully added product to server`);
            } else {
              console.error(`Failed to add product to server: ${response.statusText}`);
            }
            break;
            
          case 'edit':
            // For edits, send PUT to /products/:id
            // Skip if it's a local ID that hasn't been synced yet
            if (!op.data.id.startsWith('local_')) {
              const updateResponse = await fetch(`/api/products/${op.data.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(op.data)
              });
              
              if (updateResponse.ok) {
                success = true;
                console.log(`Successfully updated product ${op.data.id} on server`);
              } else {
                console.error(`Failed to update product ${op.data.id} on server: ${updateResponse.statusText}`);
              }
            } else {
              // If it's a local ID, we need to create it instead
              const productToCreate = { ...op.data };
              delete productToCreate.id;
              
              const createResponse = await fetch('/api/products', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(productToCreate)
              });
              
              if (createResponse.ok) {
                success = true;
                console.log(`Successfully created product on server (was local edit)`);
              } else {
                console.error(`Failed to create product on server: ${createResponse.statusText}`);
              }
            }
            break;
            
          case 'delete':
            // For deletes, send DELETE to /products/:id
            // Skip if it's a local ID that hasn't been synced yet
            if (!op.data.id.startsWith('local_')) {
              const deleteResponse = await fetch(`/api/products/${op.data.id}`, {
                method: 'DELETE'
              });
              
              if (deleteResponse.ok) {
                success = true;
                console.log(`Successfully deleted product ${op.data.id} from server`);
              } else {
                console.error(`Failed to delete product ${op.data.id} from server: ${deleteResponse.statusText}`);
              }
            } else {
              // If it's a local ID, we can just mark it as successful since it never existed on the server
              success = true;
              console.log(`Skipped deleting local product that wasn't synced to server`);
            }
            break;
            
          default:
            console.warn(`Unknown product operation type: ${op.type}`);
        }
        
        // Remove the operation from pending operations if successful
        if (success) {
          await deletePendingOperation(op.id);
        }
      } catch (error) {
        console.error(`Error processing product operation ${op.id}:`, error);
        // Continue with next operation
      }
    }
    
    // After syncing, fetch the latest product list from server
    await importProductsFromServer();
    
    console.log('Finished syncing products with server');
  } catch (error) {
    console.error('Error syncing products with server:', error);
    throw error;
  }
};

// Import products from server to IndexedDB
export const importProductsFromServer = async (): Promise<void> => {
  if (!navigator.onLine) {
    console.log('Cannot import products: Application is offline');
    return;
  }
  
  console.log('Importing products from server...');
  
  try {
    // Fetch all products from the server
    const response = await fetch('/api/products');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    const serverProducts = await response.json();
    console.log(`Fetched ${serverProducts.length} products from server`);
    
    // Get all local products
    const localProducts = await getAllItems<Product>(STORES.PRODUCTS);
    
    // Create a map of local products by ID for quick lookup
    const localProductMap = new Map<string, Product>();
    localProducts.forEach(product => {
      // Only include non-local IDs in the map
      if (!product.id.startsWith('local_')) {
        localProductMap.set(product.id, product);
      }
    });
    
    // Process each server product
    for (const serverProduct of serverProducts) {
      const localProduct = localProductMap.get(serverProduct.id);
      
      if (!localProduct) {
        // Product doesn't exist locally, add it
        await addItem<Product>(STORES.PRODUCTS, serverProduct);
      } else {
        // Product exists locally, update it if the server version is newer
        const serverUpdatedAt = new Date(serverProduct.updatedAt);
        const localUpdatedAt = new Date(localProduct.updatedAt);
        
        if (serverUpdatedAt > localUpdatedAt) {
          await updateItem<Product>(STORES.PRODUCTS, serverProduct);
        }
      }
      
      // Remove from map to track which local products don't exist on server
      localProductMap.delete(serverProduct.id);
    }
    
    // Handle local products that don't exist on the server
    // (excluding those with local_ IDs which haven't been synced yet)
    for (const [id, product] of localProductMap.entries()) {
      if (!id.startsWith('local_')) {
        // Product exists locally but not on server, delete it
        await deleteItem(STORES.PRODUCTS, id);
      }
    }
    
    console.log('Successfully imported products from server');
  } catch (error) {
    console.error('Error importing products from server:', error);
    throw error;
  }
};