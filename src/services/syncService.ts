// Sync Service for MongoDB Atlas backup
import { STORES, getAllItems, clearStore, updateItem, addItem } from './dbService';
import { getGeneralSettings } from './settingsService';

// API base URL
const API_BASE_URL = 'http://localhost:7001/api';

// Check if we're online
const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Initialize customer database
export const initializeCustomerDB = async (businessName: string): Promise<{ customerId: string }> => {
  if (!isOnline()) {
    throw new Error('Cannot initialize database while offline');
  }

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
    
    const data = await response.json();
    
    // Process each data type from the consolidated response
    for (const [endpoint, store] of Object.entries(endpointToStore)) {
      if (data && Array.isArray(data[endpoint]) && data[endpoint].length > 0) {
        // Clear existing data in the store
        await clearStore(store);
        
        // Add all items from the backup
        for (const item of data[endpoint]) {
          await addItem(store, item);
        }
        
        results[endpoint] = {
          status: 'success',
          count: data[endpoint].length
        };
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