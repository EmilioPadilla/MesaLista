import express from 'express';
import analyticsController from '../controllers/analyticsController.js';
import { authenticateSession } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Public endpoint for logging events
router.post('/events', analyticsController.logEvent);

// Admin-only endpoints
router.get('/admin/metrics/summary', authenticateSession, requireAdmin, analyticsController.getMetricsSummary);

router.get('/admin/metrics/time_series', authenticateSession, requireAdmin, analyticsController.getTimeSeries);

router.post('/admin/metrics/aggregate', authenticateSession, requireAdmin, analyticsController.aggregateDaily);

router.post('/admin/metrics/cleanup', authenticateSession, requireAdmin, analyticsController.cleanup);

export default router;
