import mongoose, { Schema, Document } from 'mongoose';

// Interface for Product document
export interface IProduct extends Document {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  barcode?: string;
}

// Product schema
const ProductSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    description: { type: String },
    category: { type: String },
    barcode: { type: String, sparse: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Create and export the model
export default mongoose.model<IProduct>('Product', ProductSchema);