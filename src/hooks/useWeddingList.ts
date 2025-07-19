import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { WeddingListBase, WeddingListWithGifts, CreateWeddingListRequest } from '../../shared/types/weddingList';
import { weddingListService } from '../services/weddingList.service';
import { queryKeys } from './queryKeys';

/**
 * Hook to fetch all wedding lists with their gifts
 *
 * @param options React Query options
 */
export const useWeddingLists = (options?: Partial<UseQueryOptions<WeddingListWithGifts[], Error>>) => {
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
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateWeddingListRequest> }) => weddingListService.updateWeddingList(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingLists] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingListByCouple, variables.id] });
    },
  });
};
