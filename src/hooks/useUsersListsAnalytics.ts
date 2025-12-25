import { useQuery } from '@tanstack/react-query';
import usersListsAnalyticsService, { UserAnalytics, WeddingListAnalytics, UsersListsSummary } from 'services/usersListsAnalytics.service';

/**
 * Hook to fetch users/lists analytics summary
 */
export const useUsersListsSummary = (from?: string, to?: string) => {
  return useQuery<UsersListsSummary>({
    queryKey: ['usersListsAnalytics', 'summary', from, to],
    queryFn: () => usersListsAnalyticsService.getSummary(from, to),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch detailed users analytics
 */
export const useUsersAnalytics = (from?: string, to?: string) => {
  return useQuery<UserAnalytics[]>({
    queryKey: ['usersListsAnalytics', 'users', from, to],
    queryFn: () => usersListsAnalyticsService.getUsersAnalytics(from, to),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch detailed wedding lists analytics
 */
export const useWeddingListsAnalytics = (from?: string, to?: string) => {
  return useQuery<WeddingListAnalytics[]>({
    queryKey: ['usersListsAnalytics', 'lists', from, to],
    queryFn: () => usersListsAnalyticsService.getWeddingListsAnalytics(from, to),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
