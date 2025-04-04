import express from 'express';
import {
  createApp,
  getApps,
  getAppById,
  updateApp,
  deleteApp
} from '../controllers/apps.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   POST /api/apps
 * @desc    Create a new app
 * @access  Private
 */
router.post('/', authenticate, createApp);

/**
 * @route   GET /api/apps
 * @desc    Get all apps
 * @access  Private
 */
router.get('/', authenticate, getApps);

/**
 * @route   GET /api/apps/:appId
 * @desc    Get app by ID
 * @access  Private
 */
router.get('/:appId', authenticate, getAppById);

/**
 * @route   PATCH /api/apps/:appId
 * @desc    Update app (partial updates allowed)
 * @access  Private
 */
router.patch('/:appId', authenticate, updateApp);

/**
 * @route   DELETE /api/apps/:appId
 * @desc    Delete app
 * @access  Private
 */
router.delete('/:appId', authenticate, deleteApp);

export default router;