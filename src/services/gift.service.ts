import apiClient from './client';
import type { Gift } from 'types/models/gift';
import { gift_endpoints } from './endpoints';
import { purchase_endpoints } from './endpoints';

// Gift service
export const giftService = {
  getGiftById: async (id: number): Promise<Gift> => {
    const response = await apiClient.get(gift_endpoints.byId(id));
    return response.data;
  },

  createGift: async (giftData: Omit<Gift, 'id' | 'createdAt' | 'updatedAt'>): Promise<Gift> => {
    const response = await apiClient.post(gift_endpoints.base, giftData);
    return response.data;
  },

  updateGift: async (id: number, giftData: Partial<Gift>): Promise<Gift> => {
    const response = await apiClient.put(gift_endpoints.byId(id), giftData);
    return response.data;
  },

  deleteGift: async (id: number): Promise<void> => {
    await apiClient.delete(gift_endpoints.byId(id));
  },
};

export default giftService;
