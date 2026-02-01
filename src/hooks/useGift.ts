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
    onSuccess: () => {
      // Invalidate all gift list related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListsByUser] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListById] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListBySlug] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftsByGiftList] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.categoriesByGiftList] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.gifts] });
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
      // Invalidate all gift list related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListsByUser] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListById] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListBySlug] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftsByGiftList] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.categoriesByGiftList] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.gifts] });
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
      // Invalidate all gift list related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListsByUser] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListById] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListBySlug] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftsByGiftList] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.categoriesByGiftList] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.gifts] });
    },
  });
};
