import express from 'express';
import giftListController from '../controllers/giftListController.js';
import { authenticateSession, optionalAuthenticateSession } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required).
// `optionalAuthenticateSession` populates req.user when a session cookie is
// present without rejecting anonymous guests: the controllers use it so a couple
// can preview their own unpublished draft while everyone else gets a 404.
router.get('/', giftListController.getAllGiftLists);
router.get('/by-slug/:slug', optionalAuthenticateSession, giftListController.getFirstGiftListByUserSlug);
router.get('/:giftListId', optionalAuthenticateSession, giftListController.getGiftListById);
router.get('/:giftListId/categories', optionalAuthenticateSession, giftListController.getCategoriesInGiftList);
router.get('/:giftListId/gifts', optionalAuthenticateSession, giftListController.getGiftsByGiftList);

// Authenticated routes
router.use(authenticateSession);

router.get('/user/:userId', giftListController.getGiftListsByUser);
router.post('/', giftListController.createGiftList);
router.post('/:giftListId/publish', giftListController.publishGiftList);
router.put('/:giftListId', giftListController.updateGiftList);
router.delete('/:giftListId', giftListController.deleteGiftList);
router.put('/:giftListId/reorder', giftListController.reorderGiftsInGiftList);

export default router;
