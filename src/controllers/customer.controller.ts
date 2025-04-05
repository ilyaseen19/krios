import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Customer from '../models/Customer';
import { connectToCustomerDB, getCustomerDatabases } from '../config/database';
import SyncMetadata from '../models/SyncMetadata';
import mongoose from 'mongoose';

/**
 * Create a new customer with company credentials and initialize their database
 * @route POST /api/customers
 */
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      email,
      contactPhone,
      contactPerson,
      subscribedApp,
      subscriptionAmount,
      subscriptionStartDate,
      subscriptionEndDate,
      agent
    } = req.body;

    // Validate required fields
    if (!companyName || !email || !contactPhone || !contactPerson || 
        !subscribedApp || !subscriptionAmount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if customer with this company name already exists
    const existingCustomer = await Customer.findOne({ companyName });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this company name already exists' });
    }

    // Generate a unique customer ID
    const customerId = uuidv4();

    // Check if a database with this company name already exists
    const companyDbPrefix = companyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existingDbs = await getCustomerDatabases(companyDbPrefix);
    
    let finalCustomerId = customerId;
    
    if (existingDbs.length > 0) {
      // If a database with this company name exists, use the existing customer ID
      finalCustomerId = existingDbs[0];
    }

    // Connect to the customer database
    const connection = await connectToCustomerDB(finalCustomerId, companyName);

    // If this is a new database, initialize the sync metadata
    if (existingDbs.length === 0) {
      const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);

      // Create initial sync metadata
      const syncMetadata = new SyncMetadataModel({
        customerId: finalCustomerId,
        lastSyncTimestamp: new Date(),
        collections: {
          products: null,
          transactions: null,
          users: null,
          categories: null,
          settings: null
        },
        status: 'success'
      });

      await syncMetadata.save();
    }

    // Create new customer with the generated customerId
    const newCustomer = new Customer({
      customerId: finalCustomerId,
      companyName,
      email,
      contactPhone,
      contactPerson,
      subscribedApp,
      subscriptionAmount,
      subscriptionStartDate: subscriptionStartDate ? new Date(subscriptionStartDate) : undefined,
      subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : undefined,
      isSubscribed: false,
      status: 'active',
      agent: agent || null // Set agent if provided, otherwise null
    });

    // Save customer to database
    await newCustomer.save();

    // Return customer data
    res.status(201).json({
      message: 'Customer created successfully',
      customer: newCustomer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Server error during customer creation' });
  }
};

/**
 * Get all customers
 * @route GET /api/customers
 */
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({ message: 'Server error getting customers' });
  }
};

/**
 * Get customer by ID
 * @route GET /api/customers/:id
 */
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ message: 'Server error getting customer' });
  }
};

/**
 * Update customer
 * @route PUT /api/customers/:id
 */
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate if ID is provided
    if (!id) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    // Validate if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid customer ID format' });
    }

    const customer = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ 
      message: 'Server error updating customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete customer
 * @route DELETE /api/customers/:id
 */
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    // First find the customer to get their customerId and companyName
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Connect to the customer's database
    const connection = await connectToCustomerDB(customer.customerId, customer.companyName);

    try {
      // Drop the customer's database
      await connection.dropDatabase();
      console.log(`Dropped database for customer: ${customer.companyName}`);
    } catch (dbError) {
      console.error('Error dropping customer database:', dbError);
      // Continue with customer deletion even if database drop fails
    } finally {
      // Close the connection
      await connection.close();
    }

    // Delete the customer record
    await Customer.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: 'Customer and associated database deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Server error deleting customer' });
  }
};

/**
 * Toggle customer block status
 * @route PATCH /api/customers/:id/toggle-block
 */
export const toggleBlockCustomer = async (req: Request, res: Response) => {
  try {
    // Find the customer by ID
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Toggle the status between 'active' and 'blocked'
    const newStatus = customer.status === 'active' ? 'blocked' : 'active';
    
    // Update the customer status
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: `Customer ${newStatus === 'blocked' ? 'blocked' : 'activated'} successfully`,
      customer: updatedCustomer
    });
  } catch (error) {
    console.error('Error toggling customer block status:', error);
    res.status(500).json({ message: 'Server error toggling customer block status' });
  }
};

/**
 * Validate customer subscription
 * @route POST /api/customers/validate-subscription
 * @description Validates a customer subscription by checking payment ID, subscription status, and block status
 */
export const validateSubscription = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    // Validate required fields
    if (!paymentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Payment ID is required' 
      });
    }

    // Find customer by payment ID
    const customer = await Customer.findOne({ paymentId });
    
    // Check if customer exists
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid payment ID. Customer not found.' 
      });
    }

    // Check if customer is blocked
    if (customer.status === 'blocked') {
      return res.status(403).json({ 
        success: false,
        message: 'Customer account is blocked' 
      });
    }

    // Check if subscription has expired
    const currentDate = new Date();
    if (currentDate > customer.subscriptionEndDate) {
      return res.status(403).json({ 
        success: false,
        message: 'Subscription has expired' 
      });
    }

    // All checks passed, return subscription details
    res.status(200).json({
      success: true,
      message: 'Subscription is valid',
      subscription: {
        customerId: customer.customerId,
        companyName: customer.companyName,
        paymentId: customer.paymentId,
        subscriptionEndDate: customer.subscriptionEndDate
      }
    });
  } catch (error) {
    console.error('Error validating subscription:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error validating subscription' 
    });
  }
};