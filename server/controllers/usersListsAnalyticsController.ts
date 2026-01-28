import { Request, Response } from 'express';
import usersListsAnalyticsService from '../services/usersListsAnalyticsService.js';

export default {
  /**
   * Get summary statistics for users and wedding lists
   * GET /api/admin/users-lists-analytics/summary
   */
  getSummary: async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;

      const summary = await usersListsAnalyticsService.getSummary(from as string | undefined, to as string | undefined);

      res.json(summary);
    } catch (error) {
      console.error('Error fetching users/lists summary:', error);
      res.status(500).json({ error: 'Failed to fetch summary' });
    }
  },

  /**
   * Get detailed analytics for all users with their wedding lists
   * GET /api/admin/users-lists-analytics/users
   */
  getUsersAnalytics: async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;

      const users = await usersListsAnalyticsService.getUsersAnalytics(from as string | undefined, to as string | undefined);

      res.json(users);
    } catch (error) {
      console.error('Error fetching users analytics:', error);
      res.status(500).json({ error: 'Failed to fetch users analytics' });
    }
  },

  /**
   * Get detailed analytics for all wedding lists
   * GET /api/admin/users-lists-analytics/lists
   */
  getWeddingListsAnalytics: async (req: Request, res: Response) => {
    try {
      const lists = await usersListsAnalyticsService.getWeddingListsAnalytics();

      res.json(lists);
    } catch (error) {
      console.error('Error fetching wedding lists analytics:', error);
      res.status(500).json({ error: 'Failed to fetch wedding lists analytics' });
    }
  },
};
