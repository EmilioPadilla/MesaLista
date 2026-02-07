import { Request, Response } from 'express';
import emailVerificationService from '../services/emailVerificationService.js';
import emailService from '../services/emailService.js';
import { signupEmailService } from '../services/signupEmailService.js';

export const emailVerificationController = {
  /**
   * Send verification code to email
   * POST /api/email-verification/send
   */
  sendVerificationCode: async (req: Request, res: Response) => {
    const { email, firstName, lastName, phone } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
      // Silently save signup email for marketing (fire-and-forget)
      signupEmailService.saveFromSignup({ email, firstName, lastName, phone }).catch(() => {});

      // Generate verification code
      const code = await emailVerificationService.createVerificationCode(email);

      // Send email with verification code
      await emailService.sendVerificationCodeEmail(email, code);

      res.json({
        success: true,
        message: 'Código de verificación enviado exitosamente',
      });
    } catch (error: unknown) {
      console.error('Error sending verification code:', error);
      res.status(500).json({ error: 'Error al enviar el código de verificación' });
    }
  },

  /**
   * Verify email with code
   * POST /api/email-verification/verify
   */
  verifyCode: async (req: Request, res: Response) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    try {
      const result = await emailVerificationService.verifyCode(email, code);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.message,
        });
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: unknown) {
      console.error('Error verifying code:', error);
      res.status(500).json({ error: 'Error al verificar el código' });
    }
  },

  /**
   * Check if email was recently verified
   * GET /api/email-verification/check/:email
   */
  checkEmailVerified: async (req: Request, res: Response) => {
    try {
      const { email } = req.params;

      if (Array.isArray(email)) {
        return res.status(400).json({ message: 'Invalid email' });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const isVerified = await emailVerificationService.isEmailRecentlyVerified(email);

      res.json({
        verified: isVerified,
      });
    } catch (error: unknown) {
      console.error('Error checking verification status:', error);
      res.status(500).json({ error: 'Error al verificar el estado' });
    }
  },
};

export default emailVerificationController;
