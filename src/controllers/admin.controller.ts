import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '../models/Admin';
import mongoose from 'mongoose';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Login admin
 * @route POST /api/admins/login
 */
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      return res.status(403).json({ message: 'Your account is blocked. Please contact support.' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role, isAdmin: true },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return admin data and token
    res.status(200).json({
      message: 'Login successful',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Create a new admin
 * @route POST /api/admins
 */
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Create new admin
    const newAdmin = new Admin({
      username,
      email,
      password,
      role: role || 'viewer', // Default to 'viewer' if not specified
      status: 'active'
    });

    // Save admin to database
    await newAdmin.save();

    // Return admin data (without password)
    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Server error during admin creation' });
  }
};

/**
 * Get all admins
 * @route GET /api/admins
 */
export const getAdmins = async (req: Request, res: Response) => {
  try {
    // Get all admins (exclude password field)
    const admins = await Admin.find().select('-password');

    res.status(200).json({
      count: admins.length,
      admins
    });
  } catch (error) {
    console.error('Error getting admins:', error);
    res.status(500).json({ message: 'Server error while retrieving admins' });
  }
};

/**
 * Get admin by ID
 * @route GET /api/admins/:id
 */
export const getAdminById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid admin ID format' });
    }

    // Find admin by ID (exclude password field)
    const admin = await Admin.findById(id).select('-password');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json(admin);
  } catch (error) {
    console.error('Error getting admin:', error);
    res.status(500).json({ message: 'Server error while retrieving admin' });
  }
};

/**
 * Update admin
 * @route PUT /api/admins/:id
 */
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, status } = req.body;
    const loggedInAdmin = req.body.user;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid admin ID format' });
    }

    // Find admin by ID
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Only super_admin can change roles or status, or a different admin
    if (loggedInAdmin.role !== 'super_admin' && loggedInAdmin.id.toString() !== id) {
      return res.status(403).json({ message: 'Not authorized to update this admin' });
    }

    // Update fields if provided
    if (username) admin.username = username;
    if (email) admin.email = email;
    if (password) admin.password = password; // Will be hashed by pre-save hook
    
    // Only super_admin can change role and status
    if (loggedInAdmin.role === 'super_admin') {
      if (role) admin.role = role;
      if (status) admin.status = status;
    }

    // Save updated admin
    await admin.save();

    // Return updated admin (without password)
    res.status(200).json({
      message: 'Admin updated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status
      }
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ message: 'Server error during admin update' });
  }
};

/**
 * Delete admin
 * @route DELETE /api/admins/:id
 */
export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid admin ID format' });
    }

    // Find and delete admin
    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ message: 'Server error during admin deletion' });
  }
};