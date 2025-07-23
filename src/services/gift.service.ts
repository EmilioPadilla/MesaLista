import apiClient from './client';
import type { Gift, GiftPurchase } from '@prisma/client';
import type { PurchasedGiftsResponse } from 'types/api/gift';
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

  // Gift purchase related functions
  fetchPurchasedGifts: async (coupleId?: number): Promise<PurchasedGiftsResponse> => {
    if (!coupleId) {
      return { purchases: [], totalAmount: 0, count: 0 };
    }
    const response = await apiClient.get(purchase_endpoints.getPurchasedGifts(coupleId));
    return response.data;
  },

  updatePurchaseStatus: async ({ purchaseId, status }: { purchaseId: number; status: string }): Promise<GiftPurchase> => {
    const response = await apiClient.patch(purchase_endpoints.updateStatus(purchaseId), {
      status: status.toUpperCase(),
    });
    return response.data;
  },

  getUserPurchases: async (userId: number): Promise<PurchasedGiftsResponse> => {
    const response = await apiClient.get(purchase_endpoints.getUserPurchases(userId));
    return response.data;
  },

  purchaseGift: async (giftId: number, message: string): Promise<GiftPurchase> => {
    const response = await apiClient.post(purchase_endpoints.purchaseGift(giftId), { message });
    return response.data;
  },
};

export default giftService;
