import express from 'express';
import {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  loginAdmin
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   POST /api/admins/login
 * @desc    Login admin
 * @access  Public
 */
router.post('/login', loginAdmin);

/**
 * @route   POST /api/admins
 * @desc    Create a new admin
 * @access  Private (super_admin only)
 */
router.post('/', authenticate, authorize(['super_admin']), createAdmin);

/**
 * @route   GET /api/admins
 * @desc    Get all admins
 * @access  Private (admin and super_admin)
 */
router.get('/', authenticate, authorize(['admin', 'super_admin']), getAdmins);

/**
 * @route   GET /api/admins/:id
 * @desc    Get admin by ID
 * @access  Private (admin and super_admin)
 */
router.get('/:id', authenticate, authorize(['admin', 'super_admin']), getAdminById);

/**
 * @route   PUT /api/admins/:id
 * @desc    Update admin
 * @access  Private (super_admin or same admin)
 */
router.put('/:id', authenticate, authorize(['admin', 'super_admin']), updateAdmin);

/**
 * @route   DELETE /api/admins/:id
 * @desc    Delete admin
 * @access  Private (super_admin only)
 */
router.delete('/:id', authenticate, authorize(['super_admin']), deleteAdmin);

export default router;