import express from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  toggleBlockCustomer,
  validateSubscription
} from '../controllers/customer.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Create a new customer with company credentials
router.post('/', createCustomer);

// Get all customers
router.get('/', optionalAuthenticate, getCustomers);

// Get customer by ID
router.get('/:id', optionalAuthenticate, getCustomerById);

// Update customer
router.put('/:id', optionalAuthenticate, updateCustomer);

// Delete customer
router.delete('/:id', optionalAuthenticate, deleteCustomer);

// Toggle customer block status
router.patch('/:id/toggle-block', optionalAuthenticate, toggleBlockCustomer);

// Validate customer subscription
router.post('/validate-subscription', validateSubscription);

export default router;