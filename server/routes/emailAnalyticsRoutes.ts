import { Router } from 'express';
import emailAnalyticsController from '../controllers/emailAnalyticsController.js';
import { authenticateSession } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// Public webhook endpoint (no auth required - Postmark will call this)
router.post('/webhooks/postmark', emailAnalyticsController.handlePostmarkWebhook);

// Admin-only analytics endpoints
router.get('/admin/email-analytics/summary', authenticateSession, requireAdmin, emailAnalyticsController.getAnalyticsSummary);
router.get('/admin/email-analytics/time-series', authenticateSession, requireAdmin, emailAnalyticsController.getTimeSeries);
router.get('/admin/email-analytics/by-tag', authenticateSession, requireAdmin, emailAnalyticsController.getAnalyticsByTag);
router.get('/admin/email-analytics/issues', authenticateSession, requireAdmin, emailAnalyticsController.getRecentIssues);
router.post('/admin/email-analytics/aggregate', authenticateSession, requireAdmin, emailAnalyticsController.aggregateDailyMetrics);

export default router;
