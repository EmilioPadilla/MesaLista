import { Router } from 'express';
import emailController from '../controllers/emailController.js';

const router = Router();

/**
 * @route   POST /api/email/resend-payment-confirmation
 * @desc    Resend payment confirmation emails for a specific cart
 * @access  Public (could be protected if needed)
 */
router.post('/resend-payment-confirmation', emailController.resendPaymentConfirmation);

export default router;
