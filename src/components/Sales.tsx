import React, { useState } from 'react';
import { mockSales, Sale, saleStatuses } from '../data/mockSales';
import './Sales.css';
import Modal from './Modal';

interface OrderSummary {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const ordersPerPage = 8;
  
  // Calculate order summary
  const orderSummary: OrderSummary = sales.reduce((summary, sale) => {
    summary.total += 1;
    if (sale.status === 'Completed') summary.completed += 1;
    if (sale.status === 'Pending') summary.pending += 1;
    if (sale.status === 'Cancelled') summary.cancelled += 1;
    return summary;
  }, { total: 0, completed: 0, pending: 0, cancelled: 0 });
  
  // Filter sales based on search term, status, and date range
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         `#${sale.id}`.includes(searchTerm);
    const matchesStatus = selectedStatus ? sale.status === selectedStatus : true;
    
    // Date filtering
    let matchesDateRange = true;
    if (startDate && endDate) {
      const saleDate = new Date(sale.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
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
  
  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredSales.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredSales.length / ordersPerPage);
  
  // Handle view order details
  const handleViewOrder = (order: Sale) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
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
        <h2 className="section-title">Orders</h2>
        <div className="header-actions">
          <button className="add-sale-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Order
          </button>
        </div>
      </div>

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
                <span className="order-number">#{order.id}</span>
                <span className="order-date">{formatDate(order.date)}</span>
              </div>
              <div className="order-card-body">
                <div className="order-customer">
                  <div className="customer-avatar">
                    {getCustomerInitials(order.customer)}
                  </div>
                  <div className="customer-info">
                    <h4 className="customer-name">{order.customer}</h4>
                    <p className="customer-email">{order.customer.toLowerCase().replace(' ', '.') + '@example.com'}</p>
                  </div>
                </div>
                
                <div className="order-details">
                  <div className="order-detail-item">
                    <span className="detail-label">Amount</span>
                    <span className="detail-value">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="order-detail-item">
                    <span className="detail-label">Payment</span>
                    <span className="detail-value">Credit Card</span>
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
                  <button className="action-btn edit">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button className="action-btn print">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                  <button className="action-btn delete">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-cell-avatar">
                        {getCustomerInitials(order.customer)}
                      </div>
                      <div className="customer-cell-info">
                        <span className="customer-cell-name">{order.customer}</span>
                        <span className="customer-cell-email">{order.customer.toLowerCase().replace(' ', '.') + '@example.com'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{formatDate(order.date)}</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="action-btn view" onClick={() => handleViewOrder(order)}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button className="action-btn edit">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="action-btn print">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                    <button className="action-btn delete">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      <div className="filter-section">
        <div className="search-box">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search orders..."
            className="search-input"
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
            {saleStatuses.map((status, index) => (
              <option key={index} value={status}>{status}</option>
            ))}
          </select>
          
          <div className="date-filter">
            <input 
              type="date" 
              className="date-input" 
              placeholder="From" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>to</span>
            <input 
              type="date" 
              className="date-input" 
              placeholder="To" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
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
      
      {/* Order Details Modal */}
      <Modal
        isOpen={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        title={`Order #${selectedOrder?.id || ''}`}
        size="medium"
        actions={
          <div>
            <button 
              className="action-btn edit" 
              style={{ marginRight: '8px', width: 'auto', padding: '0 16px', height: '36px' }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Order
            </button>
            <button 
              className="action-btn print" 
              style={{ width: 'auto', padding: '0 16px', height: '36px' }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
          </div>
        }
      >
        {selectedOrder && (
          <div className="product-details-content">
            <div className="order-details-info">
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Order Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>Order Date:</p>
                    <p style={{ fontSize: '14px', fontWeight: '500', margin: '0' }}>{formatDate(selectedOrder.date)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>Status:</p>
                    <span className={`status-badge ${selectedOrder.status.toLowerCase()}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>Total Amount:</p>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#7367f0', margin: '0' }}>
                      ${selectedOrder.total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>Payment Method:</p>
                    <p style={{ fontSize: '14px', fontWeight: '500', margin: '0' }}>Credit Card</p>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Customer Information</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div className="customer-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                    {getCustomerInitials(selectedOrder.customer)}
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 4px 0' }}>{selectedOrder.customer}</p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                      {selectedOrder.customer.toLowerCase().replace(' ', '.') + '@example.com'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Order Items</h4>
                <div style={{ backgroundColor: '#f8f8ff', padding: '12px', borderRadius: '8px' }}>
                  <p style={{ textAlign: 'center', margin: '0', color: '#666' }}>Sample order items would be displayed here</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sales;