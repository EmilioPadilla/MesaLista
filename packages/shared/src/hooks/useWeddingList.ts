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
    enabled: !!coupleId,
    ...options,
  });
};

/**
 * Hook to fetch a wedding list by couple slug
 *
 * @param slug Slug of the couple
 * @param options React Query options
 */
export const useWeddingListBySlug = (slug: string | undefined, options?: Partial<UseQueryOptions<WeddingListWithGifts, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.weddingListBySlug, slug],
    queryFn: () => weddingListService.getWeddingListBySlug(slug!),
    enabled: !!slug,
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
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingListByCouple] });
    },
  });
};

/**
 * Hook to fetch categories by wedding list ID
 *
 * @param weddingListId ID of the wedding list
 * @param options React Query options
 */
export const useGetCategoriesByWeddingList = (weddingListId?: number) => {
  return useQuery({
    queryKey: [queryKeys.categoriesByWeddingList, weddingListId],
    queryFn: () => weddingListService.getCategoriesByWeddingList(weddingListId!),
    enabled: !!weddingListId,
  });
};

/**
 * Hook to reorder gifts
 */
export const useReorderGifts = (coupleId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weddingListId, giftOrders }: { weddingListId: number; giftOrders: Array<{ giftId: number; order: number }> }) =>
      weddingListService.reorderGifts(weddingListId, giftOrders),
    // Optimistic update logic
    onMutate: async ({ giftOrders }) => {
      // Find all queries for weddingListByCouple with this weddingListId as coupleId
      const queryKey = [queryKeys.weddingListByCouple, coupleId];
      // Get previous data for rollback
      const previousWeddingList = queryClient.getQueryData<WeddingListWithGifts>(queryKey);
      if (previousWeddingList) {
        // Create a map from giftId to new order
        const orderMap = new Map<number, number>(giftOrders.map((o) => [o.giftId, o.order]));
        // Update the order field of each gift, do not reorder the array
        const newGifts = previousWeddingList.gifts.map((gift) => ({
          ...gift,
          order: orderMap.get(gift.id) ?? gift.order,
        }));
        // Optimistically update the cache
        queryClient.setQueryData<WeddingListWithGifts>(queryKey, {
          ...previousWeddingList,
          gifts: newGifts,
        });
      }
      return { previousWeddingList, queryKey };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousWeddingList && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousWeddingList);
      }
    },
    // Always refetch after mutation
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingListByCouple, coupleId] });
    },
  });
};
