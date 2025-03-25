import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { NETWORK_EVENTS, initNetworkListeners, isOnline, triggerSync, addSyncListener, removeSyncListener } from '../services/networkService';
import { getPendingOperations } from '../services/dbService';

interface OfflineContextType {
  isOffline: boolean;
  hasPendingOperations: boolean;
  pendingOperationsCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: Error | null;
  triggerSync: () => Promise<void>;
}

const defaultContext: OfflineContextType = {
  isOffline: !isOnline(),
  hasPendingOperations: false,
  pendingOperationsCount: 0,
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  triggerSync: async () => {}
};

const OfflineContext = createContext<OfflineContextType>(defaultContext);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [hasPendingOperations, setHasPendingOperations] = useState(false);
  const [pendingOperationsCount, setPendingOperationsCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<Error | null>(null);

  // Initialize network listeners
  useEffect(() => {
    initNetworkListeners();

    // Set up event listeners for online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      checkPendingOperations();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleSyncStarted = () => {
      setIsSyncing(true);
      setSyncError(null);
    };

    const handleSyncCompleted = () => {
      setIsSyncing(false);
      setLastSyncTime(new Date());
      checkPendingOperations();
    };

    const handleSyncFailed = (event: Event) => {
      setIsSyncing(false);
      const customEvent = event as CustomEvent;
      setSyncError(customEvent.detail?.error || new Error('Sync failed'));
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    addSyncListener(NETWORK_EVENTS.SYNC_STARTED, handleSyncStarted);
    addSyncListener(NETWORK_EVENTS.SYNC_COMPLETED, handleSyncCompleted);
    addSyncListener(NETWORK_EVENTS.SYNC_FAILED, handleSyncFailed);

    // Check for pending operations on mount
    checkPendingOperations();

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      removeSyncListener(NETWORK_EVENTS.SYNC_STARTED, handleSyncStarted);
      removeSyncListener(NETWORK_EVENTS.SYNC_COMPLETED, handleSyncCompleted);
      removeSyncListener(NETWORK_EVENTS.SYNC_FAILED, handleSyncFailed);
    };
  }, []);

  // Check for pending operations
  const checkPendingOperations = async () => {
    try {
      const pendingOps = await getPendingOperations();
      setHasPendingOperations(pendingOps.length > 0);
      setPendingOperationsCount(pendingOps.length);
    } catch (error) {
      console.error('Error checking pending operations:', error);
    }
  };

  // Trigger sync and update state
  const handleTriggerSync = async () => {
    if (isOffline) {
      setSyncError(new Error('Cannot sync while offline'));
      return;
    }

    try {
      await triggerSync();
    } catch (error) {
      console.error('Error triggering sync:', error);
      setSyncError(error instanceof Error ? error : new Error('Unknown sync error'));
    }
  };

  // Check for pending operations periodically
  useEffect(() => {
    const interval = setInterval(checkPendingOperations, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_REQUIRED') {
        checkPendingOperations();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, []);

  const value = {
    isOffline,
    hasPendingOperations,
    pendingOperationsCount,
    isSyncing,
    lastSyncTime,
    syncError,
    triggerSync: handleTriggerSync
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

// Custom hook to use the offline context
export const useOffline = () => useContext(OfflineContext);