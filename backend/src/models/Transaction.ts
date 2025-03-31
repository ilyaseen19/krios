import mongoose, { Schema, Document } from 'mongoose';

// Interface for CartItem subdocument
interface ICartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
  description?: string;
  category?: string;
}

// Interface for Discount subdocument
interface IDiscount {
  type: 'percentage' | 'fixed';
  value: number;
}

// Interface for Transaction document
export interface ITransaction extends Document {
  id: string;
  receiptNumber: string;
  items: ICartItem[];
  total: number;
  tax: number;
  cashierId: string;
  createdAt: Date;
  paymentType?: string;
  status?: 'Completed' | 'Pending' | 'Cancelled';
  discount?: IDiscount | null;
  discountAmount?: number;
}

// CartItem schema
const CartItemSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    stock: { type: Number },
    description: { type: String },
    category: { type: String }
  },
  { _id: false }
);

// Discount schema
const DiscountSchema: Schema = new Schema(
  {
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true }
  },
  { _id: false }
);

// Transaction schema
const TransactionSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    receiptNumber: { type: String, required: true },
    items: { type: [CartItemSchema], required: true },
    total: { type: Number, required: true },
    tax: { type: Number, required: true },
    cashierId: { type: String, required: true },
    paymentType: { type: String, default: 'cash' },
    status: { 
      type: String, 
      enum: ['Completed', 'Pending', 'Cancelled'], 
      default: 'Completed' 
    },
    discount: { type: DiscountSchema, default: null },
    discountAmount: { type: Number },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Create and export the model
export default mongoose.model<ITransaction>('Transaction', TransactionSchema);