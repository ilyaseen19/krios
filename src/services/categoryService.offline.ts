import { STORES, addItem, getAllItems, getItemById, updateItem, deleteItem, addPendingOperation, getPendingOperations, deletePendingOperation } from './dbService';

// Define the Category interface
export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Check if we're online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Get all categories from IndexedDB
export const getCategories = async (): Promise<Category[]> => {
  try {
    // Try to get categories from IndexedDB
    const categories = await getAllItems<Category>(STORES.CATEGORIES);
    return categories;
  } catch (error) {
    console.error('Error getting categories from IndexedDB:', error);
    throw error;
  }
};

// Get a single category by ID from IndexedDB
export const getCategory = async (id: string): Promise<Category> => {
  try {
    const category = await getItemById<Category>(STORES.CATEGORIES, id);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  } catch (error) {
    console.error(`Error getting category ${id} from IndexedDB:`, error);
    throw error;
  }
};

// Create a new category in IndexedDB
export const createCategory = async (name: string): Promise<Category> => {
  try {
    // Generate a unique ID for the category
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the new category object
    const newCategory: Category = {
      id,
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add the category to IndexedDB
    await addItem<Category>(STORES.CATEGORIES, newCategory);
    
    // If online, we would sync with the server here
    // For now, just add it to pending operations
    if (!isOnline()) {
      await addPendingOperation({
        type: 'add',
        entityType: STORES.CATEGORIES,
        data: newCategory,
        timestamp: new Date()
      });
    }
    
    return newCategory;
  } catch (error) {
    console.error('Error creating category in IndexedDB:', error);
    throw error;
  }
};

// Update a category in IndexedDB
export const updateCategory = async (id: string, name: string): Promise<Category> => {
  try {
    // Get the existing category
    const existingCategory = await getItemById<Category>(STORES.CATEGORIES, id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }
    
    // Update the category
    const updatedCategory: Category = {
      ...existingCategory,
      name,
      updatedAt: new Date()
    };
    
    // Update the category in IndexedDB
    await updateItem<Category>(STORES.CATEGORIES, updatedCategory);
    
    // If online, we would sync with the server here
    // For now, just add it to pending operations
    if (!isOnline()) {
      await addPendingOperation({
        type: 'edit',
        entityType: STORES.CATEGORIES,
        data: updatedCategory,
        timestamp: new Date()
      });
    }
    
    return updatedCategory;
  } catch (error) {
    console.error(`Error updating category ${id} in IndexedDB:`, error);
    throw error;
  }
};

// Delete a category from IndexedDB
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    // Get the category first to store in pending operations
    const category = await getItemById<Category>(STORES.CATEGORIES, id);
    if (!category) {
      throw new Error('Category not found');
    }
    
    // Delete the category from IndexedDB
    await deleteItem(STORES.CATEGORIES, id);
    
    // If online, we would sync with the server here
    // For now, just add it to pending operations
    if (!isOnline()) {
      await addPendingOperation({
        type: 'delete',
        entityType: STORES.CATEGORIES,
        data: { id, category },
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error(`Error deleting category ${id} from IndexedDB:`, error);
    throw error;
  }
};

// Sync categories with server
export const syncCategories = async (): Promise<void> => {
  if (!navigator.onLine) {
    console.log('Cannot sync categories: Application is offline');
    return;
  }

  console.log('Syncing categories with server...');
  
  try {
    // Get all pending operations related to categories
    const pendingOps = await getPendingOperations();
    const categoryOps = pendingOps.filter(op => op.entityType === STORES.CATEGORIES);
    
    // Sort operations by timestamp to process in order
    categoryOps.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`Processing ${categoryOps.length} pending category operations`);
    
    for (const op of categoryOps) {
      try {
        let success = false;
        
        switch (op.type) {
          case 'add':
            // For adds, send POST to /categories
            const categoryToAdd = { ...op.data };
            // Remove local_ prefix from ID if present
            if (categoryToAdd.id && categoryToAdd.id.startsWith('local_')) {
              delete categoryToAdd.id; // Let the server generate a new ID
            }
            
            const response = await fetch('/api/categories', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(categoryToAdd)
            });
            
            if (response.ok) {
              success = true;
              console.log(`Successfully added category to server`);
            } else {
              console.error(`Failed to add category to server: ${response.statusText}`);
            }
            break;
            
          case 'edit':
            // For edits, send PUT to /categories/:id
            // Skip if it's a local ID that hasn't been synced yet
            if (!op.data.id.startsWith('local_')) {
              const updateResponse = await fetch(`/api/categories/${op.data.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(op.data)
              });
              
              if (updateResponse.ok) {
                success = true;
                console.log(`Successfully updated category ${op.data.id} on server`);
              } else {
                console.error(`Failed to update category ${op.data.id} on server: ${updateResponse.statusText}`);
              }
            } else {
              console.log(`Skipping update for local category ${op.data.id} that hasn't been synced yet`);
            }
            break;
            
          case 'delete':
            // For deletes, send DELETE to /categories/:id
            // Skip if it's a local ID that hasn't been synced yet
            if (!op.data.id.startsWith('local_')) {
              const deleteResponse = await fetch(`/api/categories/${op.data.id}`, {
                method: 'DELETE'
              });
              
              if (deleteResponse.ok) {
                success = true;
                console.log(`Successfully deleted category ${op.data.id} from server`);
              } else {
                console.error(`Failed to delete category ${op.data.id} from server: ${deleteResponse.statusText}`);
              }
            } else {
              console.log(`Skipping delete for local category ${op.data.id} that hasn't been synced yet`);
              success = true; // Mark as success since we don't need to sync local items that were never on the server
            }
            break;
        }
        
        // If operation was successful, remove it from pending operations
        if (success) {
          await deletePendingOperation(op.id);
        }
      } catch (error) {
        console.error(`Error processing operation ${op.id}:`, error);
      }
    }
    
    console.log('Category sync completed');
  } catch (error) {
    console.error('Error syncing categories with server:', error);
    throw error;
  }
};

// Import categories from server
export const importCategoriesFromServer = async (): Promise<void> => {
  if (!navigator.onLine) {
    console.log('Cannot import categories: Application is offline');
    return;
  }
  
  console.log('Importing categories from server...');
  
  try {
    // Fetch all categories from the server
    const response = await fetch('/api/categories');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    
    const serverCategories = await response.json();
    console.log(`Fetched ${serverCategories.length} categories from server`);
    
    // Get all local categories
    const localCategories = await getAllItems<Category>(STORES.CATEGORIES);
    
    // Create a map of local categories by ID for quick lookup
    const localCategoryMap = new Map<string, Category>();
    localCategories.forEach(category => {
      // Only include non-local IDs in the map
      if (!category.id.startsWith('local_')) {
        localCategoryMap.set(category.id, category);
      }
    });
    
    // Process each server category
    for (const serverCategory of serverCategories) {
      const localCategory = localCategoryMap.get(serverCategory.id);
      
      if (!localCategory) {
        // Category doesn't exist locally, add it
        await addItem<Category>(STORES.CATEGORIES, serverCategory);
      } else {
        // Category exists locally, update it if the server version is newer
        const serverUpdatedAt = new Date(serverCategory.updatedAt);
        const localUpdatedAt = new Date(localCategory.updatedAt);
        
        if (serverUpdatedAt > localUpdatedAt) {
          await updateItem<Category>(STORES.CATEGORIES, serverCategory);
        }
      }
      
      // Remove from map to track which local categories don't exist on server
      localCategoryMap.delete(serverCategory.id);
    }
    
    // Handle local categories that don't exist on the server
    // (excluding those with local_ IDs which haven't been synced yet)
    for (const [id, category] of localCategoryMap.entries()) {
      if (!id.startsWith('local_')) {
        // Category exists locally but not on server, delete it
        await deleteItem(STORES.CATEGORIES, id);
      }
    }
    
    console.log('Successfully imported categories from server');
  } catch (error) {
    console.error('Error importing categories from server:', error);
    throw error;
  }
};