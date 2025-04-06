import { Request, Response } from 'express';
import Customer from '../models/Customer';
import Payment from '../models/Payment';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// PayPal SDK setup
import paypal from '@paypal/checkout-server-sdk';

// Configure PayPal environment
const environment = process.env.PAYPAL_MODE === 'production'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!);

const client = new paypal.core.PayPalHttpClient(environment);

/**
 * Create a PayPal order for subscription payment
 * @route POST /api/payments/create-order
 */
export const createPayPalOrder = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    // Find customer to get subscription amount
    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Create a PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: customer.subscriptionAmount.toString()
        },
        description: `Subscription payment for ${customer.companyName}`
      }]
    });

    // Execute the request
    const order = await client.execute(request);

    // Create initial payment record
    const payment = await Payment.create({
      customerId,
      companyName: customer.companyName,
      subscribedApp: customer.subscribedApp || 'default',
      orderId: order.result.id,
      amount: customer.subscriptionAmount,
      currency: 'USD',
      status: 'pending',
      paymentDate: new Date(),
      description: `Subscription payment for ${customer.companyName}`
    });

    // Return the order ID to the client
    res.status(200).json({
      orderId: order.result.id,
      subscriptionAmount: customer.subscriptionAmount,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ message: 'Error creating PayPal order' });
  }
};

/**
 * Capture a PayPal payment after approval
 * @route POST /api/payments/capture-payment
 */
export const capturePayPalPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, customerId } = req.body;

    if (!orderId || !customerId) {
      return res.status(400).json({ message: 'Order ID and Customer ID are required' });
    }

    // Find customer
    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Create capture request
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    // Execute the capture request
    const capture = await client.execute(request);

    // Get the capture ID (payment ID)
    const captureId = capture.result.purchase_units[0].payments.captures[0].id;
    const amount = parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value);

    // Calculate new subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + customer.subscriptionDuration);

    // Update customer with new subscription dates, payment ID, and subscription status
    const updatedCustomer = await Customer.findOneAndUpdate(
      { customerId },
      {
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        paymentId: captureId,
        isSubscribed: true
      },
      { new: true }
    );

    // Update existing payment record
    const payment = await Payment.findOneAndUpdate(
      { orderId },
      {
        paymentId: captureId,
        amount,
        status: 'completed',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Return success response with payment details
    res.status(200).json({
      success: true,
      message: 'Payment successful',
      paymentId: captureId,
      payment: {
        amount,
        currency: payment.currency,
        status: payment.status,
        paymentDate: payment.paymentDate
      },
      customer: {
        customerId: updatedCustomer?.customerId,
        companyName: updatedCustomer?.companyName,
        subscriptionStartDate: updatedCustomer?.subscriptionStartDate,
        subscriptionEndDate: updatedCustomer?.subscriptionEndDate
      }
    });
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    res.status(500).json({ message: 'Error capturing payment' });
  }
};

/**
 * Get customer subscription details
 * @route GET /api/payments/subscription/:customerId
 */
export const getSubscriptionDetails = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    // Find customer
    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Return subscription details
    res.status(200).json({
      customerId: customer.customerId,
      companyName: customer.companyName,
      subscriptionAmount: customer.subscriptionAmount,
      subscriptionDuration: customer.subscriptionDuration,
      subscriptionStartDate: customer.subscriptionStartDate,
      subscriptionEndDate: customer.subscriptionEndDate,
      status: customer.status
    });
  } catch (error) {
    console.error('Error getting subscription details:', error);
    res.status(500).json({ message: 'Error retrieving subscription details' });
  }
};

/**
 * Get all payments with pagination and filtering
 * @route GET /api/payments
 */
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;

    const query: any = {};

    // Add filters if provided
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Payment.countDocuments(query);

    // Get paginated payments
    const payments = await Payment.find(query)
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({ message: 'Error retrieving payments' });
  }
};

/**
 * Get a single payment by ID
 * @route GET /api/payments/:id
 */
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid payment ID' });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({ message: 'Error retrieving payment' });
  }
};