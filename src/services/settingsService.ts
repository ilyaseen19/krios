// Settings Service for IndexedDB operations
import { GeneralSettings, NotificationSettings } from '../data/mockSettings';
import { getItemById, updateItem, STORES } from './dbService';

// Settings ID constants
export const SETTINGS_IDS = {
  GENERAL: 'general-settings',
  NOTIFICATION: 'notification-settings'
};

/**
 * Get general settings from IndexedDB
 * @returns Promise with general settings or null if not found
 */
export const getGeneralSettings = async (): Promise<GeneralSettings | null> => {
  try {
    return await getItemById<GeneralSettings>(STORES.SETTINGS, SETTINGS_IDS.GENERAL);
  } catch (error) {
    console.error('Error getting general settings from IndexedDB:', error);
    return null;
  }
};

/**
 * Get notification settings from IndexedDB
 * @returns Promise with notification settings or null if not found
 */
export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  try {
    return await getItemById<NotificationSettings>(STORES.SETTINGS, SETTINGS_IDS.NOTIFICATION);
  } catch (error) {
    console.error('Error getting notification settings from IndexedDB:', error);
    return null;
  }
};

/**
 * Save general settings to IndexedDB
 * @param settings General settings to save
 * @returns Promise with saved settings
 */
export const saveGeneralSettings = async (settings: GeneralSettings): Promise<GeneralSettings> => {
  try {
    const settingsWithId = {
      id: SETTINGS_IDS.GENERAL,
      ...settings
    };
    return await updateItem<GeneralSettings & { id: string }>(STORES.SETTINGS, settingsWithId);
  } catch (error) {
    console.error('Error saving general settings to IndexedDB:', error);
    throw error;
  }
};

/**
 * Save notification settings to IndexedDB
 * @param settings Notification settings to save
 * @returns Promise with saved settings
 */
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<NotificationSettings> => {
  try {
    const settingsWithId = {
      id: SETTINGS_IDS.NOTIFICATION,
      ...settings
    };
    return await updateItem<NotificationSettings & { id: string }>(STORES.SETTINGS, settingsWithId);
  } catch (error) {
    console.error('Error saving notification settings to IndexedDB:', error);
    throw error;
  }
};