import React, { useState } from 'react';
import Modal from './Modal';
import './DiscountModal.css';
import { usePriceFormatter } from '../utils/priceUtils';
import { useSettings } from '../contexts/SettingsContext';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiscount: (discountType: 'percentage' | 'fixed', value: number) => void;
  subtotal: number;
}

const DiscountModal: React.FC<DiscountModalProps> = ({ 
  isOpen, 
  onClose, 
  onApplyDiscount,
  subtotal
 }) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { formatPrice } = usePriceFormatter();
  const { generalSettings } = useSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const value = parseFloat(discountValue);
    
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid discount value');
      return;
    }
    
    if (discountType === 'percentage' && value > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }
    
    if (discountType === 'fixed' && value > subtotal) {
      setError('Fixed discount cannot exceed the subtotal');
      return;
    }
    
    onApplyDiscount(discountType, value);
    onClose();
    setDiscountValue('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Discount"
      size="small"
      actions={
        <div className="modal-buttons">
          <button 
            className="cancel-btn" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
          >
            Apply Discount
          </button>
        </div>
      }
    >
      <div className="discount-modal-content">
        <p className="modal-description">
          Apply a discount to the current order.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Discount Type</label>
            <div className="discount-type-options">
              <button
                type="button"
                className={`discount-type-btn ${discountType === 'percentage' ? 'active' : ''}`}
                onClick={() => setDiscountType('percentage')}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                className={`discount-type-btn ${discountType === 'fixed' ? 'active' : ''}`}
                onClick={() => setDiscountType('fixed')}
              >
                Fixed Amount ({generalSettings.currencySymbol})
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="discountValue">
              {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
            </label>
            <div className="discount-input-wrapper">
              <input
                type="number"
                id="discountValue"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                min="0"
                max={discountType === 'percentage' ? '100' : undefined}
                step="any"
                autoFocus
              />
              <span className="discount-symbol">
                {discountType === 'percentage' ? '%' : generalSettings.currencySymbol}
              </span>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="discount-preview">
            <p>
              Subtotal: <span>{formatPrice(subtotal)}</span>
            </p>
            {discountValue && !isNaN(parseFloat(discountValue)) && (
              <p>
                Discount: <span>
                  {discountType === 'percentage' 
                    ? `${parseFloat(discountValue).toFixed(2)}% (${formatPrice(subtotal * parseFloat(discountValue) / 100)})` 
                    : formatPrice(parseFloat(discountValue))}
                </span>
              </p>
            )}
            {discountValue && !isNaN(parseFloat(discountValue)) && (
              <p className="discount-total">
                New Subtotal: <span>
                  {formatPrice(discountType === 'percentage'
                    ? (subtotal - (subtotal * parseFloat(discountValue) / 100))
                    : (subtotal - parseFloat(discountValue)))}
                </span>
              </p>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default DiscountModal;