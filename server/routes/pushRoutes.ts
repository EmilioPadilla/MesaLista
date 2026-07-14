import { Router } from 'express';
import pushController from '../controllers/pushController.js';
import { authenticateSession } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/push/register
 * @desc    Register (upsert) the current device's Expo push token for the user
 * @access  Authenticated
 */
router.post('/register', authenticateSession, pushController.registerToken);

/**
 * @route   POST /api/push/unregister
 * @desc    Unregister the current device's Expo push token (on logout)
 * @access  Authenticated
 */
router.post('/unregister', authenticateSession, pushController.unregisterToken);

export default router;
