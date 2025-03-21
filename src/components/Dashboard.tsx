import React, { useState, useEffect } from 'react';
import { mockStats, mockActivities } from '../data/mockDashboard';
import { mockProducts } from '../data/mockProducts';
import { mockSales } from '../data/mockSales';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  // Prepare data for charts
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  
  // Sales data for different time ranges
  const dailySalesData = [
    { name: 'Mon', sales: 1200, profit: 800 },
    { name: 'Tue', sales: 1400, profit: 950 },
    { name: 'Wed', sales: 1100, profit: 700 },
    { name: 'Thu', sales: 1300, profit: 850 },
    { name: 'Fri', sales: 1600, profit: 1100 },
    { name: 'Sat', sales: 1800, profit: 1300 },
    { name: 'Sun', sales: 1000, profit: 600 },
  ];
  
  const monthlySalesData = [
    { name: 'Jan', sales: 4000, profit: 2400 },
    { name: 'Feb', sales: 3000, profit: 1398 },
    { name: 'Mar', sales: 2000, profit: 9800 },
    { name: 'Apr', sales: 2780, profit: 3908 },
    { name: 'May', sales: 1890, profit: 4800 },
    { name: 'Jun', sales: 2390, profit: 3800 },
    { name: 'Jul', sales: 3490, profit: 4300 },
  ];
  
  const yearlySalesData = [
    { name: '2018', sales: 25000, profit: 15000 },
    { name: '2019', sales: 30000, profit: 18000 },
    { name: '2020', sales: 27000, profit: 16000 },
    { name: '2021', sales: 32000, profit: 19000 },
    { name: '2022', sales: 38000, profit: 23000 },
    { name: '2023', sales: 42000, profit: 26000 },
  ];
  
  // Get the appropriate data based on the selected time range
  const salesData = timeRange === 'daily' ? dailySalesData : 
                   timeRange === 'monthly' ? monthlySalesData : 
                   yearlySalesData;
  
  // Top selling products data
  const topProducts = mockProducts
    .sort((a, b) => b.price * b.stock - a.price * a.stock)
    .slice(0, 5)
    .map(product => ({
      name: product.name,
      value: product.price * product.stock
    }));
  
  // Product category distribution
  const categoryData = mockProducts.reduce((acc, product) => {
    const existingCategory = acc.find(item => item.name === product.category);
    if (existingCategory) {
      existingCategory.value += 1;
    } else {
      acc.push({ name: product.category, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);
  
  // Sales by status
  const salesByStatus = mockSales.reduce((acc, sale) => {
    const existingStatus = acc.find(item => item.name === sale.status);
    if (existingStatus) {
      existingStatus.value += sale.total;
    } else {
      acc.push({ name: sale.status, value: sale.total });
    }
    return acc;
  }, [] as { name: string; value: number }[]);
  
  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Recent sales data
  const recentSalesData = [
    { day: 'Mon', sales: 4000 },
    { day: 'Tue', sales: 3000 },
    { day: 'Wed', sales: 2000 },
    { day: 'Thu', sales: 2780 },
    { day: 'Fri', sales: 1890 },
    { day: 'Sat', sales: 2390 },
    { day: 'Sun', sales: 3490 },
  ];
  
  return (
    <div className="dashboard-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        {mockStats.map((stat, index) => {
          // Determine background color based on the stat type
          let bgColor = '#f8f8f8';
          let textColor = '#5e5873';
          
          if (stat.title.includes('Revenue')) {
            bgColor = '#e5f8ed';
            textColor = '#28c76f';
          } else if (stat.title.includes('Orders')) {
            bgColor = '#e5f0ff';
            textColor = '#7367f0';
          } else if (stat.title.includes('Customers')) {
            bgColor = '#fff5e5';
            textColor = '#ff9f43';
          } else if (stat.title.includes('Products')) {
            bgColor = '#fbe7f8';
            textColor = '#ea5455';
          }
          
          return (
            <div className="stat-card" key={index}>
              <div className="stat-icon" style={{ backgroundColor: bgColor }}>
                <svg className="w-8 h-8" fill="none" stroke={textColor} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className="stat-content">
                <h3 className="stat-title">{stat.title}</h3>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-desc" style={{ color: textColor }}>{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Time Range Selector */}
      <div className="chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="chart-title">Sales & Profit Overview</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setTimeRange('daily')} 
              style={{ 
                padding: '6px 12px', 
                borderRadius: '4px', 
                border: 'none',
                backgroundColor: timeRange === 'daily' ? '#7367f0' : '#f8f8f8',
                color: timeRange === 'daily' ? 'white' : '#6e6b7b',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Daily
            </button>
            <button 
              onClick={() => setTimeRange('monthly')} 
              style={{ 
                padding: '6px 12px', 
                borderRadius: '4px', 
                border: 'none',
                backgroundColor: timeRange === 'monthly' ? '#7367f0' : '#f8f8f8',
                color: timeRange === 'monthly' ? 'white' : '#6e6b7b',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Monthly
            </button>
            <button 
              onClick={() => setTimeRange('yearly')} 
              style={{ 
                padding: '6px 12px', 
                borderRadius: '4px', 
                border: 'none',
                backgroundColor: timeRange === 'yearly' ? '#7367f0' : '#f8f8f8',
                color: timeRange === 'yearly' ? 'white' : '#6e6b7b',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
      
      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Top Selling Products */}
        <div className="chart-card">
          <h3 className="chart-title">Top Selling Products</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Bar dataKey="value" fill="#7367f0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Product Category Distribution */}
        <div className="chart-card">
          <h3 className="chart-title">Product Category Distribution</h3>
          <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="category-legend">
            {categoryData.map((entry, index) => (
              <div key={`legend-${index}`} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Second Row of Charts */}
      <div className="charts-grid">
        {/* Recent Sales */}
        <div className="chart-card">
          <h3 className="chart-title">Recent Sales</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recentSalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="day" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Bar dataKey="sales" fill="#ff9f43" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Sales by Status */}
        <div className="chart-card">
          <h3 className="chart-title">Sales by Status</h3>
          <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;