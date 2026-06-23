import apiClient from './client';
import { predesignedListEndpoints } from './predesignedList.endpoints';

export interface PredesignedGift {
  id: number;
  title: string;
  description: string | null;
  price: number;
  categories: string[];
  imageUrl: string;
  priority: string;
  order: number;
  predesignedListId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PredesignedList {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  icon: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  gifts: PredesignedGift[];
}

export const predesignedListService = {
  // Public endpoints
  async getAllLists(): Promise<PredesignedList[]> {
    const response = await apiClient.get<PredesignedList[]>(predesignedListEndpoints.getAll);
    return response.data;
  },

  async getListById(id: number): Promise<PredesignedList> {
    const response = await apiClient.get<PredesignedList>(predesignedListEndpoints.getById(id));
    return response.data;
  },

  async addGiftToWeddingList(giftId: number, weddingListId: number): Promise<any> {
    const response = await apiClient.post(predesignedListEndpoints.addGiftToWeddingList(giftId, weddingListId), {
      giftListId: weddingListId,
    });
    return response.data;
  },

  // Admin endpoints - Predesigned Lists
  async getAllListsAdmin(): Promise<PredesignedList[]> {
    const response = await apiClient.get<PredesignedList[]>(`${predesignedListEndpoints.getAll}/admin/all`);
    return response.data;
  },

  async createList(data: {
    name: string;
    description: string;
    imageUrl: string;
    icon: string;
    isActive?: boolean;
  }): Promise<PredesignedList> {
    const response = await apiClient.post<PredesignedList>(`${predesignedListEndpoints.getAll}/admin`, data);
    return response.data;
  },

  async updateList(
    id: number,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string;
      icon?: string;
      isActive?: boolean;
    },
  ): Promise<PredesignedList> {
    const response = await apiClient.put<PredesignedList>(`${predesignedListEndpoints.getAll}/admin/${id}`, data);
    return response.data;
  },

  async deleteList(id: number): Promise<void> {
    await apiClient.delete(`${predesignedListEndpoints.getAll}/admin/${id}`);
  },

  async reorderLists(orders: Array<{ id: number; order: number }>): Promise<void> {
    await apiClient.post(`${predesignedListEndpoints.getAll}/admin/reorder`, { orders });
  },

  // Admin endpoints - Predesigned Gifts
  async createGift(
    listId: number,
    data: {
      title: string;
      description: string;
      price: number;
      imageUrl: string;
      categories: string[];
      priority: string;
    },
  ): Promise<PredesignedGift> {
    const response = await apiClient.post<PredesignedGift>(`${predesignedListEndpoints.getAll}/admin/${listId}/gifts`, data);
    return response.data;
  },

  async updateGift(
    giftId: number,
    data: {
      title?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      categories?: string[];
      priority?: string;
    },
  ): Promise<PredesignedGift> {
    const response = await apiClient.put<PredesignedGift>(`${predesignedListEndpoints.getAll}/admin/gifts/${giftId}`, data);
    return response.data;
  },

  async deleteGift(giftId: number): Promise<void> {
    await apiClient.delete(`${predesignedListEndpoints.getAll}/admin/gifts/${giftId}`);
  },

  async reorderGifts(orders: Array<{ id: number; order: number }>): Promise<void> {
    await apiClient.post(`${predesignedListEndpoints.getAll}/admin/gifts/reorder`, { orders });
  },
};
