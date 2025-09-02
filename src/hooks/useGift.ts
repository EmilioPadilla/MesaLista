import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { Gift } from 'types/models/gift';
import { giftService } from '../services/gift.service';
import { queryKeys } from './queryKeys';

/**
 * Hook to fetch a gift by ID
 *
 * @param giftId ID of the gift
 * @param options React Query options
 */
export const useGiftById = (giftId: number | undefined, options?: Partial<UseQueryOptions<Gift, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.gifts, giftId],
    queryFn: () => giftService.getGiftById(giftId!),
    enabled: !!giftId,
    ...options,
  });
};

/**
 * Hook to create a new gift
 */
export const useCreateGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: giftService.createGift,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftsByWeddingList, variables.weddingListId] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingListByCouple] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.categoriesByWeddingList] });
    },
  });
};

/**
 * Hook to update an existing gift
 */
export const useUpdateGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Gift> }) => giftService.updateGift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingListByCouple] });
    },
  });
};

/**
 * Hook to delete a gift
 */
export const useDeleteGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: giftService.deleteGift,
    onSuccess: () => {
      // Invalidate all gifts queries since we don't know which wedding list this gift belonged to
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftsByWeddingList] });
    },
  });
};
