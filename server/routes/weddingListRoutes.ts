import express from 'express';
import weddingListController from '../controllers/weddingListController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all gift routes
router.use(authenticateToken);

router.get('/', weddingListController.getAllWeddingLists);

router.get('/:coupleId', weddingListController.getWeddingListByCouple);

router.post('/', weddingListController.createWeddingList);

router.put('/:weddingListId', weddingListController.updateWeddingList);

router.get('/:weddingListId/gifts', weddingListController.getGiftsByWeddingList);

router.get('/:weddingListId/wedding-list-by-category', weddingListController.getCategoriesInWeddingList);

router.put('/:weddingListId/reorder', weddingListController.reorderGiftsInWeddingList);

export default router;
