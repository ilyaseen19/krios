// Initialize database with default data

import { User } from '../types/user';
import { addItem, STORES, getAllItems } from './dbService';

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
  } catch (error) {
    console.error('Error initializing default admin:', error);
  }
};