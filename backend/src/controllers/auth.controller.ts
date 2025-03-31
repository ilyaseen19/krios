import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectToCustomerDB } from '../config/database';
import User, { IUser } from '../models/User';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { customerId, name, email, password, role } = req.body;

    // Validate required fields
    if (!customerId || !name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Connect to customer database
    const connection = await connectToCustomerDB(customerId);
    const UserModel = connection.model<IUser>('User', User.schema);

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Get all users to determine the next ID
    const users = await UserModel.find();
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

    // Create new user
    const newUser = new UserModel({
      id,
      name,
      email,
      password,
      role,
      status: 'active'
    });

    // Save user to database
    await newUser.save();

    // Create JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, customerId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { customerId, email, password } = req.body;

    // Validate required fields
    if (!customerId || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Connect to customer database
    const connection = await connectToCustomerDB(customerId);
    const UserModel = connection.model<IUser>('User', User.schema);

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'User account is inactive' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, customerId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data and token
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // Check if user data is attached to request by auth middleware
    if (!req.body.user) {
      return res.status(200).json({
        message: 'No authentication provided',
        user: null
      });
    }
    
    const { customerId, id } = req.body.user;

    // Connect to customer database
    const connection = await connectToCustomerDB(customerId);
    const UserModel = connection.model<IUser>('User', User.schema);

    // Find user by ID
    const user = await UserModel.findOne({ id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};