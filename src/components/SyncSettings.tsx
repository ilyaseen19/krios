import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getGeneralSettings, saveGeneralSettings } from '../services/settingsService';
import { initializeCustomerDB, getSyncStatus, syncAllData, restoreData, syncData } from '../services/syncService';
import Modal from './Modal';
import { SynchronizeModal } from './modals';
import { BACKUP_INTERVALS, DEFAULT_BACKUP_INTERVAL } from '../constants/backupConstants';
import './Settings.css';

const SyncSettings: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [backupInterval, setBackupInterval] = useState(DEFAULT_BACKUP_INTERVAL);
  const [lastBackupTime, setLastBackupTime] = useState<number>(0);

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
  }, [isAuthenticated]); // Re-check when auth state changes

  // Function to perform backup
  const performBackup = useCallback(async () => {
    if (!customerId || !token || !isAuthenticated) return;
    try {
      await syncAllData(customerId, token);
      const now = Date.now();
      setLastBackupTime(now);
      await saveGeneralSettings({ lastBackupTime: now });
      window.toast?.success('Automatic backup completed successfully');
    } catch (error) {
      // console.error('Automatic backup failed:', error);
      window.toast?.success('Automatic backup failed:', error);
    }
  }, [customerId, token, isAuthenticated]);

  // Setup automatic backup interval
  useEffect(() => {
    if (!backupInterval || !isAuthenticated) return;

    const now = Date.now();
    const timeSinceLastBackup = now - lastBackupTime;
    const intervalMs = backupInterval * 60 * 60 * 1000; // Convert hours to milliseconds

    // If it's been longer than the interval since the last backup, perform one now
    if (timeSinceLastBackup >= intervalMs) {
      performBackup();
    }

    // Set up the interval for future backups
    const intervalId = setInterval(performBackup, intervalMs);

    return () => clearInterval(intervalId);
  }, [backupInterval, lastBackupTime, performBackup, isAuthenticated]);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getGeneralSettings();
        if (settings?.storeName) {
          setBusinessName(settings.storeName);
        }
        if (settings?.customerId) {
          setCustomerId(settings.customerId);
          // Get sync status if customerId exists
          await checkSyncStatus(settings.customerId);
        }
        if (settings?.backupInterval) {
          setBackupInterval(settings.backupInterval);
        }
        if (settings?.lastBackupTime) {
          setLastBackupTime(settings.lastBackupTime);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        window.toast?.error('Failed to load settings');
      }
    };

    loadSettings();
  }, []);

  // Check sync status
  const checkSyncStatus = async (id: string) => {
    try {
      setLoading(true);
      const status = await getSyncStatus(id);
      setSyncStatus(status);
      window.toast?.success('Check sync status successfull!');
    } catch (err) {
      console.error('Error checking sync status:', err);
      window.toast?.error('Failed to check sync status');
    } finally {
      setLoading(false);
    }
  };

  // Initialize customer database
  const handleInitialize = async () => {
    if (!businessName.trim()) {
      window.toast?.error('Business name is required');
      return;
    }

    try {
      setLoading(true);

      const result = await initializeCustomerDB();
      // Save the customerId to settings
      await saveGeneralSettings({ customerId: result.customerId });
      setCustomerId(result.customerId);
      window.toast?.success('Database initialized successfully!');
      await checkSyncStatus(result.customerId);
    } catch (err: any) {
      console.error('Error initializing database:', err);
      window.toast?.error(err.message || 'Failed to initialize database');
    } finally {
      setLoading(false);
    }
  };

  // Sync all data
  const handleSync = async () => {
    if (!customerId) {
      window.toast?.error('Customer ID is required');
      return;
    }
    
    if (!token) {
      window.toast?.error('You must be logged in to backup data');
      return;
    }

    try {
      setLoading(true);

      const result = await syncAllData(customerId, token);
      window.toast?.success('Data synchronized successfully! Your data is now backed up and can be accessed from other devices.');
      await checkSyncStatus(customerId);
    } catch (err: any) {
      console.error('Error syncing data:', err);
      window.toast?.error(err.message || 'Failed to sync data. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Restore data from backup
  const handleRestore = () => {
    if (!customerId) {
      window.toast?.error('Customer ID is required');
      return;
    }
    
    if (!token) {
      window.toast?.error('You must be logged in to restore data');
      return;
    }

    // Show the custom confirm dialog instead of using window.confirm
    setShowRestoreConfirm(true);
  };

  // Execute the actual restore operation after confirmation
  const executeRestore = async () => {
    try {
      setLoading(true);
      setShowRestoreConfirm(false); // Close the dialog

      const result = await restoreData(customerId, token);
      window.toast?.success('Data restored successfully! Your local data has been updated with the latest backup.');
      await checkSyncStatus(customerId);
    } catch (err: any) {
      console.error('Error restoring data:', err);
      window.toast?.error(err.message || 'Failed to restore data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Execute restore with custom store name and customerId
  const handleSyncWithCustomValues = async (businessName: string, customerId: string) => {
    if (!token) {
      window.toast?.error('You must be logged in to restore data');
      return;
    }

    try {
      setLoading(true);
      setShowSyncModal(false); // Close the dialog
      
      // Use the provided values for restoration
      const result = await syncData(customerId, businessName, token,);
      window.toast?.success('Data synchronized successfully! Your local data has been updated with the backup.');
      
      // Update the local state with the new values
      setBusinessName(businessName);
      setCustomerId(customerId);
      
      await checkSyncStatus(customerId);
    } catch (err: any) {
      console.error('Error synchronizing data:', err);
      window.toast?.error(err.message || 'Failed to synchronize data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format date with error handling
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      console.warn('Invalid date format:', dateString, error);
      return 'Invalid date';
    }
  };

  return (
    <div className="settings-section">
      <h2>Prynova Cloud Database Sync</h2>
      <p>Configure and manage your data synchronization with Prynova Cloud.</p>
      
      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        title="Confirm Restore"
        size="small"
        actions={
          <>
            <button 
              className="btn secondary-btn" 
              onClick={() => setShowRestoreConfirm(false)}
            >
              Cancel
            </button>
            <button 
              className="btn primary-btn" 
              onClick={executeRestore}
              style={{ backgroundColor: '#ea5455' }}
            >
              Restore
            </button>
          </>
        }
      >
        <p>Are you sure you want to restore data? This will overwrite your current data with the last backup.</p>
      </Modal>

      {/* Synchronize Modal */}
      <SynchronizeModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSynchronize={handleSyncWithCustomValues}
        loading={loading}
      />

      <div className="settings-form">
        <div className="form-group">
          <label htmlFor="businessName">Business Name</label>
          <input
            type="text"
            id="businessName"
            value={businessName}
            // onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter your business name"
            disabled={true}
          />
        </div>

        {!customerId ? (
          <div className="button-group">
            {/* <button 
              className="btn primary-btn" 
              onClick={handleInitialize}
              disabled={loading || !businessName.trim()}
            >
              {loading ? 'Initializing...' : 'Initialize Database'}
            </button> */}
            <button 
              className="btn primary-btn" 
              onClick={() => setShowSyncModal(true)}
              disabled={loading}
              style={{ backgroundColor: '#28c76f', marginLeft: '10px' }}
            >
              Synchronize
            </button>
          </div>
        ) : (
          <div className="sync-info">
            <div className="form-group">
              <label>Customer ID</label>
              <div className="readonly-field">{customerId}</div>
            </div>

            {syncStatus && (
              <div className="sync-status">
                <h3>Sync Status</h3>
                <div className="status-item">
                  <span>Last Sync:</span>
                  <span>{formatDate(syncStatus.lastSyncTimestamp)}</span>
                </div>
                
                {/* Collection status items - only render if collections exists */}
                <div className="status-item">
                  <span>Products:</span>
                  <span>{formatDate(syncStatus.collections?.products)}</span>
                </div>
                <div className="status-item">
                  <span>Transactions:</span>
                  <span>{formatDate(syncStatus.collections?.transactions)}</span>
                </div>
                <div className="status-item">
                  <span>Users:</span>
                  <span>{formatDate(syncStatus.collections?.users)}</span>
                </div>
                <div className="status-item">
                  <span>Categories:</span>
                  <span>{formatDate(syncStatus.collections?.categories)}</span>
                </div>
                <div className="status-item">
                  <span>Settings:</span>
                  <span>{formatDate(syncStatus.collections?.settings)}</span>
                </div>
                
                <div className="status-item">
                  <span>Status:</span>
                  <span className={`sync-status-${syncStatus.status}`}>
                    {syncStatus.status}
                  </span>
                </div>
                {syncStatus.error && (
                  <div className="status-item error">
                    <span>Error:</span>
                    <span>{syncStatus.error}</span>
                  </div>
                )}
              </div>
            )}

            <div className="button-group">
              <button 
                className="save-btn" 
                style={{ backgroundColor: '#ff9f43' }}
                onClick={handleSync}
                disabled={loading}
              >
                {loading ? 'Syncing...' : 'Backup Now'}
              </button>
              <button 
                className="save-btn" 
                style={{ backgroundColor: '#ea5455' }}
                onClick={handleRestore}
                disabled={loading}
              >
                {loading ? 'Restoring...' : 'Restore Data'}
              </button>
              <button 
                className="save-btn" 
                style={{ backgroundColor: '#28c76f' }}
                onClick={() => checkSyncStatus(customerId)}
                disabled={loading}
              >
                Refresh Status
              </button>
              <div className="form-group">
              <select
                id="backupInterval"
                value={backupInterval}
                onChange={async (e) => {
                  const newInterval = Number(e.target.value);
                  setBackupInterval(newInterval);
                  await saveGeneralSettings({ backupInterval: newInterval });
                }}
                className="form-control"
              >
                {BACKUP_INTERVALS.map((interval) => (
                  <option key={interval.value} value={interval.value}>
                    {interval.label}
                  </option>
                ))}
              </select>
              <br />
              <small className="form-text text-muted">
                Select how often you want your data to be automatically backed up.
                {lastBackupTime > 0 && (
                  <div>
                    Last automatic backup: {new Date(lastBackupTime).toLocaleString()}
                  </div>
                )}
              </small>
            </div>
            </div>
            <div className="sync-help">
              <p><strong>Note:</strong></p>
              <ul>
                <li>Backup Now will save your current data to the cloud</li>
                <li>Restore Data will fetch the latest backup from the cloud</li>
                <li>Make sure you have a stable internet connection</li>
                <li>Your data is automatically backed up at the selected interval</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SyncSettings;