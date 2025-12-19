import apiClient from './client';

export interface EmailAnalyticsSummary {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  spamComplaints: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface EmailAnalyticsTimeSeries {
  date: string;
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
}

export interface EmailAnalyticsByTag {
  tag: string;
  eventType: 'DELIVERY' | 'BOUNCE' | 'SPAM_COMPLAINT' | 'OPEN' | 'LINK_CLICK';
  count: number;
}

export interface EmailIssues {
  bounces: Array<{
    id: string;
    messageId: string;
    recipient: string;
    subject?: string;
    recordedAt: string;
    metadata?: any;
  }>;
  spamComplaints: Array<{
    id: string;
    messageId: string;
    recipient: string;
    subject?: string;
    recordedAt: string;
    metadata?: any;
  }>;
}

const emailAnalyticsService = {
  /**
   * Get email analytics summary for a date range
   */
  getAnalyticsSummary: async (from: string, to: string): Promise<EmailAnalyticsSummary> => {
    const response = await apiClient.get(`/admin/email-analytics/summary`, {
      params: { from, to },
    });
    return response.data;
  },

  /**
   * Get email analytics time series data
   */
  getTimeSeries: async (from: string, to: string): Promise<EmailAnalyticsTimeSeries[]> => {
    const response = await apiClient.get(`/admin/email-analytics/time-series`, {
      params: { from, to },
    });
    return response.data;
  },

  /**
   * Get email analytics by tag
   */
  getAnalyticsByTag: async (from: string, to: string): Promise<EmailAnalyticsByTag[]> => {
    const response = await apiClient.get(`/admin/email-analytics/by-tag`, {
      params: { from, to },
    });
    return response.data;
  },

  /**
   * Get recent email issues (bounces and spam complaints)
   */
  getRecentIssues: async (hours: number = 24): Promise<EmailIssues> => {
    const response = await apiClient.get(`/admin/email-analytics/issues`, {
      params: { hours },
    });
    return response.data;
  },

  /**
   * Manually trigger daily aggregation
   */
  aggregateDailyMetrics: async (date?: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/admin/email-analytics/aggregate`, { date });
    return response.data;
  },
};

export default emailAnalyticsService;
