import mongoose, { Schema, Document } from 'mongoose';

// Implementation state enum
export enum ImplementationState {
  PLANNING = 'planning',
  DEVELOPMENT = 'development',
  COMPLETED = 'completed'
}

// Deployment status enum
export enum DeploymentStatus {
  DEPLOYED = 'deployed',
  PENDING = 'pending'
}

// Status enum
export enum AppStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// App document interface
export interface IApp extends Document {
  appName: string;
  appId: string;
  implementationState: ImplementationState;
  deploymentStatus: DeploymentStatus;
  description: string;
  status: AppStatus;
  createdAt: Date;
  updatedAt: Date;
}

// App schema
const AppSchema: Schema = new Schema({
  appName: {
    type: String,
    required: [true, 'App name is required'],
    unique: true,
    trim: true
  },
  appId: {
    type: String,
    required: [true, 'App ID is required'],
    unique: true,
    trim: true
  },
  implementationState: {
    type: String,
    enum: Object.values(ImplementationState),
    default: ImplementationState.PLANNING
  },
  deploymentStatus: {
    type: String,
    enum: Object.values(DeploymentStatus),
    default: DeploymentStatus.PENDING
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(AppStatus),
    default: AppStatus.ACTIVE
  }
}, {
  timestamps: true
});

// Indexes are already defined in the schema properties with unique: true

// Pre-save middleware to generate appId if not provided
AppSchema.pre('save', function(next) {
  if (!this.appId) {
    this.appId = `app_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export default mongoose.model<IApp>('App', AppSchema);