import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Interface for JWT payload
interface JwtPayload {
  id: number;
  email: string;
  role: string;
  customerId: string;
}

/**
 * Optional authentication middleware
 * Verifies JWT token if present and attaches user data to request
 * Allows requests without tokens to proceed
 */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // If no token, just continue without authentication
  if (!token) {
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Attach user data to request
    req.body.user = decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    // Don't return error, just continue without authentication
  }
  
  next();
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches user data to request
 * Also checks if customer is blocked
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Check if customer exists and is not blocked
    if (decoded.customerId) {
      // Import Customer model dynamically to avoid circular dependencies
      const Customer = require('../models/Customer').default;
      const customer = await Customer.findOne({ customerId: decoded.customerId });
      
      if (customer && customer.status === 'blocked') {
        return res.status(403).json({ message: 'Access denied: customer account is blocked' });
      }
    }
    
    // Attach user data to request
    req.body.user = decoded;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Role-based authorization middleware
 * @param roles Array of allowed roles
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists in request (set by authenticate middleware)
    if (!req.body.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if user role is allowed
    if (!roles.includes(req.body.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next();
  };
};