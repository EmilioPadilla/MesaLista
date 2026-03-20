import { Request, Response } from 'express';
import paymentAnalyticsService from '../services/paymentAnalyticsService.js';

export default {
  /**
   * Get payment analytics for all gift lists
   * GET /api/admin/payment-analytics/lists
   */
  getGiftListsPaymentAnalytics: async (_req: Request, res: Response) => {
    try {
      const analytics = await paymentAnalyticsService.getGiftListsPaymentAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching gift lists payment analytics:', error);
      res.status(500).json({ error: 'Failed to fetch payment analytics' });
    }
  },

  /**
   * Get payment analytics summary
   * GET /api/admin/payment-analytics/summary
   */
  getPaymentAnalyticsSummary: async (_req: Request, res: Response) => {
    try {
      const summary = await paymentAnalyticsService.getPaymentAnalyticsSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching payment analytics summary:', error);
      res.status(500).json({ error: 'Failed to fetch payment analytics summary' });
    }
  },
};
