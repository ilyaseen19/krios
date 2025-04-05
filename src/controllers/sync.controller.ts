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
    const existingDbs = await getCustomerDatabases(companyDbPrefix);
    
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
      const connection = await connectToCustomerDB(req.body.customerId, req.body.businessName);
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
      const connection = await connectToCustomerDB(req.body.customerId, req.body.businessName);
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
      const connection = await connectToCustomerDB(req.body.customerId, req.body.businessName);
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
      const connection = await connectToCustomerDB(req.body.customerId, req.body.businessName);
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
      const connection = await connectToCustomerDB(req.body.customerId, req.body.businessName);
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

/**
 * Sync all data (products, transactions, users, categories, settings)
 * @route POST /api/sync/all
 */
export const syncAll = async (req: Request, res: Response) => {
  try {
    const { customerId, businessName, products, transactions, users, categories, settings } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    // Connect to customer database
    const connection = await connectToCustomerDB(customerId, businessName);
    const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);

    // Update sync metadata status to in_progress
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        status: 'in_progress',
        lastSyncTimestamp: new Date()
      }
    );

    const results = {
      products: 0,
      transactions: 0,
      users: 0,
      categories: 0,
      settings: 0
    };

    // Sync products if provided
    if (products && products.length > 0) {
      const ProductModel = connection.model('Product', Product.schema);
      
      // Update sync metadata
      await SyncMetadataModel.findOneAndUpdate(
        { customerId },
        { 'collections.products': new Date() }
      );
      
      // Process products in batches
      const batchSize = 100;
      const batches = Math.ceil(products.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batch = products.slice(i * batchSize, (i + 1) * batchSize);
        
        const bulkOps = batch.map((product: any) => {
          // Create a copy of the product without the _id field to avoid MongoDB immutable field error
          const productCopy = { ...product };
          if (productCopy._id) delete productCopy._id;
          
          return {
            updateOne: {
              filter: { id: product.id },
              update: { $set: productCopy },
              upsert: true
            }
          };
        });
        
        await ProductModel.bulkWrite(bulkOps);
      }
      
      results.products = products.length;
    }

    // Sync transactions if provided
    if (transactions && transactions.length > 0) {
      const TransactionModel = connection.model('Transaction', Transaction.schema);
      
      // Update sync metadata
      await SyncMetadataModel.findOneAndUpdate(
        { customerId },
        { 'collections.transactions': new Date() }
      );
      
      // Process transactions in batches
      const batchSize = 100;
      const batches = Math.ceil(transactions.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batch = transactions.slice(i * batchSize, (i + 1) * batchSize);
        
        const bulkOps = batch.map((transaction: any) => {
          // Create a copy of the transaction without the _id field to avoid MongoDB immutable field error
          const transactionCopy = { ...transaction };
          if (transactionCopy._id) delete transactionCopy._id;
          
          return {
            updateOne: {
              filter: { id: transaction.id },
              update: { $set: transactionCopy },
              upsert: true
            }
          };
        });
        
        await TransactionModel.bulkWrite(bulkOps);
      }
      
      results.transactions = transactions.length;
    }

    // Sync users if provided
    if (users && users.length > 0) {
      const UserModel = connection.model('User', User.schema);
      
      // Update sync metadata
      await SyncMetadataModel.findOneAndUpdate(
        { customerId },
        { 'collections.users': new Date() }
      );
      
      // Process users in batches
      const batchSize = 100;
      const batches = Math.ceil(users.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batch = users.slice(i * batchSize, (i + 1) * batchSize);
        
        const bulkOps = batch.map((user: any) => {
          // Create a copy of the user without the _id field to avoid MongoDB immutable field error
          const userCopy = { ...user };
          if (userCopy._id) delete userCopy._id;
          
          return {
            updateOne: {
              filter: { id: user.id },
              update: { $set: userCopy },
              upsert: true
            }
          };
        });
        
        await UserModel.bulkWrite(bulkOps);
      }
      
      results.users = users.length;
    }

    // Sync categories if provided
    if (categories && categories.length > 0) {
      const CategoryModel = connection.model('Category', Category.schema);
      
      // Update sync metadata
      await SyncMetadataModel.findOneAndUpdate(
        { customerId },
        { 'collections.categories': new Date() }
      );
      
      // Process categories in batches
      const batchSize = 100;
      const batches = Math.ceil(categories.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batch = categories.slice(i * batchSize, (i + 1) * batchSize);
        
        const bulkOps = batch.map((category: any) => {
          // Create a copy of the category without the _id field to avoid MongoDB immutable field error
          const categoryCopy = { ...category };
          if (categoryCopy._id) delete categoryCopy._id;
          
          return {
            updateOne: {
              filter: { id: category.id },
              update: { $set: categoryCopy },
              upsert: true
            }
          };
        });
        
        await CategoryModel.bulkWrite(bulkOps);
      }
      
      results.categories = categories.length;
    }

    // Sync settings if provided
    if (settings && settings.length > 0) {
      const SettingsModel = connection.model('Settings', Settings.schema);
      
      // Update sync metadata
      await SyncMetadataModel.findOneAndUpdate(
        { customerId },
        { 'collections.settings': new Date() }
      );
      
      // Process settings in batches
      const batchSize = 100;
      const batches = Math.ceil(settings.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batch = settings.slice(i * batchSize, (i + 1) * batchSize);
        
        const bulkOps = batch.map((setting: any) => {
          // Create a copy of the setting without the _id field to avoid MongoDB immutable field error
          const settingCopy = { ...setting };
          if (settingCopy._id) delete settingCopy._id;
          
          return {
            updateOne: {
              filter: { id: setting.id },
              update: { $set: settingCopy },
              upsert: true
            }
          };
        });
        
        await SettingsModel.bulkWrite(bulkOps);
      }
      
      results.settings = settings.length;
    }

    // Update sync metadata to success
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        lastSyncTimestamp: new Date(),
        status: 'success',
        error: null
      }
    );

    res.status(200).json({
      message: 'All data synchronized successfully',
      results
    });
  } catch (error) {
    console.error('Error syncing all data:', error);
    
    // Update sync metadata with error
    try {
      const connection = await connectToCustomerDB(req.body.customerId, req.body.businessName);
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
    
    res.status(500).json({ message: 'Server error syncing all data' });
  }
};

/**
 * Restore a specific collection data from the database
 * @route GET /api/sync/restore/:collection
 */
export const restoreCollection = async (req: Request, res: Response) => {
  try {
    const { customerId, businessName } = req.query;
    const { collection } = req.params;
    
    // Validate required parameters
    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }
    
    if (!collection) {
      return res.status(400).json({ message: 'Collection name is required' });
    }
    
    // Validate collection name
    const validCollections = ['products', 'transactions', 'users', 'categories', 'settings'];
    if (!validCollections.includes(collection)) {
      return res.status(400).json({ 
        message: 'Invalid collection name', 
        validCollections 
      });
    }
    
    // Check if customer database exists
    const exists = await customerDbExists(customerId as string, businessName as string);
    if (!exists) {
      return res.status(404).json({ message: 'Customer database not found' });
    }
    
    // Connect to customer database
    const connection = await connectToCustomerDB(customerId as string, businessName as string);
    
    // Get data from the requested collection
    let data: any[] = [];
    let count = 0;
    
    // Query the appropriate model based on collection name
    switch (collection) {
      case 'products':
        const ProductModel = connection.model('Product', Product.schema);
        data = await ProductModel.find({}).lean();
        count = data.length;
        break;
        
      case 'transactions':
        const TransactionModel = connection.model('Transaction', Transaction.schema);
        data = await TransactionModel.find({}).lean();
        count = data.length;
        break;
        
      case 'users':
        const UserModel = connection.model('User', User.schema);
        data = await UserModel.find({}).lean();
        count = data.length;
        break;
        
      case 'categories':
        const CategoryModel = connection.model('Category', Category.schema);
        data = await CategoryModel.find({}).lean();
        count = data.length;
        break;
        
      case 'settings':
        const SettingsModel = connection.model('Settings', Settings.schema);
        data = await SettingsModel.find({}).lean();
        count = data.length;
        break;
    }
    
    // Update sync metadata to record the restore operation
    const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        lastSyncTimestamp: new Date(),
        status: 'success',
        error: null
      }
    );
    
    // Return the data
    res.status(200).json({
      message: `${collection} data restored successfully`,
      count,
      data
    });
    
  } catch (error) {
    console.error(`Error restoring collection:`, error);
    res.status(500).json({ message: 'Server error restoring data' });
  }
};

/**
 * Restore all data from the database
 * @route GET /api/sync/restore
 */
export const restoreAll = async (req: Request, res: Response) => {
  try {
    const { customerId, businessName } = req.query;
    
    // Validate required parameters
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
    
    // Initialize models
    const ProductModel = connection.model('Product', Product.schema);
    const TransactionModel = connection.model('Transaction', Transaction.schema);
    const UserModel = connection.model('User', User.schema);
    const CategoryModel = connection.model('Category', Category.schema);
    const SettingsModel = connection.model('Settings', Settings.schema);
    const SyncMetadataModel = connection.model('SyncMetadata', SyncMetadata.schema);
    
    // Fetch all data in parallel for better performance
    const [products, transactions, users, categories, settings] = await Promise.all([
      ProductModel.find({}).lean(),
      TransactionModel.find({}).lean(),
      UserModel.find({}).lean(),
      CategoryModel.find({}).lean(),
      SettingsModel.find({}).lean()
    ]);
    
    // Update sync metadata to record the restore operation
    await SyncMetadataModel.findOneAndUpdate(
      { customerId },
      { 
        lastSyncTimestamp: new Date(),
        status: 'success',
        error: null
      }
    );
    
    // Return all data
    res.status(200).json({
      message: 'All data restored successfully',
      counts: {
        products: products.length,
        transactions: transactions.length,
        users: users.length,
        categories: categories.length,
        settings: settings.length
      },
      data: {
        products,
        transactions,
        users,
        categories,
        settings
      }
    });
    
  } catch (error) {
    console.error('Error restoring all data:', error);
    res.status(500).json({ message: 'Server error restoring data' });
  }
};