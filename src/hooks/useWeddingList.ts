import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { CreateWeddingListRequest, UpdateWeddingListRequest } from 'types/api/weddingList';
import type { Gift } from 'types/models/gift';
import { weddingListService } from '../services/weddingList.service';
import { queryKeys } from './queryKeys';
import { WeddingListWithGifts } from 'types/models/weddingList';

/**
 * Hook to fetch all wedding lists with their gifts
 *
 * @param options React Query options
 */
export const useWeddingLists = (options?: Partial<UseQueryOptions<CreateWeddingListRequest[], Error>>) => {
  return useQuery({
    queryKey: [queryKeys.weddingLists],
    queryFn: () => weddingListService.getAllWeddingLists(),
    ...options,
  });
};

/**
 * Hook to fetch a wedding list by couple ID
 *
 * @param coupleId ID of the couple
 * @param options React Query options
 */
export const useWeddingListByCouple = (coupleId: number | undefined, options?: Partial<UseQueryOptions<WeddingListWithGifts, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.weddingListByCouple, coupleId],
    queryFn: () => weddingListService.getWeddingListByCouple(coupleId!),
    enabled: !!coupleId, // Only fetch if coupleId is provided
    ...options,
  });
};

/**
 * Hook to fetch gifts by wedding list ID
 *
 * @param weddingListId ID of the wedding list
 * @param options React Query options
 */
export const useGiftsByWeddingList = (weddingListId: number | undefined, options?: Partial<UseQueryOptions<Gift[], Error>>) => {
  return useQuery({
    queryKey: [queryKeys.giftsByWeddingList, weddingListId],
    queryFn: () => weddingListService.getGiftsByWeddingList(weddingListId!),
    enabled: !!weddingListId,
    ...options,
  });
};

/**
 * Hook to create a new wedding list
 */
export const useCreateWeddingList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: weddingListService.createWeddingList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingLists] });
    },
  });
};

/**
 * Hook to update an existing wedding list
 */
export const useUpdateWeddingList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UpdateWeddingListRequest> }) => weddingListService.updateWeddingList(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingLists] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingListByCouple, variables.id] });
    },
  });
};

/**
 * Hook to fetch categories by wedding list ID
 *
 * @param weddingListId ID of the wedding list
 * @param options React Query options
 */
export const useCategoriesByWeddingList = (weddingListId?: number) => {
  return useQuery({
    queryKey: [queryKeys.categoriesByWeddingList, weddingListId],
    queryFn: () => weddingListService.getCategoriesByWeddingList(weddingListId!),
    enabled: !!weddingListId,
  });
};

/**
 * Hook to reorder gifts
 */
export const useReorderGifts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weddingListId, giftOrders }: { weddingListId: number; giftOrders: Array<{ giftId: number; order: number }> }) =>
      weddingListService.reorderGifts(weddingListId, giftOrders),
    onSuccess: () => {
      // Invalidate and refetch wedding list data to get updated order
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingListByCouple] });
    },
  });
};
