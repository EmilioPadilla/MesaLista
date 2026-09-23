import express from 'express';
import eventCalendarController from '../controllers/eventCalendarController.js';
import { authenticateSession, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateSession);
router.use(requireAdmin);

// GET /api/admin/event-calendar - Every event with collected money and logged actions
router.get('/', eventCalendarController.getCalendar);

// PUT /api/admin/event-calendar/:giftListId/actions/:action - Mark done/skipped
router.put('/:giftListId/actions/:action', eventCalendarController.logAction);

// DELETE /api/admin/event-calendar/:giftListId/actions/:action - Undo, back to pending
router.delete('/:giftListId/actions/:action', eventCalendarController.clearAction);

// POST /api/admin/event-calendar/:giftListId/actions/:action/send - Send the action's email and log it
router.post('/:giftListId/actions/:action/send', eventCalendarController.sendActionEmail);

export default router;
