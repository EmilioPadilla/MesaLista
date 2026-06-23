import apiClient, { CustomAxiosRequestConfig } from './client';
import type { CreateWeddingListRequest } from 'types/api/weddingList';
import { weddingListEndpoints } from './weddingList.endpoints';
import { WeddingListWithGifts } from 'types/models/weddingList';

export const weddingListService = {
  getAllWeddingLists: async (): Promise<CreateWeddingListRequest[]> => {
    const response = await apiClient.get(weddingListEndpoints.base);
    return response.data;
  },

  getWeddingListByCouple: async (coupleId: number): Promise<WeddingListWithGifts> => {
    const response = await apiClient.get(weddingListEndpoints.getByCouple(coupleId));
    return response.data;
  },

  getWeddingListBySlug: async (slug: string): Promise<WeddingListWithGifts> => {
    const response = await apiClient.get(weddingListEndpoints.getBySlug(slug), { skipAuth: true } as CustomAxiosRequestConfig);
    return response.data;
  },

  createWeddingList: async (data: CreateWeddingListRequest): Promise<CreateWeddingListRequest> => {
    const response = await apiClient.post(weddingListEndpoints.base, data);
    return response.data;
  },

  updateWeddingList: async (id: number, data: Partial<CreateWeddingListRequest>): Promise<CreateWeddingListRequest> => {
    const response = await apiClient.put(weddingListEndpoints.update(id), data);
    return response.data;
  },

  getGiftsByWeddingList: async (weddingListId: number): Promise<any> => {
    const response = await apiClient.get(weddingListEndpoints.getGiftsByWeddingList(weddingListId));
    return response.data;
  },

  getCategoriesByWeddingList: async (weddingListId: number): Promise<any> => {
    const response = await apiClient.get(weddingListEndpoints.getCategoriesByWeddingList(weddingListId), {
      skipAuth: true,
    } as CustomAxiosRequestConfig);
    return response.data;
  },

  reorderGifts: async (weddingListId: number, giftOrders: Array<{ giftId: number; order: number }>): Promise<any> => {
    const response = await apiClient.put(weddingListEndpoints.reorderGifts(weddingListId), { giftOrders });
    return response.data;
  },
};

export default weddingListService;
