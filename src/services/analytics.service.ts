import apiClient from './client';
import { analytics_endpoints } from './endpoints';

export type AnalyticsEventType = 'PAGE_VIEW' | 'SIGN_IN' | 'REGISTRY_PURCHASE' | 'GIFT_PURCHASE';

export interface LogEventParams {
  sessionId: string;
  eventType: AnalyticsEventType;
  userId?: number;
  metadata?: Record<string, any>;
}

export interface MetricsSummary {
  from: string;
  to: string;
  visitors: number;
  signIns: number;
  registryPurchases: number;
  giftPurchases: number;
  signInRate: number;
  registryPurchaseRate: number;
  giftPurchaseRate: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface TimeSeriesResponse {
  metric: string;
  granularity: string;
  from: string;
  to: string;
  data: TimeSeriesDataPoint[];
}

export const analyticsService = {
  /**
   * Log an analytics event
   */
  logEvent: async (params: LogEventParams): Promise<void> => {
    try {
      await apiClient.post(analytics_endpoints.logEvent, params);
    } catch (error) {
      // Don't throw - analytics failures shouldn't break the app
      console.error('Failed to log analytics event:', error);
    }
  },

  /**
   * Get metrics summary for a date range
   */
  getMetricsSummary: async (from?: string, to?: string): Promise<MetricsSummary> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await apiClient.get(analytics_endpoints.summary, { params });
    return response.data;
  },

  /**
   * Get time series data for a specific metric
   */
  getTimeSeries: async (
    metric: 'visitors' | 'signIns' | 'registryPurchases' | 'giftPurchases',
    from?: string,
    to?: string,
    granularity: 'daily' | 'hourly' = 'daily',
  ): Promise<TimeSeriesResponse> => {
    const params: Record<string, string> = { metric, granularity };
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await apiClient.get(analytics_endpoints.timeSeries, { params });
    return response.data;
  },

  /**
   * Trigger daily aggregation manually
   */
  aggregateDaily: async (date?: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(analytics_endpoints.aggregate, { date });
    return response.data;
  },

  /**
   * Cleanup old data
   */
  cleanup: async (eventsRetentionDays?: number, aggregatesRetentionDays?: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(analytics_endpoints.cleanup, {
      eventsRetentionDays,
      aggregatesRetentionDays,
    });
    return response.data;
  },
};

export default analyticsService;
