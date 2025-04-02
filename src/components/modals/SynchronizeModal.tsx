import React, { useState } from 'react';
import Modal from './Modal';

interface SynchronizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSynchronize: (businessName: string, customerId: string) => Promise<void>;
  loading: boolean;
}

const SynchronizeModal: React.FC<SynchronizeModalProps> = ({
  isOpen,
  onClose,
  onSynchronize,
  loading
}) => {
  const [syncBusinessName, setSyncBusinessName] = useState('');
  const [syncCustomerId, setSyncCustomerId] = useState('');

  const handleSynchronize = async () => {
    if (!syncBusinessName.trim()) {
      window.toast?.error('Business name is required');
      return;
    }

    if (!syncCustomerId.trim()) {
      window.toast?.error('Customer ID is required');
      return;
    }

    await onSynchronize(syncBusinessName, syncCustomerId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Synchronize Data"
      size="small"
      actions={
        <>
          <button 
            className="btn secondary-btn" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="btn primary-btn" 
            onClick={handleSynchronize}
            disabled={loading}
            style={{ backgroundColor: '#28c76f' }}
          >
            {loading ? 'Syncing...' : 'Synchronize'}
          </button>
        </>
      }
    >
      <p>Enter the store name and customer ID to synchronize with an existing database.</p>
      <div className="form-group">
        <label htmlFor="syncBusinessName">Store Name</label>
        <input
          type="text"
          id="syncBusinessName"
          value={syncBusinessName}
          onChange={(e) => setSyncBusinessName(e.target.value)}
          placeholder="Enter store name"
        />
      </div>
      <div className="form-group">
        <label htmlFor="syncCustomerId">Customer ID</label>
        <input
          type="text"
          id="syncCustomerId"
          value={syncCustomerId}
          onChange={(e) => setSyncCustomerId(e.target.value)}
          placeholder="Enter customer ID"
        />
      </div>
    </Modal>
  );
};

export default SynchronizeModal;