import React, { useState, useEffect, useCallback } from 'react';
import { Product, CartItem } from '../types/product';
import * as productService from '../services/productService.offline';
import * as categoryService from '../services/categoryService.offline';
import * as transactionService from '../services/transactionService.offline';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCashDrawer, simulateOpenCashDrawer } from '../services/cashDrawerService';
import { PasswordModal, DiscountModal, ReceiptModal } from './modals';
import { usePriceFormatter } from '../utils/priceUtils';
import { useSettings } from '../contexts/SettingsContext';
import './POS.css';

const getInitials = (name: string) => {
  return name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
};

const generateBackgroundColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 85%)`;
};

const POS: React.FC = () => {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { generalSettings } = useSettings();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [discount, setDiscount] = useState<{type: 'percentage' | 'fixed', value: number} | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<CartItem[]>([]);
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState<boolean>(false);
  
  // Initialize cash drawer hook
  const { openDrawer, isOpening, error: drawerError, isSupported } = useCashDrawer();
  
  // Use the price formatter
  const { formatPrice } = usePriceFormatter();

  // Prevent navigation back to admin side using browser back button
  useEffect(() => {
    // Function to handle popstate (back/forward button) events
    const handlePopState = (event: PopStateEvent) => {
      // Prevent the default action
      event.preventDefault();
      
      // Show password modal instead of navigating back
      setShowPasswordModal(true);
      
      // Push the current state again to replace the one that was popped
      window.history.pushState(null, '', window.location.pathname);
    };
    
    // Push a new state to the history stack to ensure we have something to prevent going back to
    window.history.pushState(null, '', window.location.pathname);
    
    // Add event listener for the popstate event
    window.addEventListener('popstate', handlePopState);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  // Load products and categories from IndexedDB when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load products
        const fetchedProducts = await productService.getProducts();
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        
        // Load categories
        const fetchedCategories = await categoryService.getCategories();
        const categoryNames = fetchedCategories.map(category => category.name);
        setCategories(categoryNames);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Filter products based on category and search query
  useEffect(() => {
    let result = products;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.barcode.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, products]);

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Update item quantity in cart
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  // Calculate discount amount
  const calculateDiscountAmount = () => {
    if (!discount) return 0;
    
    const subtotal = calculateSubtotal();
    return discount.type === 'percentage'
      ? subtotal * (discount.value / 100)
      : discount.value;
  };
  
  // Calculate final subtotal after discount
  const calculateFinalSubtotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return subtotal - discountAmount;
  };
  
  // Handle applying discount
  const handleApplyDiscount = (discountType: 'percentage' | 'fixed', value: number) => {
    setDiscount({ type: discountType, value });
  };

  // State for payment type
  const [paymentType, setPaymentType] = useState<string>('cash'); // Default to cash

  // Process transaction
  const processTransaction = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Store the current cart items for the receipt
      setCurrentTransaction([...cart]);
      // Show the receipt modal
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed. Please try again.');
      setIsProcessing(false);
    }
  };
  
  // Create transaction record
  const createTransaction = async (items: CartItem[], cashierId: string, paymentMethod: string) => {
    return await transactionService.createTransaction(items, cashierId, paymentMethod, discount);
  };

  // Calculate total items in cart
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  
  // Handle opening the cash drawer
  const handleOpenCashDrawer = async () => {
    try {
      if (isSupported) {
        await openDrawer();
      } else {
        // Use simulation for development or unsupported browsers
        await simulateOpenCashDrawer();
        alert('Cash drawer opened (simulated)');
      }
    } catch (error) {
      console.error('Failed to open cash drawer:', error);
      alert(`Failed to open cash drawer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle confirming payment
  const handleConfirmPayment = async () => {
    try {
      // Use the actual cashier ID from auth context
      const transaction = await transactionService.createTransaction(currentTransaction, userRole || 'cashier-1', paymentType);
      console.log('Transaction completed:', transaction);
      
      // Print receipt if option is selected
      if (shouldPrintReceipt) {
        await printReceipt(transaction);
      }
      
      // Close the receipt modal
      setShowReceiptModal(false);
      // Clear the cart
      clearCart();
      // Reset discount
      setDiscount(null);
      // Reset processing state
      setIsProcessing(false);
      
      // Open cash drawer for cash payments
      if (paymentType === 'cash') {
        await handleOpenCashDrawer();
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      alert('Payment confirmation failed. Please try again.');
      setIsProcessing(false);
    }
  };
  
  // Print receipt function
  const printReceipt = async (transaction?: any) => {
    try {
      // Get latest transaction from sales data if not provided
      const latestTransaction = transaction || mockSales.sort((a, b) => b.timestamp - a.timestamp)[0];
      
      // Check if Web Serial API is supported
      if ('serial' in navigator) {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        
        const encoder = new TextEncoder();
        const writer = port.writable.getWriter();
        
        const receiptContent = formatReceiptForPrinting(latestTransaction);
        
        // Write to the printer
        await writer.write(encoder.encode(receiptContent));
        
        // Close the writer and port
        writer.releaseLock();
        await port.close();
        
        console.log('Receipt printed successfully');
      } else {
        console.log('Web Serial API not supported. Receipt printing simulated.');
      }
    } catch (error) {
      console.error('Failed to print receipt:', error);
    }
  };
  
  // Format receipt for printing
  const formatReceiptForPrinting = (transaction: any) => {
    const currencySymbol = generalSettings.currencySymbol;
    const taxRate = parseFloat(generalSettings.taxRate);
    const storeName = generalSettings.storeName;
    
    let receipt = '\n\n';
    receipt += `      ${storeName}      \n`;
    receipt += '----------------------------\n';
    receipt += `Date: ${new Date().toLocaleString()}\n`;
    receipt += `Receipt #: ${transaction.receiptNumber}\n`;
    receipt += `Transaction ID: ${transaction.id}\n`;
    receipt += '----------------------------\n\n';
    
    // Add items
    currentTransaction.forEach(item => {
      receipt += `${item.name}\n`;
      receipt += `  ${item.quantity} x ${currencySymbol}${item.price.toFixed(2)} = ${currencySymbol}${(item.quantity * item.price).toFixed(2)}\n`;
    });
    
    receipt += '\n----------------------------\n';
    receipt += `Subtotal: ${currencySymbol}${calculateSubtotal().toFixed(2)}\n`;
    
    if (discount) {
      receipt += `Discount: -${currencySymbol}${calculateDiscountAmount().toFixed(2)}\n`;
    }
    
    receipt += `Tax (${taxRate}%): ${currencySymbol}${(calculateFinalSubtotal() * (taxRate/100)).toFixed(2)}\n`;
    receipt += `Total: ${currencySymbol}${(calculateFinalSubtotal() * (1 + taxRate/100)).toFixed(2)}\n`;
    receipt += `Payment Method: ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}\n`;
    receipt += '----------------------------\n';
    receipt += '      Thank You!      \n\n\n';
    
    return receipt;
  };

  return (
    <div className="pos-page">
      {/* POS Header */}
      <div className="pos-header">
        <div className="pos-header-left">
          <div className="logo-container">
            <div className="topbar-logo">K</div>
            <span className="logo-text">{generalSettings.storeName}</span>
          </div>
          <button 
            className="back-to-admin"
            onClick={() => setShowPasswordModal(true)}
          >
            Dashboard
          </button>
        </div>
        
        <div className="pos-header-center">
          <div className="topbar-actions">
            
            <button 
              className="action-btn" 
              onClick={handleOpenCashDrawer}
              title="Open Cash Drawer"
              disabled={isOpening}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
                <line x1="6" y1="14" x2="18" y2="14"/>
              </svg>
              {isOpening && <span className="loading-indicator"></span>}
            </button>
            
            <button className="action-btn"
            onClick={() => printReceipt()}
            disabled={isProcessing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            </button>
            
            <button 
              className="action-btn" 
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
            
            <div className="user-profile">
              <div className="user-avatar" style={{ backgroundColor: generateBackgroundColor(localStorage.getItem('username') || 'User') }}>
                {getInitials(localStorage.getItem('username') || 'User')}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* POS Container */}
      <div className="pos-container">
        <div className="pos-layout">
          {/* Products Section */}
          <div className="products-section">
            <div className="search-filter">
              <div className="search-box">
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="category-filter">
                <button 
                  className={`category-btn ${selectedCategory === 'All' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('All')}
                >
                  All
                </button>
                {categories.map((category, index) => (
                  <button 
                    key={index}
                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="product-card" 
                  onClick={() => addToCart(product)}
                >
                  <div 
                    className="product-img-placeholder"
                    style={{ backgroundColor: generateBackgroundColor(product.name) }}
                  >
                    {!product.image && (
                      <div className="product-initials">
                        {getInitials(product.name)}
                      </div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">{formatPrice(product.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Cart Section */}
          <div className="cart-section">
            <div className="cart-header">
              <h2>Current Order</h2>
              <button className="clear-cart-btn" onClick={clearCart}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Clear All
              </button>
            </div>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.name}</h3>
                      <p className="cart-item-price">{formatPrice(item.price)}</p>
                    </div>
                    <div className="cart-item-quantity">
                      <button 
                        className="quantity-btn" 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button 
                        className="quantity-btn" 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                    </div>
                    <div className="cart-item-total">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <button 
                      className="remove-item-btn" 
                      onClick={() => removeFromCart(item.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Cart Summary */}
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(calculateSubtotal())}</span>
              </div>
              {discount && (
                <div className="summary-row discount">
                  <span>
                    Discount {discount.type === 'percentage' ? `(${discount.value}%)` : '(Fixed)'}
                  </span>
                  <span>-{formatPrice(calculateDiscountAmount())}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Tax ({generalSettings.taxRate}%)</span>
                <span>{formatPrice(calculateFinalSubtotal() * (parseFloat(generalSettings.taxRate)/100))}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(calculateFinalSubtotal() * (1 + parseFloat(generalSettings.taxRate)/100))}</span>
              </div>
              
              <div className="checkout-actions">
                <button 
                  className="checkout-btn" 
                  onClick={processTransaction}
                  disabled={cart.length === 0 || isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Checkout (${getTotalItems()} items)`}
                </button>
                <div className="payment-options">
                  <button 
                    className={`payment-option-btn ${paymentType === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentType('card')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Card
                  </button>
                  <button 
                    className={`payment-option-btn ${paymentType === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentType('cash')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" ry="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <path d="M6 12h.01M18 12h.01"/>
                    </svg>
                    Cash
                  </button>
                  <button 
                    className={`payment-option-btn ${discount ? 'active' : ''}`}
                    onClick={() => setShowDiscountModal(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="5" x2="5" y2="19"></line>
                      <circle cx="6.5" cy="6.5" r="2.5"></circle>
                      <circle cx="17.5" cy="17.5" r="2.5"></circle>
                    </svg>
                    Discount
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Password Modal */}
      <PasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setShowPasswordModal(false);
          navigate('/admin');
        }}
      />
      
      {/* Discount Modal */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onApplyDiscount={handleApplyDiscount}
        subtotal={calculateSubtotal()}
      />
      
      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setIsProcessing(false);
        }}
        onConfirmPayment={handleConfirmPayment}
        items={currentTransaction}
        subtotal={calculateSubtotal()}
        discount={discount}
        discountAmount={calculateDiscountAmount()}
        tax={(calculateFinalSubtotal() * (parseFloat(generalSettings.taxRate)/100))}
        total={(calculateFinalSubtotal() * (1 + parseFloat(generalSettings.taxRate)/100))}
        paymentType={paymentType}
      />
    </div>
  );
};

export default POS;