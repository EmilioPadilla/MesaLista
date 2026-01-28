import { Request, Response } from 'express';
import analyticsService from '../services/analyticsService.js';

export const analyticsController = {
  /**
   * Create or update analytics session
   * POST /events/session
   * Public endpoint
   */
  upsertSession: async (req: Request, res: Response) => {
    try {
      const { sessionId, userId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referrer, landingPage, ipAddress, userAgent } =
        req.body;

      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      await analyticsService.upsertSession({
        sessionId,
        userId,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        referrer,
        landingPage,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('user-agent'),
      });

      res.status(201).json({ success: true });
    } catch (error: unknown) {
      console.error('Error upserting session:', error);
      res.status(500).json({ error: 'Failed to upsert session' });
    }
  },

  /**
   * Log an analytics event
   * POST /events
   * Public endpoint
   */
  logEvent: async (req: Request, res: Response) => {
    try {
      const { sessionId, eventType, userId, metadata } = req.body;

      if (!sessionId || !eventType) {
        return res.status(400).json({ error: 'sessionId and eventType are required' });
      }

      // Validate event type
      const validEventTypes: string[] = [
        'PAGE_VIEW',
        'SIGN_IN',
        'REGISTRY_ATTEMPT',
        'REGISTRY_PURCHASE',
        'GIFT_PURCHASE',
        'VIEW_PRICING',
        'VIEW_REGISTRY_BUILDER',
        'START_CHECKOUT',
        'CHECKOUT_ERROR',
        'SESSION_START',
        'SESSION_END',
      ];
      if (!validEventTypes.includes(eventType)) {
        return res.status(400).json({ error: 'Invalid event type' });
      }

      await analyticsService.logEvent({
        sessionId,
        eventType,
        userId,
        metadata,
      });

      res.status(201).json({ success: true });
    } catch (error: unknown) {
      console.error('Error logging event:', error);
      res.status(500).json({ error: 'Failed to log event' });
    }
  },

  /**
   * Get metrics summary
   * GET /admin/metrics/summary?from=&to=&weddingListId=
   * Admin only
   */
  getMetricsSummary: async (req: Request, res: Response) => {
    try {
      const { from, to, weddingListId } = req.query;

      let fromDate: Date;
      let toDate: Date;

      if (from && to) {
        fromDate = new Date(from as string);
        toDate = new Date(to as string);
      } else {
        // Default to last 30 days
        toDate = new Date();
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
      }

      // Validate dates
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      // Parse weddingListId if provided
      let weddingListIdNum: number | undefined;
      if (weddingListId) {
        weddingListIdNum = parseInt(weddingListId as string);
        if (isNaN(weddingListIdNum)) {
          return res.status(400).json({ error: 'Invalid wedding list ID' });
        }
      }

      const summary = await analyticsService.getMetricsSummary(fromDate, toDate, weddingListIdNum);

      res.json({
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        weddingListId: weddingListId || 'all',
        ...summary,
      });
    } catch (error: unknown) {
      console.error('Error getting metrics summary:', error);
      res.status(500).json({ error: 'Failed to get metrics summary' });
    }
  },

  /**
   * Get time series data
   * GET /admin/metrics/time_series?metric=&from=&to=&granularity=
   * Admin only
   */
  getTimeSeries: async (req: Request, res: Response) => {
    try {
      const { metric, from, to, granularity = 'daily' } = req.query;

      if (!metric) {
        return res.status(400).json({ error: 'metric parameter is required' });
      }

      // Validate metric
      const validMetrics = [
        'visitors',
        'signIns',
        'registryAttempts',
        'registryPurchases',
        'giftPurchases',
        'viewPricing',
        'viewRegistryBuilder',
        'startCheckouts',
      ];
      if (!validMetrics.includes(metric as string)) {
        return res.status(400).json({ error: 'Invalid metric' });
      }

      // Validate granularity
      if (granularity !== 'daily' && granularity !== 'hourly') {
        return res.status(400).json({ error: 'granularity must be daily or hourly' });
      }

      let fromDate: Date;
      let toDate: Date;

      if (from && to) {
        fromDate = new Date(from as string);
        toDate = new Date(to as string);
      } else {
        // Default to last 30 days
        toDate = new Date();
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
      }

      // Validate dates
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const timeSeries = await analyticsService.getTimeSeries(
        metric as
          | 'visitors'
          | 'signIns'
          | 'registryAttempts'
          | 'registryPurchases'
          | 'giftPurchases'
          | 'viewPricing'
          | 'viewRegistryBuilder'
          | 'startCheckouts',
        fromDate,
        toDate,
        granularity as 'daily' | 'hourly',
      );

      res.json({
        metric,
        granularity,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        data: timeSeries,
      });
    } catch (error: unknown) {
      console.error('Error getting time series:', error);
      res.status(500).json({ error: 'Failed to get time series data' });
    }
  },

  /**
   * Trigger daily aggregation manually
   * POST /admin/metrics/aggregate
   * Admin only
   */
  aggregateDaily: async (req: Request, res: Response) => {
    try {
      const date = req.body?.date;

      const targetDate = date ? new Date(date) : new Date();

      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      await analyticsService.aggregateDailyMetrics(targetDate);

      res.json({
        success: true,
        message: `Aggregated metrics for ${targetDate.toISOString().split('T')[0]}`,
      });
    } catch (error: unknown) {
      console.error('Error aggregating daily metrics:', error);
      res.status(500).json({ error: 'Failed to aggregate daily metrics' });
    }
  },

  /**
   * Cleanup old data
   * POST /admin/metrics/cleanup
   * Admin only
   */
  cleanup: async (req: Request, res: Response) => {
    try {
      const { eventsRetentionDays = 90, aggregatesRetentionDays = 365, sessionsRetentionDays = 90 } = req.body;

      await analyticsService.cleanupOldEvents(eventsRetentionDays);
      await analyticsService.cleanupOldAggregates(aggregatesRetentionDays);
      await analyticsService.cleanupOldSessions(sessionsRetentionDays);

      res.json({
        success: true,
        message: 'Cleanup completed successfully',
      });
    } catch (error: unknown) {
      console.error('Error during cleanup:', error);
      res.status(500).json({ error: 'Failed to cleanup old data' });
    }
  },

  /**
   * Get funnel breakdown by dimension
   * GET /admin/metrics/funnel_breakdown?by=utm_source|landing_page&from=&to=
   * Admin only
   */
  getFunnelBreakdown: async (req: Request, res: Response) => {
    try {
      const { by, from, to } = req.query;

      if (!by || (by !== 'utm_source' && by !== 'landing_page')) {
        return res.status(400).json({ error: 'by parameter must be utm_source or landing_page' });
      }

      let fromDate: Date;
      let toDate: Date;

      if (from && to) {
        fromDate = new Date(from as string);
        toDate = new Date(to as string);
      } else {
        toDate = new Date();
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
      }

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const breakdown = await analyticsService.getFunnelBreakdown(by as 'utm_source' | 'landing_page', fromDate, toDate);

      res.json({
        dimension: by,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        data: breakdown,
      });
    } catch (error: unknown) {
      console.error('Error getting funnel breakdown:', error);
      res.status(500).json({ error: 'Failed to get funnel breakdown' });
    }
  },

  /**
   * Delete user analytics data (GDPR)
   * DELETE /admin/metrics/user/:userId
   * Admin only
   */
  deleteUserAnalytics: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (Array.isArray(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const userIdNum = parseInt(userId);

      if (isNaN(userIdNum)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      await analyticsService.deleteUserAnalytics(userIdNum);

      res.json({
        success: true,
        message: `Analytics data deleted for user ${userIdNum}`,
      });
    } catch (error: unknown) {
      console.error('Error deleting user analytics:', error);
      res.status(500).json({ error: 'Failed to delete user analytics data' });
    }
  },

  /**
   * Check for metric anomalies
   * GET /admin/metrics/alerts
   * Admin only
   */
  getAlerts: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.checkMetricAnomalies();

      res.json(result);
    } catch (error: unknown) {
      console.error('Error checking alerts:', error);
      res.status(500).json({ error: 'Failed to check metric anomalies' });
    }
  },
};

export default analyticsController;
