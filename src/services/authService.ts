import { User } from '../types/user';

// Mock user data
const mockUsers: User[] = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    token: 'mock-admin-token'
  },
  {
    username: 'cashier',
    password: 'cashier123',
    role: 'cashier',
    token: 'mock-cashier-token'
  }
];

export const authenticateUser = async (username: string, password: string): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = mockUsers.find(
    user => user.username === username && user.password === password
  );

  if (!user) {
    throw new Error('Invalid username or password');
  }

  return user;
};

export const logoutUser = async (): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
};