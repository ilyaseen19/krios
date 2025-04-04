import mongoose, { Schema, Document } from 'mongoose';

// Interface for Customer document
export interface ICustomer extends Document {
  customerId: string;
  companyName: string;
  email: string;
  contactPhone: string;
  contactPerson: string;
  subscribedApp: string;
  subscriptionAmount: number;
  subscriptionDuration: number; // Duration in months
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  paymentId: string;
  status: string;
  agent: mongoose.Types.ObjectId; // Reference to the admin who manages this customer
  createdAt: Date;
  updatedAt: Date;
}

// Customer schema
const CustomerSchema: Schema = new Schema(
  {
    customerId: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    email: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactPerson: { type: String, required: true },
    subscribedApp: { type: String, required: true },
    subscriptionAmount: { type: Number, required: true },
    subscriptionDuration: { type: Number, required: true, default: 1 }, // Default to 1 month
    subscriptionStartDate: { type: Date, required: true },
    subscriptionEndDate: { type: Date, required: true },
    paymentId: { type: String, required: true },
    status: { type: String, required: true, default: 'active' },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' } // Reference to the admin who manages this customer
  },
  { timestamps: true }
);

// Create and export the model
export default mongoose.model<ICustomer>('Customer', CustomerSchema);