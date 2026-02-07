import { Request, Response } from 'express';
import { signupEmailService } from '../services/signupEmailService.js';

const signupEmailController = {
  /**
   * POST /api/signup-emails
   * Public - Save email from signup attempt
   */
  async saveFromSignup(req: Request, res: Response) {
    try {
      const { email, firstName, lastName, phone } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const result = await signupEmailService.saveFromSignup({ email, firstName, lastName, phone });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error('Error saving signup email:', error);
      res.status(500).json({ error: 'Error saving signup email' });
    }
  },

  /**
   * GET /api/signup-emails
   * Admin only - Get all signup emails
   */
  async getAll(req: Request, res: Response) {
    try {
      const emails = await signupEmailService.getAll();
      res.json({ success: true, data: emails });
    } catch (error) {
      console.error('Error fetching signup emails:', error);
      res.status(500).json({ error: 'Error fetching signup emails' });
    }
  },

  /**
   * POST /api/signup-emails/manual
   * Admin only - Add email manually
   */
  async addManual(req: Request, res: Response) {
    try {
      const { email, firstName, lastName } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const result = await signupEmailService.addManual({ email, firstName, lastName });

      if (!result.created) {
        return res.status(409).json({ success: false, message: 'Email already exists', data: result.signupEmail });
      }

      res.status(201).json({ success: true, data: result.signupEmail });
    } catch (error) {
      console.error('Error adding manual email:', error);
      res.status(500).json({ error: 'Error adding email' });
    }
  },

  /**
   * DELETE /api/signup-emails/:id
   * Admin only - Delete a signup email
   */
  async deleteById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await signupEmailService.deleteById(parseInt(id));
      res.json({ success: true, message: 'Email deleted' });
    } catch (error) {
      console.error('Error deleting signup email:', error);
      res.status(500).json({ error: 'Error deleting email' });
    }
  },

  /**
   * POST /api/signup-emails/mark-converted
   * Internal - Mark email as converted to user
   */
  async markAsConverted(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      await signupEmailService.markAsConverted(email);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking email as converted:', error);
      res.status(500).json({ error: 'Error marking email as converted' });
    }
  },
};

export default signupEmailController;
