import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { UpdateGiftListRequest } from 'types/api/giftList';
import type { Gift } from 'types/models/gift';
import { giftListService } from '../services/giftList.service';
import { queryKeys } from './queryKeys';
import { GiftListWithGifts } from 'types/models/giftList';

/**
 * A 404 from these endpoints is an answer, not a failure: the slug has no
 * published list behind it. Retrying it three times only makes the guest stare
 * at a spinner for seven seconds before the UI can say so. Server errors still
 * get the default retries.
 */
const retryUnlessClientError = (failureCount: number, error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 3;
};

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
    retry: retryUnlessClientError,
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
    retry: retryUnlessClientError,
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
 * Hook to publish a draft gift list on the commission plan.
 *
 * The fixed plan is published server-side by the payment flow, so it has no hook
 * here — see usePayment's plan checkout / IAP mutations.
 *
 * Invalidates the by-slug query too: it is what the public registry reads, and a
 * stale entry would keep showing the couple a draft banner on a live registry.
 */
export const usePublishGiftList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => giftListService.publishGiftList(id, 'COMMISSION'),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftLists] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListById, id] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListsByUser] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftListBySlug] });
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
    // Categories change only when a gift is created/updated/deleted, and those
    // mutations already invalidate this key explicitly. Without `staleTime`,
    // every GiftModal open refetched the list redundantly.
    staleTime: Infinity,
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
