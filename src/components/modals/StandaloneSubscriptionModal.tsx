import React, { useState, useEffect, useRef } from 'react';
import { updateSubscription } from '../../services/subscriptionService';
import './StandaloneSubscriptionModal.css';

interface StandaloneSubscriptionModalProps {
  isOpen: boolean;
  onSubscriptionUpdated: () => void;
}

const StandaloneSubscriptionModal: React.FC<StandaloneSubscriptionModalProps> = ({
  isOpen,
  onSubscriptionUpdated,
}) => {
  const [paymentId, setPaymentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Handle ESC key press and focus trap
  useEffect(() => {
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (event.shiftKey && document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    // Focus first focusable element when modal opens
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }

    document.addEventListener('keydown', handleTabKey);
    
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="standalone-modal-overlay" aria-modal="true" role="dialog">
      <div 
        className="standalone-modal-content" 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="standalone-modal-header">
          <h3 className="standalone-modal-title">Subscription Required</h3>
        </div>
        <div className="standalone-modal-body">
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
        </div>
        <div className="standalone-modal-actions">
          <button 
            onClick={handleSubmit} 
            className="save-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandaloneSubscriptionModal;