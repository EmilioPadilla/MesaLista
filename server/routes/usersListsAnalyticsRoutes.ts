import express from 'express';
import usersListsAnalyticsController from '../controllers/usersListsAnalyticsController.js';
import { authenticateSession, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateSession);
router.use(requireAdmin);

// GET /api/admin/users-lists-analytics/summary - Get summary statistics
router.get('/summary', usersListsAnalyticsController.getSummary);

// GET /api/admin/users-lists-analytics/users - Get detailed users analytics
router.get('/users', usersListsAnalyticsController.getUsersAnalytics);

// GET /api/admin/users-lists-analytics/lists - Get detailed wedding lists analytics
router.get('/lists', usersListsAnalyticsController.getWeddingListsAnalytics);

// PATCH /api/admin/users-lists-analytics/lists/:id/visibility - Update isActive/isPublic flags
router.patch('/lists/:id/visibility', usersListsAnalyticsController.updateWeddingListVisibility);

export default router;
