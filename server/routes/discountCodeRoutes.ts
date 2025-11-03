import express from 'express';
import { discountCodeController } from '../controllers/discountCodeController.js';
import { authenticateSession } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Public route - validate discount code during signup
router.get('/validate/:code', discountCodeController.validateDiscountCode);

// Admin-only routes
router.get('/admin/all', authenticateSession, requireAdmin, discountCodeController.getAllDiscountCodes);
router.get('/admin/:id/stats', authenticateSession, requireAdmin, discountCodeController.getDiscountCodeStats);
router.post('/admin', authenticateSession, requireAdmin, discountCodeController.createDiscountCode);
router.put('/admin/:id', authenticateSession, requireAdmin, discountCodeController.updateDiscountCode);
router.delete('/admin/:id', authenticateSession, requireAdmin, discountCodeController.deleteDiscountCode);

export default router;
