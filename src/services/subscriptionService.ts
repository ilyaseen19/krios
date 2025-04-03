// Subscription Service for IndexedDB operations

import { Subscription, DEFAULT_SUBSCRIPTION_ID } from '../types/subscription';
import { STORES, addItem, getItemById, updateItem } from './dbService';

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
    const existingSubscription = await getItemById<Subscription>(STORES.SUBSCRIPTION, DEFAULT_SUBSCRIPTION_ID);
    
    if (!existingSubscription) {
      throw new Error('Subscription data not found');
    }
    
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

// Check if subscription is valid
export const isSubscriptionValid = async (): Promise<boolean> => {
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
    console.error('Error checking subscription validity:', error);
    return false;
  }
};