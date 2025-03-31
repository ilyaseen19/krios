import React, { useState, useEffect } from 'react';
import { defaultGeneralSettings, defaultNotificationSettings, GeneralSettings, NotificationSettings, dateFormats, timeZones } from '../data/mockSettings';
import { useSettings } from '../contexts/SettingsContext';
import SyncSettings from './SyncSettings';
import './Settings.css';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { 
    generalSettings, 
    notificationSettings, 
    updateGeneralSettings, 
    updateNotificationSettings,
    isLoading 
  } = useSettings();

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateGeneralSettings({
      [name]: value
    });
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    updateNotificationSettings({
      [name]: checked
    });
  };

  const handleSaveSettings = () => {
    // Settings are automatically saved when changed
    window.toast?.success('Settings saved successfully!');
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
              
              <div className="settings-form-grid">
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
                
                <div className="form-group full-width">
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
            </div>
            
            <div className="settings-group">
              <h3 className="settings-group-title">Regional Settings</h3>
              
              <div className="settings-form-grid">
                <div className="form-group">
                  <label htmlFor="currencySymbol">Currency Symbol</label>
                  <select
                    id="currencySymbol"
                    name="currencySymbol"
                    value={generalSettings.currencySymbol}
                    onChange={handleGeneralChange}
                    className="settings-select"
                  >
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                    <option value="¥">¥ (JPY/CNY)</option>
                    <option value="₹">₹ (INR)</option>
                    <option value="₽">₽ (RUB)</option>
                    <option value="₩">₩ (KRW)</option>
                    <option value="A$">A$ (AUD)</option>
                    <option value="C$">C$ (CAD)</option>
                    <option value="Fr">Fr (CHF)</option>
                  </select>
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
                    {dateFormats.map(format => (
                      <option key={format} value={format}>{format}</option>
                    ))}
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
                    {timeZones.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="settings-actions">
              <button className="save-btn" onClick={handleSaveSettings}>Save Changes</button>
              <button className="cancel-btn">Cancel</button>
            </div>
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div className="notification-settings">
            <div className="settings-group">
              <h3 className="settings-group-title">Inventory Alerts</h3>
              
              <div className="settings-form-grid checkbox-grid">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="lowStockAlerts"
                    name="lowStockAlerts"
                    checked={notificationSettings.lowStockAlerts}
                    onChange={handleNotificationChange}
                    className="settings-checkbox"
                  />
                  <label htmlFor="lowStockAlerts" className="notification-label">Low Stock Alerts</label>
                </div>
              </div>
            </div>
            
            <div className="settings-group">
              <h3 className="settings-group-title">Report Scheduling</h3>
              
              <div className="settings-form-grid checkbox-grid">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="dailyReports"
                    name="dailyReports"
                    checked={notificationSettings.dailyReports}
                    onChange={handleNotificationChange}
                    className="settings-checkbox"
                  />
                  <label htmlFor="dailyReports" className="notification-label">Daily Reports</label>
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
                  <label htmlFor="weeklyReports" className="notification-label">Weekly Reports</label>
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
                  <label htmlFor="monthlyReports" className="notification-label">Monthly Reports</label>
                </div>
              </div>
            </div>
            
            <div className="settings-actions">
              <button className="save-btn" onClick={handleSaveSettings}>Save Changes</button>
              <button className="cancel-btn">Cancel</button>
            </div>
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="users-settings">
            <div className="settings-group">
              <h3 className="settings-group-title">User Permissions</h3>
              <div className="settings-placeholder">
                <svg className="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p>User and permission settings will be available in a future update.</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'backup' && (
          <div className="backup-settings">
            <SyncSettings />
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;