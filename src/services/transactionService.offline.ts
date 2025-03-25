import { CartItem, Transaction, Product } from '../types/product';
import { STORES, addItem, getAllItems, getItemById, updateItem, addPendingOperation, getPendingOperations, deletePendingOperation } from './dbService';

// Check if we're online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Calculate tax (same as original implementation)
export const calculateTax = (subtotal: number): number => {
  return subtotal * 0.1; // 10% tax rate
};

// Create a transaction and store it in IndexedDB
export const createTransaction = async (items: CartItem[], cashierId: string, paymentType: string = 'cash'): Promise<Transaction> => {
  try {
    // Calculate total and tax
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    // Generate a unique ID for the transaction
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction: Transaction = {
      id,
      items,
      total,
      tax,
      cashierId,
      paymentType,
      createdAt: new Date()
    };

    // Add the transaction to IndexedDB
    await addItem<Transaction>(STORES.SALES, transaction);
    
    // If offline, add to pending operations
    if (!isOnline()) {
      await addPendingOperation({
        type: 'add',
        entityType: STORES.SALES,
        data: transaction,
        timestamp: new Date()
      });
    }
    
    return transaction;
  } catch (error) {
    console.error('Error creating transaction in IndexedDB:', error);
    throw error;
  }
};

// Get all transactions from IndexedDB
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactions = await getAllItems<Transaction>(STORES.SALES);
    return transactions;
  } catch (error) {
    console.error('Error getting transactions from IndexedDB:', error);
    throw error;
  }
};

// Get daily transactions from IndexedDB
export const getDailyTransactions = async (date: Date): Promise<Transaction[]> => {
  try {
    const transactions = await getAllItems<Transaction>(STORES.SALES);
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      return (
        transactionDate.getFullYear() === date.getFullYear() &&
        transactionDate.getMonth() === date.getMonth() &&
        transactionDate.getDate() === date.getDate()
      );
    });
  } catch (error) {
    console.error('Error getting daily transactions from IndexedDB:', error);
    throw error;
  }
};

// Get daily summary from IndexedDB
export const getDailySummary = async (date: Date): Promise<{
  totalSales: number;
  transactionCount: number;
  totalTax: number;
}> => {
  try {
    const transactions = await getDailyTransactions(date);
    
    const totalSales = transactions.reduce((sum, transaction) => sum + transaction.total, 0);
    const transactionCount = transactions.length;
    const totalTax = transactions.reduce((sum, transaction) => sum + transaction.tax, 0);
    
    return {
      totalSales,
      transactionCount,
      totalTax
    };
  } catch (error) {
    console.error('Error getting daily summary from IndexedDB:', error);
    throw error;
  }
};

// Sync transactions with server
export const syncTransactions = async (): Promise<void> => {
  if (!navigator.onLine) {
    console.log('Cannot sync transactions: Application is offline');
    return;
  }
  
  console.log('Syncing transactions with server...');
  
  try {
    // Get all pending operations related to sales/transactions
    const pendingOps = await getPendingOperations();
    const transactionOps = pendingOps.filter(op => op.entityType === STORES.SALES);
    
    // Sort operations by timestamp to process in order
    transactionOps.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`Processing ${transactionOps.length} pending transaction operations`);
    
    for (const op of transactionOps) {
      try {
        let success = false;
        
        switch (op.type) {
          case 'add':
            // For transaction adds, send POST to /transactions
            const transactionToAdd = { ...op.data };
            // Remove local_ prefix from ID if present
            if (transactionToAdd.id && transactionToAdd.id.startsWith('local_')) {
              delete transactionToAdd.id; // Let the server generate a new ID
            }
            
            const response = await fetch('/api/transactions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(transactionToAdd)
            });
            
            if (response.ok) {
              success = true;
              console.log(`Successfully added transaction to server`);
              
              // Update local stock based on the transaction
              await updateLocalStock(transactionToAdd.items);
            } else {
              console.error(`Failed to add transaction to server: ${response.statusText}`);
            }
            break;
            
          // Add more operation types as needed
          default:
            console.warn(`Unknown transaction operation type: ${op.type}`);
        }
        
        // Remove the operation from pending operations if successful
        if (success) {
          await deletePendingOperation(op.id);
        }
      } catch (error) {
        console.error(`Error processing transaction operation ${op.id}:`, error);
        // Continue with next operation
      }
    }
    
    console.log('Finished syncing transactions with server');
  } catch (error) {
    console.error('Error syncing transactions with server:', error);
    throw error;
  }
};

// Helper function to update local stock after a transaction is synced
const updateLocalStock = async (items: CartItem[]): Promise<void> => {
  try {
    for (const item of items) {
      // Get the current product
      const product = await getItemById<Product>(STORES.PRODUCTS, item.id);
      
      if (product) {
        // Update the stock
        const updatedProduct = {
          ...product,
          stock: Math.max(0, product.stock - item.quantity), // Ensure stock doesn't go below 0
          updatedAt: new Date()
        };
        
        // Update the product in IndexedDB
        await updateItem<Product>(STORES.PRODUCTS, updatedProduct);
      }
    }
  } catch (error) {
    console.error('Error updating local stock:', error);
    throw error;
  }
};