// User Service for IndexedDB operations

import { User } from '../types/user';
import { STORES, addItem, getAllItems, getItemById, updateItem, deleteItem } from './dbService';

// Check if we're online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Get all users from IndexedDB
export const getUsers = async (): Promise<User[]> => {
  try {
    // Try to get users from IndexedDB
    const users = await getAllItems<User>(STORES.USERS);
    return users;
  } catch (error) {
    console.error('Error getting users from IndexedDB:', error);
    throw error;
  }
};

// Get a single user by ID from IndexedDB
export const getUser = async (id: number): Promise<User> => {
  try {
    const user = await getItemById<User>(STORES.USERS, id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error(`Error getting user ${id} from IndexedDB:`, error);
    throw error;
  }
};

// Create a new user in IndexedDB
export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  try {
    // Get all users to determine the next ID
    const users = await getUsers();
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    
    // Create the new user object
    const newUser: User = {
      ...user,
      id
    };
    
    // Add the user to IndexedDB
    await addItem<User>(STORES.USERS, newUser);
    
    return newUser;
  } catch (error) {
    console.error('Error creating user in IndexedDB:', error);
    throw error;
  }
};

// Update a user in IndexedDB
export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  try {
    // Get the existing user
    const existingUser = await getItemById<User>(STORES.USERS, id);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    // Update the user
    const updatedUser: User = {
      ...existingUser,
      ...userData
    };
    
    // Update the user in IndexedDB
    await updateItem<User>(STORES.USERS, updatedUser);
    
    return updatedUser;
  } catch (error) {
    console.error(`Error updating user ${id} in IndexedDB:`, error);
    throw error;
  }
};

// Delete a user from IndexedDB
export const deleteUser = async (id: number): Promise<void> => {
  try {
    await deleteItem(STORES.USERS, id);
    
    // Check if there are any users left
    const remainingUsers = await getAllItems<User>(STORES.USERS);
    
    // If no users left, set a flag to indicate users were intentionally deleted
    // This prevents the default admin from being recreated on page refresh
    if (remainingUsers.length === 0) {
      localStorage.setItem('usersIntentionallyDeleted', 'true');
    }
  } catch (error) {
    console.error(`Error deleting user ${id} from IndexedDB:`, error);
    throw error;
  }
};