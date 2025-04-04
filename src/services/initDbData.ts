// Initialize database with default data

import { User } from '../types/user';
import { addItem, STORES, getAllItems, getItemById } from './dbService';
import { initializeSubscription } from './subscriptionService';
import { defaultGeneralSettings, defaultNotificationSettings } from '../data/mockSettings';
import { SETTINGS_IDS } from './settingsService';

// Initialize default admin user if no users exist
export const initializeDefaultAdmin = async (): Promise<void> => {
  try {
    // Check if any users exist
    const existingUsers = await getAllItems<User>(STORES.USERS);
    
    // Check if users were intentionally deleted by checking for a special flag
    const usersIntentionallyDeleted = localStorage.getItem('usersIntentionallyDeleted') === 'true';
    
    // Only add default admin if no users exist AND users weren't intentionally deleted
    if (existingUsers.length === 0 && !usersIntentionallyDeleted) {
      const defaultAdmin: User = {
        id: 1,
        name: 'Admin User',
        email: 'admin@krios.com',
        password: 'admin123', // In a real app, this should be hashed
        role: 'admin', // Using lowercase to match what Login.tsx expects
        status: 'Active'
      };
      
      await addItem<User>(STORES.USERS, defaultAdmin);
      console.log('Default admin user created');
    }
    
    // Initialize settings data
    await initializeDefaultSettings();
    
    // Initialize subscription data
    await initializeSubscription();
  } catch (error) {
    console.error('Error initializing default admin:', error);
  }
};

// Initialize default settings if they don't exist
export const initializeDefaultSettings = async (): Promise<void> => {
  try {
    // Check if general settings exist
    const existingGeneralSettings = await getItemById(STORES.SETTINGS, SETTINGS_IDS.GENERAL);
    
    // If no general settings exist, add the defaults
    if (!existingGeneralSettings) {
      const generalSettingsWithId = {
        id: SETTINGS_IDS.GENERAL,
        ...defaultGeneralSettings
      };
      await addItem(STORES.SETTINGS, generalSettingsWithId);
      console.log('Default general settings created');
    }
    
    // Check if notification settings exist
    const existingNotificationSettings = await getItemById(STORES.SETTINGS, SETTINGS_IDS.NOTIFICATION);
    
    // If no notification settings exist, add the defaults
    if (!existingNotificationSettings) {
      const notificationSettingsWithId = {
        id: SETTINGS_IDS.NOTIFICATION,
        ...defaultNotificationSettings
      };
      await addItem(STORES.SETTINGS, notificationSettingsWithId);
      console.log('Default notification settings created');
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
};