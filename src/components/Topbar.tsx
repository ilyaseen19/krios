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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onMobileMenuToggle}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="logo-container">
          <img src="/src/assets/logo.svg" alt="Krios" className="topbar-logo" />
          <span className="logo-text">Krios</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="search-section">
          <button 
            className="search-toggle-btn" 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          {isSearchOpen && (
            <div className="search-dropdown">
              <div className="search-wrapper">
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Search here..." className="search-input" />
              </div>
              <div className="search-recent">
                <h6 className="search-title">Recent Searches</h6>
                <ul className="search-tags">
                  <li><a href="#">Products</a></li>
                  <li><a href="#">Sales</a></li>
                  <li><a href="#">Reports</a></li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="actions-section">
          <div className="notifications-wrapper">
            <button
              className="notification-btn"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.888 17.888 0 0118 8.5 6 6 0 006 8.5c0 1.61.22 3.175.63 4.5m11.37 0l1.34 1.34a1 1 0 01.293.707V16a1 1 0 01-1 1H5.37a1 1 0 01-1-1v-1.453a1 1 0 01.293-.707L6 13a17.89 17.89 0 01.63-4.5m11.37 4.5H6" />
              </svg>
              <span className="notification-badge">3</span>
            </button>

            {isNotificationsOpen && (
              <div className="notifications-dropdown">
                <div className="dropdown-header">
                  <h6>Notifications</h6>
                  <a href="#" className="dropdown-link">Mark all as read</a>
                </div>
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
                <div className="dropdown-footer">
                  <a href="#" className="view-all">View all notifications</a>
                </div>
              </div>
            )}
          </div>

          <div className="profile-wrapper">
            <button 
              className="profile-btn"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <img
                src="https://ui-avatars.com/api/?name=Admin+User&background=ff9f43&color=fff"
                alt="Profile"
                className="profile-img"
              />
            </button>
            
            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header profile-header">
                  <div className="profile-info">
                    <img
                      src="https://ui-avatars.com/api/?name=Admin+User&background=ff9f43&color=fff"
                      alt="Profile"
                      className="profile-img"
                    />
                    <div>
                      <h6>Admin User</h6>
                      <p>Administrator</p>
                    </div>
                  </div>
                </div>
                <div className="dropdown-body">
                  <a href="#" className="dropdown-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>My Profile</span>
                  </a>
                  <a href="#" className="dropdown-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                  </a>
                  <div className="dropdown-divider"></div>
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
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;