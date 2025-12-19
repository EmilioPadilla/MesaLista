import { Request, Response } from 'express';
import emailAnalyticsService from '../services/emailAnalyticsService.js';

class EmailAnalyticsController {
  /**
   * Handle Postmark webhook events
   * POST /api/webhooks/postmark
   */
  async handlePostmarkWebhook(req: Request, res: Response): Promise<void> {
    try {
      const event = req.body;

      // Validate that we have the required fields
      if (!event.RecordType || !event.MessageID || !event.Recipient) {
        res.status(400).json({ error: 'Invalid webhook payload' });
        return;
      }

      // Process the event
      await emailAnalyticsService.processWebhookEvent(event);

      res.status(200).json({ success: true, message: 'Event processed' });
    } catch (error) {
      console.error('Error handling Postmark webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook event' });
    }
  }

  /**
   * Get email analytics summary
   * GET /api/admin/email-analytics/summary?from=...&to=...
   */
  async getAnalyticsSummary(req: Request, res: Response): Promise<void> {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        res.status(400).json({ error: 'Missing required query parameters: from, to' });
        return;
      }

      const summary = await emailAnalyticsService.getAnalyticsSummary(from as string, to as string);

      res.status(200).json(summary);
    } catch (error) {
      console.error('Error getting email analytics summary:', error);
      res.status(500).json({ error: 'Failed to get analytics summary' });
    }
  }

  /**
   * Get email analytics time series
   * GET /api/admin/email-analytics/time-series?from=...&to=...
   */
  async getTimeSeries(req: Request, res: Response): Promise<void> {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        res.status(400).json({ error: 'Missing required query parameters: from, to' });
        return;
      }

      const timeSeries = await emailAnalyticsService.getTimeSeries(from as string, to as string);

      res.status(200).json(timeSeries);
    } catch (error) {
      console.error('Error getting email analytics time series:', error);
      res.status(500).json({ error: 'Failed to get time series data' });
    }
  }

  /**
   * Get email analytics by tag
   * GET /api/admin/email-analytics/by-tag?from=...&to=...
   */
  async getAnalyticsByTag(req: Request, res: Response): Promise<void> {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        res.status(400).json({ error: 'Missing required query parameters: from, to' });
        return;
      }

      const byTag = await emailAnalyticsService.getAnalyticsByTag(from as string, to as string);

      res.status(200).json(byTag);
    } catch (error) {
      console.error('Error getting email analytics by tag:', error);
      res.status(500).json({ error: 'Failed to get analytics by tag' });
    }
  }

  /**
   * Get recent email issues (bounces and spam complaints)
   * GET /api/admin/email-analytics/issues?hours=24
   */
  async getRecentIssues(req: Request, res: Response): Promise<void> {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

      const issues = await emailAnalyticsService.getRecentIssues(hours);

      res.status(200).json(issues);
    } catch (error) {
      console.error('Error getting recent email issues:', error);
      res.status(500).json({ error: 'Failed to get recent issues' });
    }
  }

  /**
   * Manually trigger daily aggregation
   * POST /api/admin/email-analytics/aggregate
   */
  async aggregateDailyMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.body;
      const targetDate = date ? new Date(date) : new Date();

      await emailAnalyticsService.aggregateDailyMetrics(targetDate);

      res.status(200).json({ success: true, message: 'Daily metrics aggregated' });
    } catch (error) {
      console.error('Error aggregating daily metrics:', error);
      res.status(500).json({ error: 'Failed to aggregate metrics' });
    }
  }
}

export default new EmailAnalyticsController();
