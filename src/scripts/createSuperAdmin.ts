import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectToMongoDB } from '../config/database';
import Admin from '../models/Admin';

// Load environment variables
dotenv.config();

// Function to create a super admin user
async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('Connected to MongoDB successfully');

    // Check if a super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('A super admin user already exists with email:', existingSuperAdmin.email);
      await mongoose.disconnect();
      return;
    }

    // Create a new super admin user
    const superAdmin = new Admin({
      username: 'superadmin',
      email: 'superadmin@example.com',
      password: 'SuperAdmin123!', // This will be hashed by the pre-save hook
      role: 'super_admin',
      status: 'active'
    });

    // Save the super admin to the database
    await superAdmin.save();
    console.log('Super admin created successfully with email:', superAdmin.email);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating super admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Execute the function
createSuperAdmin();