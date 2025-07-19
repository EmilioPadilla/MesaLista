import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weddingListService } from '../services/weddingList.service';
import { queryKeys } from './queryKeys';
/**
 * Hook to fetch all wedding lists with their gifts
 *
 * @param options React Query options
 */
export const useWeddingLists = (options) => {
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
export const useWeddingListByCouple = (coupleId, options) => {
    return useQuery({
        queryKey: [queryKeys.weddingListByCouple, coupleId],
        queryFn: () => weddingListService.getWeddingListByCouple(coupleId),
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
        mutationFn: ({ id, data }) => weddingListService.updateWeddingList(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [queryKeys.weddingLists] });
            queryClient.invalidateQueries({ queryKey: [queryKeys.weddingListByCouple, variables.id] });
        },
    });
};
