import { Router } from 'express';
import emailVerificationController from '../controllers/emailVerificationController.js';

const router = Router();

/**
 * @route   POST /api/email-verification/send
 * @desc    Send verification code to email
 * @access  Public
 */
router.post('/send', emailVerificationController.sendVerificationCode);

/**
 * @route   POST /api/email-verification/verify
 * @desc    Verify email with code
 * @access  Public
 */
router.post('/verify', emailVerificationController.verifyCode);

/**
 * @route   GET /api/email-verification/check/:email
 * @desc    Check if email was recently verified
 * @access  Public
 */
router.get('/check/:email', emailVerificationController.checkEmailVerified);

export default router;
