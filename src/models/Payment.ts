import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  customerId: string;
  companyName: string;
  subscribedApp: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  paymentDate: Date;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  description: string;
}

const PaymentSchema: Schema = new Schema({
  customerId: {
    type: String,
    required: true,
    index: true
  },
  companyName: {
    type: String,
    required: true
  },
  subscribedApp: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    required: false,
    sparse: true
  },
  orderId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  subscriptionStartDate: {
    type: Date
  },
  subscriptionEndDate: {
    type: Date
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

// Create a sparse index to ensure uniqueness only for non-null paymentId values
// The sparse option ensures that documents without paymentId field are not indexed
PaymentSchema.index({ paymentId: 1 }, { unique: true, sparse: true });


export default mongoose.model<IPayment>('Payment', PaymentSchema);