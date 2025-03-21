// Mock user data for the application

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

export const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Cashier', status: 'Active' },
  { id: 3, name: 'Robert Johnson', email: 'robert@example.com', role: 'Manager', status: 'Active' },
  { id: 4, name: 'Emily Davis', email: 'emily@example.com', role: 'Cashier', status: 'Inactive' },
  { id: 5, name: 'Michael Brown', email: 'michael@example.com', role: 'Inventory', status: 'Active' },
];

export const userRoles = ['Admin', 'Manager', 'Cashier', 'Inventory'];
export const userStatuses = ['Active', 'Inactive'];

export const defaultNewUser = {
  name: '',
  email: '',
  role: 'Cashier',
  status: 'Active'
};