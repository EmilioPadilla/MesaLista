import express from 'express';
import weddingListController from '../controllers/weddingListController.js';
import { authenticateSession } from '../middleware/auth.js';

const router = express.Router();

// Public route: get wedding list by couple ID (no authentication)
router.get('/:coupleId', weddingListController.getWeddingListByCouple);

// Public route: get wedding list by couple slug (no authentication)
router.get('/slug/:coupleSlug', weddingListController.getWeddingListBySlug);

router.get('/:weddingListId/wedding-list-by-category', weddingListController.getCategoriesInWeddingList);

router.get('/', weddingListController.getAllWeddingLists);

// Apply authentication middleware to all subsequent routes
router.use(authenticateSession);

router.post('/', weddingListController.createWeddingList);

router.put('/:weddingListId', weddingListController.updateWeddingList);

router.get('/:weddingListId/gifts', weddingListController.getGiftsByWeddingList);

router.put('/:weddingListId/reorder', weddingListController.reorderGiftsInWeddingList);

export default router;
