import React from 'react';
import { useOffline } from '../contexts/OfflineContext';
import './OfflineIndicator.css';

interface OfflineIndicatorProps {
  showSyncButton?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ showSyncButton = true }) => {
  const { 
    isOffline, 
    hasPendingOperations, 
    pendingOperationsCount,
    isSyncing, 
    triggerSync,
    syncError
  } = useOffline();

  if (!isOffline && !hasPendingOperations) {
    return null; // Don't show anything if online and no pending operations
  }

  return (
    <div className={`offline-indicator ${isOffline ? 'offline' : 'online'}`}>
      <div className="offline-status">
        {isOffline ? (
          <>
            <span className="offline-icon">⚠️</span>
            <span className="offline-text">You are offline</span>
          </>
        ) : hasPendingOperations ? (
          <>
            <span className="pending-icon">🔄</span>
            <span className="pending-text">
              {pendingOperationsCount} pending {pendingOperationsCount === 1 ? 'change' : 'changes'}
            </span>
          </>
        ) : null}
      </div>

      {showSyncButton && !isOffline && hasPendingOperations && (
        <button 
          className="sync-button" 
          onClick={() => triggerSync()}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}

      {syncError && (
        <div className="sync-error">
          {syncError.message}
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;