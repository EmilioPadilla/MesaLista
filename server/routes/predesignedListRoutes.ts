import express from 'express';
import { predesignedListController } from '../controllers/predesignedListController.js';
import { authenticateSession } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Public routes - anyone can view active predesigned lists
router.get('/', predesignedListController.getAllPredesignedLists);
router.get('/:id', predesignedListController.getPredesignedListById);

// Protected route - add predesigned gift to wedding list (authenticated users)
router.post('/:giftId/add-to-wedding-list', authenticateSession, predesignedListController.addGiftToWeddingList);

// Admin-only routes for predesigned lists
router.get('/admin/all', authenticateSession, requireAdmin, predesignedListController.getAllPredesignedListsAdmin);
router.post('/admin', authenticateSession, requireAdmin, predesignedListController.createPredesignedList);
router.put('/admin/:id', authenticateSession, requireAdmin, predesignedListController.updatePredesignedList);
router.delete('/admin/:id', authenticateSession, requireAdmin, predesignedListController.deletePredesignedList);
router.post('/admin/reorder', authenticateSession, requireAdmin, predesignedListController.reorderPredesignedLists);

// Admin-only routes for predesigned gifts
router.post('/admin/:listId/gifts', authenticateSession, requireAdmin, predesignedListController.createPredesignedGift);
router.put('/admin/gifts/:giftId', authenticateSession, requireAdmin, predesignedListController.updatePredesignedGift);
router.delete('/admin/gifts/:giftId', authenticateSession, requireAdmin, predesignedListController.deletePredesignedGift);
router.post('/admin/gifts/reorder', authenticateSession, requireAdmin, predesignedListController.reorderPredesignedGifts);

export default router;
