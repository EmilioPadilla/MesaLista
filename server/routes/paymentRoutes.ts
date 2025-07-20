import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/initiate', paymentController.initiatePayment);

router.post('/verify', paymentController.verifyPayment);

router.get('/:id/summary', paymentController.getPaymentSummary);

router.get('/', authenticateToken, paymentController.getAllPayments);

export default router;
