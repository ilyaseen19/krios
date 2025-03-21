export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  cashierId: string;
  createdAt: Date;
}