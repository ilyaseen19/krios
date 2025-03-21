import { CartItem, Transaction } from '../types/product';

let mockTransactions: Transaction[] = [];

export const calculateTax = (subtotal: number): number => {
  return subtotal * 0.1; // 10% tax rate
};

export const createTransaction = async (items: CartItem[], cashierId: string): Promise<Transaction> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Calculate total and tax
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  const transaction: Transaction = {
    id: String(mockTransactions.length + 1),
    items,
    total,
    tax,
    cashierId,
    createdAt: new Date()
  };

  mockTransactions.push(transaction);
  return transaction;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockTransactions;
};

export const getDailyTransactions = async (date: Date): Promise<Transaction[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt);
    return (
      transactionDate.getFullYear() === date.getFullYear() &&
      transactionDate.getMonth() === date.getMonth() &&
      transactionDate.getDate() === date.getDate()
    );
  });
};

export const getDailySummary = async (date: Date): Promise<{
  totalSales: number;
  transactionCount: number;
  totalTax: number;
}> => {
  const transactions = await getDailyTransactions(date);
  return {
    totalSales: transactions.reduce((sum, t) => sum + t.total, 0),
    transactionCount: transactions.length,
    totalTax: transactions.reduce((sum, t) => sum + t.tax, 0)
  };
};