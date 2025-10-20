import express from 'express';
import analyticsController from '../controllers/analyticsController.js';
import { authenticateSession } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { authenticateCron } from '../middleware/cronAuth.js';

const router = express.Router();

// Public endpoints for logging events and sessions
router.post('/events', analyticsController.logEvent);
router.post('/events/session', analyticsController.upsertSession);

// Admin-only endpoints
router.get('/admin/metrics/summary', authenticateSession, requireAdmin, analyticsController.getMetricsSummary);

router.get('/admin/metrics/time_series', authenticateSession, requireAdmin, analyticsController.getTimeSeries);

router.get('/admin/metrics/funnel_breakdown', authenticateSession, requireAdmin, analyticsController.getFunnelBreakdown);

router.get('/admin/metrics/alerts', authenticateSession, requireAdmin, analyticsController.getAlerts);

// Cron endpoints - can be triggered by GitHub Actions or admin users
router.post('/admin/metrics/aggregate', authenticateCron, analyticsController.aggregateDaily);

router.post('/admin/metrics/cleanup', authenticateCron, analyticsController.cleanup);

router.delete('/admin/metrics/user/:userId', authenticateSession, requireAdmin, analyticsController.deleteUserAnalytics);

export default router;
