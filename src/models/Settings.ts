import mongoose, { Schema, Document } from 'mongoose';

// Interface for Settings document
export interface ISettings extends Document {
  id: string;
  storeName?: string;
  storeEmail?: string;
  storePhone?: string;
  storeAddress?: string;
  currencySymbol?: string;
  taxRate?: string;
  dateFormat?: string;
  timeZone?: string;
  receiptCounter?: number;
  customerId?: string;
  businessName?: string;
  lowStockAlerts?: boolean;
  dailyReports?: boolean;
  weeklyReports?: boolean;
  monthlyReports?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Settings schema
const SettingsSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    storeName: { type: String },
    storeEmail: { type: String },
    storePhone: { type: String },
    storeAddress: { type: String },
    currencySymbol: { type: String },
    taxRate: { type: String },
    dateFormat: { type: String },
    timeZone: { type: String },
    receiptCounter: { type: Number },
    customerId: { type: String },
    businessName: { type: String },
    lowStockAlerts: { type: Boolean },
    dailyReports: { type: Boolean },
    weeklyReports: { type: Boolean },
    monthlyReports: { type: Boolean },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Create and export the model
export default mongoose.model<ISettings>('Settings', SettingsSchema);