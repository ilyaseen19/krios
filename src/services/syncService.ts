// Sync Service for MongoDB Atlas backup
import { STORES, getAllItems } from './dbService';
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
    const businessName = settings?.businessName || '';
    
    const response = await fetch(`${API_BASE_URL}/sync/status?customerId=${customerId}&businessName=${encodeURIComponent(businessName)}`);
    if (!response.ok) {
      throw new Error('Failed to get sync status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting sync status:', error);
    throw error;
  }
};

// Sync all data
export const syncAllData = async (customerId: string, token: string): Promise<any> => {
  if (!isOnline()) {
    throw new Error('Cannot sync while offline');
  }

  try {
    // Get all data from local stores
    const results: Record<string, any> = {};
    const storeToEndpoint: Record<string, string> = {
      [STORES.PRODUCTS]: 'products',
      [STORES.CATEGORIES]: 'categories',
      [STORES.SALES]: 'transactions',
      [STORES.USERS]: 'users',
      [STORES.SETTINGS]: 'settings'
    };

    // Sync each store type to its corresponding endpoint
    for (const [store, endpoint] of Object.entries(storeToEndpoint)) {
      if (store === STORES.PENDING_OPERATIONS) continue; // Skip pending operations
      
      const items = await getAllItems(store);
      if (items.length === 0) continue; // Skip empty stores
      
      const response = await fetch(`${API_BASE_URL}/sync/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId,
          [endpoint]: items
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync ${endpoint}`);
      }
      
      results[endpoint] = await response.json();
    }

    return results;
  } catch (error) {
    console.error('Error syncing data:', error);
    throw error;
  }
};