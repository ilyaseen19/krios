import mongoose, { Schema, Document } from 'mongoose';

// Interface for Category document
export interface ICategory extends Document {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category schema
const CategorySchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Create and export the model
export default mongoose.model<ICategory>('Category', CategorySchema);