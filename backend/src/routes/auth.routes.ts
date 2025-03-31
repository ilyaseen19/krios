import express from 'express';
import { register, login, getCurrentUser } from '../controllers/auth.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user (with optional authentication)
router.get('/me', optionalAuthenticate, getCurrentUser);

export default router;