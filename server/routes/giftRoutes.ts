import express from 'express';
import giftController from '../controllers/giftController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all gift routes
router.use(authenticateToken);

router.get('/:id', giftController.getGiftById);

router.post('/', giftController.createGift);

router.put('/:id', giftController.updateGift);

router.delete('/:id', giftController.deleteGift);

router.post('/purchase/:giftId', giftController.purchaseGift);

router.patch('/purchases/:purchaseId', giftController.updatePurchaseStatus);

router.get('/purchased/:coupleId', giftController.getPurchasedGifts);

router.get('/user-purchases/:userId', giftController.getUserPurchases);

export default router;
