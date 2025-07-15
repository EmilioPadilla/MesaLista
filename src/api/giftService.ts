import apiClient from './client';

// Types
export interface PurchasedGift {
  id: number;
  giftName: string;
  price: number;
  purchaseDate: string;
  purchasedBy: {
    id: number;
    name: string;
    email: string;
  };
  status: 'pending' | 'delivered' | 'thanked';
  message: string;
}

export interface PurchasedGiftsResponse {
  purchases: PurchasedGift[];
  totalAmount: number;
  count: number;
}

export interface Gift {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  isPurchased: boolean;
  weddingListId: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingList {
  id: number;
  coupleName: string;
  weddingDate: string;
  imageUrl?: string;
  gifts: Gift[];
}

export interface GiftPurchase {
  id: number;
  userId: number;
  giftId: number;
  status: string;
  message: string;
  purchaseDate: string;
  gift?: Gift;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

// Gift service
export const giftService = {
  // Gift purchase related functions
  fetchPurchasedGifts: async (coupleId?: number): Promise<PurchasedGiftsResponse> => {
    if (!coupleId) {
      return { purchases: [], totalAmount: 0, count: 0 };
    }
    const response = await apiClient.get(`/gifts/purchased/${coupleId}`);
    return response.data;
  },

  updatePurchaseStatus: async ({ purchaseId, status }: { purchaseId: number, status: string }): Promise<GiftPurchase> => {
    const response = await apiClient.patch(`/gifts/purchases/${purchaseId}`, { 
      status: status.toUpperCase() 
    });
    return response.data;
  },

  getUserPurchases: async (userId: number): Promise<PurchasedGiftsResponse> => {
    const response = await apiClient.get(`/gifts/user-purchases/${userId}`);
    return response.data;
  },

  purchaseGift: async (giftId: number, message: string): Promise<GiftPurchase> => {
    const response = await apiClient.post(`/gifts/purchase/${giftId}`, { message });
    return response.data;
  },

  // Gift management functions
  getGiftsByWeddingList: async (weddingListId: number): Promise<Gift[]> => {
    const response = await apiClient.get(`/gifts/wedding-list/${weddingListId}`);
    return response.data;
  },

  getGiftById: async (id: number): Promise<Gift> => {
    const response = await apiClient.get(`/gifts/${id}`);
    return response.data;
  },

  createGift: async (giftData: Omit<Gift, 'id' | 'createdAt' | 'updatedAt'>): Promise<Gift> => {
    const response = await apiClient.post('/gifts', giftData);
    return response.data;
  },

  updateGift: async (id: number, giftData: Partial<Gift>): Promise<Gift> => {
    const response = await apiClient.put(`/gifts/${id}`, giftData);
    return response.data;
  },

  deleteGift: async (id: number): Promise<void> => {
    await apiClient.delete(`/gifts/${id}`);
  },

  // Wedding list functions
  getAllWeddingLists: async (): Promise<WeddingList[]> => {
    const response = await apiClient.get('/gifts/wedding-lists');
    return response.data;
  },
  
  getWeddingListByCouple: async (coupleId: number): Promise<any> => {
    const response = await apiClient.get(`/gifts/wedding-list/couple/${coupleId}`);
    return response.data;
  },

  createWeddingList: async (coupleId: number): Promise<any> => {
    const response = await apiClient.post('/gifts/wedding-list', { coupleId });
    return response.data;
  }
};

export default giftService;
