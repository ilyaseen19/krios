// Offline Service - Manages switching between online and offline modes

import { initDB, STORES, getPendingOperations, deletePendingOperation } from './dbService';
import { NETWORK_EVENTS } from './networkService';

// Import offline implementations
import * as ProductServiceOffline from './productService.offline';
import * as TransactionServiceOffline from './transactionService.offline';

// Import online implementations (original services)
import * as ProductServiceOnline from './productService';
import * as TransactionServiceOnline from './transactionService';

// Service registry to hold current implementation (online or offline)
interface ServiceRegistry {
  productService: typeof ProductServiceOnline | typeof ProductServiceOffline;
  transactionService: typeof TransactionServiceOnline | typeof TransactionServiceOffline;
  // Add more services as needed
}

// Initialize with online services by default
let currentServices: ServiceRegistry = {
  productService: ProductServiceOnline,
  transactionService: TransactionServiceOnline
};

// Flag to track if we're in offline mode
let isOfflineMode = false;

// Initialize the offline system
export const initOfflineSystem = async (): Promise<void> => {
  try {
    // Initialize the IndexedDB database
    await initDB();
    
    // Set initial mode based on network status
    setOfflineMode(!navigator.onLine);
    
    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for custom sync events
    window.addEventListener(NETWORK_EVENTS.SYNC_COMPLETED, handleSyncCompleted);
    
    console.log('Offline system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline system:', error);
  }
};

// Handle going online
const handleOnline = () => {
  console.log('Network is online, switching to online mode');
  setOfflineMode(false);
};

// Handle going offline
const handleOffline = () => {
  console.log('Network is offline, switching to offline mode');
  setOfflineMode(true);
};

// Handle sync completed
const handleSyncCompleted = () => {
  // If we're online after sync, switch to online mode
  if (navigator.onLine) {
    setOfflineMode(false);
  }
};

// Set offline mode
export const setOfflineMode = (offline: boolean): void => {
  isOfflineMode = offline;
  
  // Switch service implementations based on mode
  currentServices = {
    productService: offline ? ProductServiceOffline : ProductServiceOnline,
    transactionService: offline ? TransactionServiceOffline : TransactionServiceOnline
  };
  
  console.log(`Application is now in ${offline ? 'offline' : 'online'} mode`);
};

// Get current product service implementation
export const getProductService = () => currentServices.productService;

// Get current transaction service implementation
export const getTransactionService = () => currentServices.transactionService;

// Process pending operations when back online
export const processPendingOperations = async (): Promise<void> => {
  if (!navigator.onLine) {
    console.log('Cannot process pending operations while offline');
    return;
  }
  
  try {
    const pendingOps = await getPendingOperations();
    console.log(`Processing ${pendingOps.length} pending operations`);
    
    // Sort operations by timestamp to process in order
    pendingOps.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    for (const op of pendingOps) {
      try {
        await processSingleOperation(op);
        await deletePendingOperation(op.id);
      } catch (error) {
        console.error(`Failed to process operation ${op.id}:`, error);
        // Continue with next operation
      }
    }
    
    console.log('Finished processing pending operations');
  } catch (error) {
    console.error('Error processing pending operations:', error);
    throw error;
  }
};

// Process a single pending operation
const processSingleOperation = async (operation: any): Promise<void> => {
  const { type, entityType, data } = operation;
  
  switch (entityType) {
    case STORES.PRODUCTS:
      await processProductOperation(type, data);
      break;
    case STORES.SALES:
      await processSalesOperation(type, data);
      break;
    // Add more entity types as needed
    default:
      console.warn(`Unknown entity type: ${entityType}`);
  }
};

// Process product operations
const processProductOperation = async (type: string, data: any): Promise<void> => {
  const productService = ProductServiceOnline;
  
  switch (type) {
    case 'add':
      // Remove local_ prefix from ID if present
      const productToAdd = { ...data };
      if (productToAdd.id.startsWith('local_')) {
        delete productToAdd.id; // Let the server generate a new ID
      }
      await productService.createProduct(productToAdd);
      break;
    case 'edit':
      // For edits, we need to check if this is a local ID
      if (!data.id.startsWith('local_')) {
        await productService.updateProduct(data.id, data);
      } else {
        // If it's a local ID, we need to create it instead
        const productToCreate = { ...data };
        delete productToCreate.id;
        await productService.createProduct(productToCreate);
      }
      break;
    case 'delete':
      // Only delete if it's not a local ID
      if (!data.id.startsWith('local_')) {
        await productService.deleteProduct(data.id);
      }
      break;
    default:
      console.warn(`Unknown product operation type: ${type}`);
  }
};

// Process sales operations
const processSalesOperation = async (type: string, data: any): Promise<void> => {
  const transactionService = TransactionServiceOnline;
  
  switch (type) {
    case 'add':
      // Create the transaction on the server
      await transactionService.createTransaction(data.items, data.cashierId, data.paymentType);
      break;
    // Add more operation types as needed
    default:
      console.warn(`Unknown sales operation type: ${type}`);
  }
};

// Force offline mode (for testing)
export const forceOfflineMode = (offline: boolean): void => {
  setOfflineMode(offline);
};

// Check if we're in offline mode
export const isInOfflineMode = (): boolean => {
  return isOfflineMode;
};