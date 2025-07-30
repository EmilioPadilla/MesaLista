import express from 'express';
import weddingListController from '../controllers/weddingListController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public route: get wedding list by couple ID (no authentication)
router.get('/:coupleId', weddingListController.getWeddingListByCouple);

// Public route: get wedding list by couple slug (no authentication)
router.get('/slug/:coupleSlug', weddingListController.getWeddingListBySlug);

router.get('/:weddingListId/wedding-list-by-category', weddingListController.getCategoriesInWeddingList);

// Apply authentication middleware to all subsequent routes
router.use(authenticateToken);

router.get('/', weddingListController.getAllWeddingLists);

router.post('/', weddingListController.createWeddingList);

router.put('/:weddingListId', weddingListController.updateWeddingList);

router.get('/:weddingListId/gifts', weddingListController.getGiftsByWeddingList);

router.put('/:weddingListId/reorder', weddingListController.reorderGiftsInWeddingList);

export default router;
