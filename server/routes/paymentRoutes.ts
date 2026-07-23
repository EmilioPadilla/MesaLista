import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticateSession } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-checkout-session', paymentController.createCheckoutSession);

router.post('/create-plan-checkout-session', paymentController.createPlanCheckoutSession);

router.post('/complete-plan-signup-session', paymentController.completePlanSignupSession);

// iOS fixed-plan In-App Purchase (RevenueCat) — prepare stashes the signup,
// complete provisions after entitlement verification, webhook is the backstop.
router.post('/plan/ios/prepare', paymentController.preparePlanIapSignup);

router.post('/plan/ios/complete', paymentController.completePlanIapSignup);

router.post('/revenuecat/webhook', paymentController.handleRevenueCatWebhook);

router.post('/create-gift-list-checkout-session', authenticateSession, paymentController.createGiftListCheckoutSession);

router.post('/cancel-payment', paymentController.handlePaymentCancellation);

// Bridges hosted-checkout returns back into the native app via deep link.
router.get('/mobile-return', paymentController.handleMobileReturn);

router.get('/:id/summary', paymentController.getPaymentSummary);

router.get('/', authenticateSession, paymentController.getAllPayments);

router.get('/wedding-list/:weddingListId/purchased-gifts', authenticateSession, paymentController.getPurchasedGiftsByWeddingList);

export default router;
