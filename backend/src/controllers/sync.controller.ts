import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { connectToCustomerDB, customerDbExists, getCustomerDatabases } from '../config/database';
import Product from '../models/Product';
import Transaction from '../models/Transaction';
import User from '../models/User';
import Category from '../models/Category';
import Settings from '../models/Settings';
import SyncMetadata from '../models/SyncMetadata';

/**
 * Initialize a new customer database
 * @route POST /api/sync/initialize
 */
export const initializeCustomerDB = async (req: Request, res: Response) => {
  try {
    const { businessName } = req.body;

    if (!businessName) {
      return res.status(400).json({ message: 'Business name is required' });
    }

    // Generate a unique customer ID
    const customerId = uuidv4();

    // Check if a database with this company name already exists
    const companyDbPrefix = businessName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existingDbs = await getCustomerDatabases(businessName);
    
    if (existingDbs.length > 0) {
      // If a database with this company name exists, connect to the first one
      const existingCustomerId = existingDbs[0];
      const connection = await connectToCustomerDB(existingCustomerId, businessName);
      
      // Return the existing customer ID
      return res.status(200).json({
        message: 'Connected to existing company database',
        customerId: existingCustomerId,
        businessName
      });
    }

    // Connect to the new customer database with company name as prefix
    const connection = await connectToCustomerDB(customerId, businessName);

    // Initialize models in the new database
    const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);

    // Create initial sync metadata
    const syncMetadata = new SyncMetadataModel({
      customerId,
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
    
    // Initialize Settings model in the new database
    const SettingsModel = connection.model('Settings', Settings.schema);
    
    // Create initial settings with business name
    const initialSettings = new SettingsModel({
      id: uuidv4(),
      businessName: businessName,
      customerId: customerId
    });
    
    await initialSettings.save();
    
    // Initialize Categories model
    connection.model('Category', Category.schema);

    await syncMetadata.save();

    // Return the customer ID and connection info
    res.status(201).json({
      message: 'Customer database initialized successfully',
      customerId,
      businessName
    });
  } catch (error) {
    console.error('Error initializing customer database:', error);
    res.status(500).json({ message: 'Server error during database initialization' });
  }
};

/**
 * Get synchronization status
 * @route GET /api/sync/status
 */
export const getSyncStatus = async (req: Request, res: Response) => {
  try {
    const { customerId, businessName } = req.query;
    console.log(customerId, businessName);

    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    // Check if customer database exists
    const exists = await customerDbExists(customerId as string, businessName as string);
    if (!exists) {
      return res.status(404).json({ message: 'Customer database not found' });
    }

    // Connect to customer database
    const connection = await connectToCustomerDB(customerId as string, businessName as string);
    const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);

    // Get sync metadata
    const syncMetadata = await SyncMetadataModel.findOne({ customerId });
    if (!syncMetadata) {
      return res.status(404).json({ message: 'Sync metadata not found' });
    }

    // Return sync status
    res.status(200).json({
      customerId,
      lastSyncTimestamp: syncMetadata.lastSyncTimestamp,
      collections: syncMetadata.collections,
      status: syncMetadata.status,
      error: syncMetadata.error
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ message: 'Server error getting sync status' });
  }
};

/**
 * Sync products data
 * @route POST /api/sync/products
 */
export const syncProducts = async (req: Request, res: Response) => {
  try {
    const { customerId, products } = req.body;

    if (!customerId || !products) {
      return res.status(400).json({ message: 'Customer ID and products data are required' });
    }

    // Connect to customer database
    const connection = await connectToCustomerDB(customerId);
    const ProductModel = connection.model('Product', Product.schema);
    const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);

    // Update sync metadata status to in_progress
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        status: 'in_progress',
        'collections.products': new Date()
      }
    );

    // Process products in batches to avoid memory issues
    const batchSize = 100;
    const batches = Math.ceil(products.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = products.slice(i * batchSize, (i + 1) * batchSize);
      
      // Use bulkWrite for efficient database operations
      const bulkOps = batch.map((product: any) => ({
        updateOne: {
          filter: { id: product.id },
          update: { $set: product },
          upsert: true
        }
      }));
      
      await ProductModel.bulkWrite(bulkOps);
    }

    // Update sync metadata
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        lastSyncTimestamp: new Date(),
        status: 'success',
        error: null
      }
    );

    res.status(200).json({
      message: 'Products synchronized successfully',
      count: products.length
    });
  } catch (error) {
    console.error('Error syncing products:', error);
    
    // Update sync metadata with error
    try {
      const connection = await connectToCustomerDB(req.body.customerId);
      const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);
      
      await SyncMetadataModel.findOneAndUpdate(
        { customerId: req.body.customerId },
        { 
          status: 'failed',
          error: (error as Error).message
        }
      );
    } catch (metadataError) {
      console.error('Error updating sync metadata:', metadataError);
    }
    
    res.status(500).json({ message: 'Server error syncing products' });
  }
};

/**
 * Sync transactions data
 * @route POST /api/sync/transactions
 */
export const syncTransactions = async (req: Request, res: Response) => {
  try {
    const { customerId, transactions } = req.body;

    if (!customerId || !transactions) {
      return res.status(400).json({ message: 'Customer ID and transactions data are required' });
    }

    // Connect to customer database
    const connection = await connectToCustomerDB(customerId);
    const TransactionModel = connection.model('Transaction', Transaction.schema);
    const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);

    // Update sync metadata status to in_progress
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        status: 'in_progress',
        'collections.transactions': new Date()
      }
    );

    // Process transactions in batches to avoid memory issues
    const batchSize = 100;
    const batches = Math.ceil(transactions.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = transactions.slice(i * batchSize, (i + 1) * batchSize);
      
      // Use bulkWrite for efficient database operations
      const bulkOps = batch.map((transaction: any) => ({
        updateOne: {
          filter: { id: transaction.id },
          update: { $set: transaction },
          upsert: true
        }
      }));
      
      await TransactionModel.bulkWrite(bulkOps);
    }

    // Update sync metadata
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        lastSyncTimestamp: new Date(),
        status: 'success',
        error: null
      }
    );

    res.status(200).json({
      message: 'Transactions synchronized successfully',
      count: transactions.length
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    
    // Update sync metadata with error
    try {
      const connection = await connectToCustomerDB(req.body.customerId);
      const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);
      
      await SyncMetadataModel.findOneAndUpdate(
        { customerId: req.body.customerId },
        { 
          status: 'failed',
          error: (error as Error).message
        }
      );
    } catch (metadataError) {
      console.error('Error updating sync metadata:', metadataError);
    }
    
    res.status(500).json({ message: 'Server error syncing transactions' });
  }
};

/**
 * Sync users data
 * @route POST /api/sync/users
 */
export const syncUsers = async (req: Request, res: Response) => {
  try {
    const { customerId, users } = req.body;

    if (!customerId || !users) {
      return res.status(400).json({ message: 'Customer ID and users data are required' });
    }

    // Connect to customer database
    const connection = await connectToCustomerDB(customerId);
    const UserModel = connection.model('User', User.schema);
    const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);

    // Update sync metadata status to in_progress
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        status: 'in_progress',
        'collections.users': new Date()
      }
    );

    // Process users in batches to avoid memory issues
    const batchSize = 100;
    const batches = Math.ceil(users.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = users.slice(i * batchSize, (i + 1) * batchSize);
      
      // Use bulkWrite for efficient database operations
      const bulkOps = batch.map((user: any) => ({
        updateOne: {
          filter: { id: user.id },
          update: { $set: user },
          upsert: true
        }
      }));
      
      await UserModel.bulkWrite(bulkOps);
    }

    // Update sync metadata
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        lastSyncTimestamp: new Date(),
        status: 'success',
        error: null
      }
    );

    res.status(200).json({
      message: 'Users synchronized successfully',
      count: users.length
    });
  } catch (error) {
    console.error('Error syncing users:', error);
    
    // Update sync metadata with error
    try {
      const connection = await connectToCustomerDB(req.body.customerId);
      const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);
      
      await SyncMetadataModel.findOneAndUpdate(
        { customerId: req.body.customerId },
        { 
          status: 'failed',
          error: (error as Error).message
        }
      );
    } catch (metadataError) {
      console.error('Error updating sync metadata:', metadataError);
    }
    
    res.status(500).json({ message: 'Server error syncing users' });
  }
};

/**
 * Sync categories data
 * @route POST /api/sync/categories
 */
export const syncCategories = async (req: Request, res: Response) => {
  try {
    const { customerId, categories } = req.body;

    if (!customerId || !categories) {
      return res.status(400).json({ message: 'Customer ID and categories data are required' });
    }

    // Connect to customer database
    const connection = await connectToCustomerDB(customerId);
    const CategoryModel = connection.model('Category', Category.schema);
    const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);

    // Update sync metadata status to in_progress
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        status: 'in_progress',
        'collections.categories': new Date()
      }
    );

    // Process categories in batches to avoid memory issues
    const batchSize = 100;
    const batches = Math.ceil(categories.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = categories.slice(i * batchSize, (i + 1) * batchSize);
      
      // Use bulkWrite for efficient database operations
      const bulkOps = batch.map((category: any) => ({
        updateOne: {
          filter: { id: category.id },
          update: { $set: category },
          upsert: true
        }
      }));
      
      await CategoryModel.bulkWrite(bulkOps);
    }

    // Update sync metadata
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        lastSyncTimestamp: new Date(),
        status: 'success',
        error: null
      }
    );

    res.status(200).json({
      message: 'Categories synchronized successfully',
      count: categories.length
    });
  } catch (error) {
    console.error('Error syncing categories:', error);
    
    // Update sync metadata with error
    try {
      const connection = await connectToCustomerDB(req.body.customerId);
      const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);
      
      await SyncMetadataModel.findOneAndUpdate(
        { customerId: req.body.customerId },
        { 
          status: 'failed',
          error: (error as Error).message
        }
      );
    } catch (metadataError) {
      console.error('Error updating sync metadata:', metadataError);
    }
    
    res.status(500).json({ message: 'Server error syncing categories' });
  }
};

/**
 * Sync settings data
 * @route POST /api/sync/settings
 */
export const syncSettings = async (req: Request, res: Response) => {
  try {
    const { customerId, settings } = req.body;

    if (!customerId || !settings) {
      return res.status(400).json({ message: 'Customer ID and settings data are required' });
    }

    // Connect to customer database
    const connection = await connectToCustomerDB(customerId);
    const SettingsModel = connection.model('Settings', Settings.schema);
    const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);

    // Update sync metadata status to in_progress
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        status: 'in_progress',
        'collections.settings': new Date()
      }
    );

    // Process settings in batches to avoid memory issues
    const batchSize = 100;
    const batches = Math.ceil(settings.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = settings.slice(i * batchSize, (i + 1) * batchSize);
      
      // Use bulkWrite for efficient database operations
      const bulkOps = batch.map((setting: any) => ({
        updateOne: {
          filter: { id: setting.id },
          update: { $set: setting },
          upsert: true
        }
      }));
      
      await SettingsModel.bulkWrite(bulkOps);
    }

    // Update sync metadata
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        lastSyncTimestamp: new Date(),
        status: 'success',
        error: null
      }
    );

    res.status(200).json({
      message: 'Settings synchronized successfully',
      count: settings.length
    });
  } catch (error) {
    console.error('Error syncing settings:', error);
    
    // Update sync metadata with error
    try {
      const connection = await connectToCustomerDB(req.body.customerId);
      const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);
      
      await SyncMetadataModel.findOneAndUpdate(
        { customerId: req.body.customerId },
        { 
          status: 'failed',
          error: (error as Error).message
        }
      );
    } catch (metadataError) {
      console.error('Error updating sync metadata:', metadataError);
    }
    
    res.status(500).json({ message: 'Server error syncing settings' });
  }
};