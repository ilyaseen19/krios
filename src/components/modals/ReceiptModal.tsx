import React, { useState } from 'react';
import Modal from './Modal';
import './ReceiptModal.css';
import { useAuth } from '../../hooks/useAuth';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  items: any[];
  subtotal: number;
  discount: { type: 'percentage' | 'fixed', value: number } | null;
  discountAmount: number;
  tax: number;
  total: number;
  paymentType: string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  onConfirmPayment,
  items,
  subtotal,
  discount,
  discountAmount,
  tax,
  total,
  paymentType
}) => {
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState<boolean>(false);
  const { userRole, isAuthenticated } = useAuth();

  const handleConfirmPayment = () => {
    onConfirmPayment();
    
    // If print option is selected, print the receipt
    if (shouldPrintReceipt) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receipt"
      size="medium"
      actions={
        <div className="modal-buttons">
          <label className="print-option">
            <input
              type="checkbox"
              checked={shouldPrintReceipt}
              onChange={(e) => setShouldPrintReceipt(e.target.checked)}
            />
            Print Receipt
          </label>
          <button 
            className="submit-btn" 
            onClick={handleConfirmPayment}
          >
            Confirm Payment
          </button>
        </div>
      }
    >
      <div className="receipt-modal-content">
        <div className="receipt receipt-container">
          <div className="receipt-header">
            <h3>Krios POS System</h3>
            <p>{new Date().toLocaleString()}</p>
            <p>Cashier: {isAuthenticated ? userRole : 'Guest'}</p>
          </div>
          
          <div className="receipt-items">
            {items.map((item, index) => (
              <div key={index} className="receipt-item">
                <div className="receipt-item-name">{item.name}</div>
                <div className="receipt-item-quantity">x{item.quantity}</div>
                <div className="receipt-item-price">₦{(item.price * item.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>
          
          <div className="receipt-summary">
            <div className="receipt-summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            {discount && (
              <div className="receipt-summary-row discount">
                <span>
                  Discount {discount.type === 'percentage' ? `(${discount.value}%)` : '(Fixed)'}
                </span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="receipt-summary-row">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            
            <div className="receipt-summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            
            <div className="receipt-payment-method">
              <span>Payment Method:</span>
              <span>{paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;