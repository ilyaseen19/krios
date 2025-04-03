// IndexedDB Database Service

import { Category } from "./categoryService.offline";

// Database configuration
const DB_NAME = 'kriosDB';
const DB_VERSION = 2; // Increased version to trigger database upgrade

// Store names
export const STORES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  SALES: 'sales',
  USERS: 'users',
  SETTINGS: 'settings',
  PENDING_OPERATIONS: 'pendingOperations',
  SUBSCRIPTION: 'subscription'
};

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
        productStore.createIndex('name', 'name', { unique: false });
        productStore.createIndex('barcode', 'barcode', { unique: true });
        productStore.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        categoryStore.createIndex('name', 'name', { unique: true });
      }

      if (!db.objectStoreNames.contains(STORES.SALES)) {
        const salesStore = db.createObjectStore(STORES.SALES, { keyPath: 'id' });
        salesStore.createIndex('createdAt', 'createdAt', { unique: false });
        salesStore.createIndex('cashierId', 'cashierId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USERS)) {
        const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
        userStore.createIndex('email', 'email', { unique: true });
        userStore.createIndex('role', 'role', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_OPERATIONS)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_OPERATIONS, { keyPath: 'id', autoIncrement: true });
        pendingStore.createIndex('type', 'type', { unique: false });
        pendingStore.createIndex('entityType', 'entityType', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.SUBSCRIPTION)) {
        db.createObjectStore(STORES.SUBSCRIPTION, { keyPath: 'id' });
      }
    };
  });
};

// Generic function to add an item to a store
export const addItem = <T>(storeName: string, item: T): Promise<T> => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => {
        resolve(item);
      };

      request.onerror = (event) => {
        console.error(`Error adding item to ${storeName}:`, event);
        reject(`Error adding item to ${storeName}`);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    }).catch(reject);
  });
};

// Generic function to get all items from a store
export const getAllItems = <T>(storeName: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error(`Error getting items from ${storeName}:`, event);
        reject(`Error getting items from ${storeName}`);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    }).catch(reject);
  });
};

// Generic function to get an item by ID
export const getItemById = <T>(storeName: string, id: string | number): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        console.error(`Error getting item from ${storeName}:`, event);
        reject(`Error getting item from ${storeName}`);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    }).catch(reject);
  });
};

// Generic function to update an item
export const updateItem = <T>(storeName: string, item: T): Promise<T> => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve(item);
      };

      request.onerror = (event) => {
        console.error(`Error updating item in ${storeName}:`, event);
        reject(`Error updating item in ${storeName}`);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    }).catch(reject);
  });
};

// Generic function to delete an item
export const deleteItem = (storeName: string, id: string | number): Promise<void> => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Error deleting item from ${storeName}:`, event);
        reject(`Error deleting item from ${storeName}`);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    }).catch(reject);
  });
};

// Function to add a pending operation
export const addPendingOperation = (operation: {
  type: 'add' | 'edit' | 'delete';
  entityType: string;
  data: any;
  timestamp: Date;
}): Promise<any> => {
  return addItem(STORES.PENDING_OPERATIONS, operation);
};

// Function to get all pending operations
export const getPendingOperations = (): Promise<any[]> => {
  return getAllItems(STORES.PENDING_OPERATIONS);
};

// Function to delete a pending operation after it's been processed
export const deletePendingOperation = (id: string): Promise<void> => {
  return deleteItem(STORES.PENDING_OPERATIONS, id);
};

// Function to check if the database is available
export const isDatabaseAvailable = (): boolean => {
  return !!window.indexedDB;
};

// Function to clear all data from a store
export const clearStore = (storeName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Error clearing store ${storeName}:`, event);
        reject(`Error clearing store ${storeName}`);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    }).catch(reject);
  });
};