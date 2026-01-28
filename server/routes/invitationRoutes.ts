import express from 'express';
import { invitationController } from '../controllers/invitationController.js';
import { authenticateSession } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/gift-list/:giftListId/public', invitationController.getByGiftListIdPublic);

// Protected routes (require authentication)
router.get('/gift-list/:giftListId', authenticateSession, invitationController.getByGiftListId);
router.post('/', authenticateSession, invitationController.create);
router.put('/:id', authenticateSession, invitationController.update);
router.post('/:id/publish', authenticateSession, invitationController.publish);
router.delete('/:id', authenticateSession, invitationController.delete);

export default router;
