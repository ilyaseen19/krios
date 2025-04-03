import React, { useState } from 'react';
import Modal from '../Modal';
import { updateSubscription } from '../../services/subscriptionService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onSubscriptionUpdated: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onSubscriptionUpdated }) => {
  const [paymentId, setPaymentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentId(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!paymentId.trim()) {
      setError('Payment ID is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Update subscription in IndexedDB
      await updateSubscription(paymentId);
      
      // Notify parent component
      onSubscriptionUpdated();
      
      // Reset form
      setPaymentId('');
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError('Failed to update subscription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Empty function to prevent closing
      title="Subscription Required"
      size="medium"
      actions={
        <button 
          onClick={handleSubmit} 
          className="save-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Update Subscription'}
        </button>
      }
    >
      <div className="subscription-modal-content">
        <p className="subscription-message">
          Your subscription has expired or is not active. Please enter a valid payment ID to continue using the application.
        </p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="paymentId">Payment ID</label>
          <input
            type="text"
            id="paymentId"
            name="paymentId"
            value={paymentId}
            onChange={handleInputChange}
            placeholder="Enter payment ID"
            disabled={isSubmitting}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SubscriptionModal;