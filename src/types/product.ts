export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  category?: string;
  color?: string;
  tax?: number; // Product-specific tax rate (percentage)
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  items: CartItem[];
  total: number;
  tax: number; // General tax amount
  productTax: number; // Product-specific tax amount
  cashierId: string;
  createdAt: Date;
  paymentType?: string;
  status?: 'Completed' | 'Pending' | 'Cancelled';
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  } | null;
  discountAmount?: number;
}