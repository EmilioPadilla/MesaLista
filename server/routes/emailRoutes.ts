import { Router } from 'express';
import emailController from '../controllers/emailController.js';
import { authenticateSession } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

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

/**
 * @route   POST /api/email/marketing/email1
 * @desc    Send Marketing Email 1 (Welcome & Features) to all commission-based users
 * @access  Admin only
 */
router.post('/marketing/email1', authenticateSession, requireAdmin, emailController.sendMarketingEmail1);

/**
 * @route   POST /api/email/marketing/email2
 * @desc    Send Marketing Email 2 (Quick Start Guide) to all commission-based users
 * @access  Admin only
 */
router.post('/marketing/email2', authenticateSession, requireAdmin, emailController.sendMarketingEmail2);

/**
 * @route   POST /api/email/marketing/email3
 * @desc    Send Marketing Email 3 (Social Proof) to all commission-based users
 * @access  Admin only
 */
router.post('/marketing/email3', authenticateSession, requireAdmin, emailController.sendMarketingEmail3);

/**
 * @route   POST /api/email/marketing/email4
 * @desc    Send Marketing Email 4 (Re-engagement) to all commission-based users
 * @access  Admin only
 */
router.post('/marketing/email4', authenticateSession, requireAdmin, emailController.sendMarketingEmail4);

/**
 * @route   GET /api/email/marketing/commission-users
 * @desc    Get list of commission-based users
 * @access  Admin only
 */
router.get('/marketing/commission-users', authenticateSession, requireAdmin, emailController.getCommissionUsers);

/**
 * @route   POST /api/email/marketing/send-to-selected
 * @desc    Send marketing email to selected users
 * @access  Admin only
 */
router.post('/marketing/send-to-selected', authenticateSession, requireAdmin, emailController.sendMarketingEmailToSelectedUsers);

/**
 * @route   POST /api/email/marketing/send-to-leads
 * @desc    Send marketing email to selected leads (signup emails)
 * @access  Admin only
 */
router.post('/marketing/send-to-leads', authenticateSession, requireAdmin, emailController.sendMarketingEmailToLeads);

/**
 * @route   GET /api/email/marketing/preview
 * @desc    Get marketing email preview
 * @access  Admin only
 */
router.get('/marketing/preview', authenticateSession, requireAdmin, emailController.getMarketingEmailPreview);

export default router;
