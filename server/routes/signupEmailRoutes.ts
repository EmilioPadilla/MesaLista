import { Router } from 'express';
import signupEmailController from '../controllers/signupEmailController.js';
import { authenticateSession } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

/**
 * @route   POST /api/signup-emails
 * @desc    Save email from signup attempt
 * @access  Public
 */
router.post('/', signupEmailController.saveFromSignup);

/**
 * @route   GET /api/signup-emails
 * @desc    Get all signup emails
 * @access  Admin only
 */
router.get('/', authenticateSession, requireAdmin, signupEmailController.getAll);

/**
 * @route   POST /api/signup-emails/manual
 * @desc    Add email manually
 * @access  Admin only
 */
router.post('/manual', authenticateSession, requireAdmin, signupEmailController.addManual);

/**
 * @route   DELETE /api/signup-emails/:id
 * @desc    Delete a signup email
 * @access  Admin only
 */
router.delete('/:id', authenticateSession, requireAdmin, signupEmailController.deleteById);

/**
 * @route   POST /api/signup-emails/mark-converted
 * @desc    Mark email as converted to user
 * @access  Admin only
 */
router.post('/mark-converted', authenticateSession, requireAdmin, signupEmailController.markAsConverted);

export default router;
