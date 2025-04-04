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
    required: true,
    unique: true
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
    type: Date,
    required: true
  },
  subscriptionEndDate: {
    type: Date,
    required: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);