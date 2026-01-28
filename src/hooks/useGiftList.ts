import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { UpdateGiftListRequest } from 'types/api/giftList';
import type { Gift } from 'types/models/gift';
import { giftListService } from '../services/giftList.service';
import { queryKeys } from './queryKeys';
import { GiftListWithGifts } from 'types/models/giftList';

/**
 * Hook to fetch all gift lists
 *
 * @param options React Query options
 */
export const useGiftLists = (options?: Partial<UseQueryOptions<any[], Error>>) => {
  return useQuery({
    queryKey: [queryKeys.giftLists],
    queryFn: () => giftListService.getAllGiftLists(),
    ...options,
  });
};

/**
 * Hook to fetch all gift lists for a specific user
 *
 * @param userId ID of the user
 * @param options React Query options
 */
export const useGiftListsByUser = (userId: number | undefined, options?: Partial<UseQueryOptions<GiftListWithGifts[], Error>>) => {
  return useQuery({
    queryKey: [queryKeys.giftListsByUser, userId],
    queryFn: () => giftListService.getGiftListsByUser(userId!),
    enabled: !!userId,
    ...options,
  });
};

/**
 * Hook to fetch a gift list by ID
 *
 * @param giftListId ID of the gift list
 * @param options React Query options
 */
export const useGiftListById = (giftListId: number | undefined, options?: Partial<UseQueryOptions<GiftListWithGifts, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.giftListById, giftListId],
    queryFn: () => giftListService.getGiftListById(giftListId!),
    enabled: !!giftListId,
    ...options,
  });
};

/**
 * Hook to fetch a gift list by slug
 *
 * @param slug Slug of the gift list
 * @param options React Query options
 */
export const useGiftListBySlug = (slug: string | undefined, options?: Partial<UseQueryOptions<GiftListWithGifts, Error>>) => {
  return useQuery({
    queryKey: [queryKeys.giftListBySlug, slug],
    queryFn: () => giftListService.getGiftListBySlug(slug!),
    enabled: !!slug,
    ...options,
  });
};

/**
 * Hook to fetch gifts by gift list ID
 *
 * @param giftListId ID of the gift list
 * @param options React Query options
 */
export const useGiftsByGiftList = (giftListId: number | undefined, options?: Partial<UseQueryOptions<Gift[], Error>>) => {
  return useQuery({
    queryKey: [queryKeys.giftsByGiftList, giftListId],
    queryFn: () => giftListService.getGiftsByGiftList(giftListId!),
    enabled: !!giftListId,
    ...options,
  });
};

/**
 * Hook to create a new gift list
 */
export const useCreateGiftList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: giftListService.createGiftList,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftLists] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListsByUser, variables.userId] });
    },
  });
};

/**
 * Hook to update an existing gift list
 */
export const useUpdateGiftList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGiftListRequest }) => giftListService.updateGiftList(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftLists] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListById, variables.id] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListsByUser] });
    },
  });
};

/**
 * Hook to delete a gift list
 */
export const useDeleteGiftList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => giftListService.deleteGiftList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftLists] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListsByUser] });
    },
  });
};

/**
 * Hook to fetch categories by gift list ID
 *
 * @param giftListId ID of the gift list
 * @param options React Query options
 */
export const useGetCategoriesByGiftList = (giftListId?: number) => {
  return useQuery({
    queryKey: [queryKeys.categoriesByGiftList, giftListId],
    queryFn: () => giftListService.getCategoriesByGiftList(giftListId!),
    enabled: !!giftListId,
  });
};

/**
 * Hook to reorder gifts
 */
export const useReorderGifts = (giftListId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ giftListId, giftOrders }: { giftListId: number; giftOrders: Array<{ giftId: number; order: number }> }) =>
      giftListService.reorderGifts(giftListId, giftOrders),
    onMutate: async ({ giftOrders }) => {
      const queryKey = [queryKeys.giftListById, giftListId];
      const previousGiftList = queryClient.getQueryData<GiftListWithGifts>(queryKey);
      if (previousGiftList) {
        const orderMap = new Map<number, number>(giftOrders.map((o) => [o.giftId, o.order]));
        const newGifts = previousGiftList.gifts.map((gift) => ({
          ...gift,
          order: orderMap.get(gift.id) ?? gift.order,
        }));
        queryClient.setQueryData<GiftListWithGifts>(queryKey, {
          ...previousGiftList,
          gifts: newGifts,
        });
      }
      return { previousGiftList, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousGiftList && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousGiftList);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListById, giftListId] });
    },
  });
};
