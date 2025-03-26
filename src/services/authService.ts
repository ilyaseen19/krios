import { User } from '../types/user';
import { getUsers } from './userService';

export const authenticateUser = async (username: string, password: string): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Get all users from IndexedDB
  const users = await getUsers();
  
  console.log('Available users:', users);
  console.log('Attempting login with:', { username, password });
  
  // Find user by name first, then fall back to email for backward compatibility
  // Check if the username matches the name or email (case insensitive)
  const user = users.find(
    user => (
      (user.name.toLowerCase() === username.toLowerCase() ||
       user.email.toLowerCase() === username.toLowerCase() || 
       user.email.split('@')[0].toLowerCase() === username.toLowerCase()) && 
      user.password === password
    )
  );

  if (!user) {
    console.error('No matching user found in database');
    throw new Error('Invalid username or password');
  }
  
  // Check if user is inactive
  if (user.status && user.status.toLowerCase() === 'inactive') {
    console.error('User account is inactive:', { id: user.id, name: user.name });
    throw new Error('Account inactive');
  }

  console.log('User authenticated successfully:', { id: user.id, role: user.role });
  return user;
};

export const logoutUser = async (): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
};