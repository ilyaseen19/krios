import mongoose, { Schema, Document } from 'mongoose';

// Interface for SyncMetadata document
export interface ISyncMetadata extends Document {
  customerId: string;
  lastSyncTimestamp: Date;
  collections: {
    products: Date;
    transactions: Date;
    users: Date;
    categories: Date;
    settings: Date;
  };
  status: 'success' | 'failed' | 'in_progress';
  error?: string;
}

// SyncMetadata schema
const SyncMetadataSchema: Schema = new Schema(
  {
    customerId: { type: String, required: true, unique: true },
    lastSyncTimestamp: { type: Date, default: Date.now },
    collections: {
      products: { type: Date },
      transactions: { type: Date },
      users: { type: Date },
      categories: { type: Date },
      settings: { type: Date }
    },
    status: { 
      type: String, 
      enum: ['success', 'failed', 'in_progress'], 
      default: 'success' 
    },
    error: { type: String }
  },
  { timestamps: true }
);

// Create and export the model
export default mongoose.model<ISyncMetadata>('SyncMetadata', SyncMetadataSchema);