import { Router } from 'express';
import emailController from '../controllers/emailController.js';

const router = Router();

/**
 * @route   POST /api/email/resend-payment-confirmation
 * @desc    Resend payment confirmation emails to both admin and invitee
 * @access  Public (could be protected if needed)
 */
router.post('/resend-payment-confirmation', emailController.resendPaymentConfirmation);

/**
 * @route   POST /api/email/resend-payment-to-admin
 * @desc    Resend payment notification email to admin only
 * @access  Public (could be protected if needed)
 */
router.post('/resend-payment-to-admin', emailController.resendPaymentToAdmin);

/**
 * @route   POST /api/email/resend-payment-to-invitee
 * @desc    Resend payment confirmation email to invitee only
 * @access  Public (could be protected if needed)
 */
router.post('/resend-payment-to-invitee', emailController.resendPaymentToInvitee);

/**
 * @route   POST /api/email/contact
 * @desc    Send contact form email
 * @access  Public
 */
router.post('/contact', emailController.sendContactForm);

export default router;
