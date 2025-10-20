import { useQuery, useMutation, type UseQueryOptions } from '@tanstack/react-query';
import { message } from 'antd';
import {
  analyticsService,
  type LogEventParams,
  type UpsertSessionParams,
  type MetricsSummary,
  type TimeSeriesResponse,
  type FunnelBreakdownResponse,
  type AlertsResponse,
} from '../services/analytics.service';
import { queryKeys } from './queryKeys';

/**
 * Hook to upsert analytics session
 */
export const useUpsertAnalyticsSession = () => {
  return useMutation({
    mutationFn: (params: UpsertSessionParams) => analyticsService.upsertSession(params),
    // No success/error messages - analytics should be silent
  });
};

/**
 * Hook to log an analytics event
 */
export const useLogAnalyticsEvent = () => {
  return useMutation({
    mutationFn: (params: LogEventParams) => analyticsService.logEvent(params),
    // No success/error messages - analytics should be silent
  });
};

/**
 * Hook to get metrics summary
 */
export const useMetricsSummary = (from?: string, to?: string, weddingListId?: number, options?: Partial<UseQueryOptions<MetricsSummary, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.analytics, 'summary', from, to, weddingListId],
    queryFn: () => analyticsService.getMetricsSummary(from, to, weddingListId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to get time series data
 */
export const useTimeSeries = (
  metric: 'visitors' | 'signIns' | 'registryAttempts' | 'registryPurchases' | 'giftPurchases',
  from?: string,
  to?: string,
  granularity: 'daily' | 'hourly' = 'daily',
  options?: Partial<UseQueryOptions<TimeSeriesResponse, Error>>,
) => {
  return useQuery({
    queryKey: [queryKeys.analytics, 'timeSeries', metric, from, to, granularity],
    queryFn: () => analyticsService.getTimeSeries(metric, from, to, granularity),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to trigger daily aggregation
 */
export const useAggregateDaily = () => {
  return useMutation({
    mutationFn: (date?: string) => analyticsService.aggregateDaily(date),
    onSuccess: (data) => {
      message.success(data.message);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Error al agregar métricas';
      message.error(errorMessage);
    },
  });
};

/**
 * Hook to cleanup old data
 */
export const useCleanupAnalytics = () => {
  return useMutation({
    mutationFn: ({
      eventsRetentionDays,
      aggregatesRetentionDays,
      sessionsRetentionDays,
    }: {
      eventsRetentionDays?: number;
      aggregatesRetentionDays?: number;
      sessionsRetentionDays?: number;
    }) => analyticsService.cleanup(eventsRetentionDays, aggregatesRetentionDays, sessionsRetentionDays),
    onSuccess: (data) => {
      message.success(data.message);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Error al limpiar datos';
      message.error(errorMessage);
    },
  });
};

/**
 * Hook to get funnel breakdown
 */
export const useFunnelBreakdown = (
  dimension: 'utm_source' | 'landing_page',
  from?: string,
  to?: string,
  options?: Partial<UseQueryOptions<FunnelBreakdownResponse, Error>>,
) => {
  return useQuery({
    queryKey: [queryKeys.analytics, 'funnelBreakdown', dimension, from, to],
    queryFn: () => analyticsService.getFunnelBreakdown(dimension, from, to),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to get metric alerts
 */
export const useMetricAlerts = (options?: Partial<UseQueryOptions<AlertsResponse, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.analytics, 'alerts'],
    queryFn: () => analyticsService.getAlerts(),
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};
