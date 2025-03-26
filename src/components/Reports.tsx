import React, { useState } from 'react';
import Table from './Table';
import { getFilteredTransactions, getFilteredInventory } from '../services/reportService';
import { ToastType } from './Toast';

import './Reports.css';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportDetailLevel, setReportDetailLevel] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<Date>(new Date());
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [isReportGenerated, setIsReportGenerated] = useState<boolean>(false);

  const totalQty = filteredTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const totalPrice = filteredTransactions.reduce((sum, t) => sum + (t.price || 0), 0);
  const totalTotal = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  
  // Calculate summary data from filtered transactions
  const calculateSummaryData = () => {
    if (!filteredTransactions.length) return {
      totalSales: 0,
      totalProfit: 0,
      totalRefunds: 0,
      totalTaxes: 0,
      netRevenue: 0
    };

    return filteredTransactions.reduce((acc, transaction) => {
      const sales = transaction.total || 0;
      const taxes = transaction.tax || 0;
      const profit = sales * 0.2; // Assuming 20% profit margin
      const refunds = 0; // Refunds not implemented yet

      return {
        totalSales: acc.totalSales + sales,
        totalProfit: acc.totalProfit + profit,
        totalRefunds: acc.totalRefunds + refunds,
        totalTaxes: acc.totalTaxes + taxes,
        netRevenue: acc.netRevenue + (sales - taxes - refunds)
      };
    }, {
      totalSales: 0,
      totalProfit: 0,
      totalRefunds: 0,
      totalTaxes: 0,
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
    
    try {
      let data;
      if (reportType === 'inventory') {
        data = await getFilteredInventory(start, end);
      } else {
        // For other report types like sales
        data = await getFilteredTransactions(start, end);
      }
      setFilteredTransactions(data);
    } catch (error) {
      console.error(`Error fetching ${reportType} data:`, error);
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
            <option value="profit">Profit & Loss</option>
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
                      ${calculateSummaryData().totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Total Refunds</h3>
                    <p className="summary-value">
                      ${calculateSummaryData().totalRefunds.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Total Taxes</h3>
                    <p className="summary-value">
                      ${calculateSummaryData().totalTaxes.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="summary-item highlight">
                    <h3>Net Revenue</h3>
                    <p className="summary-value">
                      ${calculateSummaryData().netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                      ${filteredTransactions.reduce((acc, item) => acc + (item.stockValue || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Total Cost Value</h3>
                    <p className="summary-value">
                      ${filteredTransactions.reduce((acc, item) => acc + (item.costValue || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                      ${filteredTransactions.reduce((acc, item) => acc + (item.potentialProfit || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                  { header: 'SKU', accessor: 'sku' },
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
                  { header: 'Current Stock', accessor: 'currentStock' },
                  { header: 'Min Stock', accessor: 'minimumStock' },
                  { 
                    header: 'Stock Value', 
                    accessor: 'stockValue',
                    cell: (row) => `$${row.stockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                  },
                  { 
                    header: 'Cost Value', 
                    accessor: 'costValue',
                    cell: (row) => `$${row.costValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                  },
                  { 
                    header: 'Potential Profit', 
                    accessor: 'potentialProfit',
                    cell: (row) => `$${row.potentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                  }
                ]}
                data={filteredTransactions}
                tableClassName="report-table"
                emptyMessage="No inventory data found in selected date range"
              />
            ) : (
              <Table
                columns={[
                  { header: 'ID', accessor: 'id' },
                  { header: 'Product', accessor: 'product' },
                  {
                    header: 'Status',
                    accessor: (row) => row.refunded ? 'Refunded' : 'Complete',
                    className: 'status-column'
                  },
                  { header: 'Quantity', accessor: 'quantity', footer: totalQty.toLocaleString() },
                  { header: 'Price', accessor: 'price', footer: `$${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                  { header: 'Total', accessor: 'total', footer: `$${totalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` }
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