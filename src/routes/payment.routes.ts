import express from 'express';
import { createPayPalOrder, capturePayPalPayment, getSubscriptionDetails } from '../controllers/payment.controller';

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

export default router;