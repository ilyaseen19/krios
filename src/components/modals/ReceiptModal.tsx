import React, { useState } from 'react';
import Modal from './Modal';
import './ReceiptModal.css';
import './PrintableReceipt.css';
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
  productTax: number;
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
  productTax,
  tax,
  total,
  paymentType,
  receiptNumber
}) => {
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState<boolean>(false);
  const { userRole, isAuthenticated } = useAuth();
  const { formatPrice } = usePriceFormatter();

  const handlePrint = () => {
    // Create a dedicated print timeout to ensure the receipt is fully rendered
    setTimeout(() => {
      window.print();
    }, 2000); // Increased timeout to ensure proper rendering
  };

  const handleConfirmPayment = () => {
    onConfirmPayment();
    
    // If print option is selected, print the receipt
    if (shouldPrintReceipt) {
      handlePrint();
    }
  };

  return (
    <>
      {/* Printable receipt - only visible when printing */}
      <div className="printable-receipt">
        <div className="printable-receipt-header">
          <h3>{formatPrice(0).startsWith('$') ? 'Krios POS System' : formatPrice(0).charAt(0) + ' POS System'}</h3>
          <p>{new Date().toLocaleString()}</p>
          <p>Cashier: {isAuthenticated ? userRole : 'Guest'}</p>
          {receiptNumber && <p className="receipt-number">Receipt #: {receiptNumber}</p>}
        </div>
        
        <div className="printable-receipt-items">
          <div className="printable-receipt-column-headers">
            <div className="printable-receipt-column-header-item">Item</div>
            <div className="printable-receipt-column-header-qty">Qty</div>
            <div className="printable-receipt-column-header-price">Price</div>
          </div>
          {items.map((item, index) => (
            <div key={index} className="printable-receipt-item">
              <div className="printable-receipt-item-name">{item.name}</div>
              <div className="printable-receipt-item-quantity">x{item.quantity}</div>
              <div className="printable-receipt-item-price">{formatPrice(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>
        
        <div className="printable-receipt-summary">
          <div className="printable-receipt-summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          {discount && (
            <div className="printable-receipt-summary-row discount">
              <span>
                Discount {discount.type === 'percentage' ? `(${discount.value}%)` : '(Fixed)'}
              </span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          
          {productTax > 0 && (
            <div className="printable-receipt-summary-row">
              <span>Product Tax</span>
              <span>{formatPrice(productTax)}</span>
            </div>
          )}
          
          <div className="printable-receipt-summary-row">
            <span>Tax ({formatPrice(0).startsWith('$') ? '10' : formatPrice(0).charAt(0) === '€' ? '20' : '10'}%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          
          <div className="printable-receipt-summary-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          
          <div className="printable-receipt-payment-method">
            <span>Payment Method:</span>
            <span>{paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}</span>
          </div>
          
          <div className="printable-receipt-footer">
            <p>Thank you for your purchase!</p>
            <p>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

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
              
              {productTax > 0 && (
                <div className="receipt-summary-row">
                  <span>Product Tax</span>
                  <span>{formatPrice(productTax)}</span>
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
    </>
  );
};

export default ReceiptModal;