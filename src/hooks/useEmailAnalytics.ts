import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import emailAnalyticsService, {
  EmailAnalyticsSummary,
  EmailAnalyticsTimeSeries,
  EmailAnalyticsByTag,
  EmailIssues,
} from 'services/emailAnalytics.service';

/**
 * Hook to get email analytics summary
 */
export const useEmailAnalyticsSummary = (from: string, to: string) => {
  return useQuery<EmailAnalyticsSummary>({
    queryKey: ['emailAnalytics', 'summary', from, to],
    queryFn: () => emailAnalyticsService.getAnalyticsSummary(from, to),
    enabled: !!from && !!to,
  });
};

/**
 * Hook to get email analytics time series
 */
export const useEmailAnalyticsTimeSeries = (from: string, to: string) => {
  return useQuery<EmailAnalyticsTimeSeries[]>({
    queryKey: ['emailAnalytics', 'timeSeries', from, to],
    queryFn: () => emailAnalyticsService.getTimeSeries(from, to),
    enabled: !!from && !!to,
  });
};

/**
 * Hook to get email analytics by tag
 */
export const useEmailAnalyticsByTag = (from: string, to: string) => {
  return useQuery<EmailAnalyticsByTag[]>({
    queryKey: ['emailAnalytics', 'byTag', from, to],
    queryFn: () => emailAnalyticsService.getAnalyticsByTag(from, to),
    enabled: !!from && !!to,
  });
};

/**
 * Hook to get recent email issues
 */
export const useEmailIssues = (hours: number = 24) => {
  return useQuery<EmailIssues>({
    queryKey: ['emailAnalytics', 'issues', hours],
    queryFn: () => emailAnalyticsService.getRecentIssues(hours),
  });
};

/**
 * Hook to manually trigger daily aggregation
 */
export const useAggregateDailyMetrics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date?: string) => emailAnalyticsService.aggregateDailyMetrics(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailAnalytics'] });
    },
  });
};
