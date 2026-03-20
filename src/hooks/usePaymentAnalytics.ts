import { useQuery } from '@tanstack/react-query';
import paymentAnalyticsService from 'services/paymentAnalytics.service';

export const paymentAnalyticsKeys = {
  all: ['paymentAnalytics'] as const,
  summary: () => [...paymentAnalyticsKeys.all, 'summary'] as const,
  lists: () => [...paymentAnalyticsKeys.all, 'lists'] as const,
};

export function usePaymentAnalyticsSummary() {
  return useQuery({
    queryKey: paymentAnalyticsKeys.summary(),
    queryFn: () => paymentAnalyticsService.getSummary(),
  });
}

export function useGiftListsPaymentAnalytics() {
  return useQuery({
    queryKey: paymentAnalyticsKeys.lists(),
    queryFn: () => paymentAnalyticsService.getGiftListsPaymentAnalytics(),
  });
}
