// Subscription Service for IndexedDB operations

import { Subscription, DEFAULT_SUBSCRIPTION_ID } from '../types/subscription';
import { STORES, addItem, getItemById, updateItem } from './dbService';
import { isOnline } from './networkService';
import { API_BASE_URL } from './envService';
import { getGeneralSettings, saveGeneralSettings } from './settingsService';

// Initialize subscription data if it doesn't exist
export const initializeSubscription = async (): Promise<void> => {
  try {
    // Check if subscription data exists
    const existingSubscription = await getItemById<Subscription>(STORES.SUBSCRIPTION, DEFAULT_SUBSCRIPTION_ID);
    
    // If no subscription data exists, create it with undefined values
    if (!existingSubscription) {
      const defaultSubscription: Subscription = {
        id: DEFAULT_SUBSCRIPTION_ID,
        paymentId: undefined,
        paymentDate: undefined
      };
      
      await addItem<Subscription>(STORES.SUBSCRIPTION, defaultSubscription);
      console.log('Default subscription data created');
    }
  } catch (error) {
    console.error('Error initializing subscription data:', error);
  }
};

// Get subscription data
export const getSubscription = async (): Promise<Subscription | null> => {
  try {
    return await getItemById<Subscription>(STORES.SUBSCRIPTION, DEFAULT_SUBSCRIPTION_ID);
  } catch (error) {
    console.error('Error getting subscription data:', error);
    return null;
  }
};

// Update subscription data
export const updateSubscription = async (paymentId: string): Promise<Subscription | null> => {
  try {
    // If online, validate with backend first
    if (isOnline()) {
      const isValid = await validateOnlineSubscription(paymentId);
      if (isValid) {
        // The subscription data has already been updated in validateOnlineSubscription
        return await getSubscription();
      }
      // If online validation fails, don't update local data
      return null;
    }
    
    // Offline update logic
    const existingSubscription = await getItemById<Subscription>(STORES.SUBSCRIPTION, DEFAULT_SUBSCRIPTION_ID);
    
    // If no subscription data exists, create a new one instead of throwing an error
    if (!existingSubscription) {
      const newSubscription: Subscription = {
        id: DEFAULT_SUBSCRIPTION_ID,
        paymentId,
        paymentDate: new Date()
      };
      
      await addItem<Subscription>(STORES.SUBSCRIPTION, newSubscription);
      console.log('New subscription data created');
      return newSubscription;
    }
    
    // Update existing subscription
    const updatedSubscription: Subscription = {
      ...existingSubscription,
      paymentId,
      paymentDate: new Date()
    };
    
    await updateItem<Subscription>(STORES.SUBSCRIPTION, updatedSubscription);
    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription data:', error);
    return null;
  }
};

// Validate subscription with the backend server
export const validateOnlineSubscription = async (paymentId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentId }),
    });

    if (!response.ok) {
      console.error('Subscription validation failed:', response.statusText);
      return false;
    }

    const data = await response.json();
    
    if (data.success) {
      // Update local subscription data
      const subscription = await getSubscription();
      const updatedSubscription: Subscription = {
        id: DEFAULT_SUBSCRIPTION_ID,
        paymentId: data.subscription.paymentId,
        paymentDate: new Date()
      };
      
      if (subscription) {
        await updateItem<Subscription>(STORES.SUBSCRIPTION, updatedSubscription);
      } else {
        await addItem<Subscription>(STORES.SUBSCRIPTION, updatedSubscription);
      }
      
      // Update general settings with company name and customer ID
      const generalSettings = await getGeneralSettings();
      if (generalSettings) {
        await saveGeneralSettings({
          ...generalSettings,
          customerId: data.subscription.customerId,
          businessName: data.subscription.companyName
        });
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error validating subscription online:', error);
    return false;
  }
};

// Check subscription validity locally
export const validateOfflineSubscription = async (): Promise<boolean> => {
  try {
    const subscription = await getSubscription();
    
    // If no subscription data or paymentId is undefined, subscription is invalid
    if (!subscription || !subscription.paymentId || !subscription.paymentDate) {
      return false;
    }
    
    // Check if payment date is more than 35 days ago
    const paymentDate = new Date(subscription.paymentDate);
    const currentDate = new Date();
    const daysSincePayment = Math.floor((currentDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSincePayment < 35;
  } catch (error) {
    console.error('Error checking subscription validity offline:', error);
    return false;
  }
};

// Check if subscription is valid
export const isSubscriptionValid = async (): Promise<boolean> => {
  try {
    const subscription = await getSubscription();
    
    // If no subscription data or paymentId is undefined, subscription is invalid
    if (!subscription || !subscription.paymentId) {
      return false;
    }
    
    // If online, validate with backend
    if (isOnline()) {
      return await validateOnlineSubscription(subscription.paymentId);
    }
    
    // If offline, use local validation
    return await validateOfflineSubscription();
  } catch (error) {
    console.error('Error checking subscription validity:', error);
    return false;
  }
};