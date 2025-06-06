import React, { useState, useEffect } from 'react';
import { getTransactions } from '../services/transactionService.offline';
import './Sales.css';
import { Modal } from './modals';
import Table from './Table';
import { usePriceFormatter } from '../utils/priceUtils';
import { useSettings } from '../contexts/SettingsContext';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import { updateProduct, getProduct } from '../services/productService.offline';
import { STORES, deleteItem, updateItem } from '../services/dbService';

type SaleStatus = 'Completed' | 'Pending' | 'Cancelled';
const saleStatuses: SaleStatus[] = ['Completed', 'Pending', 'Cancelled'];

interface Sale {
  id: string;
  date: string;
  customer: string;
  total: number;
  status: SaleStatus;
  items?: CartItem[];
  tax?: number;
  productTax?: number;
  receiptNumber?: string;
  paymentType?: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  } | null;
  discountAmount?: number;
}

interface OrderSummary {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const { formatPrice } = usePriceFormatter();
  const { generalSettings } = useSettings();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [printableSale, setPrintableSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load sales data when component mounts
  useEffect(() => {
    const loadSales = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching transactions...');
        const transactions = await getTransactions();
        
        if (!transactions || transactions.length === 0) {
          console.log('No transactions found');
          setSales([]);
          setIsLoading(false);
          return;
        }
        
        console.log(`Successfully loaded ${transactions.length} transactions`);
        
        // Format transactions into sales objects
        const formattedSales: Sale[] = transactions.map(transaction => {
          // Ensure date is properly formatted
          let dateStr;
          try {
            dateStr = transaction.createdAt instanceof Date 
              ? transaction.createdAt.toISOString() 
              : new Date(transaction.createdAt).toISOString();
          } catch (e) {
            console.warn('Invalid date for transaction:', transaction.id);
            dateStr = new Date().toISOString(); // Fallback to current date
          }
          
          return {
            id: transaction.id,
            date: dateStr,
            customer: transaction.cashierId || 'Unknown',
            total: transaction.total || 0,
            tax: transaction.tax,
            productTax: transaction.productTax,
            items: transaction.items,
            receiptNumber: transaction.receiptNumber,
            paymentType: transaction.paymentType || 'cash',
            discount: transaction.discount,
            discountAmount: transaction.discountAmount,
            // Use transaction.status if it exists, otherwise determine from paymentType
            status: transaction.status || (transaction.paymentType === 'cash' ? 'Completed' : 'Pending')
          };
        });
        
        console.log(`Formatted ${formattedSales.length} sales for display`);
        setSales(formattedSales);
      } catch (error) {
        console.error('Error loading sales:', error);
        window.toast?.error('Failed to load sales data');
        setSales([]); // Set empty array on error to avoid undefined state
      } finally {
        setIsLoading(false);
      }
    };
    
    // Call loadSales immediately when component mounts
    loadSales();
  }, []); // Empty dependency array means this runs once on mount
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const ordersPerPage = 8;
  
  // Filter sales based on search term, status, and date range
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         `#${sale.id}`.includes(searchTerm) ||
                         (sale.receiptNumber && sale.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus ? sale.status === selectedStatus : true;
    
    // Date filtering
    let matchesDateRange = true;
    if (startDate && endDate) {
      const saleDate = new Date(sale.date);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDateRange = saleDate >= start && saleDate <= end;
    } else if (startDate) {
      const saleDate = new Date(sale.date);
      const start = new Date(startDate);
      matchesDateRange = saleDate >= start;
    } else if (endDate) {
      const saleDate = new Date(sale.date);
      const end = new Date(endDate);
      matchesDateRange = saleDate <= end;
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Calculate order summary
  const orderSummary: OrderSummary = filteredSales.reduce((summary, sale) => {
    summary.total += 1;
    if (sale.status === 'Completed') summary.completed += 1;
    if (sale.status === 'Pending') summary.pending += 1;
    if (sale.status === 'Cancelled') summary.cancelled += 1;
    return summary;
  }, { total: 0, completed: 0, pending: 0, cancelled: 0 });

  
  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredSales.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredSales.length / ordersPerPage);
  
  // Handle view order details
  const handleViewOrder = async (order: Sale) => {
    try {
      const transactions = await getTransactions();
      const transaction = transactions.find(t => t.id === order.id);
      if (transaction) {
        setSelectedOrder({
          ...order,
          items: transaction.items,
          tax: transaction.tax,
          productTax: transaction.productTax,
          receiptNumber: transaction.receiptNumber,
          paymentType: transaction.paymentType,
          discount: transaction.discount,
          discountAmount: transaction.discountAmount
        });
        setShowOrderDetails(true);
      }
    } catch (error) {
      console.error('Error loading transaction details:', error);
    }
  };
  
  // Handle refund order
  const handleRefundOrder = async (order: Sale) => {
    try {
      const transactions = await getTransactions();
      const transaction = transactions.find(t => t.id === order.id);
      
      if (transaction && transaction.items) {
        // Return products to inventory
        for (const item of transaction.items) {
          try {
            const product = await getProduct(item.id);
            if (product) {
              // Update product stock by adding back the quantity
              await updateProduct(item.id, {
                stock: product.stock + item.quantity
              });
            }
          } catch (error) {
            console.error(`Error updating product ${item.id}:`, error);
          }
        }
        
        // Update transaction status to 'Cancelled' in the database
        const updatedTransaction = {
          ...transaction,
          status: 'Cancelled'
        };
        await updateItem(STORES.SALES, updatedTransaction);
        
        // Update local state
        const updatedSales = sales.map(s => {
          if (s.id === order.id) {
            return { ...s, status: 'Cancelled' as SaleStatus };
          }
          return s;
        });
        
        setSales(updatedSales);
        
        // Show success message with toast instead of alert
        window.toast?.success('Order refunded successfully');
      }
    } catch (error) {
      console.error('Error refunding order:', error);
      window.toast?.error('Error refunding order');
    }
  };
  
  // Handle delete order
  const handleDeleteOrder = (order: Sale) => {
    setSaleToDelete(order);
    setShowDeleteModal(true);
  };
  
  // Confirm delete order
  const confirmDeleteOrder = async () => {
    if (saleToDelete) {
      try {
        // Delete transaction from IndexedDB
        await deleteItem(STORES.SALES, saleToDelete.id);
        
        // Update state to remove the deleted sale
        setSales(sales.filter(s => s.id !== saleToDelete.id));
        
        // Close modal
        setShowDeleteModal(false);
        setSaleToDelete(null);
        
        // Show success message with toast instead of alert
        window.toast?.success('Order deleted successfully');
      } catch (error) {
        console.error('Error deleting order:', error);
        window.toast?.error('Error deleting order');
      }
    }
  };
  
  // Handle print receipt
  const handlePrintReceipt = async (order: Sale) => {
    try {
      const transactions = await getTransactions();
      const transaction = transactions.find(t => t.id === order.id);
      
      if (transaction) {
        setPrintableSale({
          ...order,
          items: transaction.items,
          tax: transaction.tax,
          receiptNumber: transaction.receiptNumber
        });
        
        // Use setTimeout to ensure the state is updated before printing
        setTimeout(() => {
          window.print();
          setPrintableSale(null);
        }, 100);
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
    }
  };
  
  // Get customer initials for avatar
  const getCustomerInitials = (name: string) => {
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h2 className="section-title">Sales</h2>
        
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="search-box">
          <div className="search-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            className="search-input"
            type="text"
            placeholder="Search by customer, receipt number or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {saleStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <input
            type="date"
            className="date-input" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
          />
          <input
            type="date"
            className="date-input" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
          />
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading sales data...</p>
        </div>
      ) : (
        <>
        {/* Order Summary Cards */}
        <div className="order-summary-row">
        <div className="order-summary-card">
          <div className="order-icon purple">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="order-content">
            <h3 className="order-value">{orderSummary.total}</h3>
            <p className="order-label">Total Orders</p>
          </div>
        </div>
        
        <div className="order-summary-card">
          <div className="order-icon green">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="order-content">
            <h3 className="order-value">{orderSummary.completed}</h3>
            <p className="order-label">Completed Orders</p>
          </div>
        </div>
        
        <div className="order-summary-card">
          <div className="order-icon orange">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="order-content">
            <h3 className="order-value">{orderSummary.pending}</h3>
            <p className="order-label">Pending Orders</p>
          </div>
        </div>
        
        <div className="order-summary-card">
          <div className="order-icon red">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="order-content">
            <h3 className="order-value">{orderSummary.cancelled}</h3>
            <p className="order-label">Cancelled Orders</p>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="orders-grid">
          {currentOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <span className="order-number">Receipt #{order.receiptNumber || `ID-${order.id.substring(0, 6)}`}</span>
                <span className="order-date">{formatDate(order.date)}</span>
              </div>
              <div className="order-card-body">
                
                <div className="order-details">
                  <div className="order-detail-item">
                    <span className="detail-label">Amount</span>
                    <span className="detail-value">{formatPrice(order.total)}</span>
                  </div>
                  <div className="order-detail-item">
                    <span className="detail-label">Payment</span>
                    <span className="detail-value">{order.paymentType ? order.paymentType.charAt(0).toUpperCase() + order.paymentType.slice(1) : 'Cash'}</span>
                  </div>
                </div>
                
                <span className={`order-status status-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
                
                <div className="order-actions">
                  <button className="action-btn view" onClick={() => handleViewOrder(order)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button className="action-btn print" onClick={() => handlePrintReceipt(order)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                  <button className="action-btn delete" onClick={() => handleDeleteOrder(order)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button className="action-btn refund" onClick={() => handleRefundOrder(order)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Table
          columns={[
            {
              header: 'Receipt #',
              accessor: (order) => `#${order.receiptNumber || `ID-${order.id.substring(0, 6)}`}`
            },
            {
              header: 'Customer',
              accessor: (order) => (
                <div className="customer-cell">
                  <div className="customer-cell-avatar">
                    {getCustomerInitials(order.customer)}
                  </div>
                  <div className="customer-cell-info">
                    <span className="customer-cell-name">{order.customer}</span>
                    <span className="customer-cell-email">{order.customer.toLowerCase().replace(' ', '.') + '@example.com'}</span>
                  </div>
                </div>
              )
            },
            {
              header: 'Date',
              accessor: (order) => formatDate(order.date)
            },
            {
              header: 'Amount',
              accessor: (order) => formatPrice(order.total)
            },
            {
              header: 'Status',
              accessor: (order) => (
                <span className={`status-badge ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              )
            },
            {
              header: 'Actions',
              accessor: (order) => (
                <div className="actions-cell">
                  <button className="action-btn view" onClick={() => handleViewOrder(order)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button className="action-btn print" onClick={() => handlePrintReceipt(order)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                  <button className="action-btn delete" onClick={() => handleDeleteOrder(order)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button className="action-btn refund" onClick={() => handleRefundOrder(order)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                  </button>
                </div>
              ),
              className: 'actions-cell'
            }
          ]}
          data={currentOrders}
          className="orders-table-container"
          tableClassName="orders-table"
          emptyMessage="No orders found matching your filters"
        />
      )}

      {/* Pagination */}
      {filteredSales.length > 0 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
            // Show pages around current page
            let pageNum = currentPage;
            if (totalPages <= 5) {
              pageNum = index + 1;
            } else if (currentPage <= 3) {
              pageNum = index + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + index;
            } else {
              pageNum = currentPage - 2 + index;
            }
            
            return (
              <button 
                key={pageNum}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Order Details Modal */}
      <Modal
        isOpen={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        title="Order Details"
      >
        {selectedOrder && (
          <div className="receipt-container">
            <div className="receipt-header">
              <div className="company-name">{generalSettings.storeName}</div>
              <div className="order-number">{`Receipt #${selectedOrder.receiptNumber || `ID-${selectedOrder.id.substring(0, 6)}`}`}</div>
              <div className="order-date">{formatDate(new Date(selectedOrder.date), generalSettings.dateFormat)}</div>
              <div className="cashier-info">
                <div>Cashier: {selectedOrder.customer}</div>
                <div>Time: {new Date(selectedOrder.date).toLocaleTimeString()}</div>
              </div>
            </div>

            <div className="order-details">
              <div className="order-detail-item">
                <span className="detail-label">Status</span>
                <span className={`status-badge ${selectedOrder.status.toLowerCase()}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="order-detail-item">
                <span className="detail-label">Payment Method</span>
                <span className="detail-value">{selectedOrder.paymentType ? selectedOrder.paymentType.charAt(0).toUpperCase() + selectedOrder.paymentType.slice(1) : 'Cash'}</span>
              </div>
            </div>


            <div className="item-list">
              <div className="item-row" style={{ fontWeight: '600', borderBottom: '2px solid #333' }}>
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
              </div>
              {selectedOrder.items && selectedOrder.items.map((item, index) => (
                <div className="item-row" key={index}>
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="summary-row">
              <span className="detail-label">Subtotal</span>
              <span className="detail-value">
                {formatPrice(selectedOrder.total - (selectedOrder.tax || 0) - (selectedOrder.productTax || 0) + (selectedOrder.discountAmount || 0))}
              </span>
            </div>
            
            {selectedOrder.discountAmount > 0 && selectedOrder.discount && (
              <div className="summary-row">
                <span className="detail-label">
                  Discount {selectedOrder.discount.type === 'percentage' ? `(${selectedOrder.discount.value}%)` : ''}
                </span>
                <span className="detail-value" style={{ color: '#28c76f' }}>
                  -{formatPrice(selectedOrder.discountAmount)}
                </span>
              </div>
            )}
            
            {selectedOrder.productTax > 0 && (
              <div className="summary-row">
                <span className="detail-label">Product-specific Tax</span>
                <span className="detail-value">
                  {formatPrice(selectedOrder.productTax)}
                </span>
              </div>
            )}
            
            {selectedOrder.tax > 0 && (
              <div className="summary-row">
                <span className="detail-label">General Tax ({generalSettings.taxRate}%)</span>
                <span className="detail-value">
                  {formatPrice(selectedOrder.tax)}
                </span>
              </div>
            )}

            <div className="summary-row">
              <span className="detail-label">Total Amount</span>
              <span className="detail-value" style={{ color: '#7367f0', fontSize: '1.2rem' }}>
                {formatPrice(selectedOrder.total)}
              </span>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSaleToDelete(null);
        }}
        onConfirm={confirmDeleteOrder}
        itemName={saleToDelete ? `Receipt #${saleToDelete.receiptNumber || saleToDelete.id}` : ''}
        itemType="sale"
      />
      
      {/* Printable Receipt */}
      {printableSale && (
        <div className="printable-receipt" style={{ display: 'none' }}>
          <div className="receipt-container">
            <div className="receipt-header">
              <div className="company-name">{generalSettings.storeName}</div>
              <div className="order-number">{`Receipt #${printableSale.receiptNumber || printableSale.id}`}</div>
              <div className="order-date">{formatDate(new Date(printableSale.date), generalSettings.dateFormat)}</div>
              <div className="cashier-info">
                <div>Cashier: {printableSale.customer}</div>
                <div>Time: {new Date(printableSale.date).toLocaleTimeString()}</div>
              </div>
            </div>

            <div className="item-list">
              <div className="item-row" style={{ fontWeight: '600', borderBottom: '2px solid #333' }}>
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
              </div>
              {printableSale.items && printableSale.items.map((item, index) => (
                <div className="item-row" key={index}>
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="summary-row">
              <span className="detail-label">Subtotal</span>
              <span className="detail-value">
                {formatPrice(printableSale.total - (printableSale.tax || 0) - (printableSale.productTax || 0) + (printableSale.discountAmount || 0))}
              </span>
            </div>
            
            {printableSale.discountAmount > 0 && printableSale.discount && (
              <div className="summary-row">
                <span className="detail-label">
                  Discount {printableSale.discount.type === 'percentage' ? `(${printableSale.discount.value}%)` : ''}
                </span>
                <span className="detail-value" style={{ color: '#28c76f' }}>
                  -{formatPrice(printableSale.discountAmount)}
                </span>
              </div>
            )}
            
            {printableSale.productTax > 0 && (
              <div className="summary-row">
                <span className="detail-label">Product-specific Tax</span>
                <span className="detail-value">
                  {formatPrice(printableSale.productTax)}
                </span>
              </div>
            )}
            
            {printableSale.tax > 0 && (
              <div className="summary-row">
                <span className="detail-label">General Tax ({generalSettings.taxRate}%)</span>
                <span className="detail-value">
                  {formatPrice(printableSale.tax)}
                </span>
              </div>
            )}

            <div className="summary-row">
              <span className="detail-label">Total Amount</span>
              <span className="detail-value" style={{ color: '#7367f0', fontSize: '1.2rem' }}>
                {formatPrice(printableSale.total)}
              </span>
            </div>
            
            <div className="receipt-footer">
              <p>Thank you for your business!</p>
              <p>{generalSettings.storeAddress || 'Store Address'}</p>
              <p>{generalSettings.storePhone || 'Store Phone'}</p>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default Sales;