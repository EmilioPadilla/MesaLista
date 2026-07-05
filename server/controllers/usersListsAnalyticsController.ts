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

  /**
   * Update the isActive / isPublic flags for a wedding list
   * PATCH /api/admin/users-lists-analytics/lists/:id/visibility
   */
  updateWeddingListVisibility: async (req: Request, res: Response) => {
    try {
      const listId = Number(req.params.id);
      if (!Number.isInteger(listId)) {
        return res.status(400).json({ error: 'Invalid list id' });
      }

      const { isActive, isPublic } = req.body;
      if (typeof isActive !== 'boolean' && typeof isPublic !== 'boolean') {
        return res.status(400).json({ error: 'isActive or isPublic (boolean) is required' });
      }

      const updated = await usersListsAnalyticsService.updateWeddingListVisibility(listId, { isActive, isPublic });

      res.json(updated);
    } catch (error) {
      console.error('Error updating wedding list visibility:', error);
      res.status(500).json({ error: 'Failed to update wedding list visibility' });
    }
  },
};
