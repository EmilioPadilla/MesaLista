import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { Gift } from '@prisma/client';
import type { PurchasedGiftsResponse } from '../../shared/types/gift';
import { giftService } from '../services/gift.service';
import { queryKeys } from './queryKeys';

/**
 * Hook to fetch gifts by wedding list ID
 *
 * @param weddingListId ID of the wedding list
 * @param options React Query options
 */
export const useGiftsByWeddingList = (weddingListId: number | undefined, options?: Partial<UseQueryOptions<Gift[], Error>>) => {
  return useQuery({
    queryKey: [queryKeys.giftsByWeddingList, weddingListId],
    queryFn: () => giftService.getGiftsByWeddingList(weddingListId!),
    enabled: !!weddingListId,
    ...options,
  });
};

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.gifts, variables.id] });
      // We don't know the wedding list ID here, so invalidate all gifts
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftsByWeddingList] });
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

/**
 * Hook to fetch purchased gifts for a couple
 *
 * @param coupleId ID of the couple
 * @param options React Query options
 */
export const usePurchasedGifts = (coupleId: number | undefined, options?: Partial<UseQueryOptions<PurchasedGiftsResponse, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.purchasedGifts, coupleId],
    queryFn: () => giftService.fetchPurchasedGifts(coupleId),
    enabled: !!coupleId,
    ...options,
  });
};

/**
 * Hook to fetch purchases made by a user
 *
 * @param userId ID of the user
 * @param options React Query options
 */
export const useUserPurchases = (userId: number | undefined, options?: Partial<UseQueryOptions<PurchasedGiftsResponse, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.userPurchases, userId],
    queryFn: () => giftService.getUserPurchases(userId!),
    enabled: !!userId,
    ...options,
  });
};

/**
 * Hook to purchase a gift
 */
export const usePurchaseGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ giftId, message }: { giftId: number; message: string }) => giftService.purchaseGift(giftId, message),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.gifts] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.purchasedGifts] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.userPurchases] });
    },
  });
};

/**
 * Hook to update purchase status
 */
export const useUpdatePurchaseStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: giftService.updatePurchaseStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.purchasedGifts] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.userPurchases] });
    },
  });
};
