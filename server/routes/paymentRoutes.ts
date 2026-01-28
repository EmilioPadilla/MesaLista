import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticateSession } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-checkout-session', paymentController.createCheckoutSession);

router.post('/create-plan-checkout-session', paymentController.createPlanCheckoutSession);

router.post('/create-gift-list-checkout-session', authenticateSession, paymentController.createGiftListCheckoutSession);

router.post('/cancel-payment', paymentController.handlePaymentCancellation);

router.get('/:id/summary', paymentController.getPaymentSummary);

router.get('/', authenticateSession, paymentController.getAllPayments);

router.get('/wedding-list/:weddingListId/purchased-gifts', authenticateSession, paymentController.getPurchasedGiftsByWeddingList);

export default router;
