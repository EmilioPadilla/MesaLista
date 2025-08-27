import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';
import bodyParser from 'body-parser';

const router = express.Router();

// Stripe webhook route with raw body parser
router.post('/stripe-payment-intent', bodyParser.raw({ type: 'application/json' }), paymentController.handleStripePaymentIntent);

router.post('/create-checkout-session', paymentController.createCheckoutSession);

router.get('/:id/summary', paymentController.getPaymentSummary);

router.get('/', authenticateToken, paymentController.getAllPayments);

export default router;
