import React, { useState } from 'react';
import Table from './Table';
import { getFilteredInventory } from '../services/reportService';
import { getTransactions } from '../services/transactionService.offline';
import { usePriceFormatter } from '../utils/priceUtils';

import './Reports.css';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportDetailLevel, setReportDetailLevel] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<Date>(new Date());
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [isReportGenerated, setIsReportGenerated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Use the price formatter utility
  const { formatPrice } = usePriceFormatter();

  // Calculate totals for transaction items
  const totalQty = filteredTransactions.reduce((sum, t) => {
    if (t.items) {
      return sum + t.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
    }
    return sum + (t.quantity || 0);
  }, 0);
  
  const totalPrice = filteredTransactions.reduce((sum, t) => {
    if (t.items) {
      return sum + t.items.reduce((itemSum, item) => itemSum + (item.price || 0), 0);
    }
    return sum + (t.price || 0);
  }, 0);
  
  const totalTotal = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  
  // Calculate summary data from filtered transactions
  const calculateSummaryData = () => {
    if (!filteredTransactions.length) return {
      totalSales: 0,
      totalProfit: 0,
      totalRefunds: 0,
      totalTaxes: 0,
      totalProductTaxes: 0,
      totalDiscounts: 0,
      netRevenue: 0
    };

    return filteredTransactions.reduce((acc, transaction) => {
      // Skip canceled transactions for sales calculations but count them for refunds
      const isCancelled = transaction.status === 'Cancelled';
      
      // Calculate values based on transaction status
      const sales = isCancelled ? 0 : (transaction.total || 0);
      const taxes = isCancelled ? 0 : (transaction.tax || 0);
      const productTaxes = isCancelled ? 0 : (transaction.productTax || 0);
      const discounts = isCancelled ? 0 : (transaction.discountAmount || 0);
      const profit = sales * 0.2; // Assuming 20% profit margin
      
      // Count canceled transactions as refunds
      const refunds = isCancelled ? (transaction.total || 0) : 0;

      return {
        totalSales: acc.totalSales + sales,
        totalProfit: acc.totalProfit + profit,
        totalRefunds: acc.totalRefunds + refunds,
        totalTaxes: acc.totalTaxes + taxes,
        totalProductTaxes: acc.totalProductTaxes + productTaxes,
        totalDiscounts: acc.totalDiscounts + discounts,
        netRevenue: acc.netRevenue + (sales - taxes - productTaxes - discounts)
      };
    }, {
      totalSales: 0,
      totalProfit: 0,
      totalRefunds: 0,
      totalTaxes: 0,
      totalProductTaxes: 0,
      totalDiscounts: 0,
      netRevenue: 0
    });
  };
  
  const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReportType(e.target.value);
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };
  
  const handlePrint = () => {
    window.print();
  };

  const handleGenerateReport = async () => {
    if (!reportType || !reportDetailLevel) {
      window.toast?.warning('Please select both a report type and style');
      return;
    }
    if (!startDate || !endDate) {
      window.toast?.warning('Please select a date range');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    setGeneratedAt(new Date());
    setIsReportGenerated(true);
    setIsLoading(true);
    
    try {
      let data;
      if (reportType === 'inventory') {
        data = await getFilteredInventory(start, end);
      } else {
        // For other report types like sales, use IndexedDB data
        const transactions = await getTransactions();
        data = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.createdAt);
          return transactionDate >= start && transactionDate <= end;
        });
      }
      setFilteredTransactions(data);
    } catch (error) {
      console.error(`Error fetching ${reportType} data:`, error);
      window.toast?.error(`Failed to load ${reportType} data`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="reports-container">
      <div className="reports-header">
        <div>
          <h2 className="section-title">Reports</h2>
          <p className="section-subtitle">Generate and analyze business reports</p>
        </div>
      </div>

      <div className="report-filters">
        <div className="filter-group">
          <label>Report Type</label>
          <select 
            className="filter-select"
            value={reportType}
            onChange={handleReportTypeChange}
          >
            <option value="" disabled>Select Report</option>
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            {/* <option value="profit">Profit & Loss</option> */}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date Range</label>
          <div className="date-range">
            <input 
              type="datetime-local" 
              className="date-input" 
              value={startDate}
              onChange={handleStartDateChange}
            />
            <span style={{color: "#6e6b7b"}}>To</span>
            <input 
              type="datetime-local" 
              className="date-input" 
              value={endDate}
              onChange={handleEndDateChange}
            />
          </div>
        </div>
        
        <div className="filter-group">
          <label>Report Style</label>
          <select
            className="filter-select"
            value={reportDetailLevel}
            onChange={(e) => setReportDetailLevel(e.target.value as 'summary' | 'detailed')}
          >
            <option value="" disabled>Select Style</option>
            <option value="summary">Summary Report</option>
            <option value="detailed">Detailed Report</option>
          </select>
        </div>
        
        <div className="filter-act-btn">
          <label></label>
          <button className="generate-btn" onClick={handleGenerateReport}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          <button 
            className="generate-btn" 
            onClick={() => {
              setReportType('');
              setStartDate('');
              setEndDate('');
              setReportDetailLevel('');
              setIsReportGenerated(false);
              setFilteredTransactions([]);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {reportType && reportDetailLevel && isReportGenerated && (
      <div className="report-content">
        {reportDetailLevel === 'summary' ? (
          <div className="report-summary">
            {reportType === 'sales' ? (
              <div className="sales-summary-card">
                <div className="summary-header">
                  <h2>Krios Retail Solutions</h2>
                  <div className="report-meta">
                    <div>Report Generated</div>
                    <span>{generatedAt.toLocaleString()}</span>
                    <div>Date Range</div>
                    <span>{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="summary-grid">
                  <div className="summary-item">
                    <h3>Total Products Sold</h3>
                    <p className="summary-value">
                      {filteredTransactions.reduce((acc, t) => acc + t.items.reduce((sum, item) => sum + item.quantity, 0), 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Gross Revenue</h3>
                    <p className="summary-value">
                      {formatPrice(calculateSummaryData().totalSales)}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Total Discounts</h3>
                    <p className="summary-value">
                      {formatPrice(calculateSummaryData().totalDiscounts)}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Total Refunds</h3>
                    <p className="summary-value">
                      {formatPrice(calculateSummaryData().totalRefunds)}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>General Taxes</h3>
                    <p className="summary-value">
                      {formatPrice(calculateSummaryData().totalTaxes)}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Product Taxes</h3>
                    <p className="summary-value">
                      {formatPrice(calculateSummaryData().totalProductTaxes)}
                    </p>
                  </div>
                  
                  <div className="summary-item highlight">
                    <h3>Net Revenue</h3>
                    <p className="summary-value">
                      {formatPrice(calculateSummaryData().netRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            ) : reportType === 'inventory' ? (
              <div className="inventory-summary-card">
                <div className="summary-header">
                  <h2>Krios Retail Solutions</h2>
                  <div className="report-meta">
                    <div>Inventory Report Generated</div>
                    <span>{generatedAt.toLocaleString()}</span>
                    <div>Date Range</div>
                    <span>{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="summary-grid">
                  <div className="summary-item">
                    <h3>Total Products</h3>
                    <p className="summary-value">
                      {filteredTransactions.length}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Total Stock Value</h3>
                    <p className="summary-value">
                      {formatPrice(filteredTransactions.reduce((acc, item) => acc + (item.stockValue || 0), 0))}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Total Cost Value</h3>
                    <p className="summary-value">
                      {formatPrice(filteredTransactions.reduce((acc, item) => acc + (item.costValue || 0), 0))}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Low Stock Items</h3>
                    <p className="summary-value">
                      {filteredTransactions.filter(item => item.status === 'Low Stock').length}
                    </p>
                  </div>
                  
                  <div className="summary-item highlight">
                    <h3>Potential Profit</h3>
                    <p className="summary-value">
                      {formatPrice(filteredTransactions.reduce((acc, item) => acc + (item.potentialProfit || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Existing summary cards for other report types */
              <>
                <div className="summary-card">
                  <h3>Total Sales</h3>
                  <p className="summary-value">$24,560</p>
                  <p className="summary-change positive">+8% from previous period</p>
                </div>
                <div className="summary-card">
                  <h3>Total Orders</h3>
                  <p className="summary-value">145</p>
                  <p className="summary-change positive">+12% from previous period</p>
                </div>
                <div className="summary-card">
                  <h3>Average Order Value</h3>
                  <p className="summary-value">$169.38</p>
                  <p className="summary-change negative">-3% from previous period</p>
                </div>
                <div className="summary-card">
                  <h3>Net Profit</h3>
                  <p className="summary-value">$8,596</p>
                  <p className="summary-change positive">+5% from previous period</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="report-detailed-tables">
            <h3 className="table-title">{reportType === 'inventory' ? 'Inventory Details' : 'Transaction Details'}</h3>
            {reportType === 'inventory' ? (
              <Table
                columns={[
                  { header: 'Product', accessor: 'name' },
                  { header: 'Category', accessor: 'category' },
                  { 
                    header: 'Status', 
                    accessor: 'status',
                    cell: (row) => (
                      <span className={row.status === 'Low Stock' ? 'status-low' : 'status-ok'}>
                        {row.status}
                      </span>
                    ),
                    className: 'status-column'
                  },
                  { 
                    header: 'Current Stock', 
                    accessor: 'currentStock',
                    className: 'numeric-column',
                    footer: filteredTransactions.reduce((sum, item) => sum + item.currentStock, 0).toLocaleString()
                  },
                  { 
                    header: 'Min Stock', 
                    accessor: 'minimumStock',
                    className: 'numeric-column'
                  },
                  { 
                    header: 'Stock Value', 
                    accessor: 'stockValue',
                    cell: (row) => formatPrice(row.stockValue),
                    className: 'numeric-column',
                    footer: formatPrice(filteredTransactions.reduce((sum, item) => sum + (item.stockValue || 0), 0))
                  },
                  { 
                    header: 'Cost Value', 
                    accessor: 'costValue',
                    cell: (row) => formatPrice(row.costValue),
                    className: 'numeric-column',
                    footer: formatPrice(filteredTransactions.reduce((sum, item) => sum + (item.costValue || 0), 0))
                  },
                  { 
                    header: 'Potential Profit', 
                    accessor: 'potentialProfit',
                    cell: (row) => formatPrice(row.potentialProfit),
                    className: 'numeric-column',
                    footer: formatPrice(filteredTransactions.reduce((sum, item) => sum + (item.potentialProfit || 0), 0))
                  }
                ]}
                data={filteredTransactions}
                tableClassName="report-table"
                emptyMessage="No inventory data found in selected date range"
              />
            ) : (
              <Table
                columns={[
                  { 
                    header: 'Receipt #', 
                    accessor: (row) => row.receiptNumber || `ID-${row.id.substring(0, 6)}`,
                    cell: (row) => row.receiptNumber || `ID-${row.id.substring(0, 6)}`
                  },
                  { 
                    header: 'Date', 
                    accessor: 'createdAt',
                    cell: (row) => new Date(row.createdAt).toLocaleString()
                  },
                  {
                    header: 'Items',
                    accessor: (row) => row.items ? row.items.length : 0,
                    cell: (row) => row.items ? row.items.length : 0
                  },
                  {
                    header: 'Status',
                    accessor: (row) => row.status || (row.refunded ? 'Refunded' : 'Completed'),
                    cell: (row) => {
                      const status = row.status || (row.refunded ? 'Refunded' : 'Completed');
                      return (
                        <span className={`status-${status.toLowerCase()}`}>
                          {status}
                        </span>
                      );
                    },
                    className: 'status-column'
                  },
                  { 
                    header: 'Quantity', 
                    accessor: (row) => row.items ? row.items.reduce((sum, item) => sum + item.quantity, 0) : 0,
                    footer: totalQty.toLocaleString(),
                    className: 'numeric-column'
                  },
                  { 
                    header: 'Discount', 
                    accessor: 'discountAmount',
                    cell: (row) => formatPrice(row.discountAmount || 0),
                    footer: formatPrice(filteredTransactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0)),
                    className: 'numeric-column'
                  },
                  { 
                    header: 'General Tax', 
                    accessor: 'tax',
                    cell: (row) => formatPrice(row.tax || 0),
                    footer: formatPrice(filteredTransactions.reduce((sum, t) => sum + (t.tax || 0), 0)),
                    className: 'numeric-column'
                  },
                  { 
                    header: 'Product Tax', 
                    accessor: 'productTax',
                    cell: (row) => formatPrice(row.productTax || 0),
                    footer: formatPrice(filteredTransactions.reduce((sum, t) => sum + (t.productTax || 0), 0)),
                    className: 'numeric-column'
                  },
                  { 
                    header: 'Total', 
                    accessor: 'total',
                    cell: (row) => formatPrice(row.total || 0),
                    footer: formatPrice(totalTotal),
                    className: 'numeric-column'
                  }
                ]}
                data={filteredTransactions}
                tableClassName="report-table"
                emptyMessage="No transactions found in selected date range"
              />
            )}
          </div>
      )
    }
      </div>
    )}
    </div>
  );
};

export default Reports;