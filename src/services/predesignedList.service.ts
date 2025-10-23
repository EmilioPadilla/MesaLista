import apiClient from './client';
import { endpoints } from './endpoints';

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
    const response = await apiClient.get<PredesignedList[]>(endpoints.predesignedLists.getAll);
    return response.data;
  },

  async getListById(id: number): Promise<PredesignedList> {
    const response = await apiClient.get<PredesignedList>(endpoints.predesignedLists.getById(id));
    return response.data;
  },

  async addGiftToWeddingList(giftId: number, weddingListId: number): Promise<any> {
    const response = await apiClient.post(endpoints.predesignedLists.addGiftToWeddingList(giftId, weddingListId), {
      weddingListId,
    });
    return response.data;
  },

  // Admin endpoints - Predesigned Lists
  async getAllListsAdmin(): Promise<PredesignedList[]> {
    const response = await apiClient.get<PredesignedList[]>(`${endpoints.predesignedLists.getAll}/admin/all`);
    return response.data;
  },

  async createList(data: {
    name: string;
    description: string;
    imageUrl: string;
    icon: string;
    isActive?: boolean;
  }): Promise<PredesignedList> {
    const response = await apiClient.post<PredesignedList>(`${endpoints.predesignedLists.getAll}/admin`, data);
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
    const response = await apiClient.put<PredesignedList>(`${endpoints.predesignedLists.getAll}/admin/${id}`, data);
    return response.data;
  },

  async deleteList(id: number): Promise<void> {
    await apiClient.delete(`${endpoints.predesignedLists.getAll}/admin/${id}`);
  },

  async reorderLists(orders: Array<{ id: number; order: number }>): Promise<void> {
    await apiClient.post(`${endpoints.predesignedLists.getAll}/admin/reorder`, { orders });
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
    const response = await apiClient.post<PredesignedGift>(`${endpoints.predesignedLists.getAll}/admin/${listId}/gifts`, data);
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
    const response = await apiClient.put<PredesignedGift>(`${endpoints.predesignedLists.getAll}/admin/gifts/${giftId}`, data);
    return response.data;
  },

  async deleteGift(giftId: number): Promise<void> {
    await apiClient.delete(`${endpoints.predesignedLists.getAll}/admin/gifts/${giftId}`);
  },

  async reorderGifts(orders: Array<{ id: number; order: number }>): Promise<void> {
    await apiClient.post(`${endpoints.predesignedLists.getAll}/admin/gifts/reorder`, { orders });
  },
};
