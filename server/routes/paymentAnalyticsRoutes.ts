import express from 'express';
import paymentAnalyticsController from '../controllers/paymentAnalyticsController.js';
import { authenticateSession, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateSession);
router.use(requireAdmin);

// GET /api/admin/payment-analytics/summary - Get payment analytics summary
router.get('/summary', paymentAnalyticsController.getPaymentAnalyticsSummary);

// GET /api/admin/payment-analytics/lists - Get detailed payment analytics for all gift lists
router.get('/lists', paymentAnalyticsController.getGiftListsPaymentAnalytics);

export default router;
