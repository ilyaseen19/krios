// Sync Service for MongoDB Atlas backup
import { STORES, getAllItems, clearStore, addItem, getItemById } from './dbService';
import { getGeneralSettings } from './settingsService';
import { API_BASE_URL } from './envService';


// Check if we're online
const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Initialize customer database
export const initializeCustomerDB = async (): Promise<{ customerId: string }> => {
  if (!isOnline()) {
    throw new Error('Cannot initialize database while offline');
  }

  const settings = await getGeneralSettings();
  const businessName = settings?.storeName;

  try {
    const response = await fetch(`${API_BASE_URL}/sync/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ businessName }),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize database');
    }

    return await response.json();
  } catch (error) {
    console.error('Error initializing customer database:', error);
    throw error;
  }
};

// Get sync status
export const getSyncStatus = async (customerId: string): Promise<any> => {
  if (!isOnline()) {
    return {
      status: 'offline',
      lastSyncTimestamp: null,
      collections: {},
    };
  }

  try {
    // Get business name from settings
    const settings = await getGeneralSettings();

    const businessName = settings?.storeName;
    
    try {
      const response = await fetch(`${API_BASE_URL}/sync/status?customerId=${customerId}&businessName=${businessName}`);
      if (!response.ok) {
        console.warn(`API returned status ${response.status} for sync status`);
        // Return a default response instead of throwing an error
        return {
          status: 'unavailable',
          lastSyncTimestamp: null,
          collections: {},
          error: `Server returned ${response.status}: ${response.statusText}`
        };
      }
      return await response.json();
    } catch (fetchError) {
      console.warn('Network error when fetching sync status:', fetchError);
      // Return a default response for network errors
      return {
        status: 'unavailable',
        lastSyncTimestamp: null,
        collections: {},
        error: 'Cannot connect to sync server. Please check your network connection.'
      };
    }
  } catch (error) {
    console.error('Error getting sync status:', error);
    // Return a default response instead of throwing
    return {
      status: 'error',
      lastSyncTimestamp: null,
      collections: {},
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Sync all data
export const syncAllData = async (customerId: string, token: string): Promise<any> => {
  if (!isOnline()) {
    throw new Error('Cannot sync while offline');
  }

  try {
    // Get all data from local stores
    const storeToEndpoint: Record<string, string> = {
      [STORES.PRODUCTS]: 'products',
      [STORES.CATEGORIES]: 'categories',
      [STORES.SALES]: 'transactions',
      [STORES.USERS]: 'users',
      [STORES.SETTINGS]: 'settings'
    };

    // Get business name from settings
    const settings = await getGeneralSettings();
    const businessName = settings?.storeName;

    // Prepare data payload for the all-in-one sync endpoint
    const payload: Record<string, any> = { customerId, businessName }; 
    
    // Collect data from all stores
    for (const [store, endpoint] of Object.entries(storeToEndpoint)) {
      if (store === STORES.PENDING_OPERATIONS) continue; // Skip pending operations
      
      const items = await getAllItems(store);
      
      // Special handling for settings store to preserve general settings
      if (store === STORES.SETTINGS && items.length > 0) {
        // Check if the data has general settings
        const hasGeneralSettings = items.some((item: any) => item.id === 'general-settings');
        
        if (!hasGeneralSettings) {
          // If no general settings in the data, get current general settings
          const currentGeneralSettings = await getItemById(STORES.SETTINGS, 'general-settings');
          
          // If we have general settings, add them to the items array
          if (currentGeneralSettings) {
            items.push(currentGeneralSettings);
          }
        }
      }
      
      if (items.length > 0) {
        payload[endpoint] = items;
      }
    }

    // Use the /sync/all endpoint to sync all data at once
    const response = await fetch(`${API_BASE_URL}/sync/all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to sync all data');
    }
    
    return await response.json();
  
  } catch (error) {
    console.error('Error syncing data:', error);
    throw error;
  }
};

// Restore data from backup
export const restoreData = async (customerId: string, token: string): Promise<any> => {
  if (!isOnline()) {
    throw new Error('Cannot restore data while offline');
  }

  try {
    const results: Record<string, any> = {};
    const endpointToStore: Record<string, string> = {
      'products': STORES.PRODUCTS,
      'categories': STORES.CATEGORIES,
      'transactions': STORES.SALES,
      'users': STORES.USERS,
      'settings': STORES.SETTINGS
    };

    // Get business name from settings
    const settings = await getGeneralSettings();
    const businessName = settings?.storeName;

    // Use the consolidated /sync/restore endpoint to restore all data at once
    const response = await fetch(`${API_BASE_URL}/sync/restore?customerId=${customerId}&businessName=${encodeURIComponent(businessName || '')}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to restore data: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // Extract the data object from the response
    const data = responseData.data;
    
    // Process each data type from the consolidated response
    for (const [endpoint, store] of Object.entries(endpointToStore)) {
      if (data && Array.isArray(data[endpoint]) && data[endpoint].length > 0) {
        try {
          // For settings store, check if we need to preserve general settings
          if (store === STORES.SETTINGS) {
            // Check if the incoming data has general settings
            const hasGeneralSettings = data[endpoint].some((item: any) => item.id === 'general-settings');
            
            if (!hasGeneralSettings) {
              // If no general settings in cloud data, get current general settings before clearing
              const currentGeneralSettings = await getItemById(STORES.SETTINGS, 'general-settings');
              
              // Clear existing data in the store
              await clearStore(store);
              
              // If we had general settings, add them back
              if (currentGeneralSettings) {
                await addItem(store, currentGeneralSettings);
              }
            } else {
              // If cloud data has general settings, clear the store as usual
              await clearStore(store);
            }
          } else {
            // For non-settings stores, clear as usual
            await clearStore(store);
          }
          
          // Improved batch processing with better transaction management
          const BATCH_SIZE = 25; // Smaller batch size for better reliability
          let totalProcessed = 0;
          let failedItems = [];
          
          // Process in batches with improved error handling
          for (let i = 0; i < data[endpoint].length; i += BATCH_SIZE) {
            const batch = data[endpoint].slice(i, i + BATCH_SIZE);
            const batchPromises = [];
            
            // Create a single promise for each item in the batch
            for (const item of batch) {
              // Wrap in a function to handle individual item errors without failing the whole batch
              const itemPromise = (async () => {
                try {
                  await addItem(store, item);
                  totalProcessed++;
                  return { success: true, item };
                } catch (error) {
                  console.error(`Error adding item to ${endpoint}:`, error);
                  failedItems.push(item);
                  return { success: false, item, error };
                }
              })();
              
              batchPromises.push(itemPromise);
            }
            
            // Wait for all items in this batch to be processed
            await Promise.allSettled(batchPromises);
            
            // Add a small delay between batches to prevent overwhelming the database
            if (i + BATCH_SIZE < data[endpoint].length) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          // Retry failed items once more
          if (failedItems.length > 0) {
            console.warn(`Retrying ${failedItems.length} failed items for ${endpoint}`);
            for (const item of failedItems) {
              try {
                await addItem(store, item);
                totalProcessed++;
                // Remove from failed items if successful
                failedItems = failedItems.filter(failedItem => failedItem !== item);
              } catch (error) {
                console.error(`Final retry failed for item in ${endpoint}:`, error);
              }
            }
          }
          
          // Verify data was saved by checking count
          const savedItems = await getAllItems(store);
          if (savedItems.length !== data[endpoint].length) {
            console.warn(`Data persistence issue detected in ${endpoint}: Expected ${data[endpoint].length} items but found ${savedItems.length}`);
          }
          
          results[endpoint] = {
            status: 'success',
            count: savedItems.length,
            expected: data[endpoint].length
          };
        } catch (storeError) {
          console.error(`Error processing ${endpoint}:`, storeError);
          results[endpoint] = {
            status: 'error',
            error: storeError instanceof Error ? storeError.message : 'Unknown error',
            count: 0
          };
        }
      } else {
        results[endpoint] = {
          status: 'empty',
          count: 0
        };
      }
    }

    return results;
  } catch (error) {
    console.error('Error restoring data:', error);
    throw error;
  }
};

// Sync store from backup
export const syncData = async (customerId: string, businessName: string, token: string): Promise<any> => {
  if (!isOnline()) {
    throw new Error('Cannot syncronise data while offline');
  }
 

  try {
    const results: Record<string, any> = {};
    const endpointToStore: Record<string, string> = {
      'products': STORES.PRODUCTS,
      'categories': STORES.CATEGORIES,
      'transactions': STORES.SALES,
      'users': STORES.USERS,
      'settings': STORES.SETTINGS
    };

    // Use the consolidated /sync/restore endpoint to restore all data at once
    const response = await fetch(`${API_BASE_URL}/sync/restore?customerId=${customerId}&businessName=${encodeURIComponent(businessName)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to restore data: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('Data received from server:', responseData);
    
    // Extract the data object from the response
    const data = responseData.data;
    
    // Process each data type from the consolidated response
    for (const [endpoint, store] of Object.entries(endpointToStore)) {
      if (data && Array.isArray(data[endpoint]) && data[endpoint].length > 0) {
        try {
          // For settings store, check if we need to preserve general settings
          if (store === STORES.SETTINGS) {
            // Check if the incoming data has general settings
            const hasGeneralSettings = data[endpoint].some((item: any) => item.id === 'general-settings');
            
            if (!hasGeneralSettings) {
              // If no general settings in cloud data, get current general settings before clearing
              const currentGeneralSettings = await getItemById(STORES.SETTINGS, 'general-settings');
              
              // Clear existing data in the store
              await clearStore(store);
              
              // If we had general settings, add them back
              if (currentGeneralSettings) {
                await addItem(store, currentGeneralSettings);
              }
            } else {
              // If cloud data has general settings, clear the store as usual
              await clearStore(store);
            }
          } else {
            // For non-settings stores, clear as usual
            await clearStore(store);
          }
          
          // Improved batch processing with better transaction management
          const BATCH_SIZE = 25; // Smaller batch size for better reliability
          let totalProcessed = 0;
          let failedItems = [];
          
          // Process in batches with improved error handling
          for (let i = 0; i < data[endpoint].length; i += BATCH_SIZE) {
            const batch = data[endpoint].slice(i, i + BATCH_SIZE);
            const batchPromises = [];
            
            // Create a single promise for each item in the batch
            for (const item of batch) {
              // Wrap in a function to handle individual item errors without failing the whole batch
              const itemPromise = (async () => {
                try {
                  await addItem(store, item);
                  totalProcessed++;
                  return { success: true, item };
                } catch (error) {
                  console.error(`Error adding item to ${endpoint}:`, error);
                  failedItems.push(item);
                  return { success: false, item, error };
                }
              })();
              
              batchPromises.push(itemPromise);
            }
            
            // Wait for all items in this batch to be processed
            await Promise.allSettled(batchPromises);
            
            // Add a small delay between batches to prevent overwhelming the database
            if (i + BATCH_SIZE < data[endpoint].length) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          // Retry failed items once more
          if (failedItems.length > 0) {
            console.warn(`Retrying ${failedItems.length} failed items for ${endpoint}`);
            for (const item of failedItems) {
              try {
                await addItem(store, item);
                totalProcessed++;
                // Remove from failed items if successful
                failedItems = failedItems.filter(failedItem => failedItem !== item);
              } catch (error) {
                console.error(`Final retry failed for item in ${endpoint}:`, error);
              }
            }
          }
          
          // Verify data was saved by checking count
          const savedItems = await getAllItems(store);
          if (savedItems.length !== data[endpoint].length) {
            console.warn(`Data persistence issue detected in ${endpoint}: Expected ${data[endpoint].length} items but found ${savedItems.length}`);
          }
          
          results[endpoint] = {
            status: 'success',
            count: savedItems.length,
            expected: data[endpoint].length
          };
        } catch (storeError) {
          console.error(`Error processing ${endpoint}:`, storeError);
          results[endpoint] = {
            status: 'error',
            error: storeError instanceof Error ? storeError.message : 'Unknown error',
            count: 0
          };
        }
      } else {
        results[endpoint] = {
          status: 'empty',
          count: 0
        };
      }
    }

    return results;
  } catch (error) {
    console.error('Error restoring data:', error);
    throw error;
  }
};