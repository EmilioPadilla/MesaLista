import apiClient from './client';
import { analytics_endpoints } from './endpoints';

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'SIGN_IN'
  | 'REGISTRY_PURCHASE'
  | 'REGISTRY_ATTEMPT'
  | 'GIFT_PURCHASE'
  | 'VIEW_PRICING'
  | 'VIEW_REGISTRY_BUILDER'
  | 'START_CHECKOUT'
  | 'CHECKOUT_ERROR'
  | 'SESSION_START'
  | 'SESSION_END';

export interface LogEventParams {
  sessionId: string;
  eventType: AnalyticsEventType;
  userId?: number;
  metadata?: Record<string, any>;
}

export interface UpsertSessionParams {
  sessionId: string;
  userId?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  landingPage?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MetricsSummary {
  from: string;
  to: string;
  visitors: number;
  signIns: number;
  registryAttempts: number;
  registryPurchases: number;
  giftPurchases: number;
  viewPricing: number;
  viewRegistryBuilder: number;
  startCheckouts: number;
  checkoutErrors: number;
  checkoutAbandonments: number;
  avgPagesPerSession: number;
  avgSessionDurationMs: number;
  signInRate: number;
  registryPurchaseRate: number;
  giftPurchaseRate: number;
  checkoutAbandonmentRate: number;
  topUtmSources?: Array<{ source: string; visitors: number; conversions: number; conversionRate: number }>;
  topLandingPages?: Array<{ page: string; visitors: number; conversions: number; conversionRate: number }>;
}

export interface FunnelBreakdownItem {
  group: string;
  visitors: number;
  signIns: number;
  startCheckouts: number;
  purchases: number;
  checkoutAbandonments: number;
  signInRate: number;
  checkoutRate: number;
  purchaseRate: number;
  abandonmentRate: number;
}

export interface FunnelBreakdownResponse {
  dimension: string;
  from: string;
  to: string;
  data: FunnelBreakdownItem[];
}

export interface Alert {
  metric: string;
  message: string;
  severity: 'warning' | 'critical';
}

export interface AlertsResponse {
  alerts: Alert[];
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
   * Upsert analytics session
   */
  upsertSession: async (params: UpsertSessionParams): Promise<void> => {
    try {
      await apiClient.post(analytics_endpoints.upsertSession, params);
    } catch (error) {
      console.error('Failed to upsert analytics session:', error);
    }
  },

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
  getMetricsSummary: async (from?: string, to?: string, weddingListId?: number): Promise<MetricsSummary> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (weddingListId) params.weddingListId = weddingListId.toString();

    const response = await apiClient.get(analytics_endpoints.summary, { params });
    return response.data;
  },

  /**
   * Get time series data for a specific metric
   */
  getTimeSeries: async (
    metric: 'visitors' | 'signIns' | 'registryAttempts' | 'registryPurchases' | 'giftPurchases',
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
  cleanup: async (
    eventsRetentionDays?: number,
    aggregatesRetentionDays?: number,
    sessionsRetentionDays?: number,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(analytics_endpoints.cleanup, {
      eventsRetentionDays,
      aggregatesRetentionDays,
      sessionsRetentionDays,
    });
    return response.data;
  },

  /**
   * Get funnel breakdown by dimension
   */
  getFunnelBreakdown: async (dimension: 'utm_source' | 'landing_page', from?: string, to?: string): Promise<FunnelBreakdownResponse> => {
    const params: Record<string, string> = { by: dimension };
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await apiClient.get(analytics_endpoints.funnelBreakdown, { params });
    return response.data;
  },

  /**
   * Get metric alerts
   */
  getAlerts: async (): Promise<AlertsResponse> => {
    const response = await apiClient.get(analytics_endpoints.alerts);
    return response.data;
  },
};

export default analyticsService;
