import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import usersListsAnalyticsService, { UserAnalytics, WeddingListAnalytics, UsersListsSummary } from 'services/usersListsAnalytics.service';

/**
 * Hook to fetch users/lists analytics summary
 */
export const useUsersListsSummary = () => {
  return useQuery<UsersListsSummary>({
    queryKey: ['usersListsAnalytics', 'summary'],
    queryFn: () => usersListsAnalyticsService.getSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch detailed users analytics
 */
export const useUsersAnalytics = () => {
  return useQuery<UserAnalytics[]>({
    queryKey: ['usersListsAnalytics', 'users'],
    queryFn: () => usersListsAnalyticsService.getUsersAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch detailed wedding lists analytics
 */
export const useWeddingListsAnalytics = () => {
  return useQuery<WeddingListAnalytics[]>({
    queryKey: ['usersListsAnalytics', 'lists'],
    queryFn: () => usersListsAnalyticsService.getWeddingListsAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to update the isActive / isPublic flags for a wedding list (admin only)
 */
export const useUpdateWeddingListVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, updates }: { listId: number; updates: { isActive?: boolean; isPublic?: boolean } }) =>
      usersListsAnalyticsService.updateWeddingListVisibility(listId, updates),
    onSuccess: (updated) => {
      // Patch the cached lists so the UI reflects the new flags immediately
      queryClient.setQueryData<WeddingListAnalytics[]>(['usersListsAnalytics', 'lists'], (prev) =>
        prev?.map((list) =>
          list.id === updated.id ? { ...list, isActive: updated.isActive, isPublic: updated.isPublic } : list,
        ),
      );
    },
  });
};
