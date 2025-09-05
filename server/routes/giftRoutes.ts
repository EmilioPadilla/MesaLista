import express from 'express';
import giftController from '../controllers/giftController.js';
import { authenticateSession } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', giftController.getGiftById);

// Apply authentication middleware to all gift routes
router.use(authenticateSession);

router.post('/', giftController.createGift);

router.put('/:id', giftController.updateGift);

router.delete('/:id', giftController.deleteGift);

export default router;
