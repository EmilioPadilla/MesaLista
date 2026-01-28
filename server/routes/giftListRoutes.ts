import express from 'express';
import giftListController from '../controllers/giftListController.js';
import { authenticateSession } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', giftListController.getAllGiftLists);
router.get('/by-slug/:slug', giftListController.getFirstGiftListByUserSlug);
router.get('/:giftListId', giftListController.getGiftListById);
router.get('/:giftListId/categories', giftListController.getCategoriesInGiftList);
router.get('/:giftListId/gifts', giftListController.getGiftsByGiftList);

// Authenticated routes
router.use(authenticateSession);

router.get('/user/:userId', giftListController.getGiftListsByUser);
router.post('/', giftListController.createGiftList);
router.put('/:giftListId', giftListController.updateGiftList);
router.delete('/:giftListId', giftListController.deleteGiftList);
router.put('/:giftListId/reorder', giftListController.reorderGiftsInGiftList);

export default router;
