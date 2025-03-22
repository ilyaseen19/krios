import React, { useState } from 'react';
import Table from './Table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Reports.css';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<string>('sales');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  
  // Sample data for the sales trend chart
  const salesTrendData = [
    { name: 'Jan', sales: 4000, profit: 2400 },
    { name: 'Feb', sales: 3000, profit: 1398 },
    { name: 'Mar', sales: 2000, profit: 9800 },
    { name: 'Apr', sales: 2780, profit: 3908 },
    { name: 'May', sales: 1890, profit: 4800 },
    { name: 'Jun', sales: 2390, profit: 3800 },
    { name: 'Jul', sales: 3490, profit: 4300 },
  ];
  
  const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReportType(e.target.value);
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };
  
  const handleGenerateReport = () => {
    // Here you would implement the logic to generate the report based on the selected filters
    console.log('Generating report with:', { reportType, startDate, endDate });
  };
  return (
    <div className="reports-container">
      <div className="reports-header">
        <div>
          <h2 className="section-title">Reports</h2>
          <p className="section-subtitle">Generate and analyze business reports</p>
        </div>
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
          <select 
            className="filter-select"
            value={reportType}
            onChange={handleReportTypeChange}
          >
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="customers">Customer Report</option>
            <option value="profit">Profit & Loss</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date Range</label>
          <div className="date-range">
            <input 
              type="date" 
              className="date-input" 
              value={startDate}
              onChange={handleStartDateChange}
            />
            <span>to</span>
            <input 
              type="date" 
              className="date-input" 
              value={endDate}
              onChange={handleEndDateChange}
            />
          </div>
        </div>
        
        <div className="filter-group">
          <label>Time Range</label>
          <div className="time-range-buttons">
            <button 
              onClick={() => setTimeRange('daily')} 
              className={`time-range-btn ${timeRange === 'daily' ? 'active' : ''}`}
            >
              Daily
            </button>
            <button 
              onClick={() => setTimeRange('weekly')} 
              className={`time-range-btn ${timeRange === 'weekly' ? 'active' : ''}`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setTimeRange('monthly')} 
              className={`time-range-btn ${timeRange === 'monthly' ? 'active' : ''}`}
            >
              Monthly
            </button>
          </div>
        </div>
        
        <button className="generate-btn" onClick={handleGenerateReport}>
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
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7367f0" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7367f0" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#28c76f" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#28c76f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#7367f0" fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="profit" stroke="#28c76f" fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
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