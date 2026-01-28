import apiClient, { CustomAxiosRequestConfig } from './client';
import type { CreateWeddingListRequest } from 'types/api/weddingList';
import { api_endpoints } from './endpoints';
import { WeddingListWithGifts } from 'types/models/weddingList';

export const weddingListService = {
  getAllWeddingLists: async (): Promise<CreateWeddingListRequest[]> => {
    const response = await apiClient.get(api_endpoints.weddingLists.base);
    return response.data;
  },

  getWeddingListByCouple: async (coupleId: number): Promise<WeddingListWithGifts> => {
    const response = await apiClient.get(api_endpoints.weddingLists.getByCouple(coupleId));
    return response.data;
  },

  getWeddingListBySlug: async (slug: string): Promise<WeddingListWithGifts> => {
    const response = await apiClient.get(api_endpoints.weddingLists.getBySlug(slug), { skipAuth: true } as CustomAxiosRequestConfig);
    return response.data;
  },

  createWeddingList: async (data: CreateWeddingListRequest): Promise<CreateWeddingListRequest> => {
    const response = await apiClient.post(api_endpoints.weddingLists.base, data);
    return response.data;
  },

  updateWeddingList: async (id: number, data: Partial<CreateWeddingListRequest>): Promise<CreateWeddingListRequest> => {
    const response = await apiClient.put(api_endpoints.weddingLists.update(id), data);
    return response.data;
  },

  getGiftsByWeddingList: async (weddingListId: number): Promise<any> => {
    const response = await apiClient.get(api_endpoints.weddingLists.getGiftsByWeddingList(weddingListId));
    return response.data;
  },

  getCategoriesByWeddingList: async (weddingListId: number): Promise<any> => {
    const response = await apiClient.get(api_endpoints.weddingLists.getCategoriesByWeddingList(weddingListId), {
      skipAuth: true,
    } as CustomAxiosRequestConfig);
    return response.data;
  },

  reorderGifts: async (weddingListId: number, giftOrders: Array<{ giftId: number; order: number }>): Promise<any> => {
    const response = await apiClient.put(api_endpoints.weddingLists.reorderGifts(weddingListId), { giftOrders });
    return response.data;
  },
};

export default weddingListService;
