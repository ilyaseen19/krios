// Network Status Service

// Event names for network status changes
export const NETWORK_EVENTS = {
  ONLINE: 'app:online',
  OFFLINE: 'app:offline',
  SYNC_STARTED: 'app:sync:started',
  SYNC_COMPLETED: 'app:sync:completed',
  SYNC_FAILED: 'app:sync:failed'
};

// Check if the browser is currently online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Initialize network status listeners
export const initNetworkListeners = (): void => {
  // Add event listeners for online and offline events
  window.addEventListener('online', () => {
    console.log('Application is online');
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent(NETWORK_EVENTS.ONLINE));
    // Attempt to sync pending operations
    triggerSync();
  });

  window.addEventListener('offline', () => {
    console.log('Application is offline');
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent(NETWORK_EVENTS.OFFLINE));
  });
};

// Trigger data synchronization
export const triggerSync = async (): Promise<void> => {
  if (!isOnline()) {
    console.log('Cannot sync: Application is offline');
    return;
  }

  try {
    // Dispatch sync started event
    window.dispatchEvent(new CustomEvent(NETWORK_EVENTS.SYNC_STARTED));
    
    // Import sync functions dynamically to avoid circular dependencies
    const { syncProducts } = await import('./productService.offline');
    const { syncTransactions } = await import('./transactionService.offline');
    
    // Sync all data types
    await Promise.all([
      syncProducts(),
      syncTransactions()
      // Add more sync functions as needed
    ]);
    
    // Dispatch sync completed event
    window.dispatchEvent(new CustomEvent(NETWORK_EVENTS.SYNC_COMPLETED));
    
    console.log('Data synchronization completed successfully');
  } catch (error) {
    console.error('Data synchronization failed:', error);
    
    // Dispatch sync failed event
    window.dispatchEvent(new CustomEvent(NETWORK_EVENTS.SYNC_FAILED, {
      detail: { error }
    }));
  }
};

// Add a listener for sync events
export const addSyncListener = (event: string, callback: EventListener): void => {
  window.addEventListener(event, callback);
};

// Remove a listener for sync events
export const removeSyncListener = (event: string, callback: EventListener): void => {
  window.removeEventListener(event, callback);
};