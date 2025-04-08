import express from 'express';
import { 
  initializeCustomerDB, 
  getSyncStatus, 
  // syncProducts, 
  // syncTransactions, 
  // syncUsers,
  // syncCategories,
  // syncSettings,
  syncAll,
  restoreCollection,
  restoreAll,
  getCustomerDBInfo
} from '../controllers/sync.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Initialize a new customer database
router.post('/initialize', initializeCustomerDB);

// Get synchronization status
router.get('/status', getSyncStatus);

// Get customer database information
router.get('/db-info', optionalAuthenticate, getCustomerDBInfo);

// Routes with optional authentication
// router.post('/products', optionalAuthenticate, syncProducts);
// router.post('/transactions', optionalAuthenticate, syncTransactions);
// router.post('/users', optionalAuthenticate, syncUsers);
// router.post('/categories', optionalAuthenticate, syncCategories);
// router.post('/settings', optionalAuthenticate, syncSettings);

// Sync all data at once
router.post('/all', syncAll);

// Restore data routes
router.get('/restore/:collection', restoreCollection);
router.get('/restore', restoreAll);

export default router;