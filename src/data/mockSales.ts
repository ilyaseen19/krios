// Mock sales data for the application

export interface Sale {
  id: number;
  date: string;
  customer: string;
  total: number;
  status: string;
}

export const mockSales: Sale[] = [
  { id: 1, date: '2023-06-15', customer: 'John Doe', total: 245.99, status: 'Completed' },
  { id: 2, date: '2023-06-14', customer: 'Jane Smith', total: 189.50, status: 'Completed' },
  { id: 3, date: '2023-06-14', customer: 'Robert Johnson', total: 320.75, status: 'Pending' },
  { id: 4, date: '2023-06-13', customer: 'Emily Davis', total: 145.25, status: 'Completed' },
  { id: 5, date: '2023-06-12', customer: 'Michael Brown', total: 78.99, status: 'Cancelled' },
];

export const saleStatuses = ['Completed', 'Pending', 'Cancelled'];