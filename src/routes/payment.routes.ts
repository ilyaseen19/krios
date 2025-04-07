import express from 'express';
import { createPayPalOrder, capturePayPalPayment, getSubscriptionDetails, getAllPayments, getPaymentById, updatePaymentStatus } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a PayPal order for subscription payment
 * @access  Public
 */
router.post('/create-order', createPayPalOrder);

/**
 * @route   POST /api/payments/capture-payment
 * @desc    Capture a PayPal payment after approval
 * @access  Public
 */
router.post('/capture-payment', capturePayPalPayment);

/**
 * @route   GET /api/payments/subscription/:customerId
 * @desc    Get customer subscription details
 * @access  Public
 */
router.get('/subscription/:customerId', getSubscriptionDetails);

/**
 * @route   GET /api/payments
 * @desc    Get all payments with pagination and filtering
 * @access  Private (Admin and Super Admin only)
 */
router.get('/', authenticate, authorize(['admin', 'super_admin']), getAllPayments);

/**
 * @route   GET /api/payments/:id
 * @desc    Get a single payment by ID
 * @access  Private (Admin and Super Admin only)
 */
router.get('/:id', authenticate, authorize(['admin', 'super_admin']), getPaymentById);

/**
 * @route   POST /api/payments/update-status
 * @desc    Update payment status
 * @access  Public
 */
router.post('/update-status', updatePaymentStatus);

export default router;