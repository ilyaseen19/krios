import React, { useState } from 'react';
import Modal from './Modal';
import './ReceiptModal.css';
import { useAuth } from '../../hooks/useAuth';
import { usePriceFormatter } from '../../utils/priceUtils';

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
  receiptNumber?: string;
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
  paymentType,
  receiptNumber
}) => {
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState<boolean>(false);
  const { userRole, isAuthenticated } = useAuth();
  const { formatPrice } = usePriceFormatter();

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
            <h3>{formatPrice(0).startsWith('$') ? 'Krios POS System' : formatPrice(0).charAt(0) + ' POS System'}</h3>
            <p>{new Date().toLocaleString()}</p>
            <p>Cashier: {isAuthenticated ? userRole : 'Guest'}</p>
            {receiptNumber && <p className="receipt-number">Receipt #: {receiptNumber}</p>}
          </div>
          
          <div className="receipt-items">
            {items.map((item, index) => (
              <div key={index} className="receipt-item">
                <div className="receipt-item-name">{item.name}</div>
                <div className="receipt-item-quantity">x{item.quantity}</div>
                <div className="receipt-item-price">{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
          
          <div className="receipt-summary">
            <div className="receipt-summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            
            {discount && (
              <div className="receipt-summary-row discount">
                <span>
                  Discount {discount.type === 'percentage' ? `(${discount.value}%)` : '(Fixed)'}
                </span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            
            <div className="receipt-summary-row">
              <span>Tax ({formatPrice(0).startsWith('$') ? '10' : formatPrice(0).charAt(0) === '€' ? '20' : '10'}%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            
            <div className="receipt-summary-row total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
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