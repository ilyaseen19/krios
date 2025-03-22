import React from 'react';
import Table from './Table';

const Reports: React.FC = () => {
  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2 className="section-title">Reports</h2>
        <div className="report-actions">
          <button className="export-btn">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button className="print-btn">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      <div className="report-filters">
        <div className="filter-group">
          <label>Report Type</label>
          <select className="filter-select">
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="customers">Customer Report</option>
            <option value="profit">Profit & Loss</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date Range</label>
          <div className="date-range">
            <input type="date" className="date-input" />
            <span>to</span>
            <input type="date" className="date-input" />
          </div>
        </div>
        
        <button className="generate-btn">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Generate Report
        </button>
      </div>

      <div className="report-content">
        <div className="report-summary">
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
        </div>
        
        <div className="report-chart">
          <h3 className="chart-title">Sales Trend</h3>
          <div className="chart-placeholder">
            <p>Sales trend chart will be displayed here</p>
          </div>
        </div>
        
        <div className="report-table-container">
          <h3 className="table-title">Sales by Product Category</h3>
          <Table
            columns={[
              {
                header: 'Category',
                accessor: 'category'
              },
              {
                header: 'Sales',
                accessor: 'sales'
              },
              {
                header: 'Orders',
                accessor: 'orders'
              },
              {
                header: 'Avg. Price',
                accessor: 'avgPrice'
              },
              {
                header: '% of Total',
                accessor: 'percentage'
              }
            ]}
            data={[
              { category: 'Electronics', sales: '$12,450', orders: 78, avgPrice: '$159.62', percentage: '50.7%' },
              { category: 'Accessories', sales: '$8,320', orders: 45, avgPrice: '$184.89', percentage: '33.9%' },
              { category: 'Clothing', sales: '$3,790', orders: 22, avgPrice: '$172.27', percentage: '15.4%' }
            ]}
            tableClassName="report-table"
            emptyMessage="No data available"
          />
        </div>
      </div>
    </div>
  );
};

export default Reports;