import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { getProducts } from '../services/productService.offline';
import './Topbar.css';

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMobileMenuToggle }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<{message: string, time: string, isNew?: boolean}[]>([]);
  const { logout } = useAuth();
  const { generalSettings } = useSettings();
  const navigate = useNavigate();
  
  // Check for low stock products when component mounts
  useEffect(() => {
    const checkLowStockProducts = async () => {
      try {
        const products = await getProducts();
        const lowStockProducts = products.filter(product => {
          const minimumStock = (product as any).minimumStock || 10;
          return product.stock < minimumStock && product.stock > 0;
        });
        
        const outOfStockProducts = products.filter(product => product.stock === 0);
        
        // Create notifications for low stock products
        const newNotifications = [
          ...lowStockProducts.map(product => ({
            message: `${product.name} is low on stock!`,
            time: 'Just now',
            isNew: true
          })),
          ...outOfStockProducts.map(product => ({
            message: `${product.name} is out of stock!`,
            time: 'Just now',
            isNew: true
          }))
        ];
        
        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
        }
      } catch (error) {
        console.error('Failed to check low stock products:', error);
      }
    };
    
    checkLowStockProducts();
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onMobileMenuToggle}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="logo-container">
          <img src="/src/assets/logo.svg" alt={generalSettings.storeName} className="topbar-logo" />
          <span className="logo-text">{generalSettings.storeName}</span>
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="notification-btn pos-button"
          onClick={() => navigate('/pos')}
          aria-label="Point of Sale"
          title="Point of Sale"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>

        <div className="actions-section">
          <div className="notifications-wrapper">
            <button
              className="notification-btn"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.888 17.888 0 0118 8.5 6 6 0 006 8.5c0 1.61.22 3.175.63 4.5m11.37 0l1.34 1.34a1 1 0 01.293.707V16a1 1 0 01-1 1H5.37a1 1 0 01-1-1v-1.453a1 1 0 01.293-.707L6 13a17.89 17.89 0 01.63-4.5m11.37 4.5H6" />
              </svg>
              <span className="notification-badge">{notifications.length}</span>
            </button>

            {isNotificationsOpen && (
              <div className="notifications-dropdown">
                <div className="dropdown-header">
                  <h6>Notifications</h6>
                </div>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div key={index} className="notification-item">
                      <div className={`notification-icon ${notification.isNew ? 'new' : ''}`}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="notification-content">
                        <p>{notification.message}</p>
                        <span>{notification.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notification-item">
                    <div className="notification-content">
                      <p>No new notifications</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="profile-wrapper">
            <span 
              className="profile-btn"
            >
              <img
                src="https://ui-avatars.com/api/?name=Admin+User&background=ff9f43&color=fff"
                alt="Profile"
                className="profile-img"
              />
            </span>
          </div>

          <button 
            onClick={async () => {
             await logout();
             navigate('/login');
            }} 
            className="dropdown-item text-red-600"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;