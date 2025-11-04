import express from 'express';
import { rsvpController } from '../controllers/rsvpController.js';
import { authenticateSession } from '../middleware/auth.js';

const router = express.Router();

// Public routes (for guests)
router.get('/invitee/:secretCode', rsvpController.getInviteeByCode);
router.post('/respond/:secretCode', rsvpController.respondToRsvp);
router.get('/messages/:coupleId', rsvpController.getRsvpMessages);

// Protected routes (for authenticated couples)
router.get('/invitees', authenticateSession, rsvpController.getInvitees);
router.post('/invitees', authenticateSession, rsvpController.createInvitee);
router.post('/invitees/bulk', authenticateSession, rsvpController.bulkCreateInvitees);
router.put('/invitees/:id', authenticateSession, rsvpController.updateInvitee);
router.delete('/invitees/:id', authenticateSession, rsvpController.deleteInvitee);
router.post('/invitees/bulk-delete', authenticateSession, rsvpController.bulkDeleteInvitees);
router.post('/invitees/bulk-update-status', authenticateSession, rsvpController.bulkUpdateInviteeStatus);
router.get('/stats', authenticateSession, rsvpController.getRsvpStats);
router.put('/messages', authenticateSession, rsvpController.updateRsvpMessages);

export default router;
