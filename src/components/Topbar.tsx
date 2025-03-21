import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Topbar.css';

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMobileMenuToggle }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="topbar">
      <button className="mobile-menu-btn" onClick={onMobileMenuToggle}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="search-section">
        <div className="search-wrapper">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search here..." className="search-input" />
        </div>
      </div>

      <div className="actions-section">
        <div className="notifications-wrapper">
          <button
            className="notification-btn"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.888 17.888 0 0118 8.5 6 6 0 006 8.5c0 1.61.22 3.175.63 4.5m11.37 0l1.34 1.34a1 1 0 01.293.707V16a1 1 0 01-1 1H5.37a1 1 0 01-1-1v-1.453a1 1 0 01.293-.707L6 13a17.89 17.89 0 01.63-4.5m11.37 4.5H6" />
            </svg>
            <span className="notification-badge">3</span>
          </button>

          {isNotificationsOpen && (
            <div className="notifications-dropdown">
              <div className="notification-item">
                <div className="notification-icon new">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="notification-content">
                  <p>New user registered</p>
                  <span>2 min ago</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="notification-content">
                  <p>Server update completed</p>
                  <span>1 hour ago</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="notification-content">
                  <p>Daily sales report generated</p>
                  <span>3 hours ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-wrapper">
          <div className="profile-container">
            <img
              src="https://ui-avatars.com/api/?name=Admin+User&background=ff9f43&color=fff"
              alt="Profile"
              className="profile-img"
            />
            <span className="profile-name">Admin User</span>
            <button 
              onClick={async () => {
                await logout();
                navigate('/login');
              }} 
              className="logout-btn"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
        </div>
      </div>
  );
};

export default Topbar;