import apiClient, { CustomAxiosRequestConfig } from './client';
import type { CreateGiftListRequest, UpdateGiftListRequest } from 'types/api/giftList';
import { giftListEndpoints } from './giftList.endpoints';
import { GiftListWithGifts } from 'types/models/giftList';

export const giftListService = {
  getAllGiftLists: async (): Promise<any[]> => {
    const response = await apiClient.get(giftListEndpoints.base);
    return response.data;
  },

  getGiftListsByUser: async (userId: number): Promise<GiftListWithGifts[]> => {
    const response = await apiClient.get(giftListEndpoints.getByUser(userId));
    return response.data;
  },

  getGiftListById: async (giftListId: number): Promise<GiftListWithGifts> => {
    const response = await apiClient.get(giftListEndpoints.getById(giftListId));
    return response.data;
  },

  getGiftListBySlug: async (slug: string): Promise<GiftListWithGifts> => {
    const response = await apiClient.get(giftListEndpoints.getFirstByUserSlug(slug), { skipAuth: true } as CustomAxiosRequestConfig);
    return response.data;
  },

  createGiftList: async (data: CreateGiftListRequest): Promise<any> => {
    const response = await apiClient.post(giftListEndpoints.base, data);
    return response.data;
  },

  updateGiftList: async (id: number, data: UpdateGiftListRequest): Promise<any> => {
    const response = await apiClient.put(giftListEndpoints.update(id), data);
    return response.data;
  },

  deleteGiftList: async (id: number): Promise<void> => {
    await apiClient.delete(giftListEndpoints.delete(id));
  },

  getGiftsByGiftList: async (giftListId: number): Promise<any> => {
    const response = await apiClient.get(giftListEndpoints.getGiftsByGiftList(giftListId));
    return response.data;
  },

  getCategoriesByGiftList: async (giftListId: number): Promise<any> => {
    const response = await apiClient.get(giftListEndpoints.getCategoriesByGiftList(giftListId), {
      skipAuth: true,
    } as CustomAxiosRequestConfig);
    return response.data;
  },

  reorderGifts: async (giftListId: number, giftOrders: Array<{ giftId: number; order: number }>): Promise<any> => {
    const response = await apiClient.put(giftListEndpoints.reorderGifts(giftListId), { giftOrders });
    return response.data;
  },
};

export default giftListService;
