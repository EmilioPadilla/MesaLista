import { Request, Response } from 'express';
import analyticsService from '../services/analyticsService.js';
import { AnalyticsEventType } from '@prisma/client';

export const analyticsController = {
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
      const validEventTypes: AnalyticsEventType[] = ['PAGE_VIEW', 'SIGN_IN', 'REGISTRY_PURCHASE', 'GIFT_PURCHASE'];
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
   * GET /admin/metrics/summary?from=&to=
   * Admin only
   */
  getMetricsSummary: async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;

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

      const summary = await analyticsService.getMetricsSummary(fromDate, toDate);

      res.json({
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
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
      const validMetrics = ['visitors', 'signIns', 'registryPurchases', 'giftPurchases'];
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
        metric as 'visitors' | 'signIns' | 'registryPurchases' | 'giftPurchases',
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
      const { date } = req.body;

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
      const { eventsRetentionDays = 90, aggregatesRetentionDays = 365 } = req.body;

      await analyticsService.cleanupOldEvents(eventsRetentionDays);
      await analyticsService.cleanupOldAggregates(aggregatesRetentionDays);

      res.json({
        success: true,
        message: 'Cleanup completed successfully',
      });
    } catch (error: unknown) {
      console.error('Error during cleanup:', error);
      res.status(500).json({ error: 'Failed to cleanup old data' });
    }
  },
};

export default analyticsController;
