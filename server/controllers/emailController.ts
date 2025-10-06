import { Request, Response } from 'express';
import emailService from '../services/emailService.js';

export default {
  /**
   * Resend payment confirmation emails to both admin and invitee
   * Sends both guest confirmation and owner notification emails
   */
  resendPaymentConfirmation: async (req: Request, res: Response) => {
    try {
      const { cartId } = req.body;

      if (!cartId) {
        return res.status(400).json({
          success: false,
          message: 'Cart ID is required',
        });
      }

      // Validate cartId is a number
      const parsedCartId = parseInt(cartId);
      if (isNaN(parsedCartId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart ID format',
        });
      }

      // Send payment emails using the same logic as payment processing
      await emailService.sendPaymentEmails(parsedCartId);

      res.json({
        success: true,
        message: 'Payment confirmation emails resent successfully to both admin and invitee',
      });
    } catch (error) {
      console.error('Error resending payment confirmation emails:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Cart or payment not found')) {
          return res.status(404).json({
            success: false,
            message: 'Payment not found for the specified cart',
          });
        }
        
        if (error.message.includes('No items found')) {
          return res.status(400).json({
            success: false,
            message: 'Cart has no items',
          });
        }
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to resend payment confirmation emails',
      });
    }
  },

  /**
   * Resend payment notification email to admin only
   * Sends only the owner notification email
   */
  resendPaymentToAdmin: async (req: Request, res: Response) => {
    try {
      const { cartId } = req.body;

      if (!cartId) {
        return res.status(400).json({
          success: false,
          message: 'Cart ID is required',
        });
      }

      // Validate cartId is a number
      const parsedCartId = parseInt(cartId);
      if (isNaN(parsedCartId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart ID format',
        });
      }

      // Get payment data and send only to owner
      const emailData = await emailService.getPaymentEmailData(parsedCartId);
      await emailService.sendPaymentNotificationToOwner(emailData);

      res.json({
        success: true,
        message: 'Payment notification email resent successfully to admin',
      });
    } catch (error) {
      console.error('Error resending payment notification to admin:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Cart or payment not found')) {
          return res.status(404).json({
            success: false,
            message: 'Payment not found for the specified cart',
          });
        }
        
        if (error.message.includes('No items found')) {
          return res.status(400).json({
            success: false,
            message: 'Cart has no items',
          });
        }
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to resend payment notification to admin',
      });
    }
  },

  /**
   * Resend payment confirmation email to invitee only
   * Sends only the guest confirmation email
   */
  resendPaymentToInvitee: async (req: Request, res: Response) => {
    try {
      const { cartId } = req.body;

      if (!cartId) {
        return res.status(400).json({
          success: false,
          message: 'Cart ID is required',
        });
      }

      // Validate cartId is a number
      const parsedCartId = parseInt(cartId);
      if (isNaN(parsedCartId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart ID format',
        });
      }

      // Get payment data and send only to guest
      const emailData = await emailService.getPaymentEmailData(parsedCartId);
      
      if (!emailData.guestEmail) {
        return res.status(400).json({
          success: false,
          message: 'Guest email not found in cart',
        });
      }

      await emailService.sendPaymentConfirmationToGuest(emailData);

      res.json({
        success: true,
        message: 'Payment confirmation email resent successfully to invitee',
      });
    } catch (error) {
      console.error('Error resending payment confirmation to invitee:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Cart or payment not found')) {
          return res.status(404).json({
            success: false,
            message: 'Payment not found for the specified cart',
          });
        }
        
        if (error.message.includes('No items found')) {
          return res.status(400).json({
            success: false,
            message: 'Cart has no items',
          });
        }
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to resend payment confirmation to invitee',
      });
    }
  },

  /**
   * Send contact form email
   * Sends contact form submission to admin
   */
  sendContactForm: async (req: Request, res: Response) => {
    try {
      const { name, email, phone, subject, message } = req.body;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, subject, and message are required',
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }

      // Send contact form email
      await emailService.sendContactFormEmail({
        name,
        email,
        phone,
        subject,
        message,
      });

      res.json({
        success: true,
        message: 'Contact form submitted successfully',
      });
    } catch (error) {
      console.error('Error sending contact form email:', error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send contact form',
      });
    }
  },
};
