import { Request, Response } from 'express';
import emailService from '../services/emailService.js';

export default {
  /**
   * Send marketing email to a specific user
   */
  sendMarketingEmail: async (req: Request, res: Response) => {
    try {
      const { userId, emailType } = req.body;

      if (!userId || !emailType) {
        return res.status(400).json({
          success: false,
          message: 'User ID and email type are required',
        });
      }

      // Validate userId is a number
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format',
        });
      }

      // Validate email type
      const validEmailTypes = [1, 2, 3, 4, 'inactive_warning'];
      if (!validEmailTypes.includes(emailType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email type',
        });
      }

      // Send the appropriate marketing email
      if (emailType === 'inactive_warning') {
        await emailService.sendInactiveUserWarning(parsedUserId);
      } else {
        // For email types 1-4, we'll need to implement these in the future
        // For now, return a not implemented error
        return res.status(501).json({
          success: false,
          message: `Email type ${emailType} is not yet implemented. Only 'inactive_warning' is currently supported.`,
        });
      }

      res.json({
        success: true,
        message: 'Marketing email sent successfully',
      });
    } catch (error) {
      console.error('Error sending marketing email:', error);

      if (error instanceof Error) {
        if (error.message.includes('User not found')) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to send marketing email',
      });
    }
  },

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

  /**
   * Get list of users with specified plan types
   * Admin only endpoint
   * Query params: planTypes (optional) - comma-separated list of plan types (COMMISSION, FIXED)
   */
  getCommissionUsers: async (req: Request, res: Response) => {
    try {
      const planTypesParam = req.query.planTypes as string | undefined;
      let planTypes: ('COMMISSION' | 'FIXED')[] = ['COMMISSION'];

      if (planTypesParam) {
        const parsed = planTypesParam.split(',').filter((pt) => pt === 'COMMISSION' || pt === 'FIXED') as ('COMMISSION' | 'FIXED')[];
        if (parsed.length > 0) planTypes = parsed;
      }

      const users = await emailService.getCommissionUsers(planTypes);

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Error getting commission users:', error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get commission users',
      });
    }
  },

  /**
   * Send marketing email to selected users
   * Admin only endpoint
   */
  sendMarketingEmailToSelectedUsers: async (req: Request, res: Response) => {
    try {
      const { emailType, userIds } = req.body;

      if (!emailType || !userIds || !Array.isArray(userIds)) {
        return res.status(400).json({
          success: false,
          message: 'Email type and user IDs array are required',
        });
      }

      const validEmailTypes = [1, 2, 3, 4, 'inactive_warning'];
      if (!validEmailTypes.includes(emailType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Must be 1, 2, 3, 4, or inactive_warning',
        });
      }

      if (userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one user ID is required',
        });
      }

      const result = await emailService.sendMarketingEmailToSelectedUsers(emailType, userIds);

      res.json({
        success: true,
        message: `Marketing Email ${emailType} sent to selected users: ${result.sent} sent, ${result.failed} failed`,
        data: result,
      });
    } catch (error) {
      console.error('Error sending marketing email to selected users:', error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send marketing email to selected users',
      });
    }
  },

  /**
   * Send marketing email to selected leads (signup emails)
   * Admin only endpoint
   */
  sendMarketingEmailToLeads: async (req: Request, res: Response) => {
    try {
      const { emailType, leads } = req.body;

      if (!emailType || !leads || !Array.isArray(leads)) {
        return res.status(400).json({
          success: false,
          message: 'Email type and leads array are required',
        });
      }

      const validEmailTypes = [1, 2, 3, 4, 'inactive_warning'];
      if (!validEmailTypes.includes(emailType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Must be 1, 2, 3, 4, or inactive_warning',
        });
      }

      if (leads.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one lead is required',
        });
      }

      const result = await emailService.sendMarketingEmailToLeads(emailType, leads);

      res.json({
        success: true,
        message: `Marketing Email ${emailType} sent to leads: ${result.sent} sent, ${result.failed} failed`,
        data: result,
      });
    } catch (error) {
      console.error('Error sending marketing email to leads:', error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send marketing email to leads',
      });
    }
  },

  /**
   * Get marketing email preview
   * Admin only endpoint
   */
  getMarketingEmailPreview: async (req: Request, res: Response) => {
    try {
      const { emailType, userId } = req.query;

      if (!emailType || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Email type and user ID are required',
        });
      }

      const userIdNum = parseInt(userId as string);

      if (isNaN(userIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
      }

      // Parse email type - can be number or string
      const parsedEmailType = isNaN(Number(emailType)) ? emailType : Number(emailType);
      const validEmailTypes = [1, 2, 3, 4, 'inactive_warning'];

      if (!validEmailTypes.includes(parsedEmailType as any)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Must be 1, 2, 3, 4, or inactive_warning',
        });
      }

      const preview = await emailService.getMarketingEmailPreview(parsedEmailType as any, userIdNum);

      res.json({
        success: true,
        data: preview,
      });
    } catch (error) {
      console.error('Error getting marketing email preview:', error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get marketing email preview',
      });
    }
  },
};
