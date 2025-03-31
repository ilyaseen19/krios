import express from 'express';
import { 
  initializeCustomerDB, 
  getSyncStatus, 
  syncProducts, 
  syncTransactions, 
  syncUsers,
  syncCategories,
  syncSettings
} from '../controllers/sync.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Initialize a new customer database
router.post('/initialize', initializeCustomerDB);

// Get synchronization status
router.get('/status', getSyncStatus);

// Routes with optional authentication
router.post('/products', optionalAuthenticate, syncProducts);
router.post('/transactions', optionalAuthenticate, syncTransactions);
router.post('/users', optionalAuthenticate, syncUsers);
router.post('/categories', optionalAuthenticate, syncCategories);
router.post('/settings', optionalAuthenticate, syncSettings);

export default router;