import React from 'react';
import Modal from './Modal';
import './Modal.css';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'product'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      size="small"
      actions={
        <>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button 
            onClick={onConfirm} 
            className="delete-btn"
          >
            Delete
          </button>
        </>
      }
    >
      <div className="delete-confirmation-content">
        <div className="delete-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ea5455" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>
        <p className="delete-message">
          Are you sure you want to delete <strong>{itemName}</strong>? 
          <br />
          This action cannot be undone.
        </p>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;