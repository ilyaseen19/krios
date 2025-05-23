import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultGeneralSettings, defaultNotificationSettings, GeneralSettings, NotificationSettings } from '../data/mockSettings';
import { getGeneralSettings, getNotificationSettings, saveGeneralSettings, saveNotificationSettings } from '../services/settingsService';

interface SettingsContextType {
  generalSettings: GeneralSettings;
  notificationSettings: NotificationSettings;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(defaultGeneralSettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from IndexedDB on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // Get general settings from IndexedDB
        let storedGeneralSettings = await getGeneralSettings();
        if (!storedGeneralSettings) {
          // If no settings found, save the defaults
          console.log('No general settings found, saving defaults');
          storedGeneralSettings = await saveGeneralSettings(defaultGeneralSettings);
        }
        setGeneralSettings(storedGeneralSettings);
        
        // Get notification settings from IndexedDB
        let storedNotificationSettings = await getNotificationSettings();
        if (!storedNotificationSettings) {
          // If no settings found, save the defaults
          console.log('No notification settings found, saving defaults');
          storedNotificationSettings = await saveNotificationSettings(defaultNotificationSettings);
        }
        setNotificationSettings(storedNotificationSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
        // Set defaults if there's an error
        setGeneralSettings(defaultGeneralSettings);
        setNotificationSettings(defaultNotificationSettings);
        
        // Try to save the defaults to IndexedDB
        try {
          await saveGeneralSettings(defaultGeneralSettings);
          await saveNotificationSettings(defaultNotificationSettings);
        } catch (saveError) {
          console.error('Error saving default settings:', saveError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Update general settings
  const updateGeneralSettings = async (settings: Partial<GeneralSettings>) => {
    try {
      const updatedSettings = { ...generalSettings, ...settings };
      setGeneralSettings(updatedSettings);
      await saveGeneralSettings(updatedSettings);
      window.toast?.success('General settings updated successfully!');
    } catch (error) {
      console.error('Error updating general settings:', error);
      window.toast?.error('Failed to update general settings');
      throw error;
    }
  };

  // Update notification settings
  const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...notificationSettings, ...settings };
      setNotificationSettings(updatedSettings);
      await saveNotificationSettings(updatedSettings);
      window.toast?.success('Notification settings updated successfully!');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      window.toast?.error('Failed to update notification settings');
      throw error;
    }
  };

  const value = {
    generalSettings,
    notificationSettings,
    updateGeneralSettings,
    updateNotificationSettings,
    isLoading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};