import React, { useState } from 'react';
import { defaultGeneralSettings, defaultNotificationSettings, GeneralSettings, NotificationSettings } from '../data/mockSettings';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(defaultGeneralSettings);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2 className="section-title">Settings</h2>
      </div>
      
      <div className="settings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button 
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users & Permissions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          Backup & Restore
        </button>
      </div>
      
      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="general-settings">
            <div className="settings-group">
              <h3 className="settings-group-title">Store Information</h3>
              
              <div className="form-group">
                <label htmlFor="storeName">Store Name</label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={generalSettings.storeName}
                  onChange={handleGeneralChange}
                  className="settings-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="storeEmail">Store Email</label>
                <input
                  type="email"
                  id="storeEmail"
                  name="storeEmail"
                  value={generalSettings.storeEmail}
                  onChange={handleGeneralChange}
                  className="settings-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="storePhone">Store Phone</label>
                <input
                  type="text"
                  id="storePhone"
                  name="storePhone"
                  value={generalSettings.storePhone}
                  onChange={handleGeneralChange}
                  className="settings-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="storeAddress">Store Address</label>
                <textarea
                  id="storeAddress"
                  name="storeAddress"
                  value={generalSettings.storeAddress}
                  onChange={handleGeneralChange}
                  className="settings-textarea"
                ></textarea>
              </div>
            </div>
            
            <div className="settings-group">
              <h3 className="settings-group-title">Regional Settings</h3>
              
              <div className="form-group">
                <label htmlFor="currencySymbol">Currency Symbol</label>
                <input
                  type="text"
                  id="currencySymbol"
                  name="currencySymbol"
                  value={generalSettings.currencySymbol}
                  onChange={handleGeneralChange}
                  className="settings-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="taxRate">Tax Rate (%)</label>
                <input
                  type="number"
                  id="taxRate"
                  name="taxRate"
                  value={generalSettings.taxRate}
                  onChange={handleGeneralChange}
                  className="settings-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dateFormat">Date Format</label>
                <select
                  id="dateFormat"
                  name="dateFormat"
                  value={generalSettings.dateFormat}
                  onChange={handleGeneralChange}
                  className="settings-select"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="timeZone">Time Zone</label>
                <select
                  id="timeZone"
                  name="timeZone"
                  value={generalSettings.timeZone}
                  onChange={handleGeneralChange}
                  className="settings-select"
                >
                  <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                  <option value="UTC-6 (Central Time)">UTC-6 (Central Time)</option>
                  <option value="UTC-7 (Mountain Time)">UTC-7 (Mountain Time)</option>
                  <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                </select>
              </div>
            </div>
            
            <div className="settings-actions">
              <button className="save-btn">Save Changes</button>
              <button className="cancel-btn">Cancel</button>
            </div>
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div className="notification-settings">
            <div className="settings-group">
              <h3 className="settings-group-title">Notification Preferences</h3>
              
              <div className="form-check">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onChange={handleNotificationChange}
                  className="settings-checkbox"
                />
                <label htmlFor="emailNotifications">Email Notifications</label>
              </div>
              
              <div className="form-check">
                <input
                  type="checkbox"
                  id="smsNotifications"
                  name="smsNotifications"
                  checked={notificationSettings.smsNotifications}
                  onChange={handleNotificationChange}
                  className="settings-checkbox"
                />
                <label htmlFor="smsNotifications">SMS Notifications</label>
              </div>
              
              <div className="form-check">
                <input
                  type="checkbox"
                  id="lowStockAlerts"
                  name="lowStockAlerts"
                  checked={notificationSettings.lowStockAlerts}
                  onChange={handleNotificationChange}
                  className="settings-checkbox"
                />
                <label htmlFor="lowStockAlerts">Low Stock Alerts</label>
              </div>
              
              <div className="form-check">
                <input
                  type="checkbox"
                  id="orderConfirmations"
                  name="orderConfirmations"
                  checked={notificationSettings.orderConfirmations}
                  onChange={handleNotificationChange}
                  className="settings-checkbox"
                />
                <label htmlFor="orderConfirmations">Order Confirmations</label>
              </div>
            </div>
            
            <div className="settings-group">
              <h3 className="settings-group-title">Report Scheduling</h3>
              
              <div className="form-check">
                <input
                  type="checkbox"
                  id="dailyReports"
                  name="dailyReports"
                  checked={notificationSettings.dailyReports}
                  onChange={handleNotificationChange}
                  className="settings-checkbox"
                />
                <label htmlFor="dailyReports">Daily Reports</label>
              </div>
              
              <div className="form-check">
                <input
                  type="checkbox"
                  id="weeklyReports"
                  name="weeklyReports"
                  checked={notificationSettings.weeklyReports}
                  onChange={handleNotificationChange}
                  className="settings-checkbox"
                />
                <label htmlFor="weeklyReports">Weekly Reports</label>
              </div>
              
              <div className="form-check">
                <input
                  type="checkbox"
                  id="monthlyReports"
                  name="monthlyReports"
                  checked={notificationSettings.monthlyReports}
                  onChange={handleNotificationChange}
                  className="settings-checkbox"
                />
                <label htmlFor="monthlyReports">Monthly Reports</label>
              </div>
            </div>
            
            <div className="settings-actions">
              <button className="save-btn">Save Changes</button>
              <button className="cancel-btn">Cancel</button>
            </div>
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="users-settings">
            <p>User and permission settings will be available here.</p>
          </div>
        )}
        
        {activeTab === 'backup' && (
          <div className="backup-settings">
            <p>Backup and restore settings will be available here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;