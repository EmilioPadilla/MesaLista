import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticateSession } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-checkout-session', paymentController.createCheckoutSession);

router.get('/:id/summary', paymentController.getPaymentSummary);

router.get('/', authenticateSession, paymentController.getAllPayments);

export default router;
