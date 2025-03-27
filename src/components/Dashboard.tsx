import React, { useState, useEffect, useCallback } from 'react';
import { DashboardStat } from '../data/mockDashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import './Dashboard.css';
import { getTotalRevenue, getTotalOrders, getTotalCategories, getTotalProducts, 
         getSalesData, getTopSellingProducts, getProductCategoryDistribution, 
         getRecentSalesData, getSalesByPaymentType } from '../services/dashboardService';
import { usePriceFormatter } from '../utils/priceUtils';
import LoadingSpinner from './LoadingSpinner';

const Dashboard: React.FC = () => {
  const { formatPrice } = usePriceFormatter();
  // Memoize the formatPrice function to prevent infinite renders
  const memoizedFormatPrice = useCallback((value: number) => {
    return formatPrice(value);
  }, []); // Remove formatPrice from dependencies to prevent infinite loop
  
  // Prepare data for charts
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for dashboard data
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentSalesData, setRecentSalesData] = useState<any[]>([]);
  const [salesByPaymentType, setSalesByPaymentType] = useState<any[]>([]);
  
  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // Get stats data
        const revenue = await getTotalRevenue();
        const orders = await getTotalOrders();
        const categories = await getTotalCategories();
        const products = await getTotalProducts();
        
        // Create stats array
        const dashboardStats: DashboardStat[] = [
          {
            title: 'Total Revenue',
            value: memoizedFormatPrice(revenue),
            change: '+8% from last month',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          },
          {
            title: 'Total Orders',
            value: orders.toString(),
            change: '+12% from last month',
            icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
          },
          {
            title: 'Total Categories',
            value: categories.toString(),
            change: '+2 new categories',
            icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
          },
          {
            title: 'Total Products',
            value: products.toString(),
            change: 'Based on quantity',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
          }
        ];
        
        setStats(dashboardStats);
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        setLoading(false);
      }
    };
    
    loadStats();
  }, []); // Remove formatPrice from dependencies
  
  // Load sales data based on time range
  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setLoading(true);
        const data = await getSalesData(timeRange);
        setSalesData(data);
        setLoading(false);
      } catch (error) {
        console.error(`Error loading ${timeRange} sales data:`, error);
        setLoading(false);
      }
    };
    
    loadSalesData();
  }, [timeRange]);
  
  // Load other chart data
  useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true);
        
        // Get top selling products
        const topSellingProducts = await getTopSellingProducts(5);
        setTopProducts(topSellingProducts);
        
        // Get product category distribution
        const categoryDistribution = await getProductCategoryDistribution();
        setCategoryData(categoryDistribution);
        
        // Get recent sales data
        const recentSales = await getRecentSalesData();
        setRecentSalesData(recentSales);
        
        // Get sales by payment type
        const salesByType = await getSalesByPaymentType();
        setSalesByPaymentType(salesByType);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading chart data:', error);
        setLoading(false);
      }
    };
    
    loadChartData();
  }, []);
  
  return (
    <div className="dashboard-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner />
          </div>
        ) : (
          stats.map((stat, index) => {
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
          })
        )}
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
        
          {loading ? (
            <div className="loading-container">
              <LoadingSpinner />
            </div>
          ) : (
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
          )}
        </div>
      </div>
      
      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Top Selling Products */}
        <div className="chart-card">
          <h3 className="chart-title">Top Selling Products</h3>
          <div className="chart-container">
            {loading ? (
              <div className="loading-container">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7367f0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        {/* Product Category Distribution */}
        <div className="chart-card">
          <h3 className="chart-title">Product Category Distribution</h3>
          <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {loading ? (
              <div className="loading-container">
                <LoadingSpinner />
              </div>
            ) : (
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
            )}
          </div>
          {!loading && categoryData.length > 0 && (
            <div className="category-legend">
              {categoryData.map((entry, index) => (
                <div key={`legend-${index}`} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Second Row of Charts */}
      <div className="charts-grid">
        {/* Recent Sales */}
        <div className="chart-card">
          <h3 className="chart-title">Recent Sales</h3>
          <div className="chart-container">
            {loading ? (
              <div className="loading-container">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={recentSalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#ff9f43" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        {/* Sales by Payment Type */}
        <div className="chart-card">
          <h3 className="chart-title">Sales by Payment Type</h3>
          <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {loading ? (
              <div className="loading-container">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesByPaymentType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {salesByPaymentType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;