import apiClient from './client';
import type { Gift } from 'types/models/gift';
import { giftEndpoints } from './gift.endpoints';

// Gift service
export const giftService = {
  getGiftById: async (id: number): Promise<Gift> => {
    const response = await apiClient.get(giftEndpoints.byId(id));
    return response.data;
  },

  createGift: async (giftData: Omit<Gift, 'id' | 'createdAt' | 'updatedAt'>): Promise<Gift> => {
    const response = await apiClient.post(giftEndpoints.base, giftData);
    return response.data;
  },

  updateGift: async (id: number, giftData: Partial<Gift>): Promise<Gift> => {
    const response = await apiClient.put(giftEndpoints.byId(id), giftData);
    return response.data;
  },

  deleteGift: async (id: number): Promise<void> => {
    await apiClient.delete(giftEndpoints.byId(id));
  },
};

export default giftService;
