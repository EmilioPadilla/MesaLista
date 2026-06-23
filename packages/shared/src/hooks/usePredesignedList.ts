import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { predesignedListService, PredesignedList } from '../services/predesignedList.service';
import { queryKeys } from './queryKeys';

// Public hooks
export const usePredesignedLists = () => {
  return useQuery<PredesignedList[], Error>({
    queryKey: ['predesignedLists'],
    queryFn: () => predesignedListService.getAllLists(),
  });
};

export const usePredesignedListById = (id: number) => {
  return useQuery<PredesignedList, Error>({
    queryKey: ['predesignedList', id],
    queryFn: () => predesignedListService.getListById(id),
    enabled: !!id,
  });
};

export const useAddPredesignedGiftToWeddingList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ giftId, weddingListId }: { giftId: number; weddingListId: number }) =>
      predesignedListService.addGiftToWeddingList(giftId, weddingListId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.weddingListByCouple] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.giftsByWeddingList] });
    },
  });
};

// Admin hooks - Predesigned Lists
export const usePredesignedListsAdmin = () => {
  return useQuery<PredesignedList[], Error>({
    queryKey: ['predesignedListsAdmin'],
    queryFn: () => predesignedListService.getAllListsAdmin(),
  });
};

export const useCreatePredesignedList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description: string; imageUrl: string; icon: string; isActive?: boolean }) =>
      predesignedListService.createList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predesignedListsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['predesignedLists'] });
    },
  });
};

export const useUpdatePredesignedList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; description?: string; imageUrl?: string; icon?: string; isActive?: boolean };
    }) => predesignedListService.updateList(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predesignedListsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['predesignedLists'] });
    },
  });
};

export const useDeletePredesignedList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => predesignedListService.deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predesignedListsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['predesignedLists'] });
    },
  });
};

export const useReorderPredesignedLists = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orders: Array<{ id: number; order: number }>) => predesignedListService.reorderLists(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predesignedListsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['predesignedLists'] });
    },
  });
};

// Admin hooks - Predesigned Gifts
export const useCreatePredesignedGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      data,
    }: {
      listId: number;
      data: { title: string; description: string; price: number; imageUrl: string; categories: string[]; priority: string };
    }) => predesignedListService.createGift(listId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predesignedListsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['predesignedLists'] });
    },
  });
};

export const useUpdatePredesignedGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      giftId,
      data,
    }: {
      giftId: number;
      data: { title?: string; description?: string; price?: number; imageUrl?: string; categories?: string[]; priority?: string };
    }) => predesignedListService.updateGift(giftId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predesignedListsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['predesignedLists'] });
    },
  });
};

export const useDeletePredesignedGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (giftId: number) => predesignedListService.deleteGift(giftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predesignedListsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['predesignedLists'] });
    },
  });
};

export const useReorderPredesignedGifts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orders: Array<{ id: number; order: number }>) => predesignedListService.reorderGifts(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predesignedListsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['predesignedLists'] });
    },
  });
};
