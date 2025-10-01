import { Request, Response } from 'express';
import emailService from '../services/emailService.js';

export default {
  /**
   * Resend payment confirmation emails
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
        message: 'Payment confirmation emails resent successfully',
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
};
